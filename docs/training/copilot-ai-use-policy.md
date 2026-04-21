# Copilot AI Use Policy

The SaintClaw training copilot is the only sanctioned way to call generative
AI models from inside any AJB AI and Data Programme module. This document
covers what participants and facilitators may and may not do, how the
governance layer works, and how the audit trail is used.

## What the copilot is

A thin Next.js API route at `POST /api/training/participant/copilot` that:

- accepts a participant prompt scoped to a single module and exercise,
- routes the call through OpenRouter via the platform's `OPENROUTER_API_KEY`,
- enforces a small per-module model allowlist,
- redacts obvious PII (long digit sequences, IBAN-shaped strings, emails)
  before the prompt leaves SaintClaw,
- logs every call to `public.training_copilot_calls` so facilitators can see
  who used what, with what model, on what exercise, and at what cost.

There is one shared Python helper that participants import inside notebooks:

- `notebook-helpers/saintclaw_copilot.py` exposing `ask`, `compare`,
  `critique`, and `explain`.

Participants MUST NOT install any other LLM SDK (Anthropic, OpenAI, Cohere,
etc.) inside their notebook environment. If a tool isn't in the allowlist,
ask the facilitator to consider adding it; do not work around the helper.

## What participants may use the copilot for

- Explaining unfamiliar code, errors, or banking concepts.
- Critiquing their own draft artifacts against a rubric.
- Generating multiple candidate phrasings for a written deliverable.
- Comparing two or more models on the same prompt to feel model variance.
- Brainstorming counterexamples, edge cases, or what could go wrong.

## What participants may NOT use the copilot for

- Submitting LLM output as their own analytical work without explicit
  facilitator-marked permission. Module assessments expect *participant*
  reasoning, not model output.
- Pasting real customer, account, employee, or compensation data, including
  fragments. Use synthetic AJB sample data only.
- Bypassing assessments. Auto-grading sees the participant's typed answer,
  not the model's; copying a model answer into an assessment is treated as
  it would be in any AJB written exam.
- Connecting the helper to anything other than `https://saintagi.com` (or
  the local dev URL their facilitator gave them).
- Sharing their participant token. The token authenticates that
  participant's seat in the cohort and is logged on every call.

## How model governance works

- `src/lib/training-copilot.ts` holds two structures that the route enforces:
  - `MODULE_DEFAULT_MODEL` chooses the default model per module slug.
    Modules 1-3 default to a free OpenRouter model; modules 4-7 default to
    `openrouter/auto` so OpenRouter picks an appropriate model.
  - `PARTICIPANT_ALLOWED_MODELS` is a small allowlist of models that
    participant prompts may target. Anything else returns a `model_not_allowed`
    blocked status and is logged with `status = 'blocked'`.
- The system prompt is always prefixed with the SaintClaw banking-context
  preamble (no real PII, three-bullet reasoning, decision-ready output).
  Custom system prompts are appended after the preamble, not in place of it.

## What gets logged

Every call writes one row to `public.training_copilot_calls` with:

- `participant_id`, `cohort_id`, `module_id`, `org_id`
- `scope` and `scope_id` (for example `task` + the task slug)
- `exercise_id` (free-form text the helper passes in, e.g.
  `m7-d1-prompt-compare`)
- `model`, `default_model`, `requested_model`
- prompt and output character counts, plus `prompt_redacted` /
  `redactions` so reviewers can see if PII patterns were caught
- `input_tokens`, `output_tokens`, `total_tokens`, `cost_usd`,
  `latency_ms`
- `status` of `completed`, `failed`, or `blocked`
- the system prompt that was used

Facilitators have read access to this table for cohorts they own. AJB
governance reviewers can be granted read access via the org admin scope.

## Failure modes participants should expect

- `model_not_allowed`: the model name isn't on the participant allowlist.
  Use one of the models returned by `co.allowed_models()` or the module
  default.
- `openrouter_unconfigured`: this deployment doesn't have an OpenRouter
  key. Tell your facilitator; do not try to plug in your own key.
- `network_error`: the call timed out or OpenRouter was unreachable.
  Retry once; if it keeps failing, fall back to working without a copilot.
- `empty_prompt`: the helper received an empty string after trimming.

## Where this is referenced

- `notebook-helpers/saintclaw_copilot.py` (helper docstring points here)
- `ai-in-banking-and-finance/notebooks/day1_use_case_and_prompt_studio.ipynb`
  (Exercise 3.5 uses the copilot end-to-end)

When in doubt, ask the facilitator before sending a prompt. The audit trail
is a feature, not a trap; it exists so that the cohort can use AI
confidently inside an AJB-acceptable boundary.
