# Module 7 | AI in Banking and Finance -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed banking cohort at Al Jazira Bank |
| Duration | 1 day, 4 hours |
| Delivery | Live online, shared screen, chat, pair and team work |
| Slides | 80 (s01 to s80) |
| Labs | Use-case assessment, prompt design, risk assessment, applied case studio, leadership briefing |
| Core arc | From AI landscape in banking to a governed, AJB-specific AI recommendation |
| Prerequisite | Modules 1 through 6 of the AJB AI and Data Training Programme |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` and verify navigation and timer work
- [ ] Confirm the AI use cases dataset and prompt templates dataset are loaded in the notebook
- [ ] Pre-run the prioritisation scoring model from the notebook
- [ ] Have SAMA and SDAIA references at hand for questions
- [ ] Prepare one redacted real-world AI failure case to reference on demand
- [ ] Open a blank leadership briefing template ready to share on screen
- [ ] Review participant names and roles so you can call on specific people
- [ ] Set expectations that this is the capstone: outputs here must be real, not academic

## Delivery Stance

- This is the capstone. Raise the bar. No "we would ideally". Force specific, decision-ready language.
- Treat AI as a governance topic first, a productivity topic second.
- Reward participants who decline to automate or recommend when controls cannot be met.
- Be ruthless on hallucination risk, PII leakage, and autonomous decisions in regulated contexts.
- Reference SAMA, SDAIA, and PDPL by name. Keep the regulatory context live throughout.
- Push every exercise back to AJB-specific context. Abstract recommendations fail the module.
- Close the programme with warmth but specificity. Each participant should leave with one committed next move.

---

# CAPSTONE DAY: AI in Banking and Finance

**Day arc:** Recap the programme. Explore AI use cases in banking. Master prompt engineering. Work the risk framework. Deliver a leadership briefing.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and programme recap | 25 min | s01 to s08 |
| GenAI landscape and banking use cases | 40 min | s09 to s23 |
| Use case assessment activity | 20 min | s24 to s26 |
| Prompt engineering | 35 min | s27 to s38 |
| Prompt design studio | 25 min | s39 to s42 |
| Risk, compliance, responsible AI | 40 min | s43 to s53 |
| Risk assessment activity | 20 min | s54 to s58 |
| Case studio applied work | 35 min | s59 to s66 |
| Leadership communication and strategy | 20 min | s67 to s74 |
| Programme close | 20 min | s75 to s80 |

---

## Slide s01 -- Title slide

**Core message:** This is the capstone. Balanced AI adoption in finance. Not AI enthusiasm.

**Say:**
"Welcome to Module 7. AI in Banking and Finance. This is the capstone of the programme. Read the lede. 'A strategic module on AI use cases in finance, prompting, governance, and balanced adoption in regulated environments.' The word I want you to carry all day is balanced. Not ambitious. Balanced. We finish today with a leadership briefing recommending one AI use case for AJB, with full risk assessment, prompt design, and adoption roadmap. Four hours. Real work. Let us go."

**Show:** Point to the lede.

**Land the point:** "Balanced AI adoption. Not AI enthusiasm. That is the capstone discipline."

---

## Slide s01a -- Balanced AI adoption in finance

**Core message:** Three simultaneous lenses: use cases, guardrails, adoption.

**Say:**
"Three lenses. All three at once. Use cases: start with problems that matter to banking performance, service, or control. Guardrails: keep human review, compliance, and risk visibility explicit from the start. Adoption: recommend the next practical move, not only the most ambitious future state. You have to hold all three simultaneously today. If your recommendation strengthens one lens but ignores another, it will not pass the bar."

**Show:** Walk through the three cards.

**Land the point:** "Use cases, guardrails, adoption. Three lenses. All three at once."

---

## Slide s01b -- Choose your learning route

**Core message:** Two routes. Both end with a decision-ready briefing.

**Say:**
"Two routes. Intro path: stay on the core use-case, prompt, and risk discussion flow with concise written outputs. Advanced path: use stretch time for deeper prompt iteration, richer comparisons, and sharper mitigation language. Same deliverables. Depth differs. Pick now. I will check in after the use case activity."

**Land the point:** "Pick your route. Both end with a decision-ready briefing."

---

## Slide s02 -- Module 7. The Capstone

**Core message:** Four hours of focused, applied work. Balanced judgement. One AJB recommendation.

**Say:**
"Module 7 is the capstone. You pull together the technical, strategic, automation, and communication skills from the previous six modules and apply them to one controlled AI recommendation for AJB. Four hours of focused, applied work. Balanced judgement, not only AI enthusiasm. A final leadership briefing as your programme capstone. Read that. 'Balanced judgement, not only AI enthusiasm.' That line will keep coming back today."

**Show:** Walk through the bullets.

**Land the point:** "Four hours. Real work. One AJB recommendation. Capstone."

---

## Slide s03 -- Programme Journey

**Core message:** Foundation, application, strategy. You have built all three. Now use them together.

**Say:**
"Programme journey. Three waves. Foundation: Module 1 Python for Data, Module 2 Machine Learning Training, Module 3 Neural Networks. Application: Module 4 Business Applications in AI, Module 5 Automation in AI, Module 6 Advanced Data Visualisation. Strategy: Module 7, today, AI in Banking and Finance. Today you turn the full journey into one banking-specific recommendation. Every prior module contributes. Nothing is wasted."

**Show:** Walk through the three cards.

**Land the point:** "Foundation. Application. Strategy. All three feed today."

---

## Slide s04 -- What You Already Know

**Core message:** Every prior module maps to a capstone skill.

**Say:**
"Every prior module maps to a skill you need today. Python for Data: reading evidence, checking data quality, making disciplined analytical claims. Machine Learning Training: judging which AI approaches fit the decision and what metrics matter. Neural Networks: balancing capability against opacity, monitoring burden, governance risk. Business Applications in AI: prioritising opportunities, shaping a business-led recommendation. Automation in AI: defining workflow impact, exception handling, human oversight. Advanced Data Visualisation: presenting the final recommendation in leadership-ready form. Today, all six converge."

**Show:** Walk across the table.

**Land the point:** "All six modules converge today. Every one earns its place."

---

## Slide s05 -- Today's Learning Outcomes

**Core message:** Five outcomes by end of day.

**Say:**
"Five outcomes. Describe credible AI use cases across core banking functions. Apply prompt engineering techniques with banking-specific constraints. Assess AI risk in regulated environments using a structured framework. Draft a leadership briefing that communicates AI value and controls. Recommend a controlled adoption path for one priority use case. Five outcomes. All testable. Every one of them appears in your final briefing."

**Show:** Walk through the numbered list.

**Land the point:** "Five outcomes. All testable. All appear in your briefing."

---

## Slide s06 -- What you will produce and how it is validated

**Core message:** Four outputs. Four validation lenses. The final recommendation must be specific, governed, decision-ready.

**Say:**
"Outputs. Use-case assessment summary. Prompt design and iteration notes. Structured risk assessment. Leadership briefing with a recommended next move. Validation. Checkpoint completion through the module. Workbook and notebook artefacts completed. Peer review of the leadership briefing. Final recommendation that is specific, governed, and decision-ready. That last phrase is the bar. Specific. Governed. Decision-ready. Write it down."

**Show:** Point to both cards.

**Land the point:** "Specific. Governed. Decision-ready. Write it down."

---

## Slide s07 -- Ground Rules for Today

**Core message:** Four ground rules. Every recommendation must pass them.

**Say:**
"Four ground rules. Every recommendation must name its control boundary. No AI adoption suggestion without a human oversight plan. Balanced judgement matters more than enthusiasm. AJB context is mandatory, your analysis should be specific to this bank. Read the last one aloud with me. AJB context is mandatory. Generic AI recommendations fail the module. Name the bank. Name the workflow. Name the control."

**Show:** Walk through the bullets.

**Land the point:** "Four rules. AJB-specific, always. Generic fails."

---

## Slide s08 -- Your Capstone Challenge

**Core message:** By end of day, each team delivers a leadership briefing for one AJB AI use case.

**Say:**
"The capstone challenge. By end of day, each team will deliver a leadership briefing recommending one AI use case for AJB, with full risk assessment, prompt design, and adoption roadmap. Read the last line. 'This is your programme capstone. Make it count.' Treat today like a real commission from AJB leadership. Because this is the deliverable you will present in your career, not just in training. Let us start."

**Land the point:** "Treat today as real work. Make it count."

---

## Slide s09 -- The AI Landscape in Banking (section header)

**Core message:** Where AI is, what has changed, why banking is cautious.

**Say:**
"New section. The AI landscape in banking. Where AI is today, what has changed, why banking is both a prime candidate and a cautious adopter. Prime candidate: high volume, high data richness, strong repeatable workflows. Cautious adopter: regulated environment, high trust requirements, low tolerance for errors. Both at once. That tension shapes everything today."

**Land the point:** "Prime candidate. Cautious adopter. Both at once. Tension shapes everything."

---

## Slide s10 -- AI in Banking. A Brief History

**Core message:** Four eras from rule-based through Generative AI.

**Say:**
"Four eras. 1990s to 2000s: rule-based systems for credit scoring rules and fraud rules. 2000s to 2015: statistical machine learning for risk models and churn prediction. 2015 to 2020: deep learning for document processing and voice banking. 2020 to present: generative AI for assistants, content, code, analysis. Banking has been using AI for 30 years. Generative AI is new. The discipline around it is not."

**Show:** Walk across the table.

**Land the point:** "30 years of AI in banking. Generative is new. The discipline is not."

---

## Slide s11 -- Traditional ML vs Generative AI

**Core message:** Two distinct categories. Know the difference.

**Say:**
"Two categories. Traditional machine learning: learns patterns from structured data, predicts, classifies, scores, requires labelled training data, output is a number or category. Generative AI: generates new content from prompts, summarises, drafts, translates, uses large pretrained models, output is text, code, or media. Different tools. Different problems. Do not confuse them. Do not pick Generative AI for a credit scoring problem."

**Show:** Point to both cards.

**Land the point:** "Two categories. Different tools. Different problems. Do not confuse them."

---

## Slide s12 -- When to Use Which

**Core message:** Six banking tasks mapped to the right approach.

**Say:**
"Table of six tasks. Is this customer likely to default: Traditional ML, not GenAI. Summarise this 50-page contract: GenAI, not Traditional ML. Detect unusual transaction patterns: Traditional ML, GenAI plays a supporting role. Draft a response to a customer complaint: GenAI. Score credit applications: Traditional ML. Search internal policies by meaning: GenAI. Six examples. Pattern: structured prediction goes to Traditional ML. Content generation and semantic search go to GenAI. Simple as that."

**Show:** Walk across the table.

**Land the point:** "Structured prediction goes Traditional ML. Content and semantic go GenAI. Simple."

---

## Slide s13 -- The Global State of AI in Banking

**Core message:** 75 percent of large banks piloting or deploying GenAI. Regulatory uncertainty is the top barrier.

**Say:**
"Global state. Four facts. Over 75 percent of large banks are piloting or deploying GenAI. Most common use cases: customer service, internal knowledge, code assistance. Least common: autonomous credit decisions, unsupervised trading. Key barrier everywhere: regulatory uncertainty and model governance. The pattern is consistent globally. Bank leadership wants AI. Regulators want proof. That is the gap your briefing today helps bridge."

**Show:** Walk through the bullets.

**Land the point:** "75 percent piloting. Regulatory uncertainty is the barrier. Your briefing bridges the gap."

---

## Slide s14 -- AI in MENA and Saudi Banking

**Core message:** Vision 2030 backs AI. SAMA and SDAIA set the rules. AJB must be specific.

**Say:**
"Regional context. Five facts. Saudi Vision 2030 positions AI as a national strategic priority. SAMA has issued guidance on AI governance for financial institutions. SDAIA sets national AI ethics principles. Major Saudi banks are actively investing in AI capabilities. AJB opportunity: apply AI where it strengthens service and compliance. Cite SAMA and SDAIA by name. Your briefing must acknowledge the regulatory frame. Leadership will ask."

**Show:** Walk through the bullets.

**Land the point:** "SAMA. SDAIA. Vision 2030. Cite them. Leadership will ask."

---

## Slide s15 -- Core Banking Functions and AI Potential

**Core message:** Three zones: front, middle, back office. All have AI potential.

**Say:**
"Core banking functions. Three zones. Front office: customer service, wealth advisory, product recommendations, onboarding. Middle office: risk management, compliance, audit, legal review, operations. Back office: document processing, reconciliation, reporting, IT support. All three zones have AI potential. Different risk profiles. Different governance demands. The back office is usually the safest place to start."

**Show:** Walk through the three cards.

**Land the point:** "Three zones. All three have AI potential. Back office is usually safest."

---

## Slide s16 -- Use Case. Customer Service

**Core message:** Most visible, most deployed. Still requires guardrails.

**Say:**
"Customer service. Most visible and most deployed AI use case in banking globally. Four sub-use-cases. Chatbots for routine inquiries: balance, branch info, product details. Complaint summarisation and triage before human review. Voice call summarisation for quality assurance. Response drafting with mandatory human approval. Notice: every one has a human check somewhere in the loop. That is the discipline. Visible does not mean unsupervised."

**Show:** Walk through the bullets.

**Land the point:** "Customer service is deployed everywhere. Still has humans in the loop. Discipline holds."

---

## Slide s17 -- Use Case. Risk and Credit

**Core message:** Traditional ML for scoring. GenAI can draft, never decide.

**Say:**
"Risk and credit. Four sub-use-cases. Credit scoring models: Traditional ML, well-established. Portfolio risk analysis and stress testing support. Early warning systems for loan deterioration. GenAI for credit memo drafting: human-reviewed, never autonomous. Read the quote. 'Credit decisions require explainable models. GenAI can support analysis but must never make autonomous credit judgements.' Hard line. No exceptions. If a team proposes autonomous credit decisions today, hold the line."

**Show:** Read the quote aloud.

**Land the point:** "Credit decisions explainable. GenAI drafts. Humans decide. Hard line."

---

## Slide s18 -- Use Case. Compliance and Regulatory

**Core message:** AML, KYC, regulatory change, sanctions. Every output needs audit trail.

**Say:**
"Compliance. Four sub-use-cases. Transaction monitoring for AML and CFT: Traditional ML. KYC document verification and extraction. Regulatory change detection and impact analysis: GenAI. Sanctions screening enhancement. The rule. Compliance AI must produce audit trails. Every output must be traceable to input data and model version. If you cannot trace it, you cannot use it in compliance."

**Show:** Walk through the bullets.

**Land the point:** "Compliance AI needs audit trails. Traceable or unusable. No middle ground."

---

## Slide s19 -- Use Case. Operations

**Core message:** Document processing and process automation. Often quickest wins.

**Say:**
"Operations. Two card categories. Document processing: classification, routing, data extraction from forms, invoices, correspondence. Often low risk, high volume. Process automation: email triage, ticket classification, report generation. These are often the quickest wins with lowest compliance burden. If someone on your team is new to AI adoption, start here. Low risk. High volume. Fast learning."

**Show:** Point to both cards.

**Land the point:** "Operations. Quickest wins. Start here if you are new to AI at AJB."

---

## Slide s20 -- Use Case. Knowledge Management

**Core message:** Internal search, policy lookup, meeting notes. Advisory outputs with verification.

**Say:**
"Knowledge management. Four sub-use-cases. Internal policy search by meaning, semantic search. Procedure lookup and guidance generation. Training material summarisation. Meeting notes and action item extraction. The rule. Knowledge management AI is low risk when outputs are advisory and staff verify against source documents. Advisory. Not authoritative. Humans check against source. Then it is low risk."

**Show:** Walk through the bullets.

**Land the point:** "Knowledge management. Advisory outputs. Source verification. That is low risk."

---

## Slide s21 -- Use Case. Fraud Detection

**Core message:** Most mature AI application. Two decades of deployment. Real-time and behavioural.

**Say:**
"Fraud detection. Read the lede. 'Fraud detection is the most mature AI application in banking, with over two decades of deployment history.' Four sub-use-cases. Real-time transaction scoring: Traditional ML. Behavioural analytics for account takeover detection. Network analysis for organised fraud rings. GenAI augmenting investigation reports: human-reviewed. Fraud is where AI has the longest track record. If your recommendation is in fraud, cite that history. It strengthens your case."

**Show:** Walk through the bullets.

**Land the point:** "Fraud AI is 20 years in. Cite the history if your case is here."

---

## Slide s22 -- The AI Use Case Spectrum

**Core message:** Four levels: automate, augment, assist, advise. Risk and oversight rise across the spectrum.

**Say:**
"Use case spectrum. Four levels. Automate: low risk, periodic review, email routing. Augment: medium risk, review before action, complaint triage. Assist: high risk, human decides, credit memo draft. Advise: very high risk, human owns fully, risk model input. Notice. As risk rises, human oversight increases. That is the relationship. If your recommendation is 'automate', prove the risk is low. If it is 'advise', the human owns fully. Map your use case to the right level."

**Show:** Walk across the table.

**Land the point:** "Four levels. Risk and oversight rise together. Map your use case to the right level."

---

## Slide s23 -- What Makes Banking Different

**Core message:** Regulated, high stakes, data sensitive, trust dependent, auditable.

**Say:**
"Five traits. Regulated: every AI output in scope of regulatory scrutiny. High stakes: errors can mean financial loss, legal exposure, reputational harm. Data sensitive: customer financial data requires strict handling. Trust dependent: customers expect accuracy and fairness. Auditable: decisions must be explainable and reproducible. Every one of these shapes the controls in your briefing. Not optional. Not nice-to-have. Structural."

**Show:** Walk through the bullets.

**Land the point:** "Five traits. Shape every control. Structural, not optional."

---

## Slide s24 -- Activity. Use Case Assessment

**Do -- read these instructions exactly:**

"Activity. Use case assessment. 15 minutes. In pairs.

Open your notebooks. Load the AI use cases dataset.

1. Identify the top 3 departments with the most use cases.
2. Compare GenAI vs Traditional ML adoption by department.
3. Find all high-risk, high-compliance use cases.
4. Which use cases are still in evaluation? Why might that be?

Click the timer. Go."

**Do:** Start a 15-minute timer. Visit pairs. Push for specific answers, not adjectives.

**Watch for:**
- Answers without numbers. Force numeric backing.
- Hand-waving about 'probably' risk levels. Force data citations.

---

## Slide s25 -- Discussion. Use Case Findings

**Core message:** Four discussion prompts to unpack the activity.

**Say:**
"Discussion. Let us unpack what you found. Four questions. Which departments have the most AI activity? Why? What pattern do you see between AI type and risk rating? Are the right use cases in production versus still in evaluation? What is missing from this dataset that you would want to know? Call on three pairs. Listen for the last question. The answer tells you whether they are thinking critically about the data they are given."

**Do:** Call on 3 pairs. Record one insight from each. Quote one strong answer to the room.

**Land the point:** "Critical thinking includes 'what is missing'. That is the mature habit."

---

## Slide s26 -- Key Takeaway. Use Cases

**Core message:** Start where volume is high, risk is manageable, controls already exist.

**Say:**
"Use case takeaway. Read the quote. 'The most valuable AI use cases in banking are not always the most exciting. Start where volume is high, risk is manageable, and controls already exist.' Internalise this. When AJB leadership asks you 'where should we start with AI', do not pitch the flashy use case. Pitch the one with high volume and existing controls. That is the credible recommendation."

**Show:** Read the quote.

**Land the point:** "High volume. Manageable risk. Existing controls. That is where credible AI starts."

---

## Slide s27 -- Prompt Engineering for Banking (section header)

**Core message:** In banking, prompt design is a governance decision.

**Say:**
"New section. Prompt engineering. Read the lede. 'Prompts are the control interface for generative AI. In banking, prompt design is a governance decision, not just a technical one.' That framing changes everything. A prompt is not a question. It is a control specification. Same as a business process, a control point, or a policy clause. Treat it that way."

**Land the point:** "Prompt is a control specification. Not a question. That framing changes the work."

---

## Slide s28 -- What Is Prompt Engineering?

**Core message:** Designing inputs that produce reliable, controlled, useful outputs.

**Say:**
"Prompt engineering. Practice of designing inputs to AI models that produce reliable, controlled, useful outputs. Three implications. Not 'talking to a chatbot' but designing a control protocol. The prompt defines what the model should do, how, and what it must not do. In banking, prompts are part of the operational control framework. That last bullet is the insight. Your prompt templates are controls. Governance treats them as such."

**Show:** Walk through the bullets.

**Land the point:** "Prompts are controls. Treat them like controls."

---

## Slide s29 -- Why Prompts Matter in Regulated Environments

**Core message:** Without constraints, output is uncontrolled. With constraints, output is auditable.

**Say:**
"Why prompts matter. Two cards. Without constraints: 'Summarise this customer complaint.' Result may include personally identifiable information, opinions, or fabricated details. Uncontrolled output. With constraints: 'Summarise this complaint in under 100 words. Exclude account numbers. Flag severity 1 to 5. Do not suggest resolution.' Controlled. Auditable. Same model. Radically different risk profile. The constraints do the governance work."

**Show:** Point to both cards.

**Land the point:** "Constraints do the governance work. Same model. Different risk profile."

---

## Slide s30 -- The Anatomy of a Banking Prompt

**Core message:** Six parts: role, task, context, constraints, format, guardrails.

**Say:**
"Prompt anatomy. Six parts. Role: define who the model is acting as. Task: state clearly what to do. Context: provide relevant background. Constraints: set boundaries on output. Format: specify output structure. Guardrails: state what must not appear. All six parts. Every production prompt. If a part is missing, you have a gap. Use this checklist every time."

**Show:** Walk down the numbered list.

**Land the point:** "Six parts. Every production prompt. Checklist."

---

## Slide s31 -- Prompt Pattern. Role-Task-Format

**Core message:** Most common pattern. Use the example as a template.

**Say:**
"Pattern one. Role-Task-Format. Read the example. 'You are an AJB compliance analyst. Review the following transaction summary and identify any patterns that may require further investigation under AML guidelines. Output a structured table with: transaction ID, flag reason, severity 1 to 5, and recommended next step. Do not make final determinations.' Notice. Role. Task. Format. And one constraint, 'do not make final determinations'. Four elements. Tight prompt. Use this as a template."

**Show:** Read the quote.

**Land the point:** "Role. Task. Format. Plus constraint. Template for everyday use."

---

## Slide s32 -- Prompt Pattern. Extract-Summarise-Flag

**Core message:** Document processing pattern. Useful for contracts, policies, forms.

**Say:**
"Pattern two. Extract-Summarise-Flag. Used for document processing and review. Read the example. 'Extract the key terms from this contract. Summarise each section in one sentence. Flag any clause that differs from AJB standard terms. Present as a numbered list. Do not provide legal advice or interpretation.' Three verbs: extract, summarise, flag. One format rule. One guardrail. Tight. Copy this pattern."

**Show:** Read the quote.

**Land the point:** "Extract. Summarise. Flag. Format. Guardrail. Tight pattern. Copy it."

---

## Slide s33 -- Prompt Pattern. Classify-Route-Escalate

**Core message:** Triage pattern. Used for email, tickets, customer requests.

**Say:**
"Pattern three. Classify-Route-Escalate. Used for triage and workflow automation. Read the example. 'Classify this customer email into one of these categories: Account Inquiry, Complaint, Service Request, Fraud Report, Other. Assign priority 1 urgent to 3 routine. If classified as Fraud Report or priority 1, mark for immediate escalation. Output: category, priority, escalation flag.' Explicit categories. Explicit priority scale. Explicit escalation rule. Explicit output fields. That is what a production triage prompt looks like."

**Show:** Read the quote.

**Land the point:** "Classify. Route. Escalate. Explicit everything. No ambiguity."

---

## Slide s34 -- Banking-Specific Prompt Constraints

**Core message:** Five constraint types: PII exclusion, decision prohibition, source citation, confidence flagging, length limits.

**Say:**
"Five banking-specific constraint types. PII exclusion: for data protection, 'Do not include account numbers or ID numbers in output'. Decision prohibition: for human oversight, 'Do not approve, reject, or recommend financial products'. Source citation: for auditability, 'Reference the specific policy section for each finding'. Confidence flagging: for uncertainty management, 'Mark any inference with confidence level: high, medium, low'. Length limits: for operational consistency, 'Maximum 200 words per summary'. Five types. Check every prompt against these. Every one."

**Show:** Walk across the table.

**Land the point:** "Five constraint types. Check every prompt. Banking-specific."

---

## Slide s35 -- Common Prompt Failures in Banking

**Core message:** Five common failures to watch for.

**Say:**
"Five common prompt failures. Too vague: 'Analyse this data' produces unfocused, unreliable output. No guardrails: model may fabricate data, cite nonexistent policies, make decisions. Wrong role: asking a model to 'be a financial advisor' creates liability risk. No format specification: inconsistent output breaks downstream workflows. Ignoring edge cases: what should the model do when data is missing or ambiguous? Five failures. Rate every prompt you write against this list."

**Show:** Walk through the bullets.

**Land the point:** "Five failures. Rate every prompt. Especially 'wrong role'. Liability risk."

---

## Slide s36 -- Hallucination and Fabrication

**Core message:** Models predict likely text. They do not know facts. In banking this matters deeply.

**Say:**
"Hallucination. Read the lede. 'Generative AI models can produce confident, well-structured output that is factually wrong.' Four facts. Models do not know facts, they predict likely text sequences. Fabricated policy references, invented statistics, false citations. In banking, a hallucinated compliance reference could cause real harm. Mitigation: constrained prompts, source verification, human review. Mitigation is not optional. Every GenAI deployment in banking needs all three."

**Show:** Walk through the bullets.

**Land the point:** "Models predict text. They do not know facts. Banking mitigations are not optional."

---

## Slide s37 -- Prompt Testing and Iteration

**Core message:** Six-step iteration loop. Document the final prompt.

**Say:**
"Prompt testing. Six steps. Start with a clear, constrained prompt. Test with representative banking data, not toy examples. Review outputs against expected results. Identify failure modes: wrong format, missing constraints, hallucinations. Refine constraints and retest. Document the final prompt as a controlled template. The discipline matters. Prompts that are not tested are not production-ready."

**Show:** Walk down the numbered list.

**Land the point:** "Six-step loop. Real data. Document the final prompt. Or it is not production-ready."

---

## Slide s38 -- Prompt Governance

**Core message:** Prompts must be versioned, reviewed, tested, change-managed, auditable.

**Say:**
"Prompt governance. In a regulated bank, prompts are not informal. Five requirements. Version controlled and documented. Reviewed by the relevant business function. Tested before deployment. Subject to change management processes. Auditable: who approved this prompt, when, for what use case. Apply these to every production prompt. If AJB cannot answer 'who approved this prompt', the prompt is not production-ready."

**Show:** Walk through the bullets.

**Land the point:** "Prompts need governance. Same as any other control. Version. Review. Audit."

---

## Slide s39 -- Activity. Prompt Design Studio

**Do -- read these instructions exactly:**

"Activity. Prompt design studio. 20 minutes. In pairs.

Open the prompt templates dataset. Analyse the existing templates, then design your own.

1. Review the 12 prompt templates and their constraints.
2. Identify which templates have the weakest guardrails.
3. Select one high-risk template and improve it.
4. Write a new prompt template for an AJB use case of your choice.

Click the timer. Go."

**Do:** Start a 20-minute timer. Visit pairs. Insist on guardrails and decision prohibitions. Reject prompts without both.

**Watch for:**
- New prompts without role. Force role addition.
- Prompts without decision prohibitions. Force 'do not decide' clauses.
- Prompts that allow PII. Force exclusion.

---

## Slide s40 -- Prompt Design Checklist

**Core message:** Seven checks before approving any prompt.

**Say:**
"Prompt design checklist. Seven checks. Does the prompt define a specific role? Is the task stated in one clear sentence? Are output constraints explicit, format, length, exclusions? Does it prohibit autonomous decisions? Does it handle missing or ambiguous data? Can the output be verified against source material? Is it testable with realistic banking data? Seven checks. Apply to every prompt you approve. Screenshot this slide."

**Show:** Walk through the bullets.

**Land the point:** "Seven checks. Screenshot. Apply to every prompt you approve."

---

## Slide s41 -- Discussion. Prompt Design Findings

**Core message:** Four debrief questions.

**Say:**
"Discussion. Four questions. Which templates needed the most improvement? Why? What constraints did you add that were missing? How would you test your improved prompt in practice? Who in AJB should approve prompt templates before deployment? That last one is important. If your team cannot name the approver, prompt governance is not real yet."

**Do:** Call on 2 or 3 pairs. Capture names of approval owners.

**Land the point:** "Who approves. If you cannot name them, governance is not real yet."

---

## Slide s42 -- Key Takeaway. Prompts

**Core message:** A prompt is a control specification. Design it like a business process.

**Say:**
"Prompt takeaway. Read the quote. 'In banking, a prompt is not a question. It is a control specification. Design it like you would design a business process: with clear inputs, constraints, outputs, and review points.' That is the mindset. Take it into every prompt you write at AJB."

**Show:** Read the quote.

**Land the point:** "Prompt is a control specification. Design like a business process."

---

## Slide s43 -- Risk, Compliance, and Responsible AI (section header)

**Core message:** Governance first, deployment second.

**Say:**
"New section. Risk, compliance, responsible AI. Read the lede. 'AI in banking operates under regulatory scrutiny. Responsible adoption means governance first, deployment second.' That phrase orders the work. Governance first. Deployment second. Not the other way around. Leadership will sometimes push for the reverse. Hold the line."

**Land the point:** "Governance first. Deployment second. Hold the line."

---

## Slide s44 -- The AI Risk Landscape

**Core message:** Three risk categories: model, operational, compliance.

**Say:**
"Three categories. Model risk: incorrect outputs, hallucinations, drift over time, training data bias. Operational risk: system failures, integration errors, dependency on vendor models. Compliance risk: regulatory violations, data handling breaches, unexplainable decisions. Your risk assessment later today must address all three. Not just one. Teams that focus only on model risk miss the other two."

**Show:** Walk through the three cards.

**Land the point:** "Three risk categories. All three. Not one."

---

## Slide s45 -- Bias and Fairness

**Core message:** AI can perpetuate or amplify bias. Fairness testing is mandatory.

**Say:**
"Bias and fairness. AI models can perpetuate or amplify biases present in training data. Four examples. Credit scoring models may discriminate based on proxies for protected characteristics. Customer service models may perform differently across languages or dialects. Recruitment screening models have shown documented bias in multiple industries. Fairness testing must be part of model validation, not an afterthought. Not optional. Not afterthought. Part of validation. Every AI model."

**Show:** Walk through the bullets.

**Land the point:** "Fairness testing is validation. Not afterthought. Every AI model."

---

## Slide s46 -- Transparency and Explainability

**Core message:** Transparency is 'how'. Explainability is 'why'. Both required.

**Say:**
"Two traits. Transparency: can we describe how the AI system works in clear terms? Do stakeholders know when AI is involved in a decision? Explainability: can we explain why a specific output was produced? Can an auditor trace the reasoning? Can a customer challenge the result? Transparency is the system. Explainability is the decision. Both required. Under SAMA expectations, and under any serious AI governance framework."

**Show:** Point to both cards.

**Land the point:** "Transparency is 'how'. Explainability is 'why'. Both required."

---

## Slide s47 -- The Regulatory Landscape

**Core message:** Five frameworks. Name them. Cite them.

**Say:**
"Regulatory landscape. Five frameworks you must know. SAMA: Saudi financial sector, AI governance, risk management, data protection. SDAIA: Saudi national AI, AI ethics principles, data governance. PDPL: Saudi personal data, data processing, consent, cross-border transfers. EU AI Act: global reference, risk-based classification, high-risk AI requirements. Basel Committee: global banking, model risk management, operational resilience. Five frameworks. Cite the relevant ones in your briefing. Especially SAMA and PDPL for AJB."

**Show:** Walk across the table.

**Land the point:** "Five frameworks. SAMA and PDPL always. Others as relevant."

---

## Slide s48 -- SAMA AI Governance Expectations

**Core message:** Six SAMA-level expectations.

**Say:**
"SAMA expectations. Six. Board-level accountability for AI risk. Clear AI strategy aligned with business objectives. Model risk management framework covering AI systems. Data quality and governance standards. Third-party AI vendor management. Incident reporting for AI-related failures. Read this list back when someone asks 'why is AI governance hard'. Six structural requirements. Each one requires ongoing investment. Not a one-time checklist."

**Show:** Walk through the bullets.

**Land the point:** "Six SAMA expectations. Structural. Ongoing. Not a checklist."

---

## Slide s49 -- Human Oversight Framework

**Core message:** Three levels: in-the-loop, on-the-loop, over-the-loop.

**Say:**
"Human oversight framework. Three levels. Human-in-the-loop: human approves every AI output before action. Banking example: credit memo review. Human-on-the-loop: human monitors AI actions, intervenes on exceptions. Banking example: transaction monitoring alerts. Human-over-the-loop: human sets rules, AI operates within boundaries. Banking example: email classification routing. The right level depends on risk, regulatory requirement, and consequence of error. Name the level in your briefing. Do not say 'with human oversight'. Name the level."

**Show:** Walk across the table.

**Land the point:** "Three levels. Name the level. Not 'with human oversight'. Specific."

---

## Slide s50 -- AI Risk Assessment Framework

**Core message:** Five-step framework: identify, assess, classify, control, review.

**Say:**
"Five-step framework. Identify: what does this AI system do, what decisions does it inform? Assess: what is the risk if it fails, who is affected? Classify: low, medium, high risk based on impact and likelihood. Control: what oversight, testing, monitoring is required? Review: how often should this assessment be repeated? Use this framework in the risk assessment activity. Name each step. Name each outcome. No shortcuts."

**Show:** Walk down the numbered list.

**Land the point:** "Five steps. No shortcuts. Name each. Every AI system."

---

## Slide s51 -- Data Governance for AI

**Core message:** Five data governance demands specific to AI.

**Say:**
"Data governance. Five specific to AI. Training data must be representative and free of prohibited biases. Customer data used in AI must comply with PDPL consent requirements. Data lineage: can you trace every AI input back to its source? Data retention: AI training data has its own lifecycle. Cross-border data: cloud-hosted AI models raise data residency questions. PDPL consent and cross-border residency are the two that catch most banks. Address them in your briefing."

**Show:** Walk through the bullets.

**Land the point:** "Five data demands. PDPL and cross-border catch most banks. Address them."

---

## Slide s52 -- Model Governance

**Core message:** Before and after deployment controls.

**Say:**
"Model governance. Two phases. Before deployment: validation testing, bias assessment, documentation, approval by model risk committee, regulatory notification if required. After deployment: performance monitoring, drift detection, periodic revalidation, incident tracking, decommission criteria. Both phases matter. Post-deployment neglect is a common failure. Drift detection is where real problems show up."

**Show:** Point to both cards.

**Land the point:** "Before and after. Both phases. Post-deployment neglect is the common failure."

---

## Slide s53 -- Third-Party AI Risk

**Core message:** Vendor AI adds five specific risks.

**Say:**
"Third-party AI risk. Most GenAI tools are provided by third-party vendors. Five questions. Where is data processed? Is it retained by the vendor? Can the model change without notice? Model updates, version changes. What SLAs exist for availability and accuracy? What happens if the vendor discontinues the service? Does the vendor relationship meet SAMA outsourcing requirements? Those five questions apply to every vendor AI capability AJB considers. Ask them."

**Show:** Walk through the bullets.

**Land the point:** "Five vendor questions. SAMA outsourcing compliance is the governance anchor."

---

## Slide s54 -- Activity. Risk Assessment Exercise

**Do -- read these instructions exactly:**

"Activity. Risk assessment. 15 minutes. Individual work, then pair discussion.

Select one AI use case from the dataset. Complete a structured risk assessment.

1. Describe the use case and its intended benefit.
2. Identify the top 3 risks: model, operational, compliance.
3. Classify the overall risk level with justification.
4. Recommend the appropriate human oversight level.
5. List the governance controls required before deployment.

Click the timer. Go."

**Do:** Start a 15-minute timer. Circulate. Push on specific controls, not generic phrases.

**Watch for:**
- Risk classifications without justification. Force justification.
- 'Low risk' claims without evidence. Challenge them.
- Generic controls. Force specificity.

---

## Slide s55 -- Discussion. Risk Assessment

**Core message:** Four discussion prompts.

**Say:**
"Discussion. Four questions. Which risks were hardest to assess? Why? Did anyone classify the same use case differently? What drove the difference? What governance controls are non-negotiable regardless of risk level? How would you explain the risk assessment to a non-technical stakeholder? Last question is the test. If your team cannot explain it in plain language, the assessment is not done yet."

**Do:** Call on 3 participants. Capture common disagreements. Surface useful non-negotiable controls.

**Land the point:** "Plain language test. If you cannot explain it, assessment is not done."

---

## Slide s56 -- Responsible AI Principles for AJB

**Core message:** Fair, transparent, accountable.

**Say:**
"Three principles. Fair: AI systems must not discriminate, test for bias across customer segments. Transparent: stakeholders know when AI is used, outputs are explainable. Accountable: every AI system has an owner, every decision has a review path. Three words. Three principles. Carry these into your briefing. If your recommendation fails any of them, redesign."

**Show:** Walk through the three cards.

**Land the point:** "Fair. Transparent. Accountable. Three principles. Redesign if any fail."

---

## Slide s57 -- What 'Responsible' Looks Like in Practice

**Core message:** Five concrete examples of responsible AI in practice.

**Say:**
"What responsible looks like. Five concrete examples. A credit model that has been tested for demographic fairness. A chatbot that discloses it is AI-powered. A compliance tool that logs every query and response. A prompt template that prohibits the model from making recommendations. A quarterly review cycle for all production AI systems. Every example is specific. Observable. Auditable. That is what responsible means in practice, not as a slogan."

**Show:** Walk through the bullets.

**Land the point:** "Responsible is specific and observable. Not a slogan."

---

## Slide s58 -- Key Takeaway. Risk and Governance

**Core message:** Governance is not about saying no. It is about knowing what you are saying yes to.

**Say:**
"Risk takeaway. Read the quote. 'AI governance is not about saying no. It is about knowing exactly what you are saying yes to: what the system does, what it must not do, who is accountable, and how you verify it works.' That line is the clean reframe. Next time a team says 'governance blocks innovation', quote this back. Governance enables yes. It defines yes precisely."

**Show:** Read the quote.

**Land the point:** "Governance enables yes. Defines it precisely. Not 'blocks innovation'."

---

## Slide s59 -- Case Studio. Applied AI Recommendation (section header)

**Core message:** Bring everything together. Select, assess, design, evaluate, recommend.

**Say:**
"Case studio. This is the applied capstone. Read the lede. 'Bring together everything from today. Select a use case, assess it, design prompts, evaluate risk, and recommend an adoption path.' This is where we pressure-test the day's work. Teams of 3 to 4. 30 minutes. Real deliverable. Let us structure it."

**Land the point:** "Applied capstone. 30 minutes. Real deliverable. Treat it that way."

---

## Slide s60 -- Case Studio Brief

**Do -- read these instructions exactly:**

"Case studio brief.

Your team has been asked by AJB leadership to evaluate one AI use case and produce a recommendation.

1. Select one use case from the dataset or propose your own.
2. Complete the use case assessment.
3. Design prompt templates.
4. Conduct risk assessment.
5. Draft a leadership briefing.

30 minutes. Teams of 3 to 4. Click the timer. Go."

**Do:** Start a 30-minute timer. Visit every team. Push for specific numbers, specific risks, specific controls.

**Watch for:**
- Teams selecting vague or over-ambitious use cases. Push toward AJB-specific and feasible.
- Briefings without quantified value. Force quantification.
- Briefings without named human oversight level. Force naming.

---

## Slide s61 -- Use Case Selection Criteria

**Core message:** Five criteria for a strong capstone use case.

**Say:**
"Use case selection criteria. Five. Has clear business value that you can quantify. Is feasible with current or near-term AI capabilities. Has a risk profile you can assess and control. Is relevant to AJB operations today. You can explain it to a non-technical executive in two minutes. All five matter. If your use case fails any of them, pick a different one. Do not try to force a use case that does not fit."

**Show:** Walk through the bullets.

**Land the point:** "Five criteria. All five. Pick again if any fail."

---

## Slide s62 -- Adoption Recommendation Options

**Core message:** Four options: adopt, pilot, defer, reject.

**Say:**
"Adoption recommendation options. Four. Adopt: low risk, proven value, controls in place, move to production with standard governance. Pilot: promising but unproven, manageable risk, controlled test with defined success criteria. Defer: interesting but premature or too risky today, revisit in 6 to 12 months with more data. Reject: unacceptable risk, unclear value, or regulatory concern, not appropriate for AJB at this time. All four are legitimate answers. 'Reject' is a professional answer when it is right. Do not feel pressure to adopt."

**Show:** Walk across the table.

**Land the point:** "Four options. Reject is professional. Do not force adopt."

---

## Slide s63 -- Prioritisation Model

**Core message:** Scoring model informs. It does not decide.

**Say:**
"Prioritisation model. Use the scoring model from your notebook to support your recommendation. Two components. Score components: risk inverted, complexity inverted, current status, estimated value. Equal weights or justify custom weights. Beyond the score: strategic alignment, data readiness, team capability, regulatory posture. The score informs but does not decide. Quote that last phrase. Scores are inputs. Judgment is the decision."

**Show:** Point to both cards.

**Land the point:** "Score informs. Judgment decides. Do not outsource judgment to a spreadsheet."

---

## Slide s64 -- Deliverable. Leadership Briefing

**Core message:** Six sections. Each one tight.

**Say:**
"Deliverable. Leadership briefing. Six sections. Problem statement: what business problem does this solve? AI solution: what type of AI and how it works. Value case: quantified benefit in SAR, time, quality. Risk assessment: top risks and mitigations. Controls: human oversight model and governance. Recommendation: adopt, pilot, defer, or reject with timeline. All six sections. Each one tight. That is the format you will use at AJB, not just in training."

**Show:** Walk down the numbered list.

**Land the point:** "Six sections. Each tight. Same format as real AJB briefings."

---

## Slide s65 -- Peer Review

**Core message:** Five review questions. Exchange. Assess honestly.

**Say:**
"Peer review. Exchange briefings with another team. Review against these questions. Is the business value credible and specific to AJB? Are the risks honestly assessed or underplayed? Is the human oversight model appropriate for the risk level? Would you be confident presenting this to senior leadership? What is the single biggest weakness in this recommendation? Be honest. Sugar-coated reviews do not help anyone. Honest peer review today saves embarrassing meetings tomorrow."

**Show:** Walk through the bullets.

**Land the point:** "Honest reviews today. Saves embarrassing meetings tomorrow."

---

## Slide s66 -- Key Takeaway. Case Studio

**Core message:** A good AI recommendation is specific, not general.

**Say:**
"Case studio takeaway. Read the quote. 'A good AI recommendation is not 'we should use AI'. It is: 'We should use this specific AI capability, for this specific problem, with these specific controls, and here is why the risk is acceptable.'' Four specifics. Capability. Problem. Controls. Risk. If your briefing does not have all four, it is not a recommendation. It is a wish list."

**Show:** Read the quote.

**Land the point:** "Capability. Problem. Controls. Risk. Four specifics. Or it is a wish list."

---

## Slide s67 -- Leadership Communication and AI Strategy (section header)

**Core message:** Clear. Credible. No overselling.

**Say:**
"Final section. Leadership communication and AI strategy. Read the lede. 'How to communicate AI capabilities, limitations, and recommendations to senior stakeholders clearly and credibly.' Clear. Credible. No overselling. That is the bar. Let us cover the pitfalls before you present."

**Land the point:** "Clear. Credible. No overselling. That is the communication bar."

---

## Slide s68 -- What Leaders Need to Hear

**Core message:** Value, risk, decision. Three things. All three.

**Say:**
"Three things leaders need. Value: what problem does this solve? What is the measurable benefit? How does it compare to alternatives? Risk: what can go wrong? What is the regulatory exposure? What controls are in place? Decision: what do you recommend? What is the next step? What resources are needed? All three. If you only deliver two, leadership will ask for the third. Do not make them ask."

**Show:** Walk through the three cards.

**Land the point:** "Value. Risk. Decision. All three. Do not make them ask for the third."

---

## Slide s69 -- Common Communication Mistakes

**Core message:** Five mistakes to avoid.

**Say:**
"Five common communication mistakes. Overpromising: 'AI will transform everything' without specific evidence. Understating risk: glossing over regulatory, operational, or reputational concerns. Too technical: explaining model architecture instead of business outcomes. No ask: presenting information without a clear recommendation or decision request. No timeline: 'we should do this' without when, how long, and what first. Five. You will recognise them in meetings this month. Do not commit them yourself."

**Show:** Walk through the bullets.

**Land the point:** "Five mistakes. You will see them in meetings this month. Do not commit them."

---

## Slide s70 -- The One-Page Briefing Format

**Core message:** Six sections with tight length targets.

**Say:**
"One-page briefing format. Six sections. Problem: business problem in one sentence, 1 to 2 lines. Solution: what AI does and how, 3 to 4 lines. Value: quantified benefit, 2 to 3 lines. Risk: top 3 risks and mitigations, 3 to 4 lines. Controls: oversight model, 2 to 3 lines. Recommendation: action and timeline, 2 to 3 lines. Total: one page. Not two pages. One. Force yourself to cut. If you cannot fit it on one page, you have not found the story yet."

**Show:** Walk across the table.

**Land the point:** "One page. Six sections. If it does not fit, the story is not found."

---

## Slide s71 -- Building an AI Adoption Roadmap

**Core message:** Four quarters. Foundation, quick wins, pilots, scale.

**Say:**
"AI adoption roadmap. Four quarters. Q1 foundation: governance framework, data readiness assessment, team training. Q2 quick wins: low-risk use cases with clear value, email routing, document classification. Q3 pilots: medium-risk use cases with defined success criteria and review gates. Q4 scale: proven pilots to production, begin evaluating next-tier use cases. Order matters. Do not start with pilots. Start with foundation. Do not skip quick wins. They build credibility."

**Show:** Walk down the numbered list.

**Land the point:** "Four quarters. Order matters. Foundation first. Quick wins build credibility."

---

## Slide s72 -- What Not to Do

**Core message:** Six anti-patterns for AI adoption.

**Say:**
"Six things not to do. Do not start with the hardest use case to prove AI works. Do not deploy without governance approval. Do not treat vendor demos as proof of production readiness. Do not skip the data readiness step. Do not assume one model fits all use cases. Do not ignore change management, people must trust and use the tools. Read that last one twice. Change management kills more AI initiatives than technology ever will."

**Show:** Walk through the bullets.

**Land the point:** "Six anti-patterns. Change management kills more initiatives than technology."

---

## Slide s73 -- AI Capability vs AI Readiness

**Core message:** Capability asks 'can AI do this'. Readiness asks 'is the bank ready'. Both required.

**Say:**
"Capability versus readiness. Two cards. Capability: can the AI do this task technically? Is the technology mature enough? Are models available? Readiness: is the bank ready? Do we have the data, governance, skills, and processes to deploy and manage it responsibly? Both must be assessed. Capability without readiness leads to failed projects. Readiness without capability leads to wasted effort. Both. Always."

**Show:** Point to both cards.

**Land the point:** "Capability and readiness. Both. Always. One without the other fails."

---

## Slide s74 -- Key Takeaway. Strategy

**Core message:** Banks that succeed are not fastest. They are clearest.

**Say:**
"Strategy takeaway. Read the quote. 'The banks that succeed with AI are not the ones that adopt fastest. They are the ones that adopt with clarity: clear use cases, honest risk assessment, appropriate controls, and leadership that understands both the value and the boundaries.' Clarity beats speed. Memorise that."

**Show:** Read the quote.

**Land the point:** "Clarity beats speed. Every time. Memorise that line."

---

## Slide s75 -- Programme Close (section header)

**Core message:** Reflect on the full programme. Commit to next steps.

**Say:**
"Programme close. Read the lede. 'Reflecting on the full AJB AI and Data Training Programme and defining your next steps.' We are not done. We are at the point where the training ends and the application begins. Let us close well."

**Land the point:** "Training ends. Application begins. Close well."

---

## Slide s76 -- The Full Programme. What You Have Built

**Core message:** Seven modules. Seven skills. Seven applications.

**Say:**
"What you have built across the programme. Module 1 Python Essentials: programming fundamentals, automate repetitive tasks. Module 2 Data Analysis: data manipulation with pandas, explore and clean banking data. Module 3 Visualisation: charts, dashboards, storytelling, present data insights to stakeholders. Module 4 Machine Learning: supervised and unsupervised ML, build predictive models. Module 5 NLP: text processing and analysis, analyse customer feedback, documents. Module 6 Dashboards: interactive reporting, monitor KPIs and performance. Module 7 AI in Banking: strategic AI assessment, evaluate and recommend AI adoption. Seven modules. Seven applied skills. Look at that list. You have built a real toolkit."

**Show:** Walk across the table.

**Land the point:** "Seven modules. Real toolkit. You built it."

---

## Slide s77 -- Skills You Can Apply Tomorrow

**Core message:** Three scales: individual, team, organisation.

**Say:**
"Skills you can apply tomorrow. Three scales. Individual: use Python for data tasks, write structured prompts, assess AI tools critically before adopting. Team: share analysis with colleagues, build team dashboards, evaluate AI use cases together. Organisation: contribute to AI strategy discussions, support governance processes, champion data-driven decisions. Tomorrow. Not next quarter. Tomorrow. Start small. The capability compounds."

**Show:** Walk through the three cards.

**Land the point:** "Tomorrow. Not next quarter. Start small. Capability compounds."

---

## Slide s78 -- Continuing Your Learning

**Core message:** Six concrete continuation actions.

**Say:**
"Continuing your learning. Six actions. Practice: apply Python and data skills to your daily work. Explore: test AI tools within AJB-approved environments. Share: teach one concept from this programme to a colleague. Read: follow SAMA and SDAIA updates on AI governance. Build: propose a data project or AI pilot for your department. Connect: stay in touch with your programme cohort. Six actions. Pick two to commit to today. Tell the group which two."

**Show:** Walk through the bullets.

**Ask:** "Tell me in chat. Which two are you committing to this week?"

**Land the point:** "Six actions. Pick two. Commit aloud. Accountability."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap the module's learning, outputs, and success markers.

**Say:**
"Three reflections. What you learned: how to assess AI use cases, design prompts carefully, surface risk and oversight needs, make balanced banking recommendations. What you produced: use-case analysis, prompt design work, structured risk assessment, a final leadership briefing for AJB. What proved success: checkpoint completion, workbook and notebook artefacts, peer review, a final briefing that stayed specific, governed, and decision-ready."

**Show:** Point to the three cards.

---

## Slide s80 -- Programme complete

**Core message:** The future is data-informed, AI-augmented, human-governed.

**Say:**
"Programme complete. Read the lede. 'You have completed the AJB AI and Data Training Programme. The next step is not more theory. It is applying these habits to one real banking decision, workflow, or recommendation.' Two cards. Your next move: choose one real problem in your area, define the value, test the data, surface the controls, communicate the recommendation clearly. Carry forward: the future of banking is data-informed, AI-augmented, and human-governed. Strong judgement is what turns skills into responsible action. Read that last line again. 'Strong judgement is what turns skills into responsible action.' That is the whole programme in one sentence. Thank you. Well done. Congratulations."

**Show:** Read both cards.

**Land the point:** "Strong judgement turns skills into responsible action. That is the programme."

---

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Use case described. Prompt template has a role and task. Risks named. Oversight level named. Recommendation stated. |
| **Strong** | Use case specific to AJB with quantified value. Prompt templates include all six anatomy parts. Risks assessed across all three categories. Oversight level matches risk. Recommendation tied to timeline and resources. |
| **Exceptional** | Briefing is decision-ready. Cites SAMA, PDPL, or SDAIA where relevant. Quantified value tied to AJB baseline. Risks honestly assessed, not minimised. Controls named with owners. Recommendation includes failure triggers and rollback. Would pass real leadership review. |

### Rubric Application

- Judge every briefing against the final bar: specific, governed, decision-ready.
- Reward teams that recommend "defer" or "reject" when they prove the case for it.
- Penalise over-enthusiasm. "AI will transform" without evidence is a weak signal.
- Penalise vague oversight. "With human review" is not an answer. Name the level.
- Cite the rubric aloud during peer review.

## Close Standard

End the module by asking each participant to complete this sentence in chat:

> "The first AI use case I will propose, assess, or challenge at AJB in the next 30 days is ..."

Collect all responses. Read 3 or 4 aloud. Applaud the group. End with: "Well done. Go do the real work."

## Mixed-Level Delivery Notes

- **Intro route:** Keep briefings simple. Focus on one solid use case with one solid prompt template and a clear recommendation.
- **Advanced route:** Push for multiple prompt templates, a cross-framework regulatory citation, and a pilot plan with failure triggers.
- **Both routes:** Force AJB specificity. Generic recommendations do not pass the bar.

## Virtual Engagement Checkpoints

- **Opening:** After slide s08, ask each participant to post the one AJB workflow they are most curious about.
- **Mid-session:** After the prompt design studio (s42), require each pair to paste their strongest improved prompt into chat.
- **Close:** After the case studio presentations, require each team to paste their recommendation sentence into chat. Read them back.
