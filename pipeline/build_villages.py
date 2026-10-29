import geopandas as gpd
import pandas as pd
import json
import os
import zipfile
from shapely.geometry import Point
from pipeline.config import RAW_DIR, PROCESSED_DIR

def build_villages():
    """
    Processes populated places into genuine village point locations
    and partitions them by district for rapid lazy-loading.
    """
    pp_dir = RAW_DIR / "populated_places"
    pp_path = pp_dir / "populated_places.geojson"
    if not pp_path.exists():
        zip_path = RAW_DIR / "hotosm_tza_populated_places.zip"
        if zip_path.exists():
            print("Extracting populated places zip...")
            pp_dir.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_path, 'r') as z:
                z.extractall(pp_dir)

    print("Loading populated places...")
    gdf = gpd.read_file(str(pp_path))
    
    # Filter to genuine places
    valid_places = ['village', 'town', 'city', 'hamlet', 'isolated_dwelling', 'neighbourhood', 'suburb']
    gdf = gdf[gdf['place'].isin(valid_places) | gdf['name'].notna()].copy()
    
    # Convert polygons to centroids
    print("Converting geometries to point coordinates...")
    centroids = gdf.geometry.centroid
    gdf['geometry'] = centroids
    gdf['longitude'] = centroids.x.round(5)
    gdf['latitude'] = centroids.y.round(5)
    
    # Fill names
    gdf['name'] = gdf['name'].fillna(gdf['name_en']).fillna(gdf['name_sw']).fillna('Unnamed Settlement')
    gdf['place'] = gdf['place'].fillna('settlement')
    
    # Clean properties
    keep_cols = [
        'id', 'name', 'place', 'adm1_pcode', 'adm1_name',
        'adm2_pcode', 'adm2_name', 'adm3_pcode', 'adm3_name',
        'latitude', 'longitude', 'geometry'
    ]
    gdf = gdf[[c for c in keep_cols if c in gdf.columns]].copy()
    
    villages_dir = PROCESSED_DIR / "villages_by_district"
    villages_dir.mkdir(parents=True, exist_ok=True)
    
    # Group by district pcode and save partitioned files
    district_groups = gdf.groupby('adm2_pcode')
    print(f"Partitioning {len(gdf)} village points across {district_groups.ngroups} districts...")
    
    for adm2_pcode, group in district_groups:
        if not adm2_pcode or pd.isna(adm2_pcode):
            continue
        out_file = villages_dir / f"{adm2_pcode}.geojson"
        group.to_file(str(out_file), driver='GeoJSON')
        
    # Also save top villages national file (villages and towns)
    major_villages = gdf[gdf['place'].isin(['village', 'town', 'city'])].copy()
    national_out = PROCESSED_DIR / "villages_points.geojson"
    # To keep fast, sample up to 10k representative villages
    if len(major_villages) > 10000:
        major_villages = major_villages.sample(10000, random_state=42)
    major_villages.to_file(str(national_out), driver='GeoJSON')
    print(f"Saved representative national file: {national_out} ({len(major_villages)} points)")
    print(f"Partitioned files written to {villages_dir}")

