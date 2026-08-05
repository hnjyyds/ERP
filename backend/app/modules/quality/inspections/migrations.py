from sqlalchemy import Connection, inspect


def ensure_quality_inspection_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "quality_inspections" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quality_inspections")}
    statements = {
        "qc_user_id": "ALTER TABLE quality_inspections ADD COLUMN qc_user_id VARCHAR(36)",
        "qc_user_name": "ALTER TABLE quality_inspections ADD COLUMN qc_user_name VARCHAR(160)",
        "status": (
            "ALTER TABLE quality_inspections ADD COLUMN status VARCHAR(40) "
            "NOT NULL DEFAULT 'completed'"
        ),
        "scheduled_at": ("ALTER TABLE quality_inspections ADD COLUMN scheduled_at DATETIME"),
        "parent_inspection_id": (
            "ALTER TABLE quality_inspections ADD COLUMN parent_inspection_id VARCHAR(36)"
        ),
        "reinspection_no": (
            "ALTER TABLE quality_inspections ADD COLUMN reinspection_no INTEGER NOT NULL DEFAULT 0"
        ),
        "cancel_reason": "ALTER TABLE quality_inspections ADD COLUMN cancel_reason TEXT",
        "updated_at": "ALTER TABLE quality_inspections ADD COLUMN updated_at DATETIME",
    }
    for column_name, statement in statements.items():
        if column_name not in columns:
            connection.exec_driver_sql(statement)

    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_inspections_qc_user_id "
        "ON quality_inspections (qc_user_id)"
    )
    connection.exec_driver_sql(
        "UPDATE quality_inspections "
        "SET scheduled_at = inspected_at || ' 09:00:00' "
        "WHERE scheduled_at IS NULL"
    )
    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_inspections_status ON quality_inspections (status)"
    )
    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_inspections_scheduled_at "
        "ON quality_inspections (scheduled_at)"
    )
    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_inspections_parent_inspection_id "
        "ON quality_inspections (parent_inspection_id)"
    )
    connection.exec_driver_sql(
        "UPDATE quality_inspections SET updated_at = created_at WHERE updated_at IS NULL"
    )

    if "quality_issues" not in inspector.get_table_names():
        return
    issue_columns = {column["name"] for column in inspector.get_columns("quality_issues")}
    issue_statements = {
        "resolution_note": "ALTER TABLE quality_issues ADD COLUMN resolution_note TEXT",
        "resolved_at": "ALTER TABLE quality_issues ADD COLUMN resolved_at DATETIME",
        "resolved_by_id": "ALTER TABLE quality_issues ADD COLUMN resolved_by_id VARCHAR(36)",
        "resolved_by_name": "ALTER TABLE quality_issues ADD COLUMN resolved_by_name VARCHAR(160)",
    }
    for column_name, statement in issue_statements.items():
        if column_name not in issue_columns:
            connection.exec_driver_sql(statement)
    connection.exec_driver_sql(
        "CREATE INDEX IF NOT EXISTS ix_quality_issues_resolved_by_id "
        "ON quality_issues (resolved_by_id)"
    )
