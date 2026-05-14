# Changelog

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
