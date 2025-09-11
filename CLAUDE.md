# CLAUDE.md - Development & Deployment Guide

## 🚀 MCP Server Deployment Instructions

### Server Details
- **Server IP**: 213.182.213.232
- **Domain**: mcp.timelinesaitech.com
- **Port**: 443 (HTTPS), 80 (HTTP redirect)

### File Structure (Keep it Simple!)
```
/opt/mcp-gateway/
├── docker-compose.yml       # ONLY docker-compose file
├── nginx.conf               # ONLY nginx config file
├── posthog-official-server.js  # Main server code
├── .env                     # Environment variables
├── deploy.sh               # Deployment script
└── certbot/                # SSL certificates
    ├── conf/
    └── www/
```

## 🛠️ Development Workflow

### 1. LOCAL DEVELOPMENT
Always work in: `/Users/oj/Downloads/Timelines MCP/remote/mcp-gateway/`

**Critical Files (DO NOT CREATE DUPLICATES):**
- `docker-compose.yml` - Single Docker configuration
- `nginx.conf` - Single nginx configuration
- `posthog-official-server.js` - Server code

### 2. DEPLOYMENT PROCESS (ALWAYS USE GIT)

**IMPORTANT: Use the deployment script to avoid file sync issues!**

**Automated deployment (RECOMMENDED):**
```bash
cd /Users/oj/Downloads/Timelines\ MCP/
./deploy.sh
```

**Manual deployment (if needed):**
```bash
# Step 1: Commit and push locally
cd /Users/oj/Downloads/Timelines\ MCP/
git add .
git commit -m "Your commit message"
git push origin main

# Step 2: Deploy on server
ssh root@213.182.213.232
cd /opt/mcp-gateway
git pull origin main

# CRITICAL: Sync files from git structure to Docker mount points
cp remote/mcp-gateway/posthog-official-server.js posthog-official-server.js
cp remote/mcp-gateway/nginx.conf nginx.conf
cp remote/mcp-gateway/docker-compose.yml docker-compose.yml

# Restart containers
docker-compose down
docker-compose up -d
```

### 3. TESTING

**Test SSE endpoint:**
```bash
curl -N -H "Accept: text/event-stream" https://mcp.timelinesaitech.com/sse
```

**Test with mcp-remote:**
```bash
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/sse
```

## ⚠️ IMPORTANT RULES

### DO NOT:
- ❌ Create multiple docker-compose files (docker-compose-*.yml)
- ❌ Create multiple nginx configs (nginx-*.conf)
- ❌ Copy files directly with scp (use git pull instead)
- ❌ Edit files directly on server (always edit locally, commit, push, pull)

### ALWAYS:
- ✅ Use single `docker-compose.yml` file
- ✅ Use single `nginx.conf` file
- ✅ Commit changes to git before deploying
- ✅ Use `git pull` on server to get changes
- ✅ Restart containers after pulling changes
- ✅ Test the endpoint after deployment

## 🔧 Common Issues & Fixes

### Issue: SSE returns relative URL instead of full URL
**Solution:** Ensure nginx passes `X-Forwarded-Host` header and server code uses it:
```javascript
const host = req.headers["x-forwarded-host"] || req.headers.host;
const baseUrl = `${scheme}://${host}`;
```

### Issue: Changes not reflected after deployment
**Solution:** 
1. Ensure files are committed to git
2. Pull changes on server: `git pull origin main`
3. Recreate containers: `docker-compose down && docker-compose up -d`
4. Check logs: `docker logs posthog-mcp`

### Issue: HTTPS not working
**Solution:** Check certbot certificates:
```bash
docker exec certbot certbot certificates
```

## 📝 Environment Variables (.env)
```
POSTHOG_API_KEY=phx_xxxxx
POSTHOG_PROJECT_ID=60109
POSTHOG_BASE_URL=https://eu.posthog.com
```

## 🚨 Emergency Commands

**View logs:**
```bash
ssh root@213.182.213.232 "docker logs posthog-mcp --tail 50"
ssh root@213.182.213.232 "docker logs nginx-mcp --tail 50"
```

**Restart everything:**
```bash
ssh root@213.182.213.232 "cd /opt/mcp-gateway && docker-compose restart"
```

**Check running containers:**
```bash
ssh root@213.182.213.232 "docker ps"
```

## 📋 Checklist for Every Change

1. [ ] Edit files locally in `/Users/oj/Downloads/Timelines MCP/remote/mcp-gateway/`
2. [ ] Test changes locally if possible
3. [ ] Commit to git with clear message
4. [ ] Push to remote repository
5. [ ] SSH to server and run `git pull`
6. [ ] Restart Docker containers
7. [ ] Test the endpoint with curl
8. [ ] Verify with mcp-remote client

## 🎯 Golden Rule
**ALWAYS WORK LOCALLY → COMMIT → PUSH → PULL ON SERVER**

Never edit files directly on the server. Always use git for deployment.