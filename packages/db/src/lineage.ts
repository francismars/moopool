import { pool } from "./client.js";

export async function getAssetLineage(assetId: string, maxDepth = 100) {
  const query = `
    WITH RECURSIVE lineage AS (
      SELECT
        uc.ucowxo_id,
        uc.origin_tx_id,
        uc.parent_ucowxo_id,
        uc.asset_id,
        uc.owner_org_id,
        uc.state,
        0 AS depth
      FROM ucowxo_current uc
      WHERE uc.asset_id = $1
      UNION ALL
      SELECT
        parent.ucowxo_id,
        parent.origin_tx_id,
        parent.parent_ucowxo_id,
        parent.asset_id,
        parent.owner_org_id,
        parent.state,
        lineage.depth + 1
      FROM ucowxo_current parent
      JOIN lineage ON lineage.parent_ucowxo_id = parent.ucowxo_id
      WHERE lineage.depth < $2
    )
    SELECT * FROM lineage ORDER BY depth ASC
  `;
  const res = await pool.query(query, [assetId, maxDepth]);
  return res.rows;
}
