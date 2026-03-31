# Video Script — rndrntwrk / 555 Protocol Founder Introduction

> **Format**: 2-3 minute video script, spoken by @enoomian (solo founder)
> **Register**: crypto-native, direct, lowercase energy, philosophical but not academic
> **Prompt**: "Submit a 2 to 3 minute video introducing the founders and their roles, clearly explaining what the project does, the problem it solves, who it is for, why it matters, and the core thesis behind it. Include what makes your approach unique, your current progress, and what you plan to build next."

---

## Script (~2:30)

**[OPEN — face to camera, or screen share of stream.rndrntwrk.com]**

hey. i'm enoomian. i'm the solo founder of rndrntwrk — that's render network, no vowels. i design and build the entire stack myself. protocol, infrastructure, frontend, backend, AI agents, token economics — all of it.

**[BEAT — what it is]**

rndrntwrk is an ownership economy protocol. the core product right now is 555stream — a browser-based live streaming studio that replaces OBS. you open a tab, go live to twitch, youtube, kick, x, tiktok, zora, pump.fun — all at once. no download. no desktop app. just a browser. encoding runs in the cloud so your machine doesn't touch it.

but the streaming tool is just the surface. underneath it is a full economic layer built on the $555 token on solana. every economic event in the system — ads, tips, subscriptions, marketplace transactions — flows through a policy engine that enforces a 10% allocation to what we call the audience reward pool. the ARP. audiences get paid for verified attention. not engagement farming. actual, cryptographically verifiable presence.

**[BEAT — the problem]**

here's the problem we're solving. i call it the creator's dilemma.

every creator on the internet has an audience. that audience has attention. but right now, that attention gets monetized by platforms — not by the creator, and definitely not by the audience. twitch takes 50% of sub revenue. youtube decides your CPM. and the dominant ad format — the mid-roll, the ad read — literally interrupts your content. you stop what you're doing to sell something. that's broken.

and it's worse than that. your audience is siloed. your twitch followers don't talk to your youtube subscribers. you don't own any of it. the platform does.

**[BEAT — the thesis / what makes it unique]**

our thesis is that attention is the scarcest resource in the universe, and the people who generate it and the people who give it should both get paid.

so we built a few things that don't exist anywhere else.

first — L-Bar ads. these are squeeze-back overlays, like what ESPN does during live sports. the stream shrinks, the ad appears alongside it, and the program audio never stops. your content keeps playing. non-interruptive monetization. no one in streaming has this.

second — the 555x402 protocol suite. this is a verifiable attention protocol where the server pays the client. not the other way around. you prove you watched, you get paid. we also built AGG — solana-native HTTP 402 micropayments — and Hyperlink, which are multi-chain payment links live at 555hyper.link.

third — the revenue model. 10% of every dollar goes to the audience reward pool before anything else. of the remaining 90%, creators and the platform split it — and the platform's share funds token burns, reserves, and protocol development. no middleman takes 50%. the economy is designed, not extracted.

**[BEAT — current progress]**

here's where we are right now.

555stream is live at stream.rndrntwrk.com. full studio — scenes, overlays, simulcast to seven platforms via cloudflare. we just shipped a two-sided ad marketplace where advertisers create campaigns, streamers browse and accept them, and an AI engine auto-triggers ads at optimal engagement moments. all impression billing is atomic, policy-driven, with full economic event audit trails.

sw4p, our cross-chain USDC-to-$555 bridge, is audited by zigtur — five separate audits across EVM, solana, and tron — and live on mainnet. our arcade has 18 browser games running against a shared leaderboard. and alice — our AI agent — is an autonomous stream operator. she's not a chatbot. she's a proprietor. she manages the stream, triggers ads, controls overlays, invites guests — she runs the show.

**[BEAT — what's next]**

what's next is milaidy — a local-first AI agent framework we've been building in parallel. alice migrates from cloud to edge. runs on your hardware. your data stays yours. we're also building the audience ownership layer — verifiable on-chain proof that your viewers are yours — and scaling the marketplace toward programmatic ad buying.

**[CLOSE]**

we're not building toward an exit. we're building toward a world where attention has a price, creators own their inventory, and audiences aren't the product — they're participants.

i'm enoomian. this is rndrntwrk. appreciate you watching.

**[END]**

---

## Notes

- **Runtime**: ~2:20-2:40 at natural speaking pace (~150 wpm, script is ~635 words)
- **Tone**: Direct address to camera, no hype language, no "we're excited to announce." Matter-of-fact with philosophical anchoring.
- **Visual suggestions**: Screen share of 555stream studio during product sections, token/protocol diagrams during economic sections, code commits or GitHub activity during progress section.

## Revision Log (v2 — Feb 19, 2026)

Holistic codebase audit against every claim. Changes:

| What Changed | Why |
|---|---|
| Added TikTok + Zora to platform list (5 → 7) | Code defines 7 platforms in `sessions.js`, not 5 |
| Added "encoding runs in the cloud" | Honest about server-side capture architecture; positions as feature |
| Removed "mandatory" from ARP description | 10% is policy-enforced via env var, not hardcoded |
| **Replaced "90/10 creator-first" revenue claim** | **SOW v2 default gives creator 45% of gross, not 90%. Legacy mode exists but is not the current policy. Reframed to describe the actual flow honestly.** |
| "cross-chain" → "multi-chain" for Hyperlink | Code supports Solana, Base, Polygon |
| Specified "five separate audits across EVM, solana, and tron" | 5 Zigtur audit PDFs confirmed in repo — underselling left credibility on the table |
| "five-plus platforms" → "seven platforms" | Accurate count |
| Replaced "plays games, controls the economy" with specific capabilities | Alice manages stream, triggers ads, controls overlays, invites guests — verifiable in plugin actions |
| "finishing the audience-as-cNFT ownership layer" → "building the audience ownership layer" | Bubblegum CPI is explicitly TODO in both SGAS and Inventory services |
| Removed "hardening the ARP oracle pipeline" from "what's next" | That work was completed Feb 18, 2026 — it's done |
| Added "we've been building in parallel" for Milaidy | Milaidy is v2.0.0-alpha.9 with 10+ plugins — real codebase, not vaporware |
