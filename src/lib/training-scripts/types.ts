export type SlideScript = {
  slideNumber: number;
  deckId: string;
  day: 1 | 2 | 3;
  segment: string;
  coreMessage: string;
  sayThis: string[];
  presenterCues?: string[];
  showThis?: string;
  askThis?: string[];
  doThis?: string[];
  watchFor?: string[];
  landThePoint: string;
  transition?: string;
  estMinutes?: number;
};

export type SegmentBlock = {
  start: number;
  end: number;
  label: string;
  objective: string;
  delivery: string;
  facilitatorMoves: string[];
  debrief?: string[];
};

export type ParticipantActionKind =
  | "open_workspace"
  | "open_notebook"
  | "complete_checkpoint"
  | "take_assessment"
  | "open_resource"
  | "discussion";

export type ParticipantAction = {
  kind: ParticipantActionKind;
  label: string;
  description?: string;
  href?: string;
  workspaceSlug?: string;
  assessmentSlug?: string;
  checkpointSlug?: string;
  notebookHref?: string;
};

export type SegmentCheckpointBadge = {
  kind: "checkpoint" | "assessment";
  slug: string;
  title: string;
  startSlide?: number;
  endSlide?: number;
};

export type ModuleScriptPack = {
  moduleSlug: string;
  moduleTitle: string;
  durationDays: number;
  hoursPerDay: number;
  totalSlides: number;
  segments: SegmentBlock[];
  slides: SlideScript[];
  participantActions?: Record<number, ParticipantAction>;
  segmentBadges?: Record<string, SegmentCheckpointBadge[]>;
};
