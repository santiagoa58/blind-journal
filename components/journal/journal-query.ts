export const journalEntriesQueryRootKey = ["journal", "entries"] as const;

export function journalEntriesQueryKey(userId: string) {
  return [...journalEntriesQueryRootKey, userId] as const;
}
