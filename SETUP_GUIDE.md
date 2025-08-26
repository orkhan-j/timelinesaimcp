# 🚀 Complete Timelines MCP Server Setup Guide

This guide will walk you through deploying **both** MCP servers to Cloudflare with your custom domain `timelinesaitech.com`.

## 📋 What I've Built for You

### ✅ **Basic MCP Server** (`timelines-mcp-basic/`)
- **Features**: Math tools, timeline creation, current time
- **Authentication**: None (public access)
- **Deployment**: Ready to deploy

### ✅ **Authenticated MCP Server** (`timelines-mcp-auth/`)
- **Features**: All basic tools + project timelines, analytics, user management
- **Authentication**: GitHub OAuth with JWT tokens
- **Deployment**: Needs OAuth setup first

## 🎯 Step-by-Step Execution Plan

### Phase 1: Cloudflare & Domain Setup

#### 1.1 Cloudflare Account Setup
```bash
# If you don't have a Cloudflare account:
# 1. Go to https://cloudflare.com
# 2. Sign up for free account
# 3. Verify email
```

#### 1.2 Add Your Domain
```bash
# In Cloudflare Dashboard:
# 1. Click "Add a site"
# 2. Enter: timelinesaitech.com
# 3. Choose "Free" plan
# 4. Note the nameservers (e.g., alice.ns.cloudflare.com, bob.ns.cloudflare.com)
```

#### 1.3 Update Domain Nameservers
```bash
# At your domain registrar:
# 1. Find DNS/Nameserver settings
# 2. Replace existing nameservers with Cloudflare's
# 3. Save changes
# 4. Wait 1-24 hours for propagation
```

### Phase 2: Deploy Basic MCP Server

#### 2.1 Deploy to Cloudflare Workers
```bash
cd "timelines-mcp-basic"

# Login to Cloudflare
npx wrangler login

# Deploy the server
npx wrangler deploy

# Note the URL you get (e.g., https://timelines-mcp-basic.your-account.workers.dev)
```

#### 2.2 Test Basic Server
```bash
# Replace YOUR_WORKER_URL with your actual URL
export BASIC_SERVER_URL="https://timelines-mcp-basic.your-account.workers.dev"

# Test health
curl "$BASIC_SERVER_URL/health"

# Test server info
curl "$BASIC_SERVER_URL/"

# Test SSE endpoint
curl -N -H "Accept: text/event-stream" "$BASIC_SERVER_URL/sse"
```

### Phase 3: GitHub OAuth Setup

#### 3.1 Create Development OAuth App
```bash
# Go to: https://github.com/settings/developers
# Click "New OAuth App"
# Fill in:
```
- **Application name**: `Timelines MCP (Development)`
- **Homepage URL**: `http://localhost:8787`
- **Authorization callback URL**: `http://localhost:8787/callback`

```bash
# Save and note:
# - Client ID (starts with a letter, ~20 chars)
# - Client Secret (click "Generate new client secret")
```

#### 3.2 Create Production OAuth App
```bash
# Create another OAuth App:
```
- **Application name**: `Timelines MCP (Production)`
- **Homepage URL**: `https://timelines-mcp-auth.your-account.workers.dev`
- **Authorization callback URL**: `https://timelines-mcp-auth.your-account.workers.dev/callback`

```bash
# Save and note the production Client ID and Secret
```

#### 3.3 Configure Development Environment
```bash
cd timelines-mcp-auth

# Copy environment template
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your development OAuth credentials
# Replace YOUR_* with actual values:
```

```env
GITHUB_CLIENT_ID="your-dev-client-id-here"
GITHUB_CLIENT_SECRET="your-dev-client-secret-here"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
ENVIRONMENT="development"
```

### Phase 4: Deploy Authenticated MCP Server

#### 4.1 Set Production Secrets
```bash
cd timelines-mcp-auth

# Set production secrets (you'll be prompted for each)
npx wrangler secret put GITHUB_CLIENT_ID
# Enter your PRODUCTION client ID

npx wrangler secret put GITHUB_CLIENT_SECRET
# Enter your PRODUCTION client secret

npx wrangler secret put JWT_SECRET
# Enter a long random string (32+ characters)
```

#### 4.2 Deploy Authenticated Server
```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Note the URL (e.g., https://timelines-mcp-auth.your-account.workers.dev)
```

#### 4.3 Update Production OAuth App
```bash
# Go back to GitHub OAuth Apps
# Edit your PRODUCTION OAuth app
# Update URLs with your actual worker URL:
```
- **Homepage URL**: `https://timelines-mcp-auth.your-account.workers.dev`
- **Authorization callback URL**: `https://timelines-mcp-auth.your-account.workers.dev/callback`

### Phase 5: Custom Domain Setup (After DNS Propagation)

#### 5.1 Configure Custom Routes
```bash
# In Cloudflare Dashboard:
# Go to: Your Domain → Workers Routes
# Add these routes:
```

| Route Pattern | Worker | Description |
|---------------|--------|-------------|
| `mcp.timelinesaitech.com/*` | `timelines-mcp-basic` | Basic MCP Server |
| `mcp-auth.timelinesaitech.com/*` | `timelines-mcp-auth` | Authenticated MCP Server |

#### 5.2 Add DNS Records
```bash
# In Cloudflare Dashboard:
# Go to: Your Domain → DNS → Records
# Add these CNAME records:
```

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | `mcp` | `timelines-mcp-basic.your-account.workers.dev` | Proxied (🧡) |
| CNAME | `mcp-auth` | `timelines-mcp-auth.your-account.workers.dev` | Proxied (🧡) |

### Phase 6: Testing Everything

#### 6.1 Test Basic Server (No Auth)
```bash
# Test with custom domain
curl "https://mcp.timelinesaitech.com/health"
curl "https://mcp.timelinesaitech.com/"

# Test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: https://mcp.timelinesaitech.com/sse
```

#### 6.2 Test Authenticated Server
```bash
# Test health
curl "https://mcp-auth.timelinesaitech.com/health"

# Start authentication flow
open "https://mcp-auth.timelinesaitech.com/authorize"
# Complete GitHub login
# Copy JWT token from success page

# Test with token
export YOUR_TOKEN="paste-your-jwt-token-here"
curl -H "Authorization: Bearer $YOUR_TOKEN" "https://mcp-auth.timelinesaitech.com/sse"

# Or test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: https://mcp-auth.timelinesaitech.com/sse?token=YOUR_TOKEN
```

### Phase 7: Claude Desktop Integration

#### 7.1 Basic Server Configuration
```json
{
  "mcpServers": {
    "timelines-basic": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.timelinesaitech.com/sse"
      ]
    }
  }
}
```

#### 7.2 Authenticated Server Configuration
```json
{
  "mcpServers": {
    "timelines-auth": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-auth.timelinesaitech.com/sse?token=YOUR_JWT_TOKEN"
      ]
    }
  }
}
```

## 🔧 Quick Deployment Scripts

### Deploy Both Servers Script
```bash
#!/bin/bash
# save as: deploy-mcp-servers.sh

echo "🚀 Deploying Timelines MCP Servers..."

# Deploy basic server
echo "📦 Deploying basic server..."
cd timelines-mcp-basic
npx wrangler deploy
cd ..

# Deploy auth server
echo "🔐 Deploying authenticated server..."
cd timelines-mcp-auth
npx wrangler deploy
cd ..

echo "✅ Deployment complete!"
echo "🔗 Basic Server: https://timelines-mcp-basic.your-account.workers.dev"
echo "🔒 Auth Server: https://timelines-mcp-auth.your-account.workers.dev"
```

### Test Script
```bash
#!/bin/bash
# save as: test-servers.sh

echo "🧪 Testing MCP Servers..."

# Test basic server
echo "Testing basic server..."
curl -s "https://mcp.timelinesaitech.com/health" && echo " ✅ Basic server health OK"

# Test auth server
echo "Testing auth server..."
curl -s "https://mcp-auth.timelinesaitech.com/health" && echo " ✅ Auth server health OK"

echo "🎯 Manual tests:"
echo "1. Visit: https://mcp-auth.timelinesaitech.com/authorize"
echo "2. Run: npx @modelcontextprotocol/inspector@latest"
echo "3. Connect to: https://mcp.timelinesaitech.com/sse"
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### DNS Not Propagating
```bash
# Check DNS propagation
dig mcp.timelinesaitech.com
nslookup mcp.timelinesaitech.com

# If not working after 24 hours, check:
# 1. Nameservers set correctly at registrar
# 2. CNAME records in Cloudflare
# 3. Worker routes configured
```

#### OAuth Errors
```bash
# Common fixes:
# 1. Check callback URLs match exactly (no trailing slashes)
# 2. Verify client ID/secret are for correct environment
# 3. Ensure secrets are set in production worker
# 4. Check redirect URIs in GitHub app settings
```

#### Token Issues
```bash
# Generate new JWT secret:
openssl rand -base64 32

# Clear and reset secrets:
npx wrangler secret delete JWT_SECRET
npx wrangler secret put JWT_SECRET
```

## 📊 Expected Results

After completing all steps, you should have:

### ✅ Basic MCP Server
- **URL**: `https://mcp.timelinesaitech.com/sse`
- **Features**: Math, basic timelines, time lookup
- **Authentication**: None required

### ✅ Authenticated MCP Server  
- **URL**: `https://mcp-auth.timelinesaitech.com/sse`
- **Features**: All basic + project management, analytics
- **Authentication**: GitHub OAuth required

### ✅ Tools Available
- **Public**: 4 tools (add, multiply, create_timeline, get_current_time)
- **Authenticated**: 7 tools (+ get_user_info, create_project_timeline, analyze_timeline)

## 🎯 Next Steps After Completion

1. **Share your servers** with team members
2. **Create project timelines** for your business
3. **Analyze existing timelines** for insights  
4. **Integrate with Claude Desktop** for AI assistance
5. **Build custom MCP clients** for specific workflows

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Test each component individually
4. Review Cloudflare and GitHub logs

**🎉 Ready to start? Begin with Phase 1: Cloudflare & Domain Setup!**