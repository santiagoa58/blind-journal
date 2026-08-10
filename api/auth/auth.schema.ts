import { z } from "zod";
import type {
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiVerifyCredentialsRequest,
} from "@/api/auth/auth.type";

// Authentication request bodies contain only a username and a fixed-size encoded key.
export const MAX_AUTH_REQUEST_BODY_BYTES = 1_024;

export const usernameSchema = z.string().trim().min(3).max(24);

const authKeySchema = z.base64();

export const saltRequestSchema: z.ZodType<ApiSaltRequest> = z.strictObject({
  username: usernameSchema,
});

export const verifyCredentialsRequestSchema: z.ZodType<ApiVerifyCredentialsRequest> =
  z.strictObject({
    username: usernameSchema,
    authKey: authKeySchema,
  });

export const createAccountRequestSchema: z.ZodType<ApiCreateAccountRequest> =
   z.strictObject({
    username: usernameSchema,
    authKey: authKeySchema,
  });
