import type { ApiUser } from "@/api/auth/user.type";
import type { Base64 } from "@/api/general.type";
import type { JournalEntry } from "@/api/journal/journal.type";

type StoredUser = ApiUser & {
  authKeyHash: Base64;
  salt: Base64;
};

type LocalServerState = {
  activeUserId: string | null;
  entriesByUserId: Record<string, JournalEntry[]>;
  pendingAccountSalts: Record<string, Base64>;
  users: StoredUser[];
};

function createInitialState(): LocalServerState {
  return {
    activeUserId: null,
    users: [],
    pendingAccountSalts: {},
    entriesByUserId: {},
  };
}

export const localServerStore = createInitialState();

export function resetLocalServerStore() {
  const initialState = createInitialState();

  localServerStore.activeUserId = initialState.activeUserId;
  localServerStore.entriesByUserId = initialState.entriesByUserId;
  localServerStore.pendingAccountSalts = initialState.pendingAccountSalts;
  localServerStore.users = initialState.users;
}

export type { StoredUser };
