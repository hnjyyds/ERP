import importlib
import inspect
from pathlib import Path

from pydantic import BaseModel

BACKEND_ROOT = Path(__file__).resolve().parents[2]
APP_ROOT = BACKEND_ROOT / "app"


def _schema_modules() -> list[object]:
    modules: list[object] = []
    for path in sorted(APP_ROOT.rglob("schemas.py")):
        relative = path.relative_to(BACKEND_ROOT).with_suffix("")
        modules.append(importlib.import_module(".".join(relative.parts)))
    return modules


def test_all_schema_fields_have_descriptions() -> None:
    missing: list[str] = []

    for schema_module in _schema_modules():
        for model_name, model in inspect.getmembers(schema_module, inspect.isclass):
            if (
                not issubclass(model, BaseModel)
                or model is BaseModel
                or model.__module__ != schema_module.__name__
            ):
                continue
            for field_name, field in model.model_fields.items():
                if field.description is None or not field.description.strip():
                    missing.append(
                        f"{schema_module.__name__}.{model_name}.{field_name}"
                    )

    assert missing == []
