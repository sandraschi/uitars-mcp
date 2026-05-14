from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class UITARSConfig:
    backend_port: int = int(os.getenv("UITARS_PORT", "10976"))
    frontend_port: int = int(os.getenv("UITARS_FRONTEND_PORT", "10977"))
    host: str = os.getenv("UITARS_HOST", "127.0.0.1")
    log_level: str = os.getenv("UITARS_LOG_LEVEL", "info")

    vlm_base_url: str = os.getenv("UITARS_VLM_BASE_URL", "http://127.0.0.1:11434/v1")
    vlm_model: str = os.getenv("UITARS_VLM_MODEL", "qwen2.5-vl:7b")
    vlm_api_key: str = os.getenv("UITARS_VLM_API_KEY", "ollama")
    max_steps: int = int(os.getenv("UITARS_MAX_STEPS", "15"))


config = UITARSConfig()
