#!/bin/bash

# MCP Curl Wrapper for Claude Desktop
# This script ensures proper communication with the MCP server

exec curl -s -X POST "https://mcp.timelinesaitech.com/" \
  -H "Content-Type: application/json" \
  --data-binary "@-"