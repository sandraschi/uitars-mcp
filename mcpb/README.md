# uitars-mcp (MCPB Bundle)

UI-TARS MCP — desktop GUI agent server with MCP tools and webapp

## Usage

Add to \claude_desktop_config.json\:
\\\json
{
  "mcpServers": {
    "uitars-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "\D:\Dev\repos", "python", "-m", "uitars_mcp"],
      "env": { "PYTHONPATH": "\D:\Dev\repos/src" }
    }
  }
}
\\\

## Tools

- **uitars-mcp**: UI-TARS MCP — desktop GUI agent server with MCP tools and webapp

## Requirements

- Python 3.12+
- uv
