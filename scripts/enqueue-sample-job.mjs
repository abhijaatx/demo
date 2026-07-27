import { loadConfig } from "../packages/config/dist/index.js";
import {
  createJobEnvelope,
  serializeJobEnvelope,
  SqsCompatibleQueueAdapter
} from "../packages/queue/dist/index.js";

const config = await loadConfig();
const adapter = new SqsCompatibleQueueAdapter({ endpoint: config.queue.endpoint });
const job = createJobEnvelope({
  type: "demo.sample",
  idempotencyKey: `sample-${Date.now()}`,
  payload: { message: "local queue foundation" }
});
const result = await adapter.send(config.queue.name, serializeJobEnvelope(job));
console.log(
  JSON.stringify({ message: "sample_job_enqueued", messageId: result.messageId, jobId: job.jobId })
);
