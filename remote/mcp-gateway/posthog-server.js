const http = require("http");
const https = require("https");

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_BASE_URL = process.env.POSTHOG_BASE_URL || "https://app.posthog.com";
const PORT = process.env.PORT || 8081;

const POSTHOG_API_BASE = POSTHOG_BASE_URL.replace(/\/$/, "") + "/api";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          if (!body) return resolve({});
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// PostHog API client
class PostHogAPI {
  constructor(apiKey, projectId, baseUrl) {
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}/api${endpoint}`;
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };
    if (data) options.body = data;
    return makeRequest(url, options);
  }

  async getFeatureFlags() {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/`);
  }

  async createFeatureFlag(flagData) {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/`, "POST", flagData);
  }

  async getInsights(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/projects/${this.projectId}/insights/${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(endpoint);
  }

  async getExperiments() {
    return this.makeRequest(`/projects/${this.projectId}/experiments/`);
  }

  async getDashboards() {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/`);
  }

  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/projects/${this.projectId}/events/${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(endpoint);
  }
}

// MCP Tools definition
const MCP_TOOLS = [
  {
    name: "feature-flag-get-all",
    description: "Get all feature flags for the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create-feature-flag",
    description: "Create a new feature flag",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Feature flag name" },
        key: { type: "string", description: "Feature flag key" },
        filters: { type: "object", description: "Feature flag filters" },
        active: { type: "boolean", description: "Whether the flag is active" },
      },
      required: ["name", "key"],
    },
  },
  {
    name: "insights-get-all",
    description: "Get insights in the project",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search term for insights" },
        saved: { type: "boolean", description: "Filter by saved status" },
      },
    },
  },
  {
    name: "experiment-get-all",
    description: "Get all experiments in the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "dashboards-get-all",
    description: "Get all dashboards in the project",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search term for dashboards" },
        pinned: { type: "boolean", description: "Filter by pinned status" },
      },
    },
  },
  {
    name: "get-sql-insight",
    description: "Query PostHog data using natural language",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language query describing what data you want" },
      },
      required: ["query"],
    },
  },
];

// Handle MCP tool calls
async function handleToolCall(toolName, args, api) {
  try {
    switch (toolName) {
      case "feature-flag-get-all":
        return await api.getFeatureFlags();
      
      case "create-feature-flag":
        return await api.createFeatureFlag(args);
      
      case "insights-get-all":
        return await api.getInsights(args);
      
      case "experiment-get-all":
        return await api.getExperiments();
      
      case "dashboards-get-all":
        return await api.getDashboards();
      
      case "get-sql-insight":
        // For now, return a placeholder - you can implement actual SQL querying later
        return {
          message: "SQL insight queries are not yet implemented in this server version",
          suggestion: "Use the official PostHog MCP server for full SQL capabilities",
        };
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
}

// Handle JSON-RPC requests
function handleJsonRpc(body, api) {
  if (!body || typeof body !== "object") {
    return {
      status: 400,
      data: {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
    };
  }

  const { id, method, params } = body;

  if (method === "initialize") {
    return {
      status: 200,
      data: {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "posthog-mcp", version: "1.0.0" },
        },
      },
    };
  }

  if (method === "ping") {
    return { status: 200, data: { jsonrpc: "2.0", id, result: {} } };
  }

  if (method === "tools/list") {
    return { status: 200, data: { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } } };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    
    return handleToolCall(toolName, args, api)
      .then((result) => ({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        },
      }))
      .catch((error) => ({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message: error.message },
        },
      }));
  }

  return {
    status: 400,
    data: {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32601, message: "Method not found" },
    },
  };
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Health check
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // SSE endpoint for MCP clients
  if (path === "/sse" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    });

    const protoHeader = req.headers["x-forwarded-proto"] || "https";
    const scheme = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host = req.headers.host;
    const base = `${scheme}://${host}`;
    const sessionId = String(Date.now());
    const endpoint = `${base}/sse/message?sessionId=${sessionId}`;

    res.write(`event: endpoint\n`);
    res.write(`data: ${endpoint}\n\n`);

    const interval = setInterval(() => {
      try {
        res.write(`event: ping\n`);
        res.write(`data: {}\n\n`);
      } catch {
        clearInterval(interval);
      }
    }, 15000);

    req.on("close", () => clearInterval(interval));
    return;
  }

  // JSON-RPC endpoints
  if (req.method === "POST" && (path === "/mcp" || path === "/" || path === "/sse/message")) {
    try {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const requestBody = body ? JSON.parse(body) : {};
          const api = new PostHogAPI(POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_BASE_URL);
          const result = await handleJsonRpc(requestBody, api);
          
          res.writeHead(result.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result.data));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }));
        }
      });
      return;
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }));
      return;
    }
  }

  // Default response
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log("PostHog MCP Server running on port " + PORT);
  console.log("API Key: " + (POSTHOG_API_KEY ? "✓ Set" : "✗ Missing"));
  console.log("Project ID: " + (POSTHOG_PROJECT_ID || "✗ Missing"));
  console.log("Base URL: " + POSTHOG_BASE_URL);
  console.log("Server ready for MCP clients");
});
