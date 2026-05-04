"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type SettingsSectionTab = {
  id: string;
  label: string;
  description?: string;
  content: ReactNode;
};

export function SettingsSectionTabs({
  tabs,
  defaultTabId,
  className,
}: {
  tabs: SettingsSectionTab[];
  defaultTabId?: string;
  className?: string;
}) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <div className={cn("settings-panel overflow-hidden", className)}>
      <div className="flex flex-wrap gap-1 border-b border-border-subtle p-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "rounded-sm px-3 py-2 text-left text-[length:var(--text-sm)] font-medium transition-colors",
                active
                  ? "bg-white text-zinc-950"
                  : "text-white/60 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab.description ? (
        <div className="border-b border-border-subtle px-5 py-3">
          <p className="text-[length:var(--text-xs)] text-white/55">{activeTab.description}</p>
        </div>
      ) : null}
      <div>{activeTab.content}</div>
    </div>
  );
}
