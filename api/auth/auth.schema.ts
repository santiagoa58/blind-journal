import { z } from "zod";

export const userSaltRequestSchema = z.strictObject({
  username: z.string().trim().min(1),
});
