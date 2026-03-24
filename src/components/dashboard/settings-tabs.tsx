import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getVisibleSettingsTabs, type SettingsTabId } from "@/lib/settings-tabs";
import type { OrgCapabilities } from "@/types";

export function SettingsTabs({
  activeTab,
  capabilities,
}: {
  activeTab: SettingsTabId;
  capabilities: OrgCapabilities;
}) {
  const tabs = getVisibleSettingsTabs(capabilities);
  const groupedTabs = [
    {
      id: "organization",
      label: "Organization",
      items: tabs.filter((tab) => tab.section === "organization"),
    },
    {
      id: "operations",
      label: "Operations",
      items: tabs.filter((tab) => tab.section === "operations"),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <Card className="settings-panel h-fit">
      <CardContent className="space-y-5 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">Settings</p>
          <p className="text-xs leading-5 text-zinc-500">
            Workspace configuration, governance, billing, and security controls.
          </p>
        </div>
        <div className="space-y-5">
          {groupedTabs.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="px-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-zinc-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const active = tab.id === activeTab;

                  return (
                    <Link
                      key={tab.id}
                      href={`/settings?tab=${tab.id}`}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <div className="font-medium">{tab.label}</div>
                      <div className="mt-1 text-xs leading-5 text-zinc-500">
                        {tab.description}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
