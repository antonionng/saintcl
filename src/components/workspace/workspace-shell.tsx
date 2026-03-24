"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BookOpen, Bot, LoaderCircle } from "lucide-react";

import { RequestLogTable, type RequestLogItem } from "@/components/dashboard/request-log-table";
import { SessionLogTail } from "@/components/dashboard/session-log-tail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const OPENCLAW_CONTROL_SETTINGS_KEY = "openclaw.control.settings.v1";

type WorkspaceShellProps = {
  embeddedConsoleUrl?: string;
  gatewayUrl?: string;
  error?: string;
  requiresOnboarding?: boolean;
  hasProvisionedAgent?: boolean;
  initialProfile: {
    displayName: string;
    whatIDo: string;
    agentBrief: string;
  };
};

type PersistedControlUiSettings = {
  gatewayUrl?: string;
  [key: string]: unknown;
};

function seedManagedGatewayUrl(gatewayUrl?: string) {
  if (!gatewayUrl || typeof window === "undefined") {
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

    if (next.gatewayUrl === gatewayUrl) {
      return;
    }

    window.localStorage.setItem(
      OPENCLAW_CONTROL_SETTINGS_KEY,
      JSON.stringify({ ...next, gatewayUrl }),
    );
  } catch {
    window.localStorage.setItem(
      OPENCLAW_CONTROL_SETTINGS_KEY,
      JSON.stringify({ gatewayUrl }),
    );
  }
}

export function WorkspaceShell({
  embeddedConsoleUrl,
  gatewayUrl,
  error,
  requiresOnboarding = false,
  hasProvisionedAgent = true,
  initialProfile,
}: WorkspaceShellProps) {
  const router = useRouter();
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

  const normalizedOnboardingProfile = useMemo(
    () => ({
      displayName: onboardingProfile.displayName.trim(),
      whatIDo: onboardingProfile.whatIDo.trim(),
      agentBrief: onboardingProfile.agentBrief.trim(),
    }),
    [onboardingProfile],
  );
  const onboardingActive = !onboardingComplete;
  const showProvisioningState = !onboardingActive && !hasProvisionedAgent;

  useLayoutEffect(() => {
    seedManagedGatewayUrl(gatewayUrl);
    setReady(true);
  }, [gatewayUrl]);

  useEffect(() => {
    setOnboardingProfile(initialProfile);
    setOnboardingComplete(!requiresOnboarding);
    setOnboardingError(null);
  }, [initialProfile, requiresOnboarding]);

  useEffect(() => {
    setProvisioningError(null);
  }, [hasProvisionedAgent]);

  useEffect(() => {
    if (!panelOpen || onboardingActive) {
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
  }, [onboardingActive, panelOpen]);

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
      router.refresh();
    } catch (saveError) {
      setOnboardingError(
        saveError instanceof Error ? saveError.message : "Unable to save your onboarding answers.",
      );
    } finally {
      setOnboardingSaving(false);
    }
  }

  async function provisionAgent() {
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
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(body.error?.message || "Unable to create your first agent.");
      }

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
  }

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      {ready && !onboardingActive && hasProvisionedAgent && embeddedConsoleUrl ? (
        <iframe
          src={embeddedConsoleUrl}
          title="Saint AGI Workspace"
          className="min-h-screen w-full border-0 bg-[#05060a]"
        />
      ) : (
        <div className="min-h-screen w-full bg-[#05060a]" aria-hidden="true" />
      )}
      {error ? (
        <div className="pointer-events-none fixed bottom-4 left-4 z-10 rounded-2xl border border-amber-400/30 bg-black/70 px-4 py-3 text-sm text-amber-200 backdrop-blur">
          {error}
        </div>
      ) : null}
      {!onboardingActive && hasProvisionedAgent ? (
        <div className="fixed right-4 top-4 z-20 flex items-center gap-3">
          <Button type="button" variant="secondary" asChild>
            <Link href="/workspace/knowledge">
              <BookOpen className="size-4" />
              <span>Knowledge</span>
            </Link>
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPanelOpen((current) => !current)}>
            {panelOpen ? "Hide activity" : "View activity"}
          </Button>
        </div>
      ) : null}
      {panelOpen && !onboardingActive && hasProvisionedAgent ? (
        <div className="fixed inset-y-4 right-4 z-20 w-[min(92vw,32rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090b10]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
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
              <CardTitle>Create your first agent</CardTitle>
              <CardDescription>
                Your workspace stays empty until you explicitly provision an agent. We will create a starter agent,
                assign it to you, and then open chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <Bot className="size-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-white">Provisioning creates one default workspace agent</p>
                    <p className="text-zinc-400">
                      The starter agent uses your profile context, inherits current org guidance, and becomes your
                      default chat session.
                    </p>
                  </div>
                </div>
              </div>

              {provisioningError ? <p className="text-sm text-red-400">{provisioningError}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={provisionAgent} disabled={provisioning}>
                  {provisioning ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  <span>{provisioning ? "Creating agent..." : "Create my first agent"}</span>
                </Button>
                <Button type="button" variant="secondary" asChild>
                  <Link href="/agents/new">Open advanced setup</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {onboardingActive ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05060a]/96 px-4 py-20">
          <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
            <CardHeader>
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
