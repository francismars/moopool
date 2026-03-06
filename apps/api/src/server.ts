import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { pool, getAssetLineage, getCurrentAsset, getIntegritySnapshot, getTxById } from "@mupool/db";
import type { TransactionEvent } from "@mupool/domain";
import { config } from "./config.js";
import { orgAuth } from "./auth.js";
import { moopoolQueue } from "./queue.js";
import { attachTxHash, validateTx } from "./validation.js";

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-mupool-signature"]
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  app.get("/healthz", async () => ({ ok: true, status: "healthy" }));
  app.get("/readyz", async () => {
    await pool.query("SELECT 1");
    return { ok: true, status: "ready" };
  });

  app.addHook("onRequest", orgAuth);

  app.post("/api/v1/transactions/validate", async (request, reply) => {
    const body = request.body as { tx: TransactionEvent };
    const tx = attachTxHash({ ...body.tx, schema_version: "v1" });
    const check = await validateTx(tx);
    return reply.send({
      ok: true,
      data: { tx_id: tx.tx_id, valid: check.valid, reasons: check.reasons },
      error: null,
      request_id: request.id
    });
  });

  app.post("/api/v1/transactions/submit", async (request, reply) => {
    const body = request.body as { tx: TransactionEvent };
    const tx = attachTxHash({ ...body.tx, schema_version: "v1" });
    const check = await validateTx(tx);
    if (!check.valid) {
      return reply.code(400).send({
        ok: false,
        data: null,
        error: { code: "VALIDATION_FAILED", message: "Transaction rejected", details: { reasons: check.reasons } },
        request_id: request.id
      });
    }

    await pool.query(
      `INSERT INTO ledger_transactions (tx_id, event_type, created_at, payload_json, payload_hash, validation_status)
       VALUES ($1, $2, $3, $4, $5, 'SOFT_ACCEPTED')
       ON CONFLICT (tx_id) DO NOTHING`,
      [tx.tx_id, tx.event_type, tx.created_at, tx, tx.tx_id]
    );

    await moopoolQueue.add("finalize", tx, {
      removeOnComplete: 500,
      removeOnFail: 500
    });

    return reply.code(202).send({
      ok: true,
      data: { tx_id: tx.tx_id, status: "SOFT_ACCEPTED" },
      error: null,
      request_id: request.id
    });
  });

  app.get("/api/v1/transactions/:txId", async (request, reply) => {
  const txId = (request.params as { txId: string }).txId;
  const tx = await getTxById(txId);
  if (!tx) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Transaction not found", details: {} },
      request_id: request.id
    });
  }
  return reply.send({ ok: true, data: tx, error: null, request_id: request.id });
  });

  app.get("/api/v1/assets/:assetId/current", async (request, reply) => {
  const assetId = (request.params as { assetId: string }).assetId;
  const asset = await getCurrentAsset(assetId);
  if (!asset) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Asset not found", details: {} },
      request_id: request.id
    });
  }
  return reply.send({
    ok: true,
    data: {
      ...asset,
      is_mined: asset.state === "IN_COOL_ROOM_CONFIRMED"
    },
    error: null,
    request_id: request.id
  });
  });

  app.get("/api/v1/assets/:assetId/provenance", async (request) => {
  const assetId = (request.params as { assetId: string }).assetId;
  const lineage = await getAssetLineage(assetId);
  return {
    ok: true,
    data: {
      asset_id: assetId,
      nodes: lineage
    },
    error: null,
    request_id: request.id
  };
  });

  app.get("/api/v1/proofs/mined/:assetId", async (request, reply) => {
  const assetId = (request.params as { assetId: string }).assetId;
  const current = await getCurrentAsset(assetId);
  if (!current) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Asset not found", details: {} },
      request_id: request.id
    });
  }
  const mined = current.state === "IN_COOL_ROOM_CONFIRMED";
  return reply.send({
    ok: true,
    data: {
      asset_id: assetId,
      is_mined: mined,
      evidence: mined
        ? ["RECORD_SLAUGHTER_FINALIZED", "CONFIRM_COOL_ROOM_FINALIZED", "ATTESTATION_THRESHOLD_MET"]
        : []
    },
    error: null,
    request_id: request.id
  });
  });

  app.get("/api/v1/audit/integrity", async (request) => {
  const snapshot = await getIntegritySnapshot();
  return { ok: true, data: snapshot, error: null, request_id: request.id };
  });

  app.get("/api/v1/audit/events", async (request) => {
  const query = request.query as { from_height?: string; to_height?: string; event_type?: string; org_id?: string };
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (query.from_height) {
    values.push(Number(query.from_height));
    clauses.push(`height >= $${values.length}`);
  }
  if (query.to_height) {
    values.push(Number(query.to_height));
    clauses.push(`height <= $${values.length}`);
  }
  if (query.event_type) {
    values.push(query.event_type);
    clauses.push(`event_type = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const events = await pool.query(
    `SELECT tx_id, height, event_type, created_at, validation_status, rejection_code
     FROM ledger_transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    values
  );

  return { ok: true, data: events.rows, error: null, request_id: request.id };
  });

  app.get("/api/v1/ucowxos/:ucowxoId", async (request, reply) => {
  const ucowxoId = (request.params as { ucowxoId: string }).ucowxoId;
  const row = await pool.query("SELECT * FROM ucowxo_current WHERE ucowxo_id = $1", [ucowxoId]);
  if (!row.rows[0]) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "UCowXO not found", details: {} },
      request_id: request.id
    });
  }
  return reply.send({ ok: true, data: row.rows[0], error: null, request_id: request.id });
  });

  app.get("/api/v1/actors/:orgId", async (request, reply) => {
  const orgId = (request.params as { orgId: string }).orgId;
  const actor = await pool.query("SELECT * FROM actors WHERE org_id = $1", [orgId]);
  if (!actor.rows[0]) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Actor not found", details: {} },
      request_id: request.id
    });
  }
  const keys = await pool.query(
    "SELECT key_id, active, created_at, revoked_at FROM actor_keys WHERE org_id = $1 ORDER BY created_at DESC",
    [orgId]
  );
  return reply.send({
    ok: true,
    data: { ...actor.rows[0], keys: keys.rows },
    error: null,
    request_id: request.id
  });
  });

  app.post("/api/v1/actors/:orgId/keys", async (request, reply) => {
  const orgId = (request.params as { orgId: string }).orgId;
  const body = request.body as { key_id: string; public_key_pem: string };
  await pool.query(
    `INSERT INTO actor_keys (key_id, org_id, public_key_pem, active)
     VALUES ($1,$2,$3,TRUE)`,
    [body.key_id, orgId, body.public_key_pem]
  );
  return reply.code(201).send({
    ok: true,
    data: { key_id: body.key_id, org_id: orgId, active: true },
    error: null,
    request_id: request.id
  });
  });

  app.post("/api/v1/actors/:orgId/keys/:keyId/revoke", async (request, reply) => {
  const { orgId, keyId } = request.params as { orgId: string; keyId: string };
  const result = await pool.query(
    `UPDATE actor_keys
     SET active = FALSE, revoked_at = NOW()
     WHERE org_id = $1 AND key_id = $2`,
    [orgId, keyId]
  );
  if (result.rowCount !== 1) {
    return reply.code(404).send({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Key not found", details: {} },
      request_id: request.id
    });
  }
  return reply.send({
    ok: true,
    data: { org_id: orgId, key_id: keyId, revoked: true },
    error: null,
    request_id: request.id
  });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = await buildServer();
  app.listen({ port: config.port, host: config.host }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
