# Configuration and secret boundaries

The `@supademo/config` package is the only place where application environment variables are converted into typed runtime configuration. Services should receive an `AppConfig` object from `loadConfig()` rather than reading `process.env` throughout their code.

## Local and test environments

Local and test runtimes use `CONFIG_SOURCE=env`. Copy the repository example and edit only the ignored file:

```bash
cp .env.example .env
```

The local configuration requires database, Redis, and AWS-compatible credentials because those values are used by the local PostgreSQL, Redis, MinIO, and ElasticMQ services. The values in `.env.example` are development placeholders and must not be used outside local development.

The web application uses `NEXT_PUBLIC_API_BASE_URL` for its browser-side API origin. This value is intentionally public and defaults to `/api/backend`, which the local Next.js server rewrites to the API at `127.0.0.1:3001`. Never put credentials, tokens, or other secrets in any `NEXT_PUBLIC_*` variable because Next.js embeds those values in the client bundle.

## Staging and production

Staging and production require `APP_ENV=staging|production` and `CONFIG_SOURCE=aws`. They reject environment-provided application secrets. The service bootstrap must provide `AWS_REGION`, construct the AWS SDK clients using the task role, and inject the adapters:

```ts
const secrets = new AwsSecretsManagerProvider(
  secretsManagerClient,
  (input) => new GetSecretValueCommand(input),
  "/supademo/production/secrets"
);
const parameters = new AwsParameterStoreProvider(
  parameterStoreClient,
  (input) => new GetParameterCommand(input),
  "/supademo/production/config"
);

const config = await loadConfig({
  provider: new CompositeConfigProvider(secrets, parameters)
});
```

The configuration package deliberately accepts client-like interfaces instead of importing AWS SDK clients. This keeps the package boundary small and lets the deployment layer control SDK versions, credentials, retries, and IAM permissions.

Authentication configuration follows the same boundary. Local/test defaults use the fixture-backed identity provider. Staging/production require `AUTH_PROVIDER=cognito`, an HTTPS `AUTH_ISSUER`, and `AUTH_AUDIENCE` from AWS Parameter Store; `AUTH_PROVIDER=local` is rejected outside local/test environments. See [authentication.md](./authentication.md) for the token, session, and middleware contract.

## Validation and redaction

`loadConfig()` validates environment names, source compatibility, ports, URLs, AWS regions, bucket names, email header safety, and required secrets. Validation errors contain field names and remediation messages, never the rejected values.

Use `redactConfig(config)` before writing configuration to logs or diagnostics. It returns a new object and redacts URLs, access keys, secrets, tokens, passwords, and authorization-like fields.
