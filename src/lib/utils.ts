import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const BILLING_CURRENCY = "GBP";
export const BILLING_LOCALE = "en-GB";
export const USD_TO_GBP_RATE = 0.79;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) {
  return new Intl.NumberFormat(options?.locale ?? BILLING_LOCALE, {
    style: "currency",
    currency: options?.currency ?? BILLING_CURRENCY,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(BILLING_LOCALE).format(value);
}

export function convertUsdToBillingCents(amountUsd: number) {
  return Math.round(amountUsd * USD_TO_GBP_RATE * 100);
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL?.replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}
