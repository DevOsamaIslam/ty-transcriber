# Agent Commerce Gateway (ty-transcriber)

This directory contains the [Agent Commerce Gateway](https://github.com/devlab-group/agent-commerce)
configuration that exposes ty-transcriber's stored transcripts to AI agents.

Agents need **no account**: every transcript retrieval is paid per call with
**0.01 USDC** via [x402](https://www.x402.org) (EIP-3009 `transferWithAuthorization`
on Base). The gateway verifies the buyer's payment signature, proxies the call
to ty-transcriber's `GET /api/agent/transcripts/:id` endpoint, and settles
funds directly into the merchant wallet — the gateway holds no keys.

```text
AI agent ──x402 (0.01 USDC)──► Agent Commerce Gateway ──HTTP──► ty-transcriber
        ◄────────── transcript JSON ──────────┘               /api/agent/transcripts/:id
```

## Surfaces

- **MCP**: agents connect to `<gateway>/mcp` and discover the `transcript_get` tool.
- **HTTP**: `GET <gateway>/api/resources/transcript_get/invoke?id=...` (402
  challenge → signed payment → response).

## Setup

```bash
# 1. Run ty-transcriber (the gateway's merchant backend).
npm run dev   # or: npm run build && npm run start

# 2. Install the gateway CLI and copy the config.
npm install -g @devlab.group/agent-commerce
cp agent-commerce/config.example.yaml agent-commerce/config.yaml

# 3. Set the environment (see the gateway's .env.example):
#    MERCHANT_API_BASE_URL  e.g. http://localhost:5173 (this app)
#    GATEWAY_PUBLIC_BASE_URL / GATEWAY_PORT
#    MERCHANT_WALLET        your wallet receiving USDC
#    X402_*                 network/asset overrides (defaults: Base Sepolia)
agent-commerce validate --config agent-commerce/config.yaml
agent-commerce start --config agent-commerce/config.yaml
```

## Network notes

- Defaults target **Base Sepolia** (`eip155:84532`) with Circle's test USDC
  and the public `x402.org` facilitator — no credentials needed.
- For **Base mainnet** set `X402_NETWORK=eip155:8453`, `X402_ASSET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`,
  `X402_ASSET_NAME="USD Coin"`, and add `allowMainnet: true` plus a
  credential-bearing facilitator under `payments.x402`.
- `config.yaml` is git-ignored; commit only changes to `config.example.yaml`.
