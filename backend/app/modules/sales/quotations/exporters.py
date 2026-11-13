import csv
from datetime import UTC, datetime
from decimal import Decimal
from io import StringIO

from app.core.csv_export import safe_cell
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
    writer.writerow(["quotation_no", safe_cell(quotation.code)])
    writer.writerow(["customer", safe_cell(quotation.customer_name)])
    writer.writerow(["currency", safe_cell(quotation.currency)])
    writer.writerow(["trade_term", safe_cell(quotation.trade_term)])
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
                safe_cell(line.product_code or ""),
                safe_cell(line.product_name),
                safe_cell(line.specification or ""),
                safe_cell(line.model or ""),
                format_quantity(line.quantity),
                safe_cell(line.unit),
                format_quantity(line.unit_price),
                line.amount,
                safe_cell(line.freight_method),
                line.freight_amount,
            ]
        )
    writer.writerow([])
    writer.writerow(["total", quotation.total_amount])
    return output.getvalue()
