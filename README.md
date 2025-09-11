# MCP Servers for Timelines AI

Model Context Protocol (MCP) servers that enable Claude Desktop to interact with PostHog analytics and Google Ads platforms.

## 🚀 Quick Setup for Team Members

### Step 1: Get the Local Proxies

```bash
# Download PostHog proxy
curl -o ~/posthog-local-proxy.js https://raw.githubusercontent.com/orkhan-j/timelinesaimcp/main/posthog-local-proxy.js
chmod +x ~/posthog-local-proxy.js

# Download Google Ads proxy
curl -o ~/googleads-local-proxy.js https://raw.githubusercontent.com/orkhan-j/timelinesaimcp/main/googleads-local-proxy.js
chmod +x ~/googleads-local-proxy.js
```

### Step 2: Configure Claude Desktop

Add this to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "posthog": {
      "command": "node",
      "args": ["~/posthog-local-proxy.js"]
    },
    "googleads": {
      "command": "node",
      "args": ["~/googleads-local-proxy.js"]
    }
  }
}
```

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop. You should now see both PostHog and Google Ads tools available!

## ✅ Available Tools

### PostHog Tools
- **dashboards-get-all** - Get all dashboards for the project
- **dashboard-create** - Create a new dashboard
- **insights-get-all** - Get all insights
- **feature-flag-get-all** - Get all feature flags  
- **get-sql-insight** - Query project data using natural language

### Google Ads Tools
- **campaigns-list** - List all campaigns in the account
- **campaign-create** - Create a new campaign
- **campaign-pause** - Pause a campaign
- **campaign-enable** - Enable a paused campaign
- **ad-groups-list** - List ad groups in a campaign
- **keywords-list** - List keywords in an ad group
- **keyword-add** - Add keywords to an ad group
- **performance-report** - Get performance metrics
- **account-info** - Get Google Ads account information

## 🏗️ How It Works

```
Your Computer                    Remote Server
┌─────────────┐                 ┌──────────────────┐
│   Claude    │                 │                  │
│   Desktop   │                 │  213.182.213.232 │
│      ↓      │                 │                  │
│ Local Proxy │ ───── HTTPS ───→│  nginx → Docker  │
│  (Node.js)  │                 │   PostHog MCP    │
└─────────────┘                 └──────────────────┘
```

## 🐛 Troubleshooting

### Tools don't appear in Claude Desktop
1. Make sure Node.js is installed: `node --version`
2. Verify the proxy file exists: `ls ~/posthog-local-proxy.js`
3. Check the config file syntax is valid JSON
4. Completely restart Claude Desktop (quit from menu, not just close window)

### Connection errors
1. Test server is running: `curl https://mcp.timelinesaitech.com/`
2. Check your internet connection
3. Contact admin if persistent issues

## 🔧 For Administrators

### Server Management

**Server:** mcp.timelinesaitech.com (213.182.213.232)

### Deployment (Always Use Script!)

```bash
cd /path/to/project
./deploy.sh
```

### Manual Deployment (Emergency Only)

```bash
# Local: Commit and push
git add .
git commit -m "Your changes"
git push origin main

# Server: Pull and sync
ssh root@213.182.213.232
cd /opt/mcp-gateway
git pull origin main

# CRITICAL: Sync files to Docker mount points
cp remote/mcp-gateway/posthog-official-server.js posthog-official-server.js
cp remote/mcp-gateway/nginx.conf nginx.conf

# Restart
docker-compose down && docker-compose up -d
```

### Monitoring

```bash
# Check logs
ssh root@213.182.213.232 "docker logs posthog-mcp --tail 50"

# Test server
curl -X POST https://mcp.timelinesaitech.com/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## 📁 Project Structure

```
/
├── posthog-local-proxy.js          # PostHog local proxy for Claude Desktop
├── googleads-local-proxy.js        # Google Ads local proxy for Claude Desktop
├── deploy.sh                        # Deployment script
├── remote/mcp-gateway/
│   ├── posthog-official-server.js  # PostHog server code
│   ├── googleads-official-server.js # Google Ads server code
│   ├── docker-compose.yml          # Docker configuration
│   └── nginx.conf                  # Nginx configuration
├── README.md                        # This file
└── CLAUDE.md                        # Development instructions
```

## 🔒 Security

- API keys stored on server only (not local)
- All communication uses HTTPS
- Local proxies have no credentials
- Each service runs in isolated Docker container

## 📞 Support

**Issues?** Check logs or contact admin team.

**Server Status:** https://mcp.timelinesaitech.com/

---

**Current Services:**
- **PostHog**: Project 60109 (EU region) - https://eu.posthog.com
- **Google Ads**: Requires configuration with customer ID and credentials