import json
import re
import pandas as pd
from pipeline.config import RAW_DIR

# Mapping from clean DHS region name to standard COD-AB PCODE
DHS_REGION_TO_PCODE = {
    'dodoma': 'TZ01',
    'arusha': 'TZ02',
    'kilimanjaro': 'TZ03',
    'tanga': 'TZ04',
    'morogoro': 'TZ05',
    'pwani': 'TZ06',
    'dar es salaam': 'TZ07',
    'dar-es-salaam': 'TZ07',
    'lindi': 'TZ08',
    'mtwara': 'TZ09',
    'ruvuma': 'TZ10',
    'iringa': 'TZ11',
    'mbeya': 'TZ12',
    'singida': 'TZ13',
    'tabora': 'TZ14',
    'rukwa': 'TZ15',
    'kigoma': 'TZ16',
    'shinyanga': 'TZ17',
    'kagera': 'TZ18',
    'mwanza': 'TZ19',
    'mara': 'TZ20',
    'manyara': 'TZ21',
    'njombe': 'TZ22',
    'katavi': 'TZ23',
    'simiyu': 'TZ24',
    'geita': 'TZ25',
    'songwe': 'TZ26',
    'kaskazini unguja': 'TZ27',
    'kusini unguja': 'TZ28',
    'mjini magharibi': 'TZ29',
    'kaskazini pemba': 'TZ30',
    'kusini pemba': 'TZ31',
}

def clean_region_name(raw_label):
    cleaned = raw_label.replace('..', '').strip()
    cleaned = re.sub(r'\(.*?\)', '', cleaned).strip()
    return cleaned

def extract_dhs_indicators():
    """
    Extracts DHS 2022 subnational indicators and maps them to ADM1 P-codes.
    """
    path = RAW_DIR / "dhs_tz2022_subnational.json"
    with open(path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
        
    indicator_mapping = {
        'FE_FRTR_W_TFR': 'fertility_rate',
        'CN_NUTS_C_HA2': 'stunting_rate',
        'CM_ECMR_C_U5M': 'under_5_mortality',
        'RH_DELP_C_DHF': 'facility_births_pct',
        'ED_LITR_W_LIT': 'literacy_rate',
        'HC_ELEC_H_ELC': 'electricity_access_pct',
        'WS_SRCE_H_IMP': 'improved_water_pct',
        'WS_TLET_H_IMP': 'improved_sanitation_pct',
    }
    
    # Store by pcode
    region_records = {}
    
    for ind_code, col_name in indicator_mapping.items():
        items = raw_data.get(ind_code, [])
        for item in items:
            lbl = item.get('CharacteristicLabel', '')
            if not lbl.startswith('..'):
                # skip zonal aggregate
                continue
            clean_name = clean_region_name(lbl).lower()
            pcode = DHS_REGION_TO_PCODE.get(clean_name)
            if not pcode:
                continue
            
            val = item.get('Value')
            if val is not None:
                try:
                    val = float(val)
                except ValueError:
                    val = None
                    
            if pcode not in region_records:
                region_records[pcode] = {'adm1_pcode': pcode, 'dhs_region_name': clean_region_name(lbl)}
            
            # If indicator appears multiple times (e.g. sex breakdowns), take the total/first
            if col_name not in region_records[pcode] or region_records[pcode][col_name] is None:
                region_records[pcode][col_name] = val

    df = pd.DataFrame(list(region_records.values()))
    print(f"Extracted DHS indicators for {len(df)} regions.")
    return df

