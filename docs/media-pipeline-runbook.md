# Media Pipeline Runbook & Observability Specification — TASK-050

## 1. Overview

This document specifies operational procedures, failure runbooks, and observability specifications for the Supademo media processing pipeline (upload validation, quarantine, image processing, A/V transcoding, and quota enforcement).

---

## 2. Media Observability Metrics & Dashboards

### Key Operational Metrics

| Metric Name                          | Type      | Labels                      | Alert Threshold |
| :----------------------------------- | :-------- | :-------------------------- | :-------------- |
| `media.upload.initiated_total`       | Counter   | `workspace_id`, `mime_type` | N/A             |
| `media.upload.completed_total`       | Counter   | `workspace_id`, `mime_type` | N/A             |
| `media.validation.quarantined_total` | Counter   | `reason_code`               | > 10 / 5 min    |
| `media.processing.duration_ms`       | Histogram | `job_type` (`image`, `av`)  | p95 > 30s       |
| `media.processing.failed_total`      | Counter   | `job_type`, `error_kind`    | > 5 / 5 min     |
| `media.quota.exceeded_total`         | Counter   | `workspace_id`              | Informational   |

---

## 3. Worker Failure Runbooks

### Incident 1: Worker Process Memory Exhaustion / OOM Kills

- **Symptom**: Worker restarts unexpectedly with exit code 137; `media.processing.failed_total` spikes.
- **Root Cause**: Decompression bomb or large video processing exceeding heap limits.
- **Action**:
  1. Inspect failed asset record in database (`status = 'failed'`).
  2. Verify pixel count against `MAX_IMAGE_PIXELS` (100 MP limit).
  3. Ensure object storage stream download bounds (`MAX_IMAGE_INPUT_BYTES = 100MB`, `MAX_AV_INPUT_BYTES = 5GB`) are active.
  4. Scale worker memory limit or restart worker pod.

### Incident 2: High Rate of Quarantined Asset Uploads

- **Symptom**: `media.validation.quarantined_total` alert fires.
- **Action**:
  1. Inspect `rejection_code` in logs (e.g. `signature_mismatch`, `malware_detected`).
  2. Check if a new file format was introduced by users that requires allowlist updating.
  3. Verify raw quarantined object remains private in storage (`workspaces/{ws}/assets/{id}/...`).

---

## 4. Security Boundary Verification

- **Direct Storage Access**: Presigned URLs carry strict expiration limits (max 900 seconds for upload/download).
- **Tenant Scope Isolation**: Every asset lookup requires `workspace_id` matching and active workspace membership.
- **No Shell Execution**: Child process execution in A/V workers uses fixed string argument arrays (`shell: false`).
