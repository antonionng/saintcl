"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ModuleOption = {
  slug: string;
  title: string;
};

export function CopilotStudioPanel({
  inviteCode,
  checkInToken,
  appUrl,
  modules,
  defaultModuleSlug,
  allowedModels,
}: {
  inviteCode: string;
  checkInToken: string | null;
  appUrl: string;
  modules: ModuleOption[];
  defaultModuleSlug: string | null;
  allowedModels: string[];
}) {
  const [revealed, setRevealed] = useState(false);
  const [moduleSlug, setModuleSlug] = useState(defaultModuleSlug ?? modules[0]?.slug ?? "");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const baseUrl = useMemo(() => normaliseAppUrl(appUrl), [appUrl]);

  const envBlock = useMemo(() => {
    const lines = [
      `export SAINTCLAW_BASE_URL=${shellQuote(baseUrl)}`,
      `export SAINTCLAW_INVITE_CODE=${shellQuote(inviteCode)}`,
      `export SAINTCLAW_PARTICIPANT_TOKEN=${shellQuote(checkInToken ?? "")}`,
      `export SAINTCLAW_MODULE_SLUG=${shellQuote(moduleSlug)}`,
    ];
    return lines.join("\n");
  }, [baseUrl, inviteCode, checkInToken, moduleSlug]);

  const tokenAvailable = Boolean(checkInToken);
  const displayedEnvBlock = revealed
    ? envBlock
    : envBlock.replace(
        /SAINTCLAW_PARTICIPANT_TOKEN=.*/,
        `SAINTCLAW_PARTICIPANT_TOKEN=${maskToken(checkInToken)}`,
      );

  async function copy(label: string, value: string) {
    if (!value) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField((current) => (current === label ? null : current)), 1800);
    } catch {
      setCopiedField(null);
    }
  }

  return (
    <Card className="overflow-hidden border-white/8 bg-black/10">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10"
        >
          <NotebookIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white">Notebook Studio</p>
          <p className="truncate text-[11px] text-zinc-500">
            Wire up the SaintClaw copilot inside your Jupyter notebooks.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
            tokenAvailable
              ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200"
              : "border-amber-400/30 bg-amber-400/[0.08] text-amber-100"
          }`}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${tokenAvailable ? "bg-emerald-300" : "bg-amber-300"}`}
          />
          {tokenAvailable ? "Ready" : "Token missing"}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5">
        {!tokenAvailable ? (
          <p
            role="alert"
            className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200"
          >
            Your participant seat does not yet have a token. Sign in via the cohort invite link first, then refresh
            this page.
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Module</label>
          <ModuleSelect value={moduleSlug} onChange={setModuleSlug} options={modules} />
        </div>

        <section className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                Quick start &middot; env block
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRevealed((current) => !current)}
                disabled={!tokenAvailable}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {revealed ? <EyeOffIcon /> : <EyeIcon />}
                {revealed ? "Hide" : "Reveal"}
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!tokenAvailable}
                onClick={() => copy("env", envBlock)}
                className="h-7 shrink-0 whitespace-nowrap px-2.5 text-[11px]"
              >
                {copiedField === "env" ? "Copied" : "Copy block"}
              </Button>
            </div>
          </header>
          <pre className="overflow-x-auto whitespace-pre bg-black/40 px-4 py-3 text-[11px] leading-[1.7] text-zinc-200">
{displayedEnvBlock.split("\n").map((line, index) => {
  const eq = line.indexOf("=");
  if (eq === -1) {
    return (
      <span key={index} className="block text-zinc-300">{line}</span>
    );
  }
  const head = line.slice(0, eq);
  const value = line.slice(eq + 1);
  const exportPrefix = head.startsWith("export ") ? "export " : "";
  const varName = exportPrefix ? head.slice("export ".length) : head;
  return (
    <span key={index} className="block">
      {exportPrefix ? <span className="text-zinc-500">{exportPrefix}</span> : null}
      <span className="text-emerald-300/90">{varName}</span>
      <span className="text-zinc-500">=</span>
      <span className="text-zinc-100">{value}</span>
    </span>
  );
})}
          </pre>
          <p className="border-t border-white/5 bg-white/[0.015] px-4 py-2 text-[11px] text-zinc-500">
            Paste these into the shell that starts Jupyter, then restart the kernel. Module slug updates as you
            change the dropdown above.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Credentials</p>
          <div className="overflow-hidden rounded-xl border border-white/8 divide-y divide-white/5">
            <CredentialRow
              label="Base URL"
              value={baseUrl}
              onCopy={() => copy("baseUrl", baseUrl)}
              copied={copiedField === "baseUrl"}
            />
            <CredentialRow
              label="Invite code"
              value={inviteCode}
              onCopy={() => copy("invite", inviteCode)}
              copied={copiedField === "invite"}
            />
            <CredentialRow
              label="Participant token"
              value={revealed ? checkInToken ?? "" : maskToken(checkInToken)}
              onCopy={() => copy("token", checkInToken ?? "")}
              copied={copiedField === "token"}
              disabled={!tokenAvailable}
              sensitive
            />
            <CredentialRow
              label="Module slug"
              value={moduleSlug}
              onCopy={() => copy("module", moduleSlug)}
              copied={copiedField === "module"}
            />
          </div>
        </section>

        <details className="group overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-zinc-500" />
              Models on the participant allowlist
              <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px] tracking-normal text-zinc-400">
                {allowedModels.length}
              </span>
            </span>
            <ChevronIcon className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-white/5 px-4 py-3">
            <ul className="flex flex-wrap gap-1.5">
              {allowedModels.map((model) => (
                <li
                  key={model}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-200"
                >
                  {model}
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Pass any of these as the <span className="font-mono text-zinc-300">model</span> argument in{" "}
              <span className="font-mono text-zinc-300">co.ask(...)</span> or{" "}
              <span className="font-mono text-zinc-300">co.compare(..., models=[...])</span>. Other model ids are
              blocked and logged.
            </p>
          </div>
        </details>

        <Link
          href="https://github.com/saintagi/saintclaw/blob/main/docs/training/copilot-ai-use-policy.md"
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.04]"
        >
          <div
            aria-hidden
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20"
          >
            <ShieldIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-zinc-200 group-hover:text-white">
              Copilot AI Use Policy
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              Read this first. Every prompt is logged against your seat for cohort review.
            </p>
          </div>
          <ChevronIcon className="mt-1 size-3.5 -rotate-90 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300" />
        </Link>
      </div>
    </Card>
  );
}

function ModuleSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: ModuleOption[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 pr-9 text-sm text-zinc-100 transition hover:border-white/20 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.slug} value={option.slug} className="bg-zinc-900 text-zinc-100">
            {option.title}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  copied,
  disabled = false,
  sensitive = false,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  disabled?: boolean;
  sensitive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/[0.015] px-3.5 py-2.5 transition hover:bg-white/[0.03]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          {sensitive ? (
            <span className="inline-flex items-center rounded bg-amber-400/10 px-1 text-[9px] uppercase tracking-[0.14em] text-amber-200">
              Secret
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[12px] text-zinc-200">{value || "—"}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function NotebookIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-zinc-300">
      <path
        d="M3.5 2.5h7A1.5 1.5 0 0 1 12 4v9.5H4.5A1.5 1.5 0 0 1 3 12V3a.5.5 0 0 1 .5-.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M5 5.5h5M5 8h5M5 10.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 4.5v9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-3">
      <path
        d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="7" cy="7" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-3">
      <path
        d="M2 2l10 10M3.5 4.2C2.1 5.3 1 7 1 7s2 4 6 4c1.2 0 2.2-.3 3.1-.8M6 3.1A6.6 6.6 0 0 1 7 3c4 0 6 4 6 4s-.6 1.2-1.7 2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-3">
      <rect x="4" y="4" width="8" height="8" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 9.5V3a.5.5 0 0 1 .5-.5h6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-3 text-emerald-300">
      <path
        d="M3 7.5 6 10.5l5-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className}>
      <path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-3.5">
      <path
        d="M7 1.5 12 3v3.5c0 3-2.2 5.4-5 6-2.8-.6-5-3-5-6V3l5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function maskToken(token: string | null) {
  if (!token) return "—";
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

function normaliseAppUrl(raw: string) {
  return raw.replace(/\/+$/, "");
}

function shellQuote(value: string) {
  if (!value) return '""';
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
