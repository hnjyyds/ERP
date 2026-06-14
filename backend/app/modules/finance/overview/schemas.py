from datetime import date

from pydantic import BaseModel, ConfigDict


class FinanceOverviewSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shipment_count: int
    currency_label: str
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str
    invoice_notice_count: int
    invoice_notice_amount: str
    sample_fee_count: int
    sample_fee_amount: str
    partner_count: int
    active_partner_count: int


class FinanceCurrencySummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    shipment_count: int
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str


class FinanceStatusAmountResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    currency: str
    count: int
    amount: str


class FinancePartnerTypeSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partner_type: str
    count: int


class FinanceShipmentProfitResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    shipment_date: date
    planned_ship_date: date
    customer_name: str
    currency: str
    approval_status: str
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str


class FinanceOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: FinanceOverviewSummaryResponse
    currency_summaries: list[FinanceCurrencySummaryResponse]
    invoice_notice_statuses: list[FinanceStatusAmountResponse]
    sample_fee_statuses: list[FinanceStatusAmountResponse]
    partner_type_summaries: list[FinancePartnerTypeSummaryResponse]
    shipment_profit_items: list[FinanceShipmentProfitResponse]
