# 🏗️ Timelines AI MCP Architecture

## Overview

The Timelines AI MCP system provides a bridge between Claude Desktop and various third-party services (PostHog, Google Ads) using the Model Context Protocol (MCP).

## Architecture Diagram

```
┌─────────────────┐
│  Claude Desktop │
│   (Client App)  │
└────────┬────────┘
         │ stdio protocol
         ▼
┌─────────────────┐
│  Local Proxy    │
│  (Node.js)      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   nginx         │
│  (Reverse Proxy)│
│ mcp.timelines...│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│PostHog │ │Google  │
│  MCP   │ │Ads MCP │
│ :8082  │ │ :8083  │
└────────┘ └────────┘
    │         │
    ▼         ▼
[PostHog] [Google Ads]
   API        API
```

## Components

### 1. Local Proxy Scripts

**Location**: `posthog-local-proxy.js`, `googleads-local-proxy.js`

**Purpose**:
- Bridges Claude Desktop (stdio) with remote HTTP endpoints
- Handles MCP protocol translation
- Provides tool definitions locally

**Key Features**:
```javascript
// Handles stdio input from Claude
rl.on('line', async (line) => {
  const request = JSON.parse(line);
  // Routes to appropriate handler
});

// Forwards to remote server
function callRemote(request) {
  // HTTPS request to mcp.timelinesaitech.com
}
```

### 2. Server Components

**Location**: `remote/mcp-gateway/`

**Services**:
- **PostHog MCP** (`posthog-official-server.js`) - Port 8082
- **Google Ads MCP** (`googleads-official-server.js`) - Port 8083

**Key Endpoints**:
- `/sse` - Server-Sent Events endpoint for MCP
- `/sse/message` - Message handling endpoint
- `/health` - Health check

### 3. Infrastructure

**Docker Compose Stack**:
```yaml
services:
  posthog-mcp:    # PostHog service
  googleads-mcp:  # Google Ads service
  nginx:          # Reverse proxy
  certbot:        # SSL certificates
```

**nginx Configuration**:
- Routes `/googleads/*` → googleads-mcp:8083
- Routes `/` (default) → posthog-mcp:8082
- SSL termination with Let's Encrypt

## MCP Protocol Flow

### 1. Initialization
```json
// Claude → Proxy
{"jsonrpc":"2.0","method":"initialize","id":1}

// Proxy → Claude
{"jsonrpc":"2.0","id":1,"result":{
  "capabilities":{"tools":{}},
  "serverInfo":{"name":"...","version":"1.0.0"}
}}
```

### 2. Tool Discovery
```json
// Claude → Proxy
{"jsonrpc":"2.0","method":"tools/list","id":2}

// Proxy → Claude (returns tool definitions)
{"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
```

### 3. Tool Execution
```json
// Claude → Proxy → Server
{"jsonrpc":"2.0","method":"tools/call","params":{
  "name":"campaigns-list",
  "arguments":{}
},"id":3}
```

## Adding New MCP Services

### Step 1: Create Server Component

```javascript
// new-service-server.js
const MCP_TOOLS = [
  {
    name: "tool-name",
    description: "Tool description",
    inputSchema: { /* JSON Schema */ }
  }
];

async function executeTool(toolName, args) {
  // Implementation
}

// HTTP server setup...
```

### Step 2: Create Local Proxy

```javascript
// new-service-proxy.js
const TOOLS = [ /* tool definitions */ ];

// Copy structure from existing proxies
```

### Step 3: Update Infrastructure

```yaml
# docker-compose.yml
new-service-mcp:
  image: node:20-alpine
  # ... configuration
```

```nginx
# nginx.conf
location /newservice {
  proxy_pass http://new-service-mcp:8084;
}
```

### Step 4: Configure Claude Desktop

```json
{
  "mcpServers": {
    "newservice": {
      "command": "node",
      "args": ["path/to/new-service-proxy.js"]
    }
  }
}
```

## Environment Variables

### PostHog
- `POSTHOG_API_KEY` - Personal API key
- `POSTHOG_PROJECT_ID` - Project ID
- `POSTHOG_BASE_URL` - API endpoint

### Google Ads
- `GOOGLE_ADS_CLIENT_ID` - OAuth client ID
- `GOOGLE_ADS_CLIENT_SECRET` - OAuth secret
- `GOOGLE_ADS_REFRESH_TOKEN` - OAuth refresh token
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Developer token
- `GOOGLE_ADS_CUSTOMER_ID` - Account ID

## Security Considerations

1. **API Keys**: Stored server-side only
2. **SSL/TLS**: All external traffic encrypted
3. **Authentication**: OAuth 2.0 for Google Ads
4. **Network**: Docker network isolation
5. **Proxy**: No credentials in local files

## Deployment

### Server Deployment
```bash
# Use the deployment script
./deploy.sh

# Or manually:
git push origin main
ssh root@server "cd /opt/mcp-gateway && git pull && docker-compose up -d"
```

### Client Distribution
1. Users clone the repository
2. Configure Claude Desktop
3. Local proxies connect to remote server
4. No API keys needed client-side

## Monitoring

### Health Checks
```bash
# Server health
curl https://mcp.timelinesaitech.com/health

# Service logs
docker logs posthog-mcp
docker logs googleads-mcp
```

### Debugging

**Local proxy issues:**
```bash
# Run proxy directly to see errors
node posthog-local-proxy.js

# Test with curl
echo '{"jsonrpc":"2.0","method":"initialize","id":1}' | node posthog-local-proxy.js
```

**Server issues:**
```bash
# Check container status
ssh root@server "docker ps"

# View logs
ssh root@server "docker logs [container] --tail 50"
```

## Performance Optimization

1. **Connection Pooling**: Reuse HTTPS connections
2. **Caching**: Local tool definitions
3. **Compression**: gzip enabled in nginx
4. **Load Balancing**: Can scale horizontally

## Future Enhancements

1. **WebSocket Support**: Replace SSE with WebSockets
2. **Multi-tenancy**: User-specific API keys
3. **Rate Limiting**: Prevent abuse
4. **Metrics**: Prometheus/Grafana monitoring
5. **Queue System**: Redis for async operations

---

For setup instructions, see [CLIENT-SETUP.md](CLIENT-SETUP.md)
For server management, see [CLAUDE.md](CLAUDE.md)