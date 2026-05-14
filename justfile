# uitars-mcp justfile

default:
    @just --list

# ── Run ────────────────────────────────────────────────────────────

# Start full stack (backend + frontend + browser)
serve:
    @powershell -ExecutionPolicy Bypass -File web_sota/start.ps1

# Start backend only
backend:
    uv run uitars-mcp --serve

# Start frontend only (assumes backend running)
frontend:
    cd web_sota && npm run dev

# ── Dev ────────────────────────────────────────────────────────────

# Install all deps (Python + Node + pre-commit hooks)
install:
    uv sync --extra dev
    cd web_sota && npm install
    uv run pre-commit install

# Install browser deps (Playwright + Chromium)
browser:
    uv sync --extra browser
    uv run playwright install chromium

# ── Test & Lint ────────────────────────────────────────────────────

# Run all checks (lint + test)
check: lint test

# Run tests
test:
    uv run pytest tests/ -v

# Lint Python source
lint:
    uv run ruff check src/ tests/

# Format Python source
fmt:
    uv run ruff format src/ tests/

# Format frontend
fmt-web:
    cd web_sota && npx biome format --write src/

# ── Build ──────────────────────────────────────────────────────────

# Build frontend for production
build:
    cd web_sota && npm run build

# ── Clean ──────────────────────────────────────────────────────────

# Clean build artifacts
clean:
    Remove-Item -Recurse -Force web_sota/dist -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force .pytest_cache -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force .ruff_cache -ErrorAction SilentlyContinue

# ── Maintenance ────────────────────────────────────────────────────

# Sync and update lockfile
lock:
    uv lock
