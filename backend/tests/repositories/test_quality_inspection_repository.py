from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.quality.inspections.repositories import (
    QualityInspectionRepository,
    QualityInspectionRow,
)


async def test_quality_inspection_repository_records_lines_issues_and_latest_result(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = QualityInspectionRepository(session)
        failed = await repository.create_inspection(
            code="QC-REPO-001",
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-001",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            inspected_at=date(2026, 8, 19),
            result="failed",
            inspector_id="u-qc-001",
            inspector_name="QC 张工",
            issue_summary="外箱破损",
            attachment_group_id="attach-qc-001",
            owner_user_id="u-001",
        )
        line = await repository.add_line(
            inspection_id=failed.id,
            purchase_contract_line_id="pcl-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            inspected_quantity="120",
            failed_quantity="6",
            unit="pcs",
            result="failed",
            remark="抽检 6 件不合格",
        )
        await repository.add_issue(
            inspection_id=failed.id,
            line_id=line.id,
            issue_type="包装破损",
            severity="major",
            description="外箱 6 件破损",
            corrective_action="供应商重新包装后复检",
            status="open",
            attachment_group_id="attach-qc-issue-001",
        )
        passed = await repository.create_inspection(
            code="QC-REPO-002",
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-001",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            inspected_at=date(2026, 8, 21),
            result="passed",
            inspector_id="u-qc-001",
            inspector_name="QC 张工",
            issue_summary=None,
            attachment_group_id=None,
            owner_user_id="u-001",
        )
        await session.commit()

        inspections, total = await repository.list_inspections(
            q="PC-001",
            result=None,
            supplier_id="supplier-pack-a",
            purchase_contract_id=None,
            owner_user_id=None,
        )
        lines = await repository.list_lines(failed.id)
        issues = await repository.list_issues(failed.id)
        latest = await repository.get_latest_for_contract("pc-001")
        has_passed = await repository.has_passed_inspection("pc-001")

    assert total == 2
    assert isinstance(inspections[0], QualityInspectionRow)
    assert inspections[0].id == passed.id
    assert lines[0].failed_quantity == "6"
    assert issues[0].attachment_group_id == "attach-qc-issue-001"
    assert latest is not None
    assert latest.result == "passed"
    assert has_passed is True
