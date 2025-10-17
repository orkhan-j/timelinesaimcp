# Quick Fix for PowerShell Script Error

## The Error You're Seeing
```
npx : File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system.
```

## Fastest Solution (Takes 30 seconds)

### Option 1: Use Command Prompt Instead
1. Close PowerShell
2. Click Windows Start button
3. Type: **cmd**
4. Press Enter
5. In the Command Prompt window, run:
```cmd
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
```

This will work immediately - no settings needed!

### Option 2: Fix PowerShell (One-Time Setup)
1. Close PowerShell
2. Right-click the Windows Start button
3. Click **"Terminal (Admin)"** or **"Windows PowerShell (Admin)"**
4. Copy and paste this command:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
5. When asked "Do you want to change the execution policy?", type **Y** and press Enter
6. Close the admin window
7. Open regular PowerShell and try the npx command again

### Option 3: One-Time Bypass (If No Admin Access)
In regular PowerShell, use this command:
```powershell
powershell -ExecutionPolicy Bypass -Command "npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse"
```

## Why This Happens
Windows PowerShell has a security feature that blocks running scripts by default. This prevents potentially harmful scripts from running, but it also blocks legitimate tools like npx.

Command Prompt (cmd) doesn't have this restriction, which is why Option 1 works immediately.

## For Claude Desktop Configuration

Your Claude Desktop config file should use Command Prompt to avoid this issue:

**Location:** `%APPDATA%\Claude\claude_desktop_config.json`

### Windows Configuration (Works Same as Mac)

**File Location:** `%APPDATA%\Claude\claude_desktop_config.json`

**Copy this exact config:**
```json
{
  "mcpServers": {
    "timelines-mcp": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse"
      ]
    }
  }
}
```

**That's it!** This connects to the same cloud server that works on Mac. Just uses `cmd.exe` to avoid the PowerShell script error.

**To apply:**
1. Open File Explorer
2. Paste in address bar: `%APPDATA%\Claude`
3. Create/edit `claude_desktop_config.json`
4. Paste the config above
5. Save and restart Claude Desktop

## Testing the Connection

After running one of the solutions above, test with:
```cmd
curl -H "Accept: text/event-stream" https://mcp.timelinesaitech.com/sse
```

You should see:
```
event: endpoint
data: /message
```

This means the MCP server is working correctly!
 
