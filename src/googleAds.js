import axios from 'axios';

/**
 * Build request headers for Google Ads API requests.
 */
function getHeaders(config, accessToken) {
  const headers = {
    'Content-Type': 'application/json',
    'developer-token': config.developerToken,
    'Authorization': `Bearer ${accessToken}`
  };

  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId.replace(/-/g, '');
  }

  return headers;
}

/**
 * Query geographic and media channel data from Google Ads API using searchStream.
 * Retrieves data segmented by Date and geographic province/region.
 * 
 * @param {object} config - Application configuration
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>} List of raw geographic performance records
 */
export async function fetchMeridianAdsData(config, accessToken) {
  const customerId = config.customerId.replace(/-/g, '');
  const url = `https://googleads.googleapis.com/${config.googleAdsVersion}/customers/${customerId}/googleAds:searchStream`;
  
  // GAQL query selecting impressions, clicks, cost micros segmented by date & geo_target_state
  // using campaign.advertising_channel_type to split into media channels (Search, Video/YouTube, PMax, Display)
    const query = `
    SELECT 
      segments.date,
      segments.geo_target_state,
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM geographic_view 
    WHERE segments.date BETWEEN '${config.startDate}' AND '${config.endDate}'
      AND campaign.status IN ('ENABLED', 'PAUSED')
  `.replace(/\s+/g, ' ').trim();

  try {
    const response = await axios.post(url, { query }, {
      headers: getHeaders(config, accessToken)
    });

    let allResults = [];
    if (Array.isArray(response.data)) {
      for (const chunk of response.data) {
        if (chunk.results && Array.isArray(chunk.results)) {
          allResults.push(...chunk.results);
        }
      }
    } else if (response.data && response.data.results) {
      allResults = response.data.results;
    }

    return allResults.map(item => {
      const gView = item.geographicView || {};
      const campaign = item.campaign || {};
      const metrics = item.metrics || {};
      const segments = item.segments || {};
      
      // Normalize Google Ads channel types to standard Meridian channel names
      let channel = 'Search';
      if (campaign.advertisingChannelType === 'PERFORMANCE_MAX') channel = 'Performance Max';
      else if (campaign.advertisingChannelType === 'VIDEO') channel = 'YouTube';
      else if (campaign.advertisingChannelType === 'DISPLAY') channel = 'Display';
      
      return {
        date: segments.date,
        region: segments.geoTargetState || 'National',
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel,
        impressions: parseInt(metrics.impressions || 0, 10),
        clicks: parseInt(metrics.clicks || 0, 10),
        spend: parseFloat(metrics.costMicros || 0) / 1000000
      };
    });
  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Google Ads searchStream API error: ${errorDetails}`);
  }
}

/**
 * Generate highly realistic time-series geographic and media metrics data for Google Meridian.
 * It simulates three years of weekly performance across multiple German states
 * (Bavaria, Berlin, Hamburg, North Rhine-Westphalia, Baden-Württemberg) and multiple channels.
 * 
 * It also returns matched conversions (KPI) and control variables (Seasonal factor, Pricing Index, Search Volume).
 * 
 * @param {object} config - Application configuration
 * @returns {object} Object containing media, kpi, and control lists.
 */
export function generateSimulatedMeridianData(config) {
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  
  const regions = ['DE-BY', 'DE-BE', 'DE-HH', 'DE-NW', 'DE-BW']; // Bavaria, Berlin, Hamburg, NRW, Baden-Wuerttemberg
  const channels = config.mediaChannels; // ['Search', 'Performance Max', 'YouTube', 'Display']
  
  const mediaData = [];
  const kpiData = [];
  const controlsData = [];

  // Define regional multipliers for realism
  const regionalMultipliers = {
    'DE-BY': { pop: 1.3, baselineSales: 10, searchSpend: 80, pmaxSpend: 100, ytSpend: 50, dispSpend: 20 },
    'DE-BE': { pop: 0.4, baselineSales: 4,  searchSpend: 30, pmaxSpend: 40,  ytSpend: 20, dispSpend: 8 },
    'DE-HH': { pop: 0.2, baselineSales: 2,  searchSpend: 20, pmaxSpend: 25,  ytSpend: 12, dispSpend: 5 },
    'DE-NW': { pop: 1.8, baselineSales: 14, searchSpend: 110,pmaxSpend: 130, ytSpend: 70, dispSpend: 30 },
    'DE-BW': { pop: 1.1, baselineSales: 9,  searchSpend: 70, pmaxSpend: 90,  ytSpend: 45, dispSpend: 18 }
  };

  // Generate weekly intervals
  let current = new Date(start);
  let weekIndex = 0;

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    // Seasonality factor (sine wave peaked in November/December, bottomed in Summer)
    const month = current.getMonth();
    const seasonFactor = 1.0 + 0.3 * Math.sin((month - 5) * Math.PI / 6); // peaks at index 10 (November)
    
    // Price Index control (slight inflation over 3 years)
    const priceIndex = 100.0 + (weekIndex * 0.05) + (Math.random() - 0.5) * 0.5;

    for (const region of regions) {
      const regionMeta = regionalMultipliers[region];
      
      let totalRegionalSpend = 0;
      let attributionSalesFromMedia = 0;

      // 1. Generate Media metrics per Channel
      for (const channel of channels) {
        let baseSpend = 0;
        let cpc = 1.0;
        let cpm = 5.0;
        
        switch (channel) {
          case 'Search':
            baseSpend = regionMeta.searchSpend;
            cpc = 1.80;
            break;
          case 'Performance Max':
            baseSpend = regionMeta.pmaxSpend;
            cpc = 1.10;
            cpm = 6.50;
            break;
          case 'YouTube':
            baseSpend = regionMeta.ytSpend;
            cpm = 4.00;
            break;
          case 'Display':
            baseSpend = regionMeta.dispSpend;
            cpm = 1.50;
            break;
          default:
            baseSpend = 3000;
        }

        // Add variance (weekly campaigns, budgets spikes)
        const weeklySpend = baseSpend * seasonFactor * (0.85 + Math.random() * 0.3);
        totalRegionalSpend += weeklySpend;

        let impressions = 0;
        let clicks = 0;

        if (channel === 'Search' || channel === 'Performance Max') {
          clicks = Math.round(weeklySpend / cpc);
          // CTR Search ~ 8%, PMax ~ 2%
          const ctr = channel === 'Search' ? 0.08 : 0.02;
          impressions = Math.round(clicks / ctr);
        } else {
          // CPM channel (YouTube, Display)
          impressions = Math.round((weeklySpend / cpm) * 1000);
          // YouTube CTR ~ 0.5%, Display ~ 0.3%
          const ctr = channel === 'YouTube' ? 0.005 : 0.003;
          clicks = Math.round(impressions * ctr);
        }

        mediaData.push({
          date: dateStr,
          region,
          channel,
          impressions,
          clicks,
          spend: parseFloat(weeklySpend.toFixed(2))
        });

        // Compute simulated contribution to sales:
        // Hill function saturation effect (Search has highest ROI, Display lowest)
        let roi = 1.2;
        if (channel === 'Search') roi = 2.4;
        else if (channel === 'Performance Max') roi = 1.8;
        else if (channel === 'YouTube') roi = 1.4;
        else if (channel === 'Display') roi = 0.6;

        // Diminishing returns (sqrt representation of saturation)
        attributionSalesFromMedia += roi * Math.sqrt(weeklySpend) * 0.1;
      }

      // 2. Generate Controls (Search Volume index for competitors, Seasonal factor)
      const competitorSearchVolume = Math.round(100 * seasonFactor * (0.9 + Math.random() * 0.2));
      controlsData.push({
        date: dateStr,
        region,
        priceIndex: parseFloat(priceIndex.toFixed(2)),
        competitorSearchVolume,
        seasonFactor: parseFloat(seasonFactor.toFixed(3))
      });

      // 3. Generate KPI (Sales / Conversions)
      // Sales = Baseline + Media Contribution + Seasonal Noise + Control variables (price penalty)
      const baseline = regionMeta.baselineSales * seasonFactor * (0.95 + Math.random() * 0.1);
      const pricePenalty = (priceIndex - 100.0) * -5.0 * regionMeta.pop; // higher prices lower sales
      
      const sales = Math.max(1, Math.round(baseline + attributionSalesFromMedia + pricePenalty + competitorSearchVolume * 0.02));
      const revenue = parseFloat((sales * 49.0).toFixed(2)); // assume average order value of 49 EUR

      kpiData.push({
        date: dateStr,
        region,
        conversions: sales,
        revenue
      });
    }

    // Advance to next week (7 days)
    current.setDate(current.getDate() + 7);
    weekIndex++;
  }

  return {
    media: mediaData,
    kpi: kpiData,
    controls: controlsData
  };
}
