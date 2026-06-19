import BaseAgent from './BaseAgent.js';

export default class InsightsAgent extends BaseAgent {
  constructor() {
    super('insightsAnalyst');
  }

  /**
   * Evaluates Meridian model outputs, convergence metrics, and reallocates budget.
   * Generates a high-quality Markdown executive report.
   * 
   * @param {object} meridianOutput - The raw outputs from the Colab model run
   * @returns {Promise<string>} Markdown formatting of findings and recommendations
   */
  async generateInsightsReport(meridianOutput) {
    this.log('Evaluating Meridian posterior estimations and Gelman-Rubin convergence parameters...');
    
    const data = meridianOutput.report;
    const isConverged = data.convergence.is_converged;
    
    // Construct user prompt for LLM report formatting
    const userPrompt = `Hier sind die echten Ergebnisse des Google Meridian MCMC Modelllaufs:
    
CONVERGENCE:
- R-hat converged: ${isConverged ? 'JA' : 'NEIN'}
- R-hat details: ${JSON.stringify(data.convergence.r_hats, null, 2)}

ROI ESTIMATES:
- Average ROI per channel: ${JSON.stringify(data.roi_estimates.channel_roi, null, 2)}
- Marginal ROI per channel: ${JSON.stringify(data.roi_estimates.marginal_roi, null, 2)}
- Media contribution: ${JSON.stringify(data.roi_estimates.media_contribution_percent, null, 2)}

BUDGET OPTIMIZATION RECOMMENDATIONS:
- Current Total Spend: EUR ${data.budget_optimization.current_total_spend.toLocaleString()}
- Optimized Allocation: ${JSON.stringify(data.budget_optimization.optimized_allocation, null, 2)}
- Expected Conversions under Optimization: ${data.budget_optimization.expected_kpi_conversions} (Current: ${data.budget_optimization.current_kpi_conversions})
- Estimated Efficiency Lift: ${data.budget_optimization.efficiency_lift_percent}%

Bitte erstelle ein strukturiertes, professionelles Executive-Summary-Dokument in deutscher Sprache. 
Befolge diese Anforderungen strikt:
1. Erklaere, was R-hat bedeutet und ob das Modell valide ist (Werte unter 1.1 bedeuten Konvergenz).
2. Erstelle eine vergleichende Markdown-Tabelle mit den Spalten: Kanal, Durchschnittlicher ROI, Marginaler ROI, Budget-Anpassung.
3. Interpretiere den Unterschied zwischen Durchschnitts-ROI und marginalem ROI: Wenn der marginale ROI deutlich unter dem Durchschnitts-ROI liegt, ist der Kanal gesaettigt. Wenn er hoch ist, kann skaliert werden.
4. Zeige die Budgetreallokation exakt an: Welche Kanaele werden reduziert (z.B. Display) und wo wird aufgestockt (z.B. Search) und begruende dies.
5. Hebe den erwarteten Efficiency Lift (Conversion-Steigerung bei gleichem Budget) hervor.
6. Gib 3 konkrete, strategische Handlungsempfehlungen fuer slavawagner.de bezueglich der Google Ads Kampagnen.
`;

    this.log('Generating executive report using Gemini...');
    const markdownReport = await this.generateCompletion(userPrompt, false);
    this.log('Executive report compiled successfully.');
    return markdownReport;
  }
}
