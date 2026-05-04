export function calculateNextBalance(
  currentBalanceCents: number,
  amountCents: number,
  direction: "credit" | "debit",
) {
  return direction === "credit"
    ? currentBalanceCents + amountCents
    : currentBalanceCents - amountCents;
}

export const LLM_USAGE_MARKUP_PERCENT = 30;

export function applyLlmUsageMarkup(
  providerCostCents: number,
  markupPercent = LLM_USAGE_MARKUP_PERCENT,
) {
  if (providerCostCents <= 0) {
    return 0;
  }

  return Math.ceil(providerCostCents * (1 + markupPercent / 100));
}

