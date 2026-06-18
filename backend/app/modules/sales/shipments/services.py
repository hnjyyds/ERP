from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.sales.contracts.repositories import (
    ExportContractLineRow,
    ExportContractRepository,
    ExportContractRow,
)
from app.modules.sales.contracts.schemas import (
    ExportContractPurchaseStatusResponse,
    ExportContractShipmentStatusResponse,
)
from app.modules.sales.shipments.repositories import (
    ShipmentLineRow,
    ShipmentPlanRepository,
    ShipmentPlanRow,
    ShipmentReminderRow,
)
from app.modules.sales.shipments.schemas import (
    VALID_SHIPMENT_STATUSES,
    ShipmentApprove,
    ShipmentContractProgressResponse,
    ShipmentFinanceOverviewResponse,
    ShipmentLineResponse,
    ShipmentPlanGenerate,
    ShipmentPlanListResponse,
    ShipmentPlanResponse,
    ShipmentReminderListResponse,
    ShipmentReminderResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ShipmentNotFoundError(Exception):
    pass


class ShipmentPlanService:
    def __init__(
        self,
        repository: ShipmentPlanRepository,
        contract_repository: ExportContractRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._contract_repository = contract_repository
        self._data_scope_resolver = data_scope_resolver

    async def generate_from_contracts(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ShipmentPlanGenerate,
    ) -> ShipmentPlanResponse:
        self._require(current_user, "sales:shipment:edit")
        selected = await self._load_contract_selections(current_user, payload)
        first_contract = selected[0][0]
        customer_id, customer_name = self._resolve_customer(selected)
        async with UnitOfWork(self._repository.session):
            plan = await self._repository.create_plan(
                code=payload.code,
                shipment_date=payload.shipment_date,
                planned_ship_date=payload.planned_ship_date,
                customer_id=customer_id,
                customer_name=customer_name,
                currency=first_contract.currency,
                shipping_method=payload.shipping_method,
                port_of_loading=payload.port_of_loading,
                port_of_destination=payload.port_of_destination,
                vessel_name=payload.vessel_name,
                container_no=payload.container_no,
                booking_no=payload.booking_no,
                document_owner_name=payload.document_owner_name,
                payable_amount=payload.estimated_payable_amount,
                remarks=payload.remarks,
                approval_status="draft",
                owner_user_id=current_user.id,
            )
            for contract, line, quantity in selected:
                await self._repository.add_line(
                    shipment_id=plan.id,
                    contract_id=contract.id,
                    contract_no=contract.code,
                    contract_line_id=line.id,
                    product_id=line.product_id,
                    product_code=line.product_code,
                    product_name=line.product_name,
                    specification=line.specification,
                    model=line.model,
                    quantity=quantity,
                    unit=line.unit,
                    unit_price=line.unit_price,
                    amount=quantity * line.unit_price,
                    planned_ship_date=contract.planned_ship_date,
                )
            refreshed = await self._repository.refresh_finance(plan.id)
            if refreshed is None:
                raise ShipmentNotFoundError
        return await self._shipment_response(refreshed)

    async def list_shipments(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        approval_status: str | None,
        customer_id: str | None,
        contract_id: str | None,
    ) -> ShipmentPlanListResponse:
        self._require(current_user, "sales:shipment:view")
        if approval_status is not None:
            self._validate_status(approval_status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        plans, total = await self._repository.list_plans(
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
            contract_id=contract_id,
            owner_user_ids=owner_user_ids,
        )
        return ShipmentPlanListResponse(
            items=[await self._shipment_response(plan) for plan in plans],
            total=total,
        )

    async def get_shipment(
        self,
        *,
        current_user: CurrentUserResponse,
        shipment_id: str,
    ) -> ShipmentPlanResponse:
        plan = await self._get_accessible_plan(
            current_user=current_user,
            shipment_id=shipment_id,
        )
        return await self._shipment_response(plan)

    async def submit_shipment(
        self,
        *,
        current_user: CurrentUserResponse,
        shipment_id: str,
    ) -> ShipmentPlanResponse:
        self._require(current_user, "sales:shipment:edit")
        plan = await self._get_accessible_plan(
            current_user=current_user,
            shipment_id=shipment_id,
        )
        if plan.approval_status != "draft":
            raise ValueError("只有草稿出货明细可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_plan(plan.id)
            if submitted is None:
                raise ShipmentNotFoundError
        return await self._shipment_response(submitted)

    async def approve_shipment(
        self,
        *,
        current_user: CurrentUserResponse,
        shipment_id: str,
        payload: ShipmentApprove,
    ) -> ShipmentPlanResponse:
        self._require(current_user, "sales:shipment:approve")
        plan = await self._get_accessible_plan(
            current_user=current_user,
            shipment_id=shipment_id,
        )
        if plan.approval_status != "submitted":
            raise ValueError("只有已提交出货明细可以审批")
        async with UnitOfWork(self._repository.session):
            lines = await self._repository.list_lines(plan.id)
            await self._validate_contract_capacity(lines)
            affected_contract_ids: list[str] = []
            for line in lines:
                await self._contract_repository.increase_line_shipped_quantity(
                    line_id=line.contract_line_id,
                    quantity=line.quantity,
                )
                if line.contract_id not in affected_contract_ids:
                    affected_contract_ids.append(line.contract_id)
            for contract_id in affected_contract_ids:
                await self._contract_repository.refresh_statistics(contract_id)
            approved = await self._repository.approve_plan(
                shipment_id=plan.id,
                reviewer_name=payload.reviewer_name,
                approved_at=payload.approved_at,
            )
            if approved is None:
                raise ShipmentNotFoundError
        return await self._shipment_response(approved)

    async def list_reminders(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> ShipmentReminderListResponse:
        self._require(current_user, "sales:shipment:view")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        reminders = await self._repository.list_reminders(
            owner_user_ids=owner_user_ids,
        )
        return ShipmentReminderListResponse(
            items=[self._reminder_response(reminder) for reminder in reminders],
            total=len(reminders),
        )

    async def _load_contract_selections(
        self,
        current_user: CurrentUserResponse,
        payload: ShipmentPlanGenerate,
    ) -> list[tuple[ExportContractRow, ExportContractLineRow, Decimal]]:
        selected: list[tuple[ExportContractRow, ExportContractLineRow, Decimal]] = []
        seen_contract_ids: set[str] = set()
        currency: str | None = None
        for selection in payload.selections:
            if selection.contract_id in seen_contract_ids:
                raise ValueError("同一合同不能重复选择")
            seen_contract_ids.add(selection.contract_id)
            contract = await self._get_accessible_contract(
                current_user=current_user,
                contract_id=selection.contract_id,
            )
            if contract.approval_status != "approved":
                raise ValueError("只能从已审批出口合同生成出货明细")
            if currency is not None and contract.currency != currency:
                raise ValueError("合并出运合同币种必须一致")
            currency = contract.currency
            line = await self._first_unshipped_line(contract.id)
            quantity = selection.quantity or self._unshipped_quantity(line)
            if quantity > self._unshipped_quantity(line):
                raise ValueError("出货数量不能超过合同未出货数量")
            selected.append((contract, line, quantity))
        return selected

    async def _get_accessible_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> ExportContractRow:
        contract = await self._contract_repository.get_contract(contract_id)
        if contract is None:
            raise ShipmentNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise ShipmentNotFoundError
        return contract

    async def _first_unshipped_line(self, contract_id: str) -> ExportContractLineRow:
        lines = await self._contract_repository.list_lines(contract_id)
        for line in lines:
            if self._unshipped_quantity(line) > 0:
                return line
        raise ValueError("合同没有可出货数量")

    async def _validate_contract_capacity(self, lines: list[ShipmentLineRow]) -> None:
        for line in lines:
            contract_lines = await self._contract_repository.list_lines(line.contract_id)
            current_line = next(
                (
                    contract_line
                    for contract_line in contract_lines
                    if contract_line.id == line.contract_line_id
                ),
                None,
            )
            if current_line is None:
                raise ShipmentNotFoundError
            if line.quantity > self._unshipped_quantity(current_line):
                raise ValueError("出货数量不能超过合同未出货数量")

    def _resolve_customer(
        self,
        selected: list[tuple[ExportContractRow, ExportContractLineRow, Decimal]],
    ) -> tuple[str | None, str]:
        customer_ids = {contract.customer_id for contract, _line, _quantity in selected}
        customer_names = {contract.customer_name for contract, _line, _quantity in selected}
        if len(customer_ids) == 1 and len(customer_names) == 1:
            contract = selected[0][0]
            return contract.customer_id, contract.customer_name
        return None, "多客户合并"

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        shipment_id: str,
    ) -> ShipmentPlanRow:
        self._require(current_user, "sales:shipment:view")
        plan = await self._repository.get_plan(shipment_id)
        if plan is None:
            raise ShipmentNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise ShipmentNotFoundError
        return plan

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, approval_status: str) -> None:
        if approval_status not in VALID_SHIPMENT_STATUSES:
            raise ValueError("出货审批状态无效")

    async def _shipment_response(self, plan: ShipmentPlanRow) -> ShipmentPlanResponse:
        lines = await self._repository.list_lines(plan.id)
        return ShipmentPlanResponse(
            id=plan.id,
            code=plan.code,
            shipment_date=plan.shipment_date,
            planned_ship_date=plan.planned_ship_date,
            customer_id=plan.customer_id,
            customer_name=plan.customer_name,
            currency=plan.currency,
            shipping_method=plan.shipping_method,
            port_of_loading=plan.port_of_loading,
            port_of_destination=plan.port_of_destination,
            vessel_name=plan.vessel_name,
            container_no=plan.container_no,
            booking_no=plan.booking_no,
            document_owner_name=plan.document_owner_name,
            approval_status=plan.approval_status,
            submitted_at=plan.submitted_at,
            approved_at=plan.approved_at,
            reviewer_name=plan.reviewer_name,
            remarks=plan.remarks,
            owner_user_id=plan.owner_user_id,
            finance_overview=self._finance_response(plan),
            reminder=self._plan_reminder_response(plan),
            lines=[self._line_response(line) for line in lines],
            contract_progresses=await self._contract_progresses(lines),
        )

    async def _contract_progresses(
        self,
        lines: list[ShipmentLineRow],
    ) -> list[ShipmentContractProgressResponse]:
        contract_ids: list[str] = []
        progresses: list[ShipmentContractProgressResponse] = []
        for line in lines:
            if line.contract_id in contract_ids:
                continue
            contract_ids.append(line.contract_id)
            contract = await self._contract_repository.get_contract(line.contract_id)
            if contract is None:
                continue
            contract_lines = await self._contract_repository.list_lines(contract.id)
            progresses.append(
                ShipmentContractProgressResponse(
                    contract_id=contract.id,
                    contract_no=contract.code,
                    purchase_statuses=[
                        self._purchase_status_response(contract_line)
                        for contract_line in contract_lines
                    ],
                    shipment_statuses=[
                        self._shipment_status_response(contract, contract_line)
                        for contract_line in contract_lines
                    ],
                )
            )
        return progresses

    def _finance_response(self, plan: ShipmentPlanRow) -> ShipmentFinanceOverviewResponse:
        return ShipmentFinanceOverviewResponse(
            receivable_amount=plan.receivable_amount,
            payable_amount=plan.payable_amount,
            profit_amount=plan.profit_amount,
            profit_rate=plan.profit_rate,
            currency=plan.currency,
        )

    def _plan_reminder_response(self, plan: ShipmentPlanRow) -> ShipmentReminderResponse:
        return ShipmentReminderResponse(
            shipment_id=plan.id,
            shipment_no=plan.code,
            reminder_date=plan.reminder_date,
            message=plan.reminder_message,
            status=plan.reminder_status,
        )

    def _reminder_response(self, reminder: ShipmentReminderRow) -> ShipmentReminderResponse:
        return ShipmentReminderResponse(
            shipment_id=reminder.shipment_id,
            shipment_no=reminder.shipment_no,
            reminder_date=reminder.reminder_date,
            message=reminder.message,
            status=reminder.status,
        )

    def _line_response(self, line: ShipmentLineRow) -> ShipmentLineResponse:
        return ShipmentLineResponse(
            id=line.id,
            shipment_id=line.shipment_id,
            contract_id=line.contract_id,
            contract_no=line.contract_no,
            contract_line_id=line.contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            unit_price=self._quantity(line.unit_price),
            amount=line.amount,
            planned_ship_date=line.planned_ship_date,
        )

    def _purchase_status_response(
        self,
        line: ExportContractLineRow,
    ) -> ExportContractPurchaseStatusResponse:
        return ExportContractPurchaseStatusResponse(
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            total_quantity=self._quantity(line.quantity),
            purchased_quantity=self._quantity(line.purchased_quantity),
            unpurchased_quantity=line.unpurchased_quantity,
            unit=line.unit,
            status=self._progress_status(line.quantity, line.purchased_quantity),
        )

    def _shipment_status_response(
        self,
        contract: ExportContractRow,
        line: ExportContractLineRow,
    ) -> ExportContractShipmentStatusResponse:
        return ExportContractShipmentStatusResponse(
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            planned_ship_date=contract.planned_ship_date,
            total_quantity=self._quantity(line.quantity),
            shipped_quantity=self._quantity(line.shipped_quantity),
            unshipped_quantity=line.unshipped_quantity,
            shipped_amount=line.shipped_amount,
            unshipped_amount=line.unshipped_amount,
            unit=line.unit,
            status=self._progress_status(line.quantity, line.shipped_quantity),
        )

    def _progress_status(self, total: Decimal, finished: Decimal) -> str:
        if finished == 0:
            return "pending"
        if finished >= total:
            return "completed"
        return "partial"

    def _unshipped_quantity(self, line: ExportContractLineRow) -> Decimal:
        return line.quantity - line.shipped_quantity

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
