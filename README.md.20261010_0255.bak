# UI-TARS MCP — Desktop + Browser Agent

<p align="center">
  <a href="https://github.com/casey/just"><img src="https://img.shields.io/badge/just-ready_to_go-7c5cfc?style=flat-square&logo=just&logoColor=white" alt="Just"></a>
  <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json" alt="Ruff"></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://github.com/PrefectHQ/fastmcp"><img src="https://img.shields.io/badge/FastMCP-3.2-7c5cfc?style=flat-square" alt="FastMCP"></a>
</p>

> **Tell your computer what to do. It does it.**

uitars-mcp gives AI agents (Claude, OpenCode, Hermes) eyes and hands on your desktop **and browser**. It takes screenshots, feeds them to a vision-language model, and executes mouse/keyboard/browser actions — all through standard MCP tools.

## Quick Start

```powershell
git clone https://github.com/sandraschi/uitars-mcp
cd uitars-mcp
just
```

This opens an interactive dashboard showing all available commands. Run `just bootstrap` to install dependencies, then `just serve` or `just dev` to start.

### Manual Setup

If you don't have `just` installed:
git clone https://github.com/sandraschi/uitars-mcp.git
cd uitars-mcp
uv sync
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:11434/v1"
$env:UITARS_VLM_MODEL = "qwen2.5-vl:7b"
.\web_sota\start.ps1
The backend serves the API and MCP on port 10976. The Vite frontend runs on 10977 and proxies `/api` + `/mcp` to the backend. One `start.bat` launches both.

## What it does

| Surface | Tools | How it works |
|---------|-------|-------------|
| **Desktop** | `uitars_execute`, `screenshot`, `click`, `type`, `help` | Screenshot → VLM → mouse/keyboard actions |
| **Browser** | `uitars_browser_navigate`, `browser_execute`, `browser_close` | Headless Chromium → page screenshot → VLM → click/type/scroll |

## Comparison

| | uitars-mcp | pywinauto-mcp | autohotkey-mcp | Manual (human) |
|---|---|---|---|---|
| **Method** | Visual grounding (VLM) | UI element tree (Win32) | Scripted keybinds | Human clicking |
| **Works with** | Any visible UI | Windows native apps only | Pre-defined hotkeys | Everything |
| **Speed** | ~2-5s per action (VLM inference) | ~10ms (direct API) | ~1ms (native hook) | ~500ms-2s (varies with coffee) |
| **Flexibility** | Adapts to any layout, any app | Fixed element paths break on UI changes | Rigid scripts | Requires human |
| **Setup** | Point at a VLM endpoint | None (Win32 APIs) | Install AHK v2 | None |
| **Accuracy** | Dependent on VLM quality | 100% for known elements | 100% for scripted flows | 100%* |
| **Browser** | Built-in (Playwright) | No | No | Yes |
| **Best for** | Unknown UIs, general automation | Precise Windows automation | Repetitive hotkey workflows | One-off tasks |

## MCP Tools (8)

### Desktop
| Tool | What your agent says |
|------|---------------------|
| `uitars_execute` | "Open Notepad, type hello world" |
| `uitars_screenshot` | "Show me the desktop" |
| `uitars_click` | "Click at (500, 300)" |
| `uitars_type` | "Type the report" |
| `uitars_help` | "What can you do?" |

### Browser
| Tool | What your agent says |
|------|---------------------|
| `uitars_browser_navigate` | "Open github.com and show me the page" |
| `uitars_browser_execute` | "Search for Python, click the first result" |
| `uitars_browser_close` | "Done with the browser, free the resources" |
| `uitars_status` | "Are VLM and browser both healthy?" |

## VLM Providers

All providers must speak the **OpenAI `/v1/chat/completions` API** and accept images in `image_url` content blocks. The model must be **vision-capable** (screenshot → text).

| Provider | Model | GPU needed | Setup |
|----------|-------|-----------|-------|
| **Ollama** (local) | `qwen2.5-vl:7b` | ~5.5 GB | `ollama pull qwen2.5-vl:7b` |
| **vLLM** (local) | `ByteDance-Seed/UI-TARS-1.5-7B` | ~18 GB | pip install vllm |
| **OpenAI** (cloud) | `gpt-4o` | — | `$env:UITARS_VLM_API_KEY = "sk-..."` |
| **LiteLLM proxy** (local) | any VLM | — | Proxies any provider to OpenAI format |

Anthropic Claude is **not** directly supported — it uses a different API protocol. Use [LiteLLM](https://github.com/BerriAI/litellm) as a translation proxy if you need it.

## Fleet Integration

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

Port **10976** (backend: FastAPI + MCP `/mcp`) and **10977** (frontend: Vite dev, proxies → 10976). Adjacent to chitchat (10974/10975).

## Docs

| Document | For |
|----------|-----|
| [docs/install.md](docs/install.md) | Prerequisites, clone, 3 VLM paths, verify |
| [docs/configuration.md](docs/configuration.md) | Env vars, VLM providers, VRAM budget |
| [docs/tools-reference.md](docs/tools-reference.md) | Every MCP tool with parameters and examples |
| [docs/architecture.md](docs/architecture.md) | Screenshot loop internals, data flow |
| [docs/browser.md](docs/browser.md) | Browser operator setup, Playwright, headless mode |
| [docs/safety.md](docs/safety.md) | Fail-safe, permissions, privacy |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common problems and fixes |
| [docs/integration-guide.md](docs/integration-guide.md) | Claude Desktop, fleet, REST API |
| [SPEC.md](SPEC.md) | Full architecture spec |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## License

Apache 2.0. Powered by ByteDance's UI-TARS model ([Apache 2.0](https://github.com/bytedance/UI-TARS)).
