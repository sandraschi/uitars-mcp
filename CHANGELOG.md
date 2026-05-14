# Changelog

## 0.2.0-beta (2026-05-14)

### Added
- **Browser operator** — Playwright-based headless Chromium control
  - `uitars_browser_navigate`, `uitars_browser_execute`, `uitars_browser_close` MCP tools
  - Browser REST endpoints: `/api/browser/*`
  - Auto-recovery from browser crashes
  - `uv sync --extra browser` + `playwright install chromium`
- **`uitars_status`** MCP tool — unified health: VLM, browser, config
- **Fleet-standard Iron Shell webapp** — Sidebar (collapsible), Topbar (status badges), MainView, LoggerPanel
  - Zero-dependency hash router (react-router-dom not needed)
  - Pages: Dashboard, Desktop, Browser, Demo, Help
  - Glassmorphism dark theme, micro-animations, custom scrollbars
- **`/api/capabilities`** endpoint — fleet-standard capability introspection
- **Demo page** — hero, flow diagram, feature cards, example task table
- **CI/CD** — GitHub Actions: dual-job (ruff+pytest + biome+tsc+build)
- **`.pre-commit-config.yaml`** — ruff format+lint, biome format
- **`robofang.json`** — fleet discovery manifest
- **31 tests** — config, VLM client, help/status tools, parametrized action parsing

### Changed
- **Single-port architecture** — backend serves webapp from pre-built `dist/` (port 10976 only)
  - No Node.js, no npm, no Vite dev server at runtime
  - `start.ps1` simplified: auto-builds dist if missing, then starts server
- **Ruff config upgraded** to fleet standard (`E,F,W,I,B,S,UP,RUF`, line-length 120)
- **VLM providers table** — removed incorrect Anthropic direct support, added LiteLLM proxy
- **Comparison table** — added Speed row, Browser column fixed
- **GitHub** — 14 topics, beta status badge, expanded description
- **Justfile** — 14 recipes, categorized sections

### Fixed
- **start.bat** — removed `$ErrorActionPreference = "Stop"` (caused instacrash on non-admin shells)
- **Port zombie cleanup** wrapped in try/catch — never fatal
- **npm install timeout** — 120s background job with `--prefer-offline` fallback
- **vite binary** check changed to `vite.cmd` on Windows
- **Non-ASCII characters** in start.ps1 (em-dash, ellipsis) replaced with ASCII
- **Help tool** — fixed hardcoded version, now lists all 9 tools
- **All S110** try-except-pass lints resolved with `logger.debug`

## 0.1.0 (2026-05-14)

- Initial release: FastMCP 3.2 server with 4 MCP tools
- `uitars_execute` — end-to-end GUI task execution via VLM grounding
- `uitars_screenshot` — desktop screenshot capture
- `uitars_click` — coordinate-based mouse clicks
- `uitars_type` — keyboard text input
- `uitars_help` — inline help and task reference
- FastAPI REST API with health, status, screenshot, execute endpoints
- Vite + React webapp with live screenshot feed and Help tab
- Provider-agnostic VLM client (Ollama, vLLM, Anthropic, OpenAI)
- Fleet-standard docs/, start.ps1, llms.txt, glama.json
