# Participant Workbook

## Module 5: Automation in AI

Al Jazira Bank | AJB AI and Data Training Programme

---

## Programme Context

This workbook supports Module 5 of the AJB AI and Data Training Programme. It takes the strategy thinking from Module 4 and turns it into workflow and operating design. The goal is to help learners distinguish between attractive automation ideas and governed automation that can work safely in banking operations.

## Start Here

- Why this module matters: automation creates value only when the workflow, exception paths, controls, and ownership model are explicit.
- Your journey in this module: map the process, classify automation opportunities, design fallback logic, scope a pilot, and finish with a rollout recommendation.
- What you will produce: workflow maps, automation classifications, exception designs, pilot plans, and a governed rollout recommendation.
- How validation works: every lab requires a concrete artefact. Strong work is specific about operating risk, human review, and measurable success conditions.

## How To Use This Workbook

- This workbook is your working document for the two-day module. Write directly in it.
- Each lab has a scenario, objective, required artefacts, and rubric. Complete all required artefacts to reach Competent level.
- Stretch artefacts and tasks are optional but are the path to Strong and Exceptional performance bands.
- Use the datasets provided in the `data/` folder and the notebooks in the `notebooks/` folder.
- Work in your assigned team. Be prepared to present and defend your work.
- Keep your completed workbook as a reference for applying these frameworks in your department.

## Performance Bands

- `Competent`: Maps workflow steps accurately. Identifies at least one automation point with a named review step. Produces all required artefacts with correct structure.
- `Strong`: Classifies automation types with justification. Designs exception paths for all automated steps. Proposes a pilot with measurable metrics and failure triggers.
- `Exceptional`: Connects automation design to operating risk and cost. Defines rollback triggers and stakeholder accountability. Critiques trade-offs with evidence and proposes alternatives.

---

## Day 1 | Foundations: Workflow Mapping and Automation Classification

### Mission Outcome

By the end of Day 1, you will have mapped a complete banking workflow, classified each step by automation type, and identified exception paths and human-in-the-loop requirements.

---

### Lab A | Workflow Mapping: KYC Document Review

**Scenario:** Al Jazira Bank processes approximately 200 KYC (Know Your Customer) cases per week. Each case requires document submission, completeness checks, field extraction, sanctions screening, data comparison, risk summary, and senior approval. The current average turnaround is 48 hours, with a 12% exception escalation rate and an 18% customer resubmission rate.

**Objective:** Map the complete KYC document review workflow from trigger to completion, including all steps, decision points, and handoffs.

**Required artefact:**
- A workflow map listing every step from customer document submission to outcome notification
- Each step labelled with: step name, step type (data capture, review, decision, notification), and current method (manual, semi-automated, automated)
- At least two decision points identified with branching logic

**Stretch artefact:**
- Estimated time per step based on the 48-hour average turnaround
- Identification of bottleneck steps (where the most time is spent waiting)
- Informal workarounds that staff currently use to handle delays

**Core tasks:**
1. List all steps in the KYC review process in order, from customer submission to outcome notification.
2. For each step, record the step type and whether it is currently manual, semi-automated, or fully automated.
3. Identify at least two decision points. For each, describe the branching logic (what condition leads to which path).
4. Draw arrows or write flow descriptions showing how the process moves from one step to the next.
5. Mark handoffs between teams or systems with a clear label.

**Stretch tasks:**
- Estimate how the 48-hour turnaround distributes across steps. Which step consumes the most elapsed time?
- Identify at least one informal workaround that staff use today (e.g., emailing documents directly instead of using the portal).
- Note any steps that are duplicated or could be consolidated.

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Completeness | All major steps listed | Decision points and handoffs included | Exception paths and informal workarounds captured |
| Accuracy | Steps are in correct order | Step types and methods correctly labelled | Timing estimates are reasonable and justified |
| Clarity | Map is readable | Map uses consistent notation | Map could be handed to a colleague and understood without explanation |

**Reflection:**
1. Which step in this workflow do you think consumes the most elapsed time, and why?
2. If you could change only one thing about this process today (without any automation), what would it be?

---

### Lab B | Automation Classification: Loan Processing

**Scenario:** AJB personal loan processing involves 14 steps and takes an average of 3.2 days. Steps include application intake, income verification, credit score pull, debt-to-income calculation, risk assessment, committee approval, and offer generation. Monthly volume is approximately 600 applications.

**Objective:** Classify each step of the loan processing workflow by automation type (rule-based, AI-assisted, or autonomous) and justify your classification.

**Required artefact:**
- A classification table with columns: step name, current method, proposed automation type, justification
- At least three steps classified as automation candidates
- At least one step identified as requiring mandatory human review

**Stretch artefact:**
- A decision framework diagram showing how you chose the automation type for each step
- An estimated impact analysis: hours saved per week if your top three candidates were automated
- A dependency map showing which automations depend on other systems or data sources

**Core tasks:**
1. List all 14 steps in the loan processing workflow (refer to the slide deck for the step breakdown).
2. For each step, classify it as: rule-based candidate, AI-assisted candidate, autonomous candidate, or must remain manual.
3. For each classification, write a one-sentence justification explaining why that type is appropriate.
4. Identify which steps require mandatory human review and explain why removing human review would create unacceptable risk.

**Stretch tasks:**
- Calculate estimated time savings if your top three automation candidates were implemented. Use the 3.2-day average as your baseline.
- Map dependencies between steps: which automations must be implemented before others can work?
- Identify one step where you are uncertain about the correct automation type. Explain what additional information you would need to decide.

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Classification accuracy | At least three steps classified | All steps classified with appropriate types | Classifications include risk and feasibility considerations |
| Justification quality | One-sentence justifications present | Justifications reference specific characteristics of each step | Justifications connect to regulatory requirements and operating risk |
| Human review identification | At least one mandatory review step identified | All mandatory review steps identified with reasoning | Trade-offs of removing review are analysed with evidence |

**Reflection:**
1. Which automation type (rule-based, AI-assisted, autonomous) is most common in your classification? Why?
2. If a regulator asked you to justify your most aggressive automation recommendation, what evidence would you present?

---

### Lab C | Exception Path Design

**Scenario:** Using either the KYC or loan processing workflow from Labs A and B, design a complete exception handling framework for all automated steps.

**Objective:** For every step you proposed to automate, identify failure modes and design detection, response, escalation, and recovery procedures.

**Required artefact:**
- An exception handling table with columns: step, failure mode, detection method, response action, escalation path, halt workflow (yes/no)
- At least one exception path per automated step
- Clear distinction between exceptions that halt the workflow and those that can be handled without stopping

**Stretch artefact:**
- Confidence thresholds for AI-assisted steps (high/medium/low bands with actions for each)
- A "cascade failure" analysis: if step X fails, what downstream steps are affected?
- Recovery time estimates for each exception type

**Core tasks:**
1. Select either the KYC or loan processing workflow.
2. For every step you classified as an automation candidate, identify at least one failure mode (what could go wrong).
3. For each failure mode, define: how you detect it, what immediate action you take, who gets notified, and whether the workflow should halt.
4. Distinguish between "halt and investigate" exceptions and "flag and continue" exceptions. Justify the distinction.

**Stretch tasks:**
- For AI-assisted steps, define three confidence bands (e.g., above 90%: auto-proceed, 70-90%: flag for review, below 70%: route to manual). Justify your threshold choices.
- Trace one failure through the workflow: if the failure in step 3 is not caught, what happens at step 5, step 8, and the final output?
- Estimate how long it would take to recover from each exception type and return to normal processing.

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Coverage | At least one exception per automated step | Multiple failure modes per step considered | Cascade effects and downstream impacts analysed |
| Specificity | Failure modes are named | Detection methods and response actions are specific and actionable | Confidence thresholds defined with evidence-based reasoning |
| Practicality | Exception paths exist | Exception paths could be implemented as written | Recovery procedures include timing and resource estimates |

**Reflection:**
1. Which exception in your table would be the most damaging if it went undetected for 48 hours?
2. Is there an exception path where you are not confident in the detection method? What would you need to improve it?

---

## Day 2 | Application: Design, Critique, and Pilot Planning

### Mission Outcome

By the end of Day 2, you will have prioritized automation candidates using real data, designed a customer service routing system, developed a pilot plan, and defended your proposal under peer critique.

---

### Lab D | Workflow Prioritization from Data

**Scenario:** You have access to a dataset of 60 AJB workflows (workflow_inventory.csv). Each workflow includes department, process name, step count, manual hours per week, error rate, automation potential score, complexity rating, and process owner role. Your task is to use data analysis to recommend which workflows to automate first.

**Objective:** Analyse the workflow inventory dataset and produce a ranked list of the top five automation candidates with evidence-based justification.

**Required artefact:**
- A ranked table of the top five automation candidates with columns: rank, process name, department, proposed automation type, estimated weekly hours saved, key risk, one-sentence justification
- Evidence from the dataset supporting each ranking decision (specific numbers, not vague references)

**Stretch artefact:**
- A scatter plot or comparison chart showing manual hours vs. error rate for all 20 workflows, with your top five highlighted
- A "quick wins vs. strategic bets" matrix categorizing all 20 workflows by implementation effort and impact
- Dependencies column identifying systems or teams required for each automation

**Core tasks:**
1. Load the workflow_inventory.csv file in your notebook.
2. Sort and filter workflows by manual hours, error rate, and automation potential.
3. Select the top five candidates. For each, state the automation type and calculate estimated savings.
4. Identify the key risk or constraint for each candidate.
5. Write a one-sentence justification for each ranking position.

**Stretch tasks:**
- Create a visualization comparing all workflows on two dimensions (e.g., hours vs. error rate).
- Categorize all 20 workflows into a 2x2 matrix: high impact / low effort (quick wins), high impact / high effort (strategic bets), low impact / low effort (maybe later), low impact / high effort (avoid).
- For your top candidate, identify every system or team that must be involved in implementation.

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Data usage | Rankings reference specific data points | Multiple data dimensions used in analysis | Statistical or visual analysis supports conclusions |
| Ranking logic | Top five are plausible choices | Rankings are justified with clear reasoning | Trade-offs between candidates are explicitly discussed |
| Risk awareness | At least one risk identified per candidate | Risks are specific to each workflow | Risks connect to implementation feasibility and regulatory context |

**Reflection:**
1. Did any workflow surprise you as a strong automation candidate? Why was it not obvious at first?
2. What data point that is missing from this dataset would most change your rankings if you had it?

---

### Lab E | Customer Service Routing Design

**Scenario:** AJB receives customer inquiries through four channels: phone, email, mobile app, and branch walk-in. The bank wants to implement AI-assisted routing to direct inquiries to the right team or system. Current routing is manual and inconsistent, leading to an average resolution time of 4.2 hours and a 22% re-routing rate.

**Objective:** Design a complete customer service routing system including intent classification, team assignment, SLA targets, and escalation logic.

**Required artefact:**
- A routing matrix with columns: intent category, channel, first responder (AI/L1/L2), AI eligible (yes/no), SLA target, escalation trigger
- At least six intent categories
- Fallback behaviour defined for low-confidence classifications

**Stretch artefact:**
- Priority weighting rules for peak-hour routing adjustments
- A customer satisfaction monitoring plan tied to routing decisions
- Comparison of routing accuracy metrics: how you would measure whether the AI routing is better than manual routing

**Core tasks:**
1. Define at least six intent categories relevant to AJB (e.g., balance inquiry, complaint, loan inquiry, card dispute, account opening, technical support).
2. For each intent and channel combination, specify the first responder and whether AI can handle the initial response.
3. Set SLA targets for each intent category.
4. Define escalation triggers: what moves a case from AI to human, from L1 to L2, from L2 to specialist.
5. Define fallback behaviour for queries where intent classification confidence is below 70%.

**Stretch tasks:**
- Design priority adjustment rules for peak hours (e.g., during high call volume, route low-priority queries to AI and reserve human agents for complex cases).
- Propose three metrics that would tell you whether AI routing is performing better than the previous manual system.
- Design a feedback loop: how does the routing system learn from misrouted cases?

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Completeness | Six intent categories with routing defined | All channel and intent combinations covered | Edge cases and low-confidence handling designed |
| SLA design | SLA targets defined | SLA targets are realistic and differentiated by intent | SLAs include monitoring and alert mechanisms |
| Escalation logic | Escalation triggers exist | Triggers are specific and actionable | Multi-level escalation with clear ownership at each level |

**Reflection:**
1. What would happen if the AI router misclassified a complaint as a balance inquiry? How would you detect and correct this?
2. Should the AI router ever be fully autonomous (no human backup), and for which intent categories?

---

### Lab F | End-to-End Automation Design Mission

**Scenario:** Choose one of two scenarios for your capstone mission:
- **Scenario A: Trade finance document processing.** Letters of credit require verification of 12 document types across multiple parties. Current processing: 5 days average, 80 cases per month.
- **Scenario B: Internal audit finding remediation tracking.** Audit findings require action plans, owner assignments, evidence collection, and status reporting. Current backlog: 140 open findings across 8 departments.

**Objective:** Design a complete automation proposal including workflow map, automation classification, exception framework, pilot plan, and risk register. Present your proposal and defend it under peer critique.

**Required artefact:**
- Complete current-state workflow map
- Automation proposal table (step, current method, automate yes/no, type, justification)
- Exception handling table for all automated steps
- Pilot plan with scope, duration, success metrics, failure triggers, and rollback plan
- Risk register with at least five risks (likelihood, impact, mitigation, owner)

**Stretch artefact:**
- Future-state workflow map showing the process after automation
- Cost-benefit estimate for the first year of operation
- Stakeholder communication plan for rollout

**Core tasks:**
1. Map the current-state workflow for your chosen scenario. Include all steps, decision points, handoffs, and exception paths.
2. Classify each step by automation type and justify your choice.
3. Build an exception handling table for every step you propose to automate.
4. Design a pilot plan covering: scope (percentage of cases), duration (weeks), success metrics (with targets), failure triggers (with thresholds), and rollback procedures.
5. Create a risk register with at least five risks, including likelihood, impact, mitigation action, and owner.
6. Prepare an 8-minute presentation of your proposal.

**Stretch tasks:**
- Draw a future-state workflow map showing what the process looks like after your proposed automations are in place.
- Estimate the cost of implementation and the expected savings in the first year. State your assumptions clearly.
- Write a one-page stakeholder communication plan: who needs to know about this pilot, what they need to know, and when.

**Rubric:**
| Criterion | Competent | Strong | Exceptional |
|-----------|-----------|--------|-------------|
| Workflow map | Steps listed in correct order | Decision points, handoffs, and exception paths included | Informal workarounds and timing estimates captured |
| Automation design | At least three steps classified | All steps classified with type and justification | Classification connects to risk, cost, and feasibility |
| Exception handling | At least one exception per automated step | All automated steps have specific exception paths | Cascade effects and recovery procedures included |
| Pilot plan | Scope and duration defined | Success metrics and failure triggers included | Rollback plan, stakeholder matrix, and phased expansion defined |
| Risk register | Five risks listed | Risks include likelihood, impact, and mitigation | Risks are specific, mitigations are actionable, and owners are named |
| Presentation | Clear and structured | Defends choices with evidence | Responds to critique constructively and adapts proposals |

**Reflection:**
1. What is the single weakest point in your automation proposal? How would you address it with more time?
2. If your pilot fails in week two, what is the first thing you would investigate?

---

## Post-Module Action

After completing this module, identify one workflow in your own department and apply the framework:
1. Map the workflow end to end.
2. Classify each step for automation potential.
3. Design exception handling for your top candidate.
4. Draft a pilot plan with metrics and present it to your manager.

The best automation project is the one you can govern. Start there.

## Delivery Routes

### Intro Route
- Stay close to the workflow template and produce one clear governed automation design first.
- Prioritise visible controls, fallback steps, and owner roles over technical breadth.
- Use the stretch path only after the future-state workflow is complete and reviewable.

### Advanced Route
- Use stretch time to add stronger exception logic, thresholds, sequencing, and implementation detail.
- Make every extra step earn its place by improving control or decision quality.
- Bring your strongest trade-off questions into the group debrief.

## Virtual Pacing Reminders
- Expect a checkpoint after current-state mapping before solution design starts.
- Keep the future-state design concise enough to explain quickly in debrief.
- If time tightens, protect the governed core workflow before expanding the automation scope.
