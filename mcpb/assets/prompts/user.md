# UI-TARS MCP — User Guide

## Introduction

UI-TARS MCP turns natural language into desktop and browser actions. Instead of describing pixel coordinates or writing AutoHotkey scripts, you tell the agent what you want -- "open Notepad and write a shopping list" -- and the server uses a vision-language model to figure out the steps, one screenshot at a time. Each step follows a tight loop: take a screenshot of the current desktop or browser page, send it to the VLM alongside the task description and conversation history, parse the VLM's Thought/Action response, execute the action via pyautogui or Playwright, and repeat until the task is complete.

This guide walks through everything from installation to advanced workflows, with concrete tutorials for every tool. The tutorials are designed to be followed in order -- each builds on concepts from the previous one. Start with Tutorial 1 for the simplest operation (screenshot), then progress through desktop automation (Tutorials 2 and 5-7), browser automation (Tutorials 3 and 8), system operations (Tutorials 4 and 9-11), and finally advanced multi-stage workflows (Tutorial 12).

The server runs on port 10976 and exposes all 10 tools via both FastMCP HTTP transport (POST /mcp with JSON-RPC 2.0 messages) and REST API endpoints (GET/POST on /api/*). You can use either interface interchangeably -- the REST endpoints are documented in each tutorial for curl/HTTP client access.

## Installation

### Prerequisites

- Python 3.12+ and uv (Astral's Python package manager) for dependency management
- Ollama or any OpenAI-compatible VLM provider for visual grounding of screenshots
- Windows (primary target; macOS and Linux are supported for desktop operations but browser automation works on all platforms via Playwright)

### Step 1: Clone and install dependencies

Clone the repository and install the core dependencies with uv. The core install covers desktop automation tools (mss for screenshot capture, pyautogui for mouse and keyboard control, httpx for VLM API calls) but does not include Playwright (browser automation) by default.

git clone https://github.com/sandraschi/uitars-mcp.git
cd uitars-mcp
uv sync

### Step 2: Pull a vision-language model

The server needs a VLM that can accept image inputs and output structured action responses. Ollama provides free local inference with vision models. Pull qwen2.5-vl:7b, a 7-billion-parameter vision-language model that runs well on consumer GPUs and provides good accuracy for UI element identification.

ollama pull qwen2.5-vl:7b

The default configuration points to Ollama at http://127.0.0.1:11434/v1 with model qwen2.5-vl:7b and API key "ollama". If your VLM endpoint is different, set UITARS_VLM_BASE_URL, UITARS_VLM_MODEL, and UITARS_VLM_API_KEY before starting the server. No configuration file is needed.

### Step 3: Start the server

Start the server with the --serve flag, which launches uvicorn on the configured host and port (default 127.0.0.1:10976). The server binds a single process that serves both the FastAPI REST API and the FastMCP HTTP transport.

uv run uitars-mcp --serve

You should see output like:
UI-TARS MCP server starting (v0.2.0)
Uvicorn running on http://127.0.0.1:10976

The server is now ready to accept MCP and REST requests. It loads the VLM configuration at startup and probes the VLM endpoint to validate connectivity. Any warnings (e.g., VLM unreachable, browser unavailable) are printed to the console during startup.

### Step 4: Install browser automation (optional but recommended)

For browser tools (uitars_browser_navigate, uitars_browser_execute, uitars_browser_close), install the optional browser extras and download Chromium for Playwright:

uv sync --extra browser
playwright install chromium

After installation, restart the server. The uitars_status tool will report browser_available: true. Without this step, browser tools will return errors when called.

### Step 5: Verify the server is working

Call the health endpoint to confirm everything is running:

curl http://127.0.0.1:10976/api/health

Expected response:
{"status": "ok", "version": "0.2.0", "server": "uitars-mcp", "tool_count": 9, "uptime_seconds": 0}

### Connecting from Claude Desktop or opencode

Add this to your MCP client configuration. For Claude Desktop, add a new mcpServers entry. For opencode, add it to your opencode.json or opencode.jsonc configuration file under the mcp section. The transport is HTTP (not stdio), so point the client at the server's HTTP address with the /mcp path.

## Tutorial 1: Check Your Desktop

Goal: Take a screenshot of your current desktop to see what's on screen. This is the simplest operation -- a single stateless call that returns the current screen state encoded as a base64 PNG.

### Using the MCP tool

result = uitars_screenshot()

### What you get back

The response includes success, a base64-encoded PNG string of the full desktop (typically several hundred kilobytes of base64 text), and the screen resolution in pixels. The image_base64 field can be decoded and displayed inline by MCP clients that support image rendering, or saved to disk for analysis.

{"success": true, "image_base64": "iVBORw0KGgo...", "width": 1920, "height": 1080}

### What happens behind the scenes

The server calls mss.mss().grab(monitor[0]) to capture the primary monitor's raw pixel buffer. mss is a fast cross-platform screen capture library that works with the X11, Windows DWM, and macOS Core Graphics APIs. The raw BGRA pixels are converted to an RGB PIL Image, encoded as PNG using PIL's save() method with default compression, and then base64-encoded. Width and height reflect the actual monitor resolution from the monitor object.

### When to use this

Diagnostics: "Is the application I started visible?" Use uitars_screenshot to check if a window appeared after automation. Planning: "Take a screenshot so I can figure out where to click." Analyze the image to find target coordinates before calling uitars_click. Verification: "Did the download dialog appear?" Confirm visual state after executing a task.

### REST API equivalent

curl http://127.0.0.1:10976/api/screenshot

### Error handling

If the screenshot fails (rare -- mss usually works unless no display is attached), the tool returns success: false with an error string. Possible causes include headless server mode (no display adapter), macOS screen recording permission not granted (requires accessibility permissions), or an inaccessible monitor index.

## Tutorial 2: Open Notepad and Write a Note

Goal: Use natural language to launch Notepad, type a message, and confirm the text was typed correctly. This is the core desktop automation workflow that demonstrates the full action loop.

The task uses uitars_execute, which runs the screenshot-VLM-action loop. You provide a natural language task description, and the VLM figures out the step sequence from the screenshots it receives.

### The command

uitars_execute(task="Open Notepad and type 'hello world'", max_steps=15)

### What the VLM does internally (step by step)

The VLM receives a screenshot of your current desktop. Its system prompt tells it: "You are a GUI agent. You are given a task and a screenshot of the desktop. You must output exactly one action per turn to complete the task." Available actions include click, double_click, right_click, drag, hotkey, type, scroll, wait, and finished.

Turn 1: The VLM sees your desktop with the Start button. Its reasoning: "I need to open Notepad. The Start button is at the bottom-left of the screen." It outputs: click(start_box='(10,1050),(60,1080)'). The server parses this, computes the center of the bounding box as (35, 1065), and calls pyautogui.click(35, 1065).

Turn 2: Screenshot shows the Start menu open. The VLM reasons: "The Start menu is open. I need to type 'Notepad' to search for the app." It outputs: type(content='Notepad'). The server calls pyautogui.typewrite('Notepad').

Turn 3: Screenshot shows search results with Notepad highlighted as the best match. The VLM reasons: "Notepad is listed as the top result. I need to click the Notepad launch button." It outputs: click(start_box='(100,400),(600,440)'). The server clicks at (350, 420).

Turn 4: Screenshot shows a blank Notepad document. The VLM reasons: "Notepad is now open with a blank document. I need to type 'hello world'." It outputs: type(content='hello world'). The server types the text.

Turn 5: Screenshot shows "hello world" in Notepad. The VLM reasons: "The text is visible. The task is complete." It outputs: finished(content='Opened Notepad and typed hello world'). The loop stops.

### The result

The full response includes success: true, the original task string, steps count (5), max_steps (15), a human-readable message, and the complete actions array with every step's thought, action string, action type, and execution status. The actions array is useful for debugging -- you can inspect each step to see exactly what the VLM thought and what pyautogui executed.

### Tips for reliable desktop automation

Start with a clean desktop. Close distracting windows and popups. The VLM works better with fewer visual distractions and predictable icon positions.

Be specific in your task description. "Open Notepad" works because Notepad is a standard Windows app with a deterministic Start menu entry. "Open the word processor" may fail because the VLM does not know which word processor you mean.

Use the right max_steps. Simple tasks like open-and-type take 3-8 steps. Complex multi-app workflows may need 20-30. If you set max_steps too low, the task may terminate early with success: false. If you set it too high, you waste time and VLM API calls waiting for the loop to exhaust.

Chain failures productively. If a task fails, check the last entry in the actions array. The last action_type and status usually show what went wrong. You can then issue a follow-up command to recover, such as uitars_execute(task="Press Escape to dismiss the dialog", max_steps=3).

### What can go wrong

| Problem | Symptom | Fix |
|---------|---------|-----|
| VLM misidentifies a button | Wrong element clicked | Try a more specific task: "click the blue button at the top right" instead of "click Submit" |
| Start menu takes long | Steps timeout before task completes | Increase max_steps or disable Windows animations (System > Advanced > Performance) |
| Popup interrupts workflow | VLM clicks the popup | Dismiss popups first with a separate uitars_execute("Press Escape") |
| Application not found | VLM searches fruitlessly | Verify the app is installed. Use a full path: "Open C:/Program Files/App/app.exe" |

## Tutorial 3: Search GitHub for MCP Servers

Goal: Open a headless browser, navigate to GitHub, search for "mcp server", and extract the resulting page state. This demonstrates the browser automation workflow combining uitars_browser_navigate and uitars_browser_execute.

### Step 1: Navigate to GitHub

result = uitars_browser_navigate(url="https://github.com")

The response includes the resolved URL, the page title, a base64 PNG of the rendered viewport (1280x900 pixels), and the viewport dimensions. The title tells you the page loaded correctly.

{"success": true, "url": "https://github.com/", "title": "GitHub: Let's build from here", "screenshot_base64": "...", "width": 1280, "height": 900}

### Step 2: Search using the VLM

Now that the browser is on GitHub, use uitars_browser_execute to interact with the page. Since we navigated in step 1, we do not need a start_url -- the browser is already on github.com.

uitars_browser_execute(task="Type 'mcp server' in the search box and press Enter", max_steps=8)

The VLM browser agent follows the same pattern as the desktop agent: screenshot the page, think about what to do, output an action. The VLM sees the GitHub search box at the top center of the page. In turn 1, it clicks the search input to focus it. In turn 2, it types "mcp server". In turn 3, it presses Enter. In turn 4, it waits for the results page to load. In turn 5, it confirms results are visible and finishes.

### Step 3: Continue interacting with the results

You can chain more browser tasks:

uitars_browser_execute(task="Click the first search result link", max_steps=5)

This clicks the first GitHub repository link in the search results. The browser is still on the same session, so cookies, DOM state, and navigation history are preserved.

### Step 4: Take a browser screenshot

To capture the current browser page state without navigating:

result = uitars_browser_navigate(url="https://github.com/search?q=mcp+server")

This reloads the page at the specified URL and returns a fresh screenshot. Note that uitars_screenshot() captures the desktop, not the browser -- always use uitars_browser_navigate or check the screenshot from uitars_browser_execute actions to see browser content.

### Step 5: Clean up

uitars_browser_close()

Always close the browser when done. The Playwright browser retains a Chromium process in memory until explicitly closed. If you do not close it, the process stays alive until the server shuts down.

### Combining desktop and browser workflows

A powerful pattern is to use desktop automation to control the browser window (e.g., opening Chrome maximized), then switch to headless browser automation for the actual web interaction. The desktop and browser are independent -- each has its own VLM call path and state.

## Tutorial 4: Check System Health

Goal: Verify the server is running, the VLM is reachable, and browser tools are available. This is the diagnostic entry point for any session.

### Call uitars_status

status = uitars_status()

### Typical healthy response

A healthy server shows vlm.ok as true with a list of models available at the VLM endpoint, the configured model in use, browser_available as true (if Playwright is installed), and the full configuration including version, VLM settings, max steps, and backend port.

### Common unhealthy states

VLM not reachable (connection refused): vlm.ok is false and vlm.error contains "ConnectError: connection refused". This means Ollama is not running or the base URL is wrong. Fix: start Ollama with ollama serve, or check UITARS_VLM_BASE_URL.

Browser not available: browser_available is false in both the top-level field and the config block. This means Playwright is not installed. Fix: uv sync --extra browser && playwright install chromium.

VLM authentication failure: vlm.ok is false with error "401 Unauthorized". The API key is wrong. Fix: check UITARS_VLM_API_KEY.

### Automated health check pattern

status = uitars_status()
vlm = status.get("vlm", {})
if not vlm.get("ok"):
    error = vlm.get("error", "unknown error")
    print(f"VLM unreachable at {vlm.get('base_url')}: {error}")
elif not status.get("browser_available"):
    print("Server OK. Browser tools need Playwright.")
else:
    print(f"Ready. Model: {vlm.get('configured_model')}, Port: {status['config']['backend_port']}")

## Tutorial 5: Desktop Click Precision

Goal: Click precise screen coordinates for known UI positions without VLM overhead. This is the fastest way to interact with a known UI element.

### Using uitars_click

uitars_click(x=20, y=1060) clicks the Windows Start button on a 1920x1080 display with the taskbar at the bottom. uitars_click(x=500, y=400, button="right") right-clicks at the center-left of the screen to open a context menu. Unlike uitars_execute, uitars_click is instantaneous -- it makes no VLM call, so there is no latency or cost.

### Finding coordinates

The easiest way to find coordinates is to take a screenshot first: screenshot = uitars_screenshot(). The width and height tell you your screen resolution. Use the base64 image to identify pixel locations of interest. Common patterns: Start button at approximately (20, screen_height - 20), system tray at approximately (screen_width - 70, screen_height - 20), screen center at (width / 2, height / 2).

### When NOT to use uitars_click

If you do not know the exact coordinates, use uitars_execute instead. uitars_click with wrong coordinates will click empty space or the wrong element. The VLM loop in uitars_execute handles element identification from screenshots, which is more flexible for unknown layouts.

## Tutorial 6: Composing Type and Click

Goal: Combine uitars_click and uitars_type to fill a form field with text. This is a two-step pattern that is faster than uitars_execute when you know the field coordinates.

### The two-step pattern

First, click the target field to give it keyboard focus:
uitars_click(x=400, y=500)

Second, type into the now-focused field:
uitars_type(text="user@example.com")

### Best practices for reliable typing

Always click first. The current keyboard focus determines where typewrite sends text. If you skip the click, text may go to a different application or nowhere. Some applications take a moment to show the cursor after a click. If text goes missing, use uitars_execute instead -- it handles the timing internally. uitars_type cannot send special keys like Enter, Tab, or Escape. For multi-line input or form submission, use uitars_execute.

## Tutorial 7: Maximizing the Action Loop

Goal: Understand how max_steps affects task completion and tune it for different task types.

### Default behavior

With max_steps=15, the action loop runs up to 15 screenshot-VLM-execute cycles. Each cycle costs one VLM API call. Most simple tasks complete in 3-8 steps. Complex tasks may need more.

### When to increase max_steps

Single click: 1 step, max_steps=3. Open app plus type: 3-8 steps, max_steps=15. Multi-app workflow: 10-25 steps, max_steps=30. Complex installation wizard or multi-page form: 20-50 steps, max_steps=50.

### When to decrease max_steps

For quick verification or single-action commands: uitars_execute(task="Click the OK button", max_steps=3). This saves time and VLM API calls if the action does not trigger -- you see the failure after 3 steps instead of waiting for 15.

## Tutorial 8: Browser Navigation Chain

Goal: Navigate through multiple pages, extract information, and clean up properly. This demonstrates the full browser lifecycle.

### The full workflow

Start by navigating to a news aggregator: result = uitars_browser_navigate(url="https://news.ycombinator.com"). Print the page title to confirm it loaded. Then find and interact with content using uitars_browser_execute: story_info = uitars_browser_execute(task="Find the top story and click it to open comments", max_steps=8). Navigate back using the VLM: uitars_browser_execute(task="Go back to the main page", max_steps=4). Navigate to a different site: uitars_browser_navigate(url="https://arxiv.org"). Search within it: uitars_browser_execute(task="Search for 'language models' and show me the first result", max_steps=10). Finally clean up: uitars_browser_close().

### Browser state lifecycle

The browser is lazy-initialized: created on the first uitars_browser_navigate or uitars_browser_execute call. It persists across calls -- navigating to a new URL after executing a task reuses the same browser instance with its DOM and storage. It auto-recovers from crashes: if the Playwright page disconnects, the server launches a fresh headless Chromium via _recover_browser(). It must be closed with uitars_browser_close() when done to free resources. The browser cannot be reopened after close -- a new call to uitars_browser_navigate creates a fresh instance.

## Tutorial 9: Shutdown and Cleanup

Goal: Properly terminate the server session to free system resources.

uitars_shutdown()

The response confirms with success: true and message: "Server shutting down". The server process exits immediately via os._exit(0). Any open Playwright browser instances are killed by process termination. Any unsaved work in desktop applications is NOT affected -- only the server process terminates.

### When to call shutdown

At the end of a session: you have finished all GUI automation tasks. After a configuration change: you need to restart the server with different env vars. For resource cleanup: the browser instance is consuming memory and uitars_browser_close is insufficient. For error recovery: the VLM is stuck, the action loop is cycling without progress, or pyautogui has crashed.

### Alternative: REST API shutdown

curl -X POST http://127.0.0.1:10976/api/shutdown

### What happens if you do NOT call shutdown

The server continues running in the background, holding port 10976 and maintaining the Playwright browser process. If your MCP client manages the server lifecycle (Claude Desktop starts and stops servers), the process will be terminated when you close the client. If running standalone, the process persists indefinitely.

## Tutorial 10: Getting Help at Runtime

Goal: Use uitars_help to discover tool signatures and configuration without leaving the session.

help_info = uitars_help()

The response includes the full tool listing with each tool's name, description, parameter signature, and an example call. It also includes common usage examples (take screenshot, click Start button, fill form field), the current server configuration (VLM endpoint, model, max_steps, backend port), and a list of documentation file references.

Use this at the start of a session to confirm tool names and parameter types. It does not require any VLM calls.

## Tutorial 11: Advanced Error Recovery

Goal: Recover from common failures in the action loop without restarting the server.

### Pattern 1: Dismiss popups

If a popup dialog interrupts a workflow, the VLM may waste steps trying to work around it. Interrupt with a focused dismiss:

uitars_execute(task="Press Escape to dismiss the open dialog", max_steps=3)

### Pattern 2: Check state before retrying

Before retrying a failed task, check the desktop state:

screenshot = uitars_screenshot()

If the screenshot shows a dialog that was not there before, dismiss it. If it shows a blank desktop, the application may have crashed.

### Pattern 3: Use short max_steps for probing

Use a low max_steps to probe a UI element without committing to a full workflow:

uitars_execute(task="Check if the 'Save' dialog is visible", max_steps=3)

The task will either finish (if it finds the dialog) or exhaust 3 steps and report the failure.

### Pattern 4: Browser recovery

If the browser crashes or becomes unresponsive, the server's auto-recovery should handle it. If it does not, close and reopen:

uitars_browser_close()
uitars_browser_navigate(url="https://github.com")

### Pattern 5: Full server restart

If the VLM is stuck or the server state is corrupted:

uitars_shutdown()

Then restart the server process.

## Tutorial 12: Hybrid Desktop-Browser Workflow

Goal: Use desktop tools to prepare the local environment, switch to browser for web tasks, then return to desktop for local file operations. This demonstrates the full power of combining the two automation domains.

### Real-world example: Research workflow

Phase 1 (Desktop): Open a local text file for note-taking:
uitars_execute(task="Open Notepad, maximize the window, and position it on the left half of the screen", max_steps=12)

Phase 2 (Browser): Navigate to a research paper repository:
uitars_browser_navigate(url="https://arxiv.org")

Phase 3 (Browser): Search for and open a paper:
uitars_browser_execute(task="Search for 'large language models' and open the most recent paper", max_steps=10)

Phase 4 (Desktop): Switch back to the notepad window and take notes. The VLM sees the desktop including both the Notepad window and the browser (which is in the same monitor or on a different one -- screenshots show the full desktop):
uitars_execute(task="Type 'Key findings from the arXiv paper:' then Alt+Tab back to the browser", max_steps=8)

Phase 5 (Browser): Extract more information from the paper:
uitars_browser_execute(task="Scroll down to the abstract and read the key results", max_steps=8)

Phase 6 (Desktop): Switch back to Notepad and append notes:
uitars_execute(task="Alt+Tab back to Notepad, type the key results under the heading", max_steps=10)

Phase 7: Clean up:
uitars_browser_close()
uitars_shutdown()

### Important architectural note

The desktop and browser action loops share the same VLM endpoint but have entirely separate state. The desktop VLM agent knows nothing about the browser page content, and the browser VLM agent knows nothing about the desktop state. Each operates on its own screenshot stream. Switching between them is a conscious act -- you explicitly call uitars_execute for desktop actions and uitars_browser_execute for browser actions. The desktop screenshot shows everything on screen including the browser window if it is visible, but the VLM action parser uses different action sets for each domain.

## Troubleshooting

### VLM connectivity

Connection refused: Ollama not running. Run ollama serve in a terminal. 404 Not Found: Wrong base URL. Ensure UITARS_VLM_BASE_URL ends with /v1. Model not found: Wrong model name. Run ollama list to see available models and verify the name. 401 Unauthorized: Bad API key. This is common with cloud providers but not Ollama (which accepts any key).

### Desktop automation

Cursor moves but nothing clicks: The application is not at the expected coordinates. Ensure the target window is visible and not minimized. Text typed in wrong field: Focus was not set. Click the field first or use uitars_execute which handles focus via the VLM. pyautogui fails silently on remote desktops: RDP sessions on Windows may not expose the display properly. Run the server on the local machine. Action loop never finishes: The VLM keeps taking actions without outputting finished(). Try a more constrained task description or increase max_steps.

### Browser automation

Playwright not installed: Run uv sync --extra browser && playwright install chromium. Browser never loads: The URL may require authentication or be unreachable. Check the network connection. Page returns blank: JavaScript-heavy SPAs may not render fully in headless mode. Try adding more steps or specifying wait longer. Browser crashes on startup: Playwright version mismatch with the installed Chromium. Run playwright install --force chromium to re-download.

### Server issues

Port 10976 in use: Another instance is running. Kill it with taskkill /F /PID <pid> after finding the process with Get-NetTCPConnection -LocalPort 10976. Permission denied on macOS: Grant screen recording permission in System Settings > Privacy > Screen Recording. The server shut itself down: Someone called uitars_shutdown(). Restart the server process.

## FAQ

Q: What VLM models work best with this server? A: Qwen2.5-VL 7B (local via Ollama, good accuracy, free), GPT-4o (cloud via OpenAI, excellent accuracy but costs per image token), Claude 3.5 Sonnet (via LiteLLM proxy, excellent for complex UI understanding). The model must support image_url content blocks in chat completions and be able to output structured Thought/Action responses reliably.

Q: Can I use a non-OpenAI-compatible provider like Anthropic directly? A: No, the VLM client speaks the OpenAI-compatible protocol. Use LiteLLM as a proxy -- run it locally on port 4000, set UITARS_VLM_BASE_URL=http://127.0.0.1:4000/v1, and set the model to your provider's model name. LiteLLM translates between protocols.

Q: Does this work with multiple monitors? A: Yes. mss captures all monitors. The primary monitor (monitor[0]) is used for screenshot capture.

Q: Can I run this headless without a physical display? A: Desktop automation (pyautogui) requires a display -- it sends real mouse and keyboard events. Browser automation (Playwright headless) does not need a display and works on headless servers.

Q: How much does each VLM call cost? A: With a local model (Ollama, Qwen2.5-VL), it is free. With GPT-4o, each image costs approximately 0.01 USD (varies by image resolution). A typical 15-step task costs about 0.15 USD.

Q: How do I stop a runaway action loop? A: Move the mouse to any screen corner. pyautogui FAILSAFE is enabled, which raises an exception and stops the current action. Future tool calls will work normally.

Q: Can I control a remote desktop with this? A: Not directly. pyautogui and mss operate on the local display. To control a remote machine, run the server on the remote machine and connect via the MCP client.

Q: Does the server log its activity? A: Yes. Set UITARS_LOG_LEVEL=debug for verbose logging of VLM requests, responses, parsed actions, and execution results. The default level is info.
