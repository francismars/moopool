import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "./client.js";

async function run() {
  const migrationPath = resolve(process.cwd(), "migrations/001_init.sql");
  const sql = await readFile(migrationPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Migration applied:", migrationPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
