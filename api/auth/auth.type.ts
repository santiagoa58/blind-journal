import type { ApiResponse } from "@/api/response.type";
import type z from "zod";
import type { userSaltRequestSchema } from "./auth.schema";
import type { User } from "./user.type";

export type UserSaltRequest = z.infer<typeof userSaltRequestSchema>;
export type UserSaltResponse = ApiResponse<User>;
