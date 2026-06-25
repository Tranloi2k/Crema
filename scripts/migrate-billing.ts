import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@libsql/client";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const databaseUrl = process.env.TURSO_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is required in .env");
}

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  "ALTER TABLE user ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'",
  "ALTER TABLE user ADD COLUMN planInterval TEXT",
  "ALTER TABLE user ADD COLUMN planStatus TEXT",
  "ALTER TABLE user ADD COLUMN planCurrentPeriodEnd INTEGER",
  "ALTER TABLE user ADD COLUMN billingCustomerId TEXT",
  "ALTER TABLE user ADD COLUMN billingSubscriptionId TEXT",
  "ALTER TABLE user RENAME COLUMN stripeCustomerId TO billingCustomerId",
  "ALTER TABLE user RENAME COLUMN stripeSubscriptionId TO billingSubscriptionId",
  "UPDATE user SET billingCustomerId = stripeCustomerId WHERE billingCustomerId IS NULL AND stripeCustomerId IS NOT NULL",
  "UPDATE user SET billingSubscriptionId = stripeSubscriptionId WHERE billingSubscriptionId IS NULL AND stripeSubscriptionId IS NOT NULL",
  "ALTER TABLE user ADD COLUMN downgradeSelectionPending INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE templates ADD COLUMN locked INTEGER NOT NULL DEFAULT 0",
];

async function main() {
  console.log("Migrating:", databaseUrl.replace(/\/\/.*@/, "//***@"));
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.slice(0, 60));
    } catch (err) {
      const msg = String(err);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log("SKIP (exists):", sql.slice(0, 60));
      } else {
        console.error("FAIL:", sql, msg);
      }
    }
  }
}

main();
