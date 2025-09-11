const http = require("http");
const https = require("https");

// Google Ads API Configuration
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const PORT = process.env.PORT || 8083;

// Google Ads API Base URL
const GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com";
const GOOGLE_ADS_API_VERSION = "v18";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;
    
    const req = client.request(url, options, (res) => {
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

// Google Ads API client
class GoogleAdsAPI {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new access token using refresh token
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
        this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // Refresh 1 minute before expiry
        return this.accessToken;
      }
      throw new Error("Failed to get access token");
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const accessToken = await this.getAccessToken();
    const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}${endpoint}`;
    
    const options = {
      method,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
        "Content-Type": "application/json"
      }
    };
    
    if (GOOGLE_ADS_CUSTOMER_ID) {
      options.headers["login-customer-id"] = GOOGLE_ADS_CUSTOMER_ID;
    }
    
    if (data) options.body = JSON.stringify(data);
    
    return makeRequest(url, options);
  }

  async searchQuery(query) {
    const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
    return this.makeRequest(`/customers/${customerId}/googleAds:searchStream`, "POST", {
      query: query
    });
  }

  async getCampaigns() {
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 50
    `;
    return this.searchQuery(query);
  }

  async getAdGroups(campaignId = null) {
    let query = `
      SELECT 
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.campaign,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM ad_group
      WHERE segments.date DURING LAST_30_DAYS
    `;
    
    if (campaignId) {
      query += ` AND campaign.id = ${campaignId}`;
    }
    
    query += " ORDER BY metrics.impressions DESC LIMIT 50";
    return this.searchQuery(query);
  }

  async getKeywords() {
    const query = `
      SELECT 
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.average_cpc
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;
    return this.searchQuery(query);
  }

  async getAccountPerformance() {
    const query = `
      SELECT 
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.average_cpc,
        metrics.ctr,
        metrics.cost_per_conversion
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `;
    return this.searchQuery(query);
  }

  async getSearchTerms() {
    const query = `
      SELECT 
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date DURING LAST_7_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;
    return this.searchQuery(query);
  }
}

// MCP Tools definition
const MCP_TOOLS = [
  {
    name: "google-ads-get-campaigns",
    description: "Get all Google Ads campaigns with performance metrics",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "google-ads-get-ad-groups",
    description: "Get ad groups with performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Optional campaign ID to filter ad groups" }
      }
    }
  },
  {
    name: "google-ads-get-keywords",
    description: "Get keywords with performance metrics",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "google-ads-get-account-performance",
    description: "Get overall account performance metrics",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "google-ads-get-search-terms",
    description: "Get search terms report showing what users searched for",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "google-ads-custom-query",
    description: "Execute a custom Google Ads Query Language (GAQL) query",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The GAQL query to execute" }
      },
      required: ["query"]
    }
  }
];

// Handle MCP tool calls
async function handleToolCall(toolName, args, api) {
  try {
    switch (toolName) {
      case "google-ads-get-campaigns":
        return await api.getCampaigns();
      
      case "google-ads-get-ad-groups":
        return await api.getAdGroups(args.campaignId);
      
      case "google-ads-get-keywords":
        return await api.getKeywords();
      
      case "google-ads-get-account-performance":
        return await api.getAccountPerformance();
      
      case "google-ads-get-search-terms":
        return await api.getSearchTerms();
      
      case "google-ads-custom-query":
        if (!args.query) {
          throw new Error("Query parameter is required");
        }
        return await api.searchQuery(args.query);
      
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
        error: { code: -32700, message: "Parse error" }
      }
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
          serverInfo: { name: "google-ads-mcp", version: "1.0.0" }
        }
      }
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
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          }
        }
      }))
      .catch((error) => ({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message: error.message }
        }
      }));
  }

  return {
    status: 400,
    data: {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32601, message: "Method not found" }
    }
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
      Connection: "keep-alive"
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
          const api = new GoogleAdsAPI();
          const result = await handleJsonRpc(requestBody, api);
          
          res.writeHead(result.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result.data));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" }
          }));
        }
      });
      return;
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" }
      }));
      return;
    }
  }

  // Default response
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

// Start server
server.listen(PORT, () => {
  console.log("Google Ads MCP Server running on port " + PORT);
  console.log("Configuration Status:");
  console.log("  Client ID: " + (GOOGLE_ADS_CLIENT_ID ? "✓ Set" : "✗ Missing"));
  console.log("  Client Secret: " + (GOOGLE_ADS_CLIENT_SECRET ? "✓ Set" : "✗ Missing"));
  console.log("  Refresh Token: " + (GOOGLE_ADS_REFRESH_TOKEN ? "✓ Set" : "✗ Missing"));
  console.log("  Developer Token: " + (GOOGLE_ADS_DEVELOPER_TOKEN ? "✓ Set" : "✗ Missing"));
  console.log("  Customer ID: " + (GOOGLE_ADS_CUSTOMER_ID || "✗ Missing"));
  console.log("\nServer ready for MCP clients");
  
  if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET || !GOOGLE_ADS_REFRESH_TOKEN || 
      !GOOGLE_ADS_DEVELOPER_TOKEN || !GOOGLE_ADS_CUSTOMER_ID) {
    console.log("\n⚠️  Warning: Some required environment variables are missing!");
    console.log("Please set all required Google Ads API credentials.");
  }
});