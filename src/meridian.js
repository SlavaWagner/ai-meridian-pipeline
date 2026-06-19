import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../storage/data');

/**
 * Transforms raw long-form arrays of media, KPI, and controls
 * into a single unified wide-format CSV file required by Google Meridian.
 * 
 * It pivots the media spend and impressions per channel, merges it with 
 * conversions (KPI) and controls, and saves it to storage/data/meridian_input.csv.
 * 
 * @param {Array} media - Raw media records
 * @param {Array} kpi - Raw KPI records
 * @param {Array} controls - Raw controls records
 * @returns {object} Paths of saved files and transformation details
 */
export function transformAndSaveMeridianData(media, kpi, controls) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Index KPI by date and region
  const kpiIndex = {};
  for (const item of kpi) {
    const key = `${item.date}_${item.region}`;
    kpiIndex[key] = item;
  }

  // 2. Index Controls by date and region
  const controlsIndex = {};
  for (const item of controls) {
    const key = `${item.date}_${item.region}`;
    controlsIndex[key] = item;
  }

  // 3. Group and pivot Media metrics by date and region
  // First, extract all unique channels to pivot
  const channels = [...new Set(media.map(m => m.channel))].sort();
  
  const mediaPivot = {};
  for (const item of media) {
    const key = `${item.date}_${item.region}`;
    if (!mediaPivot[key]) {
      mediaPivot[key] = {
        date: item.date,
        region: item.region
      };
      // Initialize channels
      for (const ch of channels) {
        mediaPivot[key][`${ch}_spend`] = 0;
        mediaPivot[key][`${ch}_impressions`] = 0;
      }
    }
    mediaPivot[key][`${item.channel}_spend`] += item.spend;
    mediaPivot[key][`${item.channel}_impressions`] += item.impressions;
  }

  // 4. Merge all lists into a single tabular dataset
  const rows = [];
  const allKeys = new Set([
    ...Object.keys(mediaPivot),
    ...Object.keys(kpiIndex),
    ...Object.keys(controlsIndex)
  ]);

  for (const key of allKeys) {
    const [date, region] = key.split('_');
    const mediaRow = mediaPivot[key] || {};
    const kpiRow = kpiIndex[key] || { conversions: 0, revenue: 0 };
    const controlRow = controlsIndex[key] || { priceIndex: 100, competitorSearchVolume: 50, seasonFactor: 1.0 };

    const row = {
      date,
      region,
      ...mediaRow,
      kpi_conversions: kpiRow.conversions,
      kpi_revenue: kpiRow.revenue,
      control_price_index: controlRow.priceIndex,
      control_competitor_search_volume: controlRow.competitorSearchVolume,
      control_season_factor: controlRow.seasonFactor
    };

    // Ensure all pivoted channel columns are populated even if mediaRow was empty
    for (const ch of channels) {
      if (row[`${ch}_spend`] === undefined) row[`${ch}_spend`] = 0;
      if (row[`${ch}_impressions`] === undefined) row[`${ch}_impressions`] = 0;
    }

    rows.push(row);
  }

  // Sort rows chronologically by date, then alphabetically by region
  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.region.localeCompare(b.region);
  });

  // 5. Convert to CSV
  // Define header columns
  const mediaHeaders = [];
  for (const ch of channels) {
    mediaHeaders.push(`${ch}_spend`, `${ch}_impressions`);
  }

  const csvHeaders = [
    'date',
    'region',
    ...mediaHeaders,
    'kpi_conversions',
    'kpi_revenue',
    'control_price_index',
    'control_competitor_search_volume',
    'control_season_factor'
  ];

  const csvLines = [csvHeaders.join(',')];
  for (const row of rows) {
    const line = csvHeaders.map(col => row[col]);
    csvLines.push(line.join(','));
  }

  const csvContent = csvLines.join('\n');
  const inputCsvPath = path.resolve(DATA_DIR, 'meridian_input.csv');
  fs.writeFileSync(inputCsvPath, csvContent, 'utf8');

  // Save metadata json detailing variables for the modeling script
  const metadata = {
    totalWeeks: [...new Set(rows.map(r => r.date))].length,
    regions: [...new Set(rows.map(r => r.region))].sort(),
    channels,
    columns: {
      date: 'date',
      region: 'region',
      kpi: 'kpi_conversions',
      mediaSpend: channels.map(ch => `${ch}_spend`),
      mediaImpressions: channels.map(ch => `${ch}_impressions`),
      controls: [
        'control_price_index',
        'control_competitor_search_volume',
        'control_season_factor'
      ]
    }
  };

  const metadataPath = path.resolve(DATA_DIR, 'meridian_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  return {
    inputCsvPath,
    metadataPath,
    totalRecords: rows.length,
    regionsCount: metadata.regions.length,
    weeksCount: metadata.totalWeeks,
    channels
  };
}
