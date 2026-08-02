import { z } from "zod";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_API_BASE_URL?: string;
    }
  }
}

const envSchema = z.strictObject({
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
