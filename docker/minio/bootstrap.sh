#!/bin/sh
set -eu

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

for bucket in supademo-raw supademo-processed supademo-published supademo-exports; do
  mc mb --ignore-existing "local/$bucket"
done

echo "MinIO local buckets are ready."
