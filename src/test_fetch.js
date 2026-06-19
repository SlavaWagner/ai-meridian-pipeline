import { getConfig, getAccessToken } from './config.js';
import { fetchMeridianAdsData } from './googleAds.js';

async function main() {
  const config = getConfig();
  config.customerId = '234-385-3998';
  
  // Set date range covering the active campaign period in 2026
  config.startDate = '2026-04-01';
  config.endDate = '2026-06-19';
  
  console.log(`Testing geographic data fetch for Customer ID: ${config.customerId} between ${config.startDate} and ${config.endDate}`);
  try {
    const token = await getAccessToken();
    const data = await fetchMeridianAdsData(config, token);
    
    console.log(`\nSUCCESS! Fetched ${data.length} geo-segmented performance records.`);
    if (data.length > 0) {
      console.log('Sample geo records:');
      data.slice(0, 5).forEach((record, idx) => {
        console.log(`  [${idx + 1}] Date: ${record.date} | Region: ${record.region} | Channel: ${record.channel} | Imps: ${record.impressions} | Spend: ${record.spend.toFixed(2)} EUR`);
      });
    }
  } catch (err) {
    console.error('ERROR during geographic query test:', err.message);
  }
}

main();
