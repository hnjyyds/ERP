from pathlib import Path

MAX_BACKEND_FILE_LINES = 700


def test_backend_app_python_files_stay_under_700_lines() -> None:
    backend_app = Path(__file__).resolve().parents[2] / "app"
    oversized_files = []

    for path in sorted(backend_app.rglob("*.py")):
        line_count = len(path.read_text(encoding="utf-8").splitlines())
        if line_count > MAX_BACKEND_FILE_LINES:
            oversized_files.append(f"{path.relative_to(backend_app)}:{line_count}")

    assert oversized_files == []
