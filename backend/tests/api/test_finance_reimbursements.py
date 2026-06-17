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


def _reimbursement_payload(
    reimbursement_no: str = "RB-API-001",
) -> dict[str, object]:
    return {
        "reimbursement_no": reimbursement_no,
        "applicant_user_id": "u-001",
        "applicant_user_name": "演示业务主管",
        "department": "业务一部",
        "category": "travel",
        "currency": "CNY",
        "amount": "300.00",
        "reason": "出差客户拜访",
        "remark": "差旅报销",
        "items": [
            {"expense_item": "交通费", "amount": "200.00", "remark": "高铁往返"},
            {"expense_item": "住宿费", "amount": "100.00", "remark": "酒店一晚"},
        ],
    }


async def test_finance_reimbursement_full_flow(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    headers = {"Authorization": f"Bearer {finance_token}"}

    create_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers=headers,
        json=_reimbursement_payload(),
    )
    assert create_response.status_code == 201
    reimbursement = create_response.json()["data"]
    assert reimbursement["status"] == "submitted"
    assert reimbursement["amount"] == "300.00"
    assert len(reimbursement["items"]) == 2

    list_response = await api_client.get(
        "/api/v1/finance/reimbursements",
        headers=headers,
        params={"status": "submitted", "category": "travel"},
    )
    assert list_response.status_code == 200
    listing = list_response.json()["data"]
    assert listing["total"] == 1
    assert listing["total_amount"] == "300.00"
    assert listing["items"][0]["reimbursement_no"] == "RB-API-001"

    approve_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/approve",
        headers=headers,
        json={"approved": True, "approval_remark": "同意报销"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["status"] == "approved"
    assert approved["approval_remark"] == "同意报销"

    pay_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/pay",
        headers=headers,
        json={"payment_method": "bank_transfer", "remark": "已转账"},
    )
    assert pay_response.status_code == 200
    paid = pay_response.json()["data"]
    assert paid["status"] == "paid"
    assert paid["payment_method"] == "bank_transfer"


async def test_finance_reimbursement_permissions_and_invalid_transitions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    finance_headers = {"Authorization": f"Bearer {finance_token}"}

    unauthorized_response = await api_client.get("/api/v1/finance/reimbursements")
    assert unauthorized_response.status_code == 401

    denied_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers={"Authorization": f"Bearer {business_token}"},
        json=_reimbursement_payload("RB-API-DENIED"),
    )
    assert denied_response.status_code == 403

    create_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers=finance_headers,
        json=_reimbursement_payload("RB-API-002"),
    )
    assert create_response.status_code == 201
    reimbursement = create_response.json()["data"]

    # 未审批不能直接付款
    early_pay_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/pay",
        headers=finance_headers,
        json={"payment_method": "cash"},
    )
    assert early_pay_response.status_code == 422

    reject_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/approve",
        headers=finance_headers,
        json={"approved": False, "approval_remark": "票据不全"},
    )
    assert reject_response.status_code == 200
    assert reject_response.json()["data"]["status"] == "rejected"

    # 已拒绝不能再次审批
    reapprove_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/approve",
        headers=finance_headers,
        json={"approved": True},
    )
    assert reapprove_response.status_code == 422

    # 已拒绝不能付款
    pay_rejected_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement['id']}/pay",
        headers=finance_headers,
        json={"payment_method": "bank_transfer"},
    )
    assert pay_rejected_response.status_code == 422

    # 无效分类 422
    invalid_category_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers=finance_headers,
        json={**_reimbursement_payload("RB-API-003"), "category": "unknown"},
    )
    assert invalid_category_response.status_code == 422

    # 明细金额合计不等于总额 422
    mismatch_payload = _reimbursement_payload("RB-API-004")
    mismatch_payload["amount"] = "999.00"
    mismatch_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers=finance_headers,
        json=mismatch_payload,
    )
    assert mismatch_response.status_code == 422

    # 审批不存在的报销单 404
    missing_response = await api_client.post(
        "/api/v1/finance/reimbursements/does-not-exist/approve",
        headers=finance_headers,
        json={"approved": True},
    )
    assert missing_response.status_code == 404
