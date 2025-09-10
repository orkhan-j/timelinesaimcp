#!/usr/bin/env node

const EventSource = require('eventsource');
const fetch = require('node-fetch');
const readline = require('readline');

// SSE endpoint URL
const SSE_URL = process.env.SSE_URL || 'https://mcp.timelinesaitech.com/posthog/sse';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp.timelinesaitech.com/posthog';

let messageId = 0;
let sseConnection = null;

// Send request to MCP server via HTTP POST
async function sendHTTPRequest(method, params = {}) {
  try {
    const response = await fetch(MCP_SERVER_URL, {
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
    
    return await response.json();
  } catch (error) {
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

// Initialize SSE connection
function initializeSSE() {
  console.error('Connecting to SSE endpoint:', SSE_URL);
  
  sseConnection = new EventSource(SSE_URL, {
    headers: {
      'Accept': 'text/event-stream'
    }
  });

  sseConnection.onopen = () => {
    console.error('SSE connection established');
  };

  sseConnection.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      process.stdout.write(JSON.stringify(message) + '\n');
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  };

  sseConnection.onerror = (error) => {
    console.error('SSE connection error:', error);
    // For SSE bridge, we'll use HTTP fallback
  };
}

// Handle incoming MCP messages from stdin
async function handleStdinMessage(message) {
  try {
    const { method, params, id } = message;
    
    // For SSE-based servers, we need to handle this differently
    // Since the endpoint doesn't support SSE, fall back to HTTP
    const response = await sendHTTPRequest(method, params);
    
    // Ensure proper response format
    if (response.result !== undefined) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: response.result
      }) + '\n');
    } else if (response.error) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: response.error
      }) + '\n');
    } else {
      // Handle initialize specially
      if (method === 'initialize') {
        process.stdout.write(JSON.stringify({
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
        }) + '\n');
      } else {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: 'Unknown response format',
            data: null
          }
        }) + '\n');
      }
    }
  } catch (error) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id || null,
      error: {
        code: -32603,
        message: error.message,
        data: null
      }
    }) + '\n');
  }
}

// Main function
async function main() {
  // Test server connection
  try {
    const healthResponse = await fetch(`${MCP_SERVER_URL.replace('/posthog', '')}/health`);
    if (healthResponse.ok) {
      console.error('Server health check: OK');
    }
  } catch (error) {
    console.error('Server health check failed:', error.message);
  }

  // Try to initialize SSE (will fall back to HTTP if not available)
  // initializeSSE();

  // Handle stdin as newline-delimited JSON
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    
    try {
      const message = JSON.parse(line);
      await handleStdinMessage(message);
    } catch (error) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: null
        }
      }) + '\n');
    }
  });

  // Handle termination
  process.on('SIGINT', () => {
    if (sseConnection) {
      sseConnection.close();
    }
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    if (sseConnection) {
      sseConnection.close();
    }
    process.exit(0);
  });
}

// Start the bridge
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});