#!/usr/bin/env node

// Simple test MCP server to verify Claude Desktop can see tools
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Simple test tools
const TEST_TOOLS = [
  {
    name: "test_hello",
    description: "Says hello",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name to greet" }
      }
    }
  },
  {
    name: "test_add",
    description: "Adds two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" }
      },
      required: ["a", "b"]
    }
  }
];

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    let response;

    switch (request.method) {
      case 'initialize':
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "test-mcp",
              version: "1.0.0"
            }
          }
        };
        break;

      case 'tools/list':
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: TEST_TOOLS
          }
        };
        break;

      case 'tools/call':
        const toolName = request.params.name;
        const args = request.params.arguments;
        
        let result;
        if (toolName === 'test_hello') {
          result = { message: `Hello, ${args.name || 'World'}!` };
        } else if (toolName === 'test_add') {
          result = { sum: args.a + args.b };
        } else {
          result = { error: "Unknown tool" };
        }

        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result)
              }
            ]
          }
        };
        break;

      default:
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: "Method not found"
          }
        };
    }

    console.log(JSON.stringify(response));
  } catch (e) {
    console.error(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error"
      }
    }));
  }
});

// Log startup to stderr so it doesn't interfere with JSON-RPC
console.error("Test MCP Server started");