"""报价 ↔ 打样 / 寄样 关联视图。

从 ``ExportQuotationService`` 抽出的关联查询，保持主服务文件在行数红线内。
"""

from app.modules.sales.quotations.repositories import (
    ExportQuotationRepository,
    ExportQuotationRow,
)
from app.modules.sales.quotations.sample_link_schemas import (
    QuotationSampleProgressResponse,
    QuotationSampleRequestItem,
    QuotationSampleRequestListResponse,
)
from app.modules.sales.quotations.sample_responses import build_sample_delivery_response
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.sample.deliveries.schemas import SampleDeliveryListResponse
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.system.auth.schemas import CurrentUserResponse


class QuotationSampleLinksMixin:
    _repository: ExportQuotationRepository
    _sample_delivery_repository: SampleDeliveryRepository

    async def _get_accessible_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> ExportQuotationRow:
        raise NotImplementedError

    async def get_sample_deliveries(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> SampleDeliveryListResponse:
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        deliveries, total = await self._sample_delivery_repository.list_by_quotation_id(
            quotation.id,
        )
        return SampleDeliveryListResponse(
            items=[
                await build_sample_delivery_response(delivery, self._sample_delivery_repository)
                for delivery in deliveries
            ],
            total=total,
        )

    async def get_sample_requests(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> QuotationSampleRequestListResponse:
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        request_repository = SampleRequestRepository(self._repository.session)
        record_repository = SampleRecordRepository(self._repository.session)
        requests = await request_repository.list_by_quotation_id(quotation.id)
        items: list[QuotationSampleRequestItem] = []
        for request in requests:
            progress_events = await request_repository.list_progress(request.id)
            latest = progress_events[0] if progress_events else None
            record = await record_repository.get_record_by_source(
                source_type="sample_request",
                source_id=request.id,
            )
            items.append(
                QuotationSampleRequestItem(
                    id=request.id,
                    code=request.code,
                    request_date=request.request_date,
                    status=request.status,
                    requirements=request.requirements,
                    due_date=request.due_date,
                    destination=request.destination,
                    latest_progress=(
                        QuotationSampleProgressResponse(
                            stage=latest.stage,
                            status=latest.status,
                            occurred_at=latest.occurred_at,
                            note=latest.note,
                            handler_name=latest.handler_name,
                        )
                        if latest is not None
                        else None
                    ),
                    sample_record_id=record.id if record is not None else None,
                    sample_record_code=record.code if record is not None else None,
                )
            )
        return QuotationSampleRequestListResponse(items=items, total=len(items))
