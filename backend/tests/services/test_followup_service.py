from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.schemas import FollowSourceEventSync
from app.modules.followup.services import FollowupService, PermissionDeniedError
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> FollowupService:
    return FollowupService(
        followup_repository=FollowupRepository(session),
        purchase_contract_repository=PurchaseContractRepository(session),
        sample_record_repository=SampleRecordRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


def _user(
    permissions: list[str],
    *,
    user_id: str = "u-001",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username=user_id,
        display_name="演示业务主管",
        department_name="业务部",
        roles=["业务主管"],
        permissions=permissions,
    )


async def _create_approved_contract(repository: PurchaseContractRepository) -> str:
    contract = await repository.create_contract(
        code="PC-FUP-SVC",
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 30),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="采购跟单服务测试",
        approval_status="submitted",
        owner_user_id="u-001",
    )
    approved = await repository.approve_contract(
        contract_id=contract.id,
        reviewer_name="演示业务主管",
        approved_at=date(2026, 8, 5),
    )
    assert approved is not None
    return approved.id


async def test_followup_service_generates_plan_syncs_sources_and_scans_overdue(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id = await _create_approved_contract(purchase_repository)
        sample_repository = SampleRecordRepository(session)
        sample = await sample_repository.create_record(
            code="SM-FUP-001",
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
            purchase_contract_id=contract_id,
            purchase_contract_no="PC-FUP-SVC",
            source_type=None,
            source_id=None,
            source_code=None,
            source_note=None,
            received_at=date(2026, 8, 7),
            submitted_at=date(2026, 8, 8),
            quantity="3",
            unit="pcs",
            description="确认样提交",
            owner_user_id="u-001",
        )
        await sample_repository.add_followup_event(
            sample_record_id=sample.id,
            purchase_contract_id=contract_id,
            purchase_contract_no="PC-FUP-SVC",
            node_code="confirm_sample_submitted",
            node_label="确认样提交",
            actual_date=date(2026, 8, 8),
            event_type="sample_completed",
        )
        service = _make_service(session)
        current_user = _user(
            [
                "followup:template:view",
                "followup:template:edit",
                "followup:plan:view",
                "followup:plan:edit",
                "followup:plan:view_all",
            ]
        )

        plan = await service.generate_plan_from_purchase_contract(
            current_user=current_user,
            purchase_contract_id=contract_id,
            as_of=date(2026, 8, 5),
        )
        synced = await service.sync_sample_followup_events(
            current_user=current_user,
            purchase_contract_id=contract_id,
        )
        await service.sync_source_event(
            current_user=current_user,
            payload=FollowSourceEventSync(
                purchase_contract_id=contract_id,
                node_code="quality_inspection",
                source_record_type="quality_inspection",
                source_record_id="qc-001",
                actual_date=date(2026, 8, 19),
                source_summary="QC 查验通过",
            ),
        )
        overdue = await service.scan_overdue_nodes(
            current_user=current_user,
            as_of=date(2026, 9, 5),
        )

    assert plan.purchase_contract_no == "PC-FUP-SVC"
    assert len(plan.nodes) == 6
    assert plan.nodes[0].node_code == "contract_confirmed"
    assert plan.nodes[0].actual_date == date(2026, 8, 5)
    confirm_node = next(
        node for node in synced.nodes if node.node_code == "confirm_sample_submitted"
    )
    assert confirm_node.actual_date == date(2026, 8, 8)
    assert confirm_node.source_record_type == "sample_followup_event"
    assert overdue.total >= 1
    assert any(node.node_code == "inbound_completed" for node in overdue.items)


async def test_followup_service_enforces_permissions(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)

        with pytest.raises(PermissionDeniedError):
            await service.list_templates(
                current_user=_user(["followup:plan:view"]),
            )
