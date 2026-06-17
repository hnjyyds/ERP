from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.quotations.repositories import ExportQuotationRepository
from app.modules.sales.quotations.schemas import (
    ExportQuotationApprove,
    ExportQuotationConfirmContract,
    ExportQuotationCreate,
    ExportQuotationLineCreate,
)
from app.modules.sales.quotations.services import ExportQuotationService
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> ExportQuotationService:
    return ExportQuotationService(
        ExportQuotationRepository(session),
        SampleDeliveryRepository(session),
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


def _quotation_payload(code: str = "QT-SVC-001") -> ExportQuotationCreate:
    return ExportQuotationCreate(
        code=code,
        quote_date=date(2026, 7, 1),
        customer_id="customer-a",
        customer_name="客户 A",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        valid_until=date(2026, 7, 15),
        description="环保袋报价",
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
                freight_amount="120.00",
                purchase_reference_supplier_name="供应商 A",
                purchase_reference_price="0.82",
                remark="首单报价",
            )
        ],
    )


async def test_export_quotation_service_approval_contract_export_and_history(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "sales:quotation:approve",
                "sales:quotation:edit",
                "sales:quotation:export",
                "sales:quotation:view",
                "sales:quotation:view_all",
            ],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=current_user,
            payload=_quotation_payload(),
        )
        submitted = await service.submit_quotation(
            current_user=current_user,
            quotation_id=quotation.id,
        )
        approved = await service.approve_quotation(
            current_user=current_user,
            quotation_id=quotation.id,
            payload=ExportQuotationApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 7, 2),
            ),
        )
        history = await service.get_history(
            current_user=current_user,
            customer_id="customer-a",
            product_id="product-a",
        )
        references = await service.get_purchase_references(
            current_user=current_user,
            product_id="product-a",
        )
        export = await service.export_quotation(
            current_user=current_user,
            quotation_id=quotation.id,
            export_format="excel",
        )
        contract = await service.confirm_contract(
            current_user=current_user,
            quotation_id=quotation.id,
            payload=ExportQuotationConfirmContract(
                confirmed_at=date(2026, 7, 3),
                contract_no="EC-SVC-001",
            ),
        )

    assert quotation.approval_status == "draft"
    assert quotation.total_amount == "1370.00"
    assert submitted.approval_status == "submitted"
    assert approved.approval_status == "approved"
    assert history.total == 1
    assert history.items[0].code == "QT-SVC-001"
    assert references.items[0].reference_price == "0.82"
    assert export.filename == "QT-SVC-001.csv"
    assert "QT-SVC-001" in export.content
    assert contract.contract_no == "EC-SVC-001"
    assert contract.total_amount == "1370.00"


async def test_export_quotation_service_rejects_confirm_before_approval(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=current_user,
            payload=_quotation_payload("QT-SVC-DRAFT"),
        )

        with pytest.raises(ValueError):
            await service.confirm_contract(
                current_user=current_user,
                quotation_id=quotation.id,
                payload=ExportQuotationConfirmContract(
                    confirmed_at=date(2026, 7, 3),
                    contract_no="EC-SVC-DRAFT",
                ),
            )


async def test_export_quotation_service_filters_private_records_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        owner = _user_with_permissions(["sales:quotation:edit"], user_id="u-owner")
        await service.create_quotation(
            current_user=owner,
            payload=_quotation_payload("QT-SVC-PRIVATE"),
        )
        result = await service.list_quotations(
            current_user=_user_with_permissions(["sales:quotation:view"], user_id="u-other"),
            q=None,
            approval_status=None,
            customer_id=None,
        )

    assert result.total == 0
