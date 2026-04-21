
import type { PythonTaskCheck } from "@/lib/python-task-checks";
import { resolvePythonTaskChecksForCheckpoint } from "@/lib/python-task-checks";

export type WorkbenchTaskKind =
  | "analysis"
  | "design"
  | "code"
  | "prompt"
  | "artifact"
  | "discussion";

export type WorkbenchEvidenceKind =
  | "notes"
  | "artifact_link"
  | "file_upload"
  | "workbench_state";

export type WorkbenchTask = {
  // Discriminator so the UI can branch between Python validation tasks
  // (PythonTaskCheck) and craft-specific workbench tasks.
  taskKind: "workbench";
  id: string;
  checkpointSlug: string;
  title: string;
  prompt: string;
  successCriteria: string[];
  evidenceKinds: WorkbenchEvidenceKind[];
  kind: WorkbenchTaskKind;
};

export type TrainingLabCheckpointTask = PythonTaskCheck | WorkbenchTask;

export function isWorkbenchTask(task: TrainingLabCheckpointTask): task is WorkbenchTask {
  return (task as WorkbenchTask).taskKind === "workbench";
}

// Challenge questions sit on the Defend step of the four-step loop
// (Brief -> Engage -> Verify -> Defend). The coach picks one per
// engineer per lab and asks it after the technical work is done.
// See python-training/MODULE-REFRAME.md sections 5 and 7.
export type ChallengeQuestionType =
  | "definition"
  | "denominator"
  | "lineage"
  | "counterfactual"
  | "audience";

export type ChallengeQuestion = {
  id: string;
  type: ChallengeQuestionType;
  prompt: string;
  // Short bullets the coach uses to evaluate whether a participant's
  // written answer is shallow or substantive.
  rubric: string[];
};

// The data quality posture each lab takes toward its dataset.
// Communicated to participants in the lab brief so verification feels
// like a professional habit, not a gotcha.
export type LabDataPosture = "declared" | "mixed" | "unspecified";

export type TrainingLabCheckpoint = {
  slug: string;
  title: string;
  description: string;
  notebookSlug: string;
  blockIndex: number;
  startSlide: number;
  endSlide: number;
  facilitatorPrompt: string;
  tasks?: TrainingLabCheckpointTask[];
  interventionPrompts?: Array<{
    startSlide: number;
    endSlide: number;
    label: string;
    prompt: string;
  }>;
  challengeQuestions?: ChallengeQuestion[];
  dataPosture?: LabDataPosture;
  // The actual question leadership is asking, written in their voice. This is
  // what the participant restates in their own words on the BRIEF beat. Surfaced
  // prominently in the active task bar and passed to the coach context so the
  // coach can quote it back when asked to help with the brief.
  leadershipQuestion?: string;
};

// Helper: build the standard four-step workbench tasks for a python lab.
// Each lab in the "Truths from Bank Data" curriculum runs the same loop
// (Brief -> Engage -> Verify -> Defend). Verify is auto-validated python
// (PythonTaskCheck, supplied separately). Brief, Note-an-issue, and Defend
// are workbench tasks captured as written notes in the active task bar.
function buildPythonLabWorkbenchTasks(args: {
  slug: string;
  briefPrompt: string;
  notePrompt: string;
}): WorkbenchTask[] {
  const { slug, briefPrompt, notePrompt } = args;
  return [
    {
      taskKind: "workbench",
      id: `${slug}-brief`,
      checkpointSlug: slug,
      title: "Brief the task before you prompt",
      prompt: briefPrompt,
      successCriteria: [
        "Restate the leadership question in your own words",
        "Name what a defendable answer would have to look like",
        "Pin the one definition, denominator, cut-off, or scope choice before you talk to the AI",
      ],
      evidenceKinds: ["notes"],
      kind: "analysis",
    },
    {
      taskKind: "workbench",
      id: `${slug}-note-issue`,
      checkpointSlug: slug,
      title: "Name one issue you would flag",
      prompt: notePrompt,
      successCriteria: [
        "Name one specific issue, assumption, or weakness",
        "Say it in language a manager would understand, not in code",
        "State whether it changes your conclusion or only your confidence",
      ],
      evidenceKinds: ["notes"],
      kind: "analysis",
    },
    {
      taskKind: "workbench",
      id: `${slug}-defend`,
      checkpointSlug: slug,
      title: "Answer the challenge question",
      prompt:
        "On the Defend step the coach picks one challenge question for you. Write a one-paragraph answer using evidence from your own work. The coach holds you to the rubric.",
      successCriteria: [
        "Answer the question that was asked, not a generic recap",
        "Cite evidence from the data or your run",
        "Name what you still do not know or what could still be wrong",
      ],
      evidenceKinds: ["notes"],
      kind: "discussion",
    },
  ];
}

function pythonLabTasks(args: {
  slug: string;
  briefPrompt: string;
  notePrompt: string;
}): TrainingLabCheckpointTask[] {
  return [
    ...buildPythonLabWorkbenchTasks(args).slice(0, 1), // Brief first
    ...resolvePythonTaskChecksForCheckpoint(args.slug), // Verify (auto python)
    ...buildPythonLabWorkbenchTasks(args).slice(1), // Note + Defend last
  ];
}

// Slide ranges below are placeholders that match the current 84-slide deck.
// They will be re-anchored to the new ~60-slide deck in Phase 2 of the
// reframe (see python-training/MODULE-REFRAME.md). Verification output paths
// reuse the existing day1/day2/day3_pack folders so current notebooks keep
// working during the transition; notebook layout updates in Phase 3.
const pythonLabCheckpoints: TrainingLabCheckpoint[] = [
  {
    slug: "lab-a-triage",
    title: "Lab A: Triage an extract",
    description:
      "Leadership wants to know if a transactions extract is usable for a first performance cut. Brief the task, work the four-step loop with the coach, verify with checks you pick yourself, and write a fitness call you can defend.",
    leadershipQuestion:
      "Is this transactions extract clean enough that we can trust a first performance cut on it for next week's review? I need a 'fit / partly fit / not yet fit' call with one reason I can repeat to the board.",
    notebookSlug: "day1",
    blockIndex: 1,
    startSlide: 10,
    endSlide: 21,
    dataPosture: "declared",
    facilitatorPrompt:
      "Pause here and run Lab A end to end. The extract has at least one declared issue. Walk the room through the four-step loop and stop on the Defend write-up. The point of this lab is not the triage; it is the habit of briefing before prompting.",
    tasks: pythonLabTasks({
      slug: "lab-a-triage",
      briefPrompt:
        "Before you open the chat, write the brief. What is leadership actually asking? What would 'fit / partly fit / not yet fit' need to look like for you to commit to that answer in front of them? Pin the one definition or threshold you must lock down before any prompt is worth sending.",
      notePrompt:
        "You have looked at the extract. Pick the one issue you would walk into your manager's office to flag right now. Name what it is, what you saw that made you call it, and whether it changes your fitness call or only how confident you are in it.",
    }),
    interventionPrompts: [
      {
        startSlide: 10,
        endSlide: 13,
        label: "Brief the task",
        prompt:
          "Stop here and write your brief before you open the chat. The Brief task in the active task bar tells you what good looks like. Skip this step and the rest of the lab unravels.",
      },
      {
        startSlide: 14,
        endSlide: 19,
        label: "Engage and verify",
        prompt:
          "Now work with the coach. Inspect the extract together. Use 'Pressure-test this' and 'What might be wrong here?' to push back on what the AI hands you. The auto-validated task in the active task bar lights up when your triage output is in place.",
      },
      {
        startSlide: 20,
        endSlide: 21,
        label: "Defend with evidence",
        prompt:
          "Reach the Defend step. The coach picks one challenge question for you. Answer it in a paragraph, citing evidence from your run. Bring the answer to the debrief; be ready to read it aloud.",
      },
    ],
    challengeQuestions: [
      {
        id: "lab-a-q-definition",
        type: "definition",
        prompt:
          "Talk us through what 'fit for first-pass analysis' actually means here. If you tightened the definition by one notch, would your fitness call still hold? If you loosened it by one notch, would it flip? Where did you draw the line, and why there?",
        rubric: [
          "Names the criteria that make something 'fit' in their own words",
          "Tests the call against a stricter and a looser definition",
          "Lands on a defended position rather than a hedge",
        ],
      },
      {
        id: "lab-a-q-lineage",
        type: "lineage",
        prompt:
          "Imagine you trusted the row count without checking the source system. Which banking process would have to wobble for that row count to mislead you tomorrow? Walk us through one realistic upstream failure and what it would do to the call you just made.",
        rubric: [
          "Identifies a specific upstream system or process",
          "Describes a concrete failure mode, not a generic risk",
          "Ties the failure mode back to how the conclusion would change",
        ],
      },
      {
        id: "lab-a-q-counterfactual",
        type: "counterfactual",
        prompt:
          "Pick the single biggest data quality issue you spotted in this extract. If it had not been there, would your fitness call have changed? Talk us through the logic, and what that tells you about how brittle your judgement is.",
        rubric: [
          "Names the issue specifically",
          "Reasons through the counterfactual without overclaiming",
          "Reflects on how reliant the judgement is on a single observation",
        ],
      },
      {
        id: "lab-a-q-audience",
        type: "audience",
        prompt:
          "You are now standing in front of a CFO who already distrusts the data team. Rewrite your fitness statement for them in two sentences. What survives, what gets cut, and why?",
        rubric: [
          "Uses precise, non-hedging language a CFO can act on",
          "Keeps the most defensible evidence and drops the noise",
          "Names a specific risk or caveat without burying it",
        ],
      },
    ],
  },
  {
    slug: "lab-b-kpi",
    title: "Lab B: Define and build a branch KPI",
    description:
      "Leadership wants branch performance for last quarter. Write the numerator, denominator, exclusion logic, and cut-off rules before you open the chat. Build with the coach. Recompute under one alternative denominator. Ship the version you can defend.",
    leadershipQuestion:
      "How did each branch perform last quarter? Give me one table I can take to the regional managers on Monday: per branch, with a single performance number and any obvious outliers flagged.",
    notebookSlug: "day2",
    blockIndex: 1,
    startSlide: 23,
    endSlide: 33,
    dataPosture: "mixed",
    facilitatorPrompt:
      "Pause here for Lab B. The definitions are the lesson, not the pandas. Push the room to commit numerator, denominator, and exclusion logic in writing before they prompt the coach. If they prompt first, they have already lost the lab.",
    tasks: pythonLabTasks({
      slug: "lab-b-kpi",
      briefPrompt:
        "Before you open the chat, write the KPI brief. Numerator: what gets counted or summed, and why. Denominator: what each ratio divides by, and why that one. Exclusion logic: which rows are out of scope, and why. Cut-off rules: what date window, what timezone, what batch boundary you are assuming. Every one of these will be challenged on Defend.",
      notePrompt:
        "Look at your branch KPI table. Name one definition choice that another good engineer would push back on. Say whether their pushback would shift the ranking, the absolute numbers, or only how the table is read.",
    }),
    interventionPrompts: [
      {
        startSlide: 23,
        endSlide: 27,
        label: "Pin the definitions",
        prompt:
          "Stop the room and finish the Brief task. No prompting until numerator, denominator, exclusion, and cut-off are on the page. The whole lab pivots here.",
      },
      {
        startSlide: 28,
        endSlide: 30,
        label: "Build and stress-test",
        prompt:
          "Now build the KPI table with the coach. Once it runs, hit 'Pressure-test this' and ask the coach to argue for one alternative denominator. Recompute. Hold the two views side by side before anyone moves on.",
      },
      {
        startSlide: 31,
        endSlide: 33,
        label: "Ship the defended version",
        prompt:
          "Reach the Defend step. Pick the version of the KPI you would actually ship. The coach will challenge that pick. Be specific about why your denominator wins; vague wins are losses here.",
      },
    ],
    challengeQuestions: [
      {
        id: "lab-b-q-definition",
        type: "definition",
        prompt:
          "Imagine a customer who opens an account at one branch and transacts at another. What does 'branch performance' mean for them in your KPI? Walk us through the choice you made, and name the assumption a regional manager would push back on first.",
        rubric: [
          "States the chosen attribution rule clearly",
          "Names the realistic alternative and why it was rejected",
          "Identifies the manager-level pushback before it is asked",
        ],
      },
      {
        id: "lab-b-q-denominator",
        type: "denominator",
        prompt:
          "Try this for us: recompute total_fee_sar per active customer instead of per transaction. Which version would you ship to leadership, and why? Be explicit about what question each version is actually answering.",
        rubric: [
          "Both versions are described in terms of the question they answer",
          "The chosen version is justified by the audience and the decision",
          "The trade-off (sensitivity, fairness across branches, comparability) is named",
        ],
      },
      {
        id: "lab-b-q-lineage",
        type: "lineage",
        prompt:
          "Where does branch_id come from in your join? Talk us through one realistic upstream change to that field, however small, that would silently break this KPI tomorrow without throwing an error.",
        rubric: [
          "Traces branch_id back to a concrete source",
          "Describes a silent failure mode (no error, wrong answer)",
          "Suggests a check that would catch it",
        ],
      },
      {
        id: "lab-b-q-counterfactual",
        type: "counterfactual",
        prompt:
          "Picture the date filter being off by one day at the period boundary. How would the branch ranking shift? What does that say about how confidently you can publish this table on Monday morning?",
        rubric: [
          "Reasons through the boundary effect concretely",
          "Names which branches or segments are most exposed",
          "Connects the result to confidence in the published number",
        ],
      },
      {
        id: "lab-b-q-audience",
        type: "audience",
        prompt:
          "You are now sitting next to a regional manager who is about to use this KPI to set next quarter's targets. Where do you want them to push back on you? And what would you say to them if they did not push back at all?",
        rubric: [
          "Frames the KPI in terms a manager owns and acts on",
          "Names a specific weakness the engineer should surface unprompted",
          "Suggests the conversation that should happen if pushback never comes",
        ],
      },
    ],
  },
  {
    slug: "lab-c-pack",
    title: "Lab C: Executive performance pack",
    description:
      "Build two charts and one exception view from the Day 1 KPI table. Have the coach argue against your reading of them. Close the pack with one explicit caveat written in your own words.",
    leadershipQuestion:
      "Put together a short performance pack for the exec meeting. I want one trend chart, one comparison chart, an exception list, and one caveat in writing so we do not over-promise on the read.",
    notebookSlug: "day3",
    blockIndex: 1,
    startSlide: 38,
    endSlide: 48,
    dataPosture: "mixed",
    facilitatorPrompt:
      "Pause here for Lab C. Press the room on the gap between what their chart actually shows and what leadership will read into it. The caveat the engineer writes is the artefact, not the chart.",
    tasks: pythonLabTasks({
      slug: "lab-c-pack",
      briefPrompt:
        "Before you build the pack, write what each piece is meant to support. Chart 1: what claim does this trend make, and what claim could a sceptical reader make from the same chart. Chart 2: same. Exception view: what is the threshold logic, and what does a false flag cost you versus a missed flag.",
      notePrompt:
        "Look at the finished pack the way a busy executive will. Name one place where the visual or framing could push them to a wrong conclusion. Write the one caveat that has to travel with the pack to stop that.",
    }),
    interventionPrompts: [
      {
        startSlide: 38,
        endSlide: 42,
        label: "Brief each chart claim",
        prompt:
          "Stop here and finish the Brief task. For every chart and the exception view, write the claim it supports AND the strongest objection a sceptical reader could raise. Do not let anyone skip the second one.",
      },
      {
        startSlide: 43,
        endSlide: 46,
        label: "Build and pressure-test",
        prompt:
          "Now build the charts and the exception view with the coach. Once they render, hit 'Pressure-test this' and make the coach argue against your reading. Edit titles, subtitles, and thresholds with what you hear back.",
      },
      {
        startSlide: 47,
        endSlide: 48,
        label: "Defend the pack",
        prompt:
          "Reach the Defend step. The coach picks one challenge question. The caveat you wrote for the pack is the artefact to bring to the debrief; be ready to read it aloud.",
      },
    ],
    challengeQuestions: [
      {
        id: "lab-c-q-definition",
        type: "definition",
        prompt:
          "Talk us through the 'movement' your trend chart is actually showing. Could it be a definition change, a pipeline change, or a data quality artefact dressed up as a real shift? Where is your evidence that it is real?",
        rubric: [
          "Distinguishes the visible movement from possible alternative explanations",
          "Names a specific definition or pipeline change that could fake the movement",
          "Provides evidence the movement is real, not just plausible",
        ],
      },
      {
        id: "lab-c-q-audience",
        type: "audience",
        prompt:
          "Imagine leadership reads only the headline of your trend chart and nothing else. What wrong conclusion might they walk out with? Rewrite the title and subtitle so that conclusion becomes harder to reach.",
        rubric: [
          "Identifies a realistic misreading specific to this chart",
          "Proposes a tighter title or subtitle that closes the gap",
          "Demonstrates respect for the audience's actual reading habits",
        ],
      },
      {
        id: "lab-c-q-counterfactual",
        type: "counterfactual",
        prompt:
          "Try this for us: shift the comparison period by one quarter. Does the story this pack tells still hold, or does it lean on the exact window you chose? Talk us through what survives and what does not.",
        rubric: [
          "Tests sensitivity to the chosen comparison window",
          "Names which conclusions are robust and which are window-dependent",
          "Justifies the chosen window beyond convenience",
        ],
      },
      {
        id: "lab-c-q-lineage",
        type: "lineage",
        prompt:
          "Your exception view flags branches above a threshold. Walk us through one upstream condition that could fake a flag here without the reader knowing. What warning belongs in the pack so they do not act on it?",
        rubric: [
          "Names a specific upstream condition that would inflate the flag",
          "Distinguishes a false flag from a real one for this rule",
          "Drafts the actual warning sentence to ship with the pack",
        ],
      },
      {
        id: "lab-c-q-definition-2",
        type: "definition",
        prompt:
          "Rewrite your chart subtitle so a sceptical engineer reading over your shoulder can see exactly what you did and did not include. Two lines, no marketing language.",
        rubric: [
          "Subtitle states the metric, the scope, and the period precisely",
          "Calls out one exclusion that matters",
          "Reads as engineer-to-engineer, not pitch deck",
        ],
      },
    ],
  },
  {
    slug: "lab-d-handoff",
    title: "Lab D: ML-ready handoff table",
    description:
      "Build a customer-level feature table with the coach. Make the cut-off date explicit. Get the coach to surface one leakage risk. Write a data dictionary entry for each feature, in your own words. The handoff plus the dictionary is the module's closing artefact.",
    leadershipQuestion:
      "We want to start scoring customers next month. Hand the modelling team a clean, dated feature table at the customer level, plus a dictionary that tells them what each column actually means and one warning per feature.",
    notebookSlug: "day3",
    blockIndex: 2,
    startSlide: 50,
    endSlide: 60,
    dataPosture: "unspecified",
    facilitatorPrompt:
      "Pause here for Lab D. The handoff is what the module is judged on. Push the room to write the dictionary themselves; the moment they let the coach generate it, the lesson is gone.",
    tasks: pythonLabTasks({
      slug: "lab-d-handoff",
      briefPrompt:
        "Before you build, write the handoff brief. Cut-off date: what point in time the snapshot is taken at, and what is in or out because of that. Customer scope: what one row represents, and how you handle joint accounts and closed accounts. Feature list: which features you intend to ship and why each one is plausible for a downstream model. Leakage risks: which features could accidentally peek at information from after the cut-off.",
      notePrompt:
        "Pick one feature in your handoff. Write its data dictionary entry yourself, in your own words: definition, source, edge cases, and the one warning the modelling team has to read before they use it.",
    }),
    interventionPrompts: [
      {
        startSlide: 50,
        endSlide: 54,
        label: "Brief the handoff",
        prompt:
          "Stop here and finish the Brief task. Cut-off, scope, features, and leakage risks all on the page before any prompt is sent. The handoff is only as trustworthy as this brief.",
      },
      {
        startSlide: 55,
        endSlide: 57,
        label: "Build and check leakage",
        prompt:
          "Now build the feature table with the coach. Once it is up, ask 'What might be wrong here?' and make it surface a leakage risk. The auto-validated task confirms the file and cut-off are in place.",
      },
      {
        startSlide: 58,
        endSlide: 60,
        label: "Write the dictionary, then defend",
        prompt:
          "Write the data dictionary entries yourself, in your own words. Then reach the Defend step. The coach picks one challenge question. The dictionary plus the challenge answer is the module's closing artefact; treat it that way.",
      },
    ],
    challengeQuestions: [
      {
        id: "lab-d-q-lineage",
        type: "lineage",
        prompt:
          "Pick one feature and trace it back to its source for us. What upstream condition or process change would silently leak future information into your training data? Walk us through one specific path.",
        rubric: [
          "Names the feature and traces it to a specific source field or process",
          "Describes a concrete leakage mechanism, not a generic warning",
          "States how the modelling team would (or would not) catch it",
        ],
      },
      {
        id: "lab-d-q-definition",
        type: "definition",
        prompt:
          "What is a 'customer' in your handoff? If the modelling team interpreted it differently, where would they end up training on the wrong unit of analysis? Talk us through your choice and the realistic alternative.",
        rubric: [
          "Defines the unit of analysis precisely (per customer ID, per relationship, per household, etc.)",
          "Names a realistic alternative interpretation",
          "Explains how that alternative would change a model's behaviour",
        ],
      },
      {
        id: "lab-d-q-counterfactual",
        type: "counterfactual",
        prompt:
          "Now imagine the cut-off date moves one month later. Which features go invalid or leaky, and why? Which stay safe? Reason through it concretely.",
        rubric: [
          "Picks specific features and tests them against the moved cut-off",
          "Distinguishes safe features from features that drift or leak",
          "Names the rule a modelling team should apply before re-extracting",
        ],
      },
      {
        id: "lab-d-q-audience",
        type: "audience",
        prompt:
          "Write the handoff note for an ML engineer downstream who has never seen your data dictionary. Three sentences maximum. What is the one warning they MUST read before they fit a model on this table?",
        rubric: [
          "Identifies the single highest-risk fact in the handoff",
          "Writes for an engineer who will not read the appendix",
          "Avoids hedging language while still being honest about uncertainty",
        ],
      },
      {
        id: "lab-d-q-definition-2",
        type: "definition",
        prompt:
          "Pick the feature you trust least in your own handoff. Defend keeping it, or defend cutting it. Either call is fine here; what we want is the reasoning.",
        rubric: [
          "Names the least-trusted feature and why it earns that label",
          "Commits to keep or cut and defends the call",
          "Shows the trade-off between modelling value and analytical risk",
        ],
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

// Default workbench task profile per non-Python module. Each profile defines
// what kind of craft work the participant produces inside the workbench, what
// "good" looks like, and what evidence kinds the workbench shell should accept.
type WorkbenchProfile = {
  kind: WorkbenchTaskKind;
  evidenceKinds: WorkbenchEvidenceKind[];
  buildSuccessCriteria: (checkpoint: TrainingLabCheckpoint) => string[];
};

const workbenchProfileByModule: Record<string, WorkbenchProfile> = {
  "machine-learning-training": {
    kind: "analysis",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "Problem framing recorded with target, metric, and constraint",
      "Baseline established and beaten or explained",
      "Risk, fairness, and governance notes captured",
      "Evidence link or model card attached",
    ],
  },
  "neural-networks": {
    kind: "design",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "Architecture choice justified for the problem",
      "Training curves captured and interpreted",
      "Failure modes and mitigations recorded",
      "Recommendation written for next iteration",
    ],
  },
  "business-applications-in-ai": {
    kind: "analysis",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "Opportunity scored on value, feasibility, and risk",
      "Governance and people impact documented",
      "Pilot scope and success metric defined",
      "Exec recommendation drafted",
    ],
  },
  "automation-in-ai": {
    kind: "design",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "Swimlane shows actor, system, and exception per step",
      "Human-in-the-loop checkpoints identified",
      "Pilot KPIs and rollback plan written",
      "Owner and rollout phase agreed",
    ],
  },
  "advanced-data-visualization": {
    kind: "design",
    evidenceKinds: ["notes", "artifact_link", "file_upload", "workbench_state"],
    buildSuccessCriteria: () => [
      "Audience and decision the chart supports stated",
      "Chart type defended against alternatives",
      "Hierarchy: primary message in under three seconds",
      "Accessibility and labelling rubric pass",
    ],
  },
  "ai-in-banking-and-finance": {
    kind: "prompt",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "At least three prompt variants compared",
      "Guardrails and refusal behaviour tested",
      "Use-case scored against banking risk lens",
      "Leadership briefing draft attached",
    ],
  },
  "programme-orientation": {
    kind: "discussion",
    evidenceKinds: ["notes", "artifact_link", "workbench_state"],
    buildSuccessCriteria: () => [
      "Personal achievement plan written",
      "Cohort intro post drafted",
      "Profile completion checked",
    ],
  },
};

function attachWorkbenchTasks(
  moduleSlug: string,
  checkpoints: TrainingLabCheckpoint[],
): TrainingLabCheckpoint[] {
  const profile = workbenchProfileByModule[moduleSlug];
  if (!profile) return checkpoints;
  return checkpoints.map((checkpoint) => {
    if (checkpoint.tasks && checkpoint.tasks.length > 0) {
      return checkpoint;
    }
    const task: WorkbenchTask = {
      taskKind: "workbench",
      id: `${checkpoint.slug}-task`,
      checkpointSlug: checkpoint.slug,
      title: checkpoint.title,
      prompt: checkpoint.description,
      successCriteria: profile.buildSuccessCriteria(checkpoint),
      evidenceKinds: profile.evidenceKinds,
      kind: profile.kind,
    };
    return { ...checkpoint, tasks: [task] };
  });
}

export function resolveTrainingLabCheckpoints(moduleSlug: string) {
  const baseCheckpoints = trainingLabCheckpointMap[moduleSlug] ?? [];
  return attachWorkbenchTasks(moduleSlug, baseCheckpoints);
}

export function resolveCheckpointInterventionPrompt(checkpoint: TrainingLabCheckpoint, slideNumber: number) {
  const matchedPrompt = checkpoint.interventionPrompts?.find(
    (prompt) => slideNumber >= prompt.startSlide && slideNumber <= prompt.endSlide,
  );

  return matchedPrompt ?? null;
}
