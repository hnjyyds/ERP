"""单据打印 HTML 渲染（无第三方依赖）。

PDF §1.5.2.2/§1.5.2.3：主联系人信息默认自动调入单据打印格式。渲染器接收
已组装好的单据数据（含 primary_contact），输出可在浏览器打印为 PDF 的 HTML。
"""

from dataclasses import dataclass
from html import escape

from app.core.language import DEFAULT_LANGUAGE, get_current_language
from app.core.messages import localize_message


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


def render_contract(data: ContractPrintData, language: str | None = None) -> str:
    resolved = language or get_current_language()
    is_english = resolved != DEFAULT_LANGUAGE
    separator = ": " if is_english else "："
    meta_separator = " | " if is_english else " ｜ "
    spacing = "  " if is_english else "　"

    def label(text: str) -> str:
        return localize_message(text, resolved)

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
        rows = f'<tr><td colspan="6">{label("无商品明细")}</td></tr>'
    contact_html = _render_contact(data.primary_contact, resolved)
    return f"""<!DOCTYPE html>
<html lang="{'en' if is_english else 'zh-CN'}">
<head>
<meta charset="utf-8" />
<title>{label("出口合同")} {escape(data.code)}</title>
<style>{_STYLE}</style>
</head>
<body>
<h1>{label("出口销售合同") if is_english else "出口销售合同 SALES CONTRACT"}</h1>
<div class="meta">{label("合同号")} {escape(data.code)}{meta_separator}
{label("签订日期")} {escape(data.contract_date)}</div>

<div class="section-title">{label("客户与联系人")}</div>
<div>{label("客户")}{separator}{escape(data.customer_name)}</div>
{contact_html}

<div class="section-title">{label("合同条款")}</div>
<table>
  <tr><th>{label("币种")}</th><td>{escape(data.currency)}</td>
      <th>{label("贸易条款")}</th><td>{escape(data.trade_term)}</td></tr>
  <tr><th>{label("预计出运")}</th><td>{escape(data.planned_ship_date)}</td>
      <th>{label("付款方式")}</th><td>{escape(data.payment_terms)}</td></tr>
</table>

<div class="section-title">{label("商品明细")}</div>
<table>
  <thead>
    <tr><th>{label("商品编号")}</th><th>{label("品名")}</th><th>{label("规格")}</th>
        <th>{label("数量")}</th><th>{label("单价")}</th><th>{label("金额")}</th></tr>
  </thead>
  <tbody>{rows}</tbody>
</table>

<div class="totals">{label("总数量")}{separator}{escape(data.total_quantity)}{spacing}
{label("总金额")}{separator}
{escape(data.currency)} {escape(data.total_amount)}</div>
</body>
</html>"""


def render_sample_request(
    data: SampleRequestPrintData,
    language: str | None = None,
) -> str:
    resolved = language or get_current_language()
    is_english = resolved != DEFAULT_LANGUAGE
    meta_separator = " | " if is_english else " ｜ "

    def label(text: str) -> str:
        return localize_message(text, resolved)

    rows = "".join(
        f"<tr><td>{escape(line.product_code)}</td>"
        f"<td>{escape(line.product_name)}</td>"
        f"<td>{escape(line.specification)}</td>"
        f"<td>{escape(line.quantity)} {escape(line.unit)}</td>"
        f'<td colspan="2">{escape(line.requirement)}</td></tr>'
        for line in data.lines
    )
    if not rows:
        rows = f'<tr><td colspan="6">{label("无打样明细")}</td></tr>'
    return f"""<!DOCTYPE html>
<html lang="{'en' if is_english else 'zh-CN'}">
<head>
<meta charset="utf-8" />
<title>{label("内部打样单")} {escape(data.code)}</title>
<style>{_STYLE}</style>
</head>
<body>
<h1>{label("内部打样单") if is_english else "内部打样单 SAMPLE REQUEST"}</h1>
<div class="meta">{label("打样单号")} {escape(data.code)}{meta_separator}
{label("打样日期")} {escape(data.request_date)}</div>

<div class="section-title">{label("打样信息")}</div>
<table>
  <tr><th>{label("客户")}</th><td>{escape(data.customer_name)}</td>
      <th>{label("产品")}</th><td>{escape(data.product_name)}</td></tr>
  <tr><th>{label("供应商/打样方")}</th><td>{escape(data.supplier_name)}</td>
      <th>{label("打样去向")}</th><td>{escape(data.destination)}</td></tr>
  <tr><th>{label("要求完成")}</th><td>{escape(data.due_date)}</td>
      <th>{label("业务员")}</th><td>{escape(data.sales_user_name)}</td></tr>
</table>

<div class="section-title">{label("客户打样要求")}</div>
<div class="contact-box">{escape(data.requirements)}</div>

<div class="section-title">{label("内部打样单明细")}</div>
<table>
  <thead>
    <tr><th>{label("商品编号")}</th><th>{label("品名")}</th><th>{label("规格")}</th>
        <th>{label("数量")}</th><th colspan="2">{label("要求")}</th></tr>
  </thead>
  <tbody>{rows}</tbody>
</table>
</body>
</html>"""


def _render_contact(contact: PrintContact | None, language: str | None = None) -> str:
    resolved = language or get_current_language()
    separator = ": " if resolved != DEFAULT_LANGUAGE else "："

    def label(text: str) -> str:
        return localize_message(text, resolved)

    if contact is None:
        return f'<div class="contact-box">{label("未维护主联系人")}</div>'
    parts = [f"<strong>{escape(contact.name)}</strong>"]
    if contact.title:
        parts.append(f"{label('职务')}{separator}{escape(contact.title)}")
    if contact.phone:
        parts.append(f"{label('电话')}{separator}{escape(contact.phone)}")
    if contact.email:
        parts.append(f"{label('邮箱')}{separator}{escape(contact.email)}")
    return '<div class="contact-box">' + "<br/>".join(parts) + "</div>"
