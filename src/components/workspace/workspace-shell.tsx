"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  X,
} from "lucide-react";

import { WORKSPACE_BOOTSTRAP_ATTEMPTS_KEY } from "@/components/workspace/workspace-bootstrap-pending";
import { WorkspaceCompanyContextOnboarding } from "@/components/workspace/workspace-company-context-onboarding";
import { WORKSPACE_EXPECT_PROFILE_STEP2_KEY } from "@/components/workspace/workspace-onboarding-keys";

import { RequestLogTable, type RequestLogItem } from "@/components/dashboard/request-log-table";
import { SessionLogTail } from "@/components/dashboard/session-log-tail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const OPENCLAW_CONTROL_SETTINGS_KEY = "openclaw.control.settings.v1";
const WORKSPACE_AGENT_NOTICE_DISMISSED_KEY = "saintagi.workspace.agentNoticeDismissed.v1";

type WorkspaceOnboardingSequence = "none" | "profile_only" | "company_only" | "company_then_profile";

const MAX_PROVISION_RATE_LIMIT_ROUNDS = 6;

type WorkspaceShellProps = {
  embeddedConsoleUrl?: string;
  gatewayUrl?: string;
  sessionKey?: string;
  error?: string;
  requiresOnboarding?: boolean;
  requiresOrgCompanyOnboarding?: boolean;
  onboardingSequence?: WorkspaceOnboardingSequence;
  initialOrgContext?: {
    website: string;
    companySummary: string;
    agentBrief: string;
  };
  hasProvisionedAgent?: boolean;
  canProvisionAgent?: boolean;
  canManageAgents?: boolean;
  agentName?: string | null;
  orgName?: string | null;
  trialActive?: boolean;
  trialMessageCount?: number;
  trialMessageLimit?: number;
  initialProfile: {
    displayName: string;
    whatIDo: string;
    agentBrief: string;
  };
};

type PersistedControlUiSettings = {
  gatewayUrl?: string;
  sessionKey?: string;
  lastActiveSessionKey?: string;
  [key: string]: unknown;
};

function seedManagedWorkspaceSettings(gatewayUrl?: string, sessionKey?: string) {
  if ((!gatewayUrl && !sessionKey) || typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(OPENCLAW_CONTROL_SETTINGS_KEY);
    const parsed =
      raw != null ? (JSON.parse(raw) as PersistedControlUiSettings | null) : null;
    const next =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};

    const seeded = {
      ...next,
      ...(gatewayUrl ? { gatewayUrl } : {}),
      ...(sessionKey ? { sessionKey, lastActiveSessionKey: sessionKey } : {}),
    };

    if (
      next.gatewayUrl === seeded.gatewayUrl &&
      next.sessionKey === seeded.sessionKey &&
      next.lastActiveSessionKey === seeded.lastActiveSessionKey
    ) {
      return;
    }

    window.localStorage.setItem(
      OPENCLAW_CONTROL_SETTINGS_KEY,
      JSON.stringify(seeded),
    );
  } catch {
    window.localStorage.setItem(OPENCLAW_CONTROL_SETTINGS_KEY, JSON.stringify({
      ...(gatewayUrl ? { gatewayUrl } : {}),
      ...(sessionKey ? { sessionKey, lastActiveSessionKey: sessionKey } : {}),
    }));
  }
}

function hideManagedSessionControls(iframe: HTMLIFrameElement | null) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc || doc.getElementById("saintagi-managed-workspace-style")) return;

    const style = doc.createElement("style");
    style.id = "saintagi-managed-workspace-style";
    // Hide controls that don't apply to the SaintAGI managed runtime: per-session
    // chooser and the upstream OpenClaw self-update banner (we control upgrades).
    style.textContent =
      ".chat-controls__session{display:none!important}" +
      ".update-banner{display:none!important}";
    doc.head.appendChild(style);
  } catch {
    // The workspace still loads if the browser blocks parent access to iframe contents.
  }
}

export function WorkspaceShell({
  embeddedConsoleUrl,
  gatewayUrl,
  sessionKey,
  error,
  requiresOnboarding = false,
  requiresOrgCompanyOnboarding = false,
  onboardingSequence = "none",
  initialOrgContext = { website: "", companySummary: "", agentBrief: "" },
  hasProvisionedAgent = true,
  canProvisionAgent = false,
  canManageAgents = false,
  agentName,
  orgName,
  trialActive = false,
  trialMessageCount = 0,
  trialMessageLimit = 0,
  initialProfile,
}: WorkspaceShellProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [items, setItems] = useState<RequestLogItem[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState(initialProfile);
  const [onboardingComplete, setOnboardingComplete] = useState(!requiresOnboarding);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);
  const [provisioningRetrySeconds, setProvisioningRetrySeconds] = useState<number | null>(null);
  const provisioningRateLimitAutoRetries = useRef(0);
  const provisionAgentRef = useRef<() => Promise<void>>(async () => {});
  const [guideOpen, setGuideOpen] = useState(false);
  const [agentNoticeOpen, setAgentNoticeOpen] = useState(true);
  const [profileStepTwoKicker, setProfileStepTwoKicker] = useState(false);

  const normalizedOnboardingProfile = useMemo(
    () => ({
      displayName: onboardingProfile.displayName.trim(),
      whatIDo: onboardingProfile.whatIDo.trim(),
      agentBrief: onboardingProfile.agentBrief.trim(),
    }),
    [onboardingProfile],
  );

  const userProfileOnboardingBlocking = requiresOnboarding && !onboardingComplete;
  const blockingOnboarding = requiresOrgCompanyOnboarding || userProfileOnboardingBlocking;
  const showCompanyContextOnboarding = requiresOrgCompanyOnboarding;
  const showUserProfileOnboarding = !requiresOrgCompanyOnboarding && requiresOnboarding && !onboardingComplete;

  const showProvisioningState = !blockingOnboarding && !hasProvisionedAgent;
  const displayAgentName = agentName?.trim() || "Your company agent";
  const displayOrgName = orgName?.trim() || "your company";
  const trialUsageRatio = trialMessageLimit > 0 ? trialMessageCount / trialMessageLimit : 0;
  const showTrialUsageWarning = trialActive && trialUsageRatio >= 0.8;
  const showWorkspaceActions = !blockingOnboarding && hasProvisionedAgent;
  const agentNoticeStorageKey = useMemo(
    () => `${WORKSPACE_AGENT_NOTICE_DISMISSED_KEY}:${displayOrgName}:${displayAgentName}`,
    [displayAgentName, displayOrgName],
  );

  useLayoutEffect(() => {
    seedManagedWorkspaceSettings(gatewayUrl, sessionKey);
    setReady(true);
  }, [gatewayUrl, sessionKey]);

  useEffect(() => {
    try {
      sessionStorage.removeItem(WORKSPACE_BOOTSTRAP_ATTEMPTS_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    setGuideOpen(mediaQuery.matches);
  }, []);

  useLayoutEffect(() => {
    try {
      setAgentNoticeOpen(window.localStorage.getItem(agentNoticeStorageKey) !== "true");
    } catch {
      setAgentNoticeOpen(true);
    }
  }, [agentNoticeStorageKey]);

  useLayoutEffect(() => {
    if (!showUserProfileOnboarding) {
      return;
    }
    try {
      setProfileStepTwoKicker(sessionStorage.getItem(WORKSPACE_EXPECT_PROFILE_STEP2_KEY) === "1");
    } catch {
      setProfileStepTwoKicker(false);
    }
  }, [showUserProfileOnboarding]);

  useEffect(() => {
    setOnboardingProfile(initialProfile);
    setOnboardingComplete(!requiresOnboarding);
    setOnboardingError(null);
  }, [initialProfile, requiresOnboarding]);

  useEffect(() => {
    setProvisioningError(null);
  }, [hasProvisionedAgent]);

  useEffect(() => {
    if (!panelOpen || blockingOnboarding) {
      return;
    }

    let cancelled = false;
    const loadActivity = async () => {
      setLoading(true);
      setActivityError(null);
      try {
        const response = await fetch("/api/observability/requests?limit=12", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: { items: RequestLogItem[] };
          error?: { message?: string };
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "Unable to load workspace activity.");
        }

        if (!cancelled) {
          setItems(payload.data.items);
          setSelectedSessionKey((current) => current ?? payload.data?.items.find((item) => item.sessionKey)?.sessionKey ?? null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setActivityError(fetchError instanceof Error ? fetchError.message : "Unable to load workspace activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [blockingOnboarding, panelOpen]);

  async function submitOnboarding() {
    if (normalizedOnboardingProfile.displayName.length < 2) {
      setOnboardingError("Add a display name with at least 2 characters.");
      return;
    }
    if (!normalizedOnboardingProfile.whatIDo) {
      setOnboardingError("Share a quick note about what you do.");
      return;
    }
    if (!normalizedOnboardingProfile.agentBrief) {
      setOnboardingError("Add a short note about how you like to work.");
      return;
    }

    setOnboardingSaving(true);
    setOnboardingError(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedOnboardingProfile),
      });
      const body = (await response.json()) as {
        data?: {
          displayName: string;
          whatIDo: string;
          agentBrief: string;
        };
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to save your onboarding answers.");
      }

      setOnboardingProfile({
        displayName: body.data.displayName,
        whatIDo: body.data.whatIDo,
        agentBrief: body.data.agentBrief,
      });
      setOnboardingComplete(true);
      setPanelOpen(false);
      try {
        sessionStorage.removeItem(WORKSPACE_EXPECT_PROFILE_STEP2_KEY);
      } catch {
        // ignore
      }
      router.refresh();
    } catch (saveError) {
      setOnboardingError(
        saveError instanceof Error ? saveError.message : "Unable to save your onboarding answers.",
      );
    } finally {
      setOnboardingSaving(false);
    }
  }

  const provisionAgent = useCallback(async () => {
    setProvisioning(true);
    setProvisioningError(null);

    try {
      const response = await fetch("/api/openclaw/bootstrap", {
        method: "POST",
      });
      const body = (await response.json()) as {
        data?: {
          created?: boolean;
          reason?: string;
        };
        error?: { message?: string; code?: string; retryAfterSeconds?: number };
      };

      const isProvisionRateLimited =
        response.status === 429 &&
        (body.error?.code === "runtime_rate_limit" ||
          (typeof body.error?.message === "string" && /too many setup changes/i.test(body.error.message)));

      if (isProvisionRateLimited) {
        const headerSec = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
        const fromBody =
          typeof body.error?.retryAfterSeconds === "number" && Number.isFinite(body.error.retryAfterSeconds)
            ? body.error.retryAfterSeconds
            : null;
        const fromMessage =
          typeof body.error?.message === "string"
            ? (() => {
                const m = /try again in (\d+) seconds?/i.exec(body.error.message);
                return m ? Number.parseInt(m[1], 10) : null;
              })()
            : null;
        const sec = Math.min(
          120,
          Math.max(1, fromBody ?? (Number.isFinite(headerSec) ? headerSec : fromMessage ?? 15)),
        );

        if (provisioningRateLimitAutoRetries.current >= MAX_PROVISION_RATE_LIMIT_ROUNDS) {
          setProvisioningError(
            body.error?.message ??
              "The runtime is still limiting setup changes. Wait a minute, then use Create my first agent again.",
          );
          return;
        }

        provisioningRateLimitAutoRetries.current += 1;
        setProvisioningRetrySeconds(sec);
        return;
      }

      if (!response.ok) {
        throw new Error(body.error?.message || "Unable to create your first agent.");
      }

      provisioningRateLimitAutoRetries.current = 0;
      setProvisioningRetrySeconds(null);

      if (!body.data) {
        throw new Error("Unable to create your first agent.");
      }

      router.refresh();
    } catch (bootstrapError) {
      setProvisioningError(
        bootstrapError instanceof Error ? bootstrapError.message : "Unable to create your first agent.",
      );
    } finally {
      setProvisioning(false);
    }
  }, [router]);

  provisionAgentRef.current = provisionAgent;

  useEffect(() => {
    if (provisioningRetrySeconds === null) {
      return undefined;
    }
    if (provisioningRetrySeconds <= 0) {
      setProvisioningRetrySeconds(null);
      queueMicrotask(() => void provisionAgentRef.current());
      return undefined;
    }
    const id = window.setTimeout(() => {
      setProvisioningRetrySeconds((s) => (s === null ? null : s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [provisioningRetrySeconds]);

  function dismissAgentNotice() {
    setAgentNoticeOpen(false);

    try {
      window.localStorage.setItem(agentNoticeStorageKey, "true");
    } catch {
      // Dismissing should still work for the current view when storage is unavailable.
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#05060a]">
      {showWorkspaceActions ? (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-[#05060a]/90 px-3 py-2 shadow-[0_16px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:flex-wrap sm:items-start sm:gap-3 sm:px-4 sm:py-3">
          {agentNoticeOpen ? (
            <div className="hidden max-w-xl rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:block">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Bot className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/55">Assigned company agent</p>
                  <h1 className="mt-1 truncate text-sm font-semibold text-white">{displayAgentName}</h1>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    This workspace is scoped to {displayOrgName}. Use the assigned agent for approved company work and
                    ask an admin when you need more tools, channels, or permissions.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 size-8 text-white/55 hover:text-white"
                  aria-label="Dismiss assigned agent notice"
                  onClick={dismissAgentNotice}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <div aria-hidden="true" />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">Assistant</p>
              <p className="truncate text-sm font-semibold text-white">{displayAgentName}</p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:flex-wrap sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => setGuideOpen((current) => !current)}
            >
              {guideOpen ? "Hide guide" : "Show guide"}
            </Button>
            <Button type="button" variant="secondary" size="sm" asChild>
              <Link href="/workspace/knowledge">
                <BookOpen className="size-4" />
                <span>Knowledge</span>
              </Link>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPanelOpen((current) => !current)}>
              {panelOpen ? "Hide activity" : "Activity"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {ready && !blockingOnboarding && hasProvisionedAgent && embeddedConsoleUrl ? (
          <iframe
            key={embeddedConsoleUrl}
            ref={iframeRef}
            src={embeddedConsoleUrl}
            title="Saint AGI Workspace"
            className={
              showWorkspaceActions
                ? "h-[calc(100svh-3.5rem)] min-h-[34rem] w-full border-0 bg-[#05060a] sm:h-[calc(100svh-5rem)] sm:min-h-[36rem] md:h-[calc(100dvh-5rem)]"
                : "min-h-screen w-full border-0 bg-[#05060a]"
            }
            onLoad={() => hideManagedSessionControls(iframeRef.current)}
          />
        ) : (
          <div
            className={
              showWorkspaceActions
                ? "h-[calc(100svh-3.5rem)] min-h-[34rem] w-full bg-[#05060a] sm:h-[calc(100svh-5rem)] sm:min-h-[36rem] md:h-[calc(100dvh-5rem)]"
                : "min-h-screen w-full bg-[#05060a]"
            }
            aria-hidden="true"
          />
        )}
      </div>
      {error ? (
        <div className="pointer-events-none fixed bottom-4 left-4 z-10 rounded-2xl border border-amber-400/30 bg-black/70 px-4 py-3 text-sm text-amber-200 backdrop-blur">
          {error}
        </div>
      ) : null}
      {showTrialUsageWarning && !error ? (
        <div className="fixed bottom-4 left-4 z-10 max-w-md rounded-2xl border border-amber-400/30 bg-black/80 px-4 py-3 text-sm text-amber-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          Trial usage: {trialMessageCount} of {trialMessageLimit} messages used. Upgrade and top up before the trial
          workspace locks.
        </div>
      ) : null}
      {guideOpen && showWorkspaceActions ? (
        <div className="fixed bottom-4 left-4 z-20 hidden w-[min(92vw,28rem)] rounded-[1.5rem] border border-white/10 bg-[#090b10]/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/55">Workspace guide</p>
              <h2 className="mt-1 text-sm font-semibold text-white">Start with a concrete business request.</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setGuideOpen(false)}>
              Dismiss
            </Button>
          </div>

          <div className="mt-4 grid gap-2">
            <StarterPrompt text="Summarize what you can help me with in this company workspace." />
            <StarterPrompt text="Help me turn this task into next steps, owners, and a follow-up message." />
            <StarterPrompt text="What company knowledge or channel access would make this workflow stronger?" />
          </div>

          <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/65 sm:grid-cols-3">
            <WorkspaceHint icon={MessageSquareText} title="Chat" text="Ask the agent to plan, draft, summarize, or route work." />
            <WorkspaceHint icon={BookOpen} title="Knowledge" text="Add personal context or docs when the answer needs grounding." />
            <WorkspaceHint
              icon={ShieldCheck}
              title="Control"
              text={canManageAgents ? "Use admin setup for tools and channels." : "Ask an admin for tools and channels."}
            />
          </div>
        </div>
      ) : null}
      {panelOpen && showWorkspaceActions ? (
        <div className="fixed inset-y-4 right-4 z-20 w-[min(92vw,32rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090b10]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">Activity</p>
                <p className="mt-1 text-sm font-medium text-white">Workspace telemetry</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPanelOpen(false)} aria-label="Close activity panel">
                <X className="size-4" />
              </Button>
            </div>
            {activityError ? <p className="text-sm text-amber-200">{activityError}</p> : null}
            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="min-h-0 overflow-auto">
                <RequestLogTable
                  items={items}
                  selectedSessionKey={selectedSessionKey}
                  onSelectSession={setSelectedSessionKey}
                  loading={loading}
                  compact
                />
              </div>
              <div className="min-h-0 overflow-auto">
                <SessionLogTail sessionKey={selectedSessionKey} title="Assigned session tail" compact />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showProvisioningState ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#05060a]/96 px-4 py-20">
          <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
            <CardHeader>
              <CardTitle>{canProvisionAgent ? "Create your first agent" : "Waiting for your agent"}</CardTitle>
              <CardDescription>
                {canProvisionAgent
                  ? "Your workspace stays empty until you explicitly provision one default agent. Additional agents are created from Agents and follow your plan limits and billing rules."
                  : "Your workspace will activate once an admin provisions and assigns a company agent to you."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {canProvisionAgent && (provisioning || (provisioningRetrySeconds ?? 0) > 0) ? (
                <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-6 py-8 text-center">
                  <div className="mx-auto flex size-28 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/saint-agi-mark.svg"
                      alt=""
                      width={72}
                      height={72}
                      className="h-[4.5rem] w-auto animate-[spin_2.8s_linear_infinite] opacity-95"
                    />
                  </div>
                  <p className="mt-6 text-lg font-semibold leading-7 text-white">
                    {(provisioningRetrySeconds ?? 0) > 0
                      ? "Almost there. Your workspace runtime is catching up."
                      : "Your first agent is taking shape."}
                  </p>
                  {(provisioningRetrySeconds ?? 0) > 0 ? (
                    <div className="mt-3">
                      <p className="text-5xl font-semibold tabular-nums tracking-tight text-white">
                        {provisioningRetrySeconds}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">seconds until we retry for you automatically</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-400">This usually takes just a moment on first setup.</p>
                  )}
                  <ul className="mt-8 space-y-3 text-left text-sm leading-6 text-zinc-400">
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                      <span>
                        We connect your company agent to the governed runtime, your models, and workspace policies.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                      <span>
                        When chat opens, you can delegate planning, drafting, and synthesis with your company context in
                        mind.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                      <span>
                        A brief pause protects the shared runtime when many teams provision at once. Thank you for your
                        patience.
                      </span>
                    </li>
                  </ul>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <Bot className="size-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    {canProvisionAgent ? (
                      <>
                        <p className="font-medium text-white">Provisioning creates one default agent</p>
                        <p className="text-zinc-400">
                          This uses your included agent allowance when available. Model, tool, and channel activity are
                          still recorded as usage for billing and audit history.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-white">Agent access is admin-managed</p>
                        <p className="text-zinc-400">
                          Ask a workspace admin to create or assign a business agent for your role. Once assigned, this
                          workspace will load automatically.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {provisioningError && (provisioningRetrySeconds === null || provisioningRetrySeconds <= 0) ? (
                <p className="text-sm text-red-400">{provisioningError}</p>
              ) : null}

              {canProvisionAgent ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => void provisionAgent()}
                    disabled={provisioning || (provisioningRetrySeconds !== null && provisioningRetrySeconds > 0)}
                  >
                    {provisioning ? <LoaderCircle className="size-4 animate-spin" /> : null}
                    <span>
                      {provisioning
                        ? "Creating agent..."
                        : (provisioningRetrySeconds ?? 0) > 0
                          ? `Wait ${provisioningRetrySeconds}s`
                          : "Create my first agent"}
                    </span>
                  </Button>
                  <Button type="button" variant="secondary" asChild>
                    <Link href="/agents/new">Open advanced setup</Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
      {showCompanyContextOnboarding ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05060a]/96 px-4 py-20">
          <WorkspaceCompanyContextOnboarding
            orgName={orgName ?? "your organization"}
            initialWebsite={initialOrgContext.website}
            initialCompanySummary={initialOrgContext.companySummary}
            initialAgentBrief={initialOrgContext.agentBrief}
            companyOnboardingSequence={
              onboardingSequence === "company_then_profile" ? "company_then_profile" : "company_only"
            }
          />
        </div>
      ) : null}
      {showUserProfileOnboarding ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05060a]/96 px-4 py-20">
          <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
            <CardHeader>
              {profileStepTwoKicker ? (
                <p className="app-kicker text-white/55">Step 2 of 2 · Your profile</p>
              ) : null}
              <CardTitle>Help your agent get to know you</CardTitle>
              <CardDescription>
                Answer a few quick questions before you enter the workspace. Your answers help personalize your
                agents and will be reused the next time you launch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="app-field-label" htmlFor="workspace-onboarding-display-name">
                  What should your agent call you?
                </label>
                <Input
                  id="workspace-onboarding-display-name"
                  value={onboardingProfile.displayName}
                  onChange={(event) =>
                    setOnboardingProfile((current) => ({ ...current, displayName: event.target.value }))
                  }
                  maxLength={80}
                  placeholder="Your preferred name"
                  disabled={onboardingSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="app-field-label" htmlFor="workspace-onboarding-what-i-do">
                  What do you do day to day?
                </label>
                <Textarea
                  id="workspace-onboarding-what-i-do"
                  value={onboardingProfile.whatIDo}
                  onChange={(event) =>
                    setOnboardingProfile((current) => ({ ...current, whatIDo: event.target.value }))
                  }
                  maxLength={160}
                  placeholder="Example: I lead product and spend most of my time with customers, specs, and roadmap work."
                  disabled={onboardingSaving}
                  className="min-h-28"
                />
                <p className="text-xs text-zinc-500">{normalizedOnboardingProfile.whatIDo.length}/160 characters</p>
              </div>

              <div className="space-y-2">
                <label className="app-field-label" htmlFor="workspace-onboarding-agent-brief">
                  What should your agent keep in mind about how you work?
                </label>
                <Textarea
                  id="workspace-onboarding-agent-brief"
                  value={onboardingProfile.agentBrief}
                  onChange={(event) =>
                    setOnboardingProfile((current) => ({ ...current, agentBrief: event.target.value }))
                  }
                  maxLength={280}
                  placeholder="Share your priorities, working style, or preferences for how your agent should support you."
                  disabled={onboardingSaving}
                  className="min-h-32"
                />
                <p className="text-xs text-zinc-500">{normalizedOnboardingProfile.agentBrief.length}/280 characters</p>
              </div>

              {onboardingError ? <p className="text-sm text-red-400">{onboardingError}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={submitOnboarding} disabled={onboardingSaving}>
                  {onboardingSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  <span>{onboardingSaving ? "Saving..." : "Continue"}</span>
                </Button>
                <p className="text-sm leading-6 text-zinc-500">
                  This profile is lightweight context. You can update it later from your account settings before or
                  after creating your first agent.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function StarterPrompt({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-white/80">
      {text}
    </div>
  );
}

function WorkspaceHint({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-white">
        <Icon className="size-3.5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="mt-1 text-white/55">{text}</p>
    </div>
  );
}
