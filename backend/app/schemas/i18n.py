from typing import Literal

from pydantic import BaseModel, ConfigDict

I18nLanguage = Literal["zh-CN", "en-US"]
I18nTimeZone = Literal["Asia/Shanghai", "UTC"]


class I18nLanguageConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: I18nLanguage
    label: str
    description: str
    time_zone: I18nTimeZone


class I18nConfigResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    default_language: I18nLanguage
    supported_languages: list[I18nLanguageConfig]
    messages: dict[I18nLanguage, dict[str, str]]
    path_labels: dict[str, dict[I18nLanguage, str]]
    page_titles: dict[str, dict[I18nLanguage, str]]
    sidebar_groups: dict[str, dict[I18nLanguage, str]]
