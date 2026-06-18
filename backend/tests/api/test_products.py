import base64

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


def _encode(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


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
    assert product["status"] == "active"
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


async def test_product_can_be_updated_and_deactivated(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        json=_product_payload(code="P-BAG-003"),
    )
    product = create_response.json()["data"]

    update_payload = _product_payload(code="P-BAG-003")
    update_payload.update(
        {
            "cn_name": "环保购物袋-更新",
            "en_name": "Eco Shopping Bag Updated",
            "package_info": "50 pcs/carton",
            "status": "active",
        }
    )
    update_payload.pop("accessories")
    update_response = await api_client.put(
        f"/api/v1/masterdata/products/{product['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["cn_name"] == "环保购物袋-更新"
    assert update_response.json()["data"]["package_info"] == "50 pcs/carton"

    deactivate_response = await api_client.delete(
        f"/api/v1/masterdata/products/{product['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deactivate_response.status_code == 200
    assert deactivate_response.json()["data"]["status"] == "inactive"

    list_response = await api_client.get(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "P-BAG-003"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 0


async def test_product_accessory_can_be_updated_and_deleted(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        json=_product_payload(code="P-BAG-004"),
    )
    product = create_response.json()["data"]
    accessory = product["accessories"][0]

    update_response = await api_client.put(
        f"/api/v1/masterdata/products/{product['id']}/accessories/{accessory['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "accessory_name": "棉绳-更新",
            "unit_consumption": "0.55",
            "unit": "m",
            "default_supplier_name": "远景辅料供应商",
            "purchase_split_rule": "by_accessory",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["accessory_name"] == "棉绳-更新"

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/products/{product['id']}/accessories/{accessory['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200

    detail_response = await api_client.get(
        f"/api/v1/masterdata/products/{product['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.json()["data"]["accessories"] == []


async def test_product_import_csv_creates_updates_and_reports_errors(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    # 先建一个已存在商品，验证导入时按 code 更新而非重复新增。
    await api_client.post(
        "/api/v1/masterdata/products",
        headers=headers,
        json=_product_payload(code="P-IMP-001"),
    )

    csv_text = (
        "code,cn_name,en_name,customs_code,tax_rate,rebate_rate,package_info,unit\n"
        "P-IMP-001,保温杯,Thermos,9617001100,0.13,0.09,24 pcs/carton,pcs\n"
        "P-IMP-002,折叠袋,Folding Bag,4202920000,13%,9%,100 pcs/carton,pcs\n"
        "P-IMP-003,坏行缺字段,,,,,,pcs\n"
    )
    response = await api_client.post(
        "/api/v1/masterdata/products/import",
        headers=headers,
        json={"filename": "products.csv", "content_base64": _encode(csv_text)},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["created"] == 1
    assert data["updated"] == 1
    assert data["failed"] == 1
    assert data["errors"][0]["row"] == 4

    # 百分号税率应换算为 0.13 写入。
    list_response = await api_client.get(
        "/api/v1/masterdata/products",
        headers=headers,
        params={"q": "P-IMP-002"},
    )
    item = list_response.json()["data"]["items"][0]
    assert item["tax_rate"] == "0.1300"


async def test_product_import_rejects_invalid_file(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/masterdata/products/import",
        headers={"Authorization": f"Bearer {token}"},
        json={"filename": "products.pdf", "content_base64": _encode("irrelevant")},
    )
    assert response.status_code == 400


async def test_product_customers_returns_related_contracts(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers=headers,
        json=_product_payload(code="P-LINK-001"),
    )
    product_id = create_response.json()["data"]["id"]

    await api_client.post(
        "/api/v1/sales/contracts",
        headers=headers,
        json={
            "code": "EC-LINK-001",
            "contract_date": "2026-07-03",
            "customer_id": "customer-link",
            "customer_name": "关联客户有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-08-10",
            "payment_terms": "30% T/T in advance",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": "P-LINK-001",
                    "product_name": "环保购物袋",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "1000",
                    "unit": "pcs",
                    "unit_price": "1.40",
                }
            ],
        },
    )

    response = await api_client.get(
        f"/api/v1/masterdata/products/{product_id}/customers",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] == 1
    assert data["items"][0]["customer_name"] == "关联客户有限公司"
    assert data["items"][0]["contract_count"] == 1


async def test_product_transactions_collect_sales_purchase_and_shipment(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    product_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers=headers,
        json=_product_payload(code="P-TXN-001"),
    )
    assert product_response.status_code == 201
    product = product_response.json()["data"]
    product_id = product["id"]

    quotation_response = await api_client.post(
        "/api/v1/sales/quotations",
        headers=headers,
        json={
            "code": "QT-PRODUCT-TXN-001",
            "quote_date": "2026-07-01",
            "customer_id": "customer-product-txn",
            "customer_name": "商品交易客户",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "valid_until": "2026-07-15",
            "description": "商品交易记录报价",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "1000",
                    "unit": product["unit"],
                    "unit_price": "1.25",
                    "freight_method": "sea",
                    "freight_amount": "120.00",
                    "purchase_reference_supplier_name": "华东包装制品厂",
                    "purchase_reference_price": "0.82",
                    "remark": "商品交易记录报价",
                }
            ],
        },
    )
    assert quotation_response.status_code == 201

    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers=headers,
        json={
            "code": "EC-PRODUCT-TXN-001",
            "contract_date": "2026-07-03",
            "customer_id": "customer-product-txn",
            "customer_name": "商品交易客户",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-08-10",
            "payment_terms": "30% T/T",
            "source_quotation_id": None,
            "source_quotation_no": "QT-PRODUCT-TXN-001",
            "remarks": "商品交易记录合同",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "1000",
                    "unit": product["unit"],
                    "unit_price": "1.40",
                    "purchased_quantity": "0",
                    "shipped_quantity": "0",
                    "image_url": product["image_url"],
                    "remark": "商品交易记录合同",
                }
            ],
        },
    )
    assert contract_response.status_code == 201
    contract_id = contract_response.json()["data"]["id"]
    await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/submit",
        headers=headers,
    )
    approve_contract_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-06"},
    )
    assert approve_contract_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers=headers,
        json={
            "code": "SP-PRODUCT-TXN-001",
            "shipment_date": "2026-08-18",
            "planned_ship_date": "2026-08-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-PRODUCT-TXN-001",
            "booking_no": "BOOK-PRODUCT-TXN-001",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "200.00",
            "remarks": "商品交易记录出货",
            "selections": [{"contract_id": contract_id, "quantity": "300"}],
        },
    )
    assert shipment_response.status_code == 201

    inquiry_response = await api_client.post(
        "/api/v1/purchase/inquiries",
        headers=headers,
        json={
            "code": "PI-PRODUCT-TXN-001",
            "inquiry_date": "2026-08-01",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "remarks": "商品交易记录询价",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "500",
                    "unit": product["unit"],
                }
            ],
        },
    )
    assert inquiry_response.status_code == 201

    purchase_contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json={
            "code": "PC-PRODUCT-TXN-001",
            "contract_date": "2026-08-05",
            "supplier_id": "supplier-product-txn",
            "supplier_name": "商品交易供应商",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "currency": "USD",
            "delivery_date": "2026-08-28",
            "payment_terms": "30% 预付，70% 出货前",
            "source_type": "stock_purchase",
            "remarks": "商品交易记录采购合同",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "500",
                    "unit": product["unit"],
                    "unit_price": "0.82",
                    "source_export_contract_id": None,
                    "source_export_contract_no": None,
                    "source_export_contract_line_id": None,
                    "remark": "商品交易记录采购合同",
                }
            ],
        },
    )
    assert purchase_contract_response.status_code == 201

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/products/{product_id}/transactions",
        headers=headers,
    )
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()["data"]["items"]
    by_type = {item["source_type"]: item for item in transactions}
    assert by_type["export_quotation"]["source_code"] == "QT-PRODUCT-TXN-001"
    assert by_type["export_quotation"]["amount"] == "1250.00"
    assert by_type["export_contract"]["source_code"] == "EC-PRODUCT-TXN-001"
    assert by_type["shipment"]["source_code"] == "SP-PRODUCT-TXN-001"
    assert by_type["purchase_inquiry"]["source_code"] == "PI-PRODUCT-TXN-001"
    assert by_type["purchase_inquiry"]["amount"] is None
    assert by_type["purchase_contract"]["source_code"] == "PC-PRODUCT-TXN-001"
    assert by_type["purchase_contract"]["counterparty_name"] == "商品交易供应商"


async def test_product_transactions_include_inventory_ledger_after_inbound_approval(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    product_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers=headers,
        json=_product_payload(code="P-INV-TXN-001"),
    )
    assert product_response.status_code == 201
    product = product_response.json()["data"]
    product_id = product["id"]

    purchase_contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json={
            "code": "PC-INV-TXN-001",
            "contract_date": "2026-08-05",
            "supplier_id": "supplier-inv-txn",
            "supplier_name": "库存交易供应商",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "currency": "USD",
            "delivery_date": "2026-08-30",
            "payment_terms": "30% 预付，70% 出货前",
            "source_type": "stock_purchase",
            "remarks": "商品库存流水测试采购合同",
            "lines": [
                {
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "specification": product["specification"],
                    "model": product["model"],
                    "quantity": "1000",
                    "unit": product["unit"],
                    "unit_price": "1.20",
                    "source_export_contract_id": None,
                    "source_export_contract_no": None,
                    "source_export_contract_line_id": None,
                    "remark": "商品库存流水测试采购合同",
                }
            ],
        },
    )
    assert purchase_contract_response.status_code == 201
    purchase_contract = purchase_contract_response.json()["data"]
    contract_id = purchase_contract["id"]
    await api_client.post(f"/api/v1/purchase/contracts/{contract_id}/submit", headers=headers)
    approve_contract_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-05"},
    )
    assert approve_contract_response.status_code == 200

    plans_response = await api_client.get(
        "/api/v1/warehouse/inbound-plans",
        headers=headers,
        params={"purchase_contract_id": contract_id},
    )
    assert plans_response.status_code == 200
    plan = plans_response.json()["data"]["items"][0]

    inspection_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-INV-TXN-001",
            "purchase_contract_id": contract_id,
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc-001",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-inv-txn",
            "lines": [
                {
                    "purchase_contract_line_id": purchase_contract["lines"][0]["id"],
                    "product_id": product_id,
                    "product_code": product["code"],
                    "product_name": product["en_name"],
                    "inspected_quantity": "1000",
                    "failed_quantity": "0",
                    "unit": product["unit"],
                    "result": "passed",
                    "remark": "全检通过",
                }
            ],
            "issues": [],
        },
    )
    assert inspection_response.status_code == 201

    inbound_order_response = await api_client.post(
        "/api/v1/warehouse/inbound-orders/from-plan",
        headers=headers,
        json={
            "plan_id": plan["id"],
            "code": "IO-PRODUCT-TXN-001",
            "inbound_mode": "formal",
            "inbound_at": "2026-08-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-a-01",
            "location_name": "A-01",
            "operator_name": "仓库主管",
            "lines": [],
        },
    )
    assert inbound_order_response.status_code == 201
    inbound_order = inbound_order_response.json()["data"]
    await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{inbound_order['id']}/submit",
        headers=headers,
    )
    approve_inbound_response = await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{inbound_order['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-30"},
    )
    assert approve_inbound_response.status_code == 200

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/products/{product_id}/transactions",
        headers=headers,
    )
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()["data"]["items"]
    by_type = {item["source_type"]: item for item in transactions}
    assert by_type["inventory_ledger"]["source_code"] == "IO-PRODUCT-TXN-001"
    assert by_type["inventory_ledger"]["quantity"] == "1000.0000"
    assert by_type["inventory_ledger"]["summary"] == "库存流水 IO-PRODUCT-TXN-001 · 入库"


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
