#!/usr/bin/env bash
# Smoke test: scaffold, serve and call the Rebel Coffee API (REST + MCP) in an
# isolated HAPI_HOME. Requires the hapi CLI with the OpenAPI plugin.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-3399}"
export HAPI_HOME="$PWD/.hapi-home"
rm -rf "$HAPI_HOME" && mkdir -p "$HAPI_HOME/specs"
# Reuse globally installed plugins and config, if any.
for d in plugins config; do [ -d "$HOME/.hapi/$d" ] && ln -s "$HOME/.hapi/$d" "$HAPI_HOME/$d"; done
cp contract/orders.yaml "$HAPI_HOME/specs/"
hapi init orders
cp src/orders/Controller.ts src/orders/OrderService.ts "$HAPI_HOME/src/orders/"

hapi serve orders --mcp --port "$PORT" > "$HAPI_HOME/serve.log" 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null' EXIT
for _ in $(seq 1 30); do curl -sf "http://localhost:$PORT/health" >/dev/null && break; sleep 0.5; done

B="http://localhost:$PORT"; M=(-H 'content-type: application/json' -H 'accept: application/json, text/event-stream')
check() { if [[ "$2" == *"$3"* ]]; then echo "ok   $1"; else echo "FAIL $1: $2"; exit 1; fi; }
check "GET /orders/A-1001"   "$(curl -s "$B/orders/A-1001")" '"status":"shipped"'
check "GET /orders/A-9999"   "$(curl -s -o /dev/null -w '%{http_code}' "$B/orders/A-9999")" '404'
check "MCP tools/list"       "$(curl -s "${M[@]}" "$B/mcp" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')" '"name":"getOrder"'
check "MCP tools/call"       "$(curl -s "${M[@]}" "$B/mcp" -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"getOrder","arguments":{"orderId":"A-1001"}}}')" '"status":"shipped"'
echo "All checks passed."
