import type { User } from "@/api/auth/user.type";
import type { ApiResponse } from "@/api/response.type";

export type UserSaltRequest = {
  username: string;
};

export type UserSaltResponse = ApiResponse<User>;
