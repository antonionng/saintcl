# Module 3 | Neural Networks -- Participant Workbook

## Programme Context

This workbook supports Module 3 of the AJB AI and Data Training Programme. The module runs across two days (four hours per day) and focuses on neural network foundations, convolutional neural networks, transfer learning, and deployment judgement in an enterprise banking context.

## Start Here

- Why this module matters: neural networks add power when patterns are complex, but they also increase operating, explainability, and governance demands. This module teaches judgement, not only terminology.
- Your journey in this module: build intuition first, understand training mechanics, diagnose failure modes, then move into CNNs, transfer learning, and deployment choices.
- What you will produce: architecture explanations, diagnosis notes, model comparison thinking, and a balanced recommendation on when a neural approach is justified.
- How validation works: every lab asks you to explain technical choices in plain language, surface likely failure points, and connect technical power to business control.

## How to Use This Workbook

- Focus on architecture judgement, not only terminology.
- Explain each concept in plain language before reaching for technical phrasing.
- Treat governance and operating control as part of the technical answer, not a separate topic.
- Prefer an appropriate neural approach over the deepest possible one.
- Write as if your recommendation may be challenged by a risk, audit, or operations audience.
- Complete all required artefacts before attempting stretch artefacts.
- Use the reflection questions at the end of each lab to consolidate your learning.
- Time allocations are a guide. Your facilitator may adjust pacing based on the room.

## Performance Bands

| Band | Description |
|------|-------------|
| **Competent** | Concepts are correct and applied sensibly. Core artefacts are complete. Explanations are understandable. |
| **Strong** | Architecture choices are justified, risks are surfaced, and communication is clear. Stretch artefacts are attempted. |
| **Exceptional** | Technical and governance judgement are both strong, with concise executive-ready reasoning. Work would survive challenge from a risk or audit audience. |

---

## Day 1 | Neural Network Foundations

### Setup Checklist

- [ ] Jupyter environment running and tested
- [ ] `training_runs.csv` loaded and readable
- [ ] Confirm pandas, numpy, and matplotlib imports work
- [ ] Workbook open alongside the notebook
- [ ] Review Module 2 key concepts (metrics, evaluation, governance) as reference

### Mission Outcome

By the end of Day 1 you should be able to explain how a neural network learns, describe the role of activations and loss, prepare data for neural network training, diagnose common training failure modes, and train a basic model.

---

### Lab 1 | Network Architecture Exploration

**Scenario:**
You are asked to explain a proposed neural network for a banking prediction task to a mixed technical and business audience. Before building anything, you need to demonstrate that you understand what each component does and why it is there.

**Objective:**
- explain the anatomy of a basic neural network clearly and defensibly

**Required artefacts:**
- one architecture sketch showing inputs, hidden layers, and output
- one plain-language explanation of each major component (weights, bias, activation, loss)
- one written description of the forward pass in non-technical language

**Stretch artefacts:**
- one critique of the proposed architecture (what could be simplified or is likely to fail)
- one note on what could go wrong during training
- one comparison of two activation function choices with trade-offs

**Core tasks:**
1. Sketch a network architecture with labelled inputs, hidden layers, and output layer
2. Explain what weights and biases represent in practical terms
3. Explain the role of the activation function and why it matters
4. Explain what the loss function measures and why it is needed
5. Describe backpropagation in practical terms (what it does, not the calculus)
6. Explain what a learning rate controls and what happens if it is too high or too low
7. Identify one reason why a network might fail to learn

**Stretch tasks:**
1. Compare two activation functions (e.g. ReLU vs sigmoid) and explain when each is appropriate
2. Identify one overfitting risk in the proposed architecture
3. Suggest one regularisation technique and explain what it does in plain language
4. Explain what batch size affects and why it matters

**Rubric:**
- Concept clarity: explanations are correct, complete, and understandable to a non-specialist
- Structural understanding: the parts of the network are connected logically in the sketch
- Judgement: likely failure points are identified realistically, not generically
- Communication: the forward pass explanation would make sense to an operations lead

**Reflection:**
- Which concept was hardest to explain in plain language?
- Which part of the architecture feels most likely to be misunderstood by stakeholders?
- Why is it important to explain neural networks before building them?

---

### Lab 2 | Data Preparation for Neural Networks

**Scenario:**
Your team has been given a dataset of historical banking transactions and training run metadata to use for a neural network exercise. Before any model is built, the data needs to be inspected, cleaned, and prepared in a way that suits neural network training.

**Objective:**
- prepare a banking dataset for neural network training with appropriate transformations and validation

**Required artefacts:**
- data quality report (missing values, outliers, class distribution)
- feature preparation plan with scaling and encoding decisions
- train/validation/test split with rationale

**Stretch artefacts:**
- class imbalance handling strategy
- one note on how data preparation choices could introduce bias
- feature importance ranking using correlation or variance analysis

**Core tasks:**
1. Inspect the dataset for missing values, outliers, and data types
2. Identify which features are numeric and which are categorical
3. Apply appropriate scaling to numeric features (explain why neural networks need scaling)
4. Apply appropriate encoding to categorical features
5. Split data into train, validation, and test sets with a stated rationale
6. Check and report class distribution across all splits

**Stretch tasks:**
1. Propose a strategy for handling class imbalance (oversampling, undersampling, or class weights)
2. Identify one way that data preparation choices could introduce or amplify bias
3. Rank features by likely importance and justify whether any should be dropped
4. Explain what would happen if you trained a neural network on unscaled data

**Rubric:**
- Thoroughness: all major data quality issues are identified and addressed
- Preparation logic: scaling and encoding choices are correct and justified for neural networks
- Split discipline: train/validation/test split is appropriate and class distribution is checked
- Risk awareness: potential bias from preparation choices is considered

**Reflection:**
- Why is data preparation more critical for neural networks than for tree-based models?
- What data quality issue would be most dangerous to miss?
- How would you validate that your preparation pipeline is correct?

---

### Lab 3 | Basic Model Training

**Scenario:**
Using the prepared data from Lab 2, you now need to train a basic neural network, observe its training behaviour, and diagnose whether it is learning effectively.

**Objective:**
- train a basic neural network, monitor its training curves, and diagnose common problems

**Required artefacts:**
- trained model with reported training and validation metrics per epoch
- training curve plot (loss and/or accuracy over epochs)
- written diagnosis of training behaviour (is the model learning? overfitting? underfitting?)

**Stretch artefacts:**
- comparison of two hyperparameter configurations (e.g. different learning rates or layer sizes)
- one early stopping recommendation with justification
- one written recommendation on whether the model is ready for further tuning

**Core tasks:**
1. Define a simple neural network architecture (input layer, one or two hidden layers, output)
2. Select an appropriate loss function and optimiser
3. Train the model and record loss and accuracy for each epoch
4. Plot training and validation curves
5. Diagnose whether the model is overfitting, underfitting, or learning well
6. Explain what you would change in the next training run

**Stretch tasks:**
1. Train a second configuration with a different learning rate or architecture
2. Compare the two configurations and explain which is better and why
3. Recommend an early stopping point based on validation performance
4. Write a short assessment of whether the model is ready for a banking pilot

**Rubric:**
- Technical execution: model trains without errors, metrics are recorded correctly
- Curve reading: training behaviour is interpreted accurately (not just described)
- Diagnosis quality: the participant can explain what is happening and what to do next
- Banking context: the assessment considers whether performance is sufficient for the intended use case

**Reflection:**
- What is the most informative signal in a training curve?
- How would you explain overfitting to a non-technical stakeholder?
- At what point would you stop tuning and conclude the architecture is not suitable?

---

## Day 2 | CNNs, Transfer Learning, and Deployment Judgement

### Setup Checklist

- [ ] Day 1 work saved and accessible
- [ ] `document_classification_labels.csv` loaded and readable
- [ ] `training_runs.csv` still accessible for comparison work
- [ ] Review Day 1 reflection notes before starting
- [ ] Confirm you can display images and plots in the notebook

### Mission Outcome

By the end of Day 2 you should be able to assess whether a neural architecture is justified for a banking use case, apply CNN and transfer learning concepts to a document task, tune a network systematically, and explain your recommendation with governance controls.

---

### Lab 4 | CNN Concepts for Document Understanding

**Scenario:**
AJB is exploring whether a convolutional neural network could improve automated classification of banking documents (e.g. loan applications, identity documents, correspondence). You need to explain how a CNN works and whether it is appropriate for this task.

**Objective:**
- map CNN building blocks to a realistic banking document classification task

**Required artefacts:**
- one architecture note explaining convolution, pooling, and feature maps in practical language
- one transfer learning recommendation (train from scratch vs use a pre-trained model)
- one risk note on data quality or drift specific to document images

**Stretch artefacts:**
- one alternative simpler approach (e.g. metadata-based classification without images)
- one escalation rule for uncertain predictions
- one explainability note (how would you explain the model's decision to a compliance officer?)

**Core tasks:**
1. Explain what convolution does and why it is useful for image-like data
2. Explain pooling and feature maps in practical, non-mathematical language
3. Describe the overall CNN architecture for a document classification task
4. Justify whether transfer learning should be used for this task
5. Identify the most important data preparation issue for document images
6. Explain one specific risk of deploying a CNN on banking documents

**Stretch tasks:**
1. Compare training from scratch versus transfer learning on effort, data needs, and performance
2. Define one fallback workflow for documents the model cannot classify confidently
3. Explain one explainability challenge specific to CNNs
4. Propose how you would handle a new document type that was not in the training data

**Rubric:**
- Use-case fit: the architecture matches the task structure and data type
- Practicality: transfer learning and data preparation choices are realistic for a bank
- Control logic: risk, fallback, and escalation thinking are present
- Communication: explanations would make sense to a mixed technical and business audience

**Reflection:**
- Why might transfer learning be the better organisational choice even if training from scratch is technically possible?
- What data issue would worry you most before deploying a CNN on banking documents?
- When is a CNN not the right answer for a document task?

---

### Lab 5 | Transfer Learning Application

**Scenario:**
The AJB team has decided to pursue transfer learning for the document classification task. You need to design the transfer learning approach, explain the fine-tuning strategy, and assess whether the pre-trained model's knowledge is relevant to banking documents.

**Objective:**
- design and justify a transfer learning strategy for a banking document classification task

**Required artefacts:**
- transfer learning strategy document (which pre-trained model, which layers to freeze, which to fine-tune)
- data requirements note (how much labelled banking data is needed and how to obtain it)
- one assessment of domain gap (how different are banking documents from the pre-trained model's training data?)

**Stretch artefacts:**
- fine-tuning schedule (which layers to unfreeze at which stage)
- one comparison of two pre-trained model candidates
- one note on how to validate that transfer learning actually helps versus training from scratch

**Core tasks:**
1. Select a pre-trained model and justify why it is a reasonable starting point
2. Explain which layers you would freeze and which you would fine-tune
3. Estimate how much labelled banking data is needed for effective fine-tuning
4. Assess the domain gap between the pre-trained model's training data and AJB documents
5. Define the evaluation metrics for the fine-tuned model
6. Identify one risk specific to transfer learning (e.g. negative transfer)

**Stretch tasks:**
1. Propose a staged fine-tuning schedule (freeze all, then unfreeze top layers, then deeper layers)
2. Compare two pre-trained model candidates on relevance, size, and licensing
3. Design an experiment to validate that transfer learning outperforms training from scratch
4. Explain how you would detect negative transfer

**Rubric:**
- Strategy coherence: the transfer learning approach is logical and well-justified
- Data realism: data requirements are realistic for a bank, not aspirational
- Domain awareness: the domain gap assessment is specific, not generic
- Risk identification: transfer learning risks are identified and addressed

**Reflection:**
- What is the biggest assumption in your transfer learning strategy?
- How would you know if transfer learning is not working?
- What organisational factors (beyond technical performance) should influence the choice of pre-trained model?

---

### Lab 6 | Network Tuning and Performance

**Scenario:**
Two neural network training runs have been completed for the document classification task. You need to compare their behaviour, recommend the better path, and assess whether the model is ready for a pilot.

**Objective:**
- compare two neural network runs and recommend the better path with governance controls

**Required artefacts:**
- model comparison note with training and validation metrics from both runs
- one recommendation with explicit caveats
- one monitoring checklist for post-deployment

**Stretch artefacts:**
- one pilot proposal with scope, duration, and success criteria
- one rollback trigger definition
- one note on when to retrain versus when to reject the neural approach

**Core tasks:**
1. Compare training and validation loss curves from both runs
2. Identify which run generalises better and explain the evidence
3. Assess whether either run shows signs of overfitting or underfitting
4. Explain what the next tuning move should be (or whether tuning should stop)
5. State whether the model is strong enough for a pilot with supporting evidence
6. Define three monitoring metrics for post-deployment

**Stretch tasks:**
1. Define one specific rollback trigger (e.g. "rollback if weekly accuracy drops below 0.80")
2. Identify one reason not to scale the model immediately after a successful pilot
3. Propose retraining criteria (when and how the model should be updated)
4. Compare the neural approach with the simpler baseline from Module 2

**Rubric:**
- Reading of evidence: training behaviour is interpreted correctly and specifically
- Recommendation quality: next steps are sensible, constrained, and not overconfident
- Operational realism: monitoring, rollback, and pilot logic are credible
- Governance integration: the recommendation considers explainability and audit requirements

**Reflection:**
- What evidence would make you reject the neural approach entirely?
- Which missing control would be most dangerous in production?
- How do you balance the performance gain from a neural network against the governance burden?

---

## Capstone | Recommend or Reject the Neural Path

**Scenario:**
AJB leadership wants a clear recommendation on whether neural networks should be adopted for the document classification use case. Your recommendation must integrate your understanding of network fundamentals, CNN architecture, transfer learning, and governance requirements from both days.

**Objective:**
- decide whether a neural network is justified for a banking use case and explain the decision clearly to a leadership audience

**Required artefacts:**
- executive recommendation (one to two pages)
- architecture or rejection rationale with alternatives considered
- governance and monitoring section with ownership assignments
- risk summary with mitigations

**Stretch artefacts:**
- phased pilot design with stage gates and decision points
- explicit human review and fallback model definition
- one concise leadership-facing summary visual

**Core tasks:**
1. Describe the business problem and the representation challenge that motivates a neural approach
2. State whether a neural approach is justified, with explicit reasoning
3. If justified, explain the architecture family at a high level (what type of network and why)
4. If not justified, explain what alternative you recommend and why
5. Define evaluation criteria and deployment conditions
6. Explain the governance burden honestly (explainability, monitoring, retraining, audit)
7. Summarise the risk profile and proposed mitigations

**Stretch tasks:**
1. Compare the neural path with a simpler baseline and explain when each is appropriate
2. Define escalation rules for uncertain cases (when does a human review the model's decision?)
3. Prepare one concise leadership-facing visual that summarises the recommendation
4. Write a one-paragraph summary suitable for a risk committee briefing

**Rubric:**
- Decision quality: recommendation is neither overly cautious nor overly enthusiastic; it matches the evidence
- Defensibility: assumptions, risks, and constraints are explicit throughout
- Communication: the result would support a serious leadership discussion and survive challenge
- Integration: the recommendation draws on work from both days, not just the capstone

**Reflection:**
- What is your strongest argument for the recommendation?
- What is the most credible challenge to your recommendation?
- How has your understanding of when to use neural networks changed across the two days?
- What would you need to learn next to be more confident in this recommendation?

## Delivery Routes

### Intro Route
- Focus first on concept fluency, use-case mapping, and clear interpretation of results.
- Treat the notebook as a worked example you can explain, not a race to tune the most settings.
- Use the stretch path only after the core concept and interpretation tasks are complete.

### Advanced Route
- Move into tuning, transfer learning, and deeper comparison work after you complete the guided core path.
- Keep your advanced work tied to a clear banking justification for why the added complexity matters.
- Use debrief time to explain trade-offs in plain language for the wider cohort.

## Virtual Pacing Reminders
- Expect slower concept blocks on Day 1 before the module accelerates into implementation.
- Pause after the first model output and check that you can explain what happened without jargon.
- If the room is behind, protect concept clarity and interpretation before cutting stretch experiments.
