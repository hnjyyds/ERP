from app.core.language import (
    DEFAULT_LANGUAGE,
    get_current_language,
    parse_accept_language,
    reset_current_language,
    resolve_language,
    set_current_language,
)
from app.core.messages import MESSAGE_CATALOG, translate


def test_parse_accept_language_matches_primary_subtag() -> None:
    assert parse_accept_language(None) is None
    assert parse_accept_language("") is None
    assert parse_accept_language("en-US,en;q=0.9,zh-CN;q=0.8") == "en-US"
    assert parse_accept_language("zh-TW") == "zh-CN"
    assert parse_accept_language("en-GB") == "en-US"
    assert parse_accept_language("fr-FR, en;q=0.3") == "en-US"
    assert parse_accept_language("de-DE") is None


def test_parse_accept_language_ignores_zero_quality_and_keeps_order() -> None:
    assert parse_accept_language("en;q=0") is None
    assert parse_accept_language("zh-CN, en-US") == "zh-CN"


def test_resolve_language_defaults_to_chinese() -> None:
    assert resolve_language(None) == DEFAULT_LANGUAGE
    assert resolve_language("ja-JP") == DEFAULT_LANGUAGE


def test_current_language_context_switch_and_reset() -> None:
    token = set_current_language("en-US")
    try:
        assert get_current_language() == "en-US"
        assert translate("status.NOT_FOUND") == "Resource not found"
    finally:
        reset_current_language(token)

    assert get_current_language() == DEFAULT_LANGUAGE
    assert translate("status.NOT_FOUND") == "资源不存在"


def test_message_catalog_has_matching_language_keys() -> None:
    assert set(MESSAGE_CATALOG["zh-CN"]) == set(MESSAGE_CATALOG["en-US"])
