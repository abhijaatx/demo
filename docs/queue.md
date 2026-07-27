# Queue and worker foundation

TASK-008 provides a typed queue contract that is compatible with the local ElasticMQ SQS Query API and can later be replaced by a signed AWS SQS adapter without changing job handlers.

## Local sample

```bash
cp .env.example .env
npm run stack:up
npm run db:migrate
npm run build
```

Start the worker and enqueue a sample job in separate terminals:

```bash
npm run start:worker
npm run queue:sample
```

The worker logs only job metadata such as queue, type, attempt, and job ID. It does not log payloads, database URLs, or provider errors.

## Job envelope

Every message is a JSON envelope with:

- schema version
- UUID job ID
- bounded job type
- UTC creation timestamp
- current attempt and maximum attempts
- bounded idempotency key
- optional correlation ID
- handler-owned payload

Envelopes are size-limited to 1 MiB and reject malformed IDs, types, retry counts, timestamps, and control characters before a handler runs.

## Delivery behavior

1. The worker receives a message with a visibility timeout.
2. PostgreSQL claims the idempotency key with a lease.
3. A completed key is acknowledged without executing the handler again.
4. A transient failure is re-enqueued with an incremented attempt and capped exponential delay.
5. A permanent failure or exhausted retry is copied to the configured dead-letter queue, then the source message is acknowledged.
6. A failed dead-letter or retry enqueue leaves the source message available for another delivery.

The SQL idempotency table is the source of truth. The in-memory store is provided for deterministic unit tests only and must not be used by a production worker.

## Shutdown

SIGINT and SIGTERM stop polling, abort an in-flight long poll, wait for the active handler to finish, and close the PostgreSQL pool. The worker does not acknowledge a message before its handler and idempotency completion succeed.

## AWS transition

Production should use a signed AWS SQS adapter, separate queues per workload, AWS-managed redrive policies, least-privilege task IAM, queue-depth/oldest-message alarms, and a worker task definition with workload-specific timeouts. The local ElasticMQ adapter does not provide AWS IAM, encryption, or production durability semantics.
