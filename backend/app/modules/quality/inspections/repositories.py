from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, false, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.quality.inspections.models import (
    QualityInspection,
    QualityInspectionLine,
    QualityIssue,
)


@dataclass(frozen=True)
class QualityInspectionRow:
    id: str
    code: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    inspected_at: date
    result: str
    inspector_id: str | None
    inspector_name: str
    qc_user_id: str | None
    qc_user_name: str | None
    issue_summary: str | None
    attachment_group_id: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class QualityInspectionLineRow:
    id: str
    inspection_id: str
    purchase_contract_line_id: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    inspected_quantity: str
    failed_quantity: str
    unit: str
    result: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class QualityIssueRow:
    id: str
    inspection_id: str
    line_id: str | None
    issue_type: str
    severity: str
    description: str
    corrective_action: str | None
    status: str
    attachment_group_id: str | None
    created_at: datetime


class QualityInspectionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_inspection(
        self,
        *,
        code: str,
        purchase_contract_id: str,
        purchase_contract_no: str,
        supplier_id: str | None,
        supplier_name: str,
        inspected_at: date,
        result: str,
        inspector_id: str | None,
        inspector_name: str,
        issue_summary: str | None,
        attachment_group_id: str | None,
        owner_user_id: str,
        qc_user_id: str | None = None,
        qc_user_name: str | None = None,
    ) -> QualityInspectionRow:
        inspection = QualityInspection(
            code=code,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            inspected_at=inspected_at,
            result=result,
            inspector_id=inspector_id,
            inspector_name=inspector_name,
            qc_user_id=qc_user_id,
            qc_user_name=qc_user_name,
            issue_summary=issue_summary,
            attachment_group_id=attachment_group_id,
            owner_user_id=owner_user_id,
        )
        self.session.add(inspection)
        await self.session.flush()
        return self._map_inspection(inspection)

    async def update_inspection(
        self,
        *,
        inspection_id: str,
        code: str,
        inspected_at: date,
        result: str,
        inspector_id: str | None,
        inspector_name: str,
        issue_summary: str | None,
        attachment_group_id: str | None,
        qc_user_id: str | None = None,
        qc_user_name: str | None = None,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.get(QualityInspection, inspection_id)
        if inspection is None:
            return None
        inspection.code = code
        inspection.inspected_at = inspected_at
        inspection.result = result
        inspection.inspector_id = inspector_id
        inspection.inspector_name = inspector_name
        inspection.qc_user_id = qc_user_id
        inspection.qc_user_name = qc_user_name
        inspection.issue_summary = issue_summary
        inspection.attachment_group_id = attachment_group_id
        await self.session.flush()
        return self._map_inspection(inspection)

    async def add_line(
        self,
        *,
        inspection_id: str,
        purchase_contract_line_id: str | None,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        inspected_quantity: Decimal | str,
        failed_quantity: Decimal | str,
        unit: str,
        result: str,
        remark: str | None,
    ) -> QualityInspectionLineRow:
        line = QualityInspectionLine(
            inspection_id=inspection_id,
            purchase_contract_line_id=purchase_contract_line_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            inspected_quantity=Decimal(str(inspected_quantity)),
            failed_quantity=Decimal(str(failed_quantity)),
            unit=unit,
            result=result,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def add_issue(
        self,
        *,
        inspection_id: str,
        line_id: str | None,
        issue_type: str,
        severity: str,
        description: str,
        corrective_action: str | None,
        status: str,
        attachment_group_id: str | None,
    ) -> QualityIssueRow:
        issue = QualityIssue(
            inspection_id=inspection_id,
            line_id=line_id,
            issue_type=issue_type,
            severity=severity,
            description=description,
            corrective_action=corrective_action,
            status=status,
            attachment_group_id=attachment_group_id,
        )
        self.session.add(issue)
        await self.session.flush()
        return self._map_issue(issue)

    async def replace_lines_and_issues(
        self,
        inspection_id: str,
    ) -> None:
        lines = list(
            await self.session.scalars(
                select(QualityInspectionLine).where(
                    QualityInspectionLine.inspection_id == inspection_id
                )
            )
        )
        issues = list(
            await self.session.scalars(
                select(QualityIssue).where(QualityIssue.inspection_id == inspection_id)
            )
        )
        for issue in issues:
            await self.session.delete(issue)
        for line in lines:
            await self.session.delete(line)
        await self.session.flush()

    async def get_inspection(self, inspection_id: str) -> QualityInspectionRow | None:
        inspection = await self.session.get(QualityInspection, inspection_id)
        if inspection is None:
            return None
        return self._map_inspection(inspection)

    async def list_lines(self, inspection_id: str) -> list[QualityInspectionLineRow]:
        rows = await self.session.scalars(
            select(QualityInspectionLine)
            .where(QualityInspectionLine.inspection_id == inspection_id)
            .order_by(QualityInspectionLine.created_at.asc(), QualityInspectionLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_issues(self, inspection_id: str) -> list[QualityIssueRow]:
        rows = await self.session.scalars(
            select(QualityIssue)
            .where(QualityIssue.inspection_id == inspection_id)
            .order_by(QualityIssue.created_at.asc(), QualityIssue.id.asc())
        )
        return [self._map_issue(row) for row in rows]

    async def list_inspections(
        self,
        *,
        q: str | None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        visible_assignee_user_id: str | None = None,
        assignee_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[QualityInspectionRow], int]:
        statement = select(QualityInspection)
        count_statement = select(func.count()).select_from(QualityInspection)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(QualityInspectionLine.id)
                .where(QualityInspectionLine.inspection_id == QualityInspection.id)
                .where(
                    or_(
                        QualityInspectionLine.product_code.ilike(pattern),
                        QualityInspectionLine.product_name.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    QualityInspection.code.ilike(pattern),
                    QualityInspection.purchase_contract_no.ilike(pattern),
                    QualityInspection.supplier_name.ilike(pattern),
                    line_exists,
                )
            )
        if result:
            conditions.append(QualityInspection.result == result)
        if supplier_id:
            conditions.append(QualityInspection.supplier_id == supplier_id)
        if purchase_contract_id:
            conditions.append(QualityInspection.purchase_contract_id == purchase_contract_id)
        if assignee_user_id:
            conditions.append(QualityInspection.qc_user_id == assignee_user_id)
        if owner_user_ids is not None:
            visibility_conditions = []
            if owner_user_ids:
                visibility_conditions.append(QualityInspection.owner_user_id.in_(owner_user_ids))
            if visible_assignee_user_id:
                visibility_conditions.append(QualityInspection.qc_user_id == visible_assignee_user_id)
            conditions.append(or_(*visibility_conditions) if visibility_conditions else false())
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                QualityInspection.inspected_at.desc(),
                QualityInspection.code.desc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._inspection_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_inspection(row) for row in rows], int(total or 0)

    async def get_latest_for_contract(
        self,
        purchase_contract_id: str,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.scalar(
            select(QualityInspection)
            .where(QualityInspection.purchase_contract_id == purchase_contract_id)
            .order_by(QualityInspection.inspected_at.desc(), QualityInspection.created_at.desc())
        )
        if inspection is None:
            return None
        return self._map_inspection(inspection)

    async def has_passed_inspection(self, purchase_contract_id: str) -> bool:
        count = await self.session.scalar(
            select(func.count())
            .select_from(QualityInspection)
            .where(QualityInspection.purchase_contract_id == purchase_contract_id)
            .where(QualityInspection.result == "passed")
        )
        return bool(count)

    async def _inspection_scalars(
        self,
        statement: Select[tuple[QualityInspection]],
    ) -> list[QualityInspection]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_inspection(self, inspection: QualityInspection) -> QualityInspectionRow:
        return QualityInspectionRow(
            id=inspection.id,
            code=inspection.code,
            purchase_contract_id=inspection.purchase_contract_id,
            purchase_contract_no=inspection.purchase_contract_no,
            supplier_id=inspection.supplier_id,
            supplier_name=inspection.supplier_name,
            inspected_at=inspection.inspected_at,
            result=inspection.result,
            inspector_id=inspection.inspector_id,
            inspector_name=inspection.inspector_name,
            qc_user_id=inspection.qc_user_id,
            qc_user_name=inspection.qc_user_name,
            issue_summary=inspection.issue_summary,
            attachment_group_id=inspection.attachment_group_id,
            owner_user_id=inspection.owner_user_id,
            created_at=inspection.created_at,
        )

    def _map_line(self, line: QualityInspectionLine) -> QualityInspectionLineRow:
        return QualityInspectionLineRow(
            id=line.id,
            inspection_id=line.inspection_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            inspected_quantity=self._quantity(line.inspected_quantity),
            failed_quantity=self._quantity(line.failed_quantity),
            unit=line.unit,
            result=line.result,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_issue(self, issue: QualityIssue) -> QualityIssueRow:
        return QualityIssueRow(
            id=issue.id,
            inspection_id=issue.inspection_id,
            line_id=issue.line_id,
            issue_type=issue.issue_type,
            severity=issue.severity,
            description=issue.description,
            corrective_action=issue.corrective_action,
            status=issue.status,
            attachment_group_id=issue.attachment_group_id,
            created_at=issue.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
