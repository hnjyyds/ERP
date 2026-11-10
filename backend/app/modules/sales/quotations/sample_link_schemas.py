from datetime import date

from app.schemas.base import BaseModel


class QuotationSampleProgressResponse(BaseModel):
    stage: str
    status: str
    occurred_at: date
    note: str | None
    handler_name: str | None


class QuotationSampleRequestItem(BaseModel):
    id: str
    code: str
    request_date: date
    status: str
    requirements: str
    due_date: date | None
    destination: str
    latest_progress: QuotationSampleProgressResponse | None
    sample_record_id: str | None
    sample_record_code: str | None


class QuotationSampleRequestListResponse(BaseModel):
    items: list[QuotationSampleRequestItem]
    total: int
