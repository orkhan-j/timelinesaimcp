#!/bin/bash

# MCP Server Deployment Script
# This script ensures proper deployment from git to server

set -e

echo "🚀 Starting MCP Server Deployment"

# Configuration
SERVER_IP="213.182.213.232"
SERVER_DIR="/opt/mcp-gateway"

# Step 1: Ensure we're in the right directory
if [ ! -f "remote/mcp-gateway/posthog-official-server.js" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "✅ Step 1: Checking local changes"
git status

echo "📦 Step 2: Committing any local changes"
read -p "Enter commit message (or press Enter to skip): " commit_msg
if [ ! -z "$commit_msg" ]; then
    git add -A
    git commit -m "$commit_msg"
fi

echo "⬆️ Step 3: Pushing to GitHub"
git push origin main

echo "🔄 Step 4: Deploying to server"
ssh root@$SERVER_IP << 'ENDSSH'
    set -e
    cd /opt/mcp-gateway
    
    echo "  → Pulling latest changes from git"
    git pull origin main
    
    echo "  → Syncing files from git structure to Docker mount points"
    # IMPORTANT: Docker uses files in root directory, not in remote/mcp-gateway/
    cp remote/mcp-gateway/posthog-official-server.js posthog-official-server.js
    cp remote/mcp-gateway/googleads-official-server.js googleads-official-server.js
    cp remote/mcp-gateway/intercom-official-server.js intercom-official-server.js
    cp remote/mcp-gateway/nginx.conf nginx.conf
    cp remote/mcp-gateway/docker-compose.yml docker-compose.yml
    
    echo "  → Restarting Docker containers"
    docker-compose down
    docker-compose up -d
    
    echo "  → Waiting for services to start"
    sleep 3
    
    echo "  → Checking container status"
    docker ps | grep -E "posthog-mcp|googleads-mcp|intercom-mcp|nginx-mcp"
ENDSSH

echo "✅ Step 5: Testing deployment"
echo "  → Testing initialize endpoint"
response=$(curl -s -X POST "https://mcp.timelinesaitech.com/" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}')

if echo "$response" | grep -q '"tools"'; then
    echo "  ✅ Server is responding with tools array"
else
    echo "  ❌ Server response missing tools array"
    echo "  Response: $response"
fi

echo "  → Testing SSE endpoint"
timeout 2 curl -s -N -H "Accept: text/event-stream" https://mcp.timelinesaitech.com/sse | head -1

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Claude Desktop Config (add to claude_desktop_config.json):"
cat << 'EOF'
{
  "mcpServers": {
    "posthog": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://mcp.timelinesaitech.com/",
        "-H", "Content-Type: application/json",
        "--data-binary", "@-"
      ]
    }
  }
}
EOF