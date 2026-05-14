"""Browser operator — Playwright-based web automation via VLM grounding.

Requires: playwright (optional — `uv sync --extra browser` or `pip install playwright`)

Launches a headless Chromium browser, captures page screenshots, sends them to
the VLM for action grounding, and executes click/type/scroll actions on the page.
"""

from __future__ import annotations

import base64
import io
import logging
import re
from typing import Any

from PIL import Image

from ..config import config

logger = logging.getLogger(__name__)

BROWSER_PROMPT = (
    "You are a web browser agent. You are given a task and a screenshot of the current webpage.\n"
    "You must output exactly one action per turn to complete the task.\n"
    "\n"
    "Available browser actions:\n"
    "- click(start_box='(x1,y1),(x2,y2)') — click at center of bounding box\n"
    "- type(content='text to type') — type text into the focused input\n"
    "- scroll(start_box='(x1,y1),(x2,y2)', direction='up|down') — scroll in region\n"
    "- navigate(url='https://...') — go to a new URL\n"
    "- go_back() — return to previous page\n"
    "- press_key(key='Enter') — press a keyboard key\n"
    "- wait() — wait 2 seconds for page to load\n"
    "- finished(content='task complete description') — indicate completion\n"
    "\n"
    "Format your response exactly as:\n"
    "Thought: <your step-by-step reasoning>\n"
    "Action: <one of the actions above>"
)

_pw = None
_browser_ctx: dict[str, Any] = {}


def _get_playwright():
    global _pw
    if _pw is None:
        try:
            from playwright.sync_api import sync_playwright

            _pw = sync_playwright().start()
        except ImportError:
            raise RuntimeError(
                "Playwright not installed. Run: uv sync --extra browser"
            ) from None
    return _pw


def launch_browser(headless: bool = True) -> dict[str, Any]:
    """Launch a Chromium browser via Playwright. Returns page and browser refs."""
    pw = _get_playwright()
    browser = pw.chromium.launch(headless=headless)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    _browser_ctx["browser"] = browser
    _browser_ctx["page"] = page
    return {"browser": browser, "page": page}


def close_browser():
    """Close the current browser instance."""
    browser = _browser_ctx.pop("browser", None)
    if browser:
        try:
            browser.close()
        except Exception:
            pass
    _browser_ctx.pop("page", None)
    global _pw
    if _pw:
        try:
            _pw.stop()
        except Exception:
            pass
        _pw = None


def get_page():
    """Get or create the current Playwright page."""
    page = _browser_ctx.get("page")
    if page is None:
        ctx = launch_browser(headless=True)
        page = ctx["page"]
    return page


def capture_page_screenshot() -> tuple[str, int, int]:
    """Capture current browser page as (base64 PNG, width, height)."""
    page = get_page()
    screenshot_bytes = page.screenshot(full_page=False)
    img = Image.open(io.BytesIO(screenshot_bytes))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode(), img.width, img.height


def parse_browser_action(response: str) -> dict[str, Any]:
    """Parse VLM response into structured browser action dict."""
    thought = ""
    action_str = ""

    thought_match = re.search(r"Thought:\s*(.*?)(?:\n|$)", response, re.IGNORECASE)
    action_match = re.search(r"Action:\s*(.*)", response, re.IGNORECASE)

    if thought_match:
        thought = thought_match.group(1).strip()
    if action_match:
        action_str = action_match.group(1).strip()

    action_type = "unknown"
    params: dict[str, Any] = {}

    if action_str.startswith("finished("):
        action_type = "finished"
        m = re.search(r"content='(.*?)'\)", action_str)
        params["content"] = m.group(1) if m else ""
    elif action_str.startswith("click("):
        action_type = "click"
        m = re.search(r"start_box='(.*?)'\)", action_str)
        if m:
            params["box"] = m.group(1)
    elif action_str.startswith("type("):
        action_type = "type"
        m = re.search(r"content='(.*?)'\)", action_str)
        params["content"] = m.group(1) if m else ""
    elif action_str.startswith("scroll("):
        action_type = "scroll"
        m = re.search(r"direction='(.*?)'\)", action_str)
        params["direction"] = m.group(1) if m else "down"
    elif action_str.startswith("navigate("):
        action_type = "navigate"
        m = re.search(r"url='(.*?)'\)", action_str)
        params["url"] = m.group(1) if m else ""
    elif action_str.startswith("go_back("):
        action_type = "go_back"
    elif action_str.startswith("press_key("):
        action_type = "press_key"
        m = re.search(r"key='(.*?)'\)", action_str)
        params["key"] = m.group(1) if m else ""
    elif action_str.startswith("wait("):
        action_type = "wait"

    return {
        "thought": thought,
        "action": action_str,
        "action_type": action_type,
        "params": params,
    }


def execute_browser_action(parsed: dict[str, Any]) -> str:
    """Execute a parsed browser action on the current Playwright page."""
    page = get_page()
    action_type = parsed["action_type"]
    params = parsed.get("params", {})

    if action_type == "finished":
        return f"Task finished: {params.get('content', 'done')}"
    elif action_type == "click":
        if "box" in params:
            nums = re.findall(r"\d+", params["box"])
            if len(nums) >= 4:
                x = (int(nums[0]) + int(nums[2])) // 2
                y = (int(nums[1]) + int(nums[3])) // 2
                page.mouse.click(x, y)
                return f"Clicked at ({x}, {y})"
        return "Click: no coordinates"
    elif action_type == "type":
        content = params.get("content", "")
        page.keyboard.type(content)
        return f"Typed: '{content}'"
    elif action_type == "scroll":
        direction = params.get("direction", "down")
        delta = 300 if direction == "down" else -300
        page.mouse.wheel(0, delta)
        return f"Scrolled {direction}"
    elif action_type == "navigate":
        url = params.get("url", "")
        if url:
            page.goto(url, wait_until="domcontentloaded")
            return f"Navigated to: {url}"
        return "Navigate: no URL"
    elif action_type == "go_back":
        page.go_back()
        return "Went back"
    elif action_type == "press_key":
        key = params.get("key", "")
        page.keyboard.press(key)
        return f"Pressed: {key}"
    elif action_type == "wait":
        page.wait_for_timeout(2000)
        return "Waited 2 seconds"
    else:
        return f"Unknown action: {parsed['action']}"


async def navigate_to(url: str) -> dict[str, Any]:
    """Navigate to a URL and return page screenshot + info."""
    try:
        page = get_page()
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        b64, width, height = capture_page_screenshot()
        return {
            "success": True,
            "url": page.url,
            "title": page.title(),
            "screenshot_base64": b64,
            "width": width,
            "height": height,
        }
    except Exception as e:
        logger.error(f"Browser navigate error: {e}")
        return {"success": False, "error": str(e), "url": url}


async def run_browser_task(task: str, start_url: str | None = None) -> dict[str, Any]:
    """Execute a browser task end-to-end via VLM grounding."""
    from .vlm_client import call_vlm

    steps: list[dict] = []
    history: list[dict] = []
    success = False
    final_message = ""

    try:
        page = get_page()
        if start_url:
            page.goto(start_url, wait_until="domcontentloaded", timeout=30000)

        for step_num in range(1, config.max_steps + 1):
            screenshot_b64, width, height = capture_page_screenshot()

            response = await call_vlm(task, screenshot_b64, history)
            parsed = parse_browser_action(response)
            status = execute_browser_action(parsed)

            step_record = {
                "step": step_num,
                "thought": parsed["thought"],
                "action": parsed["action"],
                "action_type": parsed["action_type"],
                "status": status,
            }
            steps.append(step_record)

            history.append({"role": "assistant", "content": response})
            history.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"Action executed: {status}\n\n"
                                "Here is the updated page. Output your next action."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{screenshot_b64}"
                            },
                        },
                    ],
                }
            )

            if parsed["action_type"] == "finished":
                success = True
                final_message = parsed["params"].get("content", "Task completed")
                break

        if not success:
            final_message = f"Max steps ({config.max_steps}) reached"

        return {
            "success": success,
            "task": task,
            "steps": len(steps),
            "max_steps": config.max_steps,
            "message": final_message,
            "actions": steps,
        }

    except Exception as e:
        logger.error(f"Browser task error: {e}")
        return {"success": False, "error": str(e), "task": task}
