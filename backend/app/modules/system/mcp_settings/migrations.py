from sqlalchemy import Connection, inspect


def ensure_mcp_settings_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "mcp_settings" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("mcp_settings")}
    statements = {
        "credential_version": (
            "ALTER TABLE mcp_settings ADD COLUMN credential_version INTEGER NOT NULL DEFAULT 0"
        ),
        "credential_issued_at": (
            "ALTER TABLE mcp_settings ADD COLUMN credential_issued_at DATETIME"
        ),
    }
    for column, statement in statements.items():
        if column not in columns:
            connection.exec_driver_sql(statement)
