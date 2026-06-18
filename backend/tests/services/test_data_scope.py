from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.data_scope_rules import widest_data_scope
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _current_user(
    *,
    user_id: str,
    department_id: str | None,
    data_scope: str,
    permissions: list[str] | None = None,
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username=user_id,
        display_name=user_id,
        department_id=department_id,
        department_name="",
        data_scope=data_scope,
        roles=[],
        permissions=permissions or [],
    )


async def _make_user(
    repository: AuthRepository, *, user_id: str, department_id: str | None
) -> None:
    await repository.create_organization_user(
        user_id=user_id,
        username=user_id,
        display_name=user_id,
        department_id=department_id,
        password_hash="x",
        password_salt="y",
        is_active=True,
        avatar_type="preset",
        avatar_value="amber-orbit",
        created_at=datetime.now(UTC),
    )


async def _seed_tree(session: AsyncSession) -> AuthRepository:
    repository = AuthRepository(session)
    # 部门树：总部 → 销售部 → 销售一组
    await repository.create_department(
        department_id="d-root", name="总部", parent_id=None, sort_order=0
    )
    await repository.create_department(
        department_id="d-sales", name="销售部", parent_id="d-root", sort_order=0
    )
    await repository.create_department(
        department_id="d-team", name="销售一组", parent_id="d-sales", sort_order=0
    )
    await repository.create_department(
        department_id="d-other", name="财务部", parent_id="d-root", sort_order=1
    )

    await _make_user(repository, user_id="u-root", department_id="d-root")
    await _make_user(repository, user_id="u-sales", department_id="d-sales")
    await _make_user(repository, user_id="u-team", department_id="d-team")
    await _make_user(repository, user_id="u-other", department_id="d-other")
    await session.commit()
    return repository


def test_widest_data_scope_picks_loosest() -> None:
    assert widest_data_scope(["self", "department", "all"]) == "all"
    assert widest_data_scope(["self", "department"]) == "department"
    assert widest_data_scope(["self", "department_tree"]) == "department_tree"
    assert widest_data_scope([]) == "self"


async def test_subtree_and_users_queries(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)

        subtree = await repository.list_department_subtree_ids("d-sales")
        assert set(subtree) == {"d-sales", "d-team"}

        users = await repository.list_user_ids_in_departments(["d-sales", "d-team"])
        assert set(users) == {"u-sales", "u-team"}


async def test_resolver_all_and_view_all_return_none(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)
        resolver = DataScopeResolver(repository)

        all_scope = _current_user(user_id="u-sales", department_id="d-sales", data_scope="all")
        resolved = await resolver.resolve_user_ids(current_user=all_scope)
        assert resolved is None

        scoped_user = _current_user(
            user_id="u-sales",
            department_id="d-sales",
            data_scope="self",
            permissions=["sales:contract:view_all"],
        )
        scoped_resolved = await resolver.resolve_user_ids(current_user=scoped_user)
        assert scoped_resolved == ["u-sales"]


async def test_resolver_self_scope_returns_only_self(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)
        resolver = DataScopeResolver(repository)

        user = _current_user(user_id="u-sales", department_id="d-sales", data_scope="self")
        allowed = await resolver.resolve_user_ids(current_user=user)
        assert allowed == ["u-sales"]


async def test_resolver_department_scope(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)
        resolver = DataScopeResolver(repository)

        user = _current_user(user_id="u-sales", department_id="d-sales", data_scope="department")
        allowed = await resolver.resolve_user_ids(current_user=user)
        # 仅本部门：销售部下只有 u-sales（u-team 在子部门，不算本部门）。
        assert allowed is not None
        assert set(allowed) == {"u-sales"}


async def test_resolver_department_tree_scope(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)
        resolver = DataScopeResolver(repository)

        user = _current_user(
            user_id="u-sales", department_id="d-sales", data_scope="department_tree"
        )
        allowed = await resolver.resolve_user_ids(current_user=user)
        assert allowed is not None
        # 本部门及下级：销售部 + 销售一组。
        assert set(allowed) == {"u-sales", "u-team"}


async def test_resolver_department_scope_without_department_falls_back_to_self(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = await _seed_tree(session)
        resolver = DataScopeResolver(repository)

        user = _current_user(user_id="u-floating", department_id=None, data_scope="department_tree")
        allowed = await resolver.resolve_user_ids(current_user=user)
        assert allowed == ["u-floating"]
