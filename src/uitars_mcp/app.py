"""FastAPI application - REST API for uitars-mcp webapp."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import config
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
    description="Desktop GUI agent MCP server - natural language computer control",
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:10976",
        "http://localhost:10977",
        "http://127.0.0.1:10976",
        "http://127.0.0.1:10977",
        "http://tauri.localhost",
        "https://tauri.localhost",
        "tauri://localhost",
    ],
    allow_origin_regex=r"https?://(?:[a-zA-Z0-9-]+\.ts\.net|.*?\.tail-[a-f0-9]+\.ts\.net|tauri\.localhost|localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|100\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$|^tauri://localhost$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def api_health():
    return {
        "status": "ok",
        "version": __version__,
        "server": "uitars-mcp",
        "tool_count": 9,
        "uptime_seconds": 0,
    }


@app.get("/api/status")
async def api_status():
    vlm_health = await check_vlm_health()
    return {
        "vlm": vlm_health,
        "version": __version__,
        "browser_available": config.browser_available,
    }


@app.get("/api/capabilities")
async def api_capabilities():
    from datetime import UTC, datetime

    from .server import mcp

    tools = await mcp.list_tools()
    tool_names = [t.name for t in tools]
    return {
        "status": "ok",
        "server": {"name": "uitars-mcp", "version": __version__, "fastmcp": "3.4"},
        "tool_surface": {
            "total": len(tool_names),
            "portmanteau_count": 0,
            "atomic_count": len(tool_names),
            "portmanteau_tools": [],
            "atomic_tools": tool_names,
        },
        "features": {
            "sampling": False,
            "agentic_workflows": False,
            "prompts": False,
            "resources": False,
            "skills": False,
        },
        "inventory": {"workflow_tools": [], "prompt_names": [], "resource_uris": [], "skill_uris": []},
        "runtime": {
            "transport": "http",
            "surface_mode": "atomic",
            "browser_available": config.browser_available,
        },
        "timestamp": datetime.now(UTC).isoformat(),
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
    except Exception as exc:
        result = {"success": False, "error": str(exc)}
    finally:
        config.max_steps = original_max
    return result


# ── Browser ─────────────────────────────────────────────────────────


@app.post("/api/browser/navigate")
async def api_browser_navigate(body: dict):
    url = body.get("url", "")
    if not url:
        return {"success": False, "error": "url is required"}, 400
    try:
        return await navigate_to(url)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


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
    except Exception as exc:
        result = {"success": False, "error": str(exc)}
    finally:
        config.max_steps = original_max
    return result


@app.post("/api/browser/close")
async def api_browser_close():
    close_browser()
    return {"success": True}


@app.get("/api/v1/diagnostics")
async def api_diagnostics():
    from .operators.vlm_client import check_vlm_health

    vlm_health = await check_vlm_health()
    return {
        "status": "ok",
        "server": "uitars-mcp",
        "version": __version__,
        "tool_count": 9,
        "tools": [
            {"name": "uitars_execute"},
            {"name": "uitars_screenshot"},
            {"name": "uitars_click"},
            {"name": "uitars_type"},
            {"name": "uitars_browser_navigate"},
            {"name": "uitars_browser_execute"},
            {"name": "uitars_browser_close"},
            {"name": "uitars_status"},
            {"name": "uitars_help"},
            {"name": "uitars_shutdown"},
        ],
        "system": {"windows": True},
        "errors": [],
        "vlm": vlm_health,
    }


@app.post("/api/shutdown")
async def api_shutdown():
    import os

    logger.warning("Shutdown requested via REST API")
    os._exit(0)


app.mount("/mcp", mcp.http_app(path="/"))
