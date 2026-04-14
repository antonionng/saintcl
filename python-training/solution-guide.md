# Solution Guide

## How To Use This Guide
- Use this guide during debriefs to calibrate participant answers against the strong-answer shape and common failure modes.
- Do not distribute this guide to participants. It is a facilitator reference, not a marking scheme.
- Adjust expectations based on the cohort's experience level, but hold the analytical standards described here.

## Day 1 | Triage and Transformation

### Lab A | Transaction Extract Triage
**Strong Answer Shape:**
- Row count and distinct `txn_id` count are both reported and compared explicitly
- Null rates are profiled per column, not just as a single aggregate number
- The date range is stated and checked for plausibility (no future dates, no gaps that break continuity)
- At least one plausibility test is applied to amounts, status values, or timestamps
- The risk statement names a specific issue and its downstream consequence, not a generic "data quality is low"
- The fitness-for-use recommendation is conditional: "proceed with caveat X" rather than a flat yes/no

**Common Failure Modes:**
- Reporting row count without checking for duplicate `txn_id` values
- Stating null rates without distinguishing columns where nulls are benign from columns where nulls invalidate analysis
- Writing a risk statement that is vague or unconnected to the profiling evidence
- Declaring the file fit or unfit without stating what would change the judgement

### Lab B | Cleaning Functions
**Strong Answer Shape:**
- `clean_amount()` handles commas, blanks, and non-numeric strings without crashing
- The function returns a consistent type (float or NaN) for every input class
- A markdown note describes what happens for each input category: valid, blank, malformed
- The stretch `clean_channel()` surfaces unmapped values rather than silently dropping or filling them

**Common Failure Modes:**
- Using `try/except` to swallow all errors without logging or surfacing them
- Assuming all blanks are empty strings when some may be whitespace or `NaN`
- Writing a function that works on the sample data but has no documented contract for edge cases
- Silently replacing unknown channel values with a default instead of flagging them

## Day 2 | KPI Logic and Quality Evidence

### Lab C | Customer Quality Checks
**Strong Answer Shape:**
- Duplicate `customer_id` records are identified with counts, not just a boolean "duplicates exist"
- Nulls are profiled in join-critical columns (e.g. `customer_id`, `region`) separately from cosmetic columns
- Invalid region values are listed explicitly
- The highest-risk issue is ranked with a reason tied to downstream analytical impact (e.g. "duplicate customers inflate branch counts")

**Common Failure Modes:**
- Treating all quality issues as equally severe instead of ranking by analytical impact
- Checking for nulls but not for duplicates, or vice versa
- Writing a quality report that lists problems without stating which one matters most
- Missing the distinction between cosmetic issues and issues that would invalidate a join

### Lab D | Branch Performance Summary
**Strong Answer Shape:**
- Each KPI (`txn_count`, `total_fee_sar`, `avg_ticket_sar`) has explicit numerator, denominator, and exclusion logic
- Filter logic is stated in writing, not just implied by the code
- Branches are comparable: the same filters and grain apply to every row
- Stretch: active customer counts use a clear definition (e.g. at least one completed transaction in the period)

**Common Failure Modes:**
- Computing `avg_ticket_sar` as `total_fee / txn_count` without filtering out rejected or reversed transactions
- Failing to state which transaction statuses are included or excluded
- Producing a table where branches with zero transactions are silently dropped instead of shown as zero
- Adding rankings without explaining the sort logic or tie-breaking rule

### Lab E | Regional Product Uptake
**Strong Answer Shape:**
- The denominator for within-region share is explicitly chosen and defended (e.g. total accounts in the region, not total accounts bank-wide)
- The share calculation sums to 100% within each region
- The stretch cohort cut uses opening month as a clean, unambiguous time dimension
- At least one alternative denominator is named and rejected with a reason

**Common Failure Modes:**
- Using bank-wide totals as the denominator, making every region's share tiny and hard to compare
- Computing shares that do not sum to 100% within the chosen grouping level
- Choosing a denominator without acknowledging that a different choice would change the story
- Treating all product families as equally important without noting volume differences

## Day 3 | Executive Insight and ML Handoff

### Lab F | Pack Charts
**Strong Answer Shape:**
- Chart titles state the finding, not just the topic (e.g. "Fee income declined 12% in Q4" rather than "Fee income over time")
- The trend chart uses a line or bar chart with a clear time axis
- The ranking chart sorts by the metric of interest and uses horizontal bars or a clean table
- Stretch: one annotation highlights a specific data point that sharpens the message

**Common Failure Modes:**
- Using pie charts for comparisons that would be clearer as bar charts
- Titles that describe the data ("Transactions by branch") instead of stating the conclusion
- Including too many series or categories, making the chart noisy rather than focused
- Exporting charts without checking that axis labels, legends, and titles are readable at presentation size

### Lab G | Exceptions Table
**Strong Answer Shape:**
- Each flag has a named reason code and an explicit threshold (e.g. "avg_ticket below 10th percentile")
- The shortlist is narrow enough to be actionable, not a long tail of marginal cases
- Branches are prioritised so leadership knows where to look first
- Stretch: a comparison between two threshold approaches shows the sensitivity of the shortlist

**Common Failure Modes:**
- Using arbitrary thresholds (e.g. "below 100") without percentile or business justification
- Producing an exceptions table with no reason codes, making it impossible to triage
- Including too many branches, turning the exceptions table into a full branch list
- Flagging on a single metric without considering whether the branch is small and volatile

### Lab H | ML-Ready Feature Table
**Strong Answer Shape:**
- The table is at the customer level with one row per `customer_id`
- A clear cut-off date is stated and respected; no future-looking features leak into the table
- Each feature can be explained in plain business terms (e.g. "total completed transaction value in the 90 days before cut-off")
- Stretch: at least one leakage risk is named and explained

**Common Failure Modes:**
- Including features derived from data after the cut-off date (target leakage)
- Building features at the transaction level instead of aggregating to the customer level
- Leaving raw dates or string fields in the feature table without encoding or aggregation
- Failing to export assumptions or a data dictionary alongside the table

## Rubric Application
- **Competent**: the participant completed the core tasks correctly and the outputs are clear. Assumptions are stated. The work is usable.
- **Strong**: the participant justified choices, added caveats where appropriate, documented logic, and produced reproducible outputs. Quality evidence accompanies deliverables.
- **Exceptional**: the participant's work is defensible under direct challenge. Alternative explanations are considered. Limitations are specific rather than generic. The participant rejected weaker evidence explicitly.

When in doubt between bands, ask: "Could this output survive a follow-up question from a sceptical stakeholder?" If yes, it is at least Strong. If the participant anticipated the question before it was asked, it is Exceptional.
