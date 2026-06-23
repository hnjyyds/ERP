from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.masterdata.products.repositories import ProductAccessoryRow, ProductRepository
from app.modules.purchase.contracts.repositories import (
    PurchaseContractLineRow,
    PurchaseContractReminderRow,
    PurchaseContractRepository,
    PurchaseContractRow,
    PurchaseContractSourceLinkRow,
)
from app.modules.purchase.contracts.schemas import (
    VALID_PURCHASE_CONTRACT_SOURCE_TYPES,
    VALID_PURCHASE_CONTRACT_STATUSES,
    PurchaseContractApprove,
    PurchaseContractCreate,
    PurchaseContractGenerateFromExportContracts,
    PurchaseContractLineCreate,
    PurchaseContractLineResponse,
    PurchaseContractListResponse,
    PurchaseContractReminderListResponse,
    PurchaseContractReminderResponse,
    PurchaseContractResponse,
    PurchaseContractSourceLinkResponse,
    PurchaseContractStatisticsResponse,
)
from app.modules.sales.contracts.repositories import (
    ExportContractLineRow,
    ExportContractRepository,
    ExportContractRow,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class PurchaseContractNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class _GeneratedLine:
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    source_export_contract_id: str | None
    source_export_contract_no: str | None
    source_export_contract_line_id: str | None
    remark: str | None


@dataclass(frozen=True)
class _SourceContractLine:
    contract: ExportContractRow
    line: ExportContractLineRow


class PurchaseContractService:
    def __init__(
        self,
        *,
        purchase_repository: PurchaseContractRepository,
        export_contract_repository: ExportContractRepository,
        product_repository: ProductRepository,
        data_scope_resolver: DataScopeResolver,
        auth_repository: AuthRepository,
    ) -> None:
        self._repository = purchase_repository
        self._export_contract_repository = export_contract_repository
        self._product_repository = product_repository
        self._data_scope_resolver = data_scope_resolver
        self._auth_repository = auth_repository

    async def create_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PurchaseContractCreate,
    ) -> PurchaseContractResponse:
        self._require(current_user, "purchase:contract:edit")
        qc_user_id, qc_user_name = await self._resolve_qc_assignee(payload.qc_user_id)
        async with UnitOfWork(self._repository.session):
            contract = await self._repository.create_contract(
                code=payload.code,
                contract_date=payload.contract_date,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                buyer_user_id=payload.buyer_user_id,
                buyer_user_name=payload.buyer_user_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                currency=payload.currency,
                delivery_date=payload.delivery_date,
                payment_terms=payload.payment_terms,
                source_type=payload.source_type,
                remarks=payload.remarks,
                approval_status="draft",
                owner_user_id=current_user.id,
            )
            updated = await self._replace_lines(contract.id, payload.lines)
            if updated is None:
                raise PurchaseContractNotFoundError
            await self._rebuild_reminders(updated)
        return await self._contract_response(updated)

    async def update_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: PurchaseContractCreate,
    ) -> PurchaseContractResponse:
        self._require(current_user, "purchase:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "draft":
            raise ValueError("只有草稿采购合同可以编辑")
        qc_user_id, qc_user_name = await self._resolve_qc_assignee(payload.qc_user_id)
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_contract(
                contract_id=contract.id,
                code=payload.code,
                contract_date=payload.contract_date,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                buyer_user_id=payload.buyer_user_id,
                buyer_user_name=payload.buyer_user_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                currency=payload.currency,
                delivery_date=payload.delivery_date,
                payment_terms=payload.payment_terms,
                source_type=payload.source_type,
                remarks=payload.remarks,
            )
            if updated is None:
                raise PurchaseContractNotFoundError
            updated = await self._replace_lines(contract.id, payload.lines)
            if updated is None:
                raise PurchaseContractNotFoundError
            await self._rebuild_reminders(updated)
        return await self._contract_response(updated)

    async def generate_from_export_contracts(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PurchaseContractGenerateFromExportContracts,
    ) -> PurchaseContractResponse:
        self._require(current_user, "purchase:contract:edit")
        source_lines = await self._load_source_contract_lines(payload)
        generated_lines = await self._generate_accessory_lines(
            source_lines=source_lines,
            unit_price=payload.unit_price,
        )
        qc_user_id, qc_user_name = await self._resolve_qc_assignee(payload.qc_user_id)
        async with UnitOfWork(self._repository.session):
            contract = await self._repository.create_contract(
                code=payload.code,
                contract_date=payload.contract_date,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                buyer_user_id=payload.buyer_user_id,
                buyer_user_name=payload.buyer_user_name,
                qc_user_id=qc_user_id,
                qc_user_name=qc_user_name,
                currency=payload.currency,
                delivery_date=payload.delivery_date,
                payment_terms=payload.payment_terms,
                source_type="export_contract",
                remarks=payload.remarks,
                approval_status="draft",
                owner_user_id=current_user.id,
            )
            for source in source_lines:
                await self._repository.add_source_link(
                    contract_id=contract.id,
                    export_contract_id=source.contract.id,
                    export_contract_no=source.contract.code,
                    export_contract_line_id=source.line.id,
                    customer_name=source.contract.customer_name,
                    product_id=source.line.product_id,
                    product_code=source.line.product_code,
                    demand_quantity=source.line.quantity,
                    unit=source.line.unit,
                )
            updated = await self._replace_generated_lines(contract.id, generated_lines)
            if updated is None:
                raise PurchaseContractNotFoundError
            await self._rebuild_reminders(updated)
        return await self._contract_response(updated)

    async def list_contracts(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        approval_status: str | None,
        supplier_id: str | None,
        source_type: str | None,
    ) -> PurchaseContractListResponse:
        self._require(current_user, "purchase:contract:view")
        if approval_status is not None:
            self._validate_status(approval_status)
        if source_type is not None:
            self._validate_source_type(source_type)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_contracts(
            q=q,
            approval_status=approval_status,
            supplier_id=supplier_id,
            source_type=source_type,
            owner_user_ids=owner_user_ids,
        )
        return PurchaseContractListResponse(
            items=[await self._contract_response(row) for row in rows],
            total=total,
        )

    async def get_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> PurchaseContractResponse:
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        return await self._contract_response(contract)

    async def submit_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> PurchaseContractResponse:
        self._require(current_user, "purchase:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "draft":
            raise ValueError("只有草稿采购合同可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_contract(contract.id)
            if submitted is None:
                raise PurchaseContractNotFoundError
        return await self._contract_response(submitted)

    async def approve_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: PurchaseContractApprove,
    ) -> PurchaseContractResponse:
        self._require(current_user, "purchase:contract:approve")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "submitted":
            raise ValueError("只有已提交采购合同可以审批")
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_contract(
                contract_id=contract.id,
                reviewer_name=payload.reviewer_name,
                approved_at=payload.approved_at,
            )
            if approved is None:
                raise PurchaseContractNotFoundError
            await self._write_back_export_purchase_progress(approved.id)
            await self._ensure_followup_plan(approved)
            await self._ensure_inbound_plan(approved)
        return await self._contract_response(approved)

    async def list_reminders(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> PurchaseContractReminderListResponse:
        self._require(current_user, "purchase:contract:view")
        rows = await self._repository.list_reminders()
        return PurchaseContractReminderListResponse(
            items=[self._reminder_response(row) for row in rows],
            total=len(rows),
        )

    async def _replace_lines(
        self,
        contract_id: str,
        lines: list[PurchaseContractLineCreate],
    ) -> PurchaseContractRow | None:
        await self._repository.delete_lines(contract_id)
        for line in lines:
            await self._repository.add_line(
                contract_id=contract_id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                quantity=line.quantity,
                unit=line.unit,
                unit_price=line.unit_price,
                amount=line.quantity * line.unit_price,
                source_export_contract_id=line.source_export_contract_id,
                source_export_contract_no=line.source_export_contract_no,
                source_export_contract_line_id=line.source_export_contract_line_id,
                remark=line.remark,
            )
        return await self._repository.refresh_statistics(contract_id)

    async def _replace_generated_lines(
        self,
        contract_id: str,
        lines: list[_GeneratedLine],
    ) -> PurchaseContractRow | None:
        await self._repository.delete_lines(contract_id)
        for line in lines:
            await self._repository.add_line(
                contract_id=contract_id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                quantity=line.quantity,
                unit=line.unit,
                unit_price=line.unit_price,
                amount=line.quantity * line.unit_price,
                source_export_contract_id=line.source_export_contract_id,
                source_export_contract_no=line.source_export_contract_no,
                source_export_contract_line_id=line.source_export_contract_line_id,
                remark=line.remark,
            )
        return await self._repository.refresh_statistics(contract_id)

    async def _rebuild_reminders(self, contract: PurchaseContractRow) -> None:
        await self._repository.delete_reminders(contract.id)
        total_amount = Decimal(contract.total_amount)
        await self._repository.add_reminder(
            contract_id=contract.id,
            reminder_type="payment",
            title=f"{contract.code} 供应商付款提醒",
            due_date=contract.contract_date + timedelta(days=7),
            amount=(total_amount * Decimal("0.30")).quantize(Decimal("0.01")),
            currency=contract.currency,
        )
        await self._repository.add_reminder(
            contract_id=contract.id,
            reminder_type="delivery",
            title=f"{contract.code} 供应商交货提醒",
            due_date=contract.delivery_date,
            amount=None,
            currency=contract.currency,
        )

    async def _load_source_contract_lines(
        self,
        payload: PurchaseContractGenerateFromExportContracts,
    ) -> list[_SourceContractLine]:
        selected: list[_SourceContractLine] = []
        for source in payload.sources:
            contract = await self._export_contract_repository.get_contract(
                source.export_contract_id
            )
            if contract is None:
                raise ValueError("来源出口合同不存在")
            if contract.approval_status != "approved":
                raise ValueError("只能从已审批出口合同生成采购合同")
            lines = await self._export_contract_repository.list_lines(contract.id)
            for line in lines:
                selected.append(_SourceContractLine(contract=contract, line=line))
        if not selected:
            raise ValueError("来源出口合同没有商品明细")
        return selected

    async def _generate_accessory_lines(
        self,
        *,
        source_lines: list[_SourceContractLine],
        unit_price: Decimal,
    ) -> list[_GeneratedLine]:
        aggregate: dict[tuple[str, str], Decimal] = {}
        first_source: dict[tuple[str, str], _SourceContractLine] = {}
        first_accessory: dict[tuple[str, str], ProductAccessoryRow] = {}
        for source in source_lines:
            if source.line.product_id is None:
                raise ValueError("出口合同明细缺少商品标识，无法读取配件")
            accessories = await self._product_repository.list_accessories(source.line.product_id)
            if not accessories:
                raise ValueError("商品缺少配件明细，无法生成采购合同")
            for accessory in accessories:
                key = (accessory.accessory_name, accessory.unit)
                aggregate[key] = aggregate.get(key, Decimal("0")) + (
                    source.line.quantity * accessory.unit_consumption
                )
                first_source.setdefault(key, source)
                first_accessory.setdefault(key, accessory)
        generated: list[_GeneratedLine] = []
        for key, quantity in aggregate.items():
            source = first_source[key]
            accessory = first_accessory[key]
            generated.append(
                _GeneratedLine(
                    product_id=None,
                    product_code=source.line.product_code,
                    product_name=accessory.accessory_name,
                    specification=source.line.specification,
                    model=source.line.model,
                    quantity=quantity,
                    unit=accessory.unit,
                    unit_price=unit_price,
                    source_export_contract_id=(
                        source.contract.id if len(source_lines) == 1 else None
                    ),
                    source_export_contract_no=(
                        source.contract.code if len(source_lines) == 1 else None
                    ),
                    source_export_contract_line_id=(
                        source.line.id if len(source_lines) == 1 else None
                    ),
                    remark="按商品配件单位耗料生成",
                )
            )
        return generated

    async def _write_back_export_purchase_progress(self, contract_id: str) -> None:
        source_links = await self._repository.list_source_links(contract_id)
        affected_contract_ids: list[str] = []
        for link in source_links:
            already_approved = await self._repository.has_other_approved_purchase_for_source_line(
                export_contract_line_id=link.export_contract_line_id,
                current_contract_id=contract_id,
            )
            if already_approved:
                continue
            await self._export_contract_repository.increase_line_purchased_quantity(
                line_id=link.export_contract_line_id,
                quantity=link.demand_quantity,
            )
            if link.export_contract_id not in affected_contract_ids:
                affected_contract_ids.append(link.export_contract_id)
        for export_contract_id in affected_contract_ids:
            await self._export_contract_repository.refresh_statistics(export_contract_id)

    async def _ensure_followup_plan(self, contract: PurchaseContractRow) -> None:
        from app.modules.followup.repositories import FollowupRepository
        from app.modules.followup.services import FollowupService
        from app.modules.sample.records.repositories import SampleRecordRepository
        from app.modules.system.auth.data_scope import DataScopeResolver
        from app.modules.system.auth.repositories import AuthRepository

        followup_service = FollowupService(
            followup_repository=FollowupRepository(self._repository.session),
            purchase_contract_repository=self._repository,
            sample_record_repository=SampleRecordRepository(self._repository.session),
            data_scope_resolver=DataScopeResolver(AuthRepository(self._repository.session)),
        )
        await followup_service.ensure_plan_for_contract(contract=contract)

    async def _ensure_inbound_plan(self, contract: PurchaseContractRow) -> None:
        from app.modules.system.auth.data_scope import DataScopeResolver
        from app.modules.system.auth.repositories import AuthRepository
        from app.modules.warehouse.inbound_plans.repositories import InboundPlanRepository
        from app.modules.warehouse.inbound_plans.services import InboundPlanService

        inbound_plan_service = InboundPlanService(
            inbound_repository=InboundPlanRepository(self._repository.session),
            purchase_contract_repository=self._repository,
            data_scope_resolver=DataScopeResolver(AuthRepository(self._repository.session)),
        )
        await inbound_plan_service.ensure_plan_for_contract(contract=contract)

    async def _resolve_qc_assignee(
        self,
        qc_user_id: str | None,
    ) -> tuple[str | None, str | None]:
        if qc_user_id is None or not qc_user_id.strip():
            return None, None
        users = await self._auth_repository.list_active_users_by_ids([qc_user_id.strip()])
        if not users:
            raise ValueError("QC 负责人不存在")
        user = users[0]
        return user.id, user.display_name

    async def _get_accessible_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> PurchaseContractRow:
        self._require(current_user, "purchase:contract:view")
        contract = await self._repository.get_contract(contract_id)
        if contract is None:
            raise PurchaseContractNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return contract

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, approval_status: str) -> None:
        if approval_status not in VALID_PURCHASE_CONTRACT_STATUSES:
            raise ValueError("采购合同审批状态无效")

    def _validate_source_type(self, source_type: str) -> None:
        if source_type not in VALID_PURCHASE_CONTRACT_SOURCE_TYPES:
            raise ValueError("采购合同来源类型无效")

    async def _contract_response(self, contract: PurchaseContractRow) -> PurchaseContractResponse:
        lines = await self._repository.list_lines(contract.id)
        source_links = await self._repository.list_source_links(contract.id)
        reminders = await self._repository.list_reminders(contract.id)
        return PurchaseContractResponse(
            id=contract.id,
            code=contract.code,
            contract_date=contract.contract_date,
            supplier_id=contract.supplier_id,
            supplier_name=contract.supplier_name,
            buyer_user_id=contract.buyer_user_id,
            buyer_user_name=contract.buyer_user_name,
            qc_user_id=contract.qc_user_id,
            qc_user_name=contract.qc_user_name,
            currency=contract.currency,
            delivery_date=contract.delivery_date,
            payment_terms=contract.payment_terms,
            source_type=contract.source_type,
            remarks=contract.remarks,
            approval_status=contract.approval_status,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            reviewer_name=contract.reviewer_name,
            owner_user_id=contract.owner_user_id,
            statistics=self._statistics_response(contract),
            lines=[self._line_response(line) for line in lines],
            source_links=[self._source_link_response(link) for link in source_links],
            reminders=[self._reminder_response(reminder) for reminder in reminders],
        )

    def _statistics_response(
        self,
        contract: PurchaseContractRow,
    ) -> PurchaseContractStatisticsResponse:
        return PurchaseContractStatisticsResponse(
            total_quantity=contract.total_quantity,
            total_amount=contract.total_amount,
            received_quantity=contract.received_quantity,
            unreceived_quantity=contract.unreceived_quantity,
            paid_amount=contract.paid_amount,
            unpaid_amount=contract.unpaid_amount,
        )

    def _line_response(self, line: PurchaseContractLineRow) -> PurchaseContractLineResponse:
        return PurchaseContractLineResponse(
            id=line.id,
            contract_id=line.contract_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            unit_price=self._quantity(line.unit_price),
            amount=line.amount,
            received_quantity=self._quantity(line.received_quantity),
            unreceived_quantity=line.unreceived_quantity,
            source_export_contract_id=line.source_export_contract_id,
            source_export_contract_no=line.source_export_contract_no,
            source_export_contract_line_id=line.source_export_contract_line_id,
            remark=line.remark,
        )

    def _source_link_response(
        self,
        link: PurchaseContractSourceLinkRow,
    ) -> PurchaseContractSourceLinkResponse:
        return PurchaseContractSourceLinkResponse(
            id=link.id,
            contract_id=link.contract_id,
            export_contract_id=link.export_contract_id,
            export_contract_no=link.export_contract_no,
            export_contract_line_id=link.export_contract_line_id,
            customer_name=link.customer_name,
            product_id=link.product_id,
            product_code=link.product_code,
            demand_quantity=link.demand_quantity,
            unit=link.unit,
        )

    def _reminder_response(
        self,
        reminder: PurchaseContractReminderRow,
    ) -> PurchaseContractReminderResponse:
        return PurchaseContractReminderResponse(
            id=reminder.id,
            contract_id=reminder.contract_id,
            reminder_type=reminder.reminder_type,
            title=reminder.title,
            due_date=reminder.due_date,
            amount=reminder.amount,
            currency=reminder.currency,
            status=reminder.status,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
