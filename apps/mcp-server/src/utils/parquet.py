"""
Parquet conversion utilities
"""
import io
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


def dataframe_to_parquet(df: pd.DataFrame) -> bytes:
    """Convert pandas DataFrame to Parquet bytes"""
    buffer = io.BytesIO()
    table = pa.Table.from_pandas(df)
    pq.write_table(table, buffer)
    return buffer.getvalue()


def parquet_to_dataframe(parquet_bytes: bytes) -> pd.DataFrame:
    """Convert Parquet bytes to pandas DataFrame"""
    buffer = io.BytesIO(parquet_bytes)
    table = pq.read_table(buffer)
    return table.to_pandas()
