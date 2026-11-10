"""清理开发库中寄样单的假报价引用。

背景：早期 E2E 用例把 ``quote_id`` 硬编码成 ``quote-e2e-ui``，迁移 0015 后
该值被带入 ``sample_deliveries.quotation_id``。这些报价并不存在，导致寄样单
在编辑时被「关联报价不存在」拦截。

判定条件（三者同时满足才处理）::

    sample_deliveries.quotation_id = 'quote-e2e-ui'
    AND export_quotations 中不存在该 ID
    AND quotation_no 以 'QT-E2E-' 开头（E2E 单号特征，避免误伤真实数据）

处理方式：把 ``quotation_id`` 与 ``quotation_no`` 置空，保留寄样单本身及其明细/费用。
下游影响：寄样单草稿没有库存扣减，明细与费用保持原样，因此不产生库存变化。

默认只出报告（dry-run），加 ``--apply`` 才写库；重复执行幂等。

用法::

    uv run python migrations/cleanup_fake_sample_quotation.py --dry-run
    uv run python migrations/cleanup_fake_sample_quotation.py --apply
"""

import argparse
import asyncio

from sqlalchemy import func, select, update

from app.db.session import SessionLocal
from app.modules.sales.quotations.models import ExportQuotation
from app.modules.sample.deliveries.models import (
    SampleDelivery,
    SampleDeliveryFee,
    SampleDeliveryLine,
)

FAKE_QUOTATION_ID = "quote-e2e-ui"
FAKE_QUOTATION_NO_PREFIX = "QT-E2E-"


async def _collect(session) -> list[SampleDelivery]:
    condition = (
        SampleDelivery.quotation_id == FAKE_QUOTATION_ID,
        SampleDelivery.quotation_no.like(f"{FAKE_QUOTATION_NO_PREFIX}%"),
    )
    rows = (await session.execute(select(SampleDelivery).where(*condition))).scalars().all()
    return list(rows)


async def _summary(session, delivery: SampleDelivery) -> tuple[int, int]:
    line_count = await session.scalar(
        select(func.count())
        .select_from(SampleDeliveryLine)
        .where(SampleDeliveryLine.delivery_id == delivery.id)
    )
    fee_count = await session.scalar(
        select(func.count())
        .select_from(SampleDeliveryFee)
        .where(SampleDeliveryFee.delivery_id == delivery.id)
    )
    return int(line_count or 0), int(fee_count or 0)


async def run(apply: bool) -> int:
    async with SessionLocal() as session:
        quotation_exists = await session.get(ExportQuotation, FAKE_QUOTATION_ID)
        if quotation_exists is not None:
            print(f"[abort] 报价 {FAKE_QUOTATION_ID} 真实存在，判定条件不成立，未做任何修改")
            return 1

        deliveries = await _collect(session)
        print(f"判定条件：quotation_id = {FAKE_QUOTATION_ID!r} 且 quotation_no 以 "
              f"{FAKE_QUOTATION_NO_PREFIX!r} 开头，且该报价不存在")
        print(f"命中寄样单：{len(deliveries)} 条")
        for delivery in deliveries:
            line_count, fee_count = await _summary(session, delivery)
            print(
                f"  - {delivery.code} 状态={delivery.status} "
                f"明细={line_count} 费用={fee_count} "
                f"quotation_no={delivery.quotation_no}"
            )

        if not deliveries:
            print("无需清理")
            return 0

        if not apply:
            print("dry-run：未写库，确认后加 --apply 执行")
            return 0

        result = await session.execute(
            update(SampleDelivery)
            .where(*(
                SampleDelivery.quotation_id == FAKE_QUOTATION_ID,
                SampleDelivery.quotation_no.like(f"{FAKE_QUOTATION_NO_PREFIX}%"),
            ))
            .values(quotation_id=None, quotation_no=None)
        )
        await session.commit()
        print(f"已清理：{result.rowcount} 行，quotation_id / quotation_no 置空")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="清理寄样单的假报价引用")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", help="只出报告（默认）")
    group.add_argument("--apply", action="store_true", help="写库执行清理")
    args = parser.parse_args()
    return asyncio.run(run(apply=args.apply))


if __name__ == "__main__":
    raise SystemExit(main())
