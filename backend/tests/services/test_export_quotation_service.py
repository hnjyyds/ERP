from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.contracts.models import ExportContract
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.quotations.repositories import ExportQuotationRepository
from app.modules.sales.quotations.schemas import (
    ExportQuotationApprove,
    ExportQuotationConfirmContract,
    ExportQuotationCreate,
    ExportQuotationLineCreate,
    ExportQuotationReject,
    ExportQuotationSubmit,
    ExportQuotationWithdraw,
)
from app.modules.sales.quotations.services import (
    ExportQuotationService,
    PermissionDeniedError,
)
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.seed import seed_system_demo_data


def _make_service(session: AsyncSession) -> ExportQuotationService:
    return ExportQuotationService(
        ExportQuotationRepository(session),
        SampleDeliveryRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


def _make_service_with_contracts(session: AsyncSession) -> ExportQuotationService:
    return ExportQuotationService(
        ExportQuotationRepository(session),
        SampleDeliveryRepository(session),
        ExportContractRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


def _user_with_permissions(
    permissions: list[str],
    user_id: str = "u-test",
    data_scope: str = "self",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username="tester",
        display_name="测试用户",
        department_name="测试部",
        data_scope=data_scope,
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
        await seed_system_demo_data(session)
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
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        reviewer = _user_with_permissions(
            ["system:super_admin", "sales:quotation:approve", "sales:quotation:view"],
            user_id="u-boss",
            data_scope="all",
        )
        approved = await service.approve_quotation(
            current_user=reviewer,
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
            ),
        )

    assert quotation.approval_status == "draft"
    assert quotation.code.startswith("QT-")
    assert quotation.total_amount == "1370.00"
    assert submitted.approval_status == "submitted"
    assert approved.approval_status == "approved"
    assert approved.reviewer_id == "u-boss"
    assert history.total == 1
    assert history.items[0].code == quotation.code
    assert references.items[0].reference_price == "0.82"
    assert export.filename == f"{quotation.code}.csv"
    assert quotation.code in export.content
    assert contract.contract_no.startswith("EC-")
    assert contract.total_amount == "1370.00"


async def test_export_quotation_service_rejects_confirm_before_approval(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
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
        await seed_system_demo_data(session)
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


async def test_export_quotation_service_reject_edit_and_resubmit(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        owner = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=owner,
            payload=_quotation_payload("QT-SVC-REJECT"),
        )
        await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        reviewer = _user_with_permissions(
            ["system:super_admin", "sales:quotation:approve", "sales:quotation:view"],
            user_id="u-boss",
            data_scope="all",
        )
        rejected = await service.reject_quotation(
            current_user=reviewer,
            quotation_id=quotation.id,
            payload=ExportQuotationReject(
                rejected_at=date(2026, 7, 2),
                rejection_reason="价格偏高，请复核运费",
            ),
        )
        edited = await service.update_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=_quotation_payload("QT-SVC-REJECT"),
        )
        resubmitted = await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        approved = await service.approve_quotation(
            current_user=reviewer,
            quotation_id=quotation.id,
            payload=ExportQuotationApprove(
                reviewer_name="演示业务主管",
                approved_at=date(2026, 7, 3),
            ),
        )

    assert rejected.approval_status == "rejected"
    assert rejected.rejected_at == date(2026, 7, 2)
    assert rejected.rejection_reason == "价格偏高，请复核运费"
    assert rejected.reviewer_id == "u-boss"
    assert edited.approval_status == "draft"
    assert edited.rejection_reason == "价格偏高，请复核运费"
    assert edited.rejected_at == date(2026, 7, 2)
    assert resubmitted.approval_status == "submitted"
    assert resubmitted.rejection_reason is None
    assert resubmitted.rejected_at is None
    assert approved.approval_status == "approved"


async def test_export_quotation_service_enforces_reject_reviewer_and_status(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        owner = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=owner,
            payload=_quotation_payload("QT-SVC-REJECT-GUARD"),
        )
        other_reviewer = _user_with_permissions(
            ["sales:quotation:approve", "sales:quotation:view"],
            user_id="u-other-reviewer",
            data_scope="all",
        )
        with pytest.raises(ValueError, match="只有已提交报价可以驳回"):
            await service.reject_quotation(
                current_user=other_reviewer,
                quotation_id=quotation.id,
                payload=ExportQuotationReject(
                    rejected_at=date(2026, 7, 2),
                    rejection_reason="草稿驳回",
                ),
            )
        await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        with pytest.raises(PermissionDeniedError):
            await service.reject_quotation(
                current_user=other_reviewer,
                quotation_id=quotation.id,
                payload=ExportQuotationReject(
                    rejected_at=date(2026, 7, 2),
                    rejection_reason="非指定审批人",
                ),
            )


async def test_export_quotation_service_withdraw_rules(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        owner = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=owner,
            payload=_quotation_payload("QT-SVC-WITHDRAW"),
        )
        with pytest.raises(ValueError, match="只有已提交报价可以撤回"):
            await service.withdraw_quotation(
                current_user=owner,
                quotation_id=quotation.id,
                payload=ExportQuotationWithdraw(),
            )
        await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        other_editor = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-other-editor",
            data_scope="all",
        )
        with pytest.raises(PermissionDeniedError):
            await service.withdraw_quotation(
                current_user=other_editor,
                quotation_id=quotation.id,
                payload=ExportQuotationWithdraw(),
            )
        withdrawn = await service.withdraw_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationWithdraw(),
        )
        admin = _user_with_permissions(
            ["system:super_admin", "sales:quotation:edit", "sales:quotation:view"],
            user_id="u-boss",
            data_scope="all",
        )
        await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        admin_withdrawn = await service.withdraw_quotation(
            current_user=admin,
            quotation_id=quotation.id,
            payload=ExportQuotationWithdraw(),
        )

    assert withdrawn.approval_status == "draft"
    assert withdrawn.submitted_at is None
    assert withdrawn.reviewer_id is None
    assert withdrawn.reviewer_name is None
    assert admin_withdrawn.approval_status == "draft"


async def test_export_quotation_service_blocks_reject_and_withdraw_after_contract(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service_with_contracts(session)
        owner = _user_with_permissions(
            ["sales:quotation:edit", "sales:quotation:view"],
            user_id="u-001",
        )
        quotation = await service.create_quotation(
            current_user=owner,
            payload=_quotation_payload("QT-SVC-DOWNSTREAM"),
        )
        await service.submit_quotation(
            current_user=owner,
            quotation_id=quotation.id,
            payload=ExportQuotationSubmit(reviewer_id="u-admin"),
        )
        session.add(
            ExportContract(
                code="EC-SVC-DOWNSTREAM",
                contract_date=date(2026, 7, 2),
                customer_name="客户 A",
                currency="USD",
                trade_term="FOB Ningbo",
                planned_ship_date=date(2026, 8, 1),
                payment_terms="T/T",
                source_quotation_id=quotation.id,
                source_quotation_no=quotation.code,
                owner_user_id="u-001",
            )
        )
        await session.flush()
        reviewer = _user_with_permissions(
            ["system:super_admin", "sales:quotation:approve", "sales:quotation:view"],
            user_id="u-boss",
            data_scope="all",
        )
        with pytest.raises(ValueError, match="已生成出口合同"):
            await service.reject_quotation(
                current_user=reviewer,
                quotation_id=quotation.id,
                payload=ExportQuotationReject(
                    rejected_at=date(2026, 7, 2),
                    rejection_reason="尝试驳回",
                ),
            )
        with pytest.raises(ValueError, match="已生成出口合同"):
            await service.withdraw_quotation(
                current_user=owner,
                quotation_id=quotation.id,
                payload=ExportQuotationWithdraw(),
            )

pytestmark = pytest.mark.usefixtures("reference_master_data")
