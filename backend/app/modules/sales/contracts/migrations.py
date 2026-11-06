from sqlalchemy import Connection, inspect


def ensure_export_contract_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "export_contract_lines" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("export_contract_lines")}
    if "barcode" not in columns:
        connection.exec_driver_sql(
            "ALTER TABLE export_contract_lines ADD COLUMN barcode VARCHAR(64)"
        )

    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_export_contract_lines_barcode "
        "ON export_contract_lines (barcode)"
    )
