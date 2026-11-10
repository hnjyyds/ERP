"""报价生成出口合同时的字段默认值。"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.customers.models import CustomerCreditProfile


async def resolve_payment_terms(session: AsyncSession, customer_id: str | None) -> str:
    """从客户信用档案带出付款条件；没有档案时留空。"""
    if not customer_id:
        return ""
    payment_terms = await session.scalar(
        select(CustomerCreditProfile.payment_terms).where(
            CustomerCreditProfile.customer_id == customer_id
        )
    )
    return payment_terms or ""
