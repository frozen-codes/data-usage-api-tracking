import pandas as pd

file_path = "all-india-villages-master-list-excel/dataset/Rdir_2011_02_HIMACHAL_PRADESH.xls"
df = pd.read_excel(file_path, nrows=2)
print("Columns:", df.columns.tolist())
print("Data types:", df.dtypes.to_dict())
print("First row:", df.iloc[0].to_dict())
