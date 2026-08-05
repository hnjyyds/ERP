import pytest
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


def _purchase_contract_payload(
    code: str = "PC-QC-API",
    *,
    qc_user_id: str | None = None,
    qc_user_name: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "code": code,
        "contract_date": "2026-08-05",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2026-08-30",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "QC 查验 API 测试",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.2",
                "source_export_contract_id": None,
                "source_export_contract_no": None,
                "source_export_contract_line_id": None,
                "remark": "QC 查验 API 测试",
            }
        ],
    }
    if qc_user_id is not None:
        payload["qc_user_id"] = qc_user_id
    if qc_user_name is not None:
        payload["qc_user_name"] = qc_user_name
    return payload


async def test_quality_inspection_api_creates_record_and_updates_followup(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload(),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200

    inspection_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-API-001",
            "purchase_contract_id": contract["id"],
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-api",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "120",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                    "remark": "首检通过",
                }
            ],
            "issues": [],
        },
    )
    assert inspection_response.status_code == 201
    inspection = inspection_response.json()["data"]
    assert inspection["result"] == "passed"
    assert inspection["purchase_contract_no"] == "PC-QC-API"
    assert inspection["qc_user_id"] is None
    assert inspection["qc_user_name"] is None
    assert inspection["lines"][0]["inspected_quantity"] == "120"

    list_response = await api_client.get(
        "/api/v1/quality/inspections",
        headers=headers,
        params={"q": "QC-API-001"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    eligibility_response = await api_client.get(
        "/api/v1/quality/inspections/inbound-eligibility",
        headers=headers,
        params={"purchase_contract_id": contract["id"]},
    )
    assert eligibility_response.status_code == 200
    eligibility = eligibility_response.json()["data"]
    assert eligibility["eligible"] is True
    assert eligibility["latest_result"] == "passed"

    followup_response = await api_client.get(
        "/api/v1/followup/plans",
        headers=headers,
        params={"q": "PC-QC-API"},
    )
    assert followup_response.status_code == 200
    plan = followup_response.json()["data"]["items"][0]
    qc_node = next(node for node in plan["nodes"] if node["node_code"] == "quality_inspection")
    assert qc_node["actual_date"] == "2026-08-19"
    assert qc_node["source_record_type"] == "quality_inspection"
    assert qc_node["source_record_id"] == inspection["id"]


async def test_quality_inspection_api_creates_a_scheduled_pending_task_without_result(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-QC-TASK-API"),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    assert (
        await api_client.post(
            f"/api/v1/purchase/contracts/{contract['id']}/submit",
            headers=headers,
            json={"reviewer_id": "u-purchase"},
        )
    ).status_code == 200
    assert (
        await api_client.post(
            f"/api/v1/purchase/contracts/{contract['id']}/approve",
            headers={"Authorization": f"Bearer {reviewer_token}"},
            json={"approved_at": "2026-08-05"},
        )
    ).status_code == 200

    task_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-TASK-API-001",
            "purchase_contract_id": contract["id"],
            "scheduled_at": "2026-08-20T09:30:00",
            "status": "pending",
            "inspector_id": "u-qc",
            "inspector_name": "QC 张工",
            "issue_summary": "宁波仓验货",
            "attachment_group_id": None,
            "lines": [],
            "issues": [],
        },
    )

    assert task_response.status_code == 201
    task = task_response.json()["data"]
    assert task["status"] == "pending"
    assert task["scheduled_at"] == "2026-08-20T09:30:00"
    assert task["inspected_at"] is None
    assert task["result"] is None
    assert task["lines"] == []
    list_response = await api_client.get(
        "/api/v1/quality/inspections",
        headers=headers,
        params={
            "inspector_user_id": "u-qc",
            "status": "pending",
            "q": "QC-TASK-API-001",
        },
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    eligibility_response = await api_client.get(
        "/api/v1/quality/inspections/inbound-eligibility",
        headers=headers,
        params={"purchase_contract_id": contract["id"]},
    )
    assert eligibility_response.status_code == 200
    eligibility = eligibility_response.json()["data"]
    assert eligibility["eligible"] is False
    assert eligibility["latest_inspection_id"] == task["id"]
    assert eligibility["latest_status"] == "pending"
    assert eligibility["latest_result"] is None
    assert eligibility["reason"] == "最新 QC 任务尚未完成"

    followup_response = await api_client.get(
        "/api/v1/followup/plans",
        headers=headers,
        params={"q": "PC-QC-TASK-API"},
    )
    assert followup_response.status_code == 200
    plan = followup_response.json()["data"]["items"][0]
    qc_node = next(node for node in plan["nodes"] if node["node_code"] == "quality_inspection")
    assert qc_node["actual_date"] is None
    assert qc_node["source_record_id"] is None

    start_response = await api_client.put(
        f"/api/v1/quality/inspections/{task['id']}",
        headers=headers,
        json={
            "code": task["code"],
            "purchase_contract_id": contract["id"],
            "scheduled_at": task["scheduled_at"],
            "status": "in_progress",
            "inspector_id": task["inspector_id"],
            "inspector_name": task["inspector_name"],
            "issue_summary": task["issue_summary"],
            "attachment_group_id": task["attachment_group_id"],
            "lines": [],
            "issues": [],
        },
    )
    assert start_response.status_code == 200
    assert start_response.json()["data"]["status"] == "in_progress"

    complete_response = await api_client.put(
        f"/api/v1/quality/inspections/{task['id']}",
        headers=headers,
        json={
            "code": task["code"],
            "purchase_contract_id": contract["id"],
            "scheduled_at": task["scheduled_at"],
            "status": "completed",
            "inspected_at": "2026-08-20",
            "result": "passed",
            "inspector_id": task["inspector_id"],
            "inspector_name": task["inspector_name"],
            "issue_summary": task["issue_summary"],
            "attachment_group_id": task["attachment_group_id"],
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "1000",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                    "remark": "任务完成",
                }
            ],
            "issues": [],
        },
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["data"]["status"] == "completed"

    completed_followup_response = await api_client.get(
        "/api/v1/followup/plans",
        headers=headers,
        params={"q": "PC-QC-TASK-API"},
    )
    completed_plan = completed_followup_response.json()["data"]["items"][0]
    completed_qc_node = next(
        node for node in completed_plan["nodes"] if node["node_code"] == "quality_inspection"
    )
    assert completed_qc_node["actual_date"] == "2026-08-20"
    assert completed_qc_node["source_record_id"] == task["id"]


async def test_quality_inspection_rejects_assignee_without_quality_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-QC-INVALID-ASSIGNEE"),
    )
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"reviewer_name": "演示采购专员", "approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200

    response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-INVALID-ASSIGNEE",
            "purchase_contract_id": contract["id"],
            "scheduled_at": "2026-08-20T09:30:00",
            "status": "pending",
            "inspector_id": "u-warehouse",
            "inspector_name": "伪造姓名",
            "lines": [],
            "issues": [],
        },
    )

    assert response.status_code == 422
    assert response.json()["message"] == "所选员工没有 QC 查验权限"


async def test_quality_inspection_api_inherits_contract_qc_assignee_and_filters(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload(
            "PC-QC-ASSIGNED",
            qc_user_id="u-qc",
            qc_user_name="前端传入姓名会被后端覆盖",
        ),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200

    inspection_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-API-ASSIGNED",
            "purchase_contract_id": contract["id"],
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc",
            "inspector_name": "前端伪造姓名",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-assigned",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "120",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                }
            ],
            "issues": [],
        },
    )
    assert inspection_response.status_code == 201
    inspection = inspection_response.json()["data"]
    assert inspection["qc_user_id"] == "u-qc"
    assert inspection["qc_user_name"] == "演示 QC 专员"

    assigned_response = await api_client.get(
        "/api/v1/quality/inspections",
        headers=headers,
        params={"assignee_user_id": "u-qc", "q": "QC-API-ASSIGNED"},
    )
    assert assigned_response.status_code == 200
    assert assigned_response.json()["data"]["total"] == 1

    other_response = await api_client.get(
        "/api/v1/quality/inspections",
        headers=headers,
        params={"assignee_user_id": "u-qc-002", "q": "QC-API-ASSIGNED"},
    )
    assert other_response.status_code == 200
    assert other_response.json()["data"]["total"] == 0


async def test_quality_inspection_api_rejects_unauthorized_and_finance_role(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/quality/inspections")
    assert unauthorized_response.status_code == 401

    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/quality/inspections",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


async def test_quality_inspection_api_rejects_unapproved_contract(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-UNAPPROVED-QC"),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]

    inspection_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-UNAPPROVED",
            "purchase_contract_id": contract["id"],
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-unapproved",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "50",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                }
            ],
            "issues": [],
        },
    )
    assert inspection_response.status_code == 422
    message = inspection_response.json()["error"]["message"]
    assert message == "请先审批该采购合同，再登记 QC 查验"


async def test_quality_inspection_api_returns_field_level_validation_details(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/quality/inspections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": " ",
            "purchase_contract_id": "",
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "",
            "inspector_name": " ",
            "lines": [
                {
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "120",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                }
            ],
            "issues": [],
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    details = body["error"]["details"]
    assert {detail["field"] for detail in details} == {
        "code",
        "purchase_contract_id",
        "inspector_id",
        "inspector_name",
    }
    assert all(detail["message"] == "不能为空" for detail in details)


@pytest.mark.parametrize(
    ("result", "failed_quantity", "line_result", "issues", "expected_message"),
    [
        ("passed", "1", "passed", [], "QC 通过时不良数量必须为 0"),
        ("passed", "0", "failed", [], "QC 通过时所有明细必须通过"),
        (
            "passed",
            "0",
            "passed",
            [
                {
                    "issue_type": "包装破损",
                    "severity": "major",
                    "description": "仍有未关闭异常",
                    "status": "open",
                }
            ],
            "QC 通过时不能存在未关闭异常",
        ),
    ],
)
async def test_quality_inspection_rejects_inconsistent_completed_result(
    api_client: AsyncClient,
    seeded_system: None,
    result: str,
    failed_quantity: str,
    line_result: str,
    issues: list[dict[str, object]],
    expected_message: str,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/quality/inspections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "QC-INCONSISTENT",
            "purchase_contract_id": "contract-does-not-matter",
            "status": "completed",
            "inspected_at": "2026-08-20",
            "result": result,
            "inspector_id": "u-qc",
            "inspector_name": "演示 QC 专员",
            "lines": [
                {
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "100",
                    "failed_quantity": failed_quantity,
                    "unit": "pcs",
                    "result": line_result,
                }
            ],
            "issues": issues,
        },
    )

    assert response.status_code == 422
    messages = [detail["message"] for detail in response.json()["error"]["details"]]
    assert expected_message in messages


async def test_quality_inspection_persists_all_contract_lines_attachments_and_audit(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    contract_payload = _purchase_contract_payload("PC-QC-MULTI")
    contract_lines = contract_payload["lines"]
    assert isinstance(contract_lines, list)
    contract_lines.append(
        {
            "product_id": "product-rope",
            "product_code": "ROPE-10",
            "product_name": "Cotton Rope",
            "specification": "10mm",
            "model": "ROPE-10",
            "quantity": "500",
            "unit": "m",
            "unit_price": "0.4",
            "source_export_contract_id": None,
            "source_export_contract_no": None,
            "source_export_contract_line_id": None,
            "remark": "第二条商品",
        }
    )
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=contract_payload,
    )
    contract = create_response.json()["data"]
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    assert (
        await api_client.post(
            f"/api/v1/purchase/contracts/{contract['id']}/approve",
            headers={"Authorization": f"Bearer {reviewer_token}"},
            json={"approved_at": "2026-08-05"},
        )
    ).status_code == 200

    response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-MULTI-001",
            "purchase_contract_id": contract["id"],
            "status": "completed",
            "inspected_at": "2026-08-20",
            "result": "passed",
            "inspector_id": "u-qc",
            "inspector_name": "演示 QC 专员",
            "lines": [
                {
                    "purchase_contract_line_id": line["id"],
                    "product_id": line["product_id"],
                    "product_code": line["product_code"],
                    "product_name": line["product_name"],
                    "inspected_quantity": line["quantity"],
                    "failed_quantity": "0",
                    "unit": line["unit"],
                    "result": "passed",
                }
                for line in contract["lines"]
            ],
            "issues": [],
            "attachments": [
                {
                    "filename": "qc-evidence.png",
                    "url": "/uploads/qc-evidence.png",
                    "category": "inspection",
                }
            ],
        },
    )

    assert response.status_code == 201
    inspection = response.json()["data"]
    assert len(inspection["lines"]) == 2
    assert inspection["attachments"][0]["filename"] == "qc-evidence.png"
    assert inspection["events"][0]["event_type"] == "created"
    assert inspection["events"][0]["actor_user_id"] == "u-001"


async def test_quality_issue_resolution_and_reinspection_close_the_failed_flow(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-QC-RECHECK", qc_user_id="u-qc"),
    )
    contract = contract_response.json()["data"]
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-05"},
    )
    failed_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-RECHECK-001",
            "purchase_contract_id": contract["id"],
            "status": "completed",
            "inspected_at": "2026-08-20",
            "result": "failed",
            "inspector_id": "u-qc",
            "inspector_name": "演示 QC 专员",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "1000",
                    "failed_quantity": "35",
                    "unit": "pcs",
                    "result": "failed",
                }
            ],
            "issues": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "issue_type": "包装破损",
                    "severity": "major",
                    "description": "35 件包装破损",
                    "corrective_action": "更换包装后复检",
                    "status": "open",
                }
            ],
            "attachments": [],
        },
    )
    assert failed_response.status_code == 201
    failed = failed_response.json()["data"]
    issue = failed["issues"][0]
    assert issue["line_id"] == failed["lines"][0]["id"]

    premature_recheck = await api_client.post(
        f"/api/v1/quality/inspections/{failed['id']}/reinspection",
        headers=headers,
        json={
            "code": "QC-RECHECK-002",
            "scheduled_at": "2026-08-22T09:00:00",
            "inspector_id": "u-qc",
            "reason": "包装返工后复检",
        },
    )
    assert premature_recheck.status_code == 422
    assert premature_recheck.json()["message"] == "请先关闭全部 QC 异常，再创建复检任务"

    resolve_response = await api_client.post(
        f"/api/v1/quality/inspections/{failed['id']}/issues/{issue['id']}/resolve",
        headers=headers,
        json={
            "resolution_note": "供应商已完成换包并提交照片",
            "attachments": [
                {
                    "filename": "rectification.png",
                    "url": "/uploads/rectification.png",
                    "category": "resolution",
                }
            ],
        },
    )
    assert resolve_response.status_code == 200
    resolved = resolve_response.json()["data"]
    assert resolved["issues"][0]["status"] == "resolved"
    assert resolved["issues"][0]["resolution_note"] == "供应商已完成换包并提交照片"
    assert resolved["issues"][0]["attachments"][0]["filename"] == "rectification.png"

    recheck_response = await api_client.post(
        f"/api/v1/quality/inspections/{failed['id']}/reinspection",
        headers=headers,
        json={
            "code": "QC-RECHECK-002",
            "scheduled_at": "2026-08-22T09:00:00",
            "inspector_id": "u-qc",
            "reason": "包装返工后复检",
        },
    )
    assert recheck_response.status_code == 201
    recheck = recheck_response.json()["data"]
    assert recheck["parent_inspection_id"] == failed["id"]
    assert recheck["reinspection_no"] == 1
    assert recheck["status"] == "pending"

    eligibility_response = await api_client.get(
        "/api/v1/quality/inspections/inbound-eligibility",
        headers=headers,
        params={"purchase_contract_id": contract["id"]},
    )
    eligibility = eligibility_response.json()["data"]
    assert eligibility["eligible"] is False
    assert eligibility["latest_inspection_id"] == recheck["id"]
    assert eligibility["latest_status"] == "pending"
    assert eligibility["reason"] == "最新 QC 复检任务尚未完成"

    completed_recheck_response = await api_client.put(
        f"/api/v1/quality/inspections/{recheck['id']}",
        headers=headers,
        json={
            "code": recheck["code"],
            "purchase_contract_id": contract["id"],
            "status": "completed",
            "scheduled_at": recheck["scheduled_at"],
            "inspected_at": "2026-08-22",
            "result": "passed",
            "inspector_id": "u-qc",
            "inspector_name": "演示 QC 专员",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "1000",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                }
            ],
            "issues": [],
            "attachments": [],
        },
    )
    assert completed_recheck_response.status_code == 200

    stale_recheck_response = await api_client.post(
        f"/api/v1/quality/inspections/{failed['id']}/reinspection",
        headers=headers,
        json={
            "code": "QC-RECHECK-003",
            "scheduled_at": "2026-08-24T09:00:00",
            "inspector_id": "u-qc",
            "reason": "从旧任务重复发起复检",
        },
    )
    assert stale_recheck_response.status_code == 422
    assert stale_recheck_response.json()["message"] == "仅最新一笔未通过的 QC 任务可以创建复检"


async def test_quality_task_reschedule_and_cancel_require_reasons_and_write_audit(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    reviewer_token = await _login_token(api_client, "purchase", "purchase123")
    headers = {"Authorization": f"Bearer {token}"}
    contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-QC-SCHEDULE"),
    )
    contract = contract_response.json()["data"]
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
        json={"reviewer_id": "u-purchase"},
    )
    await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={"approved_at": "2026-08-05"},
    )
    task_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-SCHEDULE-001",
            "purchase_contract_id": contract["id"],
            "status": "pending",
            "scheduled_at": "2026-08-20T09:00:00",
            "inspector_id": "u-qc",
            "inspector_name": "演示 QC 专员",
            "lines": [],
            "issues": [],
            "attachments": [],
        },
    )
    task = task_response.json()["data"]

    reschedule_response = await api_client.patch(
        f"/api/v1/quality/inspections/{task['id']}/schedule",
        headers=headers,
        json={
            "scheduled_at": "2026-08-21T14:30:00",
            "reason": "供应商延迟备货",
        },
    )
    assert reschedule_response.status_code == 200
    rescheduled = reschedule_response.json()["data"]
    assert rescheduled["scheduled_at"] == "2026-08-21T14:30:00"
    assert rescheduled["events"][-1]["event_type"] == "rescheduled"
    assert rescheduled["events"][-1]["notes"] == "供应商延迟备货"

    missing_reason = await api_client.post(
        f"/api/v1/quality/inspections/{task['id']}/cancel",
        headers=headers,
        json={"reason": ""},
    )
    assert missing_reason.status_code == 422

    cancel_response = await api_client.post(
        f"/api/v1/quality/inspections/{task['id']}/cancel",
        headers=headers,
        json={"reason": "采购合同已终止"},
    )
    assert cancel_response.status_code == 200
    cancelled = cancel_response.json()["data"]
    assert cancelled["status"] == "cancelled"
    assert cancelled["cancel_reason"] == "采购合同已终止"
    assert cancelled["events"][-1]["event_type"] == "cancelled"
