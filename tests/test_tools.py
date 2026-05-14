"""Tests for uitars-mcp MCP tools (help, status, return shapes)."""

from __future__ import annotations

import pytest


class TestHelpTool:
    async def test_help_returns_tools_list(self):
        from uitars_mcp.server import uitars_help

        result = await uitars_help()
        assert result["success"] is True
        assert "uitars-mcp v0.2.0" in result["server"]
        assert len(result["tools"]) >= 5
        assert len(result["examples"]) >= 3
        assert "configuration" in result
        assert "docs" in result

    async def test_help_tools_have_names(self):
        from uitars_mcp.server import uitars_help

        result = await uitars_help()
        tool_names = [t["name"] for t in result["tools"]]
        assert "uitars_execute" in tool_names
        assert "uitars_help" in tool_names
        assert "uitars_browser_navigate" in tool_names

    async def test_help_config_has_vlm_model(self):
        from uitars_mcp.server import uitars_help

        result = await uitars_help()
        assert "vlm_model" in result["configuration"]
        assert "max_steps" in result["configuration"]


class TestStatusTool:
    async def test_status_returns_structure(self):
        from uitars_mcp.server import uitars_status

        result = await uitars_status()
        assert result["success"] is True
        assert "vlm" in result
        assert "browser_available" in result
        assert "config" in result
        assert isinstance(result["browser_available"], bool)


@pytest.mark.parametrize(
    "response_str, expected_type",
    [
        ("Thought: Done\nAction: click(start_box='(1,1),(2,2)')", "click"),
        ("Action: type(content='hi')", "type"),
        ("Thought: x\nAction: hotkey(key='ctrl c')", "hotkey"),
        ("Action: finished(content='done')", "finished"),
        ("Thought: Scroll\nAction: scroll(direction='down')", "scroll"),
    ],
)
def test_computer_action_parsing_variants(response_str, expected_type):
    from uitars_mcp.operators.computer import parse_action

    result = parse_action(response_str, 1920, 1080)
    assert result["action_type"] == expected_type
