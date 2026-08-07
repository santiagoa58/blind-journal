import "server-only";

import type { ApiUser } from "@/api/auth/user.type";
import type { Base64 } from "@/api/general.type";
import type { JournalEntry } from "@/api/journal/journal.type";

export type StoredUser = ApiUser & {
  authKeyHash: Base64;
  salt: Base64;
};

type PendingAccountSalt = {
  expiresAt: number;
  salt: Base64;
};

type StoredSession = {
  expiresAt: number;
  userId: string;
};

type ServerState = {
  entriesByUserId: Map<string, JournalEntry[]>;
  pendingAccountSalts: Map<string, PendingAccountSalt>;
  sessions: Map<string, StoredSession>;
  users: StoredUser[];
};

const developmentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "test_user",
  displayName: "Test User",
  salt: "dGVzdC1zYWx0LTEyMzQ1Ng==",
  authKeyHash: "sVjCRFs1/30yYjPMGCVr7cNWA+uycpwGHXd44KIjB3Q=",
} satisfies StoredUser;

const developmentUsers = process.env.NODE_ENV === "development" ? [developmentUser] : [];
const developmentEntries = new Map<string, JournalEntry[]>();

if (process.env.NODE_ENV === "development") {
  developmentEntries.set(developmentUser.id, []);
}

export const serverStore: ServerState = {
  entriesByUserId: developmentEntries,
  pendingAccountSalts: new Map(),
  sessions: new Map(),
  users: developmentUsers,
};
