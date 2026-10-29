# Data Sources Documentation: Tanzania Demographic Choropleth

This document details all public data sources collected for the Tanzania Demographic Choropleth interactive map, covering administrative boundaries, census demographics, health & wellbeing survey indicators, and infrastructure facility locations.

---

## 1. Administrative Boundaries

### 1.1 Regions (ADM1), Districts (ADM2), Wards (ADM3)
* **Publisher / Maintainer:** United Nations Office for the Coordination of Humanitarian Affairs (UN OCHA) ROSA & National Bureau of Statistics (NBS) Tanzania.
* **Dataset Name:** United Republic of Tanzania - Subnational Administrative Boundaries (Humanitarian Common Operational Datasets COD-AB `cod-ab-tza`).
* **Source URLs:**
  * Dataset Landing Page: https://data.humdata.org/dataset/cod-ab-tza
  * Admin 1 (Regions) Shapefile: https://data.humdata.org/dataset/451bdd28-d06d-46ea-91c0-2e081f884395/resource/55e9e1d3-6585-4e38-ae35-726875c1e8ed/download/tza_admbnda_adm1_20181019.zip
  * Admin 2 (Districts) Shapefile: https://data.humdata.org/dataset/451bdd28-d06d-46ea-91c0-2e081f884395/resource/50fec0b7-ba83-43fb-bb1c-941e2dbc7a95/download/tza_admbnda_adm2_20181019.zip
  * Admin 3 (Wards) Shapefile: https://data.humdata.org/dataset/451bdd28-d06d-46ea-91c0-2e081f884395/resource/930fb85d-f508-4e56-a7d6-0da021364861/download/tza_admbnda_adm3_20181019.zip
  * Gazetteer (Excel): https://data.humdata.org/dataset/451bdd28-d06d-46ea-91c0-2e081f884395/resource/076ad43a-0651-4077-87ed-40eb0f52112f/download/tza_admgz_20181019.xlsx
* **Publication Date:** 2018-10-19 (incorporating Songwe Region division).
* **Licence:** Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO / CC BY 4.0).
* **Coverage:**
  * ADM1: 31 Regions (26 Mainland + 5 Zanzibar).
  * ADM2: 170 Districts / Councils.
  * ADM3: 3,643 Wards.
* **Cached In:** `data/raw/adm1/`, `data/raw/adm2/`, `data/raw/adm3/`, `data/raw/tza_admgz_20181019.xlsx`.

### 1.2 geoBoundaries (Secondary Reference)
* **Publisher:** William & Mary geoBoundaries Lab.
* **Dataset Name:** geoBoundaries Open (gbOpen) Tanzania (TZA).
* **Source URLs:**
  * ADM1: https://www.geoboundaries.org/api/v4/gbOpen/TZA/ADM1/
  * ADM2: https://www.geoboundaries.org/api/v4/gbOpen/TZA/ADM2/
  * ADM3: https://www.geoboundaries.org/api/v4/gbOpen/TZA/ADM3/
* **Publication Date:** Releases 2015 - 2021.
* **Licence:** Open Data Commons Open Database License (ODbL) / CC BY 4.0.
* **Note:** HDX COD-AB is preferred as the primary administrative reference because it contains official OCHA/NBS P-codes matching national census publications.

### 1.3 Villages and Sub-Villages (Vitongoji / Mitaa)
* **Publisher:** Humanitarian OpenStreetMap Team (HOTOSM) & OpenStreetMap Contributors.
* **Dataset Name:** Populated Places of Tanzania (`hotosm_tza_populated_places`).
* **Source URL:** https://production-raw-data-api.s3.amazonaws.com/ISO3/TZA/populated_places/hotosm_tza_populated_places_osm_geojson.zip (via HDX: https://data.humdata.org/dataset/hotosm_tza_populated_places).
* **Publication Date:** 2024 (continuously updated).
* **Licence:** Open Database License (ODbL 1.0).
* **Coverage:** 140,981 populated place entries, including 10,976 verified villages (`place=village`), 1,514 hamlets (`place=hamlet`), 213 towns, and 39 cities.
* **Geometry Note:** Official boundary polygons for villages/vitongoji do not exist in digital public GIS databases (NBS does not publish nationwide polygon boundaries for vitongoji). Therefore, villages are represented truthfully as point locations (centroids and point nodes) linked to parent wards and districts rather than synthetic fake polygons.
* **Cached In:** `data/raw/populated_places/`.

---

## 2. Census Demographics

### 2.1 NBS Tanzania 2022 Population and Housing Census (PHC)
* **Publisher:** National Bureau of Statistics (NBS) Tanzania & Office of the Chief Government Statistician (OCGS) Zanzibar.
* **Publication Dates:** December 2022 & June 2024.
* **Licence:** Government Open Data / Official Public Statistics of the United Republic of Tanzania (Public Information / Free reuse with attribution).
* **Source Documents & URLs:**
  * **Volume 1A: Administrative Units Population Distribution Report**
    * URL: https://www.nbs.go.tz/uploads/statistics/documents/en-1705484562-Administrative_units_Population_Distribution_Report_Tanzania_volume1a.pdf
    * Content: Total population (61,741,120), male/female breakdown, sex ratio, number of private households (14,297,184), and average household size (4.3) for national, all 31 regions, 170+ councils/districts, and individual wards.
  * **Volume 1B: Tanzania Mainland Administrative Units Report**
    * URL: https://www.nbs.go.tz/uploads/statistics/documents/en-1705484561-Administrative_units_Population_Distribution_Report_Tanzania_Mainland_volume1b.pdf
  * **Volume 1C: Tanzania Zanzibar Administrative Units Report**
    * URL: https://www.nbs.go.tz/uploads/statistics/documents/en-1705484561-Administrative_units_Population_Distribution_Report_Tanzania_Zanzibar_volume1c.pdf
  * **Age and Sex Distribution Key Findings Report**
    * URL: https://www.nbs.go.tz/uploads/statistics/documents/en-1705484562-Age_and_Sex_Distribution_Key_Finding_Report_Tanzania.pdf
    * Content: Table 3 (pages 9-10) with regional percentages: `% children under 15` (0-14), `% elderly 65+`, `dependency ratio`, `women of reproductive age`, `urban %`, and `rural %`.
  * **Basic Demographic and Socio-Economic Profile (URT)**
    * URL: https://www.nbs.go.tz/uploads/statistics/documents/en-1738321655-01.%20URT_Demographic%20and%20Socioeconomic%20Profile.pdf
* **Cached In:** `data/raw/admin_report_vol1a.pdf`, `data/raw/age_sex_key_findings.pdf`.

### 2.2 NBS Tanzania 2012 Population and Housing Census Baseline
* **Publisher:** NBS Tanzania (curated on HDX).
* **Dataset Name:** Tanzania population by ward (adm3) baseline (`population-by-ward-adm3`).
* **Source URL:** https://data.humdata.org/dataset/413174ce-fc61-42eb-99e5-41a96c9fda2f/resource/85a5f741-4aac-45e6-88b3-09b944884600/download/tza_pop_popn_nbs_baselinedata.xlsx
* **Publication Date:** 2012 Census baseline, republished on HDX.
* **Licence:** Creative Commons Attribution (CC BY 4.0).
* **Coverage:** 3,643 wards, total population 44,928,923, male/female, urban/rural population, area in km², population density.
* **Usage:** Provides the historical baseline to compute the intercensal growth rate (2012–2022) at ward, district, and regional levels.
* **Cached In:** `data/raw/tza_pop_popn_nbs_baselinedata.xlsx`.

---

## 3. Health, Wellbeing & Socio-Economic Indicators

### 3.1 Tanzania Demographic and Health Survey (TDHS-MIS 2022)
* **Publisher:** The DHS Program (USAID / ICF) in collaboration with NBS Tanzania and Ministry of Health.
* **Dataset Name:** Tanzania Demographic and Health Survey and Malaria Indicator Survey 2022 (`TZ2022DHS`).
* **Source API:** DHS REST API (`http://api.dhsprogram.com/rest/dhs/data`).
* **Publication Date:** 2022 (finalized 2023).
* **Licence:** Open access for research, development, and public dissemination with citation.
* **Indicators Collected at Regional Level (ADM1):**
  * `FE_FRTR_W_TFR`: Total Fertility Rate (TFR, children per woman).
  * `CN_NUTS_C_HA2`: Stunting prevalence (% of children under 5 who are stunted, height-for-age < -2 SD).
  * `CM_ECMR_C_U5M`: Under-5 Mortality Rate (deaths per 1,000 live births).
  * `RH_DELP_C_DHF`: Facility-based delivery (% of live births delivered in a health facility).
  * `ED_LITR_W_LIT`: Female literacy rate (% women literate).
  * `HC_ELEC_H_ELC`: Household electricity access (% of households with electricity).
  * `WS_SRCE_H_IMP`: Improved drinking water source (% of households using improved water).
  * `WS_TLET_H_IMP`: Improved sanitation (% of households using improved toilet facilities).
* **Cached In:** `data/raw/dhs_tz2022_subnational.json`.

---

## 4. Infrastructure & Facility Data

### 4.1 Health Facilities
* **Publisher:** Humanitarian OpenStreetMap Team (HOTOSM) & OpenStreetMap Contributors.
* **Dataset Name:** Health Facilities of Tanzania (`hotosm_tza_health_facilities`).
* **Source URL:** https://production-raw-data-api.s3.amazonaws.com/ISO3/TZA/health_facilities/hotosm_tza_health_facilities_osm_geojson.zip
* **Publication Date:** 2024.
* **Licence:** Open Database License (ODbL 1.0).
* **Coverage:** 7,218 hospitals, health centres, dispensaries, and clinics across Tanzania with pre-tagged ADM1, ADM2, and ADM3 P-codes.
* **Usage:** Aggregated to compute "Health facility count per 10,000 people" across regions, districts, and wards.
* **Cached In:** `data/raw/health_facilities/`.

### 4.2 Education Facilities
* **Publisher:** Humanitarian OpenStreetMap Team (HOTOSM) & OpenStreetMap Contributors.
* **Dataset Name:** Education Facilities of Tanzania (`hotosm_tza_education_facilities`).
* **Source URL:** https://production-raw-data-api.s3.amazonaws.com/ISO3/TZA/education_facilities/hotosm_tza_education_facilities_osm_geojson.zip
* **Publication Date:** 2024.
* **Licence:** Open Database License (ODbL 1.0).
* **Coverage:** 103,370 primary schools, secondary schools, kindergartens, colleges, and university facilities across Tanzania with ADM P-codes.
* **Usage:** Aggregated to compute "School count per 1,000 children (<15)" across regions, districts, and wards.
* **Cached In:** `data/raw/education_facilities/`.

---

## 5. Gridded Population & Zonal Statistics (WorldPop / Meta)
* **Publisher:** WorldPop / Meta High Resolution Population Density Maps.
* **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0).
* **Usage:** Serves as spatial validation for rural population distribution patterns and density checks. Official NBS census enumeration counts are preserved as the ground-truth authoritative data.

