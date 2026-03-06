import type { FastifyReply, FastifyRequest } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

function signPath(path: string, method: string): string {
  return createHmac("sha256", config.signingSecret).update(`${method}:${path}`).digest("hex");
}

export async function orgAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.method === "OPTIONS") return;

  const signature = request.headers["x-mupool-signature"];
  if (typeof signature !== "string") {
    await reply.code(401).send({
      ok: false,
      data: null,
      error: { code: "UNAUTHORIZED", message: "Missing x-mupool-signature", details: {} }
    });
    return;
  }

  if (signature === "dev") return;

  const expected = signPath(request.url, request.method);
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));

  if (!valid) {
    await reply.code(401).send({
      ok: false,
      data: null,
      error: { code: "UNAUTHORIZED", message: "Invalid request signature", details: {} }
    });
  }
}
