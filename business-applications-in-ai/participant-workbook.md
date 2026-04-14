# Module 4 | Business Applications in AI -- Participant Workbook

## Programme Context

This workbook supports Module 4 of the AJB AI and Data Training Programme. This is the point where the programme shifts from technical fluency into business prioritisation. The focus is not "can AI do this?" but "which opportunities matter most, what makes them viable, and how should the bank govern them?"

## Start Here

- Why this module matters: good AI strategy depends on problem quality, business value, and governance readiness, not just technology capability.
- Your journey in this module: map opportunities, score them carefully, test their governance readiness, choose an operating model, and finish with an executive recommendation.
- What you will produce: prioritisation tables, governance notes, business-case reasoning, and a leadership-ready recommendation.
- How validation works: each activity ends in a tangible artefact, and the final recommendation should be strong enough to survive challenge from business, risk, and compliance stakeholders.

## How To Use This Workbook

- This workbook is your personal record of work for the module. Complete every section during the session.
- Write in clear, professional language. These artefacts should be presentable to a line manager or executive sponsor.
- Every recommendation must name a workflow owner, a governance control, and a measurable outcome.
- Use the rubric criteria to self-assess your work before submission.
- Your final recommendation (Lab F) is the capstone deliverable for this module.
- Keep your Day 1 answers accessible. You will revisit them on Day 2 to track how your thinking evolved.
- If working in pairs, both participants must submit individual written artefacts.

## Performance Bands

- `Competent`: All required artefacts are submitted and complete. Opportunity assessment uses the framework. Recommendation follows the required six-section structure. Governance controls are listed.
- `Strong`: Artefacts are well-reasoned and specific to AJB workflows. Value case includes quantitative estimates with stated assumptions. Governance controls are mapped to specific risks and assigned to owner roles. Peer feedback is substantive and actionable.
- `Exceptional`: Recommendation is executive-ready with minimal editing required. Value case includes conservative ranges and sensitivity analysis on key assumptions. Governance is comprehensive, including monitoring cadence, escalation paths, and regulatory alignment. Peer review response demonstrates critical reflection and willingness to revise.

---

## Day 1 | Opportunity and Assessment

### Mission Outcome

By the end of Day 1, you should be able to identify banking workflows where AI could create measurable value, score those opportunities using a structured framework, and assess their governance readiness.

### Opening Reflection

Before the first presentation, write brief answers to these three questions. Do not overthink them; capture your current view.

1. Name one AJB workflow that you believe could benefit from AI. Why?

   _Your answer:_

2. What is the single biggest barrier to AI adoption at the bank today?

   _Your answer:_

3. How would you know if an AI deployment succeeded?

   _Your answer:_

---

### Lab A | Opportunity Mapping

**Scenario:**
AJB's Chief Operating Officer has asked your team to identify the top three AI opportunities across the bank. You have access to a dataset of 60 candidate opportunities (`data/ai_opportunities.csv`) with initial scores for value, feasibility, and risk. The COO expects a one-page summary with a ranked shortlist by end of session.

**Objective:**
- Review, score, and rank 20 AI opportunities using the value-feasibility-risk framework.
- Produce a prioritisation matrix and a top-3 recommendation with justification.

**Required artefact:**
- Completed scoring table for all 60 opportunities (with adjusted scores and brief rationale for any changes to pre-filled scores).
- Prioritisation matrix: 2x2 grid (value vs. feasibility) with opportunities plotted and risk indicated.
- Ranked top-3 list with 2-3 sentence justification for each selection.
- One "park" recommendation with reasoning (identify one opportunity that should be deferred and explain why).

**Stretch artefact:**
- Tiebreaker analysis: for opportunities that score similarly, apply the four tiebreaker criteria (speed to pilot, reversibility, visibility, learning value) and document the result.
- Sequencing recommendation: suggest the order in which the top 3 should be pursued and explain the dependency logic.

**Core tasks:**
1. Open `data/ai_opportunities.csv` and review all 60 opportunities.
2. For each opportunity, validate or adjust the pre-filled value, feasibility, and risk scores. Write a brief rationale for any score you change.
3. Create a prioritisation matrix. Plot each opportunity by value (vertical) and feasibility (horizontal). Indicate risk using size or annotation.
4. Select the top 3 opportunities. Write a 2-3 sentence justification for each explaining why it ranks above alternatives.
5. Select one opportunity to "park" (defer). Explain what would need to change before it becomes viable.

**Stretch tasks:**
- Apply the four tiebreaker criteria to your top 3 and document which factors were decisive.
- Write a one-paragraph sequencing recommendation: which opportunity should the bank pursue first, second, and third, and why.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Scoring quality | Scores assigned with basic logic | Scores justified with specific evidence from the data | Scores reflect nuanced trade-offs and explicit assumptions |
| Prioritisation logic | Top 3 identified | Top 3 include clear reasoning linked to value and feasibility | Selection considers tiebreakers, sequencing, and organisational readiness |
| Communication | Outputs are complete | Outputs are structured and concise | Outputs could be presented to the COO with minimal editing |

**Reflection:**
1. Which opportunity was hardest to score, and why?
2. What information would have made your assessment more confident?

---

### Lab B | Governance Assessment

**Scenario:**
Your top-ranked opportunity from Lab A has been approved for a pilot assessment. Before any technical work begins, the Chief Risk Officer requires a governance readiness review. You must evaluate the opportunity against the governance checklist and identify gaps.

**Objective:**
- Assess your top opportunity against a structured governance checklist.
- Identify gaps and produce a remediation plan with assigned owners.

**Required artefact:**
- Completed governance checklist (`data/governance_checklist.csv`) with status for each control: Met / Partially Met / Not Met / Not Applicable.
- Remediation plan for any "Not Met" item: action required, owner role, and proposed timeline.
- Top 3 governance gaps with brief explanation of the risk each gap creates.
- One-paragraph governance readiness summary suitable for the CRO.

**Stretch artefact:**
- Regulatory mapping: for each "Not Met" item, identify the specific SAMA expectation or PDPL requirement it relates to.
- Pre-launch gate checklist: produce a concise list of conditions that must be satisfied before the pilot can begin.

**Core tasks:**
1. Select your top-ranked opportunity from Lab A.
2. Open `data/governance_checklist.csv`. For each row, assess whether the control requirement is Met, Partially Met, Not Met, or Not Applicable for your chosen opportunity.
3. For any "Not Met" item, write a remediation action, assign an owner role, and estimate a timeline.
4. Identify the three highest-priority governance gaps. Explain the risk each gap creates.
5. Write a one-paragraph governance readiness summary.

**Stretch tasks:**
- Map each governance gap to a specific regulatory requirement (SAMA operational risk framework, PDPL, or model risk management standards).
- Produce a pre-launch gate checklist: 5-7 conditions that must all be satisfied before the pilot begins.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Coverage | All checklist items addressed | Assessments specific to the chosen opportunity | Assessments reference concrete evidence and owner commitments |
| Gap analysis | Gaps identified | Gaps prioritised with clear risk reasoning | Remediation plan is actionable with named owners and timelines |

**Reflection:**
1. Which governance requirement was most difficult to assess, and why?
2. If you were the CRO, would you approve this pilot based on your assessment? What would you need to see first?

---

### Lab C | Operating Model Design

**Scenario:**
The COO has asked for a detailed design of how AI will fit into the workflow for your top opportunity. You need to define the operating model, human review points, and fallback procedures.

**Objective:**
- Design the target operating model for your recommended AI opportunity.
- Define how human oversight and fallback will work in practice.

**Required artefact:**
- Current-state workflow description (5-7 steps, from trigger to output).
- Future-state workflow with the AI insertion point clearly marked.
- Operating model choice (augment, automate, or customer-facing) with written justification.
- Human review protocol: who reviews AI output, what they check, and when they override.
- Fallback procedure: what happens when the AI is unavailable or produces low-confidence output.

**Stretch artefact:**
- Processing time estimate: compare current-state and future-state processing times per unit.
- Staffing impact analysis: how does the operating model change affect team roles and capacity?

**Core tasks:**
1. Describe the current-state workflow in 5-7 steps (trigger, inputs, processing, decisions, outputs, owner).
2. Design the future-state workflow with the AI component inserted. Mark clearly where the AI acts and where human review occurs.
3. Choose the operating model (augment, automate, or customer-facing). Write 3-4 sentences justifying your choice based on risk, explainability, and the bank's review capacity.
4. Define the human review protocol: who reviews, what criteria they check, and under what conditions they override the AI output.
5. Describe the fallback procedure: what happens when the AI component is unavailable, slow, or produces output below a confidence threshold.

**Stretch tasks:**
- Estimate the processing time per unit for current-state and future-state workflows.
- Describe how the operating model change would affect team roles, skill requirements, and capacity allocation.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Workflow clarity | Current and future states described | Workflows are specific with clear AI insertion point | Workflows include decision logic, confidence thresholds, and exception paths |
| Operating model justification | Choice stated | Choice justified with reference to risk and explainability | Justification considers regulatory context, organisational readiness, and phasing |

**Reflection:**
1. What is the biggest operational risk in your proposed future-state workflow?
2. How would you measure whether the AI component is performing as expected after deployment?

---

## Day 2 | Governance and Recommendation

### Mission Outcome

By the end of Day 2, you should be able to critique real-world AI deployments, write a structured executive recommendation with governance controls, and incorporate peer feedback into a final deliverable.

---

### Lab D | Executive Recommendation Draft

**Scenario:**
The bank's executive committee has allocated 30 minutes to hear AI investment proposals. Your team has one slot. Produce a two-page executive recommendation following the required structure.

**Objective:**
- Draft a complete executive recommendation for your chosen AI opportunity.
- Synthesise your work from Labs A, B, and C into a single cohesive document.

**Required artefact:**
- Two-page executive recommendation with the following sections:
  1. Executive summary (one paragraph).
  2. Problem statement: specific workflow, current performance, named owner.
  3. Recommended use case: AI technique, operating model, and rationale.
  4. Value case: quantitative estimates with stated assumptions and ranges.
  5. Risk and governance: key risks, governance controls, regulatory considerations.
  6. Pilot proposal: scope, duration, success criteria, and go/no-go decision gate.

**Stretch artefact:**
- Sensitivity analysis: identify the 2-3 assumptions that most affect the value case, and show how the outcome changes if those assumptions are wrong by 25%.
- Stakeholder map: identify the 4-5 key stakeholders who must support the initiative and their likely concerns.

**Core tasks:**
1. Write a one-paragraph executive summary that leads with the recommendation.
2. State the problem with specific metrics (volume, time, cost, error rate).
3. Describe the recommended AI application, technique, and operating model.
4. Build the value case with quantitative estimates. State all assumptions. Provide a range (conservative to optimistic).
5. List the key risks and the governance controls that address each one. Reference your Lab B governance assessment.
6. Propose a pilot: scope (which team, which subset of cases), duration (weeks), success criteria (specific metrics), and decision gate (what triggers go/no-go).

**Stretch tasks:**
- Conduct a sensitivity analysis on 2-3 key assumptions.
- Create a stakeholder map with likely concerns and engagement strategy for each.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Problem definition | Problem stated with basic clarity | Problem is specific, measurable, and tied to a named workflow | Includes current baseline and target improvement |
| Value case | Qualitative value described | Quantitative estimates with stated assumptions | Conservative range with sensitivity to key assumptions |
| Governance | Basic controls listed | Controls mapped to specific risks, assigned to owners | Includes monitoring cadence, escalation, and regulatory alignment |
| Pilot proposal | Scope described | Scope, timeline, and success criteria defined | Go/no-go gate with explicit criteria and fallback plan |
| Communication | Complete and readable | Concise, structured, and evidence-based | Executive-ready with no editing required |

**Reflection:**
1. Which section of your recommendation is strongest? Which is weakest?
2. What would an executive challenge first about your proposal?

---

### Lab E | Peer Review

**Scenario:**
Exchange your recommendation with another team. You are playing the role of an internal review committee. Your job is to stress-test the proposal before it reaches the executive committee.

**Objective:**
- Provide structured, written feedback on another team's executive recommendation.
- Identify strengths, weaknesses, and gaps using the review framework.

**Required artefact:**
- Written peer feedback covering five points:
  1. Strongest element: what is the most convincing part of the recommendation?
  2. Weakest assumption: what claim is least well-supported?
  3. Missing control: what governance or operational control is absent?
  4. Feasibility concern: what practical obstacle might block implementation?
  5. One improvement: what single change would make the recommendation stronger?

**Core tasks:**
1. Read the other team's recommendation carefully.
2. Write specific, evidence-based feedback for each of the five points.
3. Be constructive. The goal is to strengthen the recommendation, not to criticise the team.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Specificity | Feedback addresses all five points | Feedback references specific sections and claims | Feedback includes suggested revisions, not just observations |
| Quality of critique | Issues identified | Issues explained with reasoning | Issues connected to governance, risk, or business impact |

**Reflection:**
1. What did you learn from reviewing another team's work?
2. What element of their approach would you adopt in your own recommendation?

---

### Lab F | Revision and Final Submission

**Scenario:**
You have received peer feedback. Revise your recommendation and prepare it for final submission.

**Objective:**
- Incorporate peer feedback into a revised executive recommendation.
- Demonstrate the ability to respond constructively to critique.

**Required artefact:**
- Revised two-page executive recommendation with improvements based on peer feedback.
- "Peer Review Response" appendix: list each piece of feedback received and your response (revised, partially revised with explanation, or retained with justification).

**Core tasks:**
1. Review each piece of peer feedback.
2. Revise your recommendation where the feedback improves it.
3. For feedback you chose not to incorporate, write a brief explanation of your reasoning.
4. Add the Peer Review Response appendix to your final document.
5. Do a final quality check against the rubric before submission.

**Rubric:**

| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Responsiveness | All feedback acknowledged | Feedback addressed with specific revisions | Revisions demonstrably improve the recommendation |
| Final quality | Document is complete | Document is well-structured and evidence-based | Document is executive-ready and demonstrates critical reflection |

**Reflection:**
1. How did peer feedback change your recommendation?
2. What would you do differently if you were starting this assessment from scratch?

---

## End-of-Module Reflection

Return to your opening answers from Day 1 and write updated responses.

1. Has your view of the best AJB workflow for AI changed? How?

   _Updated answer:_

2. Do you see the same barriers, or different ones?

   _Updated answer:_

3. How would you now define success for an AI deployment?

   _Updated answer:_

4. What is the single most important thing you learned in this module?

   _Your answer:_

## Delivery Routes

### Intro Route
- Use the provided frameworks closely and keep your recommendation concise, structured, and evidence-based.
- Finish the top-opportunity shortlist and governance assessment before moving into stretch analysis.
- Write for decision quality, not for volume.

### Advanced Route
- Use stretch time for sequencing logic, sensitivity analysis, stakeholder mapping, and stronger executive framing.
- Deepen your governance reasoning by connecting controls to owner roles and decision gates.
- Use peer review to make your recommendation more resilient under challenge.

## Virtual Pacing Reminders
- Expect discussion blocks to take longer online than they would in person.
- Check in after each scoring or review exercise so your recommendation still aligns with the brief.
- If time tightens, complete the core recommendation before adding extra analysis.
