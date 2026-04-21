#!/usr/bin/env -S npx tsx
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import programmeOrientationPack from "../src/lib/training-scripts/programme-orientation";
import pythonForDataPack from "../src/lib/training-scripts/python-for-data";
import type { ModuleScriptPack, SlideScript } from "../src/lib/training-scripts/types";

const TARGETS: Array<{
  pack: ModuleScriptPack;
  deckPath: string;
}> = [
  {
    pack: programmeOrientationPack,
    deckPath: resolve(process.cwd(), "programme-orientation/index.html"),
  },
  {
    pack: pythonForDataPack,
    deckPath: resolve(process.cwd(), "python-training/index.html"),
  },
];

type LintIssue = {
  module: string;
  level: "error" | "warning";
  message: string;
};

function firstWords(value: string, count: number): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

function extractDeckSlideIds(html: string): string[] {
  const matches = Array.from(html.matchAll(/<section[^>]*class=\"slide(?:\s[^\"]*)?\"[^>]*id=\"([^\"]+)\"/g));
  return matches.map((match) => match[1]);
}

function lintPack(pack: ModuleScriptPack, deckPath: string): LintIssue[] {
  const issues: LintIssue[] = [];

  let deckIds: string[] = [];
  try {
    const html = readFileSync(deckPath, "utf8");
    deckIds = extractDeckSlideIds(html);
  } catch (error) {
    issues.push({
      module: pack.moduleSlug,
      level: "error",
      message: `Could not read deck at ${deckPath}: ${(error as Error).message}`,
    });
  }

  if (deckIds.length > 0) {
    if (deckIds.length !== pack.totalSlides) {
      issues.push({
        module: pack.moduleSlug,
        level: "error",
        message: `Deck has ${deckIds.length} slides but totalSlides is set to ${pack.totalSlides}.`,
      });
    }
    if (pack.slides.length !== deckIds.length) {
      issues.push({
        module: pack.moduleSlug,
        level: "error",
        message: `Deck has ${deckIds.length} slides but script data covers ${pack.slides.length} slides.`,
      });
    }
    const deckSet = new Set(deckIds);
    const scriptSet = new Set(pack.slides.map((slide) => slide.deckId));
    for (const id of deckIds) {
      if (!scriptSet.has(id)) {
        issues.push({
          module: pack.moduleSlug,
          level: "error",
          message: `Deck slide \`${id}\` has no entry in the script data.`,
        });
      }
    }
    for (const slide of pack.slides) {
      if (!deckSet.has(slide.deckId)) {
        issues.push({
          module: pack.moduleSlug,
          level: "error",
          message: `Script entry for slideNumber ${slide.slideNumber} references deckId \`${slide.deckId}\` which is not in the deck.`,
        });
      }
    }
  }

  const FORBIDDEN_DIRECTORIAL_PREFIXES = [
    "walk the",
    "walk through",
    "stress that",
    "stress the",
    "tell the room",
    "tell the advanced",
    "tell advanced",
    "frame the",
    "frame lab",
    "anchor the",
    "treat the",
    "treat lab",
    "use the left card",
    "use the right card",
    "introduce the",
    "hand the lab",
    "send the room",
    "open lab",
    "kick off lab",
    "start lab",
    "launch lab",
    "set lab",
    "brief lab",
    "run the capstone",
    "run lab",
    "name the",
    "take the room",
    "recap the",
    "read the agenda",
    "move down the agenda",
    "read the three",
    "reframe",
    "compress",
    "make this the moment",
    "quote the",
    "pause for",
    "acknowledge that",
    "highlight that",
    "highlight the",
    "remind",
    "reinforce",
    "ask one learner",
    "ask the room",
    "push back",
    "push them",
    "land the python row",
    "end by",
    "end the slide",
    "open with",
    "close by",
    "close with",
    "say it twice",
    "narrate",
  ];

  const SPOKEN_VOICE_RE =
    /\b(we|we're|we are|we've|we'll|we will|let's|let us|let me|i want|i'll|i will|i'm|i need you|you'll|you will|you can|you're|today|right now|in the next|over the next|by the end|tomorrow|tonight|this morning|this afternoon|here's|here is)\b/i;

  for (const slide of pack.slides) {
    const requireField = (field: keyof SlideScript, message: string) => {
      const value = slide[field];
      if (value === undefined || value === null) {
        issues.push({
          module: pack.moduleSlug,
          level: "error",
          message: `Slide ${slide.slideNumber} (${slide.deckId}) ${message}`,
        });
        return;
      }
      if (typeof value === "string" && value.trim().length === 0) {
        issues.push({
          module: pack.moduleSlug,
          level: "error",
          message: `Slide ${slide.slideNumber} (${slide.deckId}) ${message}`,
        });
      }
    };
    requireField("coreMessage", "is missing a non-empty coreMessage.");
    requireField("landThePoint", "is missing a non-empty landThePoint.");
    if (!Array.isArray(slide.sayThis) || slide.sayThis.length === 0) {
      issues.push({
        module: pack.moduleSlug,
        level: "error",
        message: `Slide ${slide.slideNumber} (${slide.deckId}) has no sayThis lines.`,
      });
      continue;
    }

    for (const paragraph of slide.sayThis) {
      const lower = paragraph.trim().toLowerCase();
      const offending = FORBIDDEN_DIRECTORIAL_PREFIXES.find((prefix) =>
        lower.startsWith(prefix + " ") || lower.startsWith(prefix + ",") || lower.startsWith(prefix + "."),
      );
      if (offending) {
        issues.push({
          module: pack.moduleSlug,
          level: "error",
          message: `Slide ${slide.slideNumber} (${slide.deckId}) sayThis paragraph starts with directorial prefix "${offending}". Move that line into presenterCues and write spoken script in its place.\n    Offending line: "${paragraph.slice(0, 140)}${paragraph.length > 140 ? "..." : ""}"`,
        });
      }
    }

    const hasSpokenVoice = slide.sayThis.some((paragraph) => SPOKEN_VOICE_RE.test(paragraph));
    if (!hasSpokenVoice) {
      issues.push({
        module: pack.moduleSlug,
        level: "error",
        message: `Slide ${slide.slideNumber} (${slide.deckId}) has no spoken-voice marker in any sayThis paragraph (we/let's/I/you/today/etc.). Rewrite as actual trainer dialogue.`,
      });
    }
  }

  const openerMap = new Map<string, SlideScript[]>();
  for (const slide of pack.slides) {
    const opener = firstWords(slide.sayThis?.[0] ?? "", 6);
    if (!opener) continue;
    if (!openerMap.has(opener)) openerMap.set(opener, []);
    openerMap.get(opener)!.push(slide);
  }
  for (const [opener, slidesShared] of openerMap.entries()) {
    if (slidesShared.length > 1) {
      const list = slidesShared.map((slide) => `${slide.slideNumber} (${slide.deckId})`).join(", ");
      issues.push({
        module: pack.moduleSlug,
        level: "error",
        message: `Slides ${list} share the same six-word opener: "${opener}".`,
      });
    }
  }

  const landingMap = new Map<string, SlideScript[]>();
  for (const slide of pack.slides) {
    const key = (slide.landThePoint ?? "").trim().toLowerCase();
    if (!key) continue;
    if (!landingMap.has(key)) landingMap.set(key, []);
    landingMap.get(key)!.push(slide);
  }
  for (const [, slidesShared] of landingMap.entries()) {
    if (slidesShared.length > 1) {
      const list = slidesShared.map((slide) => `${slide.slideNumber} (${slide.deckId})`).join(", ");
      issues.push({
        module: pack.moduleSlug,
        level: "warning",
        message: `Slides ${list} share an identical landThePoint line.`,
      });
    }
  }

  return issues;
}

function main() {
  const all: LintIssue[] = [];
  for (const target of TARGETS) {
    all.push(...lintPack(target.pack, target.deckPath));
  }

  const errors = all.filter((issue) => issue.level === "error");
  const warnings = all.filter((issue) => issue.level === "warning");

  for (const issue of errors) {
    console.error(`[lint-script-openers] ERROR ${issue.module}: ${issue.message}`);
  }
  for (const issue of warnings) {
    console.warn(`[lint-script-openers] WARN  ${issue.module}: ${issue.message}`);
  }

  if (errors.length > 0) {
    console.error(`\n[lint-script-openers] ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(
    `[lint-script-openers] OK. Checked ${TARGETS.length} module(s). ${warnings.length} warning(s).`,
  );
}

main();
