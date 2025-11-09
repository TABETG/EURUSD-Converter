SHELL := /bin/bash

DC := docker compose
APP := eurusd-converter

.PHONY: up down logs ps rebuild front-logs back-logs fmt lint test clean

up:
	@echo "# Front : http://localhost:8080"
	@echo "# Back  : http://localhost:8000/docs"
	$(DC) up -d --build

down:
	$(DC) down

rebuild:
	$(DC) build --no-cache
	$(DC) up -d

logs:
	$(DC) logs -f --tail=100

ps:
	$(DC) ps

front-logs:
	$(DC) logs -f --tail=100 frontend

back-logs:
	$(DC) logs -f --tail=100 backend

fmt:
	@echo ">> Front: format (prettier)"
	$(DC) exec -it frontend sh -c '[[ -f package.json ]] && npx prettier -w . || true' || true
	@echo ">> Back: black + ruff"
	$(DC) exec -it backend sh -c 'black app && ruff check app --fix || true' || true

lint:
	@echo ">> Front: eslint"
	$(DC) exec -it frontend sh -c '[[ -f package.json ]] && npm run lint || true' || true
	@echo ">> Back: ruff"
	$(DC) exec -it backend sh -c 'ruff check app || true' || true

test:
	@echo ">> Front: vitest"
	$(DC) exec -it frontend sh -c '[[ -f package.json ]] && npm test || true' || true
	@echo ">> Back: pytest"
	$(DC) exec -it backend sh -c 'pytest -q || true' || true

clean:
	$(DC) down -v
	docker image rm eurusd-frontend:local eurusd-backend:local 2>/dev/null || true
