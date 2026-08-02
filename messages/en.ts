export const en = {
  metadata: {
    applicationName: "Blind Journal",
    title: "Blind Journal",
    titleTemplate: "%s · Blind Journal",
    description: "A private, end-to-end encrypted personal journal.",
  },
  common: {
    actions: {
      cancel: "Cancel",
      done: "Done",
      retry: "Retry",
      save: "Save",
    },
    labels: {
      loading: "Loading…",
      soon: "Soon",
    },
    errors: {
      network: "We could not reach the server. Check your connection and try again.",
      unexpected: "Something went wrong. Please try again.",
    },
  },
  auth: {
    signIn: {
      title: "Sign in",
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your username",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      createAccount: "Create account",
      submit: "Sign in",
    },
    success: {
      accountInformationReceived: "Account information received.",
    },
    errors: {
      usernameRequired: "Enter a username.",
      userNotFound: "No account was found for that username.",
    },
  },
  brand: {
    name: "Blind Journal",
  },
  navigation: {
    journalNavigationLabel: "Journal navigation",
    primaryLabel: "Primary",
    collectionsLabel: "Collections",
    newEntry: "New entry",
    newEntryShortcut: "N",
    collectionsTitle: "COLLECTIONS",
    sections: {
      journal: "Journal",
      calendar: "Calendar",
      favorites: "Favorites",
      archive: "Archive",
      trash: "Trash",
    },
    collections: {
      personalGrowth: "Personal growth",
      peopleILove: "People I love",
    },
    privacy: {
      title: "Private by design.",
      description: "Your journal is encrypted before it leaves this device.",
    },
    account: {
      menuLabel: "Account",
      profile: "Profile",
      privacySettings: "Privacy settings",
      lockJournal: "Lock journal",
      settings: "Settings",
    },
  },
  journal: {
    moods: {
      calm: "Calm",
      hopeful: "Hopeful",
      reflective: "Reflective",
      tired: "Tired",
      grateful: "Grateful",
    },
    list: {
      sectionLabel: "Journal entries",
      eyebrow: "PERSONAL JOURNAL",
      title: "Your entries",
      filtersLabel: "Entry filters",
      displayLabel: "Display",
      showMood: "Show mood",
      newestFirst: "Newest first",
      searchPlaceholder: "Search your journal",
      all: "All",
      favorites: "Favorites",
      entriesCountOne: "{count} entry",
      entriesCountOther: "{count} entries",
      favoriteLabel: "Favorite",
      encryptedLabel: "Encrypted",
      emptyTitle: "No matching entries",
      emptyDescription: "Try a title, tag, or a phrase you remember.",
    },
    editor: {
      encryptedOnDevice: "Encrypted on this device",
      privateEntry: "Only you can read this entry",
      encryptionDetails: "Encryption details",
      removeFromFavorites: "Remove from favorites",
      addToFavorites: "Add to favorites",
      sharePrivately: "Share privately",
      entryActions: "Entry actions",
      exportEncryptedCopy: "Export encrypted copy",
      manageTags: "Manage tags",
      moveToTrash: "Move to trash",
      addTag: "Add tag",
      entryTitleLabel: "Entry title",
      entryBodyLabel: "Journal entry",
      startWriting: "Start writing…",
      savedJustNow: "Saved just now",
      wordsCountOne: "{count} word",
      wordsCountOther: "{count} words",
      formatting: {
        bold: "Bold",
        italic: "Italic",
        bulletedList: "Bulleted list",
        numberedList: "Numbered list",
        quote: "Quote",
      },
    },
    newEntry: {
      title: "Untitled entry",
      preview: "Start writing…",
      dateLabel: "Friday, July 31",
      timeLabel: "Now",
      updatedAt: "New entry",
    },
  },
  privacy: {
    title: "Privacy and security",
    description: "Visual settings for how Blind Journal protects and unlocks your private writing.",
    settings: {
      biometricUnlock: {
        title: "Biometric unlock",
        description: "Use Touch ID or your device biometrics after your first unlock.",
      },
      autoLock: {
        title: "Auto-lock",
        description: "Lock the journal after five minutes of inactivity.",
      },
      encryptedSync: {
        title: "Encrypted sync",
        description: "Sync encrypted journal data across your trusted devices.",
      },
      trustedDevices: {
        title: "Trusted devices",
        description: "Require approval before a new device can access your journal.",
      },
    },
    recovery: {
      title: "Recovery key",
      description:
        "Blind Journal cannot read or recover your entries. Keep your recovery key somewhere safe.",
      action: "View recovery options",
    },
  },
} as const;

type DeepString<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : DeepString<T[Key]>;
};

export type MessageCatalog = DeepString<typeof en>;
