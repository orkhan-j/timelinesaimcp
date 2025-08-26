# Claude Desktop Integration Guide

## 🔗 Connecting Timelines MCP Servers to Claude Desktop

This guide shows you how to integrate the deployed Timelines MCP servers with Claude Desktop for AI-powered timeline management and analytics.

## 🚀 Live Server URLs

- **Basic Server**: `https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse`
- **Auth Server**: `https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse`

## ⚡ Quick Setup

### Step 1: Locate Claude Desktop Config

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Add MCP Servers

Replace or create the config file with:

```json
{
  "mcpServers": {
    "timelines-basic": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse"
      ]
    },
    "timelines-auth": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse"
      ]
    }
  }
}
```

### Step 3: Restart Claude Desktop

Restart Claude Desktop to load the new MCP servers.

## 🛠️ Available Tools in Claude

Once connected, you can ask Claude to use these tools:

### 📊 Math & Calculations
- **"Add 25 and 17"** → Uses the `add` tool
- **"Multiply 8 by 12"** → Uses the `multiply` tool

### 📅 Timeline Creation
- **"Create a timeline for my product launch"** → Uses `create_timeline`
- **"Make a project timeline with these milestones..."** → Enhanced timeline tools

### 🕐 Time Functions
- **"What time is it in Tokyo?"** → Uses `get_current_time`
- **"Show me the current time in UTC"** → Time zone conversion

### 🔐 Authentication Features (Auth Server)
- **"Show my user information"** → Uses `get_user_info` (requires login)
- **"Create a project timeline with dependencies"** → Advanced project tools
- **"Analyze this timeline for gaps"** → Timeline analytics

## 🔒 Authentication Setup (Optional)

For enhanced features with the authenticated server:

### Option 1: Token Authentication
1. Visit: `https://timelines-mcp-auth.timelinesaimcp.workers.dev/authorize`
2. Login with GitHub
3. Copy the JWT token
4. Update config with token:

```json
{
  "mcpServers": {
    "timelines-auth": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse?token=YOUR_JWT_TOKEN"
      ]
    }
  }
}
```

## 💬 Example Claude Conversations

### Basic Timeline Creation
```
User: "Create a timeline for launching a new website"

Claude: I'll create a website launch timeline for you using the timeline tool.

[Uses create_timeline tool]

Result: 
📅 Website Launch Timeline

1. Planning Phase - 2024-01-15
2. Design & Development - 2024-02-01
3. Content Creation - 2024-03-15
4. Testing Phase - 2024-04-01
5. Launch Day - 2024-05-01
```

### Advanced Project Management
```
User: "Create a software development project timeline with dependencies"

Claude: I'll create a comprehensive project timeline with milestones and dependencies.

[Uses create_project_timeline tool]

Result:
🚀 Project: Software Development

📋 Description: Complete software development lifecycle
📅 Duration: 2024-01-01 → 2024-06-30
👤 Created by: [Your Name]

## 🎯 Project Milestones

1. 📋 Requirements Gathering - 2024-01-15
   📊 Status: completed
   👤 Owner: Product Team

2. 🔄 Architecture Design - 2024-02-01
   📊 Status: in-progress
   🔗 Dependencies: Requirements Gathering
   👤 Owner: Architecture Team

3. 📋 Development Phase - 2024-03-01
   📊 Status: planned
   🔗 Dependencies: Architecture Design
   👤 Owner: Development Team
```

### Math Operations
```
User: "What's 142 multiplied by 37?"

Claude: I'll calculate that for you.

[Uses multiply tool]

Result: ✖️ The product of 142 and 37 is 5,254
```

## 🧪 Testing Your Setup

### Quick Test Commands
Try these with Claude after setup:

1. **"Add 100 and 50"** - Tests basic math
2. **"What time is it in London?"** - Tests time functions
3. **"Create a simple timeline with 3 events"** - Tests timeline creation
4. **"Show me the available tools"** - Lists all connected tools

### Troubleshooting

#### ❌ "No MCP servers found"
- Check the config file path and syntax
- Restart Claude Desktop
- Ensure `mcp-remote` package is available

#### ❌ "Connection failed"
- Verify the server URLs are correct
- Check internet connection
- Test URLs in browser: they should return JSON

#### ❌ "Tool not found"
- Restart Claude Desktop
- Check the server is responding at `/sse` endpoint
- Verify the config file syntax

### Manual Testing
```bash
# Test server connectivity
curl "https://timelines-mcp-basic.timelinesaimcp.workers.dev/health"

# Test tool listing
curl -X POST "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

## 🎯 Pro Tips

### 1. **Use Natural Language**
- "Create a timeline for my marketing campaign"
- "What's the sum of these numbers: 25, 67, 43?"
- "Show me the current time in different time zones"

### 2. **Combine Tools**
- "Calculate the budget (math) and create a project timeline"
- "Get current time and create a timeline starting today"

### 3. **Save Configurations**
- Keep a backup of your `claude_desktop_config.json`
- Document any custom token configurations

### 4. **Monitor Performance**
- Tools respond in < 200ms globally
- Unlimited usage on public tools
- Rate limiting handled by Cloudflare

## 🚀 Advanced Configuration

### Multiple Environments
```json
{
  "mcpServers": {
    "timelines-dev": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8787/sse"]
    },
    "timelines-prod": {
      "command": "npx",
      "args": ["mcp-remote", "https://timelines-mcp-basic.timelinesaimcp.workers.dev/sse"]
    }
  }
}
```

### Custom Headers (If Needed)
```json
{
  "mcpServers": {
    "timelines-custom": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://timelines-mcp-auth.timelinesaimcp.workers.dev/sse",
        "--header",
        "Authorization:Bearer YOUR_TOKEN"
      ]
    }
  }
}
```

---

## ✅ **Ready to Use!**

After following this guide, you can:
- ✅ Use timeline tools directly in Claude conversations
- ✅ Perform calculations with emoji feedback
- ✅ Get current time in any timezone
- ✅ Create project timelines with dependencies (authenticated)
- ✅ Analyze timelines for insights (authenticated)

**Start a conversation with Claude and try: "Create a timeline for my next project!"**