from sqlalchemy import Connection, inspect

_APPROVAL_TABLES = (
    "sample_deliveries",
    "export_quotations",
    "export_contracts",
    "purchase_contracts",
    "shipment_plans",
    "warehouse_outbound_orders",
    "finance_payment_requests",
    "finance_fee_payment_requests",
    "finance_reimbursements",
)


def ensure_approval_assignment_schema(connection: Connection) -> None:
    """Add designated-reviewer columns to databases created before this feature."""

    inspector = inspect(connection)
    existing_tables = set(inspector.get_table_names())
    for table_name in _APPROVAL_TABLES:
        if table_name not in existing_tables:
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "reviewer_id" not in columns:
            connection.exec_driver_sql(
                f"ALTER TABLE {table_name} ADD COLUMN reviewer_id VARCHAR(64)"
            )
        connection.exec_driver_sql(
            f"CREATE INDEX IF NOT EXISTS ix_{table_name}_reviewer_id "
            f"ON {table_name} (reviewer_id)"
        )

        if table_name == "finance_reimbursements" and "reviewer_name" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE finance_reimbursements ADD COLUMN reviewer_name VARCHAR(160)"
            )
