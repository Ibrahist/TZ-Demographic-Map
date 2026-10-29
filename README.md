# Tanzania Demographic & Health Interactive Choropleth Map

An interactive, subnational demographic choropleth visualization and drill-down application for Tanzania, built with **Next.js**, **TypeScript**, **Tailwind CSS**, and the **Google Maps JavaScript API Data Layer**.

The application lets users explore administrative levels (**Region**, **District**, **Ward**, **Village**) across 20+ demographic, socioeconomic, and health indicators from official public datasets.

---

## Features

* **Multi-Tier Administrative Hierarchy:**
  * **Region Level (ADM1):** 31 regions (26 Tanzania Mainland + 5 Zanzibar).
  * **District / Council Level (ADM2):** 170 Local Government Authorities (LGAs).
  * **Ward Level (ADM3):** 3,643 wards, with on-demand district-based lazy-loading.
  * **Village / Settlement Level:** 10,000+ genuine point locations derived from OpenStreetMap census-tagged records.
* **Official Data Indicators:**
  * **Population & Structure:** Total population (2022 PHC), population density (people/km² using `EPSG:32736`), sex ratio, % children under 15, % elderly 65+, average household size, number of private households.
  * **Growth & Migration:** 2012–2022 intercensal annual growth rate, urban share %, rural share %.
  * **Health & Wellbeing:** Total Fertility Rate (TFR), child stunting prevalence (% < -2 SD), under-5 mortality rate, facility-based deliveries %, health facility count, and health facility density per 10,000 people.
  * **Education & Economy:** Female literacy rate, school count, school density per 1,000 children (<15), household electricity access %, improved water source %, improved sanitation %, agricultural livelihood share %.
* **Smart Indicator Availability:**
  * Indicators not published at a selected level are greyed out with an informative notice (*"Not available at this level"*), preserving analytical integrity without fabricating data.
* **Choropleth Controls & Classification:**
  * Classification algorithms: **Natural Breaks (Fisher-Jenks / ckmeans)**, **Quantiles**, and **Equal Step**.
  * Palettes: Color-blind-safe palettes (**Viridis**, **Cividis**, **Magma**, **Plasma**) and sequential ramps (**Blues**, **Greens**, **YlOrRd**, **Purples**).
  * Dynamic opacity slider (10% to 100%).
  * Light & Dark mode base maps.
* **Spatial Interactions:**
  * **Hover Tooltip:** Dynamic hover card showing unit name, parent units, indicator value, and national/subnational rank.
  * **Click-to-Drill-Down:** Clicking a region zooms into its districts; clicking a district lazy-loads its wards and villages.
  * **Interactive Breadcrumbs:** `Tanzania > Region > District > Ward` trail for seamless navigation.
  * **Autocomplete Search:** Instantly search by name across all administrative tiers.
  * **Legend:** Dynamic color swatches with break ranges, missing data indicator, and data sources footer.
* **Exports:**
  * **CSV Export:** Download the current view's demographic data table.
  * **PNG Export:** Capture and export high-resolution screenshots of the choropleth map.

---

## Quickstart & Setup

### 1. Requirements
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **Python**: 3.10+ (with `pandas`, `geopandas`, `shapely`, `pypdf`, `openpyxl`, `requests`)

### 2. Environment Configuration
Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Set your Google Maps API key in `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_api_key_here
```

> **Note on API Key**: The app also includes an in-app API Key Configuration modal where you can enter a key directly in the browser during development without editing files.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## Data Pipeline: Reproducing from Raw Sources

The end-to-end data pipeline is automated and reproducible with a single command:

```bash
python -m pipeline.run
```

### Pipeline Steps:
1. `pipeline/extract_census.py`: Extracts 2012 and 2022 Census data from NBS publications (`admin_report_vol1a.pdf` and `age_sex_key_findings.pdf`).
2. `pipeline/extract_dhs.py`: Parses regional health and wellbeing indicators from the official DHS Program REST API (`TZ2022DHS`).
3. `pipeline/extract_facilities.py`: Aggregates 7,218 health facilities and 103,370 schools by region, district, and ward.
4. `pipeline/build_datasets.py`:
   - Computes land areas in square kilometers using equal-area UTM projection `EPSG:32736`.
   - Joins boundary shapefiles (`adm1`, `adm2`, `adm3`) with demographics via official P-codes.
   - Computes derived indicators (population density, sex ratio, growth rate, facility ratios).
   - Generates `/data/unmatched.csv` for any administrative remappings.
5. `pipeline/build_villages.py`: Filters 140,000+ OpenStreetMap populated places into representative village points and partitions them by district.
6. `pipeline/simplify_and_export.py`: Uses `mapshaper` to simplify geometries preserving topological consistency and outputs lightweight GeoJSONs to `data/processed/`.
7. `pipeline/validate.py`: Executes automated integrity and reconciliation checks against official census totals.

---

## Validation Checks & Accuracy

The pipeline executes rigorous automated checks:

| Validation Test | Expected | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Regional Count** | 31 regions | 31 regions | **PASS** |
| **District Count** | 170 districts | 170 districts | **PASS** |
| **Ward Count** | ~3,643 wards | 3,643 wards | **PASS** |
| **National Population (Region Sum)** | 61,741,120 | 61,741,120 (0.0000% error) | **PASS** |
| **National Population (District Sum)** | 61,741,120 | 61,741,135 (0.00002% rounding diff) | **PASS** |
| **National Population (Ward Sum)** | 61,741,120 | 61,741,135 (0.00002% rounding diff) | **PASS** |

---

## Data Sources & Licences

Detailed source documentation is maintained in [`data/SOURCES.md`](file:///d:/ForgeDataz/data/SOURCES.md).

1. **Administrative Boundaries:**
   * UN OCHA ROSA & NBS Tanzania (Common Operational Datasets COD-AB).
   * Licence: Creative Commons Attribution (CC BY 4.0 / CC BY-IGO).
2. **2022 Population and Housing Census (PHC):**
   * National Bureau of Statistics (NBS) Tanzania & Office of the Chief Government Statistician (OCGS) Zanzibar.
   * Licence: Official Government Statistics / Public Open Data.
3. **2012 Census Ward Baseline:**
   * NBS Tanzania & HDX.
   * Licence: CC BY 4.0.
4. **Tanzania Demographic and Health Survey (TDHS-MIS 2022):**
   * The DHS Program (USAID / ICF) & NBS Tanzania.
   * Licence: Open research and development data.
5. **Health & Education Facilities & Populated Places:**
   * Humanitarian OpenStreetMap Team (HOTOSM) & OpenStreetMap Contributors.
   * Licence: Open Database License (ODbL 1.0).

---

## Limitations & Methodological Notes

1. **Village-Level Geometry:** Digital polygon boundaries for villages and sub-villages (*vitongoji / mitaa*) are not published nationwide by NBS in vector format. To avoid fabricating fake synthetic polygons, villages are represented truthfully as point locations with exact coordinates.
2. **Songwe Region Split:** Songwe was formally established from western Mbeya in 2016. The 66 wards reassigned from Mbeya (`TZ12`) to Songwe (`TZ26`) have been reconciled with 100% attribute preservation, documented in `data/unmatched.csv`.
3. **Multi-Year Baselines:** Census figures reflect the 2022 PHC reference night (August 2022), DHS indicators reflect the 2022 survey, and facility counts reflect HOTOSM 2024 infrastructure registries.

