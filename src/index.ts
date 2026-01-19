import { serve, file, write } from "bun";

const PORT = parseInt(process.env.PORT || "7243");
const LOG_FILE = process.env.LOG_FILE || "/tmp/agent-debug.log";

// Ensure log file exists
await write(LOG_FILE, "");

console.log(`Agent Debug Harness running on http://127.0.0.1:${PORT}`);
console.log(`Logging to: ${LOG_FILE}`);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (req.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    // Get all logs
    if (req.method === "GET" && url.pathname === "/logs") {
      const content = await file(LOG_FILE).text();
      const lines = content.trim().split("\n").filter(Boolean);
      const logs = lines.map((line) => JSON.parse(line));
      return Response.json(logs);
    }

    // Reset logs
    if (req.method === "POST" && url.pathname === "/reset") {
      await write(LOG_FILE, "");
      return new Response("Logs cleared");
    }

    // Append log (with optional session ID in path)
    if (req.method === "POST" && url.pathname.startsWith("/log")) {
      try {
        const body = await req.json();
        const sessionId = url.pathname.split("/")[2]; // /log/:sessionId
        const logEntry = {
          ...body,
          timestamp: body.timestamp || Date.now(),
          ...(sessionId && { sessionId }),
        };

        const logLine = JSON.stringify(logEntry) + "\n";
        const existingContent = await file(LOG_FILE).text();
        await write(LOG_FILE, existingContent + logLine);

        return new Response("OK");
      } catch (_e) {
        return new Response("Invalid JSON", { status: 400 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});
