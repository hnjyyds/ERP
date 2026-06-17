from sqlalchemy import Connection, inspect

# 每张表需要保证存在的新增列及其幂等 ALTER 语句。
_COLUMN_STATEMENTS: dict[str, dict[str, str]] = {
    "users": {
        "avatar_type": (
            "ALTER TABLE users ADD COLUMN avatar_type VARCHAR(20) "
            "NOT NULL DEFAULT 'preset'"
        ),
        "avatar_value": (
            "ALTER TABLE users ADD COLUMN avatar_value TEXT "
            "NOT NULL DEFAULT 'amber-orbit'"
        ),
    },
    "permissions": {
        "category": (
            "ALTER TABLE permissions ADD COLUMN category VARCHAR(20) "
            "NOT NULL DEFAULT 'functional'"
        ),
    },
    "roles": {
        "data_scope": (
            "ALTER TABLE roles ADD COLUMN data_scope VARCHAR(20) "
            "NOT NULL DEFAULT 'self'"
        ),
    },
}


def ensure_auth_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())

    for table_name, statements in _COLUMN_STATEMENTS.items():
        if table_name not in table_names:
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, statement in statements.items():
            if column_name not in columns:
                connection.exec_driver_sql(statement)
