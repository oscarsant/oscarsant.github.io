const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const host = "127.0.0.1";
const port = 8080;
const root = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || "application/octet-stream";
    res.statusCode = 200;
    res.setHeader("Content-Type", type);
    // Disable cache for dev
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || "/");
  pathname = pathname.replace(/\/+/, "/");

  // --- PWA/SW special-cases ---
  // Service worker updates can be sensitive to SPA fallback routing.
  // Always serve these as real files (or 404) and never rewrite them.
  const pwaPassThrough = new Set(["/sw.js", "/manifest.json"]);
  if (pwaPassThrough.has(pathname)) {
    const directPath = path.join(root, pathname);
    return sendFile(res, directPath);
  }

  let filePath = path.normalize(path.join(root, pathname));

  // Prevent directory traversal
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.stat(filePath, (err2, stats2) => {
      if (!err2 && stats2.isFile()) {
        sendFile(res, filePath);
      } else {
        // SPA fallback to index.html if requesting a path without an extension
        const hasExt = path.extname(filePath) !== "";
        const fallback = path.join(root, "index.html");
        if (!hasExt && fs.existsSync(fallback)) {
          sendFile(res, fallback);
        } else {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("404 Not Found");
        }
      }
    });
  });
});

server.listen(port, host, () => {
  console.log(`Dev server at http://${host}:${port}/`);
});
