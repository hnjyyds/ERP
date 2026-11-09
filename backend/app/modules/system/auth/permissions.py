from collections.abc import Collection

ANNOUNCEMENT_CREATE_PERMISSION = "announcement:create"
SUPER_ADMIN_PERMISSION = "system:super_admin"
REPORTING_VIEW_PERMISSION = "reporting:view"
SALES_CONTRACT_EXPORT_PERMISSION = "sales:contract:export"
SALES_QUOTATION_EXPORT_PERMISSION = "sales:quotation:export"


def can_approve_assigned_record(
    *,
    current_user_id: str,
    reviewer_id: str | None,
    permissions: Collection[str],
) -> bool:
    """Allow the assigned reviewer or a super administrator to approve a record."""
    return (
        reviewer_id is None
        or reviewer_id == current_user_id
        or SUPER_ADMIN_PERMISSION in permissions
    )
