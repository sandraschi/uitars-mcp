from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


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

    browser_available: bool = field(default=False, init=False)

    def validate(self) -> list[str]:
        """Validate configuration at startup. Returns list of warnings (empty = ok)."""
        warnings: list[str] = []

        if not self.vlm_base_url:
            warnings.append("UITARS_VLM_BASE_URL is empty — no VLM configured")

        try:
            import asyncio

            import httpx

            async def _probe():
                async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                    r = await client.get(
                        f"{self.vlm_base_url}/models",
                        headers={"Authorization": f"Bearer {self.vlm_api_key}"},
                    )
                    if r.status_code != 200:
                        warnings.append(
                            f"VLM probe returned {r.status_code} from {self.vlm_base_url}"
                        )

            try:
                asyncio.get_event_loop()
                already_running = True
            except RuntimeError:
                already_running = False

            if not already_running:
                asyncio.run(_probe())
            else:
                logger.info("Skipping VLM probe — event loop already running")

        except Exception as e:
            warnings.append(f"VLM probe failed: {e}")

        try:
            import importlib.util

            if importlib.util.find_spec("playwright") is not None:
                self.browser_available = True
                logger.info("Browser operator available (Playwright detected)")
            else:
                logger.info("Browser operator unavailable (uv sync --extra browser)")
        except Exception:
            pass

        return warnings

    def health_report(self) -> dict:
        """Return a health summary dict for status endpoints."""
        return {
            "version": "0.2.0",
            "vlm_base_url": self.vlm_base_url,
            "vlm_model": self.vlm_model,
            "max_steps": self.max_steps,
            "browser_available": self.browser_available,
            "backend_port": self.backend_port,
        }


config = UITARSConfig()
