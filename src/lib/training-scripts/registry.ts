import type { ModuleScriptPack } from "./types";

import programmeOrientationPack from "./programme-orientation";
import pythonForDataPack from "./python-for-data";

const registry: Record<string, ModuleScriptPack> = {
  [programmeOrientationPack.moduleSlug]: programmeOrientationPack,
  [pythonForDataPack.moduleSlug]: pythonForDataPack,
};

export function getModuleScriptPack(moduleSlug: string): ModuleScriptPack | null {
  return registry[moduleSlug] ?? null;
}

export const moduleScriptPacks = registry;
