// Load environment variables
import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer } from "http";
import { createApiClient } from "./api-client.js";

// Create MCP server
const server = new McpServer({ 
  name: "api-integration-app", 
  version: "1.0.0" 
});

// Create API client for external API integration
const apiClient = createApiClient();

// Register resource for UI template
server.registerResource(
  "hello",
  "ui://widget/hello.html",
  {},
  async () => {
    // Read HTML template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello Widget</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin-top: 0;
      font-size: 2em;
    }
    .message {
      font-size: 1.2em;
      margin: 20px 0;
      padding: 15px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
    .info {
      margin-top: 20px;
      font-size: 0.9em;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📡 API Response</h1>
    <div id="root" class="message">Loading...</div>
    <button id="refreshBtn">Refresh</button>
    <div class="info" id="info"></div>
  </div>
  <script type="module">
    // Widget code that works with window.openai runtime
    const getToolOutput = () => {
      if (window.openai?.toolOutput) {
        return window.openai.toolOutput;
      }
      return { message: "Data unavailable" };
    };

    const getWidgetState = () => {
      if (window.openai?.widgetState) {
        return window.openai.widgetState;
      }
      return { clickCount: 0 };
    };

    const setWidgetState = (state) => {
      if (window.openai?.setWidgetState) {
        window.openai.setWidgetState(state);
      }
    };

    const callTool = async (name, args) => {
      if (window.openai?.callTool) {
        return await window.openai.callTool(name, args);
      }
      throw new Error("callTool unavailable");
    };

    const initWidget = () => {
      const root = document.getElementById("root");
      const info = document.getElementById("info");
      const refreshBtn = document.getElementById("refreshBtn");

      if (!root || !info || !refreshBtn) {
        console.error("Failed to find DOM elements");
        return;
      }

      const toolOutput = getToolOutput();
      const widgetState = getWidgetState();

      // Display API results
      if (toolOutput.success !== undefined) {
        // API response (success or error)
        if (toolOutput.success) {
          root.innerHTML = \`
            <div style="margin-bottom: 15px;">
              <span style="background: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">✅ Success</span>
              <span style="margin-left: 10px; opacity: 0.8;">Status: \${toolOutput.status || 'N/A'}</span>
            </div>
            <div style="margin-top: 15px;">
              <strong>Endpoint:</strong> <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">\${toolOutput.endpoint || 'N/A'}</code>
            </div>
            <div style="margin-top: 15px; max-height: 400px; overflow-y: auto;">
              <strong>Data:</strong>
              <pre style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto; font-size: 0.9em; white-space: pre-wrap; word-wrap: break-word;">\${JSON.stringify(toolOutput.data, null, 2)}</pre>
            </div>
          \`;
        } else {
          root.innerHTML = \`
            <div style="margin-bottom: 15px;">
              <span style="background: #ef4444; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">❌ Error</span>
            </div>
            <div style="margin-top: 15px;">
              <strong>Endpoint:</strong> <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">\${toolOutput.endpoint || 'N/A'}</code>
            </div>
            <div style="margin-top: 15px; color: #fecaca;">
              <strong>Error:</strong> \${toolOutput.error || 'Unknown error'}
            </div>
          \`;
        }
        if (toolOutput.timestamp) {
          info.textContent = \`Updated: \${new Date(toolOutput.timestamp).toLocaleString("en-US")}\`;
        }
      } else if (toolOutput.message) {
        // Simple message (greeting)
        root.textContent = toolOutput.message;
        if (toolOutput.timestamp) {
          info.textContent = \`Updated: \${new Date(toolOutput.timestamp).toLocaleString("en-US")}\`;
        }
      } else if (toolOutput.serverName) {
        // Server info
        root.innerHTML = \`
          <strong>Server:</strong> \${toolOutput.serverName}<br>
          <strong>Version:</strong> \${toolOutput.version}<br>
          <strong>Status:</strong> \${toolOutput.status}<br>
          <strong>Features:</strong> \${toolOutput.features?.join(", ") || "none"}
          \${toolOutput.apiConfig ? \`<br><br><strong>API Config:</strong><br>Base URL: \${toolOutput.apiConfig.baseUrl}<br>Has API Key (api-key header): \${toolOutput.apiConfig.hasApiKey ? 'Yes' : 'No'}<br>Auth Token from .env: \${toolOutput.apiConfig.hasAuthTokenFromEnv ? 'Yes' : 'No'}<br>Auth Token in memory: \${toolOutput.apiConfig.hasAuthTokenInMemory ? 'Yes (from authorization)' : 'No'}\` : ''}
        \`;
      } else {
        root.textContent = "No data to display";
      }

      refreshBtn.addEventListener("click", async () => {
        const currentState = getWidgetState();
        const newState = {
          clickCount: (currentState.clickCount || 0) + 1,
          lastUpdate: new Date().toISOString(),
        };

        setWidgetState(newState);

        // Refresh: reload widget by calling get_info
        try {
          await callTool("get_info", {});
          // Widget will automatically update when tool completes
        } catch (error) {
          console.error("Error refreshing:", error);
          root.textContent = "Error refreshing data";
        }
        info.textContent = \`Clicks: \${newState.clickCount}\`;
      });

      if (widgetState.clickCount && widgetState.clickCount > 0) {
        info.textContent += \` | Clicks: \${widgetState.clickCount}\`;
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWidget);
    } else {
      initWidget();
    }
  </script>
</body>
</html>
    `.trim();

    return {
      contents: [
        {
          uri: "ui://widget/hello.html",
          mimeType: "text/html+skybridge",
          text: htmlTemplate,
        },
      ],
    };
  }
);

// Register tool for displaying widget
server.registerTool(
  "hello_widget",
  {
    title: "Show Greeting",
    description: "Displays an interactive greeting widget",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for greeting",
        },
      },
      required: ["name"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
      "openai/toolInvocation/invoking": "Preparing greeting...",
      "openai/toolInvocation/invoked": "Greeting ready!",
    },
  },
  async ({ name }: { name: string }) => {
    const greeting = `Hello, ${name}! This works through MCP server.`;
    
    return {
      structuredContent: {
        message: greeting,
        timestamp: new Date().toISOString(),
      },
      content: [
        {
          type: "text",
          text: `Displayed greeting for ${name}`,
        },
      ],
      _meta: {
        serverVersion: "1.0.0",
        renderedAt: new Date().toISOString(),
      },
    };
  }
);

// Tool for patient authorization (login)
server.registerTool(
  "api_auth",
  {
    title: "Authorize Patient",
    description: "Authorizes a patient and stores the authentication token for subsequent requests",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Authorization endpoint (e.g., /auth/login, /patients/login)",
        },
        credentials: {
          type: "object",
          description: "Patient credentials (username, password, etc.)",
          additionalProperties: true,
        },
        tokenField: {
          type: "string",
          description: "Field name in response that contains the token (default: 'token' or 'accessToken')",
        },
      },
      required: ["endpoint", "credentials"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
      "openai/toolInvocation/invoking": "Authorizing patient...",
      "openai/toolInvocation/invoked": "Authorization complete",
    },
  },
  async ({ endpoint, credentials, tokenField }: { endpoint: string; credentials: Record<string, any>; tokenField?: string }) => {
    try {
      const response = await apiClient.post(endpoint, credentials);

      // Try to extract token from response
      const token = 
        response.data[tokenField || "token"] ||
        response.data[tokenField || "accessToken"] ||
        response.data.access_token ||
        response.data.token ||
        response.data.accessToken;

      if (token) {
        // Store token dynamically in API client
        apiClient.setAuthToken(token);
        
        return {
          structuredContent: {
            success: true,
            message: "Patient authorized successfully",
            tokenStored: true,
            endpoint,
            status: response.status,
          },
          content: [
            {
              type: "text",
              text: `Patient authorized successfully. Token stored for subsequent requests.`,
            },
          ],
          _meta: {
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        return {
          structuredContent: {
            success: false,
            error: "Token not found in response",
            endpoint,
            responseData: response.data,
          },
          content: [
            {
              type: "text",
              text: `Authorization response received but token not found. Check tokenField parameter or response structure.`,
            },
          ],
          _meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error: any) {
      return {
        structuredContent: {
          success: false,
          error: error.message,
          endpoint,
        },
        content: [
          {
            type: "text",
            text: `Authorization failed: ${error.message}`,
          },
        ],
        _meta: {
          errorDetails: error.toString(),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
);

// Tool for calling external API (GET request)
server.registerTool(
  "api_get",
  {
    title: "Get Data from API",
    description: "Performs GET request to external API",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Endpoint for request (e.g., /users, /posts/1)",
        },
        params: {
          type: "object",
          description: "Query parameters for request",
          additionalProperties: true,
        },
      },
      required: ["endpoint"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
      "openai/toolInvocation/invoking": "Requesting API...",
      "openai/toolInvocation/invoked": "Data received",
    },
  },
  async ({ endpoint, params }: { endpoint: string; params?: Record<string, any> }) => {
    try {
      const response = await apiClient.get(endpoint, params);

      return {
        structuredContent: {
          success: true,
          data: response.data,
          status: response.status,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Successfully retrieved data from ${endpoint}`,
          },
        ],
        _meta: {
          responseHeaders: response.headers,
        },
      };
    } catch (error: any) {
      return {
        structuredContent: {
          success: false,
          error: error.message,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Error requesting ${endpoint}: ${error.message}`,
          },
        ],
        _meta: {
          errorDetails: error.toString(),
        },
      };
    }
  }
);

// Tool for sending data to API (POST request)
server.registerTool(
  "api_post",
  {
    title: "Send Data to API",
    description: "Performs POST request to external API",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Endpoint for request",
        },
        data: {
          type: "object",
          description: "Data to send",
          additionalProperties: true,
        },
      },
      required: ["endpoint", "data"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
      "openai/toolInvocation/invoking": "Sending data to API...",
      "openai/toolInvocation/invoked": "Data sent",
    },
  },
  async ({ endpoint, data }: { endpoint: string; data: Record<string, any> }) => {
    try {
      const response = await apiClient.post(endpoint, data);

      return {
        structuredContent: {
          success: true,
          data: response.data,
          status: response.status,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Data successfully sent to ${endpoint}`,
          },
        ],
        _meta: {
          responseHeaders: response.headers,
        },
      };
    } catch (error: any) {
      return {
        structuredContent: {
          success: false,
          error: error.message,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Error sending to ${endpoint}: ${error.message}`,
          },
        ],
        _meta: {
          errorDetails: error.toString(),
        },
      };
    }
  }
);

// Tool for updating data in API (PUT request)
server.registerTool(
  "api_put",
  {
    title: "Update Data in API",
    description: "Performs PUT request to update data",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Endpoint for request",
        },
        data: {
          type: "object",
          description: "Data to update",
          additionalProperties: true,
        },
      },
      required: ["endpoint", "data"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
    },
  },
  async ({ endpoint, data }: { endpoint: string; data: Record<string, any> }) => {
    try {
      const response = await apiClient.put(endpoint, data);

      return {
        structuredContent: {
          success: true,
          data: response.data,
          status: response.status,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Data successfully updated in ${endpoint}`,
          },
        ],
        _meta: {},
      };
    } catch (error: any) {
      return {
        structuredContent: {
          success: false,
          error: error.message,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Error updating ${endpoint}: ${error.message}`,
          },
        ],
        _meta: {},
      };
    }
  }
);

// Tool for deleting data from API (DELETE request)
server.registerTool(
  "api_delete",
  {
    title: "Delete Data from API",
    description: "Performs DELETE request to delete data",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Endpoint for deletion",
        },
      },
      required: ["endpoint"],
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
    },
  },
  async ({ endpoint }: { endpoint: string }) => {
    try {
      const response = await apiClient.delete(endpoint);

      return {
        structuredContent: {
          success: true,
          status: response.status,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Data successfully deleted from ${endpoint}`,
          },
        ],
        _meta: {},
      };
    } catch (error: any) {
      return {
        structuredContent: {
          success: false,
          error: error.message,
          endpoint,
          timestamp: new Date().toISOString(),
        },
        content: [
          {
            type: "text",
            text: `Error deleting from ${endpoint}: ${error.message}`,
          },
        ],
        _meta: {},
      };
    }
  }
);

// Additional tool for getting server information
server.registerTool(
  "get_info",
  {
    title: "Get Information",
    description: "Returns information about MCP server and API configuration",
    inputSchema: {
      type: "object",
      properties: {},
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hello.html",
    },
  },
  async () => {
    const apiBaseUrl = process.env.API_BASE_URL || "not configured";
    const hasApiKey = !!process.env.API_KEY;
    const hasAuthToken = !!process.env.AUTH_TOKEN;
    const currentAuthToken = apiClient.getAuthToken();

    return {
      structuredContent: {
        serverName: "api-integration-app",
        version: "1.0.0",
        status: "active",
        features: ["api-integration", "widgets", "tools", "resources"],
        apiConfig: {
          baseUrl: apiBaseUrl,
          hasApiKey,
          hasAuthTokenFromEnv: hasAuthToken,
          hasAuthTokenInMemory: !!currentAuthToken,
        },
      },
      content: [
        {
          type: "text",
          text: "Information about MCP server and API configuration",
        },
      ],
      _meta: {},
    };
  }
);

// Create HTTP server for handling MCP requests
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/mcp" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        const response = await server.handleRequest(request);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error("Error handling request:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 MCP server started on http://localhost:${PORT}`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/mcp`);
});

