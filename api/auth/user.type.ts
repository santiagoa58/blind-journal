import type z from "zod";
import type { userSchema } from "./user.schema";

export type User = z.infer<typeof userSchema>;
