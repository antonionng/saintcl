import { createHash, createHmac, randomBytes } from "node:crypto";

import { env } from "../env";

type EmailActionTokenPayload = {
  kind: "unsubscribe";
  orgId: string;
  userId: string;
  preference: "marketing" | "weekly" | "welcome";
  email: string;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  const secret =
    env.emailTokenSecret || process.env.EMAIL_TOKEN_SECRET || (process.env.NODE_ENV === "test" ? "saintclaw-test-email-token-secret" : null);
  if (!secret) {
    throw new Error("EMAIL_TOKEN_SECRET is not configured.");
  }

  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createOpaqueEmailToken() {
  return randomBytes(24).toString("base64url");
}

export function hashEmailToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createEmailActionToken(payload: EmailActionTokenPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyEmailActionToken(token: string): EmailActionTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  if (signValue(encodedPayload) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as EmailActionTokenPayload;
    if (parsed.kind !== "unsubscribe") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
