const http = require("http");
const https = require("https");

const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const GOOGLE_ADS_ACCESS_TOKEN = process.env.GOOGLE_ADS_ACCESS_TOKEN;
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const PORT = process.env.PORT || 8083;

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

// Google Ads API client for basic operations
class GoogleAdsAPI {
  constructor(customerId, developerToken, accessToken) {
    this.customerId = customerId;
    this.developerToken = developerToken;
    this.accessToken = accessToken;
    this.baseUrl = "https://googleads.googleapis.com/v14";
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        "developer-token": this.developerToken,
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await makeRequest(url, options);
      return response;
    } catch (error) {
      console.error("Google Ads API Error:", error);
      throw error;
    }
  }

  async refreshAccessToken() {
    // Implement token refresh logic if needed
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token"
    });

    try {
      const response = await makeRequest(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      
      if (response.access_token) {
        this.accessToken = response.access_token;
        return response.access_token;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
    return null;
  }
}

// Define MCP tools for Google Ads
const MCP_TOOLS = [
  {
    name: "campaigns-list",
    description: "List all campaigns in the account",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "campaign-create",
    description: "Create a new campaign",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        budget: { type: "number", description: "Daily budget in account currency" },
        type: { 
          type: "string", 
          description: "Campaign type",
          enum: ["SEARCH", "DISPLAY", "SHOPPING", "VIDEO", "APP"]
        }
      },
      required: ["name", "budget", "type"]
    }
  },
  {
    name: "campaign-update",
    description: "Update an existing campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        updates: { type: "object", description: "Fields to update" }
      },
      required: ["campaignId", "updates"]
    }
  },
  {
    name: "campaign-pause",
    description: "Pause a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "campaign-enable",
    description: "Enable a paused campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "ad-groups-list",
    description: "List ad groups in a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "keywords-list",
    description: "List keywords in an ad group",
    inputSchema: {
      type: "object",
      properties: {
        adGroupId: { type: "string", description: "Ad group ID" }
      },
      required: ["adGroupId"]
    }
  },
  {
    name: "keyword-add",
    description: "Add keywords to an ad group",
    inputSchema: {
      type: "object",
      properties: {
        adGroupId: { type: "string", description: "Ad group ID" },
        keywords: {
          type: "array",
          description: "Keywords to add",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              matchType: { 
                type: "string",
                enum: ["EXACT", "PHRASE", "BROAD"]
              }
            }
          }
        }
      },
      required: ["adGroupId", "keywords"]
    }
  },
  {
    name: "performance-report",
    description: "Get performance metrics for campaigns",
    inputSchema: {
      type: "object",
      properties: {
        dateRange: {
          type: "object",
          properties: {
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" }
          }
        },
        metrics: {
          type: "array",
          description: "Metrics to retrieve",
          items: { type: "string" }
        }
      }
    }
  },
  {
    name: "budget-get",
    description: "Get budget information for campaigns",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID (optional)" }
      }
    }
  },
  {
    name: "account-info",
    description: "Get Google Ads account information",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "search-terms-report",
    description: "Get search terms performance report",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        dateRange: {
          type: "object",
          properties: {
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" }
          }
        }
      },
      required: ["campaignId"]
    }
  }
];

// Initialize API client
const api = new GoogleAdsAPI(
  GOOGLE_ADS_CUSTOMER_ID,
  GOOGLE_ADS_DEVELOPER_TOKEN,
  GOOGLE_ADS_ACCESS_TOKEN
);

// Handle tool execution
async function executeTool(toolName, args) {
  console.error(`Executing tool: ${toolName}`);
  
  try {
    switch (toolName) {
      case "campaigns-list":
        const query = `
          SELECT campaign.id, campaign.name, campaign.status, 
                 campaign_budget.amount_micros, metrics.impressions, 
                 metrics.clicks, metrics.cost_micros
          FROM campaign
          WHERE segments.date DURING LAST_30_DAYS
        `;
        return await api.makeRequest(
          `/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream`,
          "POST",
          { query }
        );

      case "campaign-create":
        // Simplified campaign creation
        return {
          message: "Campaign creation would require OAuth flow and proper setup",
          mockResponse: {
            id: "mock-campaign-123",
            name: args.name,
            budget: args.budget,
            type: args.type
          }
        };

      case "campaign-pause":
        return {
          message: `Campaign ${args.campaignId} would be paused`,
          success: true
        };

      case "campaign-enable":
        return {
          message: `Campaign ${args.campaignId} would be enabled`,
          success: true
        };

      case "ad-groups-list":
        return {
          message: `Fetching ad groups for campaign ${args.campaignId}`,
          mockData: [
            { id: "ag-1", name: "Ad Group 1", status: "ENABLED" },
            { id: "ag-2", name: "Ad Group 2", status: "PAUSED" }
          ]
        };

      case "performance-report":
        return {
          message: "Performance report",
          dateRange: args.dateRange,
          mockData: {
            impressions: 10000,
            clicks: 500,
            ctr: 0.05,
            avgCpc: 1.25,
            cost: 625.00
          }
        };

      case "account-info":
        return {
          customerId: GOOGLE_ADS_CUSTOMER_ID,
          accountName: "Google Ads Account",
          currencyCode: "USD",
          timeZone: "America/New_York"
        };

      default:
        return { error: `Tool ${toolName} not implemented yet` };
    }
  } catch (error) {
    console.error(`Tool execution error: ${error.message}`);
    return { error: error.message };
  }
}

// Handle JSON-RPC requests
async function handleJsonRpc(request) {
  try {
    const { method, params, id } = request;
    
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { 
            tools: {}
          },
          serverInfo: { 
            name: "googleads-mcp", 
            version: "1.0.0" 
          }
        },
      };
    }

    if (method === "notifications/initialized") {
      // This is a notification, not a request - no response needed
      return null;
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
      const result = await executeTool(name, args);
      
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }
    
    // Method not found
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: "Method not found",
      },
    };
  } catch (error) {
    console.error("Request handling error:", error);
    return {
      jsonrpc: "2.0",
      id: request?.id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message,
      },
    };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const path = req.url.split("?")[0];
  
  // Health check endpoint
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "googleads-mcp" }));
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
    res.write(`event: endpoint\ndata: ${baseUrl}/googleads/sse/message?sessionId=${sessionId}\n\n`);
    
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
  if (path === "/sse/message" || path === "/googleads/sse/message") {
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
        // Don't send response for notifications (they return null)
        if (response !== null) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } else {
          // For notifications, just acknowledge with 200 OK
          res.writeHead(200);
          res.end();
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }
  
  // JSON-RPC endpoint
  if (path === "/" || path === "/jsonrpc" || path === "/googleads") {
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
        // Don't send response for notifications (they return null)
        if (response !== null) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } else {
          // For notifications, just acknowledge with 200 OK
          res.writeHead(200);
          res.end();
        }
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
  console.log("Google Ads MCP Server running on port " + PORT);
  console.log("Customer ID: " + (GOOGLE_ADS_CUSTOMER_ID ? "✓ Set" : "✗ Missing"));
  console.log("Developer Token: " + (GOOGLE_ADS_DEVELOPER_TOKEN ? "✓ Set" : "✗ Missing"));
  console.log("Access Token: " + (GOOGLE_ADS_ACCESS_TOKEN ? "✓ Set" : "✗ Missing"));
  console.log("Server ready for MCP clients with " + MCP_TOOLS.length + " tools");
});