import "server-only";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { getServerEnvironment } from "@/server/environment";

let database: NeonQueryFunction<false, false> | undefined;

export function getDatabase(): NeonQueryFunction<false, false> {
  database ??= neon(getServerEnvironment().databaseUrl);
  return database;
}
