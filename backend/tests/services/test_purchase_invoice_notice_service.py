from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.invoice_notices.repositories import PurchaseInvoiceNoticeRepository
from app.modules.purchase.invoice_notices.schemas import (
    PurchaseInvoiceNoticeGenerateFromDeclaration,
    PurchaseInvoiceNoticeLineCreate,
    PurchaseInvoiceNoticeReceiveTaxInvoice,
    PurchaseInvoiceNoticeSend,
)
from app.modules.purchase.invoice_notices.services import (
    PermissionDeniedError,
    PurchaseInvoiceNoticeService,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> PurchaseInvoiceNoticeService:
    return PurchaseInvoiceNoticeService(
        repository=PurchaseInvoiceNoticeRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
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


def _generation_payload() -> PurchaseInvoiceNoticeGenerateFromDeclaration:
    return PurchaseInvoiceNoticeGenerateFromDeclaration(
        customs_declaration_id="cd-001",
        customs_declaration_no="CD-2026-001",
        declaration_date=date(2026, 9, 3),
        notice_date=date(2026, 9, 4),
        currency="CNY",
        remarks="报关完成后通知供应商开票",
        lines=[
            PurchaseInvoiceNoticeLineCreate(
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
                purchase_contract_id="pc-001",
                purchase_contract_no="PC-001",
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                customs_name="环保购物袋",
                invoice_name="无纺布购物袋",
                quantity="1000",
                unit="pcs",
                amount="5200.00",
                remark="主供应商",
            ),
            PurchaseInvoiceNoticeLineCreate(
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
                purchase_contract_id="pc-002",
                purchase_contract_no="PC-002",
                product_id="product-rope",
                product_code="ACC-ROPE",
                product_name="棉绳",
                customs_name="棉绳",
                invoice_name="棉绳",
                quantity="450",
                unit="m",
                amount="360.00",
                remark="同一供应商合并",
            ),
            PurchaseInvoiceNoticeLineCreate(
                supplier_id="supplier-label-a",
                supplier_name="杭州标签厂",
                purchase_contract_id="pc-003",
                purchase_contract_no="PC-003",
                product_id="product-label",
                product_code="ACC-LABEL",
                product_name="洗标",
                customs_name="织唛",
                invoice_name="织唛",
                quantity="1000",
                unit="pcs",
                amount="120.00",
                remark="第二供应商",
            ),
        ],
    )


async def test_purchase_invoice_notice_service_generates_sends_and_receives(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            [
                "purchase:invoice_notice:edit",
                "purchase:invoice_notice:send",
                "purchase:invoice_notice:view",
                "purchase:invoice_notice:view_all",
            ]
        )

        generated = await service.generate_from_customs_declaration(
            current_user=current_user,
            payload=_generation_payload(),
        )
        pack_notice = next(
            item for item in generated.items if item.supplier_id == "supplier-pack-a"
        )
        sent = await service.send_notice(
            current_user=current_user,
            notice_id=pack_notice.id,
            payload=PurchaseInvoiceNoticeSend(
                sender_name="演示业务主管",
                sent_at=date(2026, 9, 5),
            ),
        )
        reminders = await service.list_reminders(current_user=current_user)
        received = await service.receive_tax_invoice(
            current_user=current_user,
            notice_id=pack_notice.id,
            payload=PurchaseInvoiceNoticeReceiveTaxInvoice(
                tax_invoice_no="VAT-2026-001",
                received_at=date(2026, 9, 9),
            ),
        )
        listed = await service.list_notices(
            current_user=current_user,
            q="无纺布",
            status="received",
            supplier_id="supplier-pack-a",
            customs_declaration_id=None,
        )

    assert generated.total == 2
    assert pack_notice.total_quantity == "1450"
    assert pack_notice.total_amount == "5560.00"
    assert len(pack_notice.lines) == 2
    assert sent.status == "sent"
    assert sent.reminders[0].status == "open"
    assert sent.reminders[0].due_date.isoformat() == "2026-09-12"
    assert reminders.total == 1
    assert received.status == "received"
    assert received.tax_invoice_no == "VAT-2026-001"
    assert received.reminders[0].status == "done"
    assert listed.total == 1


async def test_purchase_invoice_notice_service_private_filter(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        owner = _user_with_permissions(["purchase:invoice_notice:edit"], user_id="u-owner")
        await service.generate_from_customs_declaration(
            current_user=owner,
            payload=_generation_payload(),
        )
        result = await service.list_notices(
            current_user=_user_with_permissions(
                ["purchase:invoice_notice:view"],
                user_id="u-other",
            ),
            q=None,
            status=None,
            supplier_id=None,
            customs_declaration_id=None,
        )

    assert result.total == 0


async def test_purchase_invoice_notice_service_requires_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)

        with pytest.raises(PermissionDeniedError):
            await service.generate_from_customs_declaration(
                current_user=_user_with_permissions(["purchase:invoice_notice:view"]),
                payload=_generation_payload(),
            )
