import { createClient, type Config } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const REMOTE_FETCH_TIMEOUT_MS = 60_000;

function createRemoteFetch(timeoutMs = REMOTE_FETCH_TIMEOUT_MS) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  };
}

function getDbConfig(): Config {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) {
    return { url: "file:local.db" };
  }

  return {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
    fetch: createRemoteFetch(),
  };
}

const client = createClient(getDbConfig());

export const db = drizzle(client, { schema });

export function isDatabaseConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  const message = err.message.toLowerCase();
  if (
    message.includes("fetch failed") ||
    message.includes("connect timeout") ||
    message.includes("failed query")
  ) {
    return true;
  }

  let current: unknown = err.cause;
  while (current instanceof Error) {
    const causeMessage = current.message.toLowerCase();
    if (causeMessage.includes("connect timeout") || causeMessage.includes("fetch failed")) {
      return true;
    }
    current = current.cause;
  }

  return false;
}
