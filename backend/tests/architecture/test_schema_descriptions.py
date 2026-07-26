import inspect

from pydantic import BaseModel

from app.modules.system.auth import schemas as auth_schemas


def test_auth_schema_fields_have_descriptions() -> None:
    missing: list[str] = []

    for model_name, model in inspect.getmembers(auth_schemas, inspect.isclass):
        if (
            not issubclass(model, BaseModel)
            or model is BaseModel
            or model.__module__ != auth_schemas.__name__
        ):
            continue
        for field_name, field in model.model_fields.items():
            if field.description is None or not field.description.strip():
                missing.append(f"{model_name}.{field_name}")

    assert missing == []
