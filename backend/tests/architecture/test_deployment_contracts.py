from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


def test_edge_proxy_accepts_base64_encoded_five_megabyte_uploads() -> None:
    nginx_config = (REPOSITORY_ROOT / "deploy/nginx/nginx.conf").read_text(
        encoding="utf-8"
    )

    assert "client_max_body_size 8m;" in nginx_config


def test_frontend_container_runs_the_full_build_gate() -> None:
    dockerfile = (REPOSITORY_ROOT / "frontend/Dockerfile").read_text(encoding="utf-8")

    assert "RUN npm run build" in dockerfile
    assert "RUN npx vite build" not in dockerfile
