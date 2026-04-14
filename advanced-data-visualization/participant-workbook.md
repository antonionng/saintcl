# Advanced Data Visualization -- Participant Workbook

**Module 6 | AJB AI and Data Training Programme**

---

## Programme Context

This workbook supports Module 6 of the AJB AI and Data Training Programme. By this stage the focus is no longer only on analysis. It is on communication quality. The module teaches learners how to turn evidence into visuals that are decision-ready for banking leaders.

## Start Here

- Why this module matters: weak visuals create confusion and false confidence. Strong visuals help leaders understand performance, risk, and action priorities quickly.
- Your journey in this module: choose chart forms carefully, create hierarchy, design dashboards, and finish with executive reporting outputs.
- What you will produce: charts, dashboard layouts, critique notes, and leadership-ready reporting packs.
- How validation works: the rubric focuses on chart choice, hierarchy, clarity, and whether the final visual actually supports a decision.

## How To Use This Workbook

This workbook guides you through 8 labs across 3 days. Each lab includes a scenario, objective, required artefacts, tasks, a rubric, and reflection questions. Complete each lab in your Jupyter notebook, save your outputs, and prepare to discuss your work during critique sessions.

**Datasets** are in the `data/` folder. **Notebooks** are in the `notebooks/` folder -- one per day plus a solutions notebook.

Work through core tasks first. Stretch tasks are optional and earn additional recognition in the rubric.

---

## Performance Bands

| Band | Score Range | Description |
|------|------------|-------------|
| Exemplary | 17-20 | Executive-ready visuals. Chart selection, hierarchy, composition, and narrative are all strong. |
| Proficient | 13-16 | Clear, accurate visuals with minor improvements needed to reach executive standard. |
| Developing | 9-12 | Core concepts understood but execution needs refinement in selection or hierarchy. |
| Beginning | 5-8 | Significant gaps in chart selection, labelling, or composition. Additional practice required. |

---

## Day 1: Foundations -- Chart Selection, Hierarchy, and Colour

### Mission Outcome

By the end of Day 1 you can select the right chart type for a given analytical question, apply visual hierarchy to direct attention, and use colour deliberately to support rather than distract.

---

### Lab 1: Chart Type Selection

**Scenario:** The Head of Retail Banking wants to understand branch performance variation across AJB's network. She has 5 minutes in the quarterly review and needs to see the answer immediately.

**Objective:** Select and justify the right chart type for comparing branch revenue, then build it with proper formatting.

**Required artefacts:**
- One chart comparing branch revenue across all 15 branches
- Written justification of chart type choice (2-3 sentences in a markdown cell)

**Stretch artefact:**
- A second chart answering a different question from the same dataset (e.g., satisfaction vs customer count)

**Core tasks:**
1. Load `branch_performance.csv` in the Day 1 notebook.
2. Identify the primary analytical question: which branches lead and trail?
3. Choose the chart type that best answers this question.
4. Build the chart with sorted values, clear axis labels, and units.
5. Add an insight title (not a topic title).

**Stretch tasks:**
1. Add a vertical reference line at the mean revenue level.
2. Colour the top 3 and bottom 3 branches differently from the middle.
3. Create a scatter plot of satisfaction_score vs revenue_sar, coloured by region.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Chart type selection | Type does not match the comparison task | Correct type with basic justification | Optimal type with thoughtful justification and alternatives considered |
| Formatting and labels | Missing axis labels, units, or title | All labels present with correct units | Labels, insight title, reference line, and direct annotations |
| Visual hierarchy | No emphasis; all bars treated equally | Some emphasis through sorting | Clear hierarchy through colour, sorting, and annotation |

**Reflection:**
1. If the audience changed from the Head of Retail to the Board, how would your chart change?
2. What would happen to clarity if you used a pie chart instead? Why?

---

### Lab 2: Visual Hierarchy and Annotation

**Scenario:** An analyst has created a line chart showing monthly transaction volumes for all 6 regions on a single chart. It is unreadable. Your task is to redesign it.

**Objective:** Apply hierarchy and annotation principles to transform a cluttered chart into a clear, focused visual.

**Required artefacts:**
- A redesigned line chart or small-multiple set showing regional transaction trends
- At least one annotation pointing to a key pattern or inflection point

**Stretch artefact:**
- A before/after comparison showing the original cluttered approach vs your redesign

**Core tasks:**
1. Create a simulated monthly transaction dataset (or use branch_performance.csv growth rates as a proxy).
2. Build the "bad" version first: all lines overlapping, rainbow colours, no annotations.
3. Redesign: either highlight 2-3 key regions and grey the rest, or use small multiples.
4. Add an annotation to the most important trend or inflection point.
5. Write an insight title.

**Stretch tasks:**
1. Use small multiples (one panel per region) with shared axes.
2. Add a reference line showing the network-wide average trend.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Hierarchy application | No clear focal line; all lines equally prominent | Key lines highlighted, others muted | Deliberate hierarchy with colour, thickness, and annotation |
| Annotation quality | No annotations | One annotation identifying a key pattern | Annotations that tell the story and add context |
| Readability improvement | Redesign is marginally better than original | Clear improvement in readability | Dramatic improvement; message is immediate |

**Reflection:**
1. At what point does "simplify" become "oversimplify"? Where is the line?
2. When would small multiples be better than highlighting, and vice versa?

---

### Lab 3: Colour and Accessibility

**Scenario:** AJB is preparing a customer-facing annual report. All visuals must meet accessibility standards and use a consistent colour palette.

**Objective:** Design a colour palette suitable for banking visuals and test it for accessibility.

**Required artefacts:**
- A bar chart using your defined colour palette
- A written colour palette specification (primary, supporting, semantic, neutral)

**Stretch artefact:**
- A side-by-side comparison of your chart simulated through a colour-blindness filter

**Core tasks:**
1. Define a 6-colour palette: 1 primary accent, 2 supporting, green/amber/red semantic, 1 neutral grey.
2. Create a grouped bar chart comparing customer_count and revenue_per_customer across segments.
3. Apply your palette to the chart.
4. Verify contrast ratios are sufficient (describe your check in a markdown cell).

**Stretch tasks:**
1. Simulate colour-blindness view and note any issues.
2. Add pattern fills or marker shapes as redundant cues alongside colour.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Palette design | Random or excessive colours | Deliberate palette with documented rationale | Palette includes accessibility testing and cultural considerations |
| Application consistency | Colours used inconsistently across elements | Consistent application across the chart | Palette applied with semantic meaning and visual restraint |
| Accessibility | No accessibility consideration | Contrast checked; major issues avoided | Colour-blindness simulated; redundant cues added |

**Reflection:**
1. Why is red-green the riskiest colour pairing for banking dashboards?
2. How would your palette change for a printed report vs a screen dashboard?

---

## Day 2: Composition -- Dashboards, Geospatial, and Critique

### Mission Outcome

By the end of Day 2 you can design dashboard layouts with clear reading order, create geospatial visualizations for branch analysis, and critique visuals using a structured framework.

---

### Lab 4: Dashboard Wireframe

**Scenario:** The Digital Banking team wants a dashboard to monitor customer segment health. They need to see segment-level KPIs, identify at-risk segments, and track digital adoption progress.

**Objective:** Design a dashboard wireframe on paper, then implement the primary visual in code.

**Required artefacts:**
- A hand-drawn or digital wireframe showing dashboard layout with element annotations
- One implemented chart from the wireframe (the primary visual)

**Stretch artefact:**
- A second implemented chart from the wireframe, styled consistently with the first

**Core tasks:**
1. Define the audience (Digital Banking head) and the primary question.
2. Sketch a wireframe with: KPI tiles (top), primary chart (centre), supporting chart (below), detail table (bottom).
3. Annotate each element with its chart type and the question it answers.
4. Implement the primary chart using customer_metrics.csv.
5. Apply hierarchy, labels, and your colour palette.

**Stretch tasks:**
1. Implement a second chart from the wireframe.
2. Add KPI tile values as formatted text output above the charts.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Wireframe design | Elements listed but no layout logic | Clear layout with reading order annotated | Layout shows deliberate grouping, sizing, and white space |
| Implementation fidelity | Chart does not match wireframe intent | Chart matches wireframe with correct type and labels | Chart matches wireframe and integrates hierarchy, palette, and annotations |
| Audience alignment | Dashboard tries to serve everyone | Dashboard targets a specific audience | Dashboard anticipates the audience's follow-up questions |

**Reflection:**
1. What would you change about your wireframe if the audience were the Board instead of the Digital Banking head?
2. Which element on your wireframe could be removed without losing the main message?

---

### Lab 5: Geospatial Branch Analysis

**Scenario:** The Strategy team is evaluating expansion opportunities across Saudi Arabia. They need a geographic view of AJB's current footprint, showing where the bank is strong and where gaps exist.

**Objective:** Create a geospatial visualization showing regional branch distribution and performance.

**Required artefacts:**
- A bubble map or scatter-based map of Saudi regions with branches sized by customer count
- Colour encoding by growth rate or market share

**Stretch artefact:**
- A second map view showing a different metric (e.g., market share) for comparison

**Core tasks:**
1. Load regional_data.csv in the Day 2 notebook.
2. Create a scatter plot using latitude and longitude as axes (approximating a map).
3. Size bubbles by customer count. Colour by growth_pct.
4. Add region labels directly on or near each bubble.
5. Add a title and legend.

**Stretch tasks:**
1. Add a second colour-coded view for market_share_pct.
2. Annotate the highest and lowest growth regions.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Geographic encoding | Points plotted but no size or colour encoding | Correct size and colour encoding with legend | Size and colour encoding with annotations and insight title |
| Labelling | No region labels | Labels present but overlapping | Labels clear, positioned, and non-overlapping |
| Insight communication | Map shows data but no interpretation | Title states a geographic finding | Map tells a geographic story with annotations and summary text |

**Reflection:**
1. When would a bar chart be more effective than a map for regional comparison?
2. What additional data would make this geographic analysis more useful for expansion planning?

---

### Lab 6: Visual Critique Exercise

**Scenario:** A colleague sends you two charts for an upcoming board presentation. You need to provide structured feedback before the meeting.

**Objective:** Apply the four-question critique framework (Message, Accuracy, Clarity, Action) to identify issues and recommend improvements.

**Required artefacts:**
- Written critique of two sample charts (3-4 sentences each) using the four-question framework
- One sketch or description of a redesigned version for the weakest chart

**Stretch artefact:**
- An implemented redesign of the weakest chart

**Core tasks:**
1. Chart A: A 3D pie chart with 12 slices showing revenue by product category, no labels on small slices.
2. Chart B: A dual-axis line chart with revenue (left axis, SAR) and customer count (right axis) over 12 months, with different scales creating a false visual correlation.
3. For each chart, answer: Message? Accuracy? Clarity? Action?
4. Identify the single most impactful improvement for each.
5. Sketch or describe a redesigned version of the weakest chart.

**Stretch tasks:**
1. Build the redesigned chart in code.
2. Create a before/after comparison with annotations explaining each change.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Framework application | Critique is vague or opinion-based | All four questions answered with specific observations | Critique is precise, references principles, and prioritises improvements |
| Issue identification | Surface-level issues noted | Key accuracy and clarity issues identified | Root cause of visual failure identified with design principle reference |
| Redesign quality | No redesign proposed | Redesign addresses the main issue | Redesign transforms the visual with correct encoding, hierarchy, and annotation |

**Reflection:**
1. Which of the four critique questions is most important for a board presentation? Why?
2. How do you give critique that is specific and actionable without being personal?

---

## Day 3: Storytelling -- Executive Reporting and Applied Missions

### Mission Outcome

By the end of Day 3 you can build a complete executive reporting pack, present findings in under 3 minutes, and revise based on structured peer critique.

---

### Lab 7: Executive Summary Page

**Scenario:** The Head of Retail Banking has asked for a single-page executive summary of AJB performance. She will use it to open the quarterly review meeting.

**Objective:** Build the most important page of an executive reporting pack: the summary page with KPIs and one primary chart.

**Required artefacts:**
- 4 KPI values displayed with comparisons (formatted text or visual tiles)
- One primary chart: branch revenue comparison with target line
- An action title and 1-sentence recommendation

**Stretch artefact:**
- A sparkline or trend indicator alongside each KPI

**Core tasks:**
1. Load all three datasets in the Day 3 notebook.
2. Calculate 4 KPIs: total revenue, average satisfaction, top growth region, highest churn segment.
3. Display KPIs with clear formatting and comparison context.
4. Create a sorted branch revenue bar chart with a target reference line.
5. Write an action title and a 1-sentence recommendation.

**Stretch tasks:**
1. Add sparkline-style trend indicators to the KPI display.
2. Colour-code branches above and below target.

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| KPI design | Raw numbers without context | KPIs with comparison values and labels | KPIs with trend context, formatting, and visual indicators |
| Primary chart | Chart present but lacking hierarchy | Sorted chart with labels and reference line | Chart with hierarchy, colour coding, annotation, and insight title |
| Recommendation | No recommendation | Recommendation stated | Recommendation supported by specific data point from the visual |

**Reflection:**
1. If the Head of Retail asks "what should I worry about?", does your summary page answer that?
2. What is the risk of showing too many KPIs on a summary page?

---

### Lab 8: Complete Executive Reporting Pack

**Scenario:** Building on Lab 7, the Head of Retail now wants the full story: where are we strong, where are we weak, and what should we do about it?

**Objective:** Create a multi-page executive reporting pack with connected narrative across 4-5 visuals.

**Required artefacts:**
- Executive summary page (from Lab 7, refined)
- Segment analysis chart (revenue per customer vs churn rate)
- Regional growth chart (bubble or bar, showing geographic patterns)
- Written narrative connecting the three views (3-5 sentences)
- Closing recommendation (2-3 sentences)

**Stretch artefact:**
- A heatmap showing branch satisfaction by region
- A 3-minute presentation outline

**Core tasks:**
1. Refine your Lab 7 summary page based on any feedback.
2. Create a segment analysis chart using customer_metrics.csv.
3. Create a regional growth chart using regional_data.csv.
4. Apply a consistent colour palette and annotation style across all visuals.
5. Write a narrative that connects the three views into a coherent story.
6. Write a closing recommendation supported by evidence from the visuals.

**Stretch tasks:**
1. Create a branch satisfaction heatmap using branch_performance.csv.
2. Outline a 3-minute presentation of your pack (30-second intro, 90-second evidence walk, 30-second recommendation, 30-second question).

**Rubric:**

| Criterion | Developing (1) | Proficient (2) | Exemplary (3) |
|-----------|----------------|-----------------|----------------|
| Visual consistency | Charts use different styles, colours, or formatting | Consistent palette and formatting across charts | Unified visual language with deliberate hierarchy across the full pack |
| Narrative connection | Charts are independent with no connecting story | Written narrative links the charts logically | Narrative builds a clear argument from summary to evidence to recommendation |
| Executive readiness | Pack presents data without interpretation | Pack states findings and supports with evidence | Pack leads with recommendation, supports with evidence, anticipates questions |

**Reflection:**
1. If you had to cut your pack from 4-5 visuals to 2, which would you keep and why?
2. What is the difference between presenting data and telling a data story?

---

## Quick Reference: Four-Question Critique Framework

1. **Message:** What is the first thing you see? Is that the intended message?
2. **Accuracy:** Is the data represented honestly? Are scales, labels, and comparisons fair?
3. **Clarity:** Can the audience understand this in under 10 seconds without explanation?
4. **Action:** Does this visual lead to a decision or just present data?

---

## Quick Reference: Chart Selection Matrix

| Analytical Task | First Choice | Alternative |
|----------------|-------------|-------------|
| Compare categories | Bar chart | Dot plot |
| Show trend over time | Line chart | Area chart |
| Explore relationship | Scatter plot | Bubble chart |
| Show composition | Stacked bar | Treemap |
| Reveal distribution | Histogram | Box plot |
| Show intensity/density | Heatmap | Choropleth |
| Show flow/process | Sankey | Funnel |

---

*End of Participant Workbook -- Module 6: Advanced Data Visualization*

## Delivery Routes

### Intro Route
- Focus on clean chart choice, explicit audience fit, and strong chart titles before adding complexity.
- Finish the core visuals and justification notes before attempting dashboard polish or advanced layouts.
- Use the stretch path only after your first visuals are decision-ready.

### Advanced Route
- Use stretch time for stronger dashboard composition, annotation, and storytelling hierarchy.
- Test whether each advanced visual choice improves clarity rather than noise.
- Use critique rounds to explain why your final design choices are worth the added complexity.

## Virtual Pacing Reminders
- Expect frequent critique pauses. Visual judgement improves through discussion and iteration.
- Finish at least one strong chart early so you have something stable to refine later.
- If time tightens, protect chart clarity and explanation before optional embellishment.
