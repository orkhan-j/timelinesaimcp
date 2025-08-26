# Timelines AI MCP Servers

🚀 **Production-ready Model Context Protocol (MCP) servers** deployed on Cloudflare Workers with **PostHog analytics** and timeline management tools.

## 🌟 Features

### 📦 **Basic MCP Server** (Public Access)
- **Math Tools**: Add and multiply numbers with emoji feedback
- **Timeline Creation**: Create formatted timelines with events and categories
- **Time Functions**: Get current time in any timezone
- **PostHog Integration**: Analytics queries and event tracking
- **No Authentication**: Instant access for anyone

### 🔐 **Authenticated MCP Server** (GitHub OAuth)
- **All Basic Tools**: Enhanced with user context
- **PostHog Analytics**: Feature flags, dashboards, user insights, A/B testing
- **Project Management**: Advanced project timelines with milestones and dependencies
- **Timeline Analytics**: Gap analysis, trends, critical path, resource allocation
- **User Management**: GitHub OAuth with JWT tokens and permissions
- **Private Timelines**: User-specific private timeline creation

## 🚀 Live Servers

### ✅ Deployed and Working
- **Basic Server**: `https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse`
- **Auth Server**: `https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse`
- **Health Checks**: Add `/health` to any URL
- **Server Info**: Visit root URL for tool listings

### 🧪 Quick Test
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse

# Or test API directly
curl -X POST "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

## 🛠️ Available Tools

| Tool | Basic | Auth | Description |
|------|:-----:|:----:|-------------|
| `add(a, b)` | ✅ | ✅ | Add two numbers |
| `multiply(a, b)` | ✅ | ✅ | Multiply two numbers |
| `create_timeline(title, events[])` | ✅ | ✅ | Create timelines |
| `get_current_time(timezone?)` | ✅ | ✅ | Get current time |
| `posthog_query(query)` | ✅ | ✅ | Query PostHog analytics |
| `posthog_events(filters)` | ✅ | ✅ | Get PostHog events |
| `get_user_info()` | ❌ | ✅ | Get authenticated user info |
| `create_project_timeline(...)` | ❌ | ✅ | Project management timelines |
| `analyze_timeline(data, type)` | ❌ | ✅ | Timeline analytics |
| `posthog_feature_flags()` | ❌ | ✅ | Manage PostHog feature flags |
| `posthog_insights(params)` | ❌ | ✅ | Advanced PostHog insights |

**Total**: 6 public tools + 5 authenticated tools = **11 tools**

## 📱 Integration

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "timelines-basic": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse"
      ]
    },
    "timelines-auth": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse"
      ]
    }
  }
}
```

### API Usage Example
```bash
# Create a timeline
curl -X POST "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_timeline",
      "arguments": {
        "title": "Product Launch",
        "events": [
          {"date": "2024-01-15", "title": "Planning Phase"},
          {"date": "2024-03-01", "title": "Development Start"},
          {"date": "2024-06-01", "title": "Beta Release"},
          {"date": "2024-09-01", "title": "Public Launch"}
        ]
      }
    }
  }'
```

## 🔒 Authentication (Optional)

For enhanced features on the authenticated server:

1. **Visit**: `https://timelines-mcp-auth.timelinesaimcp.workers.dev/authorize`
2. **Login**: with your GitHub account
3. **Get Token**: Copy JWT token from success page
4. **Use Token**: Add `?token=YOUR_TOKEN` or `Authorization: Bearer YOUR_TOKEN`

## 🏗️ Development

### Project Structure
```
.
├── timelines-mcp-basic/     # Public MCP server
├── timelines-mcp-auth/      # Authenticated MCP server
├── deploy.sh               # Deployment automation
├── SETUP_GUIDE.md         # Complete setup instructions
└── README.md              # This file
```

### Local Development
```bash
# Clone the repository
git clone https://github.com/orkhan-j/timelinesaimcp.git
cd timelinesaimcp

# Install dependencies for basic server
cd timelines-mcp-basic
npm install
npm run dev

# Install dependencies for auth server
cd ../timelines-mcp-auth
npm install
npm run dev
```

### Deployment
```bash
# Deploy both servers
./deploy.sh

# Or deploy individually
cd timelines-mcp-basic && npx wrangler deploy
cd timelines-mcp-auth && npx wrangler deploy
```

## 📊 Performance

- ⚡ **Response Time**: < 200ms globally
- 🌍 **Global CDN**: Cloudflare Workers edge network
- 📈 **Scalability**: 100,000+ requests/day
- 🔄 **Uptime**: 99.9% SLA
- 🔒 **Security**: HTTPS only, CORS enabled

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete deployment guide
- **[DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)** - Test results and URLs
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Detailed technical overview
- **[claude.md](claude.md)** - Claude Desktop integration guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and in production
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**🎯 Ready to use?** Start with the [Quick Test](#-quick-test) above or check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for custom domain setup.