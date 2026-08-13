import { z } from "zod";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/api/auth/auth.constants";
import type {
  ApiAuthSession,
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiSaltResponse,
  ApiVerifyCredentialsRequest,
} from "@/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import type { ApiUser } from "@/api/auth/user.type";
import { base64ToUint8Array } from "@/crypto/base64";

// Authentication request bodies contain only a username and a fixed-size encoded key.
export const MAX_AUTH_REQUEST_BODY_BYTES = 1_024;

const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const requiredUsernameSchema = z.string().trim().min(1);
export const usernameSchema = requiredUsernameSchema
  .max(MAX_USERNAME_LENGTH)
  .regex(USERNAME_PATTERN);

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH);

const authKeySchema = z.base64().refine((authKey) => {
  try {
    return (
      base64ToUint8Array(authKey).byteLength ===
      CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes
    );
  } catch {
    return false;
  }
});

const keyScheduleVersionSchema = z.literal(CURRENT_AUTH_KEY_SCHEDULE.version);
const accountSaltSchema = z.base64().refine((salt) => {
  try {
    return (
      base64ToUint8Array(salt).byteLength === CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes
    );
  } catch {
    return false;
  }
});

export const saltRequestSchema: z.ZodType<ApiSaltRequest> = z.strictObject({
  username: usernameSchema,
});

export const verifyCredentialsRequestSchema: z.ZodType<ApiVerifyCredentialsRequest> =
  z.strictObject({
    username: usernameSchema,
    authKey: authKeySchema,
    keyScheduleVersion: keyScheduleVersionSchema,
  });

export const createAccountRequestSchema: z.ZodType<ApiCreateAccountRequest> = z.strictObject({
  username: usernameSchema,
  authKey: authKeySchema,
  keyScheduleVersion: keyScheduleVersionSchema,
  salt: accountSaltSchema,
});

const apiUserSchema: z.ZodType<ApiUser> = z.strictObject({
  id: z.uuid(),
  username: usernameSchema,
  displayName: usernameSchema,
});

export const authSessionSchema: z.ZodType<ApiAuthSession> = z.strictObject({
  user: apiUserSchema,
});

export const saltResponseSchema: z.ZodType<ApiSaltResponse> = z.strictObject({
  keyScheduleVersion: keyScheduleVersionSchema,
  salt: accountSaltSchema,
});

export const logoutResponseSchema = z.null();
