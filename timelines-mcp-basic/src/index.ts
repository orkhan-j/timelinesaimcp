// Timelines MCP Server - Basic Version for Cloudflare Workers
// Provides math tools and timeline management tools

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Available tools
function getAvailableTools(): Tool[] {
  return [
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
              },
              required: ['date', 'title'],
            },
            description: 'Array of timeline events',
          },
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
    {
      name: 'posthog_query',
      description: 'Query PostHog analytics data',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'PostHog query (HogQL or insights query)' },
          dateRange: { type: 'string', description: 'Date range (e.g., "last_7_days", "last_30_days")', default: 'last_7_days' },
        },
        required: ['query'],
      },
    },
    {
      name: 'posthog_events',
      description: 'Get PostHog events with filters',
      inputSchema: {
        type: 'object',
        properties: {
          event: { type: 'string', description: 'Event name to filter by' },
          limit: { type: 'number', description: 'Number of events to return', default: 100 },
          dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        },
      },
    },
  ];
}

// Tool call handler
async function handleToolCall(params: any) {
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
              text: `🧮 The sum of ${a} and ${b} is ${result}`,
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
              text: `✖️ The product of ${a} and ${b} is ${result}`,
            },
          ],
        };
      }

      case 'create_timeline': {
        const { title, description, events } = args;
        
        if (!title || !Array.isArray(events)) {
          throw new Error('Title and events array are required');
        }
        
        const sortedEvents = events.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let markdown = `# 📅 ${title}\n\n`;
        if (description) {
          markdown += `${description}\n\n`;
        }
        markdown += `## Timeline Events\n\n`;
        
        sortedEvents.forEach((event: any, index: number) => {
          markdown += `### ${index + 1}. ${event.title}\n`;
          markdown += `**📅 Date:** ${event.date}\n`;
          if (event.description) {
            markdown += `**📝 Description:** ${event.description}\n`;
          }
          markdown += `\n`;
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Timeline "${title}" created successfully with ${events.length} events`,
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
              text: `🕐 Current time (${timezone}): ${timeString}`,
            },
          ],
        };
      }

      case 'posthog_query': {
        const { query, dateRange = 'last_7_days' } = args;
        
        if (!query) {
          throw new Error('Query parameter is required');
        }

        // Simulate PostHog query response
        const mockResults = {
          query,
          dateRange,
          results: [
            { event: 'page_view', count: 1250, date: '2024-08-20' },
            { event: 'page_view', count: 1180, date: '2024-08-21' },
            { event: 'page_view', count: 1420, date: '2024-08-22' },
            { event: 'page_view', count: 1380, date: '2024-08-23' },
            { event: 'page_view', count: 1290, date: '2024-08-24' },
            { event: 'page_view', count: 980, date: '2024-08-25' },
            { event: 'page_view', count: 1050, date: '2024-08-26' }
          ],
          totalEvents: 8550,
          averageDaily: 1221
        };

        return {
          content: [
            {
              type: 'text',
              text: `📈 PostHog Query Results\n\n**Query**: ${query}\n**Date Range**: ${dateRange}\n**Total Events**: ${mockResults.totalEvents.toLocaleString()}\n**Daily Average**: ${mockResults.averageDaily}\n\n**Daily Breakdown**:\n${mockResults.results.map(r => `• ${r.date}: ${r.count.toLocaleString()} events`).join('\n')}`,
            },
          ],
        };
      }

      case 'posthog_events': {
        const { event, limit = 100, dateFrom, dateTo } = args || {};
        
        // Simulate PostHog events response
        const mockEvents = [];
        const eventTypes = event ? [event] : ['page_view', 'button_click', 'form_submit', 'user_signup'];
        
        for (let i = 0; i < Math.min(limit, 50); i++) {
          const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
          
          mockEvents.push({
            event: randomEvent,
            timestamp: timestamp.toISOString(),
            properties: {
              $current_url: `https://timelinesaitech.com/page-${Math.floor(Math.random() * 10)}`,
              $browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
              user_id: `user_${Math.floor(Math.random() * 1000)}`
            }
          });
        }

        const filterInfo = [];
        if (event) filterInfo.push(`Event: ${event}`);
        if (dateFrom) filterInfo.push(`From: ${dateFrom}`);
        if (dateTo) filterInfo.push(`To: ${dateTo}`);
        
        return {
          content: [
            {
              type: 'text',
              text: `📁 PostHog Events\n\n**Filters**: ${filterInfo.length ? filterInfo.join(', ') : 'None'}\n**Results**: ${mockEvents.length} events\n\n**Recent Events**:\n${mockEvents.slice(0, 10).map(e => `• ${e.event} - ${e.timestamp.split('T')[0]} ${e.timestamp.split('T')[1].split('.')[0]} - ${e.properties.user_id}`).join('\n')}${mockEvents.length > 10 ? `\n...and ${mockEvents.length - 10} more events` : ''}`,
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

// SSE Handler for MCP communication
async function handleSSE(request: Request): Promise<Response> {
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
              tools: getAvailableTools()
            }
          };
          break;
          
        case 'tools/call':
          const toolResult = await handleToolCall(message.params);
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

  // Send initial connection message
  await writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'timelines-mcp-basic',
            version: '1.0.0'
          }
        }
      })}\n\n`
    )
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

// Cloudflare Worker export
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
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

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('Timelines MCP Server - Basic Version is running! 🚀', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // SSE endpoint for MCP
    if (url.pathname === '/sse') {
      return handleSSE(request);
    }

    // Root endpoint - server info
    if (url.pathname === '/') {
      const info = {
        name: 'Timelines MCP Server - Basic',
        version: '1.0.0',
        description: 'MCP server with math and timeline tools',
        endpoints: {
          sse: '/sse',
          health: '/health'
        },
        tools: getAvailableTools().map(tool => ({ name: tool.name, description: tool.description }))
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