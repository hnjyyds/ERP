from datetime import datetime, time

from app.db.uow import UnitOfWork
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import (
    PurchaseContractRepository,
    PurchaseContractRow,
)
from app.modules.quality.inspections.repositories import (
    QualityInspectionRepository,
    QualityInspectionRow,
)
from app.modules.quality.inspections.response_builder import QualityInspectionResponseBuilder
from app.modules.quality.inspections.schemas import (
    VALID_QUALITY_INSPECTION_RESULTS,
    VALID_QUALITY_INSPECTION_STATUSES,
    QualityCancelRequest,
    QualityInspectionCreate,
    QualityInspectionInboundEligibilityResponse,
    QualityInspectionListResponse,
    QualityInspectionResponse,
    QualityIssueResolveRequest,
    QualityReinspectionCreate,
    QualityScheduleUpdate,
)
from app.modules.system.auth.assignees import AssigneeValidator
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class QualityInspectionNotFoundError(Exception):
    pass


class QualityInspectionPurchaseContractNotFoundError(Exception):
    pass


class QualityInspectionService:
    def __init__(
        self,
        *,
        quality_repository: QualityInspectionRepository,
        purchase_contract_repository: PurchaseContractRepository,
        followup_service: FollowupService,
        data_scope_resolver: DataScopeResolver,
        auth_repository: AuthRepository | None = None,
    ) -> None:
        self._repository = quality_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._followup_service = followup_service
        self._data_scope_resolver = data_scope_resolver
        self._response_builder = QualityInspectionResponseBuilder(quality_repository)
        self._assignee_validator = AssigneeValidator(
            auth_repository or AuthRepository(quality_repository.session)
        )

    async def create_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: QualityInspectionCreate,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=payload.purchase_contract_id,
        )
        if contract.approval_status != "approved":
            raise ValueError("请先审批该采购合同，再登记 QC 查验")
        await self._validate_completed_payload(contract=contract, payload=payload)
        qc_user_id, qc_user_name = self._inspection_assignee_from_contract(contract)
        inspector = await self._assignee_validator.require(
            user_id=payload.inspector_id,
            required_permission="quality:inspection:edit",
            role_name="QC 负责人",
            permission_error="所选员工没有 QC 查验权限",
        )
        task_status = payload.status or "completed"
        if payload.inspected_at is not None:
            inspected_at = payload.inspected_at
        elif payload.scheduled_at is not None:
            inspected_at = payload.scheduled_at.date()
        else:
            raise ValueError("查验日期或排期时间至少填写一项")
        scheduled_at = payload.scheduled_at or datetime.combine(inspected_at, time(hour=9))
        async with UnitOfWork(self._repository.session):
            inspection = await self._repository.create_inspection(
                code=payload.code,
                purchase_contract_id=contract.id,
                purchase_contract_no=contract.code,
                supplier_id=contract.supplier_id,
                supplier_name=contract.supplier_name,
                status=task_status,
                scheduled_at=scheduled_at,
                inspected_at=inspected_at,
                result=payload.result or "",
                inspector_id=inspector.id,
                inspector_name=inspector.display_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                issue_summary=payload.issue_summary,
                attachment_group_id=payload.attachment_group_id,
                owner_user_id=current_user.id,
            )
            await self._write_lines_issues_and_attachments(
                inspection.id,
                payload,
                current_user=current_user,
            )
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type="created",
                from_status=None,
                to_status=task_status,
                notes="QC 任务已创建",
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        await self._write_back_followup_if_passed(inspection)
        return await self._response_builder.build(inspection)

    async def update_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
        payload: QualityInspectionCreate,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        if inspection.purchase_contract_id != payload.purchase_contract_id:
            raise ValueError("QC 查验不能更换采购合同")
        task_status = payload.status or "completed"
        self._validate_status_transition(inspection.status, task_status)
        contract = await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=inspection.purchase_contract_id,
        )
        await self._validate_completed_payload(contract=contract, payload=payload)
        qc_user_id, qc_user_name = self._inspection_assignee_from_contract(contract)
        inspector = await self._assignee_validator.require(
            user_id=payload.inspector_id,
            required_permission="quality:inspection:edit",
            role_name="QC 负责人",
            permission_error="所选员工没有 QC 查验权限",
        )
        if payload.inspected_at is not None:
            inspected_at = payload.inspected_at
        elif payload.scheduled_at is not None:
            inspected_at = payload.scheduled_at.date()
        else:
            raise ValueError("查验日期或排期时间至少填写一项")
        scheduled_at = payload.scheduled_at or datetime.combine(inspected_at, time(hour=9))
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_inspection(
                inspection_id=inspection.id,
                code=payload.code,
                status=task_status,
                scheduled_at=scheduled_at,
                inspected_at=inspected_at,
                result=payload.result or "",
                inspector_id=inspector.id,
                inspector_name=inspector.display_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                issue_summary=payload.issue_summary,
                attachment_group_id=payload.attachment_group_id,
            )
            if updated is None:
                raise QualityInspectionNotFoundError
            await self._repository.replace_lines_and_issues(inspection.id)
            await self._write_lines_issues_and_attachments(
                inspection.id,
                payload,
                current_user=current_user,
            )
            event_type = (
                "started"
                if task_status == "in_progress"
                else "completed"
                if task_status == "completed"
                else "updated"
            )
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type=event_type,
                from_status=inspection.status,
                to_status=task_status,
                notes=None,
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        await self._write_back_followup_if_passed(updated)
        return await self._response_builder.build(updated)

    async def list_inspections(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None = None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        assignee_user_id: str | None,
        inspector_user_id: str | None = None,
    ) -> QualityInspectionListResponse:
        self._require(current_user, "quality:inspection:view")
        if result is not None:
            self._validate_result(result)
        if status is not None:
            self._validate_status(status)
        can_view_all = self._can_view_all(current_user)
        owner_user_ids = None
        visible_assignee_user_id = None
        resolved_assignee_user_id = assignee_user_id
        resolved_inspector_user_id = inspector_user_id
        if not can_view_all:
            if assignee_user_id is not None and assignee_user_id != current_user.id:
                raise PermissionDeniedError
            if inspector_user_id is not None and inspector_user_id != current_user.id:
                raise PermissionDeniedError
            owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
                current_user=current_user,
            )
            visible_assignee_user_id = current_user.id
        rows, total = await self._repository.list_inspections(
            q=q,
            status=status,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
            visible_assignee_user_id=visible_assignee_user_id,
            assignee_user_id=resolved_assignee_user_id,
            inspector_user_id=resolved_inspector_user_id,
        )
        return QualityInspectionListResponse(
            items=await self._response_builder.build_many(rows),
            total=total,
        )

    async def get_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
    ) -> QualityInspectionResponse:
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        return await self._response_builder.build(inspection)

    async def reschedule_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
        payload: QualityScheduleUpdate,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        if inspection.status not in {"pending", "in_progress"}:
            raise ValueError("仅待执行或执行中的 QC 任务可以调整排期")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.reschedule_inspection(
                inspection_id=inspection.id,
                scheduled_at=payload.scheduled_at,
            )
            if updated is None:
                raise QualityInspectionNotFoundError
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type="rescheduled",
                from_status=inspection.status,
                to_status=inspection.status,
                notes=payload.reason,
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        return await self._response_builder.build(updated)

    async def cancel_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
        payload: QualityCancelRequest,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        if inspection.status not in {"pending", "in_progress"}:
            raise ValueError("仅待执行或执行中的 QC 任务可以取消")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.cancel_inspection(
                inspection_id=inspection.id,
                reason=payload.reason,
            )
            if updated is None:
                raise QualityInspectionNotFoundError
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type="cancelled",
                from_status=inspection.status,
                to_status="cancelled",
                notes=payload.reason,
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        return await self._response_builder.build(updated)

    async def resolve_issue(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
        issue_id: str,
        payload: QualityIssueResolveRequest,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        issue = await self._repository.get_issue(issue_id)
        if issue is None or issue.inspection_id != inspection.id:
            raise QualityInspectionNotFoundError
        if issue.status == "resolved":
            raise ValueError("该 QC 异常已经关闭")
        async with UnitOfWork(self._repository.session):
            resolved = await self._repository.resolve_issue(
                issue_id=issue.id,
                resolution_note=payload.resolution_note,
                resolved_by_id=current_user.id,
                resolved_by_name=current_user.display_name,
            )
            if resolved is None:
                raise QualityInspectionNotFoundError
            for attachment in payload.attachments:
                await self._repository.add_attachment(
                    inspection_id=inspection.id,
                    issue_id=issue.id,
                    category="resolution",
                    filename=attachment.filename,
                    url=attachment.url,
                    uploaded_by_id=current_user.id,
                    uploaded_by_name=current_user.display_name,
                )
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type="issue_resolved",
                from_status=inspection.status,
                to_status=inspection.status,
                notes=payload.resolution_note,
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        return await self._response_builder.build(inspection)

    async def create_reinspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
        payload: QualityReinspectionCreate,
    ) -> QualityInspectionResponse:
        self._require(current_user, "quality:inspection:edit")
        inspection = await self._get_accessible_inspection(
            current_user=current_user,
            inspection_id=inspection_id,
        )
        if inspection.status != "completed" or inspection.result == "passed":
            raise ValueError("仅已完成且未通过的 QC 任务可以创建复检")
        issues = await self._repository.list_issues(inspection.id)
        if any(issue.status != "resolved" for issue in issues):
            raise ValueError("请先关闭全部 QC 异常，再创建复检任务")
        if await self._repository.get_active_reinspection(inspection.id) is not None:
            raise ValueError("该 QC 任务已经存在待执行的复检任务")
        latest = await self._repository.get_latest_for_contract(inspection.purchase_contract_id)
        if latest is None or latest.id != inspection.id:
            raise ValueError("仅最新一笔未通过的 QC 任务可以创建复检")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=inspection.purchase_contract_id,
        )
        inspector = await self._assignee_validator.require(
            user_id=payload.inspector_id,
            required_permission="quality:inspection:edit",
            role_name="QC 负责人",
            permission_error="所选员工没有 QC 查验权限",
        )
        root_reinspection_no = inspection.reinspection_no + 1
        async with UnitOfWork(self._repository.session):
            reinspection = await self._repository.create_inspection(
                code=payload.code,
                purchase_contract_id=contract.id,
                purchase_contract_no=contract.code,
                supplier_id=contract.supplier_id,
                supplier_name=contract.supplier_name,
                status="pending",
                scheduled_at=payload.scheduled_at,
                inspected_at=payload.scheduled_at.date(),
                result="",
                inspector_id=inspector.id,
                inspector_name=inspector.display_name,
                qc_user_id=contract.qc_user_id,
                qc_user_name=contract.qc_user_name,
                issue_summary=payload.reason,
                attachment_group_id=None,
                parent_inspection_id=inspection.id,
                reinspection_no=root_reinspection_no,
                owner_user_id=current_user.id,
            )
            await self._repository.add_event(
                inspection_id=reinspection.id,
                event_type="created",
                from_status=None,
                to_status="pending",
                notes=payload.reason,
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
            await self._repository.add_event(
                inspection_id=inspection.id,
                event_type="reinspection_created",
                from_status=inspection.status,
                to_status=inspection.status,
                notes=f"{payload.code}：{payload.reason}",
                actor_user_id=current_user.id,
                actor_user_name=current_user.display_name,
            )
        return await self._response_builder.build(reinspection)

    async def get_inbound_eligibility(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
    ) -> QualityInspectionInboundEligibilityResponse:
        self._require(current_user, "quality:inspection:view")
        await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=purchase_contract_id,
        )
        latest = await self._repository.get_latest_for_contract(purchase_contract_id)
        if latest is None:
            return QualityInspectionInboundEligibilityResponse(
                purchase_contract_id=purchase_contract_id,
                eligible=False,
                latest_inspection_id=None,
                latest_status=None,
                latest_result=None,
                inspected_at=None,
                reason="尚无 QC 查验任务",
            )
        eligible = latest.status == "completed" and latest.result == "passed"
        if latest.status in {"pending", "in_progress"}:
            pending_label = "复检任务" if latest.parent_inspection_id else "任务"
            reason = f"最新 QC {pending_label}尚未完成"
        elif latest.status == "cancelled":
            reason = "最新 QC 任务已取消，请重新排期"
        else:
            reason = "QC 已通过" if eligible else "最近一次 QC 未通过"
        return QualityInspectionInboundEligibilityResponse(
            purchase_contract_id=purchase_contract_id,
            eligible=eligible,
            latest_inspection_id=latest.id,
            latest_status=latest.status,
            latest_result=latest.result if latest.status == "completed" else None,
            inspected_at=latest.inspected_at if latest.status == "completed" else None,
            reason=reason,
        )

    async def _write_lines_issues_and_attachments(
        self,
        inspection_id: str,
        payload: QualityInspectionCreate,
        *,
        current_user: CurrentUserResponse,
    ) -> None:
        line_ids_by_contract_line: dict[str, str] = {}
        for line in payload.lines:
            created_line = await self._repository.add_line(
                inspection_id=inspection_id,
                purchase_contract_line_id=line.purchase_contract_line_id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                inspected_quantity=line.inspected_quantity,
                failed_quantity=line.failed_quantity,
                unit=line.unit,
                result=line.result,
                remark=line.remark,
            )
            if line.purchase_contract_line_id is not None:
                line_ids_by_contract_line[line.purchase_contract_line_id] = created_line.id
        for issue in payload.issues:
            await self._repository.add_issue(
                inspection_id=inspection_id,
                line_id=line_ids_by_contract_line.get(issue.purchase_contract_line_id or ""),
                issue_type=issue.issue_type,
                severity=issue.severity,
                description=issue.description,
                corrective_action=issue.corrective_action,
                status=issue.status,
                attachment_group_id=issue.attachment_group_id,
            )
        for attachment in payload.attachments:
            await self._repository.add_attachment(
                inspection_id=inspection_id,
                issue_id=None,
                category="inspection",
                filename=attachment.filename,
                url=attachment.url,
                uploaded_by_id=current_user.id,
                uploaded_by_name=current_user.display_name,
            )

    async def _validate_completed_payload(
        self,
        *,
        contract: PurchaseContractRow,
        payload: QualityInspectionCreate,
    ) -> None:
        if payload.status != "completed":
            return
        contract_lines = await self._purchase_contract_repository.list_lines(contract.id)
        expected_line_ids = {line.id for line in contract_lines}
        submitted_line_ids = [
            line.purchase_contract_line_id
            for line in payload.lines
            if line.purchase_contract_line_id is not None
        ]
        if len(submitted_line_ids) != len(set(submitted_line_ids)):
            raise ValueError("同一采购合同明细不能重复登记 QC 结果")
        if set(submitted_line_ids) != expected_line_ids:
            raise ValueError("QC 完成时必须登记采购合同的全部商品明细")
        issue_line_ids = {
            issue.purchase_contract_line_id
            for issue in payload.issues
            if issue.purchase_contract_line_id is not None
        }
        if not issue_line_ids.issubset(expected_line_ids):
            raise ValueError("QC 异常关联了不属于该采购合同的明细")

    async def _write_back_followup_if_passed(self, inspection: QualityInspectionRow) -> None:
        if inspection.status != "completed" or inspection.result != "passed":
            return
        await self._followup_service.complete_node_from_source(
            purchase_contract_id=inspection.purchase_contract_id,
            node_code="quality_inspection",
            source_record_type="quality_inspection",
            source_record_id=inspection.id,
            actual_date=inspection.inspected_at,
            source_summary=f"{inspection.code} QC 查验通过",
        )

    async def _get_accessible_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
    ) -> PurchaseContractRow:
        contract = await self._purchase_contract_repository.get_contract(purchase_contract_id)
        if contract is None:
            raise QualityInspectionPurchaseContractNotFoundError
        allowed_user_ids = (
            None
            if self._can_view_all(current_user)
            else await self._data_scope_resolver.resolve_user_ids(current_user=current_user)
        )
        is_assigned_qc = contract.qc_user_id == current_user.id
        if (
            allowed_user_ids is not None
            and contract.owner_user_id not in allowed_user_ids
            and not is_assigned_qc
        ):
            raise PermissionDeniedError
        return contract

    async def _get_accessible_inspection(
        self,
        *,
        current_user: CurrentUserResponse,
        inspection_id: str,
    ) -> QualityInspectionRow:
        self._require(current_user, "quality:inspection:view")
        inspection = await self._repository.get_inspection(inspection_id)
        if inspection is None:
            raise QualityInspectionNotFoundError
        if not self._can_view_all(current_user):
            allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
                current_user=current_user,
            )
            is_owner_visible = (
                allowed_user_ids is None or inspection.owner_user_id in allowed_user_ids
            )
            is_assigned_qc = (
                inspection.inspector_id == current_user.id
                or inspection.qc_user_id == current_user.id
            )
            if not is_owner_visible and not is_assigned_qc:
                raise QualityInspectionNotFoundError
            return inspection
        return inspection

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _can_view_all(self, current_user: CurrentUserResponse) -> bool:
        return "quality:inspection:view_all" in current_user.permissions

    def _inspection_assignee_from_contract(
        self,
        contract: PurchaseContractRow,
    ) -> tuple[str | None, str | None]:
        return contract.qc_user_id, contract.qc_user_name

    def _validate_result(self, result: str) -> None:
        if result not in VALID_QUALITY_INSPECTION_RESULTS:
            raise ValueError("QC 查验结果无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_QUALITY_INSPECTION_STATUSES:
            raise ValueError("QC 任务状态无效")

    def _validate_status_transition(self, current_status: str, next_status: str) -> None:
        allowed_transitions = {
            "pending": {"pending", "in_progress", "completed", "cancelled"},
            "in_progress": {"in_progress", "completed", "cancelled"},
            "completed": {"completed"},
            "cancelled": {"cancelled"},
        }
        if next_status not in allowed_transitions.get(current_status, {current_status}):
            raise ValueError("QC 任务状态不能这样变更")
