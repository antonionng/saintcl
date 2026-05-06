export type BillingGateCode =
  | "TRIAL_PAID_MODEL_BLOCKED"
  | "WALLET_INSUFFICIENT"
  | "WALLET_BELOW_APPROVAL_THRESHOLD"
  | "PREMIUM_REQUIRES_APPROVAL"
  | "USER_HARD_LIMIT_REACHED";

export type BillingGateCta = "upgrade" | "topup" | "approval" | null;

const BILLING_GATE_FLAG = Symbol.for("saintagi.billing-gate-error");

export class BillingGateError extends Error {
  readonly code: BillingGateCode;
  readonly cta: BillingGateCta;
  readonly status: number;
  readonly [BILLING_GATE_FLAG] = true;

  constructor(params: {
    code: BillingGateCode;
    message: string;
    cta?: BillingGateCta;
    status?: number;
  }) {
    super(params.message);
    this.name = "BillingGateError";
    this.code = params.code;
    this.cta = params.cta ?? defaultCtaForCode(params.code);
    this.status = params.status ?? 402;
  }
}

export function isBillingGateError(value: unknown): value is BillingGateError {
  return (
    value instanceof BillingGateError ||
    (typeof value === "object" && value !== null && (value as Record<symbol, unknown>)[BILLING_GATE_FLAG] === true)
  );
}

export function billingGateErrorToJson(error: BillingGateError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      cta: error.cta,
    },
  };
}

function defaultCtaForCode(code: BillingGateCode): BillingGateCta {
  switch (code) {
    case "TRIAL_PAID_MODEL_BLOCKED":
      return "upgrade";
    case "WALLET_INSUFFICIENT":
    case "WALLET_BELOW_APPROVAL_THRESHOLD":
      return "topup";
    case "PREMIUM_REQUIRES_APPROVAL":
      return "approval";
    case "USER_HARD_LIMIT_REACHED":
      return null;
    default:
      return null;
  }
}
