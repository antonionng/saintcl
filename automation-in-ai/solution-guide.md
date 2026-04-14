# Solution Guide

## Module 5: Automation in AI

Al Jazira Bank | AJB AI and Data Training Programme

---

## Lab A | Workflow Mapping: KYC Document Review

### Strong Answer Shape

A strong KYC workflow map includes all nine steps from submission to notification, with correct sequencing. Decision points are clearly marked at the completeness check (pass/fail) and the senior review (approve/reject). Handoffs between customer portal, operations team, analyst, and senior analyst are labelled. The strongest answers also capture the return loop when documents are incomplete (customer resubmission path) and the escalation path when a sanctions match is detected.

### Common Failure Modes

- Missing the resubmission loop. Teams list steps linearly and forget that incomplete documents create a return path to the customer.
- Omitting the sanctions escalation. The sanctions check is often listed as a single step, but the exception (a positive match) requires immediate compliance escalation and workflow halt. Teams that treat it as a pass/fail without escalation logic are missing a critical path.
- Conflating step types. "Analyst reviews documents" is not one step. It includes completeness check, field extraction, and data comparison. Push teams to decompose.

---

## Lab B | Automation Classification: Loan Processing

### Strong Answer Shape

A strong classification table covers all major steps and assigns the correct automation type with justification. Key correct classifications: application intake (rule-based: form validation), credit score pull (autonomous: API call, no judgment needed), debt-to-income calculation (rule-based: deterministic formula), income verification (AI-assisted: OCR extraction with human confirmation), risk assessment (AI-assisted: model scoring with analyst review), committee approval (must remain manual: accountability and regulatory requirement), offer generation (rule-based: template population from approved terms).

The strongest answers note that risk assessment could evolve from AI-assisted to autonomous in the future, but only after sufficient model validation and regulatory approval. They also identify committee approval as the bottleneck and suggest process improvements (faster scheduling, pre-populated summaries) rather than automation.

### Common Failure Modes

- Classifying committee approval as automatable. This is the most common error. Push back firmly. Ask: "Who signs the approval? Who is accountable if the loan defaults?" Accountability cannot be automated.
- Using "AI" as a classification without specifying AI-assisted vs. autonomous. Force the distinction. Every AI classification must state whether a human reviews the output before it becomes a decision.
- Ignoring the dependency chain. Credit score pull must complete before debt-to-income calculation. Income verification feeds risk assessment. Teams that classify steps independently without noting these dependencies produce a plan that cannot be implemented in sequence.

---

## Lab C | Exception Path Design

### Strong Answer Shape

A strong exception table covers every automated step with at least one specific failure mode. Detection methods are concrete (not "monitor the system" but "alert triggers if OCR confidence score falls below 85%"). Response actions distinguish between halt-and-investigate and flag-and-continue. Escalation paths name a role, not just "escalate." The strongest answers include confidence threshold bands for AI-assisted steps and a cascade analysis showing how an undetected failure in step 3 affects downstream outputs.

### Common Failure Modes

- Vague detection methods. "Monitor for errors" is not a detection method. Push for specifics: what metric, what threshold, what alert mechanism.
- No halt conditions. Some teams design exception paths that always continue processing. Challenge this: "If the sanctions API returns an error instead of a result, should you proceed without the check? What is the regulatory consequence?"
- Missing the cascade. A failure in field extraction (step 4) produces wrong data for the comparison step (step 6) and the risk summary (step 7). Teams that design exceptions per step without considering downstream effects miss the compound risk.

---

## Lab D | Workflow Prioritization from Data

### Strong Answer Shape

A strong prioritization uses multiple data dimensions. The top five candidates should reflect a balance of high manual hours, high error rates, and reasonable automation potential scores. A common strong top five from the dataset: payment reconciliation (highest manual hours), customer onboarding document processing (high error rate), daily transaction reporting (high automation potential, low complexity), internal transfer processing (high volume, rule-based), and credit card dispute intake (moderate hours, high error rate).

The strongest answers use a composite scoring method (e.g., weighted sum of normalized hours, error rate, and potential) rather than sorting by a single column. They also note workflows that rank high on hours but have low automation potential or high complexity and explain why these should be deferred.

### Common Failure Modes

- Sorting by one column only. Teams that rank purely by manual hours miss high-error, moderate-hours workflows that represent greater operational risk.
- Ignoring complexity. A workflow with 40 manual hours per week but "High" complexity may be a poor first candidate compared to one with 25 hours and "Low" complexity.
- Missing regulatory constraints. Some workflows in the dataset have low automation potential despite high hours because they involve regulated decisions. Teams should identify these and explain why they ranked lower.

---

## Lab E | Customer Service Routing Design

### Strong Answer Shape

A strong routing matrix covers all six intent categories across all four channels with differentiated SLAs and specific escalation triggers. AI eligibility is correctly assigned: balance inquiries and transaction status checks are AI-eligible on all channels; complaints and complex product inquiries require human first responders. Escalation triggers are specific: "customer expresses dissatisfaction twice," "resolution time exceeds SLA by 50%," "query involves account security." Fallback for low confidence (below 70%) routes to a human agent with the partial classification attached so the agent has context.

### Common Failure Modes

- Making all intents AI-eligible. Complaints, disputes, and account security issues should not have AI as the first responder. The risk of a poor response is too high, and the regulatory and reputational exposure is significant.
- Generic SLAs. Treating all intents with the same response time target (e.g., "4 hours") misses the point. Balance inquiries should resolve in minutes; complex disputes may take days. Differentiation shows understanding of customer expectations.
- No feedback loop. The strongest designs include a mechanism for learning from misrouted cases (e.g., agents flag incorrect routing, data feeds back to retrain the classifier). Most teams omit this.

---

## Lab F | End-to-End Automation Design Mission

### Strong Answer Shape

The capstone deliverable integrates all previous skills. A strong submission includes: a workflow map with 10+ steps including exception paths; an automation classification table with justified types for every step; an exception handling table with specific detection and response for each automated step; a pilot plan with scope (e.g., "20% of cases for 6 weeks"), at least three success metrics with targets, at least two failure triggers with thresholds, and a rollback plan that describes specific reversion steps; a risk register with five specific risks including named owners and actionable mitigations.

For Scenario A (trade finance), the strongest answers identify document type classification as the primary AI-assisted step, with human review for discrepancies between documents. They note that multi-party workflows add coordination risk and design exception paths for cases where external party documents are delayed or inconsistent.

For Scenario B (audit remediation), the strongest answers identify status tracking and reminder automation as quick wins, evidence collection as an AI-assisted opportunity, and finding closure as a step requiring mandatory human judgment. They note that the backlog of 140 findings across 8 departments creates a prioritization challenge and propose a risk-based triage.

### Common Failure Modes

- Weak risk registers. The most common gap. Teams write generic risks ("technology failure") instead of specific ones ("OCR misreads a document number, causing a sanctions check against the wrong entity").
- Pilot plans without failure triggers. Teams define what success looks like but not what failure looks like. Without failure triggers, there is no mechanism to halt a pilot that is causing harm.
- Presentation without defence. Teams that present a clean proposal but cannot answer critique questions score lower. The ability to respond constructively to "What if X goes wrong?" is a key differentiator between Strong and Exceptional.

---

## Rubric Application Notes

- Competent is the baseline. Every participant who completes the required artefacts with correct structure and at least one valid automation classification, one exception path, and a basic pilot scope earns Competent.
- Strong requires integration and specificity. Classifications are justified. Exceptions are specific and actionable. Pilot plans include measurable metrics and failure triggers.
- Exceptional requires critical thinking and adaptability. The participant connects design choices to operating risk, challenges their own assumptions, proposes alternatives, and responds constructively to critique. Exceptional is rare and should be reserved for work that you would trust in a real pilot proposal.
