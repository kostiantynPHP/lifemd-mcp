# MCP Server for ChatGPT Apps with External API Integration

MCP (Model Context Protocol) server for connecting ChatGPT to your external API. Allows you to communicate with your API through natural language in ChatGPT.

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. API Configuration

```bash
cp .env.example .env
```

Edit `.env`:

**Minimum required configuration:**

```env
API_BASE_URL=https://api.yourservice.com
API_KEY=your-api-key-here        # Optional: for 'api-key' header
API_TIMEOUT=30000                # Optional: request timeout in ms
PORT=3000                        # Optional: server port
```

**About AUTH_TOKEN:**

`AUTH_TOKEN` is **optional** and depends on your API authentication method:

**Option 1: Static Bearer token (if your API uses a fixed token that doesn't change):**

```env
API_BASE_URL=https://api.yourservice.com
API_KEY=12345                    # Static API key (for 'api-key' header)
AUTH_TOKEN=bearer-token-here     # Static Bearer token (for 'authorization' header)
```

**Option 2: Dynamic token (if token is generated after patient authorization):**

```env
API_BASE_URL=https://api.yourservice.com
API_KEY=12345                    # Static API key (for 'api-key' header)
# AUTH_TOKEN not needed - will be set dynamically after authorization
```

Then use `api_auth` tool to authorize patient and store token automatically. The dynamically generated token will override any static `AUTH_TOKEN` from `.env`.

**Example for testing (no key required):**

```env
API_BASE_URL=https://jsonplaceholder.typicode.com
API_KEY=
```

### 3. Build and Run

```bash
npm run build
npm start
```

Server will start on `http://localhost:3000`

### 4. Connect to ChatGPT

**Locally via ngrok:**

1. Install ngrok: https://ngrok.com/download
2. Run ngrok:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.app`)
4. In ChatGPT Apps/Developer Mode, add a connector with URL: `https://abc123.ngrok.app/mcp`

**Production:** Deploy to HTTPS hosting (Cloudflare Workers, Fly.io, Vercel, etc.)

### 5. Usage

After connecting, simply write in ChatGPT:

**If your API requires patient authorization:**

1. First authorize: "Authorize patient with username john@example.com and password secret123"
2. Then use API: "Get list of patients", "Create appointment", etc.

**If your API doesn't require authorization:**

- "Get list of users"
- "Create a new user named John"
- "Update user with id 1"
- "Delete post with id 5"

## 📖 How It Works

### Architecture

```
ChatGPT → MCP Server → Your External API → Response → ChatGPT
```

### Process

1. **You in ChatGPT:** "Get list of users"
2. **ChatGPT** calls the `api_get` tool with parameters
3. **MCP server** makes a GET request to `https://api.yourservice.com/users`
4. **Your API** returns data
5. **MCP server** returns structured data to ChatGPT
6. **ChatGPT** shows you the result

### What MCP Server Does

- ✅ Automatically adds `api-key` header with `API_KEY` value (if provided)
- ✅ Automatically adds `Authorization: Bearer` header with:
  - Static `AUTH_TOKEN` from `.env` (if provided), OR
  - Dynamic token from `api_auth` tool (if patient authorization was performed)
- ✅ Handles errors and timeouts
- ✅ Returns structured responses to ChatGPT
- ✅ Never passes your API key to ChatGPT (stays on server)

## 🛠️ Available Tools

### `api_auth` - Authorize Patient

Authorizes a patient and automatically stores the authentication token for all subsequent API requests.

**Example commands:**

- "Authorize patient with username john@example.com and password secret123"
- "Login patient using credentials"
- "Authenticate patient"

**Parameters:**

```json
{
  "endpoint": "/auth/login",
  "credentials": {
    "username": "john@example.com",
    "password": "secret123"
  },
  "tokenField": "token" // Optional: field name in response (default: "token" or "accessToken")
}
```

**How it works:**

1. Sends POST request to authorization endpoint with patient credentials
2. Extracts token from response (tries: `token`, `accessToken`, `access_token`)
3. Stores token in memory
4. All subsequent API requests will automatically include `Authorization: Bearer <token>` header

**Note:** Token is stored in memory and persists until server restart. Use this tool once per session.

### `api_get` - Get Data

Performs a GET request to the external API.

**Example commands:**

- "Get list of users"
- "Show post with id 1"
- "Find all comments for post 5"

**Parameters:**

```json
{
  "endpoint": "/users",
  "params": {
    "page": 1,
    "limit": 10
  }
}
```

### `api_post` - Create Data

Performs a POST request to create a resource.

**Example commands:**

- "Create a new user named John with email john@example.com"
- "Add a new post with title 'Hello' and text 'World'"

**Parameters:**

```json
{
  "endpoint": "/users",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### `api_put` - Update Data

Performs a PUT request to update a resource.

**Example commands:**

- "Update user with id 1, change name to Jane"
- "Change task 5 status to 'completed'"

**Parameters:**

```json
{
  "endpoint": "/users/1",
  "data": {
    "name": "Jane Doe"
  }
}
```

### `api_delete` - Delete Data

Performs a DELETE request to delete a resource.

**Example commands:**

- "Delete user with id 3"
- "Delete post number 10"

**Parameters:**

```json
{
  "endpoint": "/users/3"
}
```

### `get_info` - Server Information

Returns information about the MCP server and API configuration.

## 🧪 Testing

### Check Server Locally

```bash
# Check tools list
curl http://localhost:3000/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Test Tool Call

```bash
# Call api_get
curl http://localhost:3000/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "api_get",
      "arguments": {
        "endpoint": "/users"
      }
    },
    "id": 1
  }'
```

### Testing in ChatGPT

**⚠️ Important:** You need to connect the server to ChatGPT first!

1. Start server: `npm start`
2. Start ngrok: `ngrok http 3000`
3. Connect to ChatGPT (see "Connect to ChatGPT" section)
4. **Then** you can write commands in chat

**Example test commands:**

- "Get list of users"
- "Show post with id 1"
- "Create a new post"

## 📝 Examples for Different APIs

### JSONPlaceholder (Test API)

```env
API_BASE_URL=https://jsonplaceholder.typicode.com
API_KEY=
```

**Commands:**

- "Get all users"
- "Show post with id 1"
- "Create a new post"

### GitHub API

```env
API_BASE_URL=https://api.github.com
API_KEY=ghp_your_github_token_here
```

**Commands:**

- "Show my repositories"
- "Get information about repository microsoft/vscode"

### Your Own API

```env
API_BASE_URL=https://api.yourservice.com
API_KEY=your-api-key
```

## 🔐 Advanced API Configuration

If your API uses a different authentication method than the default Bearer token, you'll need to modify `server/src/api-client.ts`.

### 1. API Key in Custom Header (e.g., X-API-Key)

If your API requires the key in a custom header:

```typescript
// In api-client.ts, modify the constructor:
if (this.config.apiKey) {
  this.config.headers["X-API-Key"] = this.config.apiKey; // Instead of Authorization
  // Or remove the Authorization line if not needed
}
```

### 2. API Key in Query Parameter

If your API requires the key as a query parameter:

```typescript
// Modify buildUrl method:
private buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, this.config.baseUrl);

  // Add API key as query parameter
  if (this.config.apiKey) {
    url.searchParams.append("api_key", this.config.apiKey);
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}
```

### 3. Basic Authentication

If your API uses Basic Auth:

```typescript
// In createApiClient function:
export function createApiClient(): ApiClient {
  const baseUrl = process.env.API_BASE_URL || "https://api.example.com";
  const username = process.env.API_USERNAME || "";
  const password = process.env.API_PASSWORD || "";

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  return new ApiClient({
    baseUrl,
    headers: {
      "User-Agent": "MCP-Server/1.0.0",
      Authorization: `Basic ${credentials}`,
    },
    timeout: parseInt(process.env.API_TIMEOUT || "30000", 10),
  });
}
```

Then in `.env`:

```env
API_BASE_URL=https://api.yourservice.com
API_USERNAME=your-username
API_PASSWORD=your-password
```

### 4. Custom Headers

If your API requires custom headers:

```typescript
// In createApiClient function:
export function createApiClient(): ApiClient {
  const baseUrl = process.env.API_BASE_URL || "https://api.example.com";
  const apiKey = process.env.API_KEY || "";

  return new ApiClient({
    baseUrl,
    apiKey,
    headers: {
      "User-Agent": "MCP-Server/1.0.0",
      "X-Custom-Header": process.env.CUSTOM_HEADER_VALUE || "",
      Accept: "application/vnd.api+json", // Example
    },
    timeout: parseInt(process.env.API_TIMEOUT || "30000", 10),
  });
}
```

### Testing Your Custom Configuration

1. Set up your `.env` file
2. Test with curl:

```bash
# Test GET request
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.yourservice.com/endpoint

# Test POST request
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"key":"value"}' \
     https://api.yourservice.com/endpoint
```

3. If curl works, the MCP server should work too (with same headers)

### Additional Configuration Issues

**403 Forbidden:**

- Check API key permissions
- Verify CORS settings on API side
- Check if IP whitelisting is required

**Need Help?**

- Check your API documentation for authentication requirements
- Modify `api-client.ts` to match your API's requirements
- Test with curl first, then implement in code

## 🔧 Project Structure

```
mcp/
├── server/
│   └── src/
│       ├── index.ts          # Main MCP server
│       └── api-client.ts     # API client
├── .env                      # Your API settings (not in git)
├── .env.example              # Configuration template
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
npm install
```

### Error: "API Error: 401 Unauthorized"

- Check `API_KEY` in `.env` (for 'api-key' header, if required)
- If using static token: Check `AUTH_TOKEN` in `.env` (for 'authorization' header)
- If using dynamic token: Make sure you've called `api_auth` tool first to authorize patient
- Make sure tokens are not expired
- Verify token format is correct

### Error: "Request timeout"

- Increase `API_TIMEOUT` in `.env`
- Check API availability

### Server won't start

- Check that port 3000 is not occupied
- Change `PORT` in `.env`

### ChatGPT won't connect

- Make sure HTTPS is used (ngrok or production)
- Check that `/mcp` endpoint is accessible
- Check CORS settings

### ChatGPT doesn't call tools

- Check that server is running
- Check ngrok connection
- Make sure URL in ChatGPT ends with `/mcp`

### TypeScript errors

- Make sure Node.js 18+ is used (has built-in fetch)

## 🔒 Security

- ✅ API keys are stored only on the server (in `.env`)
- ✅ `.env` file is already in `.gitignore`
- ✅ API keys are never passed to ChatGPT
- ⚠️ For production, use secure secret storage methods

## 📚 Additional Information

- **Official Documentation:** https://developers.openai.com/apps-sdk/build/mcp-server
- **MCP Protocol:** https://modelcontextprotocol.io

## 🎯 Next Steps

1. Configure your API in `.env`
2. Start server locally
3. Connect via ngrok to ChatGPT
4. Test with different commands
5. Deploy to production for permanent use

---

**Ready!** Now you can communicate with your API through ChatGPT! 🚀
