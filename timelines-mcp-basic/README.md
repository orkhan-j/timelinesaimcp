# Timelines MCP Server - Basic

A Model Context Protocol (MCP) server built for Cloudflare Workers, providing math tools and timeline management capabilities.

## Features

- **Math Tools**: Add and multiply numbers
- **Timeline Tools**: Create and manage timelines with events
- **Time Tools**: Get current time in different timezones
- **SSE Transport**: Server-Sent Events for real-time communication
- **CORS Support**: Cross-origin requests enabled

## Available Tools

### Math Tools
- `add(a, b)` - Add two numbers
- `multiply(a, b)` - Multiply two numbers

### Timeline Tools
- `create_timeline(title, description?, events[])` - Create a timeline with events
- `get_current_time(timezone?)` - Get current time in specified timezone

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Test the server:
   ```bash
   # Health check
   curl http://localhost:8787/health
   
   # SSE endpoint
   curl -N -H "Accept: text/event-stream" http://localhost:8787/sse
   ```

### Testing with MCP Inspector

1. Install and run MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector@latest
   ```

2. Open http://localhost:5173 in your browser

3. Connect to your server: `http://localhost:8787/sse`

## Deployment

### Deploy to Cloudflare Workers

1. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Your server will be available at:
   `https://timelines-mcp-basic.your-account.workers.dev/sse`

### Custom Domain Setup

1. Add your domain to Cloudflare
2. Update DNS records
3. Configure Worker routes in Cloudflare dashboard

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "timelines-basic": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker.your-account.workers.dev/sse"
      ]
    }
  }
}
```

## Example Tool Calls

### Create a Timeline
```json
{
  "name": "create_timeline",
  "arguments": {
    "title": "Product Development",
    "description": "Key milestones in our product development",
    "events": [
      {
        "date": "2024-01-15",
        "title": "Project Kickoff",
        "description": "Initial planning and team formation"
      },
      {
        "date": "2024-03-01",
        "title": "MVP Release",
        "description": "First version with core features"
      },
      {
        "date": "2024-06-01",
        "title": "Public Launch",
        "description": "Full product launch to public"
      }
    ]
  }
}
```

### Math Operations
```json
{
  "name": "add",
  "arguments": {
    "a": 42,
    "b": 28
  }
}
```

## Architecture

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Protocol**: MCP over Server-Sent Events (SSE)
- **Transport**: HTTP/HTTPS with CORS support
- **Language**: TypeScript

## Security

- CORS enabled for cross-origin access
- No authentication required (public server)
- Rate limiting handled by Cloudflare
- Input validation on all tool calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details