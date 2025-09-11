#!/usr/bin/env node

const readline = require('readline');
const https = require('https');

// Create interface for stdin/stdout communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Buffer for incomplete JSON
let buffer = '';

// Function to make HTTPS request to remote server
function forwardToRemote(request) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(request);
    
    const options = {
      hostname: 'mcp.timelinesaitech.com',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
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
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Process incoming data
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    // Log for debugging
    console.error(`[stdio-bridge] Received: ${request.method}`);
    
    // Forward to remote server
    const response = await forwardToRemote(request);
    
    // Send response back to Claude Desktop
    console.log(JSON.stringify(response));
    
  } catch (e) {
    console.error(`[stdio-bridge] Error: ${e.message}`);
    // Send error response
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error"
      }
    }));
  }
});

console.error('[stdio-bridge] PostHog MCP stdio bridge started');