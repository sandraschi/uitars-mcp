from __future__ import annotations

from typing import Any

import httpx

from ..config import config

COMPUTER_USE_PROMPT = (
    "You are a GUI agent. You are given a task and a screenshot of the desktop.\n"
    "You must output exactly one action per turn to complete the task.\n"
    "\n"
    "Available actions:\n"
    "- click(start_box='(x1,y1),(x2,y2)') — click at center of bounding box\n"
    "- double_click(start_box='(x1,y1),(x2,y2)') — double-click\n"
    "- right_click(start_box='(x1,y1),(x2,y2)') — right-click\n"
    "- drag(start_box='...', end_box='...') — drag from start to end\n"
    "- hotkey(key='ctrl c') — press key combination\n"
    "- type(content='text to type') — type the given text\n"
    "- scroll(start_box='...', direction='up|down') — scroll in region\n"
    "- wait() — wait 2 seconds for UI to update\n"
    "- finished(content='task complete description') — indicate completion\n"
    "\n"
    "Format your response exactly as:\n"
    "Thought: <your step-by-step reasoning>\n"
    "Action: <one of the actions above>"
)


def build_messages(
    task: str,
    screenshot_base64: str,
    history: list[dict] | None = None,
) -> list[dict]:
    messages: list[dict] = [
        {
            "role": "system",
            "content": COMPUTER_USE_PROMPT,
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (f"Task: {task}\n\nOutput your next action. If complete, use finished()."),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{screenshot_base64}"},
                },
            ],
        },
    ]

    if history:
        messages[1:1] = history

    return messages


async def call_vlm(
    task: str,
    screenshot_base64: str,
    history: list[dict] | None = None,
) -> str:
    """Send screenshot + task to VLM, return model response text."""
    messages = build_messages(task, screenshot_base64, history)

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
        response = await client.post(
            f"{config.vlm_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {config.vlm_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": config.vlm_model,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.0,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def check_vlm_health() -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            response = await client.get(
                f"{config.vlm_base_url}/models",
                headers={"Authorization": f"Bearer {config.vlm_api_key}"},
            )
            response.raise_for_status()
            data = response.json()
            models = []
            if isinstance(data, dict) and "data" in data:
                models = [m["id"] for m in data["data"]]
            return {"ok": True, "models": models, "configured_model": config.vlm_model}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "base_url": config.vlm_base_url}
