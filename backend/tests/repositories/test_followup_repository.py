from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.repositories import (
    FollowupRepository,
    PurchaseFollowPlanRow,
)


async def test_followup_repository_records_template_plan_nodes_and_overdue(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = FollowupRepository(session)
        template = await repository.create_template(
            name="标准采购跟单流程",
            enabled=True,
            is_default=True,
            owner_user_id="u-001",
        )
        await repository.add_template_node(
            template_id=template.id,
            node_code="contract_confirmed",
            node_name="合同下单确立",
            sequence_no=10,
            standard_days=0,
            remind_before_days=0,
            actual_date_source="purchase_contract",
        )
        await repository.add_template_node(
            template_id=template.id,
            node_code="confirm_sample_submitted",
            node_name="确认样提交",
            sequence_no=20,
            standard_days=3,
            remind_before_days=1,
            actual_date_source="sample_confirm",
        )
        plan = await repository.create_plan(
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-FUP-001",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            template_id=template.id,
            base_date=date(2026, 8, 5),
            owner_user_id="u-001",
        )
        await repository.add_plan_node(
            follow_plan_id=plan.id,
            node_code="contract_confirmed",
            node_name="合同下单确立",
            sequence_no=10,
            planned_date=date(2026, 8, 5),
            remind_date=date(2026, 8, 5),
            actual_date=date(2026, 8, 5),
            status="completed",
            source_record_type="purchase_contract",
            source_record_id="pc-001",
            source_summary="采购合同审批通过",
        )
        confirm_node = await repository.add_plan_node(
            follow_plan_id=plan.id,
            node_code="confirm_sample_submitted",
            node_name="确认样提交",
            sequence_no=20,
            planned_date=date(2026, 8, 8),
            remind_date=date(2026, 8, 7),
            actual_date=None,
            status="pending",
            source_record_type=None,
            source_record_id=None,
            source_summary=None,
        )
        await repository.complete_node(
            node_id=confirm_node.id,
            actual_date=date(2026, 8, 9),
            source_record_type="sample_followup_event",
            source_record_id="sample-event-001",
            source_summary="确认样提交",
        )
        await repository.refresh_plan_status(plan.id)
        await session.commit()

        plans, total = await repository.list_plans(
            q="PC-FUP",
            overall_status=None,
            supplier_id="supplier-pack-a",
            purchase_contract_id=None,
            owner_user_ids=None,
        )
        nodes = await repository.list_plan_nodes(plan.id)

    assert total == 1
    assert isinstance(plans[0], PurchaseFollowPlanRow)
    assert plans[0].overall_status == "completed"
    assert [node.node_code for node in nodes] == [
        "contract_confirmed",
        "confirm_sample_submitted",
    ]
    assert nodes[1].actual_date == date(2026, 8, 9)
    assert nodes[1].source_record_type == "sample_followup_event"


async def test_followup_repository_marks_overdue_nodes(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = FollowupRepository(session)
        template = await repository.create_template(
            name="标准采购跟单流程",
            enabled=True,
            is_default=True,
            owner_user_id="u-001",
        )
        plan = await repository.create_plan(
            purchase_contract_id="pc-overdue",
            purchase_contract_no="PC-FUP-OD",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            template_id=template.id,
            base_date=date(2026, 8, 5),
            owner_user_id="u-001",
        )
        await repository.add_plan_node(
            follow_plan_id=plan.id,
            node_code="bulk_sample_submitted",
            node_name="大货样提交",
            sequence_no=30,
            planned_date=date(2026, 8, 12),
            remind_date=date(2026, 8, 10),
            actual_date=None,
            status="pending",
            source_record_type=None,
            source_record_id=None,
            source_summary=None,
        )
        await repository.mark_overdue_nodes(as_of=date(2026, 8, 18))
        refreshed = await repository.refresh_plan_status(plan.id)
        overdue = await repository.list_overdue_nodes(
            as_of=date(2026, 8, 18),
            owner_user_ids=None,
        )
        await session.commit()

    assert refreshed is not None
    assert refreshed.overall_status == "overdue"
    assert len(overdue) == 1
    assert overdue[0].overdue_days == 6
