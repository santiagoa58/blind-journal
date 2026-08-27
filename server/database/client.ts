import "server-only";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

const APPLICATION_DATABASE_ROLE = "blind_journal_app";

let database: NeonQueryFunction<false, false> | undefined;

function getDatabaseUrl(): string {
  const value = process.env["DATABASE_URL"];
  if (!value) {
    throw new Error("DATABASE_URL is required by the server.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }
  if (decodeURIComponent(url.username) !== APPLICATION_DATABASE_ROLE) {
    throw new Error(`DATABASE_URL must use the restricted ${APPLICATION_DATABASE_ROLE} role.`);
  }
  if (!url.hostname.includes("-pooler.")) {
    throw new Error("DATABASE_URL must use Neon's pooled application connection.");
  }

  return value;
}

export function getDatabase(): NeonQueryFunction<false, false> {
  database ??= neon(getDatabaseUrl());
  return database;
}
