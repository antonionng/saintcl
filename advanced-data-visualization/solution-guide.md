# Advanced Data Visualization -- Solution Guide

**Module 6 | AJB AI and Data Training Programme**

---

## Purpose

This guide provides strong answer shapes, common failure modes, and rubric guidance for facilitators assessing participant work. It does not prescribe a single correct answer -- visualization is a design discipline with multiple valid approaches. Focus assessment on whether participants demonstrate deliberate choices backed by sound reasoning.

---

## Lab 1: Chart Type Selection -- Strong Answer Shape

**Strong response:** Horizontal bar chart, sorted by revenue descending. Bars labelled directly. Insight title such as "Dhahran Mall and King Fahd Road lead AJB branch revenue; Tabuk and Al Nakheel trail." Y-axis shows branch names; x-axis shows revenue in SAR millions with gridlines at regular intervals. Top 3 bars in accent colour, bottom 3 in a warning colour, middle in grey.

**Why horizontal bars:** Branch names are long strings. Vertical bars require rotated labels, which are harder to read. Sorting makes the ranking obvious without forcing the viewer to compare bar heights visually.

**Failure modes:**
- Pie chart: unsuitable for 15 categories. Slices are unreadable below 5%.
- Unsorted bars: forces the viewer to scan all 15 bars to find the highest.
- Missing y-axis labels or units: the chart cannot be interpreted without them.
- Generic title ("Branch Revenue"): tells the audience what the chart shows, not what it means.

---

## Lab 2: Visual Hierarchy -- Strong Answer Shape

**Strong response:** Either (a) highlight 2-3 key regions with accent colours and grey the remaining lines, or (b) use small multiples with one panel per region and shared axes. An annotation marks the most significant trend ("Eastern region transactions grew 34% from Jan to Dec, outpacing all others"). Insight title states the key finding.

**Failure modes:**
- All lines remain equally prominent (no hierarchy applied).
- Rainbow colours with no muting strategy.
- No annotation: the viewer must interpret the pattern alone.
- Small multiples with different y-axis scales: makes cross-panel comparison misleading.

---

## Lab 3: Colour and Accessibility -- Strong Answer Shape

**Strong response:** A documented palette with hex codes: one AJB-aligned primary accent, two muted supporting tones, green/amber/red semantic set, and a neutral grey. The chart uses the palette consistently. A markdown cell notes contrast checking approach and acknowledges red-green colour vision risks. Stretch: a simulated colour-blindness view with commentary on any issues found.

**Failure modes:**
- More than 6-7 colours used without justification.
- Red and green used as the only differentiator with no redundant cue.
- No documentation of the palette (colours chosen ad hoc).

---

## Lab 4: Dashboard Wireframe -- Strong Answer Shape

**Strong response:** A wireframe with clear zones: KPI tiles across the top (3-5 metrics), a large primary chart in the centre, 1-2 supporting charts below, and an optional detail table at the bottom. Each element is annotated with its chart type, the question it answers, and its data source. The reading order is top-to-bottom, left-to-right. The implemented primary chart matches the wireframe in type and purpose.

**Failure modes:**
- No clear reading order: elements are scattered without logical grouping.
- More than 7 elements: the dashboard tries to answer too many questions.
- Wireframe and implementation mismatch: the coded chart does not correspond to the wireframe plan.
- No audience specification: the dashboard is designed for "everyone."

---

## Lab 5: Geospatial Analysis -- Strong Answer Shape

**Strong response:** A scatter-based map using latitude and longitude with bubbles sized by customer count (using area, not radius) and coloured by growth_pct using a sequential colour scale. Region names labelled directly on or near each bubble without overlapping. Title states a geographic finding: "Eastern region shows highest growth at 8.3%; Northern region lags at 2.8%."

**Failure modes:**
- Bubbles sized by radius instead of area (exaggerates differences).
- No legend for colour or size encoding.
- Labels overlapping and unreadable.
- Map used when a simple bar chart would communicate the comparison more clearly (acceptable if acknowledged).

---

## Lab 6: Visual Critique -- Strong Answer Shape

**Strong response:** For the 3D pie chart -- critique notes: (1) Message is unclear due to 12 competing slices, (2) 3D distortion misrepresents slice sizes, (3) small slices unlabelled, (4) no actionable insight. Recommendation: replace with horizontal bar chart showing top 5 products, group remainder as "Other."

For the dual-axis chart -- critique notes: (1) Different scales create a false visual correlation between revenue and customer count, (2) the audience may conclude the two metrics move together when the correlation is an artefact of scale choice, (3) two separate charts with shared x-axis would be honest. Recommendation: split into two aligned charts or normalise both metrics to percentage change.

**Failure modes:**
- Critique is vague ("it could be better") without referencing specific visual elements.
- Only surface-level issues noted (e.g., "colours are not great") while missing the accuracy problem.
- No redesign proposed or redesign repeats the same mistakes.

---

## Lab 7: Executive Summary Page -- Strong Answer Shape

**Strong response:** Four KPIs displayed with values and context: "Total Revenue: SAR 200.1M (across 15 branches)", "Avg Satisfaction: 4.1 / 5.0", "Top Growth: Eastern at 8.3%", "Highest Churn: Youth at 8.5%." A sorted horizontal bar chart with a target reference line. Action title: "5 branches exceed SAR 17M target; Tabuk and Al Nakheel need intervention." Recommendation: "Focus retention efforts on Youth segment and invest in digital expansion for Northern branches."

**Failure modes:**
- KPIs shown as raw numbers without comparison context.
- Chart has no reference line or target indicator.
- Title is generic rather than action-oriented.
- No recommendation stated.

---

## Lab 8: Complete Executive Pack -- Strong Answer Shape

**Strong response:** A coherent 3-page narrative: (1) Summary page from Lab 7, refined. (2) Segment analysis showing revenue per customer vs churn rate as a scatter plot, with Youth and Retail Core highlighted as risk segments. (3) Regional growth bubble chart showing Eastern as the growth leader. Consistent colour palette and annotation style. Narrative connects: "Branch revenue is concentrated in Central and Eastern. Customer segment analysis reveals Youth churn is 4x the Premium rate. Regional growth data supports expansion investment in Eastern while addressing Northern underperformance." Recommendation is specific and supported by evidence.

**Failure modes:**
- Visuals use inconsistent colour palettes or formatting.
- No narrative connecting the charts; they function as independent exhibits.
- Recommendation is vague or unsupported by the visuals.
- Pack exceeds 7 pages or includes unnecessary methodology detail.

---

## Rubric Guidance

When scoring, use the 5-criterion rubric from the slide deck (s76). Key calibration notes:

- **Chart selection (1-4):** A score of 3 means the chart type is correct and justified. A score of 4 means the participant considered alternatives and explained why their choice was superior.
- **Visual hierarchy (1-4):** A score of 3 means there is a clear focal point. A score of 4 means the hierarchy guides the viewer through a deliberate sequence of primary, secondary, and tertiary information.
- **Annotation and labelling (1-4):** A score of 3 means everything is labelled with correct units and an insight title. A score of 4 means annotations add narrative context beyond what the chart alone communicates.
- **Dashboard composition (1-4):** A score of 3 means the layout has logical grouping. A score of 4 means the reading order is intuitive and white space is used deliberately.
- **Executive communication (1-4):** A score of 3 means findings are stated and supported. A score of 4 means the pack leads with a recommendation and anticipates the audience's follow-up questions.

Total: 20 points. Proficient threshold: 13. Exemplary threshold: 17.

---

*End of Solution Guide -- Module 6: Advanced Data Visualization*
