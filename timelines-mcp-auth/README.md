# Timelines MCP Server - Authenticated

A secure Model Context Protocol (MCP) server with GitHub OAuth authentication, providing enhanced timeline management and project analysis tools.

## 🔐 Features

### Authentication
- **GitHub OAuth** integration
- **JWT tokens** for secure sessions
- **User permissions** and scoped access
- **Session management** with 24-hour token expiry

### Enhanced Tools (Authenticated Users)
- 🔢 **Math Tools**: Add and multiply with user context
- 📅 **Advanced Timelines**: Create private timelines with categories
- 🚀 **Project Management**: Project timelines with milestones and dependencies
- 📊 **Timeline Analysis**: Gap analysis, trends, critical path, resource allocation
- 👤 **User Management**: Get current user information and permissions

### Public Tools (No Authentication Required)
- Basic math operations
- Simple timeline creation
- Current time lookup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- GitHub account (for OAuth app creation)

### 1. Install Dependencies

```bash
cd timelines-mcp-auth
npm install
```

### 2. Create GitHub OAuth Apps

You need **two** GitHub OAuth Apps - one for development and one for production.

#### Development OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `Timelines MCP (Development)`
   - **Homepage URL**: `http://localhost:8787`
   - **Authorization callback URL**: `http://localhost:8787/callback`
4. Save and note the **Client ID** and **Client Secret**

#### Production OAuth App
1. Create another OAuth App with:
   - **Application name**: `Timelines MCP (Production)`
   - **Homepage URL**: `https://your-worker.your-account.workers.dev`
   - **Authorization callback URL**: `https://your-worker.your-account.workers.dev/callback`

### 3. Configure Environment Variables

#### For Development:
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your GitHub OAuth credentials
```

#### For Production:
```bash
# Set production secrets
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

### 4. Start Development Server

```bash
npm run dev
```

Server will be available at: `http://localhost:8787`

### 5. Deploy to Production

```bash
npm run deploy
```

## 🔑 Authentication Flow

### For Users:
1. **Visit** `/authorize` to start OAuth flow
2. **Login** with GitHub account
3. **Receive** JWT token on successful authentication
4. **Use** token with MCP clients

### For MCP Clients:
```bash
# Option 1: Authorization header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://your-server.com/sse

# Option 2: Query parameter
curl "https://your-server.com/sse?token=YOUR_JWT_TOKEN"
```

## 🛠️ Available Tools

### Public Tools (No Auth Required)
- `add(a, b)` - Add two numbers
- `multiply(a, b)` - Multiply two numbers  
- `create_timeline(title, events[])` - Basic timeline creation
- `get_current_time(timezone?)` - Get current time

### Authenticated Tools (Login Required)
- `get_user_info()` - Get current user details
- `create_timeline(title, events[], isPrivate?)` - Enhanced timelines with privacy
- `create_project_timeline(projectName, startDate, endDate, milestones[])` - Project management
- `analyze_timeline(timelineData, analysisType)` - Advanced timeline analysis

## 📊 Usage Examples

### Authentication
```bash
# 1. Get authentication URL
curl https://your-server.com/authorize

# 2. Complete OAuth flow in browser
# 3. Copy JWT token from success page

# 4. Use token with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: https://your-server.com/sse?token=YOUR_TOKEN
```

### Project Timeline Example
```json
{
  "name": "create_project_timeline",
  "arguments": {
    "projectName": "Website Redesign",
    "description": "Complete redesign of company website",
    "startDate": "2024-01-15",
    "endDate": "2024-06-30",
    "milestones": [
      {
        "name": "Requirements Gathering",
        "date": "2024-02-01",
        "description": "Collect and document all requirements",
        "owner": "Product Team",
        "status": "completed"
      },
      {
        "name": "Design Phase",
        "date": "2024-03-15",
        "description": "Create mockups and prototypes",
        "dependencies": ["Requirements Gathering"],
        "owner": "Design Team",
        "status": "in-progress"
      },
      {
        "name": "Development Phase",
        "date": "2024-05-01",
        "description": "Implement the new design",
        "dependencies": ["Design Phase"],
        "owner": "Dev Team",
        "status": "planned"
      }
    ]
  }
}
```

### Timeline Analysis Example
```json
{
  "name": "analyze_timeline",
  "arguments": {
    "timelineData": "{\\"events\\": [...]}",
    "analysisType": "critical-path"
  }
}
```

## 🔧 Configuration

### Environment Variables
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret  
- `JWT_SECRET` - Secret for JWT token signing (min 32 chars)
- `ENVIRONMENT` - "development" or "production"

### User Permissions
Default permissions for authenticated users:
- `timeline:create` - Create timelines
- `timeline:read` - Read timelines
- `project:create` - Create project timelines
- `analysis:run` - Run timeline analysis

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │    │  Cloudflare      │    │     GitHub      │
│                 │    │  Workers         │    │     OAuth       │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ Inspector/  │ │◄──►│ │ Auth Server  │ │◄──►│   OAuth API     │
│ │ Claude      │ │    │ │              │ │    │                 │
│ └─────────────┘ │    │ │ ┌──────────┐ │ │    └─────────────────┘
│                 │    │ │ │ MCP      │ │ │
│ Token Storage   │    │ │ │ Protocol │ │ │
│                 │    │ │ │ Handler  │ │ │
└─────────────────┘    │ │ └──────────┘ │ │
                       │ └──────────────┘ │
                       └──────────────────┘
```

## 🔒 Security Features

- **JWT tokens** with 24-hour expiry
- **CORS** enabled for cross-origin requests
- **OAuth state** validation to prevent CSRF
- **Scoped permissions** for tool access
- **Secure token storage** recommendations

## 🧪 Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Test health endpoint
curl http://localhost:8787/health

# Test authentication flow
open http://localhost:8787/authorize
```

### Production Testing
```bash
# Test deployed server
curl https://your-server.com/health

# Test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
```

## 📚 Integration Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "timelines-auth": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-server.com/sse?token=YOUR_JWT_TOKEN"
      ]
    }
  }
}
```

### Custom MCP Client
```javascript
// Connect with authentication
const client = new MCPClient('https://your-server.com/sse', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

// Call authenticated tools
const result = await client.callTool('create_project_timeline', {
  projectName: 'My Project',
  // ... other parameters
});
```

## 🚨 Troubleshooting

### Common Issues

**Authentication Failed**
- Check GitHub OAuth app configuration
- Verify callback URLs match exactly
- Ensure secrets are set correctly

**Token Invalid**
- Tokens expire after 24 hours
- Re-authenticate at `/authorize`
- Check JWT_SECRET is consistent

**Tool Access Denied**
- Verify user is authenticated
- Check user permissions
- Some tools require specific permissions

**CORS Errors**
- Server includes CORS headers
- Check client configuration
- Verify URL format

## 📈 Monitoring

### Health Checks
- `GET /health` - Server status
- `GET /` - Server info with auth status

### Logging
- Authentication events
- Tool usage statistics
- Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test locally and in production
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**🎯 Ready to use?** Start with the Quick Start guide above!