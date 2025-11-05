const http = require("http");
const { spawn } = require("child_process");

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 8085;

console.log("n8n MCP Server Wrapper starting...");
console.log("N8N API URL:", N8N_API_URL ? "✓ Set" : "✗ Missing");
console.log("N8N API Key:", N8N_API_KEY ? "✓ Set" : "✗ Missing");
console.log("Port:", PORT);

// Store active MCP process and sessions
let mcpProcess = null;
const sessions = new Map();

// Start MCP process
function startMCPProcess() {
  if (mcpProcess) {
    console.log("MCP process already running");
    return mcpProcess;
  }

  console.log("Starting MCP process...");
  mcpProcess = spawn("npx", ["n8n-mcp"], {
    env: {
      ...process.env,
      MCP_MODE: "stdio",
      LOG_LEVEL: "error",
      DISABLE_CONSOLE_OUTPUT: "true",
      N8N_API_URL,
      N8N_API_KEY,
    },
  });

  mcpProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        handleMCPMessage(message);
      } catch (e) {
        console.error("Failed to parse MCP output:", line);
      }
    }
  });

  mcpProcess.stderr.on("data", (data) => {
    console.error("MCP stderr:", data.toString());
  });

  mcpProcess.on("close", (code) => {
    console.log("MCP process exited with code:", code);
    mcpProcess = null;
  });

  return mcpProcess;
}

// Handle MCP messages
function handleMCPMessage(message) {
  const sessionId = message.sessionId || "default";
  const session = sessions.get(sessionId);
  if (session && session.callback) {
    session.callback(message);
  }
}

// Send request to MCP process
function sendToMCP(request, callback) {
  if (!mcpProcess) {
    startMCPProcess();
  }

  const sessionId = request.id || Date.now().toString();
  sessions.set(sessionId, { callback, request });

  const requestStr = JSON.stringify(request) + "\n";
  mcpProcess.stdin.write(requestStr);

  // Timeout after 30 seconds
  setTimeout(() => {
    const session = sessions.get(sessionId);
    if (session) {
      sessions.delete(sessionId);
      callback({
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32000, message: "Request timeout" },
      });
    }
  }, 30000);
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  let path = url.pathname;

  // Strip /n8n prefix if present
  if (path.startsWith("/n8n")) {
    path = path.substring(4); // Remove '/n8n' (4 characters)
  }

  // Health check endpoint
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        n8n_configured: !!(N8N_API_URL && N8N_API_KEY),
      })
    );
    return;
  }

  // SSE endpoint for MCP
  if (path === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Construct the full URL for the endpoint
    const protoHeader = req.headers["x-forwarded-proto"] || "https";
    const scheme = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers.host ||
      "mcp.timelinesaitech.com";
    const baseUrl = `${scheme}://${host}`;

    // Send the endpoint information with full URL
    const sessionId = Date.now();
    res.write(
      `event: endpoint\ndata: ${baseUrl}/n8n/sse/message?sessionId=${sessionId}\n\n`
    );

    // Keep connection alive
    const interval = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
    });

    return;
  }

  // SSE message endpoint for MCP
  if (path === "/sse/message") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);

        // Handle request through MCP process
        sendToMCP(request, (response) => {
          if (response !== null) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response));
          } else {
            res.writeHead(200);
            res.end();
          }
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // JSON-RPC endpoint
  if (path === "/" || path === "/jsonrpc") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);

        // Handle request through MCP process
        sendToMCP(request, (response) => {
          if (response !== null) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response));
          } else {
            res.writeHead(200);
            res.end();
          }
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // 404 for unknown paths
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", path: path }));
});

// Start server
server.listen(PORT, () => {
  console.log("n8n MCP HTTP Wrapper running on port " + PORT);
  console.log("Starting n8n-mcp process...");
  startMCPProcess();
  console.log("Server ready for MCP clients");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  if (mcpProcess) {
    mcpProcess.kill();
  }
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
