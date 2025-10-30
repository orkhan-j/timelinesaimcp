# 🔒 Security Setup Guide - Public Repository

## ⚠️ This Repository is PUBLIC

All code in this repository is publicly accessible. **NEVER commit sensitive data!**

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Public GitHub  │         │  Your Mac (Dev)  │         │  Remote Server  │
│    Repository   │────────▶│  Local Scripts   │────────▶│  mcp.timelines  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
   (NO API Keys)               (NO API Keys)                (API Keys HERE)
```

### What Goes Where:

| Location | Contains | Sensitive Data? |
|----------|----------|-----------------|
| **GitHub (Public)** | Server code, local proxy scripts, package.json | ❌ NO |
| **Your Mac** | Cloned repo, local development | ❌ NO |
| **Remote Server** | Running MCP services with .env files | ✅ YES |

## 📁 File Categories

### ✅ SAFE to Commit (Public)
- All `.js` server and proxy files
- `package.json` and `package-lock.json`
- `docker-compose.yml`
- `nginx.conf`
- Documentation files (`.md`)
- `.env.example` (template only, no real values)

### ❌ NEVER Commit (Keep Private)
- `.env` files (contain API keys)
- `.key`, `.pem`, `.crt` files (SSL certificates)
- Any file with real credentials
- `ssl/` and `certbot/` directories

## 🛠️ Development Workflow

### On Your Mac (Development):
1. Clone the public repo
2. Edit code locally
3. Test changes
4. Commit and push to GitHub

```bash
cd /Users/oj/Downloads/Timelines\ MCP/
git add remote/mcp-gateway/posthog-official-server.js
git commit -m "Update PostHog server"
git push origin main
```

### On Remote Server (Production):
1. Pull latest code from GitHub
2. Copy .env file (not in git) to proper location
3. Restart services

```bash
ssh root@213.182.213.232
cd /opt/mcp-gateway
git pull origin main
# .env file stays on server, not touched by git
docker-compose restart
```

## 🔐 Managing Secrets on Server

### First Time Setup on Server:
```bash
# SSH to server
ssh root@213.182.213.232
cd /opt/mcp-gateway

# Copy the example file
cp remote/mcp-gateway/.env.example remote/mcp-gateway/.env

# Edit with real credentials (use nano or vim)
nano remote/mcp-gateway/.env
```

Add your real API keys:
```env
POSTHOG_API_KEY=phx_YOUR_REAL_KEY_HERE
POSTHOG_PROJECT_ID=60109
GOOGLE_ADS_CLIENT_ID=YOUR_REAL_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET=YOUR_REAL_SECRET
# ... etc
```

### Server .env Location:
```
/opt/mcp-gateway/
├── remote/
│   └── mcp-gateway/
│       ├── .env              ← Real credentials (NOT in git)
│       ├── .env.example      ← Template (IN git, safe)
│       └── posthog-official-server.js
```

## ✅ Safety Checklist

Before committing, always verify:

```bash
# Check what you're about to commit
git status
git diff

# Make sure no .env files are staged
git ls-files | grep .env

# Should only show .env.example files, not .env
```

If you see actual `.env` files (without "example"), **DO NOT COMMIT!**

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate/regenerate all exposed credentials**
2. Remove from git history:
   ```bash
   git rm --cached path/to/secret/file
   git commit -m "Remove accidentally committed secrets"
   git push --force origin main
   ```
3. Update `.gitignore` to prevent it happening again

## 📋 .gitignore Summary

The repository `.gitignore` protects against committing:
- `*.env` (except `.env.example`)
- `*.key`, `*.pem`, `*.crt`
- `ssl/`, `certbot/`, `traefik-certs/` directories

## 🎯 Golden Rules

1. ✅ **Code is public** - Anyone can see it
2. ❌ **Secrets stay private** - Only on the server
3. 🔄 **Use .env.example** - For templates in git
4. 🔐 **Real .env on server** - Never in git
5. 🚫 **Never commit credentials** - Check before pushing
6. 🔄 **Rotate if exposed** - Immediately change leaked keys

## 🆘 Need to Check Something?

### Check if file is tracked by git:
```bash
git ls-files | grep filename
```

### Check current git status:
```bash
git status
```

### See what would be committed:
```bash
git diff --cached
```

## 📞 Questions?

- For security concerns: Contact the team lead
- For setup issues: See CLAUDE.md
- For Windows help: See WINDOWS_SETUP_GUIDE.md

---

**Remember**: When in doubt, DON'T commit. Ask first! 🛡️
