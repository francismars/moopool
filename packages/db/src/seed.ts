import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "./client.js";

async function run() {
  const seedPath = resolve(process.cwd(), "seeds/001_seed.sql");
  const sql = await readFile(seedPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Seed applied:", seedPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
