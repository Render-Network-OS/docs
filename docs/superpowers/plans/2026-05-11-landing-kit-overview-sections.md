# Landing Page: Kit + Overview/Roadmap Sections Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new sections to `sw4p-landing` that (a) showcase `@sw4p/kit` as the agent surface, and (b) present an Overview + Roadmap that gives the public a thorough outlook of everything sw4p ships today plus what's on deck — without diluting the existing developer-first voice.

**Architecture:** Two new section components, dropped into the existing scroll-snap App.tsx flow between `DeveloperSection` and `TrustSection` (Kit), and between `TrustSection` and `FooterSection` (Overview/Roadmap). Both reuse `WindowFrame`, `XPButton`, `Pill`, `useVisibility`, and the `xp-heading` / `xp-text-shadow` token classes — zero new design primitives. Both register in the bottom-taskbar `SECTIONS` list and the `ScrollContext` index map.

**Tech Stack:** React 19, Vite 6, Tailwind v4 inline tokens, existing `xp-theme.css` variables, no new dependencies.

---

## Design conventions to inherit (verbatim from existing sections)

- **Section wrapper:** `<Section animate="window">` with 100vh viewport
- **Container:** `WindowFrame` titled like an XP window (matches How It Works "Routing & Execution — SW4P", Developer "SDK — Notepad", Trust "System Properties")
- **Heading:** `text-[18px] md:text-[22px] font-bold text-[#003C74] xp-heading`
- **Body:** `text-[12px] md:text-[13px] text-[#333] leading-relaxed`
- **Small/muted body:** `text-[11px] text-[#666] leading-relaxed`
- **Code blocks:** black bg, `text-[11px] text-[#c0c0c0]`, `fontFamily: '"Lucida Console", Monaco, monospace'`
- **Pills:** `px-3 py-1 bg-[#D3E5FA] text-[#003C74] text-[11px] font-bold border border-[#94BAE7] xp-heading`
- **CTA:** `XPButton href="..."`
- **Motion:** `useVisibility(0.2)` returning `{ref, visible}`, combined with `.window-animate-delay` class
- **Section padding:** `p-4 md:p-8` outer, `p-5 md:p-6` inside `WindowFrame`
- **Spacing:** `gap-4`, `mb-3` / `mb-5` between content blocks

---

## File map

### New files

| Path | Responsibility |
|---|---|
| `src/components/sections/KitSection.tsx` | New section showcasing `@sw4p/kit` as agent surface |
| `src/components/sections/OverviewRoadmapSection.tsx` | New section with shipped/in-progress/roadmap status |

### Modified files

| Path | Change |
|---|---|
| `src/App.tsx` | Import + render the two new sections in the correct order |
| `src/contexts/ScrollContext.tsx` (or wherever `SECTIONS` lives) | Add two entries to `SECTIONS` so taskbar nav shows them |
| `src/components/layout/LandingTaskbar.tsx` | (no edits if it reads `SECTIONS` from context — verify) |

### Open inputs (need before implementing)

- **`@sw4p/kit` public repo URL** — for the "View Kit" CTA. User said they'll provide it.
- **Public status of advanced kit features** — confirm which of MCP / x402 V2 / AP2 mandates / Kora 2.0 / Cart Mandates / Tasks primitive we want to surface publicly vs. keep as "in-progress" until launch.

---

## Section design — Kit

### Where it lives

Between `DeveloperSection` (current SDK story) and `TrustSection`. Rationale:
- `DeveloperSection` introduces the SDK for app integrators
- `KitSection` introduces the kit for **agent builders** — different audience, different narrative (open agent payment standards)
- Adjacency lets a reader who just saw "Built for: Applications, Agents, Treasury systems, Payment flows" naturally land on the agent-specific surface

### Visual concept

A **Notepad** (matching Developer section's monospace aesthetic) and a **Routing & Execution-style WindowFrame** side-by-side, mirroring How It Works' two-pane layout. Notepad shows a tiny MCP tool call. The right pane is the narrative + pills + CTA.

### Window titles

- Left/back: `Notepad — sw4p-kit-example.ts` (icon: `/xp-icons/Notepad.png`)
- Right/front: `SW4P Kit — Agent Surface` (icon: `/xp-icons/Briefcase.png`)

### Copy

**Heading:** `Internet-native settlement, agent-native.`

**Body:**
> SW4P Kit is the developer surface that lets agents settle cross-chain through SW4P over every open agent payment standard. The settlement engine stays the same — the kit makes it consumable by anything that speaks MCP, x402, A2A, AP2, or ERC-7683.

**Small/muted:**
> Tools, intents, mandates, and payment-gated endpoints. One settlement engine, every agent stack.

**Pills (5):**
- `MCP 2025-11-25`
- `x402 V2`
- `AP2 Cart Mandates`
- `ERC-7683 intents`
- `Kora gasless`

**Notepad content (typewriter, ~12ms per char):**

```
$ npx sw4p-mcp

> sw4p MCP server listening on stdio
> tools registered:
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

**CTA:** `XPButton href={KIT_REPO_URL}` → label `View Kit`

### Component sketch

```tsx
// src/components/sections/KitSection.tsx
import { Section } from '../layout/Section';
import { WindowFrame } from '../xp/WindowFrame';
import { XPButton } from '../xp/XPButton';
import { useVisibility } from '../../hooks/useVisibility';
import { useTypewriter } from '../../hooks/useTypewriter';

const NOTEPAD = `$ npx sw4p-mcp

> sw4p MCP server listening on stdio
> tools registered:
    - sw4p.estimate
    - sw4p.settle
    - sw4p.status
    - sw4p.portfolio
    - sw4p.rebalance_plan
    - sw4p.rebalance_execute
    - sw4p.task
    - sw4p.ap2.cart_propose
    - sw4p.ap2.cart_execute

[OK] ready for agent connections`;

const KIT_REPO_URL = 'https://github.com/<TBD-from-user>/sw4p-kit';

export function KitSection() {
  const { ref: notepadRef, visible: notepadVisible } = useVisibility(0.2);
  const { displayed, done } = useTypewriter(NOTEPAD, 12, notepadVisible);

  return (
    <Section animate="window">
      <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
        <div className="flex flex-col gap-4 md:relative md:h-[500px] w-full max-w-[1000px]">
          {/* Notepad — back window */}
          <div
            ref={notepadRef}
            className={`md:absolute md:top-[10%] md:left-[2%] z-10 window-animate-delay ${notepadVisible ? 'visible' : ''}`}
          >
            <WindowFrame title="Notepad — sw4p-kit-example.txt" icon="/xp-icons/Notepad.png" maxWidth="380px">
              <div className="bg-black p-3 h-[260px] overflow-hidden">
                <pre
                  className="text-[11px] text-[#c0c0c0] leading-relaxed whitespace-pre"
                  style={{ fontFamily: '"Lucida Console", Monaco, monospace' }}
                >
                  {displayed}
                </pre>
                {!done && (
                  <span
                    className="text-[11px] text-[#c0c0c0]"
                    style={{
                      fontFamily: '"Lucida Console", Monaco, monospace',
                      animation: 'cursorBlink 1s step-end infinite',
                    }}
                  >_</span>
                )}
              </div>
            </WindowFrame>
          </div>

          {/* Kit narrative — front window */}
          <div className="md:absolute md:top-[15%] md:right-[2%] z-20">
            <WindowFrame title="SW4P Kit — Agent Surface" icon="/xp-icons/Briefcase.png" maxWidth="560px">
              <div className="p-5 md:p-6">
                <h2 className="text-[18px] md:text-[22px] font-bold text-[#003C74] mb-3 xp-heading">
                  Internet-native settlement, agent-native.
                </h2>
                <p className="text-[12px] md:text-[13px] text-[#333] leading-relaxed mb-3">
                  SW4P Kit is the developer surface that lets agents settle cross-chain through SW4P
                  over every open agent payment standard. The settlement engine stays the same —
                  the kit makes it consumable by anything that speaks MCP, x402, A2A, AP2, or ERC-7683.
                </p>
                <p className="text-[11px] text-[#666] leading-relaxed mb-5">
                  Tools, intents, mandates, and payment-gated endpoints. One settlement engine,
                  every agent stack.
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Pill>MCP 2025-11-25</Pill>
                  <Pill>x402 V2</Pill>
                  <Pill>AP2 Cart Mandates</Pill>
                  <Pill>ERC-7683 intents</Pill>
                  <Pill>Kora gasless</Pill>
                </div>

                <XPButton href={KIT_REPO_URL}>View Kit</XPButton>
              </div>
            </WindowFrame>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="px-3 py-1 bg-[#D3E5FA] text-[#003C74] text-[11px] font-bold border border-[#94BAE7] xp-heading">
      {children}
    </span>
  );
}
```

---

## Section design — Overview / Roadmap

### Where it lives

Between `TrustSection` and `FooterSection`. Rationale:
- Trust closes the "you can rely on this" arc
- Roadmap is the "here's the full picture, and where we're going" closer — natural before footer
- Public-image targeted: ecosystem partners, investors, recruits, judges

### Visual concept

**System Properties** window (matching `TrustSection`'s reliability layout) with three vertical groups: **Live**, **Building**, **On the horizon**. Each row is a single-line item with an XP-styled status indicator. Single-column on mobile, three groups stacked.

Window title: `System Properties — Outlook & Roadmap` (icon: `/xp-icons/Control Panel.png`)

### Copy

**Heading:** `What ships today. What we're building. Where we're going.`

**Lead body:**
> SW4P is a production settlement engine for cross-chain execution. Below is the full surface today and the work on deck — published so partners can plan integrations, and so the public can see the trajectory.

**Group: Live** *(green check, treat as shipped/audited)*
- Native USDC routing via Circle CCTP V2 across Solana, Base, Arbitrum, Polygon, Avalanche
- Solana gasless execution via Kora 2.0 with policy + Token-2022 awareness
- 11-state settlement lifecycle with retries, recovery, and observability
- Jupiter SPL output on Solana
- Allbridge corridor support including Tron USDT
- TypeScript SDK, embeddable widget, multi-tenant storefronts, Telegram + Discord bots
- Monitoring with Prometheus, Grafana, OpenTelemetry

**Group: Building** *(blue arrow, in-progress)*
- SW4P Kit — agent surface for MCP, x402 V2, AP2 Cart Mandates, A2A, ERC-7683 intents
- External solver network (ERC-7683-compatible)
- Multi-hop route planner
- Agent API for batch settlement and rebalance

**Group: On the horizon** *(amber dot, frontier roadmap)*
- Circle **Gateway** as a fourth rail (sub-500ms unified USDC balance)
- Generalized cross-chain messaging plus native-token-issuance corridors
- Jito **BAM bundles** for atomic Solana settlement
- Default EIP-7702 + Biconomy Nexus PREP delegates on EVM corridors
- Pyth Lazer pull-quote attestations pinned at estimate→settle
- Yellowstone Fumarole-backed watcher (persistent stream replay)
- Token-2022 **confidential transfers** (gated on Solana ZK ElGamal re-enable)
- Arc L1 day-1 adapter

**Small:**
> Items move groups as audits clear, deadlines hit, or upstream dependencies ship. Status reflects engineering reality, not marketing intent.

**CTA:** `XPButton href="https://api-docs.sw4p.io"` → label `Read the architecture`

### Status indicator design

Match XP "System Properties" treatment — a small filled circle + dot/check:

```tsx
function StatusIcon({ tone }: { tone: 'live' | 'building' | 'horizon' }) {
  const cfg = {
    live: { bg: '#3C8D0D', glyph: '✓', label: 'Live' },
    building: { bg: '#0054E3', glyph: '▸', label: 'Building' },
    horizon: { bg: '#E5A100', glyph: '○', label: 'On the horizon' },
  }[tone];
  return (
    <span
      className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-white text-[10px] font-bold"
      style={{ backgroundColor: cfg.bg }}
      title={cfg.label}
      aria-label={cfg.label}
    >
      {cfg.glyph}
    </span>
  );
}
```

### Component sketch

```tsx
// src/components/sections/OverviewRoadmapSection.tsx
import { Section } from '../layout/Section';
import { WindowFrame } from '../xp/WindowFrame';
import { XPButton } from '../xp/XPButton';
import { useVisibility } from '../../hooks/useVisibility';

const LIVE = [
  'Native USDC routing via Circle CCTP V2 across Solana, Base, Arbitrum, Polygon, Avalanche',
  'Solana gasless execution via Kora 2.0 with policy + Token-2022 awareness',
  '11-state settlement lifecycle with retries, recovery, and observability',
  'Jupiter SPL output on Solana',
  'Allbridge corridor support including Tron USDT',
  'TypeScript SDK, embeddable widget, multi-tenant storefronts, Telegram + Discord bots',
  'Monitoring with Prometheus, Grafana, OpenTelemetry',
];

const BUILDING = [
  'SW4P Kit — agent surface for MCP, x402 V2, AP2 Cart Mandates, A2A, ERC-7683 intents',
  'External solver network (ERC-7683-compatible)',
  'Multi-hop route planner',
  'Agent API for batch settlement and rebalance',
];

const HORIZON = [
  'Circle Gateway as a fourth rail (sub-500ms unified USDC balance)',
  'Generalized cross-chain messaging plus native-token-issuance corridors',
  'Jito BAM bundles for atomic Solana settlement',
  'Default EIP-7702 + Biconomy Nexus PREP delegates on EVM corridors',
  'Pyth Lazer pull-quote attestations pinned at estimate→settle',
  'Yellowstone Fumarole-backed watcher (persistent stream replay)',
  'Token-2022 confidential transfers (gated on Solana ZK ElGamal re-enable)',
  'Arc L1 day-1 adapter',
];

export function OverviewRoadmapSection() {
  const { ref, visible } = useVisibility(0.2);
  return (
    <Section animate="window">
      <div ref={ref} className={`w-full h-full flex items-center justify-center p-4 md:p-8 window-animate-delay ${visible ? 'visible' : ''}`}>
        <WindowFrame title="System Properties — Outlook & Roadmap" icon="/xp-icons/Control Panel.png" maxWidth="820px">
          <div className="p-5 md:p-6">
            <h2 className="text-[18px] md:text-[22px] font-bold text-[#003C74] mb-3 xp-heading">
              What ships today. What we're building. Where we're going.
            </h2>
            <p className="text-[12px] md:text-[13px] text-[#333] leading-relaxed mb-5">
              SW4P is a production settlement engine for cross-chain execution. Below is the full
              surface today and the work on deck — published so partners can plan integrations, and
              so the public can see the trajectory.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <Group title="Live" tone="live" items={LIVE} />
              <Group title="Building" tone="building" items={BUILDING} />
              <Group title="On the horizon" tone="horizon" items={HORIZON} />
            </div>

            <p className="text-[11px] text-[#666] leading-relaxed mb-5">
              Items move groups as audits clear, deadlines hit, or upstream dependencies ship.
              Status reflects engineering reality, not marketing intent.
            </p>

            <XPButton href="https://api-docs.sw4p.io">Read the architecture</XPButton>
          </div>
        </WindowFrame>
      </div>
    </Section>
  );
}

function Group({ title, tone, items }: { title: string; tone: 'live' | 'building' | 'horizon'; items: string[] }) {
  return (
    <div className="border border-[#D0C6B0] bg-[#FAFAF6] p-3">
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon tone={tone} />
        <h3 className="text-[13px] font-bold text-[#003C74] xp-heading">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-[11px] text-[#333] leading-relaxed pl-1">— {item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ tone }: { tone: 'live' | 'building' | 'horizon' }) {
  const cfg = {
    live: { bg: '#3C8D0D', glyph: '✓', label: 'Live' },
    building: { bg: '#0054E3', glyph: '▸', label: 'Building' },
    horizon: { bg: '#E5A100', glyph: '○', label: 'On the horizon' },
  }[tone];
  return (
    <span
      className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-white text-[10px] font-bold"
      style={{ backgroundColor: cfg.bg }}
      title={cfg.label}
      aria-label={cfg.label}
    >
      {cfg.glyph}
    </span>
  );
}
```

---

## Wiring tasks

### Task A: Confirm `SECTIONS` source-of-truth location

- [ ] Open `src/contexts/ScrollContext.tsx` (or wherever `SECTIONS` is declared — the taskbar maps it). Locate the constant.
- [ ] If the taskbar reads from context, only the context needs editing. Verify `LandingTaskbar.tsx` consumes `SECTIONS` via the context hook and doesn't hard-code labels.

### Task B: Add the two new entries to `SECTIONS` in the correct positions

Order after edit (top-to-bottom = scroll order):

1. Desktop (Hero)
2. About
3. How SW4P Works *(InsightSection — verify which label maps to which component)*
4. Architecture *(HowItWorksSection)*
5. SDK *(DeveloperSection)*
6. **Kit** ← new
7. Security *(TrustSection)*
8. **Roadmap** ← new
9. SW4P *(FooterSection)*

- [ ] Insert `{ id: 'kit', label: 'Kit' }` after the SDK entry.
- [ ] Insert `{ id: 'roadmap', label: 'Roadmap' }` after the Security entry.
- [ ] Verify the `scrollTo(index)` math still resolves correctly (probably index-based, so order in `SECTIONS` *is* the index — no math change needed).

### Task C: Render the two components in `App.tsx`

- [ ] Import `KitSection` and `OverviewRoadmapSection`.
- [ ] Render in order: `<DeveloperSection />`, `<KitSection />`, `<TrustSection />`, `<OverviewRoadmapSection />`, `<FooterSection />`.

### Task D: Verify the taskbar shows 9 buttons

- [ ] `npm run dev` (port 5176)
- [ ] Open `http://localhost:5176`
- [ ] Confirm the bottom taskbar shows Kit and Roadmap, both clickable, both scroll to their sections, and the active highlight follows the scroll.
- [ ] Check mobile width (DevTools 375px): both sections still fit, content readable, no horizontal overflow.

### Task E: Build clean

- [ ] `npm run build`
- [ ] Expect zero TS errors, zero Vite warnings.

---

## Verification checklist

- [ ] Both sections render at 100vh and snap correctly when scrolling
- [ ] All copy uses `text-[#003C74]` for headings, `text-[#333]` for body — no off-token colors
- [ ] `WindowFrame` titles read like XP windows (verb-noun, no marketing speak)
- [ ] Notepad in KitSection types out the example with the existing cursor blink
- [ ] Pills use the existing exact class string (don't redefine the styling)
- [ ] Status icons in OverviewRoadmapSection are color-tone-distinct, accessible labels via `title`/`aria-label`
- [ ] Taskbar entries highlight on active section like the existing entries (no special styling)
- [ ] Mobile: all groups stack, Notepad and Kit window stack, no overlap, no clipping
- [ ] Build clean

---

## Inputs needed before implementation

1. **`@sw4p/kit` public repo URL** — placeholder `https://github.com/<TBD-from-user>/sw4p-kit` in `KIT_REPO_URL`. The user said they'll provide it.
2. **Public posture confirmation** — any of these should be moved between groups before publishing?
   - Should "AP2 Cart Mandates" be Live (kit shipped) or Building (still pre-launch posture)?
   - Should "MCP 2025-11-25" be surfaced explicitly or just "MCP-compatible"?
   - Are any roadmap items confidential pre-announce (e.g. Arc L1 partnership, BAM)?
3. **Voice check** — confirm the lead lines hit the existing tone or need tightening. Drafts:
   - Kit: "Internet-native settlement, agent-native."
   - Roadmap: "What ships today. What we're building. Where we're going."

---

**Plan complete and saved.** Awaiting kit repo URL + posture confirmation before executing Tasks A–E.
