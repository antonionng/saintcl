import { z } from "zod";

// Shared Zod schema for the labContext payload posted by LabChatShell to the
// /api/training/participant/copilot route. Extracted so it can be unit-tested
// independently and so both the API route and any future server callers stay
// in sync.

export const labBeatSchema = z.enum(["brief", "engage", "verify", "defend"]);

export const labContextSchema = z
  .object({
    checkpoint: z
      .object({
        slug: z.string().max(200),
        title: z.string().max(400),
        description: z.string().max(2000).optional().nullable(),
        facilitatorPrompt: z.string().max(2000).optional().nullable(),
        dataPosture: z.string().max(400).optional().nullable(),
        leadershipQuestion: z.string().max(2000).optional().nullable(),
      })
      .nullable()
      .optional(),
    task: z
      .object({
        id: z.string().max(200).nullable().optional(),
        title: z.string().max(400).nullable().optional(),
        successCriteria: z.string().max(2000).nullable().optional(),
        inputHint: z.string().max(2000).nullable().optional(),
        kind: z.enum(["workbench", "python"]).optional(),
        prompt: z.string().max(4000).nullable().optional(),
      })
      .optional(),
    currentBeat: labBeatSchema.optional().nullable(),
    challengeQuestion: z
      .object({
        id: z.string().max(200),
        type: z.string().max(120).optional().nullable(),
        prompt: z.string().max(4000),
        rubric: z.string().max(4000).optional().nullable(),
      })
      .optional()
      .nullable(),
    datasetName: z.string().max(300).nullable().optional(),
    code: z.string().max(20000).nullable().optional(),
    stdout: z.string().max(8000).nullable().optional(),
    stderr: z.string().max(8000).nullable().optional(),
    priorConversation: z.string().max(8000).nullable().optional(),
  })
  .strict();

export type LabContextPayload = z.infer<typeof labContextSchema>;
