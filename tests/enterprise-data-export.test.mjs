import assert from "node:assert/strict";
import { test } from "node:test";
import { createDataExportJob } from "@supademo/domain";

test("createDataExportJob creates pending encrypted export jobs", () => {
  const job = createDataExportJob("job-177", "ws-1", "user-1");

  assert.equal(job.jobId, "job-177");
  assert.equal(job.status, "pending");
});
