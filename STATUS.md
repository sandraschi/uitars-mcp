# Status — uitars-mcp

| Component | Status | Notes |
|-----------|--------|-------|
| MCP tools (9) | ✅ Working | uitars_execute, screenshot, click, type, browser_navigate, browser_execute, browser_close, status, help |
| Self-termination | ✅ Added | uitars_shutdown tool + POST /api/shutdown |
| Desktop operator | ✅ Working | mss screenshot, pyautogui actions, VLM grounding |
| Browser operator | ✅ Working | Playwright headless Chromium, VLM grounding |
| VLM client | ✅ Working | OpenAI-compatible, provider-agnostic |
| REST API | ✅ Working | /api/health, status, capabilities, screenshot, execute, browser/*, diagnostics |
| Webapp | ✅ Working | React 18, iron shell, 5 pages, floating chat, logger panel |
| Webapp LLM chat | ✅ Working | FloatingChat with Ollama/LM Studio auto-discovery |
| CORS | ✅ Fixed | Proper origins + regex (was `["*"]`) |
| Tauri/NSIS | ✅ Ready | frontendDist fixed → web_sota/dist, .env → .env.example |
| CI/CD | ✅ Restored | Python + frontend dual job |
| MCPB packaging | ⚠️ Placeholder prompts | system.md/user.md/examples.json need real content |
| Tests | ✅ Working | 28 tests across 5 files |
| CUA smoke test | ✅ Ready | scripts/cua-smoke.py + cua-nsis-config.json |
