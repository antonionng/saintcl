import { getUserAvatarInitials } from "@/lib/account-profile";
import { cn } from "@/lib/utils";

export function UserAvatar({
  avatarUrl,
  displayName,
  email,
  className,
  initialsClassName,
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  className?: string;
  initialsClassName?: string;
}) {
  const initials = getUserAvatarInitials({ displayName, email });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white",
        className,
      )}
      aria-label={displayName ?? email ?? "Account avatar"}
    >
      {avatarUrl ? (
        // Signed Supabase avatar URLs are generated at request time, so plain img is the simplest stable option here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={displayName ?? email ?? "Account avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className={initialsClassName}>{initials}</span>
      )}
    </div>
  );
}
