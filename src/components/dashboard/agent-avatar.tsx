import { getAgentAvatarTheme } from "@/lib/agent-identity";
import { cn } from "@/lib/utils";

export function AgentAvatar({
  agentId,
  name,
  className,
  initialsClassName,
  initials,
  theme,
  imageUrl,
}: {
  agentId: string;
  name: string;
  className?: string;
  initialsClassName?: string;
  initials?: string | null;
  theme?: number | null;
  imageUrl?: string | null;
}) {
  const avatarTheme = getAgentAvatarTheme(agentId, name, { initials, theme });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-white/10 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${avatarTheme.from}, ${avatarTheme.to})`,
      }}
      aria-label={`${name} avatar`}
    >
      {imageUrl ? (
        // Agent avatar URLs are signed at render time, so a plain img keeps this component framework-agnostic.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`${name} avatar`} className="h-full w-full rounded-[inherit] object-cover" />
      ) : (
        <span className={initialsClassName}>{avatarTheme.initials}</span>
      )}
    </div>
  );
}
