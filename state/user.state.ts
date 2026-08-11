import { create } from "zustand";
import type { ClientUser } from "@/api/auth/user.type";

export interface UserState {
  user: ClientUser | null;
}

interface UserAction {
  setUser(user: ClientUser | null): void;
}

export const useUser = create<UserState & UserAction>((set) => ({
  user: null,
  setUser: (user: ClientUser | null) => set({ user }),
}));
