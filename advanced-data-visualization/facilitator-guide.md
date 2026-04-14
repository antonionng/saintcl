# Advanced Data Visualization -- Facilitator Guide

**Module 6 | AJB AI and Data Training Programme**

---

## Module Overview

This 3-day module (4 hours per day) builds participant ability to create executive-grade data visualizations for banking contexts. Participants progress from chart selection fundamentals through dashboard composition to complete executive reporting packs. All labs use AJB-contextual datasets.

**Prerequisites:** Participants should be comfortable with basic Python, pandas, and matplotlib from earlier modules.

**Key datasets:** branch_performance.csv (30 rows), customer_metrics.csv (10 rows), regional_data.csv (10 rows).

---

## Delivery Stance

- **Coach, not lecturer.** Spend more time in labs than on slides. Use the deck to introduce concepts, then let participants apply them immediately.
- **Critique is central.** This module succeeds when participants can evaluate visuals, not just create them. Model critique language that is specific, actionable, and respectful.
- **Banking context matters.** Steer examples and discussion toward AJB-relevant scenarios: branch performance, customer segments, regional analysis, board reporting.
- **Show real failures.** The most effective teaching moments come from showing poorly designed charts and asking "what is wrong here?" before showing the fix.

---

## Day 1: Foundations (4 hours)

| Time | Duration | Activity | Slides | Notes |
|------|----------|----------|--------|-------|
| 0:00 | 15 min | Opening and module map | s01-s08 | Set expectations. Emphasise that this module is about decisions, not decoration. |
| 0:15 | 45 min | Chart selection principles | s09-s16 | Walk through each chart type with banking examples. Ask participants to suggest when each applies. |
| 1:00 | 15 min | Break | -- | -- |
| 1:15 | 30 min | Visual hierarchy and colour | s17-s20 | Live demo: take a plain chart and add hierarchy step by step. Show the before/after. |
| 1:45 | 30 min | Guided walkthrough: chart selection | s21-s25 | Work through the branch performance example as a group. Ask participants to vote on chart type before revealing the answer. |
| 2:15 | 15 min | Chart junk and misleading scales | s26-s28 | Show 2-3 real-world examples of misleading charts. Ask "what is wrong?" before explaining. |
| 2:30 | 15 min | Break | -- | -- |
| 2:45 | 60 min | Lab 1 and Lab 2 | s29 | Circulate during labs. Prompt participants who are stuck on chart selection to revisit the selection matrix. |
| 3:45 | 15 min | Day 1 close and preview | s30 | Ask 2-3 participants to share their Lab 1 chart. Use the four-question critique on one example as a model. |

**Common Day 1 challenges:**
- Participants default to pie charts. Redirect to bar charts for comparison tasks.
- Charts lack titles or have generic titles ("Revenue Chart"). Push for insight titles.
- Colour overuse. Remind: grey is the most underrated colour in visualization.

---

## Day 2: Composition (4 hours)

| Time | Duration | Activity | Slides | Notes |
|------|----------|----------|--------|-------|
| 0:00 | 10 min | Day 2 opening | s31 | Brief recap of Day 1 principles. Ask one participant to name the three hierarchy techniques. |
| 0:10 | 35 min | Dashboard architecture | s32-s37 | Walk through dashboard anatomy. Show a real banking dashboard (anonymised) if available. |
| 0:45 | 25 min | Geospatial visualization | s38-s40 | Explain when maps help and when they distract. Show the regional_data.csv on a coordinate plot. |
| 1:10 | 15 min | Break | -- | -- |
| 1:25 | 25 min | Banking dashboard types and common mistakes | s41-s42 | Portfolio views, risk heatmaps, customer health. Ask participants which AJB audience needs which type. |
| 1:50 | 50 min | Lab 4 and Lab 5 | s43-s45 | Lab 4 (wireframe) can be done on paper. Lab 5 (geospatial) requires notebook. Pair participants for wireframe review. |
| 2:40 | 15 min | Break | -- | -- |
| 2:55 | 25 min | Critique methodology and practice | s50-s53 | Teach the four-question framework. Walk through 2 example critiques as a group. |
| 3:20 | 30 min | Lab 6: Visual critique | s52 | Participants critique sample charts individually, then compare with a partner. |
| 3:50 | 10 min | Day 2 close | s54 | Preview the executive reporting mission. Ask participants to think about which datasets they will combine. |

**Common Day 2 challenges:**
- Wireframes are too complex. Remind: 5-7 elements maximum. If it needs a user guide, it has failed.
- Geospatial charts confuse participants who have not used latitude/longitude as axes before. Show a simple example first.
- Critique is too gentle. Model specific language: "The y-axis starts at 50%, which exaggerates the difference between branches" not "the chart could be improved."

---

## Day 3: Storytelling (4 hours)

| Time | Duration | Activity | Slides | Notes |
|------|----------|----------|--------|-------|
| 0:00 | 10 min | Day 3 opening | s62 | Set the frame: today is about building and presenting a complete deliverable. |
| 0:10 | 25 min | Executive communication and storytelling | s63-s66 | Cover action titles, storytelling structures, and presentation anti-patterns. |
| 0:35 | 10 min | Mission briefing | s67-s69 | Walk through the mission requirements and workflow. Answer questions. |
| 0:45 | 60 min | Lab 7: Executive summary page | s70 | Core build time. Circulate and check that KPIs have context (not raw numbers) and charts have insight titles. |
| 1:45 | 15 min | Break | -- | -- |
| 2:00 | 50 min | Lab 8: Complete executive pack | s71 | Participants add segment analysis, regional view, narrative, and recommendation. |
| 2:50 | 30 min | Peer critique (Lab 8 continued) | s72 | Pairs exchange packs. Each person provides 3 specific written suggestions. Allow 10 min for revision. |
| 3:20 | 15 min | Break | -- | -- |
| 3:35 | 20 min | Presentation practice | s73-s74 | 2-3 volunteers present their pack in 3 minutes. Group provides one positive and one improvement per presentation. |
| 3:55 | 5 min | Close | s75-s80 | Recap key principles. Point to the toolkit summary. Thank participants. |

**Common Day 3 challenges:**
- Participants spend too long on individual charts and run out of time for the narrative. Set time checks at 30 min and 50 min.
- Recommendations are vague ("improve performance"). Push for specificity: "Invest in digital adoption for Mass Affluent segment, which has the highest revenue gap between current and potential."
- Presentations describe charts instead of insights. Redirect: "Tell me what to do, not what the chart shows."

---

## Assessment Guidance

- Use the 5-criterion rubric on slide s76. Each criterion scored 1-4 for a total of 20 points.
- Focus assessment on Lab 7 and Lab 8 as the primary evidence.
- Proficient (13-16) is the expected standard. Exemplary (17-20) indicates participants ready for leadership-facing work.
- Developing participants (9-12) need additional practice on chart selection and hierarchy before applying these skills in production.
- Provide written feedback referencing specific rubric criteria, not general impressions.

---

## Close Standard

End each day by asking one participant to name the single most useful concept they will apply immediately. This reinforces transfer and signals that the learning is practical, not theoretical.

End the module by reminding participants that visualization is a skill that improves with practice and critique. Encourage them to apply the four-question framework to every chart they encounter in their daily work.

---

*End of Facilitator Guide -- Module 6: Advanced Data Visualization*

## Mixed-Level Delivery Overlay
- Intro route: hold participants on chart choice, audience fit, and title quality before dashboard complexity.
- Advanced route: use stronger participants for dashboard composition, annotation strategy, and critique depth.
- Cut decorative polish before you cut explanation of why a chart deserves leadership attention.

## Virtual Engagement Checkpoints
- Day 1: review one chart as a group and ask what decision it supports.
- Day 2: pause during dashboard work and challenge participants on hierarchy, clutter, and navigation.
- Day 3: run short spoken readouts so the final visuals are defended, not just shown.
