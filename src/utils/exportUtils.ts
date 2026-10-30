import { FeatureProperties } from '@/types';

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  if (typeof window === 'undefined') return;
  
  // Extract keys excluding complex geometry
  const keys = Object.keys(data[0]).filter(k => k !== 'geometry');
  
  const csvRows: string[] = [];
  // Header row
  csvRows.push(keys.map(k => `"${k}"`).join(','));
  
  // Data rows
  for (const item of data) {
    const row = keys.map(k => {
      let val = item[k];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportMapToPNG(elementId: string, filename: string) {
  if (typeof window === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PNG export.`);
    return;
  }
  
  try {
    // Dynamic import to avoid SSR and Webpack module initialization errors
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2, // High resolution
      backgroundColor: '#0f172a'
    });
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = image;
    link.click();
  } catch (err) {
    console.error('Failed to export map as PNG:', err);
  }
}


export function sanitizeFilename(name: string): string {
  return (name || 'area')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');
}

export function exportAreaToCSV(area: FeatureProperties | Record<string, any>, filename: string) {
  if (!area || typeof window === 'undefined') return;

  const rows: string[] = [];
  rows.push('"--- TANZANIA DEMOGRAPHIC AREA REPORT ---",""');
  rows.push('"Export Date"', `"${new Date().toLocaleString()}"`);
  rows.push('"Source"', '"National Bureau of Statistics (NBS) 2022 Census & Tanzania DHS"');
  rows.push('""', '""');
  rows.push('"--- SUMMARY ATTRIBUTES ---"', '""');
  rows.push('"Metric / Property"', '"Value"');

  const orderedFields: Array<{ key: string; label: string; format?: (v: any) => string }> = [
    { key: 'name', label: 'Area Name' },
    { key: 'level', label: 'Administrative Level' },
    { key: 'pcode', label: 'P-Code / Administrative ID' },
    { key: 'parent_region_name', label: 'Parent Region' },
    { key: 'parent_district_name', label: 'Parent District' },
    { key: 'adm1_name', label: 'Region (Adm1)' },
    { key: 'adm2_name', label: 'District (Adm2)' },
    { key: 'adm3_name', label: 'Ward (Adm3)' },
    { key: 'total_population', label: 'Total Population', format: (v) => Number(v).toLocaleString() },
    { key: 'area_km2', label: 'Land Area (km²)', format: (v) => Number(v).toFixed(2) },
    { key: 'population_density', label: 'Population Density (persons/km²)', format: (v) => Number(v).toFixed(1) },
    { key: 'num_households', label: 'Number of Households', format: (v) => Number(v).toLocaleString() },
    { key: 'avg_household_size', label: 'Average Household Size', format: (v) => Number(v).toFixed(1) },
    { key: 'growth_rate_2012_2022', label: '10-Year Growth Rate (%/yr)', format: (v) => `${Number(v) > 0 ? '+' : ''}${v}%` },
    { key: 'pct_urban', label: 'Urban Population Share (%)', format: (v) => `${v}%` },
    { key: 'pct_rural', label: 'Rural Population Share (%)', format: (v) => `${v}%` },
    { key: 'sex_ratio', label: 'Sex Ratio (Males per 100 Females)' },
    { key: 'pct_under_15', label: 'Children Under 15 (%)', format: (v) => `${v}%` },
    { key: 'pct_65_plus', label: 'Elderly 65+ (%)', format: (v) => `${v}%` },
    { key: 'health_facilities_count', label: 'Total Health Facilities' },
    { key: 'health_facility_density', label: 'Health Facility Density (/10k pop)' },
    { key: 'schools_count', label: 'Total Schools' },
    { key: 'school_density_children', label: 'Schools per 1,000 School-Age Children' },
    { key: 'electricity_access_pct', label: 'Electricity Access (%)', format: (v) => `${v}%` },
    { key: 'improved_water_pct', label: 'Improved Water Source (%)', format: (v) => `${v}%` },
    { key: 'improved_sanitation_pct', label: 'Improved Sanitation (%)', format: (v) => `${v}%` },
    { key: 'fertility_rate', label: 'Total Fertility Rate (TFR)' },
    { key: 'stunting_rate', label: 'Child Stunting Rate (%)', format: (v) => `${v}%` },
    { key: 'under_5_mortality', label: 'Under-5 Mortality Rate (/1,000 live births)' },
    { key: 'facility_births_pct', label: 'Health Facility Deliveries (%)', format: (v) => `${v}%` },
    { key: 'literacy_rate', label: 'Literacy Rate (%)', format: (v) => `${v}%` },
    { key: 'agriculture_share_pct', label: 'Agricultural Employment (%)', format: (v) => `${v}%` },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' }
  ];

  for (const field of orderedFields) {
    const raw = area[field.key];
    if (raw !== undefined && raw !== null && raw !== '') {
      const valStr = field.format ? field.format(raw) : String(raw);
      rows.push(`"${field.label}","${valStr.replace(/"/g, '""')}"`);
    }
  }

  const handledKeys = new Set(orderedFields.map(f => f.key));
  handledKeys.add('geometry');
  handledKeys.add('type');

  for (const [key, value] of Object.entries(area)) {
    if (!handledKeys.has(key) && value !== null && value !== undefined && typeof value !== 'object') {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      rows.push(`"${formattedKey}","${String(value).replace(/"/g, '""')}"`);
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAreaToGeoJSON(area: FeatureProperties | Record<string, any>, geometry: any, filename: string) {
  if (!area || typeof window === 'undefined') return;

  const properties: Record<string, any> = { ...area };
  delete properties.geometry;

  let validGeometry = geometry || area.geometry;
