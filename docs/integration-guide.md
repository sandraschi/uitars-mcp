# Integration Guide

## Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "uitars-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:10976/mcp"
    }
  }
}
```

Start the server first: `uv run uitars-mcp --serve`, then restart Claude Desktop.

## OpenCode / Claude Code

```json
{
  "mcpServers": {
    "uitars-mcp": {
      "url": "http://127.0.0.1:10976/mcp"
    }
  }
}
```

## Chitchat / Hermes (Fleet)

uitars-mcp is a standard FastMCP 3.2 HTTP server. Any MCP client in the fleet can mount it. chitchat can delegate GUI tasks via its MCP routing.

## Direct REST API

```powershell
# Health check
Invoke-RestMethod http://127.0.0.1:10976/api/health

# Take screenshot
Invoke-RestMethod http://127.0.0.1:10976/api/screenshot

# Execute task
$body = @{task = "Open Notepad"; max_steps = 10} | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:10976/api/execute -Method POST -Body $body -ContentType "application/json"

# VLM status
Invoke-RestMethod http://127.0.0.1:10976/api/status
```

## Headless / CI

Set the VLM provider to a cloud API (Anthropic/OpenAI) — the server doesn't need a GPU:

```powershell
$env:UITARS_VLM_BASE_URL = "https://api.anthropic.com/v1"
$env:UITARS_VLM_MODEL = "claude-sonnet-4-20250514"
$env:UITARS_VLM_API_KEY = $env:ANTHROPIC_API_KEY
uv run uitars-mcp --serve
```

Note: GUI automation in CI requires a desktop session. Use a Windows runner with an interactive desktop or a virtual display.
