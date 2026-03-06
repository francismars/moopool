import "dotenv/config";
import { Worker } from "bullmq";
import pino from "pino";
import type { TransactionEvent } from "@mupool/domain";
import { finalizeTx } from "./finalizer.js";

const log = pino({ name: "mupool-worker" });
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: redisUrl };

const worker = new Worker<TransactionEvent>(
  "moopool",
  async (job) => {
    await finalizeTx(job.data);
    log.info({ txId: job.data.tx_id, jobId: job.id }, "transaction finalized");
  },
  { connection }
);

worker.on("failed", (job, err) => {
  log.error({ jobId: job?.id, err }, "finalization failed");
});

worker.on("completed", (job) => {
  log.info({ jobId: job.id }, "job completed");
});
