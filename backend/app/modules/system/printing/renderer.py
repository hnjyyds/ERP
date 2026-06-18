"""单据打印 HTML 渲染（无第三方依赖）。

PDF §1.5.2.2/§1.5.2.3：主联系人信息默认自动调入单据打印格式。渲染器接收
已组装好的单据数据（含 primary_contact），输出可在浏览器打印为 PDF 的 HTML。
"""

from dataclasses import dataclass
from html import escape


@dataclass(frozen=True)
class PrintContact:
    name: str
    title: str | None
    email: str | None
    phone: str | None


@dataclass(frozen=True)
class PrintLine:
    product_code: str
    product_name: str
    specification: str
    quantity: str
    unit: str
    unit_price: str
    amount: str


@dataclass(frozen=True)
class ContractPrintData:
    code: str
    contract_date: str
    customer_name: str
    currency: str
    trade_term: str
    planned_ship_date: str
    payment_terms: str
    total_quantity: str
    total_amount: str
    primary_contact: PrintContact | None
    lines: list[PrintLine]


@dataclass(frozen=True)
class SampleRequestPrintData:
    code: str
    request_date: str
    customer_name: str
    product_name: str
    supplier_name: str
    destination: str
    due_date: str
    requirements: str
    sales_user_name: str
    lines: list["SampleRequestPrintLine"]


@dataclass(frozen=True)
class SampleRequestPrintLine:
    product_code: str
    product_name: str
    specification: str
    quantity: str
    unit: str
    requirement: str


_STYLE = """
body { font-family: "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
       color: #1f2933; margin: 32px; }
h1 { font-size: 22px; margin-bottom: 4px; }
.meta { color: #52606d; font-size: 13px; margin-bottom: 16px; }
table { border-collapse: collapse; width: 100%; margin-top: 12px; }
th, td { border: 1px solid #cbd2d9; padding: 6px 8px; font-size: 13px; text-align: left; }
th { background: #f5f7fa; }
.section-title { font-size: 15px; font-weight: 600; margin-top: 20px; }
.contact-box { border: 1px solid #cbd2d9; padding: 10px 12px; border-radius: 6px;
               background: #fafbfc; font-size: 13px; display: inline-block; min-width: 280px; }
.totals { margin-top: 12px; font-size: 14px; font-weight: 600; }
"""


def render_contract(data: ContractPrintData) -> str:
    rows = "".join(
        f"<tr><td>{escape(line.product_code)}</td>"
        f"<td>{escape(line.product_name)}</td>"
        f"<td>{escape(line.specification)}</td>"
        f"<td>{escape(line.quantity)} {escape(line.unit)}</td>"
        f"<td>{escape(line.unit_price)}</td>"
        f"<td>{escape(line.amount)}</td></tr>"
        for line in data.lines
    )
    if not rows:
        rows = '<tr><td colspan="6">无商品明细</td></tr>'
    contact_html = _render_contact(data.primary_contact)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>出口合同 {escape(data.code)}</title>
<style>{_STYLE}</style>
</head>
<body>
<h1>出口销售合同 SALES CONTRACT</h1>
<div class="meta">合同号 {escape(data.code)} ｜ 签订日期 {escape(data.contract_date)}</div>

<div class="section-title">客户与联系人</div>
<div>客户：{escape(data.customer_name)}</div>
{contact_html}

<div class="section-title">合同条款</div>
<table>
  <tr><th>币种</th><td>{escape(data.currency)}</td>
      <th>贸易条款</th><td>{escape(data.trade_term)}</td></tr>
  <tr><th>预计出运</th><td>{escape(data.planned_ship_date)}</td>
      <th>付款方式</th><td>{escape(data.payment_terms)}</td></tr>
</table>

<div class="section-title">商品明细</div>
<table>
  <thead>
    <tr><th>商品编号</th><th>品名</th><th>规格</th><th>数量</th><th>单价</th><th>金额</th></tr>
  </thead>
  <tbody>{rows}</tbody>
</table>

<div class="totals">总数量：{escape(data.total_quantity)}　总金额：
{escape(data.currency)} {escape(data.total_amount)}</div>
</body>
</html>"""


def render_sample_request(data: SampleRequestPrintData) -> str:
    rows = "".join(
        f"<tr><td>{escape(line.product_code)}</td>"
        f"<td>{escape(line.product_name)}</td>"
        f"<td>{escape(line.specification)}</td>"
        f"<td>{escape(line.quantity)} {escape(line.unit)}</td>"
        f"<td colspan=\"2\">{escape(line.requirement)}</td></tr>"
        for line in data.lines
    )
    if not rows:
        rows = '<tr><td colspan="6">无打样明细</td></tr>'
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>内部打样单 {escape(data.code)}</title>
<style>{_STYLE}</style>
</head>
<body>
<h1>内部打样单 SAMPLE REQUEST</h1>
<div class="meta">打样单号 {escape(data.code)} ｜ 打样日期 {escape(data.request_date)}</div>

<div class="section-title">打样信息</div>
<table>
  <tr><th>客户</th><td>{escape(data.customer_name)}</td>
      <th>产品</th><td>{escape(data.product_name)}</td></tr>
  <tr><th>供应商/打样方</th><td>{escape(data.supplier_name)}</td>
      <th>打样去向</th><td>{escape(data.destination)}</td></tr>
  <tr><th>要求完成</th><td>{escape(data.due_date)}</td>
      <th>业务员</th><td>{escape(data.sales_user_name)}</td></tr>
</table>

<div class="section-title">客户打样要求</div>
<div class="contact-box">{escape(data.requirements)}</div>

<div class="section-title">内部打样单明细</div>
<table>
  <thead>
    <tr><th>商品编号</th><th>品名</th><th>规格</th><th>数量</th><th colspan="2">要求</th></tr>
  </thead>
  <tbody>{rows}</tbody>
</table>
</body>
</html>"""


def _render_contact(contact: PrintContact | None) -> str:
    if contact is None:
        return '<div class="contact-box">未维护主联系人</div>'
    parts = [f"<strong>{escape(contact.name)}</strong>"]
    if contact.title:
        parts.append(f"职务：{escape(contact.title)}")
    if contact.phone:
        parts.append(f"电话：{escape(contact.phone)}")
    if contact.email:
        parts.append(f"邮箱：{escape(contact.email)}")
    return '<div class="contact-box">' + "<br/>".join(parts) + "</div>"
