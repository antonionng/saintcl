import { buildTrainingFacilitatorKit } from "@/lib/training-facilitator-kit";

const slideTitles = [
  "Business Applications in AI",
  "Why business-led AI matters",
  "Module outcomes",
  "The opportunity mapping sequence",
  "Where AI creates banking value",
  "Prioritising opportunities with discipline",
  "Risk, ethics, and governance questions",
  "Operating model choices",
  "Case studio. Opportunity mapping",
  "Executive recommendation structure",
  "Peer review prompts",
  "Close and next move",
] as const;

const facilitator = buildTrainingFacilitatorKit({
  moduleTitle: "Business Applications in AI",
  slideTitles,
  noteBlocks: [
    {
      start: 1,
      end: 4,
      label: "Opening and framing",
      objective: "Position AI opportunity selection as a business design exercise rather than a technology shopping list.",
      talkTrack: [
        "Keep the opening focused on decision quality, operating pain, and measurable value.",
        "Remind the room that the strongest AI idea is not always the most complex idea.",
      ],
      facilitationMoves: [
        "Ask participants to name one business problem before they name one AI method.",
        "Push abstract ambition back toward owners, workflows, and constraints.",
      ],
    },
    {
      start: 5,
      end: 8,
      label: "Prioritisation and governance",
      objective: "Build discipline around value, feasibility, risk, and governance before recommending any AI move.",
      talkTrack: [
        "Treat prioritisation criteria as a control, not as paperwork.",
        "Keep surfacing where data quality, process maturity, and accountability will shape success.",
      ],
      facilitationMoves: [
        "Challenge any use case that has no clear owner or measurable outcome.",
        "Ask what review or control layer would need to exist before launch.",
      ],
      debrief: [
        "Which criterion changed the ranking most?",
        "What risk would be easiest to underestimate here?",
      ],
    },
    {
      start: 9,
      end: 12,
      label: "Case studio and close",
      objective: "End with recommendation quality that leadership could challenge constructively.",
      talkTrack: [
        "Use the case studio to reward clarity, prioritisation logic, and explicit caveats.",
        "Keep the close focused on next moves, not on broad enthusiasm.",
      ],
      facilitationMoves: [
        "Ask each group to defend why its top use case should move first.",
        "Challenge recommendations that do not include a governance or adoption path.",
      ],
    },
  ],
});

export const getBusinessApplicationsInAiFacilitatorNote = facilitator.getNote;
export const getBusinessApplicationsInAiFacilitatorNoteBlocks = facilitator.getNoteBlocks;
export const getBusinessApplicationsInAiFacilitatorSlideScript = facilitator.getSlideScript;
export const getBusinessApplicationsInAiFacilitatorQuestions = facilitator.getQuestions;
