from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.purchase.contracts.schemas import (
    PurchaseContractApprove,
    PurchaseContractCreate,
    PurchaseContractGenerateFromExportContracts,
    PurchaseContractLineCreate,
    PurchaseContractSourceSelection,
)
from app.modules.purchase.contracts.services import (
    PermissionDeniedError,
    PurchaseContractService,
)
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.seed import seed_system_demo_data


def _make_service(session: AsyncSession) -> PurchaseContractService:
    auth_repository = AuthRepository(session)
    return PurchaseContractService(
        purchase_repository=PurchaseContractRepository(session),
        export_contract_repository=ExportContractRepository(session),
        product_repository=ProductRepository(session),
        data_scope_resolver=DataScopeResolver(auth_repository),
        auth_repository=auth_repository,
    )


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


def _stock_purchase_payload(code: str = "PC-SVC-STOCK") -> PurchaseContractCreate:
    return PurchaseContractCreate(
        code=code,
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 28),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="库存采购",
        lines=[
            PurchaseContractLineCreate(
                product_id="accessory-cotton-rope",
                product_code="ACC-ROPE",
                product_name="棉绳",
                specification="5mm",
                model="ROPE-5",
                quantity="450",
                unit="m",
                unit_price="0.12",
                source_export_contract_id=None,
                source_export_contract_no=None,
                source_export_contract_line_id=None,
                remark="安全库存",
            )
        ],
    )


async def _create_product_with_accessory(product_repository: ProductRepository) -> str:
    product = await product_repository.create_product(
        code="BAG-SVC-40",
        cn_name="环保购物袋",
        en_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        customs_code="4202920000",
        tax_rate="0.13",
        rebate_rate="0.09",
        package_info="100 pcs/carton",
        unit="pcs",
        image_url=None,
    )
    await product_repository.add_accessory(
        product_id=product.id,
        accessory_name="棉绳",
        unit_consumption="0.45",
        unit="m",
        default_supplier_name="华东包装制品厂",
        purchase_split_rule="by_supplier",
    )
    return product.id


async def _create_approved_export_contract(
    export_repository: ExportContractRepository,
    *,
    code: str,
    product_id: str,
    quantity: str,
) -> tuple[str, str]:
    contract = await export_repository.create_contract(
        code=code,
        contract_date=date(2026, 8, 1),
        customer_id="customer-euro-home",
        customer_name="欧陆家居用品有限公司",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        planned_ship_date=date(2026, 9, 1),
        payment_terms="30% T/T",
        source_quotation_id=None,
        source_quotation_no=None,
        remarks="出口合同",
        approval_status="approved",
        owner_user_id="u-001",
    )
    line = await export_repository.add_line(
        contract_id=contract.id,
        product_id=product_id,
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity=quantity,
        unit="pcs",
        unit_price="1.40",
        amount=str(float(quantity) * 1.4),
        purchased_quantity="0",
        shipped_quantity="0",
        image_url=None,
        remark="出口合同明细",
    )
    refreshed = await export_repository.refresh_statistics(contract.id)
    assert refreshed is not None
    return contract.id, line.id


async def test_purchase_contract_service_generates_from_export_contracts_and_approves(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        export_repository = ExportContractRepository(session)
        product_repository = ProductRepository(session)
        service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "purchase:contract:approve",
                "purchase:contract:edit",
                "purchase:contract:view",
                "purchase:contract:view_all",
            ]
        )
        product_id = await _create_product_with_accessory(product_repository)
        export_a_id, export_a_line_id = await _create_approved_export_contract(
            export_repository,
            code="EC-SVC-PC-A",
            product_id=product_id,
            quantity="1000",
        )
        export_b_id, _export_b_line_id = await _create_approved_export_contract(
            export_repository,
            code="EC-SVC-PC-B",
            product_id=product_id,
            quantity="500",
        )

        generated = await service.generate_from_export_contracts(
            current_user=current_user,
            payload=PurchaseContractGenerateFromExportContracts(
                code="PC-SVC-GEN",
                contract_date=date(2026, 8, 6),
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
                buyer_user_id="u-001",
                buyer_user_name="演示业务主管",
                currency="USD",
                delivery_date=date(2026, 8, 30),
                payment_terms="30% 预付，70% 出货前",
                unit_price="0.12",
                remarks="合并采购棉绳",
                sources=[
                    PurchaseContractSourceSelection(export_contract_id=export_a_id),
                    PurchaseContractSourceSelection(export_contract_id=export_b_id),
                ],
            ),
        )
        submitted = await service.submit_contract(
            current_user=current_user,
            contract_id=generated.id,
        )
        approved = await service.approve_contract(
            current_user=current_user,
            contract_id=generated.id,
            payload=PurchaseContractApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 8, 7),
            ),
        )
        export_a = await export_repository.get_contract(export_a_id)
        export_a_lines = await export_repository.list_lines(export_a_id)

    assert generated.source_type == "export_contract"
    assert generated.lines[0].product_name == "棉绳"
    assert generated.lines[0].quantity == "675"
    assert generated.statistics.total_amount == "81.00"
    assert len(generated.source_links) == 2
    assert generated.reminders[0].reminder_type == "payment"
    assert submitted.approval_status == "submitted"
    assert approved.approval_status == "approved"
    assert approved.statistics.unpaid_amount == "81.00"
    assert export_a is not None
    assert export_a.purchased_quantity == "1000"
    assert export_a_lines[0].id == export_a_line_id
    assert export_a_lines[0].purchased_quantity == 1000


async def test_purchase_contract_service_supports_stock_purchase_and_private_filter(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        owner = _user_with_permissions(["purchase:contract:edit"], user_id="u-owner")
        created = await service.create_contract(
            current_user=owner,
            payload=_stock_purchase_payload("PC-SVC-PRIVATE"),
        )
        result = await service.list_contracts(
            current_user=_user_with_permissions(["purchase:contract:view"], user_id="u-other"),
            q=None,
            approval_status=None,
            supplier_id=None,
            source_type=None,
        )

    assert created.source_type == "stock_purchase"
    assert created.lines[0].source_export_contract_id is None
    assert result.total == 0


async def test_purchase_contract_service_requires_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)

        with pytest.raises(PermissionDeniedError):
            await service.create_contract(
                current_user=_user_with_permissions(["purchase:contract:view"]),
                payload=_stock_purchase_payload("PC-SVC-FORBIDDEN"),
            )
