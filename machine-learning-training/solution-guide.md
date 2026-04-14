# Module 2 | Machine Learning Training -- Solution Guide

## Purpose

This guide provides strong answer shapes for each lab in Module 2. It is not a single correct answer key. Use it to calibrate assessment, identify common failure modes, and guide participants who are stuck. All solutions reference AJB banking scenarios and the provided datasets.

---

## Lab 1 | Problem Framing Workshop

### Strong Answer Shape
A strong problem framing document will define the target as a specific, measurable outcome (e.g. "SLA breach within 48 hours of ticket creation," not "poor service"). It will specify the prediction unit (individual ticket) and the decision point (time of ticket creation or triage). The feature list will include 5-7 candidate features drawn from ticket metadata, customer history, and operational context, with explicit justification for each. At least two features will be excluded with clear reasoning (e.g. resolution time excluded because it leaks the outcome). Assumptions about data freshness, label quality, and representativeness will be stated.

### Common Failure Modes
- Target variable is vague or not actionable ("predict customer dissatisfaction")
- No exclusion of leakage-prone features
- Assumptions are generic ("data is clean") rather than specific
- The business decision the model supports is never stated

### Rubric Application
- Competent: target is defined, features are listed, assumptions exist
- Strong: target is precise, features are justified with inclusion and exclusion logic, assumptions are specific
- Exceptional: leakage risks are identified, alternative framings are considered, stakeholder questions are thoughtful

---

## Lab 2 | Baseline Classification Workflow

### Strong Answer Shape
The baseline should use logistic regression or a simple decision tree, not an ensemble or deep model. Train/test split should be 70/30 or 80/20 with a stated rationale; stratification should be used if classes are imbalanced. All four metrics (accuracy, precision, recall, F1) should be reported. The chosen primary metric should be justified with reference to the business cost of errors (e.g. recall matters most because missed SLA breaches damage client relationships). The confusion matrix should be interpreted in operational terms: "Of the 45 predicted negatives, 12 actually breached SLA, meaning 12 tickets received no early intervention." Threshold recommendation should balance precision and recall with a specific trade-off statement.

### Common Failure Modes
- Choosing accuracy as the primary metric on an imbalanced dataset
- Interpreting the confusion matrix as four numbers rather than as an operational story
- Setting the threshold at 0.5 without considering the cost asymmetry
- Reporting metrics without linking any of them to a business consequence

### Rubric Application
- Competent: metrics are reported correctly, confusion matrix is present
- Strong: primary metric is justified, threshold has a trade-off statement, confusion matrix tells an operational story
- Exceptional: two threshold scenarios are compared with queue impact estimates, cost asymmetry is quantified

---

## Lab 3 | Customer Segmentation Studio

### Strong Answer Shape
Feature selection should be justified (e.g. annual value, transaction frequency, product count) and should avoid protected characteristics. Scaling choice should be explained (e.g. StandardScaler because features have different units and ranges). Segment summary table should include means, medians, and counts per cluster. Each segment should have a plain-language name and one differentiated action recommendation. At least one governance note should address how segments could be misused (e.g. low-value segment receiving systematically worse service).

### Common Failure Modes
- Including too many features without justification, diluting segment meaning
- Using raw (unscaled) features and getting segments driven by the highest-magnitude variable
- Naming segments with technical labels ("Cluster 0") instead of business descriptions
- Providing no action recommendation, or providing the same action for every segment

### Rubric Application
- Competent: clusters are produced with basic summary statistics
- Strong: feature and scaling choices are justified, segments have business names and differentiated actions
- Exceptional: alternative cluster counts are compared, governance risks are identified, stability is tested

---

## Lab 4 | Model Evaluation Deep-Dive

### Strong Answer Shape
A precision-recall curve should be plotted with at least two annotated operating points. Error analysis should categorise false positives and false negatives by ticket characteristics (e.g. "most false negatives are low-priority tickets that escalated unexpectedly"). The written assessment should identify the model's weakest area and connect it to a data or feature gap. Calibration should be discussed: "The model assigns 0.7 probability to cases that breach only 55% of the time, suggesting overconfidence."

### Common Failure Modes
- Plotting curves without annotating meaningful operating points
- Treating all errors as equivalent rather than categorising them
- Ignoring calibration entirely
- Declaring the model "ready" based on aggregate metrics without examining subgroup performance

### Rubric Application
- Competent: precision-recall curve is present, errors are counted
- Strong: operating points are annotated, errors are categorised, calibration is discussed
- Exceptional: subgroup analysis is performed, data collection improvements are proposed, assessment is honest about limitations

---

## Lab 5 | Model Comparison Review

### Strong Answer Shape
The comparison table should include performance metrics, interpretability rating, training cost, and governance burden. The recommendation should acknowledge the alternative model's strengths. The caveat statement should list at least two conditions that would change the recommendation. Governance factors (explainability, audit trail, retraining complexity) should be weighted alongside performance.

### Common Failure Modes
- Comparing models on F1 alone and declaring the higher score the winner
- Ignoring interpretability differences between a logistic regression and a random forest
- Writing a caveat statement that is too generic ("results may vary")
- Omitting monitoring and rollback from the recommendation

---

## Lab 6 | Monitoring Design Studio

### Strong Answer Shape
Three to five monitoring metrics should be defined with specific thresholds (e.g. "alert if weekly precision drops below 0.75"). Measurement frequencies should be realistic (not everything needs real-time monitoring). Drift detection should cover both input feature distributions and prediction distributions. Escalation procedure should name roles, not just actions. Ownership should be assigned for each monitoring responsibility.

### Common Failure Modes
- Listing metrics without thresholds or response actions
- Setting all frequencies to "daily" without considering cost or necessity
- No drift detection for input features (only monitoring output metrics)
- Escalation procedure has no named owner

---

## Lab 7 | Deployment Readiness Review

### Strong Answer Shape
The checklist should cover technical, operational, and governance dimensions. Risks should be specific and rated (not "model might fail"). The deployment recommendation should include explicit conditions (e.g. "deploy to pilot if monitoring dashboard is live and operations team has completed training"). Success criteria for the pilot should be measurable.

### Common Failure Modes
- Treating readiness as a purely technical checklist
- Listing risks without rating likelihood or impact
- Recommending deployment unconditionally
- No definition of what pilot success looks like

---

## Capstone | AJB Model Recommendation

### Strong Answer Shape
The executive note should be one to two pages, written for a leadership audience. Model selection rationale should reference the comparison from Lab 5. The governance section should reference the monitoring plan from Lab 6 and readiness assessment from Lab 7. Risk summary should include specific mitigations, not just risk labels. The recommendation should be a clear action (pilot, defer, or reject) with conditions attached.

### Common Failure Modes
- Executive note is too long or too technical for the intended audience
- No reference to earlier lab work (the capstone feels disconnected from Days 1 and 2)
- Risk section is generic ("there are risks with any model")
- No clear next step, or the next step has no conditions

### Rubric Application for Capstone
- Competent: recommendation is present with supporting rationale; governance is mentioned
- Strong: recommendation integrates evaluation, monitoring, and governance; risks are specific; communication is clear
- Exceptional: the recommendation would survive executive challenge; assumptions are explicit; the participant can defend the recommendation verbally
