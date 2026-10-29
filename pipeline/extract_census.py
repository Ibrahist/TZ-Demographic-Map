import re
import pypdf
import pandas as pd
import numpy as np
from pathlib import Path
from pipeline.config import RAW_DIR

def extract_regional_census():
    """
    Extracts 2012 and 2022 regional population, households, and household size
    from admin_report_vol1a.pdf (Table 2).
    """
    pdf_path = RAW_DIR / "admin_report_vol1a.pdf"
    reader = pypdf.PdfReader(str(pdf_path))
    
    # Table 2 is on pages 40-41 (0-indexed)
    text = reader.pages[40].extract_text() + "\n" + reader.pages[41].extract_text()
    lines = text.split('\n')
    
    records = []
    for line in lines:
        line = line.strip()
        m = re.match(r'^([A-Za-z\s\-]+?)\s+([\d,]+)\s+([\d,]+)\s+([\d\.]+)\s+([\d,]+)\s+([\d,]+)\s+([\d\.]+)$', line)
        if m:
            name = m.group(1).strip()
            if name in ['Tanzania', 'Tanzania Mainland', 'Tanzania Zanzibar']:
                continue
            p12 = int(m.group(2).replace(',', ''))
            hh12 = int(m.group(3).replace(',', ''))
            avg12 = float(m.group(4))
            p22 = int(m.group(5).replace(',', ''))
            hh22 = int(m.group(6).replace(',', ''))
            avg22 = float(m.group(7))
            
            # Growth rate: r = ln(p22 / p12) / 10 * 100%
            growth_rate = round(np.log(p22 / p12) / 10.0 * 100.0, 2)
            
            records.append({
                'region_name_census': name,
                'pop_2012': p12,
                'hh_2012': hh12,
                'avg_hh_2012': avg12,
                'pop_2022': p22,
                'hh_2022': hh22,
                'avg_hh_2022': avg22,
                'growth_rate_2012_2022': growth_rate
            })
            
    df = pd.DataFrame(records)
    print(f"Extracted {len(df)} regional demographic rows from Table 2.")
    return df

def extract_regional_age_sex():
    """
    Extracts 2022 age structure (% < 15, % 65+), dependency ratio,
    urban/rural share from age_sex_key_findings.pdf (Table 3).
    """
    pdf_path = RAW_DIR / "age_sex_key_findings.pdf"
    reader = pypdf.PdfReader(str(pdf_path))
    lines = (reader.pages[8].extract_text() + "\n" + reader.pages[9].extract_text()).split('\n')
    
    records = []
    for line in lines:
        line = line.strip()
        m = re.match(r'^([A-Za-z\s\-]+?)\s+([\d,]+)\s+([\d\.\s]+)$', line)
        if m:
            name = m.group(1).strip()
            if name in ['Tanzania', 'Tanzania Mainland', 'Tanzania Zanzibar']:
                continue
            nums = [float(x.replace(',', '')) for x in m.group(2).split() + m.group(3).split()]
            if len(nums) >= 14:
                records.append({
                    'region_name_agesex': name,
                    'pct_under_15': round(nums[4], 1), # 0-14
                    'pct_15_64': round(nums[7], 1),    # 15-64
                    'pct_65_plus': round(nums[9], 1),  # 65+
                    'dependency_ratio': round(nums[11], 1),
                    'pct_reproductive_women': round(nums[12], 1),
                    'pct_urban': round(nums[13], 1),
                    'pct_rural': round(nums[14] if len(nums) > 14 else (100.0 - nums[13]), 1)
                })
                
    df = pd.DataFrame(records)
    print(f"Extracted {len(df)} regional age/sex rows from Table 3.")
    return df

def load_ward_baseline():
    """
    Loads ward-level baseline (3,643 wards) from HDX / NBS baseline excel.
    """
    path = RAW_DIR / "tza_pop_popn_nbs_baselinedata.xlsx"
    df = pd.read_excel(str(path))
    # format PCode to match ADM3_PCODE (e.g. TZ0101011)
    df['adm3_pcode'] = 'TZ' + df['PCode'].astype(str).str.zfill(7)
    df['adm2_pcode'] = 'TZ' + df['Reg_Code'].astype(str).str.zfill(2) + df['Dis_Code'].astype(str).str.zfill(2)
    df['adm1_pcode'] = 'TZ' + df['Reg_Code'].astype(str).str.zfill(2)
    return df

