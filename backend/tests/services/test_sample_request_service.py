from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.finance.fee_payments.repositories import FeePaymentRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.sample.requests.schemas import (
    SampleFeeCreate,
    SampleProgressCreate,
    SampleRequestCreate,
    SampleRequestLineCreate,
)
from app.modules.sample.requests.services import SampleRequestService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> SampleRequestService:
    return SampleRequestService(
        SampleRequestRepository(session),
        sample_record_repository=SampleRecordRepository(session),
        fee_payment_repository=FeePaymentRepository(session),
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


def _sample_payload(code: str, status: str = "draft") -> SampleRequestCreate:
    return SampleRequestCreate(
        code=code,
        request_date=date(2026, 6, 20),
        customer_id="customer-a",
        customer_name="客户 A",
        product_id="product-a",
        product_code="BAG-40",
        product_name="Eco Bag",
        supplier_id="supplier-a",
        supplier_name="供应商 A",
        sales_user_id="u-001",
        sales_user_name="业务主管",
        destination="factory",
        requirements="环保材质确认样",
        due_date=date(2026, 6, 28),
        status=status,
        lines=[
            SampleRequestLineCreate(
                product_id="product-a",
                product_code="BAG-40",
                product_name="Eco Bag",
                specification="40x35cm",
                quantity="3",
                unit="pcs",
                requirement="绿色样",
            )
        ],
    )


async def test_sample_request_service_progress_updates_request_status(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sample:request:edit", "sample:request:view"],
            user_id="u-001",
        )
        sample_request = await service.create_request(
            current_user=current_user,
            payload=_sample_payload("SR-SVC-001"),
        )
        progress = await service.add_progress(
            current_user=current_user,
            request_id=sample_request.id,
            payload=SampleProgressCreate(
                stage="sent_to_factory",
                status="in_progress",
                occurred_at=date(2026, 6, 21),
                note="外发工厂",
                handler_name="Li Wei",
            ),
        )
        refreshed = await service.get_request(
            current_user=current_user,
            request_id=sample_request.id,
        )

    assert progress.stage == "sent_to_factory"
    assert refreshed.status == "in_progress"
    assert refreshed.progress_events[0].status == "in_progress"


async def test_sample_request_service_generates_payment_request_for_fee(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sample:request:edit", "sample:request:view", "sample:request:fee:edit"],
            user_id="u-001",
        )
        sample_request = await service.create_request(
            current_user=current_user,
            payload=_sample_payload("SR-SVC-002"),
        )
        fee = await service.add_fee(
            current_user=current_user,
            request_id=sample_request.id,
            payload=SampleFeeCreate(
                fee_type="sample_making",
                amount="120.50",
                currency="USD",
                payee_type="supplier",
                payee_name="供应商 A",
                remark="打样费",
            ),
        )
        requested_fee = await service.request_fee_payment(
            current_user=current_user,
            request_id=sample_request.id,
            fee_id=fee.id,
        )

    assert fee.payment_status == "not_requested"
    assert requested_fee.payment_status == "requested"
    assert requested_fee.payment_request_no is not None
    assert requested_fee.payment_request_no.startswith("SAMPLE-FEE-")


async def test_sample_request_service_filters_private_request_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        await service.create_request(
            current_user=_user_with_permissions(["sample:request:edit"], user_id="u-owner"),
            payload=_sample_payload("SR-PRIVATE-001"),
        )
        result = await service.list_requests(
            current_user=_user_with_permissions(["sample:request:view"], user_id="u-other"),
            q=None,
            status=None,
            customer_id=None,
        )

    assert result.total == 0


async def test_sample_request_service_rejects_invalid_status(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        with pytest.raises(ValueError):
            await service.create_request(
                current_user=_user_with_permissions(["sample:request:edit"], user_id="u-001"),
                payload=SampleRequestCreate.model_validate(
                    {
                        "code": "SR-BAD-001",
                        "request_date": "2026-06-20",
                        "customer_name": "客户 A",
                        "destination": "factory",
                        "requirements": "错误状态",
                        "status": "bad_status",
                    },
                    strict=False,
                ),
            )
