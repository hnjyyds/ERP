from collections.abc import Iterator

from fastapi.routing import APIRoute

from app.api.v1.finance import router


def _finance_routes() -> Iterator[tuple[str, object]]:
    yield from _expanded_routes(router)


def _expanded_routes(source: object, prefix: str = "") -> Iterator[tuple[str, object]]:
    for route in getattr(source, "routes", []):
        original_router = getattr(route, "original_router", None)
        include_context = getattr(route, "include_context", None)
        if original_router is not None and include_context is not None:
            yield from _expanded_routes(original_router, prefix + include_context.prefix)
            continue

        if isinstance(route, APIRoute):
            yield prefix + route.path, route


def test_finance_router_keeps_existing_route_paths() -> None:
    paths = {path for path, _route in _finance_routes()}

    assert {
        "/finance/overview",
        "/finance/receipts",
        "/finance/receipts/{receipt_id}/claim",
        "/finance/receipts/{receipt_id}/allocations",
        "/finance/receivables",
        "/finance/supplier-invoices",
        "/finance/payment-requests",
        "/finance/payment-requests/{payment_request_id}/approve",
        "/finance/payables",
        "/finance/partner-fee-invoices",
        "/finance/fee-payment-requests",
        "/finance/fee-payment-requests/{fee_payment_request_id}/approve",
        "/finance/fee-payables",
        "/finance/misc-fee-items",
        "/finance/misc-fee-allocations",
        "/finance/misc-fee-allocations/summary",
        "/finance/settlements",
        "/finance/settlements/{settlement_id}/manual-costs",
        "/finance/profit-calculations",
        "/finance/verification-documents",
        "/finance/verification-documents/{verification_document_id}/customs-receipt",
        "/finance/verification-documents/{verification_document_id}/verify",
        "/finance/verification-documents/{verification_document_id}/tax-refunds",
        "/finance/verification-usage",
    }.issubset(paths)


def test_finance_router_routes_have_response_models() -> None:
    missing_response_models = [
        path
        for path, route in _finance_routes()
        if getattr(route, "response_model", None) is None
    ]

    assert missing_response_models == []
