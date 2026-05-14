# UI-TARS MCP

> Tell your computer what to do. It does it.

**uitars-mcp** gives AI agents (Claude, OpenCode, Hermes) eyes and hands on your desktop. It takes screenshots, feeds them to a vision-language model, and executes mouse/keyboard actions — all through standard MCP tools.

## Quick Start

```powershell
git clone https://github.com/sandraschi/uitars-mcp.git
cd uitars-mcp
uv sync
# Point at a VLM — local Ollama or cloud API (see docs/configuration.md)
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:11434/v1"
$env:UITARS_VLM_MODEL = "qwen2.5-vl:7b"
.\web_sota\start.ps1
```

## What it does

| Tool | What your agent says | What happens |
|------|---------------------|--------------|
| `uitars_execute` | "Open Notepad, type hello world" | Screenshot → VLM → click → type → done |
| `uitars_screenshot` | "Show me the desktop" | Returns base64 PNG of current screen |
| `uitars_click` | "Click at (500, 300)" | Mouse click at coordinates |
| `uitars_type` | "Type the report" | Keyboard input at cursor |
| `uitars_help` | "What can you do?" | Task reference, examples, config |

## Requirements

- **Python 3.12+** with `uv`
- **A VLM endpoint** — one of:
  - Ollama with `qwen2.5-vl:7b` (~5.5 GB VRAM, fits any GPU)
  - vLLM with UI-TARS-1.5-7B (~14 GB VRAM, fits RTX 4090)
  - Cloud API (Anthropic, OpenAI) — no GPU needed
- **Node.js** for the webapp (optional; server works standalone)
- **Windows or macOS** — tested on Windows

## Docs

| Document | For |
|----------|-----|
| [docs/install.md](docs/install.md) | Prerequisites, clone, uv sync, verify |
| [docs/configuration.md](docs/configuration.md) | Env vars, VLM providers, port tuning |
| [docs/tools-reference.md](docs/tools-reference.md) | Every MCP tool with parameters and examples |
| [docs/architecture.md](docs/architecture.md) | Screenshot loop internals, data flow |
| [docs/safety.md](docs/safety.md) | Fail-safe, permissions, sandboxing |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common problems and fixes |
| [SPEC.md](SPEC.md) | Full architecture spec and design decisions |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## In your agent

```json
{
  "mcpServers": {
    "uitars-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:10976/mcp"
    }
  }
}
```

## Ports

| Port | Service |
|------|---------|
| 10976 | Backend (FastAPI + MCP HTTP `/mcp`) |
| 10977 | Frontend (Vite dev, proxies → 10976) |

## License

Apache 2.0. Powered by ByteDance's UI-TARS model ([Apache 2.0](https://github.com/bytedance/UI-TARS)).
