export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openClawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL,
  openClawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN,
  openClawVendorDir: process.env.OPENCLAW_VENDOR_DIR,
  openClawRuntimeRoot: process.env.OPENCLAW_RUNTIME_ROOT,
  openClawWorkspaceDir: process.env.OPENCLAW_WORKSPACE_DIR,
  openClawBasePort: Number(process.env.OPENCLAW_BASE_PORT || 18789),
  openClawDefaultModel: process.env.OPENCLAW_DEFAULT_MODEL || "openrouter/auto",
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeStarterMonthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  stripeStarterAnnualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  stripeProMonthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
  stripeProAnnualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
  stripeBusinessMonthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  stripeBusinessAnnualPriceId: process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || "Saint AGI <hello@saintagi.com>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "hello@saintagi.com",
  emailTokenSecret: process.env.EMAIL_TOKEN_SECRET,
  emailCronSecret: process.env.EMAIL_CRON_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isStripeConfigured() {
  return Boolean(env.stripeSecretKey);
}

export function isResendConfigured() {
  return Boolean(env.resendApiKey && env.emailTokenSecret);
}

export function isOpenClawConfigured() {
  return Boolean(env.openClawGatewayUrl || env.openClawVendorDir);
}

export function isOpenClawRuntimeManaged() {
  return Boolean(env.openClawVendorDir || env.openClawRuntimeRoot);
}
