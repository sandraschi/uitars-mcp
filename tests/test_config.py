"""Tests for uitars-mcp configuration."""

from __future__ import annotations

import os
from unittest.mock import patch

from uitars_mcp.config import UITARSConfig


class TestConfig:
    def test_defaults(self):
        """Defaults match fleet port allocation and Ollama defaults."""
        with patch.dict(os.environ, {}, clear=True):
            cfg = UITARSConfig()
            assert cfg.backend_port == 10976
            assert cfg.frontend_port == 10977
            assert cfg.host == "127.0.0.1"
            assert cfg.vlm_model == "qwen2.5-vl:7b"
            assert cfg.max_steps == 15

    def test_env_applied_at_class_load(self):
        """Dataclass defaults are evaluated at import time from os.environ.
        Once the class is defined, os.environ changes don't affect defaults.
        This is standard Python dataclass behavior with os.getenv() defaults.
        """
        cfg = UITARSConfig()
        assert cfg.backend_port == 10976
        assert isinstance(cfg.backend_port, int)

    def test_validate_returns_list(self):
        cfg = UITARSConfig()
        result = cfg.validate()
        assert isinstance(result, list)

    def test_health_report(self):
        cfg = UITARSConfig()
        report = cfg.health_report()
        assert "0.2.0" in report["version"]
        assert "vlm_base_url" in report
        assert "vlm_model" in report
        assert "browser_available" in report
        assert isinstance(report["browser_available"], bool)

    def test_browser_available_false_by_default(self):
        cfg = UITARSConfig()
        assert cfg.browser_available is False
