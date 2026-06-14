from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.inquiries.repositories import PurchaseInquiryRepository
from app.modules.purchase.inquiries.schemas import (
    PurchaseInquiryCreate,
    PurchaseInquiryLineCreate,
    PurchaseInquiryTemplateSend,
    PurchaseInquiryUpdate,
    SupplierQuotationCreate,
)
from app.modules.purchase.inquiries.services import (
    PermissionDeniedError,
    PurchaseInquiryService,
)
from app.modules.sample.records.repositories import SampleRecordRepository
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


def _inquiry_payload(code: str = "PI-SVC-001") -> PurchaseInquiryCreate:
    return PurchaseInquiryCreate(
        code=code,
        inquiry_date=date(2026, 8, 1),
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        remarks="环保袋供应商询价",
        lines=[
            PurchaseInquiryLineCreate(
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                specification="40x35cm",
                model="BAG-40",
                quantity="1000",
                unit="pcs",
            )
        ],
    )


def _inquiry_update_payload(code: str = "PI-SVC-001") -> PurchaseInquiryUpdate:
    return PurchaseInquiryUpdate(
        code=code,
        inquiry_date=date(2026, 8, 3),
        buyer_user_id="u-002",
        buyer_user_name="采购专员",
        remarks="编辑后的采购询价",
        lines=[
            PurchaseInquiryLineCreate(
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                specification="40x35cm",
                model="BAG-40",
                quantity="1200",
                unit="pcs",
            )
        ],
    )


async def _create_supplier_sample(
    sample_repository: SampleRecordRepository,
    *,
    inquiry_id: str,
    inquiry_code: str,
) -> None:
    await sample_repository.create_record(
        code="SM-PI-SVC-001",
        sample_type="confirm_sample",
        status="registered",
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        customer_id=None,
        customer_name=None,
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        customer_sku=None,
        supplier_sku="PACK-A-40",
        purchase_contract_id=None,
        purchase_contract_no=None,
        source_type="purchase_inquiry",
        source_id=inquiry_id,
        source_code=inquiry_code,
        source_note="询价前供应商样品",
        received_at=date(2026, 7, 28),
        submitted_at=None,
        quantity="3",
        unit="pcs",
        description="供应商已提供确认样",
        owner_user_id="u-001",
    )


async def test_purchase_inquiry_service_create_quote_template_and_reference(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PurchaseInquiryRepository(session)
        sample_repository = SampleRecordRepository(session)
        service = PurchaseInquiryService(repository)
        current_user = _user_with_permissions(
            [
                "purchase:inquiry:edit",
                "purchase:inquiry:export",
                "purchase:inquiry:view",
                "purchase:inquiry:view_all",
            ]
        )
        inquiry = await service.create_inquiry(
            current_user=current_user,
            payload=_inquiry_payload(),
        )
        await _create_supplier_sample(
            sample_repository,
            inquiry_id=inquiry.id,
            inquiry_code=inquiry.code,
        )
        template = await service.send_template(
            current_user=current_user,
            inquiry_id=inquiry.id,
            payload=PurchaseInquiryTemplateSend(
                template_name="标准采购询价模板",
                recipient_emails=["supplier@example.com"],
            ),
        )
        quote_a = await service.add_supplier_quotation(
            current_user=current_user,
            inquiry_id=inquiry.id,
            payload=SupplierQuotationCreate(
                inquiry_line_id=inquiry.lines[0].id,
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
                quoted_at=date(2026, 8, 2),
                unit_price="0.78",
                currency="USD",
                lead_time_days=18,
                min_order_quantity="800",
                sample_available=True,
                remark="含环保包装",
            ),
        )
        quote_b = await service.add_supplier_quotation(
            current_user=current_user,
            inquiry_id=inquiry.id,
            payload=SupplierQuotationCreate(
                inquiry_line_id=inquiry.lines[0].id,
                supplier_id="supplier-pack-b",
                supplier_name="宁波成品包装厂",
                quoted_at=date(2026, 8, 2),
                unit_price="0.82",
                currency="USD",
                lead_time_days=15,
                min_order_quantity="1000",
                sample_available=False,
                remark="交期更短",
            ),
        )
        refreshed = await service.get_inquiry(
            current_user=current_user,
            inquiry_id=inquiry.id,
        )
        samples = await service.get_supplier_samples(
            current_user=current_user,
            product_id="product-bag",
            supplier_id="supplier-pack-a",
        )
        references = await service.get_purchase_references(
            current_user=current_user,
            product_id="product-bag",
        )

    assert inquiry.status == "draft"
    assert quote_a.quotations[0].has_sample is True
    assert quote_b.quotations[1].unit_price == "0.82"
    assert "PI-SVC-001" in template.content
    assert template.content_type == "text/plain"
    assert refreshed.status == "quoted"
    assert len(refreshed.quotations) == 2
    assert samples.items[0].sample_code == "SM-PI-SVC-001"
    assert references.items[0].reference_price == "0.78"
    assert references.items[0].source_inquiry_no == "PI-SVC-001"


async def test_purchase_inquiry_service_updates_draft_and_blocks_after_quote(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = PurchaseInquiryService(PurchaseInquiryRepository(session))
        current_user = _user_with_permissions(
            [
                "purchase:inquiry:edit",
                "purchase:inquiry:view",
                "purchase:inquiry:view_all",
            ]
        )
        inquiry = await service.create_inquiry(
            current_user=current_user,
            payload=_inquiry_payload("PI-SVC-EDIT"),
        )

        updated = await service.update_inquiry(
            current_user=current_user,
            inquiry_id=inquiry.id,
            payload=_inquiry_update_payload("PI-SVC-EDIT"),
        )
        quoted = await service.add_supplier_quotation(
            current_user=current_user,
            inquiry_id=updated.id,
            payload=SupplierQuotationCreate(
                inquiry_line_id=updated.lines[0].id,
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
                quoted_at=date(2026, 8, 4),
                unit_price="0.78",
                currency="USD",
                lead_time_days=18,
                min_order_quantity="800",
                sample_available=True,
                remark="含环保包装",
            ),
        )

        with pytest.raises(ValueError):
            await service.update_inquiry(
                current_user=current_user,
                inquiry_id=quoted.id,
                payload=_inquiry_update_payload("PI-SVC-EDIT"),
            )

    assert updated.inquiry_date == date(2026, 8, 3)
    assert updated.buyer_user_name == "采购专员"
    assert updated.lines[0].quantity == "1200"
    assert updated.status == "draft"
    assert quoted.status == "quoted"


async def test_purchase_inquiry_service_filters_private_records_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = PurchaseInquiryService(PurchaseInquiryRepository(session))
        await service.create_inquiry(
            current_user=_user_with_permissions(["purchase:inquiry:edit"], user_id="u-owner"),
            payload=_inquiry_payload("PI-SVC-PRIVATE"),
        )
        result = await service.list_inquiries(
            current_user=_user_with_permissions(["purchase:inquiry:view"], user_id="u-other"),
            q=None,
            status=None,
            product_id=None,
            supplier_id=None,
        )

    assert result.total == 0


async def test_purchase_inquiry_service_requires_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = PurchaseInquiryService(PurchaseInquiryRepository(session))

        with pytest.raises(PermissionDeniedError):
            await service.create_inquiry(
                current_user=_user_with_permissions(["purchase:inquiry:view"]),
                payload=_inquiry_payload("PI-SVC-FORBIDDEN"),
            )
