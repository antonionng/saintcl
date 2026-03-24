# Participant Workbook

## How To Use This Workbook
- Treat each activity as a professional simulation, not only a coding task.
- Complete the core path first, then take the stretch path if time allows.
- Save outputs into the correct `outputs/` folder.
- Write short executive-facing notes, not only code.
- Use the rubrics to assess yourself before each debrief.
- Assume every metric, filter, and chart may be challenged. Be ready to defend your logic.
- Prefer justified conclusions over confident conclusions.

## Performance Bands
- `Competent`: technically correct, clear, and usable.
- `Strong`: well-justified, caveated appropriately, and ready for review.
- `Exceptional`: analytically defensible under challenge, selective in evidence, and clear about limits.

## Day 1 | Triage and Transformation

### Mission Outcome
By the end of Day 1 you should be able to inspect a new banking extract, state whether it is fit for first-pass analysis, and explain the main data risks clearly.

### Lab A | Transaction Extract Triage
Scenario:
A daily transactions extract has arrived and leadership wants to know whether it is usable for a first performance cut.

Objective:
- establish whether the file is analytically usable, partially usable, or not yet defensible

Required artefact:
- `triage_summary`
- one written risk statement
- one recommendation on whether analysis should proceed

Stretch artefact:
- `rejects.csv` with `reason_code`
- one note on how exclusions could distort later analysis

Core tasks:
- load `transactions.csv`
- confirm row count
- confirm distinct `txn_id` count
- profile null rates
- identify the date range
- run one plausibility test on amounts, status values, or timestamps

Stretch tasks:
- isolate duplicate `txn_id` rows
- create a rejects table
- write one escalation note
- state which downstream metrics would be most exposed if the issues were ignored

Rubric:
- Analytical completeness: core checks plus one plausibility test are visible
- Inferential discipline: the risk statement is specific and avoids overclaiming
- Traceability: rejected or escalated rows can be explained with evidence

Reflection:
- What is the biggest reason to trust or distrust this file?
- Which issue is inconvenient, and which issue is genuinely analysis-damaging?

### Lab B | Cleaning Functions
Objective:
- create cleaning logic that is reusable, explicit in contract, and robust to expected variation

Required artefact:
- cleaned amount and channel fields
- one markdown note describing assumptions, failure behaviour, and output expectations

Stretch artefact:
- QC counts for unmapped channel values
- one refinement proposal that would make the function safer in repeated use

Core tasks:
- create `clean_amount()`
- handle commas, blanks, and invalid values
- apply the function to the data
- document what the function returns for malformed inputs

Stretch tasks:
- create `clean_channel()`
- report unmapped values
- improve the wording of any error messages
- explain why surfacing ambiguity is stronger than silently filling values

Rubric:
- Reliability: function behaviour is consistent across valid, blank, and malformed inputs
- Contract clarity: another analyst could reuse the function safely
- Quality awareness: ambiguous or unmapped values are surfaced, not hidden

Reflection:
- What would make another analyst trust your function immediately?
- Which assumption in your function is most likely to fail in production-like data?

### Executive Update Prompt
Finish this sentence:

`The extract is [fit / partly fit / not yet fit] for first-pass analysis because ...`

Add:

`My confidence in that statement is [low / medium / high] because ...`

## Day 2 | KPI Logic and Quality Evidence

### Mission Outcome
By the end of Day 2 you should be able to join bank-shaped tables, create defendable KPIs, and attach quality evidence to your outputs.

### Lab C | Customer Quality Checks
Objective:
- test whether the customer table can support downstream joins without distorting interpretation

Required artefact:
- duplicates and nulls summary
- one ranked judgement on the highest analytical risk

Stretch artefact:
- `dq_report.csv` with pass/fail logic
- one upstream remediation proposal

Core tasks:
- identify duplicate `customer_id` records
- profile nulls in important columns
- list invalid region values
- explain which issue could bias a regional or segment-level result most severely

Stretch tasks:
- export a quality report
- label each check as pass or fail
- write the first issue you would fix upstream
- describe whether the issue is cosmetic, operational, or analytically invalidating

Rubric:
- Coverage: duplicates, nulls, invalid categories, and join-risk implications are checked
- Judgement: cosmetic defects are separated from defects that could invalidate analysis
- Actionability: the output tells the next analyst what to fix first and why

Reflection:
- Which issue would have the biggest effect on a regional report?
- Which issue would be easiest to miss but hardest to undo later?

### Lab D | Branch Performance Summary
Objective:
- create a branch KPI table that is readable and methodologically defensible

Required artefact:
- `branch_kpi.csv`
- one written statement of filter logic

Stretch artefact:
- active customer counts and within-region ranking
- one sensitivity note on how the KPI changes under a different denominator or filter

Core tasks:
- calculate `txn_count`
- calculate `total_fee_sar`
- calculate `avg_ticket_sar`
- state the numerator, denominator, and exclusion logic for each KPI

Stretch tasks:
- add `active_customers`
- rank branches inside each region
- write one management interpretation sentence
- write one challenge question that another analyst might ask about the table

Rubric:
- Definition discipline: each KPI uses explicit filter, numerator, and denominator logic
- Comparability: branches can be compared fairly without hidden grain or exclusion issues
- Defensibility: you can answer at least one challenge question with evidence

Reflection:
- Which KPI would you challenge first if someone else built the table?
- What assumption in your KPI table is the most contestable?

### Lab E | Regional Product Uptake
Objective:
- show product-family uptake by region using a denominator that survives scrutiny

Required artefact:
- `uptake_summary.csv`
- one note defending the denominator choice

Stretch artefact:
- cohort cut by opening month
- one comparison showing how the story changes under an alternative framing

Core tasks:
- count accounts by region and product family
- compute within-region share
- explain why your denominator is the fairest one for the business question

Stretch tasks:
- create an opening-month cohort view
- document denominator choices clearly
- compare your chosen view with one plausible but weaker alternative

Rubric:
- Correct denominator: shares are explainable and alternative denominators are challenged explicitly
- Useful cut: the regional split answers a meaningful business question
- Analytical depth: the stretch path adds comparative insight rather than extra noise

Reflection:
- Which denominator choice would most change the story?
- Which denominator would look plausible to a rushed audience but still be wrong?

### Executive Update Prompt
Use this structure:

`What moved ...`

`What likely drove it ...`

`What quality issue could still change the picture ...`

Add:

`What alternative explanation still remains plausible ...`

## Day 3 | Executive Insight and ML Handoff

### Mission Outcome
By the end of Day 3 you should be able to produce a leadership-ready pack, defend an exceptions table, and hand forward a clean feature set for later modelling.

### Lab F | Pack Charts
Objective:
- create two charts that support clear analytical claims and deserve a place in a leadership pack

Required artefact:
- one trend chart
- one ranking chart
- one sentence per chart stating the claim it supports

Stretch artefact:
- one annotation that sharpens the message
- one subtitle that narrows the intended interpretation

Core tasks:
- choose the best visual for trend movement
- choose the best visual for ranking
- export both charts clearly
- ensure each title communicates the conclusion, not only the topic

Stretch tasks:
- annotate one important point
- improve titles and axis language
- remove one distracting element from each chart on purpose

Rubric:
- Clarity: title and subtitle make the intended interpretation unmistakable
- Decision value: each chart supports a concrete management question
- Discipline: the visual hierarchy is controlled and annotation sharpens rather than distracts

Reflection:
- Why do these two charts deserve leadership attention?
- What would make either chart informative but still not presentation-worthy?

### Lab G | Exceptions Table
Objective:
- produce a shortlist of branches that deserve investigation based on transparent and defensible logic

Required artefact:
- `exceptions.csv`

Stretch artefact:
- ranked shortlist with stronger threshold logic
- one note justifying why your shortlist is not too wide and not too narrow

Core tasks:
- create transparent rule-based flags
- export the shortlist
- add clear reason codes
- explain why each threshold is reasonable for this use case

Stretch tasks:
- use percentile-style thresholds
- prioritise which branches leadership should review first
- compare your shortlist against a noisier alternative rule

Rubric:
- Transparency: each flag has a reason code and threshold logic that can be defended
- Usefulness: the shortlist is narrow enough to action and prioritised logically
- Business relevance: the shortlist matters to leadership, not only to statistical curiosity

Reflection:
- What would make an exceptions file noisy rather than useful?
- Which threshold choice in your logic is most open to challenge?

### Lab H | ML-Ready Feature Table
Objective:
- prepare a customer-level table that is safe for later modelling and clear in scope

Required artefact:
- exported feature table

Stretch artefact:
- assumptions or data dictionary file
- one leakage-risk note

Core tasks:
- create customer-level features
- keep a clear cut-off date
- export the table
- state one plausible modelling use for each major feature

Stretch tasks:
- add definitions or assumptions
- name one leakage risk you avoided
- name one additional leakage risk that still requires monitoring

Rubric:
- Leakage control: the cut-off date is explicit, respected, and checked against at least one counterexample risk
- Field usefulness: each feature can be explained in business terms and linked to a plausible modelling use
- Handoff quality: assumptions, definitions, and scope boundaries travel with the output

Reflection:
- Which feature would you question hardest before modelling?
- Which feature is useful for prediction but hardest to defend from a governance perspective?

### Case Studio | Executive Brief
Team task:
- choose the strongest evidence
- reject weaker evidence and justify that rejection
- assemble a compact performance pack
- deliver a 90-second executive brief under challenge

Scoring criteria:
- insight quality
- evidence quality
- caveat quality
- executive clarity
- methodological defensibility

Band guide:
- `Competent`: the team makes a coherent case with relevant outputs.
- `Strong`: the team makes a defendable case with appropriate caveats and sound output choices.
- `Exceptional`: the team makes a concise, challenge-ready case, rejects weaker evidence explicitly, and shows real control of uncertainty.

Presentation frame:
1. What changed?
2. What likely drove it?
3. What alternative explanation still remains plausible?
4. What should leadership do next?
5. What caveat must remain visible?

## Final Reflection
Complete these prompts before closing:
- One Python-for-data habit I will use immediately:
- One way I will improve how I define metrics:
- One way I will communicate uncertainty more clearly:
- One assumption I will now test before I trust a dataset:
