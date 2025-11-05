const http = require("http");
const { spawn } = require("child_process");

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 8085;

console.error("n8n MCP Persistent Server starting...");
console.error("N8N API URL:", N8N_API_URL ? "✓ Set" : "✗ Missing");
console.error("N8N API Key:", N8N_API_KEY ? "✓ Set" : "✗ Missing");
console.error("Port:", PORT);

// Keep single persistent n8n-mcp process
let mcpProcess = null;
const pendingRequests = new Map();
let isInitialized = false;

// Start persistent MCP process
function startMCPProcess() {
  if (mcpProcess) {
    return mcpProcess;
  }

  console.error("Starting persistent n8n-mcp process...");
  mcpProcess = spawn("npx", ["--yes", "n8n-mcp"], {
    env: {
      ...process.env,
      N8N_API_URL,
      N8N_API_KEY,
      N8N_MCP_TELEMETRY_DISABLED: "true",
      MCP_MODE: "stdio",
      LOG_LEVEL: "error",
      DISABLE_CONSOLE_OUTPUT: "true",
    },
  });

  // Handle stdout - parse JSON-RPC responses
  let buffer = "";
  mcpProcess.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        if (message.jsonrpc === "2.0") {
          const pending = pendingRequests.get(message.id);
          if (pending) {
            pending.resolve(message);
            pendingRequests.delete(message.id);
          }
        }
      } catch (e) {
        // Ignore non-JSON lines (telemetry, etc.)
        console.error("Non-JSON output:", line);
      }
    }
  });

  mcpProcess.stderr.on("data", (data) => {
    console.error("n8n-mcp stderr:", data.toString());
  });

  mcpProcess.on("close", (code) => {
    console.error("n8n-mcp process exited with code:", code);
    mcpProcess = null;
    isInitialized = false;
    // Reject all pending requests
    for (const [id, pending] of pendingRequests.entries()) {
      pending.reject(new Error("Process exited"));
      pendingRequests.delete(id);
    }
  });

  return mcpProcess;
}

// Send request to persistent MCP process
function sendToMCP(request, timeout = 30000) {
  return new Promise((resolve, reject) => {
    if (!mcpProcess) {
      startMCPProcess();
    }

    const timer = setTimeout(() => {
      pendingRequests.delete(request.id);
      reject(new Error("Request timeout"));
    }, timeout);

    pendingRequests.set(request.id, {
      resolve: (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });

    try {
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } catch (error) {
      clearTimeout(timer);
      pendingRequests.delete(request.id);
      reject(error);
    }
  });
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
    path = path.substring(4);
  }

  // Health check endpoint
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        n8n_configured: !!(N8N_API_URL && N8N_API_KEY),
        mcp_process_running: !!mcpProcess,
        initialized: isInitialized,
      })
    );
    return;
  }

  // SSE endpoint
  if (path === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const protoHeader = req.headers["x-forwarded-proto"] || "https";
    const scheme = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers.host ||
      "mcp.timelinesaitech.com";
    const baseUrl = `${scheme}://${host}`;

    const sessionId = Date.now();
    res.write(
      `event: endpoint\ndata: ${baseUrl}/n8n/sse/message?sessionId=${sessionId}\n\n`
    );

    const interval = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
    });

    return;
  }

  // SSE message endpoint
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

        // Initialize MCP process if first request
        if (!isInitialized && request.method === "initialize") {
          console.error("Initializing n8n-mcp...");
          // Wait a bit for process to start
          await new Promise((resolve) => setTimeout(resolve, 2000));
          isInitialized = true;
        }

        const response = await sendToMCP(request, 60000);

        if (response !== null) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } else if (request.method === "notifications/initialized") {
          res.writeHead(200);
          res.end();
        } else {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No response" }));
        }
      } catch (error) {
        console.error("Request error:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error.message,
              jsonrpc: "2.0",
              id: null,
            })
          );
        }
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
  console.error("n8n MCP Persistent Server running on port " + PORT);
  console.error("Starting n8n-mcp process...");
  startMCPProcess();
  console.error("Server ready for MCP clients");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.error("SIGTERM received, shutting down...");
  if (mcpProcess) {
    mcpProcess.kill();
  }
  server.close(() => {
    console.error("Server closed");
    process.exit(0);
  });
});
