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


def _product_payload(code: str = "BAG-PC-API") -> dict[str, object]:
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
        "image_url": None,
        "accessories": [
            {
                "accessory_name": "棉绳",
                "unit_consumption": "0.45",
                "unit": "m",
                "default_supplier_name": "华东包装制品厂",
                "purchase_split_rule": "by_supplier",
            }
        ],
    }


def _export_contract_payload(
    code: str,
    product_id: str | None,
    quantity: str,
    *,
    product_code: str = "BAG-40",
) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-08-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "planned_ship_date": "2026-09-01",
        "payment_terms": "30% T/T",
        "source_quotation_id": None,
        "source_quotation_no": None,
        "remarks": "采购合同生成来源",
        "lines": [
            {
                "product_id": product_id,
                "product_code": product_code,
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": quantity,
                "unit": "pcs",
                "unit_price": "1.40",
                "purchased_quantity": "0",
                "shipped_quantity": "0",
                "image_url": None,
                "remark": "出口合同明细",
            }
        ],
    }


def _stock_purchase_payload(code: str = "PC-API-STOCK") -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-08-05",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "qc_user_id": "u-001",
        "qc_user_name": "前端传入姓名会被后端覆盖",
        "currency": "USD",
        "delivery_date": "2026-08-28",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "库存采购",
        "lines": [
            {
                "product_id": "accessory-cotton-rope",
                "product_code": "ACC-ROPE",
                "product_name": "棉绳",
                "specification": "5mm",
                "model": "ROPE-5",
                "quantity": "450",
                "unit": "m",
                "unit_price": "0.12",
                "source_export_contract_id": None,
                "source_export_contract_no": None,
                "source_export_contract_line_id": None,
                "remark": "安全库存",
            }
        ],
    }


async def _create_approved_export_contract(
    api_client: AsyncClient,
    token: str,
    *,
    code: str,
    product_id: str,
    quantity: str,
) -> str:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_export_contract_payload(code, product_id, quantity),
    )
    assert create_response.status_code == 201
    contract_id = create_response.json()["data"]["id"]
    reviewer_token = await _login_token(api_client, "admin", "admin123")
    submit_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_id": "u-admin"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-02"},
    )
    assert approve_response.status_code == 200
    return contract_id


async def test_purchase_contract_flow_generate_stock_approve_and_reminders(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    product_response = await api_client.post(
        "/api/v1/masterdata/products",
        headers={"Authorization": f"Bearer {token}"},
        json=_product_payload(),
    )
    product_id = product_response.json()["data"]["id"]
    export_a_id = await _create_approved_export_contract(
        api_client,
        token,
        code="EC-PC-API-A",
        product_id=product_id,
        quantity="1000",
    )
    export_b_id = await _create_approved_export_contract(
        api_client,
        token,
        code="EC-PC-API-B",
        product_id=product_id,
        quantity="500",
    )

    generate_response = await api_client.post(
        "/api/v1/purchase/contracts/generate-from-export-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "PC-API-GEN",
            "contract_date": "2026-08-06",
            "supplier_id": "supplier-pack-a",
            "supplier_name": "华东包装制品厂",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "qc_user_id": "u-qc",
            "qc_user_name": "前端传入姓名会被后端覆盖",
            "currency": "USD",
            "delivery_date": "2026-08-30",
            "payment_terms": "30% 预付，70% 出货前",
            "unit_price": "0.12",
            "remarks": "两个出口合同合并采购棉绳",
            "sources": [
                {"export_contract_id": export_a_id},
                {"export_contract_id": export_b_id},
            ],
        },
    )
    assert generate_response.status_code == 201
    generated = generate_response.json()["data"]
    assert generated["source_type"] == "export_contract"
    assert generated["qc_user_id"] == "u-qc"
    assert generated["qc_user_name"] == "演示 QC 专员"
    assert generated["lines"][0]["product_name"] == "棉绳"
    assert generated["lines"][0]["quantity"] == "675"
    assert generated["statistics"]["total_amount"] == "81.00"
    assert len(generated["source_links"]) == 2
    assert {item["reminder_type"] for item in generated["reminders"]} == {
        "delivery",
        "payment",
    }
    contract_id = generated["id"]

    generated_line = generated["lines"][0]
    update_payload = {
        "code": "PC-API-GEN",
        "contract_date": "2026-08-06",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂-编辑",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "qc_user_id": "u-001",
        "qc_user_name": "前端传入姓名会被后端覆盖",
        "currency": "USD",
        "delivery_date": "2026-08-30",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "export_contract",
        "remarks": "两个出口合同合并采购棉绳",
        "lines": [
            {
                "product_id": generated_line["product_id"],
                "product_code": generated_line["product_code"],
                "product_name": generated_line["product_name"],
                "specification": generated_line["specification"],
                "model": generated_line["model"],
                "quantity": generated_line["quantity"],
                "unit": generated_line["unit"],
                "unit_price": generated_line["unit_price"],
                "source_export_contract_id": generated_line["source_export_contract_id"],
                "source_export_contract_no": generated_line["source_export_contract_no"],
                "source_export_contract_line_id": generated_line["source_export_contract_line_id"],
                "remark": generated_line["remark"],
            }
        ],
    }
    update_response = await api_client.put(
        f"/api/v1/purchase/contracts/{contract_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert update_response.status_code == 200
    updated_data = update_response.json()["data"]
    assert updated_data["supplier_name"] == "华东包装制品厂-编辑"
    assert updated_data["qc_user_id"] == "u-001"
    assert updated_data["qc_user_name"] == "演示业务主管"

    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200

    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-07"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["approval_status"] == "approved"
    assert approved["statistics"]["unpaid_amount"] == "81.00"

    export_detail_response = await api_client.get(
        f"/api/v1/sales/contracts/{export_a_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert export_detail_response.status_code == 200
    export_detail = export_detail_response.json()["data"]
    assert export_detail["purchase_statuses"][0]["purchased_quantity"] == "1000"

    stock_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_stock_purchase_payload("PC-API-STOCK"),
    )
    assert stock_response.status_code == 201
    stock_data = stock_response.json()["data"]
    assert stock_data["source_type"] == "stock_purchase"
    assert stock_data["qc_user_id"] == "u-001"
    assert stock_data["qc_user_name"] == "演示业务主管"

    reminders_response = await api_client.get(
        "/api/v1/purchase/contracts/reminders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert reminders_response.status_code == 200
    assert reminders_response.json()["data"]["total"] >= 4


async def test_purchase_contract_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/purchase/contracts")

    assert response.status_code == 401


async def test_purchase_contract_requires_designated_reviewer(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    submitter_token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {submitter_token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_stock_purchase_payload("PC-DESIGNATED-REVIEWER"),
    )
    assert create_response.status_code == 201
    contract_id = create_response.json()["data"]["id"]

    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200
    submitted = submit_response.json()["data"]
    assert submitted["reviewer_id"] == "u-purchase"
    assert submitted["reviewer_name"] == "演示采购专员"

    wrong_reviewer_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers=headers,
        json={"approved_at": "2026-08-07"},
    )
    assert wrong_reviewer_response.status_code == 403

    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-07"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["reviewer_id"] == "u-purchase"
    assert approved["reviewer_name"] == "演示采购专员"


async def test_purchase_contract_can_be_rejected_edited_and_resubmitted(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    submitter_token = await _login_token(api_client)
    submitter_headers = {"Authorization": f"Bearer {submitter_token}"}
    payload = _stock_purchase_payload("PC-REJECT-AND-RESUBMIT")
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=submitter_headers,
        json=payload,
    )
    assert create_response.status_code == 201
    contract_id = create_response.json()["data"]["id"]

    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers=submitter_headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200

    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}
    reject_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers=reviewer_headers,
        json={
            "decision": "rejected",
            "approved_at": "2026-08-08",
            "rejection_reason": "付款条款与报价单不一致",
        },
    )
    assert reject_response.status_code == 200
    rejected = reject_response.json()["data"]
    assert rejected["approval_status"] == "rejected"
    assert rejected["approved_at"] is None
    assert rejected["rejected_at"] == "2026-08-08"
    assert rejected["rejection_reason"] == "付款条款与报价单不一致"
    assert rejected["reviewer_id"] == "u-purchase"

    payload["payment_terms"] = "30% 预付，70% 出货前；已与报价单核对"
    update_response = await api_client.put(
        f"/api/v1/purchase/contracts/{contract_id}",
        headers=submitter_headers,
        json=payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["approval_status"] == "draft"
    assert updated["rejected_at"] is None
    assert updated["rejection_reason"] is None

    resubmit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers=submitter_headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert resubmit_response.status_code == 200
    assert resubmit_response.json()["data"]["approval_status"] == "submitted"


async def test_purchase_contract_rejection_requires_reason(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    submitter_token = await _login_token(api_client)
    submitter_headers = {"Authorization": f"Bearer {submitter_token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=submitter_headers,
        json=_stock_purchase_payload("PC-REJECT-WITHOUT-REASON"),
    )
    contract_id = create_response.json()["data"]["id"]
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers=submitter_headers,
        json={"reviewer_id": "u-purchase"},
    )

    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={
            "decision": "rejected",
            "approved_at": "2026-08-08",
            "rejection_reason": "",
        },
    )

    assert response.status_code == 422


async def test_purchase_contract_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/purchase/contracts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


async def test_purchase_generation_returns_specific_missing_product_message(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    export_id = await _create_approved_export_contract(
        api_client,
        token,
        code="EC-PC-API-MISSING-PRODUCT",
        product_id=None,
        quantity="120",
    )

    response = await api_client.post(
        "/api/v1/purchase/contracts/generate-from-export-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "PC-API-MISSING-PRODUCT",
            "contract_date": "2026-08-06",
            "supplier_name": "华东包装制品厂",
            "currency": "USD",
            "delivery_date": "2026-08-30",
            "payment_terms": "30% 预付，70% 出货前",
            "unit_price": "0.12",
            "sources": [{"export_contract_id": export_id}],
        },
    )

    assert response.status_code == 422
    assert response.json()["message"] == "商品编码 BAG-40 未关联商品资料，请先选择商品后重试"
