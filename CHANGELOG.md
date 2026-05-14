# Changelog

## 0.2.0 (2026-05-14)

- Browser operator — Playwright-based headless Chromium control
- `uitars_browser_navigate` MCP tool — navigate to URL, return page screenshot
- `uitars_browser_execute` MCP tool — execute browser tasks via VLM grounding
- `uitars_browser_close` MCP tool — close browser, free resources
- Browser REST endpoints: `/api/browser/navigate`, `/api/browser/execute`, `/api/browser/close`
- Webapp Browser tab with URL input, page screenshot, and task runner
- Playwright as optional dependency (`uv sync --extra browser`)
- Rewritten README with badges, comparison table, and VLM provider matrix
- Updated help tool and webapp Help tab with browser tools
- `docs/browser.md` — browser operator documentation

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
