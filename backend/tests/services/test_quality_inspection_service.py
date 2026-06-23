from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.quality.inspections.schemas import (
    QualityInspectionCreate,
    QualityInspectionIssueCreate,
    QualityInspectionLineCreate,
)
from app.modules.quality.inspections.services import (
    PermissionDeniedError,
    QualityInspectionNotFoundError,
    QualityInspectionService,
)
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> QualityInspectionService:
    purchase_contract_repository = PurchaseContractRepository(session)
    return QualityInspectionService(
        quality_repository=QualityInspectionRepository(session),
        purchase_contract_repository=purchase_contract_repository,
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_contract_repository,
            sample_record_repository=SampleRecordRepository(session),
            data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        ),
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


def _quality_user() -> CurrentUserResponse:
    return _user(
        [
            "quality:inspection:view",
            "quality:inspection:edit",
            "quality:inspection:view_all",
        ]
    )


async def _create_approved_contract(
    repository: PurchaseContractRepository,
    *,
    code: str = "PC-QC-SVC",
    qc_user_id: str | None = None,
    qc_user_name: str | None = None,
    owner_user_id: str = "u-001",
) -> tuple[str, str]:
    contract = await repository.create_contract(
        code=code,
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        qc_user_id=qc_user_id,
        qc_user_name=qc_user_name,
        currency="USD",
        delivery_date=date(2026, 8, 30),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="QC 查验服务测试",
        approval_status="submitted",
        owner_user_id=owner_user_id,
    )
    line = await repository.add_line(
        contract_id=contract.id,
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.2",
        amount="1200.00",
        source_export_contract_id=None,
        source_export_contract_no=None,
        source_export_contract_line_id=None,
        remark="QC 查验商品",
    )
    await repository.refresh_statistics(contract.id)
    approved = await repository.approve_contract(
        contract_id=contract.id,
        reviewer_name="演示业务主管",
        approved_at=date(2026, 8, 5),
    )
    assert approved is not None
    return approved.id, line.id


async def test_quality_inspection_service_records_failed_result_and_blocks_formal_inbound(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id, line_id = await _create_approved_contract(purchase_repository)
        service = _make_service(session)

        inspection = await service.create_inspection(
            current_user=_quality_user(),
            payload=QualityInspectionCreate(
                code="QC-SVC-FAIL",
                purchase_contract_id=contract_id,
                inspected_at=date(2026, 8, 19),
                result="failed",
                inspector_id="u-qc-001",
                inspector_name="QC 张工",
                issue_summary="外箱破损",
                attachment_group_id="attach-qc-fail",
                lines=[
                    QualityInspectionLineCreate(
                        purchase_contract_line_id=line_id,
                        product_name="Eco Shopping Bag",
                        inspected_quantity="120",
                        failed_quantity="6",
                        unit="pcs",
                        result="failed",
                    )
                ],
                issues=[
                    QualityInspectionIssueCreate(
                        issue_type="包装破损",
                        severity="major",
                        description="外箱 6 件破损",
                        corrective_action="供应商重新包装后复检",
                        attachment_group_id="attach-qc-issue",
                    )
                ],
            ),
        )
        eligibility = await service.get_inbound_eligibility(
            current_user=_quality_user(),
            purchase_contract_id=contract_id,
        )

    assert inspection.result == "failed"
    assert inspection.qc_user_id is None
    assert inspection.qc_user_name is None
    assert inspection.issues[0].attachment_group_id == "attach-qc-issue"
    assert eligibility.eligible is False
    assert eligibility.latest_result == "failed"
    assert eligibility.reason == "最近一次 QC 未通过"


async def test_quality_inspection_service_passed_result_writes_back_followup_node(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id, line_id = await _create_approved_contract(purchase_repository)
        followup_service = FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_repository,
            sample_record_repository=SampleRecordRepository(session),
            data_scope_resolver=DataScopeResolver(AuthRepository(session)),
        )
        followup_user = _user(
            [
                "followup:template:view",
                "followup:template:edit",
                "followup:plan:view",
                "followup:plan:edit",
                "followup:plan:view_all",
            ]
        )
        await followup_service.generate_plan_from_purchase_contract(
            current_user=followup_user,
            purchase_contract_id=contract_id,
            as_of=date(2026, 8, 5),
        )
        service = _make_service(session)

        inspection = await service.create_inspection(
            current_user=_quality_user(),
            payload=QualityInspectionCreate(
                code="QC-SVC-PASS",
                purchase_contract_id=contract_id,
                inspected_at=date(2026, 8, 19),
                result="passed",
                inspector_id="u-qc-001",
                inspector_name="QC 张工",
                issue_summary=None,
                attachment_group_id="attach-qc-pass",
                lines=[
                    QualityInspectionLineCreate(
                        purchase_contract_line_id=line_id,
                        product_name="Eco Shopping Bag",
                        inspected_quantity="120",
                        failed_quantity="0",
                        unit="pcs",
                        result="passed",
                    )
                ],
                issues=[],
            ),
        )
        plan_row = await FollowupRepository(session).get_plan_by_contract(contract_id)
        assert plan_row is not None
        plan = await followup_service.get_plan(
            current_user=followup_user,
            plan_id=plan_row.id,
        )
        eligibility = await service.get_inbound_eligibility(
            current_user=_quality_user(),
            purchase_contract_id=contract_id,
        )

    qc_node = next(node for node in plan.nodes if node.node_code == "quality_inspection")
    assert inspection.result == "passed"
    assert qc_node.actual_date == date(2026, 8, 19)
    assert qc_node.source_record_type == "quality_inspection"
    assert qc_node.source_record_id == inspection.id
    assert eligibility.eligible is True
    assert eligibility.reason == "QC 已通过"


async def test_quality_inspection_service_requires_edit_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)

        with pytest.raises(PermissionDeniedError):
            await service.list_inspections(
                current_user=_user(["quality:inspection:edit"]),
                q=None,
                result=None,
                supplier_id=None,
                purchase_contract_id=None,
                assignee_user_id=None,
            )


async def test_quality_inspection_service_scopes_qc_user_to_assigned_records(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id, line_id = await _create_approved_contract(
            purchase_repository,
            code="PC-QC-ASSIGNEE-SVC",
            qc_user_id="u-qc-001",
            qc_user_name="QC 张工",
        )
        service = _make_service(session)
        assigned_user = _user(
            ["quality:inspection:view", "quality:inspection:edit"],
            user_id="u-qc-001",
        )
        other_user = _user(
            ["quality:inspection:view", "quality:inspection:edit"],
            user_id="u-qc-002",
        )

        inspection = await service.create_inspection(
            current_user=assigned_user,
            payload=QualityInspectionCreate(
                code="QC-SVC-ASSIGNED",
                purchase_contract_id=contract_id,
                inspected_at=date(2026, 8, 19),
                result="passed",
                inspector_id="u-worker-001",
                inspector_name="现场查验员",
                issue_summary=None,
                attachment_group_id="attach-qc-assignee",
                lines=[
                    QualityInspectionLineCreate(
                        purchase_contract_line_id=line_id,
                        product_name="Eco Shopping Bag",
                        inspected_quantity="120",
                        failed_quantity="0",
                        unit="pcs",
                        result="passed",
                    )
                ],
                issues=[],
            ),
        )
        assigned_list = await service.list_inspections(
            current_user=assigned_user,
            q="QC-SVC-ASSIGNED",
            result=None,
            supplier_id=None,
            purchase_contract_id=None,
            assignee_user_id=None,
        )
        other_list = await service.list_inspections(
            current_user=other_user,
            q="QC-SVC-ASSIGNED",
            result=None,
            supplier_id=None,
            purchase_contract_id=None,
            assignee_user_id=None,
        )
        manager_filtered = await service.list_inspections(
            current_user=_quality_user(),
            q="QC-SVC-ASSIGNED",
            result=None,
            supplier_id=None,
            purchase_contract_id=None,
            assignee_user_id="u-qc-001",
        )
        detail = await service.get_inspection(
            current_user=assigned_user,
            inspection_id=inspection.id,
        )
        with pytest.raises(QualityInspectionNotFoundError):
            await service.get_inspection(
                current_user=other_user,
                inspection_id=inspection.id,
            )

    assert inspection.qc_user_id == "u-qc-001"
    assert inspection.qc_user_name == "QC 张工"
    assert assigned_list.total == 1
    assert other_list.total == 0
    assert manager_filtered.total == 1
    assert detail.id == inspection.id


async def test_quality_inspection_service_preserves_owner_scope_and_my_assignee_filter(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        owner_contract_id, owner_line_id = await _create_approved_contract(
            purchase_repository,
            code="PC-QC-OWNER-SCOPE",
            owner_user_id="u-qc-001",
        )
        assigned_contract_id, assigned_line_id = await _create_approved_contract(
            purchase_repository,
            code="PC-QC-MY-SCOPE",
            qc_user_id="u-qc-001",
            qc_user_name="QC 张工",
            owner_user_id="u-other-owner",
        )
        service = _make_service(session)
        current_user = _user(
            ["quality:inspection:view", "quality:inspection:edit"],
            user_id="u-qc-001",
        )

        owner_scope_inspection = await service.create_inspection(
            current_user=current_user,
            payload=QualityInspectionCreate(
                code="QC-SVC-OWNER-SCOPE",
                purchase_contract_id=owner_contract_id,
                inspected_at=date(2026, 8, 19),
                result="passed",
                inspector_id="u-worker-001",
                inspector_name="现场查验员",
                issue_summary=None,
                attachment_group_id=None,
                lines=[
                    QualityInspectionLineCreate(
                        purchase_contract_line_id=owner_line_id,
                        product_name="Eco Shopping Bag",
                        inspected_quantity="120",
                        failed_quantity="0",
                        unit="pcs",
                        result="passed",
                    )
                ],
                issues=[],
            ),
        )
        assigned_inspection = await service.create_inspection(
            current_user=current_user,
            payload=QualityInspectionCreate(
                code="QC-SVC-MY-SCOPE",
                purchase_contract_id=assigned_contract_id,
                inspected_at=date(2026, 8, 20),
                result="passed",
                inspector_id="u-worker-001",
                inspector_name="现场查验员",
                issue_summary=None,
                attachment_group_id=None,
                lines=[
                    QualityInspectionLineCreate(
                        purchase_contract_line_id=assigned_line_id,
                        product_name="Eco Shopping Bag",
                        inspected_quantity="80",
                        failed_quantity="0",
                        unit="pcs",
                        result="passed",
                    )
                ],
                issues=[],
            ),
        )
        all_visible = await service.list_inspections(
            current_user=current_user,
            q="SCOPE",
            result=None,
            supplier_id=None,
            purchase_contract_id=None,
            assignee_user_id=None,
        )
        my_assigned = await service.list_inspections(
            current_user=current_user,
            q="SCOPE",
            result=None,
            supplier_id=None,
            purchase_contract_id=None,
            assignee_user_id="u-qc-001",
        )
        owner_detail = await service.get_inspection(
            current_user=current_user,
            inspection_id=owner_scope_inspection.id,
        )
        assigned_detail = await service.get_inspection(
            current_user=current_user,
            inspection_id=assigned_inspection.id,
        )

    assert {item.id for item in all_visible.items} == {
        owner_scope_inspection.id,
        assigned_inspection.id,
    }
    assert [item.id for item in my_assigned.items] == [assigned_inspection.id]
    assert owner_detail.id == owner_scope_inspection.id
    assert assigned_detail.id == assigned_inspection.id
