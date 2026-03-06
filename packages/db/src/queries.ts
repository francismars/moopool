import { pool } from "./client.js";

export async function getCurrentAsset(assetId: string) {
  const result = await pool.query(
    `SELECT *
     FROM ucowxo_current
     WHERE asset_id = $1
     ORDER BY created_height DESC
     LIMIT 1`,
    [assetId]
  );
  return result.rows[0] ?? null;
}

export async function getTxById(txId: string) {
  const tx = await pool.query("SELECT * FROM ledger_transactions WHERE tx_id = $1", [txId]);
  if (!tx.rows[0]) return null;
  const attestations = await pool.query("SELECT * FROM ledger_attestations WHERE tx_id = $1", [txId]);
  return { ...tx.rows[0], attestations: attestations.rows };
}

export async function getIntegritySnapshot() {
  const result = await pool.query(
    `SELECT * FROM integrity_snapshots
     ORDER BY snapshot_height DESC
     LIMIT 1`
  );
  return result.rows[0] ?? null;
}
