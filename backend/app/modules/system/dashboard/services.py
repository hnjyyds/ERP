from datetime import UTC, datetime, time

from app.db.uow import UnitOfWork
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
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
    NotificationListResponse,
    NotificationReadAllResponse,
    NotificationResponse,
    ScheduleCreate,
    ScheduleEventResponse,
    ScheduleUpdate,
    ShortcutCreate,
    ShortcutResponse,
    TodoCreate,
    TodoCreateResponse,
    TodoTaskResponse,
    TodoUpdate,
)


class TodoAssigneeNotFoundError(Exception):
    pass


class TodoNotFoundError(Exception):
    pass


class TodoPermissionDeniedError(Exception):
    pass


class TodoStateError(Exception):
    pass


class ScheduleTimeRangeError(Exception):
    pass


def _as_utc(value: datetime) -> datetime:
    """SQLite 读回的时间可能丢失时区，按 UTC 处理后再比较。"""
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def _to_utc_naive(value: datetime) -> datetime:
    """写入前统一转成 UTC 墙钟时间，避免 SQLite 丢时区后语义漂移。"""
    return value.astimezone(UTC).replace(tzinfo=None) if value.tzinfo else value


def _is_overdue(due_at: datetime | None, *, status: str | None = None) -> bool:
    if due_at is None:
        return False
    if status is not None and status != "pending":
        return False
    return _as_utc(due_at) < datetime.now(UTC)


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository,
        business_task_repository: DashboardBusinessTaskRepository,
    ) -> None:
        self._repository = repository
        self._business_task_repository = business_task_repository

    async def get_dashboard(self, *, current_user: CurrentUserResponse) -> DashboardResponse:
        user_id = current_user.id
        business_assignee_user_id = (
            None if SUPER_ADMIN_PERMISSION in current_user.permissions else user_id
        )
        fallback_business_assignee = current_user if business_assignee_user_id is None else None
        announcements = await self._repository.list_announcements()
        todos = await self._repository.list_todos(user_id=user_id)
        quality_todos = await self._business_task_repository.list_active_quality_todos(
            business_assignee_user_id
        )
        followup_todos = await self._business_task_repository.list_active_followup_todos(
            business_assignee_user_id
        )
        inbound_approval_todos = await self._business_task_repository.list_inbound_approval_todos(
            business_assignee_user_id
        )
        approval_todos = await self._business_task_repository.list_approval_todos(
            business_assignee_user_id
        )
        notifications = await self._repository.list_notifications(user_id=user_id)
        schedule_events = await self._repository.list_schedule_events(user_id=user_id)
        shortcuts = await self._repository.list_shortcuts(user_id=user_id)
        todo_responses = [self._todo_response(row) for row in todos]
        todo_responses.extend(self._quality_todo_response(row) for row in quality_todos)
        todo_responses.extend(self._followup_todo_response(row) for row in followup_todos)
        todo_responses.extend(
            self._inbound_approval_todo_response(
                row,
                fallback_assignee=fallback_business_assignee,
            )
            for row in inbound_approval_todos
        )
        todo_responses.extend(
            self._approval_todo_response(
                row,
                fallback_assignee=fallback_business_assignee,
            )
            for row in approval_todos
        )
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
                starts_at=_to_utc_naive(payload.starts_at),
                ends_at=_to_utc_naive(payload.ends_at),
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

    async def update_schedule_event(
        self,
        *,
        user_id: str,
        schedule_id: str,
        payload: ScheduleUpdate,
    ) -> ScheduleEventResponse | None:
        changes = payload.model_dump(exclude_unset=True)
        async with UnitOfWork(self._repository.session):
            existing = await self._repository.get_schedule_event(
                user_id=user_id,
                schedule_id=schedule_id,
            )
            if existing is None:
                return None
            starts_at = _to_utc_naive(changes.get("starts_at", existing.starts_at))
            ends_at = _to_utc_naive(changes.get("ends_at", existing.ends_at))
            if _as_utc(ends_at) <= _as_utc(starts_at):
                raise ScheduleTimeRangeError("结束时间必须晚于开始时间")
            row = await self._repository.update_schedule_event(
                user_id=user_id,
                schedule_id=schedule_id,
                title=changes.get("title", existing.title),
                description=changes.get("description", existing.description),
                starts_at=starts_at,
                ends_at=ends_at,
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
            raise TodoAssigneeNotFoundError("待办负责人不存在或已停用")

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
                due_at=_to_utc_naive(payload.due_at) if payload.due_at else None,
            )
        return TodoCreateResponse(items=[self._todo_response(row) for row in rows])

    async def update_todo_task(
        self,
        *,
        current_user: CurrentUserResponse,
        todo_id: str,
        payload: TodoUpdate,
        assignee: AssignableUserResponse | None,
    ) -> TodoTaskResponse:
        changes = payload.model_dump(exclude_unset=True)
        is_super_admin = SUPER_ADMIN_PERMISSION in current_user.permissions
        async with UnitOfWork(self._repository.session):
            row = await self._repository.get_todo_task(todo_id)
            if row is None:
                raise TodoNotFoundError("待办不存在")
            if row.status != "pending":
                raise TodoStateError("待办已结束，不可再修改")

            is_owner = row.owner_user_id == current_user.id
            is_creator = row.creator_user_id == current_user.id

            status = changes.get("status", row.status)
            if status == "completed" and not (is_owner or is_super_admin):
                raise TodoPermissionDeniedError("只有负责人或超管可以完成待办")
            if status == "cancelled" and not (is_creator or is_super_admin):
                raise TodoPermissionDeniedError("只有创建人或超管可以取消待办")

            owner_user_id = row.owner_user_id
            owner_user_name = row.owner_user_name
            if "owner_user_id" in changes:
                if not (is_creator or is_super_admin):
                    raise TodoPermissionDeniedError("只有创建人或超管可以改派待办")
                if assignee is None:
                    raise TodoAssigneeNotFoundError("待办负责人不存在或已停用")
                owner_user_id = assignee.id
                owner_user_name = assignee.display_name

            if "due_at" in changes and not (is_owner or is_creator or is_super_admin):
                raise TodoPermissionDeniedError("只有创建人或负责人可以修改截止时间")
            due_at = changes["due_at"] if "due_at" in changes else row.due_at

            updated = await self._repository.update_todo_task(
                todo_id=todo_id,
                status=status,
                owner_user_id=owner_user_id,
                owner_user_name=owner_user_name,
                due_at=_to_utc_naive(due_at) if due_at else None,
            )
        if updated is None:
            raise TodoNotFoundError("待办不存在")
        return self._todo_response(updated)

    async def list_notifications(
        self,
        *,
        user_id: str,
        unread_only: bool,
    ) -> NotificationListResponse:
        rows, total = await self._repository.list_notification_page(
            user_id=user_id,
            unread_only=unread_only,
        )
        unread_count = await self._repository.count_unread_notifications(user_id)
        return NotificationListResponse(
            items=[self._notification_response(row) for row in rows],
            total=total,
            unread_count=unread_count,
        )

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
                read_at=datetime.now(UTC),
            )
        return self._notification_response(row) if row else None

    async def mark_all_notifications_read(self, *, user_id: str) -> NotificationReadAllResponse:
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.mark_all_notifications_read(
                user_id=user_id,
                read_at=datetime.now(UTC),
            )
        return NotificationReadAllResponse(updated=updated)

    async def delete_notification(
        self,
        *,
        user_id: str,
        notification_id: str,
    ) -> NotificationResponse | None:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.delete_notification(
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
            is_overdue=_is_overdue(row.due_at, status=row.status),
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
            is_overdue=_is_overdue(row.scheduled_at),
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
            is_overdue=_is_overdue(datetime.combine(row.planned_date, time(hour=9))),
            assignment_type="assigned",
        )

    def _inbound_approval_todo_response(
        self,
        row: InboundApprovalTodoRow,
        *,
        fallback_assignee: CurrentUserResponse | None,
    ) -> TodoTaskResponse:
        owner_user_id, owner_user_name = self._resolve_approval_assignee(
            reviewer_id=row.reviewer_id,
            reviewer_name=row.reviewer_name,
            fallback_assignee=fallback_assignee,
        )
        due_at = (
            datetime.combine(row.submitted_at, time(hour=9))
            if row.submitted_at is not None
            else None
        )
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=owner_user_id,
            owner_user_name=owner_user_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=None,
            title=f"入库审批 {row.code}",
            content=" / ".join([row.purchase_contract_no, row.supplier_name, row.warehouse_name]),
            source_type="warehouse_inbound_approval",
            source_id=row.id,
            due_at=due_at,
            status="pending",
            is_overdue=_is_overdue(due_at),
            assignment_type="assigned",
        )

    def _approval_todo_response(
        self,
        row: ApprovalTodoRow,
        *,
        fallback_assignee: CurrentUserResponse | None,
    ) -> TodoTaskResponse:
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
        owner_user_id, owner_user_name = self._resolve_approval_assignee(
            reviewer_id=row.reviewer_id,
            reviewer_name=row.reviewer_name,
            fallback_assignee=fallback_assignee,
        )
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=owner_user_id,
            owner_user_name=owner_user_name,
            creator_user_id=row.creator_user_id,
            creator_user_name=None,
            title=f"{title_by_type[row.source_type]} {row.code}",
            content=" / ".join(content),
            source_type=row.source_type,
            source_id=row.source_id,
            due_at=None,
            status="pending",
            is_overdue=False,
            assignment_type="assigned",
        )

    @staticmethod
    def _resolve_approval_assignee(
        *,
        reviewer_id: str | None,
        reviewer_name: str | None,
        fallback_assignee: CurrentUserResponse | None,
    ) -> tuple[str, str | None]:
        if reviewer_id is not None:
            return reviewer_id, reviewer_name
        if fallback_assignee is not None:
            return fallback_assignee.id, fallback_assignee.display_name
        raise ValueError("个人待办中存在未指定审批人的单据")

    def _notification_response(self, row: NotificationRow) -> NotificationResponse:
        return NotificationResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            message=row.message,
            severity=row.severity,
            source_type=row.source_type,
            source_id=row.source_id,
            event=row.event,
            target_path=row.target_path,
            is_read=row.is_read,
            read_at=row.read_at,
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
