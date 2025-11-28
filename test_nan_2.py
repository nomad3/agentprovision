import pandas as pd
import numpy as np
df = pd.DataFrame({'A': [1.0, np.nan]})
print("Original:")
print(df)
sample = df.astype(object).where(pd.notnull(df), None)
print("After cast and where:")
print(sample)
print("Dict:")
print(sample.to_dict(orient='records'))
