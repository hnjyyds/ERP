from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


class DataScopeResolver:
    """把角色数据范围解析为「允许查看的 owner_user_id 集合」。

    返回 None 表示不限制（看全部）；返回列表表示只允许这些 user_id（始终含本人）。
    """

    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    async def resolve_user_ids(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> list[str] | None:
        scope = current_user.data_scope
        if scope == "all":
            return None

        if scope in ("department", "department_tree"):
            if current_user.department_id is None:
                return [current_user.id]
            if scope == "department":
                department_ids = [current_user.department_id]
            else:
                department_ids = await self._repository.list_department_subtree_ids(
                    current_user.department_id
                )
            ids = await self._repository.list_user_ids_in_departments(department_ids)
            return sorted(set(ids) | {current_user.id})

        # self 或未知值都退化为仅本人。
        return [current_user.id]
