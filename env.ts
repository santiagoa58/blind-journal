import { z } from "zod";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_API_BASE_URL?: string;
    }
  }
}

const envSchema = z.strictObject({
  // TODO(review-medium-api-origin): Restrict the production API base to an origin-relative path
  // unless cross-origin deployment becomes an explicit requirement. This client always includes
  // credentials, so accepting any absolute URL makes a configuration mistake send cookie-bearing
  // API requests outside the intended same-origin architecture.
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || URL.canParse(value),
      "Must be an absolute URL or an origin-relative path.",
    ),
});

const result = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

if (!result.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
}

export const env = result.data;
