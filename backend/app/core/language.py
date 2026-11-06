"""请求语言协商：解析 ``Accept-Language`` 并保存到请求级上下文。

语言只影响用户可见文案的渲染，不参与业务判断；无法识别时统一回落中文，
保证既有中文响应和测试契约不变。
"""

from contextvars import ContextVar, Token

DEFAULT_LANGUAGE = "zh-CN"
SUPPORTED_LANGUAGES = ("zh-CN", "en-US")

_current_language: ContextVar[str] = ContextVar("current_language", default=DEFAULT_LANGUAGE)


def _match_supported(tag: str) -> str | None:
    """把语言标签映射到受支持语言；只按主语言匹配，忽略地区变体。"""
    primary = tag.split("-", 1)[0].lower()
    if primary == "zh":
        return "zh-CN"
    if primary == "en":
        return "en-US"
    return None


def parse_accept_language(header: str | None) -> str | None:
    """按 q 值从高到低选择第一个受支持语言；无匹配时返回 ``None``。"""
    if not header or not header.strip():
        return None

    candidates: list[tuple[float, int, str]] = []
    for index, raw in enumerate(header.split(",")):
        parts = [part.strip() for part in raw.split(";")]
        tag = parts[0].lower()
        if not tag:
            continue
        quality = 1.0
        for parameter in parts[1:]:
            if parameter.startswith("q="):
                try:
                    quality = float(parameter[2:])
                except ValueError:
                    quality = 0.0
        if quality <= 0:
            continue
        language = _match_supported(tag)
        if language is None:
            continue
        # 相同 q 值下按原始顺序取先出现的语言，因此用 -index 参与排序。
        candidates.append((quality, -index, language))

    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][2]


def resolve_language(header: str | None) -> str:
    """返回本次请求使用的语言，解析不到时回落默认中文。"""
    return parse_accept_language(header) or DEFAULT_LANGUAGE


def set_current_language(header: str | None) -> Token[str]:
    return _current_language.set(resolve_language(header))


def reset_current_language(token: Token[str]) -> None:
    _current_language.reset(token)


def get_current_language() -> str:
    return _current_language.get()
