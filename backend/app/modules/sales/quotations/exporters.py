import csv
from datetime import UTC, datetime
from decimal import Decimal
from io import StringIO

from app.modules.sales.quotations.repositories import ExportQuotationLineRow, ExportQuotationRow


def format_quantity(value: Decimal) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".")


def render_text_export(
    quotation: ExportQuotationRow,
    lines: list[ExportQuotationLineRow],
) -> str:
    details = "\n".join(
        f"{line.product_code or ''} {line.product_name} {format_quantity(line.quantity)}"
        f" {line.unit} x {format_quantity(line.unit_price)}"
        for line in lines
    )
    return (
        f"EXPORT QUOTATION\n"
        f"Quotation No: {quotation.code}\n"
        f"Customer: {quotation.customer_name}\n"
        f"Trade Term: {quotation.trade_term}\n"
        f"Total: {quotation.currency} {quotation.total_amount}\n"
        f"Generated At: {datetime.now(UTC).isoformat()}\n"
        f"{details}\n"
    )


def render_csv_export(
    quotation: ExportQuotationRow,
    lines: list[ExportQuotationLineRow],
) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["quotation_no", quotation.code])
    writer.writerow(["customer", quotation.customer_name])
    writer.writerow(["currency", quotation.currency])
    writer.writerow(["trade_term", quotation.trade_term])
    writer.writerow([])
    writer.writerow(
        [
            "product_code",
            "product_name",
            "specification",
            "model",
            "quantity",
            "unit",
            "unit_price",
            "amount",
            "freight_method",
            "freight_amount",
        ]
    )
    for line in lines:
        writer.writerow(
            [
                line.product_code or "",
                line.product_name,
                line.specification or "",
                line.model or "",
                format_quantity(line.quantity),
                line.unit,
                format_quantity(line.unit_price),
                line.amount,
                line.freight_method,
                line.freight_amount,
            ]
        )
    writer.writerow([])
    writer.writerow(["total", quotation.total_amount])
    return output.getvalue()
