import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  signingSecret: process.env.SIGNING_SECRET ?? "mupool-dev-secret"
};
