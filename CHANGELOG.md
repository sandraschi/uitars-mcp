# Changelog

## 0.2.0 (2026-05-14)

- Browser operator — Playwright-based headless Chromium control
- `uitars_browser_navigate`, `uitars_browser_execute`, `uitars_browser_close` MCP tools
- Browser REST endpoints: `/api/browser/navigate`, `/api/browser/execute`, `/api/browser/close`
- Webapp Browser tab with URL input, page screenshot, and task runner
- Playwright as optional dependency (`uv sync --extra browser`)
- Rewritten README: badges, comparison table, VLM provider matrix
- `uitars_status` MCP tool — unified health: VLM, browser, config
- Config validation at startup — VLM connectivity probe
- Browser operator auto-recovery from crashes
- `.pre-commit-config.yaml` (ruff + biome)
- `robofang.json` fleet discovery manifest
- 8 browser operator tests (14 tests total)
- `docs/browser.md` — browser operator documentation
- Updated tools reference, help tool, llms files

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
