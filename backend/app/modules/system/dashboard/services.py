from datetime import UTC, datetime, time

from app.db.uow import UnitOfWork
from app.modules.system.auth.schemas import AssignableUserResponse, CurrentUserResponse
from app.modules.system.dashboard.business_task_repositories import (
    ApprovalTodoRow,
    DashboardBusinessTaskRepository,
    FollowupTodoRow,
    InboundApprovalTodoRow,
    QualityTodoRow,
)
from app.modules.system.dashboard.repositories import (
    AnnouncementRow,
    DashboardRepository,
    NotificationRow,
    ScheduleEventRow,
    ShortcutRow,
    TodoAssigneeRow,
    TodoTaskRow,
)
from app.modules.system.dashboard.schemas import (
    AnnouncementCreate,
    AnnouncementResponse,
    DashboardResponse,
    DashboardSummary,
    NotificationResponse,
    ScheduleCreate,
    ScheduleEventResponse,
    ShortcutCreate,
    ShortcutResponse,
    TodoCreate,
    TodoCreateResponse,
    TodoTaskResponse,
)


class TodoAssigneeNotFoundError(Exception):
    pass


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository,
        business_task_repository: DashboardBusinessTaskRepository,
    ) -> None:
        self._repository = repository
        self._business_task_repository = business_task_repository

    async def get_dashboard(self, *, user_id: str) -> DashboardResponse:
        announcements = await self._repository.list_announcements()
        todos = await self._repository.list_todos(user_id=user_id)
        quality_todos = await self._business_task_repository.list_active_quality_todos(user_id)
        followup_todos = await self._business_task_repository.list_active_followup_todos(user_id)
        inbound_approval_todos = (
            await self._business_task_repository.list_inbound_approval_todos(user_id)
        )
        approval_todos = await self._business_task_repository.list_approval_todos(user_id)
        notifications = await self._repository.list_notifications(user_id=user_id)
        schedule_events = await self._repository.list_schedule_events(user_id=user_id)
        shortcuts = await self._repository.list_shortcuts(user_id=user_id)
        todo_responses = [self._todo_response(row) for row in todos]
        todo_responses.extend(self._quality_todo_response(row) for row in quality_todos)
        todo_responses.extend(self._followup_todo_response(row) for row in followup_todos)
        todo_responses.extend(
            self._inbound_approval_todo_response(row) for row in inbound_approval_todos
        )
        todo_responses.extend(self._approval_todo_response(row) for row in approval_todos)
        todo_responses.sort(
            key=lambda item: (
                item.due_at is None,
                item.due_at.isoformat() if item.due_at is not None else "",
                item.id,
            )
        )

        return DashboardResponse(
            announcements=[self._announcement_response(row) for row in announcements],
            todos=todo_responses,
            notifications=[self._notification_response(row) for row in notifications],
            schedule_events=[self._schedule_response(row) for row in schedule_events],
            shortcuts=[self._shortcut_response(row) for row in shortcuts],
            summary=DashboardSummary(
                announcement_count=len(announcements),
                todo_count=len(todo_responses),
                unread_notification_count=len([item for item in notifications if not item.is_read]),
                today_schedule_count=len(schedule_events),
                shortcut_count=len(shortcuts),
            ),
        )

    async def create_schedule_event(
        self,
        *,
        user_id: str,
        payload: ScheduleCreate,
    ) -> ScheduleEventResponse:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.create_schedule_event(
                user_id=user_id,
                title=payload.title,
                description=payload.description,
                starts_at=payload.starts_at,
                ends_at=payload.ends_at,
                created_at=datetime.now(UTC),
            )
        return self._schedule_response(row)

    async def delete_schedule_event(
        self,
        *,
        user_id: str,
        schedule_id: str,
    ) -> ScheduleEventResponse | None:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.delete_schedule_event(
                user_id=user_id,
                schedule_id=schedule_id,
            )
        return self._schedule_response(row) if row else None

    async def create_announcement(self, *, payload: AnnouncementCreate) -> AnnouncementResponse:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.create_announcement(
                title=payload.title,
                content=payload.content,
                published_at=datetime.now(UTC),
            )
        return self._announcement_response(row)

    async def create_todo_tasks(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: TodoCreate,
        assignees: list[AssignableUserResponse],
    ) -> TodoCreateResponse:
        assignees_by_id = {assignee.id: assignee for assignee in assignees}
        missing_assignees = [
            user_id for user_id in payload.assignee_user_ids if user_id not in assignees_by_id
        ]
        if missing_assignees:
            raise TodoAssigneeNotFoundError

        ordered_assignees = [
            TodoAssigneeRow(
                user_id=assignees_by_id[user_id].id,
                display_name=assignees_by_id[user_id].display_name,
            )
            for user_id in payload.assignee_user_ids
        ]
        async with UnitOfWork(self._repository.session):
            rows = await self._repository.create_todo_tasks(
                title=payload.title.strip(),
                content=payload.content.strip(),
                creator_user_id=current_user.id,
                creator_user_name=current_user.display_name,
                assignees=ordered_assignees,
            )
        return TodoCreateResponse(items=[self._todo_response(row) for row in rows])

    async def mark_notification_read(
        self,
        *,
        user_id: str,
        notification_id: str,
    ) -> NotificationResponse | None:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.mark_notification_read(
                user_id=user_id,
                notification_id=notification_id,
            )
        return self._notification_response(row) if row else None

    async def create_shortcut(
        self,
        *,
        user_id: str,
        payload: ShortcutCreate,
    ) -> ShortcutResponse:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.create_shortcut(
                user_id=user_id,
                label=payload.label,
                target_path=payload.target_path,
                icon=payload.icon,
                sort_order=payload.sort_order,
            )
        return self._shortcut_response(row)

    async def delete_shortcut(
        self,
        *,
        user_id: str,
        shortcut_id: str,
    ) -> ShortcutResponse | None:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.delete_shortcut(
                user_id=user_id,
                shortcut_id=shortcut_id,
            )
        return self._shortcut_response(row) if row else None

    def _announcement_response(self, row: AnnouncementRow) -> AnnouncementResponse:
        return AnnouncementResponse(
            id=row.id,
            title=row.title,
            content=row.content,
            published_at=row.published_at,
        )

    def _todo_response(self, row: TodoTaskRow) -> TodoTaskResponse:
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            owner_user_name=row.owner_user_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=row.creator_user_name,
            title=row.title,
            content=row.content,
            source_type=row.source_type,
            source_id=row.source_id,
            due_at=row.due_at,
            status=row.status,
            assignment_type=(
                "self"
                if row.source_type == "manual" and row.creator_user_id == row.owner_user_id
                else "assigned"
            ),
        )

    def _quality_todo_response(self, row: QualityTodoRow) -> TodoTaskResponse:
        content_parts = [row.purchase_contract_no, row.supplier_name]
        if row.issue_summary:
            content_parts.append(row.issue_summary)
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.inspector_id,
            owner_user_name=row.inspector_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=None,
            title=f"QC 查验 {row.code}",
            content=" / ".join(content_parts),
            source_type="quality_inspection",
            source_id=row.id,
            due_at=row.scheduled_at,
            status=row.status,
            assignment_type="assigned",
        )

    def _followup_todo_response(self, row: FollowupTodoRow) -> TodoTaskResponse:
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            owner_user_name=None,
            creator_user_id=None,
            creator_user_name=None,
            title=f"采购跟单 {row.purchase_contract_no} · {row.node_name}",
            content=row.supplier_name,
            source_type="followup_plan",
            source_id=row.follow_plan_id,
            due_at=datetime.combine(row.planned_date, time(hour=9)),
            status=row.status,
            assignment_type="assigned",
        )

    def _inbound_approval_todo_response(
        self,
        row: InboundApprovalTodoRow,
    ) -> TodoTaskResponse:
        due_at = (
            datetime.combine(row.submitted_at, time(hour=9))
            if row.submitted_at is not None
            else None
        )
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.reviewer_id,
            owner_user_name=row.reviewer_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=None,
            title=f"入库审批 {row.code}",
            content=" / ".join(
                [row.purchase_contract_no, row.supplier_name, row.warehouse_name]
            ),
            source_type="warehouse_inbound_approval",
            source_id=row.id,
            due_at=due_at,
            status="pending",
            assignment_type="assigned",
        )

    def _approval_todo_response(self, row: ApprovalTodoRow) -> TodoTaskResponse:
        title_by_type = {
            "sample_delivery_approval": "寄样审批",
            "sales_quotation_approval": "报价审批",
            "sales_contract_approval": "出口合同审批",
            "purchase_contract_approval": "采购合同审批",
            "sales_shipment_approval": "出货审批",
            "warehouse_outbound_approval": "出库审批",
            "finance_payment_approval": "付款审批",
            "finance_fee_payment_approval": "付费审批",
            "finance_reimbursement_approval": "报销审批",
        }
        content = [row.content_primary]
        if row.content_secondary:
            content.append(row.content_secondary)
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.reviewer_id,
            owner_user_name=row.reviewer_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=None,
            title=f"{title_by_type[row.source_type]} {row.code}",
            content=" / ".join(content),
            source_type=row.source_type,
            source_id=row.source_id,
            due_at=None,
            status="pending",
            assignment_type="assigned",
        )

    def _notification_response(self, row: NotificationRow) -> NotificationResponse:
        return NotificationResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            message=row.message,
            severity=row.severity,
            is_read=row.is_read,
            created_at=row.created_at,
        )

    def _schedule_response(self, row: ScheduleEventRow) -> ScheduleEventResponse:
        return ScheduleEventResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            description=row.description,
            starts_at=row.starts_at,
            ends_at=row.ends_at,
            created_at=row.created_at,
        )

    def _shortcut_response(self, row: ShortcutRow) -> ShortcutResponse:
        return ShortcutResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            label=row.label,
            target_path=row.target_path,
            icon=row.icon,
            sort_order=row.sort_order,
        )
