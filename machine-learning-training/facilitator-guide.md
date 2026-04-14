# Module 2 | Machine Learning Training -- Facilitator Guide

## Module Overview

This module covers machine learning fundamentals for banking professionals across three days (four hours per day). Participants work through eight activities: problem framing, baseline classification, customer segmentation, model evaluation, model comparison, monitoring design, deployment readiness, and a capstone recommendation. All labs use AJB banking datasets and scenarios.

**Prerequisites:** Participants should have completed Module 1 (Python Foundations) or have equivalent Python and pandas fluency.

**Materials:** Slide deck (80 slides), participant workbook, Jupyter notebooks (one per day plus solutions), datasets (`service_tickets_ml.csv`, `customer_segments.csv`, `model_governance_scenarios.csv`), solution guide.

## Delivery Stance

- Keep the module anchored to banking decision quality, not abstract model theory.
- Repeatedly connect each metric, model choice, and governance control to a real operational or risk consequence.
- Treat evaluation and explainability as boardroom communication topics, not only data science topics.
- Prioritise judgement over technique. A participant who chooses the right metric for the wrong reason has not learned the lesson.
- Use participant mistakes as teaching moments. Most learning happens when a recommendation is challenged.
- Resist the temptation to demonstrate advanced techniques. The goal is confident, defensible fundamentals.
- Model the communication standard you expect. Explain your own examples in plain language first.

## Day 1 | Supervised Learning Foundations (4 hours)

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening | 20 min | Module overview, context setting, setup check |
| Session 1 | 50 min | Problem framing concepts (slides + discussion) |
| Lab 1 | 40 min | Problem Framing Workshop |
| Break | 15 min | |
| Session 2 | 45 min | Classification fundamentals, metrics, thresholds (slides) |
| Lab 2 | 45 min | Baseline Classification Workflow |
| Wrap-up | 15 min | Day 1 reflection and preview of Day 2 |

### Key Facilitation Points

- Start with the business decision, not the algorithm. Ask: "What action will change based on this model's output?"
- Slow down at leakage, threshold choice, and confusion matrix interpretation. These are the areas where banking professionals need the most time.
- Push the room to explain what a false positive and false negative mean in the specific banking use case, not in general.
- During Lab 1, resist giving participants the target variable. Let them define it and then challenge their choices.

### Common Participant Challenges

- Defining the target variable too broadly (e.g. "customer satisfaction" instead of "SLA breach within 48 hours")
- Confusing accuracy with usefulness, especially on imbalanced datasets
- Treating the confusion matrix as a table to read rather than a story to tell
- Skipping the "why this metric" question and jumping to the highest number

## Day 2 | Segmentation, Evaluation, and Model Comparison (4 hours)

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening | 15 min | Day 1 recap, Day 2 objectives |
| Session 3 | 35 min | Unsupervised learning and clustering concepts (slides) |
| Lab 3 | 40 min | Customer Segmentation Studio |
| Break | 15 min | |
| Session 4 | 30 min | Advanced evaluation and model comparison (slides) |
| Lab 4 | 35 min | Model Evaluation Deep-Dive |
| Lab 5 | 35 min | Model Comparison Review |
| Wrap-up | 15 min | Day 2 reflection |

### Key Facilitation Points

- Keep clustering grounded in business usefulness rather than mathematical novelty. Ask: "What would you do differently for each segment?"
- Make participants justify feature selection before they justify a model. Feature choice is a governance decision.
- Use model comparison to surface governance trade-offs, not just score comparisons.
- In Lab 4, push participants beyond headline metrics. Ask: "Where does the model fail, and for whom?"

### Common Participant Challenges

- Choosing too many or too few clusters without business justification
- Treating segments as permanent rather than as snapshots that need refreshing
- Comparing models on a single metric and declaring a winner
- Ignoring interpretability as a factor in model selection

## Day 3 | Deployment, Monitoring, and Executive Communication (4 hours)

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening | 15 min | Day 2 recap, Day 3 objectives |
| Session 5 | 30 min | Monitoring and deployment readiness (slides) |
| Lab 6 | 35 min | Monitoring Design Studio |
| Lab 7 | 30 min | Deployment Readiness Review |
| Break | 15 min | |
| Session 6 | 20 min | Executive communication principles (slides) |
| Capstone | 50 min | AJB Model Recommendation |
| Close | 15 min | Capstone presentations, final reflection, close |

### Key Facilitation Points

- Teach deployment as an operating model question with monitoring, rollback, and ownership, not a technical handover.
- Keep executive communication concise, caveated, and decision-oriented.
- Use the capstone to test judgement, not only technical fluency. The best capstone work integrates learning from all three days.
- During Lab 6, insist on specific thresholds and owners. Vague monitoring plans are not acceptable.

### Common Participant Challenges

- Writing monitoring plans with metrics but no thresholds or response actions
- Treating deployment readiness as a purely technical question
- Writing executive summaries that are too long or too technical
- Omitting risk and governance from the capstone recommendation

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Core artefacts are complete and technically correct. Problem framing is clear. Metrics are reported accurately. Recommendations are present but may lack depth. |
| **Strong** | All core artefacts are complete with business justification. Trade-offs are discussed. Governance considerations are present. Stretch artefacts are attempted. Communication is clear. |
| **Exceptional** | Work is analytically disciplined and governance-aware. Recommendations are executive-ready and survive challenge. Integration across labs is visible. Participant can explain and defend choices under questioning. |

### Rubric Application

- Assess each lab independently against its rubric, then consider overall trajectory across the three days.
- Weight judgement and communication as heavily as technical accuracy.
- A participant who produces correct metrics but cannot explain them in business terms should not receive "Strong."
- Look for integration in the capstone: does the participant draw on problem framing, evaluation, and monitoring work from earlier labs?

## Close Standard

End the module by asking each participant to complete this sentence:

> "The biggest change I will make in how I evaluate machine learning work is..."

Collect responses. Use them to gauge whether the module landed on judgement and governance, not only on technical fluency.

## Mixed-Level Delivery Overlay
- Intro route: hold newer participants on baseline framing, metric choice, and plain-language model interpretation.
- Advanced route: give stronger participants the deeper comparison, threshold, and monitoring stretch prompts.
- Protect the business explanation in every debrief. Do not let the room hide behind model jargon.

## Virtual Engagement Checkpoints
- Day 1: stop after target definition and ask each group what business action the model will change.
- Day 2: pause after segmentation and require one practical use for each segment before moving on.
- Day 3: run a short executive-readout round so monitoring and governance points are spoken aloud, not just written down.
