import { z } from "zod";

export const userSchema = z.strictObject({
  id: z.string().min(1),
  username: z.string().min(1),
  salt: z.string().min(1),
});
