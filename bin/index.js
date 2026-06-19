#!/usr/bin/env node

import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn, exec } from 'child_process';

import { getConfig, saveConfig, getAccessToken, refreshAccessToken } from '../src/config.js';
import { listAgents, getAgent, saveAgent, saveRunLog, initStorage } from '../src/storage.js';
import DataExtractionAgent from '../src/agents/DataExtractionAgent.js';
import MeridianModelingAgent from '../src/agents/MeridianModelingAgent.js';
import InsightsAgent from '../src/agents/InsightsAgent.js';
import { getStaticLogo } from '../src/staticLogo.js';

// Initialize directories and agents
initStorage();

function getAsciiLogo() {
  const magentaCube = chalk.hex('#d946ef');
  const blueCube = chalk.hex('#3b82f6');
  const cyanCube = chalk.hex('#06b6d4');
  
  return [
    '',
    magentaCube("             +---+ ") + blueCube("     +---+ ") + cyanCube("     +---+ "),
    magentaCube("            /   /| ") + blueCube("    /   /| ") + cyanCube("    /   /| "),
    magentaCube("           +---+ | ") + blueCube("  +---+ | ") + cyanCube("  +---+ | "),
    magentaCube("           |   |/  ") + blueCube("  |   |/  ") + cyanCube("  |   |/  "),
    magentaCube("           +---+   ") + blueCube("  +---+   ") + cyanCube("  +---+   "),
    blueCube("     +---+ ") + magentaCube("     +---+ ") + blueCube("     +---+ "),
    blueCube("    /   /| ") + magentaCube("    /   /| ") + blueCube("    /   /| "),
    blueCube("   +---+ | ") + magentaCube("  +---+ | ") + blueCube("  +---+ | "),
    blueCube("   |   |/  ") + cyanCube("  |   |/  ") + blueCube("  |   |/  "),
    blueCube("   +---+   ") + magentaCube("  +---+   ") + blueCube("  +---+   "),
    cyanCube("     +---+ ") + blueCube("     +---+ ") + magentaCube("     +---+ "),
    cyanCube("    /   /| ") + blueCube("    /   /| ") + magentaCube("    /   /| "),
    cyanCube("   +---+ | ") + blueCube("  +---+ | ") + magentaCube("  +---+ | "),
    cyanCube("   |   |/  ") + blueCube("  |   |/  ") + magentaCube("  |   |/  "),
    cyanCube("   +---+   ") + blueCube("  +---+   ") + magentaCube("  +---+   "),
    '',
    chalk.bold.hex('#d946ef')('     === GOOGLE MERIDIAN MMM ADS PIPELINE ==='),
    chalk.bold.hex('#06b6d4')('        Bayesian Marketing Mix Modeling (MMM) Agent'),
    chalk.gray('     ───────────────────────────────────────────────────'),
    ''
  ].join('\n');
}

const program = new Command();

program
  .name('ai-meridian-pipeline')
  .description('Persistent AI Agents CLI for Google Ads & Google Meridian MMM Optimization')
  .version('1.0.0');

program.addHelpText('before', getAsciiLogo());

// SETUP Command
program
  .command('setup')
  .description('Configure credentials for Google Ads and Google Colab MCP')
  .action(async () => {
    console.log(chalk.bold.cyan('\n=== Google Meridian Ads Pipeline Setup ===\n'));

    const current = getConfig();

    try {
      const customerId = await input({
        message: 'Google Ads Customer ID (10-digit):',
        default: current.customerId || ''
      });

      const clientId = await input({
        message: 'Google Cloud Client ID (OAuth2):',
        default: current.clientId || ''
      });

      const clientSecret = await input({
        message: 'Google Cloud Client Secret (OAuth2):',
        default: current.clientSecret || ''
      });

      const developerToken = await input({
        message: 'Google Ads Developer Token:',
        default: current.developerToken || ''
      });

      const colabNotebookUrl = await input({
        message: 'Google Colab Notebook URL / Connection Link:',
        default: current.colabNotebookUrl || ''
      });

      const geminiApiKey = await input({
        message: 'Gemini API Key (type "antigravity" to use the bridge):',
        default: current.geminiApiKey || 'antigravity'
      });

      const startDate = await input({
        message: 'Historical Extraction Start Date (YYYY-MM-DD):',
        default: current.startDate || '2023-01-01'
      });

      const endDate = await input({
        message: 'Historical Extraction End Date (YYYY-MM-DD):',
        default: current.endDate || '2025-12-31'
      });

      // Save credentials config
      const updatedConfig = {
        ...current,
        customerId,
        clientId,
        clientSecret,
        developerToken,
        colabNotebookUrl,
        geminiApiKey,
        startDate,
        endDate
      };
      saveConfig(updatedConfig);

      console.log(chalk.bold.green('\n✔ Configuration successfully saved in config.json!'));
      console.log(chalk.yellow('Remember to authorize Google Ads by adding an OAuth2 Refresh Token if calling the live API.'));
      console.log(chalk.gray('For details on Meridian model specs, see SETUP_GUIDE.md.\n'));
      
    } catch (error) {
      console.error(chalk.bold.red('\n✖ Setup failed:'), error.message);
    }
  });

// AGENT LIST Command
const agentCmd = program.command('agent').description('Manage Persistent AI Agents');

agentCmd
  .command('list')
  .description('List all registered persistent AI agents and their configurations')
  .action(() => {
    console.log(chalk.bold.cyan('\n=== Registered Meridian Agents ===\n'));
    const agents = listAgents();
    agents.forEach(agent => {
      console.log(chalk.bold.magenta(`Name:        ${agent.name}`));
      console.log(`Role:        ${agent.role}`);
      console.log(`Model:       ${agent.model}`);
      console.log(`Skills:      ${agent.skills.join(', ')}`);
      console.log(`Prompt:      ${agent.description}`);
      console.log(chalk.gray('----------------------------------------------------'));
    });
  });

// EXTRACT Command
program
  .command('extract')
  .description('Extract historical Google Ads campaigns media data and transform for Meridian')
  .action(async () => {
    console.log(chalk.bold.cyan('\n=== Agent 1: Data Extraction & Transformation ===\n'));
    const config = getConfig();
    
    let accessToken = null;
    if (config.refreshToken) {
      try {
        console.log(chalk.yellow('Authenticating Google Ads API...'));
        accessToken = await getAccessToken();
        console.log(chalk.green('✔ Access Token verified.'));
      } catch (err) {
        console.log(chalk.yellow(`Warning: Google Ads login failed (${err.message}). Defaulting to high-fidelity simulation.`));
      }
    } else {
      console.log(chalk.yellow('Note: No OAuth token configured. Running high-fidelity Meridian dataset simulator.'));
    }

    try {
      const extractor = new DataExtractionAgent();
      const datasetSummary = await extractor.extractAndTransform(config, accessToken);
      console.log(chalk.bold.green('\n✔ Step complete. Transformed dataset created:'));
      console.log(`  File: ${datasetSummary.inputCsvPath}`);
      console.log(`  Rows: ${datasetSummary.totalRecords} (weeks: ${datasetSummary.weeksCount}, channels: ${datasetSummary.channels.join(', ')})`);
    } catch (error) {
      console.error(chalk.red('\n✖ Data extraction failed:'), error.message);
    }
  });

// RUN MODEL Command
program
  .command('run-model')
  .description('Upload inputs to Google Colab and train the Meridian Bayesian model')
  .action(async () => {
    console.log(chalk.bold.cyan('\n=== Agent 2: Meridian Model Training ===\n'));
    const config = getConfig();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const metaPath = path.resolve(__dirname, '../storage/data/meridian_metadata.json');

    if (!fs.existsSync(metaPath)) {
      console.log(chalk.red('Error: Transformed dataset metadata not found. Please run the extraction step first:'));
      console.log(chalk.yellow('  ai-meridian-pipeline extract'));
      return;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const modeler = new MeridianModelingAgent();
      
      const executionResult = await modeler.runMeridianModel(metadata);
      
      console.log(chalk.bold.green('\n✔ Step complete. Bayesian MCMC sampling runs completed!'));
      console.log(`  Output Report: ${executionResult.outputPath}`);
    } catch (error) {
      console.error(chalk.red('\n✖ Model training failed:'), error.message);
    }
  });

// INSIGHTS Command
program
  .command('insights')
  .description('Analyze Google Meridian outputs and generate reallocation recommendations')
  .action(async () => {
    console.log(chalk.bold.cyan('\n=== Agent 3: Meridian Insights & Reallocations ===\n'));
    
    // Look for recent model outputs
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const runsDir = path.resolve(__dirname, '../storage/runs');
    
    if (!fs.existsSync(runsDir)) {
      console.log(chalk.red('Error: No model run files found. Please run model training first:'));
      console.log(chalk.yellow('  ai-meridian-pipeline run-model'));
      return;
    }

    const reportFiles = fs.readdirSync(runsDir).filter(f => f.startsWith('meridian-output-') && f.endsWith('.json'));
    if (reportFiles.length === 0) {
      console.log(chalk.red('Error: No meridian-output-*.json reports found. Please run model training first.'));
      return;
    }

    // Load the latest report
    reportFiles.sort();
    const latestReportFile = reportFiles[reportFiles.length - 1];
    const reportPath = path.join(runsDir, latestReportFile);
    
    console.log(chalk.yellow(`Loading latest Meridian run logs: ${latestReportFile}...`));
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    try {
      const analyst = new InsightsAgent();
      const reportMarkdown = await analyst.generateInsightsReport({ report: reportData });
      
      console.log(chalk.bold.green('\n=== GOOGLE MERIDIAN MMM INSIGHTS REPORT ===\n'));
      console.log(reportMarkdown);
      console.log(chalk.bold.green('\n===========================================\n'));

      // Save markdown report persistently
      const mdPath = path.resolve(runsDir, `report-${latestReportFile.replace('.json', '.md')}`);
      fs.writeFileSync(mdPath, reportMarkdown, 'utf8');
      console.log(chalk.green(`Executive report saved to: ${mdPath}\n`));
    } catch (error) {
      console.error(chalk.red('\n✖ Insights generation failed:'), error.message);
    }
  });

// PIPELINE WORKFLOW Command (Executes all 3 steps)
program
  .command('run-workflow')
  .description('Run complete Meridian optimization workflow (Extract -> Train -> Insights)')
  .action(async () => {
    console.log(chalk.bold.magenta('\n=== Starting Google Meridian Ads Pipeline Workflow ===\n'));
    
    const config = getConfig();
    let accessToken = null;
    if (config.refreshToken) {
      try {
        accessToken = await getAccessToken();
      } catch (err) {
        // Fallback
      }
    }

    try {
      // Step 1: Extraction
      console.log(chalk.bold.cyan('--- [1/3] Data Extraction & Transformation ---'));
      const extractor = new DataExtractionAgent();
      const datasetSummary = await extractor.extractAndTransform(config, accessToken);
      
      // Step 2: Modeling
      console.log(chalk.bold.cyan('\n--- [2/3] Meridian Model Training ---'));
      const modeler = new MeridianModelingAgent();
      const metadata = JSON.parse(fs.readFileSync(datasetSummary.metadataPath, 'utf8'));
      const executionResult = await modeler.runMeridianModel(metadata);

      // Step 3: Analysis
      console.log(chalk.bold.cyan('\n--- [3/3] Meridian Insights & Recommendations ---'));
      const analyst = new InsightsAgent();
      const reportMarkdown = await analyst.generateInsightsReport({ report: executionResult.report });

      console.log(chalk.bold.green('\n=== GOOGLE MERIDIAN MMM INSIGHTS REPORT ===\n'));
      console.log(reportMarkdown);
      console.log(chalk.bold.green('\n===========================================\n'));

      // Save runs logs
      const finalReportPath = path.resolve(path.dirname(executionResult.outputPath), `workflow-report-${path.basename(executionResult.outputPath).replace('.json', '.md')}`);
      fs.writeFileSync(finalReportPath, reportMarkdown, 'utf8');
      
      const logPath = saveRunLog({
        dataset: datasetSummary,
        modelResult: executionResult.report,
        reportMarkdownPath: finalReportPath
      });
      
      console.log(chalk.bold.green('✔ Complete pipeline executed successfully!'));
      console.log(chalk.gray(`Execution log saved to: ${logPath}\n`));

    } catch (error) {
      console.error(chalk.bold.red('\n✖ Pipeline Workflow failed:'), error.message);
    }
  });

// STATUS Command
program
  .command('status')
  .description('Verify system connections (Google Ads, Colab MCP, and modeling states)')
  .action(() => {
    console.log(chalk.bold.cyan('\n=== Pipeline System Status ===\n'));
    const config = getConfig();

    console.log(`Customer ID:            ${config.customerId || chalk.red('Missing')}`);
    console.log(`Developer Token:        ${config.developerToken ? 'Loaded (***)' : chalk.red('Missing')}`);
    console.log(`OAuth credentials:      ${config.clientId && config.clientSecret ? 'Configured' : chalk.red('Missing')}`);
    console.log(`Refresh Token:          ${config.refreshToken ? 'Authenticated' : chalk.yellow('Not authenticated')}`);
    console.log(`Colab MCP Notebook:     ${config.colabNotebookUrl || chalk.yellow('Not configured (Using simulator runtime)')}`);
    console.log(`Gemini API Key:         ${config.geminiApiKey === 'antigravity' ? 'Using Antigravity Bridge' : 'Custom API Key loaded'}`);
    console.log(`Media Channels:         ${config.mediaChannels.join(', ')}`);
    console.log(`Extraction Window:      ${config.startDate} to ${config.endDate}`);
    
    // Check if data file exists
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const inputCsv = path.resolve(__dirname, '../storage/data/meridian_input.csv');
    console.log(`Dataset Status:         ${fs.existsSync(inputCsv) ? chalk.green('meridian_input.csv Ready') : chalk.yellow('No dataset found (Run extract first)')}`);
    console.log();
  });

// Disable default commander help command to override it with our own vibe-coded help
program.helpCommand(false);

program
  .command('help')
  .description('Display the dynamic, vibe-coded catalog of all pipeline commands')
  .action(async () => {
    const prevLevel = chalk.level;
    chalk.level = 3; // Force 24-bit TrueColor support for high-fidelity image output
    
    const magenta = chalk.hex('#d946ef');
    const blue = chalk.hex('#3b82f6');
    const cyan = chalk.hex('#06b6d4');
    const green = chalk.hex('#10b981');
    const gray = chalk.gray;

    console.clear();
    
    const termWidth = process.stdout.columns || 80;
    const leftOffset = Math.max(0, Math.floor((termWidth - 60) / 2));
    
    const boxOffset = Math.max(0, Math.floor((termWidth - 64) / 2));
    const boxOffsetStr = ' '.repeat(boxOffset);

    // Display pre-rendered Meridian Ads Pipeline Logo directly as text blocks
    try {
      const pixelGraphic = getStaticLogo(leftOffset);
      console.log(pixelGraphic);
    } catch (err) {
      console.log(getAsciiLogo());
      console.log(chalk.red(`     (Could not render static logo: ${err.message})`));
    }
    
    console.log(boxOffsetStr + magenta('┌──────────────────────────────────────────────────────────────┐'));
    console.log(boxOffsetStr + magenta('│               PIPELINE AUTOMATION COMMANDS                   │'));
    console.log(boxOffsetStr + magenta('├──────────────────────────────────────────────────────────────┤'));
    
    const printRow = (cmd, desc) => {
      console.log(
        boxOffsetStr +
        magenta('│ ') +
        cyan(cmd.padEnd(16)) +
        chalk.white(desc.padEnd(43)) +
        magenta('  │')
      );
    };

    printRow('setup', 'Configure API credentials & endpoints');
    printRow('status', 'Verify connectivity & configurations');
    printRow('extract', 'Pivots geographic Ads campaign metrics');
    printRow('run-model', 'Trains Bayesian MMM in Google Colab');
    printRow('insights', 'ROI optimizer & reallocation reports');
    printRow('run-workflow', 'Runs entire workflow (extract -> insights)');
    printRow('help', 'Display this interactive command catalog');
    
    console.log(boxOffsetStr + magenta('├──────────────────────────────────────────────────────────────┤'));
    console.log(boxOffsetStr + magenta('│               INTERCONNECTED PIPELINE GRAPH                  │'));
    console.log(boxOffsetStr + magenta('├──────────────────────────────────────────────────────────────┤'));
    console.log(
      boxOffsetStr +
      magenta('│ ') +
      blue('     [Ads] ──> [CSV] ──> [Colab] ──> [MMM] ──> [Insights]     ') +
      magenta(' │')
    );
    console.log(boxOffsetStr + magenta('└──────────────────────────────────────────────────────────────┘'));
    console.log();
    console.log(boxOffsetStr + gray('Run commands sequentially: ') + cyan('ai-meridian-pipeline <command>'));
    console.log();
    
    chalk.level = prevLevel; // Restore chalk level
  });

const cleanArgs = process.argv.slice(2).filter(arg => arg.trim() !== '');
if (cleanArgs.length === 0) {
  process.argv = [...process.argv.slice(0, 2), 'help'];
}

program.parse(process.argv);
