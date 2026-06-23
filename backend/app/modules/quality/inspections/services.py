from app.db.uow import UnitOfWork
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import (
    PurchaseContractRepository,
    PurchaseContractRow,
)
from app.modules.quality.inspections.repositories import (
    QualityInspectionLineRow,
    QualityInspectionRepository,
    QualityInspectionRow,
    QualityIssueRow,
)
from app.modules.quality.inspections.schemas import (
    VALID_QUALITY_INSPECTION_RESULTS,
    QualityInspectionCreate,
    QualityInspectionInboundEligibilityResponse,
    QualityInspectionLineResponse,
    QualityInspectionListResponse,
    QualityInspectionResponse,
    QualityIssueResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
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
    ) -> None:
        self._repository = quality_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._followup_service = followup_service
        self._data_scope_resolver = data_scope_resolver

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
            raise ValueError("采购合同审批通过后才能登记 QC")
        qc_user_id, qc_user_name = self._inspection_assignee_from_contract(contract)
        async with UnitOfWork(self._repository.session):
            inspection = await self._repository.create_inspection(
                code=payload.code,
                purchase_contract_id=contract.id,
                purchase_contract_no=contract.code,
                supplier_id=contract.supplier_id,
                supplier_name=contract.supplier_name,
                inspected_at=payload.inspected_at,
                result=payload.result,
                inspector_id=payload.inspector_id,
                inspector_name=payload.inspector_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                issue_summary=payload.issue_summary,
                attachment_group_id=payload.attachment_group_id,
                owner_user_id=current_user.id,
            )
            await self._write_lines_and_issues(inspection.id, payload)
        await self._write_back_followup_if_passed(inspection)
        return await self._inspection_response(inspection)

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
        contract = await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=inspection.purchase_contract_id,
        )
        qc_user_id, qc_user_name = self._inspection_assignee_from_contract(contract)
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_inspection(
                inspection_id=inspection.id,
                code=payload.code,
                inspected_at=payload.inspected_at,
                result=payload.result,
                inspector_id=payload.inspector_id,
                inspector_name=payload.inspector_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                issue_summary=payload.issue_summary,
                attachment_group_id=payload.attachment_group_id,
            )
            if updated is None:
                raise QualityInspectionNotFoundError
            await self._repository.replace_lines_and_issues(inspection.id)
            await self._write_lines_and_issues(inspection.id, payload)
        await self._write_back_followup_if_passed(updated)
        return await self._inspection_response(updated)

    async def list_inspections(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        result: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        assignee_user_id: str | None,
    ) -> QualityInspectionListResponse:
        self._require(current_user, "quality:inspection:view")
        if result is not None:
            self._validate_result(result)
        can_view_all = self._can_view_all(current_user)
        owner_user_ids = None
        visible_assignee_user_id = None
        resolved_assignee_user_id = assignee_user_id
        if not can_view_all:
            if assignee_user_id is not None and assignee_user_id != current_user.id:
                raise PermissionDeniedError
            owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
                current_user=current_user,
            )
            visible_assignee_user_id = current_user.id
        rows, total = await self._repository.list_inspections(
            q=q,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
            visible_assignee_user_id=visible_assignee_user_id,
            assignee_user_id=resolved_assignee_user_id,
        )
        return QualityInspectionListResponse(
            items=[await self._inspection_response(row) for row in rows],
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
        return await self._inspection_response(inspection)

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
                latest_result=None,
                inspected_at=None,
                reason="尚无 QC 查验记录",
            )
        eligible = latest.result == "passed"
        return QualityInspectionInboundEligibilityResponse(
            purchase_contract_id=purchase_contract_id,
            eligible=eligible,
            latest_inspection_id=latest.id,
            latest_result=latest.result,
            inspected_at=latest.inspected_at,
            reason="QC 已通过" if eligible else "最近一次 QC 未通过",
        )

    async def _write_lines_and_issues(
        self,
        inspection_id: str,
        payload: QualityInspectionCreate,
    ) -> None:
        for line in payload.lines:
            await self._repository.add_line(
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
        for issue in payload.issues:
            await self._repository.add_issue(
                inspection_id=inspection_id,
                line_id=None,
                issue_type=issue.issue_type,
                severity=issue.severity,
                description=issue.description,
                corrective_action=issue.corrective_action,
                status=issue.status,
                attachment_group_id=issue.attachment_group_id,
            )

    async def _write_back_followup_if_passed(self, inspection: QualityInspectionRow) -> None:
        if inspection.result != "passed":
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
            is_owner_visible = allowed_user_ids is None or inspection.owner_user_id in allowed_user_ids
            is_assigned_qc = inspection.qc_user_id == current_user.id
            if not is_owner_visible and not is_assigned_qc:
                raise QualityInspectionNotFoundError
            return inspection
        return inspection

    async def _inspection_response(
        self,
        inspection: QualityInspectionRow,
    ) -> QualityInspectionResponse:
        lines = await self._repository.list_lines(inspection.id)
        issues = await self._repository.list_issues(inspection.id)
        return QualityInspectionResponse(
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
            lines=[self._line_response(row) for row in lines],
            issues=[self._issue_response(row) for row in issues],
        )

    def _line_response(self, line: QualityInspectionLineRow) -> QualityInspectionLineResponse:
        return QualityInspectionLineResponse(
            id=line.id,
            inspection_id=line.inspection_id,
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

    def _issue_response(self, issue: QualityIssueRow) -> QualityIssueResponse:
        return QualityIssueResponse(
            id=issue.id,
            inspection_id=issue.inspection_id,
            line_id=issue.line_id,
            issue_type=issue.issue_type,
            severity=issue.severity,
            description=issue.description,
            corrective_action=issue.corrective_action,
            status=issue.status,
            attachment_group_id=issue.attachment_group_id,
        )

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
