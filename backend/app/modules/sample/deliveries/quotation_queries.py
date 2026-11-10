"""寄样单与报价的关联查询。

报价详情按 ``quotation_id`` 精确取寄样单，替代历史上「同客户 + 首个产品」反查。
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sample.deliveries.models import SampleDelivery, SampleDeliveryLine

REPORTABLE_SAMPLE_DELIVERY_STATUSES = ("approved", "shipped")


async def fetch_quote_history(
    session: AsyncSession,
    *,
    customer_id: str | None,
    product_id: str | None,
) -> tuple[list[SampleDelivery], int]:
    statement = (
        select(SampleDelivery)
        .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
        .where(SampleDelivery.status.in_(REPORTABLE_SAMPLE_DELIVERY_STATUSES))
    )
    count_statement = (
        select(func.count(func.distinct(SampleDelivery.id)))
        .select_from(SampleDelivery)
        .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
        .where(SampleDelivery.status.in_(REPORTABLE_SAMPLE_DELIVERY_STATUSES))
    )
    if customer_id:
        statement = statement.where(SampleDelivery.customer_id == customer_id)
        count_statement = count_statement.where(SampleDelivery.customer_id == customer_id)
    if product_id:
        statement = statement.where(SampleDeliveryLine.product_id == product_id)
        count_statement = count_statement.where(SampleDeliveryLine.product_id == product_id)
    statement = statement.order_by(
        SampleDelivery.delivery_date.desc(),
        SampleDelivery.code.asc(),
    )
    rows = list((await session.scalars(statement)).unique())
    total = await session.scalar(count_statement)
    return rows, int(total or 0)


async def fetch_by_quotation_id(
    session: AsyncSession,
    quotation_id: str,
) -> tuple[list[SampleDelivery], int]:
    statement = (
        select(SampleDelivery)
        .where(SampleDelivery.quotation_id == quotation_id)
        .order_by(SampleDelivery.delivery_date.desc(), SampleDelivery.code.asc())
    )
    count_statement = (
        select(func.count())
        .select_from(SampleDelivery)
        .where(SampleDelivery.quotation_id == quotation_id)
    )
    rows = await session.scalars(statement)
    total = await session.scalar(count_statement)
    return list(rows), int(total or 0)
