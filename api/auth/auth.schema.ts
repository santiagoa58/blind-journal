import { z } from "zod";
import type {
  CreateAccountRequest,
  SaltRequest,
  VerifyCredentialsRequest,
} from "@/api/auth/auth.type";

export const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]{3,24}$/);

const authKeySchema = z.string().regex(/^[0-9a-f]{64}$/i);

export const saltRequestSchema: z.ZodType<SaltRequest> = z.strictObject({
  username: usernameSchema,
});

export const verifyCredentialsRequestSchema: z.ZodType<VerifyCredentialsRequest> = z.strictObject({
  username: usernameSchema,
  authKey: authKeySchema,
});

export const createAccountRequestSchema: z.ZodType<CreateAccountRequest> =
  verifyCredentialsRequestSchema;
