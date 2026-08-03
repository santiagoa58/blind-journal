import type { User } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";

type StoredUser = User & {
  authKeyHash: string;
  salt: string;
};

type LocalServerState = {
  activeUserId: string | null;
  entriesByUserId: Record<string, JournalEntry[]>;
  pendingAccountSalts: Record<string, string>;
  users: StoredUser[];
};

const initialEntries: JournalEntry[] = [
  {
    id: "quiet-morning",
    title: "A quieter kind of morning",
    content:
      "<p>The city felt softer today. I left my phone behind and walked until the noise became distant.</p><p>There was no breakthrough, no dramatic realization—just the rare feeling that I was exactly where I was supposed to be. I want to remember that calm does not always arrive after everything is solved. Sometimes it appears while life is still unfinished.</p><p>I came home, made coffee, and wrote this down before the feeling could become an abstraction.</p>",
    preview:
      "The city felt softer today. I left my phone behind and walked until the noise became distant.",
    createdAt: "2026-07-31T15:42:00.000Z",
    updatedAt: "2026-07-31T15:42:00.000Z",
    favorite: true,
    mood: "calm",
    tags: ["morning", "reflection"],
    wordCount: 76,
  },
  {
    id: "things-building",
    title: "Things I want to keep building",
    content:
      "<p>A list for the days when ambition feels too broad and I need to remember what actually matters.</p><p>Build things that make people feel capable. Keep learning without turning every interest into pressure. Protect time for the people I love. Make work that feels honest.</p>",
    preview:
      "A list for the days when ambition feels too broad and I need to remember what actually matters.",
    createdAt: "2026-07-31T05:16:00.000Z",
    updatedAt: "2026-07-31T05:16:00.000Z",
    favorite: false,
    mood: "hopeful",
    tags: ["goals", "ideas"],
    wordCount: 45,
  },
  {
    id: "small-wins",
    title: "Small wins still count",
    content:
      "<p>I finished the thing I had been avoiding. It took less time than the worry around it.</p><p>That pattern keeps repeating: anticipation expands, action shrinks it. I should remember this the next time a simple task begins to feel like a verdict on my whole life.</p>",
    preview:
      "I finished the thing I had been avoiding. It took less time than the worry around it.",
    createdAt: "2026-07-30T01:05:00.000Z",
    updatedAt: "2026-07-30T01:05:00.000Z",
    favorite: true,
    mood: "grateful",
    tags: ["progress"],
    wordCount: 45,
  },
];

function createInitialState(): LocalServerState {
  return {
    activeUserId: null,
    users: [
      {
        id: "user-1",
        username: "summertime",
        displayName: "Summer Time",
        authKeyHash: "u5sDSir7cELxmx4UKWowbaD8mb/8MckbcvyRK1KBWiM=",
        salt: "AAECAwQFBgcICQoLDA0ODw==",
      },
    ],
    pendingAccountSalts: {},
    entriesByUserId: {
      "user-1": structuredClone(initialEntries),
    },
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
