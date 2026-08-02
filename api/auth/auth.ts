import type { UserSaltRequest, UserSaltResponse } from "@/api/auth/auth.type";
import { api } from "@/api/client";

export function fetchUserSalt(input: UserSaltRequest): Promise<UserSaltResponse> {
  return api
    .post("auth/login", {
      cache: "no-store",
      json: input,
    })
    .json<UserSaltResponse>();
}
