from sqlalchemy import Connection, inspect


def ensure_product_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "products" not in inspector.get_table_names():
        return

    product_columns = {column["name"] for column in inspector.get_columns("products")}
    product_statements = {
        "status": "ALTER TABLE products ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'active'",
        "updated_at": (
            "ALTER TABLE products ADD COLUMN updated_at DATETIME "
            "NOT NULL DEFAULT CURRENT_TIMESTAMP"
        ),
    }
    for column_name, statement in product_statements.items():
        if column_name not in product_columns:
            connection.exec_driver_sql(statement)

    if "product_accessories" not in inspector.get_table_names():
        return

    accessory_columns = {
        column["name"] for column in inspector.get_columns("product_accessories")
    }
    if "updated_at" not in accessory_columns:
        connection.exec_driver_sql(
            "ALTER TABLE product_accessories ADD COLUMN updated_at DATETIME "
            "NOT NULL DEFAULT CURRENT_TIMESTAMP"
        )
