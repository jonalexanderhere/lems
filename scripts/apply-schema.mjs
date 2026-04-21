import fs from "node:fs/promises";
import { Client } from "pg";

const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL.");
}

const url = new URL(connectionString);
const schema = await fs.readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

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
  await client.query(schema);
  console.log("Schema applied successfully.");
} finally {
  await client.end();
}
