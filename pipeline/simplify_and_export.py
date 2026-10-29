import os
import json
import subprocess
import geopandas as gpd
from pathlib import Path
from pipeline.config import PROCESSED_DIR, METADATA_FILE, INDICATORS

def simplify_and_export(datasets):
    print("--- Simplifying and Exporting Datasets ---")
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    temp_dir = PROCESSED_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    wards_by_dist_dir = PROCESSED_DIR / "wards_by_district"
    wards_by_dist_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Export Metadata
    print("Exporting indicators metadata...")
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(INDICATORS, f, indent=2)
    print(f"Saved {METADATA_FILE}")
    
    # 2. Process Regions
    print("Processing regions.geojson...")
    gdf_reg = datasets['regions']
    raw_reg = temp_dir / "raw_regions.geojson"
    out_reg = PROCESSED_DIR / "regions.geojson"
    gdf_reg.to_file(str(raw_reg), driver='GeoJSON')
    
    cmd_reg = f'npx mapshaper "{raw_reg}" -simplify 10% keep-shapes -clean -o "{out_reg}" format=geojson precision=0.00001'
    subprocess.run(cmd_reg, shell=True, check=True)
    print(f"Exported {out_reg} ({os.path.getsize(out_reg) / 1024:.1f} KB)")
    
    # 3. Process Districts
    print("Processing districts.geojson...")
    gdf_dis = datasets['districts']
    raw_dis = temp_dir / "raw_districts.geojson"
    out_dis = PROCESSED_DIR / "districts.geojson"
    gdf_dis.to_file(str(raw_dis), driver='GeoJSON')
    
    cmd_dis = f'npx mapshaper "{raw_dis}" -simplify 8% keep-shapes -clean -o "{out_dis}" format=geojson precision=0.00001'
    subprocess.run(cmd_dis, shell=True, check=True)
    print(f"Exported {out_dis} ({os.path.getsize(out_dis) / 1024:.1f} KB)")
    
    # 4. Process Wards
    print("Processing wards.geojson...")
    gdf_wrd = datasets['wards']
    raw_wrd = temp_dir / "raw_wards.geojson"
    out_wrd = PROCESSED_DIR / "wards.geojson"
    gdf_wrd.to_file(str(raw_wrd), driver='GeoJSON')
    
    cmd_wrd = f'npx mapshaper "{raw_wrd}" -simplify 5% keep-shapes -clean -o "{out_wrd}" format=geojson precision=0.00001'
    subprocess.run(cmd_wrd, shell=True, check=True)
    print(f"Exported {out_wrd} ({os.path.getsize(out_wrd) / 1024:.1f} KB)")
    
    # 5. Partition Wards by District (for fast lazy-loading)
    print(f"Partitioning simplified wards across {gdf_wrd['parent_district_pcode'].nunique()} districts...")
    simplified_wrd = gpd.read_file(str(out_wrd))
    for dis_pcode, group in simplified_wrd.groupby('parent_district_pcode'):
        if not dis_pcode or str(dis_pcode) == 'None':
            continue
        dist_file = wards_by_dist_dir / f"{dis_pcode}.geojson"
        group.to_file(str(dist_file), driver='GeoJSON')
        
    print(f"Successfully partitioned ward files in {wards_by_dist_dir}")
    
    # Clean up temp files
    try:
        for f in temp_dir.glob("*"):
            f.unlink()
        temp_dir.rmdir()
    except Exception as e:
        print(f"Cleanup note: {e}")
