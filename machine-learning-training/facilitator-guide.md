# Module 2 | Machine Learning Training -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed technical banking cohort, Al Jazira Bank |
| Duration | 3 days, 4 hours per day |
| Delivery | Live online, shared screen, chat, lab and discussion |
| Slides | 80 (s01 to s80) |
| Labs | 3 main labs plus case discussion and capstone recommendation |
| Core arc | From ML problem framing and baseline models to governance, deployment thinking, and executive-ready recommendations |
| Prerequisite | Module 1: Python for Data, or equivalent pandas fluency |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` in the browser and verify keyboard navigation works
- [ ] Open the participant notebook with the service tickets dataset and run all cells
- [ ] Confirm datasets are in place: `service_tickets_ml.csv`, `customer_segments.csv`, `model_governance_scenarios.csv`
- [ ] Test timer buttons and poll interactions in the deck
- [ ] Prepare breakout pairing list for mixed-ability pairs
- [ ] Have the participant workbook and solution guide open for reference
- [ ] Test screen share with slides and notebook side by side
- [ ] Prepare a short recap of what participants produced in Module 1 so you can draw the bridge clearly

## Delivery Stance

- Keep the module anchored to banking decision quality, not abstract model theory.
- Connect every metric, model choice, and governance control to a real operational or risk consequence.
- Treat evaluation and explainability as boardroom communication topics, not only data science topics.
- Prioritise judgement over technique. A participant who chooses the right metric for the wrong reason has not learned the lesson.
- Use participant mistakes as teaching moments. Most learning happens when a recommendation is challenged.
- Resist the temptation to demonstrate advanced techniques. The goal is confident, defensible fundamentals.
- Model the communication standard you expect. Explain your own examples in plain language first.

---

# DAY 1: Framing, Supervised Learning, Evaluation

**Day 1 arc:** Frame a banking problem so it suits machine learning. Build a baseline classifier. Evaluate it with metrics that actually map to cost and action.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and value map | 15 min | s01 to s01b |
| Why ML matters and outcomes | 15 min | s02 to s05 |
| Regulation and positioning | 15 min | s06 to s07 |
| Workflow and use cases | 15 min | s08 to s09 |
| Problem framing and fundamentals | 25 min | s10 to s13 |
| Splits, leakage, and leakage examples | 20 min | s14 to s16 |
| Features, missing data, encoding, scaling | 25 min | s17 to s20 |
| Baselines and first classification workflow | 20 min | s21 to s22 |
| Metrics, confusion matrix, thresholds | 30 min | s23 to s28 |
| Evaluation checklist | 5 min | s29 |
| Lab 1: build and evaluate a baseline classifier | 30 min | s30 |

---

## Slide s01 -- Title slide

**Core message:** This module is about judgement, not algorithms. By the end you will be able to recommend a model path that leadership can actually act on.

**Say:**
"Welcome to Module 2. Machine Learning Training. Over the next three days we are going to learn how to frame a banking problem for machine learning, build baseline models, compare them properly, and recommend a path to leadership. This is not a module about chasing the most sophisticated algorithm. It is a module about making good judgement calls with data. If you leave here able to defend your choices under challenge, we have done our job."

**Show:** Point to the three info cards: duration, dates, format.

**Land the point:** "Three days. Real banking problems. Real recommendations. Let us get started."

---

## Slide s01a -- How this module creates value

**Core message:** This module creates value in three places: the decisions it changes, the controls it fits, and the leadership-ready outputs it produces.

**Say:**
"Here is how this module creates value. On decisions: we are going to be very clear about which banking action actually changes because of a model output. On controls: we match metrics, monitoring, and governance to regulated use cases. On outcomes: we turn technical evaluation into recommendations that leadership can act on. If any one of those three is missing, the model may be technically impressive and still operationally useless."

**Show:** Walk through the three cards: Decisions, Controls, Outcomes.

**Ask:** "Think about a model or dashboard you have seen in your work. Did it actually change a decision? Or did it just get admired?"

**Land the point:** "A model that does not change a decision is not helping the bank. Keep that in mind all three days."

---

## Slide s01b -- Choose your learning route

**Core message:** There are two paths through the module. Both lead to the same set of defensible outputs.

**Say:**
"Two routes through the module. If you are newer to ML, stay on the intro path. Prioritise baseline workflows, metric interpretation, and plain-language reasoning. That is a strong result. If you are more experienced, use the stretch prompts to go deeper on threshold tuning, richer comparisons, and stronger monitoring design. Both routes produce the same deliverables. The difference is depth, not scope."

**Show:** Point to both cards: intro path and advanced path.

**Land the point:** "Choose your route now. I will check in after Lab 1 to make sure you are on the right one."

---

## Slide s02 -- Why machine learning matters in banking

**Core message:** ML is useful when a task is repetitive, data-rich, and important enough to justify disciplined monitoring.

**Say:**
"Before we touch any algorithm, let us talk about why ML matters in a bank. ML helps banks detect patterns, prioritise action, reduce manual effort, and improve consistency. It is useful when three things line up. The task repeats often. There is enough data to learn from. And the decision is important enough that monitoring and governance are justified. If any of those three is missing, you probably do not need ML. You need a rule or a report."

**Show:** Walk through the three cards: Revenue, Risk, Service.

**Ask:** "Which of these three areas do you think has the strongest ML use case at your bank today?"

**Land the point:** "Not every problem is an ML problem. Part of the job is knowing the difference."

---

## Slide s03 -- What you will be able to do by the end

**Core message:** By the end of the module, you will be able to frame, prepare, evaluate, govern, and recommend an ML path to leadership.

**Say:**
"By the end of the module, you will be able to do five things. Frame a banking problem so it actually suits machine learning. Prepare features, labels, and evaluation sets with less leakage risk. Evaluate supervised and unsupervised models using business-relevant metrics. Discuss fairness, monitoring, governance, and deployment clearly. And recommend a path to leaders without overselling your confidence. That last point is important. Overclaiming is one of the fastest ways to lose trust."

**Show:** Walk through the five numbered outcomes.

**Land the point:** "Five outcomes. All five matter. Let us look at how we get there."

---

## Slide s04 -- The three-day learning journey

**Core message:** Day 1 is framing and evaluation. Day 2 is clustering and comparison. Day 3 is deployment and communication.

**Say:**
"Here is the arc of the module. Day 1 is framing. We talk about labels, features, baselines, and classification metrics. You will build your first baseline model. Day 2 moves into clustering, model families, and the comparison discipline. We introduce governance questions properly. Day 3 is about deployment thinking, monitoring, and executive communication. The capstone is a real recommendation for an AJB use case."

**Show:** Point to each of the three day cards in order.

**Land the point:** "Framing, then comparison, then recommendation. Order matters."

---

## Slide s05 -- What you will produce and how we will judge it

**Core message:** You will produce four artefacts and we will judge them on decision fit, leakage control, governance thinking, and leadership readiness.

**Say:**
"Here is what you are producing and how we will judge it. On outputs: problem framing and target definition, baseline and comparison outputs, segmentation and governance reasoning, and a deployment and leadership recommendation. On validation: we look at whether your target is clear and your leakage control holds, whether your metrics match the banking decision, whether governance and ownership appear, and whether the recommendation is suitable for leadership. These are not separate boxes. They connect."

**Show:** Walk through both columns: Outputs and Validation.

**Land the point:** "If your reasoning is only in your head, it is not finished. Let us set up the banking context."

---

## Slide s06 -- What changes in a regulated environment

**Core message:** In banking, accuracy is not the only question. Auditability, fairness, ownership, and escalation also matter.

**Say:**
"Here is something I want you to remember all three days. In banking, accuracy is not the only question. You also need auditability. Can we explain how the score influences action? You need lineage. Can we show what data was used and when? You need monitoring. Can we detect drift, failure, or bias quickly? And you need human oversight. Can a person intervene before harm scales? A model that cannot answer those four questions cannot be deployed."

**Show:** Point to each of the four bullet questions in turn.

**Ask:** "In your current environment, which of those four questions is hardest to answer?"

**Land the point:** "Accuracy without governance is not enough in banking. Remember that."

---

## Slide s07 -- Machine learning versus rules and BI

**Core message:** Rules are for stable explicit logic. BI is for visibility. ML is for complex patterns in repeated decisions.

**Say:**
"Let us position ML properly. Rules are good when logic is explicit, stable, and easy to maintain. If you can write down the logic in a sentence, use a rule. BI and reporting are good when you need visibility, trends, and human-led interpretation. People make the decision. Machine learning is good when patterns are too complex for manual rules and the decision repeats often enough to justify the machinery. ML is not better than rules or BI. It is different."

**Show:** Walk through the three cards.

**Land the point:** "Pick the right tool for the right job. ML is one option, not the default."

---

## Slide s08 -- The end-to-end machine learning workflow

**Core message:** The workflow has eight steps and starts with the business decision, not the algorithm.

**Say:**
"Here is the end-to-end workflow. Step one: define the decision and business objective. Step two: define label, horizon, and unit of analysis. Step three: assemble and validate features. Step four: create train, validation, and test sets. Step five: build baselines and candidate models. Step six: evaluate against business trade-offs. Step seven: document assumptions, risks, and controls. Step eight: deploy, monitor, and retrain when needed. Notice where we start. With the decision. Not with the model."

**Show:** Walk down the numbered list slowly.

**Land the point:** "The first two steps are where most ML projects are won or lost."

---

## Slide s09 -- Banking use cases by ML problem type

**Core message:** The three main problem types in banking are classification, regression, and clustering.

**Say:**
"ML problems in banking fall into three types. Classification: is this transaction fraud? Will this customer churn? Will this ticket breach SLA? Regression: what is the expected balance? How many tickets next week? What recovery value? Clustering: which customers behave alike? Which branches share a pattern? Most of what you see in banking is classification. That is why we start there today."

**Show:** Point to the three cards.

**Ask:** "For each type, give me one banking example that is not on the slide."

**Land the point:** "Classification, regression, clustering. Know which one your problem is."

---

## Slide s10 -- What makes a good ML problem statement

**Core message:** A good ML problem statement is decision-led, specific, and names the trade-off.

**Say:**
"This is one of the most important slides of Day 1. A good ML problem statement is decision-led. It states what action will change, what the model predicts, over what time horizon, for which unit, and what trade-off matters most. Look at the example. 'Predict which service tickets are likely to breach SLA within 24 hours so supervisors can intervene earlier, with recall prioritised over precision.' Every part matters. The action is 'supervisors intervene'. The prediction is 'likely to breach'. The horizon is '24 hours'. The trade-off is 'recall over precision'. That is a decision-ready problem statement."

**Show:** Read the example slowly, pointing to each part as you call it out.

**Ask:** "Take a banking problem you know. Can you state it in this format right now? Someone volunteer."

**Land the point:** "If you cannot state the problem in this format, the project is not ready to start."

---

## Slide s11 -- Features, labels, targets, and observations

**Core message:** An observation is one row. The label is what you want to predict. Features are the inputs that exist before the prediction moment.

**Say:**
"Let us lock down the language. An observation is one row. It might be a customer, an account, a transaction window, or a support case. The label, also called the target, is the outcome you want to predict. Features are the input columns used to predict the label. The most important sentence on this slide is at the bottom. Features must exist before the prediction moment, not after it. If a feature only becomes known after the label event, it is not a feature. It is leakage."

**Show:** Point to the observation and label cards, then highlight the sentence about prediction moment.

**Land the point:** "Observation, label, feature. These words will come up all three days."

---

## Slide s12 -- Common banking data sources for ML

**Core message:** The raw material for banking ML sits across six common sources.

**Say:**
"Here is where banking ML data usually comes from. Customer master and demographics. Accounts, balances, and product holdings. Transactions and channel activity. Service tickets and complaints. Branch, region, and campaign context. And repayment or collections history. Different problems need different combinations. Fraud needs transactions. Churn needs transactions plus service. Default needs accounts plus repayment."

**Show:** Walk down the bullet list.

**Land the point:** "Know which sources your problem needs before you touch any code."

---

## Slide s13 -- Business context before modelling

**Core message:** Before writing code, ask what action changes, who owns it, and what the cost of being wrong is.

**Say:**
"Before you write a single line of modelling code, answer three questions. Who acts on the output? Not the model. The human or system downstream. How often is the prediction refreshed? Daily, hourly, real time? And what is the cost of being wrong? That cost shapes everything else, including the metric you choose. If you cannot answer these three questions, you are not ready to model."

**Show:** Walk through the three cards: Owner, Cadence, Cost.

**Ask:** "Who owns the action is often the hardest to answer. Why do you think that is?"

**Say:** "Because sometimes no one owns it yet. And if no one owns the action, the model score goes nowhere."

**Land the point:** "Owner, cadence, cost. Answer all three before you code."

---

## Slide s14 -- Train, validation, and test sets

**Core message:** The training set teaches. The validation set tunes. The test set is the final untouched check.

**Say:**
"Three sets. The training set teaches the model. The validation set helps you compare and tune. The test set is the final, untouched check of likely real-world performance. If you use the test set repeatedly while tuning, it stops being a real test. It becomes part of the training process and your reported performance becomes too optimistic. This is a discipline thing, not a technical thing."

**Show:** Point to the discipline card.

**Land the point:** "Protect the test set. Use it once, at the end."

---

## Slide s15 -- Why leakage breaks trust

**Core message:** Leakage happens when the model sees information that would not exist at prediction time. It fakes performance.

**Say:**
"Leakage happens when your model sees information that would not exist at prediction time. It creates scores that look impressive in development but collapse in production. There are three common sources. Using post-outcome data as a feature. Aggregations that look ahead in time. And data preparation steps fitted on the full dataset rather than only on the training portion. Leakage is the single most common reason a banking ML project fails after go-live."

**Show:** Walk through the three bullet sources of leakage.

**Land the point:** "Leakage is not a bug. It is a discipline failure. Now let us look at how it shows up in real banking data."

---

## Slide s16 -- Leakage examples in banking datasets

**Core message:** Look at two concrete leakage examples so participants can recognise the pattern.

**Say:**
"Two concrete examples. On the bad feature side: 'collections contact count in the next 30 days' as a feature for predicting default risk today. That future count only exists after the default window, so the model sees the answer. On the bad join side: joining a complaint status that was updated after escalation into a model predicting which tickets escalate. The status change is the outcome you are trying to predict. These are easy to miss because both data points exist in your warehouse. The discipline is asking: when does this data point become true?"

**Show:** Point to the two cards: Bad feature and Bad join.

**Ask:** "Can anyone give me another leakage example from banking? What data becomes known only after the event?"

**Land the point:** "For every feature, ask: would this exist at prediction time? If no, remove it."

---

## Slide s17 -- Feature types and preprocessing choices

**Core message:** Different feature types need different treatment. Get the basics right before you get fancy.

**Say:**
"Four types of features. Numeric: balance, income, count. Scale them if your model family needs it. Categorical: region, channel, segment. Encode them. Date: open date, last activity. Turn them into age or recency, not raw strings. Text: ticket subject. Use text features only with clear purpose. Most of the time text is over-engineered. Get the basics right before you add text or embeddings."

**Show:** Walk across the feature type table row by row.

**Land the point:** "Basics first. Fancy features second. Usually never."

---

## Slide s18 -- Missing data strategies for ML

**Core message:** Three strategies: drop, impute, flag. Each fits a different missingness situation.

**Say:**
"Three strategies for missing data. Drop: use when missingness is tiny and low risk. Impute: use median, mode, or domain logic carefully. And flag: sometimes missingness itself is informative. A missing phone number might tell you something about the customer relationship. The important thing is to pick the strategy deliberately and document it, not by accident."

**Show:** Walk through the three cards.

**Land the point:** "Drop, impute, or flag. Pick deliberately. Document what you did."

---

## Slide s19 -- Encoding categories carefully

**Core message:** Models need numeric input. Encoding can create false order or explode dimensionality if done carelessly.

**Say:**
"Models need numeric input. Categorical features like branch region or account type must be encoded. Three rules. One: use one-hot encoding for most nominal categories. Two: use ordinal encoding only when the order is real. If you ordinal encode 'region' as 1, 2, 3, you just told the model that region 3 is worth three times region 1. That is wrong. Three: group rare categories before they explode your feature space."

**Show:** Walk through the three rules.

**Land the point:** "Encoding is not a clerical task. It is a modelling decision."

---

## Slide s20 -- Scaling and standardisation. When it matters

**Core message:** Scale for distance-based and gradient-based models. Tree-based models usually do not need it.

**Say:**
"Scaling matters for some models and not others. Distance-based and gradient-based models often behave better when features are on comparable scales. Tree-based models usually do not care. Rule of thumb: scale for logistic regression, k-nearest neighbours, SVM, and k-means. It is usually optional for decision trees and random forests. Forgetting to scale is a common reason a logistic regression looks weak for no obvious reason."

**Show:** Point to the rule of thumb card.

**Land the point:** "If the model family cares, scale. If not, do not bother."

---

## Slide s21 -- Baselines before sophistication

**Core message:** A baseline forces you to ask whether complexity is actually earning its keep.

**Say:**
"Always start with a baseline. A baseline forces you to ask whether complexity is actually earning its keep. Three good baselines. The majority class baseline: always predict the most common class. A simple logistic model. And the current manual rule benchmark, which is often the real operational competitor. If your sophisticated model beats the majority class by two percentage points, you do not have a case for deployment. You have a rounding error."

**Show:** Point to the three bullet baselines.

**Ask:** "Why would the current manual rule be the most important baseline to beat?"

**Say:** "Because that is what you are actually replacing."

**Land the point:** "Beat a sensible baseline before you talk about deploying anything."

---

## Slide s22 -- The first baseline classification workflow

**Core message:** A baseline workflow is four steps: split, fit, predict, report.

**Say:**
"Here is the baseline workflow in code. Split the data using `train_test_split`. Fit a logistic regression. Predict on the test set. Print a classification report. That is it. Four lines of modelling. Simple. Readable. Honest. Do not write 200 lines of code before you write these four. Get a baseline running first, then decide what to improve."

**Show:** Walk through each of the four code lines in order.

**Land the point:** "Baseline first. Then improvements. Never the other way round."

---

## Slide s23 -- Accuracy is not enough

**Core message:** In imbalanced banking problems, accuracy can be misleading. It may look strong while missing the rare cases.

**Say:**
"Here is a trap. Accuracy can be misleading. If only 2 percent of your cases are fraud, a model that predicts 'not fraud' every time is 98 percent accurate and completely useless. In banking, the cases you care about are often rare. Fraud is rare. Default is rare. Complaints that escalate are rare. Accuracy is the wrong metric for rare-event problems. We need better tools."

**Show:** Point to the example card.

**Ask:** "Why is 98 percent accuracy in that example actually bad?"

**Land the point:** "Do not report accuracy alone. Ever. In banking, it hides more than it shows."

---

## Slide s24 -- Precision, recall, and F1

**Core message:** Precision is about what you flagged. Recall is about what you caught. F1 is the balance.

**Say:**
"Three metrics that do not lie in imbalanced problems. Precision: of the cases we flagged, how many were truly positive? If you flag 100 transactions as fraud and 80 actually are, precision is 80 percent. Recall: of all true positives, how many did we catch? If there were really 200 fraud cases and you caught 80, recall is 40 percent. F1 is the balance when both matter. Different banking problems weight these differently. Fraud usually cares about recall. Customer messaging usually cares about precision."

**Show:** Walk through the three cards.

**Ask:** "In a collections model, which would you prioritise: precision or recall? Why?"

**Land the point:** "Precision, recall, F1. Know which one your problem rewards."

---

## Slide s25 -- Confusion matrix walkthrough

**Core message:** The confusion matrix is the most concrete way to discuss model errors with a non-technical stakeholder.

**Say:**
"Look at this table. Four cells. True positives and true negatives are what the model got right. False positives and false negatives are the two kinds of mistake. This is the most concrete way to discuss errors with a non-technical stakeholder. When leadership asks 'how good is the model?', you point at this table and say 'the model correctly flagged X of the real cases and missed Y, and incorrectly flagged Z that were not really positive'. That is a conversation leadership can actually join."

**Show:** Walk through each of the four cells.

**Land the point:** "Use the confusion matrix with leadership. It is the simplest honest picture."

---

## Slide s26 -- Thresholds and business trade-offs

**Core message:** The threshold decides when you act. Lowering it catches more positives but creates more false alarms.

**Say:**
"Most models produce probabilities, not yes or no. The threshold decides when you act. Lowering it usually catches more positives but also creates more false alarms. This is not a data science decision. It is a business decision. Collections may prefer higher recall, meaning catch more likely default. Fraud operations may tune by alert handling capacity, because analysts can only review so many cases per hour. Customer messaging may require higher precision, because you do not want to send a churn-save offer to a happy customer."

**Show:** Walk through the three bullet examples.

**Land the point:** "Thresholds are a business dial, not a default setting."

---

## Slide s27 -- False positives and false negatives in banking

**Core message:** Every model error has a cost. Know which one hurts more for your problem.

**Say:**
"Every error has a cost. A false positive means you intervened on the wrong case. Customer friction, wasted analyst time, lost revenue. A false negative means you missed the case you needed to catch. Fraud loss, default, churn, SLA breach. Different banking problems weight these costs differently. Before you choose a threshold, you need to know which one hurts more. This is a conversation to have with the business owner, not to resolve in a notebook."

**Show:** Point to both cards side by side.

**Ask:** "In a fraud detection model, which error is usually more expensive, a false positive or a false negative? Why?"

**Land the point:** "Know the cost of each error type before you tune the threshold."

---

## Slide s28 -- ROC and PR curve intuition

**Core message:** ROC curves compare ranking quality. PR curves are more useful when the positive class is rare.

**Say:**
"Two curves. ROC curves show how well the model ranks positives above negatives across all thresholds. They are useful when classes are balanced enough to compare ranking quality. Precision-recall curves become especially important when the positive class is rare and your operational focus is on the positives. For most banking problems involving rare events, the PR curve is more informative than the ROC curve. Pick the curve that fits your class balance."

**Show:** Point to the slide content and explain each curve type in one sentence.

**Land the point:** "PR curves for rare events. ROC when classes are more balanced."

---

## Slide s29 -- Model evaluation checklist

**Core message:** Six questions to ask before signing off on any model evaluation.

**Say:**
"Six questions to ask before you sign off on a model. Is the target and horizon clearly defined? Is there leakage risk? Is the split strategy realistic? Are metrics aligned to operational cost? Has a baseline been compared? Are caveats documented for leadership? If you cannot answer yes to all six, the evaluation is not complete. This list is on the first page of every good model review I have ever seen."

**Show:** Walk down the numbered list slowly.

**Land the point:** "Six questions. Every time. No shortcuts."

---

## Slide s30 -- Lab 1. Build and evaluate a baseline classifier

**Do -- read these instructions exactly:**

"Here is your first lab. You are going to build a baseline classification workflow using the service tickets dataset, evaluate it, and explain the precision and recall trade-off for a banking action.

Your steps are:
1. Open the notebook and load `service_tickets_ml.csv`.
2. Define your target. The target is 'breach within 24 hours'. Write the definition in a markdown cell.
3. Split the data using `train_test_split`, setting a random state so your results are reproducible.
4. Fit a logistic regression baseline.
5. Print the classification report and confusion matrix.
6. Write three sentences: what the model is catching, what it is missing, and what threshold you would recommend and why.

Your output is: target definition, split logic, baseline metrics, a confusion matrix, and a recommendation on threshold logic.

If you finish early, compare the logistic baseline against a simple decision tree and note which one you would take forward.

You have 30 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer. Monitor chat. Visit each participant or pair virtually during the last 10 minutes.

**Watch for:**
- Participants who skip the target definition and jump straight to code. Redirect them. The target is the hardest part.
- Precision and recall reported without interpretation. Push for the business meaning.
- Models that use leakage features accidentally. Ask: "Would that feature exist at prediction time?"
- Any claim of "high accuracy" without checking base rates.

**Debrief (after timer):**

**Say:** "Time is up. Let me hear from three people."

**Ask:**
- "What was your target definition? Read it out loud exactly."
- "What was your precision and recall? Which one matters more for this decision?"
- "What threshold would you recommend, and why?"

**Land the point:** "Good work. You built a baseline, evaluated it honestly, and spoke about the trade-off in business terms. That is exactly what a model review sounds like. Tomorrow we move into unsupervised learning, comparison, and governance."

---

# DAY 2: Unsupervised Learning, Comparison, Governance

**Day 2 arc:** Learn unsupervised segmentation. Compare supervised model families honestly. Introduce governance as a design constraint, not an afterthought.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Day 1 recap and unsupervised framing | 10 min | s31 to s32 |
| Segmentation in banking | 10 min | s33 |
| Clustering workflow and feature design | 20 min | s34 to s35 |
| Distance intuition, k-means, cluster count | 20 min | s36 to s38 |
| Interpretation and cluster risk | 15 min | s39 to s40 |
| Lab 2: customer segmentation studio | 30 min | s41 |
| Supervised model families | 15 min | s42 |
| Linear, trees, ensembles | 20 min | s43 to s45 |
| Bias variance, underfitting, overfitting | 15 min | s46 to s47 |
| Cross-validation and fair comparison | 15 min | s48 to s49 |
| Feature importance and explainability | 15 min | s50 to s51 |
| Governance, fairness, monitoring | 25 min | s52 to s55 |
| Model risk and audit | 15 min | s56 to s57 |
| Lab 3: compare two candidate models | 30 min | s58 |
| Case discussion and Day 2 close | 15 min | s59 to s60 |

---

## Slide s31 -- Day 1 recap and reset

**Core message:** Four habits from Day 1 must carry forward all week.

**Say:**
"Good morning. Before we move on, let us fix the Day 1 habits. Good ML starts with a decision, not an algorithm. Leakage and weak splits can fake performance. Metrics only matter if they map to cost and action. Baselines prevent unnecessary complexity. These four habits are not just for Day 1. They apply every day you work with models. Carry them forward."

**Show:** Walk down the four bullets slowly.

**Land the point:** "Four habits. Keep them close. Now let us move into unsupervised learning."

---

## Slide s32 -- What unsupervised learning is for

**Core message:** Unsupervised learning finds structure when you do not have labels. Useful for grouping and exploration.

**Say:**
"Supervised learning needs labels. Unsupervised learning does not. Unsupervised learning helps when you do not have labels but still want to find structure. In banking, that often means grouping customers, accounts, or behaviours to guide strategy and intervention. It is exploratory by nature. You are asking 'what patterns live in this data?' rather than 'can I predict this specific outcome?'."

**Land the point:** "No labels. Just structure. Let us see how that applies to banking."

---

## Slide s33 -- Segmentation in a banking context

**Core message:** Segmentation supports customer strategy, service design, and risk insight.

**Say:**
"Segmentation in banking usually serves one of three purposes. Customer strategy: discover patterns in balance, usage, and engagement to tailor offers. Service design: group tickets or journeys to improve operations. Risk insight: find unusual behavioural groups worth deeper analysis. Each purpose changes the features you choose and how you evaluate usefulness."

**Show:** Walk through the three cards.

**Ask:** "Which of those three segmentation purposes is most active at your bank today?"

**Land the point:** "Segmentation is not one thing. It depends on the purpose. Now let us look at the workflow."

---

## Slide s34 -- Clustering workflow overview

**Core message:** The clustering workflow has six steps and starts with the business question, not the algorithm.

**Say:**
"Six steps. Define the business question. Select features that describe behaviour meaningfully. Scale when required. Run candidate cluster solutions. Interpret clusters in business language. Validate usefulness, stability, and actionability. Notice the first step and the last step. They bookend the technical work. If the business question is weak, the clusters mean nothing. If the validation is skipped, you do not know whether the clusters hold up."

**Show:** Walk down the numbered list.

**Land the point:** "Question first. Validation last. The technical parts go in the middle."

---

## Slide s35 -- Feature selection for segmentation

**Core message:** Good segmentation features describe stable behaviour or value. Bad features reproduce noise or identifiers.

**Say:**
"Feature selection for segmentation is different from feature selection for prediction. Good segmentation features describe stable behaviour or value over time. Average balance. Digital activity rate. Product diversity. Complaint frequency. Salary inflow regularity. Branch dependence. Bad segmentation features simply reproduce noise, one-off campaigns, or identifiers. A customer ID in the feature set is not a feature. It is leakage."

**Show:** Point to the examples card.

**Land the point:** "Behaviour and value. Not identifiers. That is your segmentation feature guide."

---

## Slide s36 -- Distance and similarity intuition

**Core message:** Clustering groups observations close together in feature space. Inconsistent scales or noise ruin it.

**Say:**
"The intuition behind most clustering methods is distance. Observations that are close together in feature space get grouped. Simple idea. But it breaks if your scales are inconsistent. A feature measured in millions will dominate a feature measured in dozens. It also breaks if noisy features drown out the real signal. That is why scaling and feature choice matter so much for clustering."

**Land the point:** "Distance groups things. Bad scales and noise break the grouping."

---

## Slide s37 -- K-means explained simply

**Core message:** K-means picks cluster centres, assigns observations, and repeats until stable.

**Say:**
"K-means is the most common clustering method. It starts with candidate cluster centres. It assigns each observation to the nearest centre. Then it updates the centres based on the new assignments. It repeats until the assignments stop changing. That is the entire algorithm. Four lines of code using scikit-learn. Look at the snippet. `n_clusters=4` asks for four clusters. `random_state=42` makes the result reproducible. That is it."

**Show:** Walk through the code.

**Land the point:** "K-means is simple. The discipline around it is what matters."

---

## Slide s38 -- Choosing the number of clusters

**Core message:** Use elbow and silhouette as input. Prefer solutions that are interpretable and operationally distinct.

**Say:**
"How many clusters? The honest answer is: it depends on the business question. Elbow and silhouette methods give you mathematical guidance, but they are inputs, not verdicts. Always prefer solutions that are interpretable and operationally distinct. A mathematically neat segmentation of 27 clusters is useless if the business cannot describe or act on any of them. A slightly looser five-cluster solution that everyone understands is far more valuable."

**Show:** Walk through the three bullets.

**Land the point:** "Mathematical neatness loses to operational clarity. Always."

---

## Slide s39 -- Interpreting clusters for business use

**Core message:** Weak interpretations list feature values. Strong interpretations describe the customer group in business terms.

**Say:**
"Look at the two examples. Weak: 'Cluster 2 has higher values on features 4 and 7.' That is useless. Strong: 'This cluster represents digitally active salary customers with low service friction and high cross-sell potential.' That is a segment you can talk about in a business meeting. The translation from feature space to business language is where the real value appears. If your segments have no names and no stories, they are not finished."

**Show:** Point to both interpretation cards.

**Land the point:** "Name the segments. Tell their story. Or you have done nothing useful."

---

## Slide s40 -- Cluster risk and misuse

**Core message:** Clusters are descriptive, not moral categories. Do not treat them as permanent or use them blindly.

**Say:**
"Important caution. Clusters are descriptive, not moral categories. They tell you about patterns in data at a point in time. They are not identities. Do not treat segments as permanent. Do not use them without checking for sensitive bias. Do not assume the segment that looked stable in January still looks stable in July. Segmentation needs refreshing, governance, and care."

**Land the point:** "Segments are snapshots. Treat them that way."

---

## Slide s41 -- Lab 2. Customer segmentation studio

**Do -- read these instructions exactly:**

"This is Lab 2. You are going to create a segmentation proposal and explain which customer groups the bank should treat differently.

Your steps are:
1. Load `customer_segments.csv` and inspect the feature set.
2. Select the features you believe describe stable behaviour or value. Write a one-sentence rationale for each feature you kept or dropped.
3. Scale the features you kept.
4. Fit a k-means model with three to six clusters. Pick a count you can justify.
5. Create a segment summary table showing each cluster's defining characteristics.
6. Write one business action per segment. What would the bank do differently for each group?

Your output is: feature choice rationale, chosen cluster count, segment summary table, and one business action per segment.

If you finish early, test a different cluster count and compare which is more operationally useful.

You have 30 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer. Visit participants virtually. Push them to name their segments.

**Watch for:**
- Participants who include customer ID or timestamp as a feature. Redirect immediately.
- Segments with no business action. Ask: "If you told the business about this segment, what would they do tomorrow?"
- Mathematically neat solutions with no interpretation. Push for the narrative.
- Cluster counts chosen purely on silhouette score. Ask: "Can the business describe each one?"

**Debrief (after timer):**

**Ask:**
- "How many clusters did you choose and why?"
- "Read out one segment name and its business action."
- "Which segment was hardest to interpret? What would you do about that?"

**Land the point:** "Good segmentation. Interpretable, named, actionable. Now let us move into supervised model families and comparison discipline."

---

## Slide s42 -- Supervised model families at a glance

**Core message:** Three families dominate banking supervised learning: linear, trees, and ensembles.

**Say:**
"Three families cover most of supervised learning in banking. Linear models: simple and interpretable, but may miss complex patterns. Tree models: flexible and intuitive, but can overfit without controls. Ensembles: often stronger predictive power, but harder to explain and govern. Each family earns its place in different situations. Do not pick the family first. Pick the problem first, then ask which family serves it."

**Show:** Walk across the table rows.

**Land the point:** "Three families. Three trade-offs. Pick based on the problem, not the trend."

---

## Slide s43 -- Linear and logistic models. When simplicity wins

**Core message:** In regulated settings, a simpler but clearer model may beat a stronger but opaque one.

**Say:**
"Simple models are often easier to audit, explain, and monitor. In regulated settings, that is a real advantage. A modestly weaker but far clearer model may still be the better choice. If you cannot explain why the model said yes or no, the business cannot defend the decision when challenged. Never underestimate how much that matters in banking."

**Land the point:** "Simpler is not worse. In banking, simpler is often safer."

---

## Slide s44 -- Tree-based models. Why they are popular

**Core message:** Trees handle nonlinear patterns, mix feature types, need less scaling, and give strong baselines.

**Say:**
"Tree-based models are popular for good reasons. They handle nonlinear patterns well. They work with mixed feature types, numeric and categorical, without lots of preprocessing. They need less feature scaling. And they often provide strong practical baselines. A decision tree is also easy to draw and explain to a non-technical stakeholder. A single tree can be shown on one slide."

**Show:** Walk down the four bullets.

**Land the point:** "Trees are practical. Start with them if linear is not enough."

---

## Slide s45 -- Ensemble intuition. Random forest and boosting

**Core message:** Ensembles combine many trees for strength, but the governance burden rises.

**Say:**
"Ensembles combine many trees to improve stability or predictive power. Random forest averages many trees trained on different samples. Boosting trains trees sequentially, each correcting the previous one. Ensembles are powerful. They also carry more governance burden because their decisions are harder to explain end to end. You can still extract feature importance, but you cannot draw a single decision path."

**Land the point:** "More power. More governance cost. Weigh both."

---

## Slide s46 -- Bias variance trade-off

**Core message:** High bias means too simple. High variance means too sensitive. The job is to manage both.

**Say:**
"Every model sits somewhere on a trade-off. High bias means the model is too simple to capture the signal. It underfits. High variance means the model is too sensitive to the training data. It overfits. Strong model selection is about managing both, not eliminating either. You cannot have zero bias and zero variance. You can only pick a point that works for your problem."

**Land the point:** "Bias and variance. Balance them, do not chase zero on either side."

---

## Slide s47 -- Underfitting and overfitting

**Core message:** Underfitting is bad on train and test. Overfitting is good on train but bad on test.

**Say:**
"Two failure modes you should recognise immediately. Underfitting: poor performance on train and test. The model never learned enough. Overfitting: strong training performance, weak test performance. The model learned the noise. Look at both numbers every time. If train is high and test is much lower, you have overfit. If both are low, you have underfit."

**Show:** Walk through both cards.

**Land the point:** "Compare train and test every time. The gap tells you which failure mode you are in."

---

## Slide s48 -- Cross-validation discipline

**Core message:** Cross-validation gives a more stable sense of performance than a single lucky split.

**Say:**
"Cross-validation reduces the risk of being fooled by one lucky split. Instead of training on one train set and testing on one test set, you rotate through several splits and average the result. It gives a more stable sense of model performance, especially when your dataset is not huge. In banking, most datasets are large enough that cross-validation is affordable and worth doing."

**Land the point:** "One split is a gamble. Cross-validation is a discipline."

---

## Slide s49 -- Comparing models fairly

**Core message:** Fair comparison means holding everything else constant and changing only the model.

**Say:**
"When you compare two models, they must see the same world. Use the same split logic. Use the same target and horizon. Hold preprocessing discipline constant. Compare against the same metric and threshold assumptions. If you change two things at once, you do not know which change caused the difference. This sounds obvious. It is violated constantly. A fair comparison is slower to set up but much more defensible."

**Show:** Walk down the four bullets.

**Land the point:** "Change one thing at a time. Otherwise you are not comparing. You are guessing."

---

## Slide s50 -- Feature importance. Promise and limits

**Core message:** Feature importance shows what the model used. It does not prove causality.

**Say:**
"Feature importance can help explain a model, but it does not automatically prove causality. It shows what the model used, not what the business should assume is truly driving behaviour. A feature can be important because it is correlated with the outcome, not because it causes the outcome. That is a critical distinction for banking. Use feature importance as a starting point for discussion, not as a final causal claim."

**Land the point:** "Important to the model does not mean causal in reality."

---

## Slide s51 -- Explainability versus predictive strength

**Core message:** The most powerful model is not always the best operating choice.

**Say:**
"Sometimes the most powerful model is not the best operating choice. If explainability is required for review, challenge, or customer impact, a slightly weaker but clearer model may be more valuable. This is especially true for decisions that affect customers directly. A customer whose loan is declined deserves an explanation. 'The model said no' is not an acceptable answer. Keep that in mind when you pick a family."

**Land the point:** "Power plus opacity can be a trap in banking. Choose accordingly."

---

## Slide s52 -- Governance questions every model owner must answer

**Core message:** Every model owner must answer five governance questions before going live.

**Say:**
"Five questions every model owner must answer. What decision does the model change? What data enters the model and from where? How is performance measured and monitored? Who owns action when the model drifts or fails? What human review exists for sensitive cases? These are not optional. A model without answers to these five is not ready for production. Write them down at project start, not after go-live."

**Show:** Walk through the five numbered questions.

**Ask:** "Which of those five questions is usually the hardest to answer at your bank?"

**Land the point:** "Five questions. Every model. No exceptions."

---

## Slide s53 -- Fairness and bias in banking decisions

**Core message:** Bias can enter from many sources. Fairness review must happen before and after deployment.

**Say:**
"Bias can enter through the target, the features, the labels, the sampling, the operational history, or the intervention policy. That is a lot of entry points. Fairness review is not something you do once. It happens before deployment and continues after go-live. In banking, the consequences of unfair models are serious. Credit decisions, collections prioritisation, and fraud scoring all have real impact on people."

**Land the point:** "Fairness is a continuous obligation, not a one-off check."

---

## Slide s54 -- Monitoring drift and degradation

**Core message:** Three kinds of drift: data drift, concept drift, outcome drift.

**Say:**
"Three kinds of drift to monitor. Data drift: your inputs change from training conditions. The feature distribution moves. Concept drift: the relationship between input and outcome changes. Fraudsters change tactics. Outcome drift: base rates and operating context move. Default rates rise. All three require different responses. All three should be monitored."

**Show:** Walk through the three cards.

**Land the point:** "Data drift, concept drift, outcome drift. Know the difference."

---

## Slide s55 -- Human oversight and escalation points

**Core message:** Not every model output should lead directly to action. High-impact decisions need review and override logic.

**Say:**
"Not every model output should trigger action automatically. High-impact decisions often need review queues, override logic, and documented escalation rules. A fraud model that automatically freezes accounts has different governance needs than a propensity model that adjusts a marketing audience. The higher the impact, the more human oversight you build in."

**Land the point:** "Higher stakes equal more human review. Design that from the start."

---

## Slide s56 -- Model risk management essentials

**Core message:** Five pillars of model risk: inventory, validation, approval, monitoring, change control.

**Say:**
"The five pillars of model risk management. Inventory and ownership: you know every model in production and who owns it. Validation and challenge: independent review before release. Approval before release: a documented sign-off. Performance monitoring after release: the model is watched, not forgotten. Change control and retirement plan: how models are updated or retired cleanly. A bank that has all five is in good shape. A bank missing any one of them is not."

**Show:** Walk down the five bullets.

**Land the point:** "Five pillars. All five matter."

---

## Slide s57 -- Documentation and audit trails

**Core message:** A strong ML process leaves evidence: dataset version, feature logic, metrics, approvals, monitoring.

**Say:**
"A strong ML process leaves evidence. Dataset version. Feature logic. Split logic. Metrics. Parameter settings. Approval notes. Post-deployment monitoring logs. If you cannot reconstruct what the model was on any given date, the audit will go badly. Documentation is not extra work. It is the work."

**Land the point:** "If it is not documented, it did not happen. Not in banking."

---

## Slide s58 -- Lab 3. Compare two candidate models

**Do -- read these instructions exactly:**

"This is Lab 3. You are going to compare two model approaches for a banking use case and recommend one, keeping both performance and governance in view.

Your steps are:
1. Pick a supervised target from the service tickets dataset. This can be the same target as Lab 1 or a new one.
2. Fit two models. A linear or logistic baseline and a tree-based alternative. Use the same split, the same target, and the same preprocessing.
3. Compare them on precision, recall, F1, and a confusion matrix. Report all four.
4. Write a short governance note. Which one is easier to explain? Which one is easier to monitor? Which failure modes are most likely?
5. Make a recommendation. Pick one model. State two reasons for and one caveat.

Your output is: comparison table, metric rationale, governance caveats, and a final recommendation.

If you finish early, test what happens when you change the threshold on your recommended model. Document how operational load changes.

You have 30 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer.

**Watch for:**
- Comparisons that change more than one thing between the two models. Push back: "Same split, same target, same preprocessing."
- Recommendations based only on metrics. Ask: "What about governance?"
- Missing caveats. Every recommendation must have at least one honest limitation.

**Debrief (after timer):**

**Ask:**
- "Which model did you recommend and why?"
- "What is the honest caveat on your recommendation?"
- "Would your answer change if the bank could not explain individual predictions to customers?"

**Land the point:** "Good comparison work. Notice how quickly this becomes a governance conversation, not just a metric conversation. That is exactly right."

---

## Slide s59 -- Case discussion. When a weaker model is the better choice

**Core message:** Sometimes the simpler model is operationally stronger because it is easier to challenge, audit, and act on.

**Say:**
"Quick case discussion. I want to surface a situation where a simpler, more explainable model is operationally superior to a stronger but opaque one. Think about a credit decisioning context. The stronger ensemble gives two percentage points more F1 but cannot produce per-customer explanations. The simpler logistic model gives two percentage points less F1 but every decision can be explained, challenged, and audited. Which one do you deploy? Why?"

**Do:** Run a short open discussion. Two or three voices.

**Land the point:** "The best model on a leaderboard is not always the best model to deploy. Context wins."

---

## Slide s60 -- Day 2 close. What to carry into deployment thinking

**Core message:** Three habits from Day 2 carry straight into Day 3.

**Say:**
"Three habits to carry into tomorrow. Model comparison is not only a leaderboard exercise. Interpretability and governance affect real deployment choices. Monitoring and ownership must be designed before go-live, not after. Tomorrow we move from model to decision system. See you in the morning."

**Show:** Walk down the three bullets.

**Land the point:** "Rest well. Tomorrow is about making models actually work in production."

---

# DAY 3: Deployment, Communication, Capstone

**Day 3 arc:** Move from model to decision system. Learn what deployment really means, how to monitor, how to communicate to leadership, and how to recommend under challenge.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Reset and deployment reality | 15 min | s61 to s62 |
| Batch versus real-time, input contracts | 15 min | s63 to s64 |
| Monitoring and retraining | 15 min | s65 to s66 |
| Failure modes and incident handling | 15 min | s67 to s68 |
| Third-party models and vendor questions | 15 min | s69 to s70 |
| Executive communication and translation | 20 min | s71 to s73 |
| Executive summary and visual choices | 15 min | s74 to s75 |
| Capstone brief and rubric | 10 min | s76 to s77 |
| Capstone preparation and presentations | 50 min | s78 |
| Module close | 15 min | s79 to s80 |

---

## Slide s61 -- Day 3 reset. From model to decision system

**Core message:** A model alone creates no value. Value appears when the model is embedded in a decision process with ownership and monitoring.

**Say:**
"Welcome back. A model alone creates no value. Value appears when the model is embedded into a decision process with ownership, monitoring, and clear action rules. That shift, from model to decision system, is what today is about. Everything we talk about today sits on top of the technical work you did on Days 1 and 2."

**Land the point:** "Model plus decision system equals value. Model alone equals slide deck. Let us get practical."

---

## Slide s62 -- What deployment actually means in practice

**Core message:** Deployment is four things: controlled environment, defined interfaces, connected scores, and monitored health.

**Say:**
"Deployment is not just pushing a model to production. It is four things. One: move code and data logic into a controlled environment. Two: define interfaces, schedules, and failure handling. Three: connect scores to workflow or queue logic so that someone actually uses them. Four: monitor health, performance, and user response. If you do only step one, the model is deployed but useless. All four steps matter."

**Show:** Walk down the four numbered points.

**Land the point:** "Four steps. Deployment is not over at step one."

---

## Slide s63 -- Batch scoring versus real-time scoring

**Core message:** Batch fits overnight prioritisation. Real time fits decisions during an interaction.

**Say:**
"Two delivery modes. Batch scoring is good for overnight prioritisation, campaigns, and periodic review lists. You run the model once a day and feed the output into a workflow queue. Real-time scoring is good for fraud, alerts, routing, and decisions that must happen during an interaction. The operational and technical cost is different for each. Batch is cheaper and simpler. Real time is more complex but unavoidable for some problems."

**Show:** Point to both cards.

**Ask:** "For a churn model, which mode fits better? Why?"

**Land the point:** "Match the delivery mode to the decision timing, not the other way around."

---

## Slide s64 -- Input contracts and production assumptions

**Core message:** Production systems need explicit contracts on input fields, ranges, and failure behaviour.

**Say:**
"Production needs explicit contracts. Which fields must arrive? Which can be missing? What ranges are valid? What should happen when a feed breaks? These questions feel boring until a feed fails at 3am and no one knows what the model should do. A clear input contract prevents silent failure. It is one of the cheapest ways to avoid an incident."

**Land the point:** "Input contracts are boring documents that save you from embarrassing outages."

---

## Slide s65 -- Monitoring metrics after go-live

**Core message:** Monitor five things: input quality, score distribution, prediction quality, queue size, and business lift.

**Say:**
"Five monitoring metrics. Input quality and schema health. Score distribution stability. Prediction outcome quality over time. Operational queue size and action rate. And business outcome lift versus baseline. The last one is the one people forget. It is not enough that the model runs. It must be creating value. Watch the business lift against a sensible baseline."

**Show:** Walk down the five bullets.

**Land the point:** "Five monitoring dimensions. Missing any one is a gap."

---

## Slide s66 -- Feedback loops and retraining triggers

**Core message:** Retrain when evidence calls for it, not on a fixed calendar schedule alone.

**Say:**
"Retraining should be triggered by evidence, not by habit alone. Drift, degraded performance, new policy, or changed product strategy may all require a refresh. Some teams retrain every month regardless. That wastes effort if nothing has changed, and misses the point when something changes fast. Set retraining triggers. Watch them."

**Land the point:** "Retrain on evidence, not on a reflex."

---

## Slide s67 -- Model failure modes in banking operations

**Core message:** Three failure modes: data failure, logic failure, operational failure.

**Say:**
"Three failure modes. Data failure: broken feeds, stale extracts, schema changes. Logic failure: unexpected feature distributions or hidden leakage. Operational failure: scores generated but no one acts on them. The third is the most common and the most invisible. The model runs fine. The alerts appear. Nobody clicks on them. Value is zero. Monitor the action rate, not just the score rate."

**Show:** Point to each of the three cards.

**Land the point:** "Data, logic, operational. Three failure modes. All three need monitoring."

---

## Slide s68 -- Incident handling and rollback logic

**Core message:** When a model misbehaves, the business needs a clear response: alert, investigate, fallback, document, review.

**Say:**
"When a model behaves badly, the business needs a clear response. Alert. Investigate. Switch to fallback rules. Document the event. Review before returning to service. The fallback is the important part. If you cannot fall back to a simpler rule or a prior model version, the business has no operating option. Build the fallback path before the incident, not during it."

**Land the point:** "Always have a fallback. Always."

---

## Slide s69 -- Responsible use of third-party models

**Core message:** Outsourcing the model does not outsource accountability.

**Say:**
"If you use a third-party model, the model is outsourced but the accountability is not. The bank still needs clarity on data use, drift handling, explainability, human review, and service-level commitments. Do not let a vendor tell you 'the model just works'. That is not an acceptable answer in banking."

**Land the point:** "Accountability does not transfer to a vendor. Act accordingly."

---

## Slide s70 -- Vendor questions for ML platforms

**Core message:** Five questions to ask any ML vendor before signing.

**Say:**
"Five questions for any ML vendor. How is performance measured and monitored? What data leaves the bank? What explainability artifacts are available? What rollback and support process exists? What evidence supports fairness and robustness? Any vendor who cannot answer all five clearly is not ready. Walk away or demand better answers."

**Show:** Walk through the five questions.

**Land the point:** "Five questions. Every vendor. Every time."

---

## Slide s71 -- How to communicate model results to non-technical leaders

**Core message:** Leaders need decision, confidence, risks, and governance. Not parameters.

**Say:**
"Leaders do not need every parameter. They need four things. What decision changes? How much confidence should they place in the result? What risks remain? What governance surrounds the model? If you are talking to a leader and you find yourself explaining hyperparameters, you have lost them. Lift up to the decision level."

**Land the point:** "Decision, confidence, risk, governance. Keep it there with leadership."

---

## Slide s72 -- Translating metrics into decisions

**Core message:** Technical statements must be translated into decision-ready language.

**Say:**
"Here is the translation habit. Technical: 'Recall improved from 0.58 to 0.76.' Decision-ready: 'The model catches more likely breach cases earlier, but supervisors must accept a higher number of false alerts.' Same information. Different audience. The technical version tells a data scientist what happened. The decision-ready version tells a leader what it means for their operation."

**Show:** Point to both cards.

**Ask:** "Someone try it. Translate 'AUC went from 0.72 to 0.81' into decision-ready language."

**Land the point:** "Always translate. Never assume leaders will do the translation for you."

---

## Slide s73 -- Telling the story of uncertainty honestly

**Core message:** Strong communicators do not hide uncertainty. They explain what is strong, what is weak, and what to watch.

**Say:**
"Strong communicators do not hide uncertainty. They explain which assumptions matter, where evidence is strongest, and what should be monitored after rollout. Hiding uncertainty may feel safer in the short term, but it destroys trust the first time something surprises leadership. Honest uncertainty builds more trust than confident overclaiming."

**Land the point:** "Name the uncertainty. Leadership trusts you more for it, not less."

---

## Slide s74 -- Executive summary structure for ML recommendations

**Core message:** A leadership summary has five parts: objective, recommended path, benefit and limitation, governance, pilot scope.

**Say:**
"The executive summary structure. One: business objective and decision context. Two: recommended model path. Three: expected benefit and the major limitation. Four: governance requirements before deployment. Five: pilot scope and success criteria. Five parts. Short. Clear. Decision-ready. This is the structure you will use in the capstone and the structure you should use at work."

**Show:** Walk down the five numbered points.

**Land the point:** "Five-part summary. Learn it. Use it every time."

---

## Slide s75 -- Visuals for model comparison and governance

**Core message:** Use simple metric tables, confusion matrix views, and threshold trade-off charts. Avoid overloaded visuals.

**Say:**
"For visuals, use simple metric tables, confusion matrix views, and threshold trade-off charts. Add clear caveats, ownership notes, and monitoring expectations. Avoid overloaded charts with no decision message. If the chart does not help the leader make a decision, it does not belong in the summary. One chart per point. One point per chart."

**Show:** Walk through the three cards: Use, Add, Avoid.

**Land the point:** "One chart. One point. Decision first."

---

## Slide s76 -- Capstone brief. Recommend a model path for an AJB use case

**Core message:** Participants will receive a case and recommend a full ML approach covering framing, evaluation, governance, and pilot design.

**Say:**
"Here is the capstone. You will receive a business case and recommend an ML approach. Your recommendation must cover six things. Problem statement. Data logic. Candidate model path. Evaluation metric. Governance concerns. Proposed pilot design. You have worked on each of these pieces across the last three days. This is where they come together."

**Land the point:** "Six parts in the recommendation. Show me what you have learned."

---

## Slide s77 -- Scoring bands. Competent, strong, and exceptional

**Core message:** The rubric has three bands. Competent is structured. Strong ties to action. Exceptional anticipates challenge.

**Say:**
"Here is how I am scoring. Competent: your recommendation is logically structured, metrics are broadly sensible, and governance is acknowledged. Strong: your recommendation is clearly tied to business action, trade-offs are explicit, and governance is integrated into the model choice. Exceptional: your recommendation shows disciplined judgement, anticipates challenge questions, and communicates technical nuance in executive-ready language. Aim for strong or exceptional."

**Show:** Walk across the table.

**Land the point:** "Judgement beats technique. That is the scoring bar."

---

## Slide s78 -- Peer review prompts for the capstone

**Do -- read these instructions exactly:**

"This is the capstone session. You have 40 minutes to prepare your recommendation, then 5 minutes to present, then we debrief.

Your recommendation must cover:
1. Problem statement, in one sentence, decision-led.
2. Data logic and leakage controls.
3. Candidate model path, with a named baseline.
4. Evaluation metric and why it matches the banking decision.
5. Governance concerns and monitoring plan.
6. Pilot scope, with a go and no-go criterion.

As you prepare, use these peer review prompts to check your own work:
- Is the decision context clear?
- Is the target and time horizon defensible?
- Are metric choices aligned to operational cost?
- Are governance and monitoring concrete enough?
- Would a senior leader trust this recommendation?

You have 40 minutes to prepare, then each person or team presents for 5 minutes. Click the timer. Go."

**Do:** Start the 40-minute timer. Visit participants virtually in the last 15 minutes to stress-test their governance.

**Watch for:**
- Recommendations without a baseline.
- Metrics chosen without reference to operational cost.
- Missing pilot scope. Push: "How would you start small?"
- Vague governance. Push for specific owners and triggers.

**Presentation round:**

**Do:** After preparation, call on participants or teams. Give each 5 minutes. After each, ask two peer review questions from the list. Give short, honest feedback.

**Land the point:** "Strong recommendations carry weight. Notice how the same structure works across very different banking problems. That is the point."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap learning, outputs, and what proved success.

**Say:**
"Three things to take away. What you learned: how to frame ML problems properly, compare models with discipline, and connect metrics to banking decisions and governance. What you produced: problem framing artefacts, baseline and comparison outputs, segmentation reasoning, governance notes, and a deployment recommendation. What proved success: checkpoint completion, defensible metric choice, explicit caveats, and recommendations that stayed useful for leadership and risk review."

**Show:** Point to the three cards.

---

## Slide s80 -- Module 2 complete

**Core message:** Module 2 is complete. Carry framing, leakage control, metric discipline, and honest communication into Module 3.

**Say:**
"Module 2 is complete. Module 3 explores neural networks. You will carry forward model judgement, evaluation discipline, and governance thinking into more complex architectures. Carry forward four habits. Start with the decision. Protect against leakage. Choose metrics that reflect cost. Communicate uncertainty honestly. These four habits do not change when the model gets bigger. Thank you. Well done. See you in Module 3."

**Land the point:** "The habits you built this week scale all the way up. Keep them."

---

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
- A participant who produces correct metrics but cannot explain them in business terms should not receive "Strong".
- Look for integration in the capstone: does the participant draw on problem framing, evaluation, and monitoring work from earlier labs?

## Close Standard

End the module by asking each participant to complete this sentence:

> "The biggest change I will make in how I evaluate machine learning work is ..."

Collect responses. Use them to gauge whether the module landed on judgement and governance, not only technical fluency.

## Mixed-Level Delivery Notes

- **Intro route:** Hold newer participants on baseline framing, metric choice, and plain-language model interpretation.
- **Advanced route:** Give stronger participants the deeper comparison, threshold, and monitoring stretch prompts.
- **Protect the business explanation in every debrief.** Do not let the room hide behind model jargon.

## Virtual Engagement Checkpoints

- **Day 1:** Stop after target definition (s10) and ask each group to state what business action the model will change.
- **Day 2:** Pause after segmentation (s41) and require one practical use for each segment before moving on.
- **Day 3:** Run a short executive-readout round after s72 so monitoring and governance points are spoken aloud, not just written down.
