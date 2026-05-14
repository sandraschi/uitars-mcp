from __future__ import annotations

import base64
import io
import re
from typing import Any

import pyautogui
from mss import mss
from PIL import Image

from ..config import config
from .vlm_client import call_vlm

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.3


def capture_screenshot() -> tuple[str, int, int]:
    """Capture full desktop, return (base64 PNG, width, height)."""
    with mss() as sct:
        monitor = sct.monitors[0]
        img = sct.grab(monitor)
        pil_img = Image.frombytes("RGB", img.size, img.bgra, "raw", "BGRX")
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        buf.seek(0)
        return base64.b64encode(buf.read()).decode(), pil_img.width, pil_img.height


def parse_action(response: str, image_width: int, image_height: int) -> dict[str, Any]:
    """Parse VLM response into structured action dict."""
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
        content_match = re.search(r"content='(.*?)'\)", action_str)
        params["content"] = content_match.group(1) if content_match else ""
    elif action_str.startswith("click("):
        action_type = "click"
        box_match = re.search(r"start_box='(.*?)'\)", action_str)
        if box_match:
            params["box"] = box_match.group(1)
    elif action_str.startswith("double_click("):
        action_type = "double_click"
        box_match = re.search(r"start_box='(.*?)'\)", action_str)
        if box_match:
            params["box"] = box_match.group(1)
    elif action_str.startswith("right_click("):
        action_type = "right_click"
        box_match = re.search(r"start_box='(.*?)'\)", action_str)
        if box_match:
            params["box"] = box_match.group(1)
    elif action_str.startswith("drag("):
        action_type = "drag"
        start_match = re.search(r"start_box='(.*?)'", action_str)
        end_match = re.search(r"end_box='(.*?)'\)", action_str)
        if start_match:
            params["start_box"] = start_match.group(1)
        if end_match:
            params["end_box"] = end_match.group(1)
    elif action_str.startswith("hotkey("):
        action_type = "hotkey"
        key_match = re.search(r"key='(.*?)'\)", action_str)
        params["key"] = key_match.group(1) if key_match else ""
    elif action_str.startswith("type("):
        action_type = "type"
        content_match = re.search(r"content='(.*?)'\)", action_str)
        params["content"] = content_match.group(1) if content_match else ""
    elif action_str.startswith("scroll("):
        action_type = "scroll"
        box_match = re.search(r"start_box='(.*?)'", action_str)
        dir_match = re.search(r"direction='(.*?)'\)", action_str)
        if box_match:
            params["box"] = box_match.group(1)
        params["direction"] = dir_match.group(1) if dir_match else "down"
    elif action_str.startswith("wait("):
        action_type = "wait"

    return {
        "thought": thought,
        "action": action_str,
        "action_type": action_type,
        "params": params,
    }


def parse_box_to_coords(box_str: str) -> tuple[int, int]:
    """Parse '(x1,y1),(x2,y2)' to center coordinates (cx, cy)."""
    nums = re.findall(r"\d+", box_str)
    if len(nums) >= 4:
        x1, y1, x2, y2 = int(nums[0]), int(nums[1]), int(nums[2]), int(nums[3])
        return (x1 + x2) // 2, (y1 + y2) // 2
    if len(nums) >= 2:
        return int(nums[0]), int(nums[1])
    return 0, 0


def execute_action(parsed: dict[str, Any]) -> str:
    """Execute a parsed action on the desktop. Return status message."""
    action_type = parsed["action_type"]
    params = parsed.get("params", {})

    if action_type == "finished":
        return f"Task finished: {params.get('content', 'done')}"
    elif action_type == "click":
        if "box" in params:
            x, y = parse_box_to_coords(params["box"])
            pyautogui.click(x, y)
            return f"Clicked at ({x}, {y})"
        return "Click: no coordinates"
    elif action_type == "double_click":
        if "box" in params:
            x, y = parse_box_to_coords(params["box"])
            pyautogui.doubleClick(x, y)
            return f"Double-clicked at ({x}, {y})"
        return "Double-click: no coordinates"
    elif action_type == "right_click":
        if "box" in params:
            x, y = parse_box_to_coords(params["box"])
            pyautogui.rightClick(x, y)
            return f"Right-clicked at ({x}, {y})"
        return "Right-click: no coordinates"
    elif action_type == "drag":
        if "start_box" in params and "end_box" in params:
            sx, sy = parse_box_to_coords(params["start_box"])
            ex, ey = parse_box_to_coords(params["end_box"])
            pyautogui.moveTo(sx, sy)
            pyautogui.drag(ex - sx, ey - sy, duration=0.5)
            return f"Dragged from ({sx},{sy}) to ({ex},{ey})"
        return "Drag: missing coordinates"
    elif action_type == "hotkey":
        keys = params.get("key", "").split()
        pyautogui.hotkey(*keys)
        return f"Pressed hotkey: {params.get('key', '')}"
    elif action_type == "type":
        content = params.get("content", "")
        pyautogui.typewrite(content)
        return f"Typed: '{content}'"
    elif action_type == "scroll":
        direction = params.get("direction", "down")
        amount = 3 if direction == "up" else -3
        if "box" in params:
            x, y = parse_box_to_coords(params["box"])
            pyautogui.moveTo(x, y)
        pyautogui.scroll(amount)
        return f"Scrolled {direction}"
    elif action_type == "wait":
        pyautogui.sleep(2)
        return "Waited 2 seconds"
    else:
        return f"Unknown action: {parsed['action']}"


async def run_task(task: str) -> dict[str, Any]:
    """Execute a full GUI task end-to-end. Returns result dict."""
    steps: list[dict] = []
    history: list[dict] = []
    success = False
    final_message = ""

    for step_num in range(1, config.max_steps + 1):
        screenshot_b64, width, height = capture_screenshot()

        response = await call_vlm(task, screenshot_b64, history)

        parsed = parse_action(response, width, height)
        status = execute_action(parsed)

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
                            "Here is the updated screen. Output your next action."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{screenshot_b64}"},
                    },
                ],
            }
        )

        if parsed["action_type"] == "finished":
            success = True
            final_message = parsed["params"].get("content", "Task completed")
            break

    if not success:
        final_message = f"Max steps ({config.max_steps}) reached without completion"

    return {
        "success": success,
        "task": task,
        "steps": len(steps),
        "max_steps": config.max_steps,
        "message": final_message,
        "actions": steps,
    }
