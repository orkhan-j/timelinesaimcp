# Timelines AI MCP Servers

Local Model Context Protocol (MCP) servers for Timelines AI, running on your own infrastructure.

## 🚀 Current MCP Servers

### PostHog Analytics MCP
- **Domain**: `mcp.timelinesaitech.com`
- **Status**: ✅ Running
- **Features**: Feature flags, insights, experiments, dashboards
- **Endpoint**: `https://mcp.timelinesaitech.com/sse`

## 🛠️ Server Infrastructure

- **Server**: Ubuntu 22.04 LTS
- **IP**: 213.182.213.232
- **Reverse Proxy**: Traefik v3.0
- **SSL**: Self-signed certificates
- **Containerization**: Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Domain pointing to server IP
- PostHog API credentials

## 🚀 Quick Start

### 1. Server Setup
```bash
# SSH to server
ssh root@213.182.213.232

# Navigate to MCP gateway
cd /opt/mcp-gateway

# Check status
docker compose ps

# View logs
docker compose logs posthog-mcp
```

### 2. Claude Desktop Configuration
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "posthog-mcp-timelines": {
      "command": "/Users/oj/.nvm/versions/node/v20.14.0/bin/npx",
      "args": [
        "--yes",
        "mcp-remote@latest",
        "https://mcp.timelinesaitech.com/sse"
      ]
    }
  }
}
```

### 3. Test Connection
```bash
# Health check
curl -k https://mcp.timelinesaitech.com/health

# Test MCP tools
curl -k -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  https://mcp.timelinesaitech.com/
```

## 🔧 Available Tools

- `feature-flag-get-all` - Get all feature flags
- `create-feature-flag` - Create new feature flags
- `insights-get-all` - Get project insights
- `experiment-get-all` - Get experiments
- `dashboards-get-all` - Get dashboards
- `get-sql-insight` - Query data (placeholder)

## 🐛 Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - Use `-k` flag with curl for testing
   - Configure proper SSL certificates in production

2. **API Authentication Errors**
   - Verify PostHog API key permissions
   - Check project ID is correct

3. **Connection Timeouts**
   - Verify domain DNS resolution
   - Check server firewall settings

### Logs
```bash
# PostHog MCP logs
docker logs mcp-gateway-posthog-mcp-1

# Traefik logs
docker logs mcp-gateway-traefik-1
```

## 🔒 Security

- API keys stored in environment variables
- CORS enabled for MCP clients
- Reverse proxy with SSL termination
- Containerized services

## 📝 Environment Variables

```bash
POSTHOG_API_KEY=your_api_key_here
POSTHOG_PROJECT_ID=your_project_id_here
POSTHOG_BASE_URL=https://app.posthog.com
```

## 🚀 Deployment

The MCP servers are automatically deployed using Docker Compose:

```bash
cd /opt/mcp-gateway
docker compose up -d
```

## 📞 Support

For issues or questions:
1. Check server logs
2. Verify domain configuration
3. Test endpoints manually
4. Check PostHog API credentials

---

**Note**: This setup uses your own server infrastructure instead of Cloudflare Workers for better control and customization.