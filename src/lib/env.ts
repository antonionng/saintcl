export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openClawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL,
  openClawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN,
  openClawVendorDir: process.env.OPENCLAW_VENDOR_DIR,
  openClawRuntimeRoot: process.env.OPENCLAW_RUNTIME_ROOT,
  openClawBasePort: Number(process.env.OPENCLAW_BASE_PORT || 18789),
  openClawDefaultModel: process.env.OPENCLAW_DEFAULT_MODEL || "anthropic/claude-sonnet-4",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isStripeConfigured() {
  return Boolean(env.stripeSecretKey);
}

export function isOpenClawConfigured() {
  return Boolean(env.openClawGatewayUrl || env.openClawVendorDir);
}

export function isOpenClawRuntimeManaged() {
  return Boolean(env.openClawVendorDir || env.openClawRuntimeRoot);
}
