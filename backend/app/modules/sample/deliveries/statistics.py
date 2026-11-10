"""寄样单统计与导出。

从 ``SampleDeliveryService`` 抽出的报表能力，避免主服务文件超过行数红线。
"""

import csv
from datetime import date
from decimal import Decimal
from io import StringIO

from app.core.messages import localize_labels
from app.modules.sample.deliveries.repositories import (
    SampleDeliveryFeeStatisticRow,
    SampleDeliveryRepository,
)
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryCustomerStatisticResponse,
    SampleDeliveryExportResponse,
    SampleDeliveryExpressStatisticResponse,
    SampleDeliveryFeeStatisticResponse,
    SampleDeliveryFeeStatisticsResponse,
    SampleDeliveryResponse,
    SampleDeliveryStatisticsResponse,
    SampleDeliveryStatusStatisticResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class SampleDeliveryStatisticsMixin:
    _repository: SampleDeliveryRepository
    _data_scope_resolver: DataScopeResolver

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        raise NotImplementedError

    async def _delivery_response(self, delivery: object) -> SampleDeliveryResponse:
        raise NotImplementedError

    async def get_fee_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str | None,
        date_from: date | None,
        date_to: date | None,
        express_company: str | None,
    ) -> SampleDeliveryFeeStatisticsResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样费用统计日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows = await self._repository.get_fee_statistics(
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        total = Decimal("0")
        for row in rows:
            total += Decimal(row.total_amount)
        currency = rows[0].currency if rows else "USD"
        if any(row.currency != currency for row in rows):
            currency = "MIXED"
        return SampleDeliveryFeeStatisticsResponse(
            items=[self._fee_statistic_response(row) for row in rows],
            total_amount=self._money(total),
            currency=currency,
        )

    async def get_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        express_company: str | None,
    ) -> SampleDeliveryStatisticsResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样统计日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        by_status = await self._repository.get_status_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        by_customer = await self._repository.get_customer_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        by_express = await self._repository.get_express_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        total_deliveries = sum(row.delivery_count for row in by_status)
        total_quantity = sum((row.total_quantity for row in by_status), Decimal("0"))
        return SampleDeliveryStatisticsResponse(
            total_deliveries=total_deliveries,
            total_quantity=self._quantity(total_quantity),
            by_status=[
                SampleDeliveryStatusStatisticResponse(
                    status=row.status,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_status
            ],
            by_customer=[
                SampleDeliveryCustomerStatisticResponse(
                    customer_id=row.customer_id,
                    customer_name=row.customer_name,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_customer
            ],
            by_express=[
                SampleDeliveryExpressStatisticResponse(
                    express_company=row.express_company,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_express
            ],
        )

    async def export_deliveries(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        express_company: str | None,
    ) -> SampleDeliveryExportResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样导出日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        deliveries, total = await self._repository.list_deliveries(
            q=None,
            status=None,
            customer_id=customer_id,
            express_company=express_company,
            date_from=date_from,
            date_to=date_to,
            owner_user_ids=owner_user_ids,
            limit=500,
            offset=0,
        )
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(
            localize_labels(
                [
                    "寄样单号",
                    "寄样日期",
                    "状态",
                    "客户",
                    "收件方",
                    "快递公司",
                    "快递单号",
                    "报价单",
                    "样品编号",
                    "产品",
                    "数量",
                    "单位",
                    "费用合计",
                    "备注",
                ]
            )
        )
        for delivery in deliveries:
            response = await self._delivery_response(delivery)
            first_line = response.lines[0] if response.lines else None
            writer.writerow(
                [
                    response.code,
                    response.delivery_date.isoformat(),
                    response.status,
                    response.customer_name,
                    response.recipient_company or response.recipient_name,
                    response.express_company,
                    response.tracking_no or "",
                    response.quotation_no or "",
                    first_line.sample_code if first_line else "",
                    first_line.product_name if first_line else "",
                    first_line.quantity if first_line else "",
                    first_line.unit if first_line else "",
                    response.fee_total,
                    response.remark or "",
                ]
            )
        return SampleDeliveryExportResponse(
            filename=f"sample-deliveries-{current_user.id}.csv",
            content_type="text/csv",
            content=output.getvalue(),
            total=total,
        )

    def _fee_statistic_response(
        self,
        row: SampleDeliveryFeeStatisticRow,
    ) -> SampleDeliveryFeeStatisticResponse:
        return SampleDeliveryFeeStatisticResponse(
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            express_company=row.express_company,
            currency=row.currency,
            total_amount=row.total_amount,
            delivery_count=row.delivery_count,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
