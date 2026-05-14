"""Tests for uitars-mcp operators."""
from __future__ import annotations

from uitars_mcp.operators.computer import parse_action, parse_box_to_coords


class TestParseAction:
    def test_parse_finished(self):
        response = "Thought: Task done\nAction: finished(content='hello')"
        result = parse_action(response, 1920, 1080)
        assert result["action_type"] == "finished"
        assert result["params"]["content"] == "hello"

    def test_parse_click(self):
        response = "Thought: Click button\nAction: click(start_box='(100,200)')"
        result = parse_action(response, 1920, 1080)
        assert result["action_type"] == "click"
        assert result["params"]["box"] == "(100,200)"

    def test_parse_hotkey(self):
        response = "Thought: Press save\nAction: hotkey(key='ctrl s')"
        result = parse_action(response, 1920, 1080)
        assert result["action_type"] == "hotkey"
        assert result["params"]["key"] == "ctrl s"

    def test_parse_type(self):
        response = "Thought: Type text\nAction: type(content='hello world')"
        result = parse_action(response, 1920, 1080)
        assert result["action_type"] == "type"
        assert result["params"]["content"] == "hello world"


class TestParseBoxToCoords:
    def test_center_of_box(self):
        x, y = parse_box_to_coords("(100,200),(300,400)")
        assert x == 200
        assert y == 300

    def test_direct_coords(self):
        x, y = parse_box_to_coords("(500,600)")
        assert x == 500
        assert y == 600
