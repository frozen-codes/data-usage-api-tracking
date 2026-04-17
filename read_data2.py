import pandas as pd
import json

file_path = "all-india-villages-master-list-excel/dataset/Rdir_2011_02_HIMACHAL_PRADESH.xls"
df = pd.read_excel(file_path, nrows=2)
with open('data_schema.txt', 'w') as f:
    f.write("Columns: " + str(df.columns.tolist()) + "\n")
    f.write("Row 1: " + str(df.iloc[0].to_dict()) + "\n")
