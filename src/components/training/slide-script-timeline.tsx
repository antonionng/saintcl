"use client";

import type { ReactNode } from "react";

import type { FacilitatorNoteBlockShape } from "@/components/training/training-facilitator-console";

type ScriptInput = {
  sayThis: string[];
  askThis?: string[];
  doThis?: string[];
  watchFor?: string[];
  landThePoint?: string;
  transition?: string;
  presenterCues?: string[];
  coreMessage?: string;
  showThis?: string;
  segment?: string;
  estMinutes?: number;
};

type SlideScriptTimelineProps = {
  note: FacilitatorNoteBlockShape;
  script: ScriptInput;
  questions: string[];
  slideNumber: number | null;
  totalSlides: number | null;
  slideTitle: string | null;
  slideEyebrow: string | null;
};

type TimelineSection = {
  id: string;
  label: string;
  hint?: string;
  tone: "open" | "say" | "ask" | "do" | "watch" | "land" | "transition" | "tips" | "debrief";
  body: ReactNode;
};

const toneClasses: Record<TimelineSection["tone"], { border: string; eyebrow: string }> = {
  open: { border: "border-white/10 bg-white/[0.03]", eyebrow: "text-zinc-400" },
  say: { border: "border-sky-400/15 bg-sky-400/[0.05]", eyebrow: "text-sky-200/80" },
  ask: { border: "border-emerald-400/15 bg-emerald-400/[0.05]", eyebrow: "text-emerald-200/80" },
  do: { border: "border-violet-400/15 bg-violet-400/[0.05]", eyebrow: "text-violet-200/80" },
  watch: { border: "border-amber-400/15 bg-amber-400/[0.05]", eyebrow: "text-amber-200/80" },
  land: { border: "border-fuchsia-400/15 bg-fuchsia-400/[0.05]", eyebrow: "text-fuchsia-200/80" },
  transition: { border: "border-white/10 bg-white/[0.04]", eyebrow: "text-zinc-300" },
  tips: { border: "border-white/10 bg-black/20", eyebrow: "text-zinc-400" },
  debrief: { border: "border-teal-400/15 bg-teal-400/[0.05]", eyebrow: "text-teal-200/80" },
};

function ScriptList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2 text-sm leading-7 text-zinc-100">
      {items.map((line, index) => (
        <li key={`${index}-${line}`} className="flex gap-3">
          <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-white/40" aria-hidden />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function ScriptParagraph({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-zinc-100">{text}</p>;
}

function buildSections(props: SlideScriptTimelineProps): TimelineSection[] {
  const { note, script, questions } = props;
  const sections: TimelineSection[] = [];

  const askLines = script.askThis && script.askThis.length > 0 ? script.askThis : questions;
  const doLines = script.doThis ?? [];
  const watchLines = script.watchFor ?? [];
  const tipsLines = note.facilitationMoves ?? [];
  const debriefLines = note.debrief ?? [];

  sections.push({
    id: "open",
    tone: "open",
    label: "Open",
    hint: note.label,
    body: (
      <div className="space-y-3">
        {script.coreMessage ? (
          <p className="text-base font-semibold text-white">{script.coreMessage}</p>
        ) : null}
        <p className="text-sm leading-7 text-zinc-200">{note.objective}</p>
        {note.talkTrack.length > 0 ? (
          <div className="space-y-2 text-sm leading-7 text-zinc-300">
            {note.talkTrack.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        {script.showThis ? (
          <p className="text-sm leading-6 text-zinc-400">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Show on screen </span>
            {script.showThis}
          </p>
        ) : null}
      </div>
    ),
  });

  if (script.sayThis.length > 0) {
    sections.push({
      id: "say",
      tone: "say",
      label: "Say",
      hint: "word for word",
      body: <ScriptList items={script.sayThis} />,
    });
  }

  if (askLines.length > 0) {
    sections.push({
      id: "ask",
      tone: "ask",
      label: "Ask",
      hint: "to the room",
      body: <ScriptList items={askLines} />,
    });
  }

  if (doLines.length > 0) {
    sections.push({
      id: "do",
      tone: "do",
      label: "Do",
      hint: "facilitator action",
      body: <ScriptList items={doLines} />,
    });
  }

  if (watchLines.length > 0) {
    sections.push({
      id: "watch",
      tone: "watch",
      label: "Watch for",
      body: <ScriptList items={watchLines} />,
    });
  }

  if (script.landThePoint) {
    sections.push({
      id: "land",
      tone: "land",
      label: "Land the point",
      body: <ScriptParagraph text={script.landThePoint} />,
    });
  }

  if (script.transition) {
    sections.push({
      id: "transition",
      tone: "transition",
      label: "Transition",
      body: <ScriptParagraph text={script.transition} />,
    });
  }

  if (debriefLines.length > 0) {
    sections.push({
      id: "debrief",
      tone: "debrief",
      label: "Debrief",
      body: <ScriptList items={debriefLines} />,
    });
  }

  if (tipsLines.length > 0) {
    sections.push({
      id: "tips",
      tone: "tips",
      label: "Tips",
      hint: "facilitation moves",
      body: <ScriptList items={tipsLines} />,
    });
  }

  if (script.presenterCues && script.presenterCues.length > 0) {
    sections.push({
      id: "presenter-cues",
      tone: "tips",
      label: "Presenter cues",
      body: <ScriptList items={script.presenterCues} />,
    });
  }

  return sections;
}

export function SlideScriptTimeline(props: SlideScriptTimelineProps) {
  const sections = buildSections(props);

  const slideHeader = props.slideNumber
    ? `Slide ${props.slideNumber}${props.totalSlides ? ` of ${props.totalSlides}` : ""}`
    : "Slide";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{slideHeader}</p>
          {props.slideTitle ? (
            <h2 className="mt-1 text-lg font-semibold text-white">{props.slideTitle}</h2>
          ) : null}
          {props.slideEyebrow ? (
            <p className="mt-0.5 text-sm text-zinc-400">{props.slideEyebrow}</p>
          ) : null}
        </div>
        {props.script.estMinutes ? (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
            {props.script.estMinutes}m
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ol className="space-y-4">
          {sections.map((section) => {
            const tone = toneClasses[section.tone];
            return (
              <li key={section.id} className={`rounded-2xl border p-4 ${tone.border}`}>
                <div className="mb-3 flex items-baseline gap-2">
                  <span className={`text-[11px] uppercase tracking-[0.22em] ${tone.eyebrow}`}>
                    {section.label}
                  </span>
                  {section.hint ? (
                    <span className="text-[11px] text-zinc-500">{section.hint}</span>
                  ) : null}
                </div>
                {section.body}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
