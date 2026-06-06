# Figma MCP (Local)

Minimal local MCP server that exposes Figma tools via SSE for the VS Code Copilot MCP client.

## Prereqs

- Node.js 18+
- VS Code with a Copilot MCP client (e.g., GitHub Copilot MCP)
- This workspace contains `.vscode/mcp.json` pointing to `http://127.0.0.1:3845/mcp`

## Setup

```bash
cd figma-mcp-server
npm install
cp .env.example .env
# edit .env and set FIGMA_TOKEN=<your personal access token>
```

Create a Figma personal access token in your Figma account settings. The `figma.health` tool works without a token, but `figma.getFile` requires it.

## Run

```bash
npm run dev
# or
npm start
```

Server listens on:

- SSE + JSON-RPC: http://127.0.0.1:3845/mcp

You should see a log:

```
[MCP] Figma MCP listening on http://127.0.0.1:3845/mcp
```

## VS Code (Copilot MCP)

- Open the Copilot MCP panel.
- You should see “Figma MCP”. If not, Reload Window.
- Tools exposed:
  - `figma.health` — checks server/token presence
  - `figma.getFile` — fetches Figma file metadata by File Key

### Using figma.getFile

- Copy the File Key from a Figma URL: `https://www.figma.com/file/<FILE_KEY>/...`
- Run `figma.getFile` and paste the key. You should get JSON summary (name, lastModified, counts).

## Quick curl sanity check (optional)

Start the server then:

```bash
# SSE stream (shows a session.welcome with a sessionId)
curl -N http://127.0.0.1:3845/mcp
```

Note: JSON-RPC calls require a negotiated session header; use the VS Code MCP client instead of curl for full flow.

## Notes

- No CORS needed for VS Code desktop.
- If the MCP panel shows only a Delete button, your server returned no tools. Ensure it’s running and `tools/list` returns the two tools above.
