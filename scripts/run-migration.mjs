import { readFileSync } from "node:fs";
import { Client } from "pg";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Uso: node scripts/run-migration.mjs <caminho-do-arquivo.sql>");
  process.exit(1);
}

const sql = readFileSync(filePath, "utf-8");
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query(sql);
  console.log(`Migração aplicada: ${filePath}`);
} finally {
  await client.end();
}
