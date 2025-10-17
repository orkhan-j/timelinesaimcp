# 🚀 MCP Services - Team Setup Guide (Super Simple!)

## What You Need to Know
Our MCP service helps you analyze PostHog data. Think of it as a smart assistant that can fetch and analyze your product analytics.

## 🎯 Quick Setup (5 minutes!)

### Step 1: Install the MCP Client
Open your Terminal app and paste this command:
```bash
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
```
That's it! The service will start running.

### Step 2: What You Can Do
Once connected, you can ask questions like:
- "Show me today's user activity"
- "What are the top events this week?"
- "Get me the feature flags status"
- "Show me user engagement metrics"

## 🔧 If Something Goes Wrong

### "Connection Failed" Error
Try this command instead:
```bash
curl -N -H "Accept: text/event-stream" https://mcp.timelinesaitech.com/sse
```
If you see data flowing, the service is working!

### "Command Not Found" Error
You need to install Node.js first:
1. Go to https://nodejs.org
2. Click the big green "Download" button
3. Install it like any other app
4. Try Step 1 again

## 💡 Pro Tips for Non-Developers

### Using Terminal (Mac)
1. Press `Cmd + Space`
2. Type "Terminal"
3. Press Enter
4. Copy and paste the commands above

### Using Command Prompt (Windows)
1. Press `Windows + R`
2. Type "cmd" (NOT PowerShell!)
3. Press Enter
4. Copy and paste the commands above

**IMPORTANT for Windows:** If you accidentally opened PowerShell and see an error about "scripts disabled", just close it and use Command Prompt (cmd) instead. See `Windows-quick.md` for the full fix.




 
## ✅ You're Done!
If you can run the command in Step 1 and see data, you're all set! No need to understand how it works - just use it!

---

**Remember**: You don't need to understand the technical stuff. If the command works, you're good to go! 🎉