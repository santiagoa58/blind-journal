import "server-only";

import { z } from "zod";

const MINIMUM_AUTH_SALT_SECRET_BYTES = 32;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

let environment: ServerEnvironment | undefined;

const nodeEnvironmentSchema = z.enum(["development", "production", "test"], {
  error: "NODE_ENV must be development, production, or test.",
});

const databaseUrlSchema = z
  .string({ error: "DATABASE_URL is required." })
  .min(1, "DATABASE_URL is required.")
  .pipe(
    z.url({
      protocol: /^postgres(?:ql)?$/,
      error: "DATABASE_URL must be a valid PostgreSQL connection URL.",
    }),
  )
  .transform((value) => ({ value, url: new URL(value) }))
  .refine(({ url }) => url.username.length > 0, {
    error: "DATABASE_URL must include a database username.",
  })
  .refine(({ url }) => url.password.length > 0, {
    error: "DATABASE_URL must include a database password.",
  })
  .transform(({ value }) => value);

const configuredAuthSaltSecretSchema = z
  .string({ error: "AUTH_SALT_SECRET is required." })
  .min(1, "AUTH_SALT_SECRET is required.")
  .regex(/^[A-Za-z0-9_-]+$/, "AUTH_SALT_SECRET must be Base64URL encoded.")
  .transform((value, context) => {
    const secret = Buffer.from(value, "base64url");
    if (secret.byteLength < MINIMUM_AUTH_SALT_SECRET_BYTES) {
      context.addIssue({
        code: "custom",
        message: `AUTH_SALT_SECRET must decode to at least ${MINIMUM_AUTH_SALT_SECRET_BYTES} bytes.`,
      });
      return z.NEVER;
    }
    return secret;
  });

export type ServerEnvironment = {
  authSaltSecret: z.output<typeof configuredAuthSaltSecretSchema>;
  databaseUrl: z.output<typeof databaseUrlSchema>;
  nodeEnvironment: z.output<typeof nodeEnvironmentSchema>;
};

export function validateServerEnvironment(source: EnvironmentSource): ServerEnvironment {
  const nodeEnvironment = nodeEnvironmentSchema.safeParse(source["NODE_ENV"]);
  const databaseUrl = databaseUrlSchema.safeParse(source["DATABASE_URL"]);
  const authSaltSecret = configuredAuthSaltSecretSchema.safeParse(source["AUTH_SALT_SECRET"]);

  if (!nodeEnvironment.success || !databaseUrl.success || !authSaltSecret.success) {
    const issues: string[] = [];
    if (!nodeEnvironment.success) {
      issues.push(...nodeEnvironment.error.issues.map((issue) => issue.message));
    }
    if (!databaseUrl.success) {
      issues.push(...databaseUrl.error.issues.map((issue) => issue.message));
    }
    if (!authSaltSecret.success) {
      issues.push(...authSaltSecret.error.issues.map((issue) => issue.message));
    }
    throw new Error(`Invalid server environment:\n- ${issues.join("\n- ")}`);
  }

  return {
    authSaltSecret: authSaltSecret.data,
    databaseUrl: databaseUrl.data,
    nodeEnvironment: nodeEnvironment.data,
  };
}

export function getServerEnvironment(): ServerEnvironment {
  if (!environment) {
    environment = validateServerEnvironment(process.env);
  }
  return environment;
}
