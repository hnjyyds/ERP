from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.finance.receipts.models import BankReceipt, ReceiptAllocation
from app.modules.purchase.contracts.models import PurchaseContract, PurchaseContractLine
from app.modules.sales.contracts.references import ExportContractReferenceRepository
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.contracts.schemas import (
    ExportContractAdvancePaymentCreate,
    ExportContractApprove,
    ExportContractCreate,
    ExportContractLineCreate,
    ExportContractSignatureCreate,
    ExportContractSubmit,
)
from app.modules.sales.contracts.services import (
    ExportContractNotFoundError,
    ExportContractService,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.seed import seed_system_demo_data


def _make_service(session: AsyncSession) -> ExportContractService:
    return ExportContractService(
        ExportContractRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        reference_repository=ExportContractReferenceRepository(session),
    )


def _user_with_permissions(
    permissions: list[str],
    user_id: str = "u-test",
    *,
    department_id: str | None = None,
    data_scope: str = "self",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username="tester",
        display_name="测试用户",
        department_id=department_id,
        department_name="测试部",
        data_scope=data_scope,
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
        source_quotation_id=None,
        source_quotation_no=None,
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
        await seed_system_demo_data(session)
        repository = ExportContractRepository(session)
        service = _make_service(session)
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
            payload=ExportContractSubmit(reviewer_id="u-admin"),
        )
        reviewer = _user_with_permissions(
            ["sales:contract:approve", "sales:contract:view"],
            user_id="u-admin",
            data_scope="all",
        )
        approved = await service.approve_contract(
            current_user=reviewer,
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
        service = _make_service(session)
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


async def test_export_contract_service_only_deletes_draft_contracts(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sales:contract:edit", "sales:contract:view"],
            user_id="u-001",
        )
        draft = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-DELETE"),
        )
        deleted = await service.delete_contract(
            current_user=current_user,
            contract_id=draft.id,
        )

        assert deleted.id == draft.id
        with pytest.raises(ExportContractNotFoundError):
            await service.get_contract(current_user=current_user, contract_id=draft.id)

        submitted = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-KEEP"),
        )
        await service.submit_contract(
            current_user=current_user,
            contract_id=submitted.id,
            payload=ExportContractSubmit(reviewer_id="u-admin"),
        )
        with pytest.raises(ValueError, match="只有草稿合同可以删除"):
            await service.delete_contract(
                current_user=current_user,
                contract_id=submitted.id,
            )


async def test_export_contract_service_rejects_deleting_quotation_generated_draft(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sales:contract:edit", "sales:contract:view"],
            user_id="u-001",
        )
        generated = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-QUOTATION").model_copy(
                update={
                    "source_quotation_id": "quotation-a",
                    "source_quotation_no": "QT-SVC-001",
                }
            ),
        )

        with pytest.raises(ValueError, match="已被其他业务单据引用"):
            await service.delete_contract(
                current_user=current_user,
                contract_id=generated.id,
            )

        loaded = await service.get_contract(
            current_user=current_user,
            contract_id=generated.id,
        )
        assert loaded.id == generated.id


async def test_export_contract_service_rejects_deleting_receipt_allocated_draft(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sales:contract:edit", "sales:contract:view"],
            user_id="u-001",
        )
        draft = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-RECEIPT"),
        )
        receipt = BankReceipt(
            receipt_no="BR-SVC-DELETE-GUARD",
            received_at=date(2026, 7, 8),
            payer_name="客户 A",
            customer_id="customer-a",
            customer_name="客户 A",
            amount=Decimal("100"),
            allocated_amount=Decimal("100"),
            currency="USD",
            bank_account="TEST-ACCOUNT",
            reference_no=None,
            receipt_type="advance",
            status="allocated",
            claim_message="已认领",
            remark=None,
            created_by_user_id="u-finance",
            created_by_user_name="财务",
        )
        session.add(receipt)
        await session.flush()
        session.add(
            ReceiptAllocation(
                receipt_id=receipt.id,
                allocation_type="contract",
                contract_id=draft.id,
                contract_no=draft.code,
                invoice_no=None,
                allocated_at=date(2026, 7, 8),
                amount=Decimal("100"),
                currency="USD",
                remark=None,
            )
        )
        await session.commit()

        with pytest.raises(ValueError, match="已被其他业务单据引用"):
            await service.delete_contract(
                current_user=current_user,
                contract_id=draft.id,
            )


async def test_export_contract_service_rejects_deleting_draft_referenced_by_purchase_line(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["sales:contract:edit", "sales:contract:view"],
            user_id="u-001",
        )
        draft = await service.create_contract(
            current_user=current_user,
            payload=_contract_payload("EC-SVC-PURCHASE-LINE"),
        )
        purchase_contract = PurchaseContract(
            code="PC-SVC-EXPORT-REFERENCE",
            contract_date=date(2026, 7, 8),
            supplier_name="测试供应商",
            currency="CNY",
            delivery_date=date(2026, 8, 8),
            payment_terms="月结 30 天",
            source_type="manual",
            approval_status="draft",
            owner_user_id="u-001",
        )
        session.add(purchase_contract)
        await session.flush()
        purchase_line = PurchaseContractLine(
            contract_id=purchase_contract.id,
            product_name="测试商品",
            quantity=Decimal("10"),
            unit="pcs",
            unit_price=Decimal("5"),
            amount=Decimal("50"),
            source_export_contract_id=draft.id,
            source_export_contract_no=draft.code,
            source_export_contract_line_id=draft.lines[0].id,
        )
        session.add(purchase_line)
        await session.commit()

        with pytest.raises(ValueError, match="已被其他业务单据引用"):
            await service.delete_contract(
                current_user=current_user,
                contract_id=draft.id,
            )

        assert (
            await service.get_contract(current_user=current_user, contract_id=draft.id)
        ).id == draft.id
        persisted_line = await session.get(PurchaseContractLine, purchase_line.id)
        assert persisted_line is not None
        assert persisted_line.source_export_contract_id == draft.id


async def test_export_contract_service_filters_private_records_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
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


async def _seed_department_user(
    session: AsyncSession, *, user_id: str, department_id: str
) -> None:
    from datetime import UTC, datetime

    auth = AuthRepository(session)
    existing = await auth.get_department(department_id)
    if existing is None:
        await auth.create_department(
            department_id=department_id, name=department_id, parent_id=None, sort_order=0
        )
    await auth.create_organization_user(
        user_id=user_id,
        username=user_id,
        display_name=user_id,
        department_id=department_id,
        password_hash="x",
        password_salt="y",
        is_active=True,
        avatar_type="preset",
        avatar_value="amber-orbit",
        created_at=datetime.now(UTC),
    )
    await session.commit()


async def test_export_contract_service_department_scope_sees_department_peers(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await _seed_department_user(session, user_id="u-owner", department_id="d-sales")
        await _seed_department_user(session, user_id="u-peer", department_id="d-sales")
        await _seed_department_user(session, user_id="u-outsider", department_id="d-other")

        service = _make_service(session)
        owner = _user_with_permissions(
            ["sales:contract:edit"], user_id="u-owner", department_id="d-sales"
        )
        await service.create_contract(current_user=owner, payload=_contract_payload("EC-DEPT-1"))

        # 同部门、department 范围：能看到本部门同事创建的合同。
        peer = _user_with_permissions(
            ["sales:contract:view"],
            user_id="u-peer",
            department_id="d-sales",
            data_scope="department",
        )
        peer_result = await service.list_contracts(
            current_user=peer, q=None, approval_status=None, customer_id=None
        )

        # 不同部门、department 范围：看不到。
        outsider = _user_with_permissions(
            ["sales:contract:view"],
            user_id="u-outsider",
            department_id="d-other",
            data_scope="department",
        )
        outsider_result = await service.list_contracts(
            current_user=outsider, q=None, approval_status=None, customer_id=None
        )

    assert peer_result.total == 1
    assert outsider_result.total == 0
