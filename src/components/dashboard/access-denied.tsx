import { Lock } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to access this area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={Lock}
      title={title}
      description={description}
    />
  );
}

