# Architecture

## System Overview

```
Agent (Claude / OpenCode / Hermes)
        │
        │ MCP tool call
        ▼
┌───────────────────────┐
│   FastMCP Server       │  port 10976
│   /mcp endpoint         │
├───────────────────────┤
│  uitars_execute()      │◄── entry point
│  uitars_screenshot()   │
│  uitars_click()        │
│  uitars_type()         │
│  uitars_help()         │
└───────────┬───────────┘
            │
    ┌───────┴────────┐
    │  operators/     │
    │                 │
    │  computer.py    │── screenshot capture (mss)
    │                 │── action parser (regex)
    │                 │── action executor (pyautogui)
    │                 │
    │  vlm_client.py  │── prompt builder
    │                 │── HTTP client (httpx)
    └───────┬─────────┘
            │
    ┌───────┴─────────┐
    │  VLM Backend     │
    │  (OpenAI compat) │
    │                  │
    │  Ollama :11434   │
    │  vLLM   :8000    │
    │  Anthropic API   │
    └─────────────────┘
```

## Screenshot → Action → Execute Loop

```
1. capture_screenshot()
   └─ mss grabs full desktop → PNG → base64

2. call_vlm(task, screenshot_b64, history)
   └─ Builds UI-TARS prompt + image → POST /v1/chat/completions
   └─ Returns: "Thought: ...\nAction: ..."

3. parse_action(response, width, height)
   └─ Regex extraction of thought + action string
   └─ Returns structured dict: {action_type, params}

4. execute_action(parsed)
   └─ pyautogui.click(x, y) / .typewrite(text) / .hotkey(keys)
   └─ Returns status string

5. Loop to step 1 with updated history
   └─ Until finished() or max_steps reached
```

## Single Process Design

One uvicorn process serves:
- **FastAPI** — REST endpoints (`/api/health`, `/api/screenshot`, `/api/execute`, `/api/status`)
- **FastMCP** — MCP HTTP endpoint at `/mcp`
- CORS enabled for webapp on port 10977
- No separate workers or queue — synchronous execution per request

## VLM Provider Abstraction

`operators/vlm_client.py` is provider-agnostic:
- Sends standard `POST /v1/chat/completions` with OpenAI message format
- Works with Ollama, vLLM, Anthropic, OpenAI — any server speaking the OpenAI chat completions protocol
- Image included as `data:image/png;base64,...` in `image_url` content block
- No provider-specific code paths

## Action Space

Supported actions parsed from VLM output:
- `click`, `double_click`, `right_click` — with bounding box coordinates
- `drag` — start_box → end_box
- `hotkey` — key combinations (e.g., "ctrl c", "win r")
- `type` — text content
- `scroll` — direction + optional bounding box
- `wait` — 2-second pause for UI stabilization
- `finished` — task completion marker

## Safety

- `pyautogui.FAILSAFE = True` — move mouse to corner (0,0) to abort
- `pyautogui.PAUSE = 0.3` — 300ms delay between actions
- `max_steps` limit prevents infinite loops
- No persistent state between requests
