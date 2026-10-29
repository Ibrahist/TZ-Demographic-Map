from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
UNMATCHED_FILE = BASE_DIR / "data" / "unmatched.csv"
METADATA_FILE = PROCESSED_DIR / "indicators_metadata.json"

# Projections
WGS84 = "EPSG:4326"
EQUAL_AREA_CRS = "EPSG:32736" # UTM Zone 36S (Tanzania center-west, high precision area)

# Indicator Catalog
INDICATORS = [
    # Category: Population & Structure
    {
        "id": "total_population",
        "label": "Total Population",
        "category": "Population & Structure",
        "unit": "people",
        "format": "integer",
        "description": "Total enumerated population (2022 PHC)",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "Blues"
    },
    {
        "id": "population_density",
        "label": "Population Density",
        "category": "Population & Structure",
        "unit": "people/km²",
        "format": "decimal1",
        "description": "Population divided by land area in square kilometers",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census & COD-AB Area",
        "palette": "YlOrRd"
    },
    {
        "id": "sex_ratio",
        "label": "Sex Ratio",
        "category": "Population & Structure",
        "unit": "males per 100 females",
        "format": "decimal1",
        "description": "Number of males per 100 females",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "PuOr"
    },
    {
        "id": "pct_under_15",
        "label": "% Children Under 15",
        "category": "Population & Structure",
        "unit": "%",
        "format": "percent1",
        "description": "Proportion of population aged 0–14 years",
        "available_levels": ["region"],
        "source": "NBS 2022 Census Age & Sex Report",
        "palette": "Purples"
    },
    {
        "id": "pct_65_plus",
        "label": "% Elderly (65+)",
        "category": "Population & Structure",
        "unit": "%",
        "format": "percent1",
        "description": "Proportion of population aged 65 years and older",
        "available_levels": ["region"],
        "source": "NBS 2022 Census Age & Sex Report",
        "palette": "BuPu"
    },
    {
        "id": "avg_household_size",
        "label": "Average Household Size",
        "category": "Population & Structure",
        "unit": "persons/hh",
        "format": "decimal1",
        "description": "Average number of persons per private household",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "Viridis"
    },
    {
        "id": "num_households",
        "label": "Number of Households",
        "category": "Population & Structure",
        "unit": "households",
        "format": "integer",
        "description": "Total number of private households",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "Teal"
    },

    # Category: Growth & Migration
    {
        "id": "growth_rate_2012_2022",
        "label": "2012–2022 Population Growth Rate",
        "category": "Growth & Migration",
        "unit": "% / year",
        "format": "percent1",
        "description": "Annual exponential intercensal growth rate between 2012 and 2022",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2012 & 2022 Censuses",
        "palette": "RdYlGn"
    },
    {
        "id": "pct_urban",
        "label": "Urban Population Share",
        "category": "Growth & Migration",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of population living in designated urban areas",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "Spectral"
    },
    {
        "id": "pct_rural",
        "label": "Rural Population Share",
        "category": "Growth & Migration",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of population living in designated rural areas",
        "available_levels": ["region", "district", "ward"],
        "source": "NBS 2022 Census",
        "palette": "YlGn"
    },

    # Category: Health & Wellbeing
    {
        "id": "fertility_rate",
        "label": "Total Fertility Rate (TFR)",
        "category": "Health & Wellbeing",
        "unit": "births/woman",
        "format": "decimal1",
        "description": "Average number of children born per woman aged 15-49",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "Oranges"
    },
    {
        "id": "stunting_rate",
        "label": "Child Stunting Rate",
        "category": "Health & Wellbeing",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of children under 5 who are stunted (height-for-age < -2 SD)",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "Reds"
    },
    {
        "id": "under_5_mortality",
        "label": "Under-5 Mortality Rate",
        "category": "Health & Wellbeing",
        "unit": "deaths / 1k live births",
        "format": "integer",
        "description": "Probability of dying before reaching age 5 per 1,000 live births",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "Reds"
    },
    {
        "id": "facility_births_pct",
        "label": "Facility-Based Births",
        "category": "Health & Wellbeing",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of live births delivered in a health facility",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "Blues"
    },
    {
        "id": "health_facility_density",
        "label": "Health Facilities per 10k People",
        "category": "Health & Wellbeing",
        "unit": "facilities / 10k",
        "format": "decimal1",
        "description": "Count of operational hospitals, health centres, and dispensaries per 10,000 population",
        "available_levels": ["region", "district", "ward"],
        "source": "HOTOSM & NBS 2022 Census",
        "palette": "Greens"
    },
    {
        "id": "health_facilities_count",
        "label": "Health Facility Count",
        "category": "Health & Wellbeing",
        "unit": "facilities",
        "format": "integer",
        "description": "Total count of hospitals, clinics, health centres, and dispensaries",
        "available_levels": ["region", "district", "ward"],
        "source": "HOTOSM",
        "palette": "YlGnBu"
    },

    # Category: Education & Economy
    {
        "id": "literacy_rate",
        "label": "Literacy Rate",
        "category": "Education & Economy",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of women age 15–49 who can read and write",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "YlGnBu"
    },
    {
        "id": "schools_count",
        "label": "School Count",
        "category": "Education & Economy",
        "unit": "schools",
        "format": "integer",
        "description": "Total count of primary, secondary, and tertiary educational institutions",
        "available_levels": ["region", "district", "ward"],
        "source": "HOTOSM",
        "palette": "Blues"
    },
    {
        "id": "school_density_children",
        "label": "Schools per 1,000 Children (<15)",
        "category": "Education & Economy",
        "unit": "schools / 1k children",
        "format": "decimal1",
        "description": "Number of educational facilities per 1,000 children under 15",
        "available_levels": ["region", "district"],
        "source": "HOTOSM & NBS 2022 Census",
        "palette": "Purples"
    },
    {
        "id": "electricity_access_pct",
        "label": "Electricity Access",
        "category": "Education & Economy",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of households with electricity",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "YlOrRd"
    },
    {
        "id": "improved_water_pct",
        "label": "Improved Water Source",
        "category": "Education & Economy",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of households using improved drinking water sources",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "PuBu"
    },
    {
        "id": "improved_sanitation_pct",
        "label": "Improved Sanitation",
        "category": "Education & Economy",
        "unit": "%",
        "format": "percent1",
        "description": "Percentage of households with improved toilet facilities",
        "available_levels": ["region"],
        "source": "Tanzania DHS 2022",
        "palette": "Teal"
    },
    {
        "id": "agriculture_share_pct",
        "label": "Agricultural Livelihood Share",
        "category": "Education & Economy",
        "unit": "%",
        "format": "percent1",
        "description": "Share of households engaged in agriculture and livestock production",
        "available_levels": ["region"],
        "source": "NBS Socio-Economic Profile",
        "palette": "YlGn"
    }
]

