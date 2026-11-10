from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.finance.fee_payments.repositories import FeePaymentRepository
from app.modules.sales.quotations.repositories import ExportQuotationRepository
from app.modules.sales.quotations.schemas import (
    ExportQuotationCreate,
    ExportQuotationLineCreate,
)
from app.modules.sales.quotations.services import ExportQuotationService
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.sample.requests.schemas import (
    SampleFeeCreate,
    SampleProgressCreate,
    SampleRequestCreate,
    SampleRequestLineCreate,
    SampleRequestToRecordCreate,
)
from app.modules.sample.requests.services import (
    SampleFeeAlreadyRequestedError,
    SampleRecordAlreadyCreatedError,
    SampleRequestService,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.seed import seed_system_demo_data

pytestmark = pytest.mark.usefixtures("reference_master_data", "seeded_system")


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
        await seed_system_demo_data(session)
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
            reviewer_id="u-finance-manager",
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


async def test_sample_request_service_rejects_terminal_status_on_create(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(["sample:request:edit"], user_id="u-001")
        with pytest.raises(ValueError, match="只能是草稿"):
            await service.create_request(
                current_user=current_user,
                payload=_sample_payload("SR-GUARD-001", status="completed"),
            )
        with pytest.raises(ValueError, match="只能是草稿"):
            await service.create_request(
                current_user=current_user,
                payload=_sample_payload("SR-GUARD-002", status="cancelled"),
            )


async def test_sample_request_service_enforces_progress_transitions(
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
            payload=_sample_payload("SR-GUARD-003"),
        )
        # 草稿不能直接完成，必须先进入进行中。
        with pytest.raises(ValueError, match="只有客户确认阶段"):
            await service.add_progress(
                current_user=current_user,
                request_id=sample_request.id,
                payload=SampleProgressCreate(
                    stage="request_created",
                    status="completed",
                    occurred_at=date(2026, 6, 21),
                ),
            )
        with pytest.raises(ValueError, match="进入进行中后才能完成"):
            await service.add_progress(
                current_user=current_user,
                request_id=sample_request.id,
                payload=SampleProgressCreate(
                    stage="customer_confirmed",
                    status="completed",
                    occurred_at=date(2026, 6, 21),
                ),
            )
        await service.add_progress(
            current_user=current_user,
            request_id=sample_request.id,
            payload=SampleProgressCreate(
                stage="sent_to_factory",
                status="in_progress",
                occurred_at=date(2026, 6, 22),
            ),
        )
        with pytest.raises(ValueError, match="不能回退"):
            await service.add_progress(
                current_user=current_user,
                request_id=sample_request.id,
                payload=SampleProgressCreate(
                    stage="in_house",
                    status="sent",
                    occurred_at=date(2026, 6, 23),
                ),
            )
        with pytest.raises(ValueError, match="不能将申请置为已取消"):
            await service.add_progress(
                current_user=current_user,
                request_id=sample_request.id,
                payload=SampleProgressCreate(
                    stage="in_house",
                    status="cancelled",
                    occurred_at=date(2026, 6, 23),
                ),
            )
        completed = await service.add_progress(
            current_user=current_user,
            request_id=sample_request.id,
            payload=SampleProgressCreate(
                stage="customer_confirmed",
                status="completed",
                occurred_at=date(2026, 6, 24),
            ),
        )
        refreshed = await service.get_request(
            current_user=current_user,
            request_id=sample_request.id,
        )

    assert completed.status == "completed"
    assert refreshed.status == "completed"


def _quotation_payload(code: str = "QT-LINK-001") -> ExportQuotationCreate:
    return ExportQuotationCreate(
        code=code,
        quote_date=date(2026, 7, 1),
        customer_id="customer-a",
        customer_name="客户 A",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        lines=[
            ExportQuotationLineCreate(
                product_id="product-a",
                product_code="BAG-40",
                product_name="Eco Bag",
                specification="40x35cm",
                model="BAG-40",
                quantity="1000",
                unit="pcs",
                unit_price="1.25",
                freight_method="sea",
            )
        ],
    )


async def test_sample_request_carries_quotation_reference(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        quotation_service = ExportQuotationService(
            ExportQuotationRepository(session),
            SampleDeliveryRepository(session),
            data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        )
        quotation = await quotation_service.create_quotation(
            current_user=_user_with_permissions(
                ["sales:quotation:edit", "sales:quotation:view"], user_id="u-001"
            ),
            payload=_quotation_payload(),
        )
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sample:request:edit", "sample:request:view"], user_id="u-001"
        )
        created = await service.create_request(
            current_user=current_user,
            payload=_sample_payload("SR-LINK-001").model_copy(
                update={
                    "quotation_id": quotation.id,
                    "quotation_no": "手工填写的错误报价号",
                }
            ),
        )
        filtered = await service.list_requests(
            current_user=current_user,
            q=None,
            status=None,
            customer_id=None,
            quotation_id=quotation.id,
        )

    assert created.quotation_id == quotation.id
    assert created.quotation_no == quotation.code
    assert filtered.total == 1
    assert filtered.items[0].id == created.id


async def test_sample_request_rejects_mismatched_quotation_customer(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        quotation_service = ExportQuotationService(
            ExportQuotationRepository(session),
            SampleDeliveryRepository(session),
            data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        )
        quotation = await quotation_service.create_quotation(
            current_user=_user_with_permissions(
                ["sales:quotation:edit", "sales:quotation:view"], user_id="u-001"
            ),
            payload=_quotation_payload("QT-LINK-002"),
        )
        service = _make_service(session)
        payload = _sample_payload("SR-LINK-002").model_copy(
            update={
                "quotation_id": quotation.id,
                "customer_id": "customer-b",
                "customer_name": "客户 B",
            }
        )

        with pytest.raises(ValueError):
            await service.create_request(
                current_user=_user_with_permissions(["sample:request:edit"]),
                payload=payload,
            )


async def test_sample_request_from_quotation_fills_customer_and_product(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        quotation_service = ExportQuotationService(
            ExportQuotationRepository(session),
            SampleDeliveryRepository(session),
            data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        )
        quotation = await quotation_service.create_quotation(
            current_user=_user_with_permissions(
                ["sales:quotation:edit", "sales:quotation:view"], user_id="u-001"
            ),
            payload=_quotation_payload("QT-LINK-003"),
        )
        service = _make_service(session)
        created = await service.create_request_from_quotation(
            current_user=_user_with_permissions(["sample:request:edit"], user_id="u-001"),
            quotation_id=quotation.id,
            payload=_sample_payload("SR-LINK-003").model_copy(
                update={"customer_id": None, "product_id": None}
            ),
        )

    assert created.quotation_id == quotation.id
    assert created.customer_id == quotation.customer_id
    assert created.product_id == "product-a"


async def test_sample_fee_payment_request_is_idempotent(
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
            payload=_sample_payload("SR-LINK-004"),
        )
        fee = await service.add_fee(
            current_user=current_user,
            request_id=sample_request.id,
            payload=SampleFeeCreate(
                fee_type="sample_making",
                amount="88.00",
                currency="USD",
                payee_type="supplier",
                payee_name="供应商 A",
            ),
        )
        await service.request_fee_payment(
            current_user=current_user,
            request_id=sample_request.id,
            fee_id=fee.id,
            reviewer_id="u-finance-manager",
        )

        with pytest.raises(SampleFeeAlreadyRequestedError):
            await service.request_fee_payment(
                current_user=current_user,
                request_id=sample_request.id,
                fee_id=fee.id,
                reviewer_id="u-finance-manager",
            )


async def test_sample_request_conversion_is_one_shot(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sample:request:edit", "sample:request:view", "sample:record:edit"],
            user_id="u-001",
        )
        sample_request = await service.create_request(
            current_user=current_user,
            payload=_sample_payload("SR-LINK-005"),
        )
        await SampleRequestRepository(session).update_request_status(
            sample_request_id=sample_request.id,
            status="completed",
        )
        await session.commit()
        payload = SampleRequestToRecordCreate(
            received_at=date(2026, 7, 5),
            status="registered",
            quantity="1",
            unit="pcs",
        )
        record = await service.create_sample_record_from_request(
            current_user=current_user,
            request_id=sample_request.id,
            payload=payload,
        )

        with pytest.raises(SampleRecordAlreadyCreatedError):
            await service.create_sample_record_from_request(
                current_user=current_user,
                request_id=sample_request.id,
                payload=payload,
            )

    assert record.source_type == "sample_request"
    assert record.source_id == sample_request.id
    assert record.source_code == sample_request.code
