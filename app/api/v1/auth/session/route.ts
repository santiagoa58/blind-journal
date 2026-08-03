import type { NextRequest } from "next/server";
import { getSession } from "@/server/auth";
import { jsonResponse } from "@/server/http";
import { getSessionUserId } from "@/server/session";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const response = getSession(getSessionUserId(request));

  return jsonResponse(response, response.success ? 200 : 401);
}
