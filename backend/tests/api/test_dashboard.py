from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

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
from app.modules.sales.contracts.models import ExportContract
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
        # 种子日程固定为 2026-06-13，属于历史日程，不再计入“今日日程”。
        "today_schedule_count": 0,
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
    assert isinstance(dashboard["todos"][0].pop("is_overdue"), bool)
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


async def test_super_admin_dashboard_includes_global_active_business_todos_only(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add_all(
            [
                ExportContract(
                    id="export-dashboard-global-unassigned",
                    code="EC-DASHBOARD-GLOBAL-UNASSIGNED",
                    contract_date=date(2026, 8, 5),
                    customer_id="customer-dashboard",
                    customer_name="全局待办客户",
                    sales_user_id="u-001",
                    sales_user_name="演示业务主管",
                    currency="USD",
                    trade_term="FOB Ningbo",
                    planned_ship_date=date(2026, 8, 30),
                    payment_terms="30% 预付，70% 出货前",
                    source_quotation_id=None,
                    source_quotation_no=None,
                    remarks=None,
                    total_quantity=Decimal("100"),
                    total_amount=Decimal("1200"),
                    shipped_quantity=Decimal("0"),
                    shipped_amount=Decimal("0"),
                    purchased_quantity=Decimal("0"),
                    advance_payment_amount=Decimal("0"),
                    approval_status="submitted",
                    submitted_at=date(2026, 8, 5),
                    approved_at=None,
                    reviewer_id=None,
                    reviewer_name=None,
                    owner_user_id="u-001",
                ),
                InboundOrder(
                    id="inbound-dashboard-global-unassigned",
                    code="IO-DASHBOARD-GLOBAL-UNASSIGNED",
                    plan_id="inbound-plan-global-unassigned",
                    purchase_contract_id="pc-inbound-global-unassigned",
                    purchase_contract_no="PC-INBOUND-GLOBAL-UNASSIGNED",
                    supplier_id="supplier-dashboard",
                    supplier_name="全局待办供应商",
                    inbound_type="purchase",
                    inbound_mode="formal",
                    inbound_at=date(2026, 8, 22),
                    warehouse_id="warehouse-ningbo",
                    warehouse_name="宁波总仓",
                    location_id="location-a-01",
                    location_name="A-01",
                    operator_name="仓库主管",
                    status="submitted",
                    submitted_at=date(2026, 8, 5),
                    approved_at=None,
                    reviewer_id=None,
                    reviewer_name=None,
                    owner_user_id="u-warehouse",
                ),
                QualityInspection(
                    id="qc-dashboard-global-active",
                    code="QC-DASHBOARD-GLOBAL-ACTIVE",
                    purchase_contract_id="pc-dashboard-global-active",
                    purchase_contract_no="PC-DASHBOARD-GLOBAL-ACTIVE",
                    supplier_id="supplier-dashboard",
                    supplier_name="全局待办供应商",
                    status="pending",
                    scheduled_at=datetime(2026, 8, 21, 9, 30),
                    inspected_at=date(2026, 8, 21),
                    result="",
                    inspector_id="u-qc",
                    inspector_name="演示 QC 专员",
                    qc_user_id="u-qc",
                    qc_user_name="演示 QC 专员",
                    issue_summary=None,
                    attachment_group_id=None,
                    owner_user_id="u-001",
                ),
                QualityInspection(
                    id="qc-dashboard-global-completed",
                    code="QC-DASHBOARD-GLOBAL-COMPLETED",
                    purchase_contract_id="pc-dashboard-global-completed",
                    purchase_contract_no="PC-DASHBOARD-GLOBAL-COMPLETED",
                    supplier_id="supplier-dashboard",
                    supplier_name="全局待办供应商",
                    status="completed",
                    scheduled_at=datetime(2026, 8, 20, 9, 30),
                    inspected_at=date(2026, 8, 20),
                    result="passed",
                    inspector_id="u-qc",
                    inspector_name="演示 QC 专员",
                    qc_user_id="u-qc",
                    qc_user_name="演示 QC 专员",
                    issue_summary=None,
                    attachment_group_id=None,
                    owner_user_id="u-001",
                ),
            ]
        )
        await session.commit()

    token = await _login_token(api_client, username="admin", password="admin123")
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    todos = response.json()["data"]["todos"]
    todo_ids = {item["id"] for item in todos}
    assert "qc-dashboard-global-active" in todo_ids
    assert "qc-dashboard-global-completed" not in todo_ids
    assert "export-dashboard-global-unassigned" in todo_ids
    assert "inbound-dashboard-global-unassigned" in todo_ids
    assert {
        item["owner_user_id"]
        for item in todos
        if item["id"]
        in {"export-dashboard-global-unassigned", "inbound-dashboard-global-unassigned"}
    } == {"u-admin"}
    assert "审批出口合同 XP-EC-202606-001" not in {item["title"] for item in todos}


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
    assert {(item["owner_user_id"], item["assignment_type"]) for item in created["items"]} == {
        ("u-001", "self"),
        ("u-finance", "assigned"),
    }

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    dashboard = dashboard_response.json()["data"]
    personal_todos = [item for item in dashboard["todos"] if item["assignment_type"] == "self"]
    assigned_todos = [item for item in dashboard["todos"] if item["assignment_type"] == "assigned"]
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


async def test_todo_create_accepts_due_at_and_returns_overdue_flag(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    overdue_response = await api_client.post(
        "/api/v1/todos",
        headers=headers,
        json={
            "title": "已逾期待办",
            "content": "按 datetime 判断逾期",
            "assignee_user_ids": ["u-001"],
            "due_at": "2020-01-01T09:00:00+08:00",
        },
    )
    future_response = await api_client.post(
        "/api/v1/todos",
        headers=headers,
        json={
            "title": "未来待办",
            "content": "尚未到期",
            "assignee_user_ids": ["u-001"],
            "due_at": "2099-01-01T09:00:00+08:00",
        },
    )

    assert overdue_response.status_code == 201
    assert future_response.status_code == 201
    assert overdue_response.json()["data"]["items"][0]["is_overdue"] is True
    assert future_response.json()["data"]["items"][0]["is_overdue"] is False

    dashboard = (
        await api_client.get("/api/v1/dashboard", headers=headers)
    ).json()["data"]
    flags = {item["title"]: item["is_overdue"] for item in dashboard["todos"]}
    assert flags["已逾期待办"] is True
    assert flags["未来待办"] is False


async def test_todo_owner_can_complete_and_completed_todo_is_hidden(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    created = (
        await api_client.post(
            "/api/v1/todos",
            headers=headers,
            json={
                "title": "完成我",
                "content": "负责人完成后不可撤销",
                "assignee_user_ids": ["u-001"],
            },
        )
    ).json()["data"]["items"][0]

    complete_response = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers=headers,
        json={"status": "completed"},
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["data"]["status"] == "completed"
    assert complete_response.json()["data"]["is_overdue"] is False

    dashboard = (
        await api_client.get("/api/v1/dashboard", headers=headers)
    ).json()["data"]
    assert created["id"] not in {item["id"] for item in dashboard["todos"]}

    reopen_response = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers=headers,
        json={"status": "cancelled"},
    )
    assert reopen_response.status_code == 422


async def test_todo_complete_requires_owner_or_super_admin(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    finance_token = await _login_token(api_client, username="finance", password="finance123")
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    created = (
        await api_client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "仅负责人可完成",
                "content": "创建人不是负责人",
                "assignee_user_ids": ["u-finance"],
            },
        )
    ).json()["data"]["items"][0]

    creator_response = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "completed"},
    )
    admin_response = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "completed"},
    )

    assert creator_response.status_code == 403
    assert admin_response.status_code == 200
    finance_dashboard = (
        await api_client.get(
            "/api/v1/dashboard",
            headers={"Authorization": f"Bearer {finance_token}"},
        )
    ).json()["data"]
    assert created["id"] not in {item["id"] for item in finance_dashboard["todos"]}


async def test_todo_cancel_requires_creator_or_super_admin(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    finance_token = await _login_token(api_client, username="finance", password="finance123")
    created = (
        await api_client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "取消我",
                "content": "仅创建人或超管可取消",
                "assignee_user_ids": ["u-finance"],
            },
        )
    ).json()["data"]["items"][0]

    denied = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={"status": "cancelled"},
    )
    cancelled = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "cancelled"},
    )

    assert denied.status_code == 403
    assert cancelled.status_code == 200
    assert cancelled.json()["data"]["status"] == "cancelled"


async def test_todo_reassign_and_due_time_updates(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    finance_token = await _login_token(api_client, username="finance", password="finance123")
    created = (
        await api_client.post(
            "/api/v1/todos",
            headers=headers,
            json={
                "title": "改派与改期",
                "content": "创建人可改派，负责人可改期",
                "assignee_user_ids": ["u-finance"],
            },
        )
    ).json()["data"]["items"][0]

    finance_reassign = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={"owner_user_id": "u-001"},
    )
    assert finance_reassign.status_code == 403

    reassigned = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers=headers,
        json={"owner_user_id": "u-001"},
    )
    assert reassigned.status_code == 200
    assert reassigned.json()["data"]["owner_user_id"] == "u-001"

    missing_assignee = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers=headers,
        json={"owner_user_id": "u-missing"},
    )
    assert missing_assignee.status_code == 404

    due_update = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers=headers,
        json={"due_at": "2020-01-01T09:00:00+08:00"},
    )
    assert due_update.status_code == 200
    assert due_update.json()["data"]["is_overdue"] is True


async def test_todo_due_time_update_denied_for_unrelated_user(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    finance_token = await _login_token(api_client, username="finance", password="finance123")
    created = (
        await api_client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "仅创建人或负责人可改期",
                "content": "无关用户不可修改",
                "assignee_user_ids": ["u-001"],
            },
        )
    ).json()["data"]["items"][0]

    response = await api_client.patch(
        f"/api/v1/todos/{created['id']}",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={"due_at": "2026-12-31T09:00:00+08:00"},
    )

    assert response.status_code == 403


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
    event_titles = {item["title"] for item in dashboard_response.json()["data"]["schedule_events"]}
    assert "跟进采购合同节点" in event_titles


async def test_schedule_delete_is_limited_to_owner_and_refreshes_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    today = datetime.now(ZoneInfo("Asia/Shanghai")).date()
    payload = {
        "title": "待删除日程",
        "description": "验证删除后不再出现在工作台",
        "starts_at": f"{today.isoformat()}T14:00:00+08:00",
        "ends_at": f"{today.isoformat()}T15:00:00+08:00",
    }

    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    schedule = create_response.json()["data"]

    before_delete = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert before_delete.json()["data"]["summary"]["today_schedule_count"] == 1

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
    assert dashboard["summary"]["today_schedule_count"] == 0


async def test_schedule_update_changes_fields_and_allows_clearing_note(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "待编辑日程",
            "description": "原备注",
            "starts_at": "2026-06-16T09:00:00+08:00",
            "ends_at": "2026-06-16T10:00:00+08:00",
        },
    )
    schedule = create_response.json()["data"]

    update_response = await api_client.patch(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "已编辑日程",
            "description": None,
            "starts_at": "2026-06-16T11:00:00+08:00",
            "ends_at": "2026-06-16T12:30:00+08:00",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["title"] == "已编辑日程"
    assert updated["description"] is None
    assert updated["owner_user_id"] == "u-001"
    assert updated["starts_at"] != schedule["starts_at"]


async def test_schedule_update_rejects_end_before_start(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "时间校验日程",
            "starts_at": "2026-06-17T09:00:00+08:00",
            "ends_at": "2026-06-17T10:00:00+08:00",
        },
    )
    schedule = create_response.json()["data"]

    update_response = await api_client.patch(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"starts_at": "2026-06-17T11:00:00+08:00"},
    )

    assert update_response.status_code == 422


async def test_schedule_update_is_limited_to_owner(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "仅本人可改",
            "starts_at": "2026-06-18T09:00:00+08:00",
            "ends_at": "2026-06-18T10:00:00+08:00",
        },
    )
    schedule = create_response.json()["data"]

    update_response = await api_client.patch(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"title": "越权修改"},
    )

    assert update_response.status_code == 404


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
        item["code"]: item for item in options_response.json()["data"]["permissions"]
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
