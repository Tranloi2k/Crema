import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function getDbConfig() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required. Configure Turso in .env.");
  }
  return {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  };
}

const client = createClient(getDbConfig());

export const db = drizzle(client, { schema });
