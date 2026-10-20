# REST APIs for Beginners: Rebel Coffee Orders

The companion repo for the La Rebelion Labs videos **"REST APIs for Beginners: From Your First Request to an AI That Can Use It"** and **"Your REST API Is Already an Agent: From REST to MCP to A2A"**.

You build a tiny, fictional coffee-shop order API from an OpenAPI contract. Then you open the same API to an AI assistant through MCP, without rewriting anything.

```text
              ┌── GET /orders/A-1001 ───────┐
 App ─────────┤                             ├──► Controller ──► OrderService ──► data
 AI assistant ┴── POST /mcp (tools/call) ───┘
```

## What's inside

| Path | What it is |
| --- | --- |
| `contract/orders.yaml` | The contract (OpenAPI 3.1): `listOrders`, `getOrder`, `createOrder` |
| `src/orders/OrderService.ts` | Business logic: three fictional orders in memory |
| `src/orders/Controller.ts` | Connects HTTP to the service; replaces the controller `hapi init` generates |
| `requests/rest-and-mcp.http` | Every REST and MCP request from the first video ([VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)) |
| `requests/a2a.http` | The A2A requests from the follow-up video (requires HAPI Enterprise) |
| `scripts/smoke.sh` | Scaffolds, serves and checks everything in an isolated `HAPI_HOME` |

## Prerequisites

- [Bun](https://bun.sh/)
- The [HAPI CLI](https://hapi.mcp.com.ai) with its OpenAPI plugin:

```sh
bun add -g @mcp-com-ai/hapi@latest @mcp-com-ai/plugin-openapi@latest
hapi plugins list   # should show "HAPI OpenAPI"
```

Tested with HAPI CLI 1.3.0.

## Run it

HAPI keeps specs and generated code under `HAPI_HOME` (default `~/.hapi`).

```sh
# 1. Put the contract where HAPI looks for specs
mkdir -p ~/.hapi/specs && cp contract/orders.yaml ~/.hapi/specs/

# 2. Scaffold a controller from the contract (writes ~/.hapi/src/orders/Controller.ts)
hapi init orders

# 3. Replace the generated stubs with the real logic
cp src/orders/Controller.ts src/orders/OrderService.ts ~/.hapi/src/orders/

# 4. Serve the REST API (interactive docs at http://localhost:3000/openapi)
hapi serve orders

# 5. Serve the REST API and the MCP endpoint at http://localhost:3000/mcp
hapi serve orders --mcp
```

Prefer not to touch `~/.hapi`? Run `./scripts/smoke.sh`, which does all of this in `./.hapi-home` and checks the results.

## Try it

```sh
curl http://localhost:3000/orders/A-1001     # 200: shipped
curl -i http://localhost:3000/orders/A-9999  # 404: Order A-9999 not found
```

Connect an AI assistant to `http://localhost:3000/mcp` as a remote (Streamable HTTP) MCP server. For example, in Claude Code:

```sh
claude mcp add --transport http orders http://localhost:3000/mcp
```

Then ask: *"What's the status of order A-1001?"*

## Going further: A2A

With the licensed HAPI Enterprise A2A plugin, the same API also becomes an agent with a public Agent Card:

```sh
hapi serve orders --mcp --a2a --a2a-name "Rebel Coffee Orders" --a2a-description "Look up coffee orders"
```

Only read-only operations (`getOrder`, `listOrders`) are published as skills. Request a license at [billing.mcp.com.ai](https://billing.mcp.com.ai).

## Notes

- All data is fictional.
- **No authentication** on purpose, to keep it simple. Don't expose this server to the internet.
- Not validated yet: the request body (for example `quantity: 0`) and the `status` filter values. That's a good exercise: validate in `OrderService` and return 400.

## License

MIT. Made by [La Rebelion Labs](https://rebelion.la). Go Rebels! ✊🏽
