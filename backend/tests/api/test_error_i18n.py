from httpx import AsyncClient


async def test_error_message_follows_accept_language_and_keeps_stable_code(
    api_client: AsyncClient,
) -> None:
    chinese = await api_client.post("/api/v1/auth/login", json={})

    assert chinese.status_code == 422
    chinese_body = chinese.json()
    assert chinese_body["code"] == "VALIDATION_ERROR"
    assert chinese_body["message"] == "请求参数校验失败"
    assert chinese_body["error"]["code"] == "VALIDATION_ERROR"
    assert chinese_body["error"]["message"] == "请求参数校验失败"
    assert "Accept-Language" in chinese.headers["Vary"]

    english = await api_client.post(
        "/api/v1/auth/login",
        json={},
        headers={"Accept-Language": "en-US"},
    )

    english_body = english.json()
    assert english_body["code"] == "VALIDATION_ERROR"
    assert english_body["message"] == "Request validation failed"
    assert english_body["error"]["code"] == "VALIDATION_ERROR"
    assert english_body["error"]["message"] == "Request validation failed"
    assert "Accept-Language" in english.headers["Vary"]


async def test_unsupported_language_falls_back_to_chinese(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={},
        headers={"Accept-Language": "de-DE, fr-FR;q=0.8"},
    )

    assert response.json()["message"] == "请求参数校验失败"


async def test_accept_language_quality_values_select_supported_language(
    api_client: AsyncClient,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={},
        headers={"Accept-Language": "fr-FR, en-GB;q=0.9, zh-CN;q=0.4"},
    )

    assert response.json()["message"] == "Request validation failed"


async def test_english_validation_details_are_localized(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={},
        headers={"Accept-Language": "en-US"},
    )

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["message"] == "Request validation failed"
    details = {item["field"]: item["message"] for item in body["error"]["details"]}
    assert details == {"username": "is required", "password": "is required"}

    default_response = await api_client.post("/api/v1/auth/login", json={})
    default_details = {
        item["field"]: item["message"]
        for item in default_response.json()["error"]["details"]
    }
    assert default_details == {"username": "为必填项", "password": "为必填项"}


async def test_english_validation_empty_string_uses_localized_template(
    api_client: AsyncClient,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "", "password": "secret"},
        headers={"Accept-Language": "en"},
    )

    details = {item["field"]: item["message"] for item in response.json()["error"]["details"]}
    assert details["username"] == "must not be empty"


async def test_known_auth_detail_is_localized_without_changing_code(
    api_client: AsyncClient,
) -> None:
    english = await api_client.get(
        "/api/v1/system/menus",
        headers={"Accept-Language": "en-US"},
    )

    assert english.status_code == 401
    assert english.json()["code"] == "MISSING_CREDENTIALS"
    assert english.json()["message"] == "Missing login credentials"

    chinese = await api_client.get("/api/v1/system/menus")
    assert chinese.json()["code"] == "MISSING_CREDENTIALS"
    assert chinese.json()["message"] == "缺少登录凭证"


async def test_success_response_declares_language_negotiation(api_client: AsyncClient) -> None:
    response = await api_client.get("/api/v1/health", headers={"Accept-Language": "en-US"})

    assert response.status_code == 200
    assert response.json()["message"] == "请求成功"
    assert "Accept-Language" in response.headers["Vary"]
