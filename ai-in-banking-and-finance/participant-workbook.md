# Module 7: AI in Banking and Finance - Participant Workbook

## Programme Context

This workbook supports Module 7 of the AJB AI and Data Training Programme. It is the programme capstone. Today learners draw together the technical, analytical, strategic, automation, and communication skills built across the previous six modules and apply them to a banking AI recommendation.

## Start Here

- Why this module matters: the real test is not whether you understand AI concepts in isolation, but whether you can make a balanced, banking-specific recommendation with clear controls.
- Your journey in this module: assess the use-case landscape, design prompts, evaluate risk and oversight, and finish with a leadership briefing.
- What you will produce: use-case analysis, prompt design work, risk assessment outputs, and a final leadership briefing.
- How validation works: every activity feeds the final capstone. The strongest work combines value, caution, evidence, and a realistic adoption path.

## How To Use This Workbook

This workbook guides your hands-on work throughout Module 7, the capstone of the AJB AI and Data Training Programme. You will complete four activities during the day, building toward a final leadership briefing that synthesises your learning from all seven modules.

Work through each activity in order. Each has a scenario, clear objectives, required artefacts, and a rubric. Your facilitator will set time boundaries and coordinate discussions between activities.

Use your Jupyter notebook (`day1_use_case_and_prompt_studio.ipynb`) for data analysis tasks. Use this workbook for structured written responses, reflections, and your leadership briefing draft.

---

## Performance Bands

| Band | Label | Description |
|------|-------|-------------|
| 4 | Distinction | All required and stretch artefacts complete. Analysis is specific to AJB, risk assessment is thorough, and the leadership briefing is presentation-ready. |
| 3 | Merit | All required artefacts complete and well-structured. Analysis demonstrates clear understanding of AI use cases, prompt design, and risk in banking. |
| 2 | Pass | All required artefacts complete. Work addresses the core requirements but may lack depth, specificity, or AJB context in places. |
| 1 | Developing | Some required artefacts incomplete or superficial. Needs further development before the analysis could inform real decisions. |

---

## Day 1: AI in Banking and Finance

### Mission Outcome

By end of day, you will have assessed banking AI use cases, designed constrained prompts, completed a structured risk assessment, and drafted a leadership briefing recommending one AI use case for AJB. This is your programme capstone: the briefing should reflect skills from all seven modules.

---

## Activity 1: Use Case Assessment

**Time allocation:** 30 minutes (15 analysis, 15 discussion)

### Scenario

AJB's Chief Data Officer has asked your team to review the bank's portfolio of AI use cases and identify patterns in adoption, risk, and value. The CDO wants a data-driven summary before the quarterly technology review.

### Objective

Analyse the AI use cases dataset to understand the landscape of AI applications across AJB, identify patterns, and surface insights that will inform prioritisation decisions.

### Required Artefacts

1. A summary table showing use case counts by department and AI type
2. A list of all high-risk, high-compliance use cases with their current status
3. A written paragraph (4-6 sentences) interpreting the key patterns you found

### Stretch Artefacts

4. A chart comparing estimated value across risk categories
5. A data-driven answer to: "Which department is most advanced in AI adoption and why?"

### Core Tasks

- Open your Jupyter notebook and load the `ai_use_cases_banking.csv` dataset
- Count use cases by department and by AI type (GenAI vs Traditional ML)
- Create a crosstab of department and AI type to identify adoption patterns
- Filter for high-risk, high-compliance use cases and examine their status
- Calculate total and average estimated value by risk rating
- Write your interpretation paragraph in the space below

### Stretch Tasks

- Create a horizontal bar chart of estimated value by risk category
- Analyse the relationship between implementation complexity and current status
- Identify which departments have the highest ratio of GenAI to Traditional ML

### Your Interpretation

_Write 4-6 sentences summarising the key patterns you found in the data. What stands out? What does the distribution tell you about AJB's AI maturity?_

```
[Your interpretation here]
```

### Rubric

| Criterion | Pass (2) | Merit (3) | Distinction (4) |
|-----------|----------|-----------|------------------|
| Data analysis | Basic counts and filters completed | Cross-tabulations and groupings with clear summaries | Multiple analytical dimensions explored with chart |
| Pattern identification | Identifies obvious patterns | Identifies non-obvious patterns with evidence | Draws strategic insights specific to AJB context |
| Interpretation | States findings factually | Interprets meaning and implications | Connects findings to adoption strategy decisions |

### Reflection

- What surprised you about the distribution of AI use cases across departments?
- Which use cases are in the right status (production, pilot, evaluation) and which seem misplaced?
- What additional data would you want before making prioritisation decisions?

```
[Your reflection here]
```

---

## Activity 2: Prompt Design Studio

**Time allocation:** 35 minutes (20 design, 15 discussion)

### Scenario

AJB's AI governance committee has asked your team to review the bank's library of prompt templates. Some templates are well-constrained; others need improvement. The committee also wants one new template for a use case that currently lacks one.

### Objective

Analyse existing prompt templates for quality and completeness, improve a weak template, and design a new banking-specific prompt template with appropriate constraints.

### Required Artefacts

1. A written assessment of the 3 weakest prompt templates, with specific reasons
2. An improved version of one high-risk prompt template with added constraints
3. A new prompt template for an AJB use case, following the Role-Task-Format pattern

### Stretch Artefacts

4. A prompt testing plan: how would you validate your new template works correctly?
5. A governance note: who should approve this template and what review cycle applies?

### Core Tasks

- Load the `prompt_templates.csv` dataset in your notebook
- Review all 12 templates and assess their constraint quality
- Identify the 3 weakest templates based on missing guardrails
- Select one high-risk template (risk_level = High) and write an improved version
- Design a new prompt template using the format below

### New Prompt Template Format

```
Template ID: PT-013 (or next available)
Use case: [specific AJB use case]
Prompt pattern: [Role-Task-Format / Extract-Summarise-Flag / Classify-Route-Escalate / other]
Role: [who is the model acting as]
Task: [what specifically to do]
Constraints:
  - [constraint 1]
  - [constraint 2]
  - [constraint 3]
  - [constraint 4]
  - [constraint 5]
Expected output type: [structured text / table / list / report section]
Risk level: [Low / Medium / High]
Guardrails:
  - [what the model must NOT do - item 1]
  - [what the model must NOT do - item 2]
```

### Stretch Tasks

- Write a testing plan with 3 test cases for your new template
- Define the approval workflow: who reviews, who approves, how often is it revisited

### Your Weak Template Assessment

_List the 3 weakest templates and explain why each needs improvement._

```
1. Template: [ID] - Weakness: [explanation]
2. Template: [ID] - Weakness: [explanation]
3. Template: [ID] - Weakness: [explanation]
```

### Your Improved Template

```
[Write your improved high-risk template here, showing original and improved versions]
```

### Your New Template

```
[Write your new prompt template here using the format above]
```

### Rubric

| Criterion | Pass (2) | Merit (3) | Distinction (4) |
|-----------|----------|-----------|------------------|
| Assessment | Identifies weak templates | Explains specific weaknesses with reasoning | Connects weaknesses to banking risk scenarios |
| Improved template | Adds basic constraints | Adds constraints that address specific failure modes | Constraints are testable, specific, and reference AJB policy |
| New template | Follows the format | Well-structured with relevant constraints | Production-quality with guardrails, edge cases, and testing notes |

### Reflection

- What is the relationship between prompt risk level and the number of constraints needed?
- How would prompt governance work in practice at AJB? Who owns prompt templates?
- What happens when a prompt template needs to change? What process should apply?

```
[Your reflection here]
```

---

## Activity 3: Risk Assessment Exercise

**Time allocation:** 30 minutes (15 individual, 15 pair discussion)

### Scenario

AJB's risk committee needs a structured assessment of one AI use case before it can proceed to the next stage. You have been asked to complete a formal risk assessment following the bank's AI risk framework.

### Objective

Select one AI use case and complete a structured risk assessment covering model risk, operational risk, compliance risk, human oversight requirements, and governance controls.

### Required Artefacts

1. A completed risk assessment form (see template below)
2. A risk classification with written justification (3-5 sentences)
3. A recommended human oversight level with rationale

### Stretch Artefacts

4. A comparison: how would the risk assessment change if you moved this use case from "augment" to "automate" mode?
5. A third-party risk note: if this use case relies on a vendor AI model, what additional risks apply?

### Risk Assessment Template

```
Use Case ID: _______________
Use Case Name: _______________
Department: _______________
AI Type: _______________

1. PURPOSE AND SCOPE
   What does this AI system do?
   [Your answer]

   What decisions does it inform or support?
   [Your answer]

   Who are the end users?
   [Your answer]

2. RISK IDENTIFICATION
   Model Risk (top risk):
   [Your answer]

   Operational Risk (top risk):
   [Your answer]

   Compliance Risk (top risk):
   [Your answer]

3. RISK CLASSIFICATION
   Overall risk level: [ Low / Medium / High ]
   Justification (3-5 sentences):
   [Your answer]

4. HUMAN OVERSIGHT
   Recommended level: [ Human-in-the-loop / Human-on-the-loop / Human-over-the-loop ]
   Rationale:
   [Your answer]

5. GOVERNANCE CONTROLS
   Before deployment:
   - [Control 1]
   - [Control 2]
   - [Control 3]

   After deployment:
   - [Control 1]
   - [Control 2]
   - [Control 3]

6. RECOMMENDATION
   [ Adopt / Pilot / Defer / Reject ]
   Timeline: _______________
   Next step: _______________
```

### Stretch Tasks

- Write a paragraph explaining how the risk profile changes if the use case is fully automated vs human-augmented
- Identify 3 vendor-specific risks that apply if using a third-party AI model

### Rubric

| Criterion | Pass (2) | Merit (3) | Distinction (4) |
|-----------|----------|-----------|------------------|
| Risk identification | Lists risks at a general level | Identifies specific, plausible risks for the chosen use case | Risks are banking-specific with concrete failure scenarios |
| Classification | States risk level | Justifies classification with evidence | Justification references regulatory context and AJB specifics |
| Controls | Lists generic controls | Controls are specific to the use case | Controls are actionable, measurable, and include review cycles |
| Oversight model | Selects a level | Explains why this level is appropriate | Compares levels and explains why others were rejected |

### Reflection

- Which risk category (model, operational, compliance) was hardest to assess? Why?
- What is the cost of getting the oversight level wrong in each direction (too strict, too loose)?
- How would you explain this risk assessment to a non-technical member of the risk committee?

```
[Your reflection here]
```

---

## Activity 4: Leadership Briefing Draft

**Time allocation:** 45 minutes (30 drafting, 15 peer review)

### Scenario

You have been given a 5-minute slot at the AJB quarterly technology review to present one AI use case recommendation to senior leadership, including the CDO, CRO, and Head of Compliance. Your briefing must be clear, evidence-based, and actionable.

### Objective

Draft a one-page leadership briefing that recommends one AI use case for AJB, synthesising your use case assessment, prompt design, and risk analysis from the previous activities.

### Required Artefacts

1. A completed one-page leadership briefing following the template below
2. A peer review of another team's briefing with written feedback

### Stretch Artefacts

3. A 90-day implementation plan with key milestones
4. A list of 3 questions you expect leadership to ask and your prepared answers

### Leadership Briefing Template

```
LEADERSHIP BRIEFING: AI USE CASE RECOMMENDATION
Date: _______________
Prepared by: _______________

PROBLEM STATEMENT
[1-2 sentences: what business problem does this address?]

PROPOSED AI SOLUTION
[3-4 sentences: what type of AI, how it works, what it produces]

BUSINESS VALUE
[2-3 sentences with quantified benefit in SAR, time saved, or quality improvement]

RISK ASSESSMENT
Top 3 risks:
1. [Risk and mitigation]
2. [Risk and mitigation]
3. [Risk and mitigation]
Overall risk classification: _______________

HUMAN OVERSIGHT AND CONTROLS
Oversight model: _______________
Key controls:
- [Control 1]
- [Control 2]
- [Control 3]

RECOMMENDATION
[ Adopt / Pilot / Defer / Reject ]
Timeline: _______________
Immediate next step: _______________
Resources required: _______________

PROMPT DESIGN (if applicable)
[Include or reference your prompt template from Activity 2]
```

### Peer Review Questions

After exchanging briefings with another team, provide written feedback:

```
Peer Review For: [Team name]

1. Is the problem statement clear and specific to AJB?
   [Your feedback]

2. Is the business value credible and well-quantified?
   [Your feedback]

3. Are the risks honestly assessed or underplayed?
   [Your feedback]

4. Is the human oversight model appropriate?
   [Your feedback]

5. Would you be confident presenting this to the CRO?
   [Your feedback]

6. Single biggest strength of this briefing:
   [Your feedback]

7. Single biggest weakness or gap:
   [Your feedback]
```

### Stretch Tasks

- Draft a 90-day implementation plan with milestones at day 30, 60, and 90
- Prepare answers to 3 likely leadership questions (budget, timeline, regulatory impact)

### Rubric

| Criterion | Pass (2) | Merit (3) | Distinction (4) |
|-----------|----------|-----------|------------------|
| Problem statement | States a general problem | Problem is specific to AJB with context | Problem is quantified with current cost or impact |
| Value case | States qualitative value | Includes estimated value | Value is quantified with assumptions stated |
| Risk assessment | Lists generic risks | Risks are specific with mitigations | Risk assessment is thorough with regulatory references |
| Recommendation | States adopt/pilot/defer/reject | Includes timeline and next step | Includes implementation plan and resource requirements |
| Overall quality | Readable draft | Professional quality, clear structure | Presentation-ready for senior leadership |

### Reflection

- What was hardest about translating technical analysis into a leadership briefing?
- How did peer review change your perspective on your own recommendation?
- Looking across all 7 modules, which skills were most important for this capstone activity?

```
[Your reflection here]
```

---

## Programme Capstone Reflection

This is the final reflection for the AJB AI and Data Training Programme.

1. **Most valuable skill gained:** What is the single most useful skill or concept you learned across all 7 modules?

```
[Your answer]
```

2. **30-day action:** What specific action will you take in the next 30 days to apply what you learned?

```
[Your answer]
```

3. **Remaining question:** What is one question about AI in banking that you still want to explore?

```
[Your answer]
```

4. **Programme feedback:** What would you change about the programme for the next cohort?

```
[Your answer]
```

## Delivery Routes

### Intro Route
- Follow the core use-case, prompt, and risk discussion flow with concise written outputs.
- Focus on understanding where AI fits, where it does not, and which controls must stay visible.
- Keep your prompt work grounded in clear banking scenarios.

### Advanced Route
- Use stretch time for deeper prompt iteration, scenario comparison, and stronger mitigation language.
- Improve the quality of your adoption recommendations, not just the number of examples you generate.
- Use debriefs to test your assumptions against risk and governance concerns.

## Virtual Pacing Reminders
- This module is short, so stay disciplined about the core prompt studio and risk discussion.
- Expect quick check-ins rather than long lab blocks.
- If time tightens, finish the core prompt set and risk notes before adding more scenarios.
