"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TrainingScope } from "@/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ParticipantNote = {
  id: string;
  bodyMarkdown: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

type Props = {
  inviteCode: string;
  moduleSlug: string;
  scope: TrainingScope;
  scopeId?: string | null;
  placeholder?: string;
  label?: string;
  helperText?: string;
  compact?: boolean;
  className?: string;
  showShareWithFacilitator?: boolean;
  initialNote?: ParticipantNote | null;
};

const DEFAULT_PLACEHOLDER = "Capture your thinking here. Notes save automatically.";

export function ParticipantNotes({
  inviteCode,
  moduleSlug,
  scope,
  scopeId,
  placeholder = DEFAULT_PLACEHOLDER,
  label,
  helperText,
  compact = false,
  className = "",
  showShareWithFacilitator = true,
  initialNote = null,
}: Props) {
  const [body, setBody] = useState(initialNote?.bodyMarkdown ?? "");
  const [shared, setShared] = useState(
    Boolean(initialNote?.metadata && (initialNote.metadata as { sharedWithFacilitator?: boolean }).sharedWithFacilitator),
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(initialNote !== null);
  const debounceTimerRef = useRef<number | null>(null);
  const latestSentRef = useRef<{ body: string; shared: boolean } | null>(
    initialNote
      ? { body: initialNote.bodyMarkdown, shared }
      : null,
  );
  const initialFetchedRef = useRef(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      inviteCode,
      moduleSlug,
      scope,
    });
    if (scopeId) params.set("scopeId", scopeId);
    return params.toString();
  }, [inviteCode, moduleSlug, scope, scopeId]);

  // Hydrate from server when no initialNote was provided.
  useEffect(() => {
    if (initialFetchedRef.current) return;
    if (initialNote !== null) {
      initialFetchedRef.current = true;
      return;
    }
    initialFetchedRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/training/participant/notes?${queryString}`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { data?: ParticipantNote[] };
        const note = payload.data?.[0];
        if (note) {
          setBody(note.bodyMarkdown ?? "");
          const isShared = Boolean(
            note.metadata && (note.metadata as { sharedWithFacilitator?: boolean }).sharedWithFacilitator,
          );
          setShared(isShared);
          latestSentRef.current = { body: note.bodyMarkdown ?? "", shared: isShared };
        }
      } catch {
        // Soft-fail: empty notes are fine.
      } finally {
        if (!cancelled) setHasHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialNote, queryString]);

  const persistNow = useCallback(
    async (nextBody: string, nextShared: boolean) => {
      const previous = latestSentRef.current;
      if (previous && previous.body === nextBody && previous.shared === nextShared) {
        return;
      }
      latestSentRef.current = { body: nextBody, shared: nextShared };
      setStatus("saving");
      setErrorMessage(null);
      try {
        const response = await fetch("/api/training/participant/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteCode,
            moduleSlug,
            scope,
            scopeId: scopeId ?? null,
            bodyMarkdown: nextBody,
            metadata: { sharedWithFacilitator: nextShared },
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message ?? "Unable to save note.");
        }
        setStatus("saved");
      } catch (caught) {
        setStatus("error");
        setErrorMessage(caught instanceof Error ? caught.message : "Unable to save note.");
        // Re-allow retry by clearing the previous send marker.
        latestSentRef.current = previous;
      }
    },
    [inviteCode, moduleSlug, scope, scopeId],
  );

  const scheduleSave = useCallback(
    (nextBody: string, nextShared: boolean) => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        void persistNow(nextBody, nextShared);
      }, 600);
    },
    [persistNow],
  );

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setBody(value);
    setStatus("saving");
    scheduleSave(value, shared);
  };

  const handleShareToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setShared(next);
    scheduleSave(body, next);
  };

  // Flush pending edits if the participant navigates away.
  useEffect(() => {
    function flush() {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const pending = { body, shared };
      const previous = latestSentRef.current;
      if (previous && previous.body === pending.body && previous.shared === pending.shared) {
        return;
      }
      try {
        const payload = JSON.stringify({
          inviteCode,
          moduleSlug,
          scope,
          scopeId: scopeId ?? null,
          bodyMarkdown: pending.body,
          metadata: { sharedWithFacilitator: pending.shared },
        });
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/training/participant/notes", blob);
          latestSentRef.current = pending;
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [body, shared, inviteCode, moduleSlug, scope, scopeId]);

  const statusLabel = (() => {
    if (!hasHydrated) return "Loading notes...";
    if (status === "saving") return "Saving...";
    if (status === "saved") return "Saved";
    if (status === "error") return errorMessage ?? "Save failed";
    return body.length > 0 ? "Saved" : "Empty";
  })();

  const statusTone =
    status === "error"
      ? "text-rose-600"
      : status === "saving"
        ? "text-slate-500"
        : "text-emerald-600";

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 ${className}`}
      data-scope={scope}
      data-scope-id={scopeId ?? ""}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label ?? "Your notes"}
        </span>
        <span className={`text-[11px] font-medium ${statusTone}`}>{statusLabel}</span>
      </div>
      {helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
      <textarea
        value={body}
        onChange={handleChange}
        placeholder={placeholder}
        rows={compact ? 3 : 6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        spellCheck
      />
      {showShareWithFacilitator ? (
        <label className="flex items-center gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={shared}
            onChange={handleShareToggle}
            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          Share with facilitator
        </label>
      ) : null}
    </div>
  );
}

export default ParticipantNotes;
