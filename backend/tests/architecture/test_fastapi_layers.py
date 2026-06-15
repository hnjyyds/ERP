import ast
import inspect
from pathlib import Path

from fastapi.routing import APIRoute

from app.main import create_app

BACKEND_ROOT = Path(__file__).resolve().parents[2]
APP_ROOT = BACKEND_ROOT / "app"


def _python_files(path: Path) -> list[Path]:
    return [item for item in path.rglob("*.py") if "__pycache__" not in item.parts]


def _import_modules(file_path: Path) -> list[str]:
    tree = ast.parse(file_path.read_text(encoding="utf-8"))
    modules: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.append(node.module)
    return modules


def _api_routes_with_paths() -> list[tuple[str, APIRoute]]:
    app = create_app()
    collected: list[tuple[str, APIRoute]] = []

    def collect(routes: list[object], prefix: str = "") -> None:
        for route in routes:
            if isinstance(route, APIRoute):
                collected.append((f"{prefix}{route.path}", route))
                continue
            original_router = getattr(route, "original_router", None)
            include_context = getattr(route, "include_context", None)
            if original_router is None or include_context is None:
                continue
            collect(original_router.routes, f"{prefix}{include_context.prefix}")

    collect(app.routes)
    return collected


def test_api_routes_have_explicit_response_models() -> None:
    api_routes = [
        route
        for path, route in _api_routes_with_paths()
        if path.startswith("/api/v1")
    ]

    assert api_routes
    assert all(route.response_model is not None for route in api_routes)


def test_dashboard_mutation_routes_wrap_path_identifiers_in_schema_dependencies() -> None:
    from app.api.v1 import dashboard

    raw_identifier_params = {"schedule_id", "notification_id", "shortcut_id"}
    endpoints = (
        dashboard.delete_schedule_event,
        dashboard.mark_notification_read,
        dashboard.delete_shortcut,
    )

    for endpoint in endpoints:
        endpoint_params = set(inspect.signature(endpoint).parameters)
        assert endpoint_params.isdisjoint(raw_identifier_params)


def test_api_layer_does_not_import_repository_or_models() -> None:
    api_root = APP_ROOT / "api"
    forbidden_fragments = (".repositories", ".models")

    violations: list[str] = []
    for file_path in _python_files(api_root):
        for module in _import_modules(file_path):
            if any(fragment in module for fragment in forbidden_fragments):
                violations.append(f"{file_path.relative_to(BACKEND_ROOT)} imports {module}")

    assert violations == []


def test_services_do_not_import_api_layer() -> None:
    violations: list[str] = []
    for file_path in _python_files(APP_ROOT / "modules"):
        if file_path.name != "services.py":
            continue
        for module in _import_modules(file_path):
            if module.startswith("app.api"):
                violations.append(f"{file_path.relative_to(BACKEND_ROOT)} imports {module}")

    assert violations == []
