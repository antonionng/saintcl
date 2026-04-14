import { buildTrainingFacilitatorKit } from "@/lib/training-facilitator-kit";

const slideTitles = [
  "Advanced Data Visualization",
  "Why executive-grade visuals matter",
  "Module outcomes",
  "The storytelling sequence",
  "Choosing the right chart for the task",
  "Designing hierarchy and focus",
  "Dashboards, interactivity, and narrative flow",
  "Common visualization risks in banking",
  "Case studio. Dashboard concept",
  "Leadership-ready visual critique",
  "Peer review prompts",
  "Close and next move",
] as const;

const facilitator = buildTrainingFacilitatorKit({
  moduleTitle: "Advanced Data Visualization",
  slideTitles,
  noteBlocks: [
    {
      start: 1,
      end: 4,
      label: "Opening and narrative framing",
      objective: "Position visualization as a decision-making tool rather than a chart production task.",
      talkTrack: [
        "Keep the opening focused on how visuals reduce ambiguity and guide action.",
        "Reinforce that strong visuals simplify meaning without hiding uncertainty.",
      ],
      facilitationMoves: [
        "Ask what decision the chart is meant to support before discussing style.",
        "Push participants to describe the audience and the question in one sentence.",
      ],
    },
    {
      start: 5,
      end: 8,
      label: "Chart choice and design discipline",
      objective: "Build judgement around chart selection, hierarchy, readability, and banking communication risk.",
      talkTrack: [
        "Use these slides to show that clutter and poor hierarchy are governance risks as well as design mistakes.",
        "Keep the room focused on emphasis, comparison, and what should stand out first.",
      ],
      facilitationMoves: [
        "Challenge decorative choices that do not help interpretation.",
        "Ask what confusion or misuse each weak design choice could create.",
      ],
      debrief: [
        "Which chart type is easiest to misuse here?",
        "What design move improves clarity the most?",
      ],
    },
    {
      start: 9,
      end: 12,
      label: "Case studio and close",
      objective: "End with a dashboard recommendation that leadership could read quickly and trust.",
      talkTrack: [
        "Reward concepts that make hierarchy, business priority, and narrative sequence visible.",
        "Use the close to reinforce concise explanation over visual novelty.",
      ],
      facilitationMoves: [
        "Ask teams to defend one chart they chose and one they deliberately rejected.",
        "Challenge any dashboard that lacks a clear first message for leaders.",
      ],
    },
  ],
});

export const getAdvancedDataVisualizationFacilitatorNote = facilitator.getNote;
export const getAdvancedDataVisualizationFacilitatorNoteBlocks = facilitator.getNoteBlocks;
export const getAdvancedDataVisualizationFacilitatorSlideScript = facilitator.getSlideScript;
export const getAdvancedDataVisualizationFacilitatorQuestions = facilitator.getQuestions;
