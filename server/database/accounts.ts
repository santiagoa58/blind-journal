import "server-only";

import { z } from "zod";
import type { AuthKeyScheduleVersion } from "@/lib/api/auth/auth-key-schedule";
import type { ApiUser } from "@/lib/api/auth/user.type";
import { getDatabase } from "@/server/database/client";
import { SESSION_CLEANUP_BATCH_SIZE, type StoredSession } from "@/server/database/sessions";
import type { Base64 } from "@/types/base64";

export type StoredUser = ApiUser & {
  authKeyHash: Base64;
  keyScheduleVersion: AuthKeyScheduleVersion;
  salt: Base64;
};

const storedUserRowSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string(),
  auth_key_hash: z.base64(),
  key_schedule_version: z.literal(1),
  salt: z.base64(),
});

function toStoredUser(row: unknown): StoredUser {
  const parsed = storedUserRowSchema.parse(row);
  return {
    id: parsed.id,
    username: parsed.username,
    displayName: parsed.display_name,
    authKeyHash: parsed.auth_key_hash,
    keyScheduleVersion: parsed.key_schedule_version,
    salt: parsed.salt,
  };
}

export async function createUserWithSession(
  user: StoredUser,
  session: StoredSession,
  previousSessionHash?: string,
): Promise<boolean> {
  const sql = getDatabase();
  const rows = await sql`
    WITH inserted_user AS (
      INSERT INTO users (
        id,
        username,
        display_name,
        auth_key_hash,
        key_schedule_version,
        salt
      )
      VALUES (
        ${user.id}::uuid,
        ${user.username},
        ${user.displayName},
        ${user.authKeyHash},
        ${user.keyScheduleVersion},
        ${user.salt}
      )
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    ),
    cleaned_sessions AS (
      DELETE FROM sessions
      WHERE session_hash IN (
        SELECT session_hash
        FROM sessions
        WHERE expires_at <= now()
        ORDER BY expires_at
        LIMIT ${SESSION_CLEANUP_BATCH_SIZE}
      )
      AND EXISTS (SELECT 1 FROM inserted_user)
      RETURNING session_hash
    ),
    deleted_previous_session AS (
      DELETE FROM sessions
      WHERE
        session_hash = ${previousSessionHash ?? null}
        AND EXISTS (SELECT 1 FROM inserted_user)
      RETURNING session_hash
    )
    INSERT INTO sessions (session_hash, user_id, created_at, expires_at)
    SELECT
      ${session.sessionHash},
      inserted_user.id,
      ${session.createdAt}::timestamptz,
      ${session.expiresAt}::timestamptz
    FROM inserted_user
    RETURNING user_id
  `;
  return rows.length === 1;
}

export async function deleteAccount(userId: string): Promise<boolean> {
  const sql = getDatabase();
  const results = await sql.transaction([
    sql`DELETE FROM journal_entries WHERE user_id = ${userId}::uuid`,
    sql`DELETE FROM sessions WHERE user_id = ${userId}::uuid`,
    sql`DELETE FROM users WHERE id = ${userId}::uuid RETURNING id`,
  ]);
  return (results[2]?.length ?? 0) === 1;
}

export async function findUserById(userId: string): Promise<StoredUser | undefined> {
  const sql = getDatabase();
  const rows = await sql`
    SELECT id, username, display_name, auth_key_hash, key_schedule_version, salt
    FROM users
    WHERE id = ${userId}::uuid
    LIMIT 1
  `;
  return rows[0] ? toStoredUser(rows[0]) : undefined;
}

export async function findUserByUsername(username: string): Promise<StoredUser | undefined> {
  const sql = getDatabase();
  const rows = await sql`
    SELECT id, username, display_name, auth_key_hash, key_schedule_version, salt
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `;
  return rows[0] ? toStoredUser(rows[0]) : undefined;
}
