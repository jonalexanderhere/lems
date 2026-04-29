import fs from "node:fs/promises";
import { Client } from "pg";

const sqlPath = process.argv[2];
if (!sqlPath) {
  throw new Error("Usage: node scripts/apply-sql.mjs <path-to-sql>");
}

const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  throw new Error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL.");
}

const url = new URL(connectionString);
const sql = await fs.readFile(sqlPath, "utf8");

const client = new Client({
  host: url.hostname,
  port: Number(url.port || 5432),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await client.connect();
try {
  await client.query(sql);
  console.log("SQL applied successfully:", sqlPath);
} finally {
  await client.end();
}

