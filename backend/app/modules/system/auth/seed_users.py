from datetime import UTC, datetime

from app.modules.system.auth.models import Role, User, UserRole
from app.modules.system.auth.passwords import hash_password


def demo_roles() -> list[Role]:
    """Demo-only roles. Production系统角色仅保留超级管理员（见 seed_navigation.system_roles）。"""
    return [
        Role(id="role-sales-manager", name="业务主管", code="sales_manager", data_scope="all"),
        Role(id="role-purchase", name="采购专员", code="purchase", data_scope="all"),
        Role(id="role-finance", name="财务", code="finance", data_scope="all"),
        Role(id="role-warehouse", name="仓库专员", code="warehouse", data_scope="all"),
        Role(id="role-qc", name="QC 专员", code="qc", data_scope="all"),
    ]


def demo_users() -> list[User]:
    admin_salt = "admin-salt"
    demo_salt = "demo-salt"
    purchase_salt = "purchase-salt"
    finance_salt = "finance-salt"
    finance_manager_salt = "finance-manager-salt"
    warehouse_salt = "warehouse-salt"
    qc_salt = "qc-salt"
    return [
        User(
            id="u-admin",
            username="admin",
            display_name="演示管理员",
            department_id="dept-admin",
            avatar_type="preset",
            avatar_value="ink-halo",
            password_hash=hash_password("admin123", admin_salt),
            password_salt=admin_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-001",
            username="demo",
            display_name="演示业务主管",
            department_id="dept-sales",
            avatar_type="preset",
            avatar_value="amber-orbit",
            password_hash=hash_password("demo123", demo_salt),
            password_salt=demo_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-purchase",
            username="purchase",
            display_name="演示采购专员",
            department_id="dept-purchase",
            avatar_type="preset",
            avatar_value="copper-wave",
            password_hash=hash_password("purchase123", purchase_salt),
            password_salt=purchase_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-finance",
            username="finance",
            display_name="演示财务",
            department_id="dept-finance",
            avatar_type="preset",
            avatar_value="sage-pulse",
            password_hash=hash_password("finance123", finance_salt),
            password_salt=finance_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-finance-manager",
            username="finance_manager",
            display_name="演示财务主管",
            department_id="dept-finance",
            avatar_type="preset",
            avatar_value="ink-halo",
            password_hash=hash_password("finance-manager123", finance_manager_salt),
            password_salt=finance_manager_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-warehouse",
            username="warehouse",
            display_name="演示仓库专员",
            department_id="dept-warehouse",
            avatar_type="preset",
            avatar_value="blueprint-grid",
            password_hash=hash_password("warehouse123", warehouse_salt),
            password_salt=warehouse_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
        User(
            id="u-qc",
            username="qc",
            display_name="演示 QC 专员",
            department_id="dept-quality",
            avatar_type="preset",
            avatar_value="rose-signal",
            password_hash=hash_password("qc123", qc_salt),
            password_salt=qc_salt,
            is_active=True,
            created_at=datetime.now(UTC),
        ),
    ]


def demo_user_roles() -> list[UserRole]:
    return [
        UserRole(id="ur-admin", user_id="u-admin", role_id="role-admin"),
        UserRole(id="ur-demo-sales-manager", user_id="u-001", role_id="role-sales-manager"),
        UserRole(id="ur-purchase", user_id="u-purchase", role_id="role-purchase"),
        UserRole(id="ur-finance", user_id="u-finance", role_id="role-finance"),
        UserRole(
            id="ur-finance-manager",
            user_id="u-finance-manager",
            role_id="role-finance",
        ),
        UserRole(id="ur-warehouse", user_id="u-warehouse", role_id="role-warehouse"),
        UserRole(id="ur-qc", user_id="u-qc", role_id="role-qc"),
    ]


