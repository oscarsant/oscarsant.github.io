import "dotenv/config";
import express from "express";
import { nanoid } from "nanoid";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = 3845;
const HOST = "127.0.0.1";

// In-memory session store
const sessions = new Map(); // sessionId -> { sseRes, createdAt }

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
}

function sendSSE(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {}
}

function closeSession(sessionId) {
  const s = sessions.get(sessionId);
  if (s) {
    try {
      s.sseRes.end();
    } catch {}
    sessions.delete(sessionId);
  }
}

// SSE endpoint
app.get("/mcp", (req, res) => {
  let { sessionId } = req.query;
  if (!sessionId) sessionId = nanoid();

  sseHeaders(res);
  res.flushHeaders?.();

  // register session
  sessions.set(sessionId, { sseRes: res, createdAt: Date.now() });

  // Announce session to client
  sendSSE(res, {
    jsonrpc: "2.0",
    method: "session.welcome",
    params: { sessionId },
  });

  // keepalive pings
  const pong = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {}
  }, 15000);

  req.on("close", () => {
    clearInterval(pong);
    closeSession(sessionId);
  });
});

// JSON-RPC endpoint
app.post("/mcp", async (req, res) => {
  const sessionId = req.get("x-session-id") || req.query.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res
      .status(400)
      .json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Invalid sessionId" },
        id: req.body?.id ?? null,
      });
  }

  const { id, method, params } = req.body || {};

  const reply = (result) => res.json({ jsonrpc: "2.0", id, result });
  const error = (message, code = -32000) =>
    res.json({ jsonrpc: "2.0", id, error: { code, message } });

  try {
    if (method === "initialize") {
      return reply({
        protocolVersion: "2024-11-05",
        serverInfo: { name: "Figma MCP", version: "0.1.0" },
        capabilities: {},
      });
    }

    if (method === "tools/list") {
      return reply({
        tools: [
          {
            name: "figma.health",
            description:
              "Checks if the server and Figma token (optional) are configured.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "figma.getFile",
            description: "Fetch a Figma file json by file key",
            inputSchema: {
              type: "object",
              required: ["fileKey"],
              properties: {
                fileKey: {
                  type: "string",
                  description: "Figma File Key from the URL",
                },
              },
            },
          },
        ],
      });
    }

    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};

      if (name === "figma.health") {
        const hasToken = !!process.env.FIGMA_TOKEN;
        return reply({
          content: [
            {
              type: "text",
              text: hasToken ? "ok: token present" : "ok: no token",
            },
          ],
        });
      }

      if (name === "figma.getFile") {
        const token = process.env.FIGMA_TOKEN;
        if (!token) return error("FIGMA_TOKEN not configured", -32602);
        const fileKey = (args.fileKey || "").trim();
        if (!fileKey) return error("fileKey is required", -32602);
        const url = `https://api.figma.com/v1/files/${encodeURIComponent(
          fileKey
        )}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return error(`Figma API error ${resp.status}`, -32010);
        const json = await resp.json();
        const out = {
          name: json?.name,
          lastModified: json?.lastModified,
          documentId: json?.document?.id,
          components: json?.components
            ? Object.keys(json.components).length
            : 0,
          styles: json?.styles ? Object.keys(json.styles).length : 0,
        };
        return reply({ content: [{ type: "json", data: out }] });
      }

      return error(`Unknown tool: ${name}`, -32601);
    }

    return error(`Unknown method: ${method}`, -32601);
  } catch (e) {
    return error(e?.message || "Unhandled error");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[MCP] Figma MCP listening on http://${HOST}:${PORT}/mcp`);
});
