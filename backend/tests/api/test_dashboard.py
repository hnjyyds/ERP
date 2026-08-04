from datetime import date, datetime
from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.finance.payments.models import PaymentRequest, SupplierInvoice
from app.modules.followup.models import (
    FollowProcessTemplate,
    PurchaseFollowNode,
    PurchaseFollowPlan,
)
from app.modules.purchase.contracts.models import PurchaseContract
from app.modules.quality.inspections.models import QualityInspection
from app.modules.warehouse.inbound_orders.models import InboundOrder


async def _login_token(
    api_client: AsyncClient,
    *,
    username: str = "demo",
    password: str = "demo123",
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    return response.json()["data"]["access_token"]


async def test_dashboard_returns_pdf_required_sections(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None

    dashboard = body["data"]
    assert set(dashboard) == {
        "announcements",
        "todos",
        "notifications",
        "schedule_events",
        "shortcuts",
        "summary",
    }
    assert dashboard["summary"] == {
        "announcement_count": 1,
        "todo_count": 2,
        "unread_notification_count": 1,
        "today_schedule_count": 1,
        "shortcut_count": 2,
    }
    assert dashboard["todos"][0]["source_type"] == "approval"
    assert dashboard["todos"][0]["assignment_type"] == "assigned"
    assert dashboard["notifications"][0]["severity"] == "warning"


async def test_dashboard_includes_only_active_quality_tasks_assigned_to_current_user(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add_all(
            [
                QualityInspection(
                    id="qc-dashboard-active",
                    code="QC-DASHBOARD-ACTIVE",
                    purchase_contract_id="pc-dashboard-active",
                    purchase_contract_no="PC-DASHBOARD-ACTIVE",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    status="pending",
                    scheduled_at=datetime(2026, 8, 20, 9, 30),
                    inspected_at=date(2026, 8, 20),
                    result="",
                    inspector_id="u-qc",
                    inspector_name="演示 QC 专员",
                    qc_user_id="u-qc",
                    qc_user_name="演示 QC 专员",
                    issue_summary="宁波仓验货",
                    attachment_group_id=None,
                    owner_user_id="u-001",
                ),
                QualityInspection(
                    id="qc-dashboard-completed",
                    code="QC-DASHBOARD-COMPLETED",
                    purchase_contract_id="pc-dashboard-completed",
                    purchase_contract_no="PC-DASHBOARD-COMPLETED",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    status="completed",
                    scheduled_at=datetime(2026, 8, 19, 9, 30),
                    inspected_at=date(2026, 8, 19),
                    result="passed",
                    inspector_id="u-qc",
                    inspector_name="演示 QC 专员",
                    qc_user_id="u-qc",
                    qc_user_name="演示 QC 专员",
                    issue_summary=None,
                    attachment_group_id=None,
                    owner_user_id="u-001",
                ),
                QualityInspection(
                    id="qc-dashboard-other-user",
                    code="QC-DASHBOARD-OTHER",
                    purchase_contract_id="pc-dashboard-other",
                    purchase_contract_no="PC-DASHBOARD-OTHER",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    status="in_progress",
                    scheduled_at=datetime(2026, 8, 18, 9, 30),
                    inspected_at=date(2026, 8, 18),
                    result="",
                    inspector_id="u-warehouse",
                    inspector_name="演示仓库专员",
                    qc_user_id="u-warehouse",
                    qc_user_name="演示仓库专员",
                    issue_summary=None,
                    attachment_group_id=None,
                    owner_user_id="u-001",
                ),
            ]
        )
        await session.commit()

    token = await _login_token(api_client, username="qc", password="qc123")
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    dashboard = response.json()["data"]
    assert dashboard["summary"]["todo_count"] == 1
    assert dashboard["todos"] == [
        {
            "id": "qc-dashboard-active",
            "owner_user_id": "u-qc",
            "owner_user_name": "演示 QC 专员",
            "creator_user_id": "u-001",
            "creator_user_name": None,
            "title": "QC 查验 QC-DASHBOARD-ACTIVE",
            "content": "PC-DASHBOARD-ACTIVE / 首期供应商 / 宁波仓验货",
            "source_type": "quality_inspection",
            "source_id": "qc-dashboard-active",
            "due_at": "2026-08-20T09:30:00",
            "status": "pending",
            "assignment_type": "assigned",
        }
    ]


async def test_dashboard_includes_active_followup_nodes_owned_by_current_user(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add(
            FollowProcessTemplate(
                id="follow-template-dashboard",
                name="首期跟单模板",
                enabled=True,
                is_default=False,
                owner_user_id="u-purchase",
            )
        )
        session.add_all(
            [
                PurchaseFollowPlan(
                    id="follow-plan-dashboard",
                    purchase_contract_id="pc-follow-dashboard",
                    purchase_contract_no="PC-FOLLOW-DASHBOARD",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    template_id="follow-template-dashboard",
                    base_date=date(2026, 8, 1),
                    overall_status="pending",
                    owner_user_id="u-purchase",
                ),
                PurchaseFollowPlan(
                    id="follow-plan-other",
                    purchase_contract_id="pc-follow-other",
                    purchase_contract_no="PC-FOLLOW-OTHER",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    template_id="follow-template-dashboard",
                    base_date=date(2026, 8, 1),
                    overall_status="pending",
                    owner_user_id="u-001",
                ),
            ]
        )
        session.add_all(
            [
                PurchaseFollowNode(
                    id="follow-node-dashboard",
                    follow_plan_id="follow-plan-dashboard",
                    node_code="confirmation_sample",
                    node_name="确认样提交",
                    sequence_no=20,
                    planned_date=date(2026, 8, 7),
                    remind_date=date(2026, 8, 6),
                    actual_date=None,
                    status="pending",
                    source_record_type=None,
                    source_record_id=None,
                    source_summary=None,
                ),
                PurchaseFollowNode(
                    id="follow-node-completed",
                    follow_plan_id="follow-plan-dashboard",
                    node_code="order_confirmed",
                    node_name="合同下单确立",
                    sequence_no=10,
                    planned_date=date(2026, 8, 1),
                    remind_date=date(2026, 8, 1),
                    actual_date=date(2026, 8, 1),
                    status="completed",
                    source_record_type="purchase_contract",
                    source_record_id="pc-follow-dashboard",
                    source_summary="已完成",
                ),
                PurchaseFollowNode(
                    id="follow-node-other",
                    follow_plan_id="follow-plan-other",
                    node_code="confirmation_sample",
                    node_name="确认样提交",
                    sequence_no=20,
                    planned_date=date(2026, 8, 7),
                    remind_date=date(2026, 8, 6),
                    actual_date=None,
                    status="pending",
                    source_record_type=None,
                    source_record_id=None,
                    source_summary=None,
                ),
            ]
        )
        await session.commit()

    token = await _login_token(api_client, username="purchase", password="purchase123")
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    dashboard = response.json()["data"]
    assert dashboard["summary"]["todo_count"] == 1
    task = dashboard["todos"][0]
    assert task["id"] == "follow-node-dashboard"
    assert task["title"] == "采购跟单 PC-FOLLOW-DASHBOARD · 确认样提交"
    assert task["content"] == "首期供应商"
    assert task["source_type"] == "followup_plan"
    assert task["source_id"] == "follow-plan-dashboard"
    assert task["due_at"] == "2026-08-07T09:00:00"
    assert task["status"] == "pending"


async def test_dashboard_includes_submitted_inbound_order_for_designated_reviewer(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add_all(
            [
                InboundOrder(
                    id="inbound-dashboard-review",
                    code="IO-DASHBOARD-REVIEW",
                    plan_id="inbound-plan-dashboard",
                    purchase_contract_id="pc-inbound-dashboard",
                    purchase_contract_no="PC-INBOUND-DASHBOARD",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    inbound_type="purchase",
                    inbound_mode="formal",
                    inbound_at=date(2026, 8, 8),
                    warehouse_id="warehouse-ningbo",
                    warehouse_name="宁波总仓",
                    location_id="location-a-01",
                    location_name="A-01",
                    operator_name="仓库主管",
                    status="submitted",
                    submitted_at=date(2026, 8, 8),
                    approved_at=None,
                    reviewer_id="u-warehouse",
                    reviewer_name="演示仓库专员",
                    owner_user_id="u-001",
                ),
                InboundOrder(
                    id="inbound-dashboard-other",
                    code="IO-DASHBOARD-OTHER",
                    plan_id="inbound-plan-other",
                    purchase_contract_id="pc-inbound-other",
                    purchase_contract_no="PC-INBOUND-OTHER",
                    supplier_id="supplier-dashboard",
                    supplier_name="首期供应商",
                    inbound_type="purchase",
                    inbound_mode="formal",
                    inbound_at=date(2026, 8, 8),
                    warehouse_id="warehouse-ningbo",
                    warehouse_name="宁波总仓",
                    location_id="location-a-01",
                    location_name="A-01",
                    operator_name="仓库主管",
                    status="submitted",
                    submitted_at=date(2026, 8, 8),
                    approved_at=None,
                    reviewer_id="u-finance",
                    reviewer_name="演示财务",
                    owner_user_id="u-001",
                ),
            ]
        )
        await session.commit()

    token = await _login_token(api_client, username="warehouse", password="warehouse123")
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    dashboard = response.json()["data"]
    assert dashboard["summary"]["todo_count"] == 1
    task = dashboard["todos"][0]
    assert task["id"] == "inbound-dashboard-review"
    assert task["title"] == "入库审批 IO-DASHBOARD-REVIEW"
    assert task["content"] == "PC-INBOUND-DASHBOARD / 首期供应商 / 宁波总仓"
    assert task["source_type"] == "warehouse_inbound_approval"
    assert task["source_id"] == "inbound-dashboard-review"
    assert task["due_at"] == "2026-08-08T09:00:00"
    assert task["status"] == "pending"


async def test_dashboard_finance_approval_uses_invoice_detail_as_source_id(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add(
            SupplierInvoice(
                id="supplier-invoice-dashboard",
                invoice_no="SI-DASHBOARD-001",
                invoice_date=date(2026, 8, 4),
                supplier_id="supplier-dashboard",
                supplier_name="首期供应商",
                purchase_invoice_notice_id=None,
                purchase_invoice_notice_code=None,
                purchase_contract_id="pc-dashboard-finance",
                purchase_contract_no="PC-DASHBOARD-FINANCE",
                total_amount=Decimal("1200.00"),
                paid_amount=Decimal("0"),
                currency="USD",
                due_date=date(2026, 8, 20),
                status="unpaid",
                remark=None,
                created_by_user_id="u-finance",
                created_by_user_name="演示财务",
            )
        )
        session.add(
            PaymentRequest(
                id="payment-request-dashboard",
                request_no="PR-DASHBOARD-001",
                supplier_invoice_id="supplier-invoice-dashboard",
                supplier_invoice_no="SI-DASHBOARD-001",
                supplier_id="supplier-dashboard",
                supplier_name="首期供应商",
                purchase_contract_id="pc-dashboard-finance",
                purchase_contract_no="PC-DASHBOARD-FINANCE",
                payment_type="goods",
                request_date=date(2026, 8, 4),
                requested_amount=Decimal("1200.00"),
                approved_amount=Decimal("0"),
                paid_amount=Decimal("0"),
                currency="USD",
                status="submitted",
                requester_user_id="u-finance",
                requester_user_name="演示财务",
                reviewer_id="u-finance-manager",
                reviewer_name="演示财务主管",
                approved_at=None,
                payment_account=None,
                remark=None,
            )
        )
        await session.commit()

    token = await _login_token(
        api_client,
        username="finance_manager",
        password="finance-manager123",
    )
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    task = next(
        item
        for item in response.json()["data"]["todos"]
        if item["id"] == "payment-request-dashboard"
    )
    assert task["source_type"] == "finance_payment_approval"
    assert task["source_id"] == "supplier-invoice-dashboard"


async def test_todo_create_supports_self_and_assigned_users(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "title": "整理下周寄样清单",
        "content": "确认样品、快递单和客户地址。",
        "assignee_user_ids": ["u-001", "u-finance"],
    }

    create_response = await api_client.post(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    created = create_response.json()["data"]
    assert len(created["items"]) == 2
    assert {item["owner_user_id"] for item in created["items"]} == {"u-001", "u-finance"}
    assert {item["title"] for item in created["items"]} == {payload["title"]}
    assert {item["content"] for item in created["items"]} == {payload["content"]}
    assert {item["source_type"] for item in created["items"]} == {"manual"}
    assert {item["creator_user_id"] for item in created["items"]} == {"u-001"}
    assert {item["creator_user_name"] for item in created["items"]} == {"演示业务主管"}
    assert {
        (item["owner_user_id"], item["assignment_type"]) for item in created["items"]
    } == {
        ("u-001", "self"),
        ("u-finance", "assigned"),
    }

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    dashboard = dashboard_response.json()["data"]
    personal_todos = [
        item for item in dashboard["todos"] if item["assignment_type"] == "self"
    ]
    assigned_todos = [
        item for item in dashboard["todos"] if item["assignment_type"] == "assigned"
    ]
    assert dashboard["summary"]["todo_count"] == 3
    assert {item["title"] for item in personal_todos} == {payload["title"]}
    assert len(assigned_todos) == 2

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    finance_todos = finance_dashboard_response.json()["data"]["todos"]
    assigned_to_finance = [item for item in finance_todos if item["title"] == payload["title"]]
    assert len(assigned_to_finance) == 1
    assert assigned_to_finance[0]["owner_user_name"] == "演示财务"
    assert assigned_to_finance[0]["assignment_type"] == "assigned"


async def test_personal_todo_create_rejects_unexpected_fields(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "非法字段测试",
            "content": "这个字段不应该被接受",
            "assignee_user_ids": ["u-001"],
            "owner_user_id": "u-002",
        },
    )

    assert response.status_code == 422


async def test_schedule_create_is_visible_on_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "title": "跟进采购合同节点",
        "description": "确认样提交前提醒供应商",
        "starts_at": "2026-06-15T09:00:00+08:00",
        "ends_at": "2026-06-15T10:00:00+08:00",
    }

    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    created = create_response.json()["data"]
    assert created["title"] == payload["title"]
    assert created["owner_user_id"] == "u-001"

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    event_titles = {
        item["title"] for item in dashboard_response.json()["data"]["schedule_events"]
    }
    assert "跟进采购合同节点" in event_titles


async def test_schedule_delete_is_limited_to_owner_and_refreshes_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    payload = {
        "title": "待删除日程",
        "description": "验证删除后不再出现在工作台",
        "starts_at": "2026-06-15T14:00:00+08:00",
        "ends_at": "2026-06-15T15:00:00+08:00",
    }

    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    schedule = create_response.json()["data"]

    forbidden_response = await api_client.delete(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert forbidden_response.status_code == 404

    delete_response = await api_client.delete(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == schedule["id"]

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    dashboard = refreshed.json()["data"]
    schedule_ids = {item["id"] for item in dashboard["schedule_events"]}
    assert schedule["id"] not in schedule_ids
    assert dashboard["summary"]["today_schedule_count"] == 1


async def test_announcement_create_is_visible_on_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="admin", password="admin123")
    payload = {
        "title": "端午放假通知",
        "content": "6 月 16 日上午完成出货资料交接。",
    }

    create_response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    assert create_response.json()["data"]["title"] == payload["title"]

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    titles = {item["title"] for item in dashboard_response.json()["data"]["announcements"]}
    assert payload["title"] in titles


async def test_announcement_create_requires_admin_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "普通用户公告",
            "content": "普通业务账号不应能发布公司公告。",
        },
    )

    assert response.status_code == 403
    assert response.json()["message"] == "无权限发布公告"


async def test_announcement_create_requires_super_admin_even_with_announcement_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    super_admin_token = await _login_token(
        api_client,
        username="admin",
        password="admin123",
    )
    options_response = await api_client.get(
        "/api/v1/organization/options",
        headers={"Authorization": f"Bearer {super_admin_token}"},
    )
    permission_by_code = {
        item["code"]: item
        for item in options_response.json()["data"]["permissions"]
    }
    grant_response = await api_client.patch(
        "/api/v1/organization/roles/role-finance/permissions",
        headers={"Authorization": f"Bearer {super_admin_token}"},
        json={
            "permission_ids": [
                permission_by_code["dashboard:view"]["id"],
                permission_by_code["finance:view"]["id"],
                permission_by_code["announcement:create"]["id"],
            ],
        },
    )
    assert grant_response.status_code == 200

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "title": "财务公告",
            "content": "拥有公告创建权限但不是超级管理员，仍不可发布。",
        },
    )

    assert response.status_code == 403
    assert response.json()["message"] == "无权限发布公告"


async def test_notification_can_be_marked_read(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    notification_id = dashboard_response.json()["data"]["notifications"][0]["id"]

    read_response = await api_client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert read_response.status_code == 200
    assert read_response.json()["data"]["is_read"] is True

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert refreshed.json()["data"]["summary"]["unread_notification_count"] == 0


async def test_shortcut_create_and_delete_refresh_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "label": "商品资料",
        "target_path": "/masterdata/products",
        "icon": "package",
        "sort_order": 30,
    }

    create_response = await api_client.post(
        "/api/v1/shortcuts",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    shortcut = create_response.json()["data"]
    assert shortcut["label"] == payload["label"]

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert dashboard_response.json()["data"]["summary"]["shortcut_count"] == 3

    delete_response = await api_client.delete(
        f"/api/v1/shortcuts/{shortcut['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == shortcut["id"]

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    shortcut_ids = {item["id"] for item in refreshed.json()["data"]["shortcuts"]}
    assert shortcut["id"] not in shortcut_ids


async def test_schedule_create_rejects_unexpected_fields(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "非法字段测试",
            "starts_at": "2026-06-15T09:00:00+08:00",
            "ends_at": "2026-06-15T10:00:00+08:00",
            "unexpected": "not allowed",
        },
    )

    assert response.status_code == 422


async def test_dashboard_requires_login(api_client: AsyncClient, seeded_system: None) -> None:
    response = await api_client.get("/api/v1/dashboard")

    assert response.status_code == 401


async def test_dashboard_includes_purchase_contract_for_designated_reviewer(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add(
            PurchaseContract(
                id="purchase-dashboard-review",
                code="PC-DASHBOARD-REVIEW",
                contract_date=date(2026, 8, 4),
                supplier_id="supplier-dashboard",
                supplier_name="首期供应商",
                buyer_user_id="u-001",
                buyer_user_name="演示业务主管",
                qc_user_id="u-qc",
                qc_user_name="演示 QC 专员",
                currency="CNY",
                delivery_date=date(2026, 8, 20),
                payment_terms="月结 30 天",
                source_type="manual",
                remarks=None,
                approval_status="submitted",
                submitted_at=date(2026, 8, 4),
                approved_at=None,
                reviewer_id="u-purchase",
                reviewer_name="演示采购专员",
                total_quantity=Decimal("100"),
                total_amount=Decimal("1000"),
                received_quantity=Decimal("0"),
                paid_amount=Decimal("0"),
                owner_user_id="u-001",
            )
        )
        await session.commit()

    token = await _login_token(api_client, username="purchase", password="purchase123")
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    task = next(
        item
        for item in response.json()["data"]["todos"]
        if item["id"] == "purchase-dashboard-review"
    )
    assert task["title"] == "采购合同审批 PC-DASHBOARD-REVIEW"
    assert task["content"] == "首期供应商 / manual"
    assert task["source_type"] == "purchase_contract_approval"
    assert task["owner_user_id"] == "u-purchase"
