# Render Network — MetaDAO Listing Package

Project owner: Render Network (building tools and a network for a sustainable creator economy)
Contact: founders@rendernet.work
Website: https://rendernet.work
Repository: monorepo (backend, frontend, chat-gateway, discord)

## Project Name & Description

Short (1–2 sentences)
- Render Network is building the tools and the network that connect viewers, creators, advertisers, and partner businesses to power a sustainable creator economy. We provide creator‑controlled overlays and a straightforward ad system that can show the same ad on many live streams at once—or target specific streams—using simple, transparent rules.

Long
- Render Network is building the tools and the network between viewers, creators, advertisers, and partner businesses needed for a sustainable creator economy. Today, most streams use static badges or manual overlays; brands can’t reliably reach smaller creators, and creators miss revenue. We provide a Solana‑native overlay system and ad tools that make it easy to show ads inside overlays across many streams—and to measure what happens—without pop‑ups or intrusive formats.
- The stack includes a creator‑controlled overlay system, a simple control panel, a real‑time gateway for events, and a dynamic ad layer. Creators choose size, placement, duration, and theme; updates propagate instantly across OBS/Streamlabs and platforms like Twitch, Kick, and YouTube. We meet users where they are, starting with crypto‑native venues (Pump.fun, Binance Square, Zora) to battle‑harden before broad rollout.
- Our wedge is “555” gamification—fun, high‑retention interactions that normalize overlays and build inventory before monetization. As the network grows, ads stay creator‑controlled and measured with clear, simple reports.

Why participate: This is streaming‑native monetization done right—creator‑controlled, measurable, and simple. As supply (creators) and demand (brands) grow, network effects compound: better targeting, higher fill, and more revenue per minute watched. RNDR governance brings the community into key decisions. Proceeds fund ~12–15 months of execution, security hardening, and scaling.

## Token Name & Ticker

- Name: RNDR
- Ticker: RNDR
- Rationale: Aligns directly with the Render Network brand. (We recognize the ticker overlaps with other ecosystems and will coordinate listings/metadata to avoid user confusion.)

## Project Image & Token Image

- Project image: frontend/public/social.png (used on MetaDAO and listings)
- Token image: frontend/public/token-rndr.png (1:1, 1024×1024 PNG; dark/light safe)

## Minimum Raise Amount

- Minimum raise: $2,000,000
- Rationale and use of funds (summary):
  - Lean plan covering ~12–15 months of runway for the core team
  - Security & compliance hardening (secrets rotation, cookie‑based auth + CSRF, uploads/CSP/rate‑limits, DB migrations, CI/SCA/SAST, observability, external validation)
  - AWS‑based infra for backend and gateway (ECS or EKS, ALB, RDS Postgres with SSL/backups, S3 + CloudFront, CloudWatch, Secrets Manager), plus Solana RPC, IPFS/pinning, observability, and CI/CD
  - Generative tech API usage for overlay assets and ad creatives (e.g., image/video generation)
  - Organic GTM/community (content, creator onboarding, moderation tooling)
  - Tools & lab (stream test rigs, mobile devices) and standard insurance/legal/admin
  - Includes buffer for unexpected expenses and ~20% liquidity provision

Note: If the sale clears at the minimum, the implied ICO price is ~$0.002 (= $2.0M / 1,000,000,000 tokens). Actual price is set by sale proceeds.

## Monthly Team Budget

- Request: $60,000/month from treasury
- Constraint: The monthly budget may not exceed 1/6 of the minimum raise ($333,333); our request is well below the cap.
- Purpose: Covers a lean core team (Founding Developer $15k/mo, Senior Frontend $10k/mo, Senior Backend $10k/mo), AWS infrastructure (ECS/EKS/ALB, RDS, S3 + CloudFront, CloudWatch, Secrets Manager), Solana RPC, IPFS/pinning, observability, and our core marketing motion: streamer onboarding and endorsements. Includes usage for generative tech APIs tied to overlays and ad assets. Larger one‑off spends require governance.

## Performance Package Configuration

- Pre‑allocation: 12,500,000 RNDR to performance package (up to 15M permissible)
- Tranches: 5 equal tranches of 2,500,000 RNDR each
- Price milestones: Unlock at 2×, 4×, 8×, 16×, 32× the ICO price
- Minimum unlock time: 24 months from ICO date (≥ 18 months requirement)
- TWAP: 3‑month TWAP at threshold; the first real unlock occurs only after the TWAP window completes, extending unlock timing by ~3 months

Example at minimum raise: ICO ≈ $0.002. Tranche thresholds (TWAP) ≈ $0.004, $0.008, $0.016, $0.032, $0.064. At month 24 + TWAP, if price sustains ~$0.008, two tranches (5M tokens) unlock; later tranches require sustained higher TWAPs.

## Intellectual Property Assignment

- Domains & DNS: rendernet.work (and subdomains) and any future brand‑aligned domains
- Software/Code: full rights to backend (Go API, Solana client, IPFS, Pump.fun proxy), frontend (Next.js overlay + control), chat‑gateway (Node/Bun WS/HTTP), discord tooling, build/deploy configs, CI/CD assets, documentation
- Incubated projects & ventures: the companies and products incubated under Render Network, including 555 (gamification) and Sculptr (AI 3D asset generation and animation technology)
- Brand & Creative: logos/marks, palettes, design files, marketing assets; project and token imagery source files
- Social & Communications: official brand accounts (X/Twitter, Discord, Telegram, YouTube/Twitch), GitHub org, email lists
- Data & Content: website/docs copy, templates, non‑PII operational content
- Wallets & Treasury: treasury wallets/keys reissued to a new project‑controlled multisig at listing; all leaked secrets/keys rotated per security plan
- Patents/Trademarks: none filed to date; future filings, if any, assigned to the entity

## Product & Roadmap (Context)

- Wedge (MVP “555”): normalizes overlay usage with arcade games, reactions, and rewards to build supply (streams with dynamic inventory). Files: frontend/pages/overlay/[id].tsx, services/chat-gateway/src/gateway.ts.
- Monetization: dynamic, contextual ads across many streams; creator‑controlled placement/size/duration/themes; sponsor‑only per‑creator campaigns; 50/50 split between platform and participating creators.
- Control once, apply everywhere: changes made in one panel propagate to OBS/Streamlabs/Twitch/Kick/YouTube simultaneously for multi‑streamers.
- Always‑on streaming (roadmap): keep channels “open” with incentives running (without OBS grinding a local machine), preserving engagement and monetization between live sessions.
- Security by design: ed25519 wallet verification, cookie‑based sessions + CSRF, strict CORS/CSP, rate‑limits, migrations, observability.
