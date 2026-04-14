import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashTrainingParticipantPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return {
    salt,
    hash,
  };
}

export function verifyTrainingParticipantPassword(input: {
  password: string;
  salt: string | null | undefined;
  hash: string | null | undefined;
}) {
  if (!input.salt || !input.hash) return false;

  const nextHash = scryptSync(input.password, input.salt, KEY_LENGTH);
  const existingHash = Buffer.from(input.hash, "hex");
  if (existingHash.length !== nextHash.length) return false;

  return timingSafeEqual(existingHash, nextHash);
}
