# 🚀 Timelines AI MCP Services

Connect Claude Desktop to PostHog analytics and Google Ads through the Model Context Protocol (MCP).

## ✨ What This Does

This enables Claude Desktop to:
- **PostHog**: Access analytics, events, user data, feature flags, and run queries
- **Google Ads**: Manage campaigns, view performance, control keywords and budgets

## 🎯 Quick Setup (For Users)

### Option 1: Clone Repository (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/orkhan-j/timelinesaimcp.git
cd timelinesaimcp

# 2. Get the full path to the directory
pwd  # Copy this path, you'll need it next
```

### Option 2: Download Files Only

```bash
# Download just the proxy files
curl -o ~/posthog-local-proxy.js https://raw.githubusercontent.com/orkhan-j/timelinesaimcp/main/posthog-local-proxy.js
curl -o ~/googleads-local-proxy.js https://raw.githubusercontent.com/orkhan-j/timelinesaimcp/main/googleads-local-proxy.js
```

### Configure Claude Desktop

Find your Claude Desktop config file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this configuration (replace `/path/to/` with your actual path):

```json
{
  "mcpServers": {
    "posthog": {
      "command": "node",
      "args": ["/path/to/timelinesaimcp/posthog-local-proxy.js"]
    },
    "googleads": {
      "command": "node",
      "args": ["/path/to/timelinesaimcp/googleads-local-proxy.js"]
    }
  }
}
```

**Example for Mac users who cloned to home directory:**
```json
{
  "mcpServers": {
    "posthog": {
      "command": "node",
      "args": ["/Users/yourname/timelinesaimcp/posthog-local-proxy.js"]
    },
    "googleads": {
      "command": "node",
      "args": ["/Users/yourname/timelinesaimcp/googleads-local-proxy.js"]
    }
  }
}
```

### Restart Claude Desktop

1. **Completely quit Claude Desktop** (not just close the window)
2. **Reopen Claude Desktop**
3. **Look for the 🔌 icon** in the text input area
4. You should see "posthog" and "googleads" listed

## 🎉 Test It Works!

Try these prompts in Claude:

### PostHog Examples:
- "Show me recent events from PostHog"
- "List all feature flags"
- "Get dashboard metrics"
- "Run a HogQL query to find top users"

### Google Ads Examples:
- "List my Google Ads campaigns"
- "Show campaign performance this week"
- "Get my Google Ads account info"
- "What keywords are in my campaigns?"

## 📊 Available Tools

### PostHog MCP (Analytics)
| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `events-search` | Search and filter events | "Find login events from today" |
| `persons-list` | List users | "Show me recent user signups" |
| `insights-list` | Get analytics | "What are our top insights?" |
| `feature-flags-list` | Manage flags | "List active feature flags" |
| `query-hogql` | Run HogQL queries | "Query users who signed up this week" |
| `dashboards-list` | View dashboards | "Show me all dashboards" |

### Google Ads MCP (Advertising)
| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `campaigns-list` | List campaigns | "Show all active campaigns" |
| `performance-report` | Get metrics | "Campaign performance this month" |
| `keywords-list` | View keywords | "What keywords are we bidding on?" |
| `campaign-pause` | Pause campaigns | "Pause the Brand campaign" |
| `account-info` | Account details | "Get my Google Ads account info" |

## 🛠️ Troubleshooting

### "MCP tools not showing in Claude"
1. **Check Node.js is installed**: Run `node --version` in terminal
2. **Verify file paths**: Make sure the paths in config.json are correct
3. **Restart Claude completely**: Quit from menu, not just close window
4. **Check JSON syntax**: Make sure config file is valid JSON

### "Connection refused" errors
1. Test server: `curl https://mcp.timelinesaitech.com/health`
2. Check internet connection
3. Try running proxy directly: `node /path/to/posthog-local-proxy.js`

### Need Node.js?
Download from https://nodejs.org/ (version 18 or higher)

## 🏗️ Architecture

```
Your Computer                 Our Server (mcp.timelinesaitech.com)
┌─────────────┐              ┌──────────────────────────┐
│   Claude    │              │                          │
│   Desktop   │              │  ┌──────────────────┐   │
│      ↓      │              │  │   PostHog MCP    │   │
│ Local Proxy │ ── HTTPS ──→ │  ├──────────────────┤   │
│  (Node.js)  │              │  │ Google Ads MCP   │   │
└─────────────┘              │  └──────────────────┘   │
                             └──────────────────────────┘
```

## 📚 Documentation

- **[CLIENT-SETUP.md](CLIENT-SETUP.md)** - Detailed setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical documentation
- **[CLAUDE.md](CLAUDE.md)** - Server management (for admins)

## 🔐 Security

- ✅ No API keys stored on your computer
- ✅ All connections use HTTPS encryption
- ✅ Server handles all authentication
- ✅ Read-only access by default

## 🤝 Contributing

Want to add a new MCP service? See [ARCHITECTURE.md](ARCHITECTURE.md) for developer docs.

## 📞 Support

- **Setup issues?** See troubleshooting above
- **Server status:** https://mcp.timelinesaitech.com/health
- **Contact:** Timelines AI team

---

**Built by [Timelines AI](https://timelinesai.com)** | Server Status: 🟢 Online