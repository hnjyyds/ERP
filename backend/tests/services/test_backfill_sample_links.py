import csv
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.records.models import SampleRecord
from migrations import backfill_sample_links as backfill

pytestmark = pytest.mark.usefixtures("reference_master_data")


async def test_backfill_dry_run_reports_matches_without_writing(
    session_factory: async_sessionmaker[AsyncSession],
    monkeypatch,
    tmp_path: Path,
) -> None:
    async with session_factory() as session:
        session.add(
            SampleRecord(
                code="SM-BACKFILL-001",
                sample_type="confirm_sample",
                product_name="Eco Bag",
                customer_name="测试客户 customer-a",
                received_at=date(2026, 7, 1),
                quantity=Decimal("1"),
                unit="pcs",
                owner_user_id="u-001",
            )
        )
        await session.commit()

    monkeypatch.setattr(backfill, "SessionLocal", session_factory)
    report_path = tmp_path / "backfill-report.csv"
    await backfill.run(apply=False, report_path=report_path)

    rows = list(csv.DictReader(report_path.open(encoding="utf-8-sig")))
    matched = {row["field"]: row for row in rows if row["reason"] == "matched"}
    assert matched["customer_id"]["raw_value"] == "测试客户 customer-a"
    assert matched["customer_id"]["candidate_id"]

    async with session_factory() as session:
        record = await session.scalar(
            select(SampleRecord).where(SampleRecord.code == "SM-BACKFILL-001")
        )
    assert record is not None
    assert record.customer_id is None
