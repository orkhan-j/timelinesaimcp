## MCP Lab (Docker)

A minimal, production-ready scaffold to host and test remote MCP servers over SSE behind HTTPS.

### What you get
- Caddy reverse proxy: HTTPS (Let’s Encrypt), optional Basic Auth
- FastMCP sample SSE server at `/sse` with math tools
- Clean layout to add more MCP services later

### Prerequisites
- A domain pointed to this server (A/AAAA record)
- Docker and Docker Compose installed

### Quick start
1. Copy env and edit values:
   ```bash
   cp env.example .env
   # Generate password hash for Basic Auth
   docker run --rm caddy:2 caddy hash-password --plaintext 'your_password'
   # Paste output into BASIC_AUTH_HASH in .env
   ```
2. Bring the stack up:
   ```bash
   docker compose up -d --build
   ```
3. Verify:
   ```bash
   curl -I https://$DOMAIN/health
   # SSE endpoint is mounted at /sse; FastMCP internally exposes /sse
   curl -I https://$DOMAIN/sse
   ```

### Connect a client (SSE)
- Continue (VS Code/Cursor plugin) `config.yaml` example:
  ```yaml
  mcp:
    - name: math-sse
      type: sse
      url: https://${DOMAIN}/sse
      # If you enabled Basic Auth, some clients allow custom headers:
      # headers:
      #   Authorization: Basic BASE64(username:password)
  ```

- MCP CLI (wong2/mcp-cli) example:
  ```bash
  npx -y mcp-cli sse https://$DOMAIN/sse
  ```

- Claude Desktop / other MCP hosts: Add an SSE server pointing to `https://$DOMAIN/sse`. If Basic Auth is required and the client doesn’t support custom headers yet, place access behind VPN/Zero Trust or IP allowlist instead of Basic Auth.

### Add more servers
- Duplicate `servers/fastmcp-basic` to create new SSE servers with FastMCP
- Add another reverse proxy stanza in `Caddyfile` mapping a new path (e.g. `/sse-git`) to the new container
- For stdio-only MCP servers, consider running them locally in the client today or add a custom SSE bridge later

### Files
- `docker-compose.yml` – stack definition
- `Caddyfile` – HTTPS proxy and routing
- `servers/fastmcp-basic/*` – sample SSE server
- `env.example` – environment variables

### Security notes
- Prefer running behind VPN or a Zero Trust proxy for early testing
- Keep Basic Auth enabled for internet-facing endpoints when clients support it
- Rotate credentials and monitor access logs
