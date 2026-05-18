# @sw4p/kit demo — 3-minute Loom recording shot list

**Audience:** Colosseum Frontier judges. They've seen MCPay, Latinum, Agent Arc. Differentiate fast.

**Total runtime:** 3:00 (Colosseum requires ≤3 min)

---

## 0:00–0:15 — The wedge (talking head or terminal)

**Visual:** sw4p logo → `@sw4p/kit` title card

**Voice:**
> "Galaxy Research called MCP, A2A, AP2, and x402 the foundational agent payment primitives. MCPay and Latinum proved agents need to pay.
> **None of them handle what happens when those payments cross chains.**
> sw4p kit is the settlement primitive for the multi-chain agent economy."

---

## 0:15–0:40 — What's in the box (screen-record)

**Visual:** GitHub repo page → README "Why this is frontier" table

**Voice (over scrolling):**
> "MCP 2025-11-25 — including the Tasks primitive for long-running settlement.
> x402 V2 — multi-network Discovery, Bazaar-ready.
> AP2 Cart Mandates — Google has no official TS SDK yet; this is the first open-source implementation.
> A2A. ERC-7683. All in one package, all under MIT."

**Screen action:** quickly hover the 6 sub-modules in the README table.

---

## 0:40–1:00 — Install + tools list (terminal)

**Visual:** Terminal, large font, dark theme

```bash
$ npx sw4p-mcp
```

**Show output:**
```
sw4p MCP server listening on stdio
tools registered:
  - sw4p.estimate
  - sw4p.settle
  - sw4p.status
  - sw4p.portfolio
  - sw4p.rebalance_plan
  - sw4p.rebalance_execute
  - sw4p.task
  - sw4p.ap2.cart_propose
  - sw4p.ap2.cart_execute
[OK] ready for agent connections
```

**Voice:**
> "One npx command. Nine tools. Any MCP-capable agent — Claude Code, Cursor, Continue, ElizaOS — now does cross-chain settlement."

---

## 1:00–2:00 — Live demo: Alice creator-payout (the hero shot)

**Visual:** Local Alice chat — terminal or web client, large enough to read

**Setup (off-camera):**
- Alice character has `@elizaos/plugin-sw4p-kit` wired in
- Backend = sw4p staging
- 3 Solana devnet creator wallets pre-loaded as recipients

**Conversation (act this out):**

> **User:** alice, pay the creators their weekly cut — 2 USDC each to the three solana wallets in the roster

> **Alice:** *(slight pause)* Reading the roster… 3 creators on Solana, 2 USDC each. Building 3 Cart Mandates. Route: CCTP V2. Fee: 50bps each. Gas-free on the Solana side via Kora. Quote per creator: you spend 2.01 USDC, creator receives 2.00 USDC. Sign to approve all three?

> **User:** yes

> **Alice:** *(stream)* Executing leg 1/3… `intent_aaa`. Leg 2/3… `intent_bbb`. Leg 3/3… `intent_ccc`. Watching.
>
> *(few seconds later)* All three intents settled. Total time: 47 seconds.

**Voice over the action:**
> "Watch the Cart Mandate flow. Alice proposes — sw4p quotes the route. User signs once. Alice executes three legs in parallel. Each leg lands native USDC on Solana, gas-free for the creators. **No SOL required at the destination, no wrapped tokens.**"

**Cut to Solscan (devnet):**
> "Three creator wallets, each received 2 USDC. Mainnet works the same way."

---

## 2:00–2:30 — x402 V2 + Discovery (terminal + JSON)

**Visual:** Two-pane terminal — left: server log, right: curl

**Show:**
```bash
$ curl https://api.sw4p.io/sdk/v1/estimate
< HTTP/1.1 402 Payment Required
< Content-Type: application/json
{
  "scheme": "sw4p-x402",
  "version": "0.2",
  "resource": "https://api.sw4p.io/sdk/v1/estimate",
  "accepts": [
    { "scheme": "exact", "network": "solana", "asset": "USDC", "amount": "0.01", "recipient": "5xN..." },
    { "scheme": "exact", "network": "base", "asset": "USDC", "amount": "0.01", "recipient": "0x..." }
  ]
}
```

**Voice:**
> "x402 V2 — multi-network accepts. Agent picks any chain. Discovery catalog at `.well-known/x402` is ready for Bazaar and x402scan crawlers."

---

## 2:30–2:50 — The thesis (talking head or diagram)

**Visual:** Stack diagram —
```
  Any agent (Claude / Cursor / Eliza / Continue / your stack)
                  │
        MCP · x402 · A2A · AP2 · ERC-7683
                  │
              @sw4p/kit          ←  this is the new layer
                  │
            sw4p settlement engine
                  │
   CCTP V2 · Solana gas sponsor · Solana DEX router · cross-chain messaging · native token corridors · multi-rail bridge
```

**Voice:**
> "sw4p was already a production settlement engine. The kit is what makes it agent-native. One layer. Every open standard. MIT licensed. Production-backed. Gasless on Solana."

---

## 2:50–3:00 — CTA

**Visual:** Repo URL on screen, big

**Voice:**
> "github dot com slash render-network-os slash sw4p-kit. `npx sw4p-mcp` and ship cross-chain agent payments today."

---

## Recording setup checklist

- [ ] Loom installed, account logged in (free tier supports up to 5 min)
- [ ] Local Alice + sw4p backend running and warmed up
- [ ] Browser tabs prepared: GitHub repo, Solscan devnet, x402 curl example
- [ ] Terminal font size 16pt minimum, high-contrast theme
- [ ] Microphone tested; no background noise
- [ ] Script printed or on a second monitor
- [ ] Backup: if Alice misbehaves on take, switch to pre-recorded transcript shown as terminal text

## Post-recording

- [ ] Trim to ≤3:00 hard limit
- [ ] Upload to Loom, get shareable URL
- [ ] Paste URL into `SUBMISSION.md` and the Colosseum form
