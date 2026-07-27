import assert from "node:assert/strict";
import test from "node:test";
import {
  AwsParameterStoreProvider,
  AwsSecretsManagerProvider,
  CompositeConfigProvider,
  ConfigurationError,
  loadConfig,
  redactConfig
} from "../packages/config/dist/index.js";

const localEnvironment = {
  APP_ENV: "test",
  CONFIG_SOURCE: "env",
  DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
  REDIS_URL: "redis://:test@127.0.0.1:6379",
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key"
};

test("local configuration applies non-secret defaults and returns a frozen typed object", async () => {
  const config = await loadConfig({ env: localEnvironment });

  assert.equal(config.app.environment, "test");
  assert.equal(config.app.source, "env");
  assert.equal(config.app.host, "127.0.0.1");
  assert.equal(config.app.port, 3001);
  assert.deepEqual(config.app.allowedOrigins, ["http://localhost:3000", "http://127.0.0.1:3000"]);
  assert.equal(config.auth.provider, "local");
  assert.equal(config.auth.audience, "local-dev");
  assert.equal(config.objectStorage.endpoint, "http://127.0.0.1:9000");
  assert.equal(config.queue.name, "demo-jobs");
  assert.equal(config.queue.deadLetterName, "dead-letter");
  assert.equal(config.queue.maxAttempts, 3);
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.objectStorage.buckets), true);
});

test("invalid local configuration fails without including rejected values", async () => {
  const rejectedValue = "postgresql://user:do-not-log@127.0.0.1:5432/db";
  await assert.rejects(
    loadConfig({
      env: {
        ...localEnvironment,
        DATABASE_URL: rejectedValue,
        PORT: "99999",
        SMTP_FROM: "bad\r\nX-Injected: yes"
      }
    }),
    (error) => {
      assert.equal(error instanceof ConfigurationError, true);
      assert.match(error.message, /PORT/u);
      assert.match(error.message, /SMTP_FROM/u);
      assert.doesNotMatch(error.message, /do-not-log/u);
      return true;
    }
  );
});

test("production configuration requires AWS providers and ignores environment secrets", async () => {
  const provider = new CompositeConfigProvider(
    {
      getSecret: async (key) =>
        ({
          DATABASE_URL: "postgresql://managed:managed@db.internal:5432/supademo",
          REDIS_URL: "rediss://managed:managed@redis.internal:6379"
        })[key]
    },
    {
      getParameter: async (key) =>
        ({
          HOST: "0.0.0.0",
          PORT: "3001",
          LOG_LEVEL: "info",
          S3_ENDPOINT: "https://s3.us-east-1.amazonaws.com",
          S3_BUCKET_RAW: "supademo-raw-production",
          S3_BUCKET_PROCESSED: "supademo-processed-production",
          S3_BUCKET_PUBLISHED: "supademo-published-production",
          S3_BUCKET_EXPORTS: "supademo-exports-production",
          SQS_ENDPOINT: "https://sqs.us-east-1.amazonaws.com",
          QUEUE_NAME: "demo-jobs",
          QUEUE_DEAD_LETTER_NAME: "dead-letter",
          QUEUE_VISIBILITY_TIMEOUT_SECONDS: "30",
          QUEUE_MAX_ATTEMPTS: "3",
          QUEUE_POLL_WAIT_SECONDS: "5",
          SMTP_HOST: "email-smtp.us-east-1.amazonaws.com",
          SMTP_PORT: "587",
          SMTP_FROM: "no-reply@example.com",
          AUTH_PROVIDER: "cognito",
          AUTH_ISSUER: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example",
          AUTH_AUDIENCE: "example-client-id",
          CORS_ALLOWED_ORIGINS: "https://app.example.com,https://embed.example.com"
        })[key]
    }
  );

  const config = await loadConfig({
    env: {
      APP_ENV: "production",
      CONFIG_SOURCE: "aws",
      AWS_REGION: "us-east-1",
      DATABASE_URL: "postgresql://env-user:env-password@wrong/db",
      REDIS_URL: "redis://:env-password@wrong"
    },
    provider
  });

  assert.equal(config.app.source, "aws");
  assert.equal(config.database.url, "postgresql://managed:managed@db.internal:5432/supademo");
  assert.equal(config.redis.url, "rediss://managed:managed@redis.internal:6379");
  assert.equal(config.objectStorage.buckets.raw, "supademo-raw-production");
  assert.equal(config.auth.provider, "cognito");
  assert.equal(config.auth.audience, "example-client-id");
  assert.deepEqual(config.app.allowedOrigins, [
    "https://app.example.com",
    "https://embed.example.com"
  ]);
});

test("production configuration fails closed when the AWS provider is missing", async () => {
  await assert.rejects(
    loadConfig({
      env: { APP_ENV: "production", CONFIG_SOURCE: "env", AWS_REGION: "us-east-1" }
    }),
    /CONFIG_SOURCE.*aws.*production/u
  );

  await assert.rejects(
    loadConfig({
      env: { APP_ENV: "production", CONFIG_SOURCE: "aws", AWS_REGION: "us-east-1" }
    }),
    /requires a Secrets Manager and Parameter Store provider/u
  );
});

test("AWS adapters prefix names, decrypt parameters, and redact provider failures", async () => {
  let secretInput;
  const secretProvider = new AwsSecretsManagerProvider(
    {
      send: async () => ({ SecretString: "managed-secret" })
    },
    (input) => {
      secretInput = input;
      return input;
    },
    "/supademo/production/secrets"
  );
  assert.equal(await secretProvider.getSecret("DATABASE_URL"), "managed-secret");
  assert.deepEqual(secretInput, { SecretId: "/supademo/production/secrets/DATABASE_URL" });

  let parameterInput;
  const parameterProvider = new AwsParameterStoreProvider(
    {
      send: async () => ({ Parameter: { Value: "3001" } })
    },
    (input) => {
      parameterInput = input;
      return input;
    },
    "/supademo/production/config"
  );
  assert.equal(await parameterProvider.getParameter("PORT"), "3001");
  assert.deepEqual(parameterInput, {
    Name: "/supademo/production/config/PORT",
    WithDecryption: true
  });

  await assert.rejects(
    new AwsSecretsManagerProvider(
      { send: async () => Promise.reject(new Error("sensitive provider detail")) },
      (input) => input,
      "/secret"
    ).getSecret("DATABASE_URL"),
    (error) => {
      assert.match(error.message, /AWS Secrets Manager lookup failed/u);
      assert.doesNotMatch(error.message, /sensitive provider detail/u);
      return true;
    }
  );
});

test("redaction returns a copy without connection credentials", async () => {
  const config = await loadConfig({ env: localEnvironment });
  const redacted = redactConfig(config);
  const serialized = JSON.stringify(redacted);

  assert.equal(redacted.app.port, 3001);
  assert.equal(redacted.database.url, "[REDACTED]");
  assert.equal(redacted.redis.url, "[REDACTED]");
  assert.doesNotMatch(serialized, /test-password|test-access-key|test-secret-key/u);
  assert.notEqual(redacted, config);
});
