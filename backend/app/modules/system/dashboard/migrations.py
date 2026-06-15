from sqlalchemy import Connection, inspect


def ensure_dashboard_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "todo_tasks" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("todo_tasks")}
    statements = {
        "owner_user_name": "ALTER TABLE todo_tasks ADD COLUMN owner_user_name VARCHAR(120)",
        "creator_user_id": "ALTER TABLE todo_tasks ADD COLUMN creator_user_id VARCHAR(64)",
        "creator_user_name": "ALTER TABLE todo_tasks ADD COLUMN creator_user_name VARCHAR(120)",
        "content": "ALTER TABLE todo_tasks ADD COLUMN content TEXT NOT NULL DEFAULT ''",
    }

    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)
