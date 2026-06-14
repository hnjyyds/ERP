import ast
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


def test_api_routes_have_explicit_response_models() -> None:
    app = create_app()
    api_routes = [
        route
        for route in app.routes
        if isinstance(route, APIRoute) and route.path.startswith("/api/v1")
    ]

    assert api_routes
    assert all(route.response_model is not None for route in api_routes)


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
