"""Entry point for the uitars-mcp server.

Usage:
    uv run uitars-mcp --serve    # Start FastAPI + MCP server
"""

from __future__ import annotations

import argparse
import logging


def main() -> None:
    parser = argparse.ArgumentParser(description="UI-TARS MCP server")
    parser.add_argument("--serve", action="store_true", help="Start HTTP server")
    parser.add_argument("--port", type=int, default=10976, help="Backend port")
    args = parser.parse_args()

    if args.serve:
        from .config import config

        logging.basicConfig(
            level=getattr(logging, config.log_level.upper(), logging.INFO),
            format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        )

        import uvicorn

        uvicorn.run(
            "uitars_mcp.app:app",
            host=config.host,
            port=args.port,
            log_level=config.log_level,
        )


if __name__ == "__main__":
    main()
