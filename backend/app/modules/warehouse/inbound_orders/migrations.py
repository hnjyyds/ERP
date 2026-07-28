from sqlalchemy import Connection, inspect


def ensure_inbound_order_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "warehouse_inbound_orders" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("warehouse_inbound_orders")}
    if "reviewer_id" not in columns:
        connection.exec_driver_sql(
            "ALTER TABLE warehouse_inbound_orders ADD COLUMN reviewer_id VARCHAR(36)"
        )

    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_warehouse_inbound_orders_reviewer_id "
        "ON warehouse_inbound_orders (reviewer_id)"
    )
