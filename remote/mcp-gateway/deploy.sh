#!/bin/bash
# Deployment script for MCP Gateway
# Always pull from git and restart services

set -e

echo "🚀 Starting deployment..."

# Navigate to the deployment directory
cd /opt/mcp-gateway

# Pull latest changes from git
echo "📥 Pulling latest changes from git..."
git pull origin main

# Restart Docker containers
echo "🔄 Restarting Docker containers..."
docker-compose down
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check health
echo "🏥 Checking service health..."
curl -s https://mcp.timelinesaitech.com/health || echo "Health check failed"

echo "✅ Deployment complete!"