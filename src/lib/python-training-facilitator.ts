type FacilitatorNoteBlock = {
  start: number;
  end: number;
  label: string;
  objective: string;
  talkTrack: string[];
  deliveryScript: string[];
  facilitationMoves: string[];
  debrief?: string[];
};

const noteBlocks: FacilitatorNoteBlock[] = [
  {
    start: 1,
    end: 5,
    label: "Opening and course ramp",
    objective: "Set the end state and get every participant into the correct Day 1 working materials.",
    talkTrack: [
      "Frame the module as a guided analysis journey rather than a disconnected set of Python topics.",
      "Make the day-by-day end state concrete so participants understand where today's setup and triage work is heading.",
      "Use the opening slides to get the right notebook, data folder, and output expectations in front of every participant.",
    ],
    deliveryScript: [
      "Good morning everyone. Over the next three days, I want you to experience this as a structured analysis course, not as a sequence of isolated Python slides.",
      "By the end of the module, you should be able to move from a raw banking extract to a defensible analytical judgement, then on to clearer reporting and cleaner ML-ready handoff outputs.",
      "For the opening section, I want everyone oriented properly. The notebook, the data folder, and the output folder are part of the learning journey, not background admin.",
    ],
    facilitationMoves: [
      "Pause long enough for participants to actually open the correct Day 1 notebook rather than only hearing about it.",
      "Use the opening to establish that every later result must be explainable in business language and supported by visible evidence.",
    ],
  },
  {
    start: 6,
    end: 9,
    label: "Notebook onboarding and first-run checks",
    objective: "Make the notebook environment usable before asking participants to reason about code or data.",
    talkTrack: [
      "Explain code cells, markdown cells, output areas, and run order in plain language.",
      "Use the setup cell to teach why imports, data paths, and output folders must be confirmed before analysis starts.",
      "Treat import errors, path issues, and stale notebook state as important setup issues to resolve early, not small annoyances to ignore.",
    ],
    deliveryScript: [
      "This setup block matters because if the notebook is not running cleanly, nothing later will feel coherent. I want the environment to become part of the teaching, not a hidden assumption behind it.",
      "When participants run the first setup cell, make them notice what it is doing: importing libraries, defining the training data path, and creating the output folder for today's work.",
      "If anyone hits an import problem, file path issue, or stale kernel state, stop and fix it before moving on. A clean first run creates confidence for the rest of the day.",
    ],
    facilitationMoves: [
      "Ask participants to say what a code cell, markdown cell, and output area each do before advancing.",
      "Check that the room can see the correct notebook file and understands where the data and outputs folders sit relative to it.",
    ],
  },
  {
    start: 10,
    end: 18,
    label: "Core Python, first load, and triage mindset",
    objective: "Give enough Python and pandas foundation to inspect a banking extract and prepare for a defensible triage judgement.",
    talkTrack: [
      "Keep the Python section deliberately small. Teach only the ideas participants need in order to inspect and reason about a banking file safely.",
      "Teach the first five checks as an opening ritual every time a new extract arrives.",
      "Frame nulls, duplicates, date issues, and type issues as decision-risk questions rather than small technical defects.",
    ],
    deliveryScript: [
      "From here, I want the room to feel the transition from setup into real analytical work. The Python we cover next is not the destination. It is the minimum toolkit for judging a file properly.",
      "When you load the extract and inspect the DataFrame, keep pushing the habit of orientation first. What file is this, what fields exist, what types were assigned, and what already looks risky?",
      "By the time we reach Lab A, participants should understand that triage is not a coding race. It is a disciplined judgement about whether the extract is fit, partly fit, or not yet fit for first-pass analysis.",
    ],
    facilitationMoves: [
      "Ask participants which issue would most damage trust in leadership reporting if ignored.",
      "Use the inspection slides to surface weak habits such as loading files blindly or skipping unique ID checks.",
    ],
    debrief: [
      "What was the first issue that changed your confidence in the file?",
      "Which risk would be most dangerous to carry forward into first-pass analysis?",
    ],
  },
  {
    start: 19,
    end: 25,
    label: "Lab A, functions, and day 1 close",
    objective: "Convert inspection into action, then build reusable cleaning logic and close day 1 cleanly.",
    talkTrack: [
      "During Lab A, coach around evidence quality and not just getting an answer.",
      "When you move into functions, stress reuse, readability, and failure behaviour.",
      "The day 1 recap should leave participants clear on triage, cleaning, and reproducibility as habits.",
    ],
    deliveryScript: [
      "As you work through this triage lab, I care less about who finishes first and more about whether your judgement is evidence-based and properly caveated.",
      "When we move into functions, I want you to see reusable logic as part of professional analytical practice. A function is not just shorter code. It is a way to make assumptions visible and repeatable.",
      "If you leave day one with three habits, I want them to be these: inspect first, clean deliberately, and preserve outputs in a way that another analyst can review and trust.",
    ],
    facilitationMoves: [
      "Walk the room during the lab and listen for weak assumptions.",
      "Use the export slide to emphasise preserving audit-friendly outputs.",
    ],
    debrief: [
      "Which field would you trust least after triage?",
      "What makes a cleaning function reusable rather than one-off?",
    ],
  },
  {
    start: 26,
    end: 31,
    label: "Day 2 start and joins",
    objective: "Re-establish grain discipline and introduce joining as the foundation of richer analysis.",
    talkTrack: [
      "Position joins as business modelling choices, not just syntax.",
      "Keep returning to grain: what one row represents before and after each merge.",
      "Use the analysis table slide to show that good analysts only carry the fields they need.",
    ],
    deliveryScript: [
      "Let us start day two by reconnecting joins to business meaning. A join is not only how tables are merged. It is how different operational views of the bank become one analytical story.",
      "Before every merge, ask yourself this question: what does one row mean now, and what should one row mean after the merge? That question prevents a lot of avoidable mistakes.",
      "As we build the analysis table, I want you to be selective. Strong analysts do not carry every possible field forward. They carry the fields that support the question and leave the rest behind.",
    ],
    facilitationMoves: [
      "Ask what would happen if the join key is not unique.",
      "Make participants say the grain out loud before each merge example.",
    ],
  },
  {
    start: 32,
    end: 37,
    label: "Lab C and groupby foundations",
    objective: "Teach quality checking on customer data and then move into grouped summarisation.",
    talkTrack: [
      "Push participants to rank issues by analytical risk, not just count.",
      "Explain groupby as 'split, apply, combine' but keep the examples attached to branch and region questions.",
      "The .agg slide is where metric naming and explicit definitions matter most.",
    ],
    deliveryScript: [
      "As we move into customer quality checks, I want you to prioritise defects rather than simply count them. Some issues are cosmetic. Others change the meaning of the analysis.",
      "Groupby is not just a piece of pandas syntax. It is how we structure answers by branch, region, segment, or product, so keep the business question in view while we use it.",
      "I am going to slow down when we hit aggregated metrics because this is exactly where polished-looking work can still be methodologically weak.",
    ],
    facilitationMoves: [
      "Listen for confusion between row count and distinct count.",
      "Use one KPI to model how to define numerator, denominator, and filters clearly.",
    ],
    debrief: [
      "Which KPI needs the clearest definition?",
      "What was the most confusing part of your join logic?",
    ],
  },
  {
    start: 38,
    end: 45,
    label: "KPIs, shares, and labs D and E",
    objective: "Build disciplined KPI thinking and link calculations to defensible business communication.",
    talkTrack: [
      "Challenge participants to justify every denominator rather than accepting the first available one.",
      "Show that percentages without denominator logic are fragile and easy to misread.",
      "During labs, push for tables and commentary that leadership could actually use.",
    ],
    deliveryScript: [
      "This section is a step up in analytical maturity. Many reporting failures do not come from arithmetic mistakes. They come from weak denominator choices and unclear definitions.",
      "As we work through these KPI examples, I want you to keep asking how a skeptical stakeholder would attack each number. That question exposes hidden assumptions very quickly.",
      "A good result is not only computed correctly. It is framed in a way that a leader can understand, challenge, and still trust.",
    ],
    facilitationMoves: [
      "Ask how a hostile stakeholder would challenge each metric.",
      "Keep the room focused on interpretation, not only computation.",
    ],
    debrief: [
      "If leadership challenged one number, how would you defend it?",
      "What denominator choice most changes the story?",
    ],
  },
  {
    start: 46,
    end: 48,
    label: "Day 2 close",
    objective: "Wrap day 2 around communication quality, not only pandas technique.",
    talkTrack: [
      "Recap joins, groupby, denominator choice, and quality artefacts as the core day 2 habits.",
      "Bridge into day 3 by showing that trustworthy summaries are the input to good charts and handoffs.",
    ],
    deliveryScript: [
      "As we close day two, I want you to leave with a clear idea of what makes a metric trustworthy: grain control, explicit filters, and defendable denominator logic.",
      "That matters because tomorrow we move into visualisation and executive communication, and none of that works well if the underlying summaries are weak.",
    ],
    facilitationMoves: [
      "Have participants summarise one KPI in a sentence a manager would understand.",
    ],
  },
  {
    start: 49,
    end: 56,
    label: "Day 3 charts and design",
    objective: "Teach visualisation as a decision-support skill rather than decoration.",
    talkTrack: [
      "The charting section should stay anchored to claims, not aesthetics alone.",
      "Use each chart choice to ask what question it answers and what it hides.",
      "Keep reminding participants that titles, labels, and caveats do analytical work.",
    ],
    deliveryScript: [
      "Today I want you to think about charts as decision tools rather than decoration. A visual should make a claim easier to understand. It should not just make a dashboard look more sophisticated.",
      "Whenever we look at a chart, ask two questions. What question does this answer, and what important thing might it hide?",
      "Titles, labels, and caveats are part of the analysis. They are not cosmetic extras. They help the audience understand what they should trust and what they should be cautious about.",
    ],
    facilitationMoves: [
      "Ask why a bar or line chart is appropriate before showing the code.",
      "Push back on overloaded charts and vague titles.",
    ],
  },
  {
    start: 57,
    end: 63,
    label: "Dashboards, exceptions, and Lab F",
    objective: "Move from single charts into packs, dashboards, and exception logic with explicit thresholds.",
    talkTrack: [
      "Show that exceptions logic has to be explainable and auditable.",
      "Treat dashboard slides as communication architecture, not chart collections.",
      "During Lab F, guide participants to link visuals to specific leadership actions.",
    ],
    deliveryScript: [
      "In this dashboard and exceptions section, I want auditability to stay visible. Thresholds and alerts need to be explainable because they can trigger real follow-up action.",
      "A dashboard is not just a collection of charts. It is an argument about what deserves attention first, what can wait, and what action should be taken.",
      "As you work through the lab, connect every chart or exception rule to a likely management action. If the action is unclear, the design probably is too.",
    ],
    facilitationMoves: [
      "Ask what threshold was chosen and what makes it defensible.",
      "Use dashboard slides to discuss audience hierarchy and clutter reduction.",
    ],
  },
  {
    start: 64,
    end: 68,
    label: "ML handoff and executive summary",
    objective: "Prepare participants to package outputs for downstream analytics and senior decision-makers.",
    talkTrack: [
      "Frame the feature table as a handoff product with assumptions, not just a technical export.",
      "Use the executive summary slide to model concise, caveated communication.",
      "Reinforce leakage, scope limits, and confidence statements explicitly.",
    ],
    deliveryScript: [
      "As we move into the machine learning handoff block, I want you to see the feature table as a product in its own right. It should carry assumptions, caveats, and enough context to be reused responsibly.",
      "When we model the executive summary, keep it short and deliberate. Leaders need the key movement, the likely driver, the confidence level, and the major caveat. Anything else has to earn its place.",
      "This is also the moment to practice confidence language. I want you to sound clear without sounding absolute.",
    ],
    facilitationMoves: [
      "Ask which feature they trust least and why.",
      "Challenge any management summary that lacks a caveat.",
    ],
    debrief: [
      "What action should leadership take first based on your brief?",
      "Which feature would you trust least in an ML handoff and why?",
    ],
  },
  {
    start: 69,
    end: 71,
    label: "Final recap and close",
    objective: "Close the module around habits participants will take back into their roles.",
    talkTrack: [
      "Use the final recap to consolidate habits, not just content coverage.",
      "End with transfer to practice: what changes tomorrow in their own work.",
    ],
    deliveryScript: [
      "As we finish, I want you to remember habits rather than slide count: inspect carefully, define clearly, visualise honestly, and communicate with caveats.",
      "Before we close, decide what will change in your own work tomorrow. That is the point where training becomes practice.",
    ],
    facilitationMoves: [
      "Ask every participant to finish the close-out sentence from the facilitator guide.",
    ],
  },
];

const slideScripts: Record<number, string[]> = {
  1: [
    "Good morning everyone. Welcome to Python for Data. Over the next three days, I want you to think about Python as a practical tool for disciplined banking analysis.",
    "Our end point is not code for its own sake. Our end point is leadership-ready analysis and cleaner outputs that can support downstream machine learning work.",
  ],
  2: [
    "This slide gives the success picture for the course. I want participants hearing the progression clearly: today they learn to set up and inspect well, then they move toward stronger summaries, clearer communication, and cleaner downstream handoffs.",
    "Use this moment to make the end state feel practical. The goal is not to know Python in the abstract. The goal is to produce analysis that another analyst and a leadership audience could actually trust.",
  ],
  3: [
    "This slide is the course ramp. Walk them through the sequence slowly so it feels like one connected learning journey rather than separate topics.",
    "Emphasise that the order matters. First we get the working environment right, then we build just enough fluency, and then we apply that fluency to a real triage judgement in the notebook.",
  ],
  4: [
    "Before coding starts, this slide tells participants exactly what needs to be ready. Slow down here and make the setup feel deliberate rather than incidental.",
    "The key message is that notebook, deck, file browser, and output view are all part of the learning environment. If one of those is missing, the course experience becomes much weaker.",
  ],
  5: [
    "Use this slide as a literal action point. Ask everyone to open the Day 1 notebook now and confirm they can see the correct file path and the surrounding training folders.",
    "Do not move quickly past this slide. The room should leave it knowing which file they are working in and where the data and outputs folders sit relative to that notebook.",
  ],
  6: [
    "This slide is about making the notebook environment feel understandable rather than mysterious. Explain the difference between markdown, code, and output cells in calm practical language.",
    "The key discipline is run order. If participants understand top-to-bottom execution now, many later notebook issues will disappear before they start.",
  ],
  7: [
    "This setup cell is the first true technical checkpoint of the day. Make participants notice that it is importing libraries, defining data paths, and creating the output folder for their day one work.",
    "If the setup cell fails for anyone, treat that as the priority. A clean first execution is part of the course design, not a side issue.",
  ],
  8: [
    "This slide is where file awareness becomes analytical awareness. Participants should hear clearly what the notebook can now see and why that matters for trustworthy work.",
    "Reinforce that good analysts stay conscious of inputs and outputs. Knowing where data comes from and where outputs go is part of analytical professionalism.",
  ],
  9: [
    "Use this troubleshooting slide to normalise setup friction without trivialising it. Import problems, file path mistakes, and stale kernel state are all fixable, but they should be fixed early.",
    "The main message is simple: do not keep pushing forward through a broken notebook. Stop, diagnose, and return to a clean state before continuing.",
  ],
  10: [
    "This transition slide lowers the pressure. Participants do not need all of Python. They need the minimum toolkit that lets them inspect, question, and judge a banking extract responsibly.",
    "Position the next section as enabling knowledge, not as a detour. The basics are here to support triage and later cleaning work.",
  ],
  11: [
    "Variables and types matter because later mistakes often begin with not knowing what sort of value you are actually holding.",
    "Keep the examples concrete and banking-shaped. Use names, counts, amounts, and booleans so the room feels the direct connection to the work ahead.",
  ],
  12: [
    "This slide compresses strings, lists, and dictionaries into one practical toolkit. The point is not depth. The point is recognising how these structures help clean and organise messy banking data.",
    "Make the lookup idea especially clear. Dictionaries become important the moment raw source-system codes need translating into analytical labels.",
  ],
  13: [
    "This is the first safe file load, and that matters. Participants should see that the notebook is not loading blindly. It is checking for required columns and protecting some types from the start.",
    "Use this to model disciplined loading habits. The more assumptions you surface early, the less false confidence you carry into analysis.",
  ],
  14: [
    "A DataFrame is now the working object, but the important point here is orientation rather than analysis. Ask what we know immediately once the file is loaded: size, fields, types, and first-row plausibility.",
    "This is where participants begin acting less like file openers and more like analysts.",
  ],
  15: [
    "These five checks are the opening ritual of the course. Say clearly that every new extract should earn trust rather than receiving it automatically.",
    "The room should hear that inspection is not a warm-up. It is a major part of the analytical method.",
  ],
  16: [
    "This slide widens the judgement. We are not only counting issues. We are asking whether those issues are inconvenient, analysis-damaging, or decision-distorting.",
    "Push the room to think in business consequences. What would matter to leadership if we ignored this weakness and kept moving?",
  ],
  17: [
    "This is the handoff into Lab A. Summarise the workflow simply: load safely, inspect carefully, then make an evidence-based judgement.",
    "Tell participants that the lab is not about coding volume. It is about whether they can support a triage decision with visible checks and appropriately cautious language.",
  ],
  18: [
    "This triage lab is where you start acting like a real analyst rather than a passive learner.",
    "I care less about speed here and more about whether your judgement is evidence-based, specific, and caveated properly.",
  ],
  19: [
    "Functions matter because they turn one-off fixes into reusable logic.",
    "A strong function is not only convenient. It makes assumptions visible, repeatable, and easier for someone else to trust.",
  ],
  20: [
    "Applying a function to a column is where custom logic scales across the dataset.",
    "Notice that we are not manually fixing one cell at a time. We are defining a repeatable transformation.",
  ],
  21: [
    "Mapping is one of the most common cleanup patterns you will use in practice.",
    "Raw codes arrive from source systems. Dictionaries let you convert them into analytical language that people can actually interpret.",
  ],
  22: [
    "This slide is about professional error handling. Weak code hides ambiguity. Strong code surfaces it.",
    "If something is missing or malformed, the next analyst should know exactly what the problem is.",
  ],
  23: [
    "In this second lab, I want you to build cleaning logic that another analyst could safely reuse.",
    "That means the code should be clear, the assumptions should be stated, and the failure behavior should not be hidden.",
  ],
  24: [
    "Exporting matters because good analysis should be reviewable and reusable.",
    "If your outputs only exist inside your current notebook session, the work is harder to trust and harder to hand over.",
  ],
  25: [
    "This recap is here to consolidate what you can now do, not just what we covered.",
    "You can already see the pattern forming: load, inspect, profile, clean, and preserve the output.",
  ],
  26: [
    "These key takeaways are worth repeating because they are habits, not trivia.",
    "Inspect before analysis, set types deliberately, write reusable logic, surface issues, and save your work properly.",
  ],
  27: [
    "Welcome to day two. Today we move from single-table thinking into connected analytical work.",
    "The big theme is this: once you join tables and build KPIs, you also inherit more responsibility for grain, definitions, and comparability.",
  ],
  28: [
    "Here is the shape of day two. We are loading multiple files, joining carefully, validating the customer table, then building KPIs, shares, and time-based views.",
    "The labs today are about disciplined table construction and defendable metric logic.",
  ],
  29: [
    "Real analysis usually uses more than one file, so loading multiple tables safely is the starting point for richer questions.",
    "Notice that we are still being explicit with types. Good habits from day one carry forward here.",
  ],
  30: [
    "A join is how separate operational views become one analytical view.",
    "In business language, this is how we connect customers, accounts, transactions, and branches into one coherent story.",
  ],
  31: [
    "Join type is not a minor syntax choice. It affects what rows survive and what kinds of gaps become visible.",
    "In many analytical situations, a left join is safest because it keeps the analysis population visible while showing where matches are missing.",
  ],
  32: [
    "Grain is one of the most important ideas in analytics. Before and after each join, you should be able to say what one row represents.",
    "If that answer becomes vague, the result becomes risky.",
  ],
  33: [
    "This lean analysis table is a strong design pattern. Keep what supports the question and avoid carrying unnecessary baggage into the merged result.",
    "That makes the table easier to read, test, and trust.",
  ],
  34: [
    "This lab asks you to stop before joining and test whether the customer table is safe enough to use.",
    "That pause is deliberate. Weak source quality can silently contaminate everything that follows.",
  ],
  35: [
    "Groupby is one of the most important analytical tools in pandas because it turns detailed rows into structured summaries.",
    "I want you to hear the pattern clearly: split, apply, combine.",
  ],
  36: [
    "The point of agg is not just convenience. It is metric discipline.",
    "When several KPIs are built together in one block, the naming and definitions become much easier to inspect.",
  ],
  37: [
    "Every KPI needs a numerator, a denominator, and a filter logic.",
    "If you cannot state all three clearly, the metric is not ready for leadership review.",
  ],
  38: [
    "This branch performance lab is about producing a table that is both concise and defensible.",
    "I want you to think like someone preparing material for a busy executive, not only like someone writing code.",
  ],
  39: [
    "Shares and percentages look simple, but denominator choice changes the story dramatically.",
    "This is exactly why percentages often sound persuasive while still being analytically weak.",
  ],
  40: [
    "This slide is the denominator lesson in plain form. The same numerator can answer different business questions depending on what base you choose.",
    "So the denominator is never neutral. It is part of the argument.",
  ],
  41: [
    "In this regional uptake lab, your real task is not only to compute a share. It is to justify why your denominator is the right one for the question being asked.",
    "That justification matters just as much as the output table itself.",
  ],
  42: [
    "Time-based analysis becomes powerful once dates are treated properly.",
    "At this point, you are moving from static summaries into movement, timing, and trajectory.",
  ],
  43: [
    "Month-on-month change is often what stakeholders care about most because it turns a snapshot into a story about movement.",
    "But remember that every change number still depends on clean and comparable inputs underneath.",
  ],
  44: [
    "A data quality report is a simple but powerful governance artifact.",
    "It turns vague concerns into a table of checks, statuses, and counts that another person can review quickly.",
  ],
  45: [
    "This is the leadership communication structure I want you to practice: what moved, what likely drove it, and what caveat still matters.",
    "That structure helps you sound concise without sounding careless.",
  ],
  46: [
    "At the end of day two, you should now be more confident with joins, KPI construction, denominator logic, and quality evidence.",
    "The common thread is still discipline. Strong numbers come from clear structure.",
  ],
  47: [
    "These day two takeaways are really about analytical control.",
    "Check keys before joins, keep tables lean, define metrics explicitly, choose denominators deliberately, and always communicate the caveat alongside the movement.",
  ],
  48: [
    "Welcome to day three. Today we move from analytical tables into outputs that leadership can scan, discuss, and act on.",
    "The quality bar is higher now because presentation quality starts to matter alongside the calculation itself.",
  ],
  49: [
    "This agenda shows the final transition of the module. We are going from charts and exceptions into ML handoff, executive summaries, and the closing capstone.",
    "Today is about making analysis usable for a decision-making audience.",
  ],
  50: [
    "Matplotlib is the charting tool we will use, but the software itself is not the main lesson.",
    "The main lesson is how to produce visuals that are clean, legible, and claim-driven.",
  ],
  51: [
    "Use a line chart when the audience needs to see change over time.",
    "Notice the stronger title here. The title states the finding, not just the topic.",
  ],
  52: [
    "Use a bar chart when the audience needs a comparison across categories.",
    "Again, the point is not the syntax alone. The point is choosing the right visual form for the analytical question.",
  ],
  53: [
    "This is the difference between a chart that merely exists and a chart that is ready for leadership.",
    "A stronger title, clear units, restrained styling, and clean layout all contribute to trust.",
  ],
  54: [
    "In this chart lab, I want you to produce visuals that deserve space in a leadership pack.",
    "That means the chart should be readable quickly and should state the finding clearly.",
  ],
  55: [
    "An exceptions table is about focus. Instead of showing everything, you surface the few items that deserve attention.",
    "This is a strong management communication pattern because it turns data volume into action priority.",
  ],
  56: [
    "Exception flags need to be transparent and explainable.",
    "Every flagged record should have a clear rule behind it and a reason code that another person can understand.",
  ],
  57: [
    "This lab is asking you to build an actionable shortlist, not a random filtered output.",
    "The stronger your flag logic, the stronger the trust in the exceptions table.",
  ],
  58: [
    "Now we are making the bridge into machine learning explicit.",
    "Feature engineering means turning past customer behavior into columns a model can learn from, while staying careful about cut-off dates and leakage.",
  ],
  59: [
    "This feature table example is important because it shows how analytical work becomes a handoff product.",
    "A model needs one row per entity, clear assumptions, and features that are genuinely available at prediction time.",
  ],
  60: [
    "Leakage is one of the easiest ways to make a model look better than it really is.",
    "So when you build features, always ask whether any future information has slipped into the table.",
  ],
  61: [
    "In this lab, your task is not just to export a feature table. Your task is to export one that is safe enough to support the next module responsibly.",
    "That is why assumptions and leakage awareness are part of the output.",
  ],
  62: [
    "Governance matters at export time as well as during analysis.",
    "Only export what is needed, document what is included, and avoid carrying sensitive data simply because it is available.",
  ],
  63: [
    "This three-sentence executive summary structure is deliberately simple.",
    "It gives you a disciplined way to communicate a finding, a likely driver, and a caveat without drowning the audience in detail.",
  ],
  64: [
    "This narrative lab is where technical work becomes leadership communication.",
    "I want you to keep the summary short, specific, and honest about uncertainty.",
  ],
  65: [
    "A leadership pack should feel selective, not crowded.",
    "One summary table, two strong charts, and a supporting appendix is often much more effective than a heavy pack full of noise.",
  ],
  66: [
    "This capstone brief is your chance to combine the strongest outputs from the module into one short executive-facing story.",
    "The challenge is not volume. The challenge is choosing the right evidence and framing it well.",
  ],
  67: [
    "These scoring criteria show what good executive communication looks like in practice.",
    "Insight, evidence, caveat, and clarity all matter because leadership trust depends on the combination, not on one good chart alone.",
  ],
  68: [
    "This final day recap is here to show how far you have moved. You can now produce charts, exception views, and ML-ready outputs with much more discipline.",
    "That combination is what makes the work decision-ready rather than merely technical.",
  ],
  69: [
    "This programme recap pulls the whole journey together. Day one gave you control over raw data, day two gave you control over joined analysis and KPIs, and day three gave you control over communication and handoff.",
    "Across all three days, the common theme is disciplined analytical thinking.",
  ],
  70: [
    "This slide matters because it shows that today was not an isolated exercise. The feature work you did now feeds directly into the Machine Learning module.",
    "You are prepared because you now understand cleaning, joining, cut-off dates, and leakage at a much more practical level.",
  ],
  71: [
    "Thank you for the effort you have brought to the module. What matters now is not remembering every method. What matters is carrying the habits back into your own work.",
    "If you can inspect carefully, define clearly, visualise honestly, and communicate with caveats, you will already be working at a much stronger standard.",
  ],
};

const slideQuestions: Record<number, string[]> = {
  1: [
    "When you hear the phrase 'Python for Data', what do you most hope it will help you do better in your real work?",
    "Where in your current workflow do you feel most exposed: cleaning messy data, summarising it, or explaining it clearly?",
    "If this module is successful, what should feel easier for you by the end of day three?",
  ],
  2: [
    "Looking at this end state, which part feels most useful to your role right now, and which part feels furthest away?",
    "If this course works well, what should feel different in your analytical workflow by the end of day three?",
    "Where do you feel least confident today: setting up cleanly, inspecting safely, or communicating conclusions clearly?",
  ],
  3: [
    "Looking at this journey, where do you think the biggest jump from theory to practice happens?",
    "Why do you think the environment setup comes before any real file judgement work?",
    "What would make today's flow feel connected and useful rather than like a list of separate topics?",
  ],
  4: [
    "Before we start, which of these four things is most likely to trip people up if it is missing or misunderstood?",
    "Why do you think file browser visibility and output visibility matter as much as the notebook itself?",
    "What would you want fully ready before you felt comfortable beginning the first exercise?",
  ],
  5: [
    "Can everyone identify the exact notebook file we are meant to be working in today?",
    "What is the relationship between the notebook, the data folder, and the outputs folder in this training pack?",
    "What would become risky later if we skipped this opening file check and just started coding?",
  ],
  6: [
    "Before we run anything else, can you explain the difference between a markdown cell, a code cell, and an output area?",
    "Why does run order matter so much in a notebook workflow?",
    "What notebook habit here would save you the most confusion later today?",
  ],
  7: [
    "Looking at this setup cell, what is it doing for us before the analysis even begins?",
    "Why is it important that the notebook creates the output folder explicitly rather than assuming it already exists?",
    "If this cell failed, what would you want to check first?",
  ],
  8: [
    "What should the notebook be able to see now that the setup cell has run successfully?",
    "Why is path awareness part of trustworthy analysis rather than mere housekeeping?",
    "How would you explain the value of knowing both your input path and output path to another analyst?",
  ],
  9: [
    "Which setup issue is most likely to waste time later if we ignore it now: imports, paths, or stale notebook state?",
    "Why is it stronger to stop and fix an environment problem than to work around it temporarily?",
    "What does a 'clean start' actually mean in notebook terms?",
  ],
  10: [
    "What is the smallest set of Python ideas you think you genuinely need before judging a banking extract?",
    "Why is it useful to treat Python basics here as enabling tools rather than the main event?",
    "What would make this section feel relevant rather than like unrelated syntax?",
  ],
  11: [
    "When you see these values, how can you tell whether each should behave like text, a number, or a true-or-false flag?",
    "Which types are most common in the extracts you work with now?",
    "Why does descriptive naming matter even in a short notebook?",
  ],
  12: [
    "Where do strings, lists, and dictionaries show up naturally in banking analysis work?",
    "Why is dictionary thinking especially useful once source-system codes need translating?",
    "Which of these structures feels most intuitive to you, and which still needs practice?",
  ],
  13: [
    "Why is this file load safer than simply calling `read_csv()` and hoping the structure is right?",
    "What do the required columns tell you about the analysis we expect to do later?",
    "Why is making type assumptions visible at load time a strong habit?",
  ],
  14: [
    "Once the file is loaded, what are the first things you want to know about the DataFrame before trusting it?",
    "Why are shape, columns, types, and a quick row preview such a strong opening orientation set?",
    "How is this approach stronger than simply scrolling around the table visually?",
  ],
  15: [
    "Of these first five checks, which one is easiest to skip under time pressure and why?",
    "What kind of false confidence appears when someone jumps straight from file load to analysis?",
    "How would you justify this inspection ritual to a stakeholder who only wants the headline number?",
  ],
  16: [
    "Which issue on this slide is most likely to distort decision-making if ignored?",
    "How do you separate an inconvenient defect from one that is genuinely analysis-damaging?",
    "What would you want escalated before a leader saw numbers from this file?",
  ],
  17: [
    "Before starting Lab A, what would a high-quality triage answer look like beyond getting code to run?",
    "What evidence would you want visible before calling a file fit for first-pass analysis?",
    "How will you keep your judgement specific and caveated rather than vague or overconfident?",
  ],
  18: [
    "Before you start this triage lab, what would a high-quality answer look like beyond getting through the tasks?",
    "Which issue would you investigate first if you were accountable for the credibility of the final output?",
    "How will you record caveats so your judgement remains visible rather than implicit?",
  ],
  19: [
    "What makes a function more than just a convenient shortcut?",
    "How does turning a one-off step into a function improve trust and reuse?",
    "What assumptions should a good cleaning function make visible to the next analyst?",
  ],
  20: [
    "Why is applying a function down a column so much stronger than fixing values manually?",
    "What becomes easier to review once the transformation is defined once and reused many times?",
    "How would you check whether a column-level transformation has behaved as intended?",
  ],
  21: [
    "Where in real data work do mappings become essential rather than optional?",
    "Why is code-to-label translation such an important analytical step?",
    "What is the risk of leaving raw system codes in a table that will be shared more widely?",
  ],
  22: [
    "What does professional error handling sound like in analytical code?",
    "Why is it better to surface ambiguity than to hide it and keep moving?",
    "How would you want an analyst before you to flag malformed or missing data?",
  ],
  23: [
    "Before you begin this lab, what would make the resulting logic genuinely reusable by someone else?",
    "Where could failure behavior become dangerous if it is hidden inside the code?",
    "How will you decide whether your cleaning logic is clear enough to hand over confidently?",
  ],
  24: [
    "Why does exporting the result properly matter for trust, review, and reuse?",
    "What changes when the output exists outside the notebook and can be checked independently?",
    "How would you decide what format and level of detail an export should contain?",
  ],
  25: [
    "Looking back across day one, which habit feels most important to take into your own workflow immediately?",
    "What can you now do more deliberately than you could this morning?",
    "Where do you still feel least confident: inspection, cleaning, or structuring the output?",
  ],
  26: [
    "Of these day one takeaways, which one do you think people are most likely to agree with but then ignore under pressure?",
    "Which habit would have prevented the most errors in work you have already seen?",
    "If you had to brief a colleague on day one in one minute, what would you emphasise?",
  ],
  27: [
    "As we begin day two, why does analytical responsibility increase once we move beyond a single table?",
    "What new risks appear the moment we start joining data sources together?",
    "Which part of day one do you think will matter most as we go into joins and KPIs?",
  ],
  28: [
    "Looking at today’s agenda, where do you expect the most methodological risk to sit?",
    "Which part of this journey is most about logic rather than syntax?",
    "By the end of today, what would make you feel more confident about working across several tables?",
  ],
  29: [
    "Why is loading multiple tables safely the starting point for richer analysis?",
    "What bad habits from single-file work become dangerous once several files are involved?",
    "Why do explicit types still matter even before any joins happen?",
  ],
  30: [
    "If you had to explain a join in business language rather than technical language, what would you say?",
    "What makes a join an analytical modelling decision rather than just a coding step?",
    "Where in your work do separate operational views need to become one coherent analytical story?",
  ],
  31: [
    "Why is join type not a minor implementation detail?",
    "What does a left join protect that another join type might not?",
    "How could the wrong join create a polished result that still tells the wrong story?",
  ],
  32: [
    "Before we join anything, can you say clearly what one row means in each table?",
    "Why does grain become the first question rather than a later cleanup issue?",
    "What warning signs tell you that grain may already be getting blurred?",
  ],
  33: [
    "Why is a lean analysis table often stronger than a wide one?",
    "How does limiting the fields help with trust, testing, and readability?",
    "What unnecessary baggage do analysts commonly carry forward into merged tables?",
  ],
  34: [
    "Before joining this customer table, what would you most want to validate first?",
    "Which source-quality issue here could contaminate everything downstream if ignored?",
    "How would you prioritise issues if you did not have time to fix all of them?",
  ],
  35: [
    "Why is groupby such a central tool for analytical work rather than just pandas technique?",
    "How does 'split, apply, combine' help you think more clearly about the question?",
    "What business questions become much easier once you can summarise by branch, region, or segment?",
  ],
  36: [
    "Why is `.agg()` really a slide about metric discipline rather than convenience?",
    "What improves when related KPIs are defined together in one visible block?",
    "How does clearer metric naming help with leadership trust later?",
  ],
  37: [
    "For any KPI, what must be explicitly clear about the numerator, denominator, and filter logic?",
    "What kinds of weak definitions make a metric sound stronger than it really is?",
    "If someone challenged one of your KPIs, what would you need to explain first?",
  ],
  38: [
    "Before building this branch performance output, what would make it executive-ready rather than technically complete?",
    "Which choices here affect whether the table will support action or just display activity?",
    "How do you keep the result concise without stripping away what matters?",
  ],
  39: [
    "Why do shares and percentages often sound convincing even when the analysis underneath is weak?",
    "What story changes the moment the denominator changes?",
    "Where have you seen percentages used in a way that obscured rather than clarified the truth?",
  ],
  40: [
    "If the same numerator can answer different questions, what work is the denominator really doing?",
    "Why is denominator choice part of the analytical argument rather than a neutral technical step?",
    "How would you test whether your denominator matches the business question being asked?",
  ],
  41: [
    "In this lab, what would make your denominator choice genuinely defensible?",
    "How will you explain why your share answers the right question and not just any question?",
    "What additional caveat might still be needed even if your percentage is calculated correctly?",
  ],
  42: [
    "Why does time-based analysis become more meaningful once dates are treated properly?",
    "What new kinds of questions become possible when you move from a snapshot to a timeline?",
    "What could go wrong if date handling is inconsistent before trend analysis begins?",
  ],
  43: [
    "Why do leaders care so much about month-on-month movement rather than just the current level?",
    "What makes a change number interpretable rather than misleading?",
    "What checks would you want before trusting a month-on-month comparison?",
  ],
  44: [
    "Why is a data quality report such a useful governance artifact?",
    "What does this kind of report achieve that a verbal warning alone does not?",
    "If you had to design one quality report for your own team, what checks would you include first?",
  ],
  45: [
    "Why is the structure 'what moved, what drove it, what caveat matters' such a strong communication pattern?",
    "Which part of that structure do people most often omit when they are rushing?",
    "How does this framework help you sound concise without becoming careless?",
  ],
  46: [
    "As we close day two, which idea feels most important: joins, metric logic, or quality evidence?",
    "What have you learned today that changes how you would build or defend a KPI?",
    "What still feels fragile or easy to get wrong in your own practice?",
  ],
  47: [
    "Which of these day two habits do you think most improves analytical control?",
    "What would you now check automatically before sharing a summary table with leadership?",
    "If a peer asked what day two was really about, how would you answer?",
  ],
  48: [
    "As we enter day three, why does the quality bar rise when outputs become leadership-facing?",
    "What changes once presentation quality starts to matter alongside calculation quality?",
    "Where do you think analysts most often weaken a strong analysis when turning it into a visual or summary?",
  ],
  49: [
    "Looking at today’s flow, which part feels most relevant to the audiences you usually support?",
    "Where is the biggest jump today: charts, exceptions, or executive communication?",
    "By the end of this final block, what capability would you most like to have improved?",
  ],
  50: [
    "Why is the real lesson here not matplotlib itself but the communication choices around it?",
    "What makes a visual claim-driven rather than decorative?",
    "How would you explain to someone why charting is part of analysis, not a separate finishing step?",
  ],
  51: [
    "What does a line chart help the audience see particularly well?",
    "Why does the title on a line chart need to state the finding rather than just name the topic?",
    "What would make a trend chart technically correct but still weak for decision-making?",
  ],
  52: [
    "What question does a bar chart answer more cleanly than a line chart?",
    "How do you know when category comparison, rather than movement over time, is the real task?",
    "What design choices would make a bar chart easier to scan quickly?",
  ],
  53: [
    "When does a chart move from merely existing to being leadership-ready?",
    "Which improvement on this slide contributes most to trust: title, unit clarity, or layout restraint?",
    "What clutter do analysts most often keep that should be removed?",
  ],
  54: [
    "Before starting this lab, what would make a chart worthy of a leadership pack?",
    "How will you make the finding obvious within a few seconds rather than buried in the visual?",
    "If you had to defend one chart design choice in your output, what would it be?",
  ],
  55: [
    "Why is an exceptions table powerful when attention is limited?",
    "What is the difference between surfacing what deserves action and simply filtering records?",
    "How does an exceptions table help leadership prioritise rather than just observe?",
  ],
  56: [
    "What makes an exception flag transparent and explainable?",
    "Why should every flagged item have a clear rule and reason code behind it?",
    "How would you challenge an exceptions table that looked plausible but hid weak logic?",
  ],
  57: [
    "As you work through this lab, what would make your shortlist genuinely actionable?",
    "How will you prove that the flag logic is strong enough to trust?",
    "What management action should become clearer because of the output you build?",
  ],
  58: [
    "Why is this the right point in the module to bridge into machine learning?",
    "What new responsibilities appear when we start creating features for a model rather than summaries for a human reader?",
    "How does feature engineering build directly on the data discipline we have covered so far?",
  ],
  59: [
    "What makes a feature table a handoff product rather than just another analysis table?",
    "Why does one-row-per-entity matter so much at this stage?",
    "What assumptions would you want documented before passing this table to someone else?",
  ],
  60: [
    "Why is leakage such a serious risk even when a model result looks impressive?",
    "What kinds of future information might slip into a feature table without being noticed?",
    "How would you explain leakage to a stakeholder who is impressed by accuracy but not aware of the methodological risk?",
  ],
  61: [
    "Before exporting this feature table, what checks would convince you it is safe enough for downstream use?",
    "How will you make assumptions and cut-off logic visible in the output?",
    "What would make the table look complete while still being unsafe for the next module?",
  ],
  62: [
    "Why does governance matter at export time and not only during analysis?",
    "How do you decide what should be included, excluded, or documented in a responsible export?",
    "What is the risk of carrying sensitive data forward simply because it is available?",
  ],
  63: [
    "Why is a three-sentence executive summary often stronger than a long explanation?",
    "What must each sentence do so the summary remains useful and honest?",
    "How do you keep brevity from becoming oversimplification?",
  ],
  64: [
    "In this narrative lab, what would make your summary feel both clear and credible?",
    "How will you show uncertainty without sounding hesitant or vague?",
    "If a senior leader read only your summary, what absolutely has to be there?",
  ],
  65: [
    "Why should a leadership pack feel selective rather than crowded?",
    "How do you decide what belongs on the main page and what should sit in an appendix?",
    "What is usually the first sign that a pack is trying to say too much at once?",
  ],
  66: [
    "As you approach the capstone, how will you decide which evidence earns a place in your short story?",
    "What would make the final output feel executive-facing rather than classroom-facing?",
    "How will you balance insight, evidence, and caveat without overloading the audience?",
  ],
  67: [
    "Looking at these criteria, which one do you think is hardest to get right consistently?",
    "Why does leadership trust depend on the combination of insight, evidence, caveat, and clarity?",
    "If one of these dimensions were weak, which would most damage the credibility of the whole piece?",
  ],
  68: [
    "As you reflect on day three, what skill has improved most: charting, exceptions thinking, or handoff communication?",
    "What can you now produce that feels meaningfully more decision-ready than before?",
    "Where do you still want more practice before using this independently in live work?",
  ],
  69: [
    "Across the full programme, what theme do you think has held the whole journey together?",
    "Which moment from the three days most changed how you think about analysis?",
    "If you had to summarise the value of this module to a colleague, what would you say?",
  ],
  70: [
    "How does this module prepare you more credibly for the Machine Learning module that follows?",
    "Which concept from this course will matter most once models enter the picture?",
    "What would become risky in machine learning work if the habits from this module were missing?",
  ],
  71: [
    "Before we close, what is one habit from this module you will deliberately take back into your own role?",
    "What is one mistake you now feel more equipped to catch before it reaches leadership or downstream analytics?",
    "What would you want to keep practising so this training becomes part of your normal working standard?",
  ],
};

export function getPythonFacilitatorNote(slideIndex: number) {
  const slideNumber = slideIndex + 1;
  return (
    noteBlocks.find((block) => slideNumber >= block.start && slideNumber <= block.end) ?? noteBlocks[noteBlocks.length - 1]
  );
}

export function getPythonFacilitatorNoteBlocks() {
  return noteBlocks;
}

function buildPythonDetailedScript(input: {
  slideNumber: number;
  title: string;
  eyebrow: string;
  objective: string;
  seedLines: string[];
}) {
  const title = input.title.trim();
  const eyebrow = input.eyebrow.trim();
  const objective = input.objective.trim();
  const seedA = input.seedLines[0] ?? "Use this slide to reinforce the key learning point clearly and calmly.";
  const seedB =
    input.seedLines[1] ?? "Keep the explanation practical, precise, and connected to the participant's real analytical work.";

  if (/agenda/i.test(title)) {
    return [
      `Let me show you exactly how this part of the session will run so you can see where explanation, demonstration, and hands-on work fit together. I want the shape of the session to feel clear, because people learn better when they can see the journey rather than just receiving disconnected content.`,
      `${seedA} The sequence matters here. We are building confidence first, then technique, then judgement, so each section prepares you properly for the next one.`,
      `As we move through this agenda, keep asking yourself not only what the code is doing, but why the step matters in a real banking analysis context.`,
    ];
  }

  if (/lab/i.test(eyebrow) || /lab/i.test(title)) {
    return [
      `This is a working block, not a passive block. I want you to use the exercise to test whether you can apply the method with enough discipline that another analyst could trust your reasoning.`,
      `${seedA} Speed is not the main objective here. If you make a choice, you should be able to explain the logic behind it and defend it calmly.`,
      `As you work, keep a short record of assumptions, edge cases, and anything that would need clarification before the output could be used with confidence.`,
    ];
  }

  if (/recap|takeaways|programme recap/i.test(title)) {
    return [
      `I do not want this recap to feel like repetition for its own sake. I want it to consolidate the habits that should now feel normal in your analytical work.`,
      `${seedA} What matters most is not just remembering methods. Strong analysis comes from sequence, clarity, and control.`,
      `If you remember the habits on this slide and apply them consistently, your work will improve even before you learn another library or technique.`,
    ];
  }

  if (/what is a join|join types|protecting the grain|lean analysis table/i.test(title)) {
    return [
      `This is where data work becomes modelling work. Once we start joining tables, we are deciding how separate operational records become one analytical view of the bank.`,
      `${seedA} Keep the grain visible all the way through. Be able to say clearly what one row means before the join and what one row should mean after the join.`,
      `If the grain is unclear, the result may still look polished, but it becomes much harder to trust. That is why this step deserves deliberate attention.`,
    ];
  }

  if (/groupby|aggregations|defining metrics|shares|denominator|month-on-month|data quality report/i.test(title)) {
    return [
      `This is a metric-discipline slide. What matters here is not only getting a number, but being able to explain exactly how the number was produced and what it really means.`,
      `${seedA} Force the logic into plain language. Name the numerator, the denominator, and the filter or grouping rule so the metric sounds defensible rather than mysterious.`,
      `If someone senior challenged this output, I should be able to explain the calculation in one or two sentences without hiding behind code.`,
    ];
  }

  if (/matplotlib|line charts|bar charts|leadership-ready|executive summaries|leadership pack/i.test(title)) {
    return [
      `From this point on, we are not only analysing. We are shaping how the analysis will be received by decision-makers.`,
      `${seedB} The audience needs a clear claim, a readable visual, and enough caveat to trust the message without being overloaded.`,
      `A chart or summary is strong only when it makes the finding clearer, not when it makes the page busier.`,
    ];
  }

  if (/exceptions|feature engineering|feature table|leakage|governance|capstone|what comes next|thank you/i.test(title)) {
    return [
      `This slide matters because it turns analysis into a more operational or strategic output. We are no longer only describing data. We are preparing something that could influence action.`,
      `${seedA} Make the audience hear the control logic as well as the analytical logic. Explain what needs to be monitored, challenged, or caveated before the output should be trusted fully.`,
      `The standard here is not only technical correctness. The standard is whether this output could be used responsibly in the next step of work.`,
    ];
  }

  return [
    `Take a moment to look at ${title.toLowerCase()}. The main idea on this slide is simple: ${objective}`,
    `${seedA} ${seedB} Keep the explanation grounded in real analytical work so participants can connect the concept to something they might genuinely need to do.`,
    `Before we move on, I want everyone clear on the practical takeaway from this slide: ${objective}`,
  ];
}

function buildPythonFacilitatorQuestions(input: {
  title: string;
  eyebrow: string;
  objective: string;
}) {
  const title = input.title.trim();
  const eyebrow = input.eyebrow.trim();
  const objective = input.objective.trim();

  if (/agenda/i.test(title)) {
    return [
      "Looking at this agenda, which part feels most familiar to you already, and which part feels least familiar?",
      "Where in this flow do you think people usually make the jump from understanding the idea to actually being able to do it?",
      "As we go through today, what would make this session feel genuinely useful to your day-to-day work?",
    ];
  }

  if (/lab/i.test(eyebrow) || /lab/i.test(title)) {
    return [
      "Before you start, what would a strong answer look like here beyond simply getting code to run?",
      "What assumptions might you need to state explicitly so another analyst could trust your output?",
      "If your first result looks plausible, how will you check that it is actually defensible?",
    ];
  }

  if (/recap|takeaways|programme recap/i.test(title)) {
    return [
      "Which habit from this section do you think will improve your work immediately if you apply it next week?",
      "What is one mistake you are now more likely to catch because of what we covered?",
      "If you had to explain the value of this section to a colleague, what would you say in one sentence?",
    ];
  }

  if (/strings|lists|dictionaries|variables|data types/i.test(title)) {
    return [
      "Where do you see messy text, labels, or categories causing problems in your real datasets today?",
      "Which of these core Python structures feels most intuitive to you, and which still feels abstract?",
      "Why would a small cleaning step at this stage save you time later in a pandas workflow?",
    ];
  }

  if (/dataframe|inspect|selecting columns|filtering|missing values|duplicates|data types/i.test(title)) {
    return [
      "If a new file landed on your desk today, what would you want to inspect before trusting a single number from it?",
      "Which issue here is most likely to distort analysis quietly rather than obviously?",
      "How would you justify spending time on this inspection step to someone who only wants the final chart?",
    ];
  }

  if (/what is a join|join types|protecting the grain|lean analysis table/i.test(title)) {
    return [
      "Before joining these tables, what does one row mean in each source table?",
      "What is the risk if we join too quickly without being clear on keys and grain?",
      "How would you explain a bad join to a stakeholder who sees only the final polished output?",
    ];
  }

  if (/groupby|aggregations|defining metrics|shares|denominator|month-on-month|data quality report/i.test(title)) {
    return [
      "What exactly is the number on this slide counting or measuring, and what is it not measuring?",
      "Which denominator would change the story most here, and why?",
      "If a leader challenged this metric, what would you need to explain clearly and quickly?",
    ];
  }

  if (/matplotlib|line charts|bar charts|leadership-ready|executive summaries|leadership pack/i.test(title)) {
    return [
      "What is the one message this visual or summary should make obvious within a few seconds?",
      "What would make this output feel busy or confusing rather than decision-ready?",
      "If you had to remove one element from the page to improve clarity, what would it be?",
    ];
  }

  if (/exceptions|feature engineering|feature table|leakage|governance|capstone|what comes next|thank you/i.test(title)) {
    return [
      "What could go wrong if this output were used operationally without enough challenge or caveat?",
      "Which assumption on this slide would you most want documented before handoff?",
      "How does this step connect to a bigger analytical or business decision beyond the notebook itself?",
    ];
  }

  return [
    `Before I explain this, what do you already notice or expect when you look at ${title.toLowerCase()}?`,
    "Where could this concept go wrong in a real banking dataset or workflow if we handled it carelessly?",
    `How would you explain the value of this step in plain language to someone who does not code? The purpose here is to ${objective.charAt(0).toLowerCase()}${objective.slice(1)}`,
  ];
}

export function getPythonFacilitatorSlideScript(slideIndex: number, title?: string, eyebrow?: string) {
  const slideNumber = slideIndex + 1;
  const currentNote = getPythonFacilitatorNote(slideIndex);
  return buildPythonDetailedScript({
    slideNumber,
    title: title ?? `Slide ${slideNumber}`,
    eyebrow: eyebrow ?? "",
    objective: currentNote.objective,
    seedLines: slideScripts[slideNumber] ?? currentNote.deliveryScript,
  });
}

export function getPythonFacilitatorQuestions(slideIndex: number, title?: string, eyebrow?: string) {
  const slideNumber = slideIndex + 1;
  if (slideQuestions[slideNumber]) {
    return slideQuestions[slideNumber];
  }
  const currentNote = getPythonFacilitatorNote(slideIndex);
  return buildPythonFacilitatorQuestions({
    title: title ?? `Slide ${slideNumber}`,
    eyebrow: eyebrow ?? "",
    objective: currentNote.objective,
  });
}
