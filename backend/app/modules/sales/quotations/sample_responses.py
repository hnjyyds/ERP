from decimal import Decimal

from app.modules.sales.quotations.exporters import format_quantity
from app.modules.sample.deliveries.repositories import (
    SampleDeliveryFeeRow,
    SampleDeliveryLineRow,
    SampleDeliveryRepository,
    SampleDeliveryRow,
)
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryFeeResponse,
    SampleDeliveryLineResponse,
    SampleDeliveryResponse,
)


async def build_sample_delivery_response(
    delivery: SampleDeliveryRow,
    repository: SampleDeliveryRepository,
) -> SampleDeliveryResponse:
    lines = await repository.list_lines(delivery.id)
    fees = await repository.list_fees(delivery.id)
    fee_total = Decimal("0")
    for fee in fees:
        fee_total += fee.amount
    return SampleDeliveryResponse(
        id=delivery.id,
        code=delivery.code,
        delivery_date=delivery.delivery_date,
        customer_id=delivery.customer_id,
        customer_name=delivery.customer_name,
        supplier_id=delivery.supplier_id,
        supplier_name=delivery.supplier_name,
        factory_id=delivery.factory_id,
        factory_name=delivery.factory_name,
        recipient_name=delivery.recipient_name,
        recipient_company=delivery.recipient_company,
        recipient_address=delivery.recipient_address,
        express_company=delivery.express_company,
        tracking_no=delivery.tracking_no,
        quotation_id=delivery.quotation_id,
        quotation_no=delivery.quotation_no,
        remark=delivery.remark,
        status=delivery.status,
        submitted_at=delivery.submitted_at,
        approved_at=delivery.approved_at,
        reviewer_name=delivery.reviewer_name,
        owner_user_id=delivery.owner_user_id,
        lines=[sample_delivery_line_response(line) for line in lines],
        fees=[sample_delivery_fee_response(fee) for fee in fees],
        fee_total=f"{fee_total:.2f}",
    )


def sample_delivery_line_response(line: SampleDeliveryLineRow) -> SampleDeliveryLineResponse:
    return SampleDeliveryLineResponse(
        id=line.id,
        delivery_id=line.delivery_id,
        sample_record_id=line.sample_record_id,
        sample_code=line.sample_code,
        sample_type=line.sample_type,
        product_id=line.product_id,
        product_code=line.product_code,
        product_name=line.product_name,
        quantity=format_quantity(line.quantity),
        unit=line.unit,
        remark=line.remark,
    )


def sample_delivery_fee_response(fee: SampleDeliveryFeeRow) -> SampleDeliveryFeeResponse:
    return SampleDeliveryFeeResponse(
        id=fee.id,
        delivery_id=fee.delivery_id,
        fee_type=fee.fee_type,
        amount=f"{fee.amount:.2f}",
        currency=fee.currency,
        payer_type=fee.payer_type,
        remark=fee.remark,
    )
