import type { TrainingDeliveryMode, TrainingModuleStatus, TrainingProgrammeStatus } from "@/types";

export type TrainingLabBlueprint = {
  slug: string;
  title: string;
  deliverable: string;
  successSignal: string;
};

export type TrainingContentSection = {
  id: string;
  title: string;
  slideCount: number;
};

export type TrainingContentModel = {
  targetSlideCount: number;
  labCount: number;
  assetPack: string[];
  sections: TrainingContentSection[];
};

export type TrainingReviewWindow = {
  contentDueOn: string;
  reviewDueOn: string;
  signOffDueOn: string;
};

export type TrainingModuleResource = {
  label: string;
  href: string;
  kind: "deck" | "workbook" | "notebook" | "dataset" | "solution" | "guide";
};

export type TrainingModuleDeck = {
  href: string;
  title: string;
};

export type TrainingModuleLearnerTrack = {
  id: "intro" | "advanced";
  title: string;
  fit: string;
  guidance: string;
  outcome: string;
};

export type TrainingModuleToolComparisonRow = {
  tool: string;
  bestFor: string;
  watchout: string;
};

export type TrainingModuleEnhancement = {
  bankingContext: string[];
  pacingNotes: string[];
  engagementPrompts: string[];
  learnerTracks: TrainingModuleLearnerTrack[];
  toolComparisonTitle?: string;
  toolComparisonRows?: TrainingModuleToolComparisonRow[];
};

export type TrainingParticipantExperience =
  | "python-workspace"
  | "checkpoint"
  | "deck"
  | "cohort-orientation"
  | "ml-lab"
  | "neural-lab"
  | "viz-studio"
  | "flow-designer"
  | "strategy-canvas"
  | "prompt-studio";

export type TrainingModuleDelivery = {
  deck: TrainingModuleDeck;
  workbookHref: string;
  facilitatorHref: string;
  participantExperience: TrainingParticipantExperience;
  notebookPreviewPaths?: string[];
  resources: TrainingModuleResource[];
};

// Default participant access for a module.
//   - "open": every checked-in participant can open the module regardless of
//     prior progress. Use for modules we have explicitly released to the
//     cohort.
//   - "locked": participants cannot open the module from the academy by
//     default; only a per-cohort facilitator unlock or an existing started
//     enrollment grants access. Use for modules we are not ready to release.
//   - omitted: fall back to sequential gating (open the next module after the
//     previous one is completed).
export type ParticipantAccessPolicy = "open" | "locked";

export type TrainingModuleBlueprint = {
  slug: string;
  title: string;
  sequence: number;
  status: TrainingModuleStatus;
  deliveryMode: TrainingDeliveryMode;
  durationDays: number;
  hoursPerDay: number;
  dates: {
    startsOn: string;
    endsOn: string;
  };
  summary: string;
  audience: string;
  learningObjectives: string[];
  keyThemes: string[];
  coreOutputs: string[];
  labs: TrainingLabBlueprint[];
  contentModel: TrainingContentModel;
  reviewWindow?: TrainingReviewWindow;
  participantAccess?: ParticipantAccessPolicy;
};

export type TrainingProgrammeBlueprint = {
  slug: string;
  name: string;
  clientName: string;
  status: TrainingProgrammeStatus;
  audience: string;
  description: string;
  deliveryMode: TrainingDeliveryMode;
  modules: TrainingModuleBlueprint[];
};

const standardModuleAssets = [
  "participant slide deck",
  "participant workbook",
  "facilitator guide",
  "browser lab configuration",
  "datasets and notebooks",
  "solution files",
];

function buildStandardSections(): TrainingContentSection[] {
  return [
    { id: "opening", title: "Launch and orientation", slideCount: 8 },
    { id: "concepts", title: "Core concepts", slideCount: 18 },
    { id: "guided", title: "Guided walkthroughs", slideCount: 16 },
    { id: "labs", title: "Hands-on labs", slideCount: 16 },
    { id: "discussion", title: "Case discussion and critique", slideCount: 8 },
    { id: "application", title: "Applied mission or mini-project", slideCount: 8 },
    { id: "close", title: "Recap, rubric, and next steps", slideCount: 6 },
  ];
}

const sharedAudience = "Enterprise banking cohort at Al Jazira Bank";

export const ajbTrainingProgramme: TrainingProgrammeBlueprint = {
  slug: "ajb-ai-and-data-programme",
  name: "AJB AI and Data Training Programme",
  clientName: "Al Jazira Bank",
  status: "active",
  audience: sharedAudience,
  description:
    "A seven-module academy covering Python, machine learning, neural networks, business AI, automation, advanced visualisation, and AI in banking and finance, opened by a Day 1 programme orientation that lays the foundations for the three months ahead.",
  deliveryMode: "online",
  modules: [
    {
      slug: "programme-orientation",
      title: "Programme Orientation",
      sequence: 0,
      status: "ready",
      deliveryMode: "online",
      durationDays: 1,
      hoursPerDay: 5,
      dates: { startsOn: "2026-04-18", endsOn: "2026-04-18" },
      summary:
        "A Day 1 orientation that welcomes the cohort, walks the seven-module journey, activates the studio, and leaves every learner with a written personal achievement plan locked down for the night.",
      audience: sharedAudience,
      learningObjectives: [
        "Meet the cohort and the facilitation team and agree how the programme will run.",
        "Understand the arc of the seven modules and the artefacts that link them together.",
        "Sign in to the SaintClaw studio, complete a profile, and post on the cohort feed.",
        "Write a four-section personal achievement plan, lock it down for tonight, and commit to it aloud.",
      ],
      keyThemes: [
        "Cohort connection",
        "Programme journey and artefact chain",
        "Studio activation",
        "Personal achievement planning",
      ],
      coreOutputs: [
        "32-slide orientation deck",
        "Three breakouts (35 min future-self portrait, 30 min studio shakedown, 40 min achievement plan)",
        "Personal achievement plan written and locked down (offline) with a one-line headline posted in the cohort feed",
        "Spoken commitments captured on Day 1",
      ],
      labs: [],
      contentModel: {
        targetSlideCount: 32,
        labCount: 0,
        assetPack: ["participant slide deck", "facilitator guide", "personal achievement plan template"],
        sections: [
          { id: "welcome", title: "Welcome and cohort connection", slideCount: 6 },
          { id: "journey", title: "Programme arc and future-self portrait", slideCount: 11 },
          { id: "studio", title: "Studio activation and shakedown", slideCount: 6 },
          { id: "plan", title: "Personal achievement plan and Day 1 close", slideCount: 9 },
        ],
      },
    },
    {
      slug: "python-for-data",
      title: "Python for Data",
      sequence: 1,
      status: "ready",
      participantAccess: "open",
      deliveryMode: "online",
      durationDays: 2,
      hoursPerDay: 4,
      dates: { startsOn: "2026-04-20", endsOn: "2026-04-21" },
      summary:
        "Use AI to surface defendable truths from bank data. A two-day, hands-on module that teaches banking data judgement, prompting and verification craft, and the just-enough Python literacy needed to read and challenge AI-assisted analysis.",
      audience: sharedAudience,
      learningObjectives: [
        "Brief, engage, verify, and defend AI-assisted analysis on real bank data.",
        "Make defendable judgements about extract fitness, KPI definitions, and data quality posture.",
        "Read AI-generated python well enough to spot wrong joins, drifted definitions, and silent leakage.",
        "Produce leadership-ready outputs and an ML handoff that survive challenge.",
      ],
      keyThemes: [
        "Working with AI on banking data",
        "Banking data judgement",
        "Definition discipline and KPI defence",
        "Verification habits and challenge questions",
        "ML handoff readiness",
      ],
      coreOutputs: [
        "Two-day deck",
        "4 labs running the brief-engage-verify-defend loop",
        "Pre-baked challenge-question bank per lab",
        "ML-ready handoff table plus participant-written data dictionary",
      ],
      labs: [
        {
          slug: "lab-a-triage",
          title: "Triage an extract",
          deliverable: "A defendable fitness judgement plus a one-paragraph defence",
          successSignal: "Participants commit to fit / partly fit / not yet fit with evidence",
        },
        {
          slug: "lab-b-kpi",
          title: "Define and build a branch KPI",
          deliverable: "A branch KPI table with explicit numerator, denominator, exclusion, and cut-off rules",
          successSignal: "Participants ship a defended version after stress-testing one alternative denominator",
        },
        {
          slug: "lab-c-pack",
          title: "Executive performance pack",
          deliverable: "Two charts, one exception view, and one written caveat",
          successSignal: "The pack survives the coach arguing against its interpretation",
        },
        {
          slug: "lab-d-handoff",
          title: "ML-ready handoff table",
          deliverable: "A customer-level feature table with explicit cut-off plus a hand-written data dictionary",
          successSignal: "Participants identify and document at least one leakage risk in their own words",
        },
      ],
      contentModel: {
        targetSlideCount: 60,
        labCount: 4,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
      reviewWindow: {
        contentDueOn: "2026-03-13",
        reviewDueOn: "2026-03-17",
        signOffDueOn: "2026-03-20",
      },
    },
    {
      slug: "machine-learning-training",
      title: "Machine Learning Training",
      sequence: 2,
      status: "scheduled",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 3,
      hoursPerDay: 4,
      dates: { startsOn: "2026-05-17", endsOn: "2026-05-19" },
      summary:
        "A practical introduction to supervised and unsupervised machine learning, evaluation metrics, governance, and business-facing model communication.",
      audience: sharedAudience,
      learningObjectives: [
        "Understand the end-to-end machine learning pipeline.",
        "Apply supervised and unsupervised techniques to representative banking data.",
        "Evaluate models using metrics suited to regulated banking use cases.",
        "Communicate risks, bias, and governance constraints clearly.",
      ],
      keyThemes: ["ML workflow", "Supervised models", "Unsupervised models", "Model evaluation", "Responsible AI"],
      coreOutputs: ["80-slide deck", "8 labs", "model comparison workbook", "solution notebooks"],
      labs: [
        {
          slug: "segmentation-lab",
          title: "Customer segmentation lab",
          deliverable: "A defensible clustering workflow on AJB-style customer data",
          successSignal: "Participants can explain segments and their business use",
        },
        {
          slug: "supervised-model-lab",
          title: "Supervised model walkthrough",
          deliverable: "A baseline classification model and evaluation summary",
          successSignal: "Participants can justify metric choice and leakage controls",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 8,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
      reviewWindow: {
        contentDueOn: "2026-03-20",
        reviewDueOn: "2026-03-24",
        signOffDueOn: "2026-03-27",
      },
    },
    {
      slug: "neural-networks",
      title: "Neural Networks",
      sequence: 3,
      status: "scheduled",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 2,
      hoursPerDay: 4,
      dates: { startsOn: "2026-05-20", endsOn: "2026-05-21" },
      summary:
        "A two-day neural networks module covering foundations, CNN concepts, transfer learning, data preparation, and model optimisation in banking contexts.",
      audience: sharedAudience,
      learningObjectives: [
        "Explain neural network concepts and how they differ from traditional models.",
        "Prepare banking datasets for neural network training and evaluation.",
        "Apply CNN and transfer learning ideas to banking use cases.",
        "Evaluate performance while balancing interpretability, risk, and governance.",
      ],
      keyThemes: ["Neural network concepts", "CNNs", "Transfer learning", "Optimisation", "Banking governance"],
      coreOutputs: ["80-slide deck", "6 labs", "data preparation pack", "solution notebooks"],
      labs: [
        {
          slug: "cnn-concepts",
          title: "CNN concepts for document understanding",
          deliverable: "A worked notebook and model interpretation summary",
          successSignal: "Participants can map CNN concepts to a banking document use case",
        },
        {
          slug: "tuning-lab",
          title: "Network tuning and performance improvement",
          deliverable: "A model comparison table with hyperparameter notes",
          successSignal: "Participants can explain why one tuned run is preferable",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 6,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
      reviewWindow: {
        contentDueOn: "2026-03-27",
        reviewDueOn: "2026-03-31",
        signOffDueOn: "2026-04-03",
      },
    },
    {
      slug: "business-applications-in-ai",
      title: "Business Applications in AI",
      sequence: 4,
      status: "draft",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 2,
      hoursPerDay: 4,
      dates: { startsOn: "2026-06-07", endsOn: "2026-06-08" },
      summary:
        "A strategy-oriented module on identifying, prioritising, and governing AI opportunities across banking functions.",
      audience: sharedAudience,
      learningObjectives: [
        "Understand how AI supports banking business goals.",
        "Prioritise AI initiatives using structured business criteria.",
        "Evaluate risk, ethics, and governance implications.",
      ],
      keyThemes: ["AI fundamentals", "Opportunity mapping", "Prioritisation", "Ethics and governance"],
      coreOutputs: ["80-slide deck", "6 activities", "business case workbook", "facilitator toolkit"],
      labs: [
        {
          slug: "opportunity-map",
          title: "Opportunity mapping studio",
          deliverable: "A prioritised AJB AI opportunity map",
          successSignal: "Participants can defend value, feasibility, and risk trade-offs",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 6,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
    },
    {
      slug: "automation-in-ai",
      title: "Automation in AI",
      sequence: 5,
      status: "draft",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 2,
      hoursPerDay: 4,
      dates: { startsOn: "2026-06-09", endsOn: "2026-06-10" },
      summary:
        "A practical automation module covering workflow mapping, low-code tooling, AI assistants, API integration, and governance for banking operations.",
      audience: sharedAudience,
      learningObjectives: [
        "Explain the role of AI-driven automation in banking efficiency.",
        "Map workflows and identify automation touchpoints.",
        "Design AI-enabled assistants and workflows with governance controls.",
      ],
      keyThemes: ["Automation tools", "Workflow mapping", "AI assistants", "APIs", "Governance"],
      coreOutputs: ["80-slide deck", "6 labs", "workflow templates", "solution assets"],
      labs: [
        {
          slug: "workflow-map",
          title: "Workflow mapping exercise",
          deliverable: "An end-to-end automation design for an AJB process",
          successSignal: "Participants can show inputs, outputs, controls, and exception paths",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 6,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
    },
    {
      slug: "advanced-data-visualization",
      title: "Advanced Data Visualization",
      sequence: 6,
      status: "draft",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 3,
      hoursPerDay: 4,
      dates: { startsOn: "2026-06-28", endsOn: "2026-06-30" },
      summary:
        "An executive-grade visualisation module covering advanced charting, geospatial views, interactive dashboards, and banking storytelling.",
      audience: sharedAudience,
      learningObjectives: [
        "Design decision-ready data visualisations for banking stakeholders.",
        "Build advanced charts and dashboards from structured banking data.",
        "Communicate insights clearly to executives and operations leaders.",
      ],
      keyThemes: ["Visual design", "Advanced charts", "Geospatial analysis", "Dashboards", "Storytelling"],
      coreOutputs: ["80-slide deck", "8 labs", "dashboard prototypes", "review rubrics"],
      labs: [
        {
          slug: "dashboard-studio",
          title: "Interactive dashboard studio",
          deliverable: "A dashboard concept for AJB senior management",
          successSignal: "Participants can defend chart choices, hierarchy, and usability",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 8,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
    },
    {
      slug: "ai-in-banking-and-finance",
      title: "AI in Banking and Finance",
      sequence: 7,
      status: "draft",
      participantAccess: "locked",
      deliveryMode: "online",
      durationDays: 1,
      hoursPerDay: 4,
      dates: { startsOn: "2026-07-16", endsOn: "2026-07-16" },
      summary:
        "A one-day strategic module focused on AI use cases in finance, prompt engineering, responsible adoption, and AI risk in regulated environments.",
      audience: sharedAudience,
      learningObjectives: [
        "Understand how AI and generative AI are applied across banking functions.",
        "Assess risk, compliance, and ethical considerations of AI in finance.",
        "Engage confidently in AI strategy and prompt-design discussions.",
      ],
      keyThemes: ["GenAI in finance", "Prompt engineering", "Use cases", "Risk and governance"],
      coreOutputs: ["80-slide deck", "4 labs", "prompt bank", "case-study workbook"],
      labs: [
        {
          slug: "prompt-studio",
          title: "Prompt design studio",
          deliverable: "A prompt set for an AJB banking assistant scenario",
          successSignal: "Participants can improve prompts while controlling risk and ambiguity",
        },
      ],
      contentModel: {
        targetSlideCount: 80,
        labCount: 4,
        assetPack: standardModuleAssets,
        sections: buildStandardSections(),
      },
    },
  ],
};

const trainingModuleDeliveryMap: Record<string, TrainingModuleDelivery> = {
  "programme-orientation": {
    deck: {
      href: "/programme-orientation",
      title: "Programme Orientation participant deck",
    },
    workbookHref: "/programme-orientation/participant-workbook.md",
    facilitatorHref: "/facilitator/programme-orientation",
    participantExperience: "cohort-orientation",
    resources: [
      { label: "Participant deck", href: "/programme-orientation", kind: "deck" },
      { label: "Facilitator guide", href: "/programme-orientation/facilitator-guide.md", kind: "guide" },
    ],
  },
  "python-for-data": {
    deck: {
      href: "/python-training",
      title: "Python for Data participant deck",
    },
    workbookHref: "/python-training/participant-workbook.md",
    facilitatorHref: "/facilitator/python-for-data",
    participantExperience: "python-workspace",
    notebookPreviewPaths: [
      "notebooks/day1_python_foundations.ipynb",
      "notebooks/day2_numpy_pandas_core.ipynb",
      "notebooks/day3_reporting_and_handoff.ipynb",
    ],
    resources: [
      { label: "Participant deck", href: "/python-training", kind: "deck" },
      { label: "Participant workbook", href: "/python-training/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/python-training/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/python-training/notebooks/day1_python_foundations.ipynb", kind: "notebook" },
      { label: "Day 2 notebook", href: "/python-training/notebooks/day2_numpy_pandas_core.ipynb", kind: "notebook" },
      { label: "Day 3 notebook", href: "/python-training/notebooks/day3_reporting_and_handoff.ipynb", kind: "notebook" },
      { label: "Transactions dataset", href: "/python-training/data/transactions.csv", kind: "dataset" },
      { label: "Customers dataset", href: "/python-training/data/customers.csv", kind: "dataset" },
      { label: "Accounts dataset", href: "/python-training/data/accounts.csv", kind: "dataset" },
      { label: "Branches dataset", href: "/python-training/data/branches.csv", kind: "dataset" },
      { label: "Service tickets dataset", href: "/python-training/data/service_tickets.csv", kind: "dataset" },
      { label: "Solution notebook", href: "/python-training/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "machine-learning-training": {
    deck: {
      href: "/machine-learning-training",
      title: "Machine Learning Training participant deck",
    },
    workbookHref: "/machine-learning-training/participant-workbook.md",
    facilitatorHref: "/facilitator/machine-learning-training",
    participantExperience: "ml-lab",
    notebookPreviewPaths: [
      "notebooks/day1_problem_framing_and_baselines.ipynb",
      "notebooks/day2_segmentation_and_model_review.ipynb",
      "notebooks/day3_deployment_and_exec_handoff.ipynb",
    ],
    resources: [
      { label: "Participant deck", href: "/machine-learning-training", kind: "deck" },
      { label: "Participant workbook", href: "/machine-learning-training/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/machine-learning-training/facilitator-guide.md", kind: "guide" },
      {
        label: "Day 1 notebook",
        href: "/machine-learning-training/notebooks/day1_problem_framing_and_baselines.ipynb",
        kind: "notebook",
      },
      {
        label: "Day 2 notebook",
        href: "/machine-learning-training/notebooks/day2_segmentation_and_model_review.ipynb",
        kind: "notebook",
      },
      {
        label: "Day 3 notebook",
        href: "/machine-learning-training/notebooks/day3_deployment_and_exec_handoff.ipynb",
        kind: "notebook",
      },
      { label: "Service tickets dataset", href: "/machine-learning-training/data/service_tickets_ml.csv", kind: "dataset" },
      { label: "Customer segmentation dataset", href: "/machine-learning-training/data/customer_segments.csv", kind: "dataset" },
      {
        label: "Governance scenarios dataset",
        href: "/machine-learning-training/data/model_governance_scenarios.csv",
        kind: "dataset",
      },
      { label: "Solution notebook", href: "/machine-learning-training/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "neural-networks": {
    deck: {
      href: "/neural-networks",
      title: "Neural Networks participant deck",
    },
    workbookHref: "/neural-networks/participant-workbook.md",
    facilitatorHref: "/facilitator/neural-networks",
    participantExperience: "neural-lab",
    notebookPreviewPaths: [
      "notebooks/day1_neural_foundations.ipynb",
      "notebooks/day2_cnn_transfer_learning.ipynb",
    ],
    resources: [
      { label: "Participant deck", href: "/neural-networks", kind: "deck" },
      { label: "Participant workbook", href: "/neural-networks/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/neural-networks/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/neural-networks/notebooks/day1_neural_foundations.ipynb", kind: "notebook" },
      { label: "Day 2 notebook", href: "/neural-networks/notebooks/day2_cnn_transfer_learning.ipynb", kind: "notebook" },
      { label: "Training runs dataset", href: "/neural-networks/data/training_runs.csv", kind: "dataset" },
      {
        label: "Document labels dataset",
        href: "/neural-networks/data/document_classification_labels.csv",
        kind: "dataset",
      },
      { label: "Solution notebook", href: "/neural-networks/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "business-applications-in-ai": {
    deck: {
      href: "/business-applications-in-ai",
      title: "Business Applications in AI participant deck",
    },
    workbookHref: "/business-applications-in-ai/participant-workbook.md",
    facilitatorHref: "/facilitator/business-applications-in-ai",
    participantExperience: "strategy-canvas",
    resources: [
      { label: "Participant deck", href: "/business-applications-in-ai", kind: "deck" },
      { label: "Participant workbook", href: "/business-applications-in-ai/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/business-applications-in-ai/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/business-applications-in-ai/notebooks/day1_opportunity_assessment.ipynb", kind: "notebook" },
      { label: "Day 2 notebook", href: "/business-applications-in-ai/notebooks/day2_business_case_and_governance.ipynb", kind: "notebook" },
      { label: "AI opportunities dataset", href: "/business-applications-in-ai/data/ai_opportunities.csv", kind: "dataset" },
      { label: "Governance checklist", href: "/business-applications-in-ai/data/governance_checklist.csv", kind: "dataset" },
      { label: "Solution notebook", href: "/business-applications-in-ai/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "automation-in-ai": {
    deck: {
      href: "/automation-in-ai",
      title: "Automation in AI participant deck",
    },
    workbookHref: "/automation-in-ai/participant-workbook.md",
    facilitatorHref: "/facilitator/automation-in-ai",
    participantExperience: "flow-designer",
    resources: [
      { label: "Participant deck", href: "/automation-in-ai", kind: "deck" },
      { label: "Participant workbook", href: "/automation-in-ai/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/automation-in-ai/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/automation-in-ai/notebooks/day1_workflow_analysis.ipynb", kind: "notebook" },
      { label: "Day 2 notebook", href: "/automation-in-ai/notebooks/day2_automation_design.ipynb", kind: "notebook" },
      { label: "Workflow inventory", href: "/automation-in-ai/data/workflow_inventory.csv", kind: "dataset" },
      { label: "Automation candidates", href: "/automation-in-ai/data/automation_candidates.csv", kind: "dataset" },
      { label: "Solution notebook", href: "/automation-in-ai/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "advanced-data-visualization": {
    deck: {
      href: "/advanced-data-visualization",
      title: "Advanced Data Visualization participant deck",
    },
    workbookHref: "/advanced-data-visualization/participant-workbook.md",
    facilitatorHref: "/facilitator/advanced-data-visualization",
    participantExperience: "viz-studio",
    notebookPreviewPaths: [
      "notebooks/day1_chart_fundamentals.ipynb",
      "notebooks/day2_dashboard_composition.ipynb",
      "notebooks/day3_executive_reporting.ipynb",
    ],
    resources: [
      { label: "Participant deck", href: "/advanced-data-visualization", kind: "deck" },
      { label: "Participant workbook", href: "/advanced-data-visualization/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/advanced-data-visualization/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/advanced-data-visualization/notebooks/day1_chart_fundamentals.ipynb", kind: "notebook" },
      { label: "Day 2 notebook", href: "/advanced-data-visualization/notebooks/day2_dashboard_composition.ipynb", kind: "notebook" },
      { label: "Day 3 notebook", href: "/advanced-data-visualization/notebooks/day3_executive_reporting.ipynb", kind: "notebook" },
      { label: "Branch performance", href: "/advanced-data-visualization/data/branch_performance.csv", kind: "dataset" },
      { label: "Customer metrics", href: "/advanced-data-visualization/data/customer_metrics.csv", kind: "dataset" },
      { label: "Regional data", href: "/advanced-data-visualization/data/regional_data.csv", kind: "dataset" },
      { label: "Solution notebook", href: "/advanced-data-visualization/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
  "ai-in-banking-and-finance": {
    deck: {
      href: "/ai-in-banking-and-finance",
      title: "AI in Banking and Finance participant deck",
    },
    workbookHref: "/ai-in-banking-and-finance/participant-workbook.md",
    facilitatorHref: "/facilitator/ai-in-banking-and-finance",
    participantExperience: "prompt-studio",
    resources: [
      { label: "Participant deck", href: "/ai-in-banking-and-finance", kind: "deck" },
      { label: "Participant workbook", href: "/ai-in-banking-and-finance/participant-workbook.md", kind: "workbook" },
      { label: "Facilitator guide", href: "/ai-in-banking-and-finance/facilitator-guide.md", kind: "guide" },
      { label: "Day 1 notebook", href: "/ai-in-banking-and-finance/notebooks/day1_use_case_and_prompt_studio.ipynb", kind: "notebook" },
      { label: "AI use cases dataset", href: "/ai-in-banking-and-finance/data/ai_use_cases_banking.csv", kind: "dataset" },
      { label: "Prompt templates", href: "/ai-in-banking-and-finance/data/prompt_templates.csv", kind: "dataset" },
      { label: "Solution notebook", href: "/ai-in-banking-and-finance/notebooks/solutions.ipynb", kind: "solution" },
    ],
  },
};

const trainingModuleEnhancementMap: Record<string, TrainingModuleEnhancement> = {
  "programme-orientation": {
    bankingContext: [
      "Day 1 is the cohort's first shared experience as a working unit; warm introductions and a shared working agreement set the tone for every later module.",
      "AJB participants arrive from different functions, so the orientation gives the room a common map of the seven-module journey before any technical content begins.",
      "The studio is the bank's home for the programme; activating it on Day 1 prevents access and login friction from polluting Module 1 the next morning.",
    ],
    pacingNotes: [
      "Five hours including breaks. Use the four blocks (welcome, journey, studio, plan) as your spine and protect each breakout's full timer.",
      "Resist the urge to make Day 1 technical. The value is connection, navigation, and a written personal plan, not pre-teaching Python.",
      "If the room moves quickly, lengthen the trio review in Breakout 3 so each plan gets sharper, not so the day finishes early.",
    ],
    engagementPrompts: [
      "Use the paired icebreaker to make sure every voice is heard before any module is described.",
      "After the future-self portrait breakout, surface the two or three worries that appear across multiple groups as cohort signals to coach into.",
      "Close with each participant speaking one specific, dated commitment aloud to the room.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who are newer to AI, data work, or formal cohort programmes.",
        guidance: "Stay close to the four-block structure, use the worked example for the achievement plan, and lean on your trio for sharpening questions.",
        outcome: "Finish Day 1 inside the studio with a clear, concise four-section achievement plan and a spoken commitment.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already lead programmes, projects, or technical teams at the bank.",
        guidance: "Use Breakout 1 to mentor someone newer in your group and use Breakout 3 to write a more ambitious capstone-grade plan.",
        outcome: "Finish Day 1 with a stretch achievement plan, named delivery moments inside your function, and a leadership-quality commitment.",
      },
    ],
  },
  "python-for-data": {
    bankingContext: [
      "Banking data comes from customer, account, transaction, branch, and service systems. Analysts need a repeatable way to inspect and join them before any KPI or model work starts.",
      "Typical AJB-style use cases include transaction quality checks, branch performance reviews, customer segmentation prep, and ML handoff table creation.",
      "The main risk is false confidence. Fast spreadsheet work can hide duplicate keys, invalid categories, and denominator problems that Python makes easier to expose and document.",
    ],
    pacingNotes: [
      "Use a short orientation block at the start of each day so participants can settle into the notebook before the analysis begins.",
      "Protect the core path first. Environment setup, triage logic, joins, and executive communication stay mandatory even if the room slows down.",
      "Treat stretch work as optional. Stronger participants can take extra chart polish, exception logic, and leakage checks without forcing the full cohort to race.",
    ],
    engagementPrompts: [
      "Checkpoint after the first successful notebook run.",
      "Debrief every major lab with one defend-the-metric discussion.",
      "Use a short show-and-tell at the end of each day so participants can compare assumptions.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who are newer to Python or notebook-based analysis.",
        guidance: "Follow the core tasks in order, keep written notes short, and stop at each checkpoint before moving on.",
        outcome: "Finish the day with defendable core outputs even if stretch tasks remain unfinished.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already work comfortably with Python, pandas, or structured analysis.",
        guidance: "Complete the core path quickly, then move into denominator testing, richer QC artefacts, and stronger executive framing.",
        outcome: "Produce the same core outputs plus challenge-ready stretch artefacts and stronger caveat handling.",
      },
    ],
    toolComparisonTitle: "Python compared with other analysis tools",
    toolComparisonRows: [
      {
        tool: "Python",
        bestFor: "Repeatable data cleaning, multi-table joins, richer QC, charts, and ML handoff.",
        watchout: "Higher setup and learning overhead for new users.",
      },
      {
        tool: "Excel",
        bestFor: "Quick inspection, ad hoc checks, and lightweight manual review.",
        watchout: "Harder to reproduce complex logic or scale safely across larger extracts.",
      },
      {
        tool: "SQL",
        bestFor: "Pulling, filtering, and aggregating structured source data close to the warehouse.",
        watchout: "Less suitable on its own for notebook-style storytelling, charting, and local experimentation.",
      },
      {
        tool: "BI tools",
        bestFor: "Dashboards, repeat reporting, and stakeholder consumption.",
        watchout: "Usually weaker for first-pass data triage, custom cleaning, and exploratory feature work.",
      },
    ],
  },
  "machine-learning-training": {
    bankingContext: [
      "Machine learning matters when a bank needs consistent decisions at scale, such as routing service cases, prioritising customers, or spotting risk patterns early.",
      "The useful question is not which algorithm is newest. It is which model changes a business decision in a controlled, measurable way.",
      "In regulated settings, metric choice, explainability, ownership, and monitoring are as important as raw score improvement.",
    ],
    pacingNotes: [
      "Keep problem framing and metric interpretation slow enough for mixed-level discussion before model building speeds up.",
      "Use segmentation and model comparison labs as the split point between core work and advanced stretch analysis.",
      "Protect executive communication time on Day 3 so the module lands as a business decision discipline, not only a coding exercise.",
    ],
    engagementPrompts: [
      "Ask participants to define the business action before naming a model.",
      "Pause for a false-positive versus false-negative debate in each supervised example.",
      "Close Day 3 with short executive recommendation readouts.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who are new to machine learning concepts or need more structure after Module 1.",
        guidance: "Stay on baseline models, simpler evaluation views, and clear business reasoning for each metric choice.",
        outcome: "Finish with one defensible supervised workflow, one clustering interpretation, and a concise governance-aware recommendation.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already know the basics of model evaluation and feature design.",
        guidance: "Use stretch time for comparison depth, threshold tuning, segment interpretation, and monitoring design detail.",
        outcome: "Finish with stronger comparison evidence, clearer trade-off logic, and a more robust executive recommendation.",
      },
    ],
  },
  "neural-networks": {
    bankingContext: [
      "Neural networks become useful when banking signals are less linear or involve unstructured artefacts such as documents or images.",
      "Participants need a practical bridge from traditional models to neural concepts without getting lost in math-heavy detail.",
      "The most important business question is whether the extra model complexity is justified by the use case, controls, and operating burden.",
    ],
    pacingNotes: [
      "Slow down the first day at core vocabulary, layers, training intuition, and data preparation.",
      "Keep advanced tuning and transfer-learning detail as a stretch path so the room stays together.",
      "Use diagrams and worked examples before notebook implementation whenever a concept feels abstract.",
    ],
    engagementPrompts: [
      "Use analogy-based check-ins for layers, weights, and feature extraction.",
      "Pause after the first model run to interpret results in plain language.",
      "End each day with one use-case mapping exercise back to banking.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who understand Python but are new to neural network thinking.",
        guidance: "Focus on concept fluency, data preparation, and interpreting model behaviour rather than advanced tuning.",
        outcome: "Finish with a clear understanding of when a neural approach is justified and how to explain it safely.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already know basic ML workflows and want to go deeper.",
        guidance: "Take the stretch path into tuning experiments, transfer learning, and more detailed performance trade-offs.",
        outcome: "Finish with a stronger comparison of model variants and clearer judgement on complexity versus value.",
      },
    ],
  },
  "business-applications-in-ai": {
    bankingContext: [
      "Banks need AI prioritisation, not idea overload. The value comes from choosing the right workflows and governance approach.",
      "Useful strategy work links opportunity size, operational readiness, owner accountability, and risk controls in one decision frame.",
      "Participants should leave knowing how to challenge an AI proposal, not only how to promote one.",
    ],
    pacingNotes: [
      "Give more room to discussion and scoring because virtual strategy exercises take longer than slide delivery alone.",
      "Keep the top-opportunity shortlist and governance review as the must-do outputs.",
      "Use peer review and executive recommendation work as the advanced extension when the room is moving quickly.",
    ],
    engagementPrompts: [
      "Use live ranking polls before revealing the workbook scoring output.",
      "Ask each table or pair to defend one parked use case as well as one shortlisted use case.",
      "End Day 2 with a short executive committee simulation.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who are newer to AI strategy or prefer a clearer worksheet-led structure.",
        guidance: "Use the provided scoring framework closely and keep recommendations concise and evidence-based.",
        outcome: "Finish with a defendable prioritisation, governance gap view, and executive summary.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who can move quickly through the core framework.",
        guidance: "Use stretch time for sequencing logic, sensitivity analysis, and stronger operating-model design.",
        outcome: "Finish with a richer business case and a more resilient recommendation under challenge.",
      },
    ],
  },
  "automation-in-ai": {
    bankingContext: [
      "Automation matters where work is repetitive, rules can be defined, and human review points remain explicit.",
      "Banks need more than process speed. They need clear exception handling, ownership, auditability, and fallback procedures.",
      "The best automation designs show where AI helps and where human judgement must stay visible.",
    ],
    pacingNotes: [
      "Keep workflow mapping slow enough that participants describe the current state properly before designing the future state.",
      "Treat tooling examples as supports, not the core output. The main goal is a governed automation design.",
      "Use advanced time for stronger exception paths, confidence thresholds, and implementation sequencing.",
    ],
    engagementPrompts: [
      "Checkpoint once participants map the current state before they jump into solutioning.",
      "Use one governance challenge prompt in every design review.",
      "Close with a quick trade-off discussion between speed, control, and review burden.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who are newer to workflow design or automation concepts.",
        guidance: "Stay close to the core workflow-mapping template and focus on one clear automation proposal with visible controls.",
        outcome: "Finish with one well-structured automation design that names owners, controls, and fallback steps.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already understand workflow analysis and want more design complexity.",
        guidance: "Use stretch time for multi-step automation, confidence thresholds, and implementation phasing.",
        outcome: "Finish with a more complete target operating model and stronger governance detail.",
      },
    ],
  },
  "advanced-data-visualization": {
    bankingContext: [
      "Executive audiences need charts that support decisions, not charts that merely look sophisticated.",
      "Banking stories often involve branch performance, segment behaviour, regional differences, and trend shifts that must be made visible without distortion.",
      "Richer datasets improve this module because more variation creates more realistic choices about what to highlight or suppress.",
    ],
    pacingNotes: [
      "Protect chart critique time because visual judgement develops through comparison, not just instruction.",
      "Keep one clean-chart core path for everyone, then use dashboard composition and storytelling polish as the advanced layer.",
      "If time tightens, cut optional embellishment before cutting explanation of chart choice and audience fit.",
    ],
    engagementPrompts: [
      "Use quick chart critique rounds with one improvement each.",
      "Pause after every dashboard draft for hierarchy and clutter review.",
      "End with short leadership-readout practice, not just silent exports.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who want a stronger foundation in chart choice and executive communication.",
        guidance: "Prioritise clarity, denominator choice, and strong titles before attempting interactive or complex layouts.",
        outcome: "Finish with a smaller number of stronger visuals that stand up to executive scrutiny.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already create charts comfortably and want more sophistication.",
        guidance: "Use stretch time for dashboard composition, interactivity thinking, geospatial framing, and stronger annotation.",
        outcome: "Finish with a polished decision-ready dashboard concept and more advanced storytelling technique.",
      },
    ],
  },
  "ai-in-banking-and-finance": {
    bankingContext: [
      "This capstone module helps participants connect GenAI and broader AI use cases to banking strategy, risk, and adoption choices.",
      "The main value is informed judgement: where AI fits, where it does not, and which controls need to be visible from the start.",
      "Because the module is short, the narrative must stay strategic, concrete, and highly discussion-oriented.",
    ],
    pacingNotes: [
      "Use a crisp opening context block because the module has only one day and needs quick alignment.",
      "Protect prompt critique and risk discussion time. These conversations are where mixed-level learners contribute most.",
      "Keep the prompt studio as the core lab and use additional use-case comparisons as stretch work.",
    ],
    engagementPrompts: [
      "Start with one myth-versus-reality poll on GenAI in finance.",
      "Use short risk challenge prompts during the prompt studio.",
      "Close with one actionable adoption principle from each participant.",
    ],
    learnerTracks: [
      {
        id: "intro",
        title: "Intro path",
        fit: "Best for participants who want a clear strategic grounding before experimenting with prompts.",
        guidance: "Stay on the core use-case, prompt, and risk evaluation flow with concise written outputs.",
        outcome: "Finish with a sound understanding of AI use cases, prompt discipline, and regulated-adoption guardrails.",
      },
      {
        id: "advanced",
        title: "Advanced path",
        fit: "Best for participants who already use AI tools and want deeper challenge.",
        guidance: "Use stretch time for prompt iteration depth, multi-scenario comparison, and sharper risk mitigation language.",
        outcome: "Finish with more refined prompt sets and a stronger strategic perspective on adoption trade-offs.",
      },
    ],
  },
};

export function getTrainingProgrammeBySlug(programmeSlug: string) {
  return programmeSlug === ajbTrainingProgramme.slug ? ajbTrainingProgramme : null;
}

export function getTrainingModules() {
  return ajbTrainingProgramme.modules;
}

export function getTrainingModuleBySlug(programmeSlug: string, moduleSlug: string) {
  const programme = getTrainingProgrammeBySlug(programmeSlug);
  if (!programme) return null;
  return programme.modules.find((module) => module.slug === moduleSlug) ?? null;
}

export function getTrainingLabBySlug(programmeSlug: string, moduleSlug: string, labSlug: string) {
  const trainingModule = getTrainingModuleBySlug(programmeSlug, moduleSlug);
  if (!trainingModule) return null;
  return trainingModule.labs.find((lab) => lab.slug === labSlug) ?? null;
}

export function getTrainingDeliveryStats() {
  const modules = getTrainingModules();
  const totalTargetSlides = modules.reduce((sum, module) => sum + module.contentModel.targetSlideCount, 0);
  const totalLabs = modules.reduce((sum, module) => sum + module.contentModel.labCount, 0);
  return {
    moduleCount: modules.length,
    totalTargetSlides,
    totalLabs,
  };
}

export function getTrainingPriorityModules() {
  return getTrainingModules().filter((module) => module.sequence <= 3);
}

export function getTrainingModuleDelivery(moduleSlug: string): TrainingModuleDelivery | null {
  return trainingModuleDeliveryMap[moduleSlug] ?? null;
}

export function getTrainingModuleDeck(moduleSlug: string): TrainingModuleDeck | null {
  return getTrainingModuleDelivery(moduleSlug)?.deck ?? null;
}

export function getTrainingModuleWorkbookHref(moduleSlug: string) {
  return getTrainingModuleDelivery(moduleSlug)?.workbookHref ?? null;
}

export function getTrainingModuleFacilitatorHref(
  moduleSlug: string,
  mode: "prepare" | "deliver" | "review" = "prepare",
) {
  if (!getTrainingModuleDelivery(moduleSlug)) return null;
  return `/facilitator/m/${moduleSlug}/${mode}`;
}

export function getTrainingModuleLegacyFacilitatorHref(moduleSlug: string) {
  return getTrainingModuleDelivery(moduleSlug)?.facilitatorHref ?? null;
}

export function getTrainingModuleParticipantExperience(moduleSlug: string): TrainingParticipantExperience {
  return getTrainingModuleDelivery(moduleSlug)?.participantExperience ?? "deck";
}

export function getTrainingModuleNotebookPreviewPaths(moduleSlug: string) {
  return getTrainingModuleDelivery(moduleSlug)?.notebookPreviewPaths ?? [];
}

export function getTrainingModuleResources(moduleSlug: string): TrainingModuleResource[] {
  return getTrainingModuleDelivery(moduleSlug)?.resources ?? [];
}

export function getTrainingModuleEnhancement(moduleSlug: string): TrainingModuleEnhancement | null {
  return trainingModuleEnhancementMap[moduleSlug] ?? null;
}
