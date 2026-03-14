# Facilitator Guide

## Module Snapshot
- Audience: mixed technical banking cohort across analysts, engineers, and AI or ML staff
- Duration: 3 days, 4 hours per day
- Delivery mode: live online facilitation with shared screen, chat, and practical notebook work
- Core case: regional retail performance request that evolves into a leadership-ready pack

## Delivery Principles
- Keep the rhythm tight: concept, demo, exercise, debrief.
- Anchor everything to business questions, not syntax alone.
- Use the core and extension split consistently.
- Pause for group checkpoints after each exercise block.
- Reinforce safe handling habits every day: minimal fields, pseudonymised IDs, clear caveats.

## Pre-session Checklist
- Open `index.html` in a browser and confirm keyboard navigation works.
- Confirm the notebooks open in Jupyter with the supplied data files.
- Test the timer buttons and notes toggle in the deck.
- Confirm the `outputs/` folders are writable.
- Prepare breakout pairing guidance for mixed-ability participants.

## Day 1 Facilitation Notes
### Key messages
- Python is a practical daily tool for bank data work.
- Reproducibility matters as much as correctness.
- Triage is the first move whenever a new extract arrives.

### Where to slow down
- Data types for identifiers versus numeric values.
- Reading CSV safely with required columns.
- Function design and helpful error messages.

### Debrief prompts
- What did your triage summary reveal first?
- Which field would you trust least and why?
- What makes a cleaning function reusable rather than one-off?

## Day 2 Facilitation Notes
### Key messages
- DataFrames let us answer business questions at scale.
- Joins and groupby logic are powerful but need discipline.
- Quality artefacts increase trust in the analysis.

### Where to slow down
- First customer and accounts merge.
- Distinct counts versus row counts.
- Denominator definition for percentage outputs.

### Debrief prompts
- What caused the biggest confusion in your join logic?
- Which KPI needs the clearest definition?
- If leadership challenged one number, how would you defend it?

## Day 3 Facilitation Notes
### Key messages
- Charts are part of the answer, not the whole answer.
- Exceptions logic must be transparent.
- Handoff quality matters for BI, reporting, and ML teams.

### Where to slow down
- Chart selection and title writing.
- Exception logic and reason codes.
- Leakage awareness in the feature table.

### Debrief prompts
- Why did you choose those visuals for management?
- What caveat most changes your interpretation?
- Which feature would you trust least in an ML handoff and why?

## Suggested Timing
### Day 1
- Opening and setup: 20 minutes
- Foundations and triage: 65 minutes
- Functions and error handling: 65 minutes
- Labs and recap: 90 minutes

### Day 2
- Restart and recap: 15 minutes
- NumPy and Pandas loading: 45 minutes
- Cleaning, joins, and groupby: 95 minutes
- Labs, QC, and close: 85 minutes

### Day 3
- Restart and charting basics: 40 minutes
- Exceptions and pack outputs: 80 minutes
- ML handoff and interpretation: 70 minutes
- Final recap and discussion: 50 minutes

## Mixed Ability Guidance
- Pair a confident coder with a participant who is newer to Python for the first lab of each day.
- Ask experienced participants to take extension tasks, not to jump ahead on the core task.
- If the room is struggling, cut optional clinics before cutting core debrief time.

## Common Failure Modes
- Environment issues at the start of day 1. Fix immediately before teaching further.
- Join explosions on day 2. Reframe around grain and key uniqueness.
- Overloaded charts on day 3. Push participants toward fewer, clearer visuals.

## Expected Outputs By End Of Module
- `outputs/day1/` triage summaries and cleaning examples
- `outputs/day2/` KPI and quality artefacts
- `outputs/day3_pack/` charts, exceptions, features, and assumptions

## Close-out Prompt
Ask each participant to finish with one sentence:

`The first Python-for-data habit I will apply in my role is ...`
