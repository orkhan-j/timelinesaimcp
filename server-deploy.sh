#!/bin/bash

# Server deployment script for Timelines MCP
SERVER_IP="213.182.213.232"
SERVER_USER="root"

echo "🚀 Deploying PostHog MCP to server..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    
    echo "📦 Pulling latest code from Git..."
    
    # Check if repo exists, clone if not
    if [ ! -d "/opt/timelinesaimcp" ]; then
        cd /opt
        git clone https://github.com/orkhan-j/timelinesaimcp.git
    fi
    
    cd /opt/timelinesaimcp
    git pull origin main
    
    echo "🔧 Setting up MCP Gateway..."
    
    # Create mcp-gateway directory if not exists
    mkdir -p /opt/mcp-gateway
    
    # Copy all necessary files
    cp -r remote/mcp-gateway/* /opt/mcp-gateway/
    
    cd /opt/mcp-gateway
    
    echo "🐳 Starting Docker services..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Start services with PostHog configuration
    docker-compose up -d posthog-official-mcp traefik
    
    # Wait for services to start
    sleep 10
    
    echo "✅ Checking service status..."
    docker-compose ps
    
    # Test the health endpoint
    echo ""
    echo "🔍 Testing health endpoint..."
    curl -s http://localhost:8082/health && echo " - PostHog server is running!" || echo " - PostHog server failed to start"
    
    echo ""
    echo "📊 Docker logs (last 20 lines):"
    docker-compose logs --tail=20 posthog-official-mcp
    
    echo ""
    echo "✨ Deployment complete!"
    echo ""
    echo "Service URLs:"
    echo "  - Health: https://mcp.timelinesaitech.com/health"
    echo "  - SSE: https://mcp.timelinesaitech.com/sse"
ENDSSH

echo ""
echo "🎉 Deployment finished!"
echo ""
echo "Test the deployment:"
echo "  curl -k https://mcp.timelinesaitech.com/health"