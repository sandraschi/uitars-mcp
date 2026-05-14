# Installation

## Prerequisites

- **Python 3.12+** — download from [python.org](https://python.org) or `winget install Python.Python.3.12`
- **uv** — `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
- **Git** — `winget install Git.Git`
- **Node.js 22+** (webapp only) — `winget install OpenJS.NodeJS`
- **A VLM model** — Ollama (free, local) or cloud API key

## Clone & Install

```powershell
git clone https://github.com/sandraschi/uitars-mcp.git
cd uitars-mcp
uv sync
```

This creates `.venv/` and installs: `fastmcp`, `fastapi`, `uvicorn`, `httpx`, `ui-tars`, `mss`, `pyautogui`, `pillow`.

## Get a VLM Running

### Option A: Ollama (zero-config, local)

```powershell
ollama pull qwen2.5-vl:7b
```

Set env vars (or skip — defaults point at Ollama):
```powershell
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:11434/v1"
$env:UITARS_VLM_MODEL = "qwen2.5-vl:7b"
$env:UITARS_VLM_API_KEY = "ollama"
```

### Option B: vLLM with UI-TARS-1.5-7B (best quality, local)

```powershell
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model ByteDance-Seed/UI-TARS-1.5-7B \
  --port 8000

$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:8000/v1"
$env:UITARS_VLM_MODEL = "ByteDance-Seed/UI-TARS-1.5-7B"
```

### Option C: Cloud API (no GPU)

```powershell
$env:UITARS_VLM_BASE_URL = "https://api.anthropic.com/v1"
$env:UITARS_VLM_MODEL = "claude-sonnet-4-20250514"
$env:UITARS_VLM_API_KEY = "sk-ant-..."
```

## Verify

```powershell
uv run uitars-mcp --serve
```

Open `http://127.0.0.1:10976/api/health` — should return `{"status":"ok"}`.

Check VLM connectivity: `http://127.0.0.1:10976/api/status`

## Frontend (Optional)

```powershell
cd web_sota
npm install
npm run dev
```

Opens at `http://127.0.0.1:10977/`.

## One-Command Start

```powershell
.\web_sota\start.ps1
```

Clears port zombies, starts backend, waits for health, installs npm deps if needed, opens browser, starts Vite.
