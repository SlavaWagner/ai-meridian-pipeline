# End-User Setup Guide: Google Meridian Ads Pipeline

This guide outlines the complete installation, Google Cloud credentials setup, Google Colab MCP server integration, and Google Meridian MMM configuration required to run this AI Agent package.

---

## 1. Core Architecture

The **Google Meridian Ads Pipeline** is a persistent multi-agent CLI designed to automate Google Meridian Marketing Mix Modeling (MMM). It integrates Google Ads reporting logs with Bayesian linear regression models trained on a Google Colab T4 GPU runtime.

```
[Google Ads API] -> Data Extraction -> pivoted CSV -> [Google Colab MCP] -> MCMC Sampling -> ROI Analysis & Budget Optimizations
```

1. **Orchestrator & Data Extractor Agent**: Pulls historical campaign performance data (cost, impressions, clicks) by date and region (geo) and pivots it into wide-format tables.
2. **Meridian Modeling Agent**: Configures Bayesian priors and generates a Python notebook/script executing Meridian modeling cells inside Google Colab via MCP.
3. **Insights & Optimization Analyst Agent**: Evaluates chain convergence ($\hat{R}$ diagnostics), compiles ROIs, and suggests optimized budget reallocations to maximize conversions.

---

## 2. Prerequisites

Before starting, ensure you have:
- **Node.js**: Version 18.0.0 or higher.
- **Antigravity CLI**: Globally installed (`npm install -g @google/antigravity-cli`).
- **Google Cloud Project**:
  - **Google Ads API** enabled.
  - **OAuth2 client credentials** configured (Type: Web application or Desktop application).
- **Google Colab MCP Server**:
  - The Colab MCP server (`https://github.com/googlecolab/colab-mcp`) must be installed and registered in your Antigravity MCP config file (`mcp_config.json`).
  - An active Google Colab notebook running on a **T4 GPU runtime** (required for Meridian's TensorFlow Probability MCMC samplers).

---

## 3. Installation & CLI Initialization

1. Clone or navigate to the repository directory:
   ```bash
   cd C:\Users\User\ai-meridian-pipeline
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Expose the CLI wrapper globally:
   ```bash
   npm link
   ```
4. Verify the setup runs correctly by running local tests:
   ```bash
   npm test
   ```

---

## 4. Configuration Setup

Execute the interactive setup command to configure your parameters:
```bash
ai-meridian-pipeline setup
```

You will be prompted for:
1. **Google Ads Customer ID**: The 10-digit ID of your Ads account (e.g. `123-456-7890`).
2. **Google Cloud Client ID & Secret**: OAuth2 credentials created in your GCP console.
3. **Google Ads Developer Token**: Developer API token from your MCC Manager Account.
4. **Google Colab Notebook URL**: The connection link to your Google Colab instance.
5. **Gemini API Key**: Your API key. Entering `antigravity` will use the terminal input bridge fallback.
6. **Date Range**: At least 2-3 years of data (e.g. `2023-01-01` to `2025-12-31`) is mathematically required by Meridian to calculate reliable seasonal weights and media lag decay factors (Adstock).

---

## 5. Connecting Google Colab MCP

To run the model on a T4 GPU, register the Colab MCP server in your global Antigravity config (`mcp_config.json`):

```json
{
  "mcpServers": {
    "colab-mcp": {
      "command": "npx",
      "args": ["-y", "@googlecolab/colab-mcp"],
      "env": {
        "COLAB_NOTEBOOK_URL": "https://colab.research.google.com/drive/YOUR_NOTEBOOK_ID"
      }
    }
  }
}
```

The CLI's **Meridian Modeling Agent** utilizes the `colab-mcp` tools to:
1. **Upload** the pivoted media dataset (`meridian_input.csv`) to the notebook storage.
2. **Execute** Python cells running Meridian MCMC training chains.
3. **Download** the resulting `meridian_output_report.json` back to your local runs folder.

---

## 6. How Google Meridian Works under the Hood

Google Meridian is a Bayesian hierarchical Marketing Mix Model (MMM) written in TensorFlow Probability. 

### Media Transformations
- **Adstock (Geometric Decay)**: Models the carryover effect of advertising. Spend in week 1 affects sales in week 2 and 3. The decay factor is modeled as a parameter $\alpha \in (0,1)$.
- **Hill Function (Saturation)**: Models diminishing returns. The first 10,000 EUR spend has a higher marginal return than the next 10,000 EUR.

### Bayesian Priors
- **Non-negativity**: Media coefficients (betas) are constrained to be positive ($\ge 0$) because marketing campaigns should not decrease sales.
- **Controls**: Controls isolate exogenous factors (seasonality, competitor search volume, price changes) to ensure media ROI isn't confounded.

### MCMC Diagnostics (Convergence)
- **R-hat (Gelman-Rubin)**: Measures if the independent sampling chains converged. If $\hat{R} < 1.1$ for all variables, the model estimations are mathematically valid. If $\hat{R} > 1.1$, the chains did not converge, meaning you need more MCMC steps or clean up data noise.
