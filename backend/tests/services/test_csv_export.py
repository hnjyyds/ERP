from decimal import Decimal

import pytest

from app.core.csv_export import safe_cell


@pytest.mark.parametrize(
    "value",
    ["=1+1", "+1", "-1", "@cmd", "\t=1+1", "\r=1+1"],
)
def test_safe_cell_prefixes_formula_like_text(value: str) -> None:
    assert safe_cell(value) == f"'{value}"


@pytest.mark.parametrize(
    "value",
    ["普通文本", "P-BAG-001", "", "1+1", "a=b"],
)
def test_safe_cell_keeps_plain_text(value: str) -> None:
    assert safe_cell(value) == value


def test_safe_cell_leaves_non_string_values_untouched() -> None:
    assert safe_cell(Decimal("-12.50")) == Decimal("-12.50")
    assert safe_cell(-1) == -1
    assert safe_cell(None) == ""
