"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { AgentAvatar } from "@/components/dashboard/agent-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AGENT_AVATAR_COLORS, getAgentAvatarTheme } from "@/lib/agent-identity";
import { cn } from "@/lib/utils";

export function AgentAvatarEditor({
  agentId,
  openclawAgentId,
  name,
  initialInitials,
  initialTheme,
  initialImageUrl,
  canEdit,
}: {
  agentId: string;
  openclawAgentId: string;
  name: string;
  initialInitials?: string | null;
  initialTheme?: number | null;
  initialImageUrl?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackTheme = getAgentAvatarTheme(openclawAgentId, name).theme;
  const [initials, setInitials] = useState(initialInitials ?? "");
  const [theme, setTheme] = useState(initialTheme ?? fallbackTheme);
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedInitials = initials.trim().toUpperCase().slice(0, 3);
  const dirty = normalizedInitials !== (initialInitials ?? "") || theme !== (initialTheme ?? fallbackTheme);

  async function saveAvatar() {
    if (!dirty) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarInitials: normalizedInitials || null,
          avatarTheme: theme,
        }),
      });
      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Unable to update avatar.");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update avatar.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setSaved(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/agents/${agentId}/avatar`, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        data?: { avatarUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Unable to upload avatar image.");
      }

      setImageUrl(body.data?.avatarUrl ?? null);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload avatar image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <AgentAvatar
          agentId={openclawAgentId}
          name={name}
          initials={normalizedInitials}
          theme={theme}
          imageUrl={imageUrl}
          className="size-12"
        />
        <div className="min-w-0 flex-1">
          <label className="app-field-label">Avatar initials</label>
          <Input
            value={initials}
            onChange={(event) => {
              setInitials(event.target.value.toUpperCase().slice(0, 3));
              setSaved(false);
            }}
            readOnly={!canEdit}
            placeholder={getAgentAvatarTheme(openclawAgentId, name).initials}
            className="mt-2 max-w-32"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {AGENT_AVATAR_COLORS.map(([from, to], index) => (
          <button
            key={`${from}-${to}`}
            type="button"
            onClick={() => {
              setTheme(index);
              setSaved(false);
            }}
            disabled={!canEdit}
            className={cn(
              "size-7 rounded-sm border transition-opacity disabled:cursor-not-allowed disabled:opacity-60",
              theme === index ? "border-white" : "border-white/10 hover:border-white/50",
            )}
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            aria-label={`Use avatar theme ${index + 1}`}
          />
        ))}
      </div>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || saving}
          >
            {uploading ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Camera className="mr-2 size-3.5" />}
            {uploading ? "Uploading..." : "Upload image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={uploadImage}
          />
          <Button type="button" variant="secondary" size="sm" onClick={saveAvatar} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : "Save avatar"}
          </Button>
          {saved ? <p className="text-xs text-emerald-400">Avatar synced to runtime.</p> : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
