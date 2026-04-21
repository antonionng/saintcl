# Module 6 | Advanced Data Visualization -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed banking cohort at Al Jazira Bank |
| Duration | 3 days, 4 hours per day |
| Delivery | Live online, shared screen, chat, pair and team work |
| Slides | 80 (s01 to s80) |
| Labs | Labs 1 through 8 spanning all three days |
| Core arc | From chart selection to executive-grade storytelling and critique |
| Prerequisite | Module 5: Automation in AI, or equivalent familiarity with analytical outputs |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` and verify the slide counter and timer work
- [ ] Confirm `branch_performance.csv`, `customer_metrics.csv`, and `regional_data.csv` are loaded and documented
- [ ] Run the Day 1, Day 2, and Day 3 notebooks end to end
- [ ] Prepare two "bad chart" examples ready to critique on screen
- [ ] Test your colour-blindness simulator so you can demo it live
- [ ] Load the redacted AJB quarterly executive pack you will reference during the applied mission
- [ ] Pre-build the "before and after" example for slide s25
- [ ] Print or display the critique rubric so you can quote from it during Day 3

## Delivery Stance

- Treat every chart as a decision artefact. Never "just a visual."
- Be brutal on chart junk. Praise restraint, not prettiness.
- Default to simpler visuals unless complexity is justified.
- Enforce axis zero, label discipline, and source lines. Quote the rules out loud.
- During critique, protect the work, attack the idea. Model this explicitly.
- Use AJB-specific examples (branches, regions, segments) whenever possible. Keep context real.
- Time-box labs strictly. Iteration is part of the lesson.

---

# DAY 1: Foundations

**Day 1 arc:** Chart selection. Hierarchy. Colour. Annotation. A full guided walkthrough. Lab 1 applies the day's principles.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and orientation | 25 min | s01 to s08 |
| Chart selection | 35 min | s09 to s16 |
| Visual hierarchy, emphasis, annotation | 20 min | s17 to s19 |
| Colour theory | 10 min | s20 |
| Guided walkthrough | 25 min | s21 to s25 |
| Chart junk, scales, typography | 20 min | s26 to s28 |
| Lab 1 briefing and working time | 35 min | s29 |
| Day 1 close | 10 min | s30 |

---

## Slide s01 -- Title slide

**Core message:** This module teaches you to make charts that drive decisions, not decorate reports.

**Say:**
"Welcome to Module 6. Advanced Data Visualisation. Three days. The focus is executive-grade communication. By the end, you will build charts and dashboards that a senior AJB leader could use, today, to make a decision. Not pretty pictures. Decision tools. Let us set the bar now. If a chart does not change what a leader thinks or does, the chart has no business being in the deck."

**Show:** Point to the lede.

**Land the point:** "Charts for decisions. Not decoration. That is the module."

---

## Slide s01a -- What executive-grade visuals need to do

**Core message:** Three jobs: focus attention, reduce noise, drive action.

**Say:**
"Three jobs for every executive-grade visual. Focus attention: guide leaders toward the decision, not just the data. Reduce noise: remove clutter so the chart strengthens trust rather than debate. Drive action: make the next question and likely action easier to see. Every chart you design this week has to pass all three tests."

**Show:** Walk through the three cards.

**Land the point:** "Focus, reduce, drive. Three jobs. Every chart."

---

## Slide s01b -- Choose your learning route

**Core message:** Two routes. Both produce executive-ready output.

**Say:**
"Two routes. Intro path: build fewer charts, but make them cleaner, clearer, and easier to defend. Advanced path: use stretch time for dashboard composition, stronger annotation, and richer storytelling hierarchy. Same deliverables. Depth differs. Pick honestly. I will check in again on Day 2."

**Land the point:** "Pick your route. Then deliver on it."

---

## Slide s02 -- Why executive-grade visuals matter

**Core message:** Every chart either builds trust or erodes it. A misleading chart is worse than no chart.

**Say:**
"Every chart you show a decision-maker either builds trust or erodes it. Strong visuals reduce ambiguity, guide attention, help leaders decide faster. Weak visuals create confusion, false confidence, noisy debate. Read the quote. 'A misleading chart costs more than a missing chart. Silence is better than noise.' Hold that line. If the chart cannot hold up to scrutiny, do not put it in the deck."

**Show:** Read the quote aloud.

**Land the point:** "Silence beats noise. A misleading chart is a liability."

---

## Slide s03 -- Module outcomes

**Core message:** Five concrete outcomes.

**Say:**
"Five outcomes. Choose chart types deliberately based on the analytical question. Build clear narrative hierarchy using size, placement, and annotation. Design dashboards that lead the eye from summary to detail. Apply colour and layout principles suited to banking audiences. Critique visuals systematically and recommend improvements. All five testable. All five feed the capstone."

**Show:** Walk through the five numbered outcomes.

**Land the point:** "Five outcomes. Ladder into the capstone."

---

## Slide s04 -- Three-day learning arc

**Core message:** Foundations, composition, storytelling.

**Say:**
"Three-day arc. Day 1: foundations. Chart selection, hierarchy, colour, annotation. Day 2: composition. Dashboards, geospatial, interactive design, layout architecture. Day 3: storytelling. Executive reporting packs, applied missions, critique, presentation. Each day builds on the last. Miss Day 2 at your peril."

**Show:** Point to the three cards.

**Land the point:** "Foundations, composition, storytelling. Three days. Cumulative."

---

## Slide s05 -- What you will produce and how it is judged

**Core message:** Four outputs and four validation lenses.

**Say:**
"Outputs. Charts with justified selection and hierarchy. Dashboard layouts and critique notes. Banking-specific visual outputs. An executive reporting pack. Validation. Checkpoint completion throughout. Workbook and notebook artefacts completed. Peer critique on clarity and decision support. Final visuals that are readable, defensible, decision-ready. That last phrase is the bar. Readable. Defensible. Decision-ready. Write it on a sticky note."

**Show:** Point to both cards.

**Land the point:** "Readable. Defensible. Decision-ready. That is the bar."

---

## Slide s06 -- Audience types at AJB

**Core message:** Four audiences. Each needs different visuals.

**Say:**
"Four audience types you will design for. Board and C-suite: need strategic direction and exceptions, use summary KPIs, trend lines, red-green signals. Department heads: need performance versus target and root cause, use comparative bars and drill-down tables. Analysts: need granular patterns and outliers, use scatter plots, distributions, faceted views. Regulators: need compliance evidence and audit trail, use clean tables, precise labels, dated sources. Same data, four different presentations. Do not confuse the audiences."

**Show:** Walk across the table.

**Land the point:** "Four audiences. Four presentations. Same data. Do not confuse them."

---

## Slide s07 -- The visualization design sequence

**Core message:** Five steps from audience to review.

**Say:**
"The design sequence. Five steps. Define the audience and the question they need answered. Select the visual form that matches the analytical task. Design emphasis and hierarchy so the main message is immediate. Annotate to eliminate ambiguity. Review for clarity, accuracy, and misuse risk. Use this sequence every time. Shortcuts produce weak charts."

**Show:** Walk down the numbered list.

**Land the point:** "Five steps. Every chart. No shortcuts."

---

## Slide s08 -- Module ground rules

**Core message:** Five ground rules, all non-negotiable.

**Say:**
"Module ground rules. Five of them. Every visual must serve a decision, not decorate a report. Critique is about the work, not the person. When in doubt, simplify. Label everything: axes, units, time windows, sources. Test your visual on someone who was not involved in making it. The last one is easy to skip and catches almost every mistake. Build the habit this week."

**Show:** Walk through the bullets.

**Land the point:** "Five rules. Non-negotiable. Especially the last one."

---

## Slide s09 -- Chart selection principles (section header)

**Core message:** The right chart makes the pattern obvious. The wrong chart hides it.

**Say:**
"New section. Chart selection. The right chart makes the pattern obvious. The wrong chart hides it or distorts it. Chart selection is not about aesthetics. It is about matching the visual encoding to the analytical task: comparison, composition, distribution, relationship, or change over time. Those five tasks are your vocabulary for the next 30 minutes."

**Land the point:** "Comparison, composition, distribution, relationship, time. Five tasks. Match."

---

## Slide s10 -- Comparing categories. Bar charts

**Core message:** Bars for rank and comparison. Always start at zero. Sort by value unless order is natural.

**Say:**
"Bar charts. Use horizontal or vertical bars when the task is 'which category is largest' or 'how do categories rank'. Horizontal bars work best when category labels are long, branch names, product names. Always start the value axis at zero. Truncated axes distort perception of difference. Sort bars by value unless the categories have a natural order, months, ratings. AJB example: comparing revenue across 15 branches, sorted highest to lowest. Boring and effective. That is a feature."

**Show:** Walk through the bullets.

**Land the point:** "Axis at zero. Sort by value. Boring and effective."

---

## Slide s11 -- Showing change over time. Line charts

**Core message:** Lines for continuous sequence. Cap at 4 to 5 lines. Highlight the one that matters.

**Say:**
"Line charts. Lines connect data points in sequence, making trends, seasonality, and inflection points visible. Use lines only when the x-axis is a continuous sequence, time, distance. Limit to four or five lines per chart. Beyond that, use small multiples. Highlight the line that matters most with colour or thickness. Mute the rest. AJB example: monthly transaction volume trends across three regions over 24 months. Three lines is fine. Ten is chaos."

**Show:** Walk through the bullets.

**Land the point:** "Four or five lines. Highlight the story line. Mute the rest."

---

## Slide s12 -- Exploring relationships. Scatter plots

**Core message:** Scatter reveals correlation, clusters, outliers. One point per observation. Colour or size for a third variable.

**Say:**
"Scatter plots. Reveal correlation, clusters, and outliers between two continuous variables. Each point is one observation, a branch, a customer segment, a product. Use colour or size to encode a third variable, region, revenue tier. Add a trend line only when the relationship is meaningful, not to decorate. AJB example: plotting customer satisfaction against digital adoption rate by segment. Scatter is under-used. Consider it whenever two continuous variables are involved."

**Show:** Walk through the bullets.

**Land the point:** "Scatter is under-used. Consider it. Two continuous variables."

---

## Slide s13 -- Showing parts of a whole. Composition charts

**Core message:** Stacked bars for 2 to 4 segments. Treemaps for nesting. Avoid pies for precise comparison.

**Say:**
"Composition. Stacked bars: good for comparing composition across categories, use when there are two to four segments, more segments make stacked bars unreadable. Treemaps: good for hierarchical composition at a glance, use for nested categories, region to branch to product. And the warning. Avoid pie charts for precise comparison. Humans estimate angles poorly. Reserve pies for cases with only two or three segments where the message is 'this one dominates'. If you want to compare slices precisely, use bars."

**Show:** Point to both cards.

**Land the point:** "Stacked for 2 to 4. Treemap for nesting. Pie for domination only."

---

## Slide s14 -- Understanding distribution. Histograms and box plots

**Core message:** Histograms show frequency. Box plots summarise quartiles and outliers. Violins combine both.

**Say:**
"Distribution charts answer: what is the spread, where do most values concentrate, are there outliers. Histograms: show frequency across bins, choose bin width carefully, too few bins hide patterns, too many create noise. Box plots: summarise median, quartiles, outliers compactly, useful for comparing distributions across groups. Violin plots: combine distribution shape with summary statistics. AJB example: distribution of average customer balances across all branches. Know which tool answers which distribution question."

**Show:** Walk through the bullets.

**Land the point:** "Histogram for shape. Box plot for comparison. Violin for both."

---

## Slide s15 -- Density and intensity. Heatmaps

**Core message:** Heatmaps for matrix patterns. Sequential for single-direction data. Diverging around a meaningful centre.

**Say:**
"Heatmaps. Colour intensity encodes values in a matrix, making large datasets scannable. Best for two categorical dimensions, branch versus month, product versus region. Use a sequential colour scale, light to dark, for single-direction data. Use a diverging colour scale, red-white-green, when there is a meaningful centre point, target, zero, average. AJB example: monthly satisfaction scores across all branches as a heatmap grid. Heatmaps scale well. Pick the right colour scale."

**Show:** Walk through the bullets.

**Land the point:** "Sequential or diverging. Pick to match the data's centre."

---

## Slide s16 -- Chart selection quick reference

**Core message:** One table. Seven analytical tasks. First choice and alternative for each.

**Say:**
"A reference table. Compare categories: bar chart, dot plot alternative. Trend over time: line chart, area chart alternative. Relationship: scatter plot, bubble chart alternative. Composition: stacked bar, treemap alternative. Distribution: histogram, box plot alternative. Intensity: heatmap, choropleth map alternative. Flow: Sankey diagram, funnel chart alternative. Screenshot this. Keep it nearby when you are designing. When teams panic about chart selection, this table solves half the problem."

**Show:** Walk across the table.

**Land the point:** "Reference table. Screenshot. Keep it nearby."

---

## Slide s17 -- Visual hierarchy. Directing attention

**Core message:** If everything is emphasised, nothing is. Main message should land in 3 seconds.

**Say:**
"Visual hierarchy. Read the quote. 'If everything is emphasised, nothing is emphasised.' Hierarchy uses size, position, colour, and contrast to create an order of importance. The viewer should grasp the main message within three seconds. Four levers. Top-left position gets seen first in left-to-right cultures. Larger elements attract attention before smaller ones. Saturated colours pop against muted backgrounds. White space separates ideas and reduces cognitive load."

**Show:** Walk through the bullets.

**Land the point:** "3 seconds. Main message. If not, redesign."

---

## Slide s18 -- Techniques for emphasis

**Core message:** Three tools: colour accent, annotation, isolation.

**Say:**
"Three emphasis techniques. Colour: use one accent colour for the focal element, grey out everything else, the single most effective emphasis technique. Annotation: add a direct label or callout to the key data point, do not rely on the legend alone, tell the viewer what to see. Isolation: separate the key element with white space or position, a single number in a large space draws immediate attention. Those three, in order of power. Use them relentlessly."

**Show:** Walk through the three cards.

**Land the point:** "Colour accent. Annotation. Isolation. Three tools. Use relentlessly."

---

## Slide s19 -- Annotation. Telling the viewer what to see

**Core message:** Annotations convert 'here is data' to 'here is the insight'.

**Say:**
"Annotation transforms a chart from 'here is data' to 'here is the insight'. Four practices. Label the key data point directly on the chart, not just in the legend. Add a short narrative annotation: 'Customer growth accelerated after the mobile launch in Q3'. Use reference lines to show targets, benchmarks, or regulatory thresholds. Date and source every chart. An undated chart loses credibility instantly. Date. Source. Target line. Non-negotiable."

**Show:** Walk through the bullets.

**Land the point:** "Date. Source. Target line. Tell them what to see. Every time."

---

## Slide s20 -- Colour theory for banking dashboards

**Core message:** Restrained palette. Accessibility. Avoid red-green alone. Be consistent.

**Say:**
"Colour. The most powerful and most misused visual channel. Five practices. Restrained palette: one or two accent colours plus grey, more colours create visual noise. Sufficient contrast for accessibility, WCAG AA minimum, test with a colour-blindness simulator. Avoid red-green pairs as the sole differentiator. 8 percent of men have red-green colour vision deficiency. Use AJB brand colours for emphasis, not for every element, brand saturation reduces impact. Cultural note. In Saudi financial context, green typically signals positive performance. Be consistent. Do not switch conventions mid-report."

**Show:** Walk through the bullets.

**Land the point:** "Restrained palette. Red-green never alone. Consistent colour semantics."

---

## Slide s21 -- Guided walkthrough. Choosing the right chart

**Core message:** Real scenario. Head of Retail. Branch performance. Work through the decision process.

**Say:**
"Walkthrough. Scenario: the Head of Retail Banking asks you to present branch performance data for the quarterly review. The dataset includes 15 branches with revenue, customer count, satisfaction scores, growth rates. Three decision steps. What question does the Head of Retail want answered? What chart form matches that question? What should be emphasised, what should recede? Let us walk through each."

**Show:** Walk down the numbered list.

**Land the point:** "Question first. Chart second. Emphasis third. Watch this carefully."

---

## Slide s22 -- Step 1. Define the question

**Core message:** Pick one question. Do not answer three questions in one chart.

**Say:**
"Step 1. Define the question. The Head of Retail is likely asking one of these. Which branches are our strongest and weakest performers, that is comparison. How has each region grown this quarter, that is comparison plus ranking. Is there a relationship between satisfaction and revenue, that is relationship. Each question leads to a different chart. Do not try to answer all three in one visual. Pick the primary question and build the chart around it. That discipline is 50 percent of the battle."

**Show:** Walk through the bullets.

**Land the point:** "One question. One chart. Half the battle is scope."

---

## Slide s23 -- Step 2. Select the form

**Core message:** Match question to chart. The sorted horizontal bar is often the safest quarterly review choice.

**Say:**
"Step 2. Select the form. Strongest and weakest branches: sorted horizontal bar, easy rank comparison with readable labels. Regional growth comparison: grouped or small-multiple bars, side-by-side comparison. Satisfaction versus revenue: scatter plot, colour by region, shows correlation and regional clusters. For the quarterly review, the sorted horizontal bar is the safest choice. It answers the most common question with minimal interpretation effort. Safe beats clever when the audience is busy."

**Show:** Walk across the table.

**Land the point:** "Safe beats clever. Quarterly review wants sorted bars."

---

## Slide s24 -- Step 3. Design emphasis

**Core message:** Colour extremes. Target line. Direct labels. Insight title.

**Say:**
"Step 3. Design emphasis. Four moves. Colour the top 3 and bottom 3 branches. Grey the middle. Frames the conversation around performance extremes. Add a vertical reference line at the target revenue level. Now every branch is visually above or below target. Label the top and bottom branches directly on the bars. Do not force the audience to cross-reference a legend. Title the chart with the insight, not the topic: 'Dhahran Mall leads. Tabuk and Al Nakheel trail target by 15 percent plus'. That is the whole chart. That is what you are going to build."

**Show:** Walk through the bullets.

**Land the point:** "Extremes coloured. Target line. Direct labels. Insight title. That is the pattern."

---

## Slide s25 -- Before and after. The power of redesign

**Core message:** Same data. Same tool. Radically different clarity.

**Say:**
"Before and after. Before: unsorted bars, rainbow colours, no labels, generic title 'Branch Revenue', no target reference, truncated y-axis starting at 5M. After: sorted bars, grey base with green and red accents, direct labels, insight title, target line, y-axis from zero. Same data. Same tool. Radically different clarity and trust. That is your weekly practice. Take a weak chart you own. Redesign it using the four emphasis moves from the last slide."

**Show:** Point to both cards.

**Ask:** "In your team's reports today, which chart would benefit most from this redesign?"

**Land the point:** "Same data. Radically different clarity. Redesign is a habit, not a heroic effort."

---

## Slide s26 -- Chart junk. What to remove

**Core message:** Chart junk is any element that does not convey data. Remove it.

**Say:**
"Chart junk. Any visual element that does not convey data. It wastes attention and reduces trust. Five common offenders. 3D effects: distort perception of size and position, always use 2D. Heavy gridlines: compete with data, use light grey or remove entirely. Decorative icons: distract from the pattern, use only when they aid comprehension. Redundant legends: if you can label directly, remove the legend. Background images or textures: never. If someone says 'but it looks more professional with a shadow', politely disagree. It does not."

**Show:** Walk through the bullets.

**Land the point:** "Chart junk reduces trust. Remove it. 'Looks professional' is not an argument."

---

## Slide s27 -- Misleading scales and distortions

**Core message:** Four common scale manipulations. If you have to explain it, it is misleading.

**Say:**
"Scale manipulation. Most common way charts deceive, intentionally or not. Four flaws. Truncated y-axis on bar charts exaggerates differences, a 2 percent difference looks like 200 percent. Dual y-axes with different scales create false correlations, avoid them or label aggressively. Inconsistent time intervals, mixing daily and monthly, distort trends. Cherry-picked date ranges hide context, always show enough history for the pattern to be fair. Read the quote. 'If you have to explain why the scale is not misleading, the scale is misleading.' Cite that line when you review a peer's chart."

**Show:** Read the quote aloud.

**Land the point:** "If you have to explain it, it is misleading. That is the test."

---

## Slide s28 -- Typography and labelling standards

**Core message:** Six standards for type and labels.

**Say:**
"Typography and labels. Six standards. Single sans-serif font family, mixing fonts creates visual noise. Titles 14 to 16 point bold, subtitle 11 to 12 point regular. Axis labels include units, SAR millions, percent, count, never leave axes unlabelled. Data labels sparingly, label only the data points that matter most. Number formatting with thousands separators, round to appropriate precision. Dates in a consistent format throughout. You will see these violated weekly in bank reports. Model the discipline here."

**Show:** Walk through the bullets.

**Land the point:** "Six standards. Model them. The industry does not, most weeks."

---

## Slide s29 -- Lab 1. Chart selection and redesign

**Do -- read these instructions exactly:**

"Lab 1. Chart selection and redesign. 30 minutes.

1. Open the Day 1 notebook. Load branch_performance.csv.
2. Pick one analytical question from the dataset.
3. Choose the appropriate chart type and justify your choice.
4. Build the chart in matplotlib with proper hierarchy, colour, and annotation.
5. Write an insight title that tells the audience what to see.

Stretch: create a second chart answering a different question and compare the two side by side.

Click the timer. Go."

**Do:** Start the 30-minute timer. Visit teams virtually. Push on insight titles. Reject generic titles like "Branch Revenue".

**Watch for:**
- Truncated y-axes. Force zero.
- Rainbow colour palettes. Force grey base.
- Legend-only charts. Force direct labels.
- Topic titles ("Revenue by Branch"). Force insight titles.

**Land the point:** "That is Day 1. Tomorrow we build dashboards."

---

## Slide s30 -- Day 1 recap

**Core message:** Selection, hierarchy, honesty.

**Say:**
"Day 1 recap. Chart selection: match the chart to the analytical task. Bars for comparison, lines for trends, scatter for relationships. Hierarchy: use colour, size, annotation to make the first message land in three seconds. Honesty: start axes at zero, label everything, remove chart junk, earn trust through precision. Tomorrow: dashboard architecture, geospatial visualisation, interactive design. Rest well."

**Show:** Walk through the three cards.

**Land the point:** "Selection. Hierarchy. Honesty. Three habits. Tomorrow we compose."

---

# DAY 2: Composition

**Day 2 arc:** Dashboard architecture. Geospatial. Interactive vs static. Advanced chart types. Critique practice. Labs 2 to 5.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening | 5 min | s31 |
| Dashboard design | 40 min | s32 to s37 |
| Geospatial | 20 min | s38 to s40 |
| Banking dashboard types and overcrowding | 15 min | s41 to s42 |
| Labs 2, 3, 4 | 60 min | s43 to s45 |
| Colour palette, accessibility, small multiples, tables | 25 min | s46 to s49 |
| Critique methodology and Lab 5 | 25 min | s50 to s53 |
| Midpoint, interactive, filter design | 30 min | s54 to s57 |
| Advanced chart types, sparklines, conditional formatting, narrative | 20 min | s58 to s61 |

---

## Slide s31 -- Day 2. Dashboard architecture and composition

**Core message:** A dashboard is a visual argument with a reading order.

**Say:**
"Welcome back. Day 2. Read the lede. 'A dashboard is not a collection of charts. It is a visual argument with a reading order.' Today we move from individual charts to composed views: dashboards that lead the eye, geospatial analysis that reveals regional patterns, interactive design that serves rather than distracts. Composition is harder than chart selection. More moving parts. More ways to fail. Let us go."

**Land the point:** "Dashboard is an argument. Not a gallery. Different discipline."

---

## Slide s32 -- What makes a dashboard effective?

**Core message:** Four traits: clear reading order, 5 to 7 elements, every element earns space, designed for a specific audience.

**Say:**
"Four traits of an effective dashboard. Clear reading order: summary first, then breakdown, then detail. No more than 5 to 7 visual elements. More creates cognitive overload. Every element earns its space. If removing an element does not reduce understanding, remove it. Designed for a specific audience, not for 'everyone'. That last one kills most dashboards. 'A dashboard for everyone' is a dashboard for no one."

**Show:** Walk through the bullets.

**Land the point:** "Four traits. The last one kills most dashboards. Specific audience."

---

## Slide s33 -- Anatomy of a banking dashboard

**Core message:** Four zones: KPI tiles, primary visual, supporting, detail table.

**Say:**
"Anatomy. Four zones. Top row: KPI tiles, 3 to 5 key metrics with current value, trend direction, comparison to target. Answers 'how are we doing right now'. Middle: primary visual, the largest chart answers the main analytical question, where the eye should spend the most time. Supporting visuals: 1 to 2 smaller charts that provide context, breakdown, comparison, they support the primary, not compete with it. Bottom: detail table, for users who need granular data, sortable, filterable, but not the focal point. Four zones. Use them."

**Show:** Walk through the cards.

**Land the point:** "Four zones. KPI, primary, supporting, detail. Every banking dashboard."

---

## Slide s34 -- Common dashboard layout patterns

**Core message:** Four standard patterns with structures.

**Say:**
"Four layout patterns. Executive summary: board-level overview, KPI row plus one trend chart plus one comparison chart. Operational monitor: daily management, KPI row plus real-time metric plus alert table. Analytical explorer: analyst deep-dive, filter panel plus primary chart plus detail grid. Regional comparison: multi-geography review, map plus small multiples by region plus KPI tiles. Pick the pattern that matches your audience's job, not the pattern that looks impressive."

**Show:** Walk across the table.

**Land the point:** "Four patterns. Match to audience job. Not to visual ambition."

---

## Slide s35 -- Designing effective KPI tiles

**Core message:** Five rules for KPI tiles.

**Say:**
"KPI tiles are the most-viewed element on any dashboard. Design them with care. Five rules. Current value prominently: that is the primary information. Include a comparison: versus target, versus last period, versus benchmark. Small sparkline or arrow for direction: context matters more than a raw number. Colour sparingly: green for on-track, amber for warning, red for off-track, do not colour everything. Label the time period: 'Revenue: SAR 18.5M' means nothing without 'Q4 2025 YTD'. Five rules. Every KPI tile. Every time."

**Show:** Walk through the bullets.

**Land the point:** "Five rules. KPI tiles are read first. Get them right."

---

## Slide s36 -- Designing the reading order

**Core message:** The viewer's eye follows a path. Design the dashboard to match it.

**Say:**
"Reading order. The viewer's eye follows a predictable path. Design to match it. Top-left: start here, most important summary element. Top-right: secondary summary or trend indicator. Centre: the primary analytical visual gets the most space. Bottom: supporting detail and data tables for drill-down. Read the quote. 'If your dashboard requires a user guide, it has failed. The layout itself should teach the reading order.' If you find yourself adding instructions to your dashboard, redesign instead."

**Show:** Walk down the numbered list and read the quote.

**Land the point:** "Layout teaches reading order. Instructions mean you failed."

---

## Slide s37 -- White space is not wasted space

**Core message:** White space is structural. Overcrowded dashboards cause disengagement.

**Say:**
"White space is not wasted space. It is a structural element, not a gap to fill. Four practices. Separates logical groups, creates visual breathing room. Overcrowded dashboards cause disengagement, cognitive overload shuts down analysis. A dashboard with 4 clear visuals and generous spacing outperforms one with 10 visuals crammed together. Use consistent margins and padding, inconsistent spacing looks unprofessional. Protect the white space. Stakeholders will ask you to fill every pixel. Politely refuse."

**Show:** Walk through the bullets.

**Land the point:** "Protect white space. Refuse to fill every pixel. Four clear visuals beat ten crammed ones."

---

## Slide s38 -- Geospatial visualization fundamentals

**Core message:** Maps when geography is the insight. Three map types.

**Say:**
"Geospatial fundamentals. Read the lede. 'Maps are powerful when location matters. They are distracting when it does not.' Use a map only when the geographical pattern is the insight: regional concentration, branch coverage gaps, customer density gradients. If the data does not have a meaningful geographic dimension, a bar chart is clearer. Three map types. Choropleth: shade regions by value, good for market share, growth rates. Point maps: plot individual locations, good for branch networks, customer clusters. Bubble maps: size markers by value, good for showing magnitude at each location."

**Show:** Walk through the bullets.

**Land the point:** "Maps only when geography is the insight. Otherwise use bars."

---

## Slide s39 -- Geospatial analysis at AJB

**Core message:** AJB operates across Saudi Arabia. Four analyses maps can support.

**Say:**
"Geospatial at AJB. AJB operates across Saudi Arabia with concentration in Central, Western, and Eastern regions. Maps can reveal four things. Branch coverage versus population density: are we present where customers are. Regional performance variation: does growth correlate with geography. Expansion opportunities: where are underserved markets. Customer journey patterns: how far do customers travel to branches. The regional_data.csv dataset provides coordinates and metrics for this analysis. You will use it in Lab 4."

**Show:** Walk through the bullets.

**Land the point:** "Four questions maps answer. Use the regional dataset. Preview for Lab 4."

---

## Slide s40 -- Map design principles

**Core message:** Six map design rules.

**Say:**
"Map design principles. Six rules. Choose the right projection. For Saudi Arabia, a simple plate carree or Mercator works for regional views. Sequential colour scale for single-variable choropleths, avoid rainbow colour maps. Size bubbles by area, not radius, radius scaling exaggerates differences. Include a legend with clear value ranges. Do not overload the map, show one variable at a time, use small multiples for comparisons. Always include a title and source. Maps without context are just shapes. That is the rule. Six practices."

**Show:** Walk through the bullets.

**Land the point:** "Six rules. 'Bubble by area not radius' is the commonly missed one."

---

## Slide s41 -- Banking-specific dashboard types

**Core message:** Three dashboard archetypes you will recognise at any bank.

**Say:**
"Banking dashboard archetypes. Three patterns. Portfolio view: asset allocation, concentration risk, yield curves, uses treemaps, stacked bars, line charts for term structure. Risk heatmap: credit risk, liquidity risk, operational risk across dimensions, uses heatmap grids with threshold colouring. Customer health: segment performance, churn risk, product penetration, uses bar comparisons, funnels, cohort tables. You will build a version of customer health in Lab 3 today. Recognise these archetypes. Match new requests to one of them."

**Show:** Walk through the cards.

**Land the point:** "Three archetypes. Match new requests. Do not invent from scratch."

---

## Slide s42 -- Common mistake. The overcrowded dashboard

**Core message:** More than 7 elements causes overload. Multiple audiences need multiple dashboards.

**Say:**
"The overcrowded dashboard is the most frequent failure. Trying to show everything to everyone. Three problems. More than 7 visual elements causes cognitive overload, the viewer skims and misses the key message. Multiple audiences with different questions need different dashboards, not one mega-dashboard. If a dashboard takes more than 10 seconds to find the main message, it needs redesign. Read the quote. 'The goal is not to show all the data. The goal is to show the right data to the right person at the right time.' Write that on a card."

**Show:** Walk through the bullets and read the quote.

**Land the point:** "Right data. Right person. Right time. Not all data, all people, all times."

---

## Slide s43 -- Lab 2. Dashboard wireframe

**Do -- read these instructions exactly:**

"Lab 2. Dashboard wireframe. 15 minutes. Paper before code.

1. Choose an audience: executive, department head, or analyst.
2. Define the primary question the dashboard answers.
3. Sketch a wireframe with KPI tiles, primary visual, supporting visuals, detail area.
4. Annotate each element with its purpose and chart type.
5. Present your wireframe to a partner and explain the reading order.

Stretch: sketch a second wireframe for a different audience and contrast the two designs.

Use paper or a whiteboarding tool. No code yet. Go."

**Do:** Start a 15-minute timer. Confirm every team has chosen a single audience before they sketch.

**Watch for:**
- Dashboards designed for 'everyone'. Force a specific audience.
- More than 7 elements on the wireframe. Force reduction.
- No annotations on the wireframe. Force labelling.

**Land the point:** "Paper before code. Wireframes prevent wasted building."

---

## Slide s44 -- Lab 3. Customer segment analysis

**Do -- read these instructions exactly:**

"Lab 3. Customer segment analysis. 25 minutes.

1. Open the Day 2 notebook. Load customer_metrics.csv.
2. Create a horizontal bar chart comparing revenue per customer across segments.
3. Create a scatter plot showing churn rate vs digital adoption, sized by customer count.
4. Apply hierarchy: highlight the segment with highest churn risk.
5. Add insight titles and annotations to both charts.

Click the timer. Go."

**Do:** Start a 25-minute timer. Push on the hierarchy rule. Insist on direct labels.

**Watch for:**
- Segments coloured equally. Force highlighting of the risk segment.
- Generic titles. Force insight titles.
- Missing units. Force units on axes.

**Land the point:** "Two charts. Both with hierarchy. Both with insight titles."

---

## Slide s45 -- Lab 4. Geospatial branch analysis

**Do -- read these instructions exactly:**

"Lab 4. Geospatial branch analysis. 20 minutes.

1. Load regional_data.csv in the Day 2 notebook.
2. Create a bubble map of Saudi Arabia showing branches by region, sized by customer count.
3. Colour-code by growth rate to reveal which regions are expanding fastest.
4. Add labels and a legend.
5. Write a 2-sentence insight summary below the map.

Stretch: add a second map layer showing market share percentage.

Click the timer. Go."

**Do:** Start a 20-minute timer. Push teams to use area-based bubble sizing.

**Watch for:**
- Bubbles sized by radius rather than area. Correct on the spot.
- Maps without legends. Force legend addition.
- Maps without insight summaries. The map is not done without the insight.

**Land the point:** "Three labs. You now have 3 serious visuals. Good progress."

---

## Slide s46 -- Building a dashboard colour palette

**Core message:** Five roles in a palette: primary, supporting, semantic, neutral, background.

**Say:**
"A consistent colour palette creates visual coherence across all dashboard elements. Five roles. Primary: 1 brand colour for accent and key data points. Supporting: 2 to 3 muted tones for secondary data series. Semantic: green positive, amber warning, red negative. Use consistently across all charts. Neutral: light greys for gridlines, borders, non-data elements. Background: white or very light grey, dark backgrounds are harder to read in printed reports. Document your palette. Reuse it across every chart in the dashboard for visual unity."

**Show:** Walk through the bullets.

**Land the point:** "Five palette roles. Document once. Reuse relentlessly."

---

## Slide s47 -- Accessibility in data visualization

**Core message:** Five accessibility practices. Reach more people. Meet professional standards.

**Say:**
"Accessibility. Five practices. Shape and pattern in addition to colour, dashed versus solid lines, different marker shapes. Minimum contrast ratio of 4.5 to 1 for text, 3 to 1 for graphical elements. Alt text for charts in digital reports, describe the insight, not the chart type. Test with a colour-blindness simulator. Avoid relying solely on red and green to encode meaning, add icons or labels as redundant cues. Accessibility is not optional. 8 percent of men have red-green colour vision deficiency. Design for them."

**Show:** Walk through the bullets.

**Land the point:** "Five practices. Accessibility is a professional standard. Not optional."

---

## Slide s48 -- Small multiples. Comparing without clutter

**Core message:** Small multiples for 4 to 12 categories. Identical axes. Clear labels.

**Say:**
"Small multiples. Same chart repeated for each category. Makes comparison easy without overlapping lines or bars. Three practices. Each panel uses identical axes, ensures fair comparison across categories. Best for 4 to 12 categories, fewer than 4 wastes space, more than 12 overwhelms. Label each panel clearly, the viewer should not have to decode colour from a legend. AJB example: a small-multiple line chart showing monthly transaction trends for each region side by side. When you have 6 regions and a legend with 6 colours, switch to small multiples. Clarity up. Legend gone."

**Show:** Walk through the bullets.

**Land the point:** "Small multiples beat legends. 4 to 12. Identical axes."

---

## Slide s49 -- When tables beat charts

**Core message:** Four conditions. Conditional formatting bridges tables and charts.

**Say:**
"When tables beat charts. Four conditions. Audience needs exact values, not patterns, regulatory reports, audit evidence. Fewer than 5 rows and a straightforward comparison. Mixed data types, names, dates, amounts, statuses, do not map to a single visual encoding. Audience will reference the data repeatedly, lookup tables, rate cards. Use conditional formatting, colour bars, icons, to add visual pattern to tables without losing precision. Tables are not the enemy of data visualisation. They are a valid tool. Know when to pick one."

**Show:** Walk through the bullets.

**Land the point:** "Tables beat charts sometimes. Four conditions. Conditional formatting bridges the gap."

---

## Slide s50 -- Visual critique methodology

**Core message:** Four-question framework. Critique is structure, not opinion.

**Say:**
"Critique methodology. Read the lede. 'Critique is a structured practice, not personal opinion.' Four questions for any visualisation. Message: what is the first thing you see, is that the intended message. Accuracy: is the data represented honestly, are scales, labels, comparisons fair. Clarity: can the audience understand this in under 10 seconds without explanation. Action: does this visual lead to a decision or just present data. Four questions. Use them every time. Screenshot this."

**Show:** Walk through the numbered list.

**Land the point:** "Four questions. Every critique. Message, Accuracy, Clarity, Action."

---

## Slide s51 -- Critique practice. Common failures

**Core message:** Two common failure examples with fixes.

**Say:**
"Critique practice. Two common failures. Problem: spaghetti line chart. 12 overlapping lines, no hierarchy, rainbow colours, no annotations. Fix: reduce to 3 to 4 key lines, grey the rest, highlight the story line. Problem: pie chart with 15 slices. Slices smaller than 3 percent are unreadable. Fix: show top 5 as bars, group the rest as 'Other'. Precision matters more than completeness. Both failures share a pattern. Too much data. Not enough editorial discipline. Cut. Focus. Repeat."

**Show:** Point to both cards.

**Land the point:** "Spaghetti charts. 15-slice pies. Cut. Focus. Repeat."

---

## Slide s52 -- Lab 5. Visual critique exercise

**Do -- read these instructions exactly:**

"Lab 5. Visual critique. 20 minutes.

1. Review two sample charts in the workbook.
2. Apply the critique framework: Message, Accuracy, Clarity, Action.
3. For each chart, identify the single most impactful improvement.
4. Sketch a redesigned version that addresses the weaknesses.
5. Pair up and compare critiques. Did you identify the same issues?

Click the timer. Go."

**Do:** Start a 20-minute timer. Force pairs to name a single top improvement per chart. Rank the critiques after the lab.

**Watch for:**
- Vague critiques ("could be clearer"). Force specificity.
- Critiques that attack style but miss accuracy issues. Balance the four questions.

**Land the point:** "Critique is structured. Specific. Actionable. Not 'I don't like it'."

---

## Slide s53 -- Tufte's data-ink ratio

**Core message:** Maximise data ink. Minimise non-data ink. Every pixel earns its place.

**Say:**
"Tufte's data-ink ratio. Edward Tufte's principle. Maximise the share of ink devoted to data. Minimise non-data ink. Five practices. Data-ink ratio: ink used for data divided by total ink on the chart. Remove borders around charts unless they serve a grouping purpose. Remove background fills, shadows, gradients. Reduce gridlines to the minimum needed for value estimation. Every pixel should either show data or help the viewer interpret data. Apply this test to every chart. 'What is this pixel doing?' If the answer is 'nothing', remove it."

**Show:** Walk through the bullets.

**Land the point:** "Every pixel earns its place. Data ink only. That is the test."

---

## Slide s54 -- Day 2 recap so far

**Core message:** Dashboards and geospatial.

**Say:**
"Midpoint of Day 2. Dashboards: a visual argument with a reading order. KPI tiles, primary chart, supporting views, detail. Geospatial: use maps only when geography is the insight. Choropleth for regions, bubble for points, always with clear legends. Next: interactive versus static design, advanced techniques, transition to executive storytelling."

**Show:** Point to both cards.

**Land the point:** "Composition built. Next: interactive versus static. And storytelling."

---

## Slide s55 -- Interactive vs static. When each works

**Core message:** Five-factor table. Choose based on audience and purpose.

**Say:**
"Interactive versus static. Five factors decide. Audience: board reports and printed decks are static, analyst exploration and live meetings are interactive. Message control: static high, you control what they see, interactive lower, user chooses their own path. Complexity: static low, one view one message, interactive higher, multiple views, filters, drill-down. Shelf life: static is a point-in-time snapshot, interactive is continuously updated from data source. Production cost: static lower, export and send, interactive higher, requires tool, hosting, maintenance. Pick deliberately. Interactive is not automatically better."

**Show:** Walk across the table.

**Land the point:** "Static is not inferior. Pick deliberately. Five factors."

---

## Slide s56 -- Principles of useful interactivity

**Core message:** Five principles. Interactivity should clarify, not multiply.

**Say:**
"Interactivity should clarify the story, not create extra work. Five principles. Default view must be meaningful, the dashboard on first load should answer the primary question without any clicks. Filters should reduce, not multiply, each filter should narrow the view, not create new confusion. Tooltips provide detail on demand, should show values, comparisons, context, not repeat the axis label. Drill-down should follow the analytical hierarchy: summary to segment to individual. Undo is essential, the user must always be able to return to the default view. Five principles. Apply to every interactive dashboard you build."

**Show:** Walk through the bullets.

**Land the point:** "Interactivity must clarify. Five principles. Undo is essential."

---

## Slide s57 -- Designing effective filters

**Core message:** Five filter design rules.

**Say:**
"Filter design. Five rules. Place filters at the top or left, visible but not dominating. Show the current filter state clearly, the viewer must always know what subset of data they are seeing. Limit filter options to meaningful categories, do not expose every column as a filter. Use cascading filters: selecting a region should update the branch filter to show only branches in that region. Reset all button prominently, users get lost in filter combinations. Five rules. Apply them. The reset button is the rescue mechanism."

**Show:** Walk through the bullets.

**Land the point:** "Five rules. Reset all is the rescue mechanism. Provide it."

---

## Slide s58 -- Advanced chart types for banking

**Core message:** Three advanced types: waterfall, bullet, Sankey.

**Say:**
"Three advanced chart types. Waterfall: shows how an initial value is affected by sequential positive and negative changes. Ideal for bridge analyses, revenue drivers, cost breakdown. Bullet chart: compact comparison of actual versus target with qualitative ranges, poor, satisfactory, good. Replaces gauges and dials. Sankey diagram: shows flow between categories. Useful for customer journey mapping, fund flow analysis, channel attribution. Three types. Learn when each one wins. Waterfall for variance bridges. Bullet for KPI tiles with range. Sankey for flows."

**Show:** Walk through the cards.

**Land the point:** "Three advanced types. Learn the use case. Not the syntax."

---

## Slide s59 -- Sparklines and micro-charts

**Core message:** Sparklines in KPI tiles and tables. Shape is the message.

**Say:**
"Sparklines. Small, word-sized charts embedded in text or tables. Show trend without taking dashboard space. Four practices. Use in KPI tiles to show the trend behind the number. Embed in tables to add a visual dimension to rows of numbers. Remove axes, labels, gridlines. The shape is the message. Highlight the start point, end point, and minimum or maximum if relevant. AJB example: a branch performance table with inline sparklines showing 12-month revenue trends per branch. Sparklines punch above their weight."

**Show:** Walk through the bullets.

**Land the point:** "Sparklines. Shape is the message. High impact, low space."

---

## Slide s60 -- Conditional formatting in data tables

**Core message:** Colour bars, icon sets, highlight rules. Keep consistent.

**Say:**
"Conditional formatting in data tables. Bridges precision and pattern recognition. Four techniques. Colour bars: show relative magnitude within a column, quick visual comparison. Icon sets: arrows up, down, flat, traffic lights. Use for status indicators. Highlight rules: bold or colour cells that exceed thresholds, 'churn rate above 5 percent turns red'. Keep formatting consistent across the dashboard, mixed formatting standards look chaotic. Conditional formatting upgrades tables without losing precision. Use it."

**Show:** Walk through the bullets.

**Land the point:** "Four techniques. Consistent formatting. Upgrade tables. Do not destroy precision."

---

## Slide s61 -- Building narrative flow across multiple visuals

**Core message:** Summary, evidence, implication. Each chart should answer a question raised by the previous one.

**Say:**
"Narrative flow. When a dashboard or report contains multiple visuals, they should tell a connected story. Three beats. Start with the 'so what': the summary that frames the context. Follow with the evidence: the charts that support the headline. Close with the implication: what should the audience do next. Each chart should answer a question raised by the previous one. If a chart does not connect to the narrative, remove it. That is the test for every supporting chart."

**Show:** Walk down the numbered list.

**Land the point:** "Summary. Evidence. Implication. Each chart earns its place in the narrative."

---

# DAY 3: Storytelling and Applied Mission

**Day 3 arc:** Executive storytelling. Reporting pack structure. Applied mission. Labs 6 to 8. Critique. Presentation.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and executive communication | 15 min | s62 to s63 |
| Reporting pack structure and storytelling | 15 min | s64 to s65 |
| Common presentation mistakes | 10 min | s66 |
| Applied mission briefing | 15 min | s67 to s69 |
| Labs 6, 7, 8 | 80 min | s70 to s72 |
| Presentation practice and anti-patterns | 40 min | s73 to s74 |
| Module recap, rubric, bands, toolkit, close | 25 min | s75 to s80 |

---

## Slide s62 -- Day 3. Executive storytelling and applied missions

**Core message:** Today we build a complete executive reporting pack.

**Say:**
"Day 3. Read the lede. 'Today you build a complete executive reporting pack and present it for critique.' We combine everything from Days 1 and 2. Chart selection, hierarchy, dashboard composition, narrative flow. Into a single deliverable that a senior leader could use to make a decision. The standard is 'I could put this in front of the Head of Retail today.' Not 'I could put this in a training assessment'. Raise the bar."

**Land the point:** "Executive-ready today. That is the standard."

---

## Slide s63 -- Executive communication principles

**Core message:** Five principles. Lead with conclusion. One slide, one message.

**Say:**
"Five executive communication principles. Lead with the conclusion. State the key finding first, then show the evidence. Do not build up to a reveal. One slide, one message. If a slide makes two points, split it into two slides. Use action titles: 'Eastern region growth outpaces all others at 10.1 percent' not 'Regional Growth Chart'. Anticipate questions. Include the data that supports the likely follow-up. End with a clear recommendation, not an open question. Five principles. Apply them relentlessly today."

**Show:** Walk through the bullets.

**Land the point:** "Five principles. Lead with conclusion. Action titles. Always."

---

## Slide s64 -- Structure of an executive reporting pack

**Core message:** 5 to 7 pages maximum. Summary, performance, deep dive, appendix.

**Say:**
"Structure. Executive summary, 1 page, 3 to 5 KPIs, headline finding, recommended action. Performance overview, 1 to 2 pages, trend charts, comparison to targets, variance analysis. Deep dive, 2 to 3 pages, segment analysis, regional breakdown, root cause investigation. Appendix, methodology, data sources, definitions, available for reference, not for presentation. Total: 5 to 7 pages maximum. If you cannot tell the story in 7 pages, you have not identified the story yet. Hold that line. Longer is not better."

**Show:** Walk down the numbered list.

**Land the point:** "5 to 7 pages. If you need more, you have not found the story."

---

## Slide s65 -- Storytelling structures for data

**Core message:** Two structures: Situation-Complication-Resolution or What-So What-Now What.

**Say:**
"Two storytelling structures. Pick one. Situation-Complication-Resolution: describe the current state, identify the challenge or surprise, present the recommendation. Classic consulting structure. What-So What-Now What: present the finding, explain why it matters, recommend next steps. Direct and efficient for operational audiences. Both work. Pick based on your audience's habits. Board-level audiences tend to prefer Situation-Complication-Resolution. Operational audiences prefer What-So What-Now What. Choose. Stick to it."

**Show:** Point to both cards.

**Land the point:** "Two structures. Pick one. Stick to it. Do not mix."

---

## Slide s66 -- Common mistakes in data presentations

**Core message:** Five common mistakes to avoid.

**Say:**
"Five common mistakes. Reading the chart aloud. The audience can read. Add interpretation and context instead. Showing the data journey. The audience does not need to know how you cleaned the data or which tools you used. Ending with 'any questions' instead of a recommendation. Close with a call to action. Using jargon the audience does not share. Match your language to their vocabulary. Showing too many decimal places. 'SAR 18,523,417.83' is noise. 'SAR 18.5M' is the message. Five mistakes. You will hear yourself about to make them. Stop. Reframe."

**Show:** Walk through the bullets.

**Land the point:** "Five mistakes. Stop. Reframe. Do not describe. Interpret."

---

## Slide s67 -- Applied mission. Executive dashboard

**Core message:** Build a complete executive reporting pack for the Head of Retail Banking.

**Say:**
"Applied mission. Read the lede. 'Build a complete executive reporting pack for the AJB Head of Retail Banking.' Using all three datasets, create a 4 to 5 visual executive pack that opens with a KPI summary, answers 'how are we performing across branches, segments, and regions', identifies the top opportunity and top risk, closes with a recommendation. This is your capstone for the module. Treat it as real work."

**Show:** Walk through the bullet list.

**Land the point:** "Executive pack. Real work. 4 to 5 visuals. Capstone."

---

## Slide s68 -- Mission requirements

**Core message:** Five required elements with specific formats.

**Say:**
"Five required elements. KPI summary: 3 to 5 key metrics with comparison to target or trend. Branch comparison: sorted bar or dot plot with performance hierarchy. Segment analysis: chart showing revenue drivers and risk segments. Regional view: map or chart showing geographic performance patterns. Recommendation: 1 to 2 sentences stating what action to take and why. Stretch: add an interactive filter or drill-down element. Five elements. Each one mapped to a question the Head of Retail will ask."

**Show:** Walk across the table.

**Land the point:** "Five elements. Each one answers an executive question."

---

## Slide s69 -- Mission workflow

**Core message:** Six-step workflow with tight time blocks.

**Say:**
"Mission workflow. Six steps. Review all three datasets. Identify the key patterns and outliers, 15 minutes. Sketch your dashboard layout on paper. Define the reading order, 10 minutes. Build visualisations in the Day 3 notebook, 45 minutes. Write insight titles and annotations for each visual, 10 minutes. Draft a 2-sentence executive summary and recommendation, 5 minutes. Peer review: exchange packs and apply the four-question critique, 15 minutes. Total: 100 minutes. Stick to the time boxes. Perfect is the enemy of done."

**Show:** Walk down the numbered list.

**Land the point:** "Six steps. 100 minutes. Stick to time boxes. Perfect is the enemy of done."

---

## Slide s70 -- Lab 6. Executive summary page

**Do -- read these instructions exactly:**

"Lab 6. Executive summary page. 25 minutes. The single most important page of the reporting pack.

1. Open the Day 3 notebook.
2. Load all three datasets.
3. Create a KPI summary with 4 key metrics: total revenue, average satisfaction, top growth region, highest churn segment.
4. Create one primary chart: branch revenue sorted with target line.
5. Write an action title and 1-sentence recommendation.

Click the timer. Go."

**Do:** Start a 25-minute timer. Push on action titles and the recommendation sentence. These are where most decks fail.

**Watch for:**
- KPI tiles without comparison. Force the comparison.
- Primary chart without target line. Force the target.
- Recommendation that is actually a description. Force the call to action.

**Land the point:** "Exec summary is your page 1. Nail it. Nothing else rescues a weak opener."

---

## Slide s71 -- Lab 7. Multi-chart narrative

**Do -- read these instructions exactly:**

"Lab 7. Multi-chart narrative. 25 minutes. Build supporting pages that tell a connected story.

1. Create a customer segment comparison chart: revenue per customer vs churn rate.
2. Create a regional growth bubble chart.
3. Arrange both charts with consistent colour palette and annotation style.
4. Write a narrative connector: how does the segment analysis relate to the regional view?

Stretch: create a heatmap showing branch satisfaction scores by region.

Click the timer. Go."

**Do:** Start a 25-minute timer. Insist on a written narrative connector. Without it, the charts are disconnected.

**Watch for:**
- Inconsistent palette between the two charts. Force palette unification.
- Missing narrative connector. Force the sentence.

**Land the point:** "Connected story. Written narrative connector. Not implied. Stated."

---

## Slide s72 -- Lab 8. Peer critique and revision

**Do -- read these instructions exactly:**

"Lab 8. Peer critique and revision. 30 minutes.

1. Exchange reporting packs with a partner.
2. Apply the critique framework: Message, Accuracy, Clarity, Action.
3. Write 3 specific, actionable improvement suggestions.
4. Receive feedback on your own pack.
5. Implement the single highest-impact revision.

Click the timer. Go."

**Do:** Start a 30-minute timer. Force specificity in feedback. Reject vague suggestions.

**Watch for:**
- Critiques that are purely complimentary. Critique must identify improvements.
- Critiques that are only stylistic. Force at least one Accuracy and one Action critique per review.

**Land the point:** "Critique is a gift. Specific. Actionable. Implement the best one."

---

## Slide s73 -- Presenting your executive pack

**Core message:** 3-minute presentation in four tight blocks.

**Say:**
"Presenting. 3 minutes or less. Tight structure. 30 seconds: state the headline finding and recommendation. 90 seconds: walk through 2 to 3 key visuals that support the finding. 30 seconds: restate the recommendation with the most compelling data point. 30 seconds: open for one question. Do not describe the chart type or your methodology. Describe the business insight. Time yourself. Over is a fail. Under is fine."

**Show:** Walk down the numbered list.

**Land the point:** "3 minutes or less. Business insight, not methodology. Over is fail."

---

## Slide s74 -- Presentation anti-patterns

**Core message:** Six specific phrases and behaviours to avoid.

**Say:**
"Anti-patterns. Six. 'This chart shows' describes the visual instead of the insight. 'As you can see' assumes the audience has already processed the visual. 'I used matplotlib to' shares technical process, not business value. 'The data is interesting because' is vague, state the specific finding. Turning your back to the audience to read the screen. Showing a chart and then saying something different from what the chart shows. Catch yourself about to say any of these. Stop. Reframe."

**Show:** Walk through the bullets.

**Ask:** "Which of these have you said in the last six months?"

**Land the point:** "Six phrases. Eliminate them. They signal amateur. You are not amateur."

---

## Slide s75 -- Module recap. Key principles

**Core message:** Selection, hierarchy, composition.

**Say:**
"Module recap. Three pillars. Selection: match the chart to the analytical task. Bars for comparison, lines for trends, scatter for relationships, heatmaps for density. Hierarchy: use colour, size, annotation, position to direct attention. Make the main message land in 3 seconds. Composition: dashboards have a reading order. KPI tiles first, primary chart centre, supporting detail below. Selection. Hierarchy. Composition. Three pillars. Carry them forward."

**Show:** Walk through the three cards.

**Land the point:** "Selection. Hierarchy. Composition. Three pillars. Carry forward."

---

## Slide s76 -- Assessment rubric

**Core message:** Five criteria across three proficiency levels.

**Say:**
"Rubric. Five criteria. Chart selection: developing, chart type does not match the task, proficient, matches with correct encoding, exemplary, optimal with alternatives considered. Visual hierarchy: developing, no clear focal point, proficient, clear focal with supporting emphasis, exemplary, hierarchy guides the eye through a deliberate sequence. Annotation and labelling: developing, missing labels, units, or source, proficient, all elements labelled with insight title, exemplary, annotations tell a story, reference lines and callouts add context. Dashboard composition: developing, elements compete, proficient, clear layout with logical grouping, exemplary, reading order is intuitive, white space and grouping are deliberate. Executive communication: developing, presents data without interpretation, proficient, states the finding and supports with evidence, exemplary, leads with recommendation, anticipates follow-up questions. Aim for exemplary. Settle for proficient if you must. Developing is a redo."

**Show:** Walk across the table briefly.

**Land the point:** "Exemplary or proficient. Developing is a redo. Raise the bar."

---

## Slide s77 -- Performance bands

**Core message:** Four bands. 17 to 20 is exemplary. 13 to 16 is proficient.

**Say:**
"Performance bands. Exemplary, 17 to 20: visuals are executive-ready, all four criteria strong, work could be presented to senior leadership. Proficient, 13 to 16: visuals are clear and accurate, minor improvements would elevate to executive standard, solid analytical communication. Developing, 9 to 12: core concepts understood but execution needs refinement. Beginning, 5 to 8: significant gaps, additional practice needed. I will assess against this band during the Day 3 presentations. No surprises."

**Show:** Walk across the table.

**Land the point:** "Four bands. Scored against the rubric. Be honest with yourselves."

---

## Slide s78 -- Your visualization toolkit

**Core message:** Seven tools to carry forward.

**Say:**
"Your toolkit. Seven tools. Chart selection matrix: match task to form. Four-question critique: Message, Accuracy, Clarity, Action. Dashboard anatomy: KPI tiles, primary chart, supporting views, detail. Emphasis techniques: colour accent, annotation, isolation. Storytelling structures: Situation-Complication-Resolution or What-So What-Now What. Colour palette discipline: 1 accent plus 2 to 3 supporting plus semantic plus neutral. Accessibility checks: contrast ratio, colour-blindness simulation, alt text. Seven tools. Use them all. Not just the ones you remember."

**Show:** Walk through the bullets.

**Land the point:** "Seven tools. Use all. Not just the ones you remember."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap of learning, outputs, and success indicators.

**Say:**
"Three recaps. What you learned: how to choose chart forms deliberately, create hierarchy, compose dashboards, communicate data for decisions rather than display. What you produced: charts, dashboard layouts, critique notes, banking-specific visuals, an executive reporting pack. What proved success: checkpoint completion, strong chart choice, clarity under critique, final visuals that made the right message obvious quickly."

**Show:** Point to the three cards.

---

## Slide s80 -- Module 6 complete

**Core message:** Carry forward: selective, structured, honest about uncertainty.

**Say:**
"Module 6 complete. Module 7 is the programme capstone. You will use the communication discipline from this module to present a balanced AI recommendation for banking leaders. Carry this forward. Executive-grade visuals are selective, structured, and honest about uncertainty. Every chart earns its place by serving a decision. Thank you. Strong work this week. See you in the capstone."

**Land the point:** "Selective. Structured. Honest. Three words. Every chart serves a decision."

---

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Exemplary (17-20)** | Executive-ready pack. Chart selection optimal. Hierarchy deliberate. Annotation tells a story. Dashboard reading order is intuitive. Presentation leads with recommendation and anticipates questions. |
| **Proficient (13-16)** | Chart type matches the task. Clear focal point. All elements labelled. Logical grouping. Finding stated and supported. Minor improvements would elevate to executive. |
| **Developing (9-12)** | Core concepts understood but execution uneven. Chart selection or hierarchy has gaps. |
| **Beginning (5-8)** | Significant gaps in chart selection, labelling, or composition. Redo recommended. |

### Rubric Application

- Score the final applied mission live. Quote the rubric aloud during critique.
- Do not inflate scores. If a chart truncates an axis, it is not exemplary.
- Reward restraint. A pack with 4 strong visuals beats one with 8 mediocre ones.

## Close Standard

End the module by asking each participant to complete this sentence:

> "The single chart I will redesign back at work this week is ..."

Collect responses. Use them to verify the module translated into real practice, not just lab output.

## Mixed-Level Delivery Notes

- **Intro route:** Focus newer participants on chart selection and hierarchy. Keep colour palettes simple.
- **Advanced route:** Push on dashboard composition, accessibility, and narrative flow. Expect tight executive titles.
- **Both routes:** Enforce the ground rules. Axis at zero. Direct labels. Source lines. No exceptions.

## Virtual Engagement Checkpoints

- **Day 1:** After Lab 1 (s29), require each participant to paste their chart's insight title into the chat.
- **Day 2:** After Lab 5 (s52), ask each pair to post their single most impactful critique finding.
- **Day 3:** After presentations, require each presenter to state aloud the recommendation their pack closes with.
