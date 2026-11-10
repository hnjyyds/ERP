from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import cast

from sqlalchemy import Select, false, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.quality.inspections.mappers import (
    map_quality_attachment,
    map_quality_inspection,
    map_quality_inspection_event,
    map_quality_inspection_line,
    map_quality_issue,
)
from app.modules.quality.inspections.models import (
    QualityInspection,
    QualityInspectionAttachment,
    QualityInspectionEvent,
    QualityInspectionLine,
    QualityIssue,
)
from app.modules.quality.inspections.rows import (
    QualityAttachmentRow,
    QualityInspectionEventRow,
    QualityInspectionLineRow,
    QualityInspectionReminderRow,
    QualityInspectionRow,
    QualityIssueRow,
)


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
        status: str = "completed",
        scheduled_at: datetime | None = None,
        parent_inspection_id: str | None = None,
        reinspection_no: int = 0,
    ) -> QualityInspectionRow:
        inspection = QualityInspection(
            code=code,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            status=status,
            scheduled_at=scheduled_at or datetime.combine(inspected_at, time(hour=9)),
            inspected_at=inspected_at,
            result=result,
            inspector_id=inspector_id,
            inspector_name=inspector_name,
            qc_user_id=qc_user_id,
            qc_user_name=qc_user_name,
            issue_summary=issue_summary,
            attachment_group_id=attachment_group_id,
            parent_inspection_id=parent_inspection_id,
            reinspection_no=reinspection_no,
            owner_user_id=owner_user_id,
        )
        self.session.add(inspection)
        await self.session.flush()
        return map_quality_inspection(inspection)

    async def update_inspection(
        self,
        *,
        inspection_id: str,
        inspected_at: date,
        result: str,
        inspector_id: str | None,
        inspector_name: str,
        issue_summary: str | None,
        attachment_group_id: str | None,
        qc_user_id: str | None = None,
        qc_user_name: str | None = None,
        status: str = "completed",
        scheduled_at: datetime | None = None,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.get(QualityInspection, inspection_id)
        if inspection is None:
            return None
        inspection.status = status
        inspection.scheduled_at = scheduled_at or datetime.combine(inspected_at, time(hour=9))
        inspection.inspected_at = inspected_at
        inspection.result = result
        inspection.inspector_id = inspector_id
        inspection.inspector_name = inspector_name
        inspection.qc_user_id = qc_user_id
        inspection.qc_user_name = qc_user_name
        inspection.issue_summary = issue_summary
        inspection.attachment_group_id = attachment_group_id
        inspection.updated_at = datetime.now(UTC)
        await self.session.flush()
        return map_quality_inspection(inspection)

    async def reschedule_inspection(
        self,
        *,
        inspection_id: str,
        scheduled_at: datetime,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.get(QualityInspection, inspection_id)
        if inspection is None:
            return None
        inspection.scheduled_at = scheduled_at
        inspection.updated_at = datetime.now(UTC)
        await self.session.flush()
        return map_quality_inspection(inspection)

    async def cancel_inspection(
        self,
        *,
        inspection_id: str,
        reason: str,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.get(QualityInspection, inspection_id)
        if inspection is None:
            return None
        inspection.status = "cancelled"
        inspection.cancel_reason = reason
        inspection.updated_at = datetime.now(UTC)
        await self.session.flush()
        return map_quality_inspection(inspection)

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
        return map_quality_inspection_line(line)

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
        return map_quality_issue(issue)

    async def get_issue(self, issue_id: str) -> QualityIssueRow | None:
        issue = await self.session.get(QualityIssue, issue_id)
        return map_quality_issue(issue) if issue is not None else None

    async def resolve_issue(
        self,
        *,
        issue_id: str,
        resolution_note: str,
        resolved_by_id: str,
        resolved_by_name: str,
    ) -> QualityIssueRow | None:
        issue = await self.session.get(QualityIssue, issue_id)
        if issue is None:
            return None
        issue.status = "resolved"
        issue.resolution_note = resolution_note
        issue.resolved_at = datetime.now(UTC)
        issue.resolved_by_id = resolved_by_id
        issue.resolved_by_name = resolved_by_name
        await self.session.flush()
        return map_quality_issue(issue)

    async def add_attachment(
        self,
        *,
        inspection_id: str,
        issue_id: str | None,
        category: str,
        filename: str,
        url: str,
        uploaded_by_id: str,
        uploaded_by_name: str,
    ) -> QualityAttachmentRow:
        attachment = QualityInspectionAttachment(
            inspection_id=inspection_id,
            issue_id=issue_id,
            category=category,
            filename=filename,
            url=url,
            uploaded_by_id=uploaded_by_id,
            uploaded_by_name=uploaded_by_name,
        )
        self.session.add(attachment)
        await self.session.flush()
        return map_quality_attachment(attachment)

    async def list_attachments(self, inspection_id: str) -> list[QualityAttachmentRow]:
        return await self.list_attachments_for_inspections([inspection_id])

    async def list_attachments_for_inspections(
        self,
        inspection_ids: list[str],
    ) -> list[QualityAttachmentRow]:
        if not inspection_ids:
            return []
        rows = await self.session.scalars(
            select(QualityInspectionAttachment)
            .where(QualityInspectionAttachment.inspection_id.in_(inspection_ids))
            .order_by(
                QualityInspectionAttachment.inspection_id.asc(),
                QualityInspectionAttachment.created_at.asc(),
                QualityInspectionAttachment.id.asc(),
            )
        )
        return [map_quality_attachment(row) for row in rows]

    async def add_event(
        self,
        *,
        inspection_id: str,
        event_type: str,
        from_status: str | None,
        to_status: str | None,
        notes: str | None,
        actor_user_id: str,
        actor_user_name: str,
    ) -> QualityInspectionEventRow:
        event = QualityInspectionEvent(
            inspection_id=inspection_id,
            event_type=event_type,
            from_status=from_status,
            to_status=to_status,
            notes=notes,
            actor_user_id=actor_user_id,
            actor_user_name=actor_user_name,
        )
        self.session.add(event)
        await self.session.flush()
        return map_quality_inspection_event(event)

    async def list_events(self, inspection_id: str) -> list[QualityInspectionEventRow]:
        return await self.list_events_for_inspections([inspection_id])

    async def list_events_for_inspections(
        self,
        inspection_ids: list[str],
    ) -> list[QualityInspectionEventRow]:
        if not inspection_ids:
            return []
        rows = await self.session.scalars(
            select(QualityInspectionEvent)
            .where(QualityInspectionEvent.inspection_id.in_(inspection_ids))
            .order_by(
                QualityInspectionEvent.inspection_id.asc(),
                QualityInspectionEvent.created_at.asc(),
                QualityInspectionEvent.id.asc(),
            )
        )
        return [map_quality_inspection_event(row) for row in rows]

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
        return map_quality_inspection(inspection)

    async def list_lines(self, inspection_id: str) -> list[QualityInspectionLineRow]:
        return await self.list_lines_for_inspections([inspection_id])

    async def list_lines_for_inspections(
        self,
        inspection_ids: list[str],
    ) -> list[QualityInspectionLineRow]:
        if not inspection_ids:
            return []
        rows = await self.session.scalars(
            select(QualityInspectionLine)
            .where(QualityInspectionLine.inspection_id.in_(inspection_ids))
            .order_by(
                QualityInspectionLine.inspection_id.asc(),
                QualityInspectionLine.created_at.asc(),
                QualityInspectionLine.id.asc(),
            )
        )
        return [map_quality_inspection_line(row) for row in rows]

    async def list_issues(self, inspection_id: str) -> list[QualityIssueRow]:
        return await self.list_issues_for_inspections([inspection_id])

    async def list_issues_for_inspections(
        self,
        inspection_ids: list[str],
    ) -> list[QualityIssueRow]:
        if not inspection_ids:
            return []
        rows = await self.session.scalars(
            select(QualityIssue)
            .where(QualityIssue.inspection_id.in_(inspection_ids))
            .order_by(
                QualityIssue.inspection_id.asc(),
                QualityIssue.created_at.asc(),
                QualityIssue.id.asc(),
            )
        )
        return [map_quality_issue(row) for row in rows]

    async def list_inspections(
        self,
        *,
        q: str | None,
        status: str | None = None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        visible_assignee_user_id: str | None = None,
        assignee_user_id: str | None = None,
        inspector_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[QualityInspectionRow], int]:
        conditions = self._inspection_conditions(
            q=q,
            status=status,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
            visible_assignee_user_id=visible_assignee_user_id,
            assignee_user_id=assignee_user_id,
            inspector_user_id=inspector_user_id,
        )
        statement = select(QualityInspection)
        count_statement = select(func.count()).select_from(QualityInspection)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                QualityInspection.inspected_at.desc(),
                QualityInspection.code.desc(),
            )
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._inspection_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [map_quality_inspection(row) for row in rows], int(total or 0)

    async def summarize_inspections(
        self,
        *,
        q: str | None,
        status: str | None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        visible_assignee_user_id: str | None,
        assignee_user_id: str | None,
        inspector_user_id: str | None,
        current_user_id: str,
        now: datetime,
    ) -> tuple[dict[str, int], int, int, int]:
        """同一筛选条件下的状态分布、逾期数、未关闭问题数与待我处理数，不受分页影响。"""
        conditions = self._inspection_conditions(
            q=q,
            status=status,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
            visible_assignee_user_id=visible_assignee_user_id,
            assignee_user_id=assignee_user_id,
            inspector_user_id=inspector_user_id,
        )
        status_statement = (
            select(QualityInspection.status, func.count())
            .select_from(QualityInspection)
            .group_by(QualityInspection.status)
        )
        overdue_statement = (
            select(func.count())
            .select_from(QualityInspection)
            .where(QualityInspection.scheduled_at.is_not(None))
            .where(QualityInspection.scheduled_at < now)
            .where(QualityInspection.status.notin_(("completed", "cancelled")))
        )
        issue_statement = (
            select(func.count(QualityIssue.id))
            .select_from(QualityInspection)
            .join(QualityIssue, QualityIssue.inspection_id == QualityInspection.id)
            .where(QualityIssue.status != "resolved")
        )
        my_action_statement = (
            select(func.count())
            .select_from(QualityInspection)
            .where(QualityInspection.inspector_id == current_user_id)
            .where(QualityInspection.status.in_(("pending", "in_progress")))
        )
        for condition in conditions:
            status_statement = status_statement.where(condition)
            overdue_statement = overdue_statement.where(condition)
            issue_statement = issue_statement.where(condition)
            my_action_statement = my_action_statement.where(condition)
        status_rows = (await self.session.execute(status_statement)).all()
        overdue_count = await self.session.scalar(overdue_statement)
        open_issue_count = await self.session.scalar(issue_statement)
        my_action_count = await self.session.scalar(my_action_statement)
        status_counts = {str(row[0]): int(row[1]) for row in status_rows}
        return (
            status_counts,
            int(overdue_count or 0),
            int(open_issue_count or 0),
            int(my_action_count or 0),
        )

    def _inspection_conditions(
        self,
        *,
        q: str | None,
        status: str | None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        visible_assignee_user_id: str | None,
        assignee_user_id: str | None,
        inspector_user_id: str | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []
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
                .correlate(QualityInspection)
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
        if status:
            conditions.append(QualityInspection.status == status)
        if supplier_id:
            conditions.append(QualityInspection.supplier_id == supplier_id)
        if purchase_contract_id:
            conditions.append(QualityInspection.purchase_contract_id == purchase_contract_id)
        if assignee_user_id:
            conditions.append(QualityInspection.qc_user_id == assignee_user_id)
        if inspector_user_id:
            conditions.append(QualityInspection.inspector_id == inspector_user_id)
        if owner_user_ids is not None:
            visibility_conditions: list[ColumnElement[bool]] = []
            if owner_user_ids:
                visibility_conditions.append(QualityInspection.owner_user_id.in_(owner_user_ids))
            if visible_assignee_user_id:
                visibility_conditions.append(
                    or_(
                        QualityInspection.inspector_id == visible_assignee_user_id,
                        QualityInspection.qc_user_id == visible_assignee_user_id,
                    )
                )
            conditions.append(or_(*visibility_conditions) if visibility_conditions else false())
        return conditions

    async def get_latest_for_contract(
        self,
        purchase_contract_id: str,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.scalar(
            select(QualityInspection)
            .where(QualityInspection.purchase_contract_id == purchase_contract_id)
            .order_by(QualityInspection.created_at.desc(), QualityInspection.id.desc())
        )
        if inspection is None:
            return None
        return map_quality_inspection(inspection)

    async def get_active_reinspection(
        self,
        parent_inspection_id: str,
    ) -> QualityInspectionRow | None:
        inspection = await self.session.scalar(
            select(QualityInspection)
            .where(QualityInspection.parent_inspection_id == parent_inspection_id)
            .where(QualityInspection.status.in_(("pending", "in_progress")))
            .order_by(QualityInspection.created_at.desc())
        )
        return map_quality_inspection(inspection) if inspection is not None else None

    async def list_scheduled_reminders(
        self,
        *,
        window_end: datetime,
    ) -> list[QualityInspectionReminderRow]:
        """返回排期在窗口截止前的未完成任务，供每日提醒扫描使用。"""
        rows = await self.session.scalars(
            select(QualityInspection)
            .where(QualityInspection.status.in_(("pending", "in_progress")))
            .where(QualityInspection.scheduled_at.is_not(None))
            .where(QualityInspection.scheduled_at < window_end)
            .order_by(QualityInspection.scheduled_at.asc(), QualityInspection.code.asc())
        )
        return [
            QualityInspectionReminderRow(
                id=row.id,
                code=row.code,
                purchase_contract_no=row.purchase_contract_no,
                supplier_name=row.supplier_name,
                status=row.status,
                scheduled_at=cast(datetime, row.scheduled_at),
                inspector_id=row.inspector_id,
                qc_user_id=row.qc_user_id,
                owner_user_id=row.owner_user_id,
            )
            for row in rows
        ]

    async def has_passed_inspection(self, purchase_contract_id: str) -> bool:
        count = await self.session.scalar(
            select(func.count())
            .select_from(QualityInspection)
            .where(QualityInspection.purchase_contract_id == purchase_contract_id)
            .where(QualityInspection.status == "completed")
            .where(QualityInspection.result == "passed")
        )
        return bool(count)

    async def _inspection_scalars(
        self,
        statement: Select[tuple[QualityInspection]],
    ) -> list[QualityInspection]:
        result = await self.session.scalars(statement)
        return list(result.unique())
