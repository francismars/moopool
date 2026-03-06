import { canonicalSerialize, sha256Hex } from "@mupool/crypto";
import { validateBasicDomainRules, type TransactionEvent } from "@mupool/domain";
import { withTx } from "@mupool/db";

function computeMerkleLikeRoot(txIds: string[]): string {
  return sha256Hex(canonicalSerialize(txIds.sort()));
}

export async function finalizeTx(event: TransactionEvent): Promise<void> {
  const validation = validateBasicDomainRules(event);
  if (!validation.valid) {
    await withTx(async (client) => {
      await client.query(
        `UPDATE ledger_transactions
         SET validation_status = 'REJECTED', rejection_code = $2
         WHERE tx_id = $1`,
        [event.tx_id, validation.reasons.join(",")]
      );
    });
    return;
  }

  await withTx(async (client) => {
    const latest = await client.query("SELECT COALESCE(MAX(height), 0)::bigint AS h FROM ledger_blocks");
    const height = Number(latest.rows[0].h) + 1;
    const prevBlockId = `block-${height - 1}`;
    const blockId = `block-${height}`;
    const txRoot = computeMerkleLikeRoot([event.tx_id ?? ""]);

    await client.query(
      `INSERT INTO ledger_blocks (height, block_id, prev_block_id, validator_set_hash, tx_root_hash, status)
       VALUES ($1,$2,$3,$4,$5,'FINALIZED')`,
      [height, blockId, prevBlockId, "validator-set-v1", txRoot]
    );

    await client.query(
      `UPDATE ledger_transactions
       SET height = $2, validation_status = 'FINALIZED'
       WHERE tx_id = $1`,
      [event.tx_id, height]
    );

    for (const [idx, input] of event.inputs.entries()) {
      await client.query(
        `INSERT INTO tx_inputs (tx_id, input_index, ucowxo_id) VALUES ($1,$2,$3)`,
        [event.tx_id, idx, input.ucowxo_id]
      );
      await client.query(
        `UPDATE ucowxo_current
         SET spent_by_tx_id = $1, spent_height = $2
         WHERE ucowxo_id = $3 AND spent_by_tx_id IS NULL`,
        [event.tx_id, height, input.ucowxo_id]
      );
    }

    for (const [idx, output] of event.outputs.entries()) {
      const ucowxoId = sha256Hex(`${event.tx_id}:${idx}`);
      await client.query(
        `INSERT INTO tx_outputs (tx_id, output_index, ucowxo_id) VALUES ($1,$2,$3)`,
        [event.tx_id, idx, ucowxoId]
      );
      await client.query(
        `INSERT INTO ucowxo_current
         (ucowxo_id, origin_tx_id, parent_ucowxo_id, asset_type, asset_id, owner_org_id, state, metadata_hash, created_height)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          ucowxoId,
          event.tx_id,
          null,
          output.asset_type,
          output.asset_id,
          output.owner_org_id,
          output.state,
          output.metadata_hash ?? null,
          height
        ]
      );
    }

    for (const sig of event.signatures) {
      await client.query(
        `INSERT INTO ledger_attestations (attestation_id, tx_id, org_id, role, key_id, signature, verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (tx_id, org_id, role) DO NOTHING`,
        [`${event.tx_id}-${sig.org_id}-${sig.role}`, event.tx_id, sig.org_id, sig.role, sig.key_id, sig.signature, true]
      );
    }

    if (height > 2) {
      await client.query(
        `UPDATE ledger_transactions
         SET validation_status = 'IRREVERSIBLE'
         WHERE height <= $1 AND validation_status = 'FINALIZED'`,
        [height - 2]
      );
      await client.query(
        `UPDATE ledger_blocks
         SET status = 'IRREVERSIBLE'
         WHERE height <= $1 AND status = 'FINALIZED'`,
        [height - 2]
      );
    }
  });
}
