import jwt from "jsonwebtoken";

export type SessionPayload = {
  userId: number;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
};

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured.");
  return value;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, secret(), { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"] });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, secret()) as SessionPayload;
}
