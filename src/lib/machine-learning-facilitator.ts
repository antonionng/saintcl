type FacilitatorNoteBlock = {
  start: number;
  end: number;
  label: string;
  objective: string;
  talkTrack: string[];
  facilitationMoves: string[];
  debrief?: string[];
};

const noteBlocks: FacilitatorNoteBlock[] = [
  {
    start: 1,
    end: 10,
    label: "Opening, context, and problem framing",
    objective: "Set the expectation that ML is a decision system topic, not just a modelling topic.",
    talkTrack: [
      "Anchor the module around banking decisions, not abstract algorithms.",
      "Keep bringing the room back to action, owner, horizon, and cost of error.",
      "Use the opening use-case slides to show where ML is useful and where rules or BI may still be better.",
    ],
    facilitationMoves: [
      "Ask participants to state one banking decision they think is suitable for ML and one that is not.",
      "Push vague problem statements into clearer target, horizon, and action language.",
    ],
  },
  {
    start: 11,
    end: 20,
    label: "Labels, features, leakage, and preprocessing",
    objective: "Build strong instinct for target definition, leakage control, and preprocessing discipline.",
    talkTrack: [
      "Treat leakage as a trust-breaking failure, not a minor technical issue.",
      "Use preprocessing slides to show that convenience choices often become governance problems later.",
      "Keep stressing that feature availability at prediction time matters more than elegance.",
    ],
    facilitationMoves: [
      "Ask what information would or would not exist at decision time.",
      "Pause when participants confuse descriptive fields with predictive features.",
    ],
    debrief: [
      "Which leakage risk would be easiest to miss in a real project?",
      "Which preprocessing choice is most likely to be copied blindly?",
    ],
  },
  {
    start: 21,
    end: 30,
    label: "Baselines, metrics, and Lab 1",
    objective: "Move from setup into disciplined evaluation and threshold thinking.",
    talkTrack: [
      "Challenge the room to earn complexity by outperforming a credible baseline.",
      "Translate every metric back into operational consequences.",
      "Use the lab to reward thoughtful interpretation, not only working code.",
    ],
    facilitationMoves: [
      "Have participants explain the confusion matrix in business language.",
      "Push them to justify the metric before they justify the model.",
    ],
    debrief: [
      "Which error type would operations care about most?",
      "What threshold assumption most changes the recommendation?",
    ],
  },
  {
    start: 31,
    end: 41,
    label: "Unsupervised learning and segmentation",
    objective: "Teach segmentation as a business design exercise rather than a mathematical novelty.",
    talkTrack: [
      "Keep feature choice and interpretation at the centre of the discussion.",
      "Remind participants that segments are only useful if they support differentiated action.",
      "Treat cluster count as a judgement call informed by evidence, not a fully automatic answer.",
    ],
    facilitationMoves: [
      "Ask whether the segment story would still make sense to a product or service owner.",
      "Challenge any segment description that simply repeats technical averages without meaning.",
    ],
  },
  {
    start: 42,
    end: 52,
    label: "Model families, comparison, and governance",
    objective: "Show that model selection is a balance of performance, explainability, and control.",
    talkTrack: [
      "Use the model family slides to compare operating implications, not just capability.",
      "Reinforce that a slightly weaker but clearer model can still be the stronger business recommendation.",
      "Frame governance as part of the design, not an afterthought after modelling.",
    ],
    facilitationMoves: [
      "Ask which model would be easiest to challenge in governance review.",
      "Use the comparison slides to surface the cost of opacity.",
    ],
    debrief: [
      "When is simplicity a strategic advantage?",
      "What model choice would create the hardest governance burden?",
    ],
  },
  {
    start: 53,
    end: 60,
    label: "Bias, monitoring, and model risk",
    objective: "Connect fairness, drift, oversight, and auditability to real banking risk management.",
    talkTrack: [
      "Keep the discussion practical by tying monitoring metrics to ownership and intervention.",
      "Show that fairness and drift are live operating concerns, not only pre-launch checks.",
      "Use model risk framing to connect analytics work with broader control structures in the bank.",
    ],
    facilitationMoves: [
      "Ask who receives the alert when the model degrades and what they do next.",
      "Press for specific examples of how bias could appear in the use case.",
    ],
  },
  {
    start: 61,
    end: 70,
    label: "Deployment, failure handling, and third-party models",
    objective: "Prepare participants to think beyond notebooks and into operating environments.",
    talkTrack: [
      "Deployment is where assumptions become visible and expensive.",
      "Use failure mode slides to show that a technically correct model can still fail operationally.",
      "Challenge any belief that a vendor removes the bank's accountability.",
    ],
    facilitationMoves: [
      "Ask what fallback would exist if scoring stopped tomorrow.",
      "Make participants define the minimum monitoring pack required before go-live.",
    ],
  },
  {
    start: 71,
    end: 80,
    label: "Executive communication and capstone close",
    objective: "Finish with decision-quality communication, not just technical recap.",
    talkTrack: [
      "Treat the final section as a rehearsal for executive discussion.",
      "Reward concise language, explicit caveats, and clear action recommendations.",
      "Use the capstone rubric to separate technical correctness from strategic judgement.",
    ],
    facilitationMoves: [
      "Ask participants to translate one metric into a leadership decision sentence.",
      "Challenge overconfident wording and missing caveats.",
    ],
    debrief: [
      "What would make a senior leader trust this recommendation more?",
      "What uncertainty should never be hidden in the final recommendation?",
    ],
  },
];

const slideTitles = [
  "Machine Learning Training",
  "Why machine learning matters in banking",
  "What you will be able to do by the end of the module",
  "The three-day learning journey",
  "What strong performance looks like",
  "What changes in a regulated environment",
  "Machine learning versus rules and BI",
  "The end-to-end machine learning workflow",
  "Banking use cases by ML problem type",
  "What makes a good ML problem statement",
  "Features, labels, targets, and observations",
  "Common banking data sources for ML",
  "Business context before modelling",
  "Train, validation, and test sets",
  "Why leakage breaks trust",
  "Leakage examples in banking datasets",
  "Feature types and preprocessing choices",
  "Missing data strategies for ML",
  "Encoding categories carefully",
  "Scaling and standardisation. When it matters",
  "Baselines before sophistication",
  "The first baseline classification workflow",
  "Accuracy is not enough",
  "Precision, recall, and F1",
  "Confusion matrix walkthrough",
  "Thresholds and business trade-offs",
  "False positives and false negatives in banking",
  "ROC and PR curve intuition",
  "Model evaluation checklist",
  "Lab 1. Build and evaluate a baseline classifier",
  "Day 1 recap and reset",
  "What unsupervised learning is for",
  "Segmentation in a banking context",
  "Clustering workflow overview",
  "Feature selection for segmentation",
  "Distance and similarity intuition",
  "K-means explained simply",
  "Choosing the number of clusters",
  "Interpreting clusters for business use",
  "Cluster risk and misuse",
  "Lab 2. Customer segmentation studio",
  "Supervised model families at a glance",
  "Linear and logistic models. When simplicity wins",
  "Tree-based models. Why they are popular",
  "Ensemble intuition. Random forest and boosting",
  "Bias variance trade-off",
  "Underfitting and overfitting",
  "Cross-validation discipline",
  "Comparing models fairly",
  "Feature importance. Promise and limits",
  "Explainability versus predictive strength",
  "Governance questions every model owner must answer",
  "Fairness and bias in banking decisions",
  "Monitoring drift and degradation",
  "Human oversight and escalation points",
  "Model risk management essentials",
  "Documentation and audit trails",
  "Lab 3. Compare two candidate models",
  "Case discussion. When a weaker model is the better choice",
  "Day 2 close. What to carry into deployment thinking",
  "Day 3 reset. From model to decision system",
  "What deployment actually means in practice",
  "Batch scoring versus real-time scoring",
  "Input contracts and production assumptions",
  "Monitoring metrics after go-live",
  "Feedback loops and retraining triggers",
  "Model failure modes in banking operations",
  "Incident handling and rollback logic",
  "Responsible use of third-party models",
  "Vendor questions for ML platforms",
  "How to communicate model results to non-technical leaders",
  "Translating metrics into decisions",
  "Telling the story of uncertainty honestly",
  "Executive summary structure for ML recommendations",
  "Visuals for model comparison and governance",
  "Capstone brief. Recommend a model path for an AJB use case",
  "Scoring bands. Competent, strong, and exceptional",
  "Peer review prompts for the capstone",
  "Habits of a disciplined ML practitioner",
  "What to do next in your own role",
] as const;

function buildMachineLearningDetailedScript(input: {
  title: string;
  objective: string;
}) {
  const title = input.title;
  const objective = input.objective;

  if (/why machine learning matters|outcomes|journey|strong performance|regulated environment|rules and bi|workflow|use cases|problem statement/i.test(title)) {
    return [
      `Use this slide to frame machine learning as a decision system topic, not a modelling vanity topic. I want participants hearing that the quality of the business problem matters just as much as the quality of the algorithm.`,
      `As you talk this through, keep translating the concept into banking action, owner, horizon, and cost of error. The room should hear that machine learning is valuable only when it helps the bank act more consistently and more intelligently.`,
      `Before you leave the slide, land the practical message clearly: ${objective}`,
    ];
  }

  if (/features|labels|targets|observations|data sources|context before modelling|train, validation, and test|leakage|preprocessing|missing data|encoding|scaling/i.test(title)) {
    return [
      `This slide is about analytical discipline before modelling. Slow down enough for the room to hear that labels, features, splits, and preprocessing are not admin tasks. They are the foundation of whether the model can be trusted at all.`,
      `Keep repeating the prediction-time question. What information is genuinely available when the decision has to be made, and what would quietly leak future knowledge into the workflow? That is the standard that keeps the conversation serious.`,
      `Close the slide by reinforcing the operating takeaway: weak setup creates false confidence later, so we earn model trust here or we do not earn it at all.`,
    ];
  }

  if (/baseline|classification|accuracy|precision|recall|confusion matrix|threshold|false positives|false negatives|roc|pr curve|evaluation checklist|lab 1/i.test(title)) {
    return [
      `This is an evaluation slide, so keep the room focused on consequences rather than formulae alone. A metric only matters if we can explain what it means for the bank, for operations, and for the people affected by the decision.`,
      `Push the idea that complexity must be earned. A strong baseline with clear interpretation is often more valuable than a more complex model that no one can justify calmly.`,
      `As you close, bring it back to the practical discipline on this module: pick the metric that matches the decision, then explain the trade-off openly.`,
    ];
  }

  if (/unsupervised|segmentation|clustering|feature selection for segmentation|distance|similarity|k-means|clusters|lab 2/i.test(title)) {
    return [
      `Treat this slide as a business design slide, not just a clustering slide. Segments only become useful when they support a different treatment, a different message, or a different intervention.`,
      `Keep asking whether the segment story would make sense to a product owner, service owner, or risk owner. If the cluster description sounds technical but not actionable, it is not finished.`,
      `Finish the slide by anchoring the judgement standard. We are not looking for mathematically neat clusters alone. We are looking for segments that could support a real decision.`,
    ];
  }

  if (/model families|linear and logistic|tree-based|ensemble|bias variance|underfitting|overfitting|cross-validation|comparing models|feature importance|explainability|governance|fairness|monitoring drift|human oversight|model risk|documentation|lab 3|case discussion|day 2 close/i.test(title)) {
    return [
      `Use this slide to show that model selection is a balance of performance, explainability, and control. I want participants hearing that a slightly weaker but clearer model may still be the better business recommendation.`,
      `As you walk through the content, keep surfacing the governance burden. The more opaque or unstable the model, the stronger the monitoring, challenge, and documentation requirement becomes.`,
      `Before moving on, land the management message clearly: a good model choice is not only about predictive strength. It is about whether the organisation can govern it responsibly.`,
    ];
  }

  if (/deployment|batch scoring|real-time scoring|input contracts|production assumptions|go-live|feedback loops|retraining|failure modes|rollback|third-party|vendor/i.test(title)) {
    return [
      `This slide should make machine learning feel operational rather than theoretical. Deployment is where assumptions become visible, expensive, and difficult to hide.`,
      `Keep the discussion concrete. Who owns the model, what breaks if input quality shifts, what fallback exists, and what action is taken when performance degrades? Those are the questions that separate notebook success from production readiness.`,
      `Close the slide by reinforcing that a model is not finished when it scores well. It is only finished when it can fail safely and be governed clearly.`,
    ];
  }

  if (/communicate model results|translating metrics|uncertainty|executive summary|visuals|capstone|scoring bands|peer review|habits|what to do next/i.test(title)) {
    return [
      `Use this slide to rehearse leadership-quality communication. Participants need to hear that decision confidence, caveat, recommendation, and action are more important here than technical flourish.`,
      `As you talk through the example, keep the language selective and disciplined. We are teaching them how to brief leaders honestly, not how to impress them with technical vocabulary.`,
      `End by making the standard explicit: the recommendation must be understandable, caveated, and tied to a real decision path that leadership could actually act on.`,
    ];
  }

  return [
    `Use this slide to deepen the room's judgement, not only their vocabulary. The purpose here is clear: ${objective}`,
    `Keep the explanation practical and banking-relevant so the room can connect the idea to a real decision, control, or operating trade-off.`,
    `Before moving on, make sure the practical takeaway has landed and that participants can say why this step matters.`,
  ];
}

function buildMachineLearningFacilitatorQuestions(input: {
  title: string;
  objective: string;
}) {
  const title = input.title;
  const objective = input.objective;

  if (/why machine learning matters|outcomes|journey|strong performance|regulated environment|rules and bi|workflow|use cases|problem statement/i.test(title)) {
    return [
      "What makes a banking problem genuinely suitable for machine learning rather than rules or reporting alone?",
      "Where in your own work would the cost of a poor ML framing be highest?",
      `If this section lands well, what should participants now understand more clearly? ${objective}`,
    ];
  }

  if (/features|labels|targets|observations|data sources|context before modelling|train, validation, and test|leakage|preprocessing|missing data|encoding|scaling/i.test(title)) {
    return [
      "At decision time, what information is truly available and what information would quietly introduce leakage?",
      "Which preparation choice on this slide would be easiest to get wrong if a team were rushing?",
      "How would you explain to a stakeholder why setup discipline matters as much as the model itself?",
    ];
  }

  if (/baseline|classification|accuracy|precision|recall|confusion matrix|threshold|false positives|false negatives|roc|pr curve|evaluation checklist|lab 1/i.test(title)) {
    return [
      "Which metric on this slide best matches the real banking decision we are discussing, and why?",
      "What operational consequence matters more here: false positives or false negatives?",
      "What would a credible baseline need to show before you would allow more complexity into the conversation?",
    ];
  }

  if (/unsupervised|segmentation|clustering|feature selection for segmentation|distance|similarity|k-means|clusters|lab 2/i.test(title)) {
    return [
      "What action would actually change if these segments were accepted and used?",
      "How would you know that a cluster description is meaningful rather than just technically tidy?",
      "What is the risk of presenting segmentation as insight when it does not support a differentiated action?",
    ];
  }

  if (/model families|linear and logistic|tree-based|ensemble|bias variance|underfitting|overfitting|cross-validation|comparing models|feature importance|explainability|governance|fairness|monitoring drift|human oversight|model risk|documentation|lab 3|case discussion|day 2 close/i.test(title)) {
    return [
      "Where is the balance point here between predictive strength and explainability?",
      "If governance challenged this model choice, what would you need to defend first?",
      "When would a simpler model become a strategic advantage rather than a compromise?",
    ];
  }

  if (/deployment|batch scoring|real-time scoring|input contracts|production assumptions|go-live|feedback loops|retraining|failure modes|rollback|third-party|vendor/i.test(title)) {
    return [
      "If this model went live tomorrow, what would you most want monitored from day one?",
      "What fallback would need to exist before you would feel comfortable with deployment?",
      "How does this slide change the way you think about model ownership after go-live?",
    ];
  }

  if (/communicate model results|translating metrics|uncertainty|executive summary|visuals|capstone|scoring bands|peer review|habits|what to do next/i.test(title)) {
    return [
      "How would you translate the technical message on this slide into one leadership decision sentence?",
      "What uncertainty or caveat would be dangerous to hide here?",
      "What would make the recommendation stronger without making it longer?",
    ];
  }

  return [
    `What is the key decision or judgement issue sitting underneath ${title.toLowerCase()}?`,
    "Where could this concept fail in a real banking workflow if handled carelessly?",
    `What practical change should participants take from this part of the module? ${objective}`,
  ];
}

export function getMachineLearningFacilitatorNote(slideIndex: number) {
  const slideNumber = slideIndex + 1;
  return (
    noteBlocks.find((block) => slideNumber >= block.start && slideNumber <= block.end) ??
    noteBlocks[noteBlocks.length - 1]
  );
}

export function getMachineLearningFacilitatorNoteBlocks() {
  return noteBlocks;
}

export function getMachineLearningFacilitatorSlideScript(slideIndex: number) {
  const currentNote = getMachineLearningFacilitatorNote(slideIndex);
  const title = slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;
  return buildMachineLearningDetailedScript({
    title,
    objective: currentNote.objective,
  });
}

export function getMachineLearningFacilitatorQuestions(slideIndex: number) {
  const currentNote = getMachineLearningFacilitatorNote(slideIndex);
  const title = slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;
  return buildMachineLearningFacilitatorQuestions({
    title,
    objective: currentNote.objective,
  });
}
