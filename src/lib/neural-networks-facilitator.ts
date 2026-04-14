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
    label: "Framing and core intuition",
    objective: "Position neural networks as a tool for representation challenges, not a default upgrade over other models.",
    talkTrack: [
      "Keep the opening grounded in where neural networks add real value and where they add unnecessary complexity.",
      "Use the first ten slides to build intuition before introducing more formal language.",
      "Anchor every concept in a banking use case or decision context.",
    ],
    facilitationMoves: [
      "Ask participants where they think richer representation really matters in their domain.",
      "Push back on any assumption that deeper automatically means better.",
    ],
  },
  {
    start: 11,
    end: 24,
    label: "Activations, loss, and training mechanics",
    objective: "Make the mechanics understandable enough that participants can reason about model behavior and failure.",
    talkTrack: [
      "Explain weights, activations, and loss as parts of a learning system, not isolated formulas.",
      "Use backpropagation as a practical update signal rather than a mathematical performance.",
      "Keep returning to what practitioners actually see, such as unstable loss or stalled learning.",
    ],
    facilitationMoves: [
      "Ask participants to explain one concept back in business-safe language.",
      "Pause if the room starts repeating terms without understanding what they do.",
    ],
    debrief: [
      "Which training concept became clearer when you described it in plain language?",
      "Which concept still feels too abstract?",
    ],
  },
  {
    start: 25,
    end: 40,
    label: "Learning curves, failure modes, and day 1 close",
    objective: "Build pattern recognition for overfitting, instability, and poor architecture choices.",
    talkTrack: [
      "Teach participants to diagnose behavior from training and validation evidence.",
      "Keep reinforcing that neural models do not remove the need for disciplined evaluation and governance.",
      "Use the day 1 close to consolidate architecture judgement over memorisation.",
    ],
    facilitationMoves: [
      "Ask what the curves would need to show before they trusted a model enough to continue.",
      "Reward explanations that identify practical remedies rather than vague concern.",
    ],
  },
  {
    start: 41,
    end: 53,
    label: "CNNs, transfer learning, and document tasks",
    objective: "Connect neural concepts to document and image tasks that feel plausible in banking.",
    talkTrack: [
      "Use CNN slides to show how local visual structure changes the modelling problem.",
      "Position transfer learning as the practical enterprise default in many cases.",
      "Keep the conversation focused on data quality, sensitivity, and operating realism.",
    ],
    facilitationMoves: [
      "Ask why transfer learning may be a stronger organisational choice than training from scratch.",
      "Challenge any use case that lacks enough data or control logic.",
    ],
  },
  {
    start: 54,
    end: 66,
    label: "Evaluation, tuning, and operational control",
    objective: "Move participants from technical interest into serious operating judgement.",
    talkTrack: [
      "Make it clear that tuning without discipline quickly turns into noise.",
      "Use monitoring and explainability slides to connect model quality to post-deployment control.",
      "Frame fallback logic as essential, not optional, for high-impact use cases.",
    ],
    facilitationMoves: [
      "Ask what would trigger a rollback in the use case being discussed.",
      "Push participants to define who owns the model after go-live.",
    ],
    debrief: [
      "What control would matter most before deployment?",
      "What tuning move would you try next and why?",
    ],
  },
  {
    start: 67,
    end: 80,
    label: "Recommendation quality and close",
    objective: "Finish with leadership-ready recommendation quality rather than architecture enthusiasm.",
    talkTrack: [
      "Use the final section to separate technical fluency from real recommendation quality.",
      "Reward concise caveats, explicit alternatives, and grounded deployment judgement.",
      "Close by reinforcing that neural networks are powerful but never self-justifying.",
    ],
    facilitationMoves: [
      "Ask participants to defend why a simpler model would or would not be enough.",
      "Challenge any recommendation that lacks fallback or review logic.",
    ],
    debrief: [
      "What is the strongest argument for using a neural approach here?",
      "What is the strongest argument against it?",
    ],
  },
];

const slideTitles = [
  "Neural Networks",
  "Why neural networks matter",
  "What you will be able to do by the end of the module",
  "The two-day learning journey",
  "When neural networks are the right tool",
  "When neural networks are not the right starting point",
  "The basic intuition. Weighted signal flow",
  "What is a neuron?",
  "Input layer, hidden layers, output layer",
  "Forward pass. What happens in prediction mode",
  "Weights and bias in plain language",
  "Why hidden layers are useful",
  "Why activation functions matter",
  "ReLU. The workhorse activation",
  "Sigmoid and tanh. Where they fit",
  "Choosing output activations",
  "What a loss function does",
  "Common loss functions",
  "What training really means",
  "Backpropagation in plain English",
  "Gradient descent intuition",
  "What is a learning rate?",
  "Batch size and epochs",
  "Typical training loop",
  "Reading learning curves",
  "How overfitting appears in neural training",
  "Regularisation strategies",
  "What dropout is doing",
  "Normalisation and stable training",
  "Preparing structured banking data for neural networks",
  "Dense features and sparse features",
  "How to choose an architecture sensibly",
  "Lab 1. Network anatomy walkthrough",
  "Stretch path. What could go wrong?",
  "Common training failure modes",
  "Why compute and data volume matter",
  "Neural networks still need the same evaluation discipline",
  "Interpretability becomes more important, not less",
  "Day 1 recap",
  "End day 1 with this question",
  "Day 2 reset. From feed-forward networks to richer tasks",
  "Why convolutional neural networks were created",
  "What convolution is doing",
  "Core CNN building blocks",
  "How feature maps evolve through layers",
  "CNNs in banking document understanding",
  "Why pooling helps",
  "What transfer learning is",
  "Why transfer learning is so useful in practice",
  "Feature extraction versus fine-tuning",
  "Data preparation for image and document tasks",
  "What data augmentation is doing",
  "Lab 2. CNN concepts for document understanding",
  "Evaluating neural models still starts with the task",
  "Monitoring neural systems after deployment",
  "Why explainability is harder here",
  "Banking risk questions for neural applications",
  "Hyperparameter tuning without chaos",
  "Which hyperparameters usually matter most",
  "Manual search, grid search, and practical tuning",
  "Lab 3. Network tuning and performance improvement",
  "Neural networks for sequence and time patterns",
  "Beyond CNNs. A broader neural landscape",
  "Do not pick an architecture because it is fashionable",
  "Documentation needed before deployment",
  "Human-in-the-loop patterns",
  "How to explain a neural solution to leadership",
  "Neural network versus traditional model. A fair comparison",
  "Case discussion. Would you recommend a neural approach here?",
  "A strong recommendation structure",
  "Scoring bands. Competent, strong, and exceptional",
  "Capstone brief. Recommend a neural network path",
  "Challenge questions to expect",
  "Peer review prompts",
  "What to remember about neural networks",
  "Five habits of strong neural network judgement",
  "What this means for banking teams",
  "Discussion prompt for your own role",
  "End the module with this sentence",
  "Next move",
] as const;

function buildNeuralNetworksDetailedScript(input: {
  title: string;
  objective: string;
}) {
  const title = input.title;
  const objective = input.objective;

  if (/why neural networks matter|outcomes|journey|right tool|not the right starting point/i.test(title)) {
    return [
      `Use this slide to position neural networks carefully. I want participants hearing that these models are powerful when representation is genuinely difficult, but they are never a default upgrade for the sake of sounding advanced.`,
      `Keep the explanation grounded in banking realism. Data volume, governance burden, transparency needs, and operational maturity all shape whether a neural approach is sensible.`,
      `Before moving on, make the standard explicit: ${objective}`,
    ];
  }

  if (/intuition|neuron|input layer|hidden layers|output layer|forward pass|weights and bias|activation|relu|sigmoid|tanh|output activations|loss function|training really means|backpropagation|gradient descent|learning rate|batch size|epochs|training loop/i.test(title)) {
    return [
      `This is a mechanics slide, so keep the room focused on understanding the moving parts as a system rather than memorising isolated terms. The aim is practical fluency, not mathematical theatre.`,
      `As you talk it through, translate each concept into what practitioners actually see. A forward pass creates a prediction, loss tells us how wrong it is, and the update process gradually reshapes the model toward a better fit.`,
      `Close by checking that the room can explain the mechanism in plain language, because that is the level of understanding they will need later when the model behaves well or badly.`,
    ];
  }

  if (/learning curves|overfitting|regularisation|dropout|normalisation|structured banking data|dense features|sparse features|choose an architecture|lab 1|stretch path|failure modes|compute and data volume|evaluation discipline|interpretability|day 1 recap|end day 1/i.test(title)) {
    return [
      `Use this slide to build diagnosis and judgement. Neural networks do not remove the need for disciplined evaluation. They increase the need for it because the failure modes can be harder to see and easier to excuse.`,
      `Keep asking what the evidence is telling us about fit, stability, architecture choice, and operational realism. Participants should hear that better judgement comes from reading signals carefully, not from assuming more depth means more quality.`,
      `Before leaving the slide, bring it back to practical control. We trust a neural model only when we can diagnose its behavior and respond intelligently when it drifts or fails.`,
    ];
  }

  if (/day 2 reset|convolutional neural networks|convolution is doing|cnn|feature maps|pooling|transfer learning|feature extraction|fine-tuning|data preparation for image and document tasks|data augmentation|lab 2/i.test(title)) {
    return [
      `This slide should make neural methods feel plausible for banking document and image tasks rather than abstract research topics. Keep the emphasis on why these architectures help and when they become practical.`,
      `Position transfer learning as an enterprise-minded default in many cases. It lowers the burden of building everything from scratch and often gives a stronger balance of performance, cost, and control.`,
      `Close by reinforcing that architecture choice still needs business realism. The method is only valuable if the data, controls, and use case can genuinely support it.`,
    ];
  }

  if (/evaluating neural models|monitoring neural systems|explainability|banking risk questions|hyperparameter tuning|hyperparameters|manual search|grid search|lab 3|sequence and time patterns|broader neural landscape|fashionable|documentation needed before deployment|human-in-the-loop/i.test(title)) {
    return [
      `Use this slide to shift the room from technical interest into operational judgement. Evaluation, tuning, monitoring, and explainability all matter more here because the systems are more complex and the consequences can be harder to trace.`,
      `Keep the conversation disciplined. Tuning without a method becomes noise, and deployment without monitoring or fallback becomes risk. Participants should hear that control logic is part of model design, not a separate extra.`,
      `Before moving on, make the responsibility clear: a neural system is acceptable only when the organisation can challenge it, monitor it, and intervene when needed.`,
    ];
  }

  if (/explain a neural solution to leadership|fair comparison|case discussion|recommendation structure|scoring bands|capstone|challenge questions|peer review|what to remember|five habits|what this means for banking teams|discussion prompt|end the module|next move/i.test(title)) {
    return [
      `This slide is about recommendation quality rather than architecture enthusiasm. I want participants practising how to explain a neural choice clearly, caveat it honestly, and compare it fairly against simpler alternatives.`,
      `Keep pressing for grounded judgement. A strong recommendation says not only why a neural approach may help, but also what the risks are, what the fallback is, and when another model family might still be better.`,
      `Close the slide by reminding the room that leadership trust depends on balanced reasoning. Technical fluency matters, but disciplined recommendation quality matters more.`,
    ];
  }

  return [
    `Use this slide to build practical neural network judgement. The key purpose here is clear: ${objective}`,
    `Keep the language calm, plain, and decision-linked so the room can connect the concept to a real banking use case rather than treating it as isolated theory.`,
    `Before moving on, make sure participants can explain why this slide matters in practice, not only repeat the terminology.`,
  ];
}

function buildNeuralNetworksFacilitatorQuestions(input: {
  title: string;
  objective: string;
}) {
  const title = input.title;
  const objective = input.objective;

  if (/why neural networks matter|outcomes|journey|right tool|not the right starting point/i.test(title)) {
    return [
      "When would a neural network genuinely add value here, and when would it simply add complexity?",
      "What organisational condition would need to be true before you would recommend this path confidently?",
      `What central judgement should participants take from this section? ${objective}`,
    ];
  }

  if (/intuition|neuron|input layer|hidden layers|output layer|forward pass|weights and bias|activation|relu|sigmoid|tanh|output activations|loss function|training really means|backpropagation|gradient descent|learning rate|batch size|epochs|training loop/i.test(title)) {
    return [
      "How would you explain this mechanism in plain language to someone who does not build models?",
      "Which part of the training process feels most important for understanding model behavior later?",
      "Where do people most often repeat the terminology here without really understanding what it does?",
    ];
  }

  if (/learning curves|overfitting|regularisation|dropout|normalisation|structured banking data|dense features|sparse features|choose an architecture|lab 1|stretch path|failure modes|compute and data volume|evaluation discipline|interpretability|day 1 recap|end day 1/i.test(title)) {
    return [
      "What evidence on this slide would make you trust the model more, and what evidence would make you slow down?",
      "If the model looked unstable or overfit, what remedy would you try first and why?",
      "How would you explain the risk of poor neural judgement to a business stakeholder?",
    ];
  }

  if (/day 2 reset|convolutional neural networks|convolution is doing|cnn|feature maps|pooling|transfer learning|feature extraction|fine-tuning|data preparation for image and document tasks|data augmentation|lab 2/i.test(title)) {
    return [
      "Why might this architecture be more suitable for the task than a simpler baseline?",
      "What data or control constraint would make this approach less convincing in practice?",
      "How does this slide change the way you think about document and image use cases in banking?",
    ];
  }

  if (/evaluating neural models|monitoring neural systems|explainability|banking risk questions|hyperparameter tuning|hyperparameters|manual search|grid search|lab 3|sequence and time patterns|broader neural landscape|fashionable|documentation needed before deployment|human-in-the-loop/i.test(title)) {
    return [
      "What control or monitoring element on this slide would matter most before deployment?",
      "How would you stop tuning work from becoming random experimentation?",
      "What would governance most likely challenge first if this neural system were proposed today?",
    ];
  }

  if (/explain a neural solution to leadership|fair comparison|case discussion|recommendation structure|scoring bands|capstone|challenge questions|peer review|what to remember|five habits|what this means for banking teams|discussion prompt|end the module|next move/i.test(title)) {
    return [
      "How would you explain this neural recommendation to leadership without overselling confidence?",
      "What is the strongest argument for a simpler alternative in this case?",
      "What caveat would be dangerous to hide when making the final recommendation?",
    ];
  }

  return [
    `What practical judgement issue sits underneath ${title.toLowerCase()}?`,
    "Where could this concept fail or be misused in a real banking environment?",
    `What should participants now understand more clearly as a result of this slide? ${objective}`,
  ];
}

export function getNeuralNetworksFacilitatorNote(slideIndex: number) {
  const slideNumber = slideIndex + 1;
  return (
    noteBlocks.find((block) => slideNumber >= block.start && slideNumber <= block.end) ??
    noteBlocks[noteBlocks.length - 1]
  );
}

export function getNeuralNetworksFacilitatorNoteBlocks() {
  return noteBlocks;
}

export function getNeuralNetworksFacilitatorSlideScript(slideIndex: number) {
  const currentNote = getNeuralNetworksFacilitatorNote(slideIndex);
  const title = slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;
  return buildNeuralNetworksDetailedScript({
    title,
    objective: currentNote.objective,
  });
}

export function getNeuralNetworksFacilitatorQuestions(slideIndex: number) {
  const currentNote = getNeuralNetworksFacilitatorNote(slideIndex);
  const title = slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;
  return buildNeuralNetworksFacilitatorQuestions({
    title,
    objective: currentNote.objective,
  });
}
