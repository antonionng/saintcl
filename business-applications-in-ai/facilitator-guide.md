# Module 4 | Business Applications in AI -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed banking cohort at Al Jazira Bank, business and technical |
| Duration | 2 days, 4 hours per day |
| Delivery | Live online, shared screen, chat, pair work |
| Slides | 80 (s01 to s80) |
| Labs | Labs A through F, plus case discussion and capstone recommendation |
| Core arc | From where AI creates business value to a governed, executive-ready recommendation for one AJB opportunity |
| Prerequisite | Prior modules or equivalent familiarity with ML and neural network concepts |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` and verify keyboard navigation works
- [ ] Load the datasets: `ai_opportunities.csv`, `governance_checklist.csv`
- [ ] Confirm the workbook template and recommendation template are open for reference
- [ ] Prepare one specific AJB example you can speak to if participants stall on opportunity generation
- [ ] Test screen share with slides and workbook side by side
- [ ] Prepare a short recap of any prior module the cohort completed, so you can bridge into Module 4 cleanly
- [ ] Have the peer review rubric visible so you can point to it in the moment

## Delivery Stance

- Treat this as a judgement module, not a technology module.
- Every opportunity must be tied to a named workflow, a workflow owner, and a measurable outcome before it is scored.
- Push back firmly when a participant recommends a use case without data readiness or governance thinking.
- Force every participant to separate "interesting idea" from "bank-ready opportunity".
- Model the executive tone you expect. Keep your own examples concise, specific, and decision-led.
- Reward recommendations that decline to proceed when the governance bar cannot be met. That is strong judgement.
- Use the cases on Day 2 to anchor governance as a design activity, not a compliance afterthought.

---

# DAY 1: Opportunity and Assessment

**Day 1 arc:** Understand where AI creates banking value. Learn to map, score, and compare opportunities. Produce a prioritised shortlist and a governance readiness view for one opportunity.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening, strategy map, routes | 15 min | s01 to s01b |
| Purpose, outcomes, structure | 15 min | s02 to s05 |
| Why business-led AI matters | 15 min | s06 to s08 |
| Where AI creates banking value | 20 min | s09 to s12 |
| Banking cases | 25 min | s13 to s17 |
| AI washing and failure modes | 15 min | s18 to s19 |
| Problem statement and workflow mapping | 20 min | s20 to s21 |
| Operating model choice | 20 min | s22 to s23 |
| Data readiness and metrics | 15 min | s24 to s25 |
| Concept checkpoint | 5 min | s26 |
| Opportunity assessment framework | 30 min | s27 to s33 |
| Worked example | 20 min | s34 to s37 |
| The "not yet" list, tiebreakers, anti-patterns | 20 min | s38 to s41 |
| Framework checkpoint | 5 min | s42 |
| Lab A: opportunity mapping | 45 min | s43 to s47 |
| Lab B: governance assessment | 35 min | s48 to s53 |
| Lab C: operating model design | 30 min | s54 to s56 |
| Day 1 reflection and close | 10 min | s57 to s58 |

---

## Slide s01 -- Title slide

**Core message:** This module is not about technology. It is about business judgement. We will finish with a governed, executive-ready recommendation.

**Say:**
"Welcome to Module 4. Business Applications in AI. I want to set the tone early. This is not a module about AI technology. It is a module about business judgement. Which problems deserve AI investment, what makes an opportunity viable, and how to recommend adoption that AJB can govern responsibly. By the end of tomorrow, each of you will produce an executive-quality recommendation for one AI opportunity at the bank. That is the deliverable."

**Show:** Point to the lede.

**Land the point:** "Strategy led. Governance aware. Two days. Let us go."

---

## Slide s01a -- How to judge AI opportunities like an executive team

**Core message:** The executive lens has three dimensions: value, viability, governance.

**Say:**
"Here is the strategy map. When an executive team looks at an AI opportunity, they ask three questions. Value: which workflow creates measurable benefit if improved? Viability: do data, owners, and operating conditions make the idea practical? Governance: can the bank control risk, compliance, and accountability from day one? Every opportunity you score over the next two days gets tested against these three. If any one of them is weak, the opportunity is not ready."

**Show:** Walk through the three cards.

**Ask:** "Of those three, which does your organisation typically underweight today?"

**Land the point:** "Value, viability, governance. All three matter. That is the executive lens."

---

## Slide s01b -- Choose your learning route

**Core message:** Two routes through the module. Both land at the same deliverables.

**Say:**
"Two routes. If you are newer to AI business case work, stay on the intro path. Stay close to the scoring framework and recommendation template so your core decision logic stays tight. If you are more comfortable, use the stretch prompts to go deeper on sequencing, sensitivity analysis, and executive framing. Same deliverables either way. Depth differs."

**Show:** Point to both cards.

**Land the point:** "Pick your route. I will check in after Lab A."

---

## Slide s02 -- Module purpose

**Core message:** The module teaches judgement, not tools. The output is a governed recommendation.

**Say:**
"The module purpose in two sentences. This module is not about AI technology. It is about business judgement: which problems deserve AI investment, what makes an opportunity viable, and how to recommend adoption that the bank can govern responsibly. By the end of Day 2, each of you will deliver an executive-quality recommendation for one AI opportunity at AJB, including value logic, controls, and a realistic first move. Keep that deliverable in mind throughout."

**Land the point:** "Judgement. Governance. Executive-ready output. That is the module."

---

## Slide s03 -- What you will be able to do

**Core message:** Five concrete outcomes by the end of the module.

**Say:**
"Five outcomes. Identify banking workflows where AI creates measurable value. Score opportunities using a value-feasibility-risk framework. Describe governance, ethics, and compliance requirements for AI in banking. Choose the right operating model: augment, automate, or customer-facing. And write a structured executive recommendation for an AI initiative. All five are testable. Pay attention throughout."

**Show:** Walk through the five numbered outcomes.

**Land the point:** "Five outcomes. Each one ladders into the capstone."

---

## Slide s04 -- Two-day structure

**Core message:** Day 1 is opportunity and assessment. Day 2 is governance and recommendation.

**Say:**
"Two-day structure. Day 1 is opportunity and assessment. We understand where AI creates value. We learn to map, score, and compare opportunities. We practise with real banking scenarios. Day 2 is governance and recommendation. We apply governance requirements, build a business case, draft the executive recommendation, and peer review it. Day 1 gets you a shortlist. Day 2 gets you a decision."

**Show:** Point to both day cards.

**Land the point:** "Shortlist on Day 1. Decision on Day 2."

---

## Slide s05 -- What you will produce and how it is validated

**Core message:** You will produce four artefacts and they will be validated against a rubric and peer critique.

**Say:**
"Here is what you are producing and how it is validated. On outputs: opportunity scoring and prioritisation, governance and control notes, operating model choice, and an executive recommendation for AJB. On validation: checkpoint completion during each teaching moment, workbook and notebook artefacts completed, peer critique against the rubric, and a final recommendation that is clear, governed, and decision-ready. These are not separate pieces. They build on each other."

**Show:** Walk through both columns.

**Land the point:** "Four artefacts. Validated by rubric and peer review. Let us get into the substance."

---

## Slide s06 -- Why business-led AI matters

**Core message:** Most AI failures are business failures, not technology failures.

**Say:**
"Here is the uncomfortable truth. Most AI projects that fail do not fail because of technology. They fail because the business problem was unclear, the data was unavailable, or the operating model was wrong. The question is never 'Can we use AI?' It is 'Should we, and can we govern it?' Hold that question close all week. If your answer to either half is weak, the opportunity is not ready."

**Show:** Read the quote out loud.

**Land the point:** "Should we, and can we govern it? Two halves. Both must be yes."

---

## Slide s07 -- The AI maturity gap in banking

**Core message:** The gap between AI ambition and deployment in banking is rarely technical.

**Say:**
"Banks globally report high interest in AI but low deployment maturity. The gap is rarely technical. Look at the table. Banks want faster customer service, but there is no clear ownership of AI outputs. They want better fraud detection, but explainability requirements are not met. They want automated document processing, but data quality and availability gaps block it. They want personalised offers, but regulatory uncertainty on fairness stops them. The obstacles are organisational, not algorithmic."

**Show:** Walk through the table rows.

**Land the point:** "The real gap is organisational. Own that insight."

---

## Slide s08 -- Discussion. Your current view

**Do -- read these instructions exactly:**

"Before we begin the core material, take two minutes to write brief answers to these three questions in your workbook.

1. Name one AJB workflow that you believe could benefit from AI. Why?
2. What is the single biggest barrier to AI adoption at the bank today?
3. How would you know if an AI deployment succeeded?

We will revisit your answers at the end of Day 2. You will be surprised how your view changes. Two minutes. Go."

**Do:** Run a 2-minute timer. Monitor chat. Capture a couple of answers out loud before moving on.

**Land the point:** "Hold on to those answers. We will come back to them tomorrow."

---

## Slide s09 -- Where AI creates banking value (section header)

**Core message:** The next block builds a shared vocabulary for banking AI value.

**Say:**
"New section. We are going to build a shared vocabulary for AI business cases in banking. Three pieces. Value categories. AI techniques that map to banking. And the value chain, so we know where in the bank AI actually lands. Keep your notebooks open."

**Land the point:** "Shared vocabulary first. Then we assess."

---

## Slide s10 -- Three value categories

**Core message:** AI creates banking value in three categories: cost reduction, revenue growth, risk mitigation.

**Say:**
"Three value categories. Cost reduction: automating manual, repetitive tasks, reducing processing time and error rates, freeing skilled staff for higher-value work. Revenue growth: improving cross-sell precision, faster onboarding, better product-customer matching and retention. Risk mitigation: earlier fraud detection, stronger AML surveillance, better credit risk calibration, reduced regulatory exposure. Every AI opportunity falls into one or more of these. If you cannot name which category it belongs to, you probably cannot build a business case for it yet."

**Show:** Walk through the three cards.

**Ask:** "Name one AJB initiative and tell me which category it targets."

**Land the point:** "Cost, revenue, risk. Three categories. Know which one your opportunity is."

---

## Slide s11 -- AI techniques relevant to banking

**Core message:** Five families of AI technique, each with a banking application and example.

**Say:**
"Five families of AI technique you will encounter in banking. Classification for sorting, routing, and risk tiering. Anomaly detection for fraud and outlier transactions. Natural language processing for document review and chatbots. Prediction for churn, credit default, and demand. And generative AI for drafting, summarization, and question answering. Each has a banking application. Each is a tool. The value is not in the technique. It is in where you apply it."

**Show:** Walk across the table rows.

**Land the point:** "Five techniques. Pick the right one for the problem, not the other way around."

---

## Slide s12 -- Value chain. Where AI fits in banking operations

**Core message:** AI is a capability inserted into existing workflows. Value depends on the insertion point.

**Say:**
"This is a key framing. AI is not a product. It is a capability applied within existing workflows. The value comes from where you insert it, not from the model itself. Four insertion areas. Customer acquisition: lead scoring, application pre-screening, digital onboarding. Operations: document processing, reconciliation, exception handling. Risk and compliance: transaction monitoring, credit decisioning support, regulatory reporting. Customer service: inquiry routing, response drafting, sentiment analysis. Same underlying techniques. Different value depending on where they land."

**Show:** Walk down the numbered list.

**Land the point:** "Insertion point drives value. Not the algorithm."

---

## Slide s13 -- Case. Customer service AI at a retail bank

**Core message:** The key enabler was data preparation, not the model.

**Say:**
"First case. A mid-size Gulf bank deployed AI routing for its contact centre. Inbound inquiries classified by topic and urgency, routed to the right team with a suggested response draft. Results: average handling time dropped 22 percent in three months. First-contact resolution from 61 to 74 percent. Staff reported less time on repetitive categorisation, more on complex cases. Now here is the part that matters. The key enabler was not the model. It was clean labelling of historical inquiry data over six months of preparation. Six months. That is where the work lived."

**Show:** Point to the data preparation sentence.

**Land the point:** "The model got the credit. The labelling did the work. Remember that."

---

## Slide s14 -- Case. Fraud detection model upgrade

**Core message:** The model recommends. The investigator decides.

**Say:**
"Second case. A regional bank replaced its rules-based transaction monitoring with a hybrid system. Rules for known patterns. Machine learning for novel anomalies. False positives dropped 35 percent. Detection of previously unseen fraud patterns increased 18 percent. Crucially, every model output was paired with human review before action. Read the quote at the bottom: 'The model does not decide. It recommends. The investigator decides.' That is the governance pattern for high-stakes banking AI."

**Show:** Read the quote aloud.

**Land the point:** "Model recommends. Human decides. That is the pattern."

---

## Slide s15 -- Case. Credit decisioning support

**Core message:** The model was a second opinion, not a replacement.

**Say:**
"Third case. A bank introduced ML-based credit scoring alongside its existing scorecard. Extra data points: transaction velocity, account behaviour trends. The model flagged cases where the traditional score might under- or over-estimate risk. Approval rates for thin-file customers improved 12 percent without increasing defaults. The model served as a second opinion, not a replacement. Explainability reports were generated for every flagged case. Notice the governance design. Augment, not replace. Explain every case. That is deployable."

**Show:** Point to the three bullets.

**Land the point:** "Augment, not replace. Explain every case. Deployable design."

---

## Slide s16 -- Case. Document processing and KYC

**Core message:** AI-assisted extraction with mandatory human verification can halve cycle times.

**Say:**
"Fourth case. Manual KYC document review averaged 25 minutes per customer. AI-assisted extraction reduced it to 8 minutes by pre-populating fields from uploaded documents. Accuracy of extracted fields was 94 percent. Mandatory human verification on all outputs. Onboarding cycle time dropped from 5 days to 2 days. Compliance retained full override. Look at that architecture. AI speeds up. Human signs off. Compliance holds the override. Three clear roles. That is what good banking AI looks like."

**Show:** Walk through the three bullets.

**Land the point:** "Three clear roles. AI, reviewer, compliance. Clean division of labour."

---

## Slide s17 -- What these cases have in common

**Core message:** Five patterns appear in every successful banking AI deployment.

**Say:**
"Five patterns across every case. The business problem was defined before the technology was chosen. Data preparation took longer than model training. Human review was preserved in all decision workflows. Success was measured by business outcome, not model accuracy alone. Governance was designed in parallel with the technical build. These are not optional features. They are the minimum bar for deployable banking AI."

**Show:** Walk down the numbered list.

**Ask:** "Which of those five is the hardest to hold to inside your organisation?"

**Land the point:** "Five patterns. All five present in the successes. All five missing in the failures."

---

## Slide s18 -- AI washing. Recognising hype

**Core message:** AI washing wastes budget and destroys credibility. Three signals tell you it is happening.

**Say:**
"This is important. AI washing is labelling a project as AI when it is really a simple rule, a basic dashboard, or a rebadged analytics query. It wastes budget and erodes credibility. Three signals. The project cannot articulate what the model learns from data. There is no feedback loop or retraining plan. AI is being used to justify budget, not to describe a real capability. Your job is to distinguish genuine AI opportunity from branding. Push hard when you see these signals."

**Show:** Walk through the three signals.

**Land the point:** "AI washing is a credibility killer. Spot it. Call it out."

---

## Slide s19 -- Common failure modes

**Core message:** Failures are organisational and technical. Both must be managed.

**Say:**
"Two failure mode families. Organisational: no executive sponsor, no workflow owner, misaligned success metrics between data team and business unit, no change management plan. Technical: training data does not represent production, model drift goes unmonitored, integration with existing systems is underestimated, no fallback when the model is unavailable. Both families kill projects. Recommendations must address both."

**Show:** Walk through both cards.

**Land the point:** "Organisational and technical. Both columns. Both must be answered."

---

## Slide s20 -- The business problem statement

**Core message:** Four questions every business problem statement must answer.

**Say:**
"Before any AI assessment, the business problem must be stated in plain language. A good problem statement answers four questions. What is the current workflow and who owns it? What outcome is unsatisfactory today, and how is it measured? What would 'better' look like in specific, measurable terms? Who is affected: staff, customers, regulators, or all three? If you cannot answer all four in a single paragraph, you are not ready to score the opportunity."

**Show:** Walk through the four numbered questions.

**Land the point:** "Four questions. One paragraph. That is the entry ticket."

---

## Slide s21 -- Mapping the current workflow

**Core message:** You cannot improve what you have not described. Use a five-field map.

**Say:**
"You cannot improve what you have not described. Before proposing AI, document the existing process. Five fields. Trigger: what initiates the workflow? Inputs: what data or documents enter? Processing: what decisions, reviews, or transformations happen? Outputs: what is produced? Owner: who is accountable for quality and timeliness? Five fields. Every opportunity. Non-negotiable."

**Show:** Walk across the table rows.

**Land the point:** "Five fields. Describe before you propose."

---

## Slide s22 -- Operating model choices

**Core message:** Three operating models: augment, automate, customer-facing. Risk and governance drive the choice.

**Say:**
"AI can be inserted into a workflow in three ways. Augment: AI provides recommendations, a human reviews and decides. Best for high-risk, regulated decisions. Example: credit scoring support. Automate: AI executes the task end-to-end within defined rules. Human oversight via exception review. Example: document data extraction. Customer-facing: AI interacts directly with the customer. Requires the highest governance bar. Example: chatbot for account inquiries. Pick the model that matches the risk. Do not let ambition override governance."

**Show:** Walk through the three cards.

**Land the point:** "Augment, automate, customer-facing. Three choices. Governance picks the right one."

---

## Slide s23 -- Choosing the operating model

**Core message:** Five factors shape the operating model decision.

**Say:**
"Five factors help you pick. Risk tolerance: augment is lowest, customer-facing is highest. Explainability need: customer-facing demands the most. Data maturity required: rises from augment to customer-facing. Regulatory scrutiny: same ladder. Speed of value: augment deploys fastest, customer-facing slowest because controls take longer to build. Use this table to justify your choice in the recommendation. Do not pick the mode that feels exciting. Pick the mode that fits the five factors."

**Show:** Walk across the table.

**Land the point:** "Five factors decide. Not ambition. Not novelty."

---

## Slide s24 -- Data readiness. The prerequisite

**Core message:** No data, no AI. Five factors must be checked honestly.

**Say:**
"Say it out loud. No data, no AI. Before recommending any AI initiative, assess data availability honestly. Five factors. Availability: does the data exist in usable format and is it accessible? Quality: how complete, accurate, and consistent? Volume: enough to train and validate? Labelling: for supervised learning, are outcomes labelled reliably? Freshness: how current is the data, does it reflect present conditions? If any one of these is weak, the opportunity is not ready, no matter how attractive the business case looks."

**Show:** Walk through the bullets.

**Land the point:** "Five data checks. One weak answer and the opportunity is not ready."

---

## Slide s25 -- Metrics that matter

**Core message:** Measure by business outcomes, not model metrics alone.

**Say:**
"Here is a critical habit. AI projects must be measured by business outcomes, not model metrics alone. A model with 95 percent accuracy that does not change any business result has delivered zero value. Look at the table. For every model metric on the left, there is a business metric on the right. Accuracy maps to reduction in manual rework hours. False positive rate maps to investigator time saved. Latency maps to customer wait time. Precision and recall map to fraud losses prevented in SAR. Always show the right column when you brief leadership."

**Show:** Walk across the table.

**Land the point:** "Business metrics in leadership language. Not model metrics alone. Ever."

---

## Slide s26 -- Concept checkpoint

**Do -- read these instructions exactly:**

"Quick checkpoint before we move into the assessment framework. I am going to ask five questions. Answer in chat or out loud. If you hesitate on any of them, that is the area to revisit.

1. Name the three value categories for AI in banking.
2. What are the three operating model choices?
3. Why is a business problem statement required before technology selection?
4. What five data readiness factors must be assessed?
5. Give one example of an AI washing signal.

Take 2 minutes. Go."

**Do:** Run a 2-minute checkpoint. Call on specific participants for each answer. If the room is slow on any, revisit that slide briefly before moving on.

**Land the point:** "Good. Now we move into the framework."

---

## Slide s27 -- Opportunity Assessment Framework (section header)

**Core message:** The framework ensures consistency and reduces the influence of enthusiasm over evidence.

**Say:**
"New section. The Opportunity Assessment Framework. A structured method for identifying, scoring, and ranking AI opportunities. The whole point is to reduce the influence of enthusiasm over evidence. Enthusiasm is useful. Evidence is better. The framework gives you a consistent lens across every candidate."

**Land the point:** "Framework over enthusiasm. That is the discipline."

---

## Slide s28 -- The opportunity mapping sequence

**Core message:** Six steps from long list to recommendation.

**Say:**
"Six steps. Generate a long list of candidate workflows. Describe each candidate with a standard template. Score each on value, feasibility, and risk on a 1-to-5 scale. Plot opportunities on a prioritisation matrix. Select the top two or three for deeper assessment. Write a recommendation for the strongest candidate. Simple sequence. The rigour is in the templates and the scoring, not in any one step being clever."

**Show:** Walk down the numbered list.

**Land the point:** "Six steps. Discipline, not cleverness."

---

## Slide s29 -- Step 1. Generating the long list

**Core message:** Work department by department. Look for repetitive decisions, manual data handling, or pattern recognition.

**Say:**
"Step one. Generating the long list. Work department by department. For each, ask: where do people spend time on repetitive decisions, manual data handling, or pattern recognition? Those three activities are the typical signature of an AI candidate. Look at the table. Retail banking: inquiry routing, product recommendation, complaint triage. Corporate banking: credit memo drafting, covenant monitoring, relationship review prep. Operations: payment exceptions, reconciliation, document indexing. Risk: transaction monitoring, credit scoring, validation support. Compliance: SAR narrative drafting, policy change impact, KYC refresh. Not every one is a good idea. All of them are candidates for the long list."

**Show:** Walk across the table.

**Land the point:** "Generate broadly. Narrow later. The long list is the top of the funnel."

---

## Slide s30 -- Step 2. The opportunity template

**Core message:** Every candidate gets a one-page description using a seven-field template.

**Say:**
"Step two. Every candidate gets a one-page description using this template. Seven fields. Opportunity name, short and descriptive. Department or owner. Current pain point, what is slow, expensive, or error-prone. AI technique, the family that fits. Data available, yes, partial, or no with notes. Operating model, augment, automate, or customer-facing. Estimated impact, quantitative if possible. Seven fields. One page. Every candidate. Non-negotiable."

**Show:** Walk across the table.

**Land the point:** "Seven fields. One page. Every candidate. Discipline."

---

## Slide s31 -- Step 3. Scoring criteria

**Core message:** Score on value, feasibility, and risk. 1 to 5 on each. Risk is scored where lower is better.

**Say:**
"Step three. Three dimensions on a 1-to-5 scale. Value: 1 is marginal improvement, 3 is meaningful efficiency gain, 5 is transformative business impact with clear SAR or hour savings. Feasibility: 1 is no data and no owner, 3 is data exists but needs preparation, 5 is data ready and workflow documented and owner engaged. Risk: 1 is internal tool with low exposure, 3 is customer-adjacent, 5 is direct customer impact and regulatory sensitivity. Remember, on risk, lower is better. Document your reasoning for each score. Reviewers will ask."

**Show:** Walk through the three cards.

**Land the point:** "Three dimensions. 1 to 5. Written reasoning every time."

---

## Slide s32 -- Step 4. The prioritisation matrix

**Core message:** Plot value by feasibility. Size by risk. The best first project sits top-right with a small risk bubble.

**Say:**
"Step four. Plot opportunities on a 2-by-2 matrix. Value on the vertical axis. Feasibility on the horizontal axis. Size each bubble by risk, larger is higher risk. The matrix has four quadrants. Top-right: high value and high feasibility. These are your priority candidates. Act now. Top-left: high value, low feasibility. Strategic bets. Invest in readiness. Bottom-right: low value, high feasibility. Quick wins if risk is low. Bottom-left: avoid. The best first AI project sits in the top-right quadrant with a small risk bubble. Aim for that."

**Show:** Walk through the four quadrants.

**Land the point:** "Top-right, small bubble. That is your first project."

---

## Slide s33 -- Step 5. Deeper assessment for top candidates

**Core message:** For the top 2 to 3 candidates, answer five more questions.

**Say:**
"Step five. For the top 2 or 3 opportunities, answer five additional questions. What is the minimum viable deployment? Pilot scope, duration, success criteria. What data preparation work is required before training? Who must approve the deployment? What governance gates apply? What is the fallback if the AI component fails or is unavailable? What ongoing monitoring and retraining schedule is needed? These questions separate 'nice idea' from 'bank-ready project'."

**Show:** Walk through the bullet list.

**Land the point:** "Five deeper questions. This is where you separate ideas from projects."

---

## Slide s34 -- Worked example. Complaint triage at AJB

**Core message:** A fully worked opportunity with all seven template fields filled in.

**Say:**
"Worked example. Complaint triage at AJB. Opportunity: auto-classify customer complaints by product and urgency. Department: Customer Experience, owned by Head of CX Operations. Pain point: manual classification takes 4 minutes per complaint, 800 complaints per day. AI technique: text classification, NLP. Data available: yes, 3 years of labelled complaint records in CRM. Operating model: augment, model suggests, agent confirms. Scores: value 4, feasibility 4, risk 2. This is what a filled template looks like. Specific, measurable, governable."

**Show:** Walk across the table.

**Land the point:** "This is what 'ready to score' looks like. No hand-waving."

---

## Slide s35 -- Worked example. Scoring rationale

**Core message:** Every score has an evidence-based rationale, not an opinion.

**Say:**
"Now the scoring rationale. Value 4: at 800 complaints per day and 4 minutes saved per complaint, the annual saving is approximately 8,500 staff hours. That frees capacity for complex case handling. Feasibility 4: three years of labelled data in a structured CRM, workflow owner identified and supportive, integration path is clear. Risk 2: the model suggests, but does not decide. Misclassification causes routing delay, not a regulatory breach. Human confirmation preserved. Notice how specific each rationale is. That is the standard."

**Show:** Walk through the three bullets.

**Land the point:** "Each score has evidence. Not opinion. Evidence."

---

## Slide s36 -- Worked example. What could go wrong

**Core message:** Even strong candidates carry risks. Name them early and mitigate each one.

**Say:**
"Even strong candidates carry risks. Name them early. Four risks for this case. Historical labels may be inconsistent if classification rules changed over time. Model may perform poorly on new product categories not represented in training data. Agent adoption may be low if suggestion accuracy is below 85 percent initially. Complaints in Arabic and English may need separate handling or a multilingual model. Each risk has a mitigation: data audit, pilot scope limits, adoption tracking, language testing. Honest risks. Specific mitigations. That is decision-ready."

**Show:** Walk through the bullets.

**Land the point:** "Name the risks. Mitigate each one. No waving away."

---

## Slide s37 -- Estimating financial impact

**Core message:** Use conservative, defensible estimates. Always state assumptions. Prefer a range.

**Say:**
"Executives want numbers. Use conservative, defensible estimates. Hours saved per year: volume times time saved per unit times working days. Cost per hour: fully loaded staff cost. Annual saving in SAR: hours saved times cost per hour. Implementation cost: data prep plus model build plus integration plus governance setup. Payback period: implementation cost divided by annual saving. Always state your assumptions. A range, conservative to optimistic, is always better than a single number. One number looks precise and is always wrong. A range looks honest and is usually useful."

**Show:** Walk across the table.

**Land the point:** "Range over single number. Assumptions always stated."

---

## Slide s38 -- The "not yet" list

**Core message:** Some opportunities are real but not ready. Park them with a defined reason.

**Say:**
"Not every opportunity should be pursued now. Some need preparatory work first. Two park categories. Park because data is not ready: the opportunity is real but the data does not exist in usable form. Recommendation: invest in data collection and labelling, reassess in 6 to 12 months. Park because governance is unclear: the opportunity involves customer-facing decisions where regulatory guidance is still evolving. Recommendation: monitor regulatory developments and build the governance framework now. Parking is a legitimate answer. Weak proposals that ignore these gaps are not."

**Show:** Walk through both cards.

**Land the point:** "Parking is strong. Ignoring is weak. Know the difference."

---

## Slide s39 -- Discussion. AJB opportunity scan

**Do -- read these instructions exactly:**

"Discussion break. Working in pairs, identify three AI opportunities at AJB. For each, complete the opportunity template and assign value, feasibility, and risk scores.

Spend 5 minutes brainstorming, then 10 minutes writing templates. Be specific about the workflow, the data, and the owner. If you cannot name the workflow owner, the opportunity is not ready to assess. Start your timer. 15 minutes total."

**Do:** Run a 15-minute pair exercise. Visit breakout rooms in the last 5 minutes. Push on owner names and data specifics.

**Debrief:** Take one pair's template out loud. Score it publicly. Model the language.

**Land the point:** "Template discipline. Owner names. Data specifics. Hold that standard."

---

## Slide s40 -- Comparing opportunities. Trade-off analysis

**Core message:** Four tiebreakers when two opportunities score similarly.

**Say:**
"When two opportunities score similarly, use these tiebreakers. Speed to pilot: which can be tested in 8 to 12 weeks? Reversibility: which is easier to stop or adjust if results are poor? Visibility: which will build confidence in AI across the bank? Learning value: which teaches the organisation the most about operating AI? Here is the counter-intuitive part. The best first project is often not the highest value. It is the one that builds capability for everything that follows. Pick for learning as well as value."

**Show:** Walk through the numbered bullets.

**Land the point:** "First project is a capability investment. Pick accordingly."

---

## Slide s41 -- Anti-patterns in opportunity selection

**Core message:** Four anti-patterns to name and reject.

**Say:**
"Four anti-patterns to recognise and reject. The trophy project: chosen for executive visibility, not genuine value or feasibility. Overpromise risk. The pet project: pushed by one enthusiastic individual without workflow ownership. The platform play: 'let us build an AI platform first', which delays value and creates cost without a concrete use case. The copycat: 'competitor X is doing it' without understanding their context, data, and results. Name these out loud when you see them. They derail AI programs across every bank."

**Show:** Walk through the bullets.

**Ask:** "Which anti-pattern have you seen in practice? Share one example."

**Land the point:** "Trophy, pet, platform, copycat. Four anti-patterns. Call them out."

---

## Slide s42 -- Framework checkpoint

**Do -- read these instructions exactly:**

"Framework checkpoint. Five questions. Answer in chat or out loud.

1. List the six steps of the opportunity mapping sequence.
2. What are the three scoring dimensions and their scales?
3. What goes on each axis of the prioritisation matrix?
4. Name two valid reasons to 'park' an opportunity.
5. What four tiebreakers help when opportunities score similarly?

Take 2 minutes. Go."

**Do:** 2-minute checkpoint. Call on participants. Revisit any slide the room stumbles on.

**Land the point:** "Good. Time for Lab A."

---

## Slide s43 -- Lab A. Opportunity Mapping (section header)

**Core message:** Apply the framework to 60 candidate opportunities, produce a scored shortlist.

**Say:**
"Lab A. You are about to apply the assessment framework to 60 candidate AJB workflows. Produce a scored shortlist, a prioritisation matrix, and a top 3 with justification. I will read the scenario and instructions in a moment. Keep the framework open. You already know how to score. You just need to do it consistently."

**Land the point:** "Framework first. Consistency second. Let us set the scene."

---

## Slide s44 -- Lab A. Scenario

**Core message:** The COO wants a one-page summary of the top three AI opportunities.

**Say:**
"Scenario. AJB's Chief Operating Officer has asked your team to identify the top three AI opportunities across the bank. You have access to a dataset of 60 candidate opportunities with initial assessments. Your task: review, score, rank, and recommend. The COO wants a one-page summary by end of session. That is the brief. Real constraints. Real output."

**Land the point:** "Executive brief. One page. Decision-ready."

---

## Slide s45 -- Lab A. Instructions

**Do -- read these instructions exactly:**

"Lab A instructions. You have 35 minutes. Work in pairs.

1. Open the dataset `data/ai_opportunities.csv`.
2. Review each opportunity. Validate or adjust the pre-filled scores based on what you know about banking operations.
3. Create a prioritisation matrix, sketch or spreadsheet. Plot each opportunity by value and feasibility, sized by risk.
4. Select the top 3 opportunities and write a brief justification for each, 2 to 3 sentences.
5. Identify one opportunity to 'park' and explain why.

If you finish early, rank the top 3 using the tiebreakers from slide 40.

Click the timer. Go."

**Do:** Start the 35-minute timer. Visit breakout rooms in the last 15 minutes. Push where participants are scoring without evidence.

**Watch for:**
- Scores that do not match the data in the row. Redirect: "Point to the evidence in the record that supports that score."
- Top 3 chosen by intuition. Prompt: "What does the prioritisation matrix say?"
- Missing park recommendation. Require one.

---

## Slide s46 -- Lab A. Required outputs

**Core message:** Four specific deliverables from Lab A.

**Say:**
"Four required outputs from Lab A. A completed scoring table for all 60 opportunities, adjusted with brief rationale. A prioritisation matrix, 2 by 2 grid with opportunities plotted. A ranked top 3 with justification. One 'park' recommendation with reasoning. 35 minutes. Work in pairs. Ready to go."

**Land the point:** "Four deliverables. Non-negotiable. Timer on."

---

## Slide s47 -- Lab A. Assessment rubric

**Core message:** Competent, strong, exceptional bands across scoring, prioritisation, and communication.

**Say:**
"This is the rubric I will use to debrief. Competent: scores assigned with basic logic, top 3 identified, outputs complete. Strong: scores justified with specific evidence, reasoning links to value and feasibility, outputs structured and concise. Exceptional: nuanced trade-offs and explicit assumptions, sequencing and readiness considered, outputs could be presented to the COO with minimal editing. Aim for strong or exceptional. I will quote this rubric in the debrief."

**Show:** Walk across the table.

**Debrief (after timer):**

**Ask:**
- "Which two opportunities made your top 3 and why?"
- "Which one did you park and what would unlock it?"
- "Where did you disagree with the pre-filled scores? Share one example."

**Land the point:** "Good scoring discipline. Evidence over enthusiasm. Now on to governance."

---

## Slide s48 -- Lab B. Governance Assessment (section header)

**Core message:** For your top opportunity, identify governance requirements before deployment.

**Say:**
"Lab B. For your top-ranked opportunity from Lab A, identify the governance, ethics, and compliance requirements that must be satisfied before deployment. The CRO is asking. Your job is to answer. Governance is not abstract. It is a checklist with owners and actions."

**Land the point:** "Governance is a checklist. Owners. Actions. Specific."

---

## Slide s49 -- Governance in banking AI. The non-negotiables

**Core message:** Every AI deployment must address accountability, transparency, fairness.

**Say:**
"Three non-negotiables. Accountability: who owns the AI output? Who can override it? Who is accountable when it is wrong? Transparency: can the output be explained to the affected party? Can auditors trace the decision? Fairness: does the model treat protected groups equitably? Has bias testing been conducted? These three are the minimum bar. If any of the three is unanswered, you cannot deploy. Full stop."

**Show:** Walk through the three cards.

**Land the point:** "Accountability. Transparency. Fairness. All three. Every time."

---

## Slide s50 -- SAMA and regulatory context

**Core message:** Five SAMA expectations frame AI governance at AJB.

**Say:**
"SAMA, the Saudi Central Bank, expects AI risk to be managed within existing operational risk frameworks. Five expectations. Board-level oversight of material AI deployments. Model risk management aligned with international standards. Customer data handling that complies with PDPL, the Personal Data Protection Law. Third-party AI vendor due diligence and ongoing monitoring. Incident reporting for AI-related operational failures. Your recommendation must reference these five explicitly when the use case material. Do not gloss over them."

**Show:** Walk through the bullet list.

**Land the point:** "Five SAMA expectations. Reference them by name when the use case is material."

---

## Slide s51 -- Lab B. Scenario

**Core message:** The CRO requires a governance readiness review before any technical work.

**Say:**
"Scenario. Your top-ranked opportunity from Lab A has been approved for a pilot assessment. Before any technical work begins, the Chief Risk Officer requires a governance readiness review. You will use the governance checklist to evaluate your opportunity against each control requirement. No technical work happens until this review passes. That is how it works in a regulated environment."

**Land the point:** "No technical work until governance clears. That is the rule."

---

## Slide s52 -- Lab B. Instructions

**Do -- read these instructions exactly:**

"Lab B instructions. You have 25 minutes. Work in pairs.

1. Select your top-ranked opportunity from Lab A.
2. Review each row of the governance checklist `data/governance_checklist.csv`. For each requirement, assess: Met, Partially Met, Not Met, Not Applicable.
3. For any 'Not Met' item, write a remediation action and assign an owner role.
4. Identify the three highest-priority governance gaps.
5. Write a one-paragraph governance readiness summary.

If you finish early, map each remediation to a SAMA expectation where relevant.

Click the timer. Go."

**Do:** Start the 25-minute timer. Push participants to name owner roles concretely.

**Watch for:**
- Blanket "Partially Met" answers without explanation. Require specifics.
- Remediation actions without an owner role. Prompt: "Who will do this?"
- Gaps without a risk consequence. Prompt: "What is the actual risk if this remains unfixed?"

---

## Slide s53 -- Lab B. Required outputs

**Core message:** Four required outputs plus a rubric for the debrief.

**Say:**
"Four required outputs. Completed governance checklist with status for each control. Remediation plan for 'Not Met' items with action, owner, timeline. Top 3 governance gaps with brief risk explanation. One-paragraph governance readiness summary. Rubric for the debrief: competent is complete coverage, strong has specific assessments, exceptional has concrete evidence and owner commitments. Aim for strong."

**Show:** Walk through the rubric table briefly.

**Debrief (after timer):**

**Ask:**
- "What was your biggest 'Not Met' gap?"
- "Who did you assign as the owner role, and why?"
- "Would you still recommend this opportunity given the gaps? Why?"

**Land the point:** "Governance is not a blocker. It is a design input. Carry that into Lab C."

---

## Slide s54 -- Lab C. Operating Model Design (section header)

**Core message:** Design the operating model for your top opportunity. Workflow, AI insertion, human review, fallback.

**Say:**
"Lab C. You are going to design the operating model for your top opportunity. How AI fits into the workflow. Who reviews outputs. What happens when the model fails. This is the point where business case becomes operational plan. Get this right and the recommendation becomes concrete. Get it wrong and it stays abstract."

**Land the point:** "Operating model turns ideas into operations. Do it concretely."

---

## Slide s55 -- Lab C. Instructions

**Do -- read these instructions exactly:**

"Lab C instructions. You have 20 minutes. Produce a written workflow description and operating model justification.

1. Draw the current workflow, 5 to 7 steps, from trigger to output.
2. Mark where the AI component will be inserted.
3. Specify the operating model: augment, automate, or customer-facing. Justify your choice using the five factors from slide 23.
4. Define the human review point: who reviews, what they check, and when they override.
5. Describe the fallback: what happens when the AI is unavailable or produces low-confidence output?

If you finish early, estimate the impact on processing time and staffing for the modified workflow.

Click the timer. Go."

**Do:** Start the 20-minute timer.

**Watch for:**
- Workflows that skip the human review point. Push back: "Who checks this before it commits?"
- Fallback logic that is hand-waved. Require a concrete procedure: "If the model is down, what does the operator do?"
- Operating model justifications that cite only one factor. Prompt: "Use all five factors."

---

## Slide s56 -- Lab C. Required outputs

**Core message:** Five required outputs plus an optional stretch.

**Say:**
"Five required outputs. Current-state workflow, 5 to 7 steps. Future-state workflow with AI insertion point marked. Operating model choice with justification. Human review protocol: who, what, when. Fallback procedure. Stretch: estimate the impact on processing time and staffing. This becomes the operational backbone of the capstone recommendation."

**Debrief (after timer):**

**Ask:**
- "Show me where you inserted AI and what you kept human."
- "What is your fallback procedure when the model is down?"
- "What is your human review trigger?"

**Land the point:** "Workflow. Insertion. Review. Fallback. That is the operating backbone."

---

## Slide s57 -- Day 1 reflection

**Do -- read these instructions exactly:**

"Day 1 reflection. Before we close, write short answers to these three questions in your workbook.

1. What was the most important thing you learned today about AI opportunity assessment?
2. Which of the opportunities you assessed surprised you, positively or negatively?
3. What one question about AI governance do you want answered tomorrow?

Take 3 minutes. Chat your answers so I can see them."

**Do:** Run a 3-minute reflection. Read a few answers out loud. Note the governance questions for Day 2.

**Land the point:** "Hold on to your surprise answer. That is often the one that matters most."

---

## Slide s58 -- Day 1 summary

**Core message:** Day 1 taught opportunity, framework, governance readiness. Day 2 turns that into a recommendation.

**Say:**
"Day 1 summary. Today you learned to identify where AI creates banking value, score opportunities using a structured framework, and assess governance readiness. Tomorrow, you will build a full business case, draft an executive recommendation, and present it for peer review. Read the quote. 'The hardest part of AI strategy is not finding opportunities. It is choosing the right one and describing it clearly enough that the bank can act.' Keep that with you. See you tomorrow."

**Show:** Read the quote.

**Land the point:** "Choose well. Describe clearly. That is the job."

---

# DAY 2: Governance and Recommendation

**Day 2 arc:** Examine real cases. Extract governance lessons. Draft the executive recommendation. Peer review and revise. Finalise the capstone.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Cases and critique | 30 min | s59 to s64 |
| Patterns and transition | 10 min | s65 to s66 |
| Applied mission: structure and principles | 20 min | s67 to s68, s70 |
| Lab D: drafting the recommendation | 45 min | s69 |
| Lab E: peer review | 30 min | s71 to s72 |
| Lab F: revision and final submission | 25 min | s73 |
| Rubric alignment | 10 min | s74 |
| Recap, revisit, principles | 20 min | s75 to s78 |
| Module close | 10 min | s79 to s80 |

---

## Slide s59 -- Case Discussion and Critique (section header)

**Core message:** Real-world cases teach the governance lessons that templates cannot.

**Say:**
"Welcome back. Today begins with cases. We examine real-world AI deployments in banking: what worked, what failed, and what governance lessons apply to AJB. Templates are useful, but cases teach the lessons that no framework slide can. Pay close attention."

**Land the point:** "Cases over templates. Today. Let us start."

---

## Slide s60 -- Case 1. Chatbot deployment that failed

**Core message:** Customer-facing AI without escalation and confidence thresholds becomes a reputational liability.

**Say:**
"Case 1. A Gulf bank launched a customer-facing chatbot for account inquiries. Within three months, it was quietly disabled. The bot handled 40 percent of inquiries correctly but gave confidently wrong answers to the other 60 percent. No escalation path was designed. Customers could not easily reach a human. Social media complaints generated reputational damage. Post-mortem: training data covered only routine inquiries, edge cases were not handled, no confidence threshold was set. Lesson: customer-facing AI requires the highest governance bar and a robust fallback. Read that lesson twice."

**Show:** Read the lesson aloud.

**Land the point:** "Customer-facing is highest bar. No exceptions."

---

## Slide s61 -- Case 2. Successful AML surveillance upgrade

**Core message:** Augmentation with a strong feedback loop produces sustainable value.

**Say:**
"Case 2. A Southeast Asian bank implemented ML-enhanced transaction monitoring alongside its existing rules engine. The model identified transaction patterns the rules engine missed, contributing to a 15 percent increase in genuine SAR filings. False positives decreased 30 percent, saving around 12,000 investigator hours per year. Every model alert went through human investigation before any action. The model was retrained quarterly with feedback from investigator decisions. Lesson: augmentation with a strong feedback loop produces sustainable value. That is the pattern."

**Show:** Read the lesson aloud.

**Land the point:** "Augment plus feedback loop equals sustainable. Remember that pattern."

---

## Slide s62 -- Case 3. Credit model bias incident

**Core message:** Proxy discrimination is a governance failure, not a technical accident.

**Say:**
"Case 3. A European bank discovered its AI credit scoring model was systematically under-scoring applicants from certain postcodes, correlating with ethnicity. The model used postcode as a proxy variable. This was not intentional but emerged from training data patterns. Regulatory investigation led to a fine and mandatory remediation. The bank now conducts bias testing across all protected characteristics before any model deployment. Lesson: fairness testing is not optional. Proxy discrimination is a governance failure, not a technical accident. Own that lesson."

**Show:** Read the lesson aloud.

**Ask:** "What proxy variables exist in your environment that could have the same effect?"

**Land the point:** "Fairness testing is not optional. It is a precondition."

---

## Slide s63 -- Case 4. Internal document processing success

**Core message:** Internal, low-risk automation with human verification is the easiest path to value.

**Say:**
"Case 4. A bank deployed NLP-based extraction for trade finance documents. Previously each document required 30 minutes of manual data entry. AI extraction reduced processing to 10 minutes with human verification of all extracted fields. Error rate dropped from 4.2 percent manual to 1.8 percent AI-assisted with human check. Staff redeployed from data entry to exception handling and customer communication. Lesson: internal, low-risk automation with human verification is the easiest path to value. This is usually the right first project."

**Show:** Read the lesson.

**Land the point:** "Internal plus low-risk plus human check. That is the easiest first win."

---

## Slide s64 -- Case critique exercise

**Do -- read these instructions exactly:**

"Case critique. Choose one of the four cases. In your workbook, answer four questions.

1. What operating model was used (augment, automate, or customer-facing)?
2. What governance controls were present or missing?
3. What would you have done differently?
4. Could this scenario happen at AJB? What would prevent or enable it?

Time: 15 minutes. Be specific. Name the control or process gap, not just 'better governance'.

Click the timer. Go."

**Do:** Run a 15-minute critique. Take 2 voices at the end, one success, one failure.

**Land the point:** "Specifics win. 'Better governance' is not an answer. Named controls are."

---

## Slide s65 -- Patterns across the cases

**Core message:** Five contrasting patterns separate success from failure.

**Say:**
"Five patterns across the cases. Success started with a well-defined business problem. Failure started with technology and searched for a problem. Success preserved human review in decision workflows. Failure gave AI direct authority without oversight. Success measured by business outcomes. Failure measured by technical metrics alone. Success designed governance alongside the technical build. Failure added governance after or not at all. Success built feedback loops for continuous improvement. Failure deployed and left unmonitored. Every row is a design choice you make or fail to make."

**Show:** Walk across the table.

**Land the point:** "Every row is a design choice. Make them deliberately."

---

## Slide s66 -- From cases to recommendation

**Core message:** A successful recommendation shows business clarity, technical readiness, and governance design.

**Say:**
"The cases teach that successful banking AI requires three things in equal measure. Business clarity: a specific problem, a measurable outcome, and an identified workflow owner. Technical readiness: available data, a suitable technique, and a realistic integration path. Governance design: accountability, transparency, fairness, monitoring, and a fallback plan. Your executive recommendation must demonstrate all three. A recommendation strong on only one or two dimensions will fail the review."

**Show:** Walk through the three cards.

**Land the point:** "Clarity. Readiness. Governance. All three. In equal measure."

---

## Slide s67 -- Applied Mission. Executive Recommendation (section header)

**Core message:** The capstone is the complete executive recommendation for one AJB initiative.

**Say:**
"Applied mission. You are now going to produce a complete executive recommendation for one AI initiative at AJB. This is the capstone deliverable for the module. Everything you built on Day 1, the opportunity assessment, governance review, operating model, all feeds into this. Take it seriously."

**Land the point:** "Capstone. Everything feeds into this. Serious work."

---

## Slide s68 -- Executive recommendation structure

**Core message:** Six sections. Each concise and evidence-based.

**Say:**
"Your recommendation must follow this structure. Six sections. Each concise and evidence-based. Problem statement: what business problem are we solving, how is it measured today? Recommended use case: what AI application, what technique and operating model? Value case: estimated impact in hours, cost, quality, risk reduction. Feasibility assessment: data readiness, integration requirements, timeline. Risk and governance: key risks, governance controls, regulatory considerations. Pilot proposal: scope, duration, success criteria, decision gate. Six sections. Two pages maximum. We will cover writing principles before you start."

**Show:** Walk down the numbered list.

**Land the point:** "Six sections. Two pages. Discipline."

---

## Slide s69 -- Lab D. Drafting the recommendation

**Do -- read these instructions exactly:**

"Lab D. Drafting time. 40 minutes. Work individually or in pairs.

Using your work from Day 1 (opportunity assessment, governance review, operating model design), draft a two-page executive recommendation.

- Use the six-section structure from the previous slide.
- Every claim must have supporting evidence or a stated assumption.
- Include a one-paragraph executive summary at the top.
- The pilot proposal must include a specific decision gate: what result triggers full deployment, what triggers cancellation.

If you finish early, add a sensitivity paragraph: what assumption is the recommendation most fragile to, and how would you test it in the pilot?

Click the timer. Go."

**Do:** Start the 40-minute timer. Visit participants virtually in the last 15 minutes. Push for specific decision gates.

**Watch for:**
- Recommendations without a decision gate. Require one: "What result at week 8 triggers go? What triggers no-go?"
- Vague value claims. Push for numbers.
- Missing executive summary. Require the first paragraph to state the recommendation.

---

## Slide s70 -- Writing for executives. Principles

**Core message:** Five writing principles: lead with recommendation, quantify, name risks, be specific about next steps, stay short.

**Say:**
"Before you start Lab D, hear the writing principles. Lead with the recommendation. State what you propose in the first paragraph. Do not build up to it. Quantify where possible. Hours saved, SAR amounts, percentage improvements. Ranges are acceptable. Name the risks. Executives distrust recommendations that ignore downsides. Be specific about the next step. 'We recommend a 12-week pilot in the CX department with a go/no-go review at week 8.' Keep it short. Two pages maximum. Use tables and bullet points for density. Now go write."

**Show:** Walk through the bullets.

**Land the point:** "Lead. Quantify. Name risks. Be specific. Stay short. Now write."

---

## Slide s71 -- Lab E. Peer review

**Do -- read these instructions exactly:**

"Lab E. Peer review. 20 minutes. Exchange your recommendation with another team.

Review their work using these criteria:
- Is the problem clearly stated? Specific workflow, measurable current state, named owner.
- Is the value case credible? Conservative estimates, stated assumptions, realistic timeline.
- Are risks identified honestly? Not just technical risks, also organisational, data, and regulatory.
- Is governance adequate? Accountability, fairness, monitoring, and fallback addressed.
- Is the pilot proposal actionable? Scope, duration, success criteria, and decision gate defined.

Provide written feedback, 3 to 5 specific points.

Click the timer. Go."

**Do:** Start the 20-minute timer. Pair teams in breakout rooms if in a virtual setting.

**Watch for:**
- Polite feedback that avoids specifics. Prompt: "What would you actually change?"
- Reviews that miss the governance row. Reroute them back.

---

## Slide s72 -- Lab E. Peer feedback format

**Core message:** Five-point feedback format ensures the review is useful, not polite.

**Say:**
"Use this five-point format for your written feedback. Strongest element: what is the most convincing part of the recommendation? Weakest assumption: what claim is least well-supported? Missing control: what governance or operational control is absent? Feasibility concern: what practical obstacle might block implementation? One improvement: what single change would make this recommendation stronger? Keep each point to 1 or 2 sentences. Be honest. Be specific. Useful beats polite."

**Show:** Walk down the numbered list.

**Land the point:** "Useful beats polite. Every time."

---

## Slide s73 -- Lab F. Revision and final submission

**Do -- read these instructions exactly:**

"Lab F. Revision and final submission. 20 minutes.

Incorporate peer feedback and produce your final recommendation.

- Address each piece of feedback explicitly. Either revise the recommendation or explain why you chose not to.
- Add a 'Peer Review Response' section at the end of your document listing the feedback received and your response to each point.
- Submit your final recommendation as a complete document.

Click the timer. Go."

**Do:** Start the 20-minute timer. Revisions should sharpen, not rewrite.

**Land the point:** "Peer review is not negotiation. It is evidence. Respond to each point explicitly."

---

## Slide s74 -- Recommendation assessment rubric

**Core message:** Five dimensions, three bands each. The rubric tells you what exceptional looks like.

**Say:**
"The final rubric. Five dimensions. Problem definition, value case, governance, pilot proposal, communication quality. For each, competent is readable and complete. Strong is specific and evidence-based. Exceptional is executive-ready without editing. Look across the columns. The difference between strong and exceptional is usually sensitivity to assumptions, concrete owner and timeline commitments, and writing that could be presented to the COO without edits. Aim for exceptional where you can."

**Show:** Walk across the table briefly.

**Land the point:** "Exceptional equals ready for the COO, no edits. That is the bar."

---

## Slide s75 -- Module Recap (section header)

**Core message:** The module's last block consolidates what was learned and what to carry forward.

**Say:**
"Final block. We recap what we covered, what you produced, and how to carry this forward at AJB. Do not skip this block. The carry-forward is what you take back to the bank."

**Land the point:** "Carry-forward matters most. Pay attention."

---

## Slide s76 -- What we covered

**Core message:** Day 1 taught value, framework, governance fundamentals. Day 2 taught cases, recommendation craft, peer review.

**Say:**
"What we covered. Day 1: where AI creates banking value, AI techniques relevant to banking, operating model choices, the opportunity assessment framework, governance readiness fundamentals. Day 2: case studies, patterns of success and failure, executive recommendation structure, peer review and critique, final recommendation with governance controls. Thirteen topics across two days. Each one should now be something you can speak to in a leadership meeting."

**Show:** Walk through both columns.

**Land the point:** "Thirteen topics. All speakable. That is the aim."

---

## Slide s77 -- Revisiting your Day 1 answers

**Do -- read these instructions exactly:**

"Revisit. Return to the three questions you answered at the start of Day 1.

1. Has your view of the best AJB workflow for AI changed? How?
2. Do you see the same barriers, or different ones?
3. How would you now define success for an AI deployment?

Write brief updated answers. Notice what changed in your thinking. 3 minutes. Go."

**Do:** Run a 3-minute reflection. Take 2 voices out loud.

**Land the point:** "Notice the change. That is the module in your own words."

---

## Slide s78 -- Key principles to carry forward

**Core message:** Six principles carry forward into AJB practice.

**Say:**
"Six principles to carry forward. Start with the business problem, not the technology. Score opportunities on value, feasibility, and risk before committing resources. Choose the right operating model for the risk profile of the workflow. Design governance alongside the technical build, not after. Measure by business outcomes, not model metrics. Build capability through well-chosen first projects, not platform investments. Pin these six on your wall at work. They are the whole course in a short list."

**Show:** Walk down the numbered list.

**Land the point:** "Six principles. Entire course. Carry them."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap of learning, outputs, and success indicators.

**Say:**
"Three things. What you learned: how to prioritise AI opportunities using value, feasibility, risk, and governance readiness rather than excitement alone. What you produced: opportunity scoring, governance notes, operating model choices, and an executive recommendation for one AJB use case. What proved success: checkpoint completion, evidence-based trade-offs, peer review quality, and a recommendation strong enough to survive challenge from business and control teams."

**Show:** Point to the three cards.

---

## Slide s80 -- Module 4 complete

**Core message:** Module 4 is complete. The question is not 'Can AI do this?' but 'Should we, can we govern it, what is the safest first move?'

**Say:**
"Module 4 is complete. Module 5 turns prioritised opportunities into operating workflows. The focus shifts from choosing the right AI opportunity to designing the right automation path and controls. Carry forward this question: 'Should we do it, how would we govern it, and what is the safest first move?' If you can answer those three, your next AI proposal will land well. Thank you. Well done. See you in Module 5."

**Land the point:** "Should, govern, safe first move. Three questions. Carry them."

---

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Outputs are complete and legible. Scores assigned. Recommendations written. Basic governance referenced. |
| **Strong** | Scoring rationale is evidence-based. Operating model choice reflects the five-factor framework. Governance gaps identified with owners and actions. Recommendation could be presented to management. |
| **Exceptional** | Recommendation anticipates challenge questions. Assumptions explicit. Decision gate concrete. Governance integrated with SAMA expectations. Could be presented to the COO without edits. |

### Rubric Application

- Apply the Lab rubrics during the debriefs. Quote them out loud.
- In the capstone, weight governance and pilot design as heavily as the value case.
- Reward participants who park or decline weak opportunities. That is strong judgement.
- A beautifully written recommendation with weak governance is not exceptional. Do not elevate style over substance.

## Close Standard

End the module by asking each participant to complete this sentence:

> "The one question I will always ask before recommending an AI initiative at AJB is ..."

Collect responses. Use them to verify the module landed on judgement and governance, not enthusiasm.

## Mixed-Level Delivery Notes

- **Intro route:** Keep participants close to the framework and template. Coverage over depth.
- **Advanced route:** Push on sensitivity, sequencing, and executive framing. Stretch the capstone decision gate.
- **Protect specificity.** Do not let the room substitute buzzwords for named workflows, owners, and evidence.

## Virtual Engagement Checkpoints

- **Day 1:** After s26 and s42, run the checkpoint questions live. Do not skip.
- **Day 1:** After Lab A (s47), have each pair post their top pick in chat with a one-sentence justification.
- **Day 2:** After s66, require each participant to name which of the three dimensions (clarity, readiness, governance) is weakest in their draft.
- **Day 2:** After Lab F (s73), ask each participant to state out loud whether the final recommendation is ready for executive review, yes or no, with one reason.
