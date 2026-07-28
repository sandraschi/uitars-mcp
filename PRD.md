# uitars-mcp — Product Requirements

## Problem
Users need to control their desktop and browser through natural language, powered by vision-language models. Existing solutions (pywinauto-mcp, autohotkey-mcp) lack VLM-based visual grounding and browser-specific automation.

## Features
- Desktop GUI control via VLM: screenshot → action prediction → mouse/keyboard execution
- Browser automation via Playwright headless Chromium + VLM
- OpenAI-compatible VLM provider support (Ollama, LM Studio, cloud APIs)
- REST API for webapp integration
- MCP tools for Claude Desktop / Cursor / opencode integration
- Single uvicorn process (port 10976) serving REST + MCP HTTP + static webapp

## Non-goals
- Not a general-purpose RPA tool (no Excel, no ERP automation)
- No booking-execution capability
- No cloud-only dependency — runs entirely local

## Architecture
- FastMCP 3.2+ MCP tools → operator layer (computer.py / browser.py) → VLM client → target
- FastAPI REST layer wraps the same operators for webapp consumption
- Single-port deployment (10976): REST + MCP HTTP (/mcp) + static files

## Future
- Multi-VLM routing
- Recording/replay of action sequences
- Session persistence and recovery
