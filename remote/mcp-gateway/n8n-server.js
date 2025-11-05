#!/usr/bin/env node

/**
 * n8n MCP Remote Server
 * Uses mcp-remote to bridge n8n-mcp stdio to HTTP/SSE
 */

const { spawn } = require('child_process');

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 8085;

console.log("Starting n8n MCP Remote Server...");
console.log("N8N API URL:", N8N_API_URL ? "✓ Set" : "✗ Missing");
console.log("N8N API Key:", N8N_API_KEY ? "✓ Set" : "✗ Missing");
console.log("Port:", PORT);

// Start mcp-remote server
const server = spawn("npx", ["--yes", "mcp-remote@latest", "--stdio", "npx", "--yes", "n8n-mcp"], {
  env: {
    ...process.env,
    MCP_MODE: "stdio",
    N8N_API_URL,
    N8N_API_KEY,
    N8N_MCP_TELEMETRY_DISABLED: "true",
    LOG_LEVEL: "error",
    DISABLE_CONSOLE_OUTPUT: "true",
    WEBHOOK_SECURITY_MODE: "moderate",
    PORT: PORT.toString()
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.kill('SIGINT');
});
