import pandas as pd
import numpy as np
df = pd.DataFrame({'A': [1.0, np.nan]})
print("Original:")
print(df)
sample = df.where(pd.notnull(df), None)
print("After where:")
print(sample)
print("Dict:")
print(sample.to_dict(orient='records'))
