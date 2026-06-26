import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@libsql/client";

// Idempotent, non-destructive migration for the Tier 1/Tier 2 feature work:
//   - template_versions table (version history / restore)
//   - templates.publicSlug + templates.isPublic (share link)
// Use this instead of `drizzle-kit push`, which would also try to DROP the
// legacy stripeCustomerId/stripeSubscriptionId columns (data loss). Run with:
//   npm run db:migrate-features

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
  `CREATE TABLE IF NOT EXISTS template_versions (
     id TEXT PRIMARY KEY,
     templateId TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     content TEXT NOT NULL,
     createdAt INTEGER NOT NULL
   )`,
  "CREATE INDEX IF NOT EXISTS idx_template_versions_templateId ON template_versions(templateId)",
  "ALTER TABLE templates ADD COLUMN publicSlug TEXT",
  "ALTER TABLE templates ADD COLUMN isPublic INTEGER NOT NULL DEFAULT 0",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_publicSlug ON templates(publicSlug)",
];

async function main() {
  console.log("Migrating:", databaseUrl!.replace(/\/\/.*@/, "//***@"));
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.slice(0, 60).replace(/\s+/g, " "));
    } catch (err) {
      const msg = String(err);
      if (
        msg.includes("duplicate column") ||
        msg.includes("already exists")
      ) {
        console.log("SKIP (exists):", sql.slice(0, 60).replace(/\s+/g, " "));
      } else {
        console.error("FAIL:", sql.replace(/\s+/g, " "), msg);
      }
    }
  }
  console.log("Done.");
}

main();
