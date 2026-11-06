from collections.abc import Collection

ANNOUNCEMENT_CREATE_PERMISSION = "announcement:create"
ORGANIZATION_USER_MANAGE_PERMISSION = "organization:user:manage"
SUPER_ADMIN_PERMISSION = "system:super_admin"


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
