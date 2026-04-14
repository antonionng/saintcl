import { cookies } from "next/headers";

export const TRAINING_PARTICIPANT_COOKIE_NAME = "saintclaw-training-participant";
export const TRAINING_PARTICIPANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export async function getTrainingParticipantCheckInToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TRAINING_PARTICIPANT_COOKIE_NAME)?.value ?? null;
}
