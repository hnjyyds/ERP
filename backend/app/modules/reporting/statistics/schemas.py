from datetime import date

from pydantic import BaseModel, ConfigDict

VALID_REPORTING_STATUSES = ("draft", "submitted", "approved", "rejected")


class ReportingSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date_from: date | None
    date_to: date | None
    currency_label: str
    export_contract_count: int
    export_contract_amount: str
    purchase_contract_count: int
    purchase_contract_amount: str
    shipment_count: int
    shipment_receivable_amount: str
    shipment_profit_amount: str
    settlement_count: int
    settlement_gross_profit: str


class StatusAmountStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    status_label: str
    currency: str
    count: int
    amount: str
    source_path: str


class ReportDocumentStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_id: str
    document_no: str
    party_name: str
    business_user_name: str | None
    business_date: date
    status: str
    status_label: str
    amount: str
    currency: str
    source_path: str


class CustomerShipmentStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: str | None
    customer_name: str
    currency: str
    shipment_count: int
    receivable_amount: str
    profit_amount: str
    source_path: str


class SalesMonthlyShipmentStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    period: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    shipment_count: int
    shipped_amount: str
    source_path: str


class ShipmentStatisticItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shipment_id: str
    shipment_no: str
    customer_name: str
    shipment_date: date
    status: str
    status_label: str
    receivable_amount: str
    profit_amount: str
    currency: str
    source_path: str


class ReportingStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: ReportingSummaryResponse
    export_contract_statuses: list[StatusAmountStatisticResponse]
    purchase_contract_statuses: list[StatusAmountStatisticResponse]
    export_contract_items: list[ReportDocumentStatisticResponse]
    purchase_contract_items: list[ReportDocumentStatisticResponse]
    customer_shipments: list[CustomerShipmentStatisticResponse]
    sales_monthly_shipments: list[SalesMonthlyShipmentStatisticResponse]
    shipment_items: list[ShipmentStatisticItemResponse]
