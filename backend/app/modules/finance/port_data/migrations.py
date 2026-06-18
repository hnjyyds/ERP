from sqlalchemy import Connection, inspect


def ensure_port_data_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "finance_customs_declaration_records" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("finance_customs_declaration_records")
    }
    statements = {
        "match_status": (
            "ALTER TABLE finance_customs_declaration_records "
            "ADD COLUMN match_status VARCHAR(40) NOT NULL DEFAULT 'unmatched'"
        ),
        "matched_verification_document_id": (
            "ALTER TABLE finance_customs_declaration_records "
            "ADD COLUMN matched_verification_document_id VARCHAR(36)"
        ),
        "matched_verification_document_no": (
            "ALTER TABLE finance_customs_declaration_records "
            "ADD COLUMN matched_verification_document_no VARCHAR(120)"
        ),
    }
    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)
