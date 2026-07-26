"""Formatting helpers shared by finance report repository queries."""

from decimal import Decimal
from typing import Any

from app.modules.finance.reports.row_data import PaymentCurrencySummaryData


def payment_currency_summary(row: Any) -> PaymentCurrencySummaryData:
    row_currency, count, requested, approved, paid = row
    requested_amount = decimal_value(requested)
    paid_amount = decimal_value(paid)
    return PaymentCurrencySummaryData(
        currency=str(row_currency),
        request_count=int(count or 0),
        requested_amount=format_money(requested_amount),
        approved_amount=format_money(approved),
        paid_amount=format_money(paid_amount),
        outstanding_amount=format_money(requested_amount - paid_amount),
    )


def money(value: Decimal | int | str | None) -> str:
    return format_money(decimal_value(value))


def format_money(value: Decimal | int | str | None) -> str:
    return f"{decimal_value(value):.2f}"


def decimal_value(value: Decimal | int | str | None) -> Decimal:
    return Decimal(str(value or 0))
