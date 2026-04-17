import os
import pandas as pd

dataset_dir = "../all-india-villages-master-list-excel/dataset"
files = [f for f in os.listdir(dataset_dir) if not f.startswith('.')]

for f in files[:3]:
    path = os.path.join(dataset_dir, f)
    try:
        df = pd.read_excel(path, nrows=3)
        print(f"--- {f} ---")
        print([str(c).strip().upper() for c in df.columns])
    except Exception as e:
        print(f"Error {f}: {e}")
