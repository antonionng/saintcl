# Module 3 | Neural Networks -- Facilitator Delivery Script

> This is a word-for-word delivery script. Read the **Say** sections aloud. Follow the **Do** instructions exactly. Use the **Ask** prompts to engage the room. Every slide has a script so you never need to improvise.

## Module Snapshot

| Detail | Value |
|--------|-------|
| Audience | Mixed technical banking cohort, Al Jazira Bank |
| Duration | 2 days, 4 hours per day |
| Delivery | Live online, shared screen, chat, concept labs and architecture review |
| Slides | 80 (s01 to s80) |
| Labs | 3 concept labs plus case discussion and capstone recommendation |
| Core arc | From neural intuition and training mechanics to CNNs, transfer learning, and governance-aware banking applications |
| Prerequisite | Module 2: Machine Learning Training, or equivalent supervised learning fluency |

## Pre-session Checklist

Before going live, confirm each of these:

- [ ] Open `index.html` and verify keyboard navigation and slide jumps work
- [ ] Load the architecture sketch worksheet for Lab 1
- [ ] Load the document-tasks worksheet for Lab 2 (CNN concepts)
- [ ] Load the tuning comparison worksheet for Lab 3
- [ ] Test the learning-curve diagrams display clearly when shared
- [ ] Prepare a one-slide recap of Module 2 so you can bridge supervised ML into neural networks
- [ ] Have the participant workbook and solution guide open for reference
- [ ] Prepare a banking-specific document example (redacted) to ground the CNN discussion
- [ ] Test screen share with slides and concept worksheets side by side

## Delivery Stance

- Teach neural networks as a judgement topic, not an algorithm topic.
- Every architectural choice must be tied to data structure, task, and governance cost.
- Treat "simpler first" as the default position. Neural networks must earn the extra complexity.
- Never let architecture enthusiasm crowd out evaluation and monitoring discipline.
- Use plain language for every concept. If you use a technical term, define it the same sentence.
- Connect every neural concept to a banking task where it actually helps.
- Push back firmly when a participant recommends a neural approach without data volume, evidence, or governance thinking.

---

# DAY 1: Foundations, Network Building, Training

**Day 1 arc:** Build intuition for neural networks from first principles. Understand layers, activations, loss, and training dynamics. See the common failure modes before hitting them in production.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Opening and value map | 15 min | s01 to s01b |
| Why neural networks and when not | 15 min | s02 to s06 |
| Intuition and architecture | 20 min | s07 to s10 |
| Weights, bias, depth | 15 min | s11 to s12 |
| Activations and output design | 20 min | s13 to s16 |
| Loss functions | 10 min | s17 to s18 |
| Training, backprop, gradient descent | 20 min | s19 to s21 |
| Learning rate, batch size, epochs | 15 min | s22 to s23 |
| Training loop and learning curves | 15 min | s24 to s25 |
| Overfitting, regularisation, dropout | 20 min | s26 to s28 |
| Normalisation, data prep, feature types | 15 min | s29 to s31 |
| Architecture choice and Lab 1 | 30 min | s32 to s34 |
| Failure modes, compute, evaluation, governance | 20 min | s35 to s38 |
| Day 1 recap and key habit | 10 min | s39 to s40 |

---

## Slide s01 -- Title slide

**Core message:** Two days. We will go from neural network intuition to making a judgement call about when they actually belong in banking.

**Say:**
"Welcome to Module 3. Neural Networks. We have two days. The goal is not to turn you into a deep learning researcher. The goal is to give you enough intuition to look at a banking problem and say, with confidence, whether a neural network is the right tool, and if so, how to govern it. By the end of tomorrow, you will be able to defend a recommendation under challenge. That is the target."

**Show:** Point to the three info cards: duration, dates, format.

**Land the point:** "Two days. Real architectures. Real judgement. Let us start with the basics."

---

## Slide s01a -- Where neural networks earn their complexity

**Core message:** Neural networks earn their complexity on signal richness, modality fit, and despite the governance cost.

**Say:**
"Here is the value map. Neural networks earn their complexity in three places. Signals: use them when relationships are too complex for simpler rules or models. Modalities: documents, image-like artefacts, and richer behavioural patterns benefit most. Governance: extra model power must be balanced against explainability and monitoring burden. If all three line up, a neural network may be a sensible choice. If any one is weak, reconsider."

**Show:** Walk through the three cards.

**Ask:** "Where in your bank do you see image, document, or rich sequence data today?"

**Land the point:** "Neural networks are a tool. Know when they earn their complexity and when they do not."

---

## Slide s01b -- Choose your learning route

**Core message:** Two routes through the module. Both produce the same deliverables.

**Say:**
"Two routes. If you are newer to neural networks, stay on the intro path. Focus on concept fluency, data preparation, and interpreting outputs in plain language. That is strong work. If you are more comfortable, use the stretch prompts to go deeper on transfer learning, tuning, and comparison between runs. Both routes produce the same deliverables. Depth differs, not scope."

**Show:** Point to both cards.

**Land the point:** "Choose your route now. I will check in after Lab 1."

---

## Slide s02 -- Why neural networks matter

**Core message:** Neural networks shine where patterns are complex, high-dimensional, or tied to images, text, or rich sequences.

**Say:**
"Neural networks are useful when the relationships in the data are complex, high-dimensional, or difficult to capture with linear rules. They are especially strong with images, language, time patterns, and richer behavioural data. They also carry a trade-off. More power often means more opacity and more governance burden. This is a recurring theme: the more the model can do, the more you have to watch it."

**Show:** Walk through the three cards.

**Land the point:** "Power and oversight scale together. Keep that in mind."

---

## Slide s03 -- What you will be able to do by the end

**Core message:** By the end, you will be able to explain, prepare, build, evaluate, and govern a neural approach for banking.

**Say:**
"Five outcomes. Explain how neural networks differ from traditional machine learning. Describe layers, activations, loss, and optimisation in practical language. Prepare data for neural training and evaluation. Understand CNN concepts and transfer learning for document tasks. And evaluate neural solutions with performance, interpretability, and governance in mind. The last one is the hardest and the most important."

**Show:** Walk through the five numbered outcomes.

**Land the point:** "Five outcomes. Plain language throughout."

---

## Slide s04 -- The two-day learning journey

**Core message:** Day 1 is intuition and training mechanics. Day 2 is CNNs, transfer learning, and deployment judgement.

**Say:**
"The arc. Day 1 is neural intuition, architectures, activations, loss, training dynamics, and common failure modes. We will build up the mental model piece by piece. Day 2 moves into CNNs, transfer learning, tuning, evaluation, banking use cases, and deployment judgement. By the end of Day 2 you will be making a real recommendation."

**Show:** Point to both day cards.

**Land the point:** "Day 1 builds the model. Day 2 applies it."

---

## Slide s05 -- What you will produce and how strong work is recognised

**Core message:** You will produce four artefacts and we will look for plain-language explanations tied to data, risk, and governance.

**Say:**
"Here are your outputs. Architecture explanations and comparison notes. Diagnosis of training behaviour and failure modes. CNN and transfer learning interpretation. A balanced recommendation on when a neural approach is justified. For validation, we look at plain-language clarity, technical choices tied to data and risk, evidence of diagnosis not only architecture enthusiasm, and recommendations that stay realistic for banking governance."

**Show:** Walk through both columns.

**Land the point:** "Plain language wins. Governance wins. Architecture enthusiasm alone does not."

---

## Slide s06 -- When neural networks are not the right starting point

**Core message:** Avoid neural networks when data is scarce, transparency is required, or operating controls are weak.

**Say:**
"Before we fall in love with neural networks, let us look at when they are the wrong tool. Low data volume makes them fragile. Highly regulated decisions may need simpler models first because transparency matters more than performance. Weak operating controls make deployment risky. A neural network without monitoring and rollback is a liability. If any of these three apply to your context, start simpler."

**Show:** Walk through the three cards.

**Land the point:** "Neural networks are not always wrong. But they are often the wrong starting point. Remember that."

---

## Slide s07 -- The basic intuition. Weighted signal flow

**Core message:** A neural network is layers of weighted combinations that transform the input step by step.

**Say:**
"Here is the basic intuition. A neural network passes input values through layers of weighted combinations. Each layer transforms the representation so the network can learn patterns that are harder to describe manually. Think of it as a pipeline of transformations. Each step makes the data a little easier to classify or predict. That is all."

**Land the point:** "Layers of weighted transformations. That is the core idea."

---

## Slide s08 -- What is a neuron?

**Core message:** A neuron takes inputs, applies weights and bias, runs them through an activation, and produces an output.

**Say:**
"A neuron is the simplest unit. It takes inputs, which are feature values or outputs from the previous layer. It produces an output, a transformed score after weights, bias, and activation are applied. One neuron is simple. Many neurons stacked in layers allow richer pattern learning. Do not be intimidated by the math. A neuron is a small function with a few knobs on it."

**Show:** Point to both cards.

**Land the point:** "Neuron equals inputs, weights, bias, activation, output. That is it."

---

## Slide s09 -- Input layer, hidden layers, output layer

**Core message:** Three kinds of layer: input receives, hidden learns, output predicts.

**Say:**
"Three kinds of layer. Input: receives raw features such as balances, counts, or encoded categories. Hidden: learns intermediate representations that capture structure. Output: produces the final prediction, such as a class probability or a numeric value. Most of the interesting learning happens in the hidden layers."

**Show:** Walk across the table rows.

**Land the point:** "Input, hidden, output. Three roles. Know which is which."

---

## Slide s10 -- Forward pass. What happens in prediction mode

**Core message:** The forward pass is a five-step signal flow from input to output.

**Say:**
"The forward pass is what happens when you ask the network for a prediction. Step one: inputs enter the first layer. Step two: weights and bias combine signals. Step three: an activation function transforms the result. Step four: the process repeats through deeper layers. Step five: the final layer produces an output score or value. When you see a production system 'run a model', this is what it is doing."

**Show:** Walk down the numbered list.

**Land the point:** "Five steps. Forward pass. This is prediction."

---

## Slide s11 -- Weights and bias in plain language

**Core message:** Weights decide how much each input matters. Bias shifts the decision boundary. Training adjusts both.

**Say:**
"Weights decide how strongly each input matters. A high weight on a feature means that feature strongly shapes the output. Bias shifts the decision boundary. Without bias, the model would always have to pass through the origin, which is rarely what you want. Together, weights and bias let the model respond differently across patterns in the data. Training is largely the process of improving these values so the network performs better on the target task."

**Show:** Point to the practical view card.

**Land the point:** "Weights are strength. Bias is shift. Training tunes both."

---

## Slide s12 -- Why hidden layers are useful

**Core message:** Multiple layers let the network build representations step by step, from simple patterns to complex abstractions.

**Say:**
"Multiple layers allow the network to learn representations step by step. Early layers may learn simple patterns. Later layers combine them into more meaningful abstractions. In an image model, the first layer might learn edges. The next might combine edges into shapes. The next might combine shapes into objects. That progression, simple to complex, is what depth buys you."

**Land the point:** "Depth builds complexity layer by layer. Not by magic."

---

## Slide s13 -- Why activation functions matter

**Core message:** Without activations, stacked layers collapse into a single linear transformation. Activations create the non-linearity that makes depth useful.

**Say:**
"Here is the key mathematical insight. Without activation functions, stacked layers collapse into a single linear transformation. No matter how deep you go, you get the same effect as one linear layer. Activations create non-linearity, which is what allows the network to learn richer patterns. No activations, no depth benefit. This is why activation choice matters."

**Land the point:** "No activations, no depth. Remember that."

---

## Slide s14 -- ReLU. The workhorse activation

**Core message:** ReLU returns the input if positive, zero otherwise. Simple, efficient, and widely used in deep networks.

**Say:**
"ReLU is the workhorse activation in modern deep networks. Definition: it returns the input if it is positive, otherwise zero. That is it. Why is it popular? Simple to compute, efficient, and often easier to optimise in deep networks than older activations. When someone says 'we used a deep network', the chances are very high they used ReLU somewhere inside."

**Show:** Point to both cards.

**Land the point:** "ReLU. Simple, fast, effective. The default."

---

## Slide s15 -- Sigmoid and tanh. Where they fit

**Core message:** Sigmoid maps to 0 to 1. Tanh maps to -1 to 1. Both can saturate and slow training.

**Say:**
"Two older activations worth knowing. Sigmoid maps values to the range 0 to 1, useful for binary output interpretation. Tanh maps values to the range -1 to 1, sometimes useful in hidden layers in older architectures. The caution: both can saturate, which can make training slower or less stable. If the input gets very large or very small, the gradient shrinks and learning stalls. That is why ReLU tends to win in modern deep networks."

**Land the point:** "Sigmoid for binary output. Tanh sometimes. ReLU for most hidden layers."

---

## Slide s16 -- Choosing output activations

**Core message:** Binary uses sigmoid. Multi-class uses softmax. Regression uses linear.

**Say:**
"Output activation depends on the task. Binary classification: sigmoid, because it gives a probability between 0 and 1. Multi-class classification: softmax, because it gives probabilities across classes that sum to 1. Regression: linear output, because you want a raw number, not a probability. Match the output activation to the task. Getting this wrong is one of the most common beginner mistakes."

**Show:** Walk across the table rows.

**Land the point:** "Task decides the output activation. Not personal preference."

---

## Slide s17 -- What a loss function does

**Core message:** The loss function measures how wrong the model is. Training reduces loss.

**Say:**
"The loss function measures how wrong the model is. Training aims to reduce loss by adjusting weights and bias in a direction that improves predictions. Think of loss as a score of badness. The lower, the better. Everything about training is about reducing this number in a sensible way."

**Land the point:** "Loss is a badness score. Training reduces it."

---

## Slide s18 -- Common loss functions

**Core message:** Three common losses: binary cross-entropy, categorical cross-entropy, mean squared error.

**Say:**
"Three common loss functions to know by name. Binary cross-entropy for binary classification. Categorical cross-entropy for multi-class classification. Mean squared error for regression. Like activations, loss function follows the task. Mismatching loss and task leads to models that look trained but predict poorly."

**Show:** Walk through the three cards.

**Land the point:** "Three losses. Match to the task."

---

## Slide s19 -- What training really means

**Core message:** Training is repeated adjustment. Predict, compare, calculate loss, update, repeat.

**Say:**
"Training is not a magical process. It is repeated adjustment. The model predicts. It compares its output to the true answer. It calculates loss. It updates parameters to reduce future error. And it does that thousands or millions of times. That is the entire training process, conceptually. The rest is engineering."

**Land the point:** "Predict, compare, adjust, repeat. That is training."

---

## Slide s20 -- Backpropagation in plain English

**Core message:** Backpropagation tells each parameter how much it contributed to the error, so updates can be smart.

**Say:**
"Backpropagation is the mechanism that makes the update step smart. It tells each parameter how much it contributed to the error. It sends the learning signal backwards from output to earlier layers so the network can update intelligently. Without backpropagation, you would be guessing which weight to change. With it, the network updates each weight in proportion to its responsibility for the error."

**Land the point:** "Backprop equals blame assignment. It makes training efficient."

---

## Slide s21 -- Gradient descent intuition

**Core message:** Gradient descent follows the slope of the loss to move parameters toward lower error.

**Say:**
"Gradient descent is a search process. It follows the slope of the loss surface to move parameters toward lower error. Imagine you are on a hillside in fog and you want to get to the bottom. You feel the slope under your feet and step downhill. That is gradient descent. The practical meaning on the card matters: if the step is too large, training overshoots. If it is too small, training crawls or stalls. Step size is a big deal."

**Show:** Point to the practical meaning card.

**Land the point:** "Step size matters. That becomes the learning rate in a second."

---

## Slide s22 -- What is a learning rate?

**Core message:** The learning rate controls how big each update step is. It is one of the most important hyperparameters.

**Say:**
"The learning rate controls the size of each update step during optimisation. It is one of the most important choices in neural network training. Too high and training diverges. Too low and training takes forever or gets stuck. If someone is struggling to train a network, the learning rate is the first thing I would check."

**Land the point:** "Learning rate. First lever. Always check it first."

---

## Slide s23 -- Batch size and epochs

**Core message:** Batch size is examples per update. Epoch is one full pass. Both affect speed, stability, and generalisation.

**Say:**
"Two more knobs. Batch size: how many examples are processed before an update. Epoch: one full pass through the training dataset. These choices affect speed, stability, and generalisation. Small batches update more often and may generalise better. Large batches update less often and may train faster. Epochs decide how many times the network sees the full dataset. More epochs means more learning, up to the point of overfitting."

**Show:** Walk through the three cards.

**Land the point:** "Batch size, epochs, learning rate. The three dials you touch first."

---

## Slide s24 -- Typical training loop

**Core message:** The training loop is five lines of core code: predict, compute loss, zero gradients, backprop, step.

**Say:**
"Here is the typical training loop in code. For each epoch, for each batch: predict with the model, compute the loss, zero the gradients, backpropagate, and step the optimiser. Five lines of core logic. The rest of any training script is data loading, logging, and configuration. When you read someone else's training code, find these five lines first. Everything else is scaffolding."

**Show:** Walk through the code, line by line.

**Land the point:** "Five lines at the core. Everything else is scaffolding."

---

## Slide s25 -- Reading learning curves

**Core message:** Training and validation loss curves are more informative than a single final score.

**Say:**
"Training and validation loss curves help you see whether the model is learning, stalling, or starting to overfit. These curves are often more informative than a single final score. If the training loss is dropping and validation is following, you are learning well. If training keeps dropping but validation starts rising, you are overfitting. If neither is moving, you have a setup problem. Read the curves. Do not just read the final number."

**Land the point:** "Curves tell the story. Numbers alone lie."

---

## Slide s26 -- How overfitting appears in neural training

**Core message:** Overfitting looks like training loss improving while validation stalls or worsens.

**Say:**
"Here is how overfitting appears in neural training. Symptom: training loss keeps improving while validation loss stalls or worsens. Meaning: the network is memorising details of the training data rather than generalising. This is the most common failure mode in deep learning. Recognise it immediately when you see it. The fix is usually regularisation, more data, or a simpler model."

**Show:** Point to both cards.

**Land the point:** "Training falls, validation rises equals overfitting. Learn the signature."

---

## Slide s27 -- Regularisation strategies

**Core message:** Five common regularisation strategies. Use the simplest that works.

**Say:**
"Five ways to fight overfitting. Dropout, which we will explain on the next slide. Weight decay, which gently pulls weights toward zero. Early stopping, which halts training when validation stops improving. More data or augmentation, which often helps more than any clever technique. And simpler architecture, which is the overlooked classic. Try them in roughly that order. Simpler architectures first when possible."

**Show:** Walk down the bullet list.

**Land the point:** "Five strategies. Often the simplest one works best."

---

## Slide s28 -- What dropout is doing

**Core message:** Dropout randomly disables some neurons during training to discourage fragile co-dependence.

**Say:**
"Dropout randomly disables some neurons during training. Sounds destructive. Actually useful. It discourages fragile co-dependence between neurons and can improve generalisation. The network is forced to learn redundant representations, which makes it more robust. At prediction time, dropout is turned off. The full network is used. Dropout is one of the simplest and most effective regularisation tools."

**Land the point:** "Dropout equals forced robustness. Simple and effective."

---

## Slide s29 -- Normalisation and stable training

**Core message:** Scaling and batch normalisation help training behave smoothly. Unstable training hides architecture problems.

**Say:**
"Careful scaling and batch normalisation can help training behave more smoothly. Stability matters because unstable training can waste time and hide architecture problems. If your loss is jumping wildly, you cannot tell whether the architecture is bad or whether the training setup is bad. Fix the stability first, then you can reason about the architecture."

**Land the point:** "Stable training first. Then architecture. In that order."

---

## Slide s30 -- Preparing structured banking data for neural networks

**Core message:** Four preparation steps: clean, encode, scale, split. All with leakage control.

**Say:**
"Four steps to prepare structured banking data. Clean missing values and invalid records. Encode categorical features carefully. Scale numeric features when needed. Create train, validation, and test splits with leakage control. This looks exactly like what you did for simpler models. Good. Because neural networks do not exempt you from any of it. If anything, they are more sensitive to bad preparation."

**Show:** Walk down the numbered list.

**Land the point:** "Same prep discipline. No shortcuts because it is a neural network."

---

## Slide s31 -- Dense features and sparse features

**Core message:** Dense features are compact numeric. Sparse features are high-dimensional encoded inputs.

**Say:**
"Two feature shapes you will encounter. Dense: compact numeric representations such as balances, counts, or ratios. Most of what a bank has is dense. Sparse: high-dimensional encoded inputs such as rare categories or text token indicators. Sparse features need more care. They can blow up dimensionality and starve the network of useful signal if not grouped sensibly."

**Show:** Point to both cards.

**Land the point:** "Dense is easier. Sparse needs extra thought."

---

## Slide s32 -- How to choose an architecture sensibly

**Core message:** Start with the simplest architecture that fits the task. Let data and governance constrain the choice.

**Say:**
"Architecture choice is a judgement call. Start with the simplest architecture that fits the task. Architecture should reflect data type, objective, available compute, and governance constraints. Do not choose based on what a conference paper used. Choose based on what your data and your risk environment can support. A small feed-forward network that ships is more valuable than a fashionable architecture that never makes it to production."

**Land the point:** "Simplest fit wins. Always earn the next layer of complexity."

---

## Slide s33 -- Lab 1. Network anatomy walkthrough

**Do -- read these instructions exactly:**

"This is Lab 1. You are going to map inputs, hidden layers, activation, loss, and output to a banking prediction task.

Pick a banking prediction task you know. For example, fraud on transactions, default on small business loans, or complaint escalation on service tickets.

Your steps are:
1. State the task in one sentence, including the decision it supports.
2. List the input features. Mark them as dense or sparse.
3. Sketch the architecture: input layer, hidden layer count, number of neurons per layer, activation per layer, output activation. Keep it simple.
4. Name the loss function and justify it in one sentence.
5. Write one paragraph in plain language explaining what each part of the architecture is doing and why.

Your output is: a simple architecture sketch plus a written explanation of what each part is doing.

You have 25 minutes. Click the timer. Go."

**Do:** Start the 25-minute timer. Monitor chat. Visit participants virtually during the last 10 minutes.

**Watch for:**
- Architectures with five or six hidden layers for a simple tabular task. Push them smaller.
- Output activations that do not match the task. Sigmoid on a regression target. Softmax on binary. Redirect.
- Loss functions that do not match the task. Same issue.
- Explanations in jargon only. Ask: "Tell me what each layer is doing in plain English."

**Debrief (after timer):**

**Ask:**
- "State your task in one sentence. What decision does it support?"
- "How many hidden layers did you use? Justify that number."
- "What output activation did you pick? Why?"

**Land the point:** "Good anatomy work. The habit is choosing each piece deliberately, not by reflex."

---

## Slide s34 -- Stretch path. What could go wrong?

**Core message:** Five things that could go wrong with a proposed neural architecture.

**Say:**
"Stretch path for Lab 1. Before you leave the sketch, stress-test it against five risks. Too many parameters for the dataset size. Leakage in the features. Weak validation design. Output activation not matched to the task. Unclear operational use of the prediction. If any of these apply, revise the sketch. This stress test is what a good reviewer will do to your architecture later. Do it yourself first."

**Show:** Walk down the bullet list.

**Land the point:** "Stress-test before someone else does it for you."

---

## Slide s35 -- Common training failure modes

**Core message:** Three failure modes to recognise immediately: no learning, unstable learning, memorisation.

**Say:**
"Three failure modes every neural practitioner hits eventually. No learning: loss barely moves because the setup is wrong. Maybe the learning rate is too small, maybe the labels are wrong, maybe the input is broken. Unstable learning: loss jumps wildly due to poor optimisation settings. Usually learning rate too high. Memorisation: training improves while validation degrades. Classic overfitting. Recognise these three patterns and you will debug most training problems quickly."

**Show:** Walk through the three cards.

**Land the point:** "No learning, unstable learning, memorisation. Three signatures. Learn them."

---

## Slide s36 -- Why compute and data volume matter

**Core message:** Neural networks are expensive. Before choosing them, weigh the performance gain against cost and complexity.

**Say:**
"Neural networks are often expensive to train compared with simpler models. Compute is real money. Developer time is real money. Before choosing them, ask whether the performance gain justifies the operational cost and complexity. Three percentage points of F1 is not always worth ten times the compute and a harder-to-govern model. Do this math before you commit."

**Land the point:** "Performance gain must pay for the complexity. Do the math."

---

## Slide s37 -- Neural networks still need the same evaluation discipline

**Core message:** Careful splits, sensible metrics, leakage challenges, and honest reporting still apply.

**Say:**
"Changing the model family does not remove the need for discipline. You still need careful splits, sensible metrics, challenge of leakage, and honest reporting of limitations. A neural network does not earn relaxed evaluation standards. If anything, it earns stricter ones, because the model is harder to explain if something goes wrong. Do not let architecture excitement weaken your evaluation habits."

**Land the point:** "Same evaluation discipline. Stricter, not looser."

---

## Slide s38 -- Interpretability becomes more important, not less

**Core message:** As models get more complex, explanation artifacts, challenge, and human oversight get more important.

**Say:**
"As models become more complex, the need for explanation artifacts, challenge questions, and human oversight becomes stronger, not weaker. You cannot argue that a model is too complex to explain and also deploy it against customer-facing decisions. Pick one. Either simplify the model, or invest heavily in the explanation and oversight tooling. This is the deal with complexity."

**Land the point:** "More complexity buys more oversight work, not less."

---

## Slide s39 -- Day 1 recap

**Core message:** Four takeaways from Day 1.

**Say:**
"Day 1 recap. Four things. Neural networks are layered weighted functions with non-linearity. Training is repeated parameter improvement through loss minimisation. Architecture, learning rate, and regularisation strongly affect outcomes. And governance discipline still applies at every stage. Tomorrow we move into CNNs, transfer learning, tuning, and deployment judgement."

**Show:** Walk down the numbered list.

**Land the point:** "Four takeaways. Carry them into tomorrow."

---

## Slide s40 -- End day 1 with this question

**Core message:** If you cannot state the representation challenge clearly, you probably do not need a neural network yet.

**Say:**
"Here is the question I want you to sit with overnight. What representation challenge am I trying to solve? If you cannot answer that clearly, you probably do not need a neural network yet. A neural network is a tool for learning rich representations. If your problem does not have a representation challenge, the tool is oversized. Think about that before tomorrow."

**Show:** Point to the hero card.

**Land the point:** "Representation challenge first. If there is none, go simpler. See you tomorrow."

---

# DAY 2: CNNs, Transfer Learning, Tuning, Deployment

**Day 2 arc:** CNNs for document understanding. Transfer learning as the practical default. Tuning with discipline. Deployment and governance for neural systems. Capstone recommendation.

**Timing overview:**

| Block | Duration | Slides |
|-------|----------|--------|
| Day 2 reset and CNN intuition | 20 min | s41 to s45 |
| Banking document use cases | 10 min | s46 to s47 |
| Transfer learning | 15 min | s48 to s50 |
| Data prep and augmentation | 15 min | s51 to s52 |
| Lab 2: CNN concepts for documents | 30 min | s53 |
| Metrics, monitoring, explainability | 20 min | s54 to s56 |
| Risk questions | 10 min | s57 |
| Tuning discipline and search strategy | 15 min | s58 to s60 |
| Lab 3: tuning comparison | 30 min | s61 |
| Broader neural landscape | 15 min | s62 to s64 |
| Governance and human oversight | 15 min | s65 to s66 |
| Executive communication and comparison | 15 min | s67 to s68 |
| Capstone discussion and preparation | 40 min | s69 to s74 |
| Module close | 15 min | s75 to s80 |

---

## Slide s41 -- Day 2 reset. From feed-forward networks to richer tasks

**Core message:** Today moves from general neural concepts into image, document, and transfer learning use cases.

**Say:**
"Welcome back. Today we move from the general neural concepts you learned yesterday into richer tasks. Image-like, document-like, and transfer learning use cases that are more likely to arise in advanced banking scenarios. The foundations from yesterday all carry forward. We are just specialising."

**Land the point:** "Yesterday was the foundation. Today we apply it to richer data."

---

## Slide s42 -- Why convolutional neural networks were created

**Core message:** Dense networks do not exploit spatial structure. CNNs were designed to do that efficiently.

**Say:**
"Why do we have CNNs at all? Standard dense networks do not naturally exploit local spatial structure in images. If you flatten a 500 by 500 image into 250,000 inputs, you lose all the information about which pixel is next to which. CNNs were designed to detect meaningful local patterns such as edges, shapes, and regions more efficiently, while preserving the spatial relationship between inputs."

**Land the point:** "CNNs preserve spatial structure. That is their edge over dense networks on images."

---

## Slide s43 -- What convolution is doing

**Core message:** A small filter slides across the input and produces feature maps highlighting local patterns.

**Say:**
"Convolution is a simple idea. A small filter, maybe three by three or five by five, moves across the input and produces feature maps that highlight useful local patterns. The same filter is applied everywhere, so the network learns patterns that are location-independent. This is powerful for images, scanned forms, signatures, and other document artifacts where the same kind of structure can appear anywhere on the page."

**Land the point:** "A small filter. Applied everywhere. That is convolution."

---

## Slide s44 -- Core CNN building blocks

**Core message:** Three blocks: convolution detects, activation adds non-linearity, pooling compresses.

**Say:**
"Three core CNN building blocks. Convolution detects local patterns using filters. Activation adds non-linearity to the detected signals. Pooling compresses and summarises features. These three blocks repeat through the network. Early blocks detect simple things like edges. Later blocks detect complex things like layout regions. The blocks are simple. The power comes from stacking."

**Show:** Walk through the three cards.

**Land the point:** "Convolution, activation, pooling. Three blocks. Stacked to detect complexity."

---

## Slide s45 -- How feature maps evolve through layers

**Core message:** Early layers learn simple structures. Deeper layers combine them into meaningful patterns.

**Say:**
"As feature maps move through the network, they evolve. Early layers detect simple structures: edges, corners, colour blocks. Deeper layers combine them into more meaningful patterns: shapes, layout regions, visual signatures. This hierarchy is what makes CNNs effective on documents. Each layer builds on the representations of the previous one. Same principle we saw in feed-forward networks, but now with spatial awareness."

**Land the point:** "Simple to complex, layer by layer. Spatial version of what you already know."

---

## Slide s46 -- CNNs in banking document understanding

**Core message:** CNNs can handle document classification, signature checks, scanned form routing, and image triage. Care is required.

**Say:**
"Where do CNNs fit in banking? Possible tasks include document classification, signature checks, scanned form routing, and image quality triage. Real, useful applications. But care is required. Visual quality varies. Documents may contain sensitive information. Misclassification consequences can be significant. A wrongly classified loan document is not a small error."

**Show:** Point to both cards.

**Ask:** "Which of those tasks would you most want to pilot in your organisation? Why?"

**Land the point:** "CNNs have real banking applications. They also carry real stakes."

---

## Slide s47 -- Why pooling helps

**Core message:** Pooling reduces spatial dimensions while keeping useful signals. Lower compute, more robustness.

**Say:**
"Pooling reduces spatial dimensions while retaining the most useful signals. The most common form, max pooling, takes the maximum value in each small region of the feature map. This lowers compute needs and can improve robustness to small shifts in the input. If a signature is slightly rotated or offset, pooling helps the network recognise it anyway."

**Land the point:** "Pooling saves compute and adds robustness. Double win."

---

## Slide s48 -- What transfer learning is

**Core message:** Transfer learning starts from a model trained on a large dataset and adapts it to your task.

**Say:**
"Transfer learning is the most practical technique on Day 2. You start from a model already trained on a large dataset, then adapt it to your task. Instead of training from scratch, which requires enormous data and compute, you leverage the representations the original model already learned. For most enterprise banking applications, this is the right starting point. Training a CNN from scratch for a small document task is rarely the best choice."

**Land the point:** "Start from a trained model. Adapt it. That is transfer learning."

---

## Slide s49 -- Why transfer learning is so useful in practice

**Core message:** Transfer learning needs less data, trains faster, performs better in constrained settings, and fits enterprise realities.

**Say:**
"Four reasons transfer learning is so useful. It needs less data than training from scratch. It usually trains faster. It often performs better in constrained settings. And it can be more realistic for enterprise teams that do not have research-scale data or compute. For banking, where labelled data is precious and compute is limited, transfer learning is usually the pragmatic choice."

**Show:** Walk down the bullet list.

**Land the point:** "Less data. Less compute. Usually better results. Transfer learning is the default for enterprise work."

---

## Slide s50 -- Feature extraction versus fine-tuning

**Core message:** Feature extraction freezes most of the model. Fine-tuning unfreezes more layers for domain adaptation.

**Say:**
"Two flavours of transfer learning. Feature extraction: freeze most layers and train only the final head. Fast, safe, low risk. Fine-tuning: unfreeze more layers and adapt deeper representations to your domain. Slower, more compute, but can yield better results when your domain differs meaningfully from the pretrained model. Start with feature extraction. Move to fine-tuning only if feature extraction does not meet the bar."

**Show:** Point to both cards.

**Land the point:** "Feature extraction first. Fine-tuning only if needed."

---

## Slide s51 -- Data preparation for image and document tasks

**Core message:** Four preparation steps: resolution, labelling, splits, sensitive information protection.

**Say:**
"Four data preparation steps for image and document tasks. One: check resolution and orientation consistency. A mixture of different sizes can hide bugs or bias. Two: label carefully and review edge cases. Bad labels ruin any model, and documents often have tricky edges. Three: separate train, validation, and test with leakage awareness. Same as always. Four: protect sensitive information in storage and handling. Banking documents often contain personally identifiable information. That is a compliance issue from day one."

**Show:** Walk down the numbered list.

**Land the point:** "Prep carefully. Protect sensitive data from the start."

---

## Slide s52 -- What data augmentation is doing

**Core message:** Augmentation adds realistic variation. It must reflect plausible conditions, not fantasy inputs.

**Say:**
"Augmentation creates realistic variation such as rotation, crop, or noise to help the model generalise. It must reflect plausible real conditions, not fantasy inputs. If real scans can be rotated up to 10 degrees, augment to 10 degrees. Do not augment to 180 degrees unless your real documents actually appear upside down. Augmentation should simulate reality, not invent weirdness."

**Land the point:** "Augment the real variation. Not invented weirdness."

---

## Slide s53 -- Lab 2. CNN concepts for document understanding

**Do -- read these instructions exactly:**

"This is Lab 2. You are going to map CNN components to a document classification or form routing scenario in banking.

Pick a document task. For example, classifying incoming scanned forms into categories, verifying signatures, or routing loan application documents to the right queue.

Your steps are:
1. State the task and the decision it supports in one sentence.
2. Sketch a CNN architecture at a high level. Convolution blocks, pooling, a classification head. Keep it simple.
3. Decide whether to train from scratch or use transfer learning. Justify the choice in two sentences.
4. Identify data quality risks. What could go wrong with the input documents?
5. Write a short paragraph on governance. How would you monitor this model after deployment? What is the fallback if it fails?

Your output is: architecture sketch, rationale for transfer learning, and a note on data quality risks.

If you finish early, describe one explanation artifact you would produce for a compliance reviewer.

You have 30 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer.

**Watch for:**
- Proposals to train from scratch without a clear reason. Push toward transfer learning.
- Missing data quality risks. Prompt: "What if the scans are low resolution? What if the orientation varies?"
- Governance sections written as an afterthought. Require concrete monitoring signals.

**Debrief (after timer):**

**Ask:**
- "Did you pick transfer learning or from scratch? Why?"
- "What is the most realistic data quality risk for your task?"
- "How would you detect that the model has degraded after six months?"

**Land the point:** "CNN for documents. Transfer learning as the default. Governance as a design input, not an afterthought."

---

## Slide s54 -- Evaluating neural models still starts with the task

**Core message:** Precision, recall, confusion matrices, and threshold trade-offs still matter. Neural networks do not exempt you.

**Say:**
"Evaluation. Neural models still get evaluated like any other model. For classification tasks, precision, recall, confusion matrices, and threshold trade-offs still matter. Neural networks do not exempt you from careful metric design. If anything, they make it more important, because the model is harder to explain to a stakeholder who is not seeing accurate metrics."

**Land the point:** "Same metric discipline. Neural is not a free pass."

---

## Slide s55 -- Monitoring neural systems after deployment

**Core message:** Three drift types for neural systems: input drift, prediction drift, outcome drift.

**Say:**
"Three kinds of drift to monitor for neural systems. Input drift: changes in image or document quality. Prediction drift: changes in score or class distribution. Outcome drift: changes in true result rates and operational feedback. All three need monitors. For CNNs specifically, image quality drift is a real risk. Scanner gets replaced. Operational conditions change. The model slowly gets worse and nobody notices until the business numbers shift."

**Show:** Walk through the three cards.

**Land the point:** "Three drift types. Monitor all three. Image quality drift especially for CNNs."

---

## Slide s56 -- Why explainability is harder here

**Core message:** Deep models trade transparency for performance. Tools help but do not replace human judgement.

**Say:**
"Here is the honest trade-off. Deep models often achieve strong performance at the cost of transparency. Explainability tools like saliency maps, SHAP, and feature visualisation help, but they do not remove the need for human judgement and challenge. When a compliance reviewer asks why the model flagged a specific document, your answer cannot be 'the ensemble said so'. You need a usable explanation, even if imperfect."

**Land the point:** "Tools help. They do not replace judgement. Plan for both."

---

## Slide s57 -- Banking risk questions for neural applications

**Core message:** Five risk questions every neural banking application must answer.

**Say:**
"Five risk questions for any neural banking application. What happens when the model is uncertain? Who reviews edge cases? What fallback exists if the model fails? How will drift or degraded image quality be detected? What evidence supports fairness and robustness? If you cannot answer all five, the application is not ready for production. Write these answers before the architecture review, not after."

**Show:** Walk through the five numbered questions.

**Land the point:** "Five risk questions. Answer them before deployment. Every time."

---

## Slide s58 -- Hyperparameter tuning without chaos

**Core message:** Tuning should be systematic. Change one family of choices at a time. Log carefully.

**Say:**
"Tuning can get chaotic quickly if you let it. Tuning should be systematic. Change one family of choices at a time. Log results carefully. Compare on the same validation regime. It is tempting to change everything at once hoping something works. Resist that. When something finally works, you will not know which change caused the improvement."

**Land the point:** "One family at a time. Log everything. Compare fairly."

---

## Slide s59 -- Which hyperparameters usually matter most

**Core message:** Learning rate, depth and width, regularisation. Three levers that dominate.

**Say:**
"Three hyperparameter families dominate most tuning work. Learning rate: often the first and biggest lever. If training is broken, check this first. Depth and width: affects capacity and overfitting risk. More is not always better. Regularisation: affects stability and generalisation. Tune these three before touching anything else. Most exotic hyperparameters give small wins compared to getting these three right."

**Show:** Walk through the three cards.

**Land the point:** "Three dominant levers. Master them before chasing exotic tricks."

---

## Slide s60 -- Manual search, grid search, and practical tuning

**Core message:** Domain knowledge and experiment logs usually beat brute force.

**Say:**
"In practice, tuning is often guided by domain knowledge and experiment logs rather than brute force alone. A structured manual search, informed by what you know about the problem, often beats a large automated grid search. Careful trial design matters more than blindly trying everything. Think before you tune. Do not outsource the thinking to the compute."

**Land the point:** "Think first. Tune second. Brute force last."

---

## Slide s61 -- Lab 3. Network tuning and performance improvement

**Do -- read these instructions exactly:**

"This is Lab 3. You are going to compare two tuning runs and explain which one should be preferred.

You have two tuning runs documented in the worksheet. They differ in learning rate and regularisation settings. Your steps are:
1. Read the two configurations and the reported metrics. Note what is the same and what is different between the runs.
2. Build a comparison table. Train and validation loss at key epochs. Final metrics. Any stability signals.
3. State which run you would take forward. Give two reasons.
4. State what you would try next and why. Do not propose changing five things at once.
5. Write one paragraph on what could still go wrong in production, regardless of which run wins.

Your output is: model comparison table, validation summary, and one recommendation on next experiment priority.

If you finish early, sketch how you would design the monitoring plan for the winning run.

You have 30 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer.

**Watch for:**
- Comparisons that do not reference the validation curves, only the final metrics. Push them back to the curves.
- Recommendations that change too many things for the next experiment. Force them down to one or two changes.
- Missing production risk paragraph. Prompt: "Even if this wins tuning, what could still break in production?"

**Debrief (after timer):**

**Ask:**
- "Which run did you pick and why?"
- "What is the single next experiment you would run?"
- "What still worries you about production, even for the winning run?"

**Land the point:** "Disciplined tuning. One change at a time. Always leave room for the production reality check."

---

## Slide s62 -- Neural networks for sequence and time patterns

**Core message:** Some tasks involve order. Different architectures exist to handle temporal or token-order dependencies.

**Say:**
"Some tasks involve temporal ordering or token order, such as customer event sequences or text. Different architectures are designed to capture these dependencies more effectively than a standard feed-forward or CNN. You do not need to master them today. You do need to know that they exist, and that the right architecture depends on the structure of your data."

**Land the point:** "Order matters for some tasks. Different architectures handle order differently."

---

## Slide s63 -- Beyond CNNs. A broader neural landscape

**Core message:** Recurrent networks, transformers, and autoencoders each serve different needs.

**Say:**
"A quick tour beyond CNNs. Recurrent networks for sequential signals. Transformers for modern language and multi-modal tasks. Autoencoders for representation learning and anomaly use cases. You will encounter all three in the AI landscape. The principle is the same across them: architecture follows problem structure. Match the architecture to the shape of the data and the nature of the task."

**Show:** Walk through the bullet list.

**Land the point:** "Broader landscape. Same principle. Architecture follows problem structure."

---

## Slide s64 -- Do not pick an architecture because it is fashionable

**Core message:** Pick architecture based on data structure, operating need, and governance. Not hype.

**Say:**
"Here is the blunt rule. Do not pick an architecture because it is fashionable. Pick it because it matches the structure of the data, the operating need, and the governance environment. Architecture follows problem structure, not hype. If a conference paper or vendor pitch is driving your architecture choice, stop and ask what your data actually looks like."

**Land the point:** "Problem structure picks the architecture. Not hype."

---

## Slide s65 -- Documentation needed before deployment

**Core message:** Five documentation items required before any neural model goes live.

**Say:**
"Five documentation items every neural model needs before deployment. Training data scope and provenance. Labelling logic and review process. Architecture and parameter rationale. Validation evidence and caveats. Monitoring, fallback, and escalation plan. If any of these five is missing, the model is not ready. This is not bureaucracy. This is what audit will ask for in month three, and what you will wish you had written down."

**Show:** Walk down the bullet list.

**Land the point:** "Five documents. Non-negotiable before deployment."

---

## Slide s66 -- Human-in-the-loop patterns

**Core message:** Use review queues and selective automation. Keep humans on the high-impact cases.

**Say:**
"Two human-in-the-loop patterns worth knowing. Review queue: escalate low-confidence or high-impact cases for manual review. Selective automation: automate only lower-risk cases while retaining intervention checkpoints. The key idea is that automation is not all-or-nothing. You can automate the easy 80 percent and keep humans on the hard 20 percent. That is often the best operating design in banking."

**Show:** Point to both cards.

**Land the point:** "Automate the easy. Keep humans on the hard. That is the pattern."

---

## Slide s67 -- How to explain a neural solution to leadership

**Core message:** Leaders need problem, suitability, evidence, risks, controls. Not layer details.

**Say:**
"When you explain a neural solution to leadership, do not start with layers. Leaders do not need every layer detail. They need the business problem, why this approach is suitable, what evidence supports it, what risks remain, and what controls will surround it. If you find yourself in a leadership meeting talking about activation functions, you have misread the room. Lift up to decision level."

**Land the point:** "Problem, suitability, evidence, risks, controls. That is the leadership frame."

---

## Slide s68 -- Neural network versus traditional model. A fair comparison

**Core message:** Traditional and neural differ on data need, explainability, pattern complexity, and operational burden.

**Say:**
"A fair comparison. Traditional models typically need lower to moderate data, offer clearer explainability, handle moderate pattern complexity, and carry lower operational burden. Neural networks often need more data, offer weaker explainability, handle higher pattern complexity, and carry usually higher operational burden. Different tools. Different trade-offs. Pick based on where your problem sits on each of these four dimensions."

**Show:** Walk across the table.

**Land the point:** "Four dimensions of comparison. Fair trade-offs on each."

---

## Slide s69 -- Case discussion. Would you recommend a neural approach here?

**Do:**

**Say:**
"Short case discussion. Think about a banking problem in your domain. Given what we have covered, would you recommend a neural approach? Use the evidence from the task, not enthusiasm alone. Consider data volume, task type, explainability needs, deployment burden, and expected benefit."

**Do:** Open the floor. Take two or three voices. Push each speaker to name at least one reason not to use a neural approach for their case.

**Land the point:** "The best neural recommendation sometimes is not to use one. That is a fine answer."

---

## Slide s70 -- A strong recommendation structure

**Core message:** Five-part recommendation: problem, rationale, evidence, monitoring, pilot scope.

**Say:**
"A strong recommendation structure has five parts. State the problem and decision clearly. Explain why a neural approach is or is not justified. Describe the evidence level and major caveats. Define monitoring, fallback, and review logic. Recommend pilot scope before broad rollout. Five parts. Short. Clear. Defensible. This is the structure you will use in the capstone."

**Show:** Walk down the numbered list.

**Land the point:** "Five-part structure. Learn it. Use it."

---

## Slide s71 -- Scoring bands. Competent, strong, and exceptional

**Core message:** Three bands: explains correctly, shows judgement, balances depth with operating realism.

**Say:**
"How I am scoring the capstone. Competent: explains core neural concepts correctly and links them to the task at a basic level. Strong: shows sound architecture judgement, evaluates trade-offs clearly, and includes governance considerations. Exceptional: balances technical depth, operating realism, and executive communication with disciplined caveats. Aim for strong or exceptional. Do not stop at competent."

**Show:** Walk across the table.

**Land the point:** "Judgement and realism beat depth alone. That is the bar."

---

## Slide s72 -- Capstone brief. Recommend a neural network path

**Core message:** Participants will assess a banking use case and decide whether a neural architecture is justified.

**Say:**
"The capstone. You will assess a banking use case and decide whether a neural architecture is justified. Your recommendation must address data suitability, architecture direction, evaluation logic, governance needs, and pilot design. This is where two days of work come together into one clear recommendation. Take it seriously."

**Land the point:** "Two days in one recommendation. Make it count."

---

## Slide s73 -- Challenge questions to expect

**Core message:** Five challenge questions the capstone recommendation must answer.

**Say:**
"Five challenge questions you should expect. Why not use a simpler model? What evidence supports the architecture choice? How do we monitor drift and quality degradation? What happens when the model is uncertain? Who signs off before broader deployment? Anticipate them. If your recommendation cannot answer all five convincingly, revise before presenting."

**Show:** Walk down the bullet list.

**Land the point:** "Five challenge questions. Have the answers ready."

---

## Slide s74 -- Peer review prompts

**Do -- read these instructions exactly:**

"Capstone time. You have 30 minutes to prepare your recommendation, then 5 minutes to present, then peer review.

Your recommendation must cover:
1. Problem and decision in one sentence.
2. Data suitability and key risks.
3. Architecture direction with rationale.
4. Evaluation approach and metrics.
5. Governance, monitoring, fallback.
6. Pilot scope and success criteria.

As you prepare, self-review using these prompts:
- Is the use case really suitable for a neural approach?
- Are data assumptions explicit enough?
- Is the architecture reasoning understandable?
- Is the evaluation discipline credible?
- Would risk and compliance accept the control design?

You have 30 minutes to prepare, then each person or team presents for 5 minutes. Click the timer. Go."

**Do:** Start the 30-minute timer. Visit participants virtually in the last 10 minutes and stress-test their governance.

**Presentation round:**

**Do:** After preparation, call on participants or teams. Give each 5 minutes. After each, ask two of the challenge questions from s73.

**Land the point:** "Good recommendations hold up under real challenge. That is the standard."

---

## Slide s75 -- What to remember about neural networks

**Core message:** Three remembered truths: power, cost, judgement.

**Say:**
"Three things to remember about neural networks. Power: they can learn rich patterns that simpler models may miss. Cost: they often require more data, more compute, and more oversight. Judgement: the strongest choice is not always the deepest one. Keep all three in tension when you look at a problem. The answer to 'should we use a neural network' is 'it depends on all three'."

**Show:** Walk through the three cards.

**Land the point:** "Power, cost, judgement. Three things. Always in tension."

---

## Slide s76 -- Five habits of strong neural network judgement

**Core message:** Five habits carry across every neural project.

**Say:**
"Five habits that separate strong practitioners from casual ones. Start with the representation challenge. Choose architecture based on task structure. Track training and validation behavior carefully. Prefer controlled tuning over chaotic experimentation. Design governance before deployment. These habits do not change whether the network is small or enormous. They carry across every neural project."

**Show:** Walk down the numbered list.

**Land the point:** "Five habits. Carry them forward."

---

## Slide s77 -- What this means for banking teams

**Core message:** Document and image workflows justify neural. Structured tabular problems often do not. Pilot with controls.

**Say:**
"What does all this mean for banking teams? Document-heavy and image-heavy workflows may justify neural solutions. Structured tabular problems may still be better served by simpler models first. Pilot design, controls, and fallback logic should be part of every serious proposal. You do not need every team to become a neural team. You need the right problems to reach the right tool, with the right controls."

**Show:** Walk down the bullet list.

**Land the point:** "Right problem, right tool, right controls."

---

## Slide s78 -- Discussion prompt for your own role

**Do:**

**Say:**
"A discussion prompt for your own role. Where in your domain does richer representation really matter? Look for tasks where image, document, text, or sequence structure is central to the decision. Those are the candidates for a neural approach. Tasks where structured tabular features are the whole story usually are not."

**Do:** Open the floor. Take two or three voices. Keep it short.

**Land the point:** "Find the representation-rich tasks. Those are the candidates."

---

## Slide s79 -- What you learned, produced, and proved

**Core message:** Recap of learning, outputs, and success indicators.

**Say:**
"Three things to take away. What you learned: how neural approaches work, when they are justified, and how architecture, training behaviour, and governance interact. What you produced: architecture explanations, diagnosis notes, CNN and transfer learning reasoning, and a balanced recommendation on when to use neural methods. What proved success: plain-language explanation, disciplined trade-off thinking, and control logic that stayed realistic for banking use."

**Show:** Point to the three cards.

---

## Slide s80 -- Module 3 complete

**Core message:** Neural networks are a tool. Complexity must earn its place. Carry judgement forward.

**Say:**
"Module 3 is complete. Module 4 shifts from technical modelling into business prioritisation. You will use the judgement developed here to decide where AI is worth pursuing and how to govern it. Carry forward this habit: the strongest neural choice is not always the deepest one. Complexity must earn its place through value, evidence, and controllability. Thank you. Well done. See you in Module 4."

**Land the point:** "Complexity earns its place. Never the other way around. See you in the next module."

---

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Core concepts explained correctly. Architecture choices broadly sensible. Governance acknowledged at a basic level. |
| **Strong** | Architecture judgement tied to task and data. Trade-offs explicit. Governance integrated into recommendations. Plain-language explanation throughout. |
| **Exceptional** | Balanced technical depth and operating realism. Anticipates challenge questions. Executive communication is disciplined. Recommendations survive challenge without collapsing. |

### Rubric Application

- Assess each lab on technical accuracy and judgement together. A technically correct but poorly reasoned answer is only competent.
- Reward participants who recommend against a neural approach when simpler methods would suffice. That is strong judgement.
- Look for explicit caveats. Strong work acknowledges what it does not know. Weak work overclaims.
- In the capstone, weight governance and pilot design as heavily as architecture choice.

## Close Standard

End the module by asking each participant to complete this sentence:

> "Before I recommend a neural network in my role, the two questions I will always ask are ..."

Collect responses. Use them to gauge whether the module landed on judgement and governance, not only architecture.

## Mixed-Level Delivery Notes

- **Intro route:** Keep participants focused on concept fluency, simple architectures, and plain-language explanation.
- **Advanced route:** Push deeper on transfer learning choices, tuning discipline, and stronger governance design.
- **Protect the "simpler first" habit.** Do not let stronger participants push the room toward complexity by default.

## Virtual Engagement Checkpoints

- **Day 1:** After Lab 1 (s33), ask each participant to state in chat whether their task really needs a neural network or not, and why.
- **Day 2:** After Lab 2 (s53), require everyone to name one governance signal they would monitor.
- **Day 2 close:** After the capstone (s74), ask each presenter to identify the single biggest risk they still carry into a pilot.
