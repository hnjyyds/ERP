from datetime import date

from sqlalchemy import ColumnElement, or_, select

from app.modules.sample.deliveries.models import SampleDelivery, SampleDeliveryLine


def build_delivery_conditions(
    *,
    q: str | None = None,
    status: str | None = None,
    customer_id: str | None = None,
    express_company: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    owner_user_ids: list[str] | None = None,
) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = []
    if q:
        pattern = f"%{q}%"
        line_exists = (
            select(SampleDeliveryLine.id)
            .where(SampleDeliveryLine.delivery_id == SampleDelivery.id)
            .where(
                or_(
                    SampleDeliveryLine.sample_code.ilike(pattern),
                    SampleDeliveryLine.product_code.ilike(pattern),
                    SampleDeliveryLine.product_name.ilike(pattern),
                )
            )
            .exists()
        )
        conditions.append(
            or_(
                SampleDelivery.code.ilike(pattern),
                SampleDelivery.customer_name.ilike(pattern),
                SampleDelivery.recipient_name.ilike(pattern),
                SampleDelivery.express_company.ilike(pattern),
                SampleDelivery.tracking_no.ilike(pattern),
                SampleDelivery.quote_no.ilike(pattern),
                line_exists,
            )
        )
    if status:
        conditions.append(SampleDelivery.status == status)
    if customer_id:
        conditions.append(SampleDelivery.customer_id == customer_id)
    if express_company:
        conditions.append(SampleDelivery.express_company == express_company)
    if date_from:
        conditions.append(SampleDelivery.delivery_date >= date_from)
    if date_to:
        conditions.append(SampleDelivery.delivery_date <= date_to)
    if owner_user_ids is not None:
        conditions.append(SampleDelivery.owner_user_id.in_(owner_user_ids))
    return conditions
