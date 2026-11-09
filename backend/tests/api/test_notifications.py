from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.dashboard.models import Notification
from app.modules.system.dashboard.notification_writer import notify_approval


async def _login_token(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


def _reimbursement_payload() -> dict[str, object]:
    return {
        "reimbursement_no": "RB-NOTIFY-001",
        "applicant_user_id": "u-001",
        "applicant_user_name": "演示业务主管",
        "department": "业务一部",
        "category": "travel",
        "currency": "CNY",
        "amount": "300.00",
        "reviewer_id": "u-finance-manager",
        "reason": "通知验证",
        "remark": "",
        "items": [{"expense_item": "交通费", "amount": "300.00", "remark": ""}],
    }


async def test_notification_list_read_all_and_delete(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    first_page = await api_client.get(
        "/api/v1/notifications",
        headers=headers,
        params={"unread_only": True, "page": 1, "page_size": 1},
    )
    assert first_page.status_code == 200
    data = first_page.json()["data"]
    assert data["total"] == 1
    assert data["unread_count"] == 1
    assert len(data["items"]) == 1
    notification = data["items"][0]
    assert notification["is_read"] is False
    assert notification["read_at"] is None
    assert notification["target_path"] is None

    read_all = await api_client.post("/api/v1/notifications/read-all", headers=headers)
    assert read_all.status_code == 200
    assert read_all.json()["data"]["updated"] == 1

    unread_after = await api_client.get(
        "/api/v1/notifications",
        headers=headers,
        params={"unread_only": True},
    )
    assert unread_after.json()["data"]["total"] == 0
    assert unread_after.json()["data"]["unread_count"] == 0

    delete_response = await api_client.delete(
        f"/api/v1/notifications/{notification['id']}",
        headers=headers,
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == notification["id"]

    remaining = await api_client.get("/api/v1/notifications", headers=headers)
    assert remaining.json()["data"]["total"] == 0


async def test_notification_delete_is_limited_to_owner(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    demo_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    listing = await api_client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {demo_token}"},
    )
    notification_id = listing.json()["data"]["items"][0]["id"]

    response = await api_client.delete(
        f"/api/v1/notifications/{notification_id}",
        headers={"Authorization": f"Bearer {finance_token}"},
    )

    assert response.status_code == 404


async def test_reimbursement_submit_and_approve_emit_notifications(
    api_client: AsyncClient,
    seeded_system: None,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    admin_token = await _login_token(api_client, "admin", "admin123")

    create_response = await api_client.post(
        "/api/v1/finance/reimbursements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json=_reimbursement_payload(),
    )
    assert create_response.status_code == 201
    reimbursement_id = create_response.json()["data"]["id"]

    async with session_factory() as session:
        submitted = await session.scalar(
            select(Notification).where(
                Notification.source_id == reimbursement_id,
                Notification.event == "approval.submitted",
            )
        )
    assert submitted is not None
    assert submitted.owner_user_id == "u-finance-manager"
    assert "RB-NOTIFY-001" in submitted.message
    assert submitted.severity == "info"
    assert submitted.target_path == "/finance/reimbursements"

    approve_response = await api_client.post(
        f"/api/v1/finance/reimbursements/{reimbursement_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"approved": True, "approval_remark": "同意报销"},
    )
    assert approve_response.status_code == 200

    async with session_factory() as session:
        approved = await session.scalar(
            select(Notification).where(
                Notification.source_id == reimbursement_id,
                Notification.event == "approval.approved",
            )
        )
    assert approved is not None
    assert approved.owner_user_id == "u-001"
    assert approved.severity == "success"


async def test_notify_approval_is_idempotent_and_skips_actor(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    payload = {
        "action": "reject",
        "resource_type": "export_quotation",
        "resource_id": "quotation-notify-1",
        "resource_no": "QT-NOTIFY-001",
        "actor_id": "u-admin",
        "actor_name": "系统管理员",
        "owner_user_id": "u-001",
        "reviewer_user_id": "u-admin",
        "reason": "价格偏高",
    }
    async with session_factory() as session:
        await notify_approval(session, **payload)
        await notify_approval(session, **payload)
        await session.commit()

    async with session_factory() as session:
        rows = (
            await session.scalars(
                select(Notification).where(Notification.source_id == "quotation-notify-1")
            )
        ).all()
    assert len(rows) == 1
    assert rows[0].owner_user_id == "u-001"
    assert "价格偏高" in rows[0].message
    assert rows[0].target_path == "/sales/quotations?q=QT-NOTIFY-001"

    async with session_factory() as session:
        await notify_approval(
            session,
            **{
                **payload,
                "action": "submit",
                "resource_id": "quotation-notify-2",
                "resource_no": "QT-NOTIFY-002",
            },
        )
        await session.commit()
        count = await session.scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.source_id == "quotation-notify-2")
        )
    assert count == 0
