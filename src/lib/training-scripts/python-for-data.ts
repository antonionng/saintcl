import type { ModuleScriptPack, SegmentBlock, SlideScript } from "./types";

// This pack matches the rewritten "Python for Data" deck under
// python-training/index.html: 2 days, 4 hours per day, 4 labs, 62 slides.
// See python-training/MODULE-REFRAME.md for the editorial intent. The four
// labs each run the brief / engage / verify / defend loop end to end; the
// closing handoff (Lab D plus its data dictionary) is the module's
// assessment artefact.

const segments: SegmentBlock[] = [
  {
    start: 1,
    end: 5,
    label: "Day 1 opening: vision, loop, and the bar",
    objective:
      "Open the room with the new framing: this module is about using AI to surface defendable truths from bank data. Land the four-step loop and the 'I can defend this' bar before any code or notebook gets opened.",
    delivery:
      "Do not open with the agenda. The agenda is on the slide; the room can read. Open with a story or a question that makes the next two days personal. The first ninety seconds are doing one job: convince the room that this is not another AI hype course and not another Python course. It is about the moment a senior pulls them aside and says 'walk me through how you got that number'. Stay quiet more than you think you need to. The room you want is one that talks back at you by slide 4.",
    facilitatorMoves: [
      "Open with a real story. Either yours or one you have heard. Specific bank, specific number, specific consequence. Do not generalise.",
      "Do not read the cards on slide 1. Point at the bar card only. The other two are signposts; the bar is the contract.",
      "On slide 4 do not read four cards back to the room. Tell them which step engineers actually skip first (Brief), and why that hurts.",
      "Resist any urge to demo the chat in the opening. The chat sells itself once they are in it; selling it twice is patronising.",
      "Get a voice from the room before slide 5. If you are still talking when slide 4 ends, you have lost them.",
    ],
  },
  {
    start: 6,
    end: 9,
    label: "Foundations: banking data anatomy and definitions discipline",
    objective:
      "Give the room enough banking data anatomy that they can read a table without guessing, and lock in the habit of writing the definition before writing any code.",
    delivery:
      "This segment is short but high-leverage. The grain question on slide 6 is the single most reusable habit in the whole module. Make the room say it back. Slide 9 is the bridge into Lab A: definitions before code is what they are about to be asked to do for real.",
    facilitatorMoves: [
      "Ask one engineer to define 'one row in a transactions table' aloud before reading the slide.",
      "On slide 7, point at one row in the Means / Does NOT mean column and ask the room to add a third item from their own bank experience.",
      "Do not deep-dive the gotchas on slide 8 - they recur in every lab. Plant the flag and move.",
    ],
    debrief: [
      "Whose definition of 'one row' was the most precise? Note it; that is your reference voice for the rest of the day.",
    ],
  },
  {
    start: 10,
    end: 21,
    label: "Lab A: triage as defendable judgement",
    objective:
      "Run the four-step loop end to end on a triage question. By the end of Lab A, every participant has written one defendable fitness call and answered one challenge question on it.",
    delivery:
      "Lab A is the first time a participant has to commit to a position. Watch for hedging language and push for specificity. A triage that says 'looks okay' is a fail. A triage that says 'fit with caveats: 3.2% null amount field, 11 duplicate txn_ids in the morning batch' is the standard. The Brief step (slide 13) is where 80% of the lesson is. Do not let anyone skip it.",
    facilitatorMoves: [
      "On slide 13 (Brief), wait visibly until you see participants typing in the chat before clicking next.",
      "On slide 20 (Run the lab), walk the room during the 75-minute timer. Read screens, do not just listen.",
      "Pick two participants with strong fitness calls and have them read theirs aloud at the slide 21 debrief.",
    ],
    debrief: [
      "Whose fitness call was specific enough that leadership could act on it without a follow-up?",
      "Which data quality issue was most likely to be missed by a careless reader?",
      "Where did the coach push back hard, and where did it let someone off too easy?",
    ],
  },
  {
    start: 22,
    end: 22,
    label: "Day 1 mid-break",
    objective: "Reset the room. Land that the question is about to get harder.",
    delivery:
      "Use the break. Do not work through it. The next segment asks the room to commit to a definition that drives staffing decisions, which lands harder if they are rested.",
    facilitatorMoves: [
      "Confirm one Lab A defence is captured in your notes for the closing readback.",
    ],
  },
  {
    start: 23,
    end: 33,
    label: "Lab B: definitions discipline on a real KPI",
    objective:
      "Move from 'is the data fit' to 'what does the metric actually mean'. Force the numerator / denominator / exclusion / cut-off conversation in writing before any prompt is sent.",
    delivery:
      "Lab B is where most participants will, for the first time in their careers, feel the full weight of how much a metric depends on the choices behind it. The slide 30 moment - two engineers compute the same KPI, get different numbers, and both versions are defensible - is the moment the lesson lands as something they can feel rather than something they nodded at. Slow right down for slides 26 to 30. Resist your urge to rescue the room when the definitions get hard. The discomfort is the teacher.",
    facilitatorMoves: [
      "On slide 27, do not advance until you can read three N/D/E/cut-off briefs from the chat out loud. The bar is 'two engineers, same brief, same number'. If you cannot meet it, the lab will silently bend.",
      "On slide 30, when somebody asks you which version is 'right', refuse to answer. Both can be right. The point is the disclosure, not the verdict.",
      "Walk the room during the 90 minutes. The participants who go quiet first are the ones who let the coach default the definition for them. Catch them by name and ask 'why this denominator and not that one?' Make them defend out loud, in your hearing.",
    ],
    debrief: [
      "Whose denominator change moved the ranking the most, and what does that tell you about how stable the original ranking really was?",
      "Whose Defend answer would survive a regional manager who knew the data?",
    ],
  },
  {
    start: 34,
    end: 34,
    label: "Day 1 close",
    objective: "Close Day 1 with one brief reflection and one defend reflection. Set up Day 2.",
    delivery:
      "Keep this short. Two sentences per participant in chat. The reflection IS the closing artefact for Day 1, not a homework prompt. Then preview Day 2 in one sentence and end on time.",
    facilitatorMoves: [
      "Capture one reflection per participant in chat before anyone leaves.",
      "Confirm Day 2 start time and the tab they should reopen.",
    ],
  },
  {
    start: 35,
    end: 37,
    label: "Day 2 opening: two audiences, one standard",
    objective:
      "Open Day 2 with the two-audiences frame: leadership wants a story, ML wants a contract, both want defendability.",
    delivery:
      "Day 2 is shorter than Day 1 in stage time but heavier in artefact weight. Lab C and Lab D both produce things the room walks out with. Frame the day so they understand why both exist: the executive pack proves they can defend interpretation; the handoff proves they can defend a contract.",
    facilitatorMoves: [
      "Read slide 36 twice if needed - the leadership-vs-ML frame is the spine of Day 2.",
      "Name explicitly that the four defences across both days are the assessment. There is no separate capstone.",
    ],
  },
  {
    start: 38,
    end: 48,
    label: "Lab C: executive pack with the coach as critic",
    objective:
      "Build a pack a CFO can read in three minutes, then deliberately use the coach as a critic to pressure-test the interpretation before shipping.",
    delivery:
      "Lab C is where the work goes outward for the first time. The new behaviour is using the coach as an adversary, not as an assistant. Most engineers find this hard - we are wired to prefer agreement to disagreement, and the AI is wired to give us the agreement we want. The 'Pressure-test this' and 'What might be wrong here?' quick actions are the pedagogy, not the chart libraries. Push the room hard on those buttons before any caveat gets written. And honour the caveat-with-the-headline rule on slide 41 - that is the artefact-level quality bar. A caveat in the appendix is a caveat that does not exist.",
    facilitatorMoves: [
      "On slide 42, force the audience and the headline to be written before the chart prompt is sent. If the chart leads, the headline gets reverse-engineered to fit it.",
      "On slide 44, pick one engineer whose chart looked strong and ask them to read the coach's hardest counter out loud. Then ask the room: does the headline survive that, or does it bend?",
      "On slide 48, vote in the room. 'Hands up if you would put your name on this pack in front of the CFO.' Hesitation is data.",
    ],
    debrief: [
      "Which coach pressure-test genuinely changed someone's headline?",
      "Whose explicit caveat would survive being read first by the CFO?",
    ],
  },
  {
    start: 49,
    end: 49,
    label: "Day 2 mid-break",
    objective: "Reset before the closing artefact.",
    delivery:
      "After this break the room walks into the assessment. Frame the break that way - they are coming back to build the thing the module is graded on.",
    facilitatorMoves: [
      "Confirm Lab C defences are captured before anyone leaves the room.",
    ],
  },
  {
    start: 50,
    end: 60,
    label: "Lab D: ML-ready handoff and the data dictionary",
    objective:
      "Build a customer-level feature table with explicit cut-off, no leakage, and a data dictionary written in the participant's own words. The handoff plus the dictionary is the module's closing artefact.",
    delivery:
      "Lab D is the assessment. The whole course rolls up into the artefact each engineer walks out with. Two non-negotiables to enforce in the room. First, the contract on slide 54 is on the page in chat before any code is written - cut-off date, row grain, feature shape, leakage rule, named in the engineer's own words. Second, the dictionary on slide 57 is written by the engineer, not by the coach. If you read coach-voice prose in somebody's dictionary, you stop, you point at it, and you ask them to rewrite that entry out loud in their own words. The dictionary is the artefact a future engineer reads cold; if it sounds like the coach wrote it, it is useless.",
    facilitatorMoves: [
      "On slide 54, do not advance until cut-off date, row grain, feature shape, and leakage rule are all visible in chat. This is the contract.",
      "On slide 57, walk the room and read dictionary entries over shoulders. If you see 'this feature represents...' or other coach-voice tells, stop the engineer and ask them to say what the column means out loud. Then write that down.",
      "On slide 60, state the timebox once, name that this is the assessment artefact, then walk continuously. Do not sit. Do not let the room sit either - they will write better dictionaries when somebody is moving past their screen.",
    ],
    debrief: [
      "Whose dictionary entry sounded most like a contract a downstream modeller could pick up cold?",
      "Where did the leakage check find something that would have shipped if the participant had not asked?",
    ],
  },
  {
    start: 61,
    end: 62,
    label: "Module close: readback and exit ticket",
    objective:
      "Close the module with each participant reading their truth-supported and truth-not-supported sentences from Lab D, plus an exit-ticket habit they take into Module 2.",
    delivery:
      "This is the moment the course either lands as a behaviour or fades as a memory. The readback is not optional and it is not for time-management - it is the public commitment that turns 'I built a feature table' into 'I am the engineer who can defend this in front of a senior'. Hold the room. Do not let anyone skip. Do not rush past the engineer who names something the data does not support, because that engineer is the one the bank actually needs more of, and the room learning what that sounds like is half the lesson. End on a story or a sentence that sticks - what every engineer in this room remembers six months from now is the last line they hear.",
    facilitatorMoves: [
      "Hold every readback. Sit with the silence between speakers. Do not coach during the readback; you can react after.",
      "When somebody names a 'truth not supported' that is sharp and honest, stop, name it out loud, and tell the room why that is the line of the course.",
      "Capture exit-ticket habits in chat. 'I will be more careful' is not a habit; push it to 'I will write four lines of brief before sending any AI prompt this week'.",
      "Confirm Module 2 dates are in calendars as the last action, after the closing line.",
    ],
    debrief: [
      "Who named a truth the data does not support without flinching? That is the engineer the bank needs more of.",
    ],
  },
];

const slides: SlideScript[] = [
  // ---- Day 1 opening (1-5) ----
  {
    slideNumber: 1,
    deckId: "s01",
    day: 1,
    segment: "Opening",
    coreMessage:
      "Do not open by narrating the slide. Open with a story or a tension that makes the next two days personal. The job in the first 90 seconds is to make every engineer in the room believe this is the course where a senior is going to ask them to defend their work, and they had better be ready.",
    sayThis: [
      "I want to start somewhere a little uncomfortable. About a year ago I sat with an engineer at another bank who had shipped a branch revenue number to her CFO. The query ran. The chart looked clean. The AI helped her write it in fifteen minutes. Two days later her manager pulled her into a room because the number was off by something like fourteen million riyals, and she could not tell him why. She could not walk him back through her own work. The AI could not walk him back through it either. That conversation is the reason this course exists.",
      "Look at the right-hand card on the slide. The bar. 'If you cannot defend it under one round of pushback, it is not done.' I want you to memorise that one sentence today, because we are going to come back to it at the end of every single lab. By tomorrow afternoon I want to hear you say it before I say it.",
      "I am not going to walk you through the agenda. You can see it. Two days, four labs, one closing handoff. What I will tell you is what the next two days are not. They are not a Python course. They are not an AI hype talk. They are training for the moment somebody more senior than you reads your work and asks the question the engineer at that other bank could not answer.",
      "Before I go any further I want a voice in the room. Quick round.",
    ],
    presenterCues: [
      "Tell the story of the off-by-millions number in your own words, with your own bank or your own client. Make it specific. Vague stories teach nothing.",
      "Do not introduce yourself for more than 30 seconds. Your story is your introduction.",
      "After the askThis, wait. Let two engineers speak before you respond. Silence is not an emergency.",
      "Do not read any of the three cards out loud except the bar. The other two are signposts; the bar is the contract.",
    ],
    showThis: "Cover slide with title, lede, and three cards.",
    askThis: [
      "Who in this room has shipped a piece of analysis in the last month and had a senior - your manager, your CFO, somebody on the other side of the bank - push back on it? Take us back into that moment. What did they actually say, and how did it land?",
    ],
    landThePoint: "If you cannot defend it under one round of pushback, it is not done. Memorise that line.",
    transition: "Why the next two days look the way they do.",
    estMinutes: 6,
  },
  {
    slideNumber: 2,
    deckId: "s02",
    day: 1,
    segment: "Opening",
    coreMessage:
      "Land the new framing without preaching it. The shift is real and the room already half-knows it: code is not the bottleneck anymore, judgement is. Using AI well raises the bar for engineers, it does not lower it. Tell the room why that is, in your voice, with one example they recognise.",
    sayThis: [
      "Three or four years ago the engineer who could write the cleanest pandas was the engineer who got the work. That engineer is not the most valuable person in the bank anymore. AI writes the pandas. What it cannot do is sit in a meeting with a regional manager and tell him why the denominator should be active customers and not transactions. That conversation is the new bottleneck, and it is the conversation we are going to train for over the next two days.",
      "Look at the left side of the slide. Three things that change in your week. You brief the AI now; you do not memorise syntax. You verify the output; you do not trust it because it ran. You write the defence yourself; you do not hide behind the chart and hope nobody asks. If you walk out of here on Friday with one habit, I want it to be the third one. The first two will look after themselves.",
      "And then there is the right side of the slide, which is the part nobody likes to hear. Nothing on the right side is new. Definitions still have to be explicit. Cut-offs still have to be honest. Denominators still have to stand up to a counter. Caveats still have to be visible to whoever opens the deck first. AI did not invent those. They are how good bank engineers have always worked. What AI changed is the gap between the engineers who clear that bar and the engineers who pretend it does not apply to them anymore.",
      "Quick one for the room before we move on.",
    ],
    presenterCues: [
      "Land 'you do not hide behind the chart.' Slow down on that line. That is the line you want overheard at lunch.",
      "If anyone asks 'so we do not need to learn pandas?' the honest answer is: you need to READ it, not write it, and we will show you what that means in Lab A.",
      "On the askThis, do not let the first answer be the only answer. After someone speaks, ask: 'Anyone seen the opposite, where the AI was right and the senior was wrong?' Surface both directions.",
    ],
    showThis: "Two-card slide. The right card is the harder one; it stays on screen longer.",
    askThis: [
      "When was the last time an AI answer ran clean for you, and somebody senior pulled it apart anyway? What did they see in it that the AI did not?",
    ],
    landThePoint: "AI changed who can clear the bar. It did not move the bar.",
    transition: "Where the weighting actually sits in this course.",
    estMinutes: 6,
  },
  {
    slideNumber: 3,
    deckId: "s03",
    day: 1,
    segment: "Opening",
    coreMessage:
      "Tell the room the weighting in your voice. The 20% next to Python is the surprise; that is where the question comes from. The 40-40-20 split is not arbitrary; it reflects where the failures actually happen at the bank.",
    sayThis: [
      "I want you to look at the bottom row of the table for a second. Twenty percent. That is how much of this course is about Python. If you came in expecting a coding bootcamp, this is the moment to recalibrate. We will write code, we will read code, but the code is the easy bit. The hard bit, and the bit you are getting paid for, is the other eighty.",
      "Forty percent is banking data judgement. Denominators. Cut-offs. What a customer actually is in your warehouse. What null means in this column versus that column. When I look at where engineers at this bank ship the wrong number, almost every time it traces back to one of those calls, not to the code.",
      "Another forty is working with AI. Briefing it properly. Decomposing the question before you ask. Reading what comes back like you would read a junior's pull request. Knowing when the thread has gone bad and you need to start over rather than patch.",
      "And the last twenty, the Python, is reading more than writing. If you have never opened pandas, do not worry about it. If you can write pandas in your sleep, the lesson for you is not in the syntax. It is in spotting the join that quietly dropped thirty percent of your rows and called it success.",
    ],
    presenterCues: [
      "Point at the 20% with your hand. Do not just say it. The number is the lesson.",
      "If you have a strong Python writer in the room, look at them when you say 'the lesson is not in the syntax'. They will hear it as respect, not dismissal.",
      "Do not read the table left to right. The room can read. Read the percentages and one sentence each.",
    ],
    showThis: "Three-row table with weights and what each pillar covers.",
    landThePoint: "Eighty percent of this course is banking judgement and how you work with AI. Twenty is Python, mostly reading.",
    transition: "How every lab inside that eighty actually runs.",
    estMinutes: 4,
  },
  {
    slideNumber: 4,
    deckId: "s04",
    day: 1,
    segment: "Opening",
    coreMessage:
      "Land the four-step loop without reading it like a checklist. The lesson is which step engineers actually skip first, and what it costs them. Brief is the most skipped, and the rest of the day silently bends when it goes missing.",
    sayThis: [
      "I want to do something a little different on this slide. Instead of me walking you through all four steps, I want to tell you which one engineers skip first and what it costs them. Because if you walk away from today understanding only one of these four, this is the one.",
      "It is the first one. Brief. The thing you do before you ever open the chat. Read the leadership question. Read the dataset. Write down, in your own words, what defendable would look like here. Three or four lines, in plain English, before any prompt is sent. Almost nobody does this. AI is so fast that you start typing the prompt before you have actually understood the question, and from that moment everything downstream silently bends. Wrong denominator. Wrong cut-off. Wrong customer definition. The model cannot rescue you from a brief you never wrote.",
      "The other three are easier to talk about. Engage is the chat itself - briefing the model with what you locked in, decomposing, getting to code without giving up the judgement you wrote down. Verify is reading the code yourself and running the checks you chose - not the checks the AI suggested. And Defend is the close. An executive note in your voice, plus one challenge question I am going to throw at you through the coach. The defence is the artefact you are graded on. Not the chart. Not the code. The defence.",
      "You will see the four steps as little dots in your chat as you go. They are not decoration. They are how you and I both know where you are.",
    ],
    presenterCues: [
      "Do not read the four cards in order. Lead with Brief. Spend more time on it than the other three combined.",
      "When you say 'almost nobody does this', look around the room. The honest engineers will nod.",
      "On the askThis, do not let the room get away with 'I would never skip Brief'. Push: 'When was the last time you actually wrote four lines before opening the chat? Be honest.'",
    ],
    showThis: "Four-card grid: Brief / Engage / Verify / Defend with one-line descriptions.",
    askThis: [
      "Of these four, which one are you most tempted to skip when you are under pressure? Not in theory. Last week. Last month. What did you actually skip, and what did it cost?",
    ],
    landThePoint: "Brief is the step engineers skip first. The rest of the day silently bends when it is missing.",
    transition: "The two-day map.",
    estMinutes: 6,
  },
  {
    slideNumber: 5,
    deckId: "s05",
    day: 1,
    segment: "Opening",
    coreMessage:
      "Two days, four labs, one handoff. The thing the room needs to leave this slide knowing: there is no separate capstone, and the closing handoff is the only assessment. Some of them are expecting a capstone; clear that up now.",
    sayThis: [
      "Two days, four labs. Today is about trust. Can you take an extract and tell a senior whether it is fit to use? Can you take a KPI request and define it tightly enough that two engineers in this room would compute the same number? That is Lab A and Lab B.",
      "Tomorrow is about output. An executive performance pack a regional manager could open without you in the room. A customer-level feature table an ML engineer could pick up cold and trust. Lab C, Lab D.",
      "And one more thing while we are here, because somebody usually asks me about it on the lunch break. There is no separate capstone. There is no exam at the end. The handoff you build in Lab D - the feature table, the data dictionary in your own words, the assumptions log - that is the assessment of this entire course. Whoever picks up Lab D's handoff on Friday morning is your grader.",
    ],
    presenterCues: [
      "Land 'there is no separate capstone' clearly. Some of the room is bracing for one.",
      "Confirm your break times verbally. Do not leave logistics to a slide.",
    ],
    showThis: "Two-column map: Day 1 (Lab A, Lab B), Day 2 (Lab C, Lab D).",
    landThePoint: "The Lab D handoff is the assessment. The work is the test.",
    transition: "Now into the banking data anatomy.",
    estMinutes: 4,
  },
  // ---- Foundations (6-9) ----
  {
    slideNumber: 6,
    deckId: "s06",
    day: 1,
    segment: "Foundations",
    coreMessage:
      "Five tables, one habit. Do not lecture the table list - the room can read it. Lecture the grain question. It is the single most reusable verification habit in the whole course, and the only thing on this slide they have to leave with.",
    sayThis: [
      "There are five tables on the left of this slide. Customers, accounts, transactions, branches, tickets. They describe most of the bank you will work with. I am not going to read them to you because they are sitting there in front of you.",
      "The card on the right is the one I want to talk about. The grain question. Before you trust any number you have computed off any one of those tables, you answer this: one row in this table represents what. That is it. One sentence. If you cannot answer it tightly, every number downstream is suspect, regardless of how clean the code looked or how many checks the AI told you it ran.",
      "I will give you an example. A few months ago an engineer I was reviewing handed me an active customer count. He had filtered transactions in the last 90 days and counted distinct customer ids. The number looked sensible. Then I asked him: what is one row in this transactions table? And it turned out a row was a leg of a settlement, not a customer-initiated payment. He had counted treasury operations as customer activity. The grain question would have caught it in thirty seconds.",
    ],
    presenterCues: [
      "Skip past the five tables in under twenty seconds. They are not the lesson.",
      "Tell the grain-question story in your own words. Substitute one you have actually seen if you have a better one.",
      "When you ask the askThis, do not accept 'a transaction' as an answer. Push: posted? authorised? settled? reversal-aware?",
    ],
    showThis: "Two-card layout: tables on the left, grain question on the right.",
    askThis: ["What does one row in the transactions table at this bank actually represent? Be specific - 'a transaction' is not an answer."],
    landThePoint: "The grain question is the cheapest verification habit you will ever own. Use it on every table you open.",
    transition: "Now what these tables mean, and more importantly, what they do not.",
    estMinutes: 6,
  },
  {
    slideNumber: 7,
    deckId: "s07",
    day: 1,
    segment: "Foundations",
    coreMessage:
      "For each of the five tables, contrast what it means with what it does not mean. The contrast is the lesson.",
    sayThis: [
      "Read the table with me, row by row, and pay attention to the right column. The right column is the lesson. customers means a legal party. It does not mean one household, one device, or one unique person across time. Branches mean the booking branch. They do not mean where the customer banks day to day.",
      "Every one of those 'does NOT mean' lines is a real bug somebody at this bank shipped at some point. We are pinning them down here so they do not become bugs you ship.",
      "If you remember nothing else from this segment, remember: the 'does NOT mean' column is where most analytical errors live.",
    ],
    presenterCues: [
      "Linger on the customers row. The 'one customer is not one household' point recurs everywhere.",
      "If the room has SQL fluency, ask whether their warehouse views actually enforce the grain they assume.",
    ],
    showThis: "Five-row table: table | means | does NOT mean.",
    askThis: ["Which 'does NOT mean' line in this table have you actually been bitten by?"],
    landThePoint: "The 'does NOT mean' column is where most analytical errors live. Read it twice.",
    transition: "The gotchas that quietly break analyses.",
    estMinutes: 5,
  },
  {
    slideNumber: 8,
    deckId: "s08",
    day: 1,
    segment: "Foundations",
    coreMessage:
      "Plant the flag on time, currency, identity, and absence gotchas. Do not deep-dive - they recur in every lab.",
    sayThis: [
      "There are two cards on this slide and I am going to plant a flag on each one rather than deep-dive them. The first card is about time and currency, and the headline is that you cannot assume date columns mean what their name suggests. Posting date is not value date is not effective date, and most warehouses at this bank carry all three. On top of that, reversals can quietly move yesterday's number tomorrow, and any file with mixed currencies in the rows is a flagged file until somebody proves it has been normalised.",
      "The second card is about identity and absence, which is where most join bugs at this bank live. Null is not zero, so absence in any column has to be interpreted before you treat it as a value. Duplicate ids are sometimes re-issued ids, so always confirm before you deduplicate. And remember the cardinality: one customer can hold many accounts, one account can have many holders, and the moment you forget that your joins start drifting in ways the row count will not catch.",
      "Do not try to memorise this slide. I am planting flags here so that when one of these gotchas shows up inside a lab, you recognise it on sight and you remember we have already named it together. Each one of them comes back where it actually matters.",
    ],
    presenterCues: [
      "Move briskly. Slide 8 is reference, not the lesson.",
      "If the room asks 'which one matters most', say: in our experience the cut-off date does. We will see that in Lab B.",
    ],
    showThis: "Two-card layout: time/currency, identity/absence.",
    landThePoint: "These gotchas are not theoretical. They will show up in every lab. Recognise them on sight.",
    transition: "Now the habit that sits underneath all of those gotchas, which is definitions before code.",
    estMinutes: 4,
  },
  {
    slideNumber: 9,
    deckId: "s09",
    day: 1,
    segment: "Foundations",
    coreMessage:
      "Land the definitions-before-code rule with conviction, not as nine bullets to recite. The line they should leave with is at the top of the slide: the hour you spend pinning the definition saves the day you spend defending it. Make that personal.",
    sayThis: [
      "There is a sentence on this slide that I want you to take more seriously than any other sentence in the next two days. The hour you spend pinning a definition down saves the day you spend defending it. I have lived both sides of that trade. The hour version is uncomfortable because it feels like you are being slow. The day version is much worse because it usually happens with somebody senior staring at you.",
      "The three columns on the slide are how you spend that hour well. For every metric you compute: what is on top, what is on the bottom, what gets thrown out. For every cut: the date you froze, the time zone you froze it in, what you do about rows that arrive late. For every audience: what decision your number is going to drive, what rounding they will accept, and what one caveat has to travel with the number wherever it goes.",
      "I do not want you to memorise these nine questions. I want you to recognise them. Lab B opens with a brief template that asks you exactly these questions, by name. So get the shape in your head now and you will move faster when you sit down to do it for real.",
    ],
    presenterCues: [
      "Slow down on the lede line. Repeat it once. That is the line that has to be in the room's heads at lunch.",
      "Do not read all nine bullets out loud - it kills the energy. Walk the three columns and let the room read the bullets.",
      "On the askThis, share which one YOU skip first. The room will not be honest unless you go first.",
    ],
    showThis: "Three-column card grid: metric, cut, audience.",
    askThis: [
      "Be honest with me. Of these nine, which one are you most likely to skip when you are under time pressure? Not in theory - in practice last week.",
    ],
    landThePoint: "An hour pinning the definition saves a day defending the number.",
    transition: "Now Lab A. First time the loop runs for real, with real money on the line.",
    estMinutes: 6,
  },
  // ---- Lab A (10-21) ----
  {
    slideNumber: 10,
    deckId: "s10",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Open Lab A. Frame the goal, the surface, and the closing artefact before any participant opens the chat.",
    sayThis: [
      "Welcome to Lab A. The job here is triage. The leadership question on the table is whether a transactions extract is good enough to use for a first cut at branch performance, and you have seventy-five minutes to give a defendable answer.",
      "Look at the three cards in front of you. The goal is to decide fit, partly fit, or not yet fit, and to defend the call you make. The surface you are working on is the lab chat with the transactions extract pre-attached and the coach turned on. And the closing artefact is one short paragraph: your fitness call plus the one piece of evidence that supports it. That paragraph is what the lab is graded on.",
      "The whole workflow is the four-step loop you saw in the opening. Brief, Engage, Verify, Defend. We are going to walk each step together over the next few slides, and then you run it for real in the chat.",
    ],
    presenterCues: [
      "Confirm out loud that the chat is open in their workspace tab so they are not hunting for it later.",
    ],
    showThis: "Three-card lab opener: goal, surface, closing artefact.",
    landThePoint: "75 minutes. Four steps. One paragraph at the end.",
    transition: "Now let us read the leadership question itself.",
    estMinutes: 3,
  },
  {
    slideNumber: 11,
    deckId: "s11",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Read the leadership ask out loud. Make clear: 'looks fine' is a fail; 'fit, with caveats: 3.2% null amount on the morning batch' is the standard.",
    sayThis: [
      "Read the COO quote with me. We need a first cut on transaction performance for last month. Before we cut, can you tell me whether this extract is good enough to use? I need a yes, a partly, or a not yet, with one reason behind it. I have ten minutes.",
      "There is no second-best answer here. Saying 'looks fine' is a fail. Saying 'fit, with caveats: 3.2% null amount field on the morning batch' is the standard.",
      "The COO does not need a tour of pandas. They need a verdict and one reason. Your Brief step starts from that constraint.",
    ],
    presenterCues: [
      "Read the quote in COO voice. Make it feel like an actual conversation.",
      "If anyone says 'we would never get this question this way', answer: yes you would, and your written answer is the deliverable either way.",
    ],
    showThis: "Single quote card framed as 'From the COO desk'.",
    landThePoint: "A verdict plus one reason. Hedging is not a triage.",
    transition: "What is in the extract.",
    estMinutes: 3,
  },
  {
    slideNumber: 12,
    deckId: "s12",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Read the data card and the declared-issues posture aloud. Frame verification as a habit, not a gotcha.",
    sayThis: [
      "Look at the card on the left. The extract you are working with is transactions.csv. One row in the file is one posted transaction, the file holds roughly ten thousand rows, and the columns you have to work with are listed there in front of you. The data is mixed across channels and transaction types, which is normal for a real extract from this bank.",
      "Now look at the card on the right, because the posture line is the part most engineers skim past. The posture is declared issues. That means we are telling you upfront that there is at least one known data quality problem in this file. Your job is to find it, decide whether it actually changes your fit verdict, and document in your defence what you would do about it.",
      "I want to be explicit about why we put the posture on the slide rather than letting you discover it cold. Real bank extracts are not clean. Verification is not a gotcha that we are running on you; it is a normal engineering habit, the same one a careful engineer would run on any feed they had not seen before. We are telling you the file has issues so that you spend the seventy-five minutes finding the ones that matter, not pattern-matching for problems in general.",
    ],
    presenterCues: [
      "Make the 'verification is a habit, not a gotcha' point clearly. It frames the rest of the labs.",
    ],
    showThis: "Two-card layout: file contents, declared posture.",
    landThePoint: "Declared posture. Verification is a normal engineer habit, not a trick.",
    transition: "Step 1. The Brief. This is where the lab is won or lost.",
    estMinutes: 3,
  },
  {
    slideNumber: 13,
    deckId: "s13",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "This is the slide where Lab A is won or lost, and most of the room does not yet know that. Do not just read the three brief questions. Make the case for why three sentences typed before opening the chat is the single highest-leverage thing they will do today.",
    sayThis: [
      "If you remember one slide from Lab A, make it this one. Step 1. Brief. Three sentences typed into the chat, in your own words, before you ask the AI for anything.",
      "I know that sounds slow. I know AI is fast and you can be querying the data inside thirty seconds. The reason we slow you down here is that almost every wrong answer I have ever seen come out of an AI tool came from an engineer who started with the prompt instead of the question. The prompt is downstream of the question. If you have not got the question pinned, the prompt is going to drift.",
      "Three things to pin. What is the question - in your words, not leadership's. What would 'defendable' look like - what evidence would let you commit to fit, partly fit, or not yet fit, without hedging. And the one definition or threshold you have to lock down before any prompt is even useful. For Lab A that is usually 'what does fit-for-first-pass actually mean to me'.",
      "When the three sentences are in the chat, click 'Mark brief done'. The coach reads it and from that point on coaches you against your own brief, not against a generic notion of the right answer. If you skip the brief, the coach has nothing to coach against. That is on you.",
    ],
    presenterCues: [
      "Stop talking and look at the room. Wait until you see fingers on keyboards. Do not click next until at least half the room has typed. This is the single biggest failure mode in Lab A.",
      "If somebody asks what 'defendable' means, do not answer for them - bounce back: 'You tell me. If your manager read your fitness call out loud in a meeting tomorrow, what would have to be in it?'",
      "Resist the urge to demo the brief on the projector. The brief is theirs, not yours.",
    ],
    showThis: "Lede + three-card layout for the three brief questions.",
    askThis: ["If your manager pulled you aside tomorrow about this fitness call, what one piece of evidence would you want already written down?"],
    doThis: ["Wait until every participant has typed their brief and clicked Mark brief done. Do not advance until the chat shows it."],
    landThePoint: "The prompt is downstream of the question. Pin the question first or the lab silently bends.",
    transition: "Now Step 2. Engage.",
    estMinutes: 7,
  },
  {
    slideNumber: 14,
    deckId: "s14",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Show how to brief the AI like a junior engineer. Set context first, then ask for one thing at a time.",
    sayThis: [
      "Step two of the loop is Engage, and the rule of thumb here is to brief the AI the way you would brief a junior engineer joining the team this morning. They are smart, they are fast, and they know nothing about the context until you tell them. There are two cards on the slide and they map to that idea exactly.",
      "Look at the card on the left. Before you ask any data question, you set the context in three sentences. What table you are looking at, in business terms. What 'fit for first-pass' actually means in this lab, taken straight from your brief. And what the answer is going to be used for downstream, which here is the COO's verdict. Those three sentences are the briefing a junior would need before you handed them the file.",
      "Then look at the card on the right and read the prompts with me. Once the context is set, you ask for one thing at a time. 'Show me the column types and the row count.' 'Show me the null rate per column.' 'Show me posting_date range and any rows outside last month.' Specific prompts get verifiable answers. Vague prompts get confident-looking nonsense, and you will spend the next forty minutes chasing it.",
    ],
    presenterCues: [
      "Demo one prompt out loud if the room looks unsure. Just one. Do not over-coach the chat.",
    ],
    showThis: "Two-card layout: context first, one thing at a time.",
    landThePoint: "Specific prompts get verifiable answers. Vague prompts get confident-looking nonsense.",
    transition: "Now Step 3, where you choose your checks.",
    estMinutes: 4,
  },
  {
    slideNumber: 15,
    deckId: "s15",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Distinguish structural checks (always run) from banking checks (judgement). Get the room to choose, not the coach.",
    sayThis: [
      "Step three is Verify, and the most important word on this slide is 'choose'. You are choosing the checks that go into your verification, not the coach. The coach will happily give you a default battery if you ask for one, but the choice of which checks belong on this extract for this question is judgement, and judgement is what you are being trained on.",
      "Look at the left card first. Structural checks always run, regardless of the question. Row count against what you expected. Column types. Primary key uniqueness on txn_id. Null rate per column with a threshold you set rather than the coach's default. Those four are non-negotiable on every extract you ever triage.",
      "Now the right card, which is where the judgement lives. Banking checks. Posting_date inside the requested period. Amount sign convention consistent with txn_type. Currency uniform across rows, or a documented conversion path if it is not. Account_id present in the accounts table, or flagged if it is missing. These are the checks that actually catch real issues, the ones that move the COO's verdict.",
      "One more thing before we move on. When the data starts to look too clean, use the 'Pressure-test this' and 'What might be wrong here?' quick actions in the composer. Too clean is itself a signal in this work, and those two buttons are the shortest path to interrogating it.",
    ],
    presenterCues: [
      "Point the chat composer's quick action row out explicitly so participants know where to click.",
    ],
    showThis: "Two-card layout: structural checks, banking checks.",
    askThis: ["Which banking check do you think is most likely to catch the declared issue in this extract?"],
    landThePoint: "Structural checks always. Banking checks by judgement. Use the pressure-test quick actions when it looks too clean.",
    transition: "Now the close of the loop, which is Step 4: Defend.",
    estMinutes: 5,
  },
  {
    slideNumber: 16,
    deckId: "s16",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Walk the three-sentence fitness call structure. The Defend submission is the artefact.",
    sayThis: [
      "Step four is Defend, and your job here is to write a three-sentence fitness call that the COO could read in thirty seconds and act on. Three sentences is the discipline. Not a paragraph, not a list, not a slide. Three sentences.",
      "The first sentence commits to the verdict: fit, partly fit, or not yet fit. The second sentence names the single piece of evidence that decided it for you, with a number where you have one. And the third sentence carries the caveat or the follow-up that leadership needs to know before they act on the verdict. That is the structure the rest of this course is going to keep coming back to.",
      "Once you have written it, the coach will surface a challenge question. Answer it in writing, in the same chat, and then click 'Submit my Defend answer'. That submission is the artefact this lab is graded on. Not the chart, not the cells you ran, not the conversation along the way. The written defence is what travels.",
    ],
    presenterCues: [
      "Repeat 'the written defence is the artefact' explicitly. It is the single most underused move in the room.",
    ],
    showThis: "Single defendable-structure card with the three-sentence shape.",
    landThePoint: "Three sentences. Submit. The written defence IS the artefact.",
    transition: "Before you run, here are the common ways triage goes wrong.",
    estMinutes: 4,
  },
  {
    slideNumber: 17,
    deckId: "s17",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Pre-empt the four common triage failure modes: confidence without evidence, sampling without saying so, missing the issue that matters, hedging.",
    sayThis: [
      "Before you start the lab I want to walk you through the four ways triage typically goes wrong, because I have seen each of these often enough that they are predictable. If you can recognise them in your own work as you go, you will catch yourself before the coach has to.",
      "The first failure is confidence without evidence. It sounds like 'looks clean' or 'all good' with no number behind it. The fix is simple: tie every verdict you write to a check you actually ran. The second is sampling without saying so. You eyeball the first fifty rows on the screen, the data looks reasonable, and you decide for the whole file. If you sampled, state the sample. If you did not, run the check on the whole file.",
      "The third failure is the most common, which is missing the one issue that actually matters. Clean structure does not mean the file is analytically usable, and it is easy to spend forty minutes confirming that the columns parse and never ask the harder question, which is whether what you are looking at would change the call leadership has to make. Always come back to that question before you write the verdict. And the fourth failure is hedging. 'It depends' is not a triage. Pick a position, commit to it in sentence one, and put your caveats in the sentence after. Hedging looks safe in the chat and reads as evasive in the meeting.",
    ],
    presenterCues: [
      "Watch for all four during the lab and call them out by name as you walk the room.",
    ],
    showThis: "Four-card grid of failure modes with a one-line tell each.",
    landThePoint: "Confidence-without-evidence and hedging are the failure modes that look professional but fail under one round of pushback.",
    transition: "Now a word on how to handle the coach itself.",
    estMinutes: 4,
  },
  {
    slideNumber: 18,
    deckId: "s18",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Tell the room when to ask the coach and when to push back on it. The coach is a partner, not an oracle.",
    sayThis: [
      "There are two cards on this slide and they are about how to actually use the coach during the lab. The left card is when to ask. Ask the coach when you need a check expressed as code and you do not want to type it yourself, when you hit a traceback and the error message is not obviously tractable, or when you want a second pair of eyes on whether your verdict is well-supported. Those are the moments where the coach earns its keep.",
      "The right card is the one most engineers find harder, which is when to push back on the coach. Push back when it gives you an answer with no numbers behind it. Push back when the check ran cleanly but the conclusion the coach drew does not actually follow from the output you can see on screen. And push back when the coach reaches for a definition you did not give it. When that happens, restate your own definition in the chat and make the coach use yours.",
      "The framing I want you to hold is this. The coach is a partner, not an oracle. Treat it the way you would treat a sharp junior engineer who is fast and well-meaning but does not know this bank. You would not let that engineer ship a number unchallenged, and you should not let the coach either.",
    ],
    presenterCues: [
      "If anyone treats the coach as authoritative, name it gently in the moment.",
    ],
    showThis: "Two-card layout: ask when, push back when.",
    landThePoint: "The coach is a sharp junior. Use it. Push back on it.",
    transition: "If you finish the core triage early, here are the stretch checks.",
    estMinutes: 3,
  },
  {
    slideNumber: 19,
    deckId: "s19",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Surface stretch checks: plausibility, hour of day, channel mix. For participants who finish the core triage early.",
    sayThis: [
      "If you finish the core triage before the seventy-five minutes is up, do not sit on your hands. There are three stretch checks on the slide and I want you to pick the one that looks most relevant to your verdict and run it. Plausibility on the top-one-percent amount values. Distribution of posting_date by hour of day. Channel mix versus last month.",
      "Every one of these has caught a real bug at a real bank. They are listed as stretch not because they are technically harder than the structural checks, but because they need a comparison point: last month's file, a reference table, or a known baseline. If you have time and you can get hold of a comparison, you can make your fitness call meaningfully stronger by running one of them.",
    ],
    presenterCues: [
      "Have the stretch checks ready as a fallback for fast finishers so the room never goes idle.",
    ],
    showThis: "Three-card stretch grid.",
    landThePoint: "Stretch is comparison work, not difficulty work.",
    transition: "Now we hand off to the lab itself.",
    estMinutes: 2,
  },
  {
    slideNumber: 20,
    deckId: "s20",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Hand off to the lab chat. State the timebox out loud and walk the room continuously.",
    sayThis: [
      "You are about to start a seventy-five-minute solo run. The button on this slide opens Lab A in your chat with the transactions extract pre-attached, so you do not have to hunt for the file. Click into it now.",
      "Listen to the plan for the timebox before you start typing, because the shape of the seventy-five minutes is part of the lesson. Your first ten minutes are the Brief: type your three sentences in the chat and click 'Mark brief done' before you ask the coach for anything. From minute ten to minute forty you are in Engage and Verify, driving the loop, asking specific prompts, and running the checks you chose. From minute forty to fifty-five you are in Defend: write the three-sentence fitness call, answer the challenge question, and click 'Submit my Defend answer'. The last twenty minutes, fifty-five to seventy-five, you walk to a peer, pressure-test each other's defence out loud, and we come back together for the debrief.",
      "I am going to be walking the room the whole time. If your screen is quiet for more than two minutes I am going to come over and ask you why, so do not be shy about getting unstuck out loud rather than alone.",
    ],
    presenterCues: [
      "State the timebox out loud, not just on the slide. The timebox is the lesson too.",
      "Walk the room continuously during the lab. Read screens, do not just listen.",
    ],
    showThis: "Two-card lab launcher: open chat, timebox.",
    doThis: ["Click into the lab. Start the timer. Walk the room."],
    landThePoint: "75 minutes. Brief first. Defend submission is the artefact.",
    transition: "Now we come back together for the Lab A debrief.",
    estMinutes: 75,
  },
  {
    slideNumber: 21,
    deckId: "s21",
    day: 1,
    segment: "Lab A",
    coreMessage:
      "Lab A debrief is the first time the room hears what defendable actually sounds like in another engineer's voice. Hand the mic, do not lecture. Pick two reads in advance and let the room judge.",
    sayThis: [
      "I want two of you to read your fitness call out loud, and then I want the rest of the room to do something specific. I want you to listen for one thing only: would you be willing to put your name next to that call in front of the COO. Not whether you agree. Whether you would defend it.",
      "[Call your first reader.] Take your time. Read it the way you would say it in the meeting.",
      "[After both reads.] Show of hands. Which one would you defend? Now I want one voice from the room to tell us what made the difference. Not your fitness call - the difference between the two you just heard.",
      "One last thing before we break. Whatever check you found that the coach would not have suggested - the one where you pressure-tested something the AI did not flag - bring that into Lab B. That instinct is the muscle. Lab B is the same loop on a much harder question, and the engineers who briefed well here are going to move twice as fast there.",
    ],
    presenterCues: [
      "Pick your two readers walking the room during the lab. Pick one strong, one borderline. Do not announce which is which.",
      "After the votes, name one thing each reader did well. Be specific - 'you named the threshold' beats 'good defence'.",
      "Capture the standout verification check in your notes for the Day 1 close.",
    ],
    showThis: "Three-card debrief layout.",
    askThis: [
      "Of those two fitness calls you just heard, which one would you put your own name on in front of the COO? And what was it - in their words - that made you trust it?",
    ],
    landThePoint: "Listen for what you would defend, not what you would agree with. That is how engineers grade engineers.",
    transition: "Fifteen-minute break.",
    estMinutes: 9,
  },
  // ---- Break (22) ----
  {
    slideNumber: 22,
    deckId: "s22",
    day: 1,
    segment: "Break",
    coreMessage:
      "Reset. Frame the next segment: the question is about to get harder. Not 'is the data fit', but 'what does the metric actually mean'.",
    sayThis: [
      "Take fifteen minutes. Stand up, refill, and we will pick up here.",
      "When we come back, the question gets a little harder. It is no longer whether the data is fit, it is what the metric actually means, and that is the heart of Day 1.",
    ],
    presenterCues: [
      "Confirm one Lab A defence is in your notes for the Day 1 closing readback.",
    ],
    showThis: "Single break card.",
    landThePoint: "Reset. The harder question comes next.",
    transition: "After the break we go straight into Lab B.",
    estMinutes: 15,
  },
  // ---- Lab B (23-33) ----
  {
    slideNumber: 23,
    deckId: "s23",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Lab B is the heart of Day 1, and the trainer's job on this opener is to reset expectations - this is not 'build a chart fast', this is 'pin a definition tightly enough to defend in front of someone whose budget depends on the answer'. The 90-minute timebox feels generous, and the trainer has to explain why.",
    sayThis: [
      "Lab A asked you whether the data was usable. Lab B asks you something harder. What does the metric actually mean? Leadership wants branch performance for last quarter. Sounds simple. It is not. Branch performance can be defined eight different ways, and at least four of them will give a different ranking, and any one of those rankings can move people's careers depending on which branch lands at the bottom.",
      "You have 90 minutes. I know it sounds like a lot for one KPI. It is not. The reason is on the next few slides: definition work is slower than building work, and the engineers who try to skip the definition work to save time are the ones who get stuck rebuilding their KPI three times before lunch.",
      "By the end of the 90 minutes you walk out with two things. The version of the KPI you would actually ship to the regional lead. And one paragraph in your own voice telling them why this version and not the other one you considered. That paragraph is the artefact. Not the chart. Not the table. The reasoning.",
    ],
    presenterCues: [
      "Land the 90-minute number with conviction. The room will twitch. Tell them why before they ask.",
      "Do not list the three cards. Say the lab in your own voice; the cards are decoration.",
    ],
    showThis: "Three-card lab opener.",
    landThePoint: "Two versions considered. One shipped. The reasoning between them is the artefact.",
    transition: "What the regional lead actually asked for.",
    estMinutes: 4,
  },
  {
    slideNumber: 24,
    deckId: "s24",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Read the regional lead quote. Frame the stakes: the number drives staffing decisions; every definition behind it gets challenged.",
    sayThis: [
      "Read the regional lead quote on the slide with me, in their voice. 'Give me branch performance for Q1. I want a table, ranked, with the headline number per branch. We are reviewing rotations and people will get moved on the back of this. I need it to be defendable when branch managers ask.'",
      "That is the audience you are writing for. When a number drives staffing decisions, every definition behind it gets challenged, and you have to answer to that, not in the abstract but in front of the branch manager who is now reading why their branch is bottom-quartile.",
      "Hold that picture in your head as you write the brief, because the brief is what you will fall back on when the manager pushes.",
    ],
    presenterCues: [
      "Make the 'people will get moved' point explicitly. Defendability is not a theoretical bar in Lab B.",
    ],
    showThis: "Single quote card framed as 'From the regional lead'.",
    landThePoint: "This number moves people. Definitions are the part that gets challenged.",
    transition: "Now let me show you what is in the lab.",
    estMinutes: 3,
  },
  {
    slideNumber: 25,
    deckId: "s25",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Read the data card and the mixed posture out loud, and frame mixed as the instruction to treat the extract the way they would treat a real upstream feed.",
    sayThis: [
      "You have three tables attached for this lab. branches.csv carries branch_id, branch_name, region, and opened_date. accounts.csv carries account_id, customer_id, branch_id, opened_date, and status. And transactions.csv has the same columns you were already working with in Lab A.",
      "Now look at the right card. The posture this time is mixed. This extract has been used before, so we know about some of its issues, but there may well be others we do not, and you should treat it exactly the way you would treat a real upstream feed at the bank.",
      "Mixed is the most realistic case you will deal with. Most extracts at this bank are mixed, and the discipline of working with them is part of what we are training in Lab B.",
    ],
    presenterCues: [
      "Do not list the known issues out loud. The room is supposed to find them.",
    ],
    showThis: "Two-card layout: tables, mixed posture.",
    landThePoint: "Mixed posture. The realistic case. Treat it the way you would treat a real feed.",
    transition: "Now into the discipline that holds Lab B together, definitions.",
    estMinutes: 3,
  },
  {
    slideNumber: 26,
    deckId: "s26",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Land N/D/E/cut-off as the four questions every KPI lives or dies by. The trainer's job is to make the room feel that any one of these, answered loosely, sinks the whole defence. Stories beat bullets here.",
    sayThis: [
      "Four questions. Pin them and your KPI defends itself. Skip any one of them and somebody senior will pin it for you in a meeting where you would rather be doing anything else.",
      "Numerator. What event actually counts as performance for this branch. Posted transactions sounds obvious until you remember that a corporate treasury settlement counts the same as a customer payment in the raw data. So which one are you measuring? Denominator. What are you dividing by, and at what point in time. Accounts open on day one of the quarter? Accounts active across the quarter? Both will give you a number, both are defensible, and they are not the same number.",
      "Exclusions. What are you choosing to throw out, and can you say it out loud without flinching. Internal transfers? Reversed transactions? Dormant accounts? Test accounts the systems team forgot to clean up? Each of those is a choice you are making for the regional lead, whether you tell him or not. And cut-off. Posting date or value date. Time zone. What you do about the rows that arrive on Tuesday for transactions that happened on Sunday. Late-arriving rows are where most reproducibility bugs at this bank actually live.",
      "Every one of these will get hit at Defend. Not by me. By another engineer in this room playing branch manager. So pin them down now, in your brief, in your words. Future-you will thank present-you.",
    ],
    presenterCues: [
      "Tell the corporate-settlement-versus-customer-payment example slowly. Substitute one from your own work if you have a sharper one.",
      "Drop your voice on 'late-arriving rows are where most reproducibility bugs at this bank actually live'. That is a corridor line.",
      "On the askThis, listen for whether the room knows who decides. If the answer is 'nobody' or 'finance, I think', that itself is the lesson.",
    ],
    showThis: "Single definition-card with N/D/E/cut-off.",
    askThis: ["At your bank, when a KPI like this gets disputed, who actually has the authority to settle the four questions? Or do four people each get to decide and ship a different number?"],
    landThePoint: "Pin N, D, E, and cut-off in writing. Or get pinned by them in front of someone whose budget moves on your number.",
    transition: "Step 1. The brief, with those four questions on the page.",
    estMinutes: 7,
  },
  {
    slideNumber: 27,
    deckId: "s27",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Show what bad and defendable actually look like in practice, side by side. The trainer should refuse to advance until at least three real briefs are visible in chat. The bar - 'two engineers, same brief, same number' - is the line that has to land.",
    sayThis: [
      "Look at the slide. Two briefs. The one on the left looks innocent and is the most expensive mistake in this room. 'Branch performance for Q1, ranked.' That is what almost every engineer who has not done this before will type into the chat. And the AI will happily compute something. The number will look reasonable. Six weeks later somebody will compute it differently and you will have a problem you cannot trace.",
      "Now look at the brief on the right. Notice what it has that the left one does not. The thing being summed. The window. The exclusion - and a specific filter for it. The grouping. The ranking direction. The currency. Five lines. Five questions answered. No code yet. That is a defendable brief.",
      "The bar I want you to hold yourself to is this. If two engineers in this room read your brief, would they compute the same number? If yes, click Mark brief done. If you are not sure, the brief is not done yet. I will be reading them.",
    ],
    presenterCues: [
      "Do not advance until you can read three real briefs from the chat. Read one good one aloud and one that needs sharpening - ask the room which is which.",
      "When somebody asks 'is this enough?' bounce it back: 'would I compute the same number from it?' Make them apply the bar themselves.",
    ],
    showThis: "Two-card layout: bad brief, defendable brief.",
    doThis: ["Wait until three briefs are visible in chat. Read one good and one borderline. Let the room judge."],
    landThePoint: "Two engineers, same brief, same number. That is the brief bar.",
    transition: "Step 2. Engage.",
    estMinutes: 8,
  },
  {
    slideNumber: 28,
    deckId: "s28",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Brief the AI on the metric, not just the table. Paste the N/D/E/cut-off into the chat and ask for the table plus the joins plus row counts.",
    sayThis: [
      "We are now at Step 2, Engage, and the move at this step is to brief the AI on the metric, not just on the table. The coach needs to know what you are measuring, not only what you are measuring it from.",
      "Give the coach the brief in full. Paste the N, D, E, and cut-off you just wrote, exactly as you wrote them. The coach is a partner, not a mind-reader, and if you do not give it the definition it will quietly pick one for you. The moment that happens, you have just delegated the most important decision in the lab.",
      "Then ask for the table, the joins, and row counts at each step. Read the right card on the slide with me. 'Build the branch KPI table per my brief above. Show me the join, I want to see what got dropped. Show me row counts at each step so I can trust the result.' That is the shape of the prompt you want the chat to start with.",
    ],
    presenterCues: [
      "Watch for participants who let the coach default the definition for them. Call it by name when you see it.",
    ],
    showThis: "Two-card layout: brief in full, ask for joins and row counts.",
    landThePoint: "If you do not give the coach the definition, you have delegated it.",
    transition: "Once the table is built, we are into Step 3, Verify.",
    estMinutes: 5,
  },
  {
    slideNumber: 29,
    deckId: "s29",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "The verify move in Lab B is the alternative-denominator swap. Have participants compute both versions of the KPI and compare the rankings side by side.",
    sayThis: [
      "Step 3 is Verify, and the verify move in Lab B is a single one. One swap, one comparison.",
      "Hold your numerator constant and swap in one alternative denominator. The classic example is active accounts at quarter-end versus accounts open at quarter-start, but pick whichever pair makes sense for your brief. Compute both versions of the KPI, then put the two rankings next to each other and look at them.",
      "Look at the right card with me. Which branches move ranks under the swap? By how much, one place, or are they sliding from top-three to mid-pack? And which version is more honest about what last quarter actually was at this bank? Those are the questions that decide which version you end up shipping.",
      "If the two rankings stay stable, your metric is robust and you can move on. If they do not, you have a definition problem on your hands, and the choice between them is now yours to defend.",
    ],
    presenterCues: [
      "Make sure participants actually run both versions. Eyeballing one and trusting it is the failure mode.",
    ],
    showThis: "Two-card layout: the verify move, what to look at.",
    landThePoint: "Two versions, side by side. The choice is the lesson.",
    transition: "Which lands us on the trap on the next slide, two trustworthy versions.",
    estMinutes: 5,
  },
  {
    slideNumber: 30,
    deckId: "s30",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Name the two-trustworthy-versions trap explicitly. Both versions are technically correct. The choice is what gets challenged.",
    sayThis: [
      "Both versions are technically correct. The numerator is the same. The denominator changed. Both queries ran. Both produced a ranked table. Both can be defended in isolation.",
      "The trap is treating the choice as arbitrary. It is not. The choice is the thing that gets challenged. The choice is what you defend in front of the regional lead.",
      "Pick the one that survives the question 'what does this metric mean for a branch that opened mid-quarter?' That is one example of a question a branch manager will ask. Your defence is built around questions like that.",
    ],
    presenterCues: [
      "This slide is the conceptual heart of Day 1. Slow down. Do not let it pass as a transition.",
    ],
    showThis: "Single card naming the trap.",
    askThis: ["Have you ever shipped a number where you knew there was a defensible alternative that gave a different answer? What did you do about it?"],
    landThePoint: "Both versions correct. The choice is the lesson. The choice is what you defend.",
    transition: "Step 4. Defend.",
    estMinutes: 6,
  },
  {
    slideNumber: 31,
    deckId: "s31",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Defend the version you would ship. Three sentences. The rubric is on definitions, not on code.",
    sayThis: [
      "We are at Step 4, Defend, and the shape is the same one you used in Lab A. Three sentences, written in your voice, addressed to the regional lead.",
      "The first sentence names which version of the KPI you would ship. The second sentence says what changes about staffing decisions if you shipped the other version instead. And the third sentence is the one caveat the regional lead has to know before they open the table.",
      "The coach will then surface your challenge question, and your job is to hold the line. The rubric here is on definitions, not on code, so if your answer comes back as 'I used an inner join on branch_id', you are answering the wrong question. Stay on the choice you made about N, D, E, or cut-off, and defend that. Then click Submit my Defend answer in the chat.",
    ],
    presenterCues: [
      "Read 'rubric is on definitions, not on code' twice. That is the orientation participants need.",
    ],
    showThis: "Single defendable-structure card.",
    landThePoint: "Three sentences. Definitions, not code. Submit.",
    transition: "Before you go in, a word about how the coach behaves at each step.",
    estMinutes: 4,
  },
  {
    slideNumber: 32,
    deckId: "s32",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Frame how the coach behaves in Engage versus Defend. Helpful in Engage, skeptical in Defend.",
    sayThis: [
      "There are two cards on the slide because the coach behaves differently at different points in the loop, and you should know what to expect. In the Engage step, the coach is helpful. It will write the join for you, narrate the row counts as they come back, and suggest a sensible default when your brief leaves something open. But it will only ever suggest one default, and if you let that default stand, you have just delegated the definition to the model.",
      "In the Defend step, the coach is skeptical. It will press on the parts of your definition that are thin. It will not write the answer for you, and it will hold you to the rubric of whichever challenge question it picked.",
      "Same coach, two postures. The shift happens automatically the moment the active task in the chat moves into the Defend step, and you will see it on screen as the step indicator changes at the top of the active task bar.",
    ],
    presenterCues: [
      "Point at the step indicator on the active task bar when participants are in the chat. It is the visible signal of the shift.",
    ],
    showThis: "Two-card layout: Engage posture, Defend posture.",
    landThePoint: "Helpful on Engage. Skeptical on Defend. Same coach, different step.",
    transition: "Now we run the lab.",
    estMinutes: 4,
  },
  {
    slideNumber: 33,
    deckId: "s33",
    day: 1,
    segment: "Lab B",
    coreMessage:
      "Lab B is now in their hands. The trainer's job at handoff is to set the rule, set the clock, and get out of the way. The room learns by doing for 90 minutes; the trainer walks and listens.",
    sayThis: [
      "Open the chat using the button on the slide. Your three tables, branches, accounts, and transactions, are pre-attached for you, and we are starting the ninety-minute clock from right now.",
      "One rule before you go in. No code until your definition is on the page. If I walk past your screen and see pandas before I see N, D, E, and cut-off written down in your chat, I will send you straight back to the brief.",
      "Here is a rough shape for the ninety minutes, just so you have one in your head. The first fifteen are for pinning the definition. The next thirty-five are for getting the KPI built. The twenty after that are for swapping one part of the definition, usually the denominator, and watching how the ranking moves. The last twenty are for your defence and the challenge question the coach surfaces. You do not have to follow that shape exactly, but you do have to defend the answer you land on at the end.",
      "I will be walking the room the whole time. If you want me to look at something, wave me over, and if I stop at your shoulder it is because I have read something good or something I want you to sharpen before Defend.",
    ],
    presenterCues: [
      "Walk continuously for the first thirty minutes. Brief work is where 80% of the lesson lives.",
      "When you find a strong brief in the room, ask the engineer if you can read it aloud at the debrief. Tell them now, not later.",
      "Catch the engineers who go quiet. Quiet usually means stuck on the definition - help them name what they are stuck on.",
    ],
    showThis: "Two-card lab launcher: open chat, timebox.",
    doThis: ["Start the 90-minute timer. Walk continuously."],
    landThePoint: "Definition on the page before any code. Ninety minutes. I am walking.",
    transition: "After Lab B we close out Day 1 together.",
    estMinutes: 90,
  },
  // ---- Day 1 close (34) ----
  {
    slideNumber: 34,
    deckId: "s34",
    day: 1,
    segment: "Day 1 close",
    coreMessage:
      "Close Day 1 with reflection, not logistics. The room has just done two labs of hard definition work; honour it. Get two reflections per engineer in the chat and tee Day 2 up as the day the work goes outward.",
    sayThis: [
      "Before anybody closes a laptop, I want to slow down for a minute. Today was harder than it looked on the agenda. You wrote four briefs. You defended fitness calls. You pinned definitions tight enough that two engineers in this room would compute the same KPI. That is real engineering work, and I want you to leave today knowing it.",
      "Two reflections in the chat before you go. The first one is about briefing - one thing you learned about how to brief AI well. Two sentences. The second one is about defending - one thing you learned about defending a definition. Two sentences. They are for you. I will read them tonight and bring the strongest pair back to the room tomorrow morning.",
      "Tomorrow the work goes outward. Today you proved you can find the truth in the data. Tomorrow you have to convince other people of it. Two audiences - a regional manager and an ML engineer. Same standard.",
    ],
    presenterCues: [
      "Do not start with logistics. Start with the work the room just did. Logistics at the end.",
      "Wait until both reflections are visible in chat for everyone before you close. This is not optional.",
      "Confirm Day 2 start time and the workspace tab to reopen as the LAST thing you say.",
    ],
    showThis: "Three-card close: brief moment, defend moment, tomorrow.",
    landThePoint: "Today you found the truth in the data. Tomorrow you convince other people of it.",
    transition: "See you in the morning.",
    estMinutes: 12,
  },
  // ---- Day 2 opening (35-37) ----
  {
    slideNumber: 35,
    deckId: "s35",
    day: 2,
    segment: "Day 2 opening",
    coreMessage:
      "Do not open with 'Welcome back'. Anchor the room in the work they did yesterday by quoting it back at them, then point at the harder thing today asks for. The standard goes up today, not down, and they need to feel that without being told.",
    sayThis: [
      "I read your reflections last night. There is one I want to read back to the room because it landed for me. [Read one verbatim from yesterday's chat.] That is the engineer voice we are building toward. Hold onto it.",
      "Yesterday's bar was: can you trust the data and pin the definition tightly enough to defend it. You cleared it. Today the bar moves. Today it is: can you convince somebody else who was not in the room with you. A regional manager who will only ever see your chart. An ML engineer who will only ever see your dictionary. Different surfaces. Same standard. Harder, because they are not in the room and you cannot talk over the gaps.",
      "Two labs. One closing handoff. By Friday afternoon you are walking out with one feature table, one data dictionary you wrote in your own words, and a verbal readback of what the data does and does not support. That readback is the assessment of this entire course.",
    ],
    presenterCues: [
      "Open with a real quote from a Day 1 reflection. Anonymise if needed but make it specific. This is the cheapest way to make the room feel seen.",
      "Land 'the bar moves up today'. The room should not feel coasting on Day 2.",
    ],
    showThis: "Day 2 cover slide.",
    landThePoint: "Yesterday you found the truth. Today you convince the people who were not in the room with you.",
    transition: "Two audiences. Same standard.",
    estMinutes: 5,
  },
  {
    slideNumber: 36,
    deckId: "s36",
    day: 2,
    segment: "Day 2 opening",
    coreMessage:
      "Two audiences, one standard. The cards are on the slide; what they need from the trainer is the example of what bad looks like with each audience, and why defendability is the unifier.",
    sayThis: [
      "I want to make this two-audience point real, because it is easy to nod at and miss in practice. Picture the regional manager opening your performance pack on his phone in a Sunday morning meeting. He is not going to read three paragraphs of methodology. He is going to look at one chart, form an opinion, and either trust you or not. The caveat that lives in slide seven of your appendix may as well not exist. If the caveat matters - and at this bank it always matters - it has to live on the chart, in plain words, where his eye lands.",
      "Now picture the ML engineer who picks up your feature table in six months. You will not be in that conversation. He will not message you to ask what active customer means. He will look at your dictionary, decide whether it is precise enough to train against, and either build on it or rebuild it from scratch. If your dictionary is not specific, he rebuilds, and your two days of work become his starting point only.",
      "Different surfaces. Different consumers. Same standard. The standard is defendability. A chart that survives a regional manager's question. A feature table that survives a leakage audit. If you walk out of Day 2 with that single sentence in your head, the rest of the day will land.",
    ],
    presenterCues: [
      "Tell the regional manager 'on his phone' story in your own words. The specificity is the lesson.",
      "When you say 'becomes his starting point only', let it land. Many engineers in the room will recognise being on the receiving end of that.",
    ],
    showThis: "Two-card layout: leadership wants a story, ML wants a contract.",
    askThis: ["Which of those two audiences do you find harder to write for? And what is it about your own working style that makes it harder?"],
    landThePoint: "Two surfaces. One standard. The standard is defendability.",
    transition: "What both audiences actually need from you.",
    estMinutes: 5,
  },
  {
    slideNumber: 37,
    deckId: "s37",
    day: 2,
    segment: "Day 2 opening",
    coreMessage:
      "Land the message that both audiences are asking for the same thing, which is defendability, and then walk the room through the three cards: Lab C as the executive pack, Lab D as the ML-ready handoff, and the closing readback that together form the assessment.",
    sayThis: [
      "Whether you are building a pack for a CFO or a feature table for a model, both audiences are asking you for the same thing, which is defendability. A chart that survives a senior question, a feature table that survives a leakage audit. Different surfaces, same standard, and that is the through-line for everything you do today.",
      "Look at the three cards on the slide with me. Lab C is the executive pack: two charts, one exception view, one explicit caveat, all defended in a one-paragraph note in your voice. Lab D is the handoff: one ML-ready customer feature table plus a data dictionary written in your own words, not the coach's.",
      "And then the close, which is the third card. You will read your dictionary back to the room, and you will name one truth your data clearly supports and one it does not. That readback, together with your three earlier defences, is the entire assessment for this course. There is nothing else.",
    ],
    presenterCues: [
      "Name the assessment line explicitly. The four defences across both days are it.",
    ],
    showThis: "Three-card preview: Lab C, Lab D, Close.",
    landThePoint: "Defendability, both surfaces. Four defences are the assessment.",
    transition: "Now let me walk you into Lab C.",
    estMinutes: 4,
  },
  // ---- Lab C (38-48) ----
  {
    slideNumber: 38,
    deckId: "s38",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Lab C is the first time the work has to convince somebody who was not in the room. The trainer's job on the open is to land that shift and to introduce the one new behaviour - using the coach as an adversary - which most engineers will instinctively avoid.",
    sayThis: [
      "In Lab B you defended your KPI to me and to each other. In Lab C you defend it to somebody who is not in the room. A regional CFO opens your pack on Monday morning, gives it three minutes, forms an opinion, and either trusts you or does not. There is no version of this where you get to talk over the gaps. The pack has to do that work without you.",
      "What you are walking out with: two charts that survive on their own, one exception view, and one caveat written so plainly that the CFO cannot miss it. The caveat is the part most engineers want to bury. We are going to do the opposite. We are going to put it on the chart.",
      "And the new behaviour for this lab. Up until now you have used the coach as a partner. In Lab C I want you to use the coach as an adversary. Every claim you put in the pack, you are going to ask the coach to argue against it. We will get to the buttons in Step 3 - just know it is coming, because most of you are going to find it uncomfortable.",
    ],
    presenterCues: [
      "Land 'the pack has to do that work without you' slowly. That is the framing line for the whole lab.",
      "Confirm the Lab B KPI table is attached and the chat is open as the LAST thing, not the first.",
    ],
    showThis: "Three-card lab opener.",
    landThePoint: "The pack convinces somebody who was not in the room. You will not be there to talk over the gaps.",
    transition: "What the CFO actually asked for.",
    estMinutes: 4,
  },
  {
    slideNumber: 39,
    deckId: "s39",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Read the head-of-retail quote in the speaker's voice and unpack 'make me look prepared' as a defendability request, not a styling request, so the room hears the lab brief the way a real stakeholder would deliver it.",
    sayThis: [
      "Read the quote on the slide with me, in the head of retail's voice. 'I have ten minutes with the CFO on Friday. I want a one-pager, the headline, two charts, and the exceptions to watch. I need to know what to say if she pushes on any of it. Make me look prepared.' That is the brief you are working from for the next hundred minutes.",
      "Now listen to the last line again, because that is the line that defines the lab. 'Make me look prepared.' That is not a styling request. That is a defendability request. He is not asking for nicer fonts, he is asking for cover when his CFO pushes on the number.",
      "And that is why the pack is not done until the caveat is written. If the head of retail walks into that meeting and gets asked something he cannot answer, the chart did not save him. The caveat would have.",
    ],
    presenterCues: [
      "Push the room to read 'make me look prepared' as a brief, not a vibe.",
    ],
    showThis: "Single quote card framed as 'From the head of retail'.",
    landThePoint: "The pack is not done until the caveat is written.",
    transition: "Now let me show you what is in the lab.",
    estMinutes: 3,
  },
  {
    slideNumber: 40,
    deckId: "s40",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Walk the room through the data card so they remember the inputs are their own Lab B KPI table plus branches.csv, and frame the mixed posture as a chance to bring yesterday's familiarity forward into today's pack.",
    sayThis: [
      "Look at the two cards on the slide with me. Your inputs are branch_kpi.csv, which is the KPI table you shipped at the end of Lab B, and branches.csv, which gives you region and opened_date for context. Nothing in this lab requires data you have not already seen.",
      "Now read the posture card on the right. It says mixed, and the reason it says mixed is that the KPI table is yours. You know how it was built. You know which branches were borderline yesterday. You know which definitions you sweated. That is not just data, that is institutional memory, and most engineers leave it at the door when they walk into the next lab.",
      "I want you to do the opposite. Bring yesterday's knowledge of this table forward into the chart titles you write today, and especially into the caveat. The pack is stronger when the engineer who built the inputs is the engineer writing the conclusions.",
    ],
    presenterCues: [
      "Remind the room that yesterday's familiarity with the data is itself an asset.",
    ],
    showThis: "Two-card layout: inputs, mixed posture.",
    landThePoint: "Bring yesterday's knowledge of the KPI into today's pack.",
    transition: "Now what an executive pack actually is.",
    estMinutes: 3,
  },
  {
    slideNumber: 41,
    deckId: "s41",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Land the executive-pack rules in the trainer's voice, not as bullets. The two lines that have to stick are 'the headline names the trend, not the table' and 'a caveat in the footer is a caveat that does not exist'. Make both personal with examples.",
    sayThis: [
      "Three rules for an executive pack. They sound obvious; they are violated in almost every pack I have ever reviewed at this bank.",
      "First: the headline names the trend, not the table. 'Q1 KPI ranked' is what most engineers write because it describes what they built. 'Top-quartile branches grew twelve percent while the bottom quartile was flat' is what a CFO actually wants because it tells him what to think. Engineers describe their work; leadership wants the conclusion. Write the headline the way you would say it out loud in the meeting if he asked you what the chart shows.",
      "Second: two charts only. One that shows the headline. One that shows the spread underneath the headline. Anything more and you are showing him your working out instead of your conclusion. He does not want to see your working out. He wants to know whether to trust you.",
      "Third - and this is the one I want you to feel - the caveat travels with the headline. Not in the appendix. Not in slide seven. On the chart. In the title bar if you have to. Because here is the truth about caveats. A caveat in the appendix is not a caveat. It is something you wrote down so that if the number turns out to be wrong, you can say 'well, I did mention it'. That is not engineering. That is liability management. We are not doing that.",
    ],
    presenterCues: [
      "Slow down on 'a caveat in the appendix is liability management'. That is the line worth overhearing at lunch.",
      "If you have a real example of a pack where the caveat was buried and the number bit somebody, tell it. Specific beats principled.",
    ],
    showThis: "Three-card layout: headline, two charts, exception view.",
    landThePoint: "Headline names the trend. Caveat rides with the headline. The appendix is not a hiding place.",
    transition: "Step 1. Brief.",
    estMinutes: 6,
  },
  {
    slideNumber: 42,
    deckId: "s42",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Get the room to write audience, headline, and caveat onto the page before any chart prompt is sent, walking them through the three cards as the trainer pointing at each one.",
    sayThis: [
      "Step 1 is the brief, and on this slide that means three things have to be on the page before you build a single chart. Audience, headline, and caveat. Look at the three cards with me, in order.",
      "Start with the audience card. Who actually reads this pack, and what decision are they going to make off the back of it? Be specific. A CFO sitting down for an investment review needs a different framing than a board meeting prep, and a regional CFO who is sceptical of the data team needs different framing again. Name them and name what they are going to do with the number.",
      "Now the headline card. Write the one sentence that has to land before you build any chart. Just the sentence. The chart you build later serves the headline, not the other way around, and if you skip this step you will end up reverse-engineering a headline out of whatever the coach hands you back.",
      "And then the caveat card, which is the one engineers most want to skip. Ask yourself what this pack can not support, and name one thing the audience might over-interpret. Write it down now, while you still remember what you do not know, because once the chart is built you will start believing your own work.",
    ],
    presenterCues: [
      "Refuse to advance until audience, headline, and caveat are in chat.",
    ],
    showThis: "Three-card brief layout.",
    doThis: ["Wait until at least three participants have audience + headline + caveat in chat."],
    landThePoint: "Audience first. Headline second. Caveat third. Then chart.",
    transition: "Now into Step 2, Engage.",
    estMinutes: 6,
  },
  {
    slideNumber: 43,
    deckId: "s43",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Land the move that engagement starts with briefing the AI on the audience and the stakes, not just on the data, and drive the room to ask for the pack one chart at a time so judgement stays attached to each piece.",
    sayThis: [
      "Step 2 is Engage, and the move on this slide is briefing the AI on the audience, not just on the data. Look at the two cards with me.",
      "First card, set the stakes. Tell the coach who is reading the pack, what they are going to do with it, and what would embarrass you in the meeting if it came out wrong. The chart the coach builds will reflect that brief. If you say 'CFO who is sceptical of the data team', you get a different chart back than if you say 'internal review for my own desk'. Same data, different output, because the audience changed.",
      "Second card, ask for one chart at a time. One prompt for the headline chart that supports the sentence you wrote in Step 1. One prompt for the spread chart underneath, using your Lab B definition. One prompt for the exception view with three to five branches you should flag. Three prompts, three artefacts.",
      "Resist the urge to ask for the whole pack in a single go. The coach will happily give you a finished pack and you will have learned nothing about which piece is load-bearing.",
    ],
    presenterCues: [
      "Watch for participants who ask for the whole pack in one prompt. That is the rookie move. Send them back to one-at-a-time.",
    ],
    showThis: "Two-card layout: set the stakes, one chart at a time.",
    landThePoint: "One chart per prompt. Audience in every prompt.",
    transition: "Now into Step 3, Verify.",
    estMinutes: 5,
  },
  {
    slideNumber: 44,
    deckId: "s44",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Get the room to verify the interpretation, not just the chart, by clicking Pressure-test this and forcing the coach to argue against the headline before the pack is allowed to ship.",
    sayThis: [
      "Step 3 is Verify, and the move on this slide is to pressure-test the interpretation, not just the chart. The chart is easy to verify. The story you have stapled to it is the part that breaks under a senior question.",
      "Look at the left card. Use the coach as a critic. Click the Pressure-test this quick action in the chat composer, and tell the coach in plain words to argue against your headline. Force it to name the strongest objection a senior engineer would raise. If the coach hands you back something soft, push again. The point of this step is not to be reassured.",
      "Then read the right card and look at the data with the counter in mind. Does the chart actually show what your headline claims, or does it sort of show it? Would the spread chart change your headline if a viewer read the spread chart first? Does your exception view name branches the headline has already covered, in which case you can drop them? Three honest questions, asked after the coach has pushed back.",
    ],
    presenterCues: [
      "Demo the Pressure-test this quick action live if the room looks unsure where to click.",
    ],
    showThis: "Two-card layout: coach as critic, then look at the data.",
    askThis: ["What is the strongest objection a CFO could raise against your headline using only the chart you just built?"],
    landThePoint: "Pressure-test before you ship. Then re-read the chart with the counter in mind.",
    transition: "Now into Step 4, Defend.",
    estMinutes: 6,
  },
  {
    slideNumber: 45,
    deckId: "s45",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Land the message that the explicit caveat in three sentences, written in the engineer's own voice, is the actual artefact for this defence and not the chart underneath it.",
    sayThis: [
      "Step 4 is Defend, and on this slide the message is short. The explicit caveat is the artefact. Not the chart, not the exception view, the caveat. That is the thing you are graded on in Lab C.",
      "And it is three sentences in a fixed order. One sentence on what this pack supports. One sentence on what it does not support, and why. One sentence on what would have to be true upstream for this conclusion to still hold next quarter. Three sentences, in that order, on the page.",
      "Write all three in your own words, not the coach's. Coach prose has a giveaway rhythm and a senior reader will smell it. Once it is in your voice, click Submit my Defend answer. The caveat is the part of the pack a CFO will actually slow down on, so make it worth their time.",
    ],
    presenterCues: [
      "If you see coach-voice prose in the caveat, ask the participant to rewrite it in their own words.",
    ],
    showThis: "Single defendable-structure card with the three-sentence shape.",
    landThePoint: "Caveat in your own voice. Three sentences. Submit.",
    transition: "Now the coach posture for this lab.",
    estMinutes: 5,
  },
  {
    slideNumber: 46,
    deckId: "s46",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Surface the Pressure-test this and What might be wrong here quick actions in the chat composer, and tell the room which to use before the headline lands and which to use before the exception view ships.",
    sayThis: [
      "Look at the two cards on the slide. These are the two pressure-test quick actions sitting in your chat composer on every single lab, and we are going to use them deliberately in Lab C.",
      "First button, Pressure-test this. When you click it, the coach takes your last interpretation and tries to argue against it, looking for the strongest counter from the same evidence you just used. Use this one before you finalise the headline, because once a headline feels right to you it becomes very hard to attack on your own.",
      "Second button, What might be wrong here? When you click it, the coach looks at the chart with skepticism and tries to name one thing that is technically working but analytically suspect. Use this one before you ship the exception view, because the exception view is where reasonable-looking branches get flagged for the wrong reason.",
      "And one more thing before you run the lab. If the coach struggles to find a counter for either button, that is a signal in itself. Either your work is genuinely solid, or the coach is going easy on you. You have to decide which, because the coach will not always tell you when it has run out of road.",
    ],
    presenterCues: [
      "Make the 'either solid or coach going easy' framing explicit. The coach is not infallible at finding faults.",
    ],
    showThis: "Two-card layout: Pressure-test this, What might be wrong here?",
    landThePoint: "Two quick actions. Use them at specific steps. Read the silences too.",
    transition: "Now let us run the lab.",
    estMinutes: 4,
  },
  {
    slideNumber: 47,
    deckId: "s47",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Hand the room into Lab C with the chat already loaded, walk them through the hundred-minute timebox as a spoken plan, and remind them you will be walking the floor the whole way through.",
    sayThis: [
      "Open Lab C in the chat now. Your Day 1 KPI table is already attached for you, so you do not have to think about inputs. Brief the audience first, please. No charts on the page until your headline sentence is written, because once a chart is up you will start writing for the chart instead of for the room.",
      "Read the timebox on the slide with me so you know where you should be at each checkpoint. Zero to fifteen minutes is your Brief, getting audience, headline, and caveat onto the page. Fifteen to fifty is Engage, where you build your two charts and one exception view, one prompt at a time. Fifty to seventy-five is Verify, where you pressure-test with the coach using both quick actions. Seventy-five to one hundred is Defend, where you write the three-sentence caveat in your own voice and click Submit my Defend answer.",
      "I will be walking the room the whole hundred minutes. If you are still stuck on the audience card after five minutes, that is the moment I want to find you, so please do not power through silently.",
    ],
    presenterCues: [
      "Walk the room. Look for participants who skip the audience-first step.",
    ],
    showThis: "Two-card lab launcher.",
    doThis: ["Start the 100-minute timer. Walk the room."],
    landThePoint: "100 minutes. Audience first. Caveat is the artefact.",
    transition: "Now into the Lab C debrief.",
    estMinutes: 100,
  },
  {
    slideNumber: 48,
    deckId: "s48",
    day: 2,
    segment: "Lab C",
    coreMessage:
      "Lab C debrief is the moment the room hears how a headline survives or dies in another engineer's voice. Hand the mic. Vote in the room. Surface the coach pressure-test that actually changed somebody's pack - that is the muscle Lab D needs.",
    sayThis: [
      "Two read-outs. I want each of you to read your headline and your caveat. Just those two pieces. Read them the way you would say them to the CFO if he asked.",
      "[After both reads.] Hands up. Which one walks into the CFO's office tomorrow without you needing to be in the room? Now I want one voice from somebody who voted - tell us what it was that earned your trust. Specific. Not 'it was clearer'. What words?",
      "One more thing before we break, and this is the bit I most want you to take into the afternoon. Whose pack actually got changed by something the coach said when you pressure-tested it? Hand up. [Pick one.] Tell us what the coach said and what you changed. That is the muscle. The engineers in this room who got disagreed with by the coach and let it change the work are the ones who will sail through Lab D, because Lab D is graded on a contract that another engineer reads cold.",
    ],
    presenterCues: [
      "Pick your two read-outs while walking the room. One that earned its caveat, one that buried it. Do not say which is which.",
      "When somebody says 'the coach changed my pack', let them tell the story in full. Do not summarise for them.",
    ],
    showThis: "Three-card debrief layout.",
    askThis: [
      "Of the two headlines you just heard, which one would you let walk into the CFO's office without you in the room? What words in it earned that trust?",
    ],
    landThePoint: "Letting the coach change your work is the muscle. Carry it into Lab D.",
    transition: "Quick reset, then the assessment.",
    estMinutes: 10,
  },
  // ---- Break (49) ----
  {
    slideNumber: 49,
    deckId: "s49",
    day: 2,
    segment: "Break",
    coreMessage:
      "Reset the room and frame the fifteen-minute break as the gate before the assessment, so people come back on time and ready for Lab D.",
    sayThis: [
      "Take a fifteen minute break, and please come back on time, because what is waiting for you on the other side is the assessment for this whole course.",
      "After the break we go straight into Lab D, which is the ML-ready handoff table the next engineer or the next model has to pick up without asking you a single follow-up question, and that handoff is what these two days have been pointing at the whole time.",
    ],
    presenterCues: [
      "Confirm Lab C defences are captured before anyone leaves.",
    ],
    showThis: "Single break card.",
    landThePoint: "Reset. The assessment comes next.",
    transition: "Now into Lab D.",
    estMinutes: 15,
  },
  // ---- Lab D (50-60) ----
  {
    slideNumber: 50,
    deckId: "s50",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Lab D opener has to do one thing: make the room understand that the next ninety minutes are the assessment of the entire course, and that the artefact they walk out with is the thing they will be remembered by. Frame it with weight, not with a checklist.",
    sayThis: [
      "I want to slow down before we start, because what you are about to do is what the last day and a half has been preparing you for. This is Lab D. The handoff table you build, and the dictionary you write next to it, is the assessment of this course. Not because I say so - because the engineer who picks it up next quarter to train a churn model is the one whose Monday morning gets easier or harder based on what you write in the next ninety minutes.",
      "Picture that engineer. They have never met you. They will not message you. They open your file, read your dictionary, and either build on top of it or rebuild it from scratch. If they rebuild, your two days are not lost - they just become their starting point and nobody else's. If they build, your work outlives the room.",
      "The bar is three things. The cut-off date is explicit and on the page. Leakage is impossible by construction, not by hope. And every column in your dictionary reads in your voice, not in the coach's. We are going to talk about each of those, and then you will run.",
    ],
    presenterCues: [
      "Land 'this is the assessment' as a felt thing, not a logistics note. Slow down. The room should sit a little straighter.",
      "When you say 'picture that engineer', actually pause. Let the room picture them.",
    ],
    showThis: "Three-card lab opener.",
    landThePoint: "What you build in the next ninety minutes is the artefact you are remembered by.",
    transition: "The mission.",
    estMinutes: 5,
  },
  {
    slideNumber: 51,
    deckId: "s51",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "The analytics-lead quote is the instruction set for the entire lab. Read it slowly, then translate the three constraints in plain trainer voice: the cut-off has to be explicit on the page, leakage has to be impossible by construction, and every column in the dictionary has to read in the participant's own words rather than the coach's.",
    sayThis: [
      "Look at the slide and read the quote from the analytics lead with me. 'We are spinning up a churn model next quarter. I need a customer-level feature table I can hand over without ambiguity. Cut-off has to be explicit. Leakage has to be impossible. And every column has to mean something the modeller can read in your words. No notebook archaeology.' That last line is the one I want you to feel. No notebook archaeology means the next engineer should not have to dig through your code to figure out what a column means, because your dictionary makes that unnecessary.",
      "When you strip the quote down, what they are asking you for is three things, and all three of them are non-negotiable. The cut-off date has to be explicit on the page. Leakage has to be impossible by construction, not by hope. And every entry in the dictionary has to read in your own voice, not the coach's. Hold those three in your head as we walk through the rest of this lab.",
    ],
    presenterCues: [
      "Read 'no notebook archaeology' with weight. That is the rule the dictionary exists to enforce.",
    ],
    showThis: "Single quote card framed as 'From the analytics lead'.",
    landThePoint: "Three non-negotiables: explicit cut-off, impossible leakage, dictionary in your words.",
    transition: "Now what's actually attached to this lab.",
    estMinutes: 3,
  },
  {
    slideNumber: 52,
    deckId: "s52",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Read the data card and the unspecified posture. Apply the same checks you would apply to anything that landed in your inbox this morning.",
    sayThis: [
      "You have three tables attached for this lab. customers.csv gives you customer_id, opened_date, segment, and region. accounts.csv carries the same columns you worked with in Lab B. And transactions.csv has the columns you have seen in every lab so far. Nothing exotic on the surface, but together they are everything you need to build a customer-level feature table at a chosen cut-off.",
      "The posture on this extract is deliberately unspecified. We have not pre-screened it for you, we have not flagged what is good or bad about it, and we have not told you which columns to trust. Treat it the way you would treat anything that landed in your inbox this morning from an upstream team you do not work with every day.",
      "Unspecified is the realistic case for a new feed at this bank, and it is the case the analytics lead is implicitly asking you to handle. Bring the same discipline you would bring to a real upstream pull, and assume nothing about the data until you have looked at it yourself.",
    ],
    presenterCues: [
      "Do not give hints about the data. The room should run their own checks.",
    ],
    showThis: "Two-card layout: tables, unspecified posture.",
    landThePoint: "Unspecified posture. Inspect like a real upstream pull.",
    transition: "Now what ML-ready actually has to mean.",
    estMinutes: 3,
  },
  {
    slideNumber: 53,
    deckId: "s53",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Define ML-ready in concrete trainer terms before any participant opens the chat. The three things that have to be true are an explicit cut-off date, leakage that is impossible by construction, and a written contract that the next engineer can read cold. Walk the cards as a person explaining each of them, not as a list.",
    sayThis: [
      "Look at the three cards on the slide with me. They are how I want you to define ML-ready for the next ninety minutes, because that phrase gets thrown around at this bank and it usually means something different to whoever is using it. For Lab D it means these three things, and nothing else.",
      "The first card is that the cut-off is explicit. You write a single date into your brief in plain text, and from that point on nothing in your table is allowed to be computed using data that arrived after that date. It sounds obvious until you try it under time pressure, which is exactly why it is non-negotiable.",
      "The second card is that leakage is impossible by construction. No feature in your table is allowed to use information that would not have been available at the cut-off date. That rules out every future-state column you might be tempted to slip in, even the innocent-looking ones, and we will spend a whole step on how to verify it because this is the bit that quietly sinks models in production.",
      "The third card is that the contract is written. One row in your output equals one customer as of the cut-off, and every column has a dictionary entry that names it, defines it, points to its source, and explains how it respects the cut-off. The contract is the first thing the next engineer reads, and it is what tells them whether they can trust your table.",
    ],
    presenterCues: [
      "Read all three definitions out loud. They will be the basis of the Step 1 brief.",
    ],
    showThis: "Three-card definition layout.",
    landThePoint: "Cut-off explicit. Leakage impossible. Contract written.",
    transition: "Now Step 1, which is the contract.",
    estMinutes: 5,
  },
  {
    slideNumber: 54,
    deckId: "s54",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Write the contract before any code. Cut-off date, row grain, feature shape, leakage rule. Refuse to advance until all four are on the page.",
    sayThis: [
      "Step 1 is where this lab is won or lost, and it has the same shape it has had every lab so far. I want you to write the contract for your table before you write a single line of code. Four lines, typed into the chat in your own words, with the AI doing nothing yet.",
      "The four lines you owe me are these. The cut-off date, written as a single explicit date so there is no ambiguity later. The row grain, where you tell me whether one row is a customer, or a customer-as-of-a-date, or something else entirely, and you pin it down in writing. The feature shape, where you name three to six features and write a one-line definition for each one. And the leakage rule, in one sentence: nothing in this table uses data posted after the cut-off.",
      "I will refuse to advance from this slide until I see those four lines in chat across the room, because the handoff you build over the next ninety minutes is only ever going to be as trustworthy as the brief you write right now. Take the time on this one.",
    ],
    presenterCues: [
      "Refuse to advance until cut-off + grain + shape + leakage rule are all in chat for the room.",
    ],
    showThis: "Single contract card with the four lines.",
    doThis: ["Wait until the room has all four contract lines visible in chat. Read one full contract aloud."],
    landThePoint: "Contract before code. Four lines. Refuse to skip.",
    transition: "Now Step 2, where you brief the AI.",
    estMinutes: 8,
  },
  {
    slideNumber: 55,
    deckId: "s55",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Anchor every prompt with cut-off and leakage rule. Build features one at a time.",
    sayThis: [
      "Step 2 is Engage. The single move I want you to make here is that you anchor every prompt you send to the coach with the cut-off date and the leakage rule, every single time, even when it starts to feel repetitive.",
      "The reason you have to do that is that the coach will quietly forget those constraints the moment you stop repeating them. It will not warn you about it. It will just produce a feature that uses data from after the cut-off and hand it back to you as if everything is fine. Repeat the date and the rule in every prompt and you make it impossible for the coach to drift.",
      "Build the table feature by feature, not all at once. Ask the coach for active_accounts_at_cutoff on its own, then for txn_count_last_90_days_pre_cutoff on its own, then for days_since_last_txn_at_cutoff on its own, and verify each one standalone before you ever combine them. The combine step is cheap. The leakage you smuggle in by combining too early is expensive.",
    ],
    presenterCues: [
      "Watch for participants who ask for the whole feature table in one prompt. Send them back to one-at-a-time.",
    ],
    showThis: "Two-card layout: anchor the prompt, build feature by feature.",
    landThePoint: "Cut-off and leakage in every prompt. One feature at a time.",
    transition: "Now Step 3, which is the leakage check.",
    estMinutes: 5,
  },
  {
    slideNumber: 56,
    deckId: "s56",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Run the leakage check explicitly. Ask the coach to name one risk; then verify the lineage yourself.",
    sayThis: [
      "Step 3 is Verify, and in this lab it means one thing in particular. You run the leakage check explicitly, out loud, before you let yourself believe the table is finished.",
      "Start by asking the coach the specific version of the question. Type it like this: 'Look at every feature in this table. Name one that could leak future information. Be specific, tell me which column, which join, and which date logic.' A specific question gets you a specific answer. A vague one gets you reassurance, which in this lab is worse than nothing.",
      "Then verify it yourself, because the coach will only see what you point it at. For each feature, walk the lineage back to the source table. Find every date column on the way. Confirm each one is less than or equal to the cut-off. If a feature uses an aggregate, confirm that the window of that aggregate ends at the cut-off and not a single day after.",
      "The reason this matters is that a leakage bug is invisible right up to the moment the model trains beautifully and then fails the moment it hits production. Nobody catches it in code review because the code runs cleanly. You catch it here, on this slide, or you do not catch it at all.",
    ],
    presenterCues: [
      "Read 'a leakage bug is invisible until production' twice. That is the stakes line.",
    ],
    showThis: "Two-card layout: ask the coach, then verify yourself.",
    landThePoint: "Leakage bugs are invisible until production. Catch them here.",
    transition: "Write the dictionary.",
    estMinutes: 6,
  },
  {
    slideNumber: 57,
    deckId: "s57",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "The dictionary is the artefact. The trainer's job here is to make crystal clear that the AI is allowed to help with everything else in this lab except this one thing - and to set the bar that an entry written in coach voice fails. Tell the room what coach-voice sounds like so they can hear it themselves.",
    sayThis: [
      "Here is the one moment in the entire course where I am going to ask you to do something the AI is faster at than you, and to do it yourself anyway. Write the dictionary in your own voice. Five lines per feature. Name, definition, source, cut-off behaviour, the one caveat that has to travel with this column.",
      "I will save you a debate about whether you can ask the coach to draft it and edit it down. You can. You should not. Because here is the test. Six months from now an ML engineer reads this dictionary cold. If it sounds like a textbook - 'this feature represents a normalised measure of customer engagement over the trailing window' - they will not be able to argue with it. They also will not be able to trust it. They will not know whether it means what they think it means. They will rebuild.",
      "If it sounds like you - 'count of posted transactions in the 90 days before cut-off, excluding internal transfers, dormant customers shown as null not zero' - they can use it. Because they can hear an engineer behind it.",
      "I am walking. If I read 'this feature represents' on your screen, I am going to ask you to read it back to me in your own voice, and we will write that down instead.",
    ],
    presenterCues: [
      "Tell the room exactly what coach-voice sounds like. Use the 'normalised measure of customer engagement' line as the example. They need to be able to hear it on their own screen.",
      "Walk continuously. Read entries over shoulders. Coach-voice gets a verbal rewrite on the spot.",
    ],
    showThis: "Single per-feature template card.",
    doThis: ["Walk the room continuously. Surface coach-voice writing and have the engineer say the entry back to you in their words."],
    landThePoint: "If your dictionary sounds like a textbook, the next engineer rebuilds. Write it so they can hear you.",
    transition: "Step 4. Defend.",
    estMinutes: 12,
  },
  {
    slideNumber: 58,
    deckId: "s58",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "The dictionary is the artefact. Defendable handoff: one paragraph, the dictionary, one named risk.",
    sayThis: [
      "Step 4. The dictionary is the artefact.",
      "Defendable handoff. One paragraph: what this table is and what it is not. The dictionary, one entry per feature, in your own words. One named risk: the leakage path you considered and ruled out, or the one you flagged for follow-up.",
      "When the coach surfaces your challenge question, hold the line. Submit when the dictionary reads like a contract, not like notes.",
    ],
    presenterCues: [
      "If a dictionary reads like notes, refuse the submit. Have the participant tighten it first.",
    ],
    showThis: "Single defendable-structure card.",
    landThePoint: "Reads like a contract, not like notes. Submit when it does.",
    transition: "Coach posture for leakage.",
    estMinutes: 6,
  },
  {
    slideNumber: 59,
    deckId: "s59",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "How the coach behaves on leakage. It will write the joins. It will not surface leakage on its own. Ask the right question.",
    sayThis: [
      "Two cards on the slide, and they are a warning about how the coach is going to behave around leakage in this lab. I want you to know this before you sit down to run, because it catches almost everybody the first time.",
      "On the left is the Engage posture. The coach will happily write the joins for you. It will produce a feature table that runs cleanly the first time. What it will not do, on its own initiative, is tell you that one of those features uses a date that comes from after the cut-off. Leakage is not a thing the coach surfaces unprompted. You have to ask for it directly.",
      "On the right is the Verify posture, and even here you have to be careful about which question you ask. If you ask the coach 'find one leakage risk in this table', it will hunt for one and tell you what it found. If you ask 'is this table safe?', it will reassure you that it is, because that is the easier answer to give. Ask the harder question.",
      "The shape of the question controls the shape of the answer. That is true everywhere in this course, but in Lab D it is the difference between catching a leakage bug here, in front of me, and shipping it to a model that goes live in production three months from now.",
    ],
    presenterCues: [
      "Have the room rephrase 'is this safe?' into 'find one leakage risk' on the spot if anyone tries the easy question.",
    ],
    showThis: "Two-card layout: Engage posture, Verify posture.",
    landThePoint: "The shape of the question controls the shape of the answer. Ask sharply.",
    transition: "Run the lab.",
    estMinutes: 4,
  },
  {
    slideNumber: 60,
    deckId: "s60",
    day: 2,
    segment: "Lab D",
    coreMessage:
      "Hand off to Lab D as the assessment moment. Set one rule (contract before code), set the clock, and get out of the way. Then walk the room continuously - this is the artefact ninety minutes of the course.",
    sayThis: [
      "Eighty-five minutes from now you will have built the thing the next engineer at this bank will judge you by. Chat is open. Customers, accounts, transactions are attached.",
      "One rule before you start. The contract goes on the page in chat before any code is written. Cut-off date. Row grain. Feature shape. Leakage rule. Four lines, in your words, then you can build. If I walk past your screen and see pandas before I see the contract, I am sending you back.",
      "I am going to be moving the whole time. Wave me over if you want me to read something. If I stop at your shoulder, it is because something on your screen is either really good or one rewrite away from being really good. Either way I will tell you which.",
    ],
    presenterCues: [
      "Land 'the thing the next engineer at this bank will judge you by' with weight. This is the assessment moment.",
      "Walk for the full eighty-five minutes. Do not sit. The dictionary quality goes up when somebody is moving past the room.",
      "Catch coach-voice the moment you see it. Verbal rewrite on the spot.",
    ],
    showThis: "Two-card lab launcher.",
    doThis: ["Start the 85-minute timer. Walk continuously. Read screens."],
    landThePoint: "Contract on the page before code. Eighty-five minutes. The dictionary is the artefact you are remembered by.",
    transition: "Now we close the module.",
    estMinutes: 85,
  },
  // ---- Module close (61-62) ----
  {
    slideNumber: 61,
    deckId: "s61",
    day: 2,
    segment: "Module close",
    coreMessage:
      "The readback is the emotional spine of the course. Frame it as the moment the work goes public, hand the mic, and refuse to let anyone hide. The 'truth not supported' is the one most engineers will be tempted to soften - the trainer's job is to honour it when it is honest and gently sharpen it when it is hedged.",
    sayThis: [
      "Two sentences each. We are going around the room and everybody reads. There is no version of this where you sit it out, because the whole point of the last two days is that you can defend your own work in your own voice. So this is where you do it.",
      "First sentence: one truth this data supports. Pull it from your Lab D handoff. Specific. Named. The thing you would say to the analytics lead with your hand on the table.",
      "Second sentence is the harder one, and it is the one I most want to hear. One truth this data does not support. Pull it from your dictionary caveats. Honest. Specific. The thing a careless modeller would over-interpret if you did not name it. The reason this matters - and the reason every engineer here is going to read it - is that the bank already has plenty of people who will tell leadership what the data supports. It does not have enough people who will tell leadership what it does not. We are training the second kind.",
      "I am going to start on the right of the room and we are going around. I will not interrupt while you are reading. I will react after.",
    ],
    presenterCues: [
      "Sit through the silence between speakers. Do not fill it.",
      "When somebody hedges the second sentence, gently push: 'Say that again without the word probably.'",
      "When somebody names a 'truth not supported' clearly and without flinching, stop the room. Name it. Tell the room that is the engineer voice this course exists to build.",
    ],
    showThis: "Two-card readback layout.",
    askThis: [
      "Of the truths-not-supported you just heard, which one made you uncomfortable to hear out loud? That discomfort is the muscle - that is the one you remember.",
    ],
    landThePoint: "The bank has plenty of people who say what the data supports. We are training the ones who will say what it does not.",
    transition: "One last thing before you walk out.",
    estMinutes: 18,
  },
  {
    slideNumber: 62,
    deckId: "s62",
    day: 2,
    segment: "Module close",
    coreMessage:
      "Last slide of the course. The trainer's job is to land one habit, push past 'I will be more careful', and end on a sentence that lives in the corridor at lunch tomorrow. Do not end on logistics; end on the sentence and then handle logistics last.",
    sayThis: [
      "One habit. In the chat, in your own words, the single thing you are going to do differently on Monday morning. I am going to ask you to be specific. 'I will be more careful' is not a habit; it is a wish. 'I will write four lines of brief before I send any AI prompt this week' is a habit. The first one fades in two weeks. The second one becomes who you are.",
      "Why it has to be this week, and not next quarter. The retention window on what you have learned in the last two days is about fourteen days. After that the muscle starts to fade. So I am asking you to take one task on your desk - one real one, with real stakes - and run the four-step loop on it before next Friday. Not because it is in the curriculum. Because that is the only way the muscle survives.",
      "Module 2 picks up your handoff. The truths you can defend become the foundation we build on. The ones you cannot will surface, and that is fine - that is what the next module is for.",
      "I want to leave you with one sentence and then I am going to get out of the way. The bank does not need engineers who can use AI faster. It already has plenty of those. The bank needs engineers who can use AI and still defend the answer when somebody senior asks them to walk it back. That is the engineer this course exists to build. Be that engineer on Monday.",
    ],
    presenterCues: [
      "Land the closing line slowly. Pause after 'still defend the answer when somebody senior asks them to walk it back.' That is the line that should outlast the room.",
      "Push every vague exit-ticket habit to a specific one before you let it stand.",
      "Logistics last. After the closing line. Module 2 dates, the workspace tab, anything else - all after.",
      "Thank the room by name where you can. Do not generic-thank. Specific praise to two or three engineers carries the room out the door.",
    ],
    showThis: "Three-card close: exit ticket, Module 2 preview, carry forward.",
    askThis: [
      "Pick one real task on your desk this week. Tell me which one. Tell me what running the four-step loop on it actually looks like for you.",
    ],
    landThePoint: "One habit. Real task within two weeks. Module 2 dates locked.",
    transition: "End of module.",
    estMinutes: 12,
  },
];

const pythonForDataPack: ModuleScriptPack = {
  moduleSlug: "python-for-data",
  moduleTitle: "Python for Data",
  durationDays: 2,
  hoursPerDay: 4,
  totalSlides: 62,
  segments,
  slides,
};

export default pythonForDataPack;
export { segments as pythonForDataSegments, slides as pythonForDataSlides };
