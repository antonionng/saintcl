"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  Brain,
  Check,
  Loader2,
  MessageSquare,
  Plug,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wizard } from "@/components/ui/wizard";
import {
  CATEGORY_LABELS,
  SORTED_APP_CATEGORIES,
  sortCatalogApps,
  type AppCategory,
  type CatalogApp,
} from "@/lib/apps/catalog";

const CATEGORY_ICON: Record<AppCategory, React.ComponentType<{ className?: string }>> = {
  channel: MessageSquare,
  skill: Sparkles,
  search: Search,
  memory: Brain,
  tool: Wrench,
  mcp: Plug,
};

function AppLogo({ app, size = 32 }: { app: CatalogApp; size?: number }) {
  const [errored, setErrored] = useState(false);
  const Icon = CATEGORY_ICON[app.category] ?? Boxes;
  const px = `${size}px`;

  if (app.logo && !errored) {
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border-subtle"
        style={{ width: px, height: px }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={app.logo}
          alt={`${app.name} logo`}
          width={size}
          height={size}
          loading="lazy"
          className="h-3/5 w-3/5 object-contain"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-sm border border-border-subtle text-white/70"
      style={{ width: px, height: px }}
    >
      <Icon className="h-1/2 w-1/2" />
    </div>
  );
}

type AgentOption = { id: string; name: string };

type Props = {
  apps: CatalogApp[];
  installedAppIds: string[];
  agents: AgentOption[];
  defaultAgentId?: string | null;
};

const FILTERS: Array<{ id: AppCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  ...SORTED_APP_CATEGORIES.map((category) => ({ id: category, label: CATEGORY_LABELS[category] })),
];

export function AppsCatalog({ apps, installedAppIds, agents, defaultAgentId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<AppCategory | "all">(
    (searchParams.get("category") as AppCategory) ?? "all",
  );
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [showRoadmap, setShowRoadmap] = useState(searchParams.get("roadmap") === "1");
  const [activeApp, setActiveApp] = useState<CatalogApp | null>(null);
  const [recentlyInstalled, setRecentlyInstalled] = useState<string[]>([]);

  const installedSet = useMemo(
    () => new Set([...installedAppIds, ...recentlyInstalled]),
    [installedAppIds, recentlyInstalled],
  );

  const filteredApps = useMemo(() => {
    let items = showRoadmap ? apps : apps.filter((app) => app.install !== "oauth-soon");
    if (filter !== "all") items = items.filter((app) => app.category === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.oneLiner.toLowerCase().includes(q) ||
          app.vendor.toLowerCase().includes(q) ||
          app.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return sortCatalogApps(items);
  }, [apps, filter, search, showRoadmap]);

  const roadmapCount = useMemo(
    () => apps.filter((app) => app.install === "oauth-soon").length,
    [apps],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-sm border border-border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-sm px-2.5 py-1 text-[length:var(--text-xs)] font-medium transition-colors ${
                filter === f.id
                  ? "bg-white text-zinc-950"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant={showRoadmap ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowRoadmap((current) => !current)}
          >
            {showRoadmap ? "Hide roadmap" : `Show roadmap (${roadmapCount})`}
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps"
              className="h-9 pl-8"
            />
          </div>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-[length:var(--text-sm)] text-white/55">
          No available apps match this filter.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredApps.map((app) => {
            const installed = installedSet.has(app.id);
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setActiveApp(app)}
                className="group flex h-full flex-col gap-2 rounded-md border border-border bg-transparent p-4 text-left transition-colors hover:border-border-strong hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <AppLogo app={app} size={32} />
                  {installed ? (
                    <Badge variant="success" className="gap-1">
                      <Check className="h-3 w-3" />
                      Installed
                    </Badge>
                  ) : app.install === "oauth-soon" ? (
                    <Badge variant="default">Enterprise setup</Badge>
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-[length:var(--text-sm)] font-medium text-white">{app.name}</p>
                  <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                    {app.vendor}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[length:var(--text-xs)] text-white/60">
                    {app.oneLiner}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InstallAppDialog
        app={activeApp}
        agents={agents}
        defaultAgentId={defaultAgentId ?? agents[0]?.id ?? null}
        installed={activeApp ? installedSet.has(activeApp.id) : false}
        onClose={() => setActiveApp(null)}
        onInstalled={(appId) => {
          setRecentlyInstalled((prev) => [...prev, appId]);
          setActiveApp(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function InstallAppDialog({
  app,
  agents,
  defaultAgentId,
  installed,
  onClose,
  onInstalled,
}: {
  app: CatalogApp | null;
  agents: AgentOption[];
  defaultAgentId: string | null;
  installed: boolean;
  onClose: () => void;
  onInstalled: (appId: string) => void;
}) {
  const open = Boolean(app);
  const [step, setStep] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(defaultAgentId);
  const [tokenInput, setTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (app) {
      setStep(0);
      setAgentId(defaultAgentId);
      setTokenInput("");
      setError(null);
      setSubmitting(false);
      setSuccess(false);
    }
  }, [app, defaultAgentId]);

  if (!app) return null;

  const requiresToken = app.install === "paste-token";
  const isComingSoon = app.install === "oauth-soon";

  if (isComingSoon) {
    return (
      <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
        <DialogContent size="sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AppLogo app={app} size={32} />
              <div>
                <DialogTitle>{app.name}</DialogTitle>
                <p className="text-[length:var(--text-xs)] text-white/55">
                  {app.vendor} &middot; {CATEGORY_LABELS[app.category]}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <p className="text-[length:var(--text-sm)] text-white/70">
              {app.description ?? app.oneLiner}
            </p>
            <p className="mt-3 text-[length:var(--text-xs)] text-white/55">
              This connector needs enterprise setup before self-serve install. Request access so an admin or platform
              operator can confirm credentials, runtime requirements, and rollout timing.
            </p>
            {error ? (
              <p className="mt-3 rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
                {error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setSubmitting(true);
                setError(null);
                try {
                  const res = await fetch("/api/apps/install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ appId: app.id, requestAccess: true }),
                  });
                  if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.error ?? "Request failed.");
                  }
                  onInstalled(app.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Request failed.");
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>Request access</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  async function submit() {
    if (!app) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/apps/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: app.id,
          agentId,
          token: tokenInput || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Install failed.");
      }
      setSuccess(true);
      setTimeout(() => onInstalled(app.id), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Install failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = requiresToken ? ["Confirm", "Credentials", "Install"] : ["Confirm", "Install"];

  return (
    <Wizard
      open={open}
      onOpenChange={(v) => (!v ? onClose() : undefined)}
      title={installed ? `Reinstall ${app.name}` : `Install ${app.name}`}
      description={`${app.vendor} · ${CATEGORY_LABELS[app.category]}`}
      steps={steps}
      step={step}
      onStepChange={setStep}
      finalLabel={installed ? "Reinstall" : "Install"}
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={requiresToken ? !tokenInput : false}
      nextDisabled={false}
    >
      <Wizard.Step>
        <div className="flex items-start gap-3">
          <AppLogo app={app} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[length:var(--text-sm)] font-medium text-white">{app.name}</p>
            <p className="mt-1 text-[length:var(--text-xs)] text-white/60">
              {app.description ?? app.oneLiner}
            </p>
          </div>
        </div>
        {agents.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Bind to agent
            </label>
            <select
              value={agentId ?? ""}
              onChange={(e) => setAgentId(e.target.value || null)}
              className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 text-[length:var(--text-sm)] text-white"
            >
              <option value="">Org-wide</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {app.requiresEnv && app.requiresEnv.length > 0 ? (
          <p className="rounded-sm border border-border-subtle px-3 py-2 text-[length:var(--text-xs)] text-white/55">
            Uses a shared platform key. The platform handles credentials.
          </p>
        ) : null}
      </Wizard.Step>

      {requiresToken ? (
        <Wizard.Step>
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              {app.channelType === "telegram" ? "Telegram bot token" : "Bot token"}
            </label>
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="xoxb-..."
            />
            <p className="text-[length:var(--text-xs)] text-white/45">
              Stored encrypted and used only by this connector.
            </p>
          </div>
        </Wizard.Step>
      ) : null}

      <Wizard.Step>
        <ReviewRow label="App" value={app.name} />
        <ReviewRow label="Vendor" value={app.vendor} />
        <ReviewRow label="Category" value={CATEGORY_LABELS[app.category]} />
        <ReviewRow
          label="Bound to"
          value={agentId ? agents.find((a) => a.id === agentId)?.name ?? "-" : "Org-wide"}
        />
        {requiresToken ? (
          <ReviewRow
            label="Token"
            value={tokenInput ? tokenInput.replace(/.(?=.{4})/g, "*") : "-"}
          />
        ) : null}
        {success ? (
          <p className="rounded-sm border border-emerald-500/30 px-3 py-2 text-[length:var(--text-xs)] text-emerald-300">
            Installed successfully.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-sm)] text-white text-right break-all">
        {value}
      </span>
    </div>
  );
}
