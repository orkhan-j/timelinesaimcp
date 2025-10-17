# 🚀 Windows Setup Guide - Local MCP Services (PostHog & Google Ads)

## What This Does
You'll be able to use our company's PostHog analytics and Google Ads tools directly in Claude Desktop on Windows.

## 📋 Prerequisites (One-Time Setup)

### 1. Install Node.js
1. Download from: **https://nodejs.org** (choose LTS version)
2. Double-click the installer
3. Click "Next" on everything (defaults are fine)
4. **Important**: Restart your computer after installation

### 2. Install Git for Windows
1. Download from: **https://git-scm.com/download/win**
2. Run the installer
3. Use all default settings
4. This gives you Git Bash (better than Command Prompt)

### 3. Install Claude Desktop
1. Download from: **https://claude.ai/download**
2. Install and sign in with your account

## 📦 Getting the MCP Scripts

### Option A: If you have the files already
Your team lead should share a folder containing:
- `posthog-local-proxy.js`
- `googleads-local-proxy.js`
- `package.json`
- `node_modules` folder

Place this folder in: `C:\Users\YourName\Documents\mcp-services\`

### Option B: Clone from repository
1. Open Git Bash (installed in step 2)
2. Run these commands:
```bash
cd ~/Documents
git clone https://github.com/orkhan-j/timelinesaimcp.git mcp-services
cd mcp-services
npm install
```

## ⚙️ Configure Claude Desktop

### 1. Find Claude's Config File
Open File Explorer and paste this in the address bar:
```
%APPDATA%\Claude
```

### 2. Create/Edit claude_desktop_config.json
Create a new file called `claude_desktop_config.json` if it doesn't exist.

**⚠️ IMPORTANT for PowerShell Users:**
If you're getting a "scripts disabled" error when testing the remote MCP connection, use Command Prompt (cmd) instead of PowerShell. See the troubleshooting section below for details.

Copy and paste this EXACTLY (replace YourName with your Windows username):
```json
{
  "mcpServers": {
    "posthog-analytics": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Documents\\mcp-services\\posthog-local-proxy.js"]
    },
    "google-ads": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Documents\\mcp-services\\googleads-local-proxy.js"]
    }
  }
}
```

**IMPORTANT**:
- Replace `YourName` with your actual Windows username
- Use double backslashes `\\` in the path
- Save the file with `.json` extension (not `.txt`)

### 3. Find Your Windows Username
Not sure of your username?
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `echo %USERNAME%` and press Enter
4. That's your username!

## 🔄 Final Steps

### 1. Restart Claude Desktop
1. Right-click Claude icon in system tray (bottom right)
2. Click "Quit Claude"
3. Start Claude Desktop again

### 2. Verify Setup
In Claude Desktop, type:
```
Can you connect to PostHog and Google Ads services?
```

Claude should show available tools like:
- PostHog: dashboards, insights, feature flags
- Google Ads: campaigns, ad groups, keywords

## 🧪 Test Commands

Try these in Claude Desktop:
- "Show me all PostHog dashboards"
- "List my Google Ads campaigns"
- "Get PostHog insights for this week"

## 🔧 Troubleshooting

### PowerShell "Scripts Disabled" Error
**Error:**
```
npx : File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system.
```

**Solution 1 (Easiest):** Use Command Prompt instead of PowerShell
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Run your npx command in Command Prompt

**Solution 2:** Enable PowerShell scripts (requires admin)
1. Right-click Start → "Terminal (Admin)" or "PowerShell (Admin)"
2. Run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
3. Type `Y` when prompted
4. Close admin window
5. Open regular PowerShell and try again

**Solution 3:** One-time bypass (no admin needed)
```powershell
powershell -ExecutionPolicy Bypass -Command "npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse"
```

### "Cannot find module" Error
Run this in Command Prompt:
```cmd
cd C:\Users\YourName\Documents\mcp-services
npm install
```

### Claude Can't Find the Scripts
1. Check the path in config is correct
2. Make sure to use double backslashes: `\\`
3. Verify files exist at: `C:\Users\YourName\Documents\mcp-services\`

### "Permission Denied" Error
1. Right-click on the `mcp-services` folder
2. Properties → Security → Edit
3. Give "Full Control" to your user account

### Scripts Don't Start
Open Command Prompt and test manually:
```cmd
node C:\Users\YourName\Documents\mcp-services\posthog-local-proxy.js
```
If you see "MCP PostHog Proxy Started", the script works!

## 📁 File Structure You Should Have

```
C:\Users\YourName\Documents\mcp-services\
├── posthog-local-proxy.js
├── googleads-local-proxy.js
├── package.json
└── node_modules\
    └── (dependencies)
```

## 💡 Pro Tips

### Create Desktop Shortcuts
1. Right-click `posthog-local-proxy.js`
2. Send to → Desktop (create shortcut)
3. Now you can test it by double-clicking

### Quick Path Copy
1. Navigate to your mcp-services folder
2. Click the address bar
3. Copy the path
4. When editing config, paste and replace `\` with `\\`

## 🚨 Common Windows Issues

### Antivirus Blocking
- Windows Defender might block Node.js
- Add exception for: `C:\Program Files\nodejs\node.exe`
- Add exception for: `C:\Users\YourName\Documents\mcp-services\`

### Corporate Firewall
These services connect to:
- `https://mcp.timelinesaitech.com` (our server)
- `https://eu.posthog.com` (PostHog API)
- `https://googleads.googleapis.com` (Google Ads)

Ask IT to whitelist these if needed.

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Git installed
- [ ] Claude Desktop installed
- [ ] MCP scripts in Documents folder
- [ ] Config file created with correct paths
- [ ] Claude Desktop restarted
- [ ] Test commands working

## 🆘 Need Help?

1. **Screenshot the error** (Windows + Shift + S)
2. **Check your username** is correct in paths
3. **Verify file locations** match the config
4. **Ask in Slack** #mcp-help channel

---

**Note for IT**: These are local Node.js scripts that proxy API requests. They don't require admin rights or system changes beyond Node.js installation.