# UI-TARS MCP — Desktop GUI Agent Server

## Server Overview

UI-TARS MCP is a vision-language model (VLM) powered desktop GUI agent server. It translates natural language instructions into mouse and keyboard actions by repeatedly capturing screenshots, sending them to a VLM for visual grounding, parsing the model's action response, and executing the action via pyautogui (desktop) or Playwright (browser). The server exposes 10 tools over FastMCP 3.2 HTTP transport on a single port (10976), and also serves a FastAPI REST API + React webapp from the same process.

The action loop works as follows: (1) capture screenshot of the current desktop or browser page using mss (desktop) or Playwright (browser); (2) send the screenshot encoded as a base64 data URI, along with the task description and action history, to an OpenAI-compatible VLM endpoint via POST /v1/chat/completions; (3) the VLM returns a structured Thought: / Action: response where Thought is step-by-step reasoning and Action is exactly one of the supported computer-use or browser-use actions; (4) the server parses the action string with regex extraction into a structured dict containing action_type, parameters, and thought; (5) execute the parsed action via pyautogui (desktop: mouse movements, clicks, keyboard, hotkeys, drag, scroll) or Playwright (browser: page clicks, typing, navigation, scroll, key presses); (6) loop — capture a new screenshot, append the previous action and its result to the conversation history, send to VLM, and repeat until the VLM outputs finished() or max_steps is reached. Each turn produces a structured step record with the model's reasoning, the chosen action string, the parsed action type, and the execution status message returned by pyautogui or Playwright.

The server is designed for desktop automation, software testing, GUI scripting, browser automation, and any task where an agent needs to "see" the screen and interact with visual elements. It supports both the native desktop (Windows, macOS, Linux via mss + pyautogui) and headless browser automation (Playwright Chromium). Typical use cases include: opening applications and performing multi-step workflows, filling forms, navigating websites, extracting information from on-screen elements, testing software UIs, automating repetitive desktop tasks, and integrating GUI actions into larger AI agent pipelines.

Default VLM configuration uses Ollama at http://127.0.0.1:11434/v1 with qwen2.5-vl:7b, which provides free local visual grounding with a 7B parameter vision-language model that supports image_url content blocks. Any OpenAI-compatible VLM endpoint can be used by setting the UITARS_VLM_BASE_URL, UITARS_VLM_MODEL, and UITARS_VLM_API_KEY environment variables. For non-OpenAI-compatible providers such as Anthropic Claude or Google Gemini, the fleet standard is to run LiteLLM as a local proxy — LiteLLM translates any provider API into the OpenAI-compatible format that the VLM client expects.

Safety is built in at multiple levels. pyautogui has FAILSAFE = True, which means moving the mouse cursor to any corner of the screen immediately aborts the current action and prevents further automated input. The server runs in a single process on 127.0.0.1 by default, so remote access is not possible unless explicitly configured. The headless browser runs in complete isolation from the user's default browser profile — it has no access to saved passwords, cookies, sessions, or extensions. Every MCP tool is annotated with readOnlyHint to indicate whether it mutates desktop state: uitars_screenshot, uitars_status, and uitars_help are read-only; all other tools can modify the desktop, open applications, navigate the browser, or type text. The shutdown tool uitars_shutdown terminates the server process via os._exit(0), releasing all system resources including Playwright browser instances, pyautogui hooks, and network connections.

## Tools

Full descriptions of every MCP tool with exact parameter signatures, return types, and usage patterns.

### uitars_execute

Execute a GUI task on the desktop using visual grounding. This is the primary tool for desktop automation and the most commonly used endpoint. It captures screenshots, sends them to the VLM, parses the action response, executes mouse and keyboard actions via pyautogui, and loops until the task is complete or max_steps is reached.

Each step in the loop works as follows. The server captures the full desktop using mss (the Multi-Screen Screenshot library), which takes a BGRA raw pixel buffer at monitor resolution and converts it to an RGB PIL Image, then encodes it as a PNG and base64. This image is sent to the VLM as an image_url content block alongside the task description and the conversation history (previous assistant responses and the server's execution status messages). The VLM receives the system prompt defined in vlm_client.py, which tells it: "You are a GUI agent. You are given a task and a screenshot of the desktop. You must output exactly one action per turn to complete the task." The VLM returns a response containing "Thought: <reasoning>" and "Action: <one of the supported actions>". The server parses this response using regex to extract thought, action string, and action type, then calls execute_action() which dispatches to the appropriate pyautogui function. After execution, the conversation history is updated with the VLM's response and a new user message containing the execution status and the updated screenshot, and the loop continues.

Supported action types that the VLM can output for desktop tasks: click (left-click at the center of a bounding box), double_click (double-click at a bounding box), right_click (right-click for context menus), drag (click-hold drag from start bounding box to end bounding box), hotkey (press a keyboard combination like ctrl c or alt tab), type (type text content at the current keyboard focus), scroll (scroll up or down in a region, specified by bounding box and direction), wait (pause for 2 seconds to allow UI transitions to complete), finished (signal task completion with a description string). Each action type has specific parameter extraction logic in computer.py's parse_action() function, which uses regex patterns to find the action name and extract named parameters like start_box, end_box, key, content, and direction from the parentheses-delimited VLM output.

The return dict includes the full action history in the actions array, with each entry containing the step number (1-indexed), the VLM's reasoning text, the raw action string, the normalized action_type, and the execution status. The steps count and max_steps show how many iterations were used versus the limit. If the VLM never outputs finished() before reaching max_steps, success is false and message is "Max steps (N) reached without completion".

**Signature**:
```
uitars_execute(task: str, max_steps: int = 15) -> dict
```

**Parameters**:
- `task` (str, required): Natural language description of the GUI task to perform. Should be specific and actionable. Good: "Open Notepad and type 'hello world'". Less good: "Do something with the computer".
- `max_steps` (int, optional, default 15, minimum 1, maximum 50): Maximum number of screenshot-to-action cycles before the loop stops. Increase for complex multi-step tasks, decrease for simple single-action commands.

**Return format**:
```json
{
  "success": bool,
  "task": str,
  "steps": int,
  "max_steps": int,
  "message": str,
  "actions": [
    {
      "step": int,
      "thought": str,
      "action": str,
      "action_type": str,
      "status": str
    }
  ]
}
```

On failure before any steps execute (e.g. the VLM endpoint is unreachable), the response may have steps=0 and an error field.

**Examples**:
- `uitars_execute(task="Open Notepad and type 'hello world'")`
- `uitars_execute(task="Take a screenshot of the desktop", max_steps=3)`
- `uitars_execute(task="Open the calculator and compute 42 * 12")`

### uitars_screenshot

Capture the current desktop screenshot and return it as a base64-encoded PNG along with the screen resolution. Uses the mss library for fast screen capture — it grabs the raw BGRA pixel buffer from monitor index 0 (the primary monitor), converts it to an RGB PIL Image for PNG encoding, and returns the base64 string. This is the simplest tool and requires no parameters.

The returned image can be displayed inline by MCP clients that support image rendering, or decoded and saved to disk. Use this tool when you need to visually inspect the desktop state before deciding what actions to take. Unlike uitars_execute which captures screenshots internally, this tool returns the raw image data directly.

On failure (rare — usually caused by missing display adapter or permission issues), the tool returns success: false with an error string.

**Signature**:
```
uitars_screenshot() -> dict
```

**Parameters**: None.

**Return format**:
```json
{
  "success": true,
  "image_base64": str,
  "width": int,
  "height": int
}
```

**Examples**:
- `uitars_screenshot()`

### uitars_click

Click at specified desktop coordinates using pyautogui. Supports left-click and right-click. Coordinates are screen pixel coordinates where (0,0) is the top-left corner of the primary monitor. This is a low-level tool for precise mouse control when you already know the target coordinates.

Use this tool when you have specific coordinates from a prior screenshot analysis. For example, if uitars_screenshot returns a 1920x1080 image and you identify the Start button at approximately (20, 1060), you can call uitars_click(x=20, y=1060) to click it. The tool returns immediately after the click with no VLM involvement, making it faster than uitars_execute for known-position clicks.

The button parameter accepts "left" or "right". Right-click opens context menus. The tool dispatches to pyautogui.click() or pyautogui.rightClick() accordingly.

**Signature**:
```
uitars_click(x: int, y: int, button: str = "left") -> dict
```

**Parameters**:
- `x` (int, required): X coordinate in screen pixels from the left edge.
- `y` (int, required): Y coordinate in screen pixels from the top edge.
- `button` (str, optional, default "left"): "left" for left-click, "right" for right-click.

**Return format**:
```json
{
  "success": true,
  "x": int,
  "y": int,
  "button": str
}
```

On failure, returns `{"success": false, "error": str}`.

**Examples**:
- `uitars_click(x=500, y=300)` — left-click at center of screen
- `uitars_click(x=500, y=300, button="right")` — right-click at coordinates

### uitars_type

Type text at the current keyboard focus position using pyautogui.typewrite(). This sends individual keystrokes to whatever application currently has focus. Use this after uitars_click to focus a text field first.

Important limitations: pyautogui.typewrite() sends characters as keyboard events, so it works with most standard characters (letters, numbers, punctuation) but does not support special keys like Enter, Tab, Escape, or function keys. For those, use uitars_execute which can send hotkeys through the VLM action system. The method also does not support clipboard or system key combos directly — use uitars_execute with the hotkey action type for Ctrl combinations.

**Signature**:
```
uitars_type(text: str) -> dict
```

**Parameters**:
- `text` (str, required): The text string to type. Supports printable ASCII and Unicode characters.

**Return format**:
```json
{
  "success": true,
  "text": str
}
```

On failure, returns `{"success": false, "error": str}`.

**Examples**:
- `uitars_type(text="Hello, world!")`
- `uitars_type(text="user@example.com")`

### uitars_browser_navigate

Navigate the headless Chromium browser to a URL and return the resulting page information including a base64-encoded screenshot, the resolved URL, and the page title. The browser is managed by Playwright and runs in headless mode with a viewport of 1280x900 pixels. The browser instance is lazy-initialized on the first call and persists across subsequent browser tool calls until uitars_browser_close() is called.

The navigation waits for DOM content to load (wait_until="domcontentloaded" with a 30-second timeout) before taking the screenshot. The returned screenshot shows the page content after navigation, not the previous page. The title is extracted from the HTML title element.

If the Playwright browser was previously closed or crashed, the server auto-recovers by launching a fresh headless Chromium instance. This is handled by the get_page() function which checks page connectivity via page.evaluate("1") and calls _recover_browser() if the page is unreachable.

**Signature**:
```
uitars_browser_navigate(url: str) -> dict
```

**Parameters**:
- `url` (str, required): Full URL to navigate to. Must include the protocol (e.g., https://). Supports HTTP and HTTPS.

**Return format**:
```json
{
  "success": true,
  "url": str,
  "title": str,
  "screenshot_base64": str,
  "width": int,
  "height": int
}
```

On failure (e.g., DNS resolution failure, connection refused, SSL error), returns `{"success": false, "error": str, "url": str}`.

**Requirements**: This tool requires Playwright to be installed. Run `uv sync --extra browser` and then `playwright install chromium` before using any browser tool. The server detects Playwright availability at startup and reports it via uitars_status as browser_available.

**Examples**:
- `uitars_browser_navigate(url="https://github.com")`
- `uitars_browser_navigate(url="https://www.google.com")`

### uitars_browser_execute

Execute a multi-step task in the headless Chromium browser using visual grounding. This is the browser equivalent of uitars_execute — it captures page screenshots, sends them to the VLM with the browser-specific system prompt, parses the VLM's action response, and executes browser actions via Playwright.

The browser action loop is nearly identical to the desktop loop but uses browser-specific actions: click (click at coordinates on the page), type (type text into the focused input), scroll (scroll up or down in a page region), navigate (go to a new URL within the same browser instance), go_back (return to the previous page in history), press_key (press a keyboard key like Enter or Escape), wait (pause for 2 seconds for page loading), and finished (signal completion). The browser system prompt in browser.py tells the VLM: "You are a web browser agent. You are given a task and a screenshot of the current webpage."

The start_url parameter allows you to navigate to a specific URL before the action loop begins. If omitted, the browser stays on the current page from any previous navigation call. This is useful for continuing a session that was started with uitars_browser_navigate.

The Playwright page starts with a 1280x900 viewport. All mouse coordinates are relative to this viewport. The page screenshot is taken via page.screenshot(full_page=False), which captures only the visible viewport area.

**Signature**:
```
uitars_browser_execute(task: str, start_url: str | None = None, max_steps: int = 15) -> dict
```

**Parameters**:
- `task` (str, required): Natural language task to perform in the browser. Examples: "Search for Python on Google", "Click the first search result", "Find the pricing page".
- `start_url` (str | None, optional): Navigate to this URL first before starting the task loop. If omitted, the browser stays on whatever page it last loaded.
- `max_steps` (int, optional, default 15, range 1-50): Maximum action steps before stopping.

**Return format**:
```json
{
  "success": bool,
  "task": str,
  "steps": int,
  "max_steps": int,
  "message": str,
  "actions": [
    {
      "step": int,
      "thought": str,
      "action": str,
      "action_type": str,
      "status": str
    }
  ]
}
```

**Examples**:
- `uitars_browser_execute(task="Search for Python on Google", start_url="https://google.com")`
- `uitars_browser_execute(task="Click the first search result")`
- `uitars_browser_execute(task="Scroll down and find the pricing table", start_url="https://example.com", max_steps=10)`

### uitars_browser_close

Close the current headless Chromium browser instance and release all Playwright resources. This stops the Playwright sync API and tears down the browser process. Always call this when browser tasks are complete to avoid resource leaks — the Playwright browser retains memory and a Chromium process until explicitly closed.

The close operation is idempotent: calling it when no browser is running returns success: true with no error. It handles the internal _pw (Playwright sync API) and _browser_ctx global state correctly, setting them to None after cleanup.

**Signature**:
```
uitars_browser_close() -> dict
```

**Parameters**: None.

**Return format**:
```json
{
  "success": true
}
```

**Examples**:
- `uitars_browser_close()`

### uitars_status

Get unified health status of the server including VLM connection state, browser availability, and current configuration. The VLM health check probes the configured endpoint by calling GET /v1/models (the OpenAI-compatible models listing endpoint) with the configured API key. If the probe succeeds, the response includes the list of available model IDs from the endpoint. If it fails, the response includes the error details and the base URL that was attempted.

The browser_available field is set at startup by checking if the playwright package can be imported. It does not check if chromium is actually installed — only that the Playwright Python library is available.

The config block is generated by config.health_report() and includes the current version string, VLM endpoint and model, max steps setting, browser availability flag, and backend port. This lets you verify what the server is configured to use without restarting or checking env vars.

**Signature**:
```
uitars_status() -> dict
```

**Parameters**: None.

**Return format**:
```json
{
  "success": true,
  "vlm": {
    "ok": bool,
    "models": [str],
    "configured_model": str,
    "base_url": str,
    "error": str
  },
  "browser_available": bool,
  "config": {
    "version": str,
    "vlm_base_url": str,
    "vlm_model": str,
    "max_steps": int,
    "browser_available": bool,
    "backend_port": int
  }
}
```

**Examples**:
- `uitars_status()`

### uitars_help

Get inline help documentation for the server. Returns a comprehensive reference including the full tool listing with descriptions, parameter signatures, example calls, common usage examples, the current server configuration (VLM endpoint, model, max_steps, backend port), and links to documentation files. This is the programmatic equivalent of reading this prompt file — use it when you need to recall a tool's parameter names or return format at runtime.

The documentation response is static and generated from the server code. It does not require any VLM calls or external resources.

**Signature**:
```
uitars_help() -> dict
```

**Parameters**: None.

**Return format**:
```json
{
  "success": true,
  "tools": [{"name": str, "description": str, "parameters": str, "example": str}],
  "examples": [{"task": str, "call": str}],
  "configuration": {"vlm_base_url": str, "vlm_model": str, ...},
  "docs": [str]
}
```

**Examples**:
- `uitars_help()`

### uitars_shutdown

Shut down the uitars-mcp server process gracefully. This calls os._exit(0) which terminates the Python process immediately. All in-memory state is lost, all open network connections are closed, and any running Playwright browser instances are killed by process termination. Use this when the session is complete and the server should terminate.

This tool exists because MCP servers are typically long-lived processes started by the MCP client (Claude Desktop, Cursor, opencode). When you finish using the GUI agent, calling shutdown ensures the server does not continue running in the background consuming memory and holding the port.

The shutdown is irreversible. After calling it, the server process exits and all tools become unavailable until the server is restarted by the MCP client.

**Signature**:
```
uitars_shutdown() -> dict
```

**Parameters**: None.

**Return format**:
```json
{
  "success": true,
  "message": str
}
```

**Examples**:
- `uitars_shutdown()`

## Architecture

The server has four architectural layers. The FastMCP tool layer (server.py) registers the 10 MCP tools using @mcp.tool() decorators with Pydantic Field annotations for parameter validation. The FastAPI REST layer (app.py) provides REST equivalents of every MCP tool plus health, status, capabilities, and diagnostics endpoints, CORS middleware for Tauri and Tailscale access, and mounts the FastMCP HTTP app at /mcp. The operator layer (operators/computer.py and operators/browser.py) contains the core action loop logic: screenshot capture (mss for desktop, Playwright for browser), VLM response parsing (regex extraction of action types and parameters from Thought/Action format), and action execution (pyautogui for desktop, Playwright for browser). The VLM client layer (operators/vlm_client.py) provides the OpenAI-compatible API client that sends chat completion requests with image_url content blocks and returns the model response text, plus a health check function that probes the models endpoint.

The server also has an MCP bridge feature (server.py lines 27-36): if the MCP_BRIDGE_URLS environment variable is set, it creates proxy providers for each URL, enabling multi-server federation where uitars-mcp can delegate tool calls to other MCP servers.

## Configuration

### Environment Variables

All configuration is via environment variables. No config file is needed.

| Variable | Default | Description |
|----------|---------|-------------|
| UITARS_VLM_BASE_URL | http://127.0.0.1:11434/v1 | Base URL for the OpenAI-compatible VLM API. Must support /v1/chat/completions with image_url content blocks. |
| UITARS_VLM_MODEL | qwen2.5-vl:7b | Model name to use for visual grounding. Must be a vision-language model available at the VLM endpoint. |
| UITARS_VLM_API_KEY | ollama | API key for the VLM endpoint. Ollama accepts any value; real providers require the actual key. |
| UITARS_MAX_STEPS | 15 | Default maximum action steps per task. Overridable per-call via the max_steps parameter. |
| UITARS_PORT | 10976 | Backend port for the combined FastAPI + MCP HTTP server. |
| UITARS_FRONTEND_PORT | 10977 | Vite dev server port (optional, development only). |
| UITARS_HOST | 127.0.0.1 | Listen address for the server. |
| UITARS_LOG_LEVEL | info | Logging level: debug, info, warning, error. |

### VLM Provider Setup

The VLM client is provider-agnostic. Any endpoint that speaks the OpenAI-compatible /v1/chat/completions protocol with image_url content blocks works without code changes.

Ollama (local, free): ollama pull qwen2.5-vl:7b, then set UITARS_VLM_BASE_URL=http://127.0.0.1:11434/v1 and UITARS_VLM_MODEL=qwen2.5-vl:7b. Ollama accepts any string as the API key, so the default "ollama" key works.

OpenAI GPT-4o: set UITARS_VLM_BASE_URL=https://api.openai.com/v1, UITARS_VLM_MODEL=gpt-4o, and UITARS_VLM_API_KEY=sk-... (your OpenAI API key). GPT-4o provides the best visual grounding accuracy but incurs per-request costs including image tokens.

LiteLLM proxy (for Anthropic Claude, Google Gemini, etc.): run LiteLLM as a proxy server on port 4000, set UITARS_VLM_BASE_URL=http://127.0.0.1:4000/v1, UITARS_VLM_MODEL to the provider's model name (e.g., claude-3-5-sonnet-20241022), and the appropriate API key.

### VLM Action Protocol

The VLM must respond to each screenshot with exactly:

Thought: <step-by-step reasoning about the current screen state and what to do next>
Action: <one of the supported actions>

Desktop actions: click(start_box='(x1,y1),(x2,y2)'), double_click(start_box='...'), right_click(start_box='...'), drag(start_box='...', end_box='...'), hotkey(key='ctrl c'), type(content='text'), scroll(start_box='...', direction='up|down'), wait(), finished(content='done').

Browser actions: click(start_box='(x1,y1),(x2,y2)'), type(content='text'), scroll(start_box='...', direction='up|down'), navigate(url='https://...'), go_back(), press_key(key='Enter'), wait(), finished(content='done').

The VLM system prompt is defined in vlm_client.py for desktop and browser.py for browser. Both include the full action schema, the Thought/Action format requirement, and an instruction to output exactly one action per turn.

## REST API

The server exposes REST endpoints alongside the MCP HTTP transport. All endpoints are at http://127.0.0.1:10976.

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/health | GET | Health check -- returns server name, version, tool count |
| /api/status | GET | VLM health + browser availability |
| /api/capabilities | GET | Tool surface and features listing |
| /api/screenshot | GET | Capture desktop screenshot (same as uitars_screenshot()) |
| /api/execute | POST | Execute desktop task (same as uitars_execute()). Body: {"task": "...", "max_steps": 15} |
| /api/browser/navigate | POST | Navigate browser to URL. Body: {"url": "..."} |
| /api/browser/execute | POST | Execute browser task. Body: {"task": "...", "start_url": null, "max_steps": 15} |
| /api/browser/close | POST | Close browser instance |
| /api/v1/diagnostics | GET | Diagnostics -- tool list, system info, VLM health |
| /api/shutdown | POST | Shut down the server |
| /mcp | POST | FastMCP HTTP transport endpoint |

## Safety Notes

1. FAILSAFE: pyautogui FAILSAFE = True -- moving the mouse to any screen corner immediately aborts the current action. This is the primary safety mechanism. Always keep it enabled.

2. No automated booking/email/banking: Do not use this server for tasks involving financial transactions, booking systems, email composition, or banking. The VLM may misinterpret visual elements.

3. No irreversible destructive actions: The tool can click, type, and drag on the real desktop. It can delete files, close unsaved documents, or trigger destructive operations if instructed. Always supervise automated tasks.

4. Browser isolation: Headless Chromium runs in isolation from the user's regular browser. It has no access to saved passwords, cookies, or sessions from the user's default browser profile.

5. Screen capture: Screenshots are sent to the configured VLM endpoint. If using a cloud VLM provider (OpenAI, Anthropic), screenshots are transmitted over the network. Ensure the VLM endpoint is trusted.

6. Rate limiting: Each action step makes one VLM API call. With a local model (Ollama), this is free but may be slow. With cloud APIs, each step incurs cost based on the image token count.

7. max_steps is your friend: Always set a reasonable max_steps limit. A stuck action loop can run indefinitely. Default 15 steps is usually sufficient for simple tasks.

8. Shutdown discipline: Call uitars_shutdown() when the session is complete to terminate the server process and release all resources (Playwright browser, pyautogui hooks, etc.).

## CORS Configuration

The server includes CORS middleware allowing localhost origins, Tauri origins (tauri://localhost), Tailscale domains (*.ts.net), LAN IP ranges (192.168.x.x, 10.x.x.x), and Tailscale CGNAT (100.x.x.x). See src/uitars_mcp/app.py for the full CORS configuration with allow_origins list and allow_origin_regex pattern.

## Webapp

The server serves a React webapp at the root URL (http://127.0.0.1:10976). The webapp uses a vanilla React 18 stack with a zero-dependency hash router, styled with the Iron Shell layout (sidebar + topbar + main view). Pages include a Dashboard with live status, a Desktop Page for screenshot capture and task execution, a Browser Page for navigation and browser tasks, a Demo page for trying tools interactively, and a Help page showing the tool reference. The webapp is pre-built and committed to dist/ -- no Node.js or npm is required at runtime.

## Multi-Server Federation

The server supports MCP bridge proxying via the MCP_BRIDGE_URLS environment variable. Set it to a comma-separated list of MCP HTTP endpoint URLs to make those servers' tools available through uitars-mcp. This enables multi-server federation where the GUI agent can call tools on other MCP servers as if they were local. The bridge is implemented using FastMCP's create_proxy() function.
