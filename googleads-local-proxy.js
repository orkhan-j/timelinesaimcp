#!/usr/bin/env node

/**
 * Local MCP Proxy for Google Ads
 * This runs locally and proxies MCP requests to the remote server
 * while properly handling the stdio protocol that Claude Desktop expects
 */

const readline = require('readline');
const https = require('https');

// Google Ads tools definition (must match server)
const GOOGLEADS_TOOLS = [
  {
    name: "campaigns-list",
    description: "List all campaigns in the Google Ads account",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "campaign-create",
    description: "Create a new campaign",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        budget: { type: "number", description: "Daily budget in account currency" },
        type: { 
          type: "string", 
          description: "Campaign type",
          enum: ["SEARCH", "DISPLAY", "SHOPPING", "VIDEO", "APP"]
        }
      },
      required: ["name", "budget", "type"]
    }
  },
  {
    name: "campaign-pause",
    description: "Pause a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "campaign-enable",
    description: "Enable a paused campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "ad-groups-list",
    description: "List ad groups in a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "keywords-list",
    description: "List keywords in an ad group",
    inputSchema: {
      type: "object",
      properties: {
        adGroupId: { type: "string", description: "Ad group ID" }
      },
      required: ["adGroupId"]
    }
  },
  {
    name: "keyword-add",
    description: "Add keywords to an ad group",
    inputSchema: {
      type: "object",
      properties: {
        adGroupId: { type: "string", description: "Ad group ID" },
        keywords: {
          type: "array",
          description: "Keywords to add",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              matchType: { 
                type: "string",
                enum: ["EXACT", "PHRASE", "BROAD"]
              }
            }
          }
        }
      },
      required: ["adGroupId", "keywords"]
    }
  },
  {
    name: "performance-report",
    description: "Get performance metrics for campaigns",
    inputSchema: {
      type: "object",
      properties: {
        dateRange: {
          type: "object",
          properties: {
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" }
          }
        }
      }
    }
  },
  {
    name: "account-info",
    description: "Get Google Ads account information",
    inputSchema: { type: "object", properties: {} }
  }
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
      path: '/googleads',
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
              name: "googleads-mcp-proxy",
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
            tools: GOOGLEADS_TOOLS
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
console.error('Google Ads MCP Proxy started');