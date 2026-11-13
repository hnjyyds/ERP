"""Offline only: fake repository, no server or database, harmless CSV cell '=1+1'."""
import asyncio
import csv
from io import StringIO
from types import SimpleNamespace
from unittest.mock import AsyncMock
import socket
import sqlite3
import pytest
from app.modules.masterdata.products.services import ProductService
from app.core.pagination import Pagination, start_pagination_context, reset_pagination_context, resolve_limit

@pytest.fixture(autouse=True)
def no_external_io(monkeypatch):
    def denied(*args, **kwargs):
        raise AssertionError('AUDIT: network/database access forbidden')
    monkeypatch.setattr(socket.socket, 'connect', denied)
    monkeypatch.setattr(sqlite3, 'connect', denied)

def product(name='QA offline'):
    return SimpleNamespace(code='QA-OFFLINE', cn_name=name, en_name='Offline only', customs_code='1234', tax_rate='0.13', rebate_rate='0.09', unit='pcs')

def export(repo):
    user=SimpleNamespace(permissions=['masterdata:product:export'])
    return asyncio.run(ProductService(repo, None).export_products(current_user=user))

def test_csv_text_cell_must_not_be_interpreted_as_formula():
    repo=SimpleNamespace(list_products=AsyncMock(return_value=([product('=1+1')], 1)))
    result=export(repo)
    rows=list(csv.reader(StringIO(result.content)))
    assert not rows[1][1].startswith('='), 'CSV text cell retains a formula prefix'

@pytest.mark.parametrize(('total', 'http_limit'), [(10001, None), (51, 50)])
def test_export_all_must_not_silently_drop_records(total, http_limit):
    async def rows(limit):
        effective = resolve_limit(limit)
        return [product()] * min(effective, total), total
    token = start_pagination_context(Pagination(limit=http_limit, offset=0)) if http_limit else None
    try:
        result = export(SimpleNamespace(list_products=rows))
    finally:
        if token is not None:
            reset_pagination_context(token)
    exported = len(list(csv.reader(StringIO(result.content)))) - 1
    assert exported == total, f'export all returned {exported} of {total} rows'
