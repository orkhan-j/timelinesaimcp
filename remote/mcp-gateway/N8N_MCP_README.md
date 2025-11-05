# n8n-MCP Integration Guide

## Overview
This integration adds the official n8n-MCP server to the MCP Gateway, enabling AI assistants to interact with your n8n instance on RepoCloud.

## Setup Details

### Service Configuration
- **Container**: n8n-mcp
- **Docker Image**: ghcr.io/czlonkowski/n8n-mcp:latest
- **Internal Port**: 8085
- **Public Endpoint**: https://mcp.timelinesaitech.com/n8n/sse

### n8n Instance
- **Platform**: RepoCloud
- **URL**: https://apxqmriq.rcld.app
- **API Key**: Configured in .env file

### Available Endpoints
1. **SSE Connection**: `https://mcp.timelinesaitech.com/n8n/sse`
2. **SSE Messages**: `https://mcp.timelinesaitech.com/n8n/sse/message`
3. **General**: `https://mcp.timelinesaitech.com/n8n`

## n8n-MCP Capabilities

The n8n-MCP server provides AI assistants with:

### Core Features
- 📚 Access to 541 n8n nodes (both n8n-nodes-base and @n8n/n8n-nodes-langchain)
- 🔧 Node properties with 99% coverage
- ⚡ Node operations with 63.6% coverage
- 📄 Documentation with 87% coverage (including AI nodes)
- 🤖 271 AI-capable nodes detected
- 💡 2,646 pre-extracted configurations from templates
- 🎯 2,709 workflow templates with 100% metadata

### Available MCP Tools

**Node Discovery**
- `list_nodes` - List all n8n nodes with filtering
- `get_node_info` - Get comprehensive node information
- `get_node_essentials` - Get essential properties (10-20 instead of 200+)
- `search_nodes` - Full-text search across node documentation
- `search_node_properties` - Find specific properties within nodes
- `list_ai_tools` - List all AI-capable nodes
- `get_node_as_tool_info` - Get guidance on using any node as an AI tool

**Template Tools**
- `list_templates` - Browse all 2,709 templates
- `search_templates` - Text search across templates
- `search_templates_by_metadata` - Advanced filtering by complexity, setup time, etc.
- `list_node_templates` - Find templates using specific nodes
- `get_template` - Get complete workflow JSON for import
- `get_templates_for_task` - Curated templates for common tasks

**Validation Tools**
- `validate_workflow` - Complete workflow validation including AI Agent validation
- `validate_workflow_connections` - Check workflow structure
- `validate_workflow_expressions` - Validate n8n expressions
- `validate_node_operation` - Validate node configurations
- `validate_node_minimal` - Quick validation for required fields

**n8n Management Tools** (With API configured)
- `n8n_create_workflow` - Create new workflows
- `n8n_get_workflow` - Get complete workflow by ID
- `n8n_update_full_workflow` - Update entire workflow
- `n8n_update_partial_workflow` - Update workflow using diff operations
- `n8n_delete_workflow` - Delete workflows
- `n8n_list_workflows` - List workflows with filtering
- `n8n_validate_workflow` - Validate workflows by ID
- `n8n_autofix_workflow` - Auto-fix common errors
- `n8n_trigger_webhook_workflow` - Trigger workflows via webhook
- `n8n_get_execution` - Get execution details
- `n8n_list_executions` - List executions with status filtering
- `n8n_delete_execution` - Delete execution records

**System Tools**
- `n8n_health_check` - Check n8n API connectivity
- `n8n_diagnostic` - Troubleshoot configuration issues
- `n8n_list_available_tools` - List all available tools

## Testing the Integration

### Test SSE Endpoint
```bash
curl -N -H "Accept: text/event-stream" https://mcp.timelinesaitech.com/n8n/sse
```

### Test with mcp-remote
```bash
npx --yes mcp-remote@latest https://mcp.timelinesaitech.com/n8n/sse
```

### Claude Desktop Configuration
Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["--yes", "mcp-remote@latest", "https://mcp.timelinesaitech.com/n8n/sse"]
    }
  }
}
```

## Deployment Process

Following the standard git-based deployment:

```bash
# 1. Commit changes locally
cd "/Users/oj/Downloads/Timelines MCP"
git add remote/mcp-gateway/
git commit -m "Add n8n-MCP integration"
git push origin main

# 2. Deploy on server
ssh root@213.182.213.232
cd /opt/mcp-gateway
git pull origin main

# 3. Sync files (if needed)
cp remote/mcp-gateway/docker-compose.yml docker-compose.yml
cp remote/mcp-gateway/nginx.conf nginx.conf
cp remote/mcp-gateway/.env .env

# 4. Restart containers
docker-compose down
docker-compose up -d

# 5. Check logs
docker logs n8n-mcp --tail 50
docker logs nginx-mcp --tail 50
```

## Monitoring

### Check Container Status
```bash
ssh root@213.182.213.232 "docker ps | grep n8n-mcp"
```

### View Logs
```bash
ssh root@213.182.213.232 "docker logs n8n-mcp --tail 100"
```

### Restart n8n-MCP Only
```bash
ssh root@213.182.213.232 "cd /opt/mcp-gateway && docker-compose restart n8n-mcp"
```

## Troubleshooting

### Container Not Starting
1. Check environment variables in .env
2. Verify n8n API credentials are correct
3. Check logs: `docker logs n8n-mcp`

### SSE Connection Issues
1. Verify nginx is running: `docker ps | grep nginx`
2. Check nginx logs: `docker logs nginx-mcp`
3. Test direct connection: `curl http://n8n-mcp:8085/sse` (from within server)

### n8n API Connection Issues
1. Verify n8n instance is accessible: `curl https://apxqmriq.rcld.app`
2. Check API key is valid in n8n Settings → API
3. Test with diagnostic tool: `n8n_diagnostic` (via MCP client)

## Important Notes

⚠️ **Security**: The n8n API key is stored in the .env file. Keep this file secure and never commit it to public repositories.

⚠️ **Webhook Security**: WEBHOOK_SECURITY_MODE is set to "moderate" to allow local development while blocking private networks.

✅ **Memory**: The n8n-mcp Docker image is optimized at ~100-200 MB with better-sqlite3 for stable memory usage.

## References

- [n8n-MCP GitHub](https://github.com/czlonkowski/n8n-mcp)
- [n8n-MCP Documentation](https://github.com/czlonkowski/n8n-mcp#readme)
- [n8n API Documentation](https://docs.n8n.io/api/)
