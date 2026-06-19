import BaseAgent from './BaseAgent.js';
import { generateMeridianPythonCode, executeInColab } from '../colab.js';
import fs from 'fs';

export default class MeridianModelingAgent extends BaseAgent {
  constructor() {
    super('meridianModeler');
  }

  /**
   * Generates Meridian training code, sends it to Google Colab, and returns MCMC reports.
   * 
   * @param {object} metadata - The schema details from transform step
   * @returns {Promise<object>} Meridian output report details
   */
  async runMeridianModel(metadata) {
    this.log('Preparing Google Meridian Python script specifications...');
    
    // 1. Generate Python Code
    const pyCode = generateMeridianPythonCode(metadata);
    this.log('Python script generated successfully.');

    // 2. Execute code in Colab environment
    this.log('Executing script in Google Colab (T4 GPU runtime)...');
    try {
      const colabResult = await executeInColab(pyCode);
      this.log('Colab execution complete.');
      this.log(`Model results report saved: ${colabResult.outputPath}`);
      this.log(`Python execution code script: ${colabResult.scriptPath}`);
      return colabResult;
    } catch (err) {
      this.log(`Execution in Colab failed: ${err.message}`);
      throw err;
    }
  }
}
