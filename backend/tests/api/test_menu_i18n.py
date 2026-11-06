"""菜单文案语言契约：按 Accept-Language 返回单个 label，缺失回落中文。"""

import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.models import MenuItem

ENGLISH = {"Accept-Language": "en-US"}

_DEMO_MENUS_EN = [
    "Dashboard",
    "Products",
    "Suppliers",
    "Customers",
    "Order Center",
    "Purchase Contracts",
    "QC Center",
    "Follow-up Center",
    "My QC Tasks",
    "Inbound Receipts",
    "Executive Dashboard",
    "Export Quotations",
    "Sampling",
    "Sample Records",
    "Sample Deliveries",
    "Partners",
    "Document Parties",
    "Shipments",
    "Purchase Inquiries",
    "Invoice Notices",
    "Inbound Plans",
    "Outbound Plans",
    "Outbound",
]


async def _login_token(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
    headers: dict[str, str] | None = None,
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
        headers=headers,
    )
    return response.json()["data"]["access_token"]


async def test_login_returns_english_menu_labels(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
        headers=ENGLISH,
    )

    data = response.json()["data"]
    assert [item["label"] for item in data["menus"]] == _DEMO_MENUS_EN


async def test_menus_endpoint_returns_english_labels(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, "finance", "finance123", ENGLISH)

    response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}", **ENGLISH},
    )

    assert response.status_code == 200
    assert [item["label"] for item in response.json()["data"]["menus"]] == [
        "Dashboard",
        "Finance Summary",
    ]


async def test_missing_english_label_falls_back_to_chinese(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await session.execute(
            update(MenuItem).where(MenuItem.id == "menu-reporting").values(label_en=None)
        )
        await session.commit()

    token = await _login_token(api_client, headers=ENGLISH)
    response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}", **ENGLISH},
    )

    labels = {item["id"]: item["label"] for item in response.json()["data"]["menus"]}
    assert labels["menu-reporting"] == "老板看板"
    assert labels["menu-dashboard"] == "Dashboard"


@pytest.mark.parametrize("accept_language", ["zh-CN", None])
async def test_default_language_keeps_chinese_menu_labels(
    api_client: AsyncClient,
    seeded_system: None,
    accept_language: str | None,
) -> None:
    headers: dict[str, str] = {}
    if accept_language is not None:
        headers["Accept-Language"] = accept_language
    token = await _login_token(api_client, "finance", "finance123", headers)

    response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}", **headers},
    )

    assert [item["label"] for item in response.json()["data"]["menus"]] == [
        "工作台",
        "财务摘要",
    ]
