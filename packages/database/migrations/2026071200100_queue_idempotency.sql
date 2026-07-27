-- Up Migration

-- Worker idempotency claims survive process restarts and duplicate delivery.
CREATE TABLE queue_idempotency (
  idempotency_key text PRIMARY KEY CHECK (char_length(btrim(idempotency_key)) BETWEEN 1 AND 200),
  job_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'completed')),
  lease_expires_at timestamptz(3) NOT NULL,
  completed_at timestamptz(3),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX queue_idempotency_lease_idx ON queue_idempotency (status, lease_expires_at);

-- Down Migration

DROP INDEX queue_idempotency_lease_idx;
DROP TABLE queue_idempotency;
