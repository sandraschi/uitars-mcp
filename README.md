# uitars-mcp

Desktop GUI agent MCP server powered by UI-TARS vision-language models. Exposes MCP tools for computer automation — execute tasks via natural language, capture screenshots, and control mouse/keyboard through the MCP protocol.

## Quick Start

```powershell
# Install deps
uv sync
cd web_sota && npm install

# Start everything (backend + frontend + browser)
.\web_sota\start.ps1
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `uitars_execute` | Execute a GUI task end-to-end (screenshot → VLM → action loop) |
| `uitars_screenshot` | Capture current desktop screenshot (base64 PNG) |
| `uitars_click` | Click at coordinates or element description |
| `uitars_type` | Type text at current focus |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `UITARS_PORT` | `10976` | Backend port |
| `UITARS_FRONTEND_PORT` | `10977` | Frontend port |
| `UITARS_VLM_BASE_URL` | `http://127.0.0.1:11434/v1` | VLM endpoint (OpenAI-compatible) |
| `UITARS_VLM_MODEL` | `qwen2.5-vl:7b` | Model name |
| `UITARS_VLM_API_KEY` | `ollama` | API key |
| `UITARS_MAX_STEPS` | `15` | Max action steps per task |

## Architecture

See [SPEC.md](./SPEC.md) for full architecture and design decisions.
