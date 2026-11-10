"""报价 → 样品 → 寄样 存量数据回填。

只做确定性匹配：
- 寄样单按 ``quotation_no`` 与报价号精确匹配，回填 ``quotation_id``；
- 打样单 / 样品登记按客户、产品、供应商名称精确匹配主数据，回填空缺的 ID；
- 打样单的 ``quotation_id`` 一律留空（存量没有可靠的报价线索）。

默认只出报告（dry-run），加 ``--apply`` 才写库。重复执行是幂等的。

用法::

    uv run python migrations/backfill_sample_links.py --dry-run
    uv run python migrations/backfill_sample_links.py --apply
"""

import argparse
import asyncio
import csv
from collections import defaultdict
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.masterdata.customers.models import Customer
from app.modules.masterdata.products.models import Product
from app.modules.masterdata.suppliers.models import Supplier
from app.modules.sales.quotations.models import ExportQuotation
from app.modules.sample.deliveries.models import SampleDelivery
from app.modules.sample.records.models import SampleRecord
from app.modules.sample.requests.models import SampleRequest

DEFAULT_REPORT = (
    Path(__file__).resolve().parents[2]
    / "docs/specs/002-quotation-sample-contract-link/backfill-report.csv"
)
REPORT_FIELDS = (
    "table",
    "record_id",
    "code",
    "field",
    "raw_value",
    "candidate_count",
    "candidate_id",
    "reason",
)


class MatchIndex:
    """名称 → 候选 ID；同名多行视为无法确定。"""

    def __init__(self) -> None:
        self._values: dict[str, set[str]] = defaultdict(set)

    def add(self, value: str | None, record_id: str) -> None:
        if not value:
            return
        self._values[value.strip()].add(record_id)

    def resolve(self, value: str | None) -> tuple[str | None, int]:
        if not value:
            return None, 0
        candidates = self._values.get(value.strip(), set())
        if len(candidates) == 1:
            return next(iter(candidates)), 1
        return None, len(candidates)


async def _build_indexes(session) -> tuple[MatchIndex, MatchIndex, MatchIndex]:
    customers = MatchIndex()
    for customer in await session.scalars(select(Customer)):
        customers.add(customer.cn_name, customer.id)
        customers.add(customer.en_name, customer.id)
    products = MatchIndex()
    for product in await session.scalars(select(Product)):
        products.add(product.code, product.id)
        products.add(product.cn_name, product.id)
        products.add(product.en_name, product.id)
    suppliers = MatchIndex()
    for supplier in await session.scalars(select(Supplier)):
        suppliers.add(supplier.code, supplier.id)
        suppliers.add(supplier.cn_name, supplier.id)
        suppliers.add(supplier.en_name, supplier.id)
    return customers, products, suppliers


def _record(
    rows: list[dict[str, str]],
    *,
    table: str,
    record_id: str,
    code: str | None,
    field: str,
    raw_value: str | None,
    candidate_count: int,
    candidate_id: str | None,
) -> None:
    if candidate_id:
        reason = "matched"
    elif candidate_count == 0:
        reason = "no_match"
    else:
        reason = "ambiguous"
    rows.append(
        {
            "table": table,
            "record_id": record_id,
            "code": code or "",
            "field": field,
            "raw_value": raw_value or "",
            "candidate_count": str(candidate_count),
            "candidate_id": candidate_id or "",
            "reason": reason,
        }
    )


def _fill(
    *,
    rows: list[dict[str, str]],
    table: str,
    record_id: str,
    code: str | None,
    field: str,
    current: str | None,
    raw_value: str | None,
    index: MatchIndex,
) -> str | None:
    if current:
        return current
    if not raw_value:
        return None
    candidate_id, candidates = index.resolve(raw_value)
    _record(
        rows,
        table=table,
        record_id=record_id,
        code=code,
        field=field,
        raw_value=raw_value,
        candidate_count=candidates,
        candidate_id=candidate_id,
    )
    return candidate_id


async def run(*, apply: bool, report_path: Path) -> int:
    rows: list[dict[str, str]] = []
    async with SessionLocal() as session:
        customers, products, suppliers = await _build_indexes(session)

        for request in await session.scalars(select(SampleRequest)):
            request.customer_id = _fill(
                rows=rows,
                table="sample_requests",
                record_id=request.id,
                code=request.code,
                field="customer_id",
                current=request.customer_id,
                raw_value=request.customer_name,
                index=customers,
            )
            request.product_id = _fill(
                rows=rows,
                table="sample_requests",
                record_id=request.id,
                code=request.code,
                field="product_id",
                current=request.product_id,
                raw_value=request.product_name,
                index=products,
            )
            request.supplier_id = _fill(
                rows=rows,
                table="sample_requests",
                record_id=request.id,
                code=request.code,
                field="supplier_id",
                current=request.supplier_id,
                raw_value=request.supplier_name,
                index=suppliers,
            )

        for record in await session.scalars(select(SampleRecord)):
            record.customer_id = _fill(
                rows=rows,
                table="sample_records",
                record_id=record.id,
                code=record.code,
                field="customer_id",
                current=record.customer_id,
                raw_value=record.customer_name,
                index=customers,
            )
            record.product_id = _fill(
                rows=rows,
                table="sample_records",
                record_id=record.id,
                code=record.code,
                field="product_id",
                current=record.product_id,
                raw_value=record.product_name,
                index=products,
            )
            record.supplier_id = _fill(
                rows=rows,
                table="sample_records",
                record_id=record.id,
                code=record.code,
                field="supplier_id",
                current=record.supplier_id,
                raw_value=record.supplier_name,
                index=suppliers,
            )

        quotation_ids: dict[str, str] = {}
        for quotation in await session.scalars(select(ExportQuotation)):
            quotation_ids.setdefault(quotation.code, quotation.id)
        for delivery in await session.scalars(select(SampleDelivery)):
            if delivery.quotation_id or not delivery.quotation_no:
                continue
            matched = quotation_ids.get(delivery.quotation_no.strip())
            _record(
                rows,
                table="sample_deliveries",
                record_id=delivery.id,
                code=delivery.code,
                field="quotation_id",
                raw_value=delivery.quotation_no,
                candidate_count=1 if matched else 0,
                candidate_id=matched,
            )
            delivery.quotation_id = matched

        report_path.parent.mkdir(parents=True, exist_ok=True)
        with report_path.open("w", newline="", encoding="utf-8-sig") as handle:
            writer = csv.DictWriter(handle, fieldnames=REPORT_FIELDS)
            writer.writeheader()
            writer.writerows(rows)

        if apply:
            await session.commit()
        else:
            await session.rollback()

    matched = sum(1 for row in rows if row["reason"] == "matched")
    print(f"rows={len(rows)} matched={matched} report={report_path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只输出报告并回滚（默认行为，保留显式开关）",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="真正写库；不加时只输出报告并回滚",
    )
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    return asyncio.run(run(apply=args.apply and not args.dry_run, report_path=args.report))


if __name__ == "__main__":
    raise SystemExit(main())
