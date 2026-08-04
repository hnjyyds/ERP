from app.modules.system.auth.repositories import AuthRepository, UserIdentityRow


class AssigneeValidator:
    """Resolve active employees and enforce workflow permission requirements."""

    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    async def require(
        self,
        *,
        user_id: str,
        required_permission: str,
        role_name: str,
        permission_error: str,
        excluded_user_id: str | None = None,
    ) -> UserIdentityRow:
        if excluded_user_id is not None and user_id == excluded_user_id:
            raise ValueError(f"不能将自己设为{role_name}")
        user = await self._repository.get_user_identity_by_id(user_id)
        if user is None:
            raise ValueError(f"{role_name}不存在或已停用")
        if required_permission not in user.permissions:
            raise ValueError(permission_error)
        return user
