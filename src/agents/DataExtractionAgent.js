import BaseAgent from './BaseAgent.js';
import { fetchMeridianAdsData, generateSimulatedMeridianData } from '../googleAds.js';
import { transformAndSaveMeridianData } from '../meridian.js';

export default class DataExtractionAgent extends BaseAgent {
  constructor() {
    super('dataExtractor');
  }

  /**
   * Triggers media data extraction from Google Ads and runs conversion/control transformations.
   * 
   * @param {object} config - App config
   * @param {string} [accessToken] - OAuth access token
   * @returns {Promise<object>} Summary of the extracted and saved dataset
   */
  async extractAndTransform(config, accessToken = null) {
    this.log('Initializing historical ads data extraction run...');
    this.log(`Date range parameter: ${config.startDate} to ${config.endDate}`);
    this.log(`Media channels tracked: ${config.mediaChannels.join(', ')}`);

    let rawMedia = [];
    let rawKpi = [];
    let rawControls = [];

    if (accessToken && config.customerId) {
      try {
        this.log('Connecting to Google Ads API to fetch geographic media metrics...');
        rawMedia = await fetchMeridianAdsData(config, accessToken);
        this.log(`Successfully fetched ${rawMedia.length} geo-level records from API.`);
        
        // Since Google Ads API doesn't return business KPI data (sales/conversions on site)
        // or competitive pricing index controls, we merge them using our realistic simulator
        // to complete the required Meridian inputs.
        this.log('Complementing API media metrics with KPI & Control records...');
        const simulated = generateSimulatedMeridianData(config);
        rawKpi = simulated.kpi;
        rawControls = simulated.controls;
      } catch (err) {
        this.log(`API Query failed: ${err.message}. Falling back to simulation mode...`);
        const simulated = generateSimulatedMeridianData(config);
        rawMedia = simulated.media;
        rawKpi = simulated.kpi;
        rawControls = simulated.controls;
      }
    } else {
      this.log('No Google Ads credentials or access token found. Running in simulation mode...');
      const simulated = generateSimulatedMeridianData(config);
      rawMedia = simulated.media;
      rawKpi = simulated.kpi;
      rawControls = simulated.controls;
    }

    this.log('Performing data pivot and merging inputs for Marketing Mix Modeling (MMM)...');
    const summary = transformAndSaveMeridianData(rawMedia, rawKpi, rawControls);
    
    this.log('Transformation complete:');
    this.log(` - Output CSV: ${summary.inputCsvPath}`);
    this.log(` - Metadata JSON: ${summary.metadataPath}`);
    this.log(` - Total data points: ${summary.totalRecords} (Weeks: ${summary.weeksCount}, Regions: ${summary.regionsCount})`);
    
    return summary;
  }
}
