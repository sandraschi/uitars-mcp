# uitars-mcp justfile

default:
    @just --list

# Start the full stack (backend + frontend)
serve:
    @powershell -ExecutionPolicy Bypass -File web_sota/start.ps1

# Start backend only
backend:
    uv run uitars-mcp --serve

# Start frontend only (assumes backend running)
frontend:
    cd web_sota && npm run dev

# Run tests
test:
    uv run pytest tests/ -v

# Lint
lint:
    uv run ruff check src/

# Format
fmt:
    uv run ruff format src/

# Install all deps (Python + Node)
install:
    uv sync
    cd web_sota && npm install

# Sync lockfile
lock:
    uv lock
