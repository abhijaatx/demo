import assert from "node:assert/strict";
import test from "node:test";
import {
  createJobEnvelope,
  InMemoryIdempotencyStore,
  InMemoryQueueAdapter,
  PermanentJobError,
  QueueWorker,
  RetryableJobError,
  serializeJobEnvelope,
  SqsCompatibleQueueAdapter
} from "../packages/queue/dist/index.js";

test("SQS-compatible adapter sends, receives, and deletes XML queue messages", async () => {
  const requests = [];
  const adapter = new SqsCompatibleQueueAdapter({
    endpoint: "http://127.0.0.1:9324",
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), body: String(init?.body) });
      if (String(init?.body).includes("ReceiveMessage")) {
        return new Response(
          "<ReceiveMessageResponse><ReceiveMessageResult><Message><MessageId>message-1</MessageId><ReceiptHandle>receipt-1</ReceiptHandle><Body>{&quot;ok&quot;:true}</Body></Message></ReceiveMessageResult></ReceiveMessageResponse>",
          { status: 200 }
        );
      }
      return new Response(
        "<SendMessageResponse><SendMessageResult><MessageId>message-2</MessageId></SendMessageResult></SendMessageResponse>",
        { status: 200 }
      );
    }
  });

  assert.deepEqual(await adapter.send("demo-jobs", "hello"), { messageId: "message-2" });
  assert.deepEqual(await adapter.receive("demo-jobs"), [
    { messageId: "message-1", receiptHandle: "receipt-1", body: '{"ok":true}' }
  ]);
  assert.equal(requests[0].url, "http://127.0.0.1:9324/demo-jobs");
  assert.match(requests[0].body, /Action=SendMessage/u);
});

test("worker retries transient failures and does not duplicate completed effects", async () => {
  const adapter = new InMemoryQueueAdapter();
  const idempotency = new InMemoryIdempotencyStore();
  const effects = [];
  let attempts = 0;
  const worker = new QueueWorker({
    adapter,
    queueName: "demo-jobs",
    deadLetterQueueName: "dead-letter",
    handlers: new Map([
      [
        "demo.retry",
        {
          handle: async () => {
            attempts += 1;
            if (attempts < 3) {
              throw new RetryableJobError();
            }
            effects.push("completed");
          }
        }
      ]
    ]),
    idempotencyStore: idempotency,
    visibilityTimeoutSeconds: 1,
    pollWaitSeconds: 0
  });

  const job = createJobEnvelope({
    type: "demo.retry",
    idempotencyKey: "retry-key",
    maxAttempts: 3,
    payload: { value: 1 }
  });
  await adapter.send("demo-jobs", serializeJobEnvelope(job));
  await worker.processAvailableOnce();
  await worker.processAvailableOnce();
  await worker.processAvailableOnce();
  assert.equal(attempts, 3);
  assert.deepEqual(effects, ["completed"]);
  assert.equal(adapter.size("demo-jobs"), 0);

  const duplicate = createJobEnvelope({
    type: "demo.retry",
    idempotencyKey: "retry-key",
    payload: { value: 1 }
  });
  await adapter.send("demo-jobs", serializeJobEnvelope(duplicate));
  await worker.processAvailableOnce();
  assert.equal(attempts, 3);
  assert.equal(adapter.size("demo-jobs"), 0);
});

test("worker sends permanent failures to the dead-letter queue", async () => {
  const adapter = new InMemoryQueueAdapter();
  const worker = new QueueWorker({
    adapter,
    queueName: "demo-jobs",
    deadLetterQueueName: "dead-letter",
    handlers: new Map([
      [
        "demo.poison",
        {
          handle: async () => {
            throw new PermanentJobError();
          }
        }
      ]
    ]),
    idempotencyStore: new InMemoryIdempotencyStore(),
    visibilityTimeoutSeconds: 1,
    pollWaitSeconds: 0
  });
  const job = createJobEnvelope({ type: "demo.poison", idempotencyKey: "poison-key", payload: {} });
  await adapter.send("demo-jobs", serializeJobEnvelope(job));
  await worker.processAvailableOnce();
  assert.equal(adapter.size("demo-jobs"), 0);
  assert.equal(adapter.size("dead-letter"), 1);
});

test("worker routes handler timeouts to the dead-letter queue after retry exhaustion", async () => {
  const adapter = new InMemoryQueueAdapter();
  const worker = new QueueWorker({
    adapter,
    queueName: "demo-jobs",
    deadLetterQueueName: "dead-letter",
    handlers: new Map([
      [
        "demo.timeout",
        {
          handle: async (_job, signal) =>
            new Promise((resolve, reject) => {
              const timer = setTimeout(resolve, 2_000);
              signal.addEventListener(
                "abort",
                () => {
                  clearTimeout(timer);
                  reject(new Error("handler aborted"));
                },
                { once: true }
              );
            })
        }
      ]
    ]),
    idempotencyStore: new InMemoryIdempotencyStore(),
    visibilityTimeoutSeconds: 2,
    pollWaitSeconds: 0,
    jobTimeoutMs: 1_000
  });
  const job = createJobEnvelope({
    type: "demo.timeout",
    idempotencyKey: "timeout-key",
    maxAttempts: 1,
    payload: {}
  });
  await adapter.send("demo-jobs", serializeJobEnvelope(job));
  await worker.processAvailableOnce();
  assert.equal(adapter.size("dead-letter"), 1);
});

test("worker shutdown stops polling cleanly", async () => {
  const worker = new QueueWorker({
    adapter: new InMemoryQueueAdapter(),
    queueName: "demo-jobs",
    deadLetterQueueName: "dead-letter",
    handlers: new Map(),
    idempotencyStore: new InMemoryIdempotencyStore(),
    visibilityTimeoutSeconds: 1,
    pollWaitSeconds: 0
  });
  const running = worker.run();
  await new Promise((resolve) => setTimeout(resolve, 10));
  await worker.stop();
  await running;
});

test("worker carries job correlation IDs into logs, metrics, and spans", async () => {
  const adapter = new InMemoryQueueAdapter();
  const events = [];
  const metricCalls = [];
  const spanAttributes = [];
  const worker = new QueueWorker({
    adapter,
    queueName: "demo-jobs",
    deadLetterQueueName: "dead-letter",
    handlers: new Map([["demo.trace", { handle: async () => undefined }]]),
    idempotencyStore: new InMemoryIdempotencyStore(),
    visibilityTimeoutSeconds: 1,
    pollWaitSeconds: 0,
    logger: { info: (event) => events.push(event), warn: () => undefined, error: () => undefined },
    metrics: { increment: (...args) => metricCalls.push(args), observe: () => undefined },
    tracer: {
      startSpan: (_name, attributes) => {
        spanAttributes.push(attributes);
        return {
          setAttribute: () => undefined,
          recordException: () => undefined,
          end: () => undefined
        };
      }
    }
  });
  const job = createJobEnvelope({
    type: "demo.trace",
    idempotencyKey: "trace-key",
    correlationId: "corr-job-001",
    payload: {}
  });
  await adapter.send("demo-jobs", serializeJobEnvelope(job));
  await worker.processAvailableOnce();
  assert.equal(
    events.some((event) => event.correlationId === "corr-job-001"),
    true
  );
  assert.equal(
    metricCalls.some(([name]) => name === "queue.jobs.completed"),
    true
  );
  assert.equal(spanAttributes[0]["correlation.id"], "corr-job-001");
});
