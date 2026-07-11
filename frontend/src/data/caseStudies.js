// Hand-crafted technical case studies — real numbers, real charts, not
// auto-generated from GitHub READMEs like the main Projects section.
// Add a new entry to the relevant category array to publish a new page.
// Update `github` / `live` once the repo is pushed / the app is deployed.

export const categories = {
  ml: {
    label: 'Machine Learning',
    eyebrow: 'Case Studies',
    subtitle: 'Classical ML — benchmarked models, real evaluation, explainability.',
  },
  dl: {
    label: 'Deep Learning',
    eyebrow: 'Case Studies',
    subtitle: 'Neural networks, computer vision, and sequence models.',
  },
};

export const caseStudies = {
  ml: [
    {
      slug: 'customer-churn-prediction',
      title: 'Customer Churn Prediction',
      tagline:
        'Benchmarked three models on real evidence, tuned the decision threshold, and caught a production bug before it shipped.',
      categoryKey: 'ml',
      summary:
        'A telecom churn predictor built to prove ML understanding, not just produce a number: three models benchmarked under identical conditions, the simplest one won on evidence, and the whole thing is served live through a FastAPI backend and a React dashboard.',
      github: 'https://github.com/SaudDSxAI/churn-prediction',
      live: '',
      tech: ['Python', 'scikit-learn', 'XGBoost', 'pandas', 'SHAP', 'FastAPI', 'React', 'Recharts'],
      hasLiveDemo: true,
      heroMetrics: [
        { label: 'ROC-AUC', value: '0.836' },
        { label: 'F1 (churners)', value: '0.63' },
        { label: 'Customers analyzed', value: '7,032' },
        { label: 'Models benchmarked', value: '3' },
      ],
      modelComparison: [
        { name: 'Logistic Regression', f1: 60.9, rocAuc: 83.6, chosen: true },
        { name: 'LR (balanced)', f1: 60.8, rocAuc: 83.5, chosen: false },
        { name: 'Random Forest', f1: 59.9, rocAuc: 82.0, chosen: false },
        { name: 'XGBoost', f1: 58.3, rocAuc: 80.3, chosen: false },
      ],
      confusionMatrix: { tn: 846, fp: 187, fn: 118, tp: 256 },
      finalMetrics: { precision: 0.578, recall: 0.684, f1: 0.627, rocAuc: 0.836, threshold: 0.4 },
      featureImportance: [
        { feature: 'tenure', coefficient: -1.348 },
        { feature: 'MonthlyCharges', coefficient: -0.852 },
        { feature: 'InternetService: Fiber optic', coefficient: 0.728 },
        { feature: 'TotalCharges', coefficient: 0.639 },
        { feature: 'Contract: Two year', coefficient: -0.603 },
        { feature: 'Contract: One year', coefficient: -0.311 },
        { feature: 'StreamingTV: Yes', coefficient: 0.250 },
        { feature: 'StreamingMovies: Yes', coefficient: 0.236 },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: 'Predict which telecom customers are about to churn, using the IBM Telco Customer Churn dataset (7,043 customers, 20 features spanning demographics, account details, and subscribed services). The real constraint: prove the model choice with evidence, not just train something that runs.',
        },
        {
          heading: 'Approach',
          body: 'Cleaned and encoded the data (dropped 11 rows with undefined TotalCharges for brand-new customers), then benchmarked Logistic Regression, Random Forest, and XGBoost under identical class-imbalance handling — a fairness detail that mattered: an early, uneven comparison would have quietly favored the tree models. Logistic Regression won on ROC-AUC despite being the simplest model, because churn in this dataset is driven by mostly linear relationships (tenure, contract length, monthly charges). The decision threshold was then tuned by sweeping values and maximizing F1 on the minority class, landing on 0.40 instead of the default 0.5.',
        },
        {
          heading: 'A real bug, caught by testing',
          body: "While building the live prediction API, single-row predictions were silently ignoring every categorical input (InternetService, Contract, PaymentMethod). The cause: pandas.get_dummies(drop_first=True) on a one-row DataFrame always drops the only category present, producing zero dummy columns regardless of the actual value. Every prediction was scoring as if the customer had the reference category for every field. Caught by testing an obviously high-risk profile and noticing the output didn't match the direction the model's own coefficients predicted — fixed with explicit, training-set-aligned one-hot encoding.",
        },
        {
          heading: 'What it does now',
          body: 'A FastAPI backend serves all three benchmarked models behind a /predict endpoint, each with its own tuned threshold. The React dashboard shows the full benchmarking story (model comparison, ROC curve, confusion matrix, SHAP-based feature importance) plus a live prediction tool where you can build a customer profile, pick a model, and drag a threshold slider to see the precision/recall tradeoff happen in real time — the probability doesn\'t change, only how it gets classified.',
        },
      ],
      skillsDemonstrated: [
        'Fair model benchmarking (controlling for class-imbalance handling across models before comparing)',
        'Metric selection under class imbalance (precision/recall/F1/ROC-AUC over accuracy, and why)',
        'Decision threshold tuning via F1 sweep, not defaulting to 0.5',
        'Multicollinearity diagnosis (tenure / MonthlyCharges / TotalCharges overlap) from a counter-intuitive coefficient sign',
        'Model interpretability with SHAP and coefficient analysis',
        'Debugging via output verification, not code inspection alone (the drop_first bug)',
        'Full-stack ML deployment: FastAPI inference service + React dashboard',
        'API design for live, interactive model comparison (multi-model serving, client-side threshold reclassification)',
      ],
    },
  ],
  dl: [],
};

export function getCaseStudy(categoryKey, slug) {
  return (caseStudies[categoryKey] || []).find((c) => c.slug === slug);
}
