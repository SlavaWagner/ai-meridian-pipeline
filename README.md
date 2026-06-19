# Google Meridian Ads Pipeline: Marketing Mix Modeling (MMM) AI Agent

An automated persistent AI Agent CLI built on the **Google Antigravity CLI** framework, designed to extract historical Google Ads performance logs, transform the multi-channel geo-segmented data, train a **Google Meridian Marketing Mix Model (MMM)** inside Google Colab via MCP, and generate budget optimization insights.

---

## Architecture & Agents

This package implements a structured 3-agent cooperative workflow:

```
                  +-----------------------------------------+
                  |  1. Orchestrator & Data Extractor       |
                  |     (Google Ads API & Pivot CSV)        |
                  +-----------------------------------------+
                                       |
                                       v
                  +-----------------------------------------+
                  |  2. Meridian Modeling Agent             |
                  |     (Prior Specs & Colab MCP Run)       |
                  +-----------------------------------------+
                                       |
                                       v
                  +-----------------------------------------+
                  |  3. Insights & Optimization Analyst     |
                  |     (R-hat Convergence & Budget ROI)    |
                  +-----------------------------------------+
```

1. **Orchestrator & Data Extractor Agent**: Pulls campaign cost, impressions, and clicks from the Google Ads API segmented by date and geographic region. It pivots these long-form logs into wide-format variables (e.g. `Search_spend`, `YouTube_impressions`) and aligns them with conversions (KPI) and controls.
2. **Meridian Modeling Agent**: Compiles the TensorFlow Probability modeling specifications and MCMC sampling configurations, uploads the dataset to Google Colab via MCP tools, triggers cell execution on a T4 GPU runtime, and downloads output statistics.
3. **Insights & Optimization Analyst Agent**: Evaluates chain convergence diagnostics ($\hat{R}$ metrics), checks channel ROI and marginal ROIs, calculates optimal budget allocations (maximizing conversions under identical budgets), and compiles a German executive recommendations report.

---

## Installation & CLI Setup

### 1. Global Antigravity CLI Installation
Make sure you have the Antigravity CLI installed globally:
```bash
npm install -g @google/antigravity-cli
```

### 2. Navigate and Install Project Dependencies
Navigate to the directory and run:
```bash
cd C:\Users\User\ai-meridian-pipeline
npm install
```

### 3. Expose the CLI Tool Globally
Expose the CLI shortcut:
```bash
npm link
```

### 4. Run Local Verification Tests
Ensure all 19 system checks pass successfully:
```bash
npm test
```

---

## Command Reference

### `setup`
Configure credentials, Colab MCP notebook URLs, Gemini API settings, and model date ranges.
```bash
ai-meridian-pipeline setup
```

### `extract`
Fetch historical Google Ads metrics and pivot the variables into `storage/data/meridian_input.csv` ready for modeling.
```bash
ai-meridian-pipeline extract
```

### `run-model`
Generate the Meridian python script, upload it to the Google Colab MCP, and execute MCMC sampling on the T4 GPU runtime.
```bash
ai-meridian-pipeline run-model
```

### `insights`
Examine Meridian run results, verify Gelman-Rubin convergence parameters, compute channel ROIs, and compile the German budget optimization report.
```bash
ai-meridian-pipeline insights
```

### `run-workflow`
Run the complete 3-agent pipeline from data extraction to training to reporting in a single unified execution thread.
```bash
ai-meridian-pipeline run-workflow
```

### `status`
Verify current API tokens, Colab MCP server status, and input data paths.
```bash
ai-meridian-pipeline status
```

### `agent list`
Inspect the role, model, and system prompts of the three default persistent agents.
```bash
ai-meridian-pipeline agent list
```

---

*Google Meridian Ads Pipeline is optimized for slavawagner.de campaign evaluation.*
