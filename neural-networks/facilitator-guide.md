# Module 3 | Neural Networks -- Facilitator Guide

## Module Overview

This module covers neural network foundations, convolutional neural networks, transfer learning, and deployment judgement for banking professionals across two days (four hours per day). Participants work through seven activities: network architecture exploration, data preparation, basic model training, CNN concepts, transfer learning application, network tuning, and a capstone recommendation. All labs use AJB banking scenarios and datasets.

**Prerequisites:** Participants should have completed Module 2 (Machine Learning Training) or have equivalent understanding of supervised learning, model evaluation, and governance concepts.

**Materials:** Slide deck (80 slides), participant workbook, Jupyter notebooks (one per day plus solutions), datasets (`training_runs.csv`, `document_classification_labels.csv`), solution guide.

## Delivery Stance

- Keep the module grounded in judgement. Do not let it become a parade of architecture names.
- Explain each technical idea in practical language before adding formal vocabulary.
- Repeatedly ask whether a neural network is actually justified for the task at hand.
- Treat explainability as a first-class requirement, not an afterthought.
- Use participant mistakes as teaching moments. The best learning happens when an architecture choice is challenged.
- Resist enthusiasm bias. Neural networks are powerful, but participants must learn when not to use them.
- Model concise, caveated communication. If you cannot explain it simply, simplify the explanation.

## Day 1 | Neural Network Foundations (4 hours)

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening | 20 min | Module overview, context setting, setup check |
| Session 1 | 40 min | Neural network anatomy, forward pass, loss (slides + discussion) |
| Lab 1 | 35 min | Network Architecture Exploration |
| Break | 15 min | |
| Session 2 | 30 min | Data preparation for neural networks (slides) |
| Lab 2 | 30 min | Data Preparation for Neural Networks |
| Session 3 | 20 min | Training mechanics, curves, failure modes (slides) |
| Lab 3 | 25 min | Basic Model Training |
| Wrap-up | 15 min | Day 1 reflection and preview of Day 2 |

### Key Facilitation Points

- Slow down at activations, loss, backpropagation, and overfitting. These are the concepts participants struggle with most.
- Keep linking training mechanics to what participants would actually observe in practice (training curves, loss values, validation gaps).
- Reward good explanations more than memorised terminology. Ask: "How would you explain this to your operations director?"
- During Lab 1, insist on plain-language explanations before accepting any technical vocabulary.
- During Lab 2, emphasise that poor data preparation is the most common cause of neural network failure, ahead of architecture mistakes.

### Common Participant Challenges

- Confusing the forward pass with backpropagation
- Treating activation functions as interchangeable without understanding their properties
- Skipping data quality checks and jumping straight to model building
- Over-engineering the architecture for Lab 3 (too many layers, too many neurons)
- Misreading training curves: interpreting flat loss as "the model has learned" rather than "the model has stalled"

## Day 2 | CNNs, Transfer Learning, and Deployment Judgement (4 hours)

### Timing

| Block | Duration | Content |
|-------|----------|---------|
| Opening | 15 min | Day 1 recap, Day 2 objectives |
| Session 4 | 35 min | CNN architecture and transfer learning concepts (slides) |
| Lab 4 | 30 min | CNN Concepts for Document Understanding |
| Break | 15 min | |
| Session 5 | 25 min | Fine-tuning strategy and deployment judgement (slides) |
| Lab 5 | 30 min | Transfer Learning Application |
| Lab 6 | 30 min | Network Tuning and Performance |
| Session 6 | 10 min | Capstone framing (slides) |
| Capstone | 40 min | Recommend or Reject the Neural Path |
| Close | 15 min | Capstone presentations, final reflection, close |

### Key Facilitation Points

- Use CNN and transfer learning content to build applied judgement, not only excitement about what neural networks can do.
- Push the room to compare neural approaches with simpler alternatives at every decision point.
- Keep deployment, fallback, and human review visible in every serious recommendation.
- During Lab 5, challenge participants on domain gap. Pre-trained models trained on natural images may not transfer well to banking documents without careful assessment.
- During Lab 6, insist that "the model with lower loss wins" is not a sufficient recommendation. Ask: "What else matters?"

### Common Participant Challenges

- Assuming transfer learning always helps without assessing domain gap
- Treating CNN architectures as black boxes rather than explaining each component's role
- Comparing training runs on loss alone without considering generalisation, calibration, or business requirements
- Writing monitoring checklists that are too vague ("check performance regularly")
- Enthusiasm bias: recommending neural networks because they are interesting, not because they are appropriate

## Assessment Guidance

### Performance Bands

| Band | Indicators |
|------|------------|
| **Competent** | Core artefacts are complete. Network concepts are explained correctly. Training behaviour is read accurately. Recommendations are present but may lack governance depth. |
| **Strong** | Architecture choices are justified with reference to the task. Transfer learning strategy is coherent. Governance and monitoring are present. Stretch artefacts are attempted. Communication is clear. |
| **Exceptional** | Technical and governance judgement are both strong. The participant can explain when not to use a neural network. Recommendations are executive-ready and survive challenge. Integration across labs is visible. |

### Rubric Application

- Assess each lab independently against its rubric, then consider trajectory across both days.
- Weight judgement and communication as heavily as technical accuracy.
- A participant who can train a network but cannot explain when it is inappropriate should not receive "Strong."
- The capstone should integrate Day 1 and Day 2 work. A standalone capstone that ignores earlier labs is missing the point.
- Look specifically for "when not to use neural networks" reasoning. This is the hardest judgement skill in the module.

## Close Standard

End the module by asking each participant to complete this sentence:

> "The strongest reason to use, or not use, a neural network in my context would be..."

Collect responses. Use them to gauge whether the module built genuine judgement about when neural networks are appropriate and when they are not.

## Mixed-Level Delivery Overlay
- Intro route: prioritise concept fluency, worked examples, and interpretation before any advanced tuning discussion.
- Advanced route: use confident participants for transfer-learning and tuning stretch work once the core model flow is secure.
- Keep jargon under control. Every technical point should land in business language before you move on.

## Virtual Engagement Checkpoints
- Day 1: pause after the first neural-network concept block and ask participants to map one idea back to a banking use case.
- Day 2: review one model result together and ask what the trade-off is between added complexity and business value.
- Close each day with one plain-language explanation round rather than another silent notebook block.
