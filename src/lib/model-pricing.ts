type ModelBillingLike = {
  id?: string | null;
  isFree?: boolean;
  inputCostPerMillionCents?: number | null;
  outputCostPerMillionCents?: number | null;
  [key: string]: unknown;
};

export function isFreeModelId(modelId?: string | null) {
  return modelId?.trim().endsWith(":free") ?? false;
}

export function hasZeroRatedPricing(entry: Pick<ModelBillingLike, "inputCostPerMillionCents" | "outputCostPerMillionCents">) {
  return entry.inputCostPerMillionCents === 0 && entry.outputCostPerMillionCents === 0;
}

export function inferFreeModel(entry: ModelBillingLike) {
  if (entry.isFree === true) return true;
  if (isFreeModelId(entry.id)) return true;
  if (hasZeroRatedPricing(entry)) return true;
  return undefined;
}

export function isBillableModel(entry: ModelBillingLike) {
  return inferFreeModel(entry) !== true;
}

export function requiresWalletBalance(entry: ModelBillingLike, options?: { isSuperAdmin?: boolean }) {
  return !options?.isSuperAdmin && isBillableModel(entry);
}
