import type { PythonTaskCheck } from "@/lib/python-task-checks";
import { resolvePythonTaskChecksForCheckpoint } from "@/lib/python-task-checks";

export type TrainingLabCheckpoint = {
  slug: string;
  title: string;
  description: string;
  notebookSlug: string;
  blockIndex: number;
  startSlide: number;
  endSlide: number;
  facilitatorPrompt: string;
  tasks?: PythonTaskCheck[];
  interventionPrompts?: Array<{
    startSlide: number;
    endSlide: number;
    label: string;
    prompt: string;
  }>;
};

const pythonLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "setup-sprint",
    title: "Setup sprint",
    description: "Open the Day 1 notebook, run the setup block, and confirm the data and output paths are working.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 9,
    facilitatorPrompt: "Pause here and complete the setup sprint in the Python workspace before moving on.",
    tasks: resolvePythonTaskChecksForCheckpoint("setup-sprint"),
    interventionPrompts: [
      {
        startSlide: 1,
        endSlide: 4,
        label: "Open materials",
        prompt:
          "If you are not yet inside the Day 1 notebook and training folder, stop here, open the materials now, and rejoin once both are visible.",
      },
      {
        startSlide: 5,
        endSlide: 7,
        label: "Run setup block",
        prompt:
          "Run the Day 1 setup block now. Do not move on until the imports work and your data and output paths are visible in the notebook.",
      },
      {
        startSlide: 8,
        endSlide: 9,
        label: "Fix setup issues",
        prompt:
          "If your setup cell failed, stay here and fix the import or file path issue now. Do not continue until the notebook runs cleanly.",
      },
    ],
  },
  {
    slug: "data-triage",
    title: "Data triage",
    description: "Load the transactions extract, inspect the DataFrame, and make a defensible first-pass fitness judgement.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 13,
    endSlide: 18,
    facilitatorPrompt: "Please complete the data triage checkpoint now and record whether the extract is fit, partly fit, or not yet fit.",
    tasks: resolvePythonTaskChecksForCheckpoint("data-triage"),
    interventionPrompts: [
      {
        startSlide: 13,
        endSlide: 14,
        label: "Load the extract",
        prompt:
          "Load the transactions extract now and confirm you can see the DataFrame shape, columns, and first rows before following the next slide.",
      },
      {
        startSlide: 15,
        endSlide: 16,
        label: "Inspect data quality",
        prompt:
          "Pause and complete the five opening checks now. Look for missing values, odd data types, suspicious ranges, and duplicate records before moving on.",
      },
      {
        startSlide: 17,
        endSlide: 18,
        label: "State the judgement",
        prompt:
          "Make the triage judgement now. Decide whether the extract is fit, partly fit, or not yet fit, and be ready to justify that answer with evidence from the notebook.",
      },
    ],
  },
  {
    slug: "kpi-build",
    title: "KPI build",
    description: "Move into the Day 2 notebook and build joined analysis outputs, branch KPIs, and quality evidence.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 34,
    endSlide: 45,
    facilitatorPrompt: "Take a moment to finish the KPI build checkpoint in the Day 2 notebook before continuing.",
    tasks: resolvePythonTaskChecksForCheckpoint("kpi-build"),
    interventionPrompts: [
      {
        startSlide: 34,
        endSlide: 37,
        label: "Set up the join",
        prompt:
          "Move into the Day 2 notebook now and get the join working before you continue. Make sure the tables connect on the intended keys.",
      },
      {
        startSlide: 38,
        endSlide: 42,
        label: "Build the KPI view",
        prompt:
          "Complete the KPI build now. Your branch-level output should show the core measures clearly before you continue with the deck.",
      },
      {
        startSlide: 43,
        endSlide: 45,
        label: "Quality-check the output",
        prompt:
          "Pause here and quality-check the KPI output. Confirm the counts, totals, and grouping logic make business sense before moving forward.",
      },
    ],
  },
  {
    slug: "reporting-pack",
    title: "Reporting pack",
    description: "Use the Day 3 notebook to create reporting outputs, exception views, and ML handoff artefacts.",
    notebookSlug: "day3",
    blockIndex: 1,
    startSlide: 50,
    endSlide: 67,
    facilitatorPrompt: "Complete the reporting pack checkpoint now so your charts and handoff outputs are ready for review.",
    tasks: resolvePythonTaskChecksForCheckpoint("reporting-pack"),
    interventionPrompts: [
      {
        startSlide: 50,
        endSlide: 56,
        label: "Build reporting outputs",
        prompt:
          "Use the Day 3 notebook now to build the reporting outputs. Do not move on until the first chart or table is rendering correctly.",
      },
      {
        startSlide: 57,
        endSlide: 62,
        label: "Create exception views",
        prompt:
          "Pause and create the exception view now. Your notebook should isolate the cases that need escalation or follow-up before you continue.",
      },
      {
        startSlide: 63,
        endSlide: 67,
        label: "Prepare the ML handoff",
        prompt:
          "Finish the reporting pack now by preparing the handoff output for downstream modelling. Make sure the final artefacts are saved and reviewable.",
      },
    ],
  },
];

const machineLearningLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "ml-problem-framing",
    title: "Problem framing",
    description: "Frame the banking decision, define the target properly, and separate ML from rules and BI.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 20,
    facilitatorPrompt: "Pause here and tighten the ML problem framing before moving deeper into modelling.",
    interventionPrompts: [
      {
        startSlide: 1,
        endSlide: 10,
        label: "Frame the decision",
        prompt:
          "Pause here and state the banking decision clearly. Be explicit about the action, owner, decision horizon, and cost of error before moving on.",
      },
      {
        startSlide: 11,
        endSlide: 20,
        label: "Control leakage and inputs",
        prompt:
          "Stop here and test your feature and label logic. Make sure the room can explain what is known at decision time and what would create leakage.",
      },
    ],
  },
  {
    slug: "ml-baseline-evaluation",
    title: "Baseline evaluation",
    description: "Build a credible baseline, evaluate it carefully, and interpret the trade-offs in business language.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 21,
    endSlide: 30,
    facilitatorPrompt: "Complete the baseline evaluation checkpoint now before the room moves on.",
    interventionPrompts: [
      {
        startSlide: 21,
        endSlide: 24,
        label: "Build the baseline",
        prompt:
          "Build the baseline now before discussing stronger models. The room should be able to explain why this first benchmark is credible.",
      },
      {
        startSlide: 25,
        endSlide: 28,
        label: "Interpret metrics",
        prompt:
          "Pause and translate the evaluation metrics into business consequences now. Do not move on until precision, recall, and threshold trade-offs are clear.",
      },
      {
        startSlide: 29,
        endSlide: 30,
        label: "Finish Lab 1 judgement",
        prompt:
          "Close Lab 1 properly now. Decide whether the baseline is acceptable, what error matters most, and what should change next.",
      },
    ],
  },
  {
    slug: "ml-segmentation",
    title: "Segmentation studio",
    description: "Use unsupervised learning to create actionable segments, not just mathematically neat clusters.",
    notebookSlug: "day2",
    blockIndex: 0,
    startSlide: 31,
    endSlide: 41,
    facilitatorPrompt: "Pause for the segmentation checkpoint now and make sure the cluster story is business-usable.",
    interventionPrompts: [
      {
        startSlide: 31,
        endSlide: 35,
        label: "Set up segmentation logic",
        prompt:
          "Set up the segmentation logic now. The features should support action, not just technical separation.",
      },
      {
        startSlide: 36,
        endSlide: 39,
        label: "Interpret the segments",
        prompt:
          "Pause and interpret the segments now. The room should be able to describe each cluster in business terms, not only technical averages.",
      },
      {
        startSlide: 40,
        endSlide: 41,
        label: "Complete Lab 2",
        prompt:
          "Finish the segmentation studio now and state what action each segment would actually trigger in a banking setting.",
      },
    ],
  },
  {
    slug: "ml-model-governance",
    title: "Model comparison and governance",
    description: "Compare models fairly, surface explainability trade-offs, and pressure-test governance readiness.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 42,
    endSlide: 60,
    facilitatorPrompt: "Use this checkpoint to compare candidate models and challenge governance weakness before continuing.",
    interventionPrompts: [
      {
        startSlide: 42,
        endSlide: 49,
        label: "Compare model families",
        prompt:
          "Pause and compare the candidate model families now. The room should justify the model choice in terms of performance, clarity, and operating burden.",
      },
      {
        startSlide: 50,
        endSlide: 56,
        label: "Surface governance risk",
        prompt:
          "Stop here and test the governance position. Make sure fairness, monitoring, and human oversight are explicit before moving on.",
      },
      {
        startSlide: 57,
        endSlide: 60,
        label: "Complete Lab 3",
        prompt:
          "Finish the model comparison checkpoint now. Be ready to defend why one model is stronger for the bank, not just stronger on paper.",
      },
    ],
  },
  {
    slug: "ml-deployment-recommendation",
    title: "Deployment recommendation",
    description: "Move from model thinking into decision-system thinking and finish with leadership-ready recommendations.",
    notebookSlug: "day3",
    blockIndex: 0,
    startSlide: 61,
    endSlide: 80,
    facilitatorPrompt: "Pause here and convert the modelling discussion into a clear deployment and leadership recommendation.",
    interventionPrompts: [
      {
        startSlide: 61,
        endSlide: 69,
        label: "Design the operating model",
        prompt:
          "Pause and define the production operating model now. Scoring mode, monitoring, failure handling, and fallback logic should all be clear.",
      },
      {
        startSlide: 70,
        endSlide: 76,
        label: "Shape the executive story",
        prompt:
          "Stop here and rehearse the executive recommendation. The message should be concise, caveated, and decision-oriented.",
      },
      {
        startSlide: 77,
        endSlide: 80,
        label: "Close the capstone",
        prompt:
          "Finish the capstone properly now. The recommendation should state the choice, the evidence, the caveats, and the next move.",
      },
    ],
  },
];

const neuralNetworksLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "nn-core-intuition",
    title: "Core intuition",
    description: "Build intuition for neurons, layers, and forward flow before the mechanics become more detailed.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 10,
    facilitatorPrompt: "Pause here and make sure the room genuinely understands the neural intuition before moving on.",
    interventionPrompts: [
      {
        startSlide: 1,
        endSlide: 5,
        label: "Position the tool correctly",
        prompt:
          "Pause here and make sure the room can explain when a neural approach is justified and when a simpler model would still be stronger.",
      },
      {
        startSlide: 6,
        endSlide: 10,
        label: "Explain the flow simply",
        prompt:
          "Stop here and restate the neural flow in plain language. Inputs, hidden layers, and outputs should all make sense before continuing.",
      },
    ],
  },
  {
    slug: "nn-training-mechanics",
    title: "Training mechanics",
    description: "Understand activations, loss, backpropagation, and training behavior well enough to diagnose model issues later.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 11,
    endSlide: 24,
    facilitatorPrompt: "Use this checkpoint to make sure the room really understands how neural training works.",
    interventionPrompts: [
      {
        startSlide: 11,
        endSlide: 17,
        label: "Understand activations and loss",
        prompt:
          "Pause and check that activations and loss functions are clear now. Participants should be able to explain what each part is doing.",
      },
      {
        startSlide: 18,
        endSlide: 24,
        label: "Understand the training loop",
        prompt:
          "Stop here and walk through the training loop again. The room should understand backpropagation, learning rate, and epochs in practical terms.",
      },
    ],
  },
  {
    slug: "nn-diagnosis",
    title: "Failure modes and diagnosis",
    description: "Read learning curves, spot overfitting, and reason about what architecture or training change is needed next.",
    notebookSlug: "day1",
    blockIndex: 2,
    startSlide: 25,
    endSlide: 40,
    facilitatorPrompt: "Pause for the diagnosis checkpoint now and make sure the room can read model behavior from evidence.",
    interventionPrompts: [
      {
        startSlide: 25,
        endSlide: 31,
        label: "Read the training evidence",
        prompt:
          "Pause and read the learning evidence now. The room should be able to explain what the curves say before suggesting any remedy.",
      },
      {
        startSlide: 32,
        endSlide: 36,
        label: "Choose a sensible architecture",
        prompt:
          "Stop here and pressure-test the architecture choice. Make sure depth, width, data volume, and compute burden all make sense together.",
      },
      {
        startSlide: 37,
        endSlide: 40,
        label: "Close day 1 strongly",
        prompt:
          "Use this moment to close Day 1 properly. Participants should be able to diagnose what is going wrong and what change they would try next.",
      },
    ],
  },
  {
    slug: "nn-cnn-transfer",
    title: "CNN and transfer learning",
    description: "Connect neural concepts to document and image tasks in realistic banking settings.",
    notebookSlug: "day2",
    blockIndex: 0,
    startSlide: 41,
    endSlide: 53,
    facilitatorPrompt: "Pause for the CNN checkpoint now and connect the architecture choice to realistic data and operating conditions.",
    interventionPrompts: [
      {
        startSlide: 41,
        endSlide: 47,
        label: "Understand CNN logic",
        prompt:
          "Pause and explain what convolution and pooling are doing before you move on. The room should understand why local visual structure changes the modelling approach.",
      },
      {
        startSlide: 48,
        endSlide: 53,
        label: "Use transfer learning sensibly",
        prompt:
          "Stop here and test the transfer learning logic. Participants should be able to explain why fine-tuning or feature extraction is the sensible enterprise choice.",
      },
    ],
  },
  {
    slug: "nn-evaluation-control",
    title: "Evaluation and control",
    description: "Keep neural work governed with disciplined evaluation, tuning, monitoring, and fallback logic.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 54,
    endSlide: 66,
    facilitatorPrompt: "Use this checkpoint to pull the room back from architecture excitement into operating judgement.",
    interventionPrompts: [
      {
        startSlide: 54,
        endSlide: 60,
        label: "Evaluate and tune with discipline",
        prompt:
          "Pause and keep the discussion disciplined. Evaluation criteria, explainability, and tuning choices should all be justified before continuing.",
      },
      {
        startSlide: 61,
        endSlide: 66,
        label: "Define control and fallback",
        prompt:
          "Stop here and define the production controls now. Monitoring, ownership, rollback, and human review should all be clear.",
      },
    ],
  },
  {
    slug: "nn-recommendation-close",
    title: "Recommendation quality",
    description: "Finish with a recommendation that is leadership-ready, balanced, and explicit about caveats and alternatives.",
    notebookSlug: "day2",
    blockIndex: 2,
    startSlide: 67,
    endSlide: 80,
    facilitatorPrompt: "Pause here and move from neural enthusiasm into recommendation quality.",
    interventionPrompts: [
      {
        startSlide: 67,
        endSlide: 73,
        label: "Compare fairly against simpler options",
        prompt:
          "Pause and compare the neural option fairly against simpler alternatives. The room should state why the extra complexity is or is not worth it.",
      },
      {
        startSlide: 74,
        endSlide: 80,
        label: "Close with a leadership recommendation",
        prompt:
          "Stop here and shape the final recommendation. It should be concise, caveated, and clear about the next move for the bank.",
      },
    ],
  },
];

const businessApplicationsLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "biz-opportunity-identification",
    title: "Opportunity identification",
    description: "Identify and map where AI can create measurable business value within AJB banking workflows.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 16,
    facilitatorPrompt: "Pause here and make sure the room can distinguish genuine AI opportunities from automation hype.",
    interventionPrompts: [
      { startSlide: 1, endSlide: 8, label: "Frame the landscape", prompt: "Pause and confirm participants can articulate where AI creates real banking value versus where simpler tools are sufficient." },
      { startSlide: 9, endSlide: 16, label: "Map opportunities", prompt: "Stop here and identify at least three banking workflows where AI could improve outcomes. Be specific about the pain point and measurable impact." },
    ],
  },
  {
    slug: "biz-value-assessment",
    title: "Value and feasibility assessment",
    description: "Score AI opportunities using structured value, feasibility, and risk criteria.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 17,
    endSlide: 34,
    facilitatorPrompt: "Complete the value assessment checkpoint now. Every opportunity should have explicit scores, not just enthusiasm.",
    interventionPrompts: [
      { startSlide: 17, endSlide: 26, label: "Apply the framework", prompt: "Pause and apply the value-feasibility-risk framework to your shortlisted opportunities. Score each dimension explicitly." },
      { startSlide: 27, endSlide: 34, label: "Rank and justify", prompt: "Stop here and produce a ranked shortlist. Be ready to defend why your top opportunity is the right first move for the bank." },
    ],
  },
  {
    slug: "biz-governance-design",
    title: "Governance design",
    description: "Define the governance controls, ethics requirements, and review gates needed before AI adoption.",
    notebookSlug: "day1",
    blockIndex: 2,
    startSlide: 35,
    endSlide: 50,
    facilitatorPrompt: "Pause for the governance checkpoint. Every recommendation needs explicit controls, not just value claims.",
    interventionPrompts: [
      { startSlide: 35, endSlide: 42, label: "Identify governance requirements", prompt: "Stop and identify the governance, compliance, and ethical requirements for your top use case." },
      { startSlide: 43, endSlide: 50, label: "Design controls", prompt: "Pause here and design the control framework. Who reviews, what triggers escalation, and how do you monitor for failure?" },
    ],
  },
  {
    slug: "biz-operating-model",
    title: "Operating model",
    description: "Choose between augmentation, automation, and customer-facing AI and define the operating path.",
    notebookSlug: "day2",
    blockIndex: 0,
    startSlide: 51,
    endSlide: 62,
    facilitatorPrompt: "Complete the operating model checkpoint. The right model depends on risk, explainability, and review capacity.",
    interventionPrompts: [
      { startSlide: 51, endSlide: 56, label: "Choose the model", prompt: "Pause and choose the operating model for your use case. Augment, automate, or customer-facing: justify the choice clearly." },
      { startSlide: 57, endSlide: 62, label: "Define the path", prompt: "Stop here and define the implementation path. Pilot scope, success criteria, and rollback conditions should all be explicit." },
    ],
  },
  {
    slug: "biz-executive-recommendation",
    title: "Executive recommendation",
    description: "Draft a leadership-ready recommendation that combines value, controls, and a clear first move.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 63,
    endSlide: 80,
    facilitatorPrompt: "Pause here and shape the executive recommendation. It should be concise, governed, and decision-ready.",
    interventionPrompts: [
      { startSlide: 63, endSlide: 72, label: "Draft the recommendation", prompt: "Pause and draft the executive recommendation. Problem, use case, value, controls, and next move should each be clear." },
      { startSlide: 73, endSlide: 80, label: "Peer review and close", prompt: "Stop here and exchange recommendations for peer review. Challenge assumptions, missing controls, and overstated value claims." },
    ],
  },
];

const automationLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "auto-workflow-mapping",
    title: "Workflow mapping",
    description: "Map an end-to-end banking process, identify steps, owners, data flows, and pain points.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 16,
    facilitatorPrompt: "Pause here and make sure the workflow map is complete before discussing automation options.",
    interventionPrompts: [
      { startSlide: 1, endSlide: 8, label: "Understand the process", prompt: "Pause and choose a banking process to map. Define the goal, owner, trigger, and end state before drawing the workflow." },
      { startSlide: 9, endSlide: 16, label: "Map the steps", prompt: "Stop here and map every step in the workflow. Include decision points, handoffs, and known pain points." },
    ],
  },
  {
    slug: "auto-touchpoint-analysis",
    title: "Automation touchpoints",
    description: "Identify which workflow steps are candidates for AI automation and which must remain human-controlled.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 17,
    endSlide: 34,
    facilitatorPrompt: "Complete the touchpoint analysis now. Not every step should be automated.",
    interventionPrompts: [
      { startSlide: 17, endSlide: 26, label: "Classify automation potential", prompt: "Pause and classify each workflow step: fully automatable, AI-assisted, or must remain manual. Justify each decision." },
      { startSlide: 27, endSlide: 34, label: "Score the candidates", prompt: "Stop here and score each automation candidate on saving, effort, and risk. Produce a prioritized list." },
    ],
  },
  {
    slug: "auto-exception-design",
    title: "Exception and fallback design",
    description: "Design the exception paths, fallback logic, and human review gates for automated workflows.",
    notebookSlug: "day1",
    blockIndex: 2,
    startSlide: 35,
    endSlide: 50,
    facilitatorPrompt: "Pause for the exception design checkpoint. Speed without control becomes operating risk.",
    interventionPrompts: [
      { startSlide: 35, endSlide: 42, label: "Design exception paths", prompt: "Pause and define what happens when automation fails, receives unexpected input, or encounters an edge case." },
      { startSlide: 43, endSlide: 50, label: "Define human review", prompt: "Stop here and define where humans must review, approve, or override automated decisions." },
    ],
  },
  {
    slug: "auto-pilot-design",
    title: "Pilot design",
    description: "Design a controlled pilot for the highest-priority automation candidate.",
    notebookSlug: "day2",
    blockIndex: 0,
    startSlide: 51,
    endSlide: 62,
    facilitatorPrompt: "Complete the pilot design checkpoint. Start narrow and prove the controls before expanding.",
    interventionPrompts: [
      { startSlide: 51, endSlide: 56, label: "Scope the pilot", prompt: "Pause and define the pilot scope. Which process, which volume, which time period, and what constitutes success?" },
      { startSlide: 57, endSlide: 62, label: "Define metrics", prompt: "Stop here and define the operating metrics. Cycle time, quality, exception volume, and cost should all be measurable." },
    ],
  },
  {
    slug: "auto-rollout-recommendation",
    title: "Rollout recommendation",
    description: "Produce a governed rollout recommendation with clear expansion criteria and monitoring.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 63,
    endSlide: 80,
    facilitatorPrompt: "Pause here and shape the rollout recommendation. Expand only after controls are proven.",
    interventionPrompts: [
      { startSlide: 63, endSlide: 72, label: "Draft the recommendation", prompt: "Pause and draft the rollout recommendation. Pilot results, expansion criteria, and monitoring requirements should all be explicit." },
      { startSlide: 73, endSlide: 80, label: "Peer review and close", prompt: "Stop here and exchange recommendations for peer critique. Challenge weak exception paths and overstated savings." },
    ],
  },
];

const advancedVizLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "viz-chart-selection",
    title: "Chart selection",
    description: "Choose the right chart type for the data story and justify the choice clearly.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 14,
    facilitatorPrompt: "Pause here and make sure chart choices are deliberate, not default.",
    interventionPrompts: [
      { startSlide: 1, endSlide: 8, label: "Understand visual principles", prompt: "Pause and review the core visual design principles before choosing any chart type." },
      { startSlide: 9, endSlide: 14, label: "Select charts deliberately", prompt: "Stop here and select chart types for your data. Justify why each form is the right choice for the message." },
    ],
  },
  {
    slug: "viz-hierarchy-design",
    title: "Hierarchy and emphasis",
    description: "Design visual hierarchy so the first message is obvious and the audience does not have to hunt for the point.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 15,
    endSlide: 30,
    facilitatorPrompt: "Complete the hierarchy checkpoint. If the audience has to hunt for the main point, the design is weak.",
    interventionPrompts: [
      { startSlide: 15, endSlide: 22, label: "Design emphasis", prompt: "Pause and apply emphasis: size, placement, annotation, and spacing. The first message should be obvious." },
      { startSlide: 23, endSlide: 30, label: "Remove clutter", prompt: "Stop here and simplify. Remove anything that does not support the primary message." },
    ],
  },
  {
    slug: "viz-dashboard-architecture",
    title: "Dashboard architecture",
    description: "Design a dashboard layout that leads the eye from summary to detail with clear narrative flow.",
    notebookSlug: "day2",
    blockIndex: 0,
    startSlide: 31,
    endSlide: 42,
    facilitatorPrompt: "Pause for the dashboard architecture checkpoint. Dashboards should lead the eye, not overwhelm it.",
    interventionPrompts: [
      { startSlide: 31, endSlide: 36, label: "Define the structure", prompt: "Pause and define the dashboard structure. Summary at the top, detail below, and clear navigation between sections." },
      { startSlide: 37, endSlide: 42, label: "Design interaction", prompt: "Stop here and decide what should be interactive and what should be static." },
    ],
  },
  {
    slug: "viz-banking-visuals",
    title: "Banking-specific visuals",
    description: "Build portfolio views, risk heatmaps, and KPI dashboards using real banking data patterns.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 43,
    endSlide: 54,
    facilitatorPrompt: "Complete the banking visuals checkpoint. Every chart should support a specific banking decision.",
    interventionPrompts: [
      { startSlide: 43, endSlide: 48, label: "Build banking charts", prompt: "Pause and build the banking-specific charts. Branch performance, segment comparisons, and trend views should all be clear." },
      { startSlide: 49, endSlide: 54, label: "Add geospatial context", prompt: "Stop here and add geographic context where it helps the decision." },
    ],
  },
  {
    slug: "viz-executive-dashboard",
    title: "Executive dashboard",
    description: "Design a leadership dashboard that makes performance, exceptions, and action priorities visible at a glance.",
    notebookSlug: "day3",
    blockIndex: 0,
    startSlide: 55,
    endSlide: 68,
    facilitatorPrompt: "Pause for the executive dashboard checkpoint. This is the capstone visual output.",
    interventionPrompts: [
      { startSlide: 55, endSlide: 62, label: "Build the executive view", prompt: "Pause and build the executive dashboard. Performance, exceptions, and priorities should all be visible without scrolling." },
      { startSlide: 63, endSlide: 68, label: "Apply critique", prompt: "Stop here and critique the dashboard. What is the first message? What is unclear? What should be removed?" },
    ],
  },
  {
    slug: "viz-close",
    title: "Module close",
    description: "Finalize the reporting pack and reflect on visual storytelling principles.",
    notebookSlug: "day3",
    blockIndex: 1,
    startSlide: 69,
    endSlide: 80,
    facilitatorPrompt: "Close the module with a polished, leadership-ready reporting pack.",
    interventionPrompts: [
      { startSlide: 69, endSlide: 74, label: "Polish and refine", prompt: "Pause and refine the final reporting pack. Apply peer feedback and ensure every visual supports a clear decision." },
      { startSlide: 75, endSlide: 80, label: "Close and submit", prompt: "Finalize your executive reporting pack. Apply the rubric and submit." },
    ],
  },
];

const aiBankingLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "aib-use-case-assessment",
    title: "Use case assessment",
    description: "Assess banking AI use cases for value, risk, and implementation readiness.",
    notebookSlug: "day1",
    blockIndex: 0,
    startSlide: 1,
    endSlide: 20,
    facilitatorPrompt: "Pause here and make sure each use case assessment is grounded in evidence, not assumption.",
    interventionPrompts: [
      { startSlide: 1, endSlide: 10, label: "Survey the landscape", prompt: "Pause and review the AI landscape in banking. Distinguish credible use cases from speculative ones." },
      { startSlide: 11, endSlide: 20, label: "Assess use cases", prompt: "Stop here and assess your top use cases. Value, risk, compliance, and oversight requirements should all be explicit." },
    ],
  },
  {
    slug: "aib-prompt-engineering",
    title: "Prompt engineering",
    description: "Design effective, constrained prompts for banking use cases with appropriate safety boundaries.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 21,
    endSlide: 40,
    facilitatorPrompt: "Complete the prompt engineering checkpoint. Prompt quality affects accuracy, but prompts are only one control.",
    interventionPrompts: [
      { startSlide: 21, endSlide: 30, label: "Design prompt structure", prompt: "Pause and design structured prompts for your use case. Include constraints, expected output format, and safety boundaries." },
      { startSlide: 31, endSlide: 40, label: "Test and iterate", prompt: "Stop here and test the prompts. Improve them to reduce ambiguity, control tone, and handle edge cases." },
    ],
  },
  {
    slug: "aib-risk-assessment",
    title: "Risk and compliance",
    description: "Evaluate AI risk, regulatory requirements, and responsible adoption controls for banking contexts.",
    notebookSlug: "day1",
    blockIndex: 2,
    startSlide: 41,
    endSlide: 58,
    facilitatorPrompt: "Pause for the risk assessment checkpoint. Every AI adoption decision needs explicit risk evaluation.",
    interventionPrompts: [
      { startSlide: 41, endSlide: 50, label: "Evaluate risk", prompt: "Pause and evaluate the risks for your use case. Bias, fairness, transparency, and regulatory exposure should all be addressed." },
      { startSlide: 51, endSlide: 58, label: "Design oversight", prompt: "Stop here and design the human oversight framework. Who reviews, what triggers escalation, and how do you monitor for drift?" },
    ],
  },
  {
    slug: "aib-leadership-briefing",
    title: "Leadership briefing",
    description: "Draft a leadership briefing that communicates AI capabilities, limitations, and recommended adoption path.",
    notebookSlug: "day1",
    blockIndex: 3,
    startSlide: 59,
    endSlide: 74,
    facilitatorPrompt: "Pause here and shape the leadership briefing. This is the capstone deliverable for the programme.",
    interventionPrompts: [
      { startSlide: 59, endSlide: 66, label: "Draft the briefing", prompt: "Pause and draft the leadership briefing. Problem, use case, value, controls, and next step should each be clear." },
      { startSlide: 67, endSlide: 74, label: "Peer review and refine", prompt: "Stop here and exchange briefings for peer review. Challenge assumptions and test the recommendation against what you learned across all seven modules." },
    ],
  },
  {
    slug: "aib-programme-close",
    title: "Programme close",
    description: "Finalize the briefing, reflect on the full programme journey, and define personal next steps.",
    notebookSlug: "day1",
    blockIndex: 4,
    startSlide: 75,
    endSlide: 80,
    facilitatorPrompt: "This is the final checkpoint of the entire programme. Close with strength.",
    interventionPrompts: [
      { startSlide: 75, endSlide: 80, label: "Programme close", prompt: "Finalize your leadership briefing. Reflect on the full seven-module journey and define what you will do differently." },
    ],
  },
];

const trainingLabCheckpointMap: Record<string, TrainingLabCheckpoint[]> = {
  "python-for-data": pythonLabCheckpoints,
  "machine-learning-training": machineLearningLabCheckpoints,
  "neural-networks": neuralNetworksLabCheckpoints,
  "business-applications-in-ai": businessApplicationsLabCheckpoints,
  "automation-in-ai": automationLabCheckpoints,
  "advanced-data-visualization": advancedVizLabCheckpoints,
  "ai-in-banking-and-finance": aiBankingLabCheckpoints,
};

export function resolveTrainingLabCheckpoints(moduleSlug: string) {
  return trainingLabCheckpointMap[moduleSlug] ?? [];
}

export function resolveCheckpointInterventionPrompt(checkpoint: TrainingLabCheckpoint, slideNumber: number) {
  const matchedPrompt = checkpoint.interventionPrompts?.find(
    (prompt) => slideNumber >= prompt.startSlide && slideNumber <= prompt.endSlide,
  );

  return matchedPrompt ?? null;
}
