LINT_PATHS = api/ core/ manage.py generate_fake_voters.py

ifneq (,$(wildcard ./.env.local))
    include .env.local
    export
endif


lint:
	@uv run ruff check $(LINT_PATHS)

lint-fix:
	@uv run ruff check $(LINT_PATHS) --fix

format:
	@uv run ruff format $(LINT_PATHS)

dev:
	@uv run manage.py runserver

consumer:
	@uv run manage.py run_huey

generate-fake:
	@uv run generate_fake_voters.py
