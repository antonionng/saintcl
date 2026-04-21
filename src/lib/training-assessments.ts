import { ajbTrainingProgramme } from "./training";

export type AssessmentKind = "activity" | "homework" | "quiz" | "module_test";

export type AssessmentQuestionType =
  | "multiple_choice"
  | "multi_select"
  | "short_answer"
  | "long_answer"
  | "code"
  | "notebook_task"
  | "file_upload";

export type AssessmentQuestionOption = {
  id: string;
  label: string;
};

export type AssessmentValidator =
  | {
      kind: "exact_match";
      caseSensitive?: boolean;
      trim?: boolean;
    }
  | {
      kind: "contains";
      tokens: string[];
      requireAll?: boolean;
      caseSensitive?: boolean;
    }
  | {
      kind: "regex";
      pattern: string;
      flags?: string;
    }
  | {
      kind: "numeric";
      min?: number;
      max?: number;
      tolerance?: number;
    }
  | {
      kind: "python_check";
      taskCheckId: string;
    }
  | {
      kind: "facilitator_review";
      rubricKey?: string;
    };

export type AssessmentQuestionBlueprint = {
  slug: string;
  prompt: string;
  questionType: AssessmentQuestionType;
  points?: number;
  options?: AssessmentQuestionOption[];
  correctAnswer?: string | string[] | number | null;
  rubric?: Array<{ criterion: string; weight: number; descriptor: string }>;
  validators?: AssessmentValidator[];
  facilitatorNotes?: string;
};

export type AssessmentBlueprint = {
  slug: string;
  title: string;
  kind: AssessmentKind;
  description: string;
  estimatedMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isRequired?: boolean;
  blocksModuleCompletion?: boolean;
  facilitatorReviewRequired?: boolean;
  questions: AssessmentQuestionBlueprint[];
};

export type ModuleAssessmentBlueprint = {
  moduleSlug: string;
  assessments: AssessmentBlueprint[];
};

const PASS_DEFAULT = 70;
const TEST_PASS_DEFAULT = 75;

const moduleSlugs = ajbTrainingProgramme.modules.map((module) => module.slug);

function assertModuleSlug(slug: string) {
  if (!moduleSlugs.includes(slug)) {
    throw new Error(`Unknown module slug in assessment blueprint: ${slug}`);
  }
}

const pythonForData: ModuleAssessmentBlueprint = {
  moduleSlug: "python-for-data",
  assessments: [
    {
      slug: "warmup-banking-context",
      title: "Banking analytics warm-up",
      kind: "activity",
      description: "Quick recap to anchor Python for retail banking analytics before the first lab.",
      estimatedMinutes: 10,
      questions: [
        {
          slug: "primary-data-source",
          prompt:
            "Which Python library is the primary tool for cleaning and reshaping tabular banking data in this module?",
          questionType: "multiple_choice",
          options: [
            { id: "pandas", label: "pandas" },
            { id: "matplotlib", label: "matplotlib" },
            { id: "scikit-learn", label: "scikit-learn" },
            { id: "pyspark", label: "pyspark" },
          ],
          correctAnswer: "pandas",
        },
        {
          slug: "duplicate-handling",
          prompt:
            "When triaging the transaction extract you find duplicate `txn_id` rows. In a single sentence, describe the safest first action before deciding to drop them.",
          questionType: "short_answer",
          validators: [
            {
              kind: "contains",
              tokens: ["duplicate", "review"],
              requireAll: false,
            },
            {
              kind: "facilitator_review",
              rubricKey: "judgement",
            },
          ],
          rubric: [
            { criterion: "Identifies the need to investigate before deletion", weight: 0.6, descriptor: "Calls out review or root-cause" },
            { criterion: "References transaction integrity", weight: 0.4, descriptor: "Mentions financial or audit risk" },
          ],
        },
      ],
    },
    {
      slug: "homework-day1-handoff",
      title: "Day 1 handoff homework",
      kind: "homework",
      description:
        "Submit the cleaned transaction extract and a short triage memo before the next session.",
      estimatedMinutes: 60,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "triage-memo",
          prompt:
            "Write a one-paragraph memo (4-6 sentences) summarising the data quality findings from the Day 1 transactions extract.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Coverage of duplicates, nulls, range", weight: 0.5, descriptor: "Mentions all three categories" },
            { criterion: "Business-readable framing", weight: 0.3, descriptor: "Avoids raw column names where possible" },
            { criterion: "Clear next action", weight: 0.2, descriptor: "Names the recommended remediation" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "triage-export",
          prompt: "Upload your `triage_summary.csv` artefact from the Day 1 output folder.",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-pandas-fundamentals",
      title: "Pandas fundamentals quiz",
      kind: "quiz",
      description: "Auto-graded knowledge check on pandas essentials covered in Day 1 and Day 2.",
      estimatedMinutes: 15,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "select-columns",
          prompt:
            "Which pandas expressions return a DataFrame containing only the `branch_id` and `total_fee_sar` columns from `branch_kpi`? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "double-bracket", label: "branch_kpi[['branch_id', 'total_fee_sar']]" },
            { id: "loc-cols", label: "branch_kpi.loc[:, ['branch_id', 'total_fee_sar']]" },
            { id: "dot-attr", label: "branch_kpi.branch_id.total_fee_sar" },
            { id: "iloc-named", label: "branch_kpi.iloc[:, ['branch_id', 'total_fee_sar']]" },
          ],
          correctAnswer: ["double-bracket", "loc-cols"],
        },
        {
          slug: "groupby-aggregation",
          prompt: "Complete the snippet so it returns the total `amount_sar` per `region` from `txns`.",
          questionType: "code",
          validators: [
            {
              kind: "regex",
              pattern: "txns\\s*\\.\\s*groupby\\s*\\(\\s*['\\\"]region['\\\"]\\s*\\)\\s*\\.\\s*[\\w\\[\\]'\\\",\\s]*amount_sar[\\w\\[\\]'\\\",\\s]*\\.\\s*sum\\s*\\(\\s*\\)",
              flags: "i",
            },
          ],
          facilitatorNotes:
            "Accept any equivalent groupby + sum pattern that targets amount_sar; facilitator can override if a participant uses agg().",
        },
        {
          slug: "missing-data-strategy",
          prompt: "What is a safer default than `dropna()` when missing values may carry meaning in banking analytics?",
          questionType: "short_answer",
          validators: [
            {
              kind: "contains",
              tokens: ["fillna", "impute", "flag", "indicator"],
              requireAll: false,
              caseSensitive: false,
            },
          ],
        },
      ],
    },
    {
      slug: "module-test-python-for-data",
      title: "Module test: Python for Data",
      kind: "module_test",
      description: "End-of-module test combining auto-graded conceptual questions and a practical notebook task.",
      estimatedMinutes: 45,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-mc-merge",
          prompt:
            "You need to attach customer segments to every transaction row, keeping all transactions even if a customer record is missing. Which join strategy fits?",
          questionType: "multiple_choice",
          options: [
            { id: "inner", label: "Inner join on customer_id" },
            { id: "left", label: "Left join with txns on the left" },
            { id: "right", label: "Right join with txns on the right" },
            { id: "outer", label: "Outer join discarding unmatched customers" },
          ],
          correctAnswer: "left",
          points: 2,
        },
        {
          slug: "test-mc-evaluation",
          prompt: "Which output is most useful when handing the cleaned data to a downstream modelling team?",
          questionType: "multiple_choice",
          options: [
            { id: "raw-csv", label: "The raw extract with no documentation" },
            { id: "features-and-readme", label: "A features.csv with a README of column definitions and quality caveats" },
            { id: "screenshots", label: "A folder of chart screenshots" },
            { id: "notebook-only", label: "The notebook file only, with outputs hidden" },
          ],
          correctAnswer: "features-and-readme",
          points: 2,
        },
        {
          slug: "test-code-summary",
          prompt:
            "Write a short pandas snippet that produces a one-row summary with the count of transactions and the sum of `amount_sar` for the previous month using a `txn_date` column.",
          questionType: "code",
          points: 4,
          validators: [
            {
              kind: "regex",
              pattern: "amount_sar.*sum|sum.*amount_sar",
              flags: "is",
            },
            {
              kind: "facilitator_review",
              rubricKey: "code-quality",
            },
          ],
        },
        {
          slug: "test-notebook-handoff",
          prompt:
            "Run your Day 3 notebook checkpoint to produce `pack_charts.png`, `exceptions.csv`, and `features.csv` in the output folder.",
          questionType: "notebook_task",
          points: 4,
          validators: [
            { kind: "python_check", taskCheckId: "report-chart-pack" },
            { kind: "python_check", taskCheckId: "report-exception-log" },
            { kind: "python_check", taskCheckId: "report-handoff-features" },
          ],
        },
        {
          slug: "test-leadership-takeaway",
          prompt:
            "In 3-5 sentences, explain the leadership takeaway from your Day 3 reporting pack. Include the insight, the supporting evidence, and one caveat.",
          questionType: "long_answer",
          points: 3,
          rubric: [
            { criterion: "Insight is decision-ready", weight: 0.4, descriptor: "Stakes a clear position" },
            { criterion: "Evidence is concrete", weight: 0.3, descriptor: "References specific outputs" },
            { criterion: "Caveat is honest", weight: 0.3, descriptor: "Names a real limitation" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const machineLearning: ModuleAssessmentBlueprint = {
  moduleSlug: "machine-learning-training",
  assessments: [
    {
      slug: "warmup-ml-vocabulary",
      title: "ML vocabulary warm-up",
      kind: "activity",
      description: "Quick check on supervised vs unsupervised framing before the segmentation lab.",
      estimatedMinutes: 10,
      questions: [
        {
          slug: "supervised-or-not",
          prompt: "Which task is supervised learning?",
          questionType: "multiple_choice",
          options: [
            { id: "cluster", label: "Clustering customers by transaction behaviour" },
            { id: "predict-default", label: "Predicting whether a loan will default within 12 months" },
            { id: "topic-model", label: "Discovering themes in unlabeled call transcripts" },
            { id: "anomaly-cluster", label: "Grouping transactions to find unusual patterns" },
          ],
          correctAnswer: "predict-default",
        },
        {
          slug: "leakage-spotting",
          prompt:
            "List one feature that would cause data leakage if used to predict whether a loan defaults in the next 12 months.",
          questionType: "short_answer",
          validators: [
            {
              kind: "contains",
              tokens: ["default", "post", "after", "future"],
              requireAll: false,
            },
            { kind: "facilitator_review" },
          ],
        },
      ],
    },
    {
      slug: "homework-segmentation-writeup",
      title: "Segmentation writeup",
      kind: "homework",
      description: "Submit your segmentation lab notebook and a short business interpretation.",
      estimatedMinutes: 75,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "segmentation-notebook",
          prompt: "Upload your completed segmentation lab notebook (.ipynb).",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "segment-naming",
          prompt:
            "Give each of your top three segments a business-readable name and a one-sentence rationale based on observed features.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Names are stakeholder-friendly", weight: 0.4, descriptor: "Avoids cluster_0 style labels" },
            { criterion: "Rationales reference real features", weight: 0.6, descriptor: "Cites observed differences" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-evaluation-metrics",
      title: "Evaluation metrics quiz",
      kind: "quiz",
      description: "Auto-graded check on supervised metrics, governance, and bias.",
      estimatedMinutes: 12,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "credit-classifier-metric",
          prompt:
            "You are evaluating a credit-default classifier on a heavily imbalanced dataset (3% defaulters). Which metric pair is most informative?",
          questionType: "multiple_choice",
          options: [
            { id: "accuracy-rmse", label: "Accuracy and RMSE" },
            { id: "precision-recall", label: "Precision and recall (or PR-AUC)" },
            { id: "auc-only", label: "ROC-AUC alone" },
            { id: "rsquared", label: "R-squared" },
          ],
          correctAnswer: "precision-recall",
        },
        {
          slug: "fairness-checks",
          prompt: "Which steps belong in a fairness review for a credit model? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "subgroup-metrics", label: "Compute metrics per protected subgroup" },
            { id: "drop-protected", label: "Drop the protected attribute and assume fairness" },
            { id: "audit-drift", label: "Monitor performance drift across subgroups over time" },
            { id: "explain-decisions", label: "Provide explanations for individual adverse decisions" },
          ],
          correctAnswer: ["subgroup-metrics", "audit-drift", "explain-decisions"],
        },
        {
          slug: "model-governance",
          prompt:
            "In one sentence, name a control you would add to a production credit-scoring pipeline to make it auditable.",
          questionType: "short_answer",
          validators: [
            {
              kind: "contains",
              tokens: ["log", "audit", "version", "approval", "monitor"],
              requireAll: false,
            },
          ],
        },
      ],
    },
    {
      slug: "module-test-machine-learning",
      title: "Module test: Machine Learning",
      kind: "module_test",
      description: "End-of-module test for the ML training module.",
      estimatedMinutes: 50,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-baseline-metric",
          prompt: "Which baseline should you compare a fraud classifier against before declaring success?",
          questionType: "multiple_choice",
          options: [
            { id: "majority", label: "A majority-class predictor (always 'not fraud')" },
            { id: "random", label: "A uniformly random predictor" },
            { id: "perfect", label: "A perfect classifier on the training set" },
            { id: "linear", label: "A linear regression on the labels" },
          ],
          correctAnswer: "majority",
          points: 2,
        },
        {
          slug: "test-cross-validation",
          prompt: "When is stratified k-fold preferable to plain k-fold? Select all that apply.",
          questionType: "multi_select",
          points: 2,
          options: [
            { id: "imbalanced", label: "When the target class is highly imbalanced" },
            { id: "small", label: "When the dataset is small relative to the number of folds" },
            { id: "time-series", label: "When the data is a time series" },
            { id: "regression", label: "When predicting a continuous numeric target" },
          ],
          correctAnswer: ["imbalanced", "small"],
        },
        {
          slug: "test-pipeline-snippet",
          prompt:
            "Write a scikit-learn snippet that wraps a `StandardScaler` and a `LogisticRegression` into a single pipeline and fits it on `X_train`, `y_train`.",
          questionType: "code",
          points: 4,
          validators: [
            {
              kind: "regex",
              pattern: "Pipeline\\s*\\(.*StandardScaler.*LogisticRegression.*\\).*fit\\s*\\(\\s*X_train\\s*,\\s*y_train\\s*\\)",
              flags: "is",
            },
            { kind: "facilitator_review", rubricKey: "code-quality" },
          ],
        },
        {
          slug: "test-business-readout",
          prompt:
            "In 4-6 sentences, explain to a non-technical executive how to read a confusion matrix for a fraud model and what trade-offs you are recommending.",
          questionType: "long_answer",
          points: 4,
          rubric: [
            { criterion: "Plain language", weight: 0.4, descriptor: "Avoids jargon or defines it" },
            { criterion: "Trade-off named", weight: 0.4, descriptor: "Mentions cost of FP vs FN" },
            { criterion: "Recommendation is clear", weight: 0.2, descriptor: "States a position" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const neuralNetworks: ModuleAssessmentBlueprint = {
  moduleSlug: "neural-networks",
  assessments: [
    {
      slug: "warmup-network-anatomy",
      title: "Network anatomy warm-up",
      kind: "activity",
      description: "Quick anchor on layer roles before the CNN concepts lab.",
      estimatedMinutes: 8,
      questions: [
        {
          slug: "activation-role",
          prompt: "What is the primary role of a non-linear activation function in a neural network?",
          questionType: "multiple_choice",
          options: [
            { id: "speed", label: "It speeds up matrix multiplication" },
            { id: "non-linear", label: "It lets the network learn non-linear relationships between inputs and outputs" },
            { id: "regularise", label: "It prevents overfitting on its own" },
            { id: "scale", label: "It scales features to the same range" },
          ],
          correctAnswer: "non-linear",
        },
      ],
    },
    {
      slug: "homework-tuning-notes",
      title: "Tuning lab homework",
      kind: "homework",
      description: "Submit a hyperparameter tuning table and short reflection from the tuning lab.",
      estimatedMinutes: 60,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "tuning-table",
          prompt: "Upload your tuning comparison table (.csv or .xlsx) from the network tuning lab.",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "tuning-reflection",
          prompt:
            "In 3-5 sentences, explain which run you would promote to a controlled pilot and why, including one trade-off you are accepting.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Run choice is justified", weight: 0.5, descriptor: "Names metric and value" },
            { criterion: "Trade-off acknowledged", weight: 0.5, descriptor: "Names the cost (latency, complexity, etc.)" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-cnn-and-transfer-learning",
      title: "CNN and transfer learning quiz",
      kind: "quiz",
      description: "Auto-graded check on convolutions, pooling, and transfer learning.",
      estimatedMinutes: 12,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "what-cnns-do",
          prompt: "Why are CNNs effective for document and image inputs?",
          questionType: "multiple_choice",
          options: [
            { id: "fewer-params", label: "They share weights spatially, capturing local patterns with fewer parameters than dense layers" },
            { id: "always-deeper", label: "They are always deeper than fully connected networks" },
            { id: "no-overfitting", label: "They never overfit" },
            { id: "no-augmentation", label: "They make data augmentation unnecessary" },
          ],
          correctAnswer: "fewer-params",
        },
        {
          slug: "transfer-learning-when",
          prompt: "Pick the cases where transfer learning is a sensible default. Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "small-dataset", label: "You have a small labelled dataset for the target task" },
            { id: "similar-domain", label: "The pretrained model was trained on a similar domain" },
            { id: "infinite-data", label: "You have effectively unlimited labelled data and time to train from scratch" },
            { id: "regulated-explainability", label: "You need a fully interpretable feature attribution per pixel" },
          ],
          correctAnswer: ["small-dataset", "similar-domain"],
        },
      ],
    },
    {
      slug: "module-test-neural-networks",
      title: "Module test: Neural Networks",
      kind: "module_test",
      description: "End-of-module test for the neural networks module.",
      estimatedMinutes: 40,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-overfitting-controls",
          prompt: "Which combination of techniques is most appropriate to reduce overfitting on a small banking dataset?",
          questionType: "multi_select",
          points: 3,
          options: [
            { id: "dropout", label: "Dropout regularisation" },
            { id: "data-aug", label: "Data augmentation appropriate to the input modality" },
            { id: "deeper-net", label: "Adding more layers to the network" },
            { id: "early-stop", label: "Early stopping based on validation loss" },
          ],
          correctAnswer: ["dropout", "data-aug", "early-stop"],
        },
        {
          slug: "test-governance-narrative",
          prompt:
            "In 4-6 sentences, explain how you would govern a neural network used for KYC document screening, given the bank's risk and audit requirements.",
          questionType: "long_answer",
          points: 4,
          rubric: [
            { criterion: "Naming a human-in-the-loop control", weight: 0.4, descriptor: "Mentions review or escalation" },
            { criterion: "Naming a monitoring control", weight: 0.3, descriptor: "Mentions drift or performance" },
            { criterion: "Naming an audit control", weight: 0.3, descriptor: "Mentions logs, versioning, sign-off" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const businessApplications: ModuleAssessmentBlueprint = {
  moduleSlug: "business-applications-in-ai",
  assessments: [
    {
      slug: "warmup-opportunity-framing",
      title: "Opportunity framing warm-up",
      kind: "activity",
      description: "Anchor opportunity criteria before the prioritisation studio.",
      estimatedMinutes: 10,
      questions: [
        {
          slug: "criteria-pick",
          prompt: "Which trio of criteria forms the strongest first-pass screen for AJB AI opportunities?",
          questionType: "multiple_choice",
          options: [
            { id: "value-feasibility-risk", label: "Business value, technical feasibility, and risk impact" },
            { id: "novelty-hype-vendor", label: "Novelty, market hype, and vendor availability" },
            { id: "cost-only", label: "Cost only" },
            { id: "speed-only", label: "Speed of delivery only" },
          ],
          correctAnswer: "value-feasibility-risk",
        },
      ],
    },
    {
      slug: "homework-opportunity-map",
      title: "Opportunity map submission",
      kind: "homework",
      description: "Submit your prioritised AJB AI opportunity map for facilitator review.",
      estimatedMinutes: 90,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "opportunity-map-upload",
          prompt: "Upload your opportunity map (PDF, Excel, or board export).",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "top-three-defence",
          prompt:
            "Defend your top three opportunities. For each, give a one-sentence value statement, a feasibility note, and a key governance risk.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Three distinct opportunities", weight: 0.3, descriptor: "Each opportunity is differentiated" },
            { criterion: "Value, feasibility, risk all named", weight: 0.5, descriptor: "All three lenses present" },
            { criterion: "Banking-relevant framing", weight: 0.2, descriptor: "Speaks to AJB context" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-ethics-and-governance",
      title: "Ethics and governance quiz",
      kind: "quiz",
      description: "Auto-graded check on responsible AI principles for banking.",
      estimatedMinutes: 12,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "human-in-loop",
          prompt: "Which AJB use case most clearly requires a human-in-the-loop decision step?",
          questionType: "multiple_choice",
          options: [
            { id: "credit-decision", label: "An adverse credit decision affecting a retail customer" },
            { id: "internal-meeting-notes", label: "Auto-generating internal meeting notes" },
            { id: "marketing-headline", label: "A/B testing a marketing email headline" },
            { id: "doc-classifier", label: "Classifying internal document folders" },
          ],
          correctAnswer: "credit-decision",
        },
        {
          slug: "governance-controls",
          prompt: "Which controls would you expect in a documented AI initiative? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "owner", label: "Named accountable owner" },
            { id: "risk-rating", label: "A documented risk rating" },
            { id: "no-monitoring", label: "An assumption that no monitoring is needed" },
            { id: "deactivation", label: "A deactivation or rollback plan" },
          ],
          correctAnswer: ["owner", "risk-rating", "deactivation"],
        },
      ],
    },
    {
      slug: "module-test-business-applications",
      title: "Module test: Business Applications in AI",
      kind: "module_test",
      description: "End-of-module test for business applications.",
      estimatedMinutes: 40,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-prioritisation-trade-off",
          prompt:
            "In 3-5 sentences, defend a recommendation between a high-value but complex initiative and a quick-win, lower-value initiative for AJB. Make a clear choice.",
          questionType: "long_answer",
          points: 5,
          rubric: [
            { criterion: "Clear choice", weight: 0.3, descriptor: "Picks a direction" },
            { criterion: "Trade-off named", weight: 0.4, descriptor: "Names the cost of the choice" },
            { criterion: "Risk awareness", weight: 0.3, descriptor: "Calls out a governance angle" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "test-business-case-upload",
          prompt: "Upload your one-page business case for the chosen initiative (PDF or DOCX).",
          questionType: "file_upload",
          points: 5,
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const automation: ModuleAssessmentBlueprint = {
  moduleSlug: "automation-in-ai",
  assessments: [
    {
      slug: "warmup-workflow-anatomy",
      title: "Workflow anatomy warm-up",
      kind: "activity",
      description: "Anchor what counts as inputs, outputs, controls, and exceptions in a workflow.",
      estimatedMinutes: 10,
      questions: [
        {
          slug: "workflow-elements",
          prompt: "Which element belongs to the controls layer of a workflow rather than the input or output layer?",
          questionType: "multiple_choice",
          options: [
            { id: "approval-step", label: "An approval step before payment release" },
            { id: "raw-form", label: "A raw form submission" },
            { id: "report-pdf", label: "A monthly PDF report" },
            { id: "data-feed", label: "An incoming data feed" },
          ],
          correctAnswer: "approval-step",
        },
      ],
    },
    {
      slug: "homework-automation-design",
      title: "Automation design submission",
      kind: "homework",
      description: "Submit your end-to-end automation design for an AJB process.",
      estimatedMinutes: 90,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "automation-diagram",
          prompt: "Upload your automation design (diagram, board export, or PDF).",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "exception-paths",
          prompt: "Describe two exception paths in your design and how each is handled.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Two distinct exception paths", weight: 0.5, descriptor: "Both paths are concrete" },
            { criterion: "Handling is appropriate", weight: 0.5, descriptor: "Names a control or human step" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-automation-fundamentals",
      title: "Automation fundamentals quiz",
      kind: "quiz",
      description: "Auto-graded check on automation tooling, APIs, and governance.",
      estimatedMinutes: 12,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "api-vs-rpa",
          prompt: "When is an API integration preferable to RPA for AJB?",
          questionType: "multiple_choice",
          options: [
            { id: "stable-system", label: "When the target system exposes a stable, documented API" },
            { id: "no-api", label: "When the target system has no API and the UI is the only interface" },
            { id: "cheaper-licence", label: "Whenever the RPA licence is cheaper" },
            { id: "demo-only", label: "When you only need to demo the workflow once" },
          ],
          correctAnswer: "stable-system",
        },
        {
          slug: "ai-assistant-controls",
          prompt: "Which controls should sit around an internal AI assistant for AJB staff? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "scope", label: "Tightly scoped tools and data sources" },
            { id: "prompt-injection", label: "Defences against prompt injection" },
            { id: "no-logging", label: "No logging to preserve speed" },
            { id: "audit", label: "Audit trail of inputs and assistant actions" },
          ],
          correctAnswer: ["scope", "prompt-injection", "audit"],
        },
      ],
    },
    {
      slug: "module-test-automation",
      title: "Module test: Automation in AI",
      kind: "module_test",
      description: "End-of-module test for the automation module.",
      estimatedMinutes: 40,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-design-defence",
          prompt:
            "In 4-6 sentences, defend your automation design choice for the chosen AJB process. Mention inputs, outputs, controls, and one risk you are mitigating.",
          questionType: "long_answer",
          points: 6,
          rubric: [
            { criterion: "All four lenses named", weight: 0.5, descriptor: "Inputs, outputs, controls, exceptions" },
            { criterion: "Risk is concrete", weight: 0.5, descriptor: "Names a real failure mode" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "test-implementation-plan",
          prompt: "Upload a one-page implementation plan with milestones and owners.",
          questionType: "file_upload",
          points: 4,
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const visualisation: ModuleAssessmentBlueprint = {
  moduleSlug: "advanced-data-visualization",
  assessments: [
    {
      slug: "warmup-chart-choice",
      title: "Chart choice warm-up",
      kind: "activity",
      description: "Anchor good chart selection before the dashboard studio.",
      estimatedMinutes: 8,
      questions: [
        {
          slug: "trend-over-time",
          prompt: "Which chart type best supports a monthly trend story for branch revenue?",
          questionType: "multiple_choice",
          options: [
            { id: "line", label: "Line chart" },
            { id: "pie", label: "Pie chart" },
            { id: "donut", label: "Donut chart" },
            { id: "treemap", label: "Treemap" },
          ],
          correctAnswer: "line",
        },
      ],
    },
    {
      slug: "homework-dashboard-prototype",
      title: "Dashboard prototype submission",
      kind: "homework",
      description: "Submit your interactive dashboard prototype for AJB senior management.",
      estimatedMinutes: 120,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "dashboard-upload",
          prompt: "Upload your dashboard export or share link as text.",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "design-rationale",
          prompt:
            "Explain in 4-6 sentences how the dashboard hierarchy supports the executive question it answers.",
          questionType: "long_answer",
          rubric: [
            { criterion: "Question is named", weight: 0.3, descriptor: "States the executive question" },
            { criterion: "Hierarchy is justified", weight: 0.4, descriptor: "Top-down or grouped logic" },
            { criterion: "Usability noted", weight: 0.3, descriptor: "Mentions filters or interactions" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-visual-principles",
      title: "Visual principles quiz",
      kind: "quiz",
      description: "Auto-graded check on visualisation principles.",
      estimatedMinutes: 10,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "data-ink",
          prompt: "Which change typically improves data-ink ratio in an executive dashboard?",
          questionType: "multiple_choice",
          options: [
            { id: "remove-chartjunk", label: "Removing 3D effects, heavy gridlines, and decorative borders" },
            { id: "add-gradients", label: "Adding more gradients" },
            { id: "more-colours", label: "Using more colours so each metric has its own hue" },
            { id: "shadow", label: "Adding drop shadows behind every chart" },
          ],
          correctAnswer: "remove-chartjunk",
        },
        {
          slug: "good-defaults",
          prompt: "Which defaults belong in an executive dashboard? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "context", label: "A short title that names the question" },
            { id: "definitions", label: "Inline definitions of key metrics" },
            { id: "no-axis-labels", label: "No axis labels to save space" },
            { id: "freshness", label: "A clear data freshness timestamp" },
          ],
          correctAnswer: ["context", "definitions", "freshness"],
        },
      ],
    },
    {
      slug: "module-test-visualisation",
      title: "Module test: Advanced Data Visualisation",
      kind: "module_test",
      description: "End-of-module test for the visualisation module.",
      estimatedMinutes: 45,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-storytelling",
          prompt:
            "In 4-6 sentences, narrate the story your dashboard tells, including the headline insight, the supporting view, and one caveat.",
          questionType: "long_answer",
          points: 6,
          rubric: [
            { criterion: "Headline insight is decision-ready", weight: 0.5, descriptor: "Clear takeaway" },
            { criterion: "Supporting evidence", weight: 0.3, descriptor: "References a chart" },
            { criterion: "Caveat is honest", weight: 0.2, descriptor: "Names a real limitation" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "test-final-pack",
          prompt: "Upload the final dashboard pack (PDF, image, or share link as a .txt file).",
          questionType: "file_upload",
          points: 4,
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

const aiBanking: ModuleAssessmentBlueprint = {
  moduleSlug: "ai-in-banking-and-finance",
  assessments: [
    {
      slug: "warmup-genai-fit",
      title: "GenAI fit warm-up",
      kind: "activity",
      description: "Quick check on which AJB use cases fit generative AI.",
      estimatedMinutes: 8,
      questions: [
        {
          slug: "best-fit",
          prompt: "Which AJB use case is the strongest first fit for generative AI?",
          questionType: "multiple_choice",
          options: [
            { id: "draft-summaries", label: "Drafting call summaries from transcripts for human review" },
            { id: "loan-decision", label: "Making the final loan approval decision" },
            { id: "regulatory-filing", label: "Submitting regulatory filings without human sign-off" },
            { id: "trade-execution", label: "Executing trades automatically based on news" },
          ],
          correctAnswer: "draft-summaries",
        },
      ],
    },
    {
      slug: "homework-prompt-bank",
      title: "Prompt bank submission",
      kind: "homework",
      description: "Submit your AJB-aligned prompt set for an internal banking assistant.",
      estimatedMinutes: 75,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "prompt-bank-upload",
          prompt: "Upload your prompt bank (CSV, JSON, or markdown).",
          questionType: "file_upload",
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "risk-controls",
          prompt:
            "List two risk controls you embedded into your prompt set (e.g. refusal patterns, data scoping, escalation).",
          questionType: "long_answer",
          rubric: [
            { criterion: "Two distinct controls", weight: 0.5, descriptor: "Both are concrete" },
            { criterion: "Banking applicability", weight: 0.5, descriptor: "Each fits AJB context" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
    {
      slug: "quiz-ai-risk",
      title: "AI risk quiz",
      kind: "quiz",
      description: "Auto-graded check on AI risk in regulated environments.",
      estimatedMinutes: 12,
      passingScore: PASS_DEFAULT,
      maxAttempts: 3,
      questions: [
        {
          slug: "hallucination-control",
          prompt: "Which technique most directly reduces hallucination risk for an internal AI assistant?",
          questionType: "multiple_choice",
          options: [
            { id: "rag", label: "Retrieval-augmented generation grounded in approved AJB sources" },
            { id: "longer-prompts", label: "Writing longer prompts" },
            { id: "less-temperature", label: "Lowering temperature on its own" },
            { id: "ignore", label: "Ignoring the issue and trusting the model" },
          ],
          correctAnswer: "rag",
        },
        {
          slug: "regulatory-considerations",
          prompt: "Which factors belong in an AI use-case risk assessment for AJB? Select all that apply.",
          questionType: "multi_select",
          options: [
            { id: "data-classification", label: "Data classification of inputs and outputs" },
            { id: "explainability", label: "Required level of explainability" },
            { id: "vendor-coolness", label: "How impressive the vendor's marketing site looks" },
            { id: "regulatory-impact", label: "Applicable regulatory frameworks" },
          ],
          correctAnswer: ["data-classification", "explainability", "regulatory-impact"],
        },
      ],
    },
    {
      slug: "module-test-ai-banking",
      title: "Module test: AI in Banking and Finance",
      kind: "module_test",
      description: "End-of-module test for the AI in banking and finance module.",
      estimatedMinutes: 40,
      passingScore: TEST_PASS_DEFAULT,
      maxAttempts: 2,
      blocksModuleCompletion: true,
      facilitatorReviewRequired: true,
      questions: [
        {
          slug: "test-strategy-narrative",
          prompt:
            "In 5-7 sentences, write a strategic recommendation for how AJB should adopt AI over the next 12 months. Include a sequencing argument and one risk you are accepting.",
          questionType: "long_answer",
          points: 6,
          rubric: [
            { criterion: "Sequencing is clear", weight: 0.4, descriptor: "Names what comes first" },
            { criterion: "Risk acceptance is honest", weight: 0.3, descriptor: "Specific risk named" },
            { criterion: "Banking-relevant", weight: 0.3, descriptor: "Fits AJB context" },
          ],
          validators: [{ kind: "facilitator_review" }],
        },
        {
          slug: "test-case-study",
          prompt: "Upload your case-study workbook for the chosen AJB scenario.",
          questionType: "file_upload",
          points: 4,
          validators: [{ kind: "facilitator_review" }],
        },
      ],
    },
  ],
};

export const moduleAssessmentBlueprints: ModuleAssessmentBlueprint[] = [
  pythonForData,
  machineLearning,
  neuralNetworks,
  businessApplications,
  automation,
  visualisation,
  aiBanking,
];

moduleAssessmentBlueprints.forEach((blueprint) => assertModuleSlug(blueprint.moduleSlug));

export function getAssessmentBlueprintsForModule(moduleSlug: string): AssessmentBlueprint[] {
  const entry = moduleAssessmentBlueprints.find((blueprint) => blueprint.moduleSlug === moduleSlug);
  return entry?.assessments ?? [];
}

export function getModuleTestForModule(moduleSlug: string): AssessmentBlueprint | null {
  const assessments = getAssessmentBlueprintsForModule(moduleSlug);
  return assessments.find((assessment) => assessment.kind === "module_test") ?? null;
}

export function listAllAssessmentBlueprints(): Array<AssessmentBlueprint & { moduleSlug: string }> {
  return moduleAssessmentBlueprints.flatMap((entry) =>
    entry.assessments.map((assessment) => ({ ...assessment, moduleSlug: entry.moduleSlug })),
  );
}
