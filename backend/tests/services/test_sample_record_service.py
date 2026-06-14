from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.records.schemas import (
    SampleImageCreate,
    SampleRecordCreate,
    SampleStockEventCreate,
)
from app.modules.sample.records.services import SampleRecordService
from app.modules.system.auth.schemas import CurrentUserResponse


def _user_with_permissions(
    permissions: list[str],
    user_id: str = "u-test",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username="tester",
        display_name="测试用户",
        department_name="测试部",
        roles=["测试角色"],
        permissions=permissions,
    )


def _sample_record_payload(
    code: str,
    sample_type: str = "confirm_sample",
) -> SampleRecordCreate:
    return SampleRecordCreate(
        code=code,
        sample_type=sample_type,
        product_id="product-a",
        product_code="BAG-40",
        product_name="Eco Bag",
        customer_id="customer-a",
        customer_name="客户 A",
        supplier_id="supplier-a",
        supplier_name="供应商 A",
        customer_sku="CUST-BAG-40",
        supplier_sku="SUP-BAG-40",
        purchase_contract_id="pc-a",
        purchase_contract_no="PC-A",
        source_type="sample_request",
        source_id="sr-a",
        source_code="SR-A",
        source_note="来自打样",
        received_at=date(2026, 6, 22),
        submitted_at=date(2026, 6, 23),
        quantity="5",
        unit="pcs",
        status="registered",
        description="确认样",
        images=[
            SampleImageCreate(
                file_id="file-front",
                filename="front.jpg",
                url="https://assets.example.test/front.jpg",
                caption="正面",
                is_primary=True,
            )
        ],
    )


async def test_sample_record_service_calculates_stock_and_followup_event(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = SampleRecordService(SampleRecordRepository(session))
        current_user = _user_with_permissions(
            ["sample:record:edit", "sample:record:view"],
            user_id="u-001",
        )
        sample_record = await service.create_record(
            current_user=current_user,
            payload=_sample_record_payload("SM-SVC-001"),
        )
        delivery = await service.add_stock_event(
            current_user=current_user,
            record_id=sample_record.id,
            payload=SampleStockEventCreate(
                event_type="delivered",
                quantity="2",
                unit="pcs",
                occurred_at=date(2026, 6, 24),
                delivery_no="SD-SVC-001",
                recipient="客户 A",
                note="寄样",
            ),
        )
        refreshed = await service.get_record(
            current_user=current_user,
            record_id=sample_record.id,
        )

    assert delivery.delivery_no == "SD-SVC-001"
    assert refreshed.stock_summary.received_quantity == "5"
    assert refreshed.stock_summary.delivered_quantity == "2"
    assert refreshed.stock_summary.retained_quantity == "3"
    assert refreshed.followup_events[0].node_code == "confirm_sample_submitted"


async def test_sample_record_service_maps_bulk_sample_to_followup_node(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = SampleRecordService(SampleRecordRepository(session))
        current_user = _user_with_permissions(
            ["sample:record:edit", "sample:record:view"],
            user_id="u-001",
        )
        sample_record = await service.create_record(
            current_user=current_user,
            payload=_sample_record_payload("SM-SVC-002", sample_type="bulk_sample"),
        )

    assert sample_record.followup_events[0].node_code == "bulk_sample_submitted"
    assert sample_record.followup_events[0].node_label == "大货样提交"


async def test_sample_record_service_filters_private_record_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = SampleRecordService(SampleRecordRepository(session))
        await service.create_record(
            current_user=_user_with_permissions(["sample:record:edit"], user_id="u-owner"),
            payload=_sample_record_payload("SM-PRIVATE-001"),
        )
        result = await service.list_records(
            current_user=_user_with_permissions(["sample:record:view"], user_id="u-other"),
            q=None,
            sample_type=None,
            customer_id=None,
            purchase_contract_id=None,
        )

    assert result.total == 0


async def test_sample_record_service_rejects_invalid_sample_type(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = SampleRecordService(SampleRecordRepository(session))
        with pytest.raises(ValueError):
            await service.create_record(
                current_user=_user_with_permissions(["sample:record:edit"], user_id="u-001"),
                payload=SampleRecordCreate.model_validate(
                    {
                        "code": "SM-BAD-001",
                        "sample_type": "bad_type",
                        "product_name": "Eco Bag",
                        "quantity": "1",
                        "unit": "pcs",
                        "received_at": "2026-06-22",
                    },
                    strict=False,
                ),
            )
