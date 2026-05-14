"""FastAPI application — REST API for uitars-mcp webapp."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .operators.browser import close_browser, navigate_to, run_browser_task
from .operators.computer import capture_screenshot, run_task
from .operators.vlm_client import check_vlm_health
from .server import mcp

logger = logging.getLogger("uitars-mcp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("UI-TARS MCP server starting (v%s)", __version__)
    yield


app = FastAPI(
    title="UI-TARS MCP",
    description="Desktop GUI agent MCP server — natural language computer control",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def api_health():
    return {
        "status": "ok",
        "version": __version__,
        "server": "uitars-mcp",
    }


@app.get("/api/status")
async def api_status():
    vlm_health = await check_vlm_health()
    return {
        "vlm": vlm_health,
        "version": __version__,
    }


@app.get("/api/screenshot")
async def api_screenshot():
    try:
        b64, width, height = capture_screenshot()
        return {
            "success": True,
            "image_base64": b64,
            "width": width,
            "height": height,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.post("/api/execute")
async def api_execute(body: dict):
    task = body.get("task", "")
    max_steps = body.get("max_steps", 15)
    if not task:
        return {"success": False, "error": "task is required"}, 400

    from .config import config

    original_max = config.max_steps
    config.max_steps = max_steps
    try:
        result = await run_task(task)
    finally:
        config.max_steps = original_max
    return result


# ── Browser ─────────────────────────────────────────────────────────


@app.post("/api/browser/navigate")
async def api_browser_navigate(body: dict):
    url = body.get("url", "")
    if not url:
        return {"success": False, "error": "url is required"}, 400
    return await navigate_to(url)


@app.post("/api/browser/execute")
async def api_browser_execute(body: dict):
    task = body.get("task", "")
    start_url = body.get("start_url")
    max_steps = body.get("max_steps", 15)
    if not task:
        return {"success": False, "error": "task is required"}, 400

    from .config import config

    original_max = config.max_steps
    config.max_steps = max_steps
    try:
        result = await run_browser_task(task, start_url)
    finally:
        config.max_steps = original_max
    return result


@app.post("/api/browser/close")
async def api_browser_close():
    close_browser()
    return {"success": True}


app.mount("/mcp", mcp.http_app())
