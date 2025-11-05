const http = require("http");
const { spawn } = require("child_process");

const N8N_API_URL = process.env.N8N_API_KEY;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 8085;

console.log("n8n MCP HTTP Server starting...");
console.log("N8N API URL:", N8N_API_URL ? "✓ Set" : "✗ Missing");
console.log("N8N API Key:", N8N_API_KEY ? "✓ Set" : "✗ Missing");
console.log("Port:", PORT);

//Create HTTP server
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
      })
    );
    return;
  }

  // SSE endpoint for MCP - spawn a new n8n-mcp process for this connection
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

  // SSE message endpoint - handle MCP requests by spawning n8n-mcp
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

        // Spawn n8n-mcp process for each request
        const mcpProcess = spawn("npx", ["--yes", "n8n-mcp"], {
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

        let responseData = "";
        let errorData = "";

        mcpProcess.stdout.on("data", (data) => {
          const output = data.toString();
          // Try to parse as JSON-RPC
          const lines = output.split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.jsonrpc) {
                responseData = JSON.stringify(json);
              }
            } catch (e) {
              // Not JSON, ignore (might be startup messages)
            }
          }
        });

        mcpProcess.stderr.on("data", (data) => {
          errorData += data.toString();
        });

        // Write the request to n8n-mcp
        mcpProcess.stdin.write(JSON.stringify(request) + "\n");
        mcpProcess.stdin.end();

        // Wait for response or timeout
        const timeout = setTimeout(() => {
          mcpProcess.kill();
          if (!res.headersSent) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                id: request.id,
                error: { code: -32000, message: "Request timeout" },
              })
            );
          }
        }, 30000);

        mcpProcess.on("close", () => {
          clearTimeout(timeout);
          if (!res.headersSent) {
            if (responseData) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(responseData);
            } else if (request.method === "notifications/initialized") {
              // Notifications don't need a response
              res.writeHead(200);
              res.end();
            } else {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "No response from MCP process",
                  stderr: errorData,
                })
              );
            }
          }
        });
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
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
  console.log("n8n MCP HTTP Server running on port " + PORT);
  console.log("Server ready for MCP clients");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
