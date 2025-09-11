#!/usr/bin/env node

/**
 * Local MCP Proxy for PostHog
 * This runs locally and proxies MCP requests to the remote server
 * while properly handling the stdio protocol that Claude Desktop expects
 */

const readline = require('readline');
const https = require('https');

// PostHog tools definition (must match server)
const POSTHOG_TOOLS = [
  {
    name: "dashboards-get-all",
    description: "Get all dashboards for the PostHog project",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "dashboard-create",
    description: "Create a new dashboard",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Dashboard name" },
        description: { type: "string", description: "Dashboard description" }
      },
      required: ["name"]
    }
  },
  {
    name: "insights-get-all",
    description: "Get all insights for the project",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "feature-flag-get-all",
    description: "Get all feature flags",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get-sql-insight",
    description: "Query project data using natural language",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language question" }
      },
      required: ["query"]
    }
  }
  // Add more tools as needed
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Make request to remote server
function callRemote(request) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(request);
    
    const options = {
      hostname: 'mcp.timelinesaitech.com',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Handle each line of input
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    let response;
    
    // Handle specific methods locally for better Claude Desktop compatibility
    switch (request.method) {
      case 'initialize':
        // Return capabilities without tools (tools are fetched via tools/list)
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "posthog-mcp-proxy",
              version: "1.0.0"
            }
          }
        };
        break;
        
      case 'tools/list':
        // Return tools list directly (this is what Claude Desktop needs)
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: POSTHOG_TOOLS
          }
        };
        break;
        
      case 'notifications/initialized':
        // Don't respond to notifications
        return;
        
      case 'tools/call':
        // Forward tool calls to remote server
        response = await callRemote(request);
        break;
        
      default:
        // Forward other requests to remote server
        response = await callRemote(request);
    }
    
    // Send response
    if (response) {
      console.log(JSON.stringify(response));
    }
    
  } catch (e) {
    // Send error response
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${e.message}`
      }
    }));
  }
});

// Log startup to stderr (not stdout)
console.error('PostHog MCP Proxy started');