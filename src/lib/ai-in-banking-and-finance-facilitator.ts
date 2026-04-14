import { buildTrainingFacilitatorKit } from "@/lib/training-facilitator-kit";

const slideTitles = [
  "AI in Banking and Finance",
  "Why AI strategy matters in finance",
  "Module outcomes",
  "The decision sequence",
  "Core use cases across banking functions",
  "Prompting and human oversight",
  "Risk, compliance, and model governance",
  "Adoption choices and operating models",
  "Case studio. Banking AI recommendation",
  "Leadership briefing structure",
  "Peer review prompts",
  "Close and next move",
] as const;

const facilitator = buildTrainingFacilitatorKit({
  moduleTitle: "AI in Banking and Finance",
  slideTitles,
  noteBlocks: [
    {
      start: 1,
      end: 4,
      label: "Opening and strategic framing",
      objective: "Position AI adoption as a strategic and governance question, not only a tooling question.",
      talkTrack: [
        "Use the opening to connect AI use cases to banking value, control, and leadership accountability.",
        "Keep the discussion grounded in where AI changes judgement, workflow, or customer experience.",
      ],
      facilitationMoves: [
        "Ask which banking decision would benefit most from better augmentation or automation.",
        "Push broad AI optimism back toward measurable outcomes and risks.",
      ],
    },
    {
      start: 5,
      end: 8,
      label: "Use cases, prompting, and control",
      objective: "Make sure prompting, oversight, and risk controls remain central to every AI recommendation.",
      talkTrack: [
        "Treat prompt quality as part of system design rather than a personal trick.",
        "Keep surfacing where human review, auditability, and policy boundaries must stay visible.",
      ],
      facilitationMoves: [
        "Ask what bad output would look like and how it would be caught.",
        "Challenge any use case that has no clear review boundary or owner.",
      ],
      debrief: [
        "Which control matters most before broader rollout?",
        "What use case looks exciting but too risky right now?",
      ],
    },
    {
      start: 9,
      end: 12,
      label: "Case studio and close",
      objective: "Finish with a balanced recommendation that leadership could approve, challenge, or defer intelligently.",
      talkTrack: [
        "Reward recommendations that show value, adoption path, controls, and caveats together.",
        "Use the close to reinforce disciplined adoption over broad statements about transformation.",
      ],
      facilitationMoves: [
        "Ask teams to name the first move, the review gate, and the stop condition.",
        "Challenge any leadership brief that hides uncertainty or operating burden.",
      ],
    },
  ],
});

export const getAiInBankingAndFinanceFacilitatorNote = facilitator.getNote;
export const getAiInBankingAndFinanceFacilitatorNoteBlocks = facilitator.getNoteBlocks;
export const getAiInBankingAndFinanceFacilitatorSlideScript = facilitator.getSlideScript;
export const getAiInBankingAndFinanceFacilitatorQuestions = facilitator.getQuestions;
