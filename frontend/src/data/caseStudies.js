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
};

export function getCaseStudy(categoryKey, slug) {
  return (caseStudies[categoryKey] || []).find((c) => c.slug === slug);
}
