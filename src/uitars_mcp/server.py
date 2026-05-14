"""FastMCP server — registers uitars-mcp tools."""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.middleware.logging import LoggingMiddleware
from pydantic import Field

from . import __version__
from .config import config
from .operators.browser import close_browser, navigate_to, run_browser_task
from .operators.computer import capture_screenshot, run_task

mcp = FastMCP(
    name="uitars-mcp",
    version=__version__,
)

mcp.add_middleware(LoggingMiddleware())


@mcp.tool(name="uitars_execute", annotations={"readOnlyHint": False})
async def uitars_execute(
    task: Annotated[
        str,
        Field(description="Natural language description of the GUI task to perform."),
    ],
    max_steps: Annotated[
        int,
        Field(description="Maximum number of action steps before stopping.", ge=1, le=50),
    ] = 15,
) -> dict:
    """Execute a GUI task on the desktop using visual grounding.

    Captures screenshots, sends them to a vision-language model, parses the
    action response, executes mouse/keyboard actions, and loops until the
    task is complete or max_steps is reached.

    ## Return Format
    {"success": bool, "task": str, "steps": int, "message": str,
     "actions": [{"step": int, "thought": str, "action": str,
                  "action_type": str, "status": str}, ...]}

    ## Examples
    - uitars_execute(task="Open Notepad and type 'hello world'")
    - uitars_execute(task="Take a screenshot of the desktop", max_steps=3)
    """
    from .config import config

    original_max = config.max_steps
    config.max_steps = max_steps
    try:
        result = await run_task(task)
    finally:
        config.max_steps = original_max
    return result


@mcp.tool(name="uitars_screenshot", annotations={"readOnlyHint": True})
async def uitars_screenshot() -> dict:
    """Capture the current desktop screenshot.

    Returns a base64-encoded PNG of the full desktop, plus resolution.

    ## Return Format
    {"success": true, "image_base64": str, "width": int, "height": int}

    ## Examples
    - uitars_screenshot()
    """
    try:
        b64, width, height = capture_screenshot()
        return {
            "success": True,
            "image_base64": b64,
            "width": width,
            "height": height,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@mcp.tool(name="uitars_click", annotations={"readOnlyHint": False})
async def uitars_click(
    x: Annotated[int, Field(description="X coordinate to click.")],
    y: Annotated[int, Field(description="Y coordinate to click.")],
    button: Annotated[
        str,
        Field(description="Mouse button: 'left' or 'right'.", default="left"),
    ] = "left",
) -> dict:
    """Click at specified desktop coordinates.

    ## Return Format
    {"success": true, "x": int, "y": int, "button": str}

    ## Examples
    - uitars_click(x=500, y=300)
    - uitars_click(x=500, y=300, button="right")
    """
    import pyautogui

    try:
        if button == "right":
            pyautogui.rightClick(x, y)
        else:
            pyautogui.click(x, y)
        return {"success": True, "x": x, "y": y, "button": button}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@mcp.tool(name="uitars_type", annotations={"readOnlyHint": False})
async def uitars_type(
    text: Annotated[str, Field(description="Text to type at the current cursor position.")],
) -> dict:
    """Type text at the current keyboard focus.

    ## Return Format
    {"success": true, "text": str}

    ## Examples
    - uitars_type(text="Hello, world!")
    """
    import pyautogui

    try:
        pyautogui.typewrite(text)
        return {"success": True, "text": text}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@mcp.tool(name="uitars_browser_navigate", annotations={"readOnlyHint": False})
async def uitars_browser_navigate(
    url: Annotated[str, Field(description="URL to navigate to.")],
) -> dict:
    """Navigate browser to a URL and return page screenshot + info.

    Launches headless Chromium via Playwright. Requires `uv sync --extra browser`.

    ## Return Format
    {"success": true, "url": str, "title": str, "screenshot_base64": str,
     "width": int, "height": int}

    ## Examples
    - uitars_browser_navigate(url="https://github.com")
    """
    result = await navigate_to(url)
    return result


@mcp.tool(name="uitars_browser_execute", annotations={"readOnlyHint": False})
async def uitars_browser_execute(
    task: Annotated[
        str,
        Field(description="Natural language task to perform in the browser."),
    ],
    start_url: Annotated[
        str | None,
        Field(description="Optional: navigate to this URL first before starting."),
    ] = None,
    max_steps: Annotated[
        int,
        Field(description="Maximum action steps before stopping.", ge=1, le=50),
    ] = 15,
) -> dict:
    """Execute a task in the browser via visual grounding.

    Launches headless Chromium via Playwright, captures page screenshots,
    feeds them to the VLM, and executes click/type/scroll actions.
    Requires `uv sync --extra browser`.

    ## Return Format
    {"success": bool, "task": str, "steps": int, "message": str,
     "actions": [{"step": int, "thought": str, "action": str,
                  "action_type": str, "status": str}, ...]}

    ## Examples
    - uitars_browser_execute(task="Search for Python on Google", start_url="https://google.com")
    - uitars_browser_execute(task="Click the first search result")
    """
    original_max = config.max_steps
    config.max_steps = max_steps
    try:
        result = await run_browser_task(task, start_url)
    finally:
        config.max_steps = original_max
    return result


@mcp.tool(name="uitars_browser_close", annotations={"readOnlyHint": False})
async def uitars_browser_close() -> dict:
    """Close the current browser instance. Frees Playwright resources.

    ## Return Format
    {"success": true}

    ## Examples
    - uitars_browser_close()
    """
    close_browser()
    return {"success": True}


@mcp.tool(name="uitars_help", annotations={"readOnlyHint": True})
async def uitars_help() -> dict:
    """Get inline help — task reference, examples, and current configuration.

    ## Return Format
    {"success": true, "tools": [...], "examples": [...], "config": {...}}

    ## Examples
    - uitars_help()
    """
    from .config import config

    return {
        "success": True,
        "server": "uitars-mcp v0.1.0",
        "description": (
            "Desktop GUI agent — give it a natural language task and it "
            "takes screenshots, feeds them to a vision-language model, "
            "and executes mouse/keyboard actions to complete it."
        ),
        "tools": [
            {
                "name": "uitars_execute",
                "description": "Execute a GUI task end-to-end. This is the main tool.",
                "parameters": "task (str, required), max_steps (int, default 15)",
                "example": 'uitars_execute(task="Open Notepad and type hello world")',
            },
            {
                "name": "uitars_screenshot",
                "description": "Capture current desktop as base64 PNG.",
                "parameters": "none",
                "example": "uitars_screenshot()",
            },
            {
                "name": "uitars_click",
                "description": "Click at screen coordinates.",
                "parameters": "x (int), y (int), button (str, optional)",
                "example": "uitars_click(x=500, y=300)",
            },
            {
                "name": "uitars_type",
                "description": "Type text at current keyboard focus.",
                "parameters": "text (str)",
                "example": 'uitars_type(text="Hello, world!")',
            },
        ],
        "examples": [
            {
                "task": "Open a browser and go to github.com",
                "call": 'uitars_execute(task="Open Chrome, navigate to github.com")',
            },
            {
                "task": "Take a screenshot for debugging",
                "call": "uitars_screenshot()",
            },
            {
                "task": "Click the Start button (Windows)",
                "call": "uitars_click(x=20, y=1060)",
            },
            {
                "task": "Fill a form field",
                "call": 'uitars_click(x=400, y=300) then uitars_type(text="sandra@example.com")',
            },
        ],
        "configuration": {
            "vlm_base_url": config.vlm_base_url,
            "vlm_model": config.vlm_model,
            "max_steps": config.max_steps,
            "backend_port": config.backend_port,
        },
        "docs": [
            "README.md — overview and quick start",
            "docs/install.md — prerequisites and setup",
            "docs/configuration.md — env vars and providers",
            "docs/tools-reference.md — full tool API reference",
            "docs/architecture.md — internals and data flow",
            "docs/safety.md — fail-safe, risks, privacy",
            "docs/troubleshooting.md — common problems and fixes",
            "docs/integration-guide.md — Claude Desktop, fleet, REST API",
        ],
    }
