import { ChannelsStatusSnapshot } from "../types.ts";
import type { ChannelsState } from "./channels.types.ts";
import {
  formatMissingOperatorReadScopeMessage,
  isMissingOperatorReadScopeError,
} from "./scope-errors.ts";

export type { ChannelsState };

const MISSING_MANAGED_WHATSAPP_ACCOUNT_MESSAGE =
  "WhatsApp login is blocked because this managed workspace is missing its agent-scoped account id.";

function resolveWorkspaceWhatsAppAccountId(): { accountId?: string; missingManagedAccount: boolean } {
  if (typeof window === "undefined") {
    return { missingManagedAccount: false };
  }
  const params = new URLSearchParams(window.location.search);
  const accountId = params.get("whatsappAccountId")?.trim() || undefined;
  const managedRuntime = params.get("managedRuntime") === "true";
  return { accountId, missingManagedAccount: managedRuntime && !accountId };
}

function requireWorkspaceWhatsAppAccountId(state: ChannelsState): string | undefined {
  const resolved = resolveWorkspaceWhatsAppAccountId();
  if (!resolved.missingManagedAccount) {
    return resolved.accountId;
  }
  state.whatsappLoginMessage = MISSING_MANAGED_WHATSAPP_ACCOUNT_MESSAGE;
  state.whatsappLoginQrDataUrl = null;
  state.whatsappLoginConnected = null;
  return undefined;
}

export async function loadChannels(state: ChannelsState, probe: boolean) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.channelsLoading) {
    return;
  }
  state.channelsLoading = true;
  state.channelsError = null;
  try {
    const res = await state.client.request<ChannelsStatusSnapshot | null>("channels.status", {
      probe,
      timeoutMs: 8000,
    });
    state.channelsSnapshot = res;
    state.channelsLastSuccess = Date.now();
  } catch (err) {
    if (isMissingOperatorReadScopeError(err)) {
      state.channelsSnapshot = null;
      state.channelsError = formatMissingOperatorReadScopeMessage("channel status");
    } else {
      state.channelsError = String(err);
    }
  } finally {
    state.channelsLoading = false;
  }
}

export async function startWhatsAppLogin(state: ChannelsState, force: boolean) {
  if (!state.client || !state.connected || state.whatsappBusy) {
    return;
  }
  const accountId = requireWorkspaceWhatsAppAccountId(state);
  if (accountId === undefined && typeof window !== "undefined") {
    const managedRuntime = new URLSearchParams(window.location.search).get("managedRuntime") === "true";
    if (managedRuntime) return;
  }
  state.whatsappBusy = true;
  try {
    const res = await state.client.request<{
      message?: string;
      qrDataUrl?: string;
      connected?: boolean;
    }>("web.login.start", {
      accountId,
      force,
      timeoutMs: 30000,
    });
    state.whatsappLoginMessage = res.message ?? null;
    state.whatsappLoginQrDataUrl = res.qrDataUrl ?? null;
    state.whatsappLoginConnected = typeof res.connected === "boolean" ? res.connected : null;
  } catch (err) {
    state.whatsappLoginMessage = String(err);
    state.whatsappLoginQrDataUrl = null;
    state.whatsappLoginConnected = null;
  } finally {
    state.whatsappBusy = false;
  }
}

export async function waitWhatsAppLogin(state: ChannelsState) {
  if (!state.client || !state.connected || state.whatsappBusy) {
    return;
  }
  const accountId = requireWorkspaceWhatsAppAccountId(state);
  if (accountId === undefined && typeof window !== "undefined") {
    const managedRuntime = new URLSearchParams(window.location.search).get("managedRuntime") === "true";
    if (managedRuntime) return;
  }
  state.whatsappBusy = true;
  try {
    const res = await state.client.request<{
      message?: string;
      connected?: boolean;
      qrDataUrl?: string;
    }>("web.login.wait", {
      accountId,
      timeoutMs: 120000,
      currentQrDataUrl: state.whatsappLoginQrDataUrl ?? undefined,
    });
    state.whatsappLoginMessage = res.message ?? null;
    state.whatsappLoginConnected = res.connected ?? null;
    if (res.qrDataUrl) {
      state.whatsappLoginQrDataUrl = res.qrDataUrl;
    } else if (res.connected) {
      state.whatsappLoginQrDataUrl = null;
    }
  } catch (err) {
    state.whatsappLoginMessage = String(err);
    state.whatsappLoginConnected = null;
  } finally {
    state.whatsappBusy = false;
  }
}

export async function logoutWhatsApp(state: ChannelsState) {
  if (!state.client || !state.connected || state.whatsappBusy) {
    return;
  }
  const accountId = requireWorkspaceWhatsAppAccountId(state);
  if (accountId === undefined && typeof window !== "undefined") {
    const managedRuntime = new URLSearchParams(window.location.search).get("managedRuntime") === "true";
    if (managedRuntime) return;
  }
  state.whatsappBusy = true;
  try {
    await state.client.request("channels.logout", {
      channel: "whatsapp",
      accountId,
    });
    state.whatsappLoginMessage = "Logged out.";
    state.whatsappLoginQrDataUrl = null;
    state.whatsappLoginConnected = null;
  } catch (err) {
    state.whatsappLoginMessage = String(err);
  } finally {
    state.whatsappBusy = false;
  }
}
