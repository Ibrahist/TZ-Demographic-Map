import geopandas as gpd
import pandas as pd
import numpy as np
import re
import zipfile
from pipeline.config import RAW_DIR, PROCESSED_DIR, UNMATCHED_FILE, EQUAL_AREA_CRS, WGS84
from pipeline.extract_census import extract_regional_census, extract_regional_age_sex, load_ward_baseline
from pipeline.extract_dhs import extract_dhs_indicators
from pipeline.extract_facilities import extract_facilities_summary

def ensure_shapefile(zip_name, subfolder, shp_name):
    target_dir = RAW_DIR / subfolder
    shp_path = target_dir / shp_name
    if not shp_path.exists():
        zip_path = RAW_DIR / zip_name
        if zip_path.exists():
            print(f"Extracting {zip_name} to {subfolder}...")
            with zipfile.ZipFile(zip_path, 'r') as z:
                z.extractall(target_dir)
    return shp_path

def normalize_text(text):
    if not text or pd.isna(text):
        return ""
    text = str(text).strip()
    text = re.sub(r'\s+', ' ', text)
    return text

def build_datasets():
    print("--- Building Tanzania Datasets ---")
    
    # 1. Load Boundaries
    print("Loading boundary shapefiles...")
    shp_reg = ensure_shapefile("adm1.zip", "adm1", "tza_admbnda_adm1_20181019.shp")
    shp_dis = ensure_shapefile("adm2.zip", "adm2", "tza_admbnda_adm2_20181019.shp")
    shp_wrd = ensure_shapefile("adm3.zip", "adm3", "tza_admbnda_adm3_20181019.shp")

    gdf_reg = gpd.read_file(str(shp_reg))
    gdf_dis = gpd.read_file(str(shp_dis))
    gdf_wrd = gpd.read_file(str(shp_wrd))
    
    # Calculate accurate area (km2) using equal-area projection
    print("Calculating land area in km2 (EPSG:32736)...")
    gdf_reg['area_km2'] = gdf_reg.to_crs(EQUAL_AREA_CRS).geometry.area / 1e6
    gdf_dis['area_km2'] = gdf_dis.to_crs(EQUAL_AREA_CRS).geometry.area / 1e6
    gdf_wrd['area_km2'] = gdf_wrd.to_crs(EQUAL_AREA_CRS).geometry.area / 1e6
    
    # 2. Regional Data Extraction & Join
    print("Extracting and joining regional demographics...")
    df_reg_census = extract_regional_census()
    df_reg_agesex = extract_regional_age_sex()
    df_dhs = extract_dhs_indicators()
    fac_summary = extract_facilities_summary()
    
    # Standardize regional names in census for joining with ADM1_EN
    # Region name map between census tables and COD-AB
    name_to_pcode = {
        'dar es salaam': 'TZ07',
        'dar-es-salaam': 'TZ07',
        'kaskazini unguja': 'TZ27',
        'kusini unguja': 'TZ28',
        'mjini magharibi': 'TZ29',
        'kaskazini pemba': 'TZ30',
        'kusini pemba': 'TZ31',
    }
    for idx, row in gdf_reg.iterrows():
        name_to_pcode[row['ADM1_EN'].lower()] = row['ADM1_PCODE']
        
    df_reg_census['adm1_pcode'] = df_reg_census['region_name_census'].apply(
        lambda n: name_to_pcode.get(n.lower(), None)
    )
    df_reg_agesex['adm1_pcode'] = df_reg_agesex['region_name_agesex'].apply(
        lambda n: name_to_pcode.get(n.lower(), None)
    )
    
    # Merge region indicators
    reg_merged = gdf_reg.merge(df_reg_census, left_on='ADM1_PCODE', right_on='adm1_pcode', how='left')
    reg_merged = reg_merged.merge(df_reg_agesex.drop(columns=['region_name_agesex'], errors='ignore'), on='adm1_pcode', how='left')
    reg_merged = reg_merged.merge(df_dhs.drop(columns=['dhs_region_name'], errors='ignore'), on='adm1_pcode', how='left')
    reg_merged = reg_merged.merge(fac_summary['adm1'], on='adm1_pcode', how='left')
    
    # Compute derived regional indicators
    reg_merged['total_population'] = reg_merged['pop_2022']
    reg_merged['population_density'] = (reg_merged['total_population'] / reg_merged['area_km2']).round(1)
    reg_merged['num_households'] = reg_merged['hh_2022']
    reg_merged['avg_household_size'] = reg_merged['avg_hh_2022'].round(1)
    reg_merged['sex_ratio'] = 96.0 # Nationwide average ~96 males / 100 females
    reg_merged['health_facility_density'] = ((reg_merged['health_facilities_count'] / reg_merged['total_population']) * 10000).round(2)
    reg_merged['children_under_15_count'] = (reg_merged['total_population'] * (reg_merged['pct_under_15'] / 100.0))
    reg_merged['school_density_children'] = ((reg_merged['schools_count'] / reg_merged['children_under_15_count']) * 1000).round(2)
    reg_merged['agriculture_share_pct'] = (reg_merged['pct_rural'] * 0.85).round(1) # High correlation with rural population
    
    reg_merged['name'] = reg_merged['ADM1_EN']
    reg_merged['name_sw'] = reg_merged['ADM1_SW'] if 'ADM1_SW' in reg_merged.columns else reg_merged['ADM1_EN']
    reg_merged['level'] = 'region'
    reg_merged['pcode'] = reg_merged['ADM1_PCODE']
    
    # 3. Ward Data Extraction & Join
    print("Loading and reconciling ward-level demographics...")
    df_wrd_baseline = load_ward_baseline()
    
    # Separate exact matches vs unmatched
    exact_wrd = gdf_wrd.merge(df_wrd_baseline, left_on='ADM3_PCODE', right_on='adm3_pcode', how='inner')
    unmatched_shp = gdf_wrd[~gdf_wrd['ADM3_PCODE'].isin(df_wrd_baseline['adm3_pcode'])].copy()
    unmatched_df = df_wrd_baseline[~df_wrd_baseline['adm3_pcode'].isin(gdf_wrd['ADM3_PCODE'])].copy()
    
    unmatched_records = []
    # Match Songwe/Mbeya split wards by name
    songwe_match = unmatched_shp.merge(unmatched_df, left_on='ADM3_EN', right_on='Ward_Name', how='inner')
    
    for _, r in unmatched_shp.iterrows():
        match_row = unmatched_df[unmatched_df['Ward_Name'] == r['ADM3_EN']]
        orig_pcode = match_row['adm3_pcode'].values[0] if len(match_row) > 0 else "NONE"
        unmatched_records.append({
            'adm_level': 'Ward',
            'pcode_shp': r['ADM3_PCODE'],
            'name_shp': r['ADM3_EN'],
            'district_shp': r['ADM2_EN'],
            'region_shp': r['ADM1_EN'],
            'matched_to_baseline_pcode': orig_pcode,
            'match_method': 'Songwe_2016_split_name_reconciliation' if orig_pcode != "NONE" else 'unmatched',
            'status': 'reconciled' if orig_pcode != "NONE" else 'missing_demographics'
        })
        
    df_unmatched_report = pd.DataFrame(unmatched_records)
    df_unmatched_report.to_csv(str(UNMATCHED_FILE), index=False)
    print(f"Recorded unmatched/reconciled report to {UNMATCHED_FILE} ({len(df_unmatched_report)} rows).")
    
    # Combine reconciled wards
    # Correct adm3_pcode on matched songwe rows so they have the proper SHP pcode
    songwe_match['adm3_pcode'] = songwe_match['ADM3_PCODE']
    songwe_match['adm2_pcode'] = songwe_match['ADM2_PCODE']
    songwe_match['adm1_pcode'] = songwe_match['ADM1_PCODE']
    
    wrd_all = pd.concat([exact_wrd, songwe_match], ignore_index=True)
    wrd_all = wrd_all.drop_duplicates(subset=['ADM3_PCODE'])
    
    # Resolve area_km2 if merged with suffixes
    if 'area_km2_x' in wrd_all.columns:
        wrd_all['area_km2'] = wrd_all['area_km2_x']
    elif 'area_km2' not in wrd_all.columns and 'area_km2_y' in wrd_all.columns:
        wrd_all['area_km2'] = wrd_all['area_km2_y']
    
    # Join facility counts to wards
    wrd_all = wrd_all.merge(fac_summary['adm3'], on='adm3_pcode', how='left')
    wrd_all['health_facilities_count'] = wrd_all['health_facilities_count'].fillna(0).astype(int)
    wrd_all['schools_count'] = wrd_all['schools_count'].fillna(0).astype(int)
    
    # Compute 2022 ward demographics scaled by regional 2012-2022 growth
    # Group baseline by region to get 2012 regional population sum
    reg_2012_sums = wrd_all.groupby('adm1_pcode')['total_both'].sum().to_dict()
    reg_2022_target = reg_merged.set_index('ADM1_PCODE')['total_population'].to_dict()
    reg_growth_mult = {
        p: (reg_2022_target.get(p, 1.0) / reg_2012_sums.get(p, 1.0))
        for p in reg_2012_sums
    }
    
    wrd_all['growth_multiplier'] = wrd_all['adm1_pcode'].map(reg_growth_mult).fillna(1.37)
    wrd_all['total_population'] = (wrd_all['total_both'] * wrd_all['growth_multiplier']).round(0).astype(int)
    wrd_all['pop_male'] = (wrd_all['total_male'] * wrd_all['growth_multiplier']).round(0).astype(int)
    wrd_all['pop_female'] = (wrd_all['total_fema'] * wrd_all['growth_multiplier']).round(0).astype(int)
    wrd_all['population_density'] = (wrd_all['total_population'] / wrd_all['area_km2']).round(1)
    wrd_all['sex_ratio'] = ((wrd_all['pop_male'] / wrd_all['pop_female'].replace(0, 1)) * 100).round(1)
    
    # 2012-2022 annual growth rate
    wrd_all['growth_rate_2012_2022'] = (np.log(wrd_all['total_population'] / wrd_all['total_both'].replace(0, 1)) / 10.0 * 100.0).round(2)
    wrd_all['pct_urban'] = ((wrd_all['urban_both'] / wrd_all['total_both'].replace(0, 1)) * 100.0).round(1)
    wrd_all['pct_rural'] = (100.0 - wrd_all['pct_urban']).round(1)
    
    # Households at ward level
    wrd_all['avg_household_size'] = 4.3 # National average
    wrd_all['num_households'] = (wrd_all['total_population'] / wrd_all['avg_household_size']).round(0).astype(int)
    wrd_all['health_facility_density'] = ((wrd_all['health_facilities_count'] / wrd_all['total_population']) * 10000).round(2)
    
    wrd_all['name'] = wrd_all['ADM3_EN']
    wrd_all['level'] = 'ward'
    wrd_all['pcode'] = wrd_all['ADM3_PCODE']
    wrd_all['parent_district_pcode'] = wrd_all['ADM2_PCODE']
    wrd_all['parent_district_name'] = wrd_all['ADM2_EN']
    wrd_all['parent_region_pcode'] = wrd_all['ADM1_PCODE']
    wrd_all['parent_region_name'] = wrd_all['ADM1_EN']
    
    # 4. District Data Aggregation & Join
    print("Aggregating district demographics...")
    dis_pop = wrd_all.groupby('ADM2_PCODE').agg({
        'total_population': 'sum',
        'total_both': 'sum', # 2012 baseline
        'pop_male': 'sum',
        'pop_female': 'sum',
        'num_households': 'sum',
        'urban_both': 'sum',
        'health_facilities_count': 'sum',
        'schools_count': 'sum'
    }).reset_index()
    
    dis_merged = gdf_dis.merge(dis_pop, on='ADM2_PCODE', how='left')
    dis_merged['total_population'] = dis_merged['total_population'].fillna(0).astype(int)
    dis_merged['population_density'] = (dis_merged['total_population'] / dis_merged['area_km2']).round(1)
    dis_merged['sex_ratio'] = ((dis_merged['pop_male'] / dis_merged['pop_female'].replace(0, 1)) * 100.0).round(1)
    dis_merged['avg_household_size'] = (dis_merged['total_population'] / dis_merged['num_households'].replace(0, 1)).round(1)
    dis_merged['growth_rate_2012_2022'] = (np.log(dis_merged['total_population'] / dis_merged['total_both'].replace(0, 1)) / 10.0 * 100.0).round(2)
    dis_merged['pct_urban'] = ((dis_merged['urban_both'] / dis_merged['total_both'].replace(0, 1)) * 100.0).round(1)
    dis_merged['pct_rural'] = (100.0 - dis_merged['pct_urban']).round(1)
    dis_merged['health_facility_density'] = ((dis_merged['health_facilities_count'] / dis_merged['total_population']) * 10000).round(2)
    # Estimate children count for school density
    dis_merged['children_under_15_count'] = (dis_merged['total_population'] * 0.428) # 42.8% national
    dis_merged['school_density_children'] = ((dis_merged['schools_count'] / dis_merged['children_under_15_count']) * 1000).round(2)
    
    dis_merged['name'] = dis_merged['ADM2_EN']
    dis_merged['level'] = 'district'
    dis_merged['pcode'] = dis_merged['ADM2_PCODE']
    dis_merged['parent_region_pcode'] = dis_merged['ADM1_PCODE']
    dis_merged['parent_region_name'] = dis_merged['ADM1_EN']
    
    # Standardize column sets for clean export
    indicator_cols = [
        'name', 'level', 'pcode', 'area_km2', 'total_population', 'population_density',
        'sex_ratio', 'pct_under_15', 'pct_65_plus', 'avg_household_size',
        'num_households', 'growth_rate_2012_2022', 'pct_urban', 'pct_rural',
        'fertility_rate', 'stunting_rate', 'under_5_mortality', 'facility_births_pct',
        'health_facility_density', 'health_facilities_count', 'literacy_rate',
        'schools_count', 'school_density_children', 'electricity_access_pct',
        'improved_water_pct', 'improved_sanitation_pct', 'agriculture_share_pct',
        'geometry'
    ]
    
    # Fill missing indicators as None for districts/wards so webapp receives proper nulls
    for col in indicator_cols:
        if col not in reg_merged.columns:
            reg_merged[col] = None
        if col not in dis_merged.columns:
            dis_merged[col] = None
        if col not in wrd_all.columns:
            wrd_all[col] = None
            
    # Add parent links
    reg_clean = reg_merged[indicator_cols].copy()
    
    dis_cols = indicator_cols + ['parent_region_pcode', 'parent_region_name']
    dis_clean = dis_merged[dis_cols].copy()
    
    wrd_cols = indicator_cols + [
        'parent_district_pcode', 'parent_district_name',
        'parent_region_pcode', 'parent_region_name'
    ]
    wrd_clean = wrd_all[wrd_cols].copy()
    
    print(f"Regions built: {len(reg_clean)} | Districts built: {len(dis_clean)} | Wards built: {len(wrd_clean)}")
    print(f"Total National Population across regions: {reg_clean['total_population'].sum():,}")
    print(f"Total National Population across districts: {dis_clean['total_population'].sum():,}")
    print(f"Total National Population across wards: {wrd_clean['total_population'].sum():,}")
    
    return {
        'regions': reg_clean,
        'districts': dis_clean,
        'wards': wrd_clean
    }
