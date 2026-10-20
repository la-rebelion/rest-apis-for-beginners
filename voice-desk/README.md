# Voice Desk: Qontent Tube with MCP and A2A

Companion to the video **"Give Your Agents a Voice Desk: Qontent Tube with MCP and A2A"**, part three of this series.

[Qontent Tube](https://qontent.tube) is a Markdown-first voiceover studio. Here, HAPI puts it behind two doors:

| Door | Client | Can do |
| --- | --- | --- |
| MCP (`/mcp`) | Your writing assistant, for example Claude Code | Create projects, create and save scripts, generate audio |
| A2A (`/a2a`) | A partner's render agent (`render-agent.mjs`) | List projects and scripts, read a script, check the audio manifest. **Read-only:** it can't edit or spend voice credits |

## Files

| File | What it is |
| --- | --- |
| `qontent-tube-agent.openapi.yaml` | A curated slice of the Qontent Tube API: 8 operations with clear `operationId`s (the full API would give an agent 28 tools) |
| `render-agent.mjs` | The partner agent, built on the official A2A JavaScript SDK (`@a2a-js/sdk` 1.3.0, A2A 1.0) |

## Run it

Requires a running Qontent Tube (its local API listens on `127.0.0.1:8787` and accepts loopback calls only), plus HAPI CLI 1.3.0 with the **Enterprise A2A plugin** ([license](https://billing.mcp.com.ai)).

```sh
hapi serve --specs qontent-tube-agent.openapi.yaml --headless --url http://127.0.0.1:8787 \
  --mcp --a2a --a2a-name "Qontent Tube Voice Desk" \
  --a2a-description "Check voiceover status and clip manifests"

# Your assistant: MCP
claude mcp add --transport http voice-desk http://localhost:3000/mcp

# The partner agent: A2A
npm install
VOICE_DESK_URL=http://localhost:3000 PROJECT="My project" node render-agent.mjs
```

The render agent prints the Agent Card's skills and how many clips are ready, downloads the ready WAVs to `./clips`, and shows that `generateSegmentAudio` is refused.

## Notes

- Path parameters are declared on each operation rather than on the path item, to work around a HAPI 1.3.0 issue.
- Audio files aren't proxied through HAPI. The manifest returns each clip's `audioUrl`, and the agent downloads it from Qontent Tube directly.
