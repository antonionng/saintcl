# Module 3 | Neural Networks -- Solution Guide

## Purpose

This guide provides strong answer shapes for each lab in Module 3. It is not a single correct answer key. Use it to calibrate assessment, identify common failure modes, and guide participants who are stuck. All solutions reference AJB banking scenarios and the provided datasets.

---

## Lab 1 | Network Architecture Exploration

### Strong Answer Shape
A strong architecture sketch will show a clear input layer (sized to match the feature count), one or two hidden layers with stated neuron counts, and an output layer matched to the task (single sigmoid for binary classification, softmax for multi-class). The forward pass explanation should describe data flowing through weights and activations in practical terms: "Each neuron takes a weighted sum of its inputs, adds a bias, and passes the result through an activation function that decides how strongly to fire." Backpropagation should be explained as: "The network measures how wrong it was, then works backward through the layers to adjust weights so the next prediction is closer to the truth." Learning rate should be described as the size of each adjustment step.

### Common Failure Modes
- Architecture sketch is unlabelled or missing the output layer
- Forward pass explanation uses formulas without practical interpretation
- Backpropagation is described as "gradient descent" without explaining what that means in practice
- No failure modes identified, or only overfitting mentioned without explaining why it occurs

### Rubric Application
- Competent: sketch is present, components are named correctly, forward pass is described
- Strong: explanations are in plain language, failure modes are realistic, activation choices are justified
- Exceptional: the participant can explain each concept to a non-technical audience and identify specific training risks

---

## Lab 2 | Data Preparation for Neural Networks

### Strong Answer Shape
The data quality report should identify missing values with counts and proposed handling (imputation or removal with justification). Scaling should use StandardScaler or MinMaxScaler with an explanation of why neural networks need scaled inputs (gradient-based optimisation is sensitive to feature magnitudes). Categorical encoding should use one-hot or label encoding with justification. The train/validation/test split should be stated with rationale (e.g. 60/20/20 or 70/15/15), and class distribution should be reported across all three splits.

### Common Failure Modes
- Missing value handling is not documented or defaults are used without explanation
- Scaling is applied after the split (leaking validation/test statistics into training)
- No validation set is created (only train and test)
- Class distribution is not checked, leading to undetected imbalance
- The participant cannot explain why neural networks need scaling but tree-based models do not

### Rubric Application
- Competent: data is cleaned, scaled, and split correctly
- Strong: preparation choices are justified for neural networks specifically, class distribution is checked, bias risks are noted
- Exceptional: scaling is applied correctly within cross-validation or split boundaries, imbalance handling is proposed, feature importance is assessed

---

## Lab 3 | Basic Model Training

### Strong Answer Shape
The architecture should be simple: input layer matching feature count, one hidden layer with 32-128 neurons and ReLU activation, output layer with appropriate activation (sigmoid for binary). Loss function should match the task (binary cross-entropy for binary classification). Training curves should show loss and/or accuracy for both training and validation sets. Diagnosis should be specific: "Validation loss begins to increase after epoch 15 while training loss continues to decrease, indicating overfitting" rather than "the model might be overfitting."

### Common Failure Modes
- Architecture is too complex for the data (five hidden layers for a simple classification task)
- Loss function does not match the task (using MSE for classification)
- Training curves are plotted but not interpreted
- Diagnosis is vague ("it looks like it might be overfitting") without pointing to specific evidence
- No recommendation for what to change in the next run

### Rubric Application
- Competent: model trains, metrics are recorded, curves are plotted
- Strong: training behaviour is diagnosed accurately with specific evidence, next steps are proposed
- Exceptional: two configurations are compared, early stopping is justified, pilot readiness assessment considers banking requirements

---

## Lab 4 | CNN Concepts for Document Understanding

### Strong Answer Shape
Convolution should be explained practically: "A small filter slides across the image, detecting local patterns like edges, corners, or textures. Early layers detect simple patterns; deeper layers combine them into higher-level features like text regions or logos." Pooling should be explained as reducing spatial dimensions while keeping the most important information. Transfer learning recommendation should assess the domain gap: pre-trained models (e.g. trained on ImageNet) know general visual features, but banking documents have specific characteristics (structured layouts, text-heavy, standardised formats) that may require fine-tuning. The data quality risk note should address issues specific to document images: scan quality variation, rotation, partial occlusion, and label accuracy.

### Common Failure Modes
- Convolution is described only in mathematical terms without practical interpretation
- Transfer learning is recommended unconditionally without assessing domain gap
- Data quality risks are generic ("data might be noisy") rather than specific to document images
- No fallback workflow for uncertain predictions
- Explainability challenges of CNNs are not acknowledged

### Rubric Application
- Competent: CNN components are explained correctly, transfer learning is discussed
- Strong: explanations are practical, domain gap is assessed, data quality risks are specific to the use case
- Exceptional: a simpler alternative is proposed, explainability challenges are addressed, fallback workflows are defined

---

## Lab 5 | Transfer Learning Application

### Strong Answer Shape
The strategy document should name a specific pre-trained model (e.g. ResNet-50, EfficientNet) with justification. Layer freezing strategy should explain that early layers capture general visual features (keep frozen) while later layers capture task-specific features (fine-tune). Data requirements should be realistic for a bank: hundreds to low thousands of labelled examples for fine-tuning, not millions. Domain gap assessment should be specific: "ImageNet models are trained on natural photographs; banking documents are structured, text-heavy, and have consistent layouts, so the domain gap is moderate and focused on higher-level features."

### Common Failure Modes
- No specific pre-trained model named, or model chosen without justification
- All layers are frozen or all layers are unfrozen, with no staged strategy
- Data requirements are unrealistic ("we need 100,000 labelled documents")
- Domain gap is not assessed, or assessment is generic
- Negative transfer risk is not mentioned

### Rubric Application
- Competent: a transfer learning strategy exists with a named model and basic freezing plan
- Strong: domain gap is assessed specifically, data requirements are realistic, negative transfer is discussed
- Exceptional: staged fine-tuning is proposed, validation experiment is designed, two model candidates are compared

---

## Lab 6 | Network Tuning and Performance

### Strong Answer Shape
Comparison should reference specific evidence from training curves: "Run A reaches validation loss of 0.34 at epoch 20 and then plateaus; Run B reaches 0.31 at epoch 25 but shows increasing gap between training and validation loss, suggesting early overfitting." The recommendation should be constrained: "Run A generalises better despite slightly higher loss, and its more stable validation curve suggests more reliable production performance." Monitoring metrics should be specific: accuracy on a held-out set refreshed weekly, confidence distribution shift, and input feature drift detection.

### Common Failure Modes
- Comparison is based on final loss values alone without examining curve shape
- Overfitting in one run is not identified despite clear evidence in the curves
- Recommendation lacks caveats or conditions
- Monitoring checklist is generic ("monitor performance") without specific metrics or frequencies
- No rollback trigger is defined

### Rubric Application
- Competent: both runs are compared with basic metrics, a recommendation is made
- Strong: curve behaviour is interpreted correctly, recommendation includes caveats, monitoring is specific
- Exceptional: rollback triggers are defined, the neural approach is compared with simpler alternatives, retraining criteria are proposed

---

## Capstone | Recommend or Reject the Neural Path

### Strong Answer Shape
The executive recommendation should be one to two pages and make a clear decision: adopt the neural approach for a pilot, defer pending further evidence, or reject in favour of a simpler alternative. The rationale should reference earlier lab work: architecture understanding from Lab 1, data preparation discipline from Lab 2, training evidence from Lab 3, CNN applicability from Lab 4, transfer learning strategy from Lab 5, and tuning evidence from Lab 6. Governance section should honestly state the explainability burden (CNNs are harder to explain to regulators than tree-based models) and propose specific controls.

### Common Failure Modes
- Recommendation is enthusiastic but not evidence-based
- The capstone ignores earlier lab work and reads as a standalone opinion
- Governance is mentioned but not addressed with specific controls
- Risk section is generic ("neural networks are risky") rather than specific to the use case
- No clear next step, or next step has no conditions or success criteria

### Rubric Application
- Competent: recommendation is present with rationale; governance is mentioned
- Strong: recommendation integrates evidence from earlier labs; risks are specific; governance controls are proposed; communication is clear
- Exceptional: the recommendation would survive executive challenge; the participant articulates when neural networks are not appropriate; assumptions are explicit; a simpler alternative is acknowledged
