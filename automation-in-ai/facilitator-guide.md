# Facilitator Guide

## Module 5: Automation in AI

Al Jazira Bank | AJB AI and Data Training Programme

---

## Module Overview

This is a 2-day practical module (4 hours per day). Participants learn to map banking workflows, classify automation opportunities, design exception handling, and build governed pilot plans. The module uses real-world banking scenarios and datasets. It is skills-focused: participants produce artefacts, not just discuss concepts.

## Delivery Stance

- Anchor every discussion in process design and operating risk. Redirect conversations that drift toward tool selection or technology hype.
- Push every automation proposal toward exception handling and ownership. The question "what happens when this fails?" should be asked more than any other.
- Reward a smaller, governed automation move over an ambitious but fragile plan. Participants who automate one step well, with clear fallback, outperform teams that automate ten steps with no exception logic.
- Use the case critiques (slides 59-66) to model constructive scepticism. Show participants that questioning an automation is a sign of maturity, not resistance.
- Do not demonstrate specific tools or platforms. This module is about design thinking, not product selection.

---

## Day 1 | Foundations (4 hours)

### Block 1: Opening and Orientation (45 minutes, slides s01-s08)

- Walk through module outcomes, schedule, and performance bands.
- Spend time on the vocabulary slide (s08). Confirm participants understand "exception path," "human-in-the-loop," and "pilot" before proceeding.
- Set the ground rule early: every proposal needs an exception path. Repeat this throughout both days.

### Block 2: Core Concepts (75 minutes, slides s09-s26)

- Move through the automation spectrum (s10-s13) at a steady pace. Use the decision framework (s14) to anchor the types to real decisions.
- On the common failures slide (s23), pause and ask participants to share examples from their own experience. This builds engagement and surfaces real AJB context.
- The concept check (s26) is a mandatory stop. Do not skip it. Give participants 5 minutes in pairs, then debrief as a group.

**Facilitation point:** When discussing AI-assisted automation (s12), participants often conflate "AI-assisted" with "autonomous." Clarify that AI-assisted means a human makes the final decision. The AI proposes; the human disposes.

### Block 3: Guided Walkthroughs (60 minutes, slides s27-s42)

- Walk through the KYC example (s28-s34) as a full class exercise. Project the slides and build the analysis together.
- For the reconciliation walkthrough (s35-s39), have participants attempt the classification before revealing the slide content. Compare their answers.
- Close Day 1 with the design principles (s41) and the Day 1 summary (s42).

**Facilitation point:** During the KYC walkthrough, participants may suggest automating the senior review step. Challenge this directly. Ask: "What is the cost if the AI approves a sanctions-flagged case? Who is accountable?" Use this to reinforce the human-in-the-loop principle.

### Labs A-C Timing (integrated into blocks above)

- Lab A (Workflow Mapping): assign during Block 3 after the KYC walkthrough. Allow 20 minutes.
- Lab B (Automation Classification): assign immediately after Lab A. Allow 15 minutes.
- Lab C (Exception Path Design): assign as a take-home or start in the final 15 minutes of Day 1.

---

## Day 2 | Application (4 hours)

### Block 4: Hands-On Activities (90 minutes, slides s43-s58)

- Open with the data introduction (s44). Ensure all participants can load the CSV in their notebooks before proceeding.
- Labs D and E run in parallel for different teams or sequentially. Recommended: Lab D first (30 minutes), then Lab E (30 minutes), then Lab D pilot plan extension (30 minutes).
- Use the checkpoint slide (s58) as a hard gate. Teams must pass the checklist before presenting.

**Facilitation point:** In Lab D (prioritization), teams often rank by manual hours alone. Push them to consider error rate and complexity together. A high-hours, low-error process may be less urgent than a moderate-hours, high-error process.

**Facilitation point:** In Lab E (routing design), watch for teams that make all intents AI-eligible. Challenge with: "Would you want an AI to handle your mortgage complaint on first contact?" Use this to teach appropriate scope boundaries.

### Block 5: Case Discussion and Critique (40 minutes, slides s59-s66)

- Present each case (s60, s62, s64) and give teams 3 minutes to discuss before revealing the analysis slide.
- On the synthesis slide (s66), ask each table to name one governance control from the cases that they had not included in their own Lab work. This creates a natural revision moment.

**Facilitation point:** The chatbot case (s62-s63) resonates strongly. Use it to reinforce that "always provide an answer" is a dangerous design choice in regulated environments. Connect this to Lab E routing design.

### Block 6: Applied Mission (60 minutes, slides s67-s74)

- Teams select Scenario A or B. Both are equally complex. Let teams choose based on interest.
- Enforce the 8-minute presentation time limit strictly. Use a visible timer.
- During peer critique (s74), assign each team to critique one other team. Require at least two specific critiques per team (not generic praise).

**Facilitation point:** Teams often produce strong workflow maps but weak risk registers. During working time, check in with each team specifically on their risk register. Ask: "What is your top risk, and how would you detect it in the first week of the pilot?"

### Block 7: Recap and Close (30 minutes, slides s75-s80)

- Walk through the rubric (s77) and ask participants to self-assess their own work.
- The "next steps" slide (s79) is an action commitment. Ask each participant to name one specific workflow they will map in their department within the next two weeks.

---

## Common Participant Challenges

| Challenge | Response |
|-----------|----------|
| Teams automate everything without identifying exception paths | Ask: "What happens when the input is malformed? Who notices?" Force exception design before allowing them to proceed. |
| Participants focus on tooling rather than design | Redirect: "Assume the tool works perfectly. What is your process design? Now, what happens when the tool fails?" |
| Pilot plans lack failure triggers | Ask: "If this pilot starts producing wrong results tomorrow, how would you know? What metric tells you to stop?" |
| Risk registers are generic ("system could fail") | Push for specificity: "Which system? What is the failure mode? Who is affected? What is the recovery time?" |
| Teams skip the rollback plan | Ask: "It is Tuesday, the pilot has been running for five days, and error rates have doubled. Walk me through exactly what you do in the next hour." |
| Participants confuse AI-assisted with autonomous | Repeat the distinction: "AI-assisted means a human decides. Autonomous means the system decides. Which one are you proposing, and what are the consequences?" |

---

## Assessment Guidance

- Use the rubric on slide s77 and the per-lab rubrics in the participant workbook.
- Competent is the baseline. All participants should reach Competent on all labs.
- Strong requires integration: classification connects to justification, exceptions connect to specific failure modes, pilot plans connect to measurable metrics.
- Exceptional requires critical thinking: trade-off analysis, evidence-based reasoning, constructive self-critique, and the ability to adapt proposals based on feedback.
- Assess the capstone mission (Lab F) as the primary assessment artefact. Labs A-E are formative.

---

## Close Standard

End the module with this framing: "The best automation project is the one you can govern. Start with the workflow you understand best. Map it completely. Automate the step you can control most tightly. Measure everything. Expand only when the evidence supports it."

## Mixed-Level Delivery Overlay
- Intro route: keep newer participants focused on one clear workflow, one automation target, and explicit human control points.
- Advanced route: use stronger participants for exception logic, thresholds, and implementation phasing.
- Do not let tooling examples dominate the session. The governed workflow design is the main outcome.

## Virtual Engagement Checkpoints
- Day 1: stop after current-state mapping and verify that triggers, owners, and exception points are visible.
- Day 2: pause once future-state designs appear and ask where human review still needs to happen.
- Close with a quick trade-off round on speed, control, and auditability.
