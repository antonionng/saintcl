#!/usr/bin/env -S npx tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

for (const file of [".env.local", ".env"]) {
  loadEnvFile(resolve(process.cwd(), file));
}

const INVITE_CODE = "ajb-enterprise-banking";

const PARTICIPANTS = [
  { fullName: "Alwaleed Al Saigh", email: "aalsaigh@aljazirabank.com.sa" },
  { fullName: "Yazeed Al Obaidan", email: "yalobaidan@aljazirabank.com.sa" },
  { fullName: "Khuloud Al Athel", email: "kalathel@aljazirabank.com.sa" },
  { fullName: "Tariq Al Harbi", email: "taalharbi@aljazirabank.com.sa" },
  { fullName: "Al Hanouf Al Atif", email: "aalatif@aljazirabank.com.sa" },
  { fullName: "Yasser Al Ruwaiti", email: "yalruwaiti@aljazirabank.com.sa" },
  { fullName: "Faisal Al Mane", email: "falmane@aljazirabank.com.sa" },
  { fullName: "Omar Al Suraia", email: "oalsuraia@aljazirabank.com.sa" },
  { fullName: "Antonio Giugno (test)", email: "antoniogiugno@me.com" },
];

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing Supabase config. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.",
    );
    process.exit(1);
  }

  const { env } = await import("../src/lib/env");
  const { provisionInvitedTrainingParticipants, syncAjbTrainingProgramme } = await import(
    "../src/lib/training-dal"
  );

  const buildMagicLink = (token: string) => {
    const base = env.appUrl.replace(/\/+$/, "");
    return `${base}/academy/${encodeURIComponent(INVITE_CODE)}/launch?token=${encodeURIComponent(token)}`;
  };

  console.log(`Provisioning ${PARTICIPANTS.length} participants for cohort '${INVITE_CODE}'...`);
  console.log(`App base URL: ${env.appUrl}`);
  console.log("");

  console.log("Ensuring AJB programme + cohort exist...");
  const synced = await syncAjbTrainingProgramme(null);
  if (!synced) {
    console.error("Failed to sync AJB programme. Check Supabase access.");
    process.exit(1);
  }

  const result = await provisionInvitedTrainingParticipants({
    inviteCode: INVITE_CODE,
    participants: PARTICIPANTS,
  });

  if (!result.ok) {
    console.error(`Provisioning failed: ${result.reason}${result.message ? ` (${result.message})` : ""}`);
    process.exit(1);
  }

  console.log(`Cohort: ${result.cohort.name} (${result.cohort.inviteCode})`);
  console.log("");
  console.log("| # | Name | Email | Status | Magic link |");
  console.log("|---|------|-------|--------|------------|");
  result.participants.forEach((entry, index) => {
    const link = buildMagicLink(entry.checkInToken);
    const status = entry.created ? "created" : "updated";
    console.log(
      `| ${index + 1} | ${entry.participant.fullName} | ${entry.participant.email} | ${status} | ${link} |`,
    );
  });

  console.log("");
  console.log("Distribution-ready list:");
  result.participants.forEach((entry, index) => {
    const link = buildMagicLink(entry.checkInToken);
    console.log(`${index + 1}. ${entry.participant.fullName} <${entry.participant.email}>`);
    console.log(`   ${link}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
