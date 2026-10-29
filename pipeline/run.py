"""
Main Execution Script for Tanzania Demographic Pipeline
Usage:
    python -m pipeline.run
"""
import time
from pipeline.build_datasets import build_datasets
from pipeline.build_villages import build_villages
from pipeline.simplify_and_export import simplify_and_export
from pipeline.validate import run_validations

def main():
    start_time = time.time()
    print("==================================================")
    print("   STARTING TANZANIA DEMOGRAPHIC DATA PIPELINE    ")
    print("==================================================")
    
    # Step A: Build clean datasets with derived indicators
    datasets = build_datasets()
    
    # Step B: Build village points and district partitions
    build_villages()
    
    # Step C: Simplify geometries preserving topology and export
    simplify_and_export(datasets)
    
    # Step D: Run comprehensive validation checks
    run_validations()
    
    elapsed = time.time() - start_time
    print(f"Pipeline executed successfully in {elapsed:.1f} seconds!")

if __name__ == "__main__":
    main()

