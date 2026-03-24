"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, Sparkles } from "lucide-react";

import { UserAvatar } from "@/components/account/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentUserProfile } from "@/types";

export function AccountProfileForm({
  initialProfile,
  homePath,
}: {
  initialProfile: CurrentUserProfile;
  homePath: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [whatIDo, setWhatIDo] = useState(initialProfile.whatIDo);
  const [agentBrief, setAgentBrief] = useState(initialProfile.agentBrief);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasChanges = useMemo(
    () =>
      displayName.trim() !== savedProfile.displayName ||
      whatIDo.trim() !== savedProfile.whatIDo ||
      agentBrief.trim() !== savedProfile.agentBrief,
    [agentBrief, displayName, savedProfile, whatIDo],
  );

  async function saveProfile() {
    if (!hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          whatIDo: whatIDo.trim(),
          agentBrief: agentBrief.trim(),
        }),
      });
      const body = (await response.json()) as {
        data?: CurrentUserProfile;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to save account profile.");
      }

      setSavedProfile(body.data);
      setDisplayName(body.data.displayName);
      setWhatIDo(body.data.whatIDo);
      setAgentBrief(body.data.agentBrief);
      setAvatarUrl(body.data.avatarUrl ?? null);
      setSuccess("Profile saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save account profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        data?: CurrentUserProfile;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to upload avatar.");
      }

      setSavedProfile(body.data);
      setDisplayName(body.data.displayName);
      setWhatIDo(body.data.whatIDo);
      setAgentBrief(body.data.agentBrief);
      setAvatarUrl(body.data.avatarUrl ?? null);
      setSuccess("Avatar updated.");
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card id="profile" className="settings-panel scroll-mt-24">
        <CardHeader>
          <CardTitle>Personal profile</CardTitle>
          <CardDescription>
            Keep this short. It helps your agents understand who you are and what kind of work you do.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              email={savedProfile.email}
              className="size-20 rounded-[1.5rem] text-lg"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="text-sm leading-6 text-zinc-400">
                Upload a simple square image so your account feels recognizable across the workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  <span>{uploading ? "Uploading..." : "Upload avatar"}</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="app-field-label">Display name</label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              placeholder="How should your agents address you?"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="app-field-label">What do you do?</label>
            <Textarea
              value={whatIDo}
              onChange={(event) => setWhatIDo(event.target.value)}
              maxLength={160}
              placeholder="Example: I lead product and spend most of my day with customers, specs, and roadmap work."
              disabled={saving}
              className="min-h-28"
            />
            <p className="text-xs text-zinc-500">{whatIDo.trim().length}/160 characters</p>
          </div>

          <div className="space-y-2">
            <label className="app-field-label">Help your agents know you</label>
            <Textarea
              value={agentBrief}
              onChange={(event) => setAgentBrief(event.target.value)}
              maxLength={280}
              placeholder="Share your working style, priorities, or anything your agents should keep in mind."
              disabled={saving}
              className="min-h-32"
            />
            <p className="text-xs text-zinc-500">{agentBrief.trim().length}/280 characters</p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={saveProfile} disabled={!hasChanges || saving}>
              {saving ? "Saving..." : "Save profile"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href={homePath}>Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card id="details" className="settings-panel scroll-mt-24">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>These details stay tied to your signed-in account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Email</p>
              <p className="mt-2 text-white">{savedProfile.email ?? "Unknown email"}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Role</p>
              <p className="mt-2 text-white capitalize">{savedProfile.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card id="agent-context" className="settings-panel scroll-mt-24">
          <CardHeader>
            <CardTitle>How agents use this</CardTitle>
            <CardDescription>Keep the profile practical instead of polished.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="size-4 text-emerald-300" />
                Lightweight personal context
              </div>
              <p className="mt-3">
                Your profile gives agents a quick sense of your role, focus, and communication style without needing a
                long prompt every time.
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Best results</p>
              <p className="mt-2">
                Mention what you own, what matters most, and any preferences like concise updates, customer context,
                or decision-making style.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
