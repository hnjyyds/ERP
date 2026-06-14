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


async def _approved_shipment(
    api_client: AsyncClient,
    token: str,
    *,
    contract_no: str = "EC-SETTLE-API-001",
    shipment_no: str = "SP-SETTLE-API-001",
) -> dict[str, object]:
    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": contract_no,
            "contract_date": "2027-01-01",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2027-01-20",
            "payment_terms": "30% T/T in advance, balance before shipment",
            "source_quotation_id": f"quotation-{contract_no}",
            "source_quotation_no": f"QT-{contract_no}",
            "remarks": "财务结算前置出口合同",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "100",
                    "unit": "pcs",
                    "unit_price": "12.00",
                    "purchased_quantity": "100",
                    "shipped_quantity": "0",
                    "image_url": "https://example.test/product.png",
                    "remark": "财务结算合同",
                },
            ],
        },
    )
    assert contract_response.status_code == 201
    contract = contract_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-01-02"},
    )
    assert approve_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": shipment_no,
            "shipment_date": "2027-01-15",
            "planned_ship_date": "2027-01-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": f"CONT-{shipment_no}",
            "booking_no": f"BOOK-{shipment_no}",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "财务结算前置出货单",
            "selections": [{"contract_id": contract["id"], "quantity": "50"}],
        },
    )
    assert shipment_response.status_code == 201
    shipment = shipment_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approved_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-01-16"},
    )
    assert approved_response.status_code == 200
    return approved_response.json()["data"]


async def _create_tax_refund(
    api_client: AsyncClient,
    token: str,
    shipment: dict[str, object],
) -> None:
    document_response = await api_client.post(
        "/api/v1/finance/verification-documents",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "document_no": "VD-SETTLE-API-001",
            "received_at": "2027-01-17",
            "owner_user_id": "u-001",
            "owner_user_name": "演示业务主管",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "customer_name": shipment["customer_name"],
            "currency": "USD",
            "refundable_amount": "96.00",
            "valid_until": "2027-02-16",
            "remark": "结算前核销单",
        },
    )
    assert document_response.status_code == 201
    document = document_response.json()["data"]
    await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/customs-receipt",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customs_declaration_no": "CD-SETTLE-API-001",
            "customs_receipt_no": "CR-SETTLE-API-001",
            "received_at": "2027-01-18",
        },
    )
    await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/verify",
        headers={"Authorization": f"Bearer {token}"},
        json={"verification_no": "VERIFY-SETTLE-API-001", "verified_at": "2027-01-19"},
    )
    refund_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/tax-refunds",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "refund_no": "TR-SETTLE-API-001",
            "refunded_at": "2027-01-20",
            "amount": "96.00",
            "currency": "USD",
        },
    )
    assert refund_response.status_code == 201


async def _create_misc_fee(
    api_client: AsyncClient,
    token: str,
    shipment: dict[str, object],
    *,
    allocation_no: str,
    allocated_at: str,
    amount: str,
) -> None:
    item_response = await api_client.post(
        "/api/v1/finance/misc-fee-items",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": f"OFFICE-{allocation_no}",
            "name": "办公费用",
            "category": "office",
            "default_allocation_method": "manual",
            "is_active": True,
        },
    )
    assert item_response.status_code == 201
    item = item_response.json()["data"]
    allocation_response = await api_client.post(
        "/api/v1/finance/misc-fee-allocations",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "allocation_no": allocation_no,
            "item_id": item["id"],
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "allocated_at": allocated_at,
            "amount": amount,
            "currency": "USD",
            "allocation_method": "manual",
        },
    )
    assert allocation_response.status_code == 201


async def test_finance_settlement_locks_profit_by_settlement_date_and_manual_cost(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(api_client, business_token)
    await _create_tax_refund(api_client, finance_token, shipment)
    await _create_misc_fee(
        api_client,
        finance_token,
        shipment,
        allocation_no="MFA-SETTLE-BEFORE",
        allocated_at="2027-01-21",
        amount="36.00",
    )
    await _create_misc_fee(
        api_client,
        finance_token,
        shipment,
        allocation_no="MFA-SETTLE-AFTER",
        allocated_at="2027-01-25",
        amount="12.00",
    )

    response = await api_client.post(
        "/api/v1/finance/settlements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "settlement_no": "FS-SETTLE-API-001",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "settlement_date": "2027-01-22",
            "remark": "锁定单票利润",
        },
    )
    assert response.status_code == 201
    settlement = response.json()["data"]
    assert settlement["settlement_no"] == "FS-SETTLE-API-001"
    assert settlement["status"] == "locked"
    assert settlement["sales_income"] == "600.00"
    assert settlement["purchase_cost_amount"] == "420.00"
    assert settlement["tax_refund_amount"] == "96.00"
    assert settlement["misc_fee_amount"] == "36.00"
    assert settlement["manual_cost_amount"] == "0.00"
    assert settlement["gross_profit"] == "240.00"
    assert settlement["gross_profit_rate"] == "40.00"
    cost_types = {item["cost_type"] for item in settlement["cost_items"]}
    assert {"sales_income", "purchase_cost", "tax_refund", "misc_fee"} <= cost_types

    manual_response = await api_client.post(
        f"/api/v1/finance/settlements/{settlement['id']}/manual-costs",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "cost_no": "MC-SETTLE-API-001",
            "cost_type": "other_cost",
            "cost_date": "2027-01-22",
            "amount": "18.00",
            "currency": "USD",
            "source_no": "OFFICE-ADJ-001",
            "reason": "补录单票其他成本",
            "remark": "手工成本关联",
        },
    )
    assert manual_response.status_code == 201
    updated = manual_response.json()["data"]
    assert updated["manual_cost_amount"] == "18.00"
    assert updated["gross_profit"] == "222.00"
    assert updated["gross_profit_rate"] == "37.00"
    manual_cost = next(item for item in updated["cost_items"] if item["cost_type"] == "other_cost")
    assert manual_cost["amount"] == "18.00"
    assert manual_cost["source_no"] == "OFFICE-ADJ-001"

    profit_response = await api_client.get(
        "/api/v1/finance/profit-calculations",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"shipment_no": shipment["code"]},
    )
    assert profit_response.status_code == 200
    profits = profit_response.json()["data"]
    assert profits["total"] == 1
    assert profits["items"][0]["settlement_no"] == "FS-SETTLE-API-001"
    assert profits["items"][0]["gross_profit"] == "222.00"


async def test_finance_settlement_rejects_permissions_and_invalid_inputs(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(
        api_client,
        business_token,
        contract_no="EC-SETTLE-API-002",
        shipment_no="SP-SETTLE-API-002",
    )

    denied_response = await api_client.post(
        "/api/v1/finance/settlements",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "settlement_no": "FS-DENIED",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "settlement_date": "2027-01-22",
        },
    )
    assert denied_response.status_code == 403

    unauthorized_response = await api_client.get("/api/v1/finance/profit-calculations")
    assert unauthorized_response.status_code == 401

    early_response = await api_client.post(
        "/api/v1/finance/settlements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "settlement_no": "FS-EARLY",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "settlement_date": "2027-01-10",
        },
    )
    assert early_response.status_code == 422

    settlement_response = await api_client.post(
        "/api/v1/finance/settlements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "settlement_no": "FS-SETTLE-API-002",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "settlement_date": "2027-01-22",
        },
    )
    assert settlement_response.status_code == 201
    settlement = settlement_response.json()["data"]

    currency_response = await api_client.post(
        f"/api/v1/finance/settlements/{settlement['id']}/manual-costs",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "cost_no": "MC-CURRENCY",
            "cost_type": "other_cost",
            "cost_date": "2027-01-22",
            "amount": "18.00",
            "currency": "CNY",
            "reason": "币种不一致",
        },
    )
    assert currency_response.status_code == 422
