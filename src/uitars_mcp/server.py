"""FastMCP server — registers uitars-mcp tools."""

from __future__ import annotations

from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.middleware.logging import LoggingMiddleware
from pydantic import Field

from . import __version__
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
