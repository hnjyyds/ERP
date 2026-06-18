import base64

from httpx import AsyncClient

# 最小合法 PNG（1x1 透明像素）。
_PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
)


async def _login_token(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    return response.json()["data"]["access_token"]


async def test_upload_image_returns_accessible_url(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/files/images",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "filename": "product.png",
            "content_base64": base64.b64encode(_PNG_BYTES).decode("ascii"),
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["content_type"] == "image/png"
    assert data["url"].startswith("/uploads/images/")
    assert data["size"] == len(_PNG_BYTES)


async def test_upload_image_accepts_data_url_prefix(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    data_url = "data:image/png;base64," + base64.b64encode(_PNG_BYTES).decode("ascii")
    response = await api_client.post(
        "/api/v1/files/images",
        headers={"Authorization": f"Bearer {token}"},
        json={"filename": "product.png", "content_base64": data_url},
    )
    assert response.status_code == 200


async def test_upload_rejects_non_image(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/files/images",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "filename": "note.txt",
            "content_base64": base64.b64encode(b"hello world").decode("ascii"),
        },
    )
    assert response.status_code == 400


async def test_upload_requires_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.post(
        "/api/v1/files/images",
        json={"filename": "product.png", "content_base64": "AAAA"},
    )
    assert response.status_code == 401
