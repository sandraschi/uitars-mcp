"""Tests for uitars-mcp browser operator."""

from __future__ import annotations

from uitars_mcp.operators.browser import parse_browser_action


class TestParseBrowserAction:
    def test_parse_finished(self):
        response = "Thought: Done\nAction: finished(content='found it')"
        result = parse_browser_action(response)
        assert result["action_type"] == "finished"
        assert result["params"]["content"] == "found it"

    def test_parse_click(self):
        response = "Thought: Click link\nAction: click(start_box='(50,100),(150,120)')"
        result = parse_browser_action(response)
        assert result["action_type"] == "click"
        assert result["params"]["box"] == "(50,100),(150,120)"

    def test_parse_type(self):
        response = "Thought: Type query\nAction: type(content='python')"
        result = parse_browser_action(response)
        assert result["action_type"] == "type"
        assert result["params"]["content"] == "python"

    def test_parse_scroll(self):
        response = "Thought: Scroll down\nAction: scroll(direction='down')"
        result = parse_browser_action(response)
        assert result["action_type"] == "scroll"
        assert result["params"]["direction"] == "down"

    def test_parse_navigate(self):
        response = "Thought: Go to site\nAction: navigate(url='https://example.com')"
        result = parse_browser_action(response)
        assert result["action_type"] == "navigate"
        assert result["params"]["url"] == "https://example.com"

    def test_parse_go_back(self):
        response = "Thought: Go back\nAction: go_back()"
        result = parse_browser_action(response)
        assert result["action_type"] == "go_back"

    def test_parse_press_key(self):
        response = "Thought: Submit\nAction: press_key(key='Enter')"
        result = parse_browser_action(response)
        assert result["action_type"] == "press_key"
        assert result["params"]["key"] == "Enter"

    def test_parse_wait(self):
        response = "Thought: Wait for load\nAction: wait()"
        result = parse_browser_action(response)
        assert result["action_type"] == "wait"
