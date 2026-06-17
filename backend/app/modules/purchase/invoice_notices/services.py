from collections import OrderedDict
from dataclasses import dataclass
from datetime import timedelta

from app.db.uow import UnitOfWork
from app.modules.purchase.invoice_notices.repositories import (
    PurchaseInvoiceNoticeLineRow,
    PurchaseInvoiceNoticeReminderRow,
    PurchaseInvoiceNoticeRepository,
    PurchaseInvoiceNoticeRow,
)
from app.modules.purchase.invoice_notices.schemas import (
    VALID_PURCHASE_INVOICE_NOTICE_STATUSES,
    PurchaseInvoiceNoticeGenerateFromDeclaration,
    PurchaseInvoiceNoticeLineCreate,
    PurchaseInvoiceNoticeLineResponse,
    PurchaseInvoiceNoticeListResponse,
    PurchaseInvoiceNoticeReceiveTaxInvoice,
    PurchaseInvoiceNoticeReminderListResponse,
    PurchaseInvoiceNoticeReminderResponse,
    PurchaseInvoiceNoticeResponse,
    PurchaseInvoiceNoticeSend,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse

PURCHASE_INVOICE_NOTICE_VIEW_ALL_PERMISSION = "purchase:invoice_notice:view_all"


class PermissionDeniedError(Exception):
    pass


class PurchaseInvoiceNoticeNotFoundError(Exception):
    pass


@dataclass
class _SupplierGroup:
    supplier_id: str | None
    supplier_name: str
    lines: list[PurchaseInvoiceNoticeLineCreate]


class PurchaseInvoiceNoticeService:
    def __init__(
        self,
        *,
        repository: PurchaseInvoiceNoticeRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def generate_from_customs_declaration(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PurchaseInvoiceNoticeGenerateFromDeclaration,
    ) -> PurchaseInvoiceNoticeListResponse:
        self._require(current_user, "purchase:invoice_notice:edit")
        groups = self._group_lines_by_supplier(payload.lines)
        generated: list[PurchaseInvoiceNoticeRow] = []
        async with UnitOfWork(self._repository.session):
            for index, group in enumerate(groups, start=1):
                notice = await self._repository.create_notice(
                    code=self._notice_code(payload.customs_declaration_no, index),
                    notice_date=payload.notice_date,
                    supplier_id=group.supplier_id,
                    supplier_name=group.supplier_name,
                    customs_declaration_id=payload.customs_declaration_id,
                    customs_declaration_no=payload.customs_declaration_no,
                    declaration_date=payload.declaration_date,
                    currency=payload.currency,
                    remarks=payload.remarks,
                    status="draft",
                    owner_user_id=current_user.id,
                )
                for line in group.lines:
                    await self._repository.add_line(
                        notice_id=notice.id,
                        purchase_contract_id=line.purchase_contract_id,
                        purchase_contract_no=line.purchase_contract_no,
                        product_id=line.product_id,
                        product_code=line.product_code,
                        product_name=line.product_name,
                        customs_name=line.customs_name,
                        invoice_name=line.invoice_name,
                        quantity=line.quantity,
                        unit=line.unit,
                        amount=line.amount,
                        currency=payload.currency,
                        remark=line.remark,
                    )
                refreshed = await self._repository.refresh_statistics(notice.id)
                if refreshed is None:
                    raise PurchaseInvoiceNoticeNotFoundError
                generated.append(refreshed)
        return PurchaseInvoiceNoticeListResponse(
            items=[await self._notice_response(item) for item in generated],
            total=len(generated),
        )

    async def list_notices(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        supplier_id: str | None,
        customs_declaration_id: str | None,
    ) -> PurchaseInvoiceNoticeListResponse:
        self._require(current_user, "purchase:invoice_notice:view")
        if status is not None:
            self._validate_status(status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=PURCHASE_INVOICE_NOTICE_VIEW_ALL_PERMISSION,
        )
        rows, total = await self._repository.list_notices(
            q=q,
            status=status,
            supplier_id=supplier_id,
            customs_declaration_id=customs_declaration_id,
            owner_user_ids=owner_user_ids,
        )
        return PurchaseInvoiceNoticeListResponse(
            items=[await self._notice_response(row) for row in rows],
            total=total,
        )

    async def get_notice(
        self,
        *,
        current_user: CurrentUserResponse,
        notice_id: str,
    ) -> PurchaseInvoiceNoticeResponse:
        notice = await self._get_accessible_notice(
            current_user=current_user,
            notice_id=notice_id,
        )
        return await self._notice_response(notice)

    async def send_notice(
        self,
        *,
        current_user: CurrentUserResponse,
        notice_id: str,
        payload: PurchaseInvoiceNoticeSend,
    ) -> PurchaseInvoiceNoticeResponse:
        self._require(current_user, "purchase:invoice_notice:send")
        notice = await self._get_accessible_notice(
            current_user=current_user,
            notice_id=notice_id,
        )
        if notice.status != "draft":
            raise ValueError("只有草稿开票通知可以发送")
        async with UnitOfWork(self._repository.session):
            sent = await self._repository.send_notice(
                notice_id=notice.id,
                sender_name=payload.sender_name,
                sent_at=payload.sent_at,
            )
            if sent is None:
                raise PurchaseInvoiceNoticeNotFoundError
            await self._repository.delete_reminders(sent.id)
            await self._repository.add_reminder(
                notice_id=sent.id,
                title=f"{sent.code} 税票催收提醒",
                due_date=payload.sent_at + timedelta(days=7),
                owner_user_id=sent.owner_user_id,
            )
        return await self._notice_response(sent)

    async def receive_tax_invoice(
        self,
        *,
        current_user: CurrentUserResponse,
        notice_id: str,
        payload: PurchaseInvoiceNoticeReceiveTaxInvoice,
    ) -> PurchaseInvoiceNoticeResponse:
        self._require(current_user, "purchase:invoice_notice:edit")
        notice = await self._get_accessible_notice(
            current_user=current_user,
            notice_id=notice_id,
        )
        if notice.status not in {"sent", "draft"}:
            raise ValueError("开票通知已完成收票")
        async with UnitOfWork(self._repository.session):
            received = await self._repository.receive_tax_invoice(
                notice_id=notice.id,
                tax_invoice_no=payload.tax_invoice_no,
                received_at=payload.received_at,
            )
            if received is None:
                raise PurchaseInvoiceNoticeNotFoundError
            await self._repository.close_reminders(received.id)
        return await self._notice_response(received)

    async def list_reminders(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> PurchaseInvoiceNoticeReminderListResponse:
        self._require(current_user, "purchase:invoice_notice:view")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=PURCHASE_INVOICE_NOTICE_VIEW_ALL_PERMISSION,
        )
        reminders = await self._repository.list_reminders(
            owner_user_ids=owner_user_ids,
        )
        return PurchaseInvoiceNoticeReminderListResponse(
            items=[self._reminder_response(row) for row in reminders],
            total=len(reminders),
        )

    async def _get_accessible_notice(
        self,
        *,
        current_user: CurrentUserResponse,
        notice_id: str,
    ) -> PurchaseInvoiceNoticeRow:
        self._require(current_user, "purchase:invoice_notice:view")
        notice = await self._repository.get_notice(notice_id)
        if notice is None:
            raise PurchaseInvoiceNoticeNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=PURCHASE_INVOICE_NOTICE_VIEW_ALL_PERMISSION,
        )
        if allowed_user_ids is not None and notice.owner_user_id not in allowed_user_ids:
            raise PurchaseInvoiceNoticeNotFoundError
        return notice

    def _group_lines_by_supplier(
        self,
        lines: list[PurchaseInvoiceNoticeLineCreate],
    ) -> list[_SupplierGroup]:
        groups: OrderedDict[tuple[str | None, str], _SupplierGroup] = OrderedDict()
        for line in lines:
            key = (line.supplier_id, line.supplier_name)
            if key not in groups:
                groups[key] = _SupplierGroup(
                    supplier_id=line.supplier_id,
                    supplier_name=line.supplier_name,
                    lines=[],
                )
            groups[key].lines.append(line)
        return list(groups.values())

    def _notice_code(self, customs_declaration_no: str, index: int) -> str:
        safe_no = customs_declaration_no.replace("/", "-").replace(" ", "-")
        return f"PIN-{safe_no}-{index:02d}"

    async def _notice_response(
        self,
        notice: PurchaseInvoiceNoticeRow,
    ) -> PurchaseInvoiceNoticeResponse:
        lines = await self._repository.list_lines(notice.id)
        reminders = await self._repository.list_reminders(notice_id=notice.id)
        return PurchaseInvoiceNoticeResponse(
            id=notice.id,
            code=notice.code,
            notice_date=notice.notice_date,
            supplier_id=notice.supplier_id,
            supplier_name=notice.supplier_name,
            customs_declaration_id=notice.customs_declaration_id,
            customs_declaration_no=notice.customs_declaration_no,
            declaration_date=notice.declaration_date,
            currency=notice.currency,
            remarks=notice.remarks,
            status=notice.status,
            sent_at=notice.sent_at,
            sender_name=notice.sender_name,
            tax_invoice_no=notice.tax_invoice_no,
            tax_invoice_received_at=notice.tax_invoice_received_at,
            total_quantity=notice.total_quantity,
            total_amount=notice.total_amount,
            owner_user_id=notice.owner_user_id,
            lines=[self._line_response(row) for row in lines],
            reminders=[self._reminder_response(row) for row in reminders],
        )

    def _line_response(
        self,
        line: PurchaseInvoiceNoticeLineRow,
    ) -> PurchaseInvoiceNoticeLineResponse:
        return PurchaseInvoiceNoticeLineResponse(
            id=line.id,
            notice_id=line.notice_id,
            purchase_contract_id=line.purchase_contract_id,
            purchase_contract_no=line.purchase_contract_no,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            customs_name=line.customs_name,
            invoice_name=line.invoice_name,
            quantity=line.quantity,
            unit=line.unit,
            amount=line.amount,
            currency=line.currency,
            remark=line.remark,
        )

    def _reminder_response(
        self,
        reminder: PurchaseInvoiceNoticeReminderRow,
    ) -> PurchaseInvoiceNoticeReminderResponse:
        return PurchaseInvoiceNoticeReminderResponse(
            id=reminder.id,
            notice_id=reminder.notice_id,
            title=reminder.title,
            due_date=reminder.due_date,
            status=reminder.status,
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, status: str) -> None:
        if status not in VALID_PURCHASE_INVOICE_NOTICE_STATUSES:
            raise ValueError("开票通知状态无效")
