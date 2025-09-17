# 🚀 Timelines AI MCP Client Setup Guide

Welcome to the Timelines AI MCP (Model Context Protocol) services! This guide will help you connect to our PostHog and Google Ads MCP servers from your Claude Desktop app.

## 📋 Prerequisites

- **Claude Desktop** app installed on your computer
- **Node.js** installed (version 18 or higher)
- **Git** installed on your system

## 🎯 Available MCP Services

We provide two MCP services:
1. **PostHog MCP** - Analytics and product metrics
2. **Google Ads MCP** - Campaign management and reporting

## 🔧 Setup Instructions

### Step 1: Clone the Repository

```bash
# Clone the repository to your local machine
git clone https://github.com/orkhan-j/timelinesaimcp.git
cd timelinesaimcp
```

### Step 2: Configure Claude Desktop

Find your Claude Desktop configuration file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the following to your `claude_desktop_config.json`:

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

⚠️ **Important**: Replace `/path/to/timelinesaimcp` with the actual path where you cloned the repository.

Example for Mac users:
```json
{
  "mcpServers": {
    "posthog": {
      "command": "node",
      "args": ["/Users/yourname/Projects/timelinesaimcp/posthog-local-proxy.js"]
    },
    "googleads": {
      "command": "node",
      "args": ["/Users/yourname/Projects/timelinesaimcp/googleads-local-proxy.js"]
    }
  }
}
```

### Step 3: Test the Connection

1. **Restart Claude Desktop** (completely quit and reopen)
2. Start a new conversation
3. Look for the 🔌 icon in the text input area
4. You should see "posthog" and "googleads" listed as available tools

### Step 4: Verify Setup

Test each service with these commands:

**For PostHog:**
```
"Show me recent events from PostHog"
"Get PostHog project statistics"
"List feature flags in PostHog"
```

**For Google Ads:**
```
"List my Google Ads campaigns"
"Show campaign performance metrics"
"Get Google Ads account information"
```

## 📊 Using PostHog MCP

The PostHog MCP provides these capabilities:

### Available Tools:
- `events-search` - Search and filter events
- `persons-list` - List and search users
- `insights-list` - Get analytics insights
- `feature-flags-list` - Manage feature flags
- `cohorts-list` - View user cohorts
- `dashboards-list` - Access dashboards
- `experiments-list` - View A/B tests
- `annotations-list` - View annotations
- `query-hogql` - Run HogQL queries

### Example Prompts:
```
"Show me user sign-up events from the last 7 days"
"What are our top feature flags?"
"Run a HogQL query to find our most active users"
"Show me the conversion funnel for onboarding"
```

## 🎯 Using Google Ads MCP

The Google Ads MCP provides these capabilities:

### Available Tools:
- `campaigns-list` - List all campaigns
- `campaign-create` - Create new campaigns
- `campaign-pause` - Pause campaigns
- `campaign-enable` - Enable campaigns
- `ad-groups-list` - List ad groups
- `keywords-list` - View keywords
- `keyword-add` - Add new keywords
- `performance-report` - Get performance metrics
- `account-info` - Account information
- `search-terms-report` - Search terms analysis

### Example Prompts:
```
"Show me all active Google Ads campaigns"
"What's my campaign performance this week?"
"Pause the Brand Awareness campaign"
"Add keyword 'enterprise software' to my ad group"
```

## 🛠️ Troubleshooting

### Issue: MCP servers not showing in Claude

**Solution:**
1. Make sure Claude Desktop is completely closed (check system tray)
2. Verify your config file path is correct
3. Check that the proxy files exist in your cloned repository
4. Restart Claude Desktop

### Issue: "Connection refused" errors

**Solution:**
1. Check your internet connection
2. Verify the server is accessible: `curl https://mcp.timelinesaitech.com/health`
3. Try running the proxy directly to see errors:
   ```bash
   node /path/to/timelinesaimcp/posthog-local-proxy.js
   ```

### Issue: "Command not found: node"

**Solution:**
Install Node.js from https://nodejs.org/ (version 18 or higher)

### Issue: Authentication errors

**Solution:**
The servers use pre-configured API keys. If you're getting auth errors, contact the Timelines AI team.

## 🔐 Security Notes

- The proxy scripts run locally on your machine
- They connect securely to our servers via HTTPS
- No credentials are stored on your local machine
- All API keys are managed server-side

## 📞 Support

If you encounter any issues:
1. Check this troubleshooting guide
2. Try restarting Claude Desktop
3. Contact the Timelines AI team

## 🎉 Success Checklist

- [ ] Repository cloned successfully
- [ ] Claude Desktop config updated with correct paths
- [ ] Claude Desktop restarted
- [ ] MCP tools visible in Claude (🔌 icon)
- [ ] PostHog commands working
- [ ] Google Ads commands working

---

**Enjoy using Timelines AI MCP services!** 🚀

For developers who want to contribute or understand the architecture, see [ARCHITECTURE.md](ARCHITECTURE.md)