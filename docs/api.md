# API service baseline

The API is a small Node HTTP service with a versioned `/api/v1` surface. Runtime configuration is validated by `@supademo/config`; PostgreSQL access is provided by `@supademo/database`.

## Endpoints

| Method | Path                   | Purpose                                |
| ------ | ---------------------- | -------------------------------------- |
| GET    | `/health`              | Backward-compatible liveness response  |
| GET    | `/api/v1/health`       | Versioned liveness response            |
| GET    | `/api/v1/readiness`    | PostgreSQL-backed dependency readiness |
| GET    | `/api/v1/openapi.json` | Generated OpenAPI 3.0.3 contract       |

Liveness does not contact dependencies. Readiness runs the database health query and returns `503` with a stable, non-sensitive response when PostgreSQL is unavailable.

## Request and error behavior

- Every response includes a validated `X-Request-ID`; a valid caller-provided ID is preserved, otherwise a new UUID is generated.
- Requests may provide a bounded `X-Correlation-ID`; the API echoes it and includes it in structured logs and tracing context. Invalid values fall back to the request ID.
- Request URIs are capped at 8 KiB, request bodies at 1 MiB, and the current read-only baseline rejects request bodies before route handlers run.
- Unknown query parameters are rejected by a strict Zod schema.
- Errors use `{ "error": { "code", "message", "requestId" } }` and never include stack traces, SQL, connection strings, or provider errors.
- Responses use `no-store`, `nosniff`, restrictive CSP, no-referrer, and `X-Frame-Options: DENY` headers.

## Local integration test

With the local stack running and `.env` copied from `.env.example`:

```bash
npm run db:migrate
npm run test:integration
```

The integration test starts the compiled API against the configured local PostgreSQL service, checks readiness, and shuts the process down with SIGTERM.
