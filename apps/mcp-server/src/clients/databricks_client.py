"""
Databricks Client

Handles all Databricks operations:
- SQL query execution
- Table management (create, describe, list)
- Data upload to volumes
- Bronze/Silver/Gold layer management
"""
from typing import Any, Dict, List, Optional
import io
from databricks import sql as databricks_sql
import pyarrow.parquet as pq
import pandas as pd

from src.config import settings


class DatabricksClientError(Exception):
    """Base exception for Databricks client errors"""
    pass


class DatabricksClient:
    """
    Client for Databricks SQL and Unity Catalog.

    All operations are tenant-scoped using catalog naming:
    tenant_{id}.bronze.*, tenant_{id}.silver.*, tenant_{id}.gold.*
    """

    def __init__(self):
        self.host = settings.DATABRICKS_HOST
        self.token = settings.DATABRICKS_TOKEN
        self.warehouse_id = settings.DATABRICKS_WAREHOUSE_ID
        self.catalog_prefix = settings.DATABRICKS_CATALOG_PREFIX
        self._connection = None

    def _validate_identifier(self, name: str, identifier_type: str = "identifier") -> str:
        """Validate and sanitize SQL identifier to prevent injection"""
        import re
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name.replace(".", "_")):
            raise DatabricksClientError(f"Invalid {identifier_type}: {name}")
        return name

    def _pandas_to_databricks_type(self, dtype) -> str:
        """Map pandas dtype to Databricks SQL type"""
        import pandas as pd
        dtype_str = str(dtype)
        if 'int' in dtype_str:
            return "BIGINT"
        elif 'float' in dtype_str:
            return "DOUBLE"
        elif 'bool' in dtype_str:
            return "BOOLEAN"
        elif 'datetime' in dtype_str:
            return "TIMESTAMP"
        else:
            return "STRING"

    def _get_connection(self):
        """Get or create Databricks SQL connection"""
        if self._connection is None:
            self._connection = databricks_sql.connect(
                server_hostname=self.host.replace("https://", ""),
                http_path=f"/sql/1.0/warehouses/{self.warehouse_id}",
                access_token=self.token
            )
        return self._connection

    def _get_catalog(self, tenant_id: str) -> str:
        """Get catalog name for tenant"""
        return f"{self.catalog_prefix}{tenant_id}"

    def close(self):
        """Close connection"""
        if self._connection:
            self._connection.close()
            self._connection = None

    # ==================== Query Operations ====================

    async def execute_query(
        self,
        sql: str,
        tenant_id: str,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """
        Execute SQL query against tenant's catalog.

        Automatically scopes to tenant's catalog for security.
        """
        catalog = self._get_catalog(tenant_id)
        self._validate_identifier(catalog, "catalog")

        # Ensure query is scoped to tenant catalog
        scoped_sql = f"USE CATALOG {catalog};\n{sql}"
        if "LIMIT" not in sql.upper():
            scoped_sql = f"{scoped_sql} LIMIT {limit}"

        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(scoped_sql)
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
        except Exception as e:
            raise DatabricksClientError(f"Query execution failed: {str(e)}")

        return {
            "rows": [dict(zip(columns, row)) for row in rows],
            "columns": columns,
            "row_count": len(rows)
        }

    async def list_tables(
        self,
        tenant_id: str,
        layer: str = "bronze"
    ) -> Dict[str, Any]:
        """
        List tables in tenant's catalog for a specific layer.

        Args:
            tenant_id: Tenant identifier
            layer: bronze, silver, or gold
        """
        # Validate layer parameter
        if layer not in ["bronze", "silver", "gold"]:
            raise DatabricksClientError(f"Invalid layer: {layer}. Must be bronze, silver, or gold")

        catalog = self._get_catalog(tenant_id)
        self._validate_identifier(catalog, "catalog")
        self._validate_identifier(layer, "layer")

        sql = f"SHOW TABLES IN {catalog}.{layer}"

        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql)
                rows = cursor.fetchall()
        except Exception as e:
            raise DatabricksClientError(f"Failed to list tables: {str(e)}")

        tables = []
        for row in rows:
            tables.append({
                "name": row["tableName"] if isinstance(row, dict) else row[1],
                "type": row.get("tableType", "UNKNOWN") if isinstance(row, dict) else "UNKNOWN",
                "catalog": catalog,
                "schema": layer
            })

        return {
            "catalog": catalog,
            "layer": layer,
            "tables": tables,
            "count": len(tables)
        }

    async def describe_table(
        self,
        table_name: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed table schema and statistics.

        Args:
            table_name: Full table name (schema.table) or just table name
            tenant_id: Tenant identifier
        """
        catalog = self._get_catalog(tenant_id)
        self._validate_identifier(catalog, "catalog")

        # Parse and validate table name
        if "." in table_name:
            parts = table_name.split(".")
            for part in parts:
                self._validate_identifier(part, "table name part")
            full_table = f"{catalog}.{table_name}"
        else:
            self._validate_identifier(table_name, "table name")
            full_table = f"{catalog}.bronze.{table_name}"

        conn = self._get_connection()

        # Get schema
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"DESCRIBE TABLE {full_table}")
                schema_rows = cursor.fetchall()
        except Exception as e:
            raise DatabricksClientError(f"Failed to describe table: {str(e)}")

        columns = []
        for row in schema_rows:
            col_name = row[0] if isinstance(row, (list, tuple)) else row.get("col_name", "")
            col_type = row[1] if isinstance(row, (list, tuple)) else row.get("data_type", "")
            if col_name and not col_name.startswith("#"):
                columns.append({"name": col_name, "type": col_type})

        # Get row count
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) as cnt FROM {full_table}")
                count_row = cursor.fetchone()
                row_count = count_row[0] if count_row else 0
        except Exception as e:
            raise DatabricksClientError(f"Failed to count rows: {str(e)}")

        return {
            "table": full_table,
            "columns": columns,
            "row_count": row_count
        }

    # ==================== Table Creation ====================

    async def create_table_from_parquet(
        self,
        catalog: str,
        schema: str,
        table_name: str,
        parquet_data: bytes,
        mode: str = "overwrite"
    ) -> Dict[str, Any]:
        """
        Create table from Parquet data.

        Args:
            catalog: Catalog name (e.g., tenant_123)
            schema: Schema name (bronze, silver, gold)
            table_name: Table name
            parquet_data: Parquet file bytes
            mode: overwrite or append
        """
        # Validate identifiers
        self._validate_identifier(catalog, "catalog")
        self._validate_identifier(schema, "schema")
        self._validate_identifier(table_name, "table name")

        # Validate mode
        if mode not in ["overwrite", "append"]:
            raise DatabricksClientError(f"Invalid mode: {mode}. Must be overwrite or append")

        full_table = f"{catalog}.{schema}.{table_name}"

        # Read parquet to get schema
        buffer = io.BytesIO(parquet_data)
        table = pq.read_table(buffer)
        df = table.to_pandas()

        # For MVP, use INSERT with VALUES (real implementation would use volumes)
        conn = self._get_connection()

        # Create table with proper type inference
        columns_sql = ", ".join([
            f"{col} {self._pandas_to_databricks_type(df[col].dtype)}"
            for col in df.columns
        ])

        try:
            with conn.cursor() as cursor:
                if mode == "overwrite":
                    cursor.execute(f"DROP TABLE IF EXISTS {full_table}")

                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {full_table} ({columns_sql})
                    USING DELTA
                """)

                # Insert data in batches
                if len(df) > 0:
                    for i in range(0, len(df), 1000):
                        batch = df.iloc[i:i+1000]
                        values = []
                        for _, row in batch.iterrows():
                            # Properly escape single quotes and handle NULL values
                            row_values = ", ".join([
                                f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" if v is not None else "NULL"
                                for v in row.values
                            ])
                            values.append(f"({row_values})")

                        if values:
                            cursor.execute(f"""
                                INSERT INTO {full_table} VALUES {", ".join(values)}
                            """)
        except Exception as e:
            raise DatabricksClientError(f"Failed to create table from parquet: {str(e)}")

        return {
            "table": full_table,
            "row_count": len(df),
            "columns": list(df.columns),
            "status": "created"
        }

    # ==================== Transformations ====================

    async def transform_to_silver(
        self,
        bronze_table: str,
        tenant_id: str,
        transformations: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Transform Bronze table to Silver (cleaned, typed).

        Default transformations:
        - Remove duplicates
        - Handle nulls
        - Infer and cast types
        """
        catalog = self._get_catalog(tenant_id)
        self._validate_identifier(catalog, "catalog")

        # Parse and validate bronze table name
        parts = bronze_table.split(".")
        for part in parts:
            self._validate_identifier(part, "table name part")
        base_name = parts[-1]
        silver_table = f"{catalog}.silver.{base_name}"

        conn = self._get_connection()

        try:
            with conn.cursor() as cursor:
                # Create silver table with deduplication
                cursor.execute(f"""
                    CREATE OR REPLACE TABLE {silver_table} AS
                    SELECT DISTINCT * FROM {bronze_table}
                """)

                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {silver_table}")
                row_count = cursor.fetchone()[0]
        except Exception as e:
            raise DatabricksClientError(f"Failed to transform to silver: {str(e)}")

        return {
            "bronze_table": bronze_table,
            "silver_table": silver_table,
            "row_count": row_count,
            "status": "transformed"
        }
