import { Queue } from "bullmq";
import { config } from "./config.js";

const connection = {
  url: config.redisUrl
};

export const moopoolQueue = new Queue("moopool", { connection });
