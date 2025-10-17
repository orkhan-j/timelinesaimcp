#!/usr/bin/env node

/**
 * Local MCP Proxy for Intercom
 * This runs locally and proxies MCP requests to the remote server
 * while properly handling the stdio protocol that Claude Desktop expects
 */

const readline = require('readline');
const https = require('https');

// Intercom tools definition (must match server)
const INTERCOM_TOOLS = [
  {
    name: "search",
    description: "Universal search tool for finding conversations and contacts using a query DSL. Must specify object_type:conversations or object_type:contacts. Supports field-based queries with operators.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string. Examples: 'object_type:conversations state:open', 'object_type:contacts email_domain:example.com'"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "fetch",
    description: "Retrieve complete detailed information for specific resources. Use IDs returned from search results (prefixed with conversation_ or contact_).",
    inputSchema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Resource ID with prefix (e.g., conversation_123 or contact_456)"
        }
      },
      required: ["resourceId"]
    }
  },
  {
    name: "search_conversations",
    description: "Search conversations with advanced filtering by state, source type, author, and timing.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "Conversation state (open, closed, snoozed)",
          enum: ["open", "closed", "snoozed"]
        },
        source_type: {
          type: "string",
          description: "Source type (email, conversation, chat, etc.)"
        },
        starting_after: {
          type: "string",
          description: "Pagination cursor from previous results"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 20, max 150)"
        }
      }
    }
  },
  {
    name: "get_conversation",
    description: "Retrieve a single conversation by ID with complete details including all conversation parts and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "Conversation ID (with or without conversation_ prefix)"
        }
      },
      required: ["conversationId"]
    }
  },
  {
    name: "search_contacts",
    description: "Search contacts by email, email domain, or other attributes with flexible matching options.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Contact email address"
        },
        email_domain: {
          type: "string",
          description: "Email domain (e.g., example.com)"
        },
        starting_after: {
          type: "string",
          description: "Pagination cursor from previous results"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 20, max 150)"
        }
      }
    }
  },
  {
    name: "get_contact",
    description: "Get complete contact information including custom attributes, location data, and activity timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "Contact ID (with or without contact_ prefix)"
        }
      },
      required: ["contactId"]
    }
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
      path: '/intercom',
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
              name: "intercom-mcp-proxy",
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
            tools: INTERCOM_TOOLS
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
console.error('Intercom MCP Proxy started');
