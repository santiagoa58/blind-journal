import "server-only";

import { z } from "zod";
import { getDatabase } from "@/server/database/client";

export const SESSION_CLEANUP_BATCH_SIZE = 100;

export type StoredSession = {
  createdAt: string;
  expiresAt: string;
  sessionHash: string;
  userId: string;
};

export async function deleteSession(sessionHash: string): Promise<void> {
  const sql = getDatabase();
  await sql`DELETE FROM sessions WHERE session_hash = ${sessionHash}`;
}

export async function findSessionUserId(sessionHash: string): Promise<string | undefined> {
  const sql = getDatabase();
  const rows = await sql`
    SELECT user_id
    FROM sessions
    WHERE session_hash = ${sessionHash} AND expires_at > now()
    LIMIT 1
  `;
  const result = z.object({ user_id: z.uuid() }).safeParse(rows[0]);
  return result.success ? result.data.user_id : undefined;
}

export async function replaceSession(
  session: StoredSession,
  previousSessionHash?: string,
): Promise<void> {
  const sql = getDatabase();
  const queries = [
    sql`
      DELETE FROM sessions
      WHERE session_hash IN (
        SELECT session_hash
        FROM sessions
        WHERE expires_at <= now()
        ORDER BY expires_at
        LIMIT ${SESSION_CLEANUP_BATCH_SIZE}
      )
    `,
    sql`
      INSERT INTO sessions (session_hash, user_id, created_at, expires_at)
      VALUES (
        ${session.sessionHash},
        ${session.userId}::uuid,
        ${session.createdAt}::timestamptz,
        ${session.expiresAt}::timestamptz
      )
    `,
  ];
  if (previousSessionHash) {
    queries.unshift(sql`DELETE FROM sessions WHERE session_hash = ${previousSessionHash}`);
  }
  await sql.transaction(queries);
}
