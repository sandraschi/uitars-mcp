# UI-TARS MCP — Desktop + Browser Agent

[![FastMCP](https://img.shields.io/badge/FastMCP-3.2-blue)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-green)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.2.0--alpha-blue)](CHANGELOG.md)
[![MCP Tools](https://img.shields.io/badge/MCP_Tools-9-orange)](docs/tools-reference.md)
[![VLM Backends](https://img.shields.io/badge/VLM-4_providers-purple)](docs/configuration.md)

> **Tell your computer what to do. It does it.**

uitars-mcp gives AI agents (Claude, OpenCode, Hermes) eyes and hands on your desktop **and browser**. It takes screenshots, feeds them to a vision-language model, and executes mouse/keyboard/browser actions — all through standard MCP tools.

## Quick Start

```powershell
git clone https://github.com/sandraschi/uitars-mcp.git
cd uitars-mcp
uv sync
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:11434/v1"
$env:UITARS_VLM_MODEL = "qwen2.5-vl:7b"
.\web_sota\start.ps1
```

## What it does

| Surface | Tools | How it works |
|---------|-------|-------------|
| **Desktop** | `uitars_execute`, `screenshot`, `click`, `type`, `help` | Screenshot → VLM → mouse/keyboard actions |
| **Browser** | `uitars_browser_navigate`, `browser_execute`, `browser_close` | Headless Chromium → page screenshot → VLM → click/type/scroll |

## Comparison

| | uitars-mcp | pywinauto-mcp | autohotkey-mcp | Manual automation |
|---|---|---|---|---|
| **Method** | Visual grounding (VLM) | UI element tree (Win32) | Scripted keybinds | Human clicking |
| **Works with** | Any visible UI | Windows native apps only | Pre-defined hotkeys | Everything |
| **Flexibility** | Adapts to any layout, any app | Fixed element paths break on UI changes | Rigid scripts | Requires human |
| **Setup** | Point at a VLM endpoint | None (Win32 APIs) | Install AHK v2 | None |
| **Accuracy** | Dependent on VLM quality | 100% for known elements | 100% for scripted flows | 100% |
| **Browser** | Built-in (Playwright) | No | No | No |
| **Best for** | General purpose automation, unknown UIs | Precise Windows automation | Repetitive hotkey workflows | One-off tasks |

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

Ports: **10976** (backend) / **10977** (frontend). Adjacent to chitchat (10974/10975).

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
