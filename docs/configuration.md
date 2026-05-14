# Configuration

All configuration is via environment variables. No config files needed.

## Required

| Variable | Default | Description |
|----------|---------|-------------|
| `UITARS_VLM_BASE_URL` | `http://127.0.0.1:11434/v1` | OpenAI-compatible VLM endpoint |
| `UITARS_VLM_MODEL` | `qwen2.5-vl:7b` | Model name to request |
| `UITARS_VLM_API_KEY` | `ollama` | API key (set to `ollama` for local) |

## Server

| Variable | Default | Description |
|----------|---------|-------------|
| `UITARS_PORT` | `10976` | Backend listen port |
| `UITARS_FRONTEND_PORT` | `10977` | Frontend dev port |
| `UITARS_HOST` | `127.0.0.1` | Bind address |
| `UITARS_LOG_LEVEL` | `info` | Logging level (debug/info/warning/error) |

## Task Execution

| Variable | Default | Description |
|----------|---------|-------------|
| `UITARS_MAX_STEPS` | `15` | Maximum actions per task before auto-stop |

## VLM Provider Recipes

### Ollama (local)

```powershell
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:11434/v1"
$env:UITARS_VLM_MODEL = "qwen2.5-vl:7b"
$env:UITARS_VLM_API_KEY = "ollama"
```

### vLLM (local)

```powershell
$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:8000/v1"
$env:UITARS_VLM_MODEL = "ByteDance-Seed/UI-TARS-1.5-7B"
$env:UITARS_VLM_API_KEY = "not-needed"
```

### OpenAI

```powershell
$env:UITARS_VLM_BASE_URL = "https://api.openai.com/v1"
$env:UITARS_VLM_MODEL = "gpt-4o"
$env:UITARS_VLM_API_KEY = "sk-..."
```

### LiteLLM (proxy for Anthropic or any provider)

LiteLLM translates any provider's API to OpenAI-compatible format:

```powershell
pip install litellm
litellm --model claude-sonnet-4-20250514

$env:UITARS_VLM_BASE_URL = "http://127.0.0.1:4000/v1"
$env:UITARS_VLM_MODEL = "claude-sonnet-4-20250514"
$env:UITARS_VLM_API_KEY = "sk-ant-..."
```

Anthropic's native Messages API is **not** OpenAI-compatible and won't work directly. Use LiteLLM as a translation proxy.

## VRAM Budget

| Configuration | VRAM | Fits |
|---------------|------|------|
| Ollama qwen2.5-vl:7b (Q4_K_M) | ~5.5 GB | Any GPU |
| vLLM UI-TARS-1.5-7B (FP16) | ~18 GB | RTX 4090 (24 GB) |
| vLLM UI-TARS-1.5-7B (AWQ) | ~6.5 GB | Any GPU |
| Cloud API (OpenAI / LiteLLM proxy) | — | No GPU needed |
