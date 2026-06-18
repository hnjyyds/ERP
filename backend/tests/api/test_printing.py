import base64
from pathlib import Path

import xlrd
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


async def test_print_export_contract_includes_primary_contact(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    customer_response = await api_client.post(
        "/api/v1/masterdata/customers",
        headers=headers,
        json={
            "code": "C-PRINT-001",
            "cn_name": "打印测试客户",
            "en_name": "Print Test Customer",
            "country": "Germany",
            "status": "active",
            "contacts": [
                {
                    "name": "Anna Schmidt",
                    "title": "Sourcing Manager",
                    "email": "anna@example.com",
                    "phone": "+49-40-0000",
                    "is_primary": True,
                }
            ],
        },
    )
    customer_id = customer_response.json()["data"]["id"]

    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers=headers,
        json={
            "code": "EC-PRINT-001",
            "contract_date": "2026-07-03",
            "customer_id": customer_id,
            "customer_name": "打印测试客户",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-08-10",
            "payment_terms": "30% T/T in advance",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "1000",
                    "unit": "pcs",
                    "unit_price": "1.40",
                }
            ],
        },
    )
    contract_id = contract_response.json()["data"]["id"]

    response = await api_client.get(
        f"/api/v1/printing/export-contracts/{contract_id}",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["document_type"] == "export_contract"
    assert data["document_code"] == "EC-PRINT-001"
    assert "Anna Schmidt" in data["html"]
    assert "Eco Shopping Bag" in data["html"]


async def test_print_sample_request_renders_internal_sample_sheet(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await api_client.post(
        "/api/v1/sample/requests",
        headers=headers,
        json={
            "code": "SR-PRINT-001",
            "request_date": "2026-06-20",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "destination": "factory",
            "requirements": "客户要求环保材质，先做确认样。",
            "due_date": "2026-06-28",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "quantity": "3",
                    "unit": "pcs",
                    "requirement": "绿色样、自然色各一，另加留样。",
                }
            ],
        },
    )
    assert create_response.status_code == 201
    request_id = create_response.json()["data"]["id"]

    response = await api_client.get(
        f"/api/v1/printing/sample-requests/{request_id}",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["document_type"] == "sample_request"
    assert data["document_code"] == "SR-PRINT-001"
    assert "内部打样单" in data["html"]
    assert "Eco Shopping Bag" in data["html"]
    assert "华东包装制品厂" in data["html"]


async def test_generate_purchase_contract_template_uses_contract_company_and_product(
    api_client: AsyncClient,
    seeded_system: None,
    tmp_path: Path,
) -> None:
    demo_token = await _login_token(api_client)
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    headers = {"Authorization": f"Bearer {demo_token}"}

    company_response = await api_client.patch(
        "/api/v1/organization/company",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "义乌市新裴贸易有限公司",
            "address": "义乌市福田街道涌金大道 B39号C幢2楼",
            "phone": "0579-85360091",
            "email": "jessie@d-dutch.cn",
        },
    )
    assert company_response.status_code == 200

    image_path = tmp_path / "print-product.bmp"
    image_path.write_bytes(_small_bmp_bytes())

    product_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers=headers,
        json={
            "code": "DHT14223",
            "cn_name": "针织贝蕾帽",
            "en_name": "Knitted Beret",
            "specification": "克重：130g; 材质: 绦纶",
            "model": "均码",
            "customs_code": "6505009900",
            "tax_rate": "0.13",
            "rebate_rate": "0.09",
            "package_info": "单顶车洗标挂吊卡入袋，四个颜色各1顶共4顶混色入中包袋。",
            "unit": "pcs",
            "image_url": str(image_path),
            "accessories": [],
        },
    )
    assert product_response.status_code == 201
    product = product_response.json()["data"]

    supplier_response = await api_client.post(
        "/api/v1/masterdata/suppliers",
        headers=headers,
        json={
            "code": "BEST-KNIT",
            "cn_name": "贝斯特针织",
            "en_name": "Best Knit Factory",
            "country": "中国",
            "address": "浙江义乌",
            "website": None,
            "status": "active",
            "contacts": [
                {
                    "name": "蒋芳",
                    "title": "业务联系人",
                    "email": "factory@example.com",
                    "phone": "18072781890",
                    "is_primary": True,
                }
            ],
            "credit_profile": {
                "credit_grade": "A",
                "credit_limit": "80000",
                "currency": "RMB",
                "payment_terms": "货到仓库。验货后无品质问题一月内付款.",
                "risk_note": None,
            },
        },
    )
    assert supplier_response.status_code == 201
    supplier = supplier_response.json()["data"]

    contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json={
            "code": "NL2502085",
            "contract_date": "2026-06-01",
            "supplier_id": supplier["id"],
            "supplier_name": supplier["cn_name"],
            "buyer_user_id": "u-001",
            "buyer_user_name": "蒋芳",
            "currency": "RMB",
            "delivery_date": "2026-10-29",
            "payment_terms": "货到仓库。验货后无品质问题一月内付款.",
            "source_type": "manual",
            "remarks": "工厂严格把控产品质量，大货不能出现抽纱，掉毛，污渍等现象。",
            "lines": [
                {
                    "product_id": product["id"],
                    "product_code": product["code"],
                    "product_name": product["cn_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "9999",
                    "unit": product["unit"],
                    "unit_price": "7.85",
                    "source_export_contract_id": None,
                    "source_export_contract_no": None,
                    "source_export_contract_line_id": None,
                    "remark": "颜色: 黑色/浅灰色/浅咖色; 特殊备注: 出货前复核洗标",
                }
            ],
        },
    )
    assert contract_response.status_code == 201
    contract_id = contract_response.json()["data"]["id"]

    response = await api_client.get(
        f"/api/v1/printing/purchase-contracts/{contract_id}/template",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    content = base64.b64decode(data["content_base64"])
    assert data["document_type"] == "purchase_contract_template"
    assert data["document_code"] == "NL2502085"
    assert data["filename"] == "NL2502085-采购合同.xls"
    assert data["content_type"] == "application/vnd.ms-excel"
    assert len(content) > 50_000

    workbook = xlrd.open_workbook(file_contents=content)
    sheet = workbook.sheet_by_index(0)
    assert sheet.cell_value(13, 2) == "NL2502085"
    assert sheet.cell_value(13, 5) == "贝斯特针织"
    assert "义乌市新裴贸易有限公司" in sheet.cell_value(13, 8)
    assert sheet.cell_value(14, 5) == "蒋芳"
    assert sheet.cell_value(15, 5) == "18072781890"
    assert sheet.cell_value(16, 5) == "浙江义乌"
    assert sheet.cell_value(17, 5) == "factory@example.com"
    assert sheet.cell_value(20, 1) == "DHT14223"
    assert sheet.cell_value(20, 3) == "针织贝蕾帽\n\n克重：130g"
    assert sheet.cell_value(20, 4) == "绦纶"
    assert sheet.cell_value(20, 5) == "颜色: 黑色"
    assert sheet.cell_value(21, 5) == "颜色: 浅灰色"
    assert sheet.cell_value(22, 5) == "颜色: 浅咖色"
    assert sheet.cell_value(20, 8) == 3333
    assert sheet.cell_value(21, 8) == 3333
    assert sheet.cell_value(22, 8) == 3333
    assert sheet.cell_value(20, 9) == 26164.05
    assert sheet.cell_value(21, 9) == 26164.05
    assert sheet.cell_value(22, 9) == 26164.05
    assert sheet.cell_value(20, 10) == "特殊备注：出货前复核洗标"
    assert "包装" not in sheet.cell_value(20, 10)
    assert sheet.cell_value(20, 11) == "单顶车洗标挂吊卡入袋，四个颜色各1顶共4顶混色入中包袋。"
    assert sheet.cell_value(20, 12) == "工厂严格把控产品质量，大货不能出现抽纱，掉毛，污渍等现象。"
    assert sheet.cell_value(23, 8) == 9999
    assert sheet.cell_value(23, 9) == 78492.15


async def test_print_export_contract_not_found(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.get(
        "/api/v1/printing/export-contracts/missing-id",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


async def test_generate_purchase_contract_template_denies_missing_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/printing/purchase-contracts/missing-id/template",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def _small_bmp_bytes() -> bytes:
    width = 2
    height = 2
    row_size = ((width * 3 + 3) // 4) * 4
    pixel_data_size = row_size * height
    file_size = 54 + pixel_data_size
    header = (
        b"BM"
        + file_size.to_bytes(4, "little")
        + b"\x00\x00\x00\x00"
        + (54).to_bytes(4, "little")
    )
    dib = (
        (40).to_bytes(4, "little")
        + width.to_bytes(4, "little")
        + height.to_bytes(4, "little")
        + (1).to_bytes(2, "little")
        + (24).to_bytes(2, "little")
        + (0).to_bytes(4, "little")
        + pixel_data_size.to_bytes(4, "little")
        + (2835).to_bytes(4, "little")
        + (2835).to_bytes(4, "little")
        + (0).to_bytes(4, "little")
        + (0).to_bytes(4, "little")
    )
    red = bytes([0, 0, 255])
    green = bytes([0, 255, 0])
    blue = bytes([255, 0, 0])
    white = bytes([255, 255, 255])
    padding = b"\x00" * (row_size - width * 3)
    pixels = blue + white + padding + red + green + padding
    return header + dib + pixels
