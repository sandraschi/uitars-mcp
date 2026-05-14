# Browser Operator

uitars-mcp can control a headless Chromium browser via Playwright. The browser operator captures page screenshots, sends them to the VLM, and executes click/type/scroll/navigate actions.

## Requirements

```powershell
uv sync --extra browser
uv run playwright install chromium
```

This adds `playwright>=1.48` and downloads a Chromium binary (~150 MB).

## How it works

Same screenshot → VLM → action loop as the desktop operator, but actions execute on the Playwright page instead of the desktop:

```
page.screenshot() → VLM → page.mouse.click(x,y) | page.keyboard.type(text) | page.goto(url)
```

## Browser Actions

| Action | Playwright API | Example |
|--------|---------------|---------|
| `click` | `page.mouse.click(x, y)` | Click a button |
| `type` | `page.keyboard.type(text)` | Fill a form field |
| `scroll` | `page.mouse.wheel(0, delta)` | Scroll down/up |
| `navigate` | `page.goto(url)` | Go to a new page |
| `go_back` | `page.go_back()` | Previous page |
| `press_key` | `page.keyboard.press(key)` | Press Enter, Tab, etc. |
| `wait` | `page.wait_for_timeout(2000)` | Wait for page load |

## MCP Tools

### `uitars_browser_navigate`

Navigate to a URL and return page screenshot + info.

```python
uitars_browser_navigate(url="https://github.com/bytedance/UI-TARS")
```

Returns: `{success, url, title, screenshot_base64, width, height}`

### `uitars_browser_execute`

Execute a task in the browser via VLM grounding.

```python
uitars_browser_execute(
    task="Search for 'Python' and click the first result",
    start_url="https://google.com"
)
```

Returns: `{success, task, steps, message, actions[...]}`

### `uitars_browser_close`

Close the browser and free Playwright resources.

```python
uitars_browser_close()
```

## REST API

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/browser/navigate` | POST | `{url}` | Navigate to URL, return page info + screenshot |
| `/api/browser/execute` | POST | `{task, start_url?, max_steps?}` | Execute browser task |
| `/api/browser/close` | POST | — | Close browser |

## Headless vs Headful

Default: **headless** (no visible window). Good for CI and background automation.

For debugging, launch headful:
```python
from uitars_mcp.operators.browser import launch_browser
launch_browser(headless=False)
```

## Limitations

- Single page at a time — no multi-tab support
- Screenshot is viewport only, not full-page scroll
- No file downloads or uploads
- No cookie/localStorage persistence between sessions
- Playwright adds ~150 MB for Chromium binary
