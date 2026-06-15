from sqlalchemy import Connection, inspect


def ensure_auth_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    statements = {
        "avatar_type": (
            "ALTER TABLE users ADD COLUMN avatar_type VARCHAR(20) "
            "NOT NULL DEFAULT 'preset'"
        ),
        "avatar_value": (
            "ALTER TABLE users ADD COLUMN avatar_value TEXT "
            "NOT NULL DEFAULT 'amber-orbit'"
        ),
    }

    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)
