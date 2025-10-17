# Intercom MCP Setup Guide

## 🎯 Overview

The Intercom MCP service enables Claude Desktop to securely access and interact with your Intercom data including conversations, contacts, and more.

## 📋 Available Tools

### Universal Tools
1. **search** - Universal search for conversations and contacts using query DSL
2. **fetch** - Retrieve complete details for specific resources by ID

### Direct API Tools
3. **search_conversations** - Search conversations with advanced filtering
4. **get_conversation** - Get a single conversation by ID
5. **search_contacts** - Search contacts by email, domain, or attributes
6. **get_contact** - Get complete contact information

## 🔑 Getting Your Intercom API Token

### Method 1: Access Token (Recommended for Testing)

1. Go to [Intercom Developer Hub](https://app.intercom.com/a/apps/_/developer-hub)
2. Navigate to **Authentication** section
3. Click **Get your Access Token**
4. Copy the token (starts with `dG9rOj...`)

### Method 2: OAuth (Recommended for Production)

For production deployments with multiple users, implement OAuth flow:

1. Create an OAuth app in Intercom Developer Hub
2. Request scopes:
   - `Read and list users and companies`
   - `Read conversations`
3. Implement OAuth authorization flow
4. Store refresh tokens securely

## 🛠️ Server Setup

### Add to .env file on server

```bash
# SSH to server
ssh root@213.182.213.232

# Edit .env file
cd /opt/mcp-gateway
nano .env

# Add this line:
INTERCOM_API_TOKEN=***REMOVED***
```

Replace with your actual token from Intercom.

## 💻 Client Setup (Claude Desktop)

### macOS Configuration

1. Open Claude Desktop config:
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Add the Intercom MCP server:
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
    },
    "intercom": {
      "command": "node",
      "args": ["/path/to/timelinesaimcp/intercom-local-proxy.js"]
    }
  }
}
```

### Windows Configuration

1. Open Claude Desktop config:
```
%APPDATA%\Claude\claude_desktop_config.json
```

2. Add the same configuration with Windows paths:
```json
{
  "mcpServers": {
    "intercom": {
      "command": "node",
      "args": ["C:\\path\\to\\timelinesaimcp\\intercom-local-proxy.js"]
    }
  }
}
```

## 🚀 Deployment

### Deploy the new service:

```bash
cd /Users/oj/Downloads/Timelines\ MCP/
./deploy.sh
```

This will:
1. Commit your changes
2. Push to GitHub
3. Pull changes on server
4. Copy files to Docker mount points
5. Restart all containers including the new Intercom service

### Manual deployment:

```bash
# Local machine - commit and push
cd /Users/oj/Downloads/Timelines\ MCP/
git add .
git commit -m "Add Intercom MCP service"
git push origin main

# Server - deploy
ssh root@213.182.213.232
cd /opt/mcp-gateway
git pull origin main
cp remote/mcp-gateway/intercom-official-server.js intercom-official-server.js
cp remote/mcp-gateway/nginx.conf nginx.conf
cp remote/mcp-gateway/docker-compose.yml docker-compose.yml
docker-compose down
docker-compose up -d
```

## ✅ Testing

### Test the server endpoint:

```bash
# Check health
curl https://mcp.timelinesaitech.com/intercom/health

# Should return: {"status":"healthy","service":"intercom-mcp","timestamp":"..."}
```

### Test with Claude Desktop:

1. Restart Claude Desktop completely
2. Look for the 🔌 icon in the text input area
3. You should see "intercom" listed
4. Try these prompts:

```
- "Search for open conversations in Intercom"
- "Find contacts with email domain example.com in Intercom"
- "Get Intercom conversation details for conversation_123"
- "Show me recent Intercom contacts"
```

## 🔍 Query Examples

### Universal Search Syntax:

```
# Search conversations
object_type:conversations state:open source_type:email

# Search contacts
object_type:contacts email_domain:"example.com"

# With limits
object_type:conversations state:closed limit:20
```

### Using Individual Tools:

**Search Conversations:**
```javascript
{
  "state": "open",
  "source_type": "email",
  "limit": 10
}
```

**Search Contacts:**
```javascript
{
  "email_domain": "example.com",
  "limit": 20
}
```

## 🐛 Troubleshooting

### "API token not configured" error

1. Verify token is set on server:
```bash
ssh root@213.182.213.232
cd /opt/mcp-gateway
cat .env | grep INTERCOM
```

2. Restart the Intercom container:
```bash
docker-compose restart intercom-mcp
docker logs intercom-mcp
```

### Container not starting

```bash
# Check logs
docker logs intercom-mcp

# Check if port 8084 is available
docker ps -a | grep 8084
```

### "Connection refused" from local proxy

1. Test server endpoint directly:
```bash
curl -X POST https://mcp.timelinesaitech.com/intercom \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}'
```

2. Verify nginx routing:
```bash
ssh root@213.182.213.232
docker logs nginx-mcp | grep intercom
```

### Tools not showing in Claude

1. Verify local proxy file exists:
```bash
ls -la /path/to/intercom-local-proxy.js
```

2. Test proxy directly:
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node /path/to/intercom-local-proxy.js
```

3. Check Claude Desktop logs (macOS):
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

## 📊 Monitoring

### Check service status:

```bash
# All services
ssh root@213.182.213.232 "docker ps"

# Intercom service specifically
ssh root@213.182.213.232 "docker ps | grep intercom"

# View logs
ssh root@213.182.213.232 "docker logs intercom-mcp --tail 50"

# Follow logs
ssh root@213.182.213.232 "docker logs intercom-mcp -f"
```

## 🔐 Security Notes

1. **API Token Storage**: Token is stored server-side only in `.env` file
2. **HTTPS Only**: All communication encrypted via SSL
3. **Required Scopes**: Minimal permissions required
   - Read and list users and companies
   - Read conversations
4. **No Client Storage**: Local proxy does not store credentials
5. **Rate Limiting**: Intercom API limits apply (check your plan)

## 📚 API Reference

For detailed Intercom API documentation:
- [Intercom API Docs](https://developers.intercom.com/docs/)
- [Conversations API](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/Conversations/)
- [Contacts API](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/Contacts/)
- [Authentication](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/)

## 🆘 Support

- Server Status: https://mcp.timelinesaitech.com/health
- Intercom Service: https://mcp.timelinesaitech.com/intercom/health
- Architecture Docs: See ARCHITECTURE.md
- Deployment Guide: See CLAUDE.md

---

**Region Availability**: Currently supported in US-hosted Intercom workspaces only.
