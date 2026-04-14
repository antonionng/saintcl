# Facilitator Guide

## Module Overview

Module 4 is a two-day, strategy-focused module on identifying, assessing, and recommending AI opportunities in banking. Participants do not write code. They analyse workflows, score opportunities, assess governance readiness, and produce an executive recommendation. The capstone is a peer-reviewed, two-page executive recommendation for one AI initiative at AJB.

## Delivery Stance

- This is a business judgement module. Keep every conversation grounded in workflow ownership, measurable outcomes, and governance controls.
- Push back firmly on vague enthusiasm. If a participant says "AI could help with customer service," ask: "Which workflow? Who owns it? What outcome improves, and by how much?"
- Reward selectivity. The goal is not a long list of ideas. It is one well-chosen, well-governed recommendation.
- Use the cases to generate discussion, not lectures. Ask participants to identify the failure mode or success factor before you explain it.
- Insist on written artefacts. Discussion alone does not build the skill. Every lab requires a submitted document.
- For participants who finish early, direct them to stretch tasks. These deepen the analysis without changing the scope.
- Do not let the room default to "we need a platform." Redirect to: "What is the first use case that proves the value?"

## Day 1 | Opportunity and Assessment

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening and orientation | 30 min | Slides s01-s08. Introductions, module purpose, Day 1 opening reflection |
| Core concepts | 60 min | Slides s09-s26. Value categories, AI techniques, cases, operating models, data readiness |
| Break | 15 min | |
| Assessment framework | 45 min | Slides s27-s42. Opportunity mapping sequence, scoring, worked example, anti-patterns |
| Lab A: Opportunity Mapping | 35 min | Slides s43-s47. Scoring, prioritisation matrix, top-3 selection |
| Lab B: Governance Assessment | 25 min | Slides s48-s53. Governance checklist, gap analysis, readiness summary |
| Lab C: Operating Model Design | 20 min | Slides s54-s56. Workflow design, human review, fallback |
| Day 1 reflection and close | 10 min | Slides s57-s58. Written reflection |

### Key Facilitation Points

- During core concepts, spend extra time on the four cases (slides s13-s16). Ask participants to identify the success factor or failure mode before revealing it.
- When introducing the scoring framework, walk through the worked example (slides s34-s36) interactively. Ask the room to justify each score before showing the rationale.
- In Lab A, circulate and check that participants are writing specific rationale for score adjustments, not just copying the pre-filled values.
- In Lab B, watch for participants marking everything as "Met" without evidence. Challenge them to provide specific evidence for each assessment.

### Common Participant Challenges

- Participants default to technology-first thinking ("Let's use NLP") instead of problem-first thinking ("What workflow is broken?"). Redirect with: "What is the business problem?"
- Some participants struggle to quantify value. Provide the formula: volume x time saved x cost per hour = annual saving. Remind them that ranges are acceptable.
- Governance assessment feels abstract to participants without compliance experience. Pair compliance-background participants with business-line participants.
- Participants may resist the "park" requirement. Emphasise that recommending deferral is a sign of rigour, not failure.

## Day 2 | Governance and Recommendation

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Case discussion | 45 min | Slides s59-s66. Four cases, critique exercise, pattern analysis |
| Lab D: Executive Recommendation Draft | 40 min | Slides s67-s70. Two-page recommendation |
| Break | 15 min | |
| Lab E: Peer Review | 20 min | Slides s71-s72. Structured peer feedback |
| Lab F: Revision and Final Submission | 20 min | Slides s73-s74. Incorporate feedback, final document |
| Module recap and close | 40 min | Slides s75-s80. Revisit Day 1 answers, key principles, performance bands |

### Key Facilitation Points

- Open Day 2 with the case discussion, not a recap lecture. The cases re-engage participants and set up the recommendation task.
- During Lab D, circulate early and check executive summaries. The most common error is burying the recommendation in the middle of the document. Insist: "Lead with what you propose."
- For peer review (Lab E), enforce the five-point feedback structure. Unstructured feedback tends to be vague.
- During Lab F, watch for participants dismissing peer feedback without reasoning. The rubric requires explicit responses to each point.
- In the closing session, give participants time to write updated answers to the Day 1 questions. The comparison is a powerful learning moment.

### Common Participant Challenges

- Executive writing is unfamiliar to many participants. Remind them: one recommendation, quantified impact, named risks, specific next step. No preamble.
- Peer review quality varies. If feedback is too gentle, prompt: "What would the CRO challenge about this recommendation?"
- Some participants resist revising their work after peer review. Frame it as professional practice: "Every board paper goes through multiple review cycles."
- Time pressure in Lab D is intentional. If participants are struggling at the 25-minute mark, suggest they complete the structure with bullet points and refine later.

## Materials Checklist

Before Day 1, confirm the following are available and accessible to all participants:

- Slide deck loaded and projectable (80 slides, `index.html`).
- Participant workbook distributed (digital or printed).
- Dataset files accessible: `data/ai_opportunities.csv` and `data/governance_checklist.csv`.
- Notebooks available for participants who prefer structured scaffolding: `notebooks/day1_opportunity_assessment.ipynb` and `notebooks/day2_business_case_and_governance.ipynb`.
- Whiteboard or shared digital canvas for prioritisation matrix sketches.
- Timer visible to the room for lab sessions.

## Pair and Group Formation

- For Labs A, B, and C, pair participants from different departments when possible. Cross-functional pairs produce stronger assessments because they challenge each other's assumptions about data availability and workflow ownership.
- For Lab E (peer review), ensure pairs exchange with a different team than they worked with. Fresh eyes produce better critique.
- If the group is small (fewer than 8), all labs can be done individually. Peer review still requires exchange with at least one other participant.

## Handling Difficult Moments

- If a participant argues that AI governance is unnecessary overhead, redirect: "Name a bank that deployed AI without governance and had no regrets. Governance is the cost of operating in a regulated industry."
- If the room gets stuck on one opportunity and cannot agree on rankings, use it as a teaching moment: "This is exactly why you need a framework. The framework does not eliminate judgement, but it makes judgement visible and comparable."
- If participants produce recommendations that are too long (more than 2 pages), do not accept them. Brevity is a professional skill. Ask them to cut.

## Assessment Guidance

- Apply the performance bands from the participant workbook. Focus on the capstone recommendation (Lab F) as the primary assessment artefact.
- `Competent` requires all sections present and the structure followed. Content can be basic.
- `Strong` requires quantitative value estimates, governance controls mapped to specific risks, and substantive peer feedback.
- `Exceptional` requires executive-ready quality: specific, concise, evidence-based, with monitoring and escalation plans.
- Do not penalise participants for choosing a "simpler" opportunity. A well-governed, well-argued recommendation for document processing is stronger than a vague proposal for a customer-facing chatbot.
- If a participant's recommendation is strong but their peer review feedback was superficial, note this in the assessment. The ability to critique is part of the competency.

## Close Standard

A successful close means every participant has submitted a final recommendation that names one specific use case, quantifies its value, identifies its governance requirements, and proposes a scoped pilot with a decision gate. The room should leave with a shared vocabulary for discussing AI opportunities and a repeatable framework they can apply in their departments.

The final question to the room before closing: "If you had 5 minutes with the CEO tomorrow, which AI opportunity would you recommend and why?" Every participant should be able to answer this clearly and concisely.

## Mixed-Level Delivery Overlay
- Intro route: keep participants close to the scoring framework and the core recommendation template.
- Advanced route: use stronger participants for sequencing, sensitivity analysis, and richer governance challenge.
- Keep the room moving toward a decision. Strategy sessions can drift if the recommendation is not kept visible.

## Virtual Engagement Checkpoints
- Day 1: stop after the first opportunity shortlist and ask each team to defend one inclusion and one exclusion.
- Day 2: pause before final recommendation drafting and confirm owner roles, controls, and success metrics are explicit.
- Use peer review as a live energy reset, not only as written homework.
