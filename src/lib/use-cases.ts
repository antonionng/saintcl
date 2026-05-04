import type { PersonaRecord } from "@/types";
import { getBuiltInPersonas } from "@/lib/personas";

export type UseCaseId =
  | "meeting-agent"
  | "customer-support"
  | "sales-sdr"
  | "internal-ops"
  | "engineering"
  | "marketing"
  | "executive-assistant";

export type UseCase = {
  id: UseCaseId;
  label: string;
  tagline: string;
  agentName: string;
  personaId: string;
  suggestedAppIds: string[];
  description: string;
};

export const USE_CASES: readonly UseCase[] = [
  {
    id: "meeting-agent",
    label: "Meeting Agent",
    tagline: "Summarize calls, capture decisions, and draft follow-ups.",
    agentName: "Meeting Agent",
    personaId: "operations-coordinator",
    suggestedAppIds: ["slack-channel"],
    description: "A reliable meeting operator that turns conversations into decisions, owners, and next steps.",
  },
  {
    id: "customer-support",
    label: "Support Agent",
    tagline: "Answer customer questions, deflect tickets, escalate when needed.",
    agentName: "Support Agent",
    personaId: "customer-support",
    suggestedAppIds: ["telegram-channel", "slack-channel", "brave-search"],
    description: "A calm, helpful agent that resolves issues and stays grounded in your knowledge base.",
  },
  {
    id: "sales-sdr",
    label: "Sales Agent",
    tagline: "Qualify leads, send follow-ups, push the pipeline forward.",
    agentName: "Sales Agent",
    personaId: "sales-representative",
    suggestedAppIds: ["slack-channel", "brave-search"],
    description: "Outreach, qualification, and follow-through to keep deals moving.",
  },
  {
    id: "internal-ops",
    label: "Ops Agent",
    tagline: "Coordinate work, summarize updates, keep teams in sync.",
    agentName: "Operations Agent",
    personaId: "operations-coordinator",
    suggestedAppIds: ["slack-channel"],
    description: "Reliable execution support that turns messy work into clear next steps.",
  },
  {
    id: "engineering",
    label: "Engineering Agent",
    tagline: "Code review, debugging, technical research, and docs.",
    agentName: "Engineering Agent",
    personaId: "software-engineer",
    suggestedAppIds: ["browser", "duckduckgo-search"],
    description: "A pragmatic engineer that explains trade-offs and writes maintainable code.",
  },
  {
    id: "marketing",
    label: "Marketing Agent",
    tagline: "Draft copy, plan campaigns, position your product.",
    agentName: "Marketing Agent",
    personaId: "marketing-specialist",
    suggestedAppIds: ["brave-search"],
    description: "Concrete drafts and campaign ideas that fit your audience.",
  },
  {
    id: "executive-assistant",
    label: "Executive Assistant",
    tagline: "Calendars, communications, follow-ups, and brain offloads.",
    agentName: "EA Agent",
    personaId: "executive-assistant",
    suggestedAppIds: ["slack-channel"],
    description: "A sharp EA that keeps work organized and you focused.",
  },
] as const;

export function getUseCase(id?: string | null): UseCase | null {
  if (!id) return null;
  return USE_CASES.find((entry) => entry.id === id) ?? null;
}

export function getPersonaForUseCase(id?: string | null): PersonaRecord | null {
  const useCase = getUseCase(id);
  if (!useCase) return null;
  return getBuiltInPersonas().find((persona) => persona.id === useCase.personaId) ?? null;
}
