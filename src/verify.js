import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAgent, listAgents, initStorage } from './storage.js';
import { transformAndSaveMeridianData } from './meridian.js';
import { generateMeridianPythonCode } from './colab.js';

initStorage();

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(chalk.green(`  ✔ PASSED: ${message}`));
    passedTests++;
  } else {
    console.log(chalk.red(`  ✖ FAILED: ${message}`));
    failedTests++;
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n=== Run Meridian Pipeline Verification Tests ===\n'));

  // Test 1: Storage and Agents Loading
  try {
    console.log(chalk.yellow('Test 1: Agent Loader and Config Storage...'));
    const agents = listAgents();
    assert(agents.length === 3, `Expected 3 default agents, found ${agents.length}`);
    
    const extractor = getAgent('dataExtractor');
    assert(extractor !== null, 'Should load dataExtractor agent');
    assert(extractor.skills.includes('FetchAdsDataSkill'), 'dataExtractor should have FetchAdsDataSkill');

    const modeler = getAgent('meridianModeler');
    assert(modeler !== null, 'Should load meridianModeler agent');
    assert(modeler.skills.includes('ExecuteColabSkill'), 'meridianModeler should have ExecuteColabSkill');

    const analyst = getAgent('insightsAnalyst');
    assert(analyst !== null, 'Should load insightsAnalyst agent');
  } catch (err) {
    console.log(chalk.red(`  ✖ FAILED: Agent loader error: ${err.message}`));
    failedTests++;
  }

  // Test 2: Data Pivot and Wide-Format Transformation
  try {
    console.log(chalk.yellow('\nTest 2: Google Meridian Data Transformation & Pivoting...'));
    
    // Create tiny mock dataset
    const mockMedia = [
      { date: '2025-01-01', region: 'DE-BY', channel: 'Search', spend: 1000, impressions: 5000 },
      { date: '2025-01-01', region: 'DE-BY', channel: 'YouTube', spend: 500, impressions: 10000 },
      { date: '2025-01-01', region: 'DE-BE', channel: 'Search', spend: 600, impressions: 3000 },
      { date: '2025-01-08', region: 'DE-BY', channel: 'Search', spend: 1100, impressions: 5500 }
    ];
    const mockKpi = [
      { date: '2025-01-01', region: 'DE-BY', conversions: 50, revenue: 2450 },
      { date: '2025-01-01', region: 'DE-BE', conversions: 30, revenue: 1470 },
      { date: '2025-01-08', region: 'DE-BY', conversions: 55, revenue: 2695 }
    ];
    const mockControls = [
      { date: '2025-01-01', region: 'DE-BY', priceIndex: 100, competitorSearchVolume: 80, seasonFactor: 1.1 },
      { date: '2025-01-01', region: 'DE-BE', priceIndex: 100, competitorSearchVolume: 50, seasonFactor: 1.0 },
      { date: '2025-01-08', region: 'DE-BY', priceIndex: 100.5, competitorSearchVolume: 85, seasonFactor: 1.12 }
    ];

    const result = transformAndSaveMeridianData(mockMedia, mockKpi, mockControls);

    assert(fs.existsSync(result.inputCsvPath), 'Pivoted input CSV file should exist on disk');
    assert(fs.existsSync(result.metadataPath), 'Metadata JSON file should exist on disk');
    assert(result.totalRecords === 3, `Expected 3 records grouped by date/region, got ${result.totalRecords}`);
    assert(result.channels.includes('Search') && result.channels.includes('YouTube'), 'Metadata should index both media channels');

    // Read generated CSV and verify columns
    const csvContent = fs.readFileSync(result.inputCsvPath, 'utf8');
    const firstLine = csvContent.split('\n')[0];
    assert(firstLine.includes('Search_spend'), 'CSV header must contain pivoted Search spend column');
    assert(firstLine.includes('YouTube_impressions'), 'CSV header must contain pivoted YouTube impressions column');
    assert(firstLine.includes('kpi_conversions'), 'CSV header must contain Conversions KPI column');
    assert(firstLine.includes('control_competitor_search_volume'), 'CSV header must contain Competitor Search Control column');
  } catch (err) {
    console.log(chalk.red(`  ✖ FAILED: Pivot transformation test error: ${err.message}`));
    failedTests++;
  }

  // Test 3: Meridian Modeling Script Compilation
  try {
    console.log(chalk.yellow('\nTest 3: Meridian Python Modeling Code Generator...'));
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const metaPath = path.resolve(__dirname, '../storage/data/meridian_metadata.json');
    
    if (fs.existsSync(metaPath)) {
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const pythonScript = generateMeridianPythonCode(metadata);

      assert(pythonScript.includes('import meridian'), 'Python script must import google-meridian');
      assert(pythonScript.includes('input_data.InputData('), 'Python script must instantiate input_data.InputData');
      assert(pythonScript.includes('meridian_model.ModelSpec('), 'Python script must configure ModelSpec');
      assert(pythonScript.includes('mmm.fit('), 'Python script must execute mmm.fit()');
      assert(pythonScript.includes('optimal_budget_allocation('), 'Python script must call optimal_budget_allocation');
    } else {
      console.log(chalk.red('  ✖ FAILED: Test skipped because metadata was not written.'));
      failedTests++;
    }
  } catch (err) {
    console.log(chalk.red(`  ✖ FAILED: Code compiler test error: ${err.message}`));
    failedTests++;
  }

  // Summary
  console.log(chalk.bold.cyan('\n=== Test Summary ==='));
  console.log(chalk.bold.green(`Passed: ${passedTests}`));
  if (failedTests > 0) {
    console.log(chalk.bold.red(`Failed: ${failedTests}`));
    process.exit(1);
  } else {
    console.log(chalk.bold.green('All verification tests passed successfully!'));
    process.exit(0);
  }
}

runTests();
