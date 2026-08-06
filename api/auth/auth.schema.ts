import { z } from "zod";
import type {
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiVerifyCredentialsRequest,
} from "@/api/auth/auth.type";

export const usernameSchema = z.string().trim().min(3).max(24);

const authKeySchema = z.base64();

export const saltRequestSchema: z.ZodType<ApiSaltRequest> = z.strictObject({
  username: usernameSchema,
});

export const verifyCredentialsRequestSchema: z.ZodType<ApiVerifyCredentialsRequest> =
  z.strictObject({
    username: usernameSchema,
    authKeyBase64: authKeySchema,
  });

export const createAccountRequestSchema: z.ZodType<ApiCreateAccountRequest> =
  verifyCredentialsRequestSchema;
