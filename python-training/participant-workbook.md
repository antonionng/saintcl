# Participant Workbook

## How To Use This Workbook
- Follow the deck and notebook together.
- Complete the core task before attempting the extension path.
- Save outputs into the suggested `outputs/` folders.
- Write assumptions in plain language, not just in code comments.

## Day 1 Workbook
### Exercise A: Transaction extract triage
Scenario: a daily transactions extract has arrived and leadership wants an early view of whether it is usable.

Core tasks:
- load `transactions.csv`
- confirm row count
- confirm distinct `txn_id` count
- profile null rates
- identify the date range

Extension tasks:
- identify duplicate `txn_id` rows
- create a small rejects table with `reason_code`

Debrief notes:
- What was the first sign of risk in the dataset?
- Which field needs the most careful cleaning?

### Exercise B: Cleaning functions
Core tasks:
- create `clean_amount()`
- handle commas, blanks, and invalid values
- apply it to the transactions data

Extension tasks:
- create `clean_channel()`
- report unmapped channel values

Debrief notes:
- What would make another analyst trust your function?

## Day 2 Workbook
### Exercise C: Customer quality checks
Core tasks:
- identify duplicate `customer_id` records
- profile nulls in key columns
- list invalid region values

Extension tasks:
- export a `dq_report.csv`
- add pass or fail logic

### Exercise D: Branch performance summary
Core tasks:
- calculate `txn_count`
- calculate `total_fee_sar`
- calculate `avg_ticket_sar`

Extension tasks:
- add `active_customers`
- rank branches within region

### Exercise E: Regional product uptake
Core tasks:
- count accounts by region and product family
- compute within-region share

Extension tasks:
- create an opening-month cohort view
- document denominator choices

Debrief notes:
- Which metric definition caused the most discussion?
- Which join was easiest to get wrong?

## Day 3 Workbook
### Exercise F: Pack charts
Core tasks:
- create one trend chart
- create one ranking chart
- export both for the final pack

Extension tasks:
- annotate a key point
- improve chart titling and labels

### Exercise G: Exceptions table
Core tasks:
- create transparent rules for branch exceptions
- export `exceptions.csv`

Extension tasks:
- rank exceptions within region
- document rule thresholds clearly

### Exercise H: ML-ready feature table
Core tasks:
- create customer-level features
- export a feature table
- keep a clear cut-off date

Extension tasks:
- add assumptions or a data dictionary
- write one leakage risk you avoided

Debrief notes:
- Which chart deserves a place in a leadership pack and why?
- Which feature would you challenge before modelling?

## Final Reflection
Complete these prompts before the close:
- One Python pattern I will reuse:
- One data-quality habit I will apply:
- One thing I will explain more clearly in future analysis:
