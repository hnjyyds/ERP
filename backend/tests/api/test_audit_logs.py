from httpx import AsyncClient


async def _login_token(
    api_client: AsyncClient,
    username: str,
    password: str,
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


def _reimbursement_payload(reimbursement_no: str = "RB-AUDIT-001") -> dict[str, object]:
    return {
        "reimbursement_no": reimbursement_no,
        "applicant_user_id": "u-001",
        "applicant_user_name": "演示业务主管",
        "department": "业务一部",
        "category": "travel",
        "currency": "CNY",
        "amount": "300.00",
        "reviewer_id": "u-finance-manager",
        "reason": "审计埋点验证",
        "remark": "",
        "items": [{"expense_item": "交通费", "amount": "300.00", "remark": ""}],
    }


async def test_audit_log_records_reimbursement_submission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    admin_token = await _login_token(api_client, "admin", "admin123")

    create_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json=_reimbursement_payload(),
    )
    assert create_response.status_code == 201

    response = await api_client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"resource_type": "reimbursement", "action": "submit", "keyword": "RB-AUDIT"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] == 1
    item = data["items"][0]
    assert item["resource_no"] == "RB-AUDIT-001"
    assert item["actor_user_id"] == "u-finance"
    assert item["summary"] == "提交报销单"
    assert item["payload"] is None


async def test_audit_log_filters_and_export(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    admin_token = await _login_token(api_client, "admin", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    await api_client.post(
        "/api/v1/finance/reimbursements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json=_reimbursement_payload("RB-AUDIT-002"),
    )

    empty_response = await api_client.get(
        "/api/v1/audit-logs",
        headers=headers,
        params={"created_from": "2999-01-01T00:00:00Z"},
    )
    assert empty_response.status_code == 200
    assert empty_response.json()["data"]["total"] == 0

    actor_response = await api_client.get(
        "/api/v1/audit-logs",
        headers=headers,
        params={"actor": "u-finance", "limit": 1, "offset": 0},
    )
    assert actor_response.status_code == 200
    assert actor_response.json()["data"]["total"] == 1

    export_response = await api_client.get(
        "/api/v1/audit-logs/export",
        headers=headers,
        params={"keyword": "RB-AUDIT-002"},
    )
    assert export_response.status_code == 200
    export = export_response.json()["data"]
    assert export["filename"].endswith(".csv")
    assert export["content_type"] == "text/csv"
    assert "RB-AUDIT-002" in export["content"]
    assert "提交报销单" in export["content"]
    assert "RB-AUDIT-001" not in export["content"]


async def test_audit_logs_are_super_admin_only(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    admin_token = await _login_token(api_client, "admin", "admin123")

    denied = await api_client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert denied.status_code == 403

    denied_export = await api_client.get(
        "/api/v1/audit-logs/export",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert denied_export.status_code == 403

    menus = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    finance_paths = {item["path"] for item in menus.json()["data"]["menus"]}
    assert "/system/audit-logs" not in finance_paths

    admin_menus = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    admin_paths = {item["path"] for item in admin_menus.json()["data"]["menus"]}
    assert "/system/audit-logs" in admin_paths
