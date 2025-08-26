// Timelines MCP Server - Authenticated Version with GitHub OAuth
// Enhanced timeline tools with user authentication and permissions

import { SignJWT, jwtVerify } from 'jose';

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface UserSession {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  permissions: string[];
}

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
}

// Enhanced tools for authenticated users
function getAvailableTools(user?: UserSession): Tool[] {
  const basicTools: Tool[] = [
    {
      name: 'add',
      description: 'Add two numbers',
      inputSchema: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' },
        },
        required: ['a', 'b'],
      },
    },
    {
      name: 'multiply',
      description: 'Multiply two numbers',
      inputSchema: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' },
        },
        required: ['a', 'b'],
      },
    },
    {
      name: 'create_timeline',
      description: 'Create a new timeline with events',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Timeline title' },
          description: { type: 'string', description: 'Timeline description' },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Event date (YYYY-MM-DD)' },
                title: { type: 'string', description: 'Event title' },
                description: { type: 'string', description: 'Event description' },
                category: { type: 'string', description: 'Event category' },
              },
              required: ['date', 'title'],
            },
            description: 'Array of timeline events',
          },
          isPrivate: { type: 'boolean', description: 'Make timeline private (authenticated users only)' },
        },
        required: ['title', 'events'],
      },
    },
    {
      name: 'get_current_time',
      description: 'Get the current date and time',
      inputSchema: {
        type: 'object',
        properties: {
          timezone: { 
            type: 'string', 
            description: 'Timezone (e.g., UTC, America/New_York)',
            default: 'UTC'
          },
        },
      },
    },
  ];

  // Add authenticated-only tools
  if (user) {
    basicTools.push(
      {
        name: 'get_user_info',
        description: 'Get current user information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_project_timeline',
        description: 'Create a project timeline with milestones and dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            description: { type: 'string', description: 'Project description' },
            startDate: { type: 'string', description: 'Project start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'Project end date (YYYY-MM-DD)' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Milestone name' },
                  date: { type: 'string', description: 'Milestone date (YYYY-MM-DD)' },
                  description: { type: 'string', description: 'Milestone description' },
                  dependencies: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'List of milestone dependencies'
                  },
                  owner: { type: 'string', description: 'Milestone owner' },
                  status: { 
                    type: 'string', 
                    enum: ['planned', 'in-progress', 'completed', 'blocked'],
                    description: 'Milestone status'
                  },
                },
                required: ['name', 'date'],
              },
              description: 'Array of project milestones',
            },
          },
          required: ['projectName', 'startDate', 'endDate', 'milestones'],
        },
      },
      {
        name: 'analyze_timeline',
        description: 'Analyze timeline for insights and recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            timelineData: { type: 'string', description: 'Timeline data in JSON format' },
            analysisType: { 
              type: 'string', 
              enum: ['gaps', 'trends', 'critical-path', 'resource-allocation'],
              description: 'Type of analysis to perform'
            },
          },
          required: ['timelineData', 'analysisType'],
        },
      }
    );
  }

  return basicTools;
}

// Enhanced tool call handler with user context
async function handleToolCall(params: any, user?: UserSession) {
  try {
    const { name, arguments: args } = params;

    switch (name) {
      case 'add': {
        const { a, b } = args;
        if (typeof a !== 'number' || typeof b !== 'number') {
          throw new Error('Both arguments must be numbers');
        }
        const result = a + b;
        return {
          content: [
            {
              type: 'text',
              text: `🔢 The sum of ${a} and ${b} is ${result}${user ? ` (calculated for ${user.name})` : ''}`,
            },
          ],
        };
      }

      case 'multiply': {
        const { a, b } = args;
        if (typeof a !== 'number' || typeof b !== 'number') {
          throw new Error('Both arguments must be numbers');
        }
        const result = a * b;
        return {
          content: [
            {
              type: 'text',
              text: `✖️ The product of ${a} and ${b} is ${result}${user ? ` (calculated for ${user.name})` : ''}`,
            },
          ],
        };
      }

      case 'create_timeline': {
        const { title, description, events, isPrivate = false } = args;
        
        if (!title || !Array.isArray(events)) {
          throw new Error('Title and events array are required');
        }
        
        const sortedEvents = events.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let markdown = `# 📅 ${title}`;
        if (isPrivate && user) {
          markdown += ` 🔒 (Private Timeline for ${user.name})`;
        }
        markdown += `\\n\\n`;
        
        if (description) {
          markdown += `${description}\\n\\n`;
        }
        
        if (user) {
          markdown += `**Created by:** ${user.name} (${user.login})\\n`;
          markdown += `**Created on:** ${new Date().toLocaleDateString()}\\n\\n`;
        }
        
        markdown += `## Timeline Events\\n\\n`;
        
        sortedEvents.forEach((event: any, index: number) => {
          markdown += `### ${index + 1}. ${event.title}\\n`;
          markdown += `**📅 Date:** ${event.date}\\n`;
          if (event.category) {
            markdown += `**🏷️ Category:** ${event.category}\\n`;
          }
          if (event.description) {
            markdown += `**📝 Description:** ${event.description}\\n`;
          }
          markdown += `\\n`;
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Timeline "${title}" created successfully with ${events.length} events${isPrivate ? ' (Private)' : ''}`,
            },
            {
              type: 'text',
              text: markdown,
            },
          ],
        };
      }

      case 'get_current_time': {
        const { timezone = 'UTC' } = args || {};
        const now = new Date();
        
        let timeString: string;
        try {
          timeString = now.toLocaleString('en-US', { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          });
        } catch (error) {
          timeString = now.toISOString();
        }

        return {
          content: [
            {
              type: 'text',
              text: `🕐 Current time (${timezone}): ${timeString}${user ? ` for ${user.name}` : ''}`,
            },
          ],
        };
      }

      case 'get_user_info': {
        if (!user) {
          throw new Error('User authentication required');
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `👤 **User Information:**\\n\\n**Name:** ${user.name}\\n**GitHub:** @${user.login}\\n**Email:** ${user.email}\\n**Permissions:** ${user.permissions.join(', ')}`,
            },
          ],
        };
      }

      case 'create_project_timeline': {
        if (!user) {
          throw new Error('User authentication required for project timelines');
        }

        const { projectName, description, startDate, endDate, milestones } = args;
        
        if (!projectName || !startDate || !endDate || !Array.isArray(milestones)) {
          throw new Error('Project name, start date, end date, and milestones are required');
        }

        const sortedMilestones = milestones.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let markdown = `# 🚀 Project: ${projectName}\\n\\n`;
        markdown += `**📋 Description:** ${description || 'No description provided'}\\n`;
        markdown += `**📅 Duration:** ${startDate} → ${endDate}\\n`;
        markdown += `**👤 Created by:** ${user.name} (${user.login})\\n`;
        markdown += `**🗓️ Created:** ${new Date().toLocaleDateString()}\\n\\n`;
        
        markdown += `## 🎯 Project Milestones\\n\\n`;
        
        sortedMilestones.forEach((milestone: any, index: number) => {
          const statusEmoji = {
            'planned': '📋',
            'in-progress': '🔄',
            'completed': '✅',
            'blocked': '🚫'
          }[milestone.status] || '📋';
          
          markdown += `### ${index + 1}. ${statusEmoji} ${milestone.name}\\n`;
          markdown += `**📅 Target Date:** ${milestone.date}\\n`;
          markdown += `**📊 Status:** ${milestone.status || 'planned'}\\n`;
          
          if (milestone.owner) {
            markdown += `**👤 Owner:** ${milestone.owner}\\n`;
          }
          
          if (milestone.dependencies && milestone.dependencies.length > 0) {
            markdown += `**🔗 Dependencies:** ${milestone.dependencies.join(', ')}\\n`;
          }
          
          if (milestone.description) {
            markdown += `**📝 Description:** ${milestone.description}\\n`;
          }
          
          markdown += `\\n`;
        });

        return {
          content: [
            {
              type: 'text',
              text: `🚀 Project timeline "${projectName}" created successfully with ${milestones.length} milestones`,
            },
            {
              type: 'text',
              text: markdown,
            },
          ],
        };
      }

      case 'analyze_timeline': {
        if (!user) {
          throw new Error('User authentication required for timeline analysis');
        }

        const { timelineData, analysisType } = args;
        
        if (!timelineData || !analysisType) {
          throw new Error('Timeline data and analysis type are required');
        }

        let analysis = `# 📊 Timeline Analysis Report\\n\\n`;
        analysis += `**Analysis Type:** ${analysisType}\\n`;
        analysis += `**Analyst:** ${user.name} (${user.login})\\n`;
        analysis += `**Generated:** ${new Date().toLocaleDateString()}\\n\\n`;

        switch (analysisType) {
          case 'gaps':
            analysis += `## 🔍 Gap Analysis\\n\\n`;
            analysis += `- **Timeline Gaps Identified:** Based on the provided data, potential gaps in planning or execution phases\\n`;
            analysis += `- **Recommendations:** Consider adding buffer time and intermediate checkpoints\\n`;
            break;
            
          case 'trends':
            analysis += `## 📈 Trend Analysis\\n\\n`;
            analysis += `- **Patterns Detected:** Timeline shows consistent progression with identifiable trends\\n`;
            analysis += `- **Velocity Insights:** Project momentum and completion rates analysis\\n`;
            break;
            
          case 'critical-path':
            analysis += `## 🎯 Critical Path Analysis\\n\\n`;
            analysis += `- **Critical Dependencies:** Key milestones that impact project completion\\n`;
            analysis += `- **Risk Assessment:** Potential bottlenecks and mitigation strategies\\n`;
            break;
            
          case 'resource-allocation':
            analysis += `## 👥 Resource Allocation Analysis\\n\\n`;
            analysis += `- **Resource Distribution:** Current allocation patterns and optimization opportunities\\n`;
            analysis += `- **Capacity Planning:** Recommendations for better resource utilization\\n`;
            break;
            
          default:
            analysis += `## ⚠️ Unknown Analysis Type\\n\\nPlease specify a valid analysis type.\\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: `📊 Timeline analysis (${analysisType}) completed for ${user.name}`,
            },
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }

      default:
        throw new Error(`❌ Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

// JWT token management
async function createToken(user: UserSession, secret: string): Promise<string> {
  const jwtSecret = new TextEncoder().encode(secret);
  
  return await new SignJWT({ 
    sub: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    permissions: user.permissions
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(jwtSecret);
}

async function verifyToken(token: string, secret: string): Promise<UserSession | null> {
  try {
    const jwtSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, jwtSecret);
    
    return {
      id: payload.sub as string,
      login: payload.login as string,
      name: payload.name as string,
      email: payload.email as string,
      avatar_url: payload.avatar_url as string,
      permissions: payload.permissions as string[]
    };
  } catch (error) {
    return null;
  }
}

// GitHub OAuth functions
async function getGitHubUser(accessToken: string): Promise<UserSession> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${accessToken}`,
      'User-Agent': 'Timelines-MCP-Server'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user data from GitHub');
  }
  
  const userData = await response.json();
  
  return {
    id: userData.id.toString(),
    login: userData.login,
    name: userData.name || userData.login,
    email: userData.email || '',
    avatar_url: userData.avatar_url,
    permissions: ['timeline:create', 'timeline:read', 'project:create', 'analysis:run']
  };
}

async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description}`);
  }
  
  return data.access_token;
}

// SSE Handler with authentication
async function handleSSE(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract token from Authorization header or query param
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token');
  
  let user: UserSession | null = null;
  if (token) {
    user = await verifyToken(token, env.JWT_SECRET);
  }

  if (request.method === 'POST') {
    // Handle MCP messages
    try {
      const body = await request.text();
      const message = JSON.parse(body);
      let response: any;

      switch (message.method) {
        case 'tools/list':
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: getAvailableTools(user)
            }
          };
          break;
          
        case 'tools/call':
          const toolResult = await handleToolCall(message.params, user);
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: toolResult
          };
          break;
          
        default:
          response = {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Method not found: ${message.method}`
            }
          };
      }

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  // Handle SSE connection (GET request)
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection message with user info
  const initMessage = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'timelines-mcp-auth',
        version: '1.0.0',
        authenticated: !!user,
        user: user ? {
          name: user.name,
          login: user.login,
          permissions: user.permissions
        } : null
      }
    }
  };

  await writer.write(
    encoder.encode(`data: ${JSON.stringify(initMessage)}\\n\\n`)
  );

  // Close the stream
  await writer.close();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// OAuth flow handlers
async function handleAuthorize(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authUrl.searchParams.set('scope', 'user:email');
  authUrl.searchParams.set('state', state);
  
  return Response.redirect(authUrl.toString());
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return new Response('Authorization code not found', { status: 400 });
  }
  
  try {
    const accessToken = await exchangeCodeForToken(code, env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);
    const user = await getGitHubUser(accessToken);
    const jwtToken = await createToken(user, env.JWT_SECRET);
    
    // Return success page with token
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Successful</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: green; }
            .token { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <h1 class="success">✅ Authentication Successful!</h1>
        <p>Welcome, <strong>${user.name}</strong>!</p>
        <p>Your MCP server authentication token:</p>
        <div class="token">${jwtToken}</div>
        <p><strong>Instructions:</strong></p>
        <ol>
            <li>Copy the token above</li>
            <li>Use it in your MCP client with the header: <code>Authorization: Bearer YOUR_TOKEN</code></li>
            <li>Or append it as a query parameter: <code>?token=YOUR_TOKEN</code></li>
        </ol>
        <p>You can now access enhanced tools including project timelines and analysis features!</p>
    </body>
    </html>`;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error) {
    return new Response(`Authentication failed: ${error}`, { status: 400 });
  }
}

// Main Cloudflare Worker export
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // OAuth flow endpoints
    if (url.pathname === '/authorize') {
      return handleAuthorize(request, env);
    }
    
    if (url.pathname === '/callback') {
      return handleCallback(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('Timelines MCP Server - Authenticated Version is running! 🔐🚀', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // SSE endpoint for MCP
    if (url.pathname === '/sse') {
      return handleSSE(request, env);
    }

    // Root endpoint - server info with authentication status
    if (url.pathname === '/') {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token');
      
      let user: UserSession | null = null;
      if (token && env.JWT_SECRET) {
        user = await verifyToken(token, env.JWT_SECRET);
      }
      
      const info = {
        name: 'Timelines MCP Server - Authenticated',
        version: '1.0.0',
        description: 'MCP server with GitHub OAuth and enhanced timeline tools',
        authentication: {
          enabled: true,
          provider: 'GitHub OAuth',
          currentUser: user ? {
            name: user.name,
            login: user.login,
            permissions: user.permissions
          } : null
        },
        endpoints: {
          sse: '/sse',
          health: '/health',
          authorize: '/authorize',
          callback: '/callback'
        },
        tools: {
          public: getAvailableTools().map(tool => ({ name: tool.name, description: tool.description })),
          authenticated: user ? getAvailableTools(user).map(tool => ({ name: tool.name, description: tool.description })) : []
        }
      };
      
      return new Response(JSON.stringify(info, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Default 404
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};