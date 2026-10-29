export type AdminLevel = 'region' | 'district' | 'ward' | 'village';

export type ColorScaleMethod = 'quantile' | 'natural_breaks' | 'equal_interval';

export type PaletteName = 
  | 'Viridis' 
  | 'Magma' 
  | 'Plasma' 
  | 'Cividis' 
  | 'Blues' 
  | 'Greens' 
  | 'YlOrRd' 
  | 'Purples';

export interface IndicatorMeta {
  id: string;
  label: string;
  category: string;
  unit: string;
  format: 'integer' | 'decimal1' | 'percent1';
  description: string;
  available_levels: AdminLevel[];
  source: string;
  palette: string;
}

export interface FeatureProperties {
  name: string;
  level: AdminLevel;
  pcode: string;
  area_km2?: number;
  total_population?: number;
  population_density?: number;
  sex_ratio?: number;
  pct_under_15?: number;
  pct_65_plus?: number;
  avg_household_size?: number;
  num_households?: number;
  growth_rate_2012_2022?: number;
  pct_urban?: number;
  pct_rural?: number;
  fertility_rate?: number;
  stunting_rate?: number;
  under_5_mortality?: number;
  facility_births_pct?: number;
  health_facility_density?: number;
  health_facilities_count?: number;
  literacy_rate?: number;
  schools_count?: number;
  school_density_children?: number;
  electricity_access_pct?: number;
  improved_water_pct?: number;
  improved_sanitation_pct?: number;
  agriculture_share_pct?: number;
  parent_district_pcode?: string;
  parent_district_name?: string;
  parent_region_pcode?: string;
  parent_region_name?: string;
  place?: string; // for villages
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface BreadcrumbItem {
  level: AdminLevel | 'national';
  name: string;
  pcode?: string;
}

export interface HoverTooltipData {
  name: string;
  pcode: string;
  level: AdminLevel;
  parentName?: string;
  indicatorLabel: string;
  value: number | null;
  formattedValue: string;
  unit: string;
  rank?: number;
  totalUnits?: number;
  x: number;
  y: number;
  properties?: FeatureProperties;
}

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
}

