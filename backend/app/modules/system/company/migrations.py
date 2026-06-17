from sqlalchemy import Connection, inspect


def ensure_company_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "company_info" not in inspector.get_table_names():
        return

    # 预留：后续新增列时在此追加幂等 ALTER 语句。
    columns = {column["name"] for column in inspector.get_columns("company_info")}
    statements: dict[str, str] = {}

    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)
