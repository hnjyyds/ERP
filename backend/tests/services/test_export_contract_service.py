from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.contracts.schemas import (
    ExportContractAdvancePaymentCreate,
    ExportContractApprove,
    ExportContractCreate,
    ExportContractLineCreate,
    ExportContractSignatureCreate,
)
from app.modules.sales.contracts.services import ExportContractService
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


def _contract_payload(code: str = "EC-SVC-001") -> ExportContractCreate:
    return ExportContractCreate(
        code=code,
        contract_date=date(2026, 7, 3),
        customer_id="customer-a",
        customer_name="客户 A",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        planned_ship_date=date(2026, 8, 10),
        payment_terms="30% T/T in advance",
        source_quotation_id="quotation-a",
        source_quotation_no="QT-SVC-001",
        remarks="出口合同",
        lines=[
            ExportContractLineCreate(
                product_id="product-a",
                product_code="BAG-40",
                product_name="Eco Bag",
                specification="40x35cm",
                model="BAG-40",
                quantity="1000",
                unit="pcs",
                unit_price="1.40",
                purchased_quantity="400",
                shipped_quantity="250",
                image_url="https://example.test/bag.png",
                remark="首单合同",
            )
        ],
    )


async def test_export_contract_service_approval_signature_payment_export_and_event(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ExportContractRepository(session)
        service = ExportContractService(repository)
        current_user = _user_with_permissions(
            [
                "sales:contract:approve",
                "sales:contract:edit",
                "sales:contract:export",
                "sales:contract:view",
                "sales:contract:view_all",
            ],
            user_id="u-001",
        )
        contract = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload(),
        )
        signature = await service.register_signature(
            current_user=current_user,
            contract_id=contract.id,
            payload=ExportContractSignatureCreate(
                signed_by="Anna Schmidt",
                signed_at=date(2026, 7, 4),
                signature_method="email_scan",
                file_no="SIGN-SVC-001",
                remark="客户邮件回签",
            ),
        )
        payment = await service.add_advance_payment(
            current_user=current_user,
            contract_id=contract.id,
            payload=ExportContractAdvancePaymentCreate(
                payment_no="AR-SVC-001",
                received_at=date(2026, 7, 5),
                amount="300.00",
                currency="USD",
                payer_name="Euro Home Retail Ltd.",
                remark="30% 预收款",
            ),
        )
        submitted = await service.submit_contract(
            current_user=current_user,
            contract_id=contract.id,
        )
        approved = await service.approve_contract(
            current_user=current_user,
            contract_id=contract.id,
            payload=ExportContractApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 7, 6),
            ),
        )
        export = await service.export_contract(
            current_user=current_user,
            contract_id=contract.id,
            export_format="pdf",
        )
        events = await repository.list_events(contract.id)

    assert contract.approval_status == "draft"
    assert contract.statistics.total_quantity == "1000"
    assert contract.statistics.total_amount == "1400.00"
    assert contract.statistics.shipped_quantity == "250"
    assert contract.statistics.shipped_amount == "350.00"
    assert contract.statistics.unshipped_quantity == "750"
    assert contract.statistics.purchased_quantity == "400"
    assert contract.purchase_statuses[0].unpurchased_quantity == "600"
    assert contract.shipment_statuses[0].unshipped_amount == "1050.00"
    assert signature.signature_status == "signed"
    assert payment.amount == "300.00"
    assert submitted.approval_status == "submitted"
    assert approved.approval_status == "approved"
    assert approved.statistics.advance_payment_amount == "300.00"
    assert events[0].event_type == "ExportContractApproved"
    assert export.filename == "EC-SVC-001.pdf"
    assert "EXPORT CONTRACT" in export.content


async def test_export_contract_service_rejects_approval_before_submit(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = ExportContractService(ExportContractRepository(session))
        current_user = _user_with_permissions(
            [
                "sales:contract:approve",
                "sales:contract:edit",
                "sales:contract:view",
            ],
            user_id="u-001",
        )
        contract = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-DRAFT"),
        )

        with pytest.raises(ValueError):
            await service.approve_contract(
                current_user=current_user,
                contract_id=contract.id,
                payload=ExportContractApprove(
                    reviewer_name="演示业务主管",
                    approved_at=date(2026, 7, 6),
                ),
            )


async def test_export_contract_service_filters_private_records_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = ExportContractService(ExportContractRepository(session))
        owner = _user_with_permissions(["sales:contract:edit"], user_id="u-owner")
        await service.create_contract(
            current_user=owner,
            payload=_contract_payload("EC-SVC-PRIVATE"),
        )
        result = await service.list_contracts(
            current_user=_user_with_permissions(["sales:contract:view"], user_id="u-other"),
            q=None,
            approval_status=None,
            customer_id=None,
        )

    assert result.total == 0
