"""Tests for uitars-mcp VLM client."""

from __future__ import annotations

from uitars_mcp.operators.vlm_client import (
    COMPUTER_USE_PROMPT,
    build_messages,
)


class TestBuildMessages:
    def test_basic_task(self):
        messages = build_messages("Click the button", "abc123base64")
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert isinstance(messages[1]["content"], list)
        assert messages[1]["content"][0]["type"] == "text"
        assert "Click the button" in messages[1]["content"][0]["text"]

    def test_with_history(self):
        history = [
            {"role": "assistant", "content": "Action: click(...)"},
            {"role": "user", "content": [{"type": "text", "text": "Updated screen"}]},
        ]
        messages = build_messages("Continue", "abc123", history)
        assert len(messages) == 4
        assert messages[1] == history[0]
        assert messages[2] == history[1]

    def test_prompt_includes_all_actions(self):
        assert "click" in COMPUTER_USE_PROMPT
        assert "double_click" in COMPUTER_USE_PROMPT
        assert "right_click" in COMPUTER_USE_PROMPT
        assert "drag" in COMPUTER_USE_PROMPT
        assert "hotkey" in COMPUTER_USE_PROMPT
        assert "type" in COMPUTER_USE_PROMPT
        assert "scroll" in COMPUTER_USE_PROMPT
        assert "finished" in COMPUTER_USE_PROMPT
