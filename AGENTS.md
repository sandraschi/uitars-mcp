# AGENTS.md — UI-TARS MCP

Instructions for AI agents (Claude Code, OpenCode, Cursor, Hermes) working with this repository.

## Project

uitars-mcp is a FastMCP 3.2 server that wraps a vision-language model (VLM) to control the desktop and browser via MCP tools. Single uvicorn process serves FastAPI REST API + FastMCP HTTP `/mcp` + static webapp on port 10976.

## Architecture

```
src/uitars_mcp/
├── server.py       # 9 MCP tools (@mcp.tool decorators)
├── app.py          # FastAPI REST + capabilities + static files
├── config.py       # Env-based config (UITARS_* vars)
├── __main__.py     # uvicorn entry: uv run uitars-mcp --serve
└── operators/
    ├── computer.py # Desktop: mss screenshot → VLM → pyautogui actions
    ├── browser.py  # Browser: Playwright page → VLM → click/type/scroll
    └── vlm_client.py # OpenAI-compatible /v1/chat/completions client
```

## Key Conventions

- **Python 3.12+** with `uv` (pyproject.toml + uv.lock)
- **FastMCP 3.2** tool decorators with `annotations={"readOnlyHint": True/False}`
- **Pydantic v2** — no `.dict()`, use `.model_dump()`
- **OpenAI-compatible VLM protocol** — POST `/v1/chat/completions` with `image_url` content blocks
- **Ruff lint**: fleet-standard rules (`E,F,W,I,B,S,UP,RUF`), line-length 120, double quotes
- **Biome** for web_sota/ frontend
- **No npm at runtime** — pre-built dist/ committed, served by FastAPI StaticFiles

## Commands

```powershell
# Dev
uv sync --extra dev
uv run uitars-mcp --serve              # Start backend (port 10976)

# Webapp dev (optional — requires Node.js)
cd web_sota && npm install && npm run dev  # Vite on 10977, proxies → 10976

# Test & Lint
uv run pytest tests/ -v                # 31 tests
uv run ruff check src/                 # Lint Python
uv run ruff format src/                # Format Python
cd web_sota && npx biome check .       # Lint frontend

# Full stack
.\web_sota\start.ps1                   # Kill zombies, start backend, open browser
```

## Adding an MCP Tool

1. Implement operator logic in `operators/` (if needed)
2. Register with `@mcp.tool()` in `server.py` with Pydantic `Field` descriptions
3. Add REST endpoint in `app.py` (if needed)
4. Update `uitars_help()` tool listing
5. Update `docs/tools-reference.md`
6. Add tests in `tests/`

## Adding a VLM Provider

The VLM client (`operators/vlm_client.py`) is provider-agnostic. Any endpoint that speaks OpenAI-compatible `/v1/chat/completions` with `image_url` content blocks works. To add a new provider, just set the env vars:

```powershell
$env:UITARS_VLM_BASE_URL = "..."
$env:UITARS_VLM_MODEL = "..."
$env:UITARS_VLM_API_KEY = "..."
```

No code changes needed. For non-OpenAI-compatible providers (e.g. Anthropic), use LiteLLM as a proxy.

## Webapp Frontend

- **No framework** — vanilla React 18 with zero-dependency hash router (`src/router.tsx`)
- **Iron Shell**: Sidebar + Topbar + MainView + LoggerPanel
- **Pages**: Dashboard, DesktopPage, BrowserPage, Demo, HelpPage
- **Inline styles** — no CSS modules/tailwind
- **Build**: `npx vite build` → `web_sota/dist/` (committed to repo)

## Ports

| Port | Service |
|------|---------|
| 10976 | Everything — REST + MCP + webapp (single-port) |
| 10977 | Vite dev server (optional, dev only) |

## Fleet Standards Checklist

- [x] FastMCP 3.2 HTTP transport
- [x] Fleet-standard ruff config
- [x] Pre-commit hooks (ruff + biome)
- [x] GitHub Actions CI/CD
- [x] robofang.json manifest
- [x] glama.json discovery
- [x] /api/capabilities endpoint
- [x] Iron Shell webapp layout
- [x] start.ps1 + start.bat
- [x] llms.txt + llms-full.txt
- [x] justfile with serve/test/lint/fmt
- [x] Apache 2.0 license
