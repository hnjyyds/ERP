import zipfile
from io import BytesIO

import pytest

from app.modules.masterdata.products.imports import ImportFileError, parse_import_file


def _build_xlsx(rows: list[list[str]]) -> bytes:
    """构造最小 xlsx（inlineStr 单元格），避免依赖 openpyxl。"""
    cells = []
    for r_index, row in enumerate(rows, start=1):
        cell_xml = []
        for c_index, value in enumerate(row):
            ref = f"{chr(ord('A') + c_index)}{r_index}"
            cell_xml.append(
                f'<c r="{ref}" t="inlineStr"><is><t>{value}</t></is></c>'
            )
        cells.append(f'<row r="{r_index}">{"".join(cell_xml)}</row>')
    sheet = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(cells)}</sheetData></worksheet>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '</Types>'
    )
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
    return buffer.getvalue()


def test_parse_csv_returns_header_mapped_rows() -> None:
    content = "code,cn_name\nP-1,杯子\nP-2,袋子\n".encode()
    records = parse_import_file(filename="products.csv", content=content)
    assert records == [
        {"code": "P-1", "cn_name": "杯子"},
        {"code": "P-2", "cn_name": "袋子"},
    ]


def test_parse_csv_rejects_non_utf8_encoding() -> None:
    content = "code,cn_name\nP-1,杯子\n".encode("gbk")
    with pytest.raises(ImportFileError):
        parse_import_file(filename="products.csv", content=content)


def test_parse_xlsx_reads_inline_strings() -> None:
    content = _build_xlsx([["code", "cn_name"], ["P-9", "保温杯"]])
    records = parse_import_file(filename="products.xlsx", content=content)
    assert records == [{"code": "P-9", "cn_name": "保温杯"}]


def test_unsupported_extension_raises() -> None:
    with pytest.raises(ImportFileError):
        parse_import_file(filename="products.pdf", content=b"%PDF-1.4")


def test_empty_file_raises() -> None:
    with pytest.raises(ImportFileError):
        parse_import_file(filename="products.csv", content=b"")
