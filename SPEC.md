# SPEC: UI-TARS MCP — Desktop GUI Agent Server

**Status:** SPEC (Plan Phase → Implementation)
**Repo:** `D:\Dev\repos\uitars-mcp`
**Date:** 2026-05-14
**Ports:** 10976 (backend MCP + REST) / 10977 (frontend Vite)
**Model:** UI-TARS-1.5-7B (HuggingFace) or Qwen2.5-VL-7B (Ollama) — both fit RTX 4090 (24GB)

---

## 1. Rationale

ByteDance's UI-TARS is the strongest open-source GUI agent model. It beats GPT-4o and Claude on OSWorld, AndroidWorld, and ScreenSpot. The `ui-tars` Python SDK provides action parsing. The model weights (7B) fit comfortably on our RTX 4090.

Currently there is no way to use GUI automation from within the MCP fleet. Claude Code and OpenCode can't click buttons or fill forms on our desktop. chitchat can chat but can't operate GUIs. Agent TARS CLI exists but is Node.js-only and not MCP-exposable.

**This repo bridges the gap:** a Python-native FastMCP server that wraps the UI-TARS model (or any OpenAI-compatible VLM) with a screenshot→action→execute loop, exposed as MCP tools. A companion Vite+React webapp provides visual task monitoring.

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     uitars-mcp                            │
│                                                           │
│  ┌─────────────────────┐   ┌──────────────────────────┐  │
│  │  web_sota/           │   │  src/uitars_mcp/          │  │
│  │  Vite + React        │   │                           │  │
│  │  port 10977          │   │  config.py    — ports/env │  │
│  │                      │   │  server.py    — FastMCP   │  │
│  │  • Screenshot feed   │   │  app.py       — FastAPI   │  │
│  │  • Task input        │   │  __main__.py  — uvicorn   │  │
│  │  • Action history    │   │                           │  │
│  │  • Model status      │   │  operators/               │  │
│  │                      │   │  ├─ computer.py           │  │
│  └─────────┬────────────┘   │  ├─ browser.py            │  │
│            │                 │  └─ vlm_client.py         │  │
│            │ proxy /api      │                           │  │
│            │ proxy /mcp      └───────────┬───────────────┘  │
│            └─────────────────────────────┘                  │
│                                           │                  │
│                           ┌───────────────┴───────────────┐ │
│                           │     VLM Backend                │ │
│                           │                                │ │
│                           │  Local (RTX 4090):             │ │
│                           │  ┌──────────────────────────┐  │ │
│                           │  │ vLLM + UI-TARS-1.5-7B    │  │ │
│                           │  │ ~14GB VRAM (FP16)        │  │ │
│                           │  │ OpenAI-compatible :8000   │  │ │
│                           │  └──────────────────────────┘  │ │
│                           │                                │ │
│                           │  Lightweight fallback:         │ │
│                           │  ┌──────────────────────────┐  │ │
│                           │  │ Ollama + qwen2.5-vl:7b   │  │ │
│                           │  │ ~5.5GB VRAM (Q4_K_M)     │  │ │
│                           │  │ OpenAI-compatible :11434  │  │ │
│                           │  └──────────────────────────┘  │ │
│                           │                                │ │
│                           │  Remote (API):                 │ │
│                           │  ┌──────────────────────────┐  │ │
│                           │  │ Anthropic / OpenAI        │  │ │
│                           │  │ Claude / GPT-4o (no GPU)  │  │ │
│                           │  └──────────────────────────┘  │ │
│                           └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Screenshot → Action → Execute Loop

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Screenshot│───▶│ VLM Call │───▶│ Parse    │───▶│ Execute  │
│  (mss)   │    │ (prompt) │    │ (ui-tars)│    │(pyautogui)│
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
      ▲                                               │
      └───────────────────────────────────────────────┘
                        loop until done
```

**Step detail:**
1. **Screenshot:** `mss` captures full desktop (multi-monitor support via `mss` native)
2. **VLM Call:** Screenshot base64 + UI-TARS prompt template → OpenAI-compatible `/v1/chat/completions`
3. **Parse:** `ui_tars.action_parser.parse_action_to_structure_output()` → structured action dict
4. **Execute:** `pyautogui` executes click, type, hotkey, scroll, drag
5. **Loop:** Return screenshot to VLM with action history until task complete or max steps reached

### 2.3 MCP Tool Surface (4 tools)

| Tool | Annotation | Purpose |
|------|-----------|---------|
| `uitars_execute` | MUTATING | Full task: natural language → multi-step GUI execution |
| `uitars_screenshot` | READ_ONLY | Capture current desktop, return base64 |
| `uitars_click` | MUTATING | Atomic click at coordinates or element description |
| `uitars_type` | MUTATING | Type text at current focus |

### 2.4 REST API Surface

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Backend readiness + model status |
| `/api/execute` | POST | Execute GUI task (returns streaming status) |
| `/api/screenshot` | GET | Current screenshot as PNG |
| `/api/status` | GET | Model info, VRAM usage, last task |
| `/mcp` | — | FastMCP HTTP endpoint (mounted) |

### 2.5 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Python-native (no Node.js) | Fleet standard. uv + hatchling + FastMCP. Zero foreign runtimes. |
| OpenAI-compatible VLM protocol | Works with vLLM, Ollama, Anthropic, OpenAI. Provider-agnostic. |
| `ui-tars` SDK for action parsing | Battle-tested coordinate mapping. Don't reinvent. |
| `mss` for screenshots | Fast, cross-platform, GPU-accelerated on Windows. Beats PIL. |
| `pyautogui` for execution | Stable, cross-platform, fail-safe. Fleet-approved. |
| Single uvicorn process (FastAPI + FastMCP) | Same pattern as chitchat. Simpler than separate processes. |
| Co-located MCP + webapp | Fleet standard. Adjacent ports 10976/10977. |
| VLM backend via env vars | `UITARS_VLM_BASE_URL`, `UITARS_VLM_MODEL`, `UITARS_VLM_API_KEY` |

---

## 3. Implementation Phases

### Phase 1: Core MCP Server ✅ (complete)
- [x] SPEC.md
- [x] pyproject.toml, .gitignore, justfile
- [x] `src/uitars_mcp/config.py` — env-based config
- [x] `src/uitars_mcp/operators/vlm_client.py` — OpenAI-compatible VLM client
- [x] `src/uitars_mcp/operators/computer.py` — screenshot + execute loop
- [x] `src/uitars_mcp/server.py` — FastMCP tools (5 tools)
- [x] `src/uitars_mcp/app.py` — FastAPI + MCP mount
- [x] `src/uitars_mcp/__main__.py` — uvicorn entry point
- [x] Tests: action parser + coordinate mapper (6 tests)
- [x] Fleet-standard docs: 8 documents in docs/
- [x] LICENSE (Apache 2.0), CHANGELOG.md

### Phase 2: Webapp ✅ (complete)
- [x] `web_sota/` — Vite + React + TypeScript
- [x] Screenshot feed (polling)
- [x] Task input + action history timeline
- [x] Model status panel (VLM badge)
- [x] Help tab — tool table, examples, docs links, safety info

### Phase 3: Browser Operator (current)
- [ ] `operators/browser.py` — Playwright-based browser control
- [ ] `uitars_browser_navigate` MCP tool — open URL, get page screenshot
- [ ] `uitars_browser_execute` MCP tool — execute task in browser via VLM
- [ ] REST endpoints: `/api/browser/navigate`, `/api/browser/execute`
- [ ] Webapp Browser tab — URL input, task runner, page screenshot feed
- [ ] `docs/browser.md` — browser operator documentation
- [ ] Playwright as optional dependency

---

## 4. Port Allocation

Registered in `WEBAPP_PORTS.md`:

| Port | Service |
|------|---------|
| 10976 | uitars-mcp backend (FastAPI + FastMCP HTTP `/mcp`) |
| 10977 | uitars-mcp frontend (Vite dev) |

Adjacency preserved: 10976/10977 next to chitchat's 10974/10975.

---

## 5. VRAM Budget (RTX 4090, 24GB)

| Configuration | Weights | KV Cache | Total | Headroom |
|---------------|---------|----------|-------|----------|
| Ollama qwen2.5-vl:7b (Q4_K_M) | 5.5 GB | 2 GB | 7.5 GB | 16.5 GB |
| vLLM UI-TARS-1.5-7B (FP16) | 14 GB | 4 GB | 18 GB | 6 GB |
| vLLM UI-TARS-1.5-7B (AWQ 4-bit) | 4.5 GB | 2 GB | 6.5 GB | 17.5 GB |
| Remote API (Anthropic/OpenAI) | 0 GB | 0 GB | 0 GB | 24 GB |

**Recommendation:** Start with Ollama + qwen2.5-vl:7b (zero setup, already in fleet). Graduate to vLLM + UI-TARS-1.5-7B for benchmark-chasing performance.

---

## 6. Dependencies

```toml
[project]
name = "uitars-mcp"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastmcp>=3.2",          # MCP server framework
    "fastapi>=0.115",        # REST API
    "uvicorn[standard]>=0.32", # ASGI
    "httpx>=0.27",           # VLM client (async HTTP)
    "pydantic>=2.5",         # Schema validation
    "pydantic-settings>=2.0", # Env-based config
    "ui-tars>=0.1",          # Action parser SDK (ByteDance)
    "mss>=10.0",             # Screenshot capture (GPU-accelerated)
    "pyautogui>=0.9",        # Mouse/keyboard automation
    "pillow>=11.0",          # Image processing
]
```

---

## 7. Prompt Template

Using UI-TARS `COMPUTER_USE` template from `ui_tars.prompt`:

```
You are a GUI agent. You are given a task and a screenshot.
You must output exactly one action per turn.

Available actions:
- click(start_box='(x1,y1),(x2,y2)')
- double_click(start_box='(x1,y1),(x2,y2)')
- right_click(start_box='(x1,y1),(x2,y2)')
- drag(start_box='(x1,y1),(x2,y2)', end_box='(x3,y3),(x4,y4)')
- hotkey(key='ctrl c')
- type(content='hello world')
- scroll(start_box='(x1,y1),(x2,y2)', direction='up|down')
- finished(content='task complete message')

Format: Thought: <reasoning>\nAction: <action>
```

---

## 8. Startup Flow

```
┌─────────────────────────────────────────────┐
│               web_sota/start.ps1              │
├───────────────────────────────────────────────┤
│  1. Kill zombies on 10976, 10977             │
│  2. Start backend (uv run uitars-mcp --serve)│
│  3. Poll /api/health until ready             │
│  4. npm install (if needed)                  │
│  5. Open browser at http://127.0.0.1:10977   │
│  6. Start Vite dev server                    │
└─────────────────────────────────────────────┘
```

---

## 9. Fleet Integration

### 9.1 chitchat → uitars-mcp
chitchat can delegate GUI tasks to uitars-mcp via MCP. Example: "Open VS Code settings and enable autosave" flows through chitchat → uitars_execute MCP tool.

### 9.2 robofang → uitars-mcp
Robofang's Sentinel can use uitars_screenshot for visual verification of desktop state.

### 9.3 Claude Code / OpenCode
Register uitars-mcp as an MCP server in Claude Code's config. GUI automation becomes available in all coding sessions.

### 9.4 Hermes Agent
Hermes can use uitars_execute to perform desktop tasks as part of multi-agent workflows.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| VLM hallucinates wrong coordinates | `pyautogui.FAILSAFE = True` (corner abort) + max step limit |
| Model not available (GPU offline) | Graceful fallback to remote API with clear error |
| `mss` multi-monitor issues | `mss` handles multi-monitor natively; test on Sandra's setup |
| Chinese-only model documentation | We use English prompt templates from `ui-tars` SDK |
| Slow inference on CPU | Gate: require GPU or remote API. CPU path is "best effort only." |

---

## 11. Success Criteria

- [ ] `uv run uitars-mcp --serve` starts on port 10976
- [ ] `uitars_screenshot` MCP tool returns valid base64 PNG
- [ ] `uitars_execute` completes a simple task ("open Notepad, type hello") end-to-end
- [ ] Webapp shows live screenshot feed
- [ ] Works with Ollama qwen2.5-vl:7b (local) and Anthropic API (remote)
- [ ] `start.ps1` clears ports, starts both backend and frontend, opens browser
