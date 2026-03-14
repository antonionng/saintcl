export function calculateNextBalance(
  currentBalanceCents: number,
  amountCents: number,
  direction: "credit" | "debit",
) {
  return direction === "credit"
    ? currentBalanceCents + amountCents
    : currentBalanceCents - amountCents;
}

