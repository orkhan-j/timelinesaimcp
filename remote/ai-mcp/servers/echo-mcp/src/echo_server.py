#!/usr/bin/env python3
import logging
from datetime import datetime
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP("echo-mcp")

@mcp.tool()
def echo(text: str) -> str:
    return text

@mcp.resource("echo://status")
def echo_status() -> str:
    return str({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "server_name": "echo-mcp",
        "tools_available": ["echo"],
    })

@mcp.custom_route("/health", methods=["GET"])
async def health_check(request: Request) -> JSONResponse:
    return JSONResponse({"status": "alive"}, status_code=200)

if __name__ == "__main__":
    logger.info("Starting Echo MCP server in SSE mode on http://0.0.0.0:8080")
    mcp.run(transport="sse", host="0.0.0.0", port=8080)
