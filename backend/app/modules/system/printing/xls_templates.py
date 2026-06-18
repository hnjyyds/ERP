import re
from base64 import b64decode
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import xlrd  # type: ignore[import-untyped]
from PIL import Image, ImageFile, UnidentifiedImageError
from xlrd.xldate import xldate_from_date_tuple  # type: ignore[import-untyped]
from xlutils.copy import copy as copy_workbook  # type: ignore[import-untyped]
from xlwt.Cell import BlankCell, NumberCell, StrCell  # type: ignore[import-untyped]
from xlwt.Workbook import Workbook  # type: ignore[import-untyped]
from xlwt.Worksheet import Worksheet  # type: ignore[import-untyped]

PURCHASE_CONTRACT_TEMPLATE_PATH = Path(__file__).with_name("templates") / "purchase_contract.xls"
PURCHASE_CONTRACT_UPLOAD_DIR = Path(__file__).parents[4] / ".data" / "uploads"
PURCHASE_CONTRACT_CONTENT_TYPE = "application/vnd.ms-excel"
PURCHASE_CONTRACT_MAX_TEMPLATE_LINES = 3
PURCHASE_CONTRACT_IMAGE_BOX = (148, 228)
_COLOR_SPLIT_RE = re.compile(r"[/、,，]+")


@dataclass(frozen=True)
class PurchaseContractTemplateCompany:
    name: str
    address: str
    phone: str
    email: str


@dataclass(frozen=True)
class PurchaseContractTemplateLine:
    product_code: str
    product_name: str
    specification: str
    model: str
    image_url: str
    quantity: str
    unit_price: str
    amount: str
    remark: str


@dataclass(frozen=True)
class PurchaseContractTemplateData:
    code: str
    contract_date: date
    supplier_name: str
    supplier_phone: str
    supplier_address: str
    supplier_email: str
    buyer_user_name: str
    currency: str
    delivery_date: date
    payment_terms: str
    remarks: str
    total_quantity: str
    total_amount: str
    company: PurchaseContractTemplateCompany
    lines: list[PurchaseContractTemplateLine]


@dataclass(frozen=True)
class _DisplayLine:
    line: PurchaseContractTemplateLine
    item_number: int
    color: str
    quantity: Decimal | str
    amount: Decimal | str
    residual_remark: str
    show_product_fields: bool


class _TemplateWriter:
    def __init__(self, template_path: Path) -> None:
        self._source = xlrd.open_workbook(template_path, formatting_info=True)
        self._workbook: Workbook = copy_workbook(self._source)
        self._target: Worksheet = self._workbook.get_sheet(0)

    def write(self, row: int, column: int, value: object) -> None:
        style_index = self._style_index_for(row, column)
        target_row = self._target.row(row)
        if isinstance(value, date):
            serial = xldate_from_date_tuple(
                (value.year, value.month, value.day),
                self._source.datemode,
            )
            target_row.insert_cell(column, NumberCell(row, column, style_index, serial))
        elif isinstance(value, Decimal):
            target_row.insert_cell(column, NumberCell(row, column, style_index, float(value)))
        elif isinstance(value, int | float):
            target_row.insert_cell(column, NumberCell(row, column, style_index, value))
        elif value is None or value == "":
            target_row.insert_cell(column, BlankCell(row, column, style_index))
        else:
            target_row.insert_cell(
                column,
                StrCell(row, column, style_index, self._workbook.add_str(str(value))),
            )

    def insert_bitmap_data(
        self,
        *,
        row: int,
        column: int,
        data: bytes,
        x: int = 0,
        y: int = 0,
    ) -> None:
        self._target.insert_bitmap_data(data, row, column, x=x, y=y)

    def save(self) -> bytes:
        buffer = BytesIO()
        self._workbook.save(buffer)
        return buffer.getvalue()

    def _style_index_for(self, row: int, column: int) -> int:
        cell = getattr(self._target.row(row), "_Row__cells", {}).get(column)
        index = getattr(cell, "xf_idx", None)
        return int(index) if index is not None else 0

def render_purchase_contract_template(data: PurchaseContractTemplateData) -> bytes:
    writer = _TemplateWriter(PURCHASE_CONTRACT_TEMPLATE_PATH)
    _clear_purchase_contract_fields(writer)
    writer.write(13, 2, data.code)
    writer.write(13, 5, data.supplier_name)
    writer.write(13, 8, _company_block(data.company))
    writer.write(14, 2, data.contract_date)
    writer.write(14, 5, data.buyer_user_name)
    writer.write(15, 2, data.delivery_date)
    writer.write(15, 5, data.supplier_phone)
    writer.write(16, 2, _transport_label(data.remarks))
    writer.write(16, 5, data.supplier_address)
    writer.write(17, 2, data.buyer_user_name)
    writer.write(17, 5, data.supplier_email)
    writer.write(19, 6, f"单价             （{data.currency}）")
    writer.write(23, 0, "TOTAL")
    writer.write(23, 8, _number_or_text(data.total_quantity))
    writer.write(23, 9, _number_or_text(data.total_amount))
    writer.write(28, 0, _delivery_address_note(data.company))
    writer.write(29, 0, f"4.付款方式: {data.payment_terms}")
    writer.write(30, 0, _quality_note(data.remarks))

    display_lines = _display_lines(data.lines)
    for offset, display_line in enumerate(display_lines[:PURCHASE_CONTRACT_MAX_TEMPLATE_LINES]):
        row = 20 + offset
        line = display_line.line
        if display_line.show_product_fields:
            writer.write(row, 0, display_line.item_number)
            writer.write(row, 1, line.product_code)
            writer.write(row, 3, _product_description(line))
            writer.write(row, 4, _material_from(line.specification))
            writer.write(row, 11, _packaging_from(line.remark))
            writer.write(row, 12, _quality_from(line.remark, data.remarks))
            image_data = _image_bitmap_from_url(line.image_url)
            if image_data:
                writer.insert_bitmap_data(row=row, column=2, data=image_data, x=8, y=6)
        writer.write(row, 5, display_line.color)
        writer.write(row, 6, _number_or_text(line.unit_price))
        writer.write(row, 7, line.model or _specification_without_material(line.specification))
        writer.write(row, 8, display_line.quantity)
        writer.write(row, 9, display_line.amount)
        writer.write(row, 10, display_line.residual_remark)

    return writer.save()


def purchase_contract_template_filename(code: str) -> str:
    safe_code = "".join(char if char.isalnum() or char in ("-", "_") else "-" for char in code)
    return f"{safe_code or 'purchase-contract'}-采购合同.xls"


def _company_block(company: PurchaseContractTemplateCompany) -> str:
    rows = [company.name]
    if company.address:
        rows.append(f"地 址：{company.address}")
    if company.phone:
        rows.append(f"电 话: {company.phone}")
    if company.email:
        rows.append(f"邮 箱: {company.email}")
    return "\n".join(row for row in rows if row)


def _product_description(line: PurchaseContractTemplateLine) -> str:
    parts = [line.product_name]
    specification = _specification_without_material(line.specification)
    if specification:
        parts.append(specification)
    return "\n\n".join(parts)


def _delivery_address_note(company: PurchaseContractTemplateCompany) -> str:
    address = company.address or "请在公司信息中维护送货地址"
    return f"2.送货地址：{address}"


def _quality_note(_remarks: str) -> str:
    return "5.供应商应严格按照订单要求的品质生产,确保品质良好,包装无误."


def _transport_label(remarks: str) -> str:
    lowered = remarks.lower()
    if "空运" in remarks or "air" in lowered:
        return "空运"
    if "快递" in remarks or "express" in lowered:
        return "快递"
    return "海运"


def _material_from(specification: str) -> str:
    for token in _split_note_tokens(specification):
        if token.startswith("材质"):
            return _token_value(token)
    return ""


def _color_from(remark: str) -> str:
    colors = _color_values_from(remark)
    if colors:
        return _format_color(colors[0])
    return ""


def _packaging_from(remark: str) -> str:
    for token in _split_note_tokens(remark):
        if token.startswith(("包装", "包装方式")):
            return token.split(":", 1)[-1].strip()
    return ""


def _quality_from(remark: str, contract_remarks: str) -> str:
    for token in _split_note_tokens(remark):
        if token.startswith(("质量", "质量要求")):
            return token.split(":", 1)[-1].strip()
    return contract_remarks


def _image_bitmap_from_url(image_url: str) -> bytes | None:
    if not image_url:
        return None
    try:
        content = _read_image_content(image_url)
        if content is None:
            return None
        return _image_content_to_bitmap(content)
    except (OSError, ValueError, UnidentifiedImageError):
        return None


def _read_image_content(image_url: str) -> bytes | None:
    if image_url.startswith("data:image/"):
        return b64decode(image_url.split(",", 1)[1])
    parsed = urlparse(image_url)
    if parsed.scheme in {"http", "https"}:
        return None
    path = Path(parsed.path if parsed.scheme == "file" else image_url)
    if image_url.startswith("/uploads/"):
        path = PURCHASE_CONTRACT_UPLOAD_DIR / image_url.removeprefix("/uploads/")
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists() or not path.is_file():
        return None
    return path.read_bytes()


def _image_content_to_bitmap(content: bytes) -> bytes:
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    with Image.open(BytesIO(content)) as source:
        image = source.convert("RGB")
    image.thumbnail(PURCHASE_CONTRACT_IMAGE_BOX)
    canvas = Image.new("RGB", PURCHASE_CONTRACT_IMAGE_BOX, "white")
    left = (PURCHASE_CONTRACT_IMAGE_BOX[0] - image.width) // 2
    top = (PURCHASE_CONTRACT_IMAGE_BOX[1] - image.height) // 2
    canvas.paste(image, (left, top))
    output = BytesIO()
    canvas.save(output, format="BMP")
    return output.getvalue()


def _clear_purchase_contract_fields(writer: _TemplateWriter) -> None:
    for row, column in [
        (13, 2),
        (13, 5),
        (13, 8),
        (14, 2),
        (14, 5),
        (15, 2),
        (15, 5),
        (16, 2),
        (16, 5),
        (17, 2),
        (17, 5),
        (23, 0),
        (23, 8),
        (23, 9),
        (28, 0),
        (29, 0),
        (30, 0),
    ]:
        writer.write(row, column, "")
    for row in range(20, 23):
        for column in range(13):
            writer.write(row, column, "")


def _display_lines(lines: list[PurchaseContractTemplateLine]) -> list[_DisplayLine]:
    display_lines: list[_DisplayLine] = []
    for item_number, line in enumerate(lines, start=1):
        colors = _color_values_from(line.remark) or [""]
        quantities, amounts = _split_quantity_and_amount(line, len(colors))
        residual_remark = _residual_remark(line.remark)
        for index, color in enumerate(colors):
            display_lines.append(
                _DisplayLine(
                    line=line,
                    item_number=item_number,
                    color=_format_color(color) if color else _color_from(line.remark),
                    quantity=quantities[index],
                    amount=amounts[index],
                    residual_remark=residual_remark if index == 0 else "",
                    show_product_fields=index == 0,
                )
            )
    return display_lines


def _split_quantity_and_amount(
    line: PurchaseContractTemplateLine,
    parts: int,
) -> tuple[list[Decimal | str], list[Decimal | str]]:
    quantity = _decimal_or_none(line.quantity)
    unit_price = _decimal_or_none(line.unit_price)
    total_amount = _decimal_or_none(line.amount)
    if parts <= 1 or quantity is None:
        return [_number_or_text(line.quantity)], [_number_or_text(line.amount)]

    split_quantities = _split_decimal(quantity, parts, Decimal("0.0001"))
    if unit_price is not None:
        split_amounts = [
            (quantity_part * unit_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for quantity_part in split_quantities
        ]
        if total_amount is not None and len(split_amounts) > 1:
            split_amounts[-1] = total_amount - sum(split_amounts[:-1], Decimal("0"))
        return list(split_quantities), list(split_amounts)
    if total_amount is not None:
        split_amounts = _split_decimal(total_amount, parts, Decimal("0.01"))
        return list(split_quantities), list(split_amounts)
    repeated_amounts: list[Decimal | str] = [_number_or_text(line.amount) for _ in split_quantities]
    return list(split_quantities), repeated_amounts


def _split_decimal(value: Decimal, parts: int, quantum: Decimal) -> list[Decimal]:
    base = (value / Decimal(parts)).quantize(quantum, rounding=ROUND_HALF_UP)
    values = [base for _ in range(parts)]
    values[-1] = value - sum(values[:-1], Decimal("0"))
    return values


def _color_values_from(remark: str) -> list[str]:
    for token in _split_note_tokens(remark):
        if token.startswith(("颜色", "色号")):
            value = _token_value(token)
            return [color.strip() for color in _COLOR_SPLIT_RE.split(value) if color.strip()]
    return []


def _format_color(value: str) -> str:
    if value.startswith(("颜色", "色号")):
        return value
    return f"颜色: {value}"


def _residual_remark(remark: str) -> str:
    residual_tokens = [
        token
        for token in _split_note_tokens(remark)
        if not token.startswith(("颜色", "色号", "包装", "包装方式", "质量", "质量要求"))
    ]
    return "；".join(_restore_chinese_colon(token) for token in residual_tokens)


def _specification_without_material(specification: str) -> str:
    tokens = [
        _restore_chinese_colon(token)
        for token in _split_note_tokens(specification)
        if not token.startswith("材质")
    ]
    return "；".join(tokens)


def _token_value(token: str) -> str:
    return token.split(":", 1)[-1].strip() if ":" in token else token.strip()


def _restore_chinese_colon(token: str) -> str:
    if ":" not in token:
        return token
    label, value = token.split(":", 1)
    return f"{label.strip()}：{value.strip()}"


def _split_note_tokens(value: str) -> list[str]:
    normalized = value.replace("；", ";").replace("\n", ";")
    return [token.strip().replace("：", ":") for token in normalized.split(";") if token.strip()]


def _number_or_text(value: object) -> Decimal | str:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return str(value)


def _decimal_or_none(value: object) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
