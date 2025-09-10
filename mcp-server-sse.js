#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');

// Your existing MCP server URL for backend operations
const MCP_BACKEND_URL = process.env.MCP_BACKEND_URL || 'https://mcp.timelinesaitech.com/posthog';

// SSE server configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

let messageId = 0;

// Forward requests to the backend MCP server
async function forwardToBackend(method, params = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: ++messageId,
      method,
      params
    });

    const backendUrl = new URL(MCP_BACKEND_URL);
    const options = {
      hostname: backendUrl.hostname,
      port: backendUrl.port || 443,
      path: backendUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Handle SSE connection
async function handleSSEConnection(req, res) {
  console.log('New SSE connection established');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });

  // Send initial connection message
  res.write(':ok\n\n');

  // Keep connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(':ping\n\n');
  }, 30000);

  // Handle incoming messages from the client
  let buffer = '';
  
  req.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleMCPMessage(message, res);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }
    }
  });

  req.on('close', () => {
    console.log('SSE connection closed');
    clearInterval(keepAliveInterval);
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(keepAliveInterval);
  });
}

// Handle MCP messages over SSE
async function handleMCPMessage(message, res) {
  try {
    const { method, params, id } = message;
    let response;

    switch (method) {
      case 'initialize':
        response = {
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
              name: 'PostHog MCP Server (SSE)',
              version: '1.0.0'
            }
          }
        };
        break;

      case 'tools/list':
      case 'tools/call':
        // Forward to backend
        const backendResponse = await forwardToBackend(method, params);
        response = {
          jsonrpc: '2.0',
          id,
          result: backendResponse.result || {},
          error: backendResponse.error
        };
        break;

      case 'ping':
        response = {
          jsonrpc: '2.0',
          id,
          result: {}
        };
        break;

      default:
        response = {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
            data: null
          }
        };
    }

    // Send response as SSE event
    const data = JSON.stringify(response);
    res.write(`data: ${data}\n\n`);
  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: message.id || null,
      error: {
        code: -32603,
        message: error.message,
        data: null
      }
    };
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/sse' || parsedUrl.pathname === '/posthog/sse') {
    if (req.method === 'GET' || req.method === 'POST') {
      handleSSEConnection(req, res);
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } else if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', type: 'sse-bridge' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`MCP SSE Server running at http://${HOST}:${PORT}/sse`);
  console.log(`Backend MCP Server: ${MCP_BACKEND_URL}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down SSE server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});