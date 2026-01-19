# Agent Debug Harness

A lightweight, standalone debug logging server that AI coding agents can spin up, inject logs into, and tear down during debugging sessions. Inspired by Cursor IDE's Debug Mode.

## Features

- **Zero dependencies** - Uses Bun's built-in HTTP server
- **Fast startup** - Ready in milliseconds
- **NDJSON output** - Each log line is valid JSON for easy parsing
- **Session support** - Group logs by session ID
- **Simple API** - Just `fetch()` to log

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-debug-harness.git
cd agent-debug-harness

# Or just copy the single file - it's self-contained
```

## Quick Start

```bash
# Start the server
bun run src/index.ts

# Or with custom port/log file
PORT=8080 LOG_FILE=./my-debug.log bun run src/index.ts
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check - returns "OK" |
| `POST` | `/log` | Append JSON to log file |
| `POST` | `/log/:sessionId` | Append JSON with session grouping |
| `GET` | `/logs` | Return all logs as JSON array |
| `POST` | `/reset` | Clear the log file |

## Agent Workflow

### 1. Start the harness (in background)

```bash
bun run /path/to/agent-debug-harness/src/index.ts &
DEBUG_PID=$!
echo $DEBUG_PID > /tmp/debug-harness.pid
```

### 2. Inject logging calls into source code

Add temporary fetch calls to the code you're debugging:

```typescript
// #region agent-debug
fetch('http://127.0.0.1:7243/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'myFile.ts:myFunction:entry',
    message: 'Starting process',
    data: { userId, action },
    timestamp: Date.now(),
    sessionId: 'debug-session-1',
    hypothesisId: 'H1,H2'
  })
}).catch(() => {})
// #endregion
```

### 3. Run your code and trigger the behavior

```bash
# Run your app/tests
npm test
```

### 4. Read the collected logs

```bash
# Via HTTP
curl http://localhost:7243/logs

# Or read the file directly
cat /tmp/agent-debug.log
```

### 5. Reset logs between runs

```bash
curl -X POST http://localhost:7243/reset
```

### 6. Stop the harness when done

```bash
kill $(cat /tmp/debug-harness.pid)
rm /tmp/debug-harness.pid
```

### 7. Remove injected logging code

Search for `#region agent-debug` and remove those blocks.

## Log Format

Each line in the log file is a JSON object (NDJSON format):

```json
{"location":"file.ts:function:stage","message":"Description","data":{"key":"value"},"timestamp":1234567890,"sessionId":"abc123","hypothesisId":"H1,H2"}
```

**Fields:**
- `timestamp` (auto-added if missing) - Unix timestamp in milliseconds
- `location` (optional) - Where in code: `file:function:stage`
- `message` (optional) - Human-readable description
- `data` (optional) - Arbitrary JSON data
- `sessionId` (optional) - Group related logs
- `hypothesisId` (optional) - Track which hypothesis this log tests

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7243` | Server port (7243 conflicts with Cursor IDE) |
| `LOG_FILE` | `/tmp/agent-debug.log` | Path to NDJSON log file |

## Examples

### Simple log

```bash
curl -X POST http://localhost:7243/log \
  -H "Content-Type: application/json" \
  -d '{"message":"User clicked button","data":{"buttonId":"submit"}}'
```

### Log with session ID in URL

```bash
curl -X POST http://localhost:7243/log/session-123 \
  -H "Content-Type: application/json" \
  -d '{"message":"Request started"}'
```

### Health check

```bash
curl http://localhost:7243/health
# OK
```

### Get all logs as JSON array

```bash
curl http://localhost:7243/logs
# [{"message":"User clicked button","data":{"buttonId":"submit"},"timestamp":1234567890}, ...]
```

### Reset logs

```bash
curl -X POST http://localhost:7243/reset
# Logs cleared
```

## License

MIT
