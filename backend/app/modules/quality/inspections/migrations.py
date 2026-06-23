from sqlalchemy import Connection, inspect


def ensure_quality_inspection_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "quality_inspections" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quality_inspections")}
    statements = {
        "qc_user_id": "ALTER TABLE quality_inspections ADD COLUMN qc_user_id VARCHAR(36)",
        "qc_user_name": "ALTER TABLE quality_inspections ADD COLUMN qc_user_name VARCHAR(160)",
    }
    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)

    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_inspections_qc_user_id "
        "ON quality_inspections (qc_user_id)"
    )
