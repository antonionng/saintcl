# Module 2 | Machine Learning Training -- Participant Workbook

## Programme Context

This workbook supports Module 2 of the AJB AI and Data Training Programme. The module runs across three days (four hours per day) and focuses on supervised learning, unsupervised segmentation, model evaluation, and deployment readiness in an enterprise banking context.

## Start Here

- Why this module matters: this is where data work becomes decision-system thinking. You are no longer only preparing data. You are deciding when ML is appropriate, how to judge it, and how to recommend it responsibly.
- Your journey in this module: frame the problem, build baselines, compare model approaches, surface governance risks, and finish with a deployment recommendation.
- What you will produce: problem framing documents, model comparison outputs, segmentation reasoning, governance notes, and a leadership-ready recommendation.
- How validation works: each lab requires written artefacts and explicit judgement. Strong work links metrics to banking consequences and names risks, caveats, and ownership clearly.

## How to Use This Workbook

- Treat each lab as a decision simulation, not only a modelling exercise.
- Define the business action before you define the metric.
- Keep a short note of assumptions, caveats, and unanswered questions as you work.
- Prefer a justified recommendation over a technically flashy one.
- Write for a mixed audience. Some readers care about metrics; others care about action and governance.
- Complete all required artefacts before attempting stretch artefacts.
- Use the reflection questions at the end of each lab to consolidate your learning.
- Time allocations are a guide. Your facilitator may adjust pacing based on the room.

## Performance Bands

| Band | Description |
|------|-------------|
| **Competent** | Technically coherent, understandable, and usable. Core artefacts are complete and correct. |
| **Strong** | Well-justified, business-linked, and clear about trade-offs. Stretch artefacts are attempted. |
| **Exceptional** | Analytically disciplined, governance-aware, and executive-ready under challenge. Work would support a real leadership conversation. |

---

## Day 1 | Supervised Learning Foundations

### Setup Checklist

- [ ] Jupyter environment running and tested
- [ ] `service_tickets_ml.csv` loaded and readable
- [ ] `model_governance_scenarios.csv` accessible
- [ ] Confirm pandas, scikit-learn, and matplotlib imports work
- [ ] Workbook open alongside the notebook

### Mission Outcome

By the end of Day 1 you should be able to frame a banking ML problem precisely, build a baseline classifier, explain the meaning of key evaluation metrics, and translate model outputs into operational language.

---

### Lab 1 | Problem Framing Workshop

**Scenario:**
The AJB digital banking team has asked your team to explore whether machine learning can help reduce late responses to customer service tickets. Before any modelling begins, you need to define the problem properly.

**Objective:**
- produce a clear, defensible problem framing document for a banking ML use case

**Required artefacts:**
- written problem statement with target variable, prediction unit, and time horizon
- list of candidate input features with justification for each
- one-page risk and assumption register

**Stretch artefacts:**
- stakeholder question list (questions you would ask before building)
- one note on potential data leakage risks
- alternative problem framing with a different target definition

**Core tasks:**
1. State the business decision this model would support
2. Define the target variable precisely (what is being predicted, for which unit, over what horizon)
3. List at least five candidate input features and justify inclusion
4. Identify at least two features that should be excluded and explain why
5. Document three assumptions that must hold for the model to be useful
6. Identify the most important failure mode if the model is wrong
7. State which stakeholder group owns the decision the model supports

**Stretch tasks:**
1. Write three questions you would ask the business owner before building
2. Identify one potential data leakage path and explain why it is dangerous
3. Propose an alternative target definition and explain its trade-offs
4. Describe how you would validate that the training data is representative

**Rubric:**
- Problem definition: target, unit, and horizon are precise and unambiguous
- Feature reasoning: inclusions and exclusions are justified with business logic
- Risk awareness: assumptions and failure modes are explicit, not generic
- Stakeholder fit: the framing connects to a real operational decision

**Reflection:**
- Why is problem framing the highest-leverage step in the ML workflow?
- What happens downstream if the target variable is defined badly?
- Which assumption in your register feels most fragile?

---

### Lab 2 | Baseline Classification Workflow

**Scenario:**
A banking operations team wants early warning on service tickets that are likely to breach SLA. You now have a defined problem and need to build and evaluate a baseline model.

**Objective:**
- build a defensible baseline classification workflow and interpret its outputs in business terms

**Required artefacts:**
- baseline metrics summary (accuracy, precision, recall, F1)
- one confusion matrix with full operational interpretation
- one threshold recommendation with justification

**Stretch artefacts:**
- a second threshold scenario with trade-off comparison
- one note on operational queue impact at each threshold
- cost-benefit estimate for false negatives versus false positives

**Core tasks:**
1. Define the target column and confirm the prediction horizon
2. Split the data into train and test sets with a stated rationale for the split
3. Build a baseline classifier (logistic regression or decision tree)
4. Report accuracy, precision, recall, and F1 on the test set
5. Explain which metric matters most for this use case and why
6. Produce and interpret a confusion matrix in operational language
7. Recommend a decision threshold and explain the trade-off

**Stretch tasks:**
1. Compare two threshold positions and quantify the impact on each error type
2. Estimate how many additional cases operations would need to review at each threshold
3. Explain the cost of false negatives versus false positives in banking terms
4. Suggest one feature engineering idea that could improve the baseline

**Rubric:**
- Problem setup: target, unit, and split logic are explicit and defensible
- Metric logic: chosen metric is linked to a specific business action or risk
- Interpretation quality: confusion matrix is translated into operational meaning, not just numbers
- Threshold reasoning: recommendation considers both precision and recall consequences

**Reflection:**
- Which error type matters most here and why?
- What would make the current metric choice unsafe in production?
- If the model performed perfectly on test data, would you trust it? Why or why not?

---

## Day 2 | Segmentation, Evaluation, and Model Comparison

### Setup Checklist

- [ ] Day 1 baseline work saved and accessible
- [ ] `customer_segments.csv` loaded and readable
- [ ] `service_tickets_ml.csv` still accessible for model comparison work
- [ ] Confirm scikit-learn clustering imports work
- [ ] Review Day 1 reflection notes before starting

### Mission Outcome

By the end of Day 2 you should be able to build a segmentation proposal, evaluate model performance rigorously, compare candidate supervised models fairly, and explain governance trade-offs to a non-technical audience.

---

### Lab 3 | Customer Segmentation Studio

**Scenario:**
AJB retail banking leadership wants to understand whether the existing customer base can be grouped into segments that support differentiated service strategies. You have demographic, transactional, and product-holding data.

**Objective:**
- design an actionable segmentation view for a banking use case

**Required artefacts:**
- segment summary table with descriptive statistics per segment
- one written explanation of feature choice and scaling decisions
- one action recommendation per segment (what the bank should do differently)

**Stretch artefacts:**
- alternative cluster count comparison (e.g. k=3 vs k=5)
- one note on potential misuse or bias in segment-based decisions
- stability analysis showing how segments change with small data perturbations

**Core tasks:**
1. Choose segmentation features from the dataset and justify each choice
2. Explain and apply scaling or normalisation decisions
3. Run K-Means clustering with at least one candidate cluster count
4. Produce a segment summary table with means and counts
5. Describe each segment in business language (who are these customers?)
6. Recommend one differentiated action per segment

**Stretch tasks:**
1. Compare two cluster solutions (e.g. k=3 and k=5) and explain which is more actionable
2. Identify one fairness or bias concern in using these segments for decisioning
3. Test segment stability by re-running with a random subsample
4. Suggest how segments should be refreshed over time

**Rubric:**
- Business usefulness: segments support a realistic, differentiated action
- Analytical discipline: feature and cluster choices are justified, not arbitrary
- Governance awareness: misuse risk is acknowledged explicitly
- Communication quality: segments are described in language a business leader would understand

**Reflection:**
- Which feature contributes most to segment meaning?
- Which segment would be easiest to misinterpret or misuse?
- How would you explain to a regulator why segment-based treatment is fair?

---

### Lab 4 | Model Evaluation Deep-Dive

**Scenario:**
Your Day 1 baseline model for SLA breach prediction is now under review. Before comparing it with alternatives, you need to evaluate its performance thoroughly and understand its failure modes.

**Objective:**
- conduct a rigorous evaluation of a trained classifier, going beyond headline metrics

**Required artefacts:**
- precision-recall curve with annotated operating points
- error analysis table showing categories of misclassification
- one written assessment of where the model fails and why

**Stretch artefacts:**
- ROC curve with AUC interpretation
- calibration analysis (are predicted probabilities reliable?)
- one subgroup performance comparison (does the model perform differently for different ticket types?)

**Core tasks:**
1. Plot a precision-recall curve for the baseline model
2. Identify and annotate at least two meaningful operating points on the curve
3. Categorise false positives and false negatives into error types
4. Write a short assessment of the model's weakest prediction area
5. Explain whether the model's probability outputs are well-calibrated
6. State whether the model is ready for pilot based on evaluation evidence

**Stretch tasks:**
1. Plot a ROC curve and interpret the AUC in business terms
2. Run a calibration check and explain what miscalibration would mean operationally
3. Compare model performance across at least two subgroups in the data
4. Identify one data collection improvement that would address the weakest failure mode

**Rubric:**
- Evaluation depth: analysis goes beyond accuracy to reveal failure patterns
- Error understanding: misclassifications are categorised and explained, not just counted
- Calibration awareness: probability reliability is considered, not assumed
- Pilot readiness: the assessment is honest about what the model can and cannot do

**Reflection:**
- What is the difference between a model that scores well and a model that is ready for production?
- Which error category is most dangerous for AJB and why?
- How would you explain calibration to a non-technical risk manager?

---

### Lab 5 | Model Comparison Review

**Scenario:**
Two candidate models have been trained for the SLA breach prediction task. You need to compare them fairly and make a recommendation that considers performance, governance, and operational factors.

**Objective:**
- compare two candidate models using performance and governance criteria and make a defensible recommendation

**Required artefacts:**
- comparison table with metrics, interpretability, and governance scores
- one final recommendation with supporting reasoning
- one caveat statement listing conditions under which the recommendation could change

**Stretch artefacts:**
- pilot proposal with scope, duration, and success criteria
- monitoring requirement list for the recommended model
- one rollback scenario with trigger conditions

**Core tasks:**
1. Compare two model approaches on the same test set
2. Hold split logic and evaluation criteria constant across both models
3. Evaluate both models on accuracy, precision, recall, and F1
4. Assess interpretability and explainability for each model
5. Explain which model you would recommend and why
6. Defend why the alternative was not chosen, acknowledging its strengths

**Stretch tasks:**
1. Suggest a pilot scope (geography, product line, or ticket type)
2. Define three monitoring metrics that should be tracked after go-live
3. Describe one condition that would trigger rollback to the previous process
4. Explain how you would communicate the recommendation to a sceptical stakeholder

**Rubric:**
- Fair comparison: models are evaluated on equal terms with identical data and criteria
- Recommendation quality: decision is not based on one score alone; trade-offs are visible
- Operating realism: governance, monitoring, and rollback are part of the recommendation
- Communication clarity: the comparison could be presented to a leadership audience

**Reflection:**
- When would the weaker model actually be the better decision?
- What governance question is most likely to be missed in a model comparison?
- How would your recommendation change if interpretability were the top priority?

---

## Day 3 | Deployment, Monitoring, and Executive Communication

### Setup Checklist

- [ ] Day 1 and Day 2 work saved and accessible
- [ ] `model_governance_scenarios.csv` loaded and readable
- [ ] Review your model comparison recommendation from Lab 5
- [ ] Prepare to write executive-facing summaries
- [ ] Confirm you have access to presentation or document tools

### Mission Outcome

By the end of Day 3 you should be able to design a monitoring framework for a deployed model, assess deployment readiness, and prepare a recommendation that would hold up in a leadership conversation.

---

### Lab 6 | Monitoring Design Studio

**Scenario:**
Your recommended model from Day 2 has been approved for a pilot. Before deployment, the governance team requires a monitoring plan that covers performance drift, data quality, and escalation procedures.

**Objective:**
- design a post-deployment monitoring framework for a banking ML model

**Required artefacts:**
- monitoring dashboard specification (what metrics, how often, who reviews)
- drift detection approach with thresholds and response actions
- escalation procedure for performance degradation

**Stretch artefacts:**
- automated alert design with severity levels
- retraining trigger criteria
- quarterly review template for model governance committee

**Core tasks:**
1. Define three to five key monitoring metrics for the deployed model
2. Specify measurement frequency for each metric (real-time, daily, weekly)
3. Set performance thresholds that trigger investigation
4. Design a drift detection approach for input features and predictions
5. Write an escalation procedure: who is notified, what actions follow
6. Define ownership for each monitoring responsibility

**Stretch tasks:**
1. Design automated alerts with severity levels (info, warning, critical)
2. Define criteria that would trigger model retraining
3. Propose a quarterly governance review agenda
4. Explain how monitoring results should be reported to leadership

**Rubric:**
- Coverage: monitoring addresses performance, data quality, and fairness dimensions
- Operability: frequencies, owners, and thresholds are specific, not vague
- Escalation logic: the response to degradation is structured and realistic
- Governance integration: monitoring connects to the bank's existing risk framework

**Reflection:**
- What is the most likely failure mode you would catch through monitoring?
- What failure mode would be hardest to detect?
- How do you balance monitoring cost against risk reduction?

---

### Lab 7 | Deployment Readiness Review

**Scenario:**
The AJB model risk committee has asked you to present a deployment readiness assessment before the pilot begins. You need to consolidate your technical evaluation, monitoring plan, and governance controls into a single coherent review.

**Objective:**
- conduct a structured deployment readiness assessment for a banking ML model

**Required artefacts:**
- deployment readiness checklist (technical, operational, governance)
- risk register with likelihood and impact ratings
- sign-off recommendation (deploy, defer, or reject) with conditions

**Stretch artefacts:**
- phased rollout plan with stage gates
- fallback process documentation
- post-pilot evaluation criteria

**Core tasks:**
1. Complete a technical readiness check (model performance, data pipeline, infrastructure)
2. Complete an operational readiness check (team capacity, process integration, training)
3. Complete a governance readiness check (approvals, documentation, audit trail)
4. Identify and rate the top three deployment risks
5. State your deployment recommendation with explicit conditions
6. Define what success looks like at the end of the pilot

**Stretch tasks:**
1. Design a phased rollout with clear stage gates between phases
2. Document the fallback process if the model is withdrawn
3. Define post-pilot evaluation criteria for scaling the model
4. Identify one organisational dependency that could delay deployment

**Rubric:**
- Completeness: all three readiness dimensions are addressed
- Risk honesty: risks are specific and rated, not generic
- Decision quality: the recommendation is actionable with clear conditions
- Organisational awareness: the assessment considers people and process, not only technology

**Reflection:**
- What is the single biggest risk to a successful pilot?
- Which readiness dimension is most commonly overlooked in practice?
- How would you handle a situation where the model is technically ready but the team is not?

---

### Capstone | AJB Model Recommendation

**Scenario:**
You have been asked to prepare a final recommendation for AJB leadership on whether and how to proceed with the ML-based SLA breach prediction system. This recommendation must integrate your technical analysis, evaluation findings, monitoring plan, and governance assessment from the full module.

**Objective:**
- recommend an ML path for a realistic AJB use case in a format suitable for executive review

**Required artefacts:**
- executive recommendation note (one to two pages)
- model path rationale with alternatives considered
- governance and monitoring section with ownership assignments
- risk summary with mitigations

**Stretch artefacts:**
- pilot plan with timeline, success criteria, and decision points
- escalation logic for failure scenarios during pilot
- one leadership-facing comparison visual or summary table

**Core tasks:**
1. Define the business decision and the objective the model supports
2. Recommend a model family and explain why it was selected over alternatives
3. State the key metric, the target performance level, and the trade-off accepted
4. Identify governance requirements that must be satisfied before deployment
5. Explain how performance will be monitored post-deployment
6. Summarise the risk profile and proposed mitigations
7. State the recommended next step (pilot, defer, or reject) with conditions

**Stretch tasks:**
1. Define pilot scope (geography, product, volume) with a timeline
2. Propose rollback or fallback logic with specific trigger conditions
3. Prepare one leadership-facing visual that summarises the recommendation
4. Write a one-paragraph summary suitable for a board risk committee paper

**Rubric:**
- Clarity: the recommendation is easy to follow without technical translation
- Defensibility: assumptions, limitations, and risks are explicit throughout
- Executive quality: the output could support a real leadership conversation and survive challenge
- Integration: the recommendation draws on work from all three days, not just the capstone

**Reflection:**
- What is the strongest part of your recommendation?
- What would a risk or compliance reviewer challenge first?
- If you had one more week, what additional analysis would strengthen the recommendation?
- How has your thinking about ML deployment changed across the three days?

## Delivery Routes

### Intro Route
- Focus on framing the business decision, target, metrics, and governance trade-offs before chasing model complexity.
- Complete the baseline workflows and core comparison tasks before attempting deeper tuning.
- Use plain language in your written outputs so your reasoning stays easy to challenge and defend.

### Advanced Route
- Complete the core path first, then deepen threshold logic, comparison notes, monitoring plans, and executive recommendation quality.
- Use stretch time to improve judgement and communication, not only technical complexity.
- Bring stronger challenge questions into the debrief so the cohort benefits from your extra depth.

## Virtual Pacing Reminders
- Expect a pause after problem framing and again after evaluation work so metric choices can be checked as a group.
- Protect the capstone recommendation time. It is a core output, not an optional finish.
- If time tightens, finish the required recommendation first and shorten stretch comparisons second.
