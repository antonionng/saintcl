import { describe, expect, it } from "vitest";

import { labContextSchema } from "./training-copilot-schema";

describe("labContextSchema", () => {
  it("accepts the full payload that LabChatShell sends today", () => {
    const payload = {
      checkpoint: {
        slug: "lab-a-triage",
        title: "Lab A: Triage an extract",
        description: "Triage description.",
        facilitatorPrompt: "Pause here for Lab A.",
        dataPosture: "declared",
        leadershipQuestion: "Is this transactions extract clean enough...",
      },
      task: {
        id: "lab-a-triage-brief",
        title: "Brief the task",
        successCriteria: "Restate the leadership question",
        inputHint: null,
        kind: "workbench" as const,
        prompt: "Pin the one definition before any prompt.",
      },
      currentBeat: "brief" as const,
      challengeQuestion: {
        id: "lab-a-q-definition",
        type: "definition",
        prompt: "Talk us through what fit means.",
        rubric: "Names criteria; tests against stricter and looser",
      },
      datasetName: "transactions.csv",
      code: "print('hi')",
      stdout: "hi",
      stderr: "",
      priorConversation: "Learner: hello\nCoach: hi",
    };

    const result = labContextSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts a python (auto) task with kind=python and a null challenge question", () => {
    const result = labContextSchema.safeParse({
      checkpoint: {
        slug: "lab-b-kpi",
        title: "Lab B: KPI",
      },
      task: {
        id: "lab-b-kpi-verify",
        title: "Verify the branch KPI table",
        kind: "python" as const,
        prompt: "Build the KPI table.",
      },
      currentBeat: "verify" as const,
      challengeQuestion: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown top-level fields (regression guard for typos)", () => {
    const result = labContextSchema.safeParse({
      checkpoint: { slug: "lab-a-triage", title: "Lab A" },
      currentBeats: "brief",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid currentBeat value", () => {
    const result = labContextSchema.safeParse({
      checkpoint: { slug: "lab-a-triage", title: "Lab A" },
      currentBeat: "thinking",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown task.kind value", () => {
    const result = labContextSchema.safeParse({
      checkpoint: { slug: "lab-a-triage", title: "Lab A" },
      task: { id: "x", title: "y", kind: "facilitator" },
    });
    expect(result.success).toBe(false);
  });
});
