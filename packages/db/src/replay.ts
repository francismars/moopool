import { canonicalSerialize, sha256Hex } from "@mupool/crypto";
import { withTx } from "./client.js";

export interface ReplayResult {
  processedTxCount: number;
  ucowxoChecksum: string;
  ledgerChecksum: string;
}

export async function rebuildUcowxoFromLedger(): Promise<ReplayResult> {
  return withTx(async (client) => {
    const txs = await client.query(
      `SELECT tx_id, height, payload_json
       FROM ledger_transactions
       WHERE validation_status IN ('FINALIZED', 'IRREVERSIBLE')
       ORDER BY height ASC, tx_id ASC`
    );

    await client.query("TRUNCATE ucowxo_current");

    let processed = 0;
    for (const row of txs.rows) {
      const payload = row.payload_json as {
        inputs: Array<{ ucowxo_id: string }>;
        outputs: Array<{
          asset_type: string;
          asset_id: string;
          owner_org_id: string;
          state: string;
          metadata_hash?: string;
          parent_ucowxo_id?: string;
        }>;
      };

      for (const input of payload.inputs ?? []) {
        const res = await client.query(
          `UPDATE ucowxo_current
           SET spent_by_tx_id = $1, spent_height = $2
           WHERE ucowxo_id = $3 AND spent_by_tx_id IS NULL`,
          [row.tx_id, row.height, input.ucowxo_id]
        );
        if (res.rowCount !== 1) {
          throw new Error(`Replay conflict: input already spent or missing (${input.ucowxo_id})`);
        }
      }

      for (let i = 0; i < (payload.outputs ?? []).length; i += 1) {
        const output = payload.outputs[i];
        if (!output) {
          throw new Error(`Replay error: missing output at index ${i}`);
        }
        const ucowxoId = sha256Hex(`${row.tx_id}:${i}`);
        await client.query(
          `INSERT INTO ucowxo_current
          (ucowxo_id, origin_tx_id, parent_ucowxo_id, asset_type, asset_id, owner_org_id, state, metadata_hash, created_height)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            ucowxoId,
            row.tx_id,
            output.parent_ucowxo_id ?? null,
            output.asset_type,
            output.asset_id,
            output.owner_org_id,
            output.state,
            output.metadata_hash ?? null,
            row.height
          ]
        );
      }
      processed += 1;
    }

    const ucowxoRows = await client.query(
      `SELECT ucowxo_id, origin_tx_id, asset_type, asset_id, owner_org_id, state, spent_by_tx_id
       FROM ucowxo_current ORDER BY ucowxo_id ASC`
    );
    const ledgerRows = await client.query(
      `SELECT tx_id, height, payload_hash, validation_status
       FROM ledger_transactions
       WHERE validation_status IN ('FINALIZED', 'IRREVERSIBLE')
       ORDER BY height ASC, tx_id ASC`
    );

    const ucowxoChecksum = sha256Hex(canonicalSerialize(ucowxoRows.rows));
    const ledgerChecksum = sha256Hex(canonicalSerialize(ledgerRows.rows));

    return { processedTxCount: processed, ucowxoChecksum, ledgerChecksum };
  });
}
