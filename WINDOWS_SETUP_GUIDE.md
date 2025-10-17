# 💻 MCP Services - Windows Setup Guide

## 🎯 Quick Setup for Windows Users

### Step 1: Install Node.js (One-time setup)
1. Open your web browser
2. Go to: **https://nodejs.org**
3. Click the **"Download for Windows"** button (choose LTS version)
4. Double-click the downloaded file
5. Click "Next" on everything (default settings are fine)
6. Click "Install"
7. Click "Finish"

### Step 2: Open Command Prompt
**Method 1 (Easiest):**
1. Click the Windows Start button
2. Type: `cmd`
3. Press Enter

**Method 2:**
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

### Step 3: Run the MCP Service
In the black Command Prompt window, copy and paste this command:
```cmd
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
```
Then press Enter.

**What you should see:**
- Some text will appear
- The service is now running!
- Keep this window open while using the service

## 🔍 How to Copy & Paste in Command Prompt

### To Copy the Command:
1. Highlight the command above with your mouse
2. Press `Ctrl + C`

### To Paste in Command Prompt:
1. Click inside the Command Prompt window
2. **Right-click** with your mouse (this pastes automatically)
3. Press Enter to run

## ❌ Common Windows Issues & Fixes

### "npx is not recognized as a command"
This means Node.js isn't installed:
1. Go back to Step 1
2. Install Node.js
3. **Important**: Close Command Prompt
4. Open a new Command Prompt
5. Try the command again

### "Access Denied" or Permission Errors
1. Close Command Prompt
2. Right-click on Command Prompt
3. Choose **"Run as administrator"**
4. Try the command again

### Windows Defender or Antivirus Warning
- This is normal for command-line tools
- Click **"Allow"** or **"Run anyway"**
- The tool is safe (it's from our company server)

### "Cannot connect" Error
Check if you're behind a company firewall:
1. Connect to company VPN if required
2. Try again
3. If still failing, contact IT to allow: `mcp.timelinesaitech.com`

## 💡 Windows PowerShell (Alternative)

If Command Prompt doesn't work, try PowerShell:
1. Click Start button
2. Type: `powershell`
3. Press Enter
4. Run the same command:
```powershell
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
```

### ⚠️ PowerShell "Scripts Disabled" Error

If you see this error in PowerShell:
```
npx : File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system.
```

**Quick Fix - Use Command Prompt Instead:**
1. Close PowerShell
2. Open Command Prompt (type `cmd` in Start menu)
3. Run the same npx command there

**Alternative Fix - Enable Scripts in PowerShell:**
1. Close PowerShell
2. Right-click Start button
3. Choose **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
4. Type this command and press Enter:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
5. When asked "Do you want to change the execution policy?", type `Y` and press Enter
6. Close the admin PowerShell
7. Open regular PowerShell
8. Try the npx command again

**One-Time Bypass (No Admin Needed):**
If you can't get admin rights, use this command in regular PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -Command "npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse"
```

## 🚀 Pro Tips for Windows

### Create a Desktop Shortcut
1. Right-click on Desktop
2. Select **New → Text Document**
3. Open it and paste:
```batch
@echo off
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
pause
```
4. Save it as **"Start MCP.bat"** (not .txt!)
5. Double-click anytime to start the service

### Pin Command Prompt to Taskbar
1. Open Command Prompt
2. Right-click its icon in the taskbar
3. Select **"Pin to taskbar"**
4. Now it's always one click away!

## ✅ Testing Your Setup

After running the command, you should see something like:
```
Connecting to MCP service...
Connected successfully!
Ready to receive data...
```

If you see this, **YOU'RE DONE!** 🎉

## 🆘 Still Need Help?

### Quick Checklist:
- [ ] Node.js installed? (Step 1)
- [ ] Using Command Prompt or PowerShell? (Step 2)
- [ ] Copied the command correctly? (Step 3)
- [ ] Connected to company network/VPN?

### Get Help:
1. Take a screenshot (Press `Windows + Shift + S`)
2. Send to IT support or dev team
3. Include what step you're stuck on

## 📝 For IT Administrators

If setting up for multiple users:
```batch
# Silent install Node.js
msiexec /i node-v20.14.0-x64.msi /quiet

# Add to PATH (if needed)
setx PATH "%PATH%;C:\Program Files\nodejs"

# Test installation
npm --version
npx --version
```

Firewall requirements:
- Allow outbound HTTPS (443) to `mcp.timelinesaitech.com`
- Allow Node.js through Windows Firewall

---

**Remember**: You only need to install Node.js once. After that, just run the npx command whenever you need the service! 🚀