"""打印单据的语言契约：HTML 与 Excel 模板按语言渲染静态文案。"""

from app.modules.system.printing.renderer import (
    ContractPrintData,
    PrintContact,
    SampleRequestPrintData,
    render_contract,
    render_sample_request,
)
from app.modules.system.printing.xls_templates import purchase_contract_template_filename

_CONTRACT = ContractPrintData(
    code="EC-2026-001",
    contract_date="2026-01-10",
    customer_name="Euro Home",
    currency="USD",
    trade_term="FOB Shanghai",
    planned_ship_date="2026-03-01",
    payment_terms="T/T",
    total_quantity="100",
    total_amount="1200.00",
    primary_contact=PrintContact(
        name="Anna Schmidt",
        title="Buyer",
        phone="+49-1",
        email="anna@example.com",
    ),
    lines=[],
)

_SAMPLE_REQUEST = SampleRequestPrintData(
    code="SR-2026-001",
    request_date="2026-01-10",
    customer_name="Euro Home",
    product_name="Eco Bag",
    supplier_name="Factory A",
    destination="In-house sampling",
    due_date="2026-02-01",
    requirements="Match the sample",
    sales_user_name="Demo",
    lines=[],
)


def test_contract_html_renders_english_labels() -> None:
    html = render_contract(_CONTRACT, "en-US")

    assert "SALES CONTRACT" in html
    assert "Customer and contact" in html
    assert "No product details" in html
    assert "Contract no." in html
    assert "客户与联系人" not in html


def test_contract_html_keeps_chinese_by_default() -> None:
    html = render_contract(_CONTRACT)

    assert "出口销售合同 SALES CONTRACT" in html
    assert "客户与联系人" in html
    assert "无商品明细" in html


def test_sample_request_html_renders_english_labels() -> None:
    html = render_sample_request(_SAMPLE_REQUEST, "en-US")

    assert "SAMPLE REQUEST" in html
    assert "Sampling information" in html
    assert "No sampling details" in html
    assert "打样信息" not in html


def test_purchase_contract_template_filename_follows_language() -> None:
    assert purchase_contract_template_filename("PC-2026-001") == "PC-2026-001-采购合同.xls"
    assert (
        purchase_contract_template_filename("PC-2026-001", "en-US")
        == "PC-2026-001-purchase-contract.xls"
    )
