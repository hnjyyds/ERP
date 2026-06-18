"""无第三方依赖的商品导入文件解析。

支持 CSV 与 Excel(.xlsx)。Excel 使用标准库 ``zipfile`` + ``xml.etree`` 解析，
避免引入 openpyxl 等额外依赖。解析结果统一为 ``list[dict[str, str]]``，
键为表头列名，值为单元格文本，由 service 层做字段校验。
"""

import csv
import zipfile
from io import BytesIO, StringIO
from xml.etree import ElementTree

_SHEET_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


class ImportFileError(Exception):
    """导入文件无法解析（损坏、格式不支持或缺少表头）。"""


def parse_import_file(*, filename: str, content: bytes) -> list[dict[str, str]]:
    """根据文件名后缀解析为表头映射的行列表。"""
    lowered = filename.lower()
    if lowered.endswith(".xlsx"):
        return _parse_xlsx(content)
    if lowered.endswith(".csv") or lowered.endswith(".txt"):
        return _parse_csv(content)
    raise ImportFileError("仅支持 CSV 或 Excel(.xlsx) 文件")


def _parse_csv(content: bytes) -> list[dict[str, str]]:
    text = _decode_csv(content)
    reader = csv.reader(StringIO(text))
    rows = [list(row) for row in reader if any(cell.strip() for cell in row)]
    return _rows_to_dicts(rows)


def _decode_csv(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ImportFileError("CSV 文件编码无法识别，请使用 UTF-8")


def _parse_xlsx(content: bytes) -> list[dict[str, str]]:
    try:
        archive = zipfile.ZipFile(BytesIO(content))
    except zipfile.BadZipFile as exc:
        raise ImportFileError("Excel 文件损坏或格式不正确") from exc

    with archive:
        shared = _read_shared_strings(archive)
        sheet_path = _first_sheet_path(archive)
        try:
            sheet_xml = archive.read(sheet_path)
        except KeyError as exc:
            raise ImportFileError("Excel 文件缺少工作表") from exc

    rows = _read_sheet_rows(sheet_xml, shared)
    return _rows_to_dicts(rows)


def _read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        raw = archive.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ElementTree.fromstring(raw)
    values: list[str] = []
    for item in root.findall(f"{_SHEET_NS}si"):
        values.append("".join(node.text or "" for node in item.iter(f"{_SHEET_NS}t")))
    return values


def _first_sheet_path(archive: zipfile.ZipFile) -> str:
    names = archive.namelist()
    if "xl/worksheets/sheet1.xml" in names:
        return "xl/worksheets/sheet1.xml"
    sheets = sorted(name for name in names if name.startswith("xl/worksheets/sheet"))
    if not sheets:
        raise ImportFileError("Excel 文件缺少工作表")
    return sheets[0]


def _read_sheet_rows(sheet_xml: bytes, shared: list[str]) -> list[list[str]]:
    root = ElementTree.fromstring(sheet_xml)
    sheet_data = root.find(f"{_SHEET_NS}sheetData")
    if sheet_data is None:
        return []
    rows: list[list[str]] = []
    for row in sheet_data.findall(f"{_SHEET_NS}row"):
        cells: dict[int, str] = {}
        max_index = -1
        for cell in row.findall(f"{_SHEET_NS}c"):
            index = _column_index(cell.get("r", ""))
            value = _cell_value(cell, shared)
            cells[index] = value
            max_index = max(max_index, index)
        ordered = [cells.get(i, "") for i in range(max_index + 1)]
        if any(value.strip() for value in ordered):
            rows.append(ordered)
    return rows


def _cell_value(cell: ElementTree.Element, shared: list[str]) -> str:
    cell_type = cell.get("t")
    if cell_type == "inlineStr":
        node = cell.find(f"{_SHEET_NS}is")
        if node is None:
            return ""
        return "".join(text.text or "" for text in node.iter(f"{_SHEET_NS}t"))
    value_node = cell.find(f"{_SHEET_NS}v")
    if value_node is None or value_node.text is None:
        return ""
    raw = value_node.text
    if cell_type == "s":
        try:
            return shared[int(raw)]
        except (ValueError, IndexError):
            return ""
    return raw


def _column_index(reference: str) -> int:
    letters = "".join(char for char in reference if char.isalpha())
    if not letters:
        return 0
    index = 0
    for char in letters.upper():
        index = index * 26 + (ord(char) - ord("A") + 1)
    return index - 1


def _rows_to_dicts(rows: list[list[str]]) -> list[dict[str, str]]:
    if not rows:
        raise ImportFileError("文件没有可导入的数据行")
    header = [cell.strip() for cell in rows[0]]
    if not any(header):
        raise ImportFileError("文件缺少表头行")
    records: list[dict[str, str]] = []
    for raw_row in rows[1:]:
        record = {
            header[i]: (raw_row[i].strip() if i < len(raw_row) else "")
            for i in range(len(header))
            if header[i]
        }
        records.append(record)
    return records
