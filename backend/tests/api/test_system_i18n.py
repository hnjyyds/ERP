from httpx import AsyncClient


async def test_i18n_config_exposes_languages_timezones_and_labels(
    api_client: AsyncClient,
) -> None:
    response = await api_client.get("/api/v1/system/i18n")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert data["default_language"] == "zh-CN"
    assert data["supported_languages"] == [
        {
            "code": "zh-CN",
            "label": "中文",
            "description": "UTC+8 / Asia Shanghai",
            "time_zone": "Asia/Shanghai",
        },
        {
            "code": "en-US",
            "label": "English",
            "description": "UTC",
            "time_zone": "UTC",
        },
    ]
    assert data["messages"]["zh-CN"]["settings.title"] == "系统设置"
    assert data["messages"]["en-US"]["settings.title"] == "Settings"
    assert data["messages"]["en-US"]["dashboard.countdownPrefix"] == "Starts in"
    assert set(data["messages"]["zh-CN"]) == set(data["messages"]["en-US"])
    assert data["path_labels"]["/"]["en-US"] == "Workbench"
    assert data["page_titles"]["/purchase/followup"]["zh-CN"] == "采购跟单和逾期预警"
    assert data["sidebar_groups"]["warehouse"]["en-US"] == "QC and warehouse"
    for mapping_name in ("path_labels", "page_titles", "sidebar_groups"):
        for value in data[mapping_name].values():
            assert set(value) == {"zh-CN", "en-US"}
