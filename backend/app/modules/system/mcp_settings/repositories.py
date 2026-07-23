from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.mcp_settings.models import MCP_SETTINGS_ID, McpSettings


@dataclass(frozen=True)
class McpSettingsRow:
    enabled: bool
    credential_version: int
    credential_issued_at: datetime | None
    updated_by: str | None
    updated_at: datetime | None


class McpSettingsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self) -> McpSettingsRow | None:
        record = await self.session.scalar(
            select(McpSettings).where(McpSettings.id == MCP_SETTINGS_ID)
        )
        if record is None:
            return None
        return self._row(record)

    async def is_enabled(self) -> bool:
        row = await self.get()
        return row.enabled if row is not None else False

    async def upsert(self, *, enabled: bool, updated_by: str) -> McpSettingsRow:
        record = await self.session.scalar(
            select(McpSettings).where(McpSettings.id == MCP_SETTINGS_ID)
        )
        if record is None:
            record = McpSettings(id=MCP_SETTINGS_ID, enabled=False)
            self.session.add(record)
        if record.enabled and not enabled:
            record.credential_version += 1
            record.credential_issued_at = None
        record.enabled = enabled
        record.updated_by = updated_by
        record.updated_at = datetime.now(UTC)
        await self.session.flush()
        return self._row(record)

    async def rotate_credential(self, *, updated_by: str) -> McpSettingsRow | None:
        issued_at = datetime.now(UTC)
        result = await self.session.execute(
            update(McpSettings)
            .where(
                McpSettings.id == MCP_SETTINGS_ID,
                McpSettings.enabled.is_(True),
            )
            .values(
                credential_version=McpSettings.credential_version + 1,
                credential_issued_at=issued_at,
                updated_by=updated_by,
                updated_at=issued_at,
            )
            .returning(McpSettings)
        )
        record = result.scalar_one_or_none()
        if record is None:
            return None
        await self.session.flush()
        return self._row(record)

    @staticmethod
    def _row(record: McpSettings) -> McpSettingsRow:
        return McpSettingsRow(
            enabled=record.enabled,
            credential_version=record.credential_version,
            credential_issued_at=record.credential_issued_at,
            updated_by=record.updated_by,
            updated_at=record.updated_at,
        )
