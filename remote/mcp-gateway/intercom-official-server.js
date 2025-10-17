const http = require("http");
const https = require("https");

const INTERCOM_API_TOKEN = process.env.INTERCOM_API_TOKEN;
const PORT = process.env.PORT || 8084;

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

// Intercom API client
class IntercomAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = "https://api.intercom.io";
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Intercom-Version": "2.11"
      },
    };

    console.log(`DEBUG - Making API request to: ${url}`);
    console.log(`DEBUG - Method: ${method}`);
    console.log(`DEBUG - API Token (first 10 chars): ${this.apiToken ? this.apiToken.substring(0, 10) + "..." : "None"}`);

    if (data) options.body = JSON.stringify(data);
    return makeRequest(url, options);
  }

  // Universal Search
  async universalSearch(query) {
    // Parse the query string to extract parameters
    const params = this.parseSearchQuery(query);

    if (params.object_type === "conversations") {
      return this.searchConversations(params);
    } else if (params.object_type === "contacts") {
      return this.searchContacts(params);
    } else {
      throw new Error("Must specify object_type:conversations or object_type:contacts");
    }
  }

  parseSearchQuery(query) {
    const params = {};
    const parts = query.split(/\s+/);

    for (const part of parts) {
      if (part.includes(":")) {
        const [key, value] = part.split(":", 2);
        params[key] = value.replace(/['"]/g, "");
      }
    }

    return params;
  }

  // Search Conversations
  async searchConversations(params = {}) {
    const searchData = {
      query: {}
    };

    // Build query based on params
    if (params.state) {
      searchData.query.field = "state";
      searchData.query.operator = "=";
      searchData.query.value = params.state;
    }

    if (params.source_type) {
      searchData.query.field = "source.type";
      searchData.query.operator = "=";
      searchData.query.value = params.source_type;
    }

    if (params.starting_after) {
      searchData.starting_after = params.starting_after;
    }

    if (params.limit) {
      searchData.per_page = parseInt(params.limit);
    }

    return this.makeRequest("/conversations/search", "POST", searchData);
  }

  // Get Single Conversation
  async getConversation(conversationId) {
    // Remove conversation_ prefix if present
    const id = conversationId.replace(/^conversation_/, "");
    return this.makeRequest(`/conversations/${id}`);
  }

  // Search Contacts
  async searchContacts(params = {}) {
    const searchData = {
      query: {}
    };

    if (params.email) {
      searchData.query.field = "email";
      searchData.query.operator = "=";
      searchData.query.value = params.email;
    } else if (params.email_domain) {
      searchData.query.field = "email";
      searchData.query.operator = "~";
      searchData.query.value = `@${params.email_domain}`;
    }

    if (params.starting_after) {
      searchData.starting_after = params.starting_after;
    }

    if (params.limit) {
      searchData.per_page = parseInt(params.limit);
    }

    return this.makeRequest("/contacts/search", "POST", searchData);
  }

  // Get Single Contact
  async getContact(contactId) {
    // Remove contact_ prefix if present
    const id = contactId.replace(/^contact_/, "");
    return this.makeRequest(`/contacts/${id}`);
  }

  // Fetch Resource (universal fetch by prefixed ID)
  async fetch(resourceId) {
    if (resourceId.startsWith("conversation_")) {
      return this.getConversation(resourceId);
    } else if (resourceId.startsWith("contact_")) {
      return this.getContact(resourceId);
    } else {
      throw new Error("Resource ID must be prefixed with conversation_ or contact_");
    }
  }
}

// Initialize API client
const api = new IntercomAPI(INTERCOM_API_TOKEN);

// MCP Tools definition
const MCP_TOOLS = [
  {
    name: "search",
    description: "Universal search tool for finding conversations and contacts using a query DSL. Must specify object_type:conversations or object_type:contacts. Supports field-based queries with operators.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string. Examples: 'object_type:conversations state:open', 'object_type:contacts email_domain:example.com'"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "fetch",
    description: "Retrieve complete detailed information for specific resources. Use IDs returned from search results (prefixed with conversation_ or contact_).",
    inputSchema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Resource ID with prefix (e.g., conversation_123 or contact_456)"
        }
      },
      required: ["resourceId"]
    }
  },
  {
    name: "search_conversations",
    description: "Search conversations with advanced filtering by state, source type, author, and timing.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "Conversation state (open, closed, snoozed)",
          enum: ["open", "closed", "snoozed"]
        },
        source_type: {
          type: "string",
          description: "Source type (email, conversation, chat, etc.)"
        },
        starting_after: {
          type: "string",
          description: "Pagination cursor from previous results"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 20, max 150)"
        }
      }
    }
  },
  {
    name: "get_conversation",
    description: "Retrieve a single conversation by ID with complete details including all conversation parts and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "Conversation ID (with or without conversation_ prefix)"
        }
      },
      required: ["conversationId"]
    }
  },
  {
    name: "search_contacts",
    description: "Search contacts by email, email domain, or other attributes with flexible matching options.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Contact email address"
        },
        email_domain: {
          type: "string",
          description: "Email domain (e.g., example.com)"
        },
        starting_after: {
          type: "string",
          description: "Pagination cursor from previous results"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 20, max 150)"
        }
      }
    }
  },
  {
    name: "get_contact",
    description: "Get complete contact information including custom attributes, location data, and activity timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "Contact ID (with or without contact_ prefix)"
        }
      },
      required: ["contactId"]
    }
  }
];

// Handle tool execution
async function executeTool(toolName, args) {
  console.error(`Executing tool: ${toolName}`);

  // Check if we have proper authentication
  const hasAuth = INTERCOM_API_TOKEN && INTERCOM_API_TOKEN !== "your_intercom_api_token_here";

  try {
    if (!hasAuth) {
      return {
        error: "Intercom API token not configured",
        message: "Please set INTERCOM_API_TOKEN environment variable",
        instructions: "Get your token from: https://app.intercom.com/a/apps/_/developer-hub"
      };
    }

    switch (toolName) {
      case "search":
        return await api.universalSearch(args.query);

      case "fetch":
        return await api.fetch(args.resourceId);

      case "search_conversations":
        return await api.searchConversations(args);

      case "get_conversation":
        return await api.getConversation(args.conversationId);

      case "search_contacts":
        return await api.searchContacts(args);

      case "get_contact":
        return await api.getContact(args.contactId);

      default:
        return { error: `Tool ${toolName} not implemented` };
    }
  } catch (error) {
    console.error(`Tool execution error: ${error.message}`);
    return {
      error: error.message,
      details: error.toString()
    };
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
            name: "intercom-mcp",
            version: "1.0.0"
          }
        },
      };
    }

    if (method === "notifications/initialized") {
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
    res.end(JSON.stringify({
      status: "healthy",
      service: "intercom-mcp",
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // SSE endpoint for MCP
  if (path === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const protoHeader = req.headers["x-forwarded-proto"] || "https";
    const scheme = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host = req.headers["x-forwarded-host"] || req.headers.host || "mcp.timelinesaitech.com";
    const baseUrl = `${scheme}://${host}`;

    const sessionId = Date.now();
    res.write(`event: endpoint\ndata: ${baseUrl}/intercom/sse/message?sessionId=${sessionId}\n\n`);

    const interval = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
    });

    return;
  }

  // SSE message endpoint for MCP
  if (path === "/sse/message" || path === "/intercom/sse/message") {
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
        if (response !== null) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } else {
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
  if (path === "/" || path === "/jsonrpc" || path === "/intercom") {
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
        if (response !== null) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } else {
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", path: path }));
});

// Start server
server.listen(PORT, () => {
  console.log("Intercom MCP Server running on port " + PORT);
  console.log("API Token: " + (INTERCOM_API_TOKEN ? "✓ Set" : "✗ Missing"));
  console.log("Server ready for MCP clients with " + MCP_TOOLS.length + " tools");
  console.log("DEBUG - API Token (first 10 chars): " + (INTERCOM_API_TOKEN ? INTERCOM_API_TOKEN.substring(0, 10) + "..." : "None"));
});
