# Module 7: AI in Banking and Finance - Solution Guide

## Purpose

This guide provides reference answers, failure mode identification, and rubric application guidance for the four activities in Module 7. Use it to calibrate assessment and to support facilitation when participants ask for examples of strong work.

## Activity 1: Use Case Assessment - Strong Answers

### Summary Table

A strong answer shows department counts and AI type distribution clearly. Expected findings:
- Operations and Customer Service have the most use cases (high volume of repetitive tasks)
- Compliance has significant representation (regulatory burden drives AI investment)
- Traditional ML dominates in risk, fraud, and credit (established, high-stakes use cases)
- GenAI appears more in service, operations, and knowledge management (augmentation tasks)

### High-Risk, High-Compliance Use Cases

A strong answer identifies all use cases where both risk_rating and compliance_impact are High. Expected: Credit Scoring, Transaction Monitoring, Portfolio Risk, Audit Report Drafting, Contract Review, Fraud Detection, KYC Verification, Financial Report Generation. The participant should note that most of these are either in Production (mature, well-governed) or Evaluation (appropriately cautious).

### Interpretation Paragraph

A strong interpretation connects findings to strategy. Example: "The data shows that AJB's AI portfolio is concentrated in operations and compliance, with Traditional ML handling established high-risk processes and GenAI emerging in lower-risk augmentation roles. High-risk use cases still in evaluation represent appropriate caution. The gap between estimated value in high-risk vs low-risk categories suggests that the most valuable use cases are also the hardest to govern, creating a prioritisation tension that leadership must address."

### Failure Modes
- Listing raw counts without interpretation
- Missing the GenAI vs Traditional ML pattern across risk levels
- Not connecting findings to AJB strategy or adoption decisions
- Stating "we should deploy AI everywhere" without nuance

## Activity 2: Prompt Design Studio - Strong Answers

### Weak Template Identification

Strong answers identify templates with vague or missing constraints. Likely weak candidates:
- PT-007 (Meeting Notes): Low risk, but constraints are generic. Missing: confidentiality handling, what to do with sensitive topics discussed
- PT-010 (Product Recommendation): "No direct financial advice" is a start but needs: which regulations apply, what constitutes advice vs information, how to handle inappropriate requests
- PT-012 (Email Triage): Constraints are functional but miss: PII handling in email content, what happens with emails in multiple categories, language handling

### Improved Template Example

Strong improvements add specific, testable constraints. For PT-005 (Credit Memo Drafting):
- Original: "Follow internal memo format; include all required sections; mark assumptions clearly"
- Improved: "Follow AJB credit memo format v3.2 per Credit Policy CP-2024-01; include all 7 required sections (borrower profile, financial analysis, collateral assessment, risk rating rationale, pricing, conditions, recommendation); mark every assumption with [ASSUMPTION] tag; do not state credit approvals or rejections; include disclaimer 'Draft for review only, not a credit decision'; flag data older than 90 days as [STALE DATA]; maximum 2 pages; output confidence rating for each section"

### New Template

A strong new template is specific to AJB, follows the pattern format, includes 5+ constraints, and has explicit guardrails about what the model must not do.

### Failure Modes
- Identifying "weak" templates based on low risk level rather than missing constraints
- Adding vague constraints ("be careful", "follow rules") instead of testable ones
- New template that lacks guardrails or edge case handling
- Confusing prompt patterns (using Role-Task-Format when Extract-Summarise-Flag is more appropriate)

## Activity 3: Risk Assessment - Strong Answers

### Risk Identification

Strong risk identification names specific, plausible failure scenarios rather than generic categories.

Weak: "Model risk is that it might be wrong."
Strong: "Model risk: the credit memo drafting model may hallucinate policy references, citing AJB credit policies that do not exist or misquoting clause numbers. This could lead a reviewer to approve a memo based on fabricated compliance justifications."

### Risk Classification

Strong classification justifies the level with reference to:
- Consequence of failure (financial loss, regulatory penalty, customer harm)
- Likelihood of failure (based on technology maturity and testing)
- Regulatory sensitivity (SAMA expectations for this type of use case)
- Reversibility (can the error be caught and corrected before harm occurs?)

### Human Oversight Rationale

Strong answers compare levels and explain why others were rejected. Example: "Human-in-the-loop is required because credit memo content directly informs lending decisions. Human-on-the-loop would be insufficient because errors in the memo could propagate through the approval chain before being caught. Human-over-the-loop is inappropriate because each memo is unique and requires individual review."

### Governance Controls

Strong before-deployment controls: validation testing with historical memos, bias assessment across customer segments, documentation in model inventory, approval by credit risk committee, regulatory impact assessment.

Strong after-deployment controls: monthly accuracy sampling, quarterly bias review, version control for prompt templates, incident logging and review, annual revalidation.

### Failure Modes
- Generic risks without banking-specific scenarios
- Risk classification without justification
- Selecting human oversight level without considering alternatives
- Governance controls that are not actionable or measurable
- Recommending "Adopt" for a high-risk use case without rigorous controls

## Activity 4: Leadership Briefing - Strong Answers

### Problem Statement

Strong: "AJB's compliance team manually reviews an average of 200 regulatory updates per month, taking approximately 400 hours of analyst time. 15% of relevant changes are identified late, creating compliance gaps."

Weak: "Compliance is hard and takes a long time."

### Value Case

Strong: "Automated regulatory change detection would reduce analyst review time by an estimated 60% (240 hours/month), equivalent to SAR 3.2M annually. More importantly, it would reduce the late-identification rate from 15% to under 3%, materially reducing compliance risk."

Weak: "This would save time and money."

### Risk Assessment

Strong: Names three specific risks with mitigations. Example: "(1) Hallucinated regulation references: mitigated by mandatory human verification of every flagged change against the original SAMA circular. (2) False negatives (missed changes): mitigated by parallel manual review for the first 6 months. (3) Vendor model change: mitigated by contractual SLAs and model version pinning."

Weak: "There are some risks but they can be managed."

### Recommendation

Strong: "Recommend: Pilot. Timeline: 3-month controlled pilot with the AML/CFT regulatory stream. Success criteria: 95% detection rate, less than 5% false positive rate, positive analyst feedback. Gate: Risk committee review at month 3 before expansion."

Weak: "We should use AI for compliance."

### Peer Review Quality

Strong peer review identifies the single biggest gap and suggests a specific improvement. It does not simply praise or summarise.

### Failure Modes
- Problem statement that is vague or not specific to AJB
- Value case without quantification
- Risk section that understates or omits compliance risk
- Recommendation without timeline, success criteria, or gate review
- Briefing that reads as a technical document rather than a leadership communication
- Peer review that is superficial ("looks good")

## Rubric Application Notes

When assessing across all four activities:

- **Band 4** participants produce a leadership briefing that could genuinely be presented to AJB leadership with minimal editing. Their risk assessment references SAMA or PDPL. Their prompts have testable constraints. Their data analysis includes visual evidence.
- **Band 3** participants produce complete, well-structured work that demonstrates real understanding. One or two areas may lack AJB specificity or quantification.
- **Band 2** participants complete all required artefacts but the work is generic rather than AJB-specific. Risk assessments may name categories without specific scenarios. The leadership briefing needs significant revision before use.
- **Band 1** participants have incomplete artefacts or work that does not demonstrate understanding of the material. They may confuse GenAI and Traditional ML, omit risk assessment, or produce a briefing without a clear recommendation.

The capstone nature of this module means assessment should also consider whether participants apply skills from earlier modules (data analysis, visualisation, NLP concepts) in their work. Explicit cross-module connections are a distinction-level signal.
