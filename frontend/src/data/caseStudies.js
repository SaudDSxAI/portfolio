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
  production: {
    label: 'Production Systems',
    eyebrow: 'Deployed Work',
    subtitle: 'Real systems, live at real companies — not benchmarks, production.',
  },
  robotics: {
    label: 'Robotics & IoT',
    eyebrow: 'Hardware in Motion',
    subtitle: 'Real hardware, real sensors, and connected systems that work in the physical world.',
  },
  tools: {
    label: 'Tools & Utilities',
    eyebrow: 'Built to Use',
    subtitle: 'Real software built to solve a real personal problem, not a portfolio exercise.',
  },
  agentic: {
    label: 'Agentic AI',
    eyebrow: 'Learning Journey',
    subtitle: 'Ongoing experiments with autonomous agents — not polished products, real hands-on learning.',
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
      demoKey: 'churn',
      accentColor: 'blue',
      icon: 'users',
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
      confusionMatrixLabels: {
        tn: 'Correctly predicted stay', fp: 'False alarms', fn: 'Missed churners', tp: 'Correctly caught churners',
      },
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
    {
      slug: 'heart-disease-prediction',
      title: 'Heart Disease Risk Prediction',
      tagline:
        'Two models tied statistically, not just numerically — proven with a paired significance test, not eyeballed off a leaderboard.',
      categoryKey: 'ml',
      summary:
        'A clinical risk model built the same disciplined way as the churn project, but with a twist: after two rounds of catching bad source data, the final benchmark between Logistic Regression and Random Forest came back statistically tied — and the write-up says so, instead of declaring a fake winner.',
      github: 'https://github.com/SaudDSxAI/heart-disease-prediction',
      live: '',
      tech: ['Python', 'scikit-learn', 'pandas', 'SciPy', 'FastAPI', 'React', 'Recharts'],
      hasLiveDemo: true,
      demoKey: 'heart',
      accentColor: 'rose',
      icon: 'heartPulse',
      heroMetrics: [
        { label: 'ROC-AUC', value: '0.924' },
        { label: 'F1 (disease)', value: '0.88' },
        { label: 'Patients analyzed', value: '918' },
        { label: 'Duplicate rows caught', value: '2 datasets' },
      ],
      modelComparison: [
        { name: 'Logistic Regression', f1: 87.9, rocAuc: 92.5, chosen: true },
        { name: 'Random Forest', f1: 88.3, rocAuc: 92.8, chosen: false },
      ],
      confusionMatrix: { tn: 340, fp: 70, fn: 55, tp: 453 },
      confusionMatrixLabels: {
        tn: 'Correctly predicted no disease', fp: 'False alarms', fn: 'Missed disease cases', tp: 'Correctly caught disease cases',
      },
      finalMetrics: { precision: 0.868, recall: 0.892, f1: 0.879, rocAuc: 0.924, threshold: 0.5 },
      featureImportance: [
        { feature: 'ST slope: flat', coefficient: -0.876 },
        { feature: 'Chest pain: asymptomatic', coefficient: 0.713 },
        { feature: 'Sex (male)', coefficient: 0.587 },
        { feature: 'Fasting blood sugar > 120', coefficient: 0.475 },
        { feature: 'Cholesterol', coefficient: -0.441 },
        { feature: 'Exercise-induced angina', coefficient: 0.440 },
        { feature: 'ST depression (oldpeak)', coefficient: 0.399 },
        { feature: 'ST slope: upsloping', coefficient: 0.325 },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: 'Predict heart disease presence from clinical markers (age, chest pain type, cholesterol, exercise test results, etc.), following up on the churn project\'s model-comparison approach — but this time on a genuinely different domain and a smaller, medically-framed dataset, to test whether the earlier finding (simpler models winning) actually generalizes.',
        },
        {
          heading: 'Round one: a dataset that lied',
          body: 'The first public CSV mirror (1,025 rows) turned out to be 723 exact duplicate rows — the same ~302 patients repeated roughly 3.4x to pad out a small dataset. Trained anyway to see what happened: Logistic Regression \"won\" cleanly. But several coefficients pointed in medically backwards directions (male sex and exercise-induced angina both reducing predicted risk), which is a red flag, not a footnote. Concluded the mirror likely had corrupted or inconsistently labeled data and started over rather than write up a result built on bad data.',
        },
        {
          heading: 'Round two: sourcing it properly',
          body: 'Switched to a dataset combining five independent clinical databases (Cleveland, Hungarian, Switzerland, Long Beach VA, Statlog — 1,190 rows total), backed by a peer-reviewed Nature Scientific Data paper rather than an anonymous CSV upload. Still found 272 duplicate rows (partly genuine patient overlap between source databases, partly coincidental collisions across only 11 low-cardinality features) and dropped them, landing on 918 clean, real records. This time the feature coefficients aligned with clinical expectation.',
        },
        {
          heading: 'Cross-validation instead of a single split',
          body: 'With only ~918 rows (and as few as 302 in the first attempt), a single train/test split is unreliable — whichever rows land in the 20% test set can swing results by chance. Used 5-fold stratified cross-validation for every reported number instead, evaluating on the full dataset across folds rather than trusting one split.',
        },
        {
          heading: 'A tie, proven statistically',
          body: 'Random Forest scored marginally higher than Logistic Regression on most metrics (ROC-AUC 0.928 vs 0.925). Rather than declaring a winner off a 0.3-point gap, ran a paired t-test comparing both models\' per-fold ROC-AUC scores: p = 0.419, far above the 0.05 significance threshold — the models are statistically indistinguishable on this dataset. Chose Logistic Regression anyway, specifically because the performance is equivalent and it is the more interpretable, auditable option for a clinical-adjacent tool — a judgment call made explicit and justified, not a default.',
        },
      ],
      skillsDemonstrated: [
        'Recognizing corrupted/duplicated source data from coefficient directions that contradicted domain knowledge, not just from summary statistics',
        'Re-sourcing data from a peer-reviewed, verifiable origin instead of patching a bad dataset',
        'Cross-validation (StratifiedKFold) over a single split when sample size is small',
        'Paired statistical significance testing (t-test) to distinguish real model differences from cross-validation noise',
        'Making and justifying a judgment call (interpretability) when evidence alone doesn\'t pick a winner',
        'Domain-aware categorical encoding for a different feature set than a prior project (chest pain type, ST slope, etc.)',
        'Full-stack ML deployment reused from a prior project\'s architecture pattern (FastAPI router merged into an existing production backend)',
      ],
    },
    {
      slug: 'credit-card-fraud-detection',
      title: 'Credit Card Fraud Detection',
      tagline:
        'Extreme imbalance (0.17% fraud), a SMOTE trap that looked great on paper and failed in practice, and the first project in this series where a complex model actually won.',
      categoryKey: 'ml',
      summary:
        'A fraud detector built on 284K real anonymized transactions, where the interesting story isn\'t the final model — it\'s catching that a textbook SMOTE approach produced a 95% false-alarm rate despite a great ROC-AUC, and fixing it with the right metric and the right technique instead of declaring victory early.',
      github: 'https://github.com/SaudDSxAI/credit-fraud-detection',
      live: '',
      tech: ['Python', 'scikit-learn', 'XGBoost', 'imbalanced-learn', 'pandas', 'FastAPI', 'React', 'Recharts'],
      hasLiveDemo: true,
      demoKey: 'fraud',
      accentColor: 'amber',
      icon: 'shieldAlert',
      comparisonMetricKey: 'prAuc',
      comparisonMetricLabel: 'PR-AUC',
      heroMetrics: [
        { label: 'PR-AUC', value: '0.824' },
        { label: 'Precision @ threshold', value: '90.2%' },
        { label: 'Transactions analyzed', value: '283,726' },
        { label: 'Fraud rate', value: '0.17%' },
      ],
      modelComparison: [
        { name: 'SMOTE (light) + LR', prAuc: 68.1, chosen: false },
        { name: 'Class-weighted LR', prAuc: 67.3, chosen: false },
        { name: 'Random Forest', prAuc: 81.7, chosen: false },
        { name: 'XGBoost', prAuc: 82.4, chosen: true },
      ],
      confusionMatrix: { tn: 56643, fp: 8, fn: 21, tp: 74 },
      confusionMatrixLabels: {
        tn: 'Correctly predicted legitimate', fp: 'False alarms', fn: 'Missed fraud', tp: 'Correctly caught fraud',
      },
      finalMetrics: { precision: 0.902, recall: 0.779, f1: 0.836, rocAuc: 0.964, threshold: 0.208 },
      featureImportance: [
        { feature: 'V14', coefficient: 0.637 },
        { feature: 'V4', coefficient: 0.060 },
        { feature: 'V12', coefficient: 0.025 },
        { feature: 'V3', coefficient: 0.022 },
        { feature: 'V8', coefficient: 0.022 },
        { feature: 'V10', coefficient: 0.021 },
        { feature: 'V19', coefficient: 0.020 },
        { feature: 'V11', coefficient: 0.016 },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: 'Detect fraudulent transactions in 284,807 real, anonymized European credit card transactions (the ULB dataset) — with only 492 labeled as fraud, a 0.17% positive rate. This is an order of magnitude more imbalanced than churn (73/27) or heart disease (roughly balanced), which makes almost every earlier assumption about metrics and evaluation need re-checking rather than reused.',
        },
        {
          heading: 'A dataset that mostly speaks for itself, and one that doesn\'t',
          body: 'Features V1-V28 are PCA components the card issuer generated to anonymize the data before release — genuinely useful for modeling, but meaningless to inspect individually (no "V14 represents X" story is possible, unlike tenure or cholesterol in the other two projects). Correlation with the target topped out around -0.33 for the strongest feature, modest by normal standards, but a class-conditional boxplot comparison showed real, visible separation between fraud and non-fraud for the top features despite the muted correlation numbers, since correlation understates non-linear separation.',
        },
        {
          heading: 'The SMOTE trap',
          body: 'A standard approach — SMOTE oversampling to fully balance the training set, then Logistic Regression — produced an ROC-AUC of 0.961 and 87% recall, which looks like a strong result. It wasn\'t: at the default 0.5 threshold, precision was 0.05 — 19 false alarms for every real fraud caught, which would be operationally unusable in a real fraud team. The cause: SMOTE\'s full 1:1 rebalancing trains the model as if fraud were 50% of transactions instead of 0.17%, shifting the decision boundary far more aggressively toward "fraud" than the real world warrants. Tuning the classification threshold recovered a workable 50% precision at 79% recall — a large improvement, but still not the final answer.',
        },
        {
          heading: 'Testing whether SMOTE was even the right tool',
          body: 'Rather than accepting a tuned-but-mediocre SMOTE model, four different imbalance-handling strategies were benchmarked head-to-head using PR-AUC (a far more honest metric than ROC-AUC at this level of imbalance, since ROC-AUC\'s false-positive-rate denominator is so large that it stays deceptively high even with many false alarms): light SMOTE, class-weighting alone, Random Forest, and XGBoost with scale_pos_weight. XGBoost won decisively (PR-AUC 0.824 vs 0.67-0.68 for both linear approaches) — the first project in this series where a complex model beat simpler ones by a wide margin, rather than tying or losing. Dropping SMOTE entirely in favor of XGBoost\'s native class-weighting mechanism also outperformed every SMOTE variant tested, a useful, slightly counter-intuitive finding: the "obvious" imbalance-handling technique isn\'t always the best one.',
        },
        {
          heading: 'The final operating point',
          body: 'Threshold-tuning the winning XGBoost model found a genuinely deployable operating point: at threshold 0.208, precision reaches 90.2% (only 8 false alarms across 56,651 legitimate test transactions) while still catching 78% of fraud (74 of 95 cases). That\'s the difference between a model that would actually be usable by a fraud team and one that just scores well on paper.',
        },
      ],
      skillsDemonstrated: [
        'Recognizing that a strong ROC-AUC can hide an operationally useless model under extreme class imbalance',
        'Correct use of SMOTE inside a leakage-safe pipeline (imbalanced-learn Pipeline, not sklearn\'s) rather than resampling before the split',
        'Precision-Recall AUC over ROC-AUC as the honest metric under severe imbalance, and explaining why',
        'Benchmarking multiple imbalance-handling strategies (SMOTE at different ratios, class-weighting, native boosting weights) instead of assuming one technique is correct',
        'Threshold tuning to a specific operational target (precision-driven) rather than defaulting to 0.5',
        'Feature engineering under an anonymization constraint (deriving Hour from Time, scaling Amount with RobustScaler for its heavy skew)',
        'Building an honest live demo that includes real model failures (a missed fraud, a false alarm), not just cherry-picked correct predictions',
      ],
    },
    {
      slug: 'house-price-prediction',
      title: 'House Price Prediction',
      tagline:
        'The first regression project in this series — 216 features, meaningful-not-missing data, and a one-hot encoding artifact caught by checking value_counts before trusting a coefficient.',
      categoryKey: 'ml',
      summary:
        'Predicting real Ames, Iowa home sale prices from 79 raw features — the first project here where the target is a continuous number, not a category, which changes the metrics, the encoding strategy, and even how "missing data" gets interpreted.',
      github: 'https://github.com/SaudDSxAI/house-price-prediction',
      live: '',
      tech: ['Python', 'scikit-learn', 'XGBoost', 'pandas', 'FastAPI', 'React', 'Recharts'],
      hasLiveDemo: true,
      demoKey: 'house',
      accentColor: 'emerald',
      icon: 'home',
      comparisonMetricKey: 'r2',
      comparisonMetricLabel: 'R²',
      heroMetrics: [
        { label: 'R² (test set)', value: '0.924' },
        { label: 'Typical error', value: '±$15,000' },
        { label: 'Houses analyzed', value: '2,930' },
        { label: 'Features engineered', value: '216' },
      ],
      modelComparison: [
        { name: 'Linear Regression', r2: 81.8, chosen: false },
        { name: 'Ridge', r2: 84.6, chosen: false },
        { name: 'Lasso', r2: 85.6, chosen: true },
        { name: 'Random Forest', r2: 87.1, chosen: false },
        { name: 'XGBoost', r2: 87.4, chosen: false },
      ],
      finalMetrics: { precision: null, recall: null, f1: null, rocAuc: 0.924, threshold: null },
      featureImportance: [
        { feature: 'Roof Matl: CompShg', coefficient: 0.147 },
        { feature: 'Gr Liv Area (living space)', coefficient: 0.118 },
        { feature: 'Roof Matl: Tar & Gravel', coefficient: 0.104 },
        { feature: 'Overall Quality', coefficient: 0.082 },
        { feature: 'Roof Matl: Wood Shake', coefficient: 0.067 },
        { feature: 'Roof Matl: Wood Shingle', coefficient: 0.066 },
        { feature: 'Year Built', coefficient: 0.047 },
        { feature: 'Overall Condition', coefficient: 0.040 },
      ],
      narrative: [
        {
          heading: 'The problem — and the first regression project here',
          body: 'Predict real home sale prices in Ames, Iowa (2,930 houses, 79 raw features) from the classic Kaggle "House Prices" dataset. Every prior project here was classification — predicting a category. This is the first with a continuous target, which changes the toolkit: no precision/recall/F1, no ROC curve; instead RMSE, R², and MAE, and a completely different set of models (Linear/Ridge/Lasso instead of Logistic Regression — using Logistic Regression here would have been a real conceptual error, not just an unoriginal choice, since it is built for categories, not continuous numbers).',
        },
        {
          heading: 'Missing data that isn\'t actually missing',
          body: 'Roughly 20 columns had substantial "missing" values — but nearly all of it was meaningful, not an error. Pool QC is empty for 2,917 of 2,930 houses simply because almost no house has a pool; Bsmt Qual, Garage Type, and Fireplace Qu show the same pattern, confirmed by cross-checking that the corresponding square-footage columns were genuinely 0 for those same rows, not separately missing. Filling these with "None" (categorical) or 0 (numeric) rather than dropping rows or imputing a guess preserved real signal instead of discarding it. Only one column, Lot Frontage, was genuinely missing data, imputed using the neighborhood median rather than a single global value, since frontage varies systematically by area.',
        },
        {
          heading: 'Ordinal vs. nominal — a new encoding decision',
          body: 'About half the categorical columns are ordinal quality scales (Po < Fa < TA < Gd < Ex) rather than true unordered categories. One-hot encoding those would discard real ranking information for no benefit, so they were mapped to ordered integers instead; the remaining ~25 genuinely nominal columns (Neighborhood, Foundation, Sale Type) were one-hot encoded as usual, producing 216 total features from the original 79.',
        },
        {
          heading: 'Fixing the target\'s skew before modeling',
          body: 'SalePrice is right-skewed (skewness 1.74) — a small number of very expensive homes stretch the distribution, since price has a hard floor at zero but no ceiling. Modeling log(SalePrice) instead of raw price (standard practice for this exact competition) made the target far more symmetric and meant prediction errors become roughly proportional to price rather than a fixed dollar amount — a 10% miss means the same thing whether the house is worth $100K or $700K, which a raw-dollar model wouldn\'t reflect.',
        },
        {
          heading: 'Another statistical tie — and a coefficient that didn\'t survive scrutiny',
          body: 'XGBoost scored highest numerically (R² 0.874 vs. Lasso\'s 0.856), but a paired t-test across cross-validation folds came back p = 0.215 — not statistically significant, the same conclusion as the heart disease project. Lasso was chosen for the tie, plus a concrete practical bonus: it automatically zeroed out 68 of 216 coefficients, in effect doing feature selection on its own. One coefficient needed a second look before trusting it: Roof Matl (composite shingle) came out as the single strongest predictor, which made no sense on its face — checking value_counts showed composite shingle roofing on 2,887 of 2,930 houses, with the one-hot reference category dropped during encoding being a roof material used by exactly one house. That coefficient is really measuring "everyone" against a single outlier house, not a genuine roofing effect — a real artifact of one-hot encoding a near-constant column with an ultra-rare reference category, caught by checking the underlying category counts rather than taking the coefficient ranking at face value.',
        },
      ],
      skillsDemonstrated: [
        'Correctly distinguishing regression from classification at the model-selection level, not just swapping datasets',
        'Recognizing meaningful missingness (NA = "doesn\'t have this feature") vs. genuine missing data, and treating them differently',
        'Neighborhood-conditional imputation instead of a single global fill value',
        'Ordinal vs. nominal categorical encoding — preserving rank information instead of discarding it via blanket one-hot encoding',
        'Log-transforming a skewed regression target and explaining the practical reason (proportional vs. absolute error)',
        'Diagnosing a one-hot encoding artifact from an implausible coefficient by checking raw category counts, not trusting the ranking blindly',
        'Paired statistical testing to avoid overtrusting a small numeric gap between models — second time in this series, reinforcing it as a habit, not a one-off',
      ],
    },
    {
      slug: 'sales-demand-forecasting',
      title: 'Sales Demand Forecasting',
      tagline:
        'The first project here that predicts the future instead of scoring a snapshot — and where two tied, heavier models lost to a simpler one once deployment cost got weighed in.',
      categoryKey: 'ml',
      summary:
        'Forecasting monthly retail sales from 4 years of real transaction history — a genuinely different problem shape than every prior project: no rows to classify or price, just a sequence of months where the ordering itself is the signal.',
      github: 'https://github.com/SaudDSxAI/sales-forecasting',
      live: '',
      tech: ['Python', 'Prophet', 'statsmodels (SARIMA)', 'pandas', 'NumPy', 'FastAPI', 'React', 'Recharts'],
      hasLiveDemo: true,
      demoKey: 'sales',
      accentColor: 'violet',
      icon: 'trendingUp',
      comparisonMetricKey: 'accuracy',
      comparisonMetricLabel: 'Forecast Accuracy',
      heroMetrics: [
        { label: 'Forecast accuracy', value: '83.3%' },
        { label: 'Typical monthly error', value: '±$13,600' },
        { label: 'Months of history', value: '48' },
        { label: 'Months forecast ahead', value: '6' },
      ],
      modelComparison: [
        { name: 'Prophet', accuracy: 82.2, chosen: false },
        { name: 'SARIMA', accuracy: 82.2, chosen: false },
        { name: 'Trend + Seasonal (deployed)', accuracy: 83.3, chosen: true },
      ],
      featureImportance: [
        { feature: 'November', coefficient: 36428 },
        { feature: 'December', coefficient: 28369 },
        { feature: 'February', coefficient: -28275 },
        { feature: 'September', coefficient: 25690 },
        { feature: 'January', coefficient: -18657 },
        { feature: 'July', coefficient: -11176 },
        { feature: 'April', coefficient: -10824 },
        { feature: 'June', coefficient: -10212 },
      ],
      narrative: [
        {
          heading: 'The problem — predicting forward, not scoring a snapshot',
          body: 'Forecast next month\'s retail sales from ~4 years of real order history (Superstore dataset, 9,800 transactions, 2015-2018). Every prior project here answered "given this row, what\'s the label/price" — a single snapshot in time. This one is different: the answer depends on the whole sequence leading up to it, and the evaluation has to respect time order too — shuffling months into a random train/test split would leak the future into training, so the split is strictly the last 6 months held out chronologically.',
        },
        {
          heading: 'From transactions to a real time series',
          body: 'The raw data is one row per order line item, not one row per day — the first real step was aggregating it into a proper regular time series. Daily aggregation was considered and rejected: with under 10,000 orders spread across 4 years, most individual days would be sparse or empty, producing a noisy series. Monthly aggregation (via pandas resample, which correctly fills order-free periods with 0 rather than silently dropping them) gave a clean 48-point series.',
        },
        {
          heading: 'Confirming the pattern before modeling it',
          body: 'A formal seasonal decomposition (trend/seasonal/residual) confirmed what a first look at the numbers suggested: a genuine upward trend (roughly $888/month growth on average) plus a strong, consistent yearly cycle — November and December reliably far above trend (holiday shopping), February reliably the weakest month. The leftover residual looked like real noise, not a missed pattern, which is what you want to see before trusting the decomposition.',
        },
        {
          heading: 'Two tied models, then a deployment-driven third choice',
          body: 'Prophet and SARIMA — both purpose-built for trend-plus-seasonality data, unlike anything used in the earlier projects — landed within $100 of each other on the same held-out 6 months (MAE $14,501 vs $14,601, both ~17.8% average error). With only 6 test points, there isn\'t enough data for a meaningful significance test the way earlier projects used one; the practical tiebreaker was that SARIMA threw a data-sufficiency warning on the seasonal component (three-plus years isn\'t quite enough to fully trust it) while Prophet didn\'t, favoring Prophet for the analysis. For deployment, a further consideration took over: both models carry real dependency weight (Prophet needs a compiled statistical backend; SARIMA needs a heavier statistics library) for a tied-accuracy choice. The deployed API instead implements the same core idea directly — a fitted linear trend plus a repeating monthly seasonal adjustment — with zero extra dependencies, and it verified at 16.7% average error on the identical test months, competitive with both heavier options.',
        },
      ],
      skillsDemonstrated: [
        'Aggregating transaction-level data into a proper, gap-free time series (not just resampling blindly)',
        'Chronological train/test splitting instead of random splitting, and explaining why random splitting would leak information here specifically',
        'Formal seasonal decomposition (trend/seasonal/residual) before choosing a model, not after',
        'Selecting time-series-native models (Prophet, SARIMA) instead of defaulting to the classification/regression toolkit used in every prior project',
        'Recognizing when a test set is too small for a meaningful significance test, rather than running one anyway',
        'Weighing deployment cost (dependency weight) as a real factor in model choice, not just accuracy',
        'Reimplementing a tied model\'s core mechanism directly when the off-the-shelf library isn\'t worth its deployment cost',
      ],
    },
    {
      slug: 'movie-recommendation-system',
      title: 'Movie Recommendation System',
      tagline:
        'Collaborative filtering that barely beat a trivial baseline — and the honest write-up says so, instead of dressing up a marginal win.',
      categoryKey: 'ml',
      summary:
        'A MovieLens-based recommender (100K ratings, 610 users) — the first project in this series with no label to predict at all, just patterns in who rated what. The interesting result isn\'t a clean win: the "smart" model only narrowly beat guessing everyone\'s average, a real finding worth explaining rather than hiding.',
      github: 'https://github.com/SaudDSxAI/movie-recommender',
      live: '',
      tech: ['Python', 'scikit-surprise', 'scikit-learn', 'pandas', 'FastAPI', 'React'],
      hasLiveDemo: true,
      demoKey: 'movies',
      accentColor: 'fuchsia',
      icon: 'clapperboard',
      comparisonMetricKey: 'accuracy',
      comparisonMetricLabel: 'Rating Accuracy',
      heroMetrics: [
        { label: 'Users', value: '610' },
        { label: 'Movies (after filtering)', value: '2,269' },
        { label: 'Ratings used', value: '81,116' },
        { label: 'Matrix sparsity', value: '98.3%' },
      ],
      modelComparison: [
        { name: 'Baseline (averages only)', accuracy: 81.2, chosen: false },
        { name: 'SVD (collaborative filtering)', accuracy: 81.2, chosen: true },
        { name: 'KNN (similar users)', accuracy: 80.0, chosen: false },
      ],
      narrative: [
        {
          heading: 'A genuinely different kind of problem',
          body: 'Recommend movies from the MovieLens dataset (100,836 ratings, 610 users, 9,742 movies). Unlike every prior project, there\'s no target column to predict — no churn label, no price, no future month. The task is to find structure in who rated what, from a matrix that\'s 98.3% empty (each user has rated under 2% of all movies), and use that structure to guess what an empty cell might have been.',
        },
        {
          heading: 'The long tail problem',
          body: 'Every user in this dataset has at least 20 ratings (MovieLens pre-filters for that), but movies are a different story — the median movie has just 3 ratings, and half of all 9,742 movies have essentially no signal to learn from. Filtering to movies with 10+ ratings cut the movie count by 77% (down to 2,269) while keeping 81% of the actual rating data — confirmation that a small number of popular movies account for most of the real signal, and trying to model the barely-rated long tail would mostly add noise.',
        },
        {
          heading: 'A win that barely counts as one',
          body: 'SVD (matrix factorization — the standard collaborative filtering technique) scored RMSE 0.8468, beating a baseline-only model (0.8475, which only accounts for "some users rate high" and "some movies get rated high," no deeper pattern-finding) by a razor-thin margin, and clearly beating a KNN similar-users approach (0.9001, the worst of the three). SVD is the right pick on evidence, but the honest headline is that with only 81K ratings, there wasn\'t much room for a more sophisticated method to meaningfully outperform the simple one — a real, worth-stating limitation rather than a result to spin as a clean win.',
        },
        {
          heading: 'What the recommendations actually looked like',
          body: 'Sanity-checking with real output mattered here: asking the model for a specific user\'s top picks returned genuinely excellent, broadly-acclaimed films (Shawshank Redemption, Seven Samurai, Spirited Away) — good movies, but ones that look more like "generally beloved classics" than picks tailored to that one person\'s specific taste. That observation lines up with the RMSE finding: a model only marginally ahead of a non-personalized baseline should be expected to lean on broad appeal rather than sharp personalization, and it did.',
        },
        {
          heading: 'From rating prediction to item similarity',
          body: 'The deployed live demo uses a different, more interactive framing than the analysis: instead of predicting a specific existing user\'s ratings, it computes item-item similarity from the same matrix factorization (via scikit-learn\'s TruncatedSVD, avoiding scikit-surprise as a production dependency) — pick movies you actually like, get real similar movies back. Checking it against Toy Story returned Aladdin, Lion King, Beauty and the Beast, and Toy Story 2 — a far more immediately convincing result than the rating-prediction numbers alone would suggest, since genre and style patterns come through clearly in the item similarity even though personalized rating prediction was only marginally better than guessing.',
        },
      ],
      skillsDemonstrated: [
        'Understanding an unlabeled, structure-finding problem (collaborative filtering) as distinct from every supervised problem in this series',
        'Recognizing and quantifying data sparsity as the defining challenge of a problem, before choosing a technique',
        'Long-tail filtering with an explicit tradeoff check (rows lost vs. movies lost)',
        'Reporting a marginal win honestly instead of overstating it — the model beat the baseline, but barely, and the write-up says so',
        'Qualitative sanity-checking of model output (reading actual recommendations) to catch a limitation that the RMSE number alone didn\'t make obvious',
        'Reimplementing a technique with lighter dependencies for deployment (TruncatedSVD via scikit-learn instead of scikit-surprise), consistent with the same tradeoff made in the sales forecasting project',
        'Choosing a different, more interactive live-demo framing (item similarity) than the analysis technique (rating prediction) when it better serves the audience',
      ],
    },
  ],
  dl: [
    {
      slug: 'movie-review-sentiment-analysis',
      title: 'Movie Review Sentiment Classifier',
      tagline:
        'A pretrained-embedding LSTM trained from scratch on 50,000 reviews — and an honest comparison against a classical baseline that beat it.',
      categoryKey: 'dl',
      summary:
        'A sentiment classifier built on 50,000 IMDB movie reviews, using GloVe pretrained word embeddings feeding into an LSTM trained with proper checkpointing to avoid overfitting. Deployed alongside a classical TF-IDF + Logistic Regression baseline for a fair comparison — which the baseline actually won, a real and reported finding rather than a hidden one.',
      github: 'https://github.com/SaudDSxAI/sentiment-classifier',
      live: '',
      tech: ['Python', 'PyTorch', 'GloVe Embeddings', 'LSTM', 'scikit-learn', 'FastAPI', 'React'],
      hasLiveDemo: true,
      demoKey: 'sentiment',
      accentColor: 'indigo',
      icon: 'messageSquareText',
      comparisonMetricKey: 'accuracy',
      comparisonMetricLabel: 'Accuracy',
      heroMetrics: [
        { label: 'Accuracy', value: '87.3%' },
        { label: 'F1 score', value: '0.873' },
        { label: 'Reviews trained on', value: '40,000' },
        { label: 'Vocabulary size', value: '40,000' },
      ],
      modelComparison: [
        { name: 'TF-IDF + Logistic Regression', accuracy: 89.7, chosen: false },
        { name: 'GloVe + LSTM (deployed)', accuracy: 87.3, chosen: true },
      ],
      confusionMatrix: { tn: 4367, fp: 633, fn: 639, tp: 4361 },
      finalMetrics: { precision: 0.8732, recall: 0.8722, f1: 0.8727, accuracy: 0.8728 },
      narrative: [
        {
          heading: 'The problem',
          body: 'Classify 50,000 IMDB movie reviews as positive or negative — a perfectly balanced binary classification dataset (25,000 of each), with review lengths ranging from 4 to 2,470 words. The goal for this project specifically was to prove out a real deep learning skill set: using pretrained embeddings as a transfer-learning foundation and training a sequence model (LSTM) on top, as opposed to the tree-based and linear models used throughout the rest of this portfolio\'s ML case studies.',
        },
        {
          heading: 'Approach',
          body: 'Reviews were cleaned (HTML tags stripped, lowercased, non-letters removed) and tokenized into a 40,000-word vocabulary, covering the vast majority of actual word occurrences in the training data. Each word was mapped to a pretrained 100-dimensional GloVe vector (91.1% vocabulary coverage) — these vectors were frozen, not fine-tuned, so the model starts with real word meaning instead of learning it from scratch on a comparatively small dataset. On top of that, a single-layer LSTM reads each 200-word-padded review in sequence and a final linear layer outputs a positive/negative score.',
        },
        {
          heading: 'Catching overfitting with real checkpointing, not guesswork',
          body: 'An earlier training run showed the exact overfitting signature: training loss kept falling for 15 straight epochs while test accuracy peaked at epoch 10 (86.7%) and then declined as the model kept training past that point, becoming increasingly biased toward predicting "positive." Because that run didn\'t save intermediate weights, the best-performing version was unrecoverable once training continued past it — a real, common mistake. The fix was proper methodology: retrain from a fresh model, evaluate on the test set after every epoch, and only persist the weights when test accuracy actually improves. That run automatically landed on epoch 12 as the true best checkpoint (87.28%), regardless of what happened in the noisier epochs after it.',
        },
        {
          heading: 'An honest result: the simple baseline won',
          body: "For a fair comparison — the same discipline applied to every project in this portfolio — a classical TF-IDF + Logistic Regression baseline was trained on the identical train/test split. It scored 89.7% accuracy, beating the LSTM's 87.3%. This is a well-known, real phenomenon in NLP: bag-of-words models are extremely strong on sentiment tasks, and a fairly small, single-layer LSTM with frozen embeddings and modest training doesn't automatically beat one. Closing that gap would need a bigger architecture (bidirectional layers, fine-tuned embeddings, more epochs) or a pretrained transformer — outside the scope of what this project set out to demonstrate. The LSTM is still what's deployed below, because the point of this project was proving out the transfer-learning-plus-sequence-model technique, not chasing the top accuracy number by any means necessary — and reporting the baseline's win, rather than omitting it, is the more useful engineering signal.",
        },
      ],
      skillsDemonstrated: [
        'Transfer learning with pretrained word embeddings (GloVe) frozen into a trainable neural network',
        'Sequence modeling with LSTMs in PyTorch, including text tokenization, vocabulary construction, and padding',
        'Diagnosing overfitting from a real training run, then fixing the methodology with per-epoch checkpointing rather than guesswork',
        'Fair benchmarking against a classical baseline (TF-IDF + Logistic Regression) on an identical train/test split',
        'Reporting a loss against a simpler method honestly instead of hiding or reframing it',
        'CPU-only deep learning practicality: choosing frozen embeddings and a lightweight architecture given real hardware constraints',
        'Full-stack deployment of a PyTorch model behind a FastAPI endpoint with a live React demo',
      ],
    },
  ],
  production: [
    {
      slug: 'coter-global-recruitment-agent',
      title: 'COTER Global Recruitment Agent',
      tagline:
        'A multi-channel AI recruitment platform live at a real staffing firm — WhatsApp and Gmail screening agents, AI CV evaluation, and direct social publishing, running in production.',
      categoryKey: 'production',
      summary:
        'A full-stack recruitment automation platform built for and deployed at COTER Global, a UAE-focused staffing firm. AI agents run candidate screening conversations over WhatsApp and Gmail, score CVs against open job requirements, and generate and publish job postings directly to LinkedIn, Facebook, and Instagram — all backed by a candidate CRM, a recruitment pipeline, and a self-service candidate portal.',
      github: '',
      live: '',
      tech: [
        'Next.js', 'FastAPI', 'PostgreSQL', 'Redis', 'OpenAI', 'LangChain', 'FAISS',
        'Baileys (WhatsApp)', 'Gmail API', 'LinkedIn API', 'Meta Graph API', 'Docker', 'Railway',
      ],
      hasLiveDemo: false,
      accentColor: 'teal',
      icon: 'briefcase',
      heroMetrics: [
        { label: 'Candidates managed', value: '5,862' },
        { label: 'Channels automated', value: '5' },
        { label: 'Open requirements', value: '9' },
        { label: 'Status', value: 'Live in production' },
      ],
      screenshots: [
        {
          heading: 'Landing page',
          caption: "The public entry point at coter.ovallabs.org — candidates can start an application, sign in, or reach the firm directly via LinkedIn or WhatsApp. Construction/HSE-themed, matching COTER Global's actual recruitment niche.",
          image: '/screenshots/coter/landing-page.png',
        },
        {
          heading: 'Dashboard',
          caption: 'Real production numbers: 5,862 unique candidates and 9 open requirements, with live breakdowns of candidates by role and nationality, and candidate growth over time.',
          image: '/screenshots/coter/dashboard.png',
        },
        {
          heading: 'Candidates',
          caption: 'A searchable, filterable pool of nearly 6,000 candidates, including a natural-language AI filter ("Indian HSE Officers in Dubai with 5+ years") on top of the structured filters, plus bulk actions like assigning candidates or launching a WhatsApp campaign directly from a filtered list.',
          image: '/screenshots/coter/candidates.png',
        },
        {
          heading: 'Requirements',
          caption: 'Open job requirements, each created either through structured fields or by pasting a free-text brief into "Create Requirement via AI," which parses it into the structured fields automatically. Roles shown are real, live construction/HSE openings across the UAE.',
          image: '/screenshots/coter/requirements.png',
        },
        {
          heading: 'Recruitment pipeline',
          caption: 'A kanban view tracking every candidate through real recruitment stages — Assigned, Screening, Shortlisted, Interviewing, Offered, Selected — so recruiters can see exactly where each candidate stands without digging through messages.',
          image: '/screenshots/coter/pipeline.png',
        },
        {
          heading: 'WhatsApp automation',
          caption: 'Live campaign stats from the deployed bot: 256 messages sent, 46 replies, 174 flagged for recruiter review, across 4 active campaigns — with a daily send cap (300/day) to keep outreach within safe limits for the WhatsApp account.',
          image: '/screenshots/coter/whatsapp.png',
        },
        {
          heading: 'Gmail automation',
          caption: 'AI-classified, AI-replied email campaigns — separated into candidate campaigns and client campaigns, since the same automation also handles business-development outreach. Real reply rates shown per campaign (25%, 36%, 16%, 15%) across 120 candidates and 5 clients.',
          image: '/screenshots/coter/gmail.png',
        },
        {
          heading: 'Reminders',
          caption: 'Scheduled follow-ups over WhatsApp or Gmail, to an individual or a group, on a recurring daily or weekly schedule with timezone handling — so a recruiter never forgets to chase a client or candidate.',
          image: '/screenshots/coter/reminders.png',
        },
        {
          heading: 'Document generator',
          caption: 'Turns pasted context — email threads, pricing notes, plain-language instructions — into a formatted quotation or agreement, with a live preview before saving.',
          image: '/screenshots/coter/documents.png',
        },
        {
          heading: 'Poster generator',
          caption: "Real, connected OAuth integrations (Facebook page connected, LinkedIn and Instagram ready to connect) — generates a branded poster and platform-specific copy from an open requirement, then publishes it directly, not just as a draft.",
          image: '/screenshots/coter/posters.png',
        },
        {
          heading: 'Settings & team',
          caption: "The actual team using this daily — four real accounts (an admin and three team members) with role-based access, alongside team workload tracking, a system audit log, and AI configuration.",
          image: '/screenshots/coter/settings.png',
        },
        {
          heading: 'Candidate application (portal)',
          caption: "Candidates don't fill out a static form — they apply through a guided chat that walks them through uploading a CV and answering questions conversationally, feeding directly into the same candidate pipeline recruiters see internally.",
          image: '/screenshots/coter/candidate-portal.png',
        },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: 'COTER Global runs recruitment for construction, HSE, and technical roles across the UAE — high volume, multi-channel candidate sourcing (WhatsApp, email, social media, referrals) that was previously tracked across spreadsheets and manual conversations. The brief was to replace that with a single platform: one place to manage requirements, candidates, and outreach, with AI doing the repetitive parts (screening conversations, CV triage, job post copywriting) so recruiters spend their time on judgment calls, not data entry.',
        },
        {
          heading: 'Architecture',
          body: 'A Next.js frontend talks to a FastAPI backend (PostgreSQL for data, Redis for background-job locking and caching), with a separate Node.js microservice (using Baileys, a WhatsApp Web protocol library) handling the actual WhatsApp connection — kept isolated from the main API so a WhatsApp session drop never takes down the rest of the platform. An OpenAI + LangChain RAG assistant, grounded in a FAISS vector store of company-specific knowledge, powers both an internal AI assistant and a public chat widget on the company website. The whole stack is containerized and deployed on Railway.',
        },
        {
          heading: 'AI-driven candidate screening, on the channels candidates actually use',
          body: "Instead of a form candidates have to fill out, screening happens as a real conversation over WhatsApp or Gmail. The AI agent asks for the specific fields a given job requirement needs (visa status, experience, salary expectations, certifications), tracks what's been collected versus what's still missing across the conversation, and hands off a structured, scored profile to the recruiter once screening completes — with an AI-generated priority (high/medium/low) and reasoning attached, not just a raw transcript to re-read.",
        },
        {
          heading: 'CV intelligence and the recruitment pipeline',
          body: "Uploaded CVs are parsed and scored against a specific job requirement's criteria automatically, with results feeding a kanban-style pipeline view so recruiters can see where every candidate stands at a glance. Candidates themselves don't fill out a static form — the public candidate portal is a guided chat that walks them through uploading a CV and answering a few questions conversationally, feeding directly into the same pipeline recruiters use internally. A duplicate-detection tool (admin-only) catches the same candidate re-submitted under slightly different details — a real, recurring problem in high-volume recruitment databases.",
        },
        {
          heading: 'One job requirement, five channels, without rewriting the copy five times',
          body: "Posting a new job opening used to mean manually writing separate copy for LinkedIn, Facebook, Instagram, and WhatsApp, each with a different tone and format. The poster generator does this in one step — AI writes channel-appropriate copy for all four, generates a matching graphic, and publishes directly to LinkedIn, Facebook, and Instagram through their own OAuth-authenticated APIs. This is real publishing, not a draft queue: connecting each platform is a genuine OAuth flow with token storage and refresh handling per channel.",
        },
        {
          heading: 'Production details that matter more than the AI features',
          body: "A few unglamorous engineering choices are what actually make this reliable in production: every auto-reply is guarded by a pre-send idempotency record (so a crash or retry can never double-send a message to a candidate), background schedulers (WhatsApp reminders, Gmail polling, daily digest emails) acquire a Redis lock before running so a redeploy or multiple instances can't fire the same job twice, and every database migration is written as an additive, existence-checked ALTER — never a destructive drop — so upgrading the schema in place never risks the live client's data.",
        },
      ],
      skillsDemonstrated: [
        'Multi-channel conversational AI agents (WhatsApp, Gmail) with stateful, field-tracking screening flows rather than static forms',
        'AI-driven CV evaluation and candidate scoring against structured job requirements',
        'Retrieval-augmented chatbot grounded in company-specific knowledge (OpenAI + LangChain + FAISS)',
        'Real OAuth-based multi-platform publishing (LinkedIn, Facebook, Instagram Graph APIs), not just draft generation',
        'Production reliability patterns: pre-send idempotency to prevent duplicate sends, Redis-locked background schedulers, additive-only database migrations',
        'Service isolation for stability — an unofficial WhatsApp protocol library run as its own microservice, so a dropped session never takes down the core API',
        'Full-stack ownership across a real client deployment: Next.js, FastAPI, PostgreSQL, Redis, Docker, Railway',
        'Role-based access control and a self-service candidate portal embeddable on the client\'s own website',
      ],
    },
    {
      slug: 'zyp-assembly-qc-system',
      title: 'ZYP Assembly QC System',
      tagline:
        'A station-by-station quality control platform live on an electric motorcycle assembly line — 14 stations, 62 tracked tasks, and a final pre-delivery gate before any bike ships.',
      categoryKey: 'production',
      summary:
        'A quality control platform (internally named Asteria) built for and deployed at ZYP Technologies, an electric motorcycle manufacturer. Operators work through station-based checklists as a bike moves down the assembly line, a registered verifier signs off on completed inspections, and a separate Pre-Delivery Inspection gate catches anything before a bike is cleared to ship — with live analytics surfacing real pass rates, not vanity metrics.',
      github: '',
      live: '',
      tech: ['Next.js', 'FastAPI', 'PostgreSQL', 'Google Sheets API', 'Docker', 'Railway'],
      hasLiveDemo: false,
      accentColor: 'orange',
      icon: 'bike',
      heroMetrics: [
        { label: 'Deployed at', value: 'ZYP Technologies' },
        { label: 'Assembly stations', value: '14' },
        { label: 'Tracked tasks', value: '62' },
        { label: 'Status', value: 'Live in production' },
      ],
      screenshots: [
        {
          heading: 'Sign in',
          caption: "The branded entry point — 'Control every assembly checkpoint from station setup to final sign-off.' Three roles laid out up front: managers define stations and checkpoints, operators record pass/fail results with photos, and QC leads lock stations and export inspection history.",
          image: '/screenshots/qc/login.png',
        },
        {
          heading: 'Dashboard',
          caption: 'Live production numbers, not a mockup: 50% pass rate across 2 recent inspections, 3 PDI reports, 33% PDI clearance rate. Time-windowed (7 days / 30 days / 3 months / all time) so a manager can see today\'s line performance or the long-term trend.',
          image: '/screenshots/qc/dashboard-overview.png',
        },
        {
          heading: 'Inspection deep-dive',
          caption: 'Drills from the dashboard into individual inspection units (each tagged bike, with per-unit pass rate and how many of its stations are locked) down to per-station label analytics — which specific checkpoints are passing or failing across the whole line.',
          image: '/screenshots/qc/inspection-deepdive.png',
        },
        {
          heading: 'PDI deep-dive',
          caption: 'Pre-Delivery Inspection analytics, tracked completely separately from in-line station inspections: clearance rate, first-pass rate, and a full checklist section breakdown (Tyre, Accessories, Electrical Work, Functionality Tests, and more) each with their own pass counts.',
          image: '/screenshots/qc/pdi-deepdive.png',
        },
        {
          heading: 'Inline quality inspection',
          caption: 'The working list of in-progress and completed inspections — each one a real, tagged unit moving through the line, with live progress (e.g. "9/14" stations complete), pass/fail status, and one-click resume or edit.',
          image: '/screenshots/qc/inspections-list.png',
        },
        {
          heading: 'Pre-delivery inspection reports',
          caption: 'PDI reports only appear here once a unit\'s in-line inspection is fully complete — each one shows its checklist completion (e.g. "43/43") and whether it\'s ready, pending, or flagged for rework, linked back to its original inspection ID.',
          image: '/screenshots/qc/pdi-reports.png',
        },
        {
          heading: 'Admin overview',
          caption: 'Real operational numbers from the live deployment: 5 of 5 operator accounts active, 14 stations configured across 11 grouped areas, 3 of 3 sign-off verifiers active. Tabs for managing operators, verifiers, task assignments, settings, and security all live in this one admin workspace.',
          image: '/screenshots/qc/admin-overview.png',
        },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: 'ZYP Technologies builds electric motorcycles, and quality control across a multi-station assembly line was tracked without a system built for it — no structured, auditable record of which checkpoints a specific unit passed, who verified it, or where in the process something failed. The brief: a real QC system with accountability built in, where every task on every station is tied to a specific unit, a specific operator, and a timestamp, with a final gate before anything is cleared to ship.',
        },
        {
          heading: 'Architecture',
          body: "A Next.js frontend (a single, tightly-scoped workspace with lazily-loaded sections rather than a sprawling multi-page site) talks to a FastAPI backend on PostgreSQL, deployed on Railway. A background service syncs completed station data straight into a Google Sheet the moment a station is locked — the client's team was already used to spreadsheets for cross-checking, so this meant zero workflow disruption instead of asking them to abandon a tool they trusted.",
        },
        {
          heading: 'Two-tier quality control: station inspections, then a separate final gate',
          body: "The system deliberately models QC as two distinct layers, not one. In-line inspections track a unit through 14 real assembly stations (62 tasks total, grouped into 11 areas) as it's built — an operator works through each station's checklist, and a registered verifier signs off once it's complete. Separately, a Pre-Delivery Inspection only appears once a unit's in-line inspection is fully done, and re-checks final readiness (tyres, accessories, electrical work, functionality tests) before a unit is cleared to ship. Keeping these separate means a station-level failure and a pre-delivery failure are two different, independently-tracked signals — not lumped into one pass/fail number.",
        },
        {
          heading: 'Analytics that show the real number, not a flattering one',
          body: "The dashboard reports a 33% PDI first-pass rate in the current deployment data — reported as-is, because the whole point of building this system was to surface exactly that kind of number where it would otherwise be invisible. Deep-dive views break it down further: per-unit pass rates, per-checkpoint label analytics across the whole line, and a full PDI checklist section breakdown, all filterable by time window (7 days, 30 days, 3 months, all time) so a manager can tell a bad week from a real trend.",
        },
        {
          heading: 'Scope discipline: a real feature, deliberately kept off the operator-facing UI',
          body: "The backend has a full CRUD API for managing inspection templates — creating and editing stations, sections, and tasks, including file uploads — but no frontend page calls it. That's intentional, not an oversight: station and task configuration changes rarely once a line is set up, so exposing a full template builder to end users would have added UI surface and risk for a feature used maybe a handful of times. It's managed directly through the API for now, with the option to build a real admin UI for it later if the client's needs change.",
        },
      ],
      skillsDemonstrated: [
        'Modeling a two-tier QC system (in-line station inspections + an independent Pre-Delivery Inspection gate) as genuinely separate tracked signals, not one flattened pass/fail number',
        'Time-windowed analytics (7 days / 30 days / 3 months / all time) built directly on live production data, including per-station and per-checkpoint drill-down views',
        'Event-triggered background integration (Google Sheets sync on station lock) designed around the client\'s existing workflow instead of replacing it',
        'Deliberate scope discipline — a full CRUD API built for template management, intentionally left off the UI to keep the operator-facing surface focused for actual usage',
        'Role-based workflow design (operator vs. manager) with a formal sign-off/verification step for accountability',
        'Reporting and export (PDF-style reports, CSV/Excel) tied to a real audit trail per inspection',
        'Full-stack ownership of a real client deployment: Next.js, FastAPI, PostgreSQL, Railway',
      ],
    },
    {
      slug: 'oval-labs-outreach-tool',
      title: 'Oval Labs Outreach Tool',
      tagline:
        'An AI cold-email platform built and used internally at Oval Labs itself — the same system that helped land the other two companies in this section as clients.',
      categoryKey: 'production',
      summary:
        'A self-built AI-powered outreach platform Oval Labs uses for its own client acquisition: upload a lead list, AI writes a personalized cold email per lead, send through Gmail with rate limiting, then let an automatic multi-step follow-up sequence and IMAP-based reply/bounce detection take over — with a kanban board and a categorized reply inbox to work leads from there.',
      github: '',
      live: '',
      tech: ['Next.js', 'FastAPI', 'PostgreSQL', 'OpenAI', 'Gmail SMTP', 'IMAP', 'Railway'],
      hasLiveDemo: false,
      accentColor: 'cyan',
      icon: 'send',
      heroMetrics: [
        { label: 'Built for', value: 'Oval Labs (internal)' },
        { label: 'Follow-up steps', value: '3' },
        { label: 'Daily send limit', value: '150' },
        { label: 'Status', value: 'Live in production' },
      ],
      screenshots: [
        {
          heading: 'New campaign',
          caption: "The four-step flow: upload a leads list (Excel/CSV, validated for company name and email), configure AI tone and sender identity, then generate and review AI-drafted emails before launch. Multi-workspace support (the 'haha' workspace switcher, top right) means separate campaigns don't mix leads or sending identities.",
          image: '/screenshots/outreach/new-campaign.png',
        },
        {
          heading: 'Data pipeline',
          caption: 'The live working view of a campaign — real leads (TalentBridge Solutions, PeakHire Consulting) with tracked status, plus aggregate stats: total leads, remaining, failed sends, contacted, sent today, total sent, reply rate, and open rate, all computed from real send/tracking data.',
          image: '/screenshots/outreach/pipeline.png',
        },
        {
          heading: 'Replies inbox',
          caption: "Replies are pulled automatically from the inbox over IMAP and sorted into working categories — New, Needs Response, Interested, Booked, Not Interested — so following up on a real reply doesn't mean re-reading an entire inbox by hand.",
          image: '/screenshots/outreach/replies.png',
        },
        {
          heading: 'Kanban board',
          caption: 'A drag-and-drop view of every lead\'s position in the outreach sequence — New Leads, Step 1 Sent, Step 2 Sent, Step 3 Sent — so it\'s immediately visible how far each lead has progressed without opening a spreadsheet.',
          image: '/screenshots/outreach/kanban.png',
        },
        {
          heading: 'Account settings',
          caption: "Real sending controls, not just cosmetic settings: a daily send limit (150) and per-send delay to stay within Gmail's safe sending thresholds, configurable day-delays between each follow-up step, and two advanced deliverability features — Inbox Warm-up (auto-simulating replies to build sender reputation) and A/B testing mode (automatically splitting sequence variations when generating).",
          image: '/screenshots/outreach/settings.png',
        },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: "Oval Labs needed a real client-acquisition channel — manually researching leads, writing personalized outreach, and tracking replies and follow-ups in a spreadsheet doesn't scale past a handful of prospects a week. This tool is the direct answer: it's the actual system used to reach and land clients, including the two other companies featured in this Production Systems section.",
        },
        {
          heading: 'Architecture',
          body: 'A Next.js frontend and FastAPI backend on PostgreSQL, deployed on Railway. Sending goes through Gmail SMTP directly (not a third-party email API), with reply and bounce detection both implemented over IMAP against the same inbox — polling and parsing real email headers and bodies rather than depending on a paid deliverability platform.',
        },
        {
          heading: 'AI writing that adapts per follow-up step, not a template with fields swapped in',
          body: "The initial cold email and each follow-up step use separate AI prompts — a follow-up email deliberately takes a different angle than the first touch (different value proposition, different framing) rather than just re-sending the same pitch with a 'following up' line added, which is what most cold-email tools actually do. Follow-up cadence is fully configurable per step (day 2, day 3, day 4+) rather than a fixed interval.",
        },
        {
          heading: 'Real deliverability engineering, not just AI copywriting',
          body: "The AI-generated email is the visible part, but the settings that actually determine whether a campaign works are the send-rate controls: a daily send cap and per-message delay to stay under Gmail's spam thresholds, plus two advanced features — Inbox Warm-up, which auto-simulates replies to build sending reputation before a real campaign goes out, and A/B testing mode, which automatically generates sequence variations to test what actually gets replies. These are the unglamorous parts of cold email that determine whether messages land in an inbox or a spam folder, and they got the same engineering attention as the AI generation itself.",
        },
        {
          heading: 'Multi-workspace support',
          body: "Campaigns are scoped to switchable workspaces rather than one global lead list — so different campaigns, sender identities, and lead pools stay cleanly separated instead of accumulating into one undifferentiated pile as outreach volume grows.",
        },
      ],
      skillsDemonstrated: [
        'Building and operating the actual growth infrastructure for a real company, not just a client deliverable — this tool is how Oval Labs itself acquires clients',
        'AI email generation that varies meaningfully by sequence step (different angle per follow-up) rather than templated re-sends',
        'IMAP-based reply and bounce detection against a live Gmail inbox, with automatic reply categorization',
        'Deliverability-focused engineering: send-rate limiting, configurable follow-up cadence, inbox warm-up, and automatic A/B sequence variation',
        'Multi-workspace data isolation for running separate campaigns without cross-contamination',
        'Full-stack ownership: Next.js, FastAPI, PostgreSQL, deployed and actively used in production on Railway',
      ],
    },
    {
      slug: 'truesight-deepfake-detection',
      title: 'TrueSight — AI Deepfake Detection System',
      tagline:
        'A freelance-built forensic tool that checks video and audio for AI manipulation using two real published detection models, plus a rule-based metadata forensics layer that has nothing to do with either model.',
      categoryKey: 'production',
      summary:
        "A deepfake detection system built as freelance client work: upload a video or audio file and it runs three independent layers of analysis — a published video deepfake detection model (frame sampling, face detection, and a 2-factor consensus rule), a published audio deepfake detection model (segment-by-segment timeline scoring), and a rule-based forensic metadata scanner that flags re-encoding signatures, suspicious compression, and stripped metadata, none of which depend on either AI model. Pre-flight quality checks grade whether a file is even good enough to trust the result before committing to full analysis.",
      github: '',
      live: '',
      tech: ['Python', 'FastAPI', 'PyTorch', 'HuggingFace Transformers', 'MTCNN', 'FFmpeg', 'React', 'SQLite'],
      hasLiveDemo: false,
      accentColor: 'pink',
      icon: 'scanSearch',
      heroMetrics: [
        { label: 'Analysis layers', value: '3' },
        { label: 'Video frames sampled', value: '40' },
        { label: 'Decision logic', value: '2-factor' },
        { label: 'Status', value: 'Delivered to client' },
      ],
      architectureBlurb: "Three independent layers run on whatever gets uploaded — the two AI models never see each other's output, and the forensic scanner doesn't need either of them to flag a suspicious file.",
      architecture: [
        {
          title: 'Video path',
          items: ['MTCNN face detection + margin crop', 'Quality filter (size + blur) before inference', 'yermandy/deepfake-detection (LNCLIP) on 40 sampled frames'],
        },
        {
          title: 'Audio path',
          items: ['FFmpeg-normalized to 16kHz mono', 'MelodyMachine Wav2Vec2 deepfake classifier', 'Segment-by-segment timeline scoring'],
        },
        {
          title: 'Forensic metadata',
          items: ['FFmpeg probe of container + codec info', 'Point-deduction scoring from 100', 'Flags re-encoding, compression mismatch, stripped tags'],
        },
      ],
      screenshots: [
        {
          heading: 'Upload',
          caption: 'The entry point — drag-and-drop upload supporting a wide format range (WhatsApp audio, MP4, MOV, MKV, MP3, WAV, OPUS) up to 100MB, framed clearly as a multi-modal detection engine rather than a single-model demo.',
          image: '/screenshots/truesight/upload.png',
        },
      ],
      narrative: [
        {
          heading: 'The brief',
          body: "Freelance client work: build a tool that can look at an uploaded video or audio clip and give a real, defensible answer on whether it's likely AI-generated or manipulated — not just a single probability number with no way to sanity-check it.",
        },
        {
          heading: 'Two real models, not one glued-on demo',
          body: "Video and audio each get their own dedicated, published detection model rather than one general-purpose model stretched across both. Video runs through MTCNN face detection with margin-cropping and a blur/size quality filter before any frame reaches the deepfake model itself — low-quality faces are excluded rather than fed in and hoped for the best. The video decision requires both a high average fake-probability across sampled frames AND majority agreement across those frames, so a handful of anomalous frames in an otherwise-clean video won't flip the verdict.",
        },
        {
          heading: 'Audio gets a timeline, not just a verdict',
          body: "Rather than one score for an entire clip, audio is split into segments and each is scored independently, so the result includes a full timeline — useful for pointing at exactly where in a clip something looks synthetic rather than a single opaque number. Longer clips fall back to a segment-averaged estimate instead of a slow full-pass, keeping analysis time reasonable.",
        },
        {
          heading: 'A forensic layer that owes nothing to either AI model',
          body: "Separately from both detection models, every file gets probed for its own container-level tells: re-encoding signatures from tools like FFmpeg or Adobe Premiere, a resolution/bitrate mismatch consistent with double compression, stripped or missing metadata, and filename patterns consistent with social media transit. Each starts a file at a perfect integrity score and deducts points per flag — a second, independent signal that doesn't rely on either neural network being right.",
        },
        {
          heading: 'Checking if the file is even worth analyzing',
          body: "Before committing to a full model pass, dedicated face- and audio-quality checks grade whether the input is actually good enough to trust — face size, blur (via Laplacian variance), brightness, and contrast are scored and combined into a usability grade with a specific recommendation, rather than silently returning a low-confidence result on unusable input and letting the user assume the model just wasn't sure.",
        },
      ],
      skillsDemonstrated: [
        'Integrating two independent, published deep learning models (video + audio deepfake detection) from HuggingFace into one coherent pipeline',
        'Consensus-based decision logic (probability threshold AND frame/segment agreement) to reduce false positives from isolated anomalous samples',
        'Building an independent, rule-based forensic layer (metadata/re-encoding analysis) that corroborates AI verdicts without depending on them',
        'Pre-flight input quality assessment (face and audio) with actionable recommendations, instead of returning low-confidence results on unusable input silently',
        'Robust media format handling via FFmpeg (WhatsApp audio, MP4, MOV, MKV, MP3, WAV, OPUS) for real-world file variety, not just clean lab-format input',
        'Delivering a complete freelance client product: upload, background processing, history, and PDF report export, not just a model in a notebook',
      ],
    },
    {
      slug: 'hse-performance-tracker',
      title: 'HSE Performance Tracker',
      tagline:
        'A multi-tenant construction safety compliance platform tracking 30 real HSE fields per worker per day — freelance-built for a UAE construction client, live and in use.',
      categoryKey: 'production',
      summary:
        "A safety (Health, Safety, Environment) compliance platform built as freelance work for a UAE-based construction client: organizations manage multiple projects, each with sections and workers, and every worker gets a daily log covering 30 distinct real HSE compliance fields — task briefings, toolbox talks, safety observations, NCR closures, safety walks, training sessions, and more — rolled up into a live performance score and monthly KPI tracking. Multi-tenant from the ground up, with project-level access control so a site lead only sees the projects they're assigned to.",
      github: '',
      live: '',
      tech: ['React', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Tailwind CSS', 'Railway'],
      hasLiveDemo: false,
      accentColor: 'zinc',
      icon: 'hardHat',
      heroMetrics: [
        { label: 'Daily log fields', value: '30' },
        { label: 'Access tiers', value: '3' },
        { label: 'Multi-tenant', value: 'Yes' },
        { label: 'Status', value: 'Live for client' },
      ],
      screenshots: [
        {
          heading: 'Projects dashboard',
          caption: 'Real data from the live deployment: a construction project in the UAE, 123 manpower, 3,000 man-hours, 23 inductions, tagged by work type (Excavation, Lifting, Marine), sitting at a 90% "Excellent" performance score.',
          image: '/screenshots/hse-tracker/projects.png',
        },
        {
          heading: 'Project performance overview',
          caption: 'A configurable audit timeframe (7 days up to 1 year, or a custom range), an overall project score gauge, a score-distribution breakdown, and the roster of workers being tracked under that project — each with their own live score.',
          image: '/screenshots/hse-tracker/project-overview.png',
        },
        {
          heading: 'Individual worker detail',
          caption: "A week/month/year trend chart per field, and the full 30-field Daily Monitoring grid for a specific date — attendance, inductions, barcode compliance, task briefings, TBT, violations, SOR/NCR closure, mock drills, safety walks, training, and more — plus monthly KPI totals below it.",
          image: '/screenshots/hse-tracker/candidate-detail.png',
        },
      ],
      narrative: [
        {
          heading: 'The brief',
          body: "Freelance client work for a UAE construction company: replace manual, paper-based HSE compliance tracking with a real system — one place to see, per worker and per project, whether the actual safety processes (briefings, toolbox talks, inspections, NCR closures) are happening, not just whether an incident has occurred.",
        },
        {
          heading: 'Real domain depth, not a generic checklist app',
          body: "The 30 daily-log fields aren't generic placeholders — they're specific, real construction-site HSE practices: TBT (toolbox talks), SOR/NCR (site observation reports / non-conformance reports), MSRA (method statement risk assessment communication), PTW-linked barcode compliance, mock drills, and welfare facility monitoring, among others. Getting the data model right meant encoding the client's actual safety process, not a generic 'yes/no' form.",
        },
        {
          heading: 'Multi-tenant, with real access boundaries',
          body: "Organizations, users, and projects are modeled properly for multi-tenancy: a user has a role (admin, lead, or viewer) and is explicitly assigned to specific projects through a join table, so a site lead sees only the projects they're responsible for rather than every project in the system. This was built to actually support more than one client/organization on the same platform, not just one company's data with a login screen in front of it.",
        },
        {
          heading: 'A real bug, caught by a real test',
          body: "A dedicated regression test was written specifically to check whether monthly KPI history was retrievable across multiple months — and it caught a real issue: the API was silently returning only the latest month's KPIs, flattened, with earlier months inaccessible. The current code fixes this by keying the response by month string, so a project's full KPI history is actually retrievable, not just the most recent snapshot. Writing a test that goes looking for exactly this kind of silent data-loss bug, rather than only testing the happy path, is the detail worth calling out here.",
        },
      ],
      skillsDemonstrated: [
        'Multi-tenant SaaS data modeling — organizations, role-based users, and project-level access control via an explicit assignment table',
        'Translating a real, detailed client safety process (30 distinct HSE compliance fields) into a correct, structured data model',
        'Writing a regression test that specifically targets silent data-loss bugs (flattened KPI history) rather than only the happy path',
        'Rolling up granular daily compliance data into project- and worker-level performance scores with configurable time windows',
        'Delivering and maintaining a real freelance client product — live in production, not a one-off delivery',
      ],
    },
  ],
  robotics: [
    {
      slug: 'agrobot-weed-detection-robot',
      title: 'AgroBot — Solar-Powered Autonomous Weed Removal Robot',
      tagline:
        'A solar-powered ground robot that autonomously covers a field in a zigzag pattern, stops on weed detection, and removes it with an onboard 2-axis gantry before continuing — a full perceive-stop-act-resume loop, not a detection demo.',
      categoryKey: 'robotics',
      summary:
        "A final year engineering project: an autonomous ground robot built from scratch — welded chassis, chain-drive wheels, solar power sized to run the motors directly, and a 2-axis gantry mechanism that physically removes a weed once it's found. A user-defined target area is covered via autonomous zigzag navigation; a YOLOv8 model on an NVIDIA Jetson Orin Nano handles detection, an Arduino Mega runs all mobility, coverage, and obstacle-avoidance logic, and an ESP32 connects the robot to a custom-built remote control interface.",
      github: '',
      live: '',
      tech: [
        'YOLOv8', 'NVIDIA Jetson Orin Nano', 'Arduino Mega', 'ESP32', 'Raspberry Pi Camera',
        'Python', 'GPS', 'MPU6050 IMU', '2-Axis Gantry', 'Roboflow',
      ],
      hasLiveDemo: false,
      accentColor: 'lime',
      icon: 'bot',
      heroMetrics: [
        { label: 'Detection mAP50', value: '95.6%' },
        { label: 'Precision', value: '89.8%' },
        { label: 'Recall', value: '91.7%' },
        { label: 'Training images', value: '4,203' },
      ],
      buildTimeline: [
        {
          stage: '01',
          label: 'Fabrication',
          heading: 'Built from raw metal',
          body: "It started as a hand-welded frame, no wheels or electronics attached yet. Every structural part of this robot — the chassis, the leg mounts, the gantry frame — was fabricated for the project rather than bought as a kit.",
          image: '/screenshots/agrobot/build-process.jpg',
        },
        {
          stage: '02',
          label: 'Assembly & systems',
          heading: 'Chassis, wheels, and power online',
          body: "Chain-drive wheels went on next, each independently mounted on its own spring-loaded arm for rough terrain rather than a rigid fixed axle. Solar panels, the camera/sensor mast, and a transparent electronics enclosure — kept see-through deliberately, so wiring stays inspectable instead of hidden — completed the build.",
          images: ['/screenshots/agrobot/hero-front.jpg', '/screenshots/agrobot/hero-side.jpg'],
        },
        {
          stage: '03',
          label: 'Public presentation',
          heading: 'Final year project exhibition',
          body: 'Presented formally with a project poster ("AGROBOT: AI-Enabled Weed Removal Robot") covering the abstract, objectives, design, and detection approach, evaluated live by a judging panel.',
          image: '/screenshots/agrobot/exhibition.jpg',
        },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: "Manual weed control in agriculture is labor-intensive and doesn't scale — someone has to walk the field, spot each weed, and remove it by hand. The goal was a robot that closes that entire loop itself: cover a defined field area on its own, detect a weed in real time, and physically remove it on the spot — not just flag it for a person to deal with later.",
        },
        {
          heading: 'The coverage loop: zigzag, stop, remove, resume',
          body: "A target area is specified on a map, and the robot autonomously follows a zigzag path to cover it end to end. The moment the vision model detects a weed, the robot stops — the 2-axis (X-Y) gantry mechanism then positions the removal tool precisely over that exact spot and removes the weed. Once removal is complete, the robot resumes its zigzag route and continues until the whole designated area has been covered. Detection triggers a real physical action and a return to coverage, not just a logged event.",
        },
        {
          heading: 'Three controllers, three clear jobs',
          body: "The control architecture is deliberately split by responsibility rather than centralized in one board: an Arduino Mega runs all of the automation — zigzag path coverage, mobility control, and obstacle-avoidance logic. An NVIDIA Jetson Orin Nano is dedicated solely to weed detection, running the YOLOv8 model against the live camera feed. An ESP32 handles communication between the robot and a custom-built remote control interface, letting multiple functions be operated remotely without routing that traffic through either of the other two boards.",
        },
        {
          heading: 'Obstacle detection: why ultrasonic',
          body: "A 360° ultrasonic sensor array handles obstacle detection, chosen specifically over infrared and other shorter-range options because ultrasonic gives meaningfully better detection range — which matters directly for stopping distance at any real driving speed. When something unexpected enters the robot's path, the Arduino Mega reads the array and stops the robot immediately to avoid a collision, independent of whatever the zigzag/removal cycle is doing at that moment.",
        },
        {
          heading: 'Power: solar-primary, battery as backup',
          body: "The robot runs on solar panels sized against the motors' calculated power draw, so under normal conditions solar generation alone is enough to drive the motors directly — lithium-ion battery cells exist specifically as a backup for when solar input isn't sufficient, not as the primary power source. That's a real sizing exercise (matching panel output to actual motor consumption), not just 'a robot with a solar panel on it.'",
        },
        {
          heading: 'Positioning: self-installed encoders on the drive motors',
          body: "Precise movement and positioning come from encoders the team installed themselves on the geared drive motors — not off-the-shelf encoder motors. Reading the encoder pulses (ticks) as the motors turn gives an accurate measurement of rotation, which is what makes precise zigzag-path tracking and accurate stopping over a detected weed possible.",
        },
        {
          heading: 'Real-time weed detection',
          body: "The YOLOv8 model was trained on a 4,203-image weed dataset (sourced via Roboflow) for 25 epochs, reaching 95.6% mAP50, 89.8% precision, and 91.7% recall on the validation set — real numbers pulled directly from the training run's own logs. It runs on the Jetson Orin Nano against a live Raspberry Pi CSI camera feed, doing real-time inference on video rather than batch-processing static images, since it's what triggers the stop-and-remove step of the coverage loop, not a standalone research demo.",
        },
        {
          heading: 'From workbench to field',
          body: "The photos here span the full build process — from the bare welded chassis with no wheels or electronics yet attached, to the finished robot tested outdoors near real vegetation, to the final formal presentation at a project exhibition with a judged evaluation panel. A lot of student robotics projects only ever get demoed indoors on a clean floor; this one was tested in a real outdoor setting resembling where it would actually need to operate.",
        },
      ],
      skillsDemonstrated: [
        'End-to-end hardware fabrication — designing and welding a physical chassis, not assembling a pre-built robot kit',
        'Autonomous field-coverage path planning (zigzag traversal of a user-defined area) with a real detect-stop-act-resume control loop, not just open-loop driving',
        'Split control architecture across three purpose-specific controllers (Arduino Mega for automation/mobility/obstacle-avoidance, Jetson Orin Nano for vision only, ESP32 for remote UI communication)',
        'Training and validating a real YOLOv8 object detection model, with precision/recall/mAP metrics reported directly from the training logs',
        'Edge deployment of a trained CV model for real-time inference on an NVIDIA Jetson Orin Nano, not just notebook-based batch inference',
        'Closing the loop from perception to physical action — a 2-axis gantry mechanism that acts on a detection instead of just reporting it',
        'Sensor selection grounded in a real engineering tradeoff (ultrasonic over infrared for detection range) rather than a default choice',
        'Power system sizing — matching solar panel output to calculated motor power draw, with battery as backup rather than primary supply',
        'Custom encoder installation on geared motors, using pulse-tick counting for precise position and movement control',
        'Custom remote control interface development (ESP32-based), independent of any third-party IoT platform',
        'Taking a project from raw fabrication through outdoor field testing to a formally judged public presentation',
      ],
    },
    {
      slug: 'multi-mode-rc-robot',
      title: 'Multi-Mode RC Robot',
      tagline:
        "One Arduino Mega chassis, three real driving modes — obstacle avoidance, line following, and full 8-direction Bluetooth RC — switched from a phone app.",
      categoryKey: 'robotics',
      summary:
        "A university-vacation project: a single robot chassis that behaves completely differently depending on which of three modes it's in. Obstacle avoidance combines three ultrasonic sensors with two angled IR sensors specifically placed to cover the ultrasonic array's blind spot. Line following runs a 5-sensor IR array with two different correction strategies. RC mode gives full manual control over Bluetooth — 8 directions, including diagonals, and 10 discrete speed levels — all from a mobile app.",
      github: '',
      live: '',
      tech: ['Arduino Mega', 'Ultrasonic Sensors', 'IR Sensor Array', 'I2C LCD', 'Bluetooth Serial', 'Motor Driver', 'C++'],
      hasLiveDemo: false,
      accentColor: 'red',
      icon: 'gamepad',
      heroMetrics: [
        { label: 'Operating modes', value: '3' },
        { label: 'Sensors', value: '10' },
        { label: 'RC directions', value: '8' },
        { label: 'Status', value: 'Built & working' },
      ],
      architectureBlurb: "All three modes run on the same Arduino Mega and the same motor pins. Switching modes from the phone app means cycling through a fixed sequence of states — sent as repeated 'W' characters over Bluetooth — rather than jumping directly to one.",
      architecture: [
        {
          title: 'Obstacle Avoidance',
          items: ['3 ultrasonic sensors — front, left, right', '2 IR sensors covering the ~45° corner blind spots', 'Reverses and re-scans if boxed in on all sides'],
        },
        {
          title: 'Line Following',
          items: ['5-sensor IR array on the underside', 'Two independent correction strategies', 'Forward / left / right correction per sensor pattern'],
        },
        {
          title: 'Remote Control (RC)',
          items: ['8 directions over Bluetooth', '10 discrete speed levels (digits 0–9)', 'Diagonal turns at reduced inner-wheel speed'],
        },
      ],
      rulesHeading: 'The RC command set, exactly as coded',
      rulesBlurb: 'Single characters sent over Bluetooth map directly to motor behavior — 8 directions, including 4 diagonals at reduced inner-wheel speed, not just basic forward/back/left/right.',
      rulesColumns: [
        { key: 'command', label: 'Command', emphasis: true },
        { key: 'direction', label: 'Direction' },
        { key: 'behavior', label: 'Motor behavior', accent: true },
      ],
      rules: [
        { command: "'F'", direction: 'Forward', behavior: 'Both motors forward at set speed' },
        { command: "'B'", direction: 'Backward', behavior: 'Both motors reverse at set speed' },
        { command: "'L'", direction: 'Turn left (in place)', behavior: 'Left reverse, right forward' },
        { command: "'R'", direction: 'Turn right (in place)', behavior: 'Left forward, right reverse' },
        { command: "'G'", direction: 'Forward-left', behavior: 'Left forward at 1/4 speed, right forward full' },
        { command: "'I'", direction: 'Forward-right', behavior: 'Right forward at 1/4 speed, left forward full' },
        { command: "'H'", direction: 'Backward-left', behavior: 'Left reverse at 1/4 speed, right reverse full' },
        { command: "'J'", direction: 'Backward-right', behavior: 'Right reverse at 1/4 speed, left reverse full' },
        { command: 'anything else', direction: 'Stop', behavior: 'All four motor pins set LOW' },
      ],
      screenshots: [
        {
          heading: 'The robot',
          caption: "Four-wheel chassis with the full sensor stack visible: dual front ultrasonic sensors at the bottom, the IR line-following array on the underside, and the wiring harness feeding the Arduino Mega and Bluetooth module.",
          image: '/screenshots/rc-robot/hero.jpg',
        },
      ],
      narrative: [
        {
          heading: 'The goal',
          body: "Built during a university summer break: one robot, three genuinely different ways to drive it, switchable on the fly from a phone instead of needing three separate builds. Manual control when you want it, line following when there's a track to follow, and autonomous obstacle avoidance when neither applies.",
        },
        {
          heading: 'Sensor placement, not just sensor count',
          body: "The three ultrasonic sensors cover front, left, and right — but ultrasonic sensors have a narrow-ish forward-facing cone, so an object approaching at roughly 45° near a front corner can sit in a gap between them. Two IR sensors are mounted specifically between those corners to cover exactly that blind spot, rather than just adding a fourth ultrasonic sensor and hoping for the best. When obstacle avoidance can't find a clear path in front, left, or right, it reverses while continuously re-scanning the side sensors until one clears, then turns toward whichever side opened up.",
        },
        {
          heading: 'Mode switching is a cycle, not a menu',
          body: "There's no direct 'jump to obstacle avoidance' command. The phone app advances the robot through a fixed sequence of states by sending 'W' repeatedly — speed setup, distance-threshold setup, two line-following variants, obstacle avoidance, then Bluetooth RC, looping back to the start. An onboard 16x2 I2C LCD shows which state is currently active, so the cycle is never a guessing game from the driver's seat.",
        },
        {
          heading: 'Two ways to follow a line',
          body: "The line-following array uses five IR sensors on the underside, and the robot implements two independent correction strategies against that same array — one keyed off the three middle sensors, the other off the two outer sensors plus an all-sensors-triggered case. Both are real, working paths through the same hardware rather than one being a leftover from the other.",
        },
      ],
      skillsDemonstrated: [
        'Multi-mode embedded system design — one Arduino Mega running three distinct control modes through a shared serial-command interface',
        "Sensor placement reasoning grounded in an actual coverage gap (ultrasonic blind spot at ~45°), not just adding more sensors by default",
        'Real-time obstacle avoidance with a boxed-in fallback — reverse and continuously re-scan until a path opens, rather than stalling',
        'A full 8-direction, 10-speed-level RC protocol over Bluetooth serial, including diagonal moves at reduced inner-wheel speed',
        'On-device status feedback via I2C LCD across every mode, so the current state is always visible without a serial monitor',
        'Two independently implemented line-following strategies running on the same physical sensor array',
      ],
    },
    {
      slug: 'smartnest-home-automation',
      title: 'SmartNest — Home Automation Dashboard',
      tagline:
        "A home automation controller with no cloud platform underneath it — the Arduino itself runs the API, and a hand-built dashboard polls it directly.",
      categoryKey: 'robotics',
      summary:
        "A real, working home automation system built on an Arduino: three sensors (light, temperature/humidity, smoke) feed threshold-based automation across 5 relay outputs, all served through a REST API running directly on the Arduino itself — no separate backend, no third-party IoT platform. A custom web dashboard polls it every 2 seconds with live sensor readouts, manual overrides, and adjustable thresholds.",
      github: '',
      live: '',
      tech: ['Arduino (WiFiS3)', 'BH1750', 'DHT22', 'MQ-2', '8-Channel Relay Module', 'JavaScript', 'REST API'],
      hasLiveDemo: true,
      demoKey: 'smartnest',
      liveDemoHeading: 'Try the dashboard',
      liveDemoBlurb: "A live simulation running the same auto-mode rules as the real firmware — sensor values drift on their own, toggles and thresholds really respond.",
      accentColor: 'sky',
      icon: 'cpu',
      heroMetrics: [
        { label: 'Sensors', value: '3' },
        { label: 'Relay outputs', value: '5' },
        { label: 'Poll interval', value: '2s' },
        { label: 'Status', value: 'Built & working' },
      ],
      architectureBlurb: "No separate backend server or database — the Arduino runs the HTTP API itself, and the browser dashboard is just a client polling it directly.",
      architecture: [
        {
          title: 'Sensors',
          items: ['BH1750 — ambient light (lux)', 'DHT22 — temperature + humidity', 'MQ-2 — smoke/gas, 60s warmup before readings are trusted'],
        },
        {
          title: 'Arduino (WiFiS3)',
          items: ['HTTP server on port 80', 'Auto-mode threshold logic', '5-relay control (active-low)'],
          arrowLabel: 'JSON /status',
        },
        {
          title: 'Browser dashboard',
          items: ['Polls /status every 2s', 'Optimistic UI on toggle', 'Threshold sliders → /threshold'],
        },
      ],
      rules: [
        { device: 'B1', sensor: 'Smoke (MQ-2)', condition: 'ON when smoke > threshold', threshold: '50% (raw 512/1023)' },
        { device: 'B2', sensor: 'Humidity (DHT22)', condition: 'ON when humidity > threshold', threshold: '80%' },
        { device: 'B3', sensor: 'Temperature (DHT22)', condition: 'ON when temp > threshold', threshold: '30°C' },
        { device: 'B4', sensor: 'Light (BH1750)', condition: 'ON when dark (lux < threshold)', threshold: '50% (raw 500/1000 lux)' },
        { device: 'Fan', sensor: '—', condition: 'Manual only — auto mode never touches it', threshold: '—' },
      ],
      narrative: [
        {
          heading: 'The goal',
          body: "Most consumer smart-home gear routes everything through a manufacturer's cloud app. The goal here was the opposite: a self-contained system where the Arduino itself is the server — sensors feed straight into automation logic and relay control on the same board, with a custom dashboard as a thin client rather than the source of truth.",
        },
        {
          heading: 'A real bug: the relay race',
          body: "Polling every 2 seconds while also letting a person flip a toggle creates an obvious race: if the poll lands right after a user's click but before the Arduino confirms it, the UI would snap back to the old state and look broken. The fix was a pending-command set — when a relay is toggled, its ID gets marked pending and the next poll skips overwriting it until enough time has passed for the Arduino to have actually applied the change. Small detail, but the kind that's the difference between a dashboard that feels reliable and one that flickers.",
        },
        {
          heading: 'Respecting what the sensor can\'t do yet',
          body: "The MQ-2 gas sensor needs roughly 60 seconds after power-on before its readings are trustworthy — a real hardware constraint, not a software choice. Rather than reporting a possibly-garbage smoke value during that window, the firmware tracks a mq2Ready flag and holds smoke readings at zero (and the dashboard shows 'MQ2 Warming') until warmup completes. Ignoring a sensor's real limitations instead of quietly reporting noisy numbers is a small thing that a lot of hobby projects skip.",
        },
      ],
      skillsDemonstrated: [
        'Running a REST API directly on embedded hardware, with no separate backend server or database in the stack',
        'Diagnosing and fixing a real race condition between a polling UI and user-initiated state changes',
        'Respecting real sensor hardware constraints (MQ-2 warmup) instead of reporting unreliable data during startup',
        'Per-device automation logic with a deliberate manual-only exception (the fan), not a one-size-fits-all rule',
        'Full custom dashboard built from scratch (HTML/CSS/JS) rather than wired into a third-party home automation platform',
      ],
    },
    {
      slug: 'indoor-farming-rover',
      title: 'Indoor Farming Rover + IoT Dashboard',
      tagline:
        'A line-following rover that samples soil moisture with an arm as it drives, reporting over MQTT to a solar-powered base station that pushes everything to a live Blynk dashboard.',
      categoryKey: 'robotics',
      summary:
        "A university IoT-coursework project split into two deliberately separate halves: a Raspberry Pi-controlled rover that follows a line through an indoor growing space, stopping roughly every 3-5 seconds to lower a servo-actuated arm and take a soil moisture reading, and a solar-powered ESP32 base station with its own temperature, humidity, and light sensors. The rover reports its readings to the base station over MQTT, which then pushes the full picture — soil moisture, temperature, humidity, light — to a Blynk dashboard for real-time monitoring, aimed at keeping indoor farming conditions stable.",
      github: '',
      live: '',
      tech: ['Raspberry Pi', 'ESP32', 'MQTT', 'Blynk IoT', 'Servo Motor (MG995)', 'Soil Moisture Sensor', 'Solar Panel', 'IR Sensors'],
      hasLiveDemo: false,
      accentColor: 'green',
      icon: 'sprout',
      heroMetrics: [
        { label: 'System parts', value: '2' },
        { label: 'Sensor types', value: '4' },
        { label: 'Sample interval', value: '~3-5s' },
        { label: 'Status', value: 'Built & working' },
      ],
      architectureBlurb: "Two halves on purpose: the part that moves gets its own battery and only worries about driving and sampling, while the part that stays still gets solar power and owns the always-on sensors and the cloud connection.",
      architecture: [
        {
          title: 'Dynamic part (rover)',
          items: ['Raspberry Pi controller', 'IR sensors — line following', 'Arm: MG995 servo + soil moisture probe', 'Own battery, independent of the base station'],
          arrowLabel: 'MQTT',
        },
        {
          title: 'Static part (base station)',
          items: ['ESP32 controller, solar-powered', 'Onboard temperature, humidity, light sensors', 'Receives rover readings over MQTT'],
        },
        {
          title: 'Blynk dashboard',
          items: ['Real-time temperature, humidity, light', 'Real-time soil moisture from the rover', 'Remote monitoring for indoor farming'],
        },
      ],
      screenshots: [
        {
          heading: 'The rover — top view',
          caption: 'Raspberry Pi at the core with a heatsink for sustained load, IR sensor modules (the blue boards with adjustment potentiometers) mounted low near the front wheels for line following, and the arm extending off to the side.',
          image: '/screenshots/farming-rover/top-view.jpg',
        },
        {
          heading: 'The sampling arm',
          caption: "A Tower Pro MG995 servo — a real, identifiable hobby servo, not a toy-grade unit — actuates a hand-built arm carrying the soil moisture probe at its tip. In the background, the static base station's test rig is visible: a cooling fan and small solar panel cells wired into a cardboard prototype enclosure.",
          image: '/screenshots/farming-rover/arm-side-view.jpg',
        },
        {
          heading: 'Full side profile',
          caption: 'The complete rover with the arm extended to sampling position, showing the wheelbase, the wiring running from the Pi to the servo and sensors, and the base-station rig behind it.',
          image: '/screenshots/farming-rover/side-profile.jpg',
        },
      ],
      narrative: [
        {
          heading: 'The goal',
          body: "Built during IoT coursework early in university: a system to help keep conditions stable in indoor farming, where soil moisture varies by location in a way that a single fixed sensor can't capture, but temperature, humidity, and light are reasonably uniform and can be monitored from one fixed point.",
        },
        {
          heading: 'Why split into two parts',
          body: "The rover and the base station are deliberately separate systems, not one robot with everything bolted on. The rover needs to move, so it carries its own battery and only handles driving and soil sampling. The base station never moves, so it can run on solar power and own the sensors that don't need to travel — temperature, humidity, and light — plus the connection to the cloud dashboard. Splitting responsibilities this way meant the moving part could stay simpler and lighter.",
        },
        {
          heading: 'Sampling on a timer, not a measured distance',
          body: "The rover doesn't measure exact distance traveled — it follows the line via IR sensors and lowers the arm to take a soil moisture reading on an approximate timer, roughly every 3-5 seconds, rather than a precise per-meter trigger. A real, honest constraint of the hardware available at the time rather than a precision distance-tracking system.",
        },
        {
          heading: 'MQTT to the base station, then out to Blynk',
          body: "The rover publishes its soil moisture readings to the base station over MQTT — a lightweight publish/subscribe protocol well suited to a battery-powered device that shouldn't be maintaining a heavy connection. The base station combines that with its own temperature, humidity, and light readings and forwards everything to a Blynk dashboard, giving a real-time combined view of both above-ground and soil conditions from one screen.",
        },
        {
          heading: 'Planned but not built: auto-return to a charging dock',
          body: "The base station being solar-powered was always meant to go further than just running its own sensors — the plan was for the rover to drive back to the starting point once its round finished and dock there to recharge, turning the base station into a charging station as well as a sensor hub. That part was never implemented, so it's listed here as a future improvement rather than something the current build does.",
        },
      ],
      skillsDemonstrated: [
        'Two-tier IoT system design — a mobile sensing node and a fixed base station, each with a controller and power source suited to its own role',
        'MQTT-based communication between a battery-powered mobile device and a fixed, solar-powered base station',
        'Cloud dashboard integration (Blynk) combining readings from two physically separate hardware systems into one real-time view',
        'Physical sensor deployment via a servo-actuated arm, extending sensing reach beyond the chassis itself',
        'Solar power sizing for an always-on monitoring node',
        'Recognizing a real hardware constraint (no precise distance measurement) and designing around it with a reasonable timed-interval approximation instead',
      ],
    },
    {
      slug: 'access-vision-entry-system',
      title: 'Access Vision — Face Recognition Entry System',
      tagline:
        'Two ultrasonic sensors gate two cameras so face-recognition processing only runs when someone is actually at the gate — deployed and logging real entries/exits at the institute it was built for.',
      categoryKey: 'robotics',
      summary:
        "A face-recognition entry and exit management system built for a school: an Arduino watches two ultrasonic sensors, one per gate, and only triggers the corresponding camera's recognition pipeline when someone is actually within range — instead of running expensive face-recognition continuously on both feeds. Recognized individuals get logged to a CSV with timestamps; unrecognized faces are marked Unknown and skipped. 536 real entry/exit events have been logged from actual use.",
      github: '',
      live: '',
      tech: ['Python', 'OpenCV', 'face_recognition', 'Arduino', 'Ultrasonic Sensors', 'pandas', 'matplotlib'],
      hasLiveDemo: false,
      accentColor: 'yellow',
      icon: 'scanFace',
      heroMetrics: [
        { label: 'Logged events', value: '536' },
        { label: 'Cameras', value: '2' },
        { label: 'Ultrasonic sensors', value: '2' },
        { label: 'Status', value: 'Deployed at institute' },
      ],
      architectureBlurb: "The Arduino only ever says one of three things over serial — Entry, Exit, or Terminate — and everything downstream reacts to that, rather than the laptop polling the sensors itself.",
      architecture: [
        {
          title: 'Entry / exit gates',
          items: ['2 ultrasonic sensors, one per gate', 'Arduino holds in a wait state until the person clears range', 'Physical button sends a clean Terminate signal'],
          arrowLabel: 'Entry / Exit / Terminate',
        },
        {
          title: 'Serial bridge',
          items: ['CoolTerm connects to the Arduino', 'GUI-automated via pywinauto, not raw pyserial', 'Logs each trigger line to a text file'],
        },
        {
          title: 'Recognition + logging',
          items: ['face_recognition (dlib) runs on the laptop', 'Best match by minimum face distance', 'Logged to CSV, visualized as a live bar chart'],
        },
      ],
      narrative: [
        {
          heading: 'The goal',
          body: "Built for a school entry point: automate tracking of who enters and exits, without a person checking IDs at the door, and without running continuous face recognition on two camera feeds all day for no reason.",
        },
        {
          heading: 'Sensor-gated, not always-on',
          body: "Both cameras are open for the whole session, but the expensive part — actually running face detection and recognition on a frame — only happens when the Arduino reports someone is within range of the corresponding ultrasonic sensor. The Arduino itself debounces this: once triggered, it holds in a loop re-checking distance until the person moves past 50cm, so a single approach doesn't fire the event repeatedly while someone lingers near the gate.",
        },
        {
          heading: 'An unusual, honest engineering choice',
          body: "Instead of reading the Arduino's serial output directly in Python (the more conventional route), the system GUI-automates CoolTerm — a serial terminal application — using pywinauto, configuring it to capture incoming serial data straight to a text file that the Python script then polls for new lines. Not the textbook approach, but a real one that worked reliably enough to log hundreds of real events.",
        },
        {
          heading: 'Matching correctly, not just matching first',
          body: "Face matching picks the known face with the smallest distance to the detected face, not just the first match above a threshold — a small but real correctness detail that avoids picking an arbitrary match when more than one known face is a plausible candidate. Unrecognized faces are explicitly marked Unknown and never logged, rather than guessed at.",
        },
        {
          heading: 'Real use, not a demo',
          body: "The system has 536 logged entry/exit events from actual deployment at the institute, each with a name, registration number, batch, faculty, and timestamp pulled from face recognition and appended to a CSV — with a live bar chart of activity per person generated from that same log.",
        },
      ],
      skillsDemonstrated: [
        'Hardware-gated computer vision — expensive face-recognition processing runs only when a sensor confirms someone is actually present, not continuously on a live feed',
        'Debounced sensor triggering implemented directly in embedded C++, holding until the subject clears range instead of re-firing on every read',
        'A pragmatic, unconventional serial bridge (GUI-automating a terminal app via pywinauto) that worked reliably in practice',
        'Correct face-matching logic — selecting the closest match by face distance rather than the first match above a threshold',
        'Real institutional deployment with 536 logged entry/exit events from actual use, not a synthetic demo',
        'A complete pipeline from physical sensor trigger through recognition to CSV logging and live visualization',
      ],
    },
  ],
  tools: [
    {
      slug: 'ai-file-organizer',
      title: 'Local AI File Organizer',
      tagline:
        'Points at a messy phone-dump folder and sorts it with offline CLIP scene classification and face clustering — plus a genuine 24-hour undo log for when automated file-moving inevitably needs a safety net.',
      categoryKey: 'tools',
      summary:
        "A local tool for a real personal problem: phone storage dumped onto a PC, photos/videos/docs/WhatsApp files all mixed together, duplicates everywhere. Three real modes — plain file-type sorting, AI-driven scene/face organization (CLIP + face_recognition, fully offline), and rule-based Desktop/Downloads cleanup — all backed by a copy-first, confirm-before-delete workflow with a real 24-hour undo window.",
      github: '',
      live: '',
      tech: ['Next.js', 'FastAPI', 'SQLite', 'CLIP (transformers)', 'face_recognition', 'DBSCAN', 'Python'],
      hasLiveDemo: false,
      accentColor: 'purple',
      icon: 'folderTree',
      heroMetrics: [
        { label: 'Organization modes', value: '3' },
        { label: 'API endpoints', value: '21' },
        { label: 'Undo window', value: '24 hrs' },
        { label: 'Status', value: 'Built & working' },
      ],
      architectureBlurb: "Everything runs locally — the backend never makes an outbound call, and nothing about a file's content ever leaves the machine.",
      architecture: [
        {
          title: 'Your messy folder',
          items: ['Phone backups, WhatsApp exports', 'Photos, videos, docs, all mixed together', 'Duplicates across multiple locations'],
        },
        {
          title: 'Local processing (FastAPI)',
          items: ['SHA-256 + perceptual hash — duplicates', 'CLIP — scene classification', 'face_recognition + DBSCAN — person clustering'],
          arrowLabel: '100% offline',
        },
        {
          title: 'Organized output',
          items: ['Sorted by year / type / person', 'Copy first, confirm before delete', '24-hour undo log per move'],
        },
      ],
      screenshots: [
        {
          heading: 'Landing page',
          caption: '"Local-first · No cloud · No tracking" stated up front, with all three modes laid out as equal entry points rather than the AI mode being buried behind the basic sort.',
          image: '/screenshots/file-organizer/landing.png',
        },
        {
          heading: 'Folder Organizer — folder selection',
          caption: "Step 1 of 2: pick a folder (with quick-path shortcuts for Downloads/Desktop/Documents/Pictures) and set the scan worker count — multithreading control for hashing and copying speed, exposed directly rather than hidden as an internal default. The three processing phases (File-Type Sort, AI Scene Detection, Face Clustering) are shown below as what will actually run, with the AI steps clearly marked optional.",
          image: '/screenshots/file-organizer/folder-organizer.png',
        },
      ],
      narrative: [
        {
          heading: 'The problem',
          body: "Phone storage dumped onto a PC turns into one giant folder — camera photos, screenshots, WhatsApp media, and documents all mixed together, often with the same file saved in two or three places. The goal was a tool that actually fixes that in one pass, sorting by real content (not just file extension) and flagging duplicates, without needing to trust a cloud service with personal photos to do it.",
        },
        {
          heading: 'What actually got built, versus what was planned',
          body: "The original plan called for a Tauri-wrapped desktop .exe. What's actually running is a local Next.js frontend talking to a local FastAPI backend, both started together with one script — functionally the same guarantee (100% offline, nothing leaves the machine, no internet required after setup), just not literally a packaged desktop binary. Worth stating plainly rather than describing the app as something it isn't.",
        },
        {
          heading: 'Moving files is dangerous, so the workflow assumes it will go wrong',
          body: "Automated file-moving across thousands of real personal files is exactly the kind of operation that shouldn't fail silently or irreversibly. Every move is copy-first, with an explicit confirm step before anything gets deleted from its original location — and every move is logged with a timestamp, so a full undo is available within a real, code-enforced 24-hour window, not just a UI promise.",
        },
        {
          heading: 'Degrading gracefully instead of crashing',
          body: "CLIP and face_recognition are both heavy, optional dependencies. If either isn't installed, the classifier and face-clustering modules fall back to filename/path heuristics instead of throwing an error — the app still organizes files, just with less intelligence, rather than refusing to run at all because one ML package is missing.",
        },
      ],
      skillsDemonstrated: [
        'Three genuinely distinct organization modes (plain sort, AI scene/face clustering, rule-based directory cleanup) rather than one generic script wearing different UI',
        'Offline computer vision: CLIP scene classification and face_recognition + DBSCAN person-clustering with zero cloud calls',
        'Dual duplicate detection — exact matches via SHA-256, near-duplicates via perceptual hashing',
        'Designing irreversible-by-nature operations to be safe by construction: copy-first, explicit confirm, and a real time-boxed undo log',
        'Graceful dependency degradation instead of hard failures when optional ML packages are missing',
        'Honest scope reporting — the shipped build (local web app) differs from the original plan (packaged Tauri desktop app), and that gap is worth naming, not hiding',
      ],
    },
  ],
  agentic: [
    {
      slug: 'langgraph-research-agent',
      title: 'Deep-Scrape Research Agent',
      tagline:
        'One of six agentic AI experiments — a LangGraph agent that decides for itself when to run a real multi-page web research pipeline, upgraded here from a Streamlit prototype into a live demo on this site.',
      categoryKey: 'agentic',
      summary:
        "Part of an ongoing collection of agentic AI experiments — this one specifically picked out and upgraded for the portfolio. A LangGraph agent (GPT-4o-mini) that decides on its own whether a question needs real research or can be answered directly; when it does research, a custom tool searches DuckDuckGo, scrapes the resulting pages, chunks and summarizes each one, then merges everything into a single answer, instead of dropping raw search results into the prompt. Originally a Streamlit prototype — ported here into this site's own backend (sharing the same OPENAI_API_KEY as the rest of the portfolio) with a custom-built chat UI in place of Streamlit's default interface.",
      github: '',
      live: '',
      tech: ['LangGraph', 'LangChain', 'OpenAI GPT-4o-mini', 'FastAPI', 'BeautifulSoup', 'DuckDuckGo Search', 'React'],
      hasLiveDemo: true,
      demoKey: 'agenticChat',
      liveDemoHeading: 'Chat with it',
      liveDemoBlurb: 'A real conversation with the agent, not a scripted demo — ask it something current and watch it decide whether to search.',
      accentColor: 'slate',
      icon: 'workflow',
      heroMetrics: [
        { label: 'Pipeline stages', value: '5' },
        { label: 'Model', value: 'GPT-4o-mini' },
        { label: 'Framework', value: 'LangGraph' },
        { label: 'Status', value: 'Learning project' },
      ],
      architectureBlurb: "The model itself decides whether a question needs the research tool — there's no keyword-matching or manual routing deciding that for it.",
      architecture: [
        {
          title: 'Agent graph',
          items: ['LangGraph StateGraph with conditional routing', 'GPT-4o-mini decides when to call the tool', 'MemorySaver — conversation memory per session'],
        },
        {
          title: 'deep_scrape_search tool',
          items: ['DuckDuckGo search for source pages', 'Scrapes headlines/paragraphs/lists via BeautifulSoup', 'Chunks, summarizes, then merges into one answer'],
          arrowLabel: 'only when needed',
        },
        {
          title: 'This live demo',
          items: ["Same OPENAI_API_KEY as the rest of the site", 'Session-scoped memory per visitor', "Custom React UI, replacing the original Streamlit app"],
        },
      ],
      narrative: [
        {
          heading: 'Part of a bigger experiment',
          body: "This sits inside a wider collection of six agentic AI experiments — a web-scraping agent, two resume parsers, a LangChain assistant, a domain-specific assistant, and this LangGraph chatbot. The others are staying as they are for now; this one was picked out specifically to take further, because the underlying agent logic was already solid and just needed a real interface.",
        },
        {
          heading: 'A model that decides for itself, not a chatbot with a search button bolted on',
          body: "The system prompt tells the model it CAN call a research tool when a question involves current events or anything uncertain — it isn't triggered by keyword matching or a manual if/else router. Once the tool runs, its result is marked with a completion flag the model is instructed to recognize, so it answers using what it found instead of calling the tool again in a loop.",
        },
        {
          heading: 'Search results get processed, not just pasted into the prompt',
          body: "The research tool doesn't just hand the model raw scraped text. It searches DuckDuckGo, scrapes each result page's headlines, paragraphs, captions, and list items, splits that combined text into chunks, summarizes each chunk individually, and merges the chunk summaries into one final answer. That extra structure keeps the final response coherent instead of just being whatever fit in the context window from the first page found.",
        },
        {
          heading: 'From a Streamlit prototype to a real product surface',
          body: "The agent logic itself — the graph, the tool, the system prompt — is unchanged from the original working prototype. What changed is where it runs: ported into this site's own FastAPI backend so it shares the same OPENAI_API_KEY already configured for the portfolio's other AI features, with a custom React chat UI replacing Streamlit's default interface, and conversation memory scoped per visitor session instead of a single shared instance.",
        },
      ],
      skillsDemonstrated: [
        'Building a genuinely agentic system — the model decides when to invoke a tool via conditional graph routing, not a hardcoded rule',
        'A real multi-stage research pipeline (search, scrape, chunk, summarize, merge) instead of stuffing raw search results into a prompt',
        'Preventing infinite tool-call loops with an explicit completion signal the model is instructed to respect',
        'Per-session conversation memory via a LangGraph checkpointer, so concurrent visitors don\'t share history',
        'Porting a working prototype (Streamlit) into a shared production backend and a custom frontend without altering the underlying agent logic',
        'Honest framing of exploratory, in-progress work as exactly that — a learning-journey project, not dressed up as a finished product',
      ],
    },
  ],
};

export function getCaseStudy(categoryKey, slug) {
  return (caseStudies[categoryKey] || []).find((c) => c.slug === slug);
}
