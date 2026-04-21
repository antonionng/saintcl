# Module 5 | Automation in AI -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed banking cohort at Al Jazira Bank |
| Duration | 2 days, 4 hours per day |
| Delivery | Live online, shared screen, chat, pair and team work |
| Slides | 80 (s01 to s80) |
| Labs | Labs A through D on Day 2, plus two guided walkthroughs and an end-to-end capstone |
| Core arc | From mapping a workflow to designing a governed automation pilot with exception handling and rollback |
| Prerequisite | Module 4: Business Applications in AI, or equivalent familiarity with opportunity framing and governance |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` and verify keyboard navigation works
- [ ] Load the workflow inventory CSV used in Lab A
- [ ] Confirm the Day 2 notebook runs end to end
- [ ] Prepare a redacted AJB workflow example you can reference when a team stalls
- [ ] Test screen share with slides and notebook side by side
- [ ] Open the case studies in an adjacent tab so you can navigate quickly
- [ ] Prepare a short Module 4 bridge reminding the cohort of operating model choices
- [ ] Have the rubric (s77) open for the final critique round

## Delivery Stance

- Treat automation as a governance topic, not a productivity topic.
- Every proposed automation must have a visible exception path, an owner, and a rollback before it is called a pilot.
- Push back firmly against "automate everything" enthusiasm. Force each team to defend what stays manual.
- Reward proposals that decline to automate where the governance bar cannot be met.
- Use the failure cases on Day 2 hard. They are the module's spine.
- Model explicit language. Pilot, scope, trigger, threshold, rollback, circuit breaker. Use these terms precisely and expect participants to follow.
- Keep every lab tied to a real AJB workflow where possible. Abstract exercises weaken the habit.

---

# DAY 1: Foundations

**Day 1 arc:** Map workflows. Classify automation types. Walk through two complete workflows together so participants see the full discipline end to end.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and orientation | 20 min | s01 to s08 |
| Automation landscape | 30 min | s09 to s14 |
| Workflow anatomy and mapping | 20 min | s15 to s16 |
| Loan processing case | 15 min | s17 to s18 |
| AI assistants and chatbots | 15 min | s19 to s20 |
| APIs, data flow, failures, HITL, governance | 25 min | s21 to s25 |
| Concept check | 5 min | s26 |
| Walkthrough 1: KYC | 40 min | s27 to s34 |
| Walkthrough 2: Reconciliation | 35 min | s35 to s40 |
| Design principles and close | 15 min | s41 to s42 |

---

## Slide s01 -- Title slide

**Core message:** Automation in banking is a governance discipline. By the end, you will design a pilot that the bank can actually approve.

**Say:**
"Welcome to Module 5. Automation in AI. Two days. Practical focus. The goal is simple. By the end of tomorrow, you will have designed an automation pilot for a real AJB workflow that includes exception handling, metrics, and a rollback plan. Not a slide deck. A pilot proposal that governance would actually approve. Let us set the tone early. Automation in banking is a governance discipline first and a productivity tool second."

**Show:** Point to the lede.

**Land the point:** "Pilot-ready output. Governance-led thinking. Two days. Let us go."

---

## Slide s01a -- What governed automation looks like

**Core message:** Governed automation has three parts: workflow, control, pilot.

**Say:**
"Here is the map. Governed automation has three parts. Workflow: start with the current-state process, owners, triggers, and bottlenecks. Control: define exception paths, review points, and fallback steps before rollout. Pilot: move toward a realistic first implementation, not a vague future-state aspiration. These three show up in every proposal you write this week. If any of them is missing, the proposal is not ready."

**Show:** Walk through the three cards.

**Ask:** "Of those three, which is most often skipped in your organisation?"

**Land the point:** "Workflow, control, pilot. All three. All week."

---

## Slide s01b -- Choose your learning route

**Core message:** Two routes through the module. Both produce a governed pilot proposal.

**Say:**
"Two routes. If you are newer to automation design, stay on the intro path. Focus on one clear governed workflow design with visible human review and fallback points. If you are more experienced, use the stretch prompts for threshold logic, wider automation scope, and stronger sequencing. Same deliverables. Depth differs."

**Show:** Point to both cards.

**Land the point:** "Pick your route now. I will check in after Walkthrough 1."

---

## Slide s02 -- Why automation matters now

**Core message:** Banking operations carry thousands of repetitive tasks. AI-assisted automation reduces cycle time only when design, governance, and fallback are explicit.

**Say:**
"Banking operations carry thousands of repetitive, rule-heavy tasks every week. Application checks, reconciliation, document review, routing, reporting. AI-assisted automation can reduce cycle time and error rates significantly. But only when design, governance, and fallback paths are explicit from day one. Not as an afterthought. Day one. That is the habit we are going to build."

**Land the point:** "Governance from day one. Not after go-live. Day one."

---

## Slide s03 -- What you will be able to do

**Core message:** Four concrete outcomes by the end of the module.

**Say:**
"Four outcomes. Map a banking workflow from trigger to completion. Classify automation opportunities by type and risk. Design exception paths and human-in-the-loop checkpoints. And build a governed pilot plan with measurable success criteria. All four are testable. They ladder into the capstone."

**Show:** Walk through the four numbered outcomes.

**Land the point:** "Four outcomes. Each one feeds the capstone."

---

## Slide s04 -- Module schedule

**Core message:** Day 1 is foundations and walkthroughs. Day 2 is hands-on labs and the capstone.

**Say:**
"Two-day structure. Day 1 is foundations. Workflow mapping, automation types, decision frameworks, and two guided walkthroughs. Day 2 is application. Exception handling, pilot planning, metrics, case critiques, and your end-to-end automation design mission. Day 1 builds the vocabulary. Day 2 forces you to use it."

**Show:** Point to both cards.

**Land the point:** "Vocabulary on Day 1. Application on Day 2."

---

## Slide s05 -- What you will produce

**Core message:** Four artefacts from the module.

**Say:**
"Four artefacts. A mapped banking workflow with decision points and handoffs. An automation classification with justified choices. Exception and human-review design. A pilot plan and a rollout recommendation. These are your deliverables. We will build them up piece by piece across both days."

**Show:** Walk down the bullet list.

**Land the point:** "Four artefacts. You will produce all of them."

---

## Slide s06 -- How your work is assessed

**Core message:** Three bands. Aim for strong or exceptional.

**Say:**
"How the work is assessed. Competent: maps workflow steps accurately, identifies at least one automation point with a named review step. Strong: classifies automation types, designs exception paths, proposes a pilot with metrics. Exceptional: connects automation design to operating risk, defines rollback triggers, critiques trade-offs with evidence. Aim for strong or exceptional. I will quote this rubric in the debriefs."

**Show:** Walk through the three cards.

**Land the point:** "Three bands. Strong or exceptional. Do not settle for competent."

---

## Slide s07 -- Automation at AJB today

**Core message:** AJB already runs rule-based automation. This module extends it into AI-assisted and augmented operations.

**Say:**
"Quick grounding. Al Jazira Bank already uses rule-based automation in payments processing and account opening checks. That is the foundation we are building on. This module extends that foundation into AI-assisted and AI-augmented automation, where outputs require judgment and oversight. It is not a rip-and-replace exercise. It is a capability extension."

**Land the point:** "Extend the existing foundation. Do not replace it."

---

## Slide s08 -- Key terms for this module

**Core message:** Five terms to anchor shared vocabulary.

**Say:**
"Five terms you will hear me use precisely all week. Workflow: a sequence of steps that transforms an input into a defined output. Automation candidate: a step or set of steps suitable for partial or full automation. Exception path: the route a process takes when normal conditions are not met. Human-in-the-loop: a design pattern where a human reviews, approves, or overrides an automated decision. Pilot: a controlled, limited rollout to validate performance before scaling. When I say 'pilot', I do not mean 'experiment'. I mean a controlled, limited rollout. Precision matters."

**Show:** Walk through the table rows.

**Land the point:** "Five terms. Use them precisely. I will."

---

## Slide s09 -- The automation landscape (section header)

**Core message:** Automation is a spectrum. The right tool depends on the step.

**Say:**
"New section. Automation exists on a spectrum. Understanding where each type sits helps you choose the right approach for each workflow step. One size does not fit all. A single workflow may have multiple types of automation at different steps. Keep that in mind."

**Land the point:** "Spectrum, not single tool. Different steps, different approaches."

---

## Slide s10 -- From manual to autonomous

**Core message:** Four levels: manual, rule-based, AI-assisted, autonomous. Each has banking examples.

**Say:**
"Four levels. Manual: human performs every step. Example: a relationship manager compiling a portfolio review by hand. Rule-based: fixed logic executes predefined steps. Example: auto-reject loan if income-to-debt ratio exceeds threshold. AI-assisted: AI suggests, human decides. Example: AI drafts a KYC summary, analyst reviews and approves. Autonomous: AI decides and executes without human review. Example: fraud scoring blocks a transaction in real time. Four levels. Know which one you are proposing when you write your pilot."

**Show:** Walk across the table.

**Ask:** "Name an AJB process at each level. Can you?"

**Land the point:** "Manual, rule-based, AI-assisted, autonomous. Four levels. Name the one you mean."

---

## Slide s11 -- Rule-based automation

**Core message:** Rule-based is reliable and auditable. Brittle when inputs vary.

**Say:**
"Rule-based automation. Deterministic logic. If a condition is met, an action fires. Reliable, auditable, fast. But brittle when inputs vary or rules conflict. Best for high-volume, stable-logic tasks: payment routing, threshold alerts. Weakness: cannot handle ambiguity or novel inputs. Governance: rule changes require version control and approval workflows. Do not underestimate rule-based. It is boring and it works. For many banking tasks, it is the right answer, not a lesser one."

**Show:** Walk through the bullets.

**Land the point:** "Boring and works. That is rule-based. Do not dismiss it."

---

## Slide s12 -- AI-assisted automation

**Core message:** AI-assisted blends model output with human decision. Requires calibration and monitoring.

**Say:**
"AI-assisted automation. Machine learning or language models generate recommendations, classifications, or drafts. A human remains in the loop for final decisions. Best for tasks with unstructured inputs: document review, email triage. Weakness: model confidence varies, requires calibration and monitoring. Governance: output review, confidence thresholds, and audit logging. This is the sweet spot for most banking AI you will design this year. Useful. Governable."

**Show:** Walk through the bullets.

**Land the point:** "AI-assisted is the sweet spot. Useful plus governable."

---

## Slide s13 -- Fully autonomous automation

**Core message:** Autonomous fits where errors are cheap, reversible, or speed is essential. Governance bar is highest.

**Say:**
"Fully autonomous automation. No human in the decision loop. Appropriate only when the cost of errors is low, reversibility is built in, or speed requirements make human review impractical. Best for: real-time fraud scoring, automated reconciliation matching. Weakness: errors propagate silently if monitoring is insufficient. Governance: circuit breakers, anomaly alerts, and regular model audits. The governance bar here is the highest. Autonomous is not a reward for a mature model. It is a risk decision."

**Show:** Walk through the bullets.

**Land the point:** "Autonomous is a risk decision. Not a trophy for a good model."

---

## Slide s14 -- Decision framework. Which level fits?

**Core message:** Four factors: input variability, error cost, decision speed, regulatory scrutiny.

**Say:**
"Four factors decide which level fits a step. Input variability: low favours rule-based, high favours AI-assisted, predictable patterns may allow autonomous. Error cost: any cost tolerated by rule-based, medium cost manageable by AI-assisted, only low or reversible cost acceptable for autonomous. Decision speed: batch is fine for rule-based, batch or near-real-time for AI-assisted, real-time mandatory for autonomous. Regulatory scrutiny: moderate for rule-based, high for AI-assisted because explainability is needed, very high for autonomous because audit trails are critical. Use this table to justify every classification you make."

**Show:** Walk across the table.

**Land the point:** "Four factors. Cite them when you classify a step."

---

## Slide s15 -- Anatomy of a bankable workflow

**Core message:** Six parts: trigger, input, steps, exception, output, feedback.

**Say:**
"Every bankable workflow has six parts. Trigger: what starts the process, customer request, scheduled batch, event signal. Input: what data or documents enter. Steps: what transformations, checks, or decisions occur. Exception: what happens when a step fails or produces ambiguous output. Output: what is delivered, to whom, in what format. Feedback: how does the process learn from outcomes. Six parts. If your workflow map is missing any of them, it is incomplete. Especially exception and feedback. Those are usually the missing ones."

**Show:** Walk down the numbered list.

**Land the point:** "Six parts. Exception and feedback are the usual misses. Do not skip them."

---

## Slide s16 -- Workflow mapping. Practical notation

**Core message:** Simple notation. Rectangle for steps. Diamond for decisions. Oval for start or end. Arrows for flow. Dashed box for exceptions.

**Say:**
"You do not need formal BPMN for this module. A simple notation is enough. Rectangle: a process step. Diamond: a decision point, yes or no, branching logic. Oval: start or end. Arrow: direction of flow, labelled with conditions where applicable. Dashed box: an exception or fallback path. Use these symbols consistently. Clarity beats formality every time. If a peer cannot read your map, the map has failed its job."

**Show:** Walk down the bullet list.

**Land the point:** "Simple notation. Consistent use. Readable by a peer."

---

## Slide s17 -- Case study. Personal loan processing

**Core message:** A customer applies online. 14 steps. 3.2 days. Some steps are judgment, some are fixed rules.

**Say:**
"Case study. A customer applies for a personal loan online. The current workflow has 14 steps and takes an average of 3.2 days. Manual steps include income verification, document review, and credit committee approval. Read the blockquote. 'Which of these 14 steps involve judgment, and which follow fixed rules?' That is the first question you ask when you look at a workflow. Separating judgment from rules is the first automation decision."

**Show:** Read the quote aloud.

**Land the point:** "Judgment versus rules. Separate them first. Everything else follows."

---

## Slide s18 -- Loan processing. Step breakdown

**Core message:** Each step has a type and an automation potential level.

**Say:**
"Here is the step breakdown. Application intake: data capture, high automation potential via form validation and OCR. Income verification: document review, medium via AI extraction plus human check. Credit score pull: API call, high, fully automated. Debt-to-income calculation: rule-based, high, deterministic formula. Risk assessment: judgment, medium, AI-assisted scoring. Committee approval: decision, low, human review required. Offer generation: template, high, auto-populate terms. Look across the table. Different steps, different levels. That is what a real workflow looks like."

**Show:** Walk across the table.

**Land the point:** "Different steps, different levels. That is the normal case. Not uniformity."

---

## Slide s19 -- AI assistants and chatbots in banking

**Core message:** Chatbots require strict guardrails. Scope, escalation, data sensitivity, tone.

**Say:**
"AI assistants handle customer-facing interactions. Answering questions, routing requests, collecting information. Chatbot design in banking requires strict guardrails. Four guardrails. Scope limitation: the assistant must know what it cannot answer. Escalation paths: when should the bot hand off to a human agent. Data sensitivity: the bot must never expose account details without authentication. Tone and compliance: responses must align with regulatory and brand standards. A chatbot without all four is a liability."

**Show:** Walk through the bullets.

**Land the point:** "Four guardrails. Every chatbot. No exceptions."

---

## Slide s20 -- Designing a governed chatbot

**Core message:** Three design components: intent recognition, response generation, escalation logic.

**Say:**
"Three design components. Intent recognition: classify what the customer wants, use confidence thresholds to route low-confidence intents to humans. Response generation: use approved templates for regulated topics, allow AI-generated responses only for informational queries. Escalation logic: define triggers, failed authentication, complaint keywords, repeated misunderstanding, or customer request. Design all three before you build. Do not build first."

**Show:** Walk through the three cards.

**Land the point:** "Intent, response, escalation. Design all three. Build second."

---

## Slide s21 -- API integration patterns

**Core message:** Four patterns: request-response, event-driven, batch, webhook.

**Say:**
"Four common API integration patterns you will see. Request-response: synchronous calls for real-time data like credit checks and balance inquiries. Event-driven: asynchronous processing triggered by system events like new account or transaction alert. Batch processing: scheduled bulk operations like end-of-day reconciliation and report generation. Webhook: external systems push updates to your workflow, like payment gateway notifications. Know these four. Match the pattern to the workflow's timing needs."

**Show:** Walk through the bullets.

**Land the point:** "Four patterns. Match the pattern to timing needs."

---

## Slide s22 -- Data flow in automated workflows

**Core message:** Map data flow explicitly. Five questions expose bottlenecks, risks, and failure points.

**Say:**
"Every automated workflow moves data between systems. Map the data flow explicitly. Five questions. What data enters the workflow? Defines input validation. Where is data transformed? Identifies processing dependencies. Who can access the data at each step? Determines access control and audit needs. Where is data stored? Affects compliance and retention. What happens to data after the workflow ends? Defines cleanup and archival rules. Answer all five. If you cannot, the workflow has hidden risks."

**Show:** Walk across the table.

**Land the point:** "Five questions. Answer all five. Hidden risks live in the unanswered ones."

---

## Slide s23 -- Common automation failures

**Core message:** Three failure modes: over-automation, missing exceptions, ungoverned rollout.

**Say:**
"Three failure modes. Over-automation: automating steps that require judgment, the system makes decisions nobody reviewed, errors compound silently. Missing exceptions: designing only the happy path, when unexpected inputs arrive the workflow stalls or produces wrong outputs. Ungoverned rollout: deploying automation without metrics, monitoring, or rollback plans, problems surface only after damage is done. Every automation failure you will ever read about falls into one of these three."

**Show:** Walk through the three cards.

**Land the point:** "Over, missing, ungoverned. Three failure modes. Avoid all three."

---

## Slide s24 -- Human-in-the-loop design

**Core message:** HITL is not one pattern. It is four: pre-action review, post-action audit, exception handling, override.

**Say:**
"Human-in-the-loop is not a single pattern. It is a design decision about where, when, and how humans interact. Four variants. Pre-action review: human approves before the system acts, for loan approvals and large transactions. Post-action audit: system acts, human reviews a sample afterward, for transaction monitoring. Exception handling: human intervenes only when the system cannot proceed, for edge cases and low confidence. Override capability: human can reverse or modify an automated decision at any time. Pick the variant deliberately. Do not leave it vague."

**Show:** Walk through the bullet list.

**Land the point:** "Four HITL variants. Pick deliberately. Do not leave 'human review' vague."

---

## Slide s25 -- Governance and monitoring

**Core message:** Five non-negotiables: owner, monitoring dashboard, alerts, scheduled reviews, change management.

**Say:**
"Automation without governance is a liability. Every automated workflow needs five things. An owner accountable for performance and compliance. Monitoring dashboards tracking throughput, error rates, and exception volumes. Alerting rules that trigger investigation when metrics breach thresholds. Scheduled reviews to assess whether assumptions still hold. Change management processes for updating rules, models, or thresholds. These five are not options. They are the minimum bar."

**Show:** Walk down the numbered list.

**Land the point:** "Five non-negotiables. Every automation. Every time."

---

## Slide s26 -- Concept check

**Do -- read these instructions exactly:**

"Pause. Four questions. Answer in chat or out loud.

1. Name a banking task best suited for rule-based automation and explain why.
2. Name a banking task that should stay AI-assisted, not autonomous, and explain the risk of removing human review.
3. What is the difference between pre-action review and post-action audit?
4. Why is an exception path more important than the happy path in automation design?

Take 2 minutes. Go."

**Do:** Run a 2-minute checkpoint. Call on specific participants. Revisit any slide where the room stumbles.

**Land the point:** "Good. Vocabulary locked. Now we walk through real workflows."

---

## Slide s27 -- Guided walkthrough. Workflow mapping and design (section header)

**Core message:** Two complete walkthroughs today. Watch the discipline end to end.

**Say:**
"New section. We are going to walk through two complete workflows together. KYC document review and daily transaction reconciliation. You will see the full discipline end to end. Observe carefully. Tomorrow you will do this yourselves."

**Land the point:** "Two walkthroughs. Watch the discipline. Tomorrow you do it."

---

## Slide s28 -- Walkthrough 1. KYC document review

**Core message:** KYC review. Around 200 cases per week. 48-hour turnaround. Real candidate for AI-assisted automation.

**Say:**
"Walkthrough 1. KYC document review. Know Your Customer is a core compliance process. Analysts verify identity documents, check sanctions lists, assess risk profiles. Current process at AJB: approximately 200 cases per week with an average turnaround of 48 hours. A real candidate for AI-assisted automation. Let us look at the current steps first, then classify them, then design exceptions, then define metrics."

**Land the point:** "Real process. Real volume. Real turnaround pressure. Let us map it."

---

## Slide s29 -- KYC review. Current workflow steps

**Core message:** Nine steps from submission to notification.

**Say:**
"The current workflow. Nine steps. Customer submits identity documents through the portal. Operations team logs the submission and assigns it to an analyst. Analyst opens each document and checks for completeness. Analyst extracts key fields: name, ID number, date of birth, address. System runs a sanctions and PEP check. Analyst compares extracted data against application form entries. Analyst writes a risk assessment summary. Senior analyst reviews and approves or rejects. System sends the outcome notification to the customer. Nine steps. Now we ask which are judgment and which are fixed rules."

**Show:** Walk down the numbered list.

**Land the point:** "Nine steps. Map before you classify. Every time."

---

## Slide s30 -- KYC review. Classifying each step

**Core message:** Each step gets a classification: current method, automation candidate, type.

**Say:**
"Classification. Look at the table. Document submission: already digital, not applicable. Assignment: manual queue, yes, rule-based. Completeness check: manual, yes, AI-assisted via document classification. Field extraction: manual, yes, AI-assisted via OCR and NLP. Sanctions check: already automated API, rule-based. Data comparison: manual, yes, rule-based plus AI-assisted. Risk summary: manual, partial automation, AI-assisted draft with human review. Senior review: manual, no automation, human-in-the-loop required. Notification: semi-automated, yes, rule-based template. Every step gets an honest classification. No hand-waving."

**Show:** Walk across the table.

**Land the point:** "Honest classification per step. No hand-waving."

---

## Slide s31 -- KYC review. Exception paths

**Core message:** Five specific exception paths. No workflow without them.

**Say:**
"Exception paths. Five named scenarios. Incomplete documents: system flags missing items, sends request back to customer, workflow pauses until resubmission. Sanctions match: immediate escalation to compliance team, workflow halts, no automated progression allowed. Low OCR confidence: field extraction below 85 percent confidence, route to manual extraction. Data mismatch: extracted fields do not match application data, flag for analyst review with highlighted discrepancies. System downtime: if sanctions API is unavailable, queue the case and alert operations, do not skip the check. Five scenarios. Each one named. Each one has a defined action. That is what exception design looks like."

**Show:** Walk through the bullets.

**Land the point:** "Five named scenarios. Defined actions. That is exception design."

---

## Slide s32 -- KYC review. Automation design summary

**Core message:** Clear split between automate and keep manual.

**Say:**
"The automation design summary. On the automate side: queue assignment via round-robin, completeness check via document classifier, field extraction via OCR with confidence scoring, data comparison via rule-based matching, notification via template-based email. On the keep manual side: risk summary with AI draft and analyst review, senior approval because human judgment is required, sanctions escalation because compliance team only, and any case below confidence thresholds. Notice how specific that is. Not 'automate some things'. A clear split."

**Show:** Point to both cards.

**Land the point:** "Clear split. Not 'automate some things'. Exact steps, exact reasoning."

---

## Slide s33 -- KYC review. Pilot metrics

**Core message:** Five metrics, each with baseline, target, alert threshold.

**Say:**
"Pilot metrics. Five of them. Average turnaround time: baseline 48 hours, target 24, alert if above 36. Manual extraction rate: baseline 100 percent, target below 25, alert if above 40. OCR accuracy sampled: target above 92, alert if below 88. Exception escalation rate: baseline 12 percent, target below 15, alert if above 20. Customer resubmission rate: baseline 18 percent, target below 12, alert if above 18. Look at the discipline. Each metric has baseline, target, alert. That is what a pilot metric table looks like."

**Show:** Walk across the table.

**Land the point:** "Baseline, target, alert. Every metric. Every time."

---

## Slide s34 -- KYC walkthrough. Reflection

**Do -- read these instructions exactly:**

"Reflection. 5 minutes. Discuss in pairs.

1. What is the highest-risk automation step in this workflow? Why?
2. If OCR accuracy drops below 88 percent, what should happen immediately?
3. How would you phase the rollout: which step would you automate first?

Come back with your best answer to each. Go."

**Do:** Run a 5-minute reflection. Capture 2 strong answers for each question. Reward specific phasing plans.

**Land the point:** "Phasing is judgment. Start with lowest-risk, highest-value steps."

---

## Slide s35 -- Walkthrough 2. Daily transaction reconciliation

**Core message:** 15,000 transactions per day. 2.3 percent mismatch rate. Strong reconciliation candidate.

**Say:**
"Walkthrough 2. Daily transaction reconciliation. AJB reconciles transactions between core banking, payment gateway, and card processor. The team manually investigates mismatches. Current volume: approximately 15,000 transactions per day with a 2.3 percent mismatch rate. That is around 345 manual investigations per day. Huge automation target if we can do it safely."

**Land the point:** "15,000 per day. 345 manual investigations. Clear target. Let us map."

---

## Slide s36 -- Reconciliation. Current workflow

**Core message:** Eight steps from extraction to supervisor sign-off.

**Say:**
"Current workflow. Eight steps. Extract transaction records from core banking, payment gateway, and card processor. Load records into a reconciliation spreadsheet. Match transactions by reference number, amount, and date. Flag unmatched records as exceptions. Analyst investigates each exception manually. Analyst classifies the exception: timing difference, duplicate, genuine error. Analyst resolves or escalates. Supervisor reviews and signs off on the daily report. Eight steps. Some are pure automation candidates. Others are judgment."

**Show:** Walk down the numbered list.

**Land the point:** "Eight steps. Mix of automation and judgment."

---

## Slide s37 -- Reconciliation. Automation opportunities

**Core message:** Clear split between high-potential automation and judgment-required steps.

**Say:**
"Automation opportunities split cleanly. High potential: data extraction via automated feeds, record matching via deterministic logic, timing-difference classification via rule-based auto-resolve if matched within T+1, and report generation via templated output. Requires judgment: genuine error investigation because it is context-dependent, duplicate detection in ambiguous cases via fuzzy matching plus analyst review, escalation decisions via materiality thresholds, and final sign-off because supervisor accountability. Notice the pattern. Mechanical work goes to automation. Judgment stays human. That is the safe split."

**Show:** Point to both cards.

**Land the point:** "Mechanical to automation. Judgment to human. Safe split."

---

## Slide s38 -- Reconciliation. Exception design

**Core message:** Four specific exception scenarios with defined actions.

**Say:**
"Four exception scenarios. Data feed failure: if any source system feed is missing or incomplete, halt reconciliation and alert operations, do not run partial matching. Spike in mismatch rate: if daily mismatch rate exceeds 5 percent, trigger manual review of matching logic before auto-resolving. Large-value mismatch: any mismatch above 50,000 Saudi Riyal requires immediate manual investigation regardless of category. Duplicate transaction: flag both records, prevent auto-resolution, analyst must confirm which record is correct. Four scenarios. Each one a clear instruction. No ambiguity."

**Show:** Walk through the bullets.

**Land the point:** "Four scenarios. Clear instructions. No ambiguity."

---

## Slide s39 -- Reconciliation. Success metrics

**Core message:** Five metrics spanning throughput, quality, and response time.

**Say:**
"Success metrics. Auto-match rate: baseline 0 percent, target above 85. Time to complete daily reconciliation: baseline 4 hours, target 1.5 hours. Manual investigation cases per day: baseline 345, target below 100. False auto-resolution rate: target below 0.5 percent. Escalation response time: baseline next day, target within 2 hours. Five metrics. Throughput, quality, time. Every pilot metric table should span those three dimensions."

**Show:** Walk across the table.

**Land the point:** "Throughput, quality, time. Span all three."

---

## Slide s40 -- Integration architecture for reconciliation

**Core message:** Five integration design considerations for reliable data pipelines.

**Say:**
"Integration architecture matters. Five design considerations. Data extraction: scheduled API pulls or file drops from each source system. Data normalization: standardize formats, date, currency, reference, before matching. Matching engine: deterministic first via exact match, then fuzzy for near-matches. Results storage: write matched and unmatched records to a reconciliation database with full audit trail. Alerting: push notifications to operations team for exceptions that require action. These five are the skeleton of an automation pipeline. Miss any one and reliability suffers."

**Show:** Walk through the bullets.

**Land the point:** "Five integration elements. All five matter. Reliability depends on each."

---

## Slide s41 -- Automation design principles

**Core message:** Six design principles to anchor every proposal.

**Say:**
"Six design principles. Anchor every proposal. Start narrow: automate one step well before expanding. Fail safe: when in doubt, route to a human, never fail silently. Monitor everything: if you cannot measure it, do not automate it. Design for rollback: every automation must be reversible within a defined time window. Document assumptions: state what must be true for the automation to work correctly. Review regularly: automation that was correct last quarter may not be correct today. Pin these six. They will save you from the failures we look at tomorrow."

**Show:** Walk down the numbered list.

**Land the point:** "Six principles. Pin them. They prevent tomorrow's failures."

---

## Slide s42 -- End of Day 1. What you have learned

**Core message:** Four things carry into Day 2.

**Say:**
"Day 1 close. What you have learned. How to map a banking workflow from trigger to output. How to classify automation opportunities by type and risk. How to design exception paths for common failure modes. How to define pilot metrics with alert thresholds. Tomorrow: hands-on activities, case critiques, and your end-to-end automation design mission. Rest well. Come back ready to build."

**Show:** Walk through the bullets.

**Land the point:** "Four capabilities built. Tomorrow you use them end to end."

---

# DAY 2: Application

**Day 2 arc:** Hands-on labs. Case critiques of real failures. End-to-end capstone design. Peer critique.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Day 2 opening and data | 10 min | s43 to s44 |
| Labs A to D walkthrough and working time | 70 min | s45 to s57 |
| Labs checkpoint | 10 min | s58 |
| Cases 1, 2, 3 and synthesis | 45 min | s59 to s66 |
| Applied mission: scenario, deliverables, steps | 70 min | s67 to s74 |
| Recap, rubric, module close | 35 min | s75 to s80 |

---

## Slide s43 -- Day 2. Hands-on automation design

**Core message:** Today you apply what you learned. Analyse data. Design proposals. Defend under critique.

**Say:**
"Welcome back. Today you apply what you learned. You will analyse real workflow data, design automation proposals, and defend your choices under critique. This is where the practice gets uncomfortable. Good. Uncomfortable is the right state for design review. Let us go."

**Land the point:** "Application day. Discomfort is part of design review. Embrace it."

---

## Slide s44 -- Working with the workflow inventory

**Do -- read these instructions exactly:**

"You have a dataset of 60 AJB workflows. Each row includes the department, process name, step count, manual hours per week, error rate, automation potential score, complexity rating, and process owner role.

Open the Day 2 notebook and load the workflow inventory CSV. Examine the first five rows. I will give you 2 minutes to get oriented. Go."

**Do:** Run a 2-minute orientation. Confirm everyone has the file loaded.

**Land the point:** "Data loaded. Now into Lab A."

---

## Slide s45 -- Lab A. Workflow prioritization

**Core message:** Rank top 5 candidates based on the inventory. Justify the ordering.

**Say:**
"Lab A. Workflow prioritization. Your first task: analyse the workflow inventory and recommend which processes to automate first. Sort by manual hours and error rate. Identify the top five candidates. For each, state the automation type: rule-based, AI-assisted, or autonomous. Justify your ranking order. Specific justifications. Not 'this one looks interesting'. Use the data."

**Land the point:** "Data-driven ranking. Not intuition. Data."

---

## Slide s46 -- Lab A. Prioritization criteria

**Core message:** Five criteria with weights. Regulatory sensitivity is a hard constraint.

**Say:**
"Five criteria with weights. Manual hours per week: high weight, direct cost saving. Error rate: high weight, quality improvement reduces rework and risk. Automation potential score: medium weight, feasibility. Complexity: medium weight, implementation risk. Regulatory sensitivity: low weight but hard constraint. Some workflows require human review regardless of potential. Read the last one carefully. Regulatory sensitivity is a hard constraint, not a score to trade off. If a workflow falls on the wrong side of a regulatory line, do not include it in the top five."

**Show:** Walk across the table.

**Land the point:** "Regulatory sensitivity is a hard constraint. Not a tradeable score."

---

## Slide s47 -- Lab A. Required deliverable

**Core message:** Ranked table of top 5 with 7 columns.

**Say:**
"Your deliverable. A ranked table of top five automation candidates with these columns. Rank. Process name. Department. Proposed automation type. Estimated weekly hours saved. Key risk or constraint. One-sentence justification. Stretch: add a dependencies column identifying what other systems or teams must be involved. You have 10 minutes for Lab A. Clock starts when I say go. Go."

**Do:** Start a 10-minute timer.

**Land the point:** "Ranked table. Seven columns. Ten minutes. Go."

---

## Slide s48 -- Lab B. Exception path design

**Core message:** Pick one of your top five. Design complete exception handling.

**Say:**
"Lab B. Exception path design. Select one of your top five candidates from Lab A. Design a complete exception handling framework for that workflow. Read the quote: 'A workflow without exception handling is not a workflow. It is a wish.' Internalise that. Your proposal is not a workflow until every automated step has a named exception path."

**Show:** Read the quote.

**Land the point:** "Without exception handling, it is a wish. Not a workflow."

---

## Slide s49 -- Lab B. What to produce

**Core message:** List every step. Name a failure mode. Define detection, response, escalation, recovery.

**Say:**
"Produce four things. List every step in the chosen workflow. For each step, identify at least one failure mode. For each failure mode, define four things: detection method, response action, escalation path, recovery procedure. Identify which exceptions halt the workflow entirely and which can be handled and continued. Stretch: define confidence thresholds for AI-assisted steps and specify what happens at each band. High confidence auto-proceed, medium flag for review, low route to manual. You have 10 minutes. Go."

**Do:** Start a 10-minute timer.

**Land the point:** "Four items per failure mode. Halt versus continue per exception. Go."

---

## Slide s50 -- Lab B. Exception mapping template

**Core message:** Six-column template. Fill for every step.

**Say:**
"Use this template. Six columns. Step, failure mode, detection, response, escalation, halt workflow yes or no. Fill for every step in your chosen workflow. Be specific. Vague exception paths are worse than no exception paths because they create false confidence. 'Human review' is not an exception path. 'Analyst reviews the flagged record within 2 hours, escalating to team lead if unresolved' is an exception path."

**Show:** Walk across the table.

**Land the point:** "Specific exceptions. Vague is worse than absent."

---

## Slide s51 -- Lab C. Customer service routing design

**Core message:** Design routing for an AI-assisted customer service system across four channels.

**Say:**
"Lab C. Customer service routing design. AJB wants to introduce an AI-assisted customer service routing system. Incoming requests arrive through four channels: phone, email, mobile app, branch walk-in. Your task: design the routing logic. This is classic AI-assisted design territory. Intent recognition, response generation, escalation logic."

**Land the point:** "Four channels. One routing design. Intent, response, escalation."

---

## Slide s52 -- Lab C. Routing design requirements

**Core message:** Four requirements: six intent categories, routing per intent, escalation matrix, low-confidence fallback.

**Say:**
"Four requirements. Define at least six intent categories. Balance inquiry, complaint, loan inquiry, card dispute, account opening, technical support. For each intent, specify the target team or system, expected response time, whether AI can handle the first response. Design the escalation matrix: what triggers escalation from AI to human, L1 to L2, L2 to specialist. Define fallback behaviour when intent classification confidence is below 70 percent. The 70 percent threshold is not optional. Intent classifiers are wrong often enough that you must have a plan for low confidence."

**Show:** Walk down the numbered list.

**Land the point:** "Six intents. Routing per intent. Escalation matrix. 70 percent fallback. Non-negotiable."

---

## Slide s53 -- Lab C. Routing matrix

**Core message:** Fill a matrix: intent, channel, first responder, AI eligible, SLA, escalation trigger.

**Say:**
"Your deliverable. Complete this matrix for all six intent categories across all four channels. Six columns: intent, channel, first responder, AI eligible, SLA, escalation trigger. Stretch: add a priority weighting for peak-hour routing adjustments. You have 10 minutes. Go."

**Do:** Start a 10-minute timer.

**Land the point:** "Six intents. Four channels. Fill the matrix. Ten minutes. Go."

---

## Slide s54 -- Lab D. Pilot plan development

**Core message:** Choose one automation from Labs A to C. Design a pilot plan for leadership approval.

**Say:**
"Lab D. Pilot plan development. Choose one automation from Labs A through C. Design a pilot plan that you could present to AJB leadership for approval. This is the assembly step. Everything you have done so far comes together here."

**Land the point:** "Assembly step. One pilot plan. Leadership-ready."

---

## Slide s55 -- Lab D. Pilot plan components

**Core message:** Six components: scope, duration, success criteria, failure criteria, rollback, stakeholders.

**Say:**
"Six components. Scope: which workflow, which steps, which volume, percentage of total cases. Duration: how long, what milestones mark progress. Success criteria: what metrics must be met for the pilot to be successful. Failure criteria: what metrics, if breached, would halt the pilot. Rollback plan: how do you revert to the previous process if the pilot fails. Stakeholders: who approves the pilot, who monitors it, who decides on expansion. All six. If any is missing, the pilot is not ready."

**Show:** Walk down the numbered list.

**Land the point:** "Six components. All six. No missing pieces."

---

## Slide s56 -- Lab D. Defining success and failure metrics

**Core message:** Success metrics and failure triggers are both required. Name both.

**Say:**
"Success metrics: cycle time reduction, target versus baseline, error rate change, volume handled without manual intervention, user satisfaction if customer-facing, cost per transaction. Failure triggers: error rate exceeds baseline by more than 10 percent, customer complaints increase, system downtime exceeds SLA, false positive or false negative rate for AI decisions exceeds threshold, regulatory finding related to the automation. Both sides required. Pilots without failure triggers run forever. That is how bad automation sticks around."

**Show:** Walk through both cards.

**Land the point:** "Success and failure. Both named. Otherwise the pilot never ends."

---

## Slide s57 -- Working time. Complete your labs

**Do -- read these instructions exactly:**

"45 minutes of working time. Complete Labs A through D. Work in your teams. Use the notebooks and datasets provided. Be prepared to present your Lab D pilot plan to the group.

- Lab A: 10 minutes, workflow prioritization
- Lab B: 10 minutes, exception path design
- Lab C: 10 minutes, routing design
- Lab D: 15 minutes, pilot plan

Click the timer. Go."

**Do:** Start the 45-minute timer. Visit teams virtually. Push on specifics. Keep teams aligned to time limits per lab.

**Watch for:**
- Prioritizations without data evidence
- Exception paths that say "escalate" without a named recipient
- Routing matrices missing the 70 percent fallback
- Pilot plans without failure triggers or rollback

---

## Slide s58 -- Labs checkpoint

**Do -- read these instructions exactly:**

"Before presenting, verify your work against this checklist.

- Does your prioritization use data from the inventory, not just intuition?
- Does every automated step have at least one named exception path?
- Does your routing design handle low-confidence classifications?
- Does your pilot plan include both success criteria and failure triggers?
- Can you explain your rollback plan in two sentences?

If you answer 'no' to any, fix it now. I will call on teams in 2 minutes."

**Do:** Run a 2-minute checkpoint. Call on 2 teams for quick summaries of their pilot plans.

**Land the point:** "Good discipline. Now we look at real failures."

---

## Slide s59 -- Case discussion and critique (section header)

**Core message:** Critical thinking about failures teaches more than celebrating successes.

**Say:**
"New section. Case discussion. We examine real-world automation decisions, including ones that went wrong. Critical thinking about failures teaches more than celebrating successes. We will look at three failures. Extract lessons. Then apply them to the capstone."

**Land the point:** "Three failures. Real lessons. Apply to capstone."

---

## Slide s60 -- Case 1. The over-automated loan processor

**Core message:** Aggregate metrics hid a segment-level problem. Approval rates for high-risk applicants rose 35 percent. Delinquency followed.

**Say:**
"Case 1. A regional bank automated 90 percent of its personal loan decisions, including edge cases that previously required human judgment. Within three months, approval rates for high-risk applicants increased by 35 percent. The bank discovered the issue only after delinquency rates spiked the following quarter. Read the question. What governance gap allowed this? What monitoring would have caught it earlier? Think before you answer."

**Show:** Read the quote.

**Ask:** "Name the missing monitoring control. Specifically."

**Land the point:** "Aggregate metrics hid the shift. That is the root cause. Hold that thought."

---

## Slide s61 -- Case 1. Analysis framework

**Core message:** Root cause: no segment-level monitoring. Missing control: segment alerts. Lesson: aggregate metrics hide distribution shifts.

**Say:**
"Analysis framework. Root cause: no separate monitoring of approval rates by risk segment. Aggregate metrics looked normal. Missing control: segment-level alerting on approval rate changes, threshold flag if any risk segment shifts by more than 10 percent. Design fix: high-risk applications should require human review regardless of model confidence. Lesson: aggregate metrics hide distribution shifts, monitor at the segment level. Add segment-level monitoring to every proposal this afternoon."

**Show:** Walk through the bullets.

**Land the point:** "Monitor at the segment level. Aggregate hides distribution shifts."

---

## Slide s62 -- Case 2. The chatbot that could not say "I don't know"

**Core message:** Optimising for response rate not accuracy. No confidence threshold. Customer complaints doubled.

**Say:**
"Case 2. A bank deployed a customer-facing chatbot for account inquiries. The bot was designed to always provide an answer. When asked questions outside its training scope, it generated plausible but incorrect responses about account features, interest rates, and fee structures. Customer complaints doubled in six weeks. Read the question. What design decision created this failure? How would you fix it?"

**Show:** Read the quote.

**Ask:** "Name the missing design element. Specifically."

**Land the point:** "Optimised for response rate, not accuracy. Classic mistake."

---

## Slide s63 -- Case 2. Analysis framework

**Core message:** Missing confidence threshold. Missing scope fence. Lesson: a system that cannot say "I don't know" is dangerous.

**Say:**
"Analysis. Root cause: no confidence threshold or scope boundary. The bot was optimised for response rate, not accuracy. Missing control: intent confidence scoring with a minimum threshold, below-threshold queries route to human agents. Design fix: implement a scope fence, if the query does not match a known intent with at least 75 percent confidence, respond with 'Let me connect you with an agent who can help'. Lesson: an AI system that cannot say 'I don't know' is dangerous in a regulated environment. Build the scope fence."

**Show:** Walk through the bullets.

**Land the point:** "Build the scope fence. 'I don't know' is a safety feature."

---

## Slide s64 -- Case 3. Reconciliation without rollback

**Core message:** Upstream timestamp format changed. Matching engine silently misclassified mismatches. Discovered five days later.

**Say:**
"Case 3. A bank automated daily reconciliation with auto-resolution for timing differences. A software update changed the timestamp format in one source system. The matching engine silently misclassified thousands of genuine mismatches as timing differences and auto-resolved them. The issue was discovered five days later during a manual audit. Read the question. What assumption broke? What circuit breaker was missing?"

**Show:** Read the quote.

**Ask:** "Name the missing circuit breaker. Specifically."

**Land the point:** "Silent misclassification for five days. Circuit breaker was absent."

---

## Slide s65 -- Case 3. Analysis framework

**Core message:** Input schema not validated. Missing alert on auto-resolution rate. Lesson: automation that does not validate inputs inherits upstream errors.

**Say:**
"Analysis. Root cause: the automation assumed stable input formats, no validation check on incoming data structure. Missing control: input schema validation before matching begins, format change detection triggers halt and alert. Missing circuit breaker: alert if auto-resolution rate exceeds historical average by more than 20 percent. Design fix: data quality gates at the input stage, validate schema, format, completeness before processing. Lesson: automation that does not validate its inputs inherits every upstream error silently. Schema validation is not optional."

**Show:** Walk through the bullets.

**Land the point:** "Validate inputs. Validate schema. Silent inheritance is how bad gets worse."

---

## Slide s66 -- Patterns across failures

**Core message:** Three patterns: monitoring gaps, missing boundaries, delayed detection.

**Say:**
"Patterns across all three failures. Monitoring gaps: all three cases lacked segment-level or threshold-based monitoring, aggregate dashboards hid the problem. Missing boundaries: no system knew when to stop, no confidence thresholds, no scope fences, no format validators. Delayed detection: problems discovered days or weeks later, real-time alerting would have cut exposure dramatically. Every proposal in the capstone must address these three. Monitoring, boundaries, alerting."

**Show:** Walk through the three cards.

**Land the point:** "Monitoring, boundaries, alerting. Capstone must address all three."

---

## Slide s67 -- Applied mission. End-to-end automation design (section header)

**Core message:** Capstone activity. Design a complete proposal from mapping to pilot plan.

**Say:**
"Applied mission. This is your capstone. Your team will design a complete automation proposal for a real AJB process, from workflow mapping to pilot plan. Everything you have learned feeds into this. Treat this as real work. Because it is."

**Land the point:** "Capstone. Real work. Treat it that way."

---

## Slide s68 -- Choose your scenario

**Core message:** Two scenarios. Trade finance document processing or internal audit finding remediation.

**Say:**
"Two scenarios. Choose one. Scenario A: Trade finance document processing. Letters of credit require verification of 12 document types across multiple parties. Current processing: 5 days average. Volume: 80 cases per month. Scenario B: Internal audit finding remediation tracking. Audit findings require action plans, owner assignments, evidence collection, status reporting. Current backlog: 140 open findings across 8 departments. Pick one. You have 1 minute. Go."

**Do:** Allow 1 minute for teams to choose. Confirm each team has picked.

**Land the point:** "One scenario chosen. Commit to it."

---

## Slide s69 -- Mission deliverables

**Core message:** Five deliverables: workflow map, automation proposal, exception framework, pilot plan, risk register.

**Say:**
"Five deliverables. Workflow map: complete current-state process map with all steps, decisions, and exception paths. Automation proposal: for each step, state whether it should be automated, type, justification. Exception framework: complete exception handling table covering every automated step. Pilot plan: scope, duration, metrics, failure triggers, rollback, stakeholders. Risk register: top five risks with likelihood, impact, mitigation. Five deliverables. They build on each other. Do them in order."

**Show:** Walk down the numbered list.

**Land the point:** "Five deliverables. In order. Each one feeds the next."

---

## Slide s70 -- Step 1. Map the current state

**Core message:** Include the steps people often forget. Handoffs, delays, workarounds, coverage gaps.

**Say:**
"Step 1. Map the current state. Include the steps people often forget. Who initiates the process and how? What handoffs occur between teams or systems? Where do delays typically happen? What informal workarounds exist? What happens when someone is on leave and no backup is assigned? Where are decisions made, and what information supports them? Those last two are often missing in formal process documents. That is where bad automation hides."

**Show:** Walk through the bullets.

**Land the point:** "Map the forgotten steps. That is where bad automation hides."

---

## Slide s71 -- Step 2. Classify and propose

**Core message:** For each step, classify with honest confidence levels.

**Say:**
"Step 2. Classify each step. Six columns: step, current method, automate yes or no or partial, type, confidence level, justification. Be honest about confidence levels. A low-confidence proposal needs more investigation before piloting. Writing 'high confidence' everywhere is a sign you have not thought hard enough."

**Show:** Walk across the table.

**Land the point:** "Honest confidence levels. Low is fine. Pretend-high is not."

---

## Slide s72 -- Step 3. Build your risk register

**Core message:** At least five risks. Likelihood, impact, mitigation, owner for each.

**Say:**
"Step 3. Risk register. Five columns: risk, likelihood, impact, mitigation, owner. At least five risks. Consider data quality risks, integration failures, staff resistance, regulatory changes, model drift. Staff resistance is often underestimated. People who feel their job is threatened can quietly break a pilot. Treat that as a real risk."

**Show:** Walk across the table.

**Land the point:** "Five risks minimum. Staff resistance is a real risk."

---

## Slide s73 -- Step 4. Prepare your presentation

**Core message:** 8-minute presentation. Four sections with tight time budget.

**Say:**
"Step 4. Prepare your presentation. Each team presents in 8 minutes. Structure: current state in 2 minutes. Proposed automation in 3 minutes. Governance with exception handling, metrics, rollback in 2 minutes. Top risk and mitigation in 1 minute. Total 8. Read the quote: 'Other teams will critique your proposal. Be ready to defend your choices.' Critique is the point."

**Show:** Walk through the numbered list.

**Land the point:** "8 minutes. Tight time budget. Defence under critique."

---

## Slide s74 -- Peer critique protocol

**Do -- read these instructions exactly:**

"Peer critique protocol. When critiquing another team's proposal, focus on these questions.

- Is the workflow map complete, or are steps missing?
- Are exception paths specific enough to act on, or are they vague?
- Are the success metrics measurable and tied to a clear baseline?
- Is the rollback plan realistic? Could you execute it under pressure?
- What is the single biggest risk this proposal underestimates?

You have 45 minutes to build the proposal, then presentations begin. Click the timer. Go."

**Do:** Start a 45-minute timer. Visit teams virtually throughout. Presentations run after the timer.

**Watch for:**
- Vague exception paths. Push for specificity.
- Success metrics without baselines. Force the baseline.
- Rollback plans that cannot be executed in the described window.

**Presentation round:**

**Do:** Each team presents for 8 minutes. Use the peer critique questions. Reward honesty over polish.

**Land the point:** "Strong proposals survive critique. Polish does not. Judgment does."

---

## Slide s75 -- Module 5 recap

**Core message:** Six takeaways carry forward.

**Say:**
"Module 5 recap. Six takeaways. Workflow mapping is the foundation, if you cannot map it you cannot automate it. Automation exists on a spectrum, choose the right level for each step. Exception paths are more important than the happy path. Human-in-the-loop is a design choice, not a weakness. Governance, monitoring, and rollback are not optional add-ons. Start with a narrow, measurable pilot, expand only after controls are proven. Six takeaways. Pin them."

**Show:** Walk down the numbered list.

**Land the point:** "Six takeaways. Pin them. They travel with you."

---

## Slide s76 -- Six principles of automation design

**Core message:** Map first, fail safe, monitor always, start narrow, plan rollback, review regularly.

**Say:**
"Six principles. Map first: never automate a process you have not mapped completely. Fail safe: default to human review when confidence is low. Monitor always: if you cannot measure it, do not automate it. Start narrow: pilot with a small percentage of cases first. Plan rollback: every automation must be reversible. Review regularly: assumptions change, automations must be re-validated. Six principles. Write them on a card. Keep the card on your desk."

**Show:** Walk through the six cards.

**Land the point:** "Six principles. Card on desk. That is the job."

---

## Slide s77 -- Final assessment rubric

**Core message:** Five criteria, three bands each.

**Say:**
"Final rubric. Five criteria. Workflow mapping: competent lists steps accurately, strong adds decisions and handoffs, exceptional includes exception paths, timing, and informal workarounds. Automation design: competent has one step classified, strong has multiple with justification, exceptional ties classification to risk, cost, and feasibility. Exception handling: competent identifies one path, strong covers all automated steps, exceptional includes detection, response, escalation, recovery. Pilot planning: competent has scope and duration, strong adds metrics and failure triggers, exceptional has rollback, stakeholder matrix, phased expansion. Critical thinking: competent identifies obvious risks, strong analyses trade-offs, exceptional challenges assumptions with evidence. Aim for exceptional where you can."

**Show:** Walk across the table briefly.

**Land the point:** "Exceptional everywhere possible. That is the bar."

---

## Slide s78 -- Pitfalls to avoid after this module

**Core message:** Five pitfalls to avoid back at AJB.

**Say:**
"Five pitfalls to avoid. Do not automate a decision before you can explain its exception path. Do not measure only throughput, measure quality, error rate, and customer impact. Do not skip the pilot, 'it works in testing' is not evidence of production readiness. Do not treat AI confidence scores as certainty, calibrate and validate regularly. Do not remove human review to save time, remove it only when evidence supports doing so. Read those back at work when someone suggests shortcuts."

**Show:** Walk through the bullets.

**Land the point:** "Five pitfalls. Read them back when shortcuts appear."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap of learning, outputs, and success indicators.

**Say:**
"Three things. What you learned: how to map workflows properly, classify automation opportunities, design exception paths, and scope pilots that can be governed safely. What you produced: workflow maps, automation classifications, exception designs, pilot metrics, and a rollout recommendation. What proved success: checkpoint completion, explicit control design, measurable pilot logic, and recommendations that balanced speed against operational risk."

**Show:** Point to the three cards.

---

## Slide s80 -- Module 5 complete

**Core message:** Strong automation is selective, observable, reversible.

**Say:**
"Module 5 is complete. Module 6 focuses on advanced data visualisation. You will take the outputs and recommendations from earlier modules and learn how to communicate them clearly to decision-makers. Carry forward this habit: strong automation design is selective, observable, and reversible. Start with the workflow you can govern best, not the workflow you can demo fastest. Thank you. Well done. See you in Module 6."

**Land the point:** "Selective. Observable. Reversible. Three words. That is the carry-forward."

---

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Workflow mapped. At least one automation point named. Basic exception path present. Pilot scope described. |
| **Strong** | Multiple steps classified with justification. Exception paths cover every automated step. Pilot plan has metrics, failure triggers, and an owner. |
| **Exceptional** | Proposal ties automation design to operating risk. Rollback is executable. Segment-level monitoring present. Trade-offs critiqued with evidence. Presentation survives peer challenge. |

### Rubric Application

- Apply the rubric live during the presentation round. Quote the criteria out loud.
- Weight governance and exception handling as heavily as the automation proposal itself.
- Reward teams that leave steps manual when the governance bar cannot be met.
- A pretty map with weak exception handling is not exceptional. Do not elevate visuals over substance.

## Close Standard

End the module by asking each participant to complete this sentence:

> "Before I recommend any automation at AJB, the first thing I will always check is ..."

Collect responses. Use them to verify the module landed on governance and exception thinking, not tool enthusiasm.

## Mixed-Level Delivery Notes

- **Intro route:** Hold newer participants on mapping and classification. Depth beats breadth.
- **Advanced route:** Push on segment-level monitoring, schema validation, and stronger pilot decision gates.
- **Protect the specificity.** Do not let teams substitute buzzwords for named owners, thresholds, and triggers.

## Virtual Engagement Checkpoints

- **Day 1:** After the KYC walkthrough (s34), require each team to post their preferred first automation step in chat with a one-sentence justification.
- **Day 2:** After Cases 1 to 3 (s66), ask each participant to name the single monitoring control they will add to their own proposal.
- **Day 2:** After the capstone presentations, require each presenter to state aloud whether their pilot has a rollback they could execute under pressure.
