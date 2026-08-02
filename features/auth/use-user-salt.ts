"use client";

import { fetchUserSalt } from "@/api/auth/auth";
import type { UserSaltRequest, UserSaltResponse } from "@/api/auth/auth.type";
import { useMutation } from "@tanstack/react-query";

const userSaltMutationKey = ["auth", "user-salt"] as const;

export function useUserSalt() {
  return useMutation<UserSaltResponse, Error, UserSaltRequest>({
    mutationKey: userSaltMutationKey,
    mutationFn: fetchUserSalt,
  });
}
