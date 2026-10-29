import geopandas as gpd
import pandas as pd
import zipfile
from pipeline.config import RAW_DIR

def ensure_extracted(zip_filename, folder_name):
    target_dir = RAW_DIR / folder_name
    if not target_dir.exists() or not any(target_dir.iterdir()):
        zip_path = RAW_DIR / zip_filename
        if zip_path.exists():
            print(f"Extracting {zip_filename} to {folder_name}...")
            with zipfile.ZipFile(zip_path, 'r') as z:
                z.extractall(target_dir)

def extract_facilities_summary():
    """
    Summarizes health and education facilities by region, district, and ward.
    """
    ensure_extracted("hotosm_tza_health_facilities.zip", "health_facilities")
    ensure_extracted("hotosm_tza_education_facilities.zip", "education_facilities")

    hf_path = RAW_DIR / "health_facilities" / "health_facilities.geojson"
    ef_path = RAW_DIR / "education_facilities" / "education_facilities.geojson"
    
    print("Loading health facilities...")
    hf = gpd.read_file(str(hf_path))
    print("Loading education facilities...")
    ef = gpd.read_file(str(ef_path))
    
    # Regional counts
    hf_adm1 = hf.groupby('adm1_pcode').size().reset_index(name='health_facilities_count')
    ef_adm1 = ef.groupby('adm1_pcode').size().reset_index(name='schools_count')
    adm1_fac = pd.merge(hf_adm1, ef_adm1, on='adm1_pcode', how='outer').fillna(0)
    
    # District counts
    hf_adm2 = hf.groupby('adm2_pcode').size().reset_index(name='health_facilities_count')
    ef_adm2 = ef.groupby('adm2_pcode').size().reset_index(name='schools_count')
    adm2_fac = pd.merge(hf_adm2, ef_adm2, on='adm2_pcode', how='outer').fillna(0)
    
    # Ward counts
    hf_adm3 = hf.groupby('adm3_pcode').size().reset_index(name='health_facilities_count')
    ef_adm3 = ef.groupby('adm3_pcode').size().reset_index(name='schools_count')
    adm3_fac = pd.merge(hf_adm3, ef_adm3, on='adm3_pcode', how='outer').fillna(0)
    
    return {
        'adm1': adm1_fac,
        'adm2': adm2_fac,
        'adm3': adm3_fac
    }

