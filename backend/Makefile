.PHONY: run dev test lint format migrate upgrade db-bash seed

run:
	uv run uvicorn app.main:app

dev:
	uv run uvicorn app.main:app --reload

test:
	uv run pytest

lint:
	uv run ruff check .

format:
	uv run ruff format .

migrate:
	uv run alembic revision --autogenerate -m "Migration"

upgrade:
	uv run alembic upgrade head

seed:
	PYTHONPATH=. uv run python scripts/seed.py
