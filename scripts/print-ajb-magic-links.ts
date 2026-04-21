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

const INVITE_CODE = process.env.COHORT_INVITE_CODE?.trim() || "ajb-enterprise-banking";
const APP_URL_OVERRIDE = process.env.MAGIC_LINK_BASE_URL?.trim() || null;

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing Supabase config. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.",
    );
    process.exit(1);
  }

  const { env } = await import("../src/lib/env");
  const { createClient } = await import("@supabase/supabase-js");

  const baseUrl = (APP_URL_OVERRIDE ?? env.appUrl).replace(/\/+$/, "");
  const buildMagicLink = (token: string) =>
    `${baseUrl}/academy/${encodeURIComponent(INVITE_CODE)}/launch?token=${encodeURIComponent(token)}`;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: cohort, error: cohortError } = await admin
    .from("training_cohorts")
    .select("id, name, invite_code")
    .eq("invite_code", INVITE_CODE)
    .maybeSingle();

  if (cohortError) {
    console.error("Failed to load cohort:", cohortError.message);
    process.exit(1);
  }
  if (!cohort) {
    console.error(`Cohort not found for invite code '${INVITE_CODE}'.`);
    process.exit(1);
  }

  const { data: participants, error: participantsError } = await admin
    .from("training_participants")
    .select("id, full_name, email, status, auth_user_id, check_in_token, created_at")
    .eq("cohort_id", cohort.id)
    .order("created_at", { ascending: true });

  if (participantsError) {
    console.error("Failed to load participants:", participantsError.message);
    process.exit(1);
  }

  console.log(`Cohort: ${cohort.name} (${cohort.invite_code})`);
  console.log(`Base URL: ${baseUrl}`);
  if (!APP_URL_OVERRIDE) {
    console.log("(set MAGIC_LINK_BASE_URL=https://prod.example.com to override the base URL)");
  }
  console.log(`Participants: ${participants?.length ?? 0}`);
  console.log("");

  console.log("| # | Name | Email | Account | Magic link |");
  console.log("|---|------|-------|---------|------------|");
  (participants ?? []).forEach((row, index) => {
    const accountLabel = row.auth_user_id ? "saint account" : "link only";
    const link = row.check_in_token ? buildMagicLink(row.check_in_token) : "(no token)";
    console.log(
      `| ${index + 1} | ${row.full_name} | ${row.email} | ${accountLabel} | ${link} |`,
    );
  });

  console.log("");
  console.log("Distribution-ready list:");
  (participants ?? []).forEach((row, index) => {
    const link = row.check_in_token ? buildMagicLink(row.check_in_token) : "(no token)";
    console.log(`${index + 1}. ${row.full_name} <${row.email}>`);
    console.log(`   ${link}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
