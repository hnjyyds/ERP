from collections import defaultdict
from collections.abc import Iterable
from datetime import date
from decimal import Decimal

from app.modules.reporting.statistics.repositories import (
    ContractStatisticRow,
    SalesShipmentLineStatisticRow,
    SettlementStatisticRow,
    ShipmentStatisticRow,
    StatisticsQueryRepository,
)
from app.modules.reporting.statistics.schemas import (
    VALID_REPORTING_STATUSES,
    CustomerShipmentStatisticResponse,
    ReportDocumentStatisticResponse,
    ReportingStatisticsResponse,
    ReportingSummaryResponse,
    SalesMonthlyShipmentStatisticResponse,
    ShipmentStatisticItemResponse,
    StatusAmountStatisticResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ReportingStatisticsService:
    def __init__(self, repository: StatisticsQueryRepository) -> None:
        self._repository = repository

    async def get_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        supplier_id: str | None,
        sales_user_id: str | None,
        approval_status: str | None,
    ) -> ReportingStatisticsResponse:
        self._require_reporting(current_user)
        self._validate_date_range(date_from, date_to)
        self._validate_status(approval_status)

        export_contracts = await self._repository.list_export_contracts(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            sales_user_id=sales_user_id,
            approval_status=approval_status,
        )
        purchase_contracts = await self._repository.list_purchase_contracts(
            date_from=date_from,
            date_to=date_to,
            supplier_id=supplier_id,
            approval_status=approval_status,
        )
        shipments = await self._repository.list_shipments(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            approval_status=approval_status,
            sales_user_id=sales_user_id,
        )
        sales_shipment_lines = await self._repository.list_sales_shipment_lines(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            approval_status=approval_status,
            sales_user_id=sales_user_id,
        )
        settlements = await self._repository.list_settlements(
            date_from=date_from,
            date_to=date_to,
        )

        currencies = self._currencies(
            export_contracts=export_contracts,
            purchase_contracts=purchase_contracts,
            shipments=shipments,
            settlements=settlements,
        )
        return ReportingStatisticsResponse(
            summary=ReportingSummaryResponse(
                date_from=date_from,
                date_to=date_to,
                currency_label=self._currency_label(currencies),
                export_contract_count=len(export_contracts),
                export_contract_amount=self._sum_money(row.amount for row in export_contracts),
                purchase_contract_count=len(purchase_contracts),
                purchase_contract_amount=self._sum_money(row.amount for row in purchase_contracts),
                shipment_count=len(shipments),
                shipment_receivable_amount=self._sum_money(
                    row.receivable_amount for row in shipments
                ),
                shipment_profit_amount=self._sum_money(row.profit_amount for row in shipments),
                settlement_count=len(settlements),
                settlement_gross_profit=self._sum_money(row.gross_profit for row in settlements),
            ),
            export_contract_statuses=self._contract_statuses(
                export_contracts,
                source_base="/sales/contracts",
            ),
            purchase_contract_statuses=self._contract_statuses(
                purchase_contracts,
                source_base="/purchase/contracts",
            ),
            export_contract_items=[self._document_item(row) for row in export_contracts],
            purchase_contract_items=[self._document_item(row) for row in purchase_contracts],
            customer_shipments=self._customer_shipments(shipments),
            sales_monthly_shipments=self._sales_monthly_shipments(sales_shipment_lines),
            shipment_items=[self._shipment_item(row) for row in shipments],
        )

    def _contract_statuses(
        self,
        rows: list[ContractStatisticRow],
        *,
        source_base: str,
    ) -> list[StatusAmountStatisticResponse]:
        grouped: dict[tuple[str, str], list[ContractStatisticRow]] = defaultdict(list)
        for row in rows:
            grouped[(row.status, row.currency)].append(row)
        return [
            StatusAmountStatisticResponse(
                status=status,
                status_label=self._status_label(status),
                currency=currency,
                count=len(items),
                amount=self._sum_money(item.amount for item in items),
                source_path=f"{source_base}?approval_status={status}",
            )
            for (status, currency), items in sorted(grouped.items())
        ]

    def _document_item(self, row: ContractStatisticRow) -> ReportDocumentStatisticResponse:
        return ReportDocumentStatisticResponse(
            document_id=row.document_id,
            document_no=row.document_no,
            party_name=row.party_name,
            business_user_name=row.business_user_name,
            business_date=row.business_date,
            status=row.status,
            status_label=self._status_label(row.status),
            amount=row.amount,
            currency=row.currency,
            source_path=row.source_path,
        )

    def _customer_shipments(
        self,
        rows: list[ShipmentStatisticRow],
    ) -> list[CustomerShipmentStatisticResponse]:
        grouped: dict[tuple[str | None, str, str], list[ShipmentStatisticRow]] = defaultdict(list)
        for row in rows:
            grouped[(row.customer_id, row.customer_name, row.currency)].append(row)
        responses: list[CustomerShipmentStatisticResponse] = []
        for (customer_id, customer_name, currency), items in sorted(
            grouped.items(),
            key=lambda item: item[0][1],
        ):
            source_path = "/sales/shipments"
            if customer_id:
                source_path = f"{source_path}?customer_id={customer_id}"
            responses.append(
                CustomerShipmentStatisticResponse(
                    customer_id=customer_id,
                    customer_name=customer_name,
                    currency=currency,
                    shipment_count=len({item.shipment_id for item in items}),
                    receivable_amount=self._sum_money(item.receivable_amount for item in items),
                    profit_amount=self._sum_money(item.profit_amount for item in items),
                    source_path=source_path,
                )
            )
        return responses

    def _sales_monthly_shipments(
        self,
        rows: list[SalesShipmentLineStatisticRow],
    ) -> list[SalesMonthlyShipmentStatisticResponse]:
        grouped: dict[
            tuple[str, str | None, str | None, str],
            list[SalesShipmentLineStatisticRow],
        ] = defaultdict(list)
        for row in rows:
            grouped[(row.period, row.sales_user_id, row.sales_user_name, row.currency)].append(row)
        responses: list[SalesMonthlyShipmentStatisticResponse] = []
        for (period, sales_user_id, sales_user_name, currency), items in sorted(grouped.items()):
            source_path = f"/sales/shipments?period={period}"
            if sales_user_id:
                source_path = f"/sales/shipments?sales_user_id={sales_user_id}&period={period}"
            responses.append(
                SalesMonthlyShipmentStatisticResponse(
                    period=period,
                    sales_user_id=sales_user_id,
                    sales_user_name=sales_user_name,
                    currency=currency,
                    shipment_count=len({item.shipment_id for item in items}),
                    shipped_amount=self._sum_money(item.amount for item in items),
                    source_path=source_path,
                )
            )
        return responses

    def _shipment_item(self, row: ShipmentStatisticRow) -> ShipmentStatisticItemResponse:
        return ShipmentStatisticItemResponse(
            shipment_id=row.shipment_id,
            shipment_no=row.shipment_no,
            customer_name=row.customer_name,
            shipment_date=row.shipment_date,
            status=row.status,
            status_label=self._status_label(row.status),
            receivable_amount=row.receivable_amount,
            profit_amount=row.profit_amount,
            currency=row.currency,
            source_path=row.source_path,
        )

    def _validate_date_range(self, date_from: date | None, date_to: date | None) -> None:
        if date_from is not None and date_to is not None and date_from > date_to:
            raise ValueError("开始日期不能晚于结束日期")

    def _validate_status(self, approval_status: str | None) -> None:
        if approval_status is not None and approval_status not in VALID_REPORTING_STATUSES:
            raise ValueError("审批状态无效")

    def _require_reporting(self, current_user: CurrentUserResponse) -> None:
        if "reporting:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _status_label(self, status: str) -> str:
        labels = {
            "draft": "草稿",
            "submitted": "待审批",
            "approved": "已审批",
            "rejected": "已退回",
        }
        return labels.get(status, status)

    def _currencies(
        self,
        *,
        export_contracts: list[ContractStatisticRow],
        purchase_contracts: list[ContractStatisticRow],
        shipments: list[ShipmentStatisticRow],
        settlements: list[SettlementStatisticRow],
    ) -> set[str]:
        currencies: set[str] = set()
        for export_contract in export_contracts:
            currencies.add(export_contract.currency)
        for purchase_contract in purchase_contracts:
            currencies.add(purchase_contract.currency)
        for shipment in shipments:
            currencies.add(shipment.currency)
        for settlement in settlements:
            currencies.add(settlement.currency)
        return currencies

    def _currency_label(self, currencies: set[str]) -> str:
        if not currencies:
            return "-"
        if len(currencies) == 1:
            return next(iter(currencies))
        return "多币种"

    def _sum_money(self, values: Iterable[str]) -> str:
        total = Decimal("0")
        for value in values:
            total += Decimal(str(value or 0))
        return f"{total:.2f}"
