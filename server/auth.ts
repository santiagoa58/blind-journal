import "server-only";

import { createAuthService } from "@/server/auth.service";
import { serverApplicationStore } from "@/server/store";

export const { createAccount, createAccountSalt, getLoginSalt, getSession, verifyCredentials } =
  createAuthService(serverApplicationStore);
