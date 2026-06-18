from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryApprove,
    SampleDeliveryCreate,
    SampleDeliveryFeeCreate,
    SampleDeliveryLineCreate,
    SampleDeliveryTrackingUpdate,
)
from app.modules.sample.deliveries.services import SampleDeliveryService
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.records.schemas import SampleRecordCreate
from app.modules.sample.records.services import SampleRecordService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_record_service(session: AsyncSession) -> SampleRecordService:
    return SampleRecordService(
        SampleRecordRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


def _make_service(session: AsyncSession) -> SampleDeliveryService:
    return SampleDeliveryService(
        SampleDeliveryRepository(session),
        SampleRecordRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


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


async def _create_sample_record(
    record_service: SampleRecordService,
    current_user: CurrentUserResponse,
) -> str:
    record = await record_service.create_record(
        current_user=current_user,
        payload=SampleRecordCreate(
            code="SM-DEL-SVC-001",
            sample_type="confirm_sample",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            customer_id="customer-a",
            customer_name="客户 A",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            purchase_contract_id="pc-a",
            purchase_contract_no="PC-A",
            received_at=date(2026, 6, 22),
            submitted_at=date(2026, 6, 23),
            quantity="5",
            unit="pcs",
            status="registered",
        ),
    )
    return record.id


def _delivery_payload(sample_record_id: str) -> SampleDeliveryCreate:
    return SampleDeliveryCreate(
        code="SD-SVC-001",
        delivery_date=date(2026, 6, 25),
        customer_id="customer-a",
        customer_name="客户 A",
        supplier_id="supplier-a",
        supplier_name="供应商 A",
        factory_id="factory-a",
        factory_name="工厂 A",
        recipient_name="Anna",
        recipient_company="客户 A",
        recipient_address="客户地址",
        express_company="DHL",
        tracking_no="DHL-SVC-001",
        quote_id="quote-a",
        quote_no="QT-A",
        remark="报价前寄样",
        lines=[
            SampleDeliveryLineCreate(
                sample_record_id=sample_record_id,
                sample_code="SM-DEL-SVC-001",
                sample_type="confirm_sample",
                product_id="product-a",
                product_code="BAG-40",
                product_name="Eco Bag",
                quantity="2",
                unit="pcs",
                remark="寄客户确认",
            )
        ],
        fees=[
            SampleDeliveryFeeCreate(
                fee_type="express",
                amount="18.50",
                currency="USD",
                payer_type="company",
                remark="DHL",
            )
        ],
    )


async def test_sample_delivery_service_review_updates_sample_stock_and_statistics(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        record_service = _make_record_service(session)
        delivery_service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "sample:delivery:approve",
                "sample:delivery:edit",
                "sample:delivery:fee:view",
                "sample:delivery:view",
                "sample:record:edit",
                "sample:record:view",
            ],
            user_id="u-001",
        )
        sample_record_id = await _create_sample_record(record_service, current_user)
        delivery = await delivery_service.create_delivery(
            current_user=current_user,
            payload=_delivery_payload(sample_record_id),
        )
        submitted = await delivery_service.submit_delivery(
            current_user=current_user,
            delivery_id=delivery.id,
        )
        approved = await delivery_service.approve_delivery(
            current_user=current_user,
            delivery_id=delivery.id,
            payload=SampleDeliveryApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 6, 25),
            ),
        )
        shipped = await delivery_service.update_tracking(
            current_user=current_user,
            delivery_id=delivery.id,
            payload=SampleDeliveryTrackingUpdate(
                express_company="DHL",
                tracking_no="DHL-SVC-001",
                status="shipped",
            ),
        )
        sample_detail = await record_service.get_record(
            current_user=current_user,
            record_id=sample_record_id,
        )
        statistics = await delivery_service.get_fee_statistics(
            current_user=current_user,
            customer_id="customer-a",
            date_from=date(2026, 6, 1),
            date_to=date(2026, 6, 30),
            express_company="DHL",
        )

    assert submitted.status == "submitted"
    assert approved.status == "approved"
    assert shipped.status == "shipped"
    assert sample_detail.stock_summary.delivered_quantity == "2"
    assert sample_detail.stock_summary.retained_quantity == "3"
    assert statistics.total_amount == "18.50"


async def test_sample_delivery_service_filters_private_delivery_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        record_service = _make_record_service(session)
        delivery_service = _make_service(session)
        owner = _user_with_permissions(
            ["sample:delivery:edit", "sample:record:edit"],
            user_id="u-owner",
        )
        sample_record_id = await _create_sample_record(record_service, owner)
        await delivery_service.create_delivery(
            current_user=owner,
            payload=_delivery_payload(sample_record_id),
        )
        result = await delivery_service.list_deliveries(
            current_user=_user_with_permissions(["sample:delivery:view"], user_id="u-other"),
            q=None,
            status=None,
            customer_id=None,
            express_company=None,
            date_from=None,
            date_to=None,
        )

    assert result.total == 0


async def test_sample_delivery_service_updates_draft_and_rejects_submitted_edit(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        record_service = _make_record_service(session)
        delivery_service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "sample:delivery:edit",
                "sample:delivery:view",
                "sample:record:edit",
            ],
            user_id="u-001",
        )
        sample_record_id = await _create_sample_record(record_service, current_user)
        delivery = await delivery_service.create_delivery(
            current_user=current_user,
            payload=_delivery_payload(sample_record_id),
        )
        payload = _delivery_payload(sample_record_id)
        payload.recipient_address = "客户地址 8 楼"
        payload.lines[0].quantity = "3"
        payload.fees[0].amount = "21.00"

        updated = await delivery_service.update_delivery(
            current_user=current_user,
            delivery_id=delivery.id,
            payload=payload,
        )
        submitted = await delivery_service.submit_delivery(
            current_user=current_user,
            delivery_id=delivery.id,
        )

        with pytest.raises(ValueError):
            await delivery_service.update_delivery(
                current_user=current_user,
                delivery_id=delivery.id,
                payload=payload,
            )

    assert updated.recipient_address == "客户地址 8 楼"
    assert updated.lines[0].quantity == "3"
    assert updated.fee_total == "21.00"
    assert submitted.status == "submitted"


async def test_sample_delivery_service_rejects_approve_when_stock_is_insufficient(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        record_service = _make_record_service(session)
        delivery_service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "sample:delivery:approve",
                "sample:delivery:edit",
                "sample:delivery:view",
                "sample:record:edit",
            ],
            user_id="u-001",
        )
        sample_record_id = await _create_sample_record(record_service, current_user)
        payload = _delivery_payload(sample_record_id)
        payload.lines[0].quantity = "6"
        delivery = await delivery_service.create_delivery(
            current_user=current_user,
            payload=payload,
        )
        await delivery_service.submit_delivery(current_user=current_user, delivery_id=delivery.id)

        with pytest.raises(ValueError):
            await delivery_service.approve_delivery(
                current_user=current_user,
                delivery_id=delivery.id,
                payload=SampleDeliveryApprove(
                    reviewer_name="演示业务主管",
                    approved_at=date(2026, 6, 25),
                ),
            )
