import csv
import json
from decimal import Decimal
from io import StringIO

from app.db.uow import UnitOfWork
from app.modules.sales.contracts.repositories import (
    ExportContractAdvancePaymentRow,
    ExportContractLineRow,
    ExportContractRepository,
    ExportContractRow,
    ExportContractSignatureRow,
)
from app.modules.sales.contracts.schemas import (
    VALID_CONTRACT_EXPORT_FORMATS,
    VALID_CONTRACT_STATUSES,
    ExportContractAdvancePaymentCreate,
    ExportContractAdvancePaymentResponse,
    ExportContractApprove,
    ExportContractCreate,
    ExportContractExportResponse,
    ExportContractLineResponse,
    ExportContractListResponse,
    ExportContractPurchaseStatusResponse,
    ExportContractResponse,
    ExportContractShipmentStatusResponse,
    ExportContractSignatureCreate,
    ExportContractSignatureResponse,
    ExportContractStatisticsResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse

CONTRACT_VIEW_ALL_PERMISSION = "sales:contract:view_all"


class PermissionDeniedError(Exception):
    pass


class ExportContractNotFoundError(Exception):
    pass


class ExportContractService:
    def __init__(
        self,
        repository: ExportContractRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def create_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        self._require(current_user, "sales:contract:edit")
        async with UnitOfWork(self._repository.session):
            contract = await self._repository.create_contract(
                code=payload.code,
                contract_date=payload.contract_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                currency=payload.currency,
                trade_term=payload.trade_term,
                planned_ship_date=payload.planned_ship_date,
                payment_terms=payload.payment_terms,
                source_quotation_id=payload.source_quotation_id,
                source_quotation_no=payload.source_quotation_no,
                remarks=payload.remarks,
                approval_status="draft",
                owner_user_id=current_user.id,
            )
            updated = await self._replace_lines(contract.id, payload)
            if updated is None:
                raise ExportContractNotFoundError
        return await self._contract_response(updated)

    async def update_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        self._require(current_user, "sales:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "draft":
            raise ValueError("只有草稿合同可以编辑")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_contract(
                contract_id=contract.id,
                code=payload.code,
                contract_date=payload.contract_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                currency=payload.currency,
                trade_term=payload.trade_term,
                planned_ship_date=payload.planned_ship_date,
                payment_terms=payload.payment_terms,
                source_quotation_id=payload.source_quotation_id,
                source_quotation_no=payload.source_quotation_no,
                remarks=payload.remarks,
            )
            if updated is None:
                raise ExportContractNotFoundError
            updated = await self._replace_lines(contract.id, payload)
            if updated is None:
                raise ExportContractNotFoundError
        return await self._contract_response(updated)

    async def list_contracts(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        approval_status: str | None,
        customer_id: str | None,
    ) -> ExportContractListResponse:
        self._require(current_user, "sales:contract:view")
        if approval_status is not None:
            self._validate_status(approval_status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=CONTRACT_VIEW_ALL_PERMISSION,
        )
        contracts, total = await self._repository.list_contracts(
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
            owner_user_ids=owner_user_ids,
        )
        return ExportContractListResponse(
            items=[await self._contract_response(contract) for contract in contracts],
            total=total,
        )

    async def get_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> ExportContractResponse:
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
    ) -> ExportContractResponse:
        self._require(current_user, "sales:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "draft":
            raise ValueError("只有草稿合同可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_contract(contract.id)
            if submitted is None:
                raise ExportContractNotFoundError
        return await self._contract_response(submitted)

    async def approve_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: ExportContractApprove,
    ) -> ExportContractResponse:
        self._require(current_user, "sales:contract:approve")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        if contract.approval_status != "submitted":
            raise ValueError("只有已提交合同可以审批")
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_contract(
                contract_id=contract.id,
                reviewer_name=payload.reviewer_name,
                approved_at=payload.approved_at,
            )
            if approved is None:
                raise ExportContractNotFoundError
            await self._repository.add_event(
                contract_id=approved.id,
                contract_no=approved.code,
                event_type="ExportContractApproved",
                payload=json.dumps(
                    {
                        "contract_id": approved.id,
                        "contract_no": approved.code,
                        "approved_at": payload.approved_at.isoformat(),
                    },
                    ensure_ascii=False,
                ),
            )
        return await self._contract_response(approved)

    async def register_signature(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: ExportContractSignatureCreate,
    ) -> ExportContractResponse:
        self._require(current_user, "sales:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        async with UnitOfWork(self._repository.session):
            await self._repository.add_signature(
                contract_id=contract.id,
                signed_by=payload.signed_by,
                signed_at=payload.signed_at,
                signature_method=payload.signature_method,
                file_no=payload.file_no,
                remark=payload.remark,
            )
            refreshed = await self._repository.get_contract(contract.id)
            if refreshed is None:
                raise ExportContractNotFoundError
        return await self._contract_response(refreshed)

    async def add_advance_payment(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        payload: ExportContractAdvancePaymentCreate,
    ) -> ExportContractAdvancePaymentResponse:
        self._require(current_user, "sales:contract:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        async with UnitOfWork(self._repository.session):
            payment = await self._repository.add_advance_payment(
                contract_id=contract.id,
                payment_no=payload.payment_no,
                received_at=payload.received_at,
                amount=payload.amount,
                currency=payload.currency,
                payer_name=payload.payer_name,
                remark=payload.remark,
            )
        return self._advance_payment_response(payment)

    async def export_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
        export_format: str,
    ) -> ExportContractExportResponse:
        self._require(current_user, "sales:contract:export")
        if export_format not in VALID_CONTRACT_EXPORT_FORMATS:
            raise ValueError("合同导出格式无效")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            contract_id=contract_id,
        )
        lines = await self._repository.list_lines(contract.id)
        if export_format == "pdf":
            return ExportContractExportResponse(
                filename=f"{contract.code}.pdf",
                content_type="application/pdf",
                content=self._render_text_export(contract, lines),
            )
        return ExportContractExportResponse(
            filename=f"{contract.code}.csv",
            content_type="text/csv",
            content=self._render_csv_export(contract, lines),
        )

    async def _replace_lines(
        self,
        contract_id: str,
        payload: ExportContractCreate,
    ) -> ExportContractRow | None:
        await self._repository.delete_lines(contract_id)
        for line in payload.lines:
            amount = line.quantity * line.unit_price
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
                amount=amount,
                purchased_quantity=line.purchased_quantity,
                shipped_quantity=line.shipped_quantity,
                image_url=line.image_url,
                remark=line.remark,
            )
        return await self._repository.refresh_statistics(contract_id)

    async def _get_accessible_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> ExportContractRow:
        self._require(current_user, "sales:contract:view")
        contract = await self._repository.get_contract(contract_id)
        if contract is None:
            raise ExportContractNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=CONTRACT_VIEW_ALL_PERMISSION,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise ExportContractNotFoundError
        return contract

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, approval_status: str) -> None:
        if approval_status not in VALID_CONTRACT_STATUSES:
            raise ValueError("合同审批状态无效")

    async def _contract_response(self, contract: ExportContractRow) -> ExportContractResponse:
        lines = await self._repository.list_lines(contract.id)
        signatures = await self._repository.list_signatures(contract.id)
        advance_payments = await self._repository.list_advance_payments(contract.id)
        return ExportContractResponse(
            id=contract.id,
            code=contract.code,
            contract_date=contract.contract_date,
            customer_id=contract.customer_id,
            customer_name=contract.customer_name,
            sales_user_id=contract.sales_user_id,
            sales_user_name=contract.sales_user_name,
            currency=contract.currency,
            trade_term=contract.trade_term,
            planned_ship_date=contract.planned_ship_date,
            payment_terms=contract.payment_terms,
            source_quotation_id=contract.source_quotation_id,
            source_quotation_no=contract.source_quotation_no,
            remarks=contract.remarks,
            approval_status=contract.approval_status,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            reviewer_name=contract.reviewer_name,
            signature_status=contract.signature_status,
            customer_signed_at=contract.customer_signed_at,
            owner_user_id=contract.owner_user_id,
            statistics=self._statistics_response(contract),
            lines=[self._line_response(line) for line in lines],
            signatures=[self._signature_response(signature) for signature in signatures],
            advance_payments=[
                self._advance_payment_response(payment) for payment in advance_payments
            ],
            purchase_statuses=[self._purchase_status_response(line) for line in lines],
            shipment_statuses=[
                self._shipment_status_response(contract, line) for line in lines
            ],
        )

    def _statistics_response(
        self,
        contract: ExportContractRow,
    ) -> ExportContractStatisticsResponse:
        return ExportContractStatisticsResponse(
            total_quantity=contract.total_quantity,
            total_amount=contract.total_amount,
            shipped_quantity=contract.shipped_quantity,
            shipped_amount=contract.shipped_amount,
            unshipped_quantity=contract.unshipped_quantity,
            unshipped_amount=contract.unshipped_amount,
            purchased_quantity=contract.purchased_quantity,
            unpurchased_quantity=contract.unpurchased_quantity,
            advance_payment_amount=contract.advance_payment_amount,
        )

    def _line_response(self, line: ExportContractLineRow) -> ExportContractLineResponse:
        return ExportContractLineResponse(
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
            purchased_quantity=self._quantity(line.purchased_quantity),
            unpurchased_quantity=line.unpurchased_quantity,
            shipped_quantity=self._quantity(line.shipped_quantity),
            unshipped_quantity=line.unshipped_quantity,
            shipped_amount=line.shipped_amount,
            unshipped_amount=line.unshipped_amount,
            image_url=line.image_url,
            remark=line.remark,
        )

    def _signature_response(
        self,
        signature: ExportContractSignatureRow,
    ) -> ExportContractSignatureResponse:
        return ExportContractSignatureResponse(
            id=signature.id,
            contract_id=signature.contract_id,
            signed_by=signature.signed_by,
            signed_at=signature.signed_at,
            signature_method=signature.signature_method,
            file_no=signature.file_no,
            remark=signature.remark,
        )

    def _advance_payment_response(
        self,
        payment: ExportContractAdvancePaymentRow,
    ) -> ExportContractAdvancePaymentResponse:
        return ExportContractAdvancePaymentResponse(
            id=payment.id,
            contract_id=payment.contract_id,
            payment_no=payment.payment_no,
            received_at=payment.received_at,
            amount=payment.amount,
            currency=payment.currency,
            payer_name=payment.payer_name,
            remark=payment.remark,
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

    def _render_text_export(
        self,
        contract: ExportContractRow,
        lines: list[ExportContractLineRow],
    ) -> str:
        rows = [
            "EXPORT CONTRACT",
            f"Contract No: {contract.code}",
            f"Customer: {contract.customer_name}",
            f"Trade Term: {contract.trade_term}",
            f"Planned Ship Date: {contract.planned_ship_date.isoformat()}",
            f"Total: {contract.currency} {contract.total_amount}",
            f"Signature: {contract.signature_status}",
        ]
        for line in lines:
            rows.append(
                f"{line.product_code or '-'} {line.product_name} "
                f"{self._quantity(line.quantity)} {line.unit} x {self._quantity(line.unit_price)}"
            )
        return "\n".join(rows)

    def _render_csv_export(
        self,
        contract: ExportContractRow,
        lines: list[ExportContractLineRow],
    ) -> str:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["contract_no", contract.code])
        writer.writerow(["customer", contract.customer_name])
        writer.writerow(["currency", contract.currency])
        writer.writerow([])
        writer.writerow(
            ["product_code", "product_name", "quantity", "unit", "unit_price", "amount"]
        )
        for line in lines:
            writer.writerow(
                [
                    line.product_code or "",
                    line.product_name,
                    self._quantity(line.quantity),
                    line.unit,
                    self._quantity(line.unit_price),
                    line.amount,
                ]
            )
        return output.getvalue()

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
