import { NextRequest } from "next/server";
import { verifySession, type SessionPayload } from "./jwt";

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get("mims_session")?.value;
  if (!token) return null;
  try { return verifySession(token); } catch { return null; }
}

export function requireRole(request: NextRequest, roles: SessionPayload["role"][]) {
  const session = getSessionFromRequest(request);
  if (!session || !roles.includes(session.role)) return null;
  return session;
}
