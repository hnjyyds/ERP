from sqlalchemy import Connection, inspect


def ensure_purchase_contract_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "purchase_contracts" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("purchase_contracts")}
    statements = {
        "qc_user_id": "ALTER TABLE purchase_contracts ADD COLUMN qc_user_id VARCHAR(36)",
        "qc_user_name": "ALTER TABLE purchase_contracts ADD COLUMN qc_user_name VARCHAR(160)",
    }
    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)

    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_purchase_contracts_qc_user_id "
        "ON purchase_contracts (qc_user_id)"
    )
