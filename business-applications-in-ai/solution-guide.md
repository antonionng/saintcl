# Solution Guide

## Overview

This guide provides strong answer shapes for each lab, common failure modes to watch for, and guidance on applying the rubric. Use it to calibrate assessment and to coach participants who are struggling.

## Lab A | Opportunity Mapping

### Strong Answer Shape

- All 60 opportunities have reviewed scores. At least 5-6 scores are adjusted from pre-filled values with specific rationale (e.g., "Reduced feasibility from 4 to 3 because the CRM data is not labelled for this category").
- The prioritisation matrix clearly separates high-value/high-feasibility candidates from the rest. Top-right quadrant should contain 3-5 opportunities.
- Top 3 selections are from different departments or value categories, showing breadth of analysis.
- The "park" recommendation names a specific blocker (data unavailability, regulatory uncertainty, no workflow owner) and a condition for revisiting.
- Strong answers include tiebreaker reasoning: "We ranked complaint triage above payment exception handling because it has a shorter path to pilot and builds NLP capability the bank can reuse."

### Common Failure Modes

- Accepting all pre-filled scores without adjustment. This indicates passive engagement. Push participants to justify at least 3-4 changes.
- Selecting all top-3 from the same department. Ask: "Would the COO accept a recommendation that ignores 80% of the bank?"
- Inability to articulate why one opportunity ranks above another. Require written justification, not just numerical ranking.
- "Park" recommendation that says "not enough data" without specifying what data is missing and what it would take to obtain it.

## Lab B | Governance Assessment

### Strong Answer Shape

- Each checklist item has a status that is specific to the chosen opportunity, not a generic assessment.
- "Not Met" items have remediation actions that name a role (not a person, but a role: Head of Data, Chief Risk Officer, Model Validation Lead).
- Top 3 governance gaps are prioritised by severity of risk, not by ease of remediation.
- The readiness summary is one paragraph, written for the CRO: "The proposed pilot for [opportunity] is partially ready from a governance perspective. Three controls require remediation before launch: [list]. The most critical gap is [X] because [risk]. We recommend a 6-week governance preparation phase before the technical pilot begins."

### Common Failure Modes

- Marking everything as "Met" without evidence. Challenge: "What document or process proves this control is in place?"
- Confusing governance with technical requirements. Governance is about accountability, review, and oversight, not about system architecture.
- Remediation actions that are too vague: "Improve data quality." Require specifics: "Conduct a data completeness audit of CRM complaint records for the past 3 years; assign to Data Quality Lead; complete within 4 weeks."

## Lab C | Operating Model Design

### Strong Answer Shape

- Current-state workflow has 5-7 concrete steps with named inputs and outputs at each stage.
- The AI insertion point is clearly marked with an explanation of what the AI does (e.g., "AI classifies incoming complaint text and suggests a category and urgency level").
- Operating model choice is justified by reference to risk, explainability, and review capacity, not just by preference.
- Human review protocol specifies trigger conditions (e.g., "Agent reviews all AI classifications; for urgency-level 'High' cases, a senior agent must confirm before routing").
- Fallback procedure addresses both unavailability ("If the AI service is down, complaints are routed to the general queue for manual triage") and low confidence ("If the AI confidence score is below 70%, the complaint is flagged for manual classification").

### Common Failure Modes

- Skipping the current-state workflow. Without it, the future-state design lacks grounding.
- Choosing "automate" for a customer-facing or high-risk workflow without justifying the governance controls required.
- Fallback procedure that says "revert to manual." This is correct but insufficient. Specify how: who is notified, what queue receives the work, and what SLA applies.

## Lab D | Executive Recommendation Draft

### Strong Answer Shape

- Executive summary leads with the recommendation: "We recommend a 12-week pilot to deploy AI-assisted complaint classification in the CX Operations department, with an estimated annual saving of SAR 850,000-1,200,000."
- Problem statement includes current baseline metrics: volume, processing time, error rate, cost.
- Value case uses the formula: volume x time saved x cost per hour = annual saving. Assumptions are stated. A range is provided.
- Risk section names at least 3 specific risks (not generic "AI risk") and maps each to a governance control.
- Pilot proposal specifies: team/department, case subset, duration in weeks, success metrics (at least 2), and a decision gate ("At week 8, if classification accuracy exceeds 85% and agent satisfaction is above 3.5/5, proceed to full rollout; otherwise, revise or terminate").

### Common Failure Modes

- Burying the recommendation on page 2. Executives read the first paragraph. The recommendation must be stated there.
- Value case with a single point estimate and no stated assumptions. Require ranges and explicit assumptions.
- Risk section that lists only technical risks (model accuracy, latency) and ignores organisational risks (staff adoption, change management) and regulatory risks (SAMA expectations, PDPL compliance).
- Pilot proposal without a decision gate. "We will pilot for 12 weeks" is incomplete. "At week 8, we will evaluate against these criteria and decide go/no-go" is complete.

## Lab E | Peer Review

### Strong Answer Shape

- Each of the five feedback points references a specific section or claim in the reviewed recommendation.
- "Weakest assumption" identifies a specific number or claim and explains why it may not hold (e.g., "The value case assumes 800 complaints/day, but your problem statement says the figure varies between 500 and 900. Using the lower bound would reduce the saving by 37%.").
- "Missing control" identifies a specific governance gap, not a generic "needs more governance."
- "One improvement" is actionable: "Add a sensitivity analysis showing how the value case changes if processing time savings are 2 minutes instead of 4 minutes."

### Common Failure Modes

- Feedback that is purely positive. Every recommendation has gaps. If a reviewer cannot find any, they are not reading critically enough.
- Generic feedback: "The governance section could be stronger." Require specifics: "The governance section does not address model bias testing."
- Feedback on style rather than substance. Redirect to: "Focus on the claims, the evidence, and the gaps."

## Lab F | Revision and Final Submission

### Strong Answer Shape

- Revisions are visible and traceable. The Peer Review Response appendix lists each piece of feedback and explains what changed (or why it did not).
- At least one substantive revision is made based on peer feedback.
- Retained decisions are justified, not ignored: "The reviewer suggested a shorter pilot. We retained the 12-week duration because the first 4 weeks are required for data preparation and model training, leaving only 8 weeks of operational testing."

### Common Failure Modes

- Ignoring peer feedback entirely and resubmitting the original document. The Peer Review Response appendix must be present and substantive.
- Accepting all feedback without critical evaluation. Some feedback may be wrong or may not apply. The skill is in deciding what to accept and what to reject with reasoning.

## Rubric Application Notes

- Weight the capstone (Lab F) most heavily. It integrates all prior work.
- For `Competent`, check that structure and completeness are met. Content quality can be basic.
- For `Strong`, check that every claim has supporting evidence or a stated assumption. Governance controls must be mapped to specific risks.
- For `Exceptional`, the document should be presentable to AJB's executive committee with no editing. This means: concise, quantified, specific, and honest about risks.
- If a participant's Labs A-C are strong but Lab D is weak, the overall assessment should reflect the capstone quality. Labs A-C are preparation; Lab D is the deliverable.
