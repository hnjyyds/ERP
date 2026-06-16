from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.repositories import AuthRepository, UserIdentityRow
from app.modules.system.auth.seed import seed_system_demo_data


async def test_auth_repository_returns_typed_user_identity(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        repository = AuthRepository(session)

        identity = await repository.get_user_identity_by_username("demo")

    assert isinstance(identity, UserIdentityRow)
    assert identity.id == "u-001"
    assert identity.department_name == ""
    assert identity.avatar_type == "preset"
    assert identity.avatar_value == "amber-orbit"
    assert identity.roles == ["业务主管"]
    assert "dashboard:view" in identity.permissions
