.PHONY: setup lint test verify schemas run-hub

setup:
	uv sync

lint:
	uv run ruff check .

test:
	uv run pytest -v

schemas:
	uv run python -m aarogya_contracts.export_schemas

verify:
	uv run python -m aarogya_contracts.export_schemas --check
	uv run ruff check .
	uv run pytest -v

run-hub:
	uv run uvicorn aarogya_phc_hub.app:app --host 0.0.0.0 --port 8000 --reload
