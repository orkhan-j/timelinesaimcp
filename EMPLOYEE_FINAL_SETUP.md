# ✨ Timelines AI PostHog Integration for Claude Desktop

## 30-Second Setup

### Copy this entire configuration:

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-posthog"],
      "env": {
        "POSTHOG_API_KEY": "phx_iIF5hADxEPntazhzFRqV8OZibiV4qJdFt16w8nbv6Ty4utq",
        "POSTHOG_PROJECT_ID": "60109",
        "POSTHOG_BASE_URL": "https://eu.posthog.com"
      }
    }
  }
}
```

### Paste it here:

**Mac Users:**
1. Press `Cmd + Space`, type "Terminal", press Enter
2. Copy and run this command:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```
3. Replace the entire file content with the configuration above
4. Save (Cmd + S) and close
5. Restart Claude Desktop

**Windows Users:**
1. Press `Win + R`
2. Type: `notepad %APPDATA%\Claude\claude_desktop_config.json`
3. Press Enter
4. Replace the entire file content with the configuration above
5. Save (Ctrl + S) and close
6. Restart Claude Desktop

## ✅ Test It Works

Ask Claude: **"Can you check my PostHog insights?"**

Claude should respond with information about your PostHog data.

## 🎯 What You Can Now Do

- "Show me all feature flags"
- "Get my analytics insights" 
- "Show me my dashboards"
- "Create a feature flag called test-feature"
- "Get all experiments"

## ❓ Quick Troubleshooting

**"Claude doesn't have access to PostHog"**
→ Make sure you completely quit Claude Desktop (not just close the window) and restart it

**Still not working?**
→ Screenshot any error and send to IT support

---

That's it! You're connected to Timelines AI PostHog analytics in Claude. 🚀