import { buildTrainingFacilitatorKit } from "@/lib/training-facilitator-kit";

const slideTitles = [
  "Automation in AI",
  "Why automation matters",
  "Module outcomes",
  "The workflow mapping sequence",
  "Where AI automation fits in banking operations",
  "Designing a governed workflow",
  "Exceptions, fallback, and human review",
  "Tooling choices and integration points",
  "Case studio. Workflow map",
  "Operating metrics and rollout choices",
  "Peer review prompts",
  "Close and next move",
] as const;

const facilitator = buildTrainingFacilitatorKit({
  moduleTitle: "Automation in AI",
  slideTitles,
  noteBlocks: [
    {
      start: 1,
      end: 4,
      label: "Opening and workflow framing",
      objective: "Anchor automation around workflow quality, handoffs, and measurable operational pain.",
      talkTrack: [
        "Position automation as a process design topic before it becomes a tooling discussion.",
        "Keep the opening tied to throughput, error reduction, and exception handling.",
      ],
      facilitationMoves: [
        "Ask what currently breaks in the workflow before asking how AI could help.",
        "Push vague automation ideas into inputs, outputs, and owners.",
      ],
    },
    {
      start: 5,
      end: 8,
      label: "Control design and tooling",
      objective: "Show that automation quality depends on explicit control points, fallback paths, and integration realism.",
      talkTrack: [
        "Use these slides to make exception handling feel central, not secondary.",
        "Keep surfacing where human review should remain in the loop.",
      ],
      facilitationMoves: [
        "Ask where the workflow should stop automatically and where it should escalate.",
        "Challenge designs that assume APIs and data quality will always behave cleanly.",
      ],
      debrief: [
        "Which exception path matters most?",
        "What failure mode would create the highest operating risk?",
      ],
    },
    {
      start: 9,
      end: 12,
      label: "Case studio and close",
      objective: "Finish with an automation recommendation that is practical, staged, and governable.",
      talkTrack: [
        "Reward workflow maps that make ownership, metrics, and fallbacks visible.",
        "Use the close to separate a credible pilot from an overbuilt automation ambition.",
      ],
      facilitationMoves: [
        "Ask teams to state what they would automate first and what they would leave manual.",
        "Challenge any rollout plan that has no monitoring or rollback logic.",
      ],
    },
  ],
});

export const getAutomationInAiFacilitatorNote = facilitator.getNote;
export const getAutomationInAiFacilitatorNoteBlocks = facilitator.getNoteBlocks;
export const getAutomationInAiFacilitatorSlideScript = facilitator.getSlideScript;
export const getAutomationInAiFacilitatorQuestions = facilitator.getQuestions;
