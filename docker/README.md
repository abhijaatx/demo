# Local service stack

Task 003 provides local equivalents for the production data and infrastructure services. The stack is development-only and every host port binds to `127.0.0.1`.

## Services

| Service       | Local endpoint          | Purpose                             |
| ------------- | ----------------------- | ----------------------------------- |
| PostgreSQL    | `127.0.0.1:5432`        | Relational source of truth          |
| Redis         | `127.0.0.1:6379`        | Cache, locks, and short-lived state |
| MinIO API     | `http://127.0.0.1:9000` | S3-compatible object storage        |
| MinIO console | `http://127.0.0.1:9001` | Local object-storage inspection     |
| ElasticMQ     | `http://127.0.0.1:9324` | SQS-compatible queues               |
| Mailpit SMTP  | `127.0.0.1:1025`        | Local email sink                    |
| Mailpit UI    | `http://127.0.0.1:8025` | Inspect captured email              |

## Start and inspect

From the repository root:

```bash
npm run stack:config
npm run stack:up
npm run stack:status
npm run stack:check
npm run stack:logs
```

`stack:up` waits for service health checks. The one-shot MinIO bootstrap container creates the `supademo-raw`, `supademo-processed`, `supademo-published`, and `supademo-exports` buckets.

ElasticMQ is configured with the `demo-jobs` source queue and `dead-letter` queue used by the TASK-008 sample worker.

Optional local overrides can be copied from `.env.example` to `.env`. The defaults are intentionally local-only and must never be reused in AWS.

## Stop and reset

```bash
npm run stack:down
npm run stack:reset
```

`stack:down` preserves named volumes. `stack:reset` removes all local containers, the local network, and all named volumes, including database, queue, object-storage, Redis, and Mailpit data. It is intentionally a separate command and must never be used against a production Compose project.

## Connection values for local application code

Inside a future application container, use service names:

```text
DATABASE_URL=postgresql://supademo:supademo_local_postgres_change_me@postgres:5432/supademo_dev
REDIS_URL=redis://:supademo_local_redis_change_me@redis:6379
S3_ENDPOINT=http://minio:9000
SQS_ENDPOINT=http://elasticmq:9324
SMTP_HOST=mailpit
SMTP_PORT=1025
```

From the host machine, use `127.0.0.1` and the published ports instead.

## Scope and limitations

- This stack is for local development and integration tests, not production.
- MinIO and ElasticMQ emulate AWS-compatible interfaces; they do not provide AWS production durability or IAM semantics.
- The PostgreSQL init script creates only a local extension. Application schema and migrations are introduced in TASK-005.
- Queue and object-storage volumes persist across normal restarts; `stack:reset` intentionally destroys them.
