# 🔧 Troubleshooting "Could not authenticate request" Error

## ✅ Server Status: Working!
The MCP server at `mcp.timelinesaitech.com` is running and Google Ads authentication is valid.

If you're seeing "Could not authenticate request" error, the issue is with your **local setup**, not the server.

## 🎯 Quick Fixes (Try These First)

### Fix 1: Restart Claude Desktop Completely
1. **Quit Claude Desktop** (don't just close the window)
   - Windows: Right-click Claude in system tray → Quit
   - Or: Alt+F4 when Claude is focused
2. **Wait 5 seconds**
3. **Start Claude Desktop again**
4. **Try the command again**

### Fix 2: Verify File Paths in Config

1. Open File Explorer
2. Paste in address bar: `%APPDATA%\Claude`
3. Open `claude_desktop_config.json`
4. **Check your config looks like this:**

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": ["C:\\Users\\YourWindowsUsername\\Downloads\\Timelines MCP\\googleads-local-proxy.js"]
    }
  }
}
```

**Common Mistakes:**
- ❌ Single backslashes: `C:\Users\...`
- ✅ Double backslashes: `C:\\Users\\...`
- ❌ Wrong username
- ❌ Wrong file location

### Fix 3: Test the Script Manually

Open Command Prompt and run:

```cmd
cd "C:\Users\YourWindowsUsername\Downloads\Timelines MCP"
node googleads-local-proxy.js
```

**What you should see:**
```
Connecting to remote MCP server...
Connected to MCP gateway
```

**If you see an error:**
- "Cannot find module" → Run `npm install` first
- "node is not recognized" → Install Node.js from https://nodejs.org
- "ECONNREFUSED" → Check your internet connection

### Fix 4: Re-download the Files

Sometimes files get corrupted. Re-download:

1. Go to: https://github.com/orkhan-j/timelinesaimcp
2. Click green "Code" button → "Download ZIP"
3. Extract to `C:\Users\YourWindowsUsername\Downloads\Timelines MCP`
4. Open Command Prompt in that folder:
   ```cmd
   npm install
   ```
5. Update your Claude Desktop config with the correct path
6. Restart Claude Desktop

## 🔍 Detailed Diagnostics

### Check 1: Is Node.js Installed?

```cmd
node --version
npm --version
```

Should show version numbers. If not, install from https://nodejs.org

### Check 2: Are Dependencies Installed?

```cmd
cd "C:\Users\YourWindowsUsername\Downloads\Timelines MCP"
dir node_modules
```

Should show a `node_modules` folder. If not:
```cmd
npm install
```

### Check 3: Can You Reach the Server?

```cmd
curl https://mcp.timelinesaitech.com/health
```

Should show: `{"status":"healthy",...}`

If not:
- Check your internet connection
- Check if company firewall is blocking it
- Try connecting to VPN if required

### Check 4: Test PostHog (Simpler Test)

Try PostHog instead to see if it's a Google Ads-specific issue:

Add to your config:
```json
{
  "mcpServers": {
    "posthog": {
      "command": "node",
      "args": ["C:\\Users\\YourWindowsUsername\\Downloads\\Timelines MCP\\posthog-local-proxy.js"]
    }
  }
}
```

Restart Claude and try: "Show me PostHog dashboards"

If PostHog works but Google Ads doesn't, contact your team lead.

## 🪟 Windows-Specific Issues

### Issue: "Access Denied"
**Solution:**
1. Right-click on the `Timelines MCP` folder
2. Properties → Security → Edit
3. Give your user "Full Control"
4. Click OK

### Issue: Antivirus Blocking
**Solution:**
1. Open Windows Defender Security Center
2. Virus & threat protection → Manage settings
3. Add exclusion → Folder
4. Add: `C:\Users\YourWindowsUsername\Downloads\Timelines MCP`

### Issue: PowerShell Scripts Disabled
**Solution:** Use Command Prompt (`cmd`) instead of PowerShell

## 📋 Complete Setup Checklist

Go through this step by step:

- [ ] Node.js installed (`node --version` works)
- [ ] Files downloaded to correct location
- [ ] `npm install` completed successfully
- [ ] `node_modules` folder exists
- [ ] Claude Desktop config file created
- [ ] File paths use double backslashes (`\\`)
- [ ] Windows username is correct in path
- [ ] Claude Desktop completely restarted (not just closed)
- [ ] Can manually run: `node googleads-local-proxy.js`
- [ ] Internet connection working
- [ ] Can access: https://mcp.timelinesaitech.com/health

## 🆘 Still Not Working?

### What to Send to Your Team:

1. **Screenshot of the error in Claude**
2. **Your Windows username:**
   ```cmd
   echo %USERNAME%
   ```
3. **Output of this command:**
   ```cmd
   node --version
   npm --version
   ```
4. **Your config file location and contents:**
   - Location: `%APPDATA%\Claude\claude_desktop_config.json`
   - Send a screenshot or copy/paste the contents
5. **Output of manual test:**
   ```cmd
   cd "C:\Users\YourUsername\Downloads\Timelines MCP"
   node googleads-local-proxy.js
   ```
   (Let it run for 3 seconds then Ctrl+C, send what it printed)

## 💡 Why It Works for Others But Not You

Common reasons:
1. **Different file location** - They put files in different folder
2. **Didn't restart Claude** - Must quit completely, not just close
3. **Wrong config syntax** - Single vs double backslashes
4. **Missing npm install** - Dependencies not installed
5. **Antivirus blocking** - Windows Defender blocking Node.js

## ✅ Success Looks Like This

When working correctly, you'll see:
1. 🔌 icon in Claude Desktop text input
2. "google-ads" listed when you click it
3. Commands work: "List my Google Ads campaigns"
4. You see campaign data, not authentication errors

---

**Remember:** The server is working fine. This is a local configuration issue. Follow the steps above carefully! 🎯
