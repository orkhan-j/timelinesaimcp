#!/usr/bin/env node

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp.timelinesaitech.com/posthog';

// Check if we're in the right directory and fix if needed
const expectedDir = '/Users/oj/Downloads/Timelines MCP';
if (process.cwd() !== expectedDir) {
  try {
    process.chdir(expectedDir);
  } catch (error) {
    console.error('Failed to change to correct directory:', error.message);
    process.exit(1);
  }
}

let messageId = 0;
let initialized = false;

// Send HTTP request to the server
async function sendRequest(method, params = {}) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++messageId,
        method,
        params
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Validate the response format
    if (!result.jsonrpc || result.jsonrpc !== '2.0') {
      throw new Error('Invalid JSON-RPC response format');
    }
    
    return result;
  } catch (error) {
    // Return a proper MCP error response
    return {
      jsonrpc: '2.0',
      id: messageId,
      error: {
        code: -32603,
        message: error.message,
        data: null
      }
    };
  }
}

// Handle MCP protocol messages according to the official specification
async function handleMCPMessage(message) {
  try {
    // Validate incoming message
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: message.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: null
        }
      };
    }

    if (!message.method) {
      return {
        jsonrpc: '2.0',
        id: message.id || null,
        error: {
          code: -32600,
          message: 'Method is required',
          data: null
        }
      };
    }

    const { method, params, id } = message;
    
    switch (method) {
      case 'initialize':
        // MCP initialization
        if (!initialized) {
          initialized = true;
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: { listChanged: false },
                prompts: { listChanged: false },
                resources: { listChanged: false }
              },
              serverInfo: {
                name: 'PostHog MCP Server',
                version: '1.0.0'
              }
            }
          };
        } else {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: 'Already initialized',
              data: null
            }
          };
        }
        
      case 'tools/list':
        // Get list of available tools
        try {
          const remote = await sendRequest('tools/list', params || {});
          if (remote && remote.result && remote.result.tools) {
            return { jsonrpc: '2.0', id, result: remote.result };
          }
          if (remote && remote.error) {
            // Fall back to empty tools list to satisfy MCP schema
            return { jsonrpc: '2.0', id, result: { tools: [] } };
          }
          return { jsonrpc: '2.0', id, result: { tools: [] } };
        } catch (error) {
          return { jsonrpc: '2.0', id, result: { tools: [] } };
        }
        
      case 'tools/call':
        // Execute a tool
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Tool name is required',
              data: null
            }
          };
        }
        
        try {
          const remote = await sendRequest('tools/call', params);
          if (remote && remote.result) {
            // Pass through normalized result
            return { jsonrpc: '2.0', id, result: remote.result };
          }
          // Normalize remote error into a valid MCP tool result content
          const errorMessage = (remote && remote.error && remote.error.message) ? remote.error.message : 'Unknown error';
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                { type: 'text', text: `Tool error: ${errorMessage}` }
              ]
            }
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                { type: 'text', text: `Tool error: ${error.message}` }
              ]
            }
          };
        }
        
      case 'ping':
        // Simple ping response
        return {
          jsonrpc: '2.0',
          id,
          result: {}
        };
        
      default:
        // Unknown method
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
            data: null
          }
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: message.id || null,
      error: {
        code: -32603,
        message: error.message,
        data: null
      }
    };
  }
}

// Main function
async function main() {
  // Test connection to server
  try {
    const healthResponse = await fetch(`${MCP_SERVER_URL}/health`);
    if (healthResponse.ok) {
      console.error('Server health check: OK');
    } else {
      console.error('Server health check: FAILED');
    }
  } catch (error) {
    console.error('Server health check error:', error.message);
  }
  
  // Handle stdin as newline-delimited JSON (one JSON-RPC message per line)
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
  rl.on('line', async (line) => {
    if (!line) {
      return;
    }
    try {
      const message = JSON.parse(line);
      const response = await handleMCPMessage(message);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (error) {
      // Return a JSON-RPC parse error response
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: null
        }
      }) + "\n");
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    process.exit(0);
  });
}

// Start the client
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
