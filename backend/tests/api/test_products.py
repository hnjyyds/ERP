from httpx import AsyncClient


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


def _product_payload(code: str = "P-BAG-001") -> dict[str, object]:
    return {
        "code": code,
        "cn_name": "环保购物袋",
        "en_name": "Eco Shopping Bag",
        "specification": "40x35cm",
        "model": "BAG-40",
        "customs_code": "4202920000",
        "tax_rate": "0.13",
        "rebate_rate": "0.09",
        "package_info": "100 pcs/carton",
        "unit": "pcs",
        "image_url": "https://example.com/images/bag.png",
        "accessories": [
            {
                "accessory_name": "棉绳",
                "unit_consumption": "0.45",
                "unit": "m",
                "default_supplier_name": "远景辅料供应商",
                "purchase_split_rule": "by_supplier",
            }
        ],
    }


async def test_product_create_detail_search_and_export(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        json=_product_payload(),
    )
    assert create_response.status_code == 201
    product = create_response.json()["data"]
    assert product["code"] == "P-BAG-001"
    assert product["customs_code"] == "4202920000"
    assert product["accessories"][0]["accessory_name"] == "棉绳"
    assert product["accessories"][0]["unit_consumption"] == "0.45"

    product_id = product["id"]
    detail_response = await api_client.get(
        f"/api/v1/masterdata/products/{product_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == product_id

    list_response = await api_client.get(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "Eco"},
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "P-BAG-001"

    export_response = await api_client.get(
        "/api/v1/masterdata/products/export",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert export_response.status_code == 200
    export_data = export_response.json()["data"]
    assert export_data["filename"] == "products.csv"
    assert "P-BAG-001" in export_data["content"]
    assert "4202920000" in export_data["content"]


async def test_product_accessory_can_be_added_after_create(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        json=_product_payload(code="P-BAG-002"),
    )
    product_id = create_response.json()["data"]["id"]

    accessory_response = await api_client.post(
        f"/api/v1/masterdata/products/{product_id}/accessories",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "accessory_name": "金属扣",
            "unit_consumption": "2",
            "unit": "pcs",
            "default_supplier_name": "五金供应商",
            "purchase_split_rule": "by_accessory",
        },
    )

    assert accessory_response.status_code == 201
    detail_response = await api_client.get(
        f"/api/v1/masterdata/products/{product_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    accessories = detail_response.json()["data"]["accessories"]
    assert [item["accessory_name"] for item in accessories] == ["棉绳", "金属扣"]


async def test_product_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/masterdata/products")

    assert response.status_code == 401


async def test_product_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
