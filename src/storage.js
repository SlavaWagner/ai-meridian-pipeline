import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = path.resolve(__dirname, '../storage');
const AGENTS_DIR = path.resolve(STORAGE_DIR, 'agents');
const RUNS_DIR = path.resolve(STORAGE_DIR, 'runs');
const DATA_DIR = path.resolve(STORAGE_DIR, 'data');

const DEFAULT_AGENTS = {
  dataExtractor: {
    name: 'dataExtractor',
    role: 'Orchestrator & Data Extractor Agent',
    description: 'Connects to Google Ads API, pulls historical multi-channel metrics by date & region, and exports them.',
    systemPrompt: `You are the Google Ads Data Extractor Agent. Your task is to query historical Google Ads campaign metrics (impressions, clicks, spend) segmented by date and geographic region.

Your core duties:
1. Validate dates and verify that campaign types map accurately to media channels:
   - Search -> Google Search campaigns
   - Performance Max -> Performance Max (PMax) campaigns
   - YouTube -> Video campaigns
   - Display -> Google Display Network campaigns
2. Check for data completeness (missing dates or regions) and fill gaps or raise warnings.
3. Call the transformation modules to pivot raw tables into the wide tabular CSV format required by Google Meridian.`,
    skills: ['FetchAdsDataSkill'],
    model: 'antigravity'
  },
  meridianModeler: {
    name: 'meridianModeler',
    role: 'Meridian Modeling Agent',
    description: 'Prepares Google Meridian specifications, configures Bayesian priors, and writes the Python script for Colab.',
    systemPrompt: `You are the Meridian Modeling Agent. Your task is to construct python scripts that train a Google Meridian Marketing Mix Model (MMM) inside Google Colab (using TensorFlow Probability).

Guidelines for generating python code:
1. Define clear model specifications, shape parameters, and Bayesian priors:
   - Media spend and impressions must have non-negative priors (coefficients beta_media >= 0).
   - Adstock (decay rate) and Hill (saturation) functions are applied to impressions.
   - Control variables (pricing, competitor search, seasonality) are incorporated to isolate media impact.
2. Formulate 3 chains of Markov Chain Monte Carlo (MCMC) sampling with at least 500 warmup and 1000 sampling iterations.
3. Configure the check_convergence() diagnostics to verify Gelman-Rubin R-hat parameters.
4. Prepare the final JSON report output containing convergence status, channel ROI, and marginal ROI estimates.`,
    skills: ['GenerateModelScriptSkill', 'ExecuteColabSkill'],
    model: 'antigravity'
  },
  insightsAnalyst: {
    name: 'insightsAnalyst',
    role: 'Insights & Optimization Analyst Agent',
    description: 'Reviews Meridian model metrics, analyzes ROI, and runs media mix optimization recommendations.',
    systemPrompt: `You are the Insights & Optimization Analyst Agent. Your task is to review Google Meridian outputs and formulate budget reallocation recommendations.

Your duties:
1. Check MCMC convergence: If R-hat > 1.1 for any media parameter, warn the user that the model has not converged and they need more chains/data.
2. Analyze ROI: Identify which channels are oversaturated (marginal ROI is low compared to average ROI) and which channels have head-room to scale.
3. Budget Optimization: Run budget optimization scenarios to maximize conversions for the same budget. Contrast current vs. optimized spends and highlight efficiency lift (ROI gains).
4. Provide structured, actionable executive recommendations in German.`,
    skills: ['LLMGenerateSkill'],
    model: 'antigravity'
  }
};

/**
 * Ensures storage directories exist and seeds default agent configs if empty.
 */
export function initStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const [name, config] of Object.entries(DEFAULT_AGENTS)) {
    const filePath = path.join(AGENTS_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    }
  }
}

export function listAgents() {
  initStorage();
  const files = fs.readdirSync(AGENTS_DIR).filter(file => file.endsWith('.json'));
  return files.map(file => {
    const data = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    return JSON.parse(data);
  });
}

export function getAgent(name) {
  initStorage();
  const filePath = path.join(AGENTS_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

export function saveAgent(name, config) {
  initStorage();
  const filePath = path.join(AGENTS_DIR, `${name}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving agent ${name}:`, error.message);
    return false;
  }
}

export function saveRunLog(runLog) {
  initStorage();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(RUNS_DIR, `run-${timestamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify(runLog, null, 2), 'utf8');
  return logPath;
}

