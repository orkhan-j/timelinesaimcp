const http = require("http");
const https = require("https");

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_BASE_URL = process.env.POSTHOG_BASE_URL || "https://app.posthog.com";
const PORT = process.env.PORT || 8082;

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

// PostHog API client for basic operations
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
    
    // Debug logging
    console.log("DEBUG - Making API request to: " + url);
    console.log("DEBUG - Method: " + method);
    console.log("DEBUG - API Key (first 10 chars): " + (this.apiKey ? this.apiKey.substring(0, 10) + "..." : "None"));
    
    if (data) options.body = data;
    return makeRequest(url, options);
  }

  // Feature Flags
  async getFeatureFlags() {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/`);
  }

  async createFeatureFlag(data) {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/`, "POST", data);
  }

  async updateFeatureFlag(flagKey, data) {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/${flagKey}/`, "PATCH", data);
  }

  async deleteFeatureFlag(flagKey) {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/${flagKey}/`, "DELETE");
  }

  async getFeatureFlagDefinition(flagKey) {
    return this.makeRequest(`/projects/${this.projectId}/feature_flags/${flagKey}/`);
  }

  // Insights
  async getInsights() {
    return this.makeRequest(`/projects/${this.projectId}/insights/`);
  }

  async createInsight(data) {
    return this.makeRequest(`/projects/${this.projectId}/insights/`, "POST", data);
  }

  async updateInsight(insightId, data) {
    return this.makeRequest(`/projects/${this.projectId}/insights/${insightId}/`, "PATCH", data);
  }

  async deleteInsight(insightId) {
    return this.makeRequest(`/projects/${this.projectId}/insights/${insightId}/`, "DELETE");
  }

  async getInsight(insightId) {
    return this.makeRequest(`/projects/${this.projectId}/insights/${insightId}/`);
  }

  async queryInsight(insightId) {
    return this.makeRequest(`/projects/${this.projectId}/insights/${insightId}/query/`);
  }

  // Dashboards
  async getDashboards() {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/`);
  }

  async createDashboard(data) {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/`, "POST", data);
  }

  async updateDashboard(dashboardId, data) {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/${dashboardId}/`, "PATCH", data);
  }

  async deleteDashboard(dashboardId) {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/${dashboardId}/`, "DELETE");
  }

  async getDashboard(dashboardId) {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/${dashboardId}/`);
  }

  async addInsightToDashboard(data) {
    return this.makeRequest(`/projects/${this.projectId}/dashboards/insights/`, "POST", data);
  }

  // Experiments
  async getExperiments() {
    return this.makeRequest(`/projects/${this.projectId}/experiments/`);
  }

  async getExperiment(experimentId) {
    return this.makeRequest(`/projects/${this.projectId}/experiments/${experimentId}/`);
  }

  // Errors
  async listErrors() {
    return this.makeRequest(`/projects/${this.projectId}/errors/`);
  }

  async getErrorDetails(issueId) {
    return this.makeRequest(`/projects/${this.projectId}/errors/${issueId}/`);
  }

  // Organizations & Projects
  async getOrganizations() {
    return this.makeRequest("/organizations/");
  }

  async getOrganizationDetails() {
    return this.makeRequest("/organizations/@current/");
  }

  async getProjects() {
    return this.makeRequest("/projects/");
  }

  async switchOrganization(orgId) {
    return this.makeRequest(`/organizations/${orgId}/`, "POST");
  }

  async switchProject(projectId) {
    return this.makeRequest(`/projects/${projectId}/`, "POST");
  }

  // Property Definitions
  async getPropertyDefinitions() {
    return this.makeRequest(`/projects/${this.projectId}/property_definitions/`);
  }

  // LLM Costs
  async getLLMTotalCosts(days = 7) {
    const query = `
      SELECT 
        properties.model_name as model_name,
        sum(properties.total_cost_usd) as total_cost_usd,
        toDate(timestamp) as date,
        properties.total_cost_usd as daily_cost_usd
      FROM events 
      WHERE event = 'llm_cost' 
        AND timestamp >= now() - INTERVAL ${days} DAY
      GROUP BY model_name, date, daily_cost_usd
      ORDER BY model_name, date DESC
    `;
    
    return this.makeRequest(`/projects/${this.projectId}/query/`, "POST", { query });
  }

  // SQL Insight
  async getSQLInsight(question) {
    return this.makeRequest(`/projects/${this.projectId}/query/`, "POST", { 
      query: question,
      explain: false
    });
  }

  // Documentation Search
  async searchDocs(query) {
    // This would typically call PostHog's docs API
    return { query, results: [] };
  }
}

// Initialize PostHog API
const posthog = new PostHogAPI(POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_BASE_URL);

// MCP Tools definition (based on official PostHog MCP)
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
        rollout_percentage: { type: "number", description: "Rollout percentage" },
      },
      required: ["name", "key"],
    },
  },
  {
    name: "update-feature-flag",
    description: "Update a feature flag",
    inputSchema: {
      type: "object",
      properties: {
        flagKey: { type: "string", description: "Feature flag key" },
        data: { type: "object", description: "Update data" },
      },
      required: ["flagKey", "data"],
    },
  },
  {
    name: "delete-feature-flag",
    description: "Delete a feature flag",
    inputSchema: {
      type: "object",
      properties: {
        flagKey: { type: "string", description: "Feature flag key" },
      },
      required: ["flagKey"],
    },
  },
  {
    name: "feature-flag-get-definition",
    description: "Get a specific feature flag definition",
    inputSchema: {
      type: "object",
      properties: {
        flagKey: { type: "string", description: "Feature flag key" },
      },
      required: ["flagKey"],
    },
  },
  {
    name: "insights-get-all",
    description: "Get all insights for the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "insight-create-from-query",
    description: "Create an insight from a query",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Insight name" },
        query: { type: "object", description: "Query object" },
        description: { type: "string", description: "Insight description" },
      },
      required: ["name", "query"],
    },
  },
  {
    name: "insight-update",
    description: "Update an insight",
    inputSchema: {
      type: "object",
      properties: {
        insightId: { type: "string", description: "Insight ID" },
        data: { type: "object", description: "Update data" },
      },
      required: ["insightId", "data"],
    },
  },
  {
    name: "insight-delete",
    description: "Delete an insight",
    inputSchema: {
      type: "object",
      properties: {
        insightId: { type: "string", description: "Insight ID" },
      },
      required: ["insightId"],
    },
  },
  {
    name: "insight-get",
    description: "Get a specific insight",
    inputSchema: {
      type: "object",
      properties: {
        insightId: { type: "string", description: "Insight ID" },
      },
      required: ["insightId"],
    },
  },
  {
    name: "insight-query",
    description: "Execute a query on an existing insight",
    inputSchema: {
      type: "object",
      properties: {
        insightId: { type: "string", description: "Insight ID" },
      },
      required: ["insightId"],
    },
  },
  {
    name: "dashboards-get-all",
    description: "Get all dashboards for the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "dashboard-create",
    description: "Create a new dashboard",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Dashboard name" },
        description: { type: "string", description: "Dashboard description" },
      },
      required: ["name"],
    },
  },
  {
    name: "dashboard-update",
    description: "Update a dashboard",
    inputSchema: {
      type: "object",
      properties: {
        dashboardId: { type: "number", description: "Dashboard ID" },
        data: { type: "object", description: "Update data" },
      },
      required: ["dashboardId", "data"],
    },
  },
  {
    name: "dashboard-delete",
    description: "Delete a dashboard",
    inputSchema: {
      type: "object",
      properties: {
        dashboardId: { type: "number", description: "Dashboard ID" },
      },
      required: ["dashboardId"],
    },
  },
  {
    name: "dashboard-get",
    description: "Get a specific dashboard",
    inputSchema: {
      type: "object",
      properties: {
        dashboardId: { type: "number", description: "Dashboard ID" },
      },
      required: ["dashboardId"],
    },
  },
  {
    name: "add-insight-to-dashboard",
    description: "Add an existing insight to a dashboard",
    inputSchema: {
      type: "object",
      properties: {
        insightId: { type: "string", description: "Insight ID" },
        dashboardId: { type: "number", description: "Dashboard ID" },
      },
      required: ["insightId", "dashboardId"],
    },
  },
  {
    name: "experiment-get-all",
    description: "Get all experiments for the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "experiment-get",
    description: "Get a specific experiment",
    inputSchema: {
      type: "object",
      properties: {
        experimentId: { type: "number", description: "Experiment ID" },
      },
      required: ["experimentId"],
    },
  },
  {
    name: "list-errors",
    description: "List errors in the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "error-details",
    description: "Get details of a specific error",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string", description: "Error issue ID" },
      },
      required: ["issueId"],
    },
  },
  {
    name: "organizations-get",
    description: "Get organizations the user has access to",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "organization-details-get",
    description: "Get details of the active organization",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "projects-get",
    description: "Get projects the user has access to",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "switch-organization",
    description: "Switch to a different organization",
    inputSchema: {
      type: "object",
      properties: {
        orgId: { type: "string", description: "Organization ID" },
      },
      required: ["orgId"],
    },
  },
  {
    name: "switch-project",
    description: "Switch to a different project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "number", description: "Project ID" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "get-property-definitions",
    description: "Get event and property definitions for the project",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get-llm-total-costs-for-project",
    description: "Get LLM total costs for the project",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days to look back" },
      },
    },
  },
  {
    name: "get-sql-insight",
    description: "Query project data based on a natural language question",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language question" },
      },
      required: ["query"],
    },
  },
  {
    name: "docs-search",
    description: "Search PostHog documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
];

// Handle tool calls
async function handleToolCall(toolName, arguments) {
  try {
    console.log(`DEBUG - Calling tool: ${toolName} with args:`, arguments);
    
    switch (toolName) {
      case "feature-flag-get-all":
        return await posthog.getFeatureFlags();
      
      case "create-feature-flag":
        return await posthog.createFeatureFlag(arguments);
      
      case "update-feature-flag":
        return await posthog.updateFeatureFlag(arguments.flagKey, arguments.data);
      
      case "delete-feature-flag":
        return await posthog.deleteFeatureFlag(arguments.flagKey);
      
      case "feature-flag-get-definition":
        return await posthog.getFeatureFlagDefinition(arguments.flagKey);
      
      case "insights-get-all":
        return await posthog.getInsights();
      
      case "insight-create-from-query":
        return await posthog.createInsight(arguments);
      
      case "insight-update":
        return await posthog.updateInsight(arguments.insightId, arguments.data);
      
      case "insight-delete":
        return await posthog.deleteInsight(arguments.insightId);
      
      case "insight-get":
        return await posthog.getInsight(arguments.insightId);
      
      case "insight-query":
        return await posthog.queryInsight(arguments.insightId);
      
      case "dashboards-get-all":
        return await posthog.getDashboards();
      
      case "dashboard-create":
        return await posthog.createDashboard(arguments);
      
      case "dashboard-update":
        return await posthog.updateDashboard(arguments.dashboardId, arguments.data);
      
      case "dashboard-delete":
        return await posthog.deleteDashboard(arguments.dashboardId);
      
      case "dashboard-get":
        return await posthog.getDashboard(arguments.dashboardId);
      
      case "add-insight-to-dashboard":
        return await posthog.addInsightToDashboard(arguments);
      
      case "experiment-get-all":
        return await posthog.getExperiments();
      
      case "experiment-get":
        return await posthog.getExperiment(arguments.experimentId);
      
      case "list-errors":
        return await posthog.listErrors();
      
      case "error-details":
        return await posthog.getErrorDetails(arguments.issueId);
      
      case "organizations-get":
        return await posthog.getOrganizations();
      
      case "organization-details-get":
        return await posthog.getOrganizationDetails();
      
      case "projects-get":
        return await posthog.getProjects();
      
      case "switch-organization":
        return await posthog.switchOrganization(arguments.orgId);
      
      case "switch-project":
        return await posthog.switchProject(arguments.projectId);
      
      case "get-property-definitions":
        return await posthog.getPropertyDefinitions();
      
      case "get-llm-total-costs-for-project":
        return await posthog.getLLMTotalCosts(arguments.days);
      
      case "get-sql-insight":
        return await posthog.getSQLInsight(arguments.query);
      
      case "docs-search":
        return await posthog.searchDocs(arguments.query);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`ERROR - Tool call failed for ${toolName}:`, error);
    // Return a proper error object that can be handled by the MCP protocol
    return {
      error: true,
      message: error.message,
      details: error.toString()
    };
  }
}

// Handle JSON-RPC requests
async function handleJsonRpc(request) {
  try {
    const { method, params, id } = request;
    
    // Log incoming requests for debugging
    console.error(`DEBUG - Received request: method=${method}, id=${id}`);
    
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { 
            tools: { listChanged: false }
          },
          serverInfo: { 
            name: "posthog-mcp", 
            version: "1.0.0" 
          },
          tools: MCP_TOOLS
        },
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }
    
    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };
    }
    
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      const result = await handleToolCall(name, args);
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      };
    }
    
    throw new Error(`Unknown method: ${method}`);
  } catch (error) {
    // Return proper MCP error format
    return {
      jsonrpc: "2.0",
      id: request.id || null,
      error: {
        code: -32603,
        message: error.message,
        data: null
      },
    };
  }
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
  
  // Strip /posthog prefix if present
  if (path.startsWith('/posthog')) {
    path = path.substring(8); // Remove '/posthog' (8 characters)
  }
  
  // Health check endpoint
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
    return;
  }
  
  // SSE endpoint for MCP
  if (path === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    
    // Construct the full URL for the endpoint
    const protoHeader = req.headers["x-forwarded-proto"] || "https";
    const scheme = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host = req.headers["x-forwarded-host"] || req.headers.host || "mcp.timelinesaitech.com";
    const baseUrl = `${scheme}://${host}`;
    
    // Send the endpoint information with full URL
    const sessionId = Date.now();
    res.write(`event: endpoint\ndata: ${baseUrl}/sse/message?sessionId=${sessionId}\n\n`);
    
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
        const response = await handleJsonRpc(request);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
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
        const response = await handleJsonRpc(request);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
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
  console.log("PostHog Official MCP Server running on port " + PORT);
  console.log("API Key: " + (POSTHOG_API_KEY ? "✓ Set" : "✗ Missing"));
  console.log("Project ID: " + (POSTHOG_PROJECT_ID || "✗ Missing"));
  console.log("Base URL: " + POSTHOG_BASE_URL);
  console.log("Server ready for MCP clients with " + MCP_TOOLS.length + " tools");
  console.log("DEBUG - API Key (first 10 chars): " + (POSTHOG_API_KEY ? POSTHOG_API_KEY.substring(0, 10) + "..." : "None"));
  console.log("DEBUG - Project ID: " + POSTHOG_PROJECT_ID);
  console.log("DEBUG - Base URL: " + POSTHOG_BASE_URL);
});
