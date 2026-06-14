from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.sales.shipments.schemas import (
    ShipmentApprove,
    ShipmentContractSelection,
    ShipmentPlanGenerate,
)
from app.modules.sales.shipments.services import ShipmentPlanService
from app.modules.system.auth.schemas import CurrentUserResponse


def _user_with_permissions(
    permissions: list[str],
    user_id: str = "u-001",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username="tester",
        display_name="测试用户",
        department_name="测试部",
        roles=["测试角色"],
        permissions=permissions,
    )


async def _create_contract(
    repository: ExportContractRepository,
    *,
    code: str,
    product_id: str,
    product_code: str,
    product_name: str,
    quantity: str,
    unit_price: str,
    shipped_quantity: str = "0",
    approval_status: str = "approved",
) -> tuple[str, str]:
    contract = await repository.create_contract(
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
        source_quotation_id=f"quotation-{code}",
        source_quotation_no=f"QT-{code}",
        remarks="出口合同",
        approval_status=approval_status,
        owner_user_id="u-001",
    )
    line = await repository.add_line(
        contract_id=contract.id,
        product_id=product_id,
        product_code=product_code,
        product_name=product_name,
        specification="40x35cm",
        model=product_code,
        quantity=quantity,
        unit="pcs",
        unit_price=unit_price,
        amount=str(Decimal(quantity) * Decimal(unit_price)),
        purchased_quantity=quantity,
        shipped_quantity=shipped_quantity,
        image_url=None,
        remark="合同明细",
    )
    await repository.refresh_statistics(contract.id)
    return contract.id, line.id


def _shipment_payload(
    contract_a: str,
    contract_b: str | None = None,
) -> ShipmentPlanGenerate:
    selections = [ShipmentContractSelection(contract_id=contract_a, quantity="300")]
    if contract_b is not None:
        selections.append(ShipmentContractSelection(contract_id=contract_b, quantity="200"))
    return ShipmentPlanGenerate(
        code="SP-SVC-001",
        shipment_date=date(2026, 8, 18),
        planned_ship_date=date(2026, 8, 20),
        shipping_method="sea",
        port_of_loading="Ningbo",
        port_of_destination="Hamburg",
        vessel_name="COSCO Star",
        container_no="CONT-SVC-001",
        booking_no="BOOK-SVC-001",
        document_owner_name="单证部",
        estimated_payable_amount="780.00",
        remarks="合并出运",
        selections=selections,
    )


async def test_shipment_service_generates_combined_plan_and_updates_contract_shipped_quantity(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        contract_repository = ExportContractRepository(session)
        shipment_repository = ShipmentPlanRepository(session)
        contract_a, _line_a = await _create_contract(
            contract_repository,
            code="EC-SHIP-A",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            quantity="1000",
            unit_price="1.40",
            shipped_quantity="250",
        )
        contract_b, _line_b = await _create_contract(
            contract_repository,
            code="EC-SHIP-B",
            product_id="product-b",
            product_code="BOX-20",
            product_name="Gift Box",
            quantity="500",
            unit_price="2.10",
        )
        service = ShipmentPlanService(shipment_repository, contract_repository)
        current_user = _user_with_permissions(
            [
                "sales:shipment:approve",
                "sales:shipment:edit",
                "sales:shipment:view",
                "sales:shipment:view_all",
            ]
        )

        plan = await service.generate_from_contracts(
            current_user=current_user,
            payload=_shipment_payload(contract_a, contract_b),
        )
        submitted = await service.submit_shipment(
            current_user=current_user,
            shipment_id=plan.id,
        )
        approved = await service.approve_shipment(
            current_user=current_user,
            shipment_id=plan.id,
            payload=ShipmentApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 8, 19),
            ),
        )
        refreshed_a = await contract_repository.get_contract(contract_a)
        refreshed_b = await contract_repository.get_contract(contract_b)
        reminders = await service.list_reminders(current_user=current_user)

    assert plan.approval_status == "draft"
    assert len(plan.lines) == 2
    assert plan.finance_overview.receivable_amount == "840.00"
    assert plan.finance_overview.payable_amount == "780.00"
    assert plan.finance_overview.profit_amount == "60.00"
    assert plan.reminder.reminder_date == date(2026, 8, 13)
    assert plan.contract_progresses[0].shipment_statuses[0].shipped_quantity == "250"
    assert submitted.approval_status == "submitted"
    assert approved.approval_status == "approved"
    assert approved.contract_progresses[0].shipment_statuses[0].status == "partial"
    assert refreshed_a is not None
    assert refreshed_a.shipped_quantity == "550"
    assert refreshed_b is not None
    assert refreshed_b.shipped_quantity == "200"
    assert reminders.total == 1
    assert reminders.items[0].shipment_no == "SP-SVC-001"


async def test_shipment_service_rejects_unapproved_contract(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        contract_repository = ExportContractRepository(session)
        shipment_repository = ShipmentPlanRepository(session)
        contract_id, _line_id = await _create_contract(
            contract_repository,
            code="EC-SHIP-DRAFT",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            quantity="1000",
            unit_price="1.40",
            approval_status="draft",
        )
        service = ShipmentPlanService(shipment_repository, contract_repository)

        with pytest.raises(ValueError):
            await service.generate_from_contracts(
                current_user=_user_with_permissions(["sales:shipment:edit"]),
                payload=_shipment_payload(contract_id),
            )


async def test_shipment_service_rejects_over_unshipped_quantity(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        contract_repository = ExportContractRepository(session)
        shipment_repository = ShipmentPlanRepository(session)
        contract_id, _line_id = await _create_contract(
            contract_repository,
            code="EC-SHIP-OVER",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            quantity="1000",
            unit_price="1.40",
            shipped_quantity="900",
        )
        service = ShipmentPlanService(shipment_repository, contract_repository)

        with pytest.raises(ValueError):
            await service.generate_from_contracts(
                current_user=_user_with_permissions(["sales:shipment:edit"]),
                payload=ShipmentPlanGenerate(
                    code="SP-SVC-OVER",
                    shipment_date=date(2026, 8, 18),
                    planned_ship_date=date(2026, 8, 20),
                    shipping_method="sea",
                    port_of_loading="Ningbo",
                    port_of_destination="Hamburg",
                    estimated_payable_amount="0",
                    selections=[
                        ShipmentContractSelection(
                            contract_id=contract_id,
                            quantity="300",
                        )
                    ],
                ),
            )
