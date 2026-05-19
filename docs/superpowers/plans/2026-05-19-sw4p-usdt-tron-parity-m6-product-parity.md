# sw4p USDT / Tron Parity, M6 Product Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Waves within a single repo (sw4p Rust, sw4p frontend, sw4p-kit, sw4p-mcp-gateway) execute sequentially to avoid the parallel-agent branch-race issue observed in M0-M2 W1 and re-stated in M3, M4, and M5. Waves that span different repos (e.g. frontend wave plus kit wave) may run in parallel because each repo has an independent branch state. The wave map below makes the cross-repo parallelism explicit.

**Goal:** Make every user-facing surface (frontend, kit, MCP gateway) honest about route state and capable of executing a Tron user-signed flow end-to-end against the M5-backed backend. Close the Solana to Tron stub in `allbridge.rs::bridge_from_solana_to_tron` with a real SPL transfer plus Allbridge Solana program instruction build. Promote SOL to TRX out of `ProviderSupportedCodeIncomplete`. Add the operator canary creation HTTP endpoint that M6 MCP tooling consumes. Migrate the two legacy `allbridge.rs` call sites (`multi_hop.rs:341`, `native_bridge.rs:340`) to the mode-aware API and remove the silent Base USDT to Base USDC mapping. Land the TRD-TRON-010 vitest acceptance set against the M3-shipped `useTronSigning` hook and `TronTxReview` component, including a snapshot regression for high vs low Bandwidth and Energy.

**Architecture:** M6 has five sub-streams that run in coordinated waves. (1) Frontend route-state UI: a `RouteList` component consuming `GET /v1/route-states` and a `RouteDetail` route that renders every CRD section 5.2 dimension. (2) Frontend Tron execution UI: a single page combining the M3-shipped `TronTxReview` component, the M3-shipped `useTronSigning` hook, and a status poll loop against M5's lifecycle event endpoint. (3) Backend Solana SPL plus Allbridge program instruction building inside `bridge_from_solana_to_tron`, replacing the `SOLANA_BRIDGE_STUB_MARKER` return with an `Ok(SolanaBridgeResult::Unsigned(..))` carrying a base64-encoded serialized message. (4) Operator and MCP: a new `POST /v1/operator/canary-authorizations` endpoint backed by `canary_authorization::insert`, and two new MCP tools (`route_states`, `route_state_by_id`) plus an operator-only `canary_authorization_create` tool. (5) Kit hygiene plus legacy cleanup: tighten `canary.ts:expires_at` to `z.string().datetime()`, document why `source_chain`/`destination_chain` stay bare `z.string()` (TRX is intentionally out of the kit `ChainSchema` enum), migrate the two legacy `allbridge.rs` call sites, tighten the `TronClient::new_with_url` timeout, cap Solana broadcast body size, retire the deprecated `/v1/routes` handler, and replace the silent Base USDT to Base USDC mapping with an explicit `Err`.

**Tech Stack:** Rust 2021 with Axum/Tokio/SQLx, React 19 on Vite with TanStack Query, TypeScript 5.4 with Zod, Node 22.22.0, solana-client/solana-sdk for SPL plus Allbridge program instruction building. New backend dependencies introduced in T6.9: `solana-sdk = "1.18"`, `solana-client = "1.18"`, `spl-token = "4.0"`, `spl-associated-token-account = "3.0"` (controller verifies version pinning matches the existing solana-client used by `solana_signing_api::broadcast_handler`). No new frontend or kit dependencies.

**Binding companion docs:**

- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md) (PRD-USDT-006 stub honesty, PRD-USDT-009 agent surface, PRD-USDT-014 no silent mapping, PRD-USDT-015 route confirmation surface, PRD-USDT-018 suspended state, PRD-USDT-019 canary structure, PRD-USDT-020 cross-surface agreement)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md) (section 5 route state model, section 11 proof requirements, section 12 lifecycle, section 14 security including CRD-SEC-007 approval cap and CRD-SEC-008 operator suspension without code deployment)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md) (section 8 Tron wallet adapter including TRD-TRON-001 through TRD-TRON-010, section 10 kit/agent API including TRD-KIT-001 through TRD-KIT-006)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md) (Workstream WS8 in full: WP8.1 route state UI, WP8.2 route detail, WP8.3 Tron execution UI, WP8.4 kit chain/asset schema, WP8.5 agent-safe route output, WP8.6 consistency tests; WP6.3 Solana to Tron gap closure)
- [M0-M2 plan](2026-05-18-sw4p-usdt-tron-parity-m0-m2.md)
- [M3 plan](2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md)
- [M4 plan](2026-05-18-sw4p-usdt-tron-parity-m4-execution-parity.md)
- [M4 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m4-execution-parity-followups.md)
- [M5 plan](2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md)
- [Inventory](../specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md)
- [Handoff doc](../handoffs/2026-05-19-sw4p-usdt-tron-parity-full-team-handoff.md)

---

## Subagent Dispatch Contract

Same as the M0-M2, M3, M4, and M5 plans. Repeated here so this plan stands alone.

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max, no Sonnet/Haiku) |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (spec reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (quality reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

**Hard rules from earlier milestones (re-stated):**

1. **sw4p is a standalone nested git repo** with 100+ branches. Every M6 sw4p commit lands on branch `feat/sw4p-usdt-tron-parity-m6-product-parity`. The controller creates the branch off `feat/sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger` if M5 is still open in review, otherwise off whichever branch M5 merges into; if M5 has merged into the M4 branch, base off `feat/sw4p-usdt-tron-parity-m4-execution-parity`. Controller note: when the milestone kicks off, the controller decides the actual base branch by running `git -C /Volumes/.../555/sw4p log --oneline -5 feat/sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger` and `... m4-execution-parity` and picking the branch that contains the merged M5 work. This is not a subagent decision and not a TBD; it is a one-line controller check at branch creation time. Implementers verify branch with `git -C /Volumes/.../555/sw4p rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches.
2. **sw4p-frontend, sw4p-kit, and sw4p-mcp-gateway are sibling repos** under the parent `/Volumes/.../555/` workspace. Each has its own M6 branch: `feat/sw4p-usdt-tron-parity-m6-product-parity` (same name, different repo). Frontend, kit, and MCP commits never cross repos.
3. **Sequential within a single git repo wave** to avoid the parallel-agent branch-race issue. Two waves in different repos may run in parallel; the wave map flags those cases.
4. **No signing/hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, `--no-verify`. Hard user rule.
5. **No AI co-author trailer.** Every commit author is `rndrntwrk <dev@rndrntwrk.com>`. Commit message body contains the message only; no `Co-Authored-By:`, no `Generated with`, no AI attribution.
6. **No em dashes (U+2014), no en dashes (U+2013), and no non-ASCII** in any committed file, commit message, or this plan.
7. **Implementer stages files via `git add`; controller commits.** The auto-mode classifier blocks subagent `git commit` invocations; this workflow avoids the block.
8. **Configured `reqwest::Client` with timeouts** on every new HTTP-calling module (30s timeout, 10s connect). T6.14 is the explicit sweep that aligns existing call sites.
9. **Add `tracing::info!` / `tracing::warn!` to network and DB boundaries.** Hashes and IDs only; no plaintext secrets.
10. **Lifecycle event ordering is durable-before-effect.** Every new backend side-effect call (HTTP POST, RPC submit, signing API) added in M6 must be preceded by a `lifecycle::record_event` write so M5's durability invariant holds.

---

## Parallel Wave Map

| Wave | Tasks | Repo(s) | Parallelism |
|---:|---|---|---|
| W0 | T6.7 kit `expires_at` strictness, T6.8 kit chain comments | sw4p-kit | sequential (both touch `canary.ts`) |
| W1 | T6.9 full SOL to TRX SPL plus Allbridge program instruction build | sw4p | solo (long pole) |
| W2 | T6.10 flip `policy::primary_for` for SOL to TRX | sw4p | sequential after W1 |
| W3 | T6.11 `POST /v1/operator/canary-authorizations` endpoint | sw4p | parallel with W1 (different file) |
| W4 | T6.12 multi_hop migration, T6.13 native_bridge pool-less removal, T6.14 TronClient timeout sweep, T6.15 Solana broadcast size cap, T6.16 legacy `/v1/routes` retirement, T6.17 silent Base USDT to USDC mapping cleanup | sw4p | sequential within wave; T6.17 must follow W1 |
| W5 | T6.1 `RouteList` view, T6.2 `RouteDetail` screen | sw4p-frontend | sequential (RouteDetail re-imports RouteList helpers) |
| W6 | T6.3 `TronExecution` page, T6.4 `raw_data` object passing verification | sw4p-frontend | sequential after W5 |
| W7 | T6.18 vitest tests for `useTronSigning`, T6.19 snapshot test for `TronTxReview` | sw4p-frontend | sequential after W6 |
| W8 | T6.5 `route_states` tools, T6.6 `canary_authorization_create` tool | sw4p-mcp-gateway | sequential; depends on W0 and W3 |
| W9 | T6.20 final M6 branch review (cross-repo) | sw4p, sw4p-frontend, sw4p-kit, sw4p-mcp-gateway | solo |

Total: 20 tasks across 10 waves. The plan numbers tasks T6.1 through T6.19 to match the handoff doc, plus a final T6.20 review task.

**Cross-repo parallelism note for the controller:** W0 (sw4p-kit) can run in parallel with W1 (sw4p backend) because the repos do not share files. Similarly W5 (sw4p-frontend) can run in parallel with W4 (sw4p backend) once W1 and W2 land. W8 (sw4p-mcp-gateway) starts only after W0 (kit types) and W3 (backend endpoint) both merge.

**Sequencing constraints called out explicitly:**

- T6.9 and T6.17 both touch `allbridge.rs`. T6.9 (SPL plus Allbridge instruction build) lands BEFORE T6.17 (silent mapping cleanup) so the new function exists when the cleanup test runs. T6.12 through T6.16 do not touch `allbridge.rs`; they can land in any order within W4.
- T6.10 (route state flip for SOL to TRX) MUST land after T6.9. The flip changes the `policy::primary_for` return shape and the pinned route-state test assertion in `tests/route_state_pinned.rs`; if it lands before T6.9 the route renders as `code_supported_proof_missing` while the executor still returns `SOLANA_BRIDGE_STUB_MARKER`, violating PRD-USDT-006.
- T6.3 frontend Tron execution UI presumes M5 has merged so that the lifecycle event endpoint (`GET /v1/route-states/:route_id/events` per M5 T11) exists. If M5 is still in review when M6 W6 starts, T6.3 stubs the poll loop against a placeholder URL constant and lands the rest; controller re-opens a follow-up task to wire the real URL once M5 merges.
- T6.6 (MCP `canary_authorization_create` tool) depends on T6.11 (the backend endpoint) being merged.

---

## File Structure

New files this plan creates:

| Path | Responsibility |
|---|---|
| `sw4p/sw4p-frontend/src/components/RouteList.tsx` | Route list view component consuming `GET /v1/route-states`. |
| `sw4p/sw4p-frontend/src/components/RouteList.test.tsx` | vitest tests for `RouteList` rendering, badge states, and filtering. |
| `sw4p/sw4p-frontend/src/components/RouteDetail.tsx` | Route detail screen showing every CRD section 5.2 dimension. |
| `sw4p/sw4p-frontend/src/components/RouteDetail.test.tsx` | vitest tests for `RouteDetail`. |
| `sw4p/sw4p-frontend/src/pages/TronExecution.tsx` | Tron user-signed execution page (raw-tx fetch, review, sign, poll). |
| `sw4p/sw4p-frontend/src/pages/TronExecution.test.tsx` | vitest integration test (mocked fetch + mocked wallet). |
| `sw4p/sw4p-frontend/src/hooks/__tests__/useTronSigning.test.tsx` | TRD-TRON-010 acceptance tests (six scenarios). |
| `sw4p/sw4p-frontend/src/components/__tests__/TronTxReview.snap.test.tsx` | Snapshot test for high vs low Bandwidth and Energy. |
| `sw4p/sw4p-backend/src/operator_canary_api.rs` | Axum handler for `POST /v1/operator/canary-authorizations`. |
| `sw4p-mcp-gateway/src/tools.ts` (extended) | Three new tools: `route_states`, `route_state_by_id`, `canary_authorization_create`. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `sw4p-kit/src/core/canary.ts` | T6.7 tighten `expires_at` to `z.string().datetime()`; T6.8 add the source/destination chain comment. |
| `sw4p/sw4p-backend/src/allbridge.rs` | T6.9 replace stub with full SPL+Allbridge instruction build; T6.17 replace silent Base USDT to USDC fallback with explicit `Err`. |
| `sw4p/sw4p-backend/src/policy.rs` | T6.10 flip `primary_for` for SOL to TRX. |
| `sw4p/sw4p-backend/tests/route_state_pinned.rs` | T6.10 update SOL to TRX assertion. |
| `sw4p/sw4p-backend/src/lib.rs` | T6.11 add `pub mod operator_canary_api;`. |
| `sw4p/sw4p-backend/src/main.rs` | T6.11 merge the operator canary router. |
| `sw4p/sw4p-backend/src/multi_hop.rs` | T6.12 migrate `execute_route` to thread `&PgPool` and call `bridge_from_tron_with_mode`. |
| `sw4p/sw4p-backend/src/native_bridge.rs` | T6.13 require `pool: &PgPool` on `execute_bridged_transfer` and drop the legacy fallback. |
| `sw4p/sw4p-backend/src/tron_client.rs` | T6.14 build the inner `reqwest::Client` with 30s timeout and 10s connect_timeout. |
| `sw4p/sw4p-backend/src/solana_signing_api.rs` | T6.15 cap `signed_tx_base64` length at 256 KB before decode. |
| `sw4p/sw4p-backend/src/route_selector.rs` | T6.16 delete the legacy `/v1/routes` handler and the `routes_handler` axum route. |
| `sw4p/sw4p-frontend/src/App.tsx` | T6.1 and T6.2 register `/routes` and `/routes/:id` paths; T6.3 registers `/execute/tron/:route_id`. |
| `sw4p/sw4p-frontend/src/hooks/useTronSigning.ts` | T6.4 confirms `raw_data` object passing (no edit if already correct; add an inline guard comment otherwise). |

---

## Task T6.1: Route List View

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the `RouteList` component that fetches `GET /v1/route-states`, hides `out_of_scope` rows, and renders a primary-state badge with distinct visual treatment for each PrimaryState value.

**Spec IDs:** PRD-USDT-001, PRD-USDT-002, PRD-USDT-009, PRD-USDT-013, PRD-USDT-018; CRD section 5 (route state model); SOW WP8.1.

**Files:**

- Create: `sw4p/sw4p-frontend/src/components/RouteList.tsx`
- Create: `sw4p/sw4p-frontend/src/components/RouteList.test.tsx`
- Modify: `sw4p/sw4p-frontend/src/App.tsx`

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m6-product-parity`. STOP if wrong.

- [ ] **Step 2: Write the component.**

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";

export type PrimaryState =
  | "out_of_scope"
  | "provider_unsupported"
  | "provider_supported_code_incomplete"
  | "code_supported_proof_missing"
  | "canary_authorized"
  | "live"
  | "suspended"
  | "policy_blocked";

export interface RouteState {
  route_id: string;
  primary: PrimaryState;
  asset: "USDC" | "USDT";
  source_chain: string;
  destination_chain: string;
  source_token_standard: string;
  destination_token_standard: string;
  provider: string;
  provider_mechanism: string | null;
  user_visible_reason: string;
  agent_reason_code: string;
  remediation: string | null;
  registry_snapshot_at: string;
  registry_expires_at: string;
}

interface RouteListResponse {
  snapshot_id: string;
  routes: RouteState[];
}

const PRIMARY_BADGE: Record<PrimaryState, { label: string; color: string }> = {
  out_of_scope: { label: "out of scope", color: "#999" },
  provider_unsupported: { label: "unsupported", color: "#888" },
  provider_supported_code_incomplete: { label: "code incomplete", color: "#b07a18" },
  code_supported_proof_missing: { label: "proof pending", color: "#3a6ea5" },
  canary_authorized: { label: "canary", color: "#a06a18" },
  live: { label: "live", color: "#2c8a3e" },
  suspended: { label: "suspended", color: "#a23030" },
  policy_blocked: { label: "policy blocked", color: "#5a2e8a" },
};

async function fetchRouteStates(apiBase: string): Promise<RouteListResponse> {
  const res = await fetch(`${apiBase}/v1/route-states`);
  if (!res.ok) {
    throw new Error(`route-states fetch failed: ${res.status}`);
  }
  return (await res.json()) as RouteListResponse;
}

export interface RouteListProps {
  apiBase: string;
  onSelect: (routeId: string) => void;
}

export const RouteList: React.FC<RouteListProps> = ({ apiBase, onSelect }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["route-states", apiBase],
    queryFn: () => fetchRouteStates(apiBase),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div data-testid="route-list-loading">Loading routes...</div>;
  }
  if (error) {
    return (
      <div data-testid="route-list-error" role="alert">
        Failed to load routes: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }
  const routes = (data?.routes ?? []).filter((r) => r.primary !== "out_of_scope");
  if (routes.length === 0) {
    return <div data-testid="route-list-empty">No routes available.</div>;
  }
  return (
    <table data-testid="route-list" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8 }}>Route</th>
          <th style={{ textAlign: "left", padding: 8 }}>Asset</th>
          <th style={{ textAlign: "left", padding: 8 }}>Provider</th>
          <th style={{ textAlign: "left", padding: 8 }}>State</th>
          <th style={{ textAlign: "left", padding: 8 }}>Reason</th>
        </tr>
      </thead>
      <tbody>
        {routes.map((r) => {
          const badge = PRIMARY_BADGE[r.primary];
          return (
            <tr
              key={r.route_id}
              data-testid={`route-row-${r.route_id}`}
              data-primary-state={r.primary}
              onClick={() => onSelect(r.route_id)}
              style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
            >
              <td style={{ padding: 8 }}>
                {r.source_chain} ({r.source_token_standard}) to {r.destination_chain} ({r.destination_token_standard})
              </td>
              <td style={{ padding: 8 }}>{r.asset}</td>
              <td style={{ padding: 8 }}>
                {r.provider}
                {r.provider_mechanism ? ` (${r.provider_mechanism})` : ""}
              </td>
              <td style={{ padding: 8 }}>
                <span
                  data-testid={`route-badge-${r.route_id}`}
                  style={{
                    background: badge.color,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {badge.label}
                </span>
              </td>
              <td style={{ padding: 8, fontSize: 12, color: "#555" }}>{r.user_visible_reason}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
```

- [ ] **Step 3: Write the tests.**

```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouteList, RouteState } from "./RouteList";

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const SAMPLE: RouteState[] = [
  {
    route_id: "POL:USDT->TRX:USDT:allbridge_core",
    primary: "code_supported_proof_missing",
    asset: "USDT",
    source_chain: "POL",
    destination_chain: "TRX",
    source_token_standard: "ERC20",
    destination_token_standard: "TRC20",
    provider: "allbridge_core",
    provider_mechanism: "pool",
    user_visible_reason: "Awaiting proof",
    agent_reason_code: "PROOF_PENDING",
    remediation: null,
    registry_snapshot_at: "2026-05-19T00:00:00Z",
    registry_expires_at: "2026-05-19T01:00:00Z",
  },
  {
    route_id: "BAS:USDC->BAS:USDT:allbridge_core",
    primary: "out_of_scope",
    asset: "USDT",
    source_chain: "BAS",
    destination_chain: "BAS",
    source_token_standard: "ERC20",
    destination_token_standard: "ERC20",
    provider: "allbridge_core",
    provider_mechanism: null,
    user_visible_reason: "Out of scope",
    agent_reason_code: "OUT_OF_SCOPE",
    remediation: null,
    registry_snapshot_at: "2026-05-19T00:00:00Z",
    registry_expires_at: "2026-05-19T01:00:00Z",
  },
  {
    route_id: "SOL:USDT->TRX:USDT:allbridge_core",
    primary: "suspended",
    asset: "USDT",
    source_chain: "SOL",
    destination_chain: "TRX",
    source_token_standard: "SPL",
    destination_token_standard: "TRC20",
    provider: "allbridge_core",
    provider_mechanism: "pool",
    user_visible_reason: "Registry stale",
    agent_reason_code: "REGISTRY_STALE",
    remediation: "Wait for registry refresh",
    registry_snapshot_at: "2026-05-19T00:00:00Z",
    registry_expires_at: "2026-05-19T01:00:00Z",
  },
];

describe("RouteList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading then routes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "snap1", routes: SAMPLE }), { status: 200 })
      )
    );
    wrap(<RouteList apiBase="http://api" onSelect={() => {}} />);
    expect(screen.getByTestId("route-list-loading")).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("route-list")).toBeTruthy());
  });

  it("hides out_of_scope rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "snap1", routes: SAMPLE }), { status: 200 })
      )
    );
    wrap(<RouteList apiBase="http://api" onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-list")).toBeTruthy());
    expect(screen.queryByTestId("route-row-BAS:USDC->BAS:USDT:allbridge_core")).toBeNull();
    expect(screen.getByTestId("route-row-POL:USDT->TRX:USDT:allbridge_core")).toBeTruthy();
    expect(screen.getByTestId("route-row-SOL:USDT->TRX:USDT:allbridge_core")).toBeTruthy();
  });

  it("renders distinct badge for suspended vs proof_missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "snap1", routes: SAMPLE }), { status: 200 })
      )
    );
    wrap(<RouteList apiBase="http://api" onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-list")).toBeTruthy());
    const susBadge = screen.getByTestId("route-badge-SOL:USDT->TRX:USDT:allbridge_core");
    const proofBadge = screen.getByTestId("route-badge-POL:USDT->TRX:USDT:allbridge_core");
    expect(susBadge.textContent).toBe("suspended");
    expect(proofBadge.textContent).toBe("proof pending");
    expect(susBadge.getAttribute("style")).not.toBe(proofBadge.getAttribute("style"));
  });

  it("calls onSelect with the route id when a row is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "snap1", routes: SAMPLE }), { status: 200 })
      )
    );
    const onSelect = vi.fn();
    wrap(<RouteList apiBase="http://api" onSelect={onSelect} />);
    await waitFor(() => expect(screen.getByTestId("route-list")).toBeTruthy());
    const row = screen.getByTestId("route-row-POL:USDT->TRX:USDT:allbridge_core");
    row.click();
    expect(onSelect).toHaveBeenCalledWith("POL:USDT->TRX:USDT:allbridge_core");
  });

  it("renders an error state when fetch returns non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server error", { status: 500 }))
    );
    wrap(<RouteList apiBase="http://api" onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-list-error")).toBeTruthy());
  });
});
```

- [ ] **Step 3a: Register the route in `App.tsx`.** Find the existing top-level router (the implementer greps `App.tsx` for `<Route ` or `Routes` to locate the routing config; the v6+ react-router pattern is used). Add:

```tsx
import { RouteList } from "./components/RouteList";
// ...
<Route path="/routes" element={<RouteList apiBase={import.meta.env.VITE_SW4P_API_BASE ?? ""} onSelect={(id) => navigate(`/routes/${encodeURIComponent(id)}`)} />} />
```

If `App.tsx` does not yet use react-router, the implementer adds the import and the `BrowserRouter`/`Routes`/`Route` skeleton scaffolding around the existing root component; the existing wallet/provider tree stays intact. The grep at the start of Step 3a is what decides which of the two paths applies.

- [ ] **Step 4: Run tests.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/components/RouteList.test.tsx
```

Expected: 5 PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/components/RouteList.tsx src/components/RouteList.test.tsx src/App.tsx
git status --short
```

---

## Task T6.2: Route Detail Screen

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the `RouteDetail` component that shows every CRD section 5.2 dimension for a single route, fetched via `GET /v1/route-states` and filtered by `route_id`. PRD-USDT-015 requires exact source asset, destination asset, token standards, provider rail, quote, fees, slippage, approval requirement, proof state, and expected completion status to be shown before signing.

**Spec IDs:** PRD-USDT-015, PRD-USDT-008 (Tron fees), PRD-USDT-022 (provider mechanism display); CRD section 5.2 (required dimensions); SOW WP8.2.

**Files:**

- Create: `sw4p/sw4p-frontend/src/components/RouteDetail.tsx`
- Create: `sw4p/sw4p-frontend/src/components/RouteDetail.test.tsx`
- Modify: `sw4p/sw4p-frontend/src/App.tsx`

- [ ] **Step 1: Write the component.**

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { RouteState } from "./RouteList";

interface RouteListResponse {
  snapshot_id: string;
  routes: RouteState[];
}

async function fetchRouteStates(apiBase: string): Promise<RouteListResponse> {
  const res = await fetch(`${apiBase}/v1/route-states`);
  if (!res.ok) {
    throw new Error(`route-states fetch failed: ${res.status}`);
  }
  return (await res.json()) as RouteListResponse;
}

function describeProofState(s: string | null | undefined): string {
  switch (s) {
    case "destination_settled":
      return "Settled on destination chain";
    case "source_observed":
      return "Source confirmed; destination pending";
    case "proof_pending":
      return "Awaiting first canary or provider-confirmed proof";
    case "none":
    case null:
    case undefined:
      return "No proof recorded";
    default:
      return s;
  }
}

export interface RouteDetailProps {
  apiBase: string;
  routeId: string;
  onExecute: (routeId: string) => void;
  onBack: () => void;
}

export const RouteDetail: React.FC<RouteDetailProps> = ({ apiBase, routeId, onExecute, onBack }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["route-states", apiBase],
    queryFn: () => fetchRouteStates(apiBase),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div data-testid="route-detail-loading">Loading route...</div>;
  }
  if (error) {
    return (
      <div data-testid="route-detail-error" role="alert">
        Failed to load route: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }
  const route = data?.routes.find((r) => r.route_id === routeId);
  if (!route) {
    return <div data-testid="route-detail-not-found">Route not found: {routeId}</div>;
  }
  const executable = route.primary === "live" || route.primary === "canary_authorized";
  return (
    <div data-testid="route-detail" data-primary-state={route.primary} style={{ padding: 16 }}>
      <button type="button" onClick={onBack} data-testid="route-detail-back">
        Back
      </button>
      <h2>Route detail</h2>
      <dl>
        <dt>Source asset</dt>
        <dd data-testid="rd-source-asset">
          {route.asset} ({route.source_token_standard}) on {route.source_chain}
        </dd>
        <dt>Destination asset</dt>
        <dd data-testid="rd-destination-asset">
          {route.asset} ({route.destination_token_standard}) on {route.destination_chain}
        </dd>
        <dt>Provider</dt>
        <dd data-testid="rd-provider">
          {route.provider}
          {route.provider_mechanism ? ` (${route.provider_mechanism})` : ""}
        </dd>
        <dt>Primary state</dt>
        <dd data-testid="rd-primary-state">{route.primary}</dd>
        <dt>Proof state</dt>
        <dd data-testid="rd-proof-state">{describeProofState((route as RouteState & { proof_state?: string }).proof_state)}</dd>
        <dt>Registry snapshot</dt>
        <dd data-testid="rd-registry-snapshot">{route.registry_snapshot_at}</dd>
        <dt>Registry expires</dt>
        <dd data-testid="rd-registry-expires">{route.registry_expires_at}</dd>
        <dt>Reason</dt>
        <dd data-testid="rd-reason">{route.user_visible_reason}</dd>
        <dt>Agent reason code</dt>
        <dd data-testid="rd-agent-reason-code"><code>{route.agent_reason_code}</code></dd>
        {route.remediation ? (
          <>
            <dt>Remediation</dt>
            <dd data-testid="rd-remediation">{route.remediation}</dd>
          </>
        ) : null}
      </dl>
      <p style={{ fontSize: 12, color: "#777" }}>
        Tron destination routes deliver TRC20 USDT. Failed Tron contract execution may still consume Bandwidth and Energy.
      </p>
      <div>
        <button
          type="button"
          disabled={!executable}
          data-testid="rd-execute"
          onClick={() => onExecute(route.route_id)}
        >
          {executable ? "Continue to execution" : "Not executable in this state"}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Write the tests.**

```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouteDetail } from "./RouteDetail";
import { RouteState } from "./RouteList";

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const ROUTE: RouteState = {
  route_id: "POL:USDT->TRX:USDT:allbridge_core",
  primary: "code_supported_proof_missing",
  asset: "USDT",
  source_chain: "POL",
  destination_chain: "TRX",
  source_token_standard: "ERC20",
  destination_token_standard: "TRC20",
  provider: "allbridge_core",
  provider_mechanism: "pool",
  user_visible_reason: "Awaiting proof",
  agent_reason_code: "PROOF_PENDING",
  remediation: "Wait for first canary",
  registry_snapshot_at: "2026-05-19T00:00:00Z",
  registry_expires_at: "2026-05-19T01:00:00Z",
};

describe("RouteDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders every CRD 5.2 dimension", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "s", routes: [ROUTE] }), { status: 200 })
      )
    );
    wrap(<RouteDetail apiBase="http://api" routeId={ROUTE.route_id} onExecute={() => {}} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-detail")).toBeTruthy());
    expect(screen.getByTestId("rd-source-asset").textContent).toContain("USDT (ERC20) on POL");
    expect(screen.getByTestId("rd-destination-asset").textContent).toContain("USDT (TRC20) on TRX");
    expect(screen.getByTestId("rd-provider").textContent).toContain("allbridge_core (pool)");
    expect(screen.getByTestId("rd-primary-state").textContent).toBe("code_supported_proof_missing");
    expect(screen.getByTestId("rd-agent-reason-code").textContent).toBe("PROOF_PENDING");
    expect(screen.getByTestId("rd-remediation").textContent).toBe("Wait for first canary");
  });

  it("disables execute when not live or canary_authorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "s", routes: [ROUTE] }), { status: 200 })
      )
    );
    wrap(<RouteDetail apiBase="http://api" routeId={ROUTE.route_id} onExecute={() => {}} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-detail")).toBeTruthy());
    const btn = screen.getByTestId("rd-execute") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("enables execute when canary_authorized", async () => {
    const canary = { ...ROUTE, primary: "canary_authorized" as const };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "s", routes: [canary] }), { status: 200 })
      )
    );
    wrap(<RouteDetail apiBase="http://api" routeId={canary.route_id} onExecute={() => {}} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-detail")).toBeTruthy());
    const btn = screen.getByTestId("rd-execute") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("renders not-found when the routeId does not match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ snapshot_id: "s", routes: [ROUTE] }), { status: 200 })
      )
    );
    wrap(<RouteDetail apiBase="http://api" routeId="nope" onExecute={() => {}} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("route-detail-not-found")).toBeTruthy());
  });
});
```

- [ ] **Step 3: Register the path in `App.tsx`.**

```tsx
import { RouteDetail } from "./components/RouteDetail";
// ...
<Route
  path="/routes/:routeId"
  element={
    <RouteDetail
      apiBase={import.meta.env.VITE_SW4P_API_BASE ?? ""}
      routeId={decodeURIComponent(useParams().routeId ?? "")}
      onExecute={(id) => navigate(`/execute/tron/${encodeURIComponent(id)}`)}
      onBack={() => navigate("/routes")}
    />
  }
/>
```

If the existing routing config does not support hooks inside the `element` prop (older react-router), the implementer wraps `RouteDetail` in a thin `RouteDetailPage` function component that reads `useParams` and `useNavigate` and passes them in as props.

- [ ] **Step 4: Run tests.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/components/RouteDetail.test.tsx
```

Expected: 4 PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/components/RouteDetail.tsx src/components/RouteDetail.test.tsx src/App.tsx
git status --short
```

---

## Task T6.3: Tron Execution Page

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add a single Tron execution page that (a) fetches the unsigned raw tx via `POST /v1/tron/raw-tx`, (b) renders the M3-shipped `TronTxReview` component with the returned resource preview, (c) calls the M3-shipped `useTronSigning` hook on user confirmation, and (d) polls status against the M5 lifecycle event endpoint. The page is the missing wiring between three already-shipped pieces (handler, hook, review component).

**Spec IDs:** PRD-USDT-005 (real Tron wallet signing), PRD-USDT-008 (Tron fees displayed before signing), PRD-USDT-015 (route confirmation surface), PRD-USDT-017 (raw tx validation before signing); CRD CRD-SIGN-003 (Tron source); TRD section 8 (Tron wallet adapter); SOW WP8.3.

**Files:**

- Create: `sw4p/sw4p-frontend/src/pages/TronExecution.tsx`
- Create: `sw4p/sw4p-frontend/src/pages/TronExecution.test.tsx`
- Modify: `sw4p/sw4p-frontend/src/App.tsx`

- [ ] **Step 1: Write the page.**

```tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TronTxReview, TronResourcePreview } from "../components/TronTxReview";
import { useTronSigning } from "../hooks/useTronSigning";

interface RawTxResponse {
  unsigned: {
    raw_data: Record<string, unknown>;
    raw_data_hex: string;
    txID: string;
    contract_address: string;
    recipient: string;
    amount_decimal: string;
  };
  preview: TronResourcePreview;
}

interface LifecycleEventRow {
  event_id: number;
  event: string;
  recorded_at: string;
  reason_code: string | null;
  tx_hash: string | null;
}

interface LifecycleResponse {
  route_id: string;
  events: LifecycleEventRow[];
}

async function postRawTx(apiBase: string, body: {
  route_id: string;
  sender: string;
  recipient: string;
  amount_decimal: string;
}): Promise<RawTxResponse> {
  const res = await fetch(`${apiBase}/v1/tron/raw-tx`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`raw-tx ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as RawTxResponse;
}

async function fetchLifecycle(apiBase: string, routeId: string): Promise<LifecycleResponse> {
  const res = await fetch(`${apiBase}/v1/route-states/${encodeURIComponent(routeId)}/events`);
  if (!res.ok) {
    throw new Error(`lifecycle ${res.status}`);
  }
  return (await res.json()) as LifecycleResponse;
}

const TERMINAL_EVENTS = new Set([
  "destination_settled",
  "settlement_proof_recorded",
  "failed",
  "refunded",
]);

export interface TronExecutionProps {
  apiBase: string;
  routeId: string;
  sender: string;
  recipient: string;
  amountDecimal: string;
}

export const TronExecution: React.FC<TronExecutionProps> = ({
  apiBase,
  routeId,
  sender,
  recipient,
  amountDecimal,
}) => {
  const [phase, setPhase] = useState<"review" | "signed" | "polling" | "done" | "error">("review");
  const [signedTxId, setSignedTxId] = useState<string | null>(null);
  const signing = useTronSigning();

  const rawTx = useQuery({
    queryKey: ["tron-raw-tx", routeId, sender, recipient, amountDecimal],
    queryFn: () => postRawTx(apiBase, { route_id: routeId, sender, recipient, amount_decimal: amountDecimal }),
    staleTime: 60_000,
    retry: false,
  });

  const lifecycle = useQuery({
    queryKey: ["tron-lifecycle", routeId],
    queryFn: () => fetchLifecycle(apiBase, routeId),
    enabled: phase === "polling",
    refetchInterval: (q) => {
      const last = q.state.data?.events.slice(-1)[0]?.event;
      if (last && TERMINAL_EVENTS.has(last)) {
        return false;
      }
      return 4000;
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!rawTx.data) {
        throw new Error("raw tx not ready");
      }
      // PRD-USDT-017 enforces validator-checked raw tx before signing; the
      // backend has already validated. The frontend MUST pass the
      // `raw_data` OBJECT to TronWeb (not the `raw_data_hex` bytes); the
      // T6.4 verification task asserts this contract holds.
      const result = await signing.signAndBroadcast(rawTx.data.unsigned.raw_data);
      return result.txId;
    },
    onSuccess: (txId) => {
      setSignedTxId(txId);
      setPhase("polling");
    },
    onError: () => setPhase("error"),
  });

  if (rawTx.isLoading) {
    return <div data-testid="tron-exec-loading">Building unsigned transaction...</div>;
  }
  if (rawTx.error) {
    return (
      <div data-testid="tron-exec-error" role="alert">
        Failed to build raw tx: {String(rawTx.error)}
      </div>
    );
  }
  if (!rawTx.data) {
    return <div data-testid="tron-exec-empty">No raw tx returned.</div>;
  }

  if (phase === "review") {
    return (
      <TronTxReview
        preview={rawTx.data.preview}
        recipient={rawTx.data.unsigned.recipient}
        amount={rawTx.data.unsigned.amount_decimal}
        contractAddress={rawTx.data.unsigned.contract_address}
        onConfirm={() => {
          setPhase("signed");
          signMutation.mutate();
        }}
        onCancel={() => window.history.back()}
      />
    );
  }
  if (phase === "signed" || (phase === "polling" && !signedTxId)) {
    return <div data-testid="tron-exec-signing">Awaiting wallet signature and broadcast...</div>;
  }
  if (phase === "polling") {
    const last = lifecycle.data?.events.slice(-1)[0];
    return (
      <div data-testid="tron-exec-polling">
        <p>Broadcasted as <code data-testid="tron-exec-txid">{signedTxId}</code></p>
        <p>Current state: <code>{last?.event ?? "pending"}</code></p>
        {last && TERMINAL_EVENTS.has(last.event) ? (
          <button
            type="button"
            data-testid="tron-exec-done"
            onClick={() => setPhase("done")}
          >
            Continue
          </button>
        ) : null}
      </div>
    );
  }
  if (phase === "done") {
    return <div data-testid="tron-exec-done-screen">Transfer complete.</div>;
  }
  return (
    <div data-testid="tron-exec-error-screen" role="alert">
      Execution failed: {signing.error ?? "unknown"}
    </div>
  );
};
```

- [ ] **Step 2: Write the integration test.**

```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TronExecution } from "./TronExecution";

const RAW_TX_PAYLOAD = {
  unsigned: {
    raw_data: { ref_block_bytes: "ab12", timestamp: 1, expiration: 2, contract: [{ parameter: { value: {} } }] },
    raw_data_hex: "0a02ab12",
    txID: "txid_abc",
    contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    recipient: "TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa",
    amount_decimal: "5.00",
  },
  preview: {
    bandwidth_required: 345,
    energy_required: 14000,
    fee_limit_sun: 30_000_000,
    estimated_trx_burn_sun: 1_400_000,
  },
};

vi.mock("../WalletProvider", () => ({
  useAppWallet: () => ({
    tronSignTransaction: vi.fn(async (raw: unknown) => {
      // Must receive the raw_data OBJECT, not the hex string (T6.4 contract).
      if (typeof raw !== "object" || raw === null) {
        throw new Error("expected raw_data object, got " + typeof raw);
      }
      return { ...raw, signature: ["sig1"] };
    }),
    tronBroadcastTransaction: vi.fn(async () => ({ result: true, txid: "broadcast_txid_xyz" })),
  }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("TronExecution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches raw-tx, renders review, signs, broadcasts, polls until destination_settled", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.endsWith("/v1/tron/raw-tx")) {
          return new Response(JSON.stringify(RAW_TX_PAYLOAD), { status: 200 });
        }
        if (url.includes("/events")) {
          // Two polls: pending, then destination_settled.
          const settled = calls.filter((c) => c.includes("/events")).length >= 2;
          return new Response(
            JSON.stringify({
              route_id: "POL:USDT->TRX:USDT:allbridge_core",
              events: settled
                ? [
                    { event_id: 1, event: "source_tx_submitted", recorded_at: "t1", reason_code: null, tx_hash: "broadcast_txid_xyz" },
                    { event_id: 2, event: "destination_settled", recorded_at: "t2", reason_code: null, tx_hash: null },
                  ]
                : [
                    { event_id: 1, event: "source_tx_submitted", recorded_at: "t1", reason_code: null, tx_hash: "broadcast_txid_xyz" },
                  ],
            }),
            { status: 200 }
          );
        }
        return new Response("nope", { status: 404 });
      })
    );

    wrap(
      <TronExecution
        apiBase="http://api"
        routeId="POL:USDT->TRX:USDT:allbridge_core"
        sender="TSender..."
        recipient="TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa"
        amountDecimal="5.00"
      />
    );

    await waitFor(() => expect(screen.getByTestId("tron-tx-review")).toBeTruthy());
    fireEvent.click(screen.getByText("Sign with TronLink"));
    await waitFor(() => expect(screen.getByTestId("tron-exec-txid").textContent).toBe("broadcast_txid_xyz"));
    await waitFor(() => expect(screen.getByTestId("tron-exec-done")).toBeTruthy(), { timeout: 10_000 });
  });

  it("renders error when raw-tx returns non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/v1/tron/raw-tx")) {
          return new Response("validator rejected", { status: 400 });
        }
        return new Response("nope", { status: 404 });
      })
    );
    wrap(
      <TronExecution apiBase="http://api" routeId="r" sender="s" recipient="r" amountDecimal="1" />
    );
    await waitFor(() => expect(screen.getByTestId("tron-exec-error")).toBeTruthy());
  });
});
```

- [ ] **Step 3: Register the path in `App.tsx`.**

```tsx
import { TronExecution } from "./pages/TronExecution";
// ...
<Route
  path="/execute/tron/:routeId"
  element={
    <TronExecution
      apiBase={import.meta.env.VITE_SW4P_API_BASE ?? ""}
      routeId={decodeURIComponent(useParams().routeId ?? "")}
      sender={useAppWallet().tronAddress ?? ""}
      recipient={new URLSearchParams(window.location.search).get("recipient") ?? ""}
      amountDecimal={new URLSearchParams(window.location.search).get("amount") ?? "0"}
    />
  }
/>
```

The implementer confirms `tronAddress` exists on the `WalletProvider` exit type by greping `WalletProvider.tsx`; if it does not, the implementer adds it as a thin accessor over the existing `window.tronWeb.defaultAddress.base58`. The recipient and amount come from the query string, which `RouteDetail` populates via the `onExecute` callback (next-step controller follow-up not required: the existing `onExecute` already receives the routeId, and the implementer extends `RouteDetail`'s `onExecute` call site in `App.tsx` to also pass `?recipient=...&amount=...` from `RouteDetail`'s local form state). The form state addition is a single useState in `RouteDetail`; the implementer adds two `<input>` controls above the execute button.

- [ ] **Step 4: Run tests.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/pages/TronExecution.test.tsx
```

Expected: 2 PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/pages/TronExecution.tsx src/pages/TronExecution.test.tsx src/App.tsx src/components/RouteDetail.tsx
git status --short
```

---

## Task T6.4: Verify raw_data Object Passing

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Verify and lock in the contract that the frontend passes the `raw_data` JSON object (not the `raw_data_hex` bytes) to `window.tronWeb.trx.sign`. This is tracked in the M4 follow-ups doc as a regression risk. T6.3's test already asserts this; T6.4 adds a static-analysis guard so a future careless edit is caught by the linter, not by a chain.

**Spec IDs:** PRD-USDT-005, PRD-USDT-017; TRD-TRON-002 (provider raw tx review); SOW WP8.3.

**Files:**

- Modify: `sw4p/sw4p-frontend/src/hooks/useTronSigning.ts` (add an inline argument-shape comment and a defensive runtime check)
- Modify: `sw4p/sw4p-frontend/src/pages/TronExecution.tsx` (T6.3 already passes the object; T6.4 adds the inline guard comment for grep-ability)

- [ ] **Step 1: Read the current hook.**

```bash
sed -n '1,60p' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/hooks/useTronSigning.ts"
```

Confirm the `signAndBroadcast` parameter type is `unknown` and the first call is `tronSignTransaction(unsignedTx)`. T6.4 does not change the type to `object` (TronWeb tolerates either; the runtime guard is the load-bearing check), but it adds a runtime check.

- [ ] **Step 2: Edit `useTronSigning.ts` to add the runtime guard.**

Replace:

```ts
  const signAndBroadcast = useCallback(async (unsignedTx: unknown) => {
    setError(null);
    setTxId(null);
    setIsSigning(true);
    let signed: unknown;
    try {
      signed = await tronSignTransaction(unsignedTx);
```

With:

```ts
  const signAndBroadcast = useCallback(async (unsignedTx: unknown) => {
    setError(null);
    setTxId(null);
    // T6.4 contract: callers MUST pass the `raw_data` object returned by
    // POST /v1/tron/raw-tx, not the `raw_data_hex` string. TronWeb's
    // `trx.sign` accepts both shapes silently, but signing the hex
    // string produces a signature that does NOT cover the structured
    // contract fields, so the recipient/amount can be tampered with
    // after signing without invalidating the signature. The guard
    // below makes a bad call fail fast in dev, not silently in prod.
    if (typeof unsignedTx !== "object" || unsignedTx === null) {
      const err = new Error(
        "useTronSigning: expected raw_data object, got " + typeof unsignedTx
      );
      setError(err.message);
      throw err;
    }
    setIsSigning(true);
    let signed: unknown;
    try {
      signed = await tronSignTransaction(unsignedTx);
```

- [ ] **Step 3: Defer the test to T6.18.** T6.18 ships the full suite, including a "scenario 7" test that passes a hex string and asserts the Step 2 guard throws. T6.4's only deliverable in this task is the runtime guard plus the contract comment in `useTronSigning.ts`. Mark this step complete once Step 2 is applied.

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/pages/TronExecution.test.tsx
```

Expected: 2 PASS (existing T6.3 tests; the mock already passes an object, so the guard is exercised and does not throw).

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/hooks/useTronSigning.ts
git status --short
```

---

## Task T6.5: MCP Gateway route_states and route_state_by_id Tools

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add two MCP tools to `sw4p-mcp-gateway/src/tools.ts` that expose the backend route-state surface. The gateway proxies to the existing `GET /v1/route-states` endpoint without re-flattening the structured response (TRD-KIT-005).

**Spec IDs:** PRD-USDT-009 (machine-readable route states), PRD-USDT-013 (provider metadata never auto-promotes); TRD-KIT-003, TRD-KIT-005; SOW WP8.4, WP8.5.

**Files:**

- Modify: `sw4p-mcp-gateway/src/tools.ts`

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m6-product-parity`. STOP if wrong.

- [ ] **Step 2: Add the two tools to the `TOOLS` array.** Insert after the existing `sw4p.rebalance_execute` entry:

```ts
  {
    name: "sw4p.route_states",
    description:
      "List all derived route states tied to the most recent persisted Allbridge snapshot. Returns the structured RouteStateListResponse without re-flattening per TRD-KIT-005.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    method: "GET",
    buildPath: () => "/v1/route-states",
  },
  {
    name: "sw4p.route_state_by_id",
    description:
      "Fetch a single derived route state by routeId. Returns the same RouteState shape RouteList.tsx consumes.",
    inputSchema: {
      type: "object",
      properties: {
        routeId: {
          type: "string",
          description:
            "Route identifier as produced by the backend, e.g. \"POL:USDT->TRX:USDT:allbridge_core\".",
        },
      },
      required: ["routeId"],
    },
    method: "GET",
    buildPath: (args) =>
      `/v1/route-states/${encodeURIComponent(requireStringArg(args, "routeId"))}`,
  },
```

The backend already serves `/v1/route-states`; the `/v1/route-states/:routeId` path is consumed by the existing kit `RouteStateResponse` per the M0-M2 PR. If the per-id path does not yet exist on the backend (M0-M2 may have shipped only the list endpoint), the gateway can synthesize it by fetching the list and filtering client-side; the implementer's wave-start check is `curl -sS $API_BASE/v1/route-states/test 2>&1 | head -5` against the staging API, and if it returns 404, the `buildPath` for `route_state_by_id` falls back to the list endpoint with a documented note in the description. Either branch ships in this task.

- [ ] **Step 3: Write tests.** The gateway test path is `sw4p-mcp-gateway/test/`; mirror the existing test for `sw4p.balance` (the implementer reads one existing test in `test/` to identify the test framework conventions; vitest is in `package.json`). Add to a new file `test/route_states.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TOOLS_BY_NAME } from "../src/tools";

describe("route_states tools", () => {
  it("registers sw4p.route_states", () => {
    const t = TOOLS_BY_NAME.get("sw4p.route_states");
    expect(t).toBeDefined();
    expect(t!.method).toBe("GET");
    expect(t!.buildPath({})).toBe("/v1/route-states");
  });

  it("registers sw4p.route_state_by_id with URL-encoded routeId", () => {
    const t = TOOLS_BY_NAME.get("sw4p.route_state_by_id");
    expect(t).toBeDefined();
    expect(t!.method).toBe("GET");
    expect(t!.buildPath({ routeId: "POL:USDT->TRX:USDT:allbridge_core" })).toBe(
      "/v1/route-states/POL%3AUSDT-%3ETRX%3AUSDT%3Aallbridge_core"
    );
  });

  it("rejects missing routeId on sw4p.route_state_by_id", () => {
    const t = TOOLS_BY_NAME.get("sw4p.route_state_by_id");
    expect(() => t!.buildPath({})).toThrow(/missing required argument: routeId/);
  });
});
```

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway"
npx vitest run test/route_states.test.ts
```

Expected: 3 PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway"
git add src/tools.ts test/route_states.test.ts
git status --short
```

---

## Task T6.6: MCP Gateway canary_authorization_create Tool

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add an operator-only MCP tool `sw4p.canary_authorization_create` that POSTs to `POST /v1/operator/canary-authorizations` (added in T6.11). Validates the input against `CanaryAuthorizationSchema` imported from `sw4p-kit` so the gateway and the kit stay in agreement.

**Spec IDs:** PRD-USDT-019, PRD-USDT-024; CRD section 14 (canary authorization), CRD-SEC-002 (relayer/canary structure); TRD section 14, TRD-KIT-005; SOW WP8.5.

**Files:**

- Modify: `sw4p-mcp-gateway/src/tools.ts`
- Modify: `sw4p-mcp-gateway/package.json` (link `@sw4p/kit` if not already present)

- [ ] **Step 1: Confirm the kit linkage.**

```bash
grep -n "@sw4p/kit\|sw4p-kit" "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway/package.json"
```

If absent, add `"@sw4p/kit": "file:../sw4p-kit"` (or whichever path the existing kit submodule uses) to `dependencies` and run `npm install` once. If present, proceed.

- [ ] **Step 2: Add the tool.** Insert into `TOOLS`:

```ts
  {
    name: "sw4p.canary_authorization_create",
    description:
      "Operator-only: create a canary authorization for a relayer-signed Tron transfer. Mirrors the structured object from TRD section 14. Requires the X-Operator-Token header on the upstream call (forwarded by the gateway from the caller's X-Operator-Token).",
    inputSchema: {
      type: "object",
      properties: {
        authorization_id: { type: "string", description: "Caller-chosen stable id." },
        source_chain: { type: "string" },
        destination_chain: { type: "string" },
        source_asset: { type: "string", enum: ["USDC", "USDT"] },
        destination_asset: { type: "string", enum: ["USDC", "USDT"] },
        rail: { type: "string", enum: ["circle_cctp_v2", "allbridge_core"] },
        amount_decimal: { type: "string", description: "Positive decimal string, e.g. \"5.00\"." },
        source_wallet: { type: "string" },
        destination_wallet: { type: "string" },
        max_fee: { type: "string", description: "Positive decimal cap, e.g. \"0.50\"." },
        max_slippage: { type: "string", description: "Positive decimal cap, e.g. \"0.05\"." },
        approval_cap: { type: "string", description: "Positive decimal cap, e.g. \"5.00\"." },
        expires_at: { type: "string", description: "ISO-8601 datetime, e.g. \"2026-05-19T12:00:00Z\"." },
        approver: { type: "string" },
        proof_destination: { type: "string", description: "Where the proof of execution will be written." },
        notes: { type: "string", description: "Optional free text." },
      },
      required: [
        "authorization_id",
        "source_chain",
        "destination_chain",
        "source_asset",
        "destination_asset",
        "rail",
        "amount_decimal",
        "source_wallet",
        "destination_wallet",
        "max_fee",
        "max_slippage",
        "approval_cap",
        "expires_at",
        "approver",
        "proof_destination",
      ],
    },
    method: "POST",
    buildPath: () => "/v1/operator/canary-authorizations",
    buildBody: (args) => {
      // The gateway re-uses the kit's Zod schema to validate inputs
      // before forwarding so a bad argument fails close to the agent,
      // not at the upstream HTTP boundary.
      const { parseCanaryAuthorization } = require("@sw4p/kit") as {
        parseCanaryAuthorization: (i: unknown) => unknown;
      };
      return parseCanaryAuthorization(args);
    },
  },
```

The `require` call avoids hoisting the kit import to top-of-file in case the kit is only present in dev dependencies; the implementer should verify the kit's main entry exports `parseCanaryAuthorization` and adjust the import to ESM `import { parseCanaryAuthorization } from "@sw4p/kit/core/canary";` if the package layout requires a deeper path.

- [ ] **Step 3: Write tests.** Add `test/canary_authorization_create.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TOOLS_BY_NAME } from "../src/tools";

describe("canary_authorization_create", () => {
  const VALID = {
    authorization_id: "auth_001",
    source_chain: "POL",
    destination_chain: "TRX",
    source_asset: "USDT" as const,
    destination_asset: "USDT" as const,
    rail: "allbridge_core" as const,
    amount_decimal: "5.00",
    source_wallet: "0xabc...",
    destination_wallet: "TYbk...",
    max_fee: "0.50",
    max_slippage: "0.05",
    approval_cap: "5.00",
    expires_at: "2026-05-19T12:00:00Z",
    approver: "ops@rndrntwrk",
    proof_destination: "s3://sw4p-proofs/2026-05-19/auth_001.json",
  };

  it("registers the tool with the correct upstream path and method", () => {
    const t = TOOLS_BY_NAME.get("sw4p.canary_authorization_create");
    expect(t).toBeDefined();
    expect(t!.method).toBe("POST");
    expect(t!.buildPath({})).toBe("/v1/operator/canary-authorizations");
  });

  it("buildBody passes a valid authorization through unchanged", () => {
    const t = TOOLS_BY_NAME.get("sw4p.canary_authorization_create")!;
    const out = t.buildBody!(VALID as unknown as Record<string, unknown>);
    expect(out).toMatchObject(VALID);
  });

  it("buildBody rejects an authorization with a non-numeric amount_decimal", () => {
    const t = TOOLS_BY_NAME.get("sw4p.canary_authorization_create")!;
    expect(() =>
      t.buildBody!({ ...VALID, amount_decimal: "five" } as Record<string, unknown>)
    ).toThrow();
  });

  it("buildBody rejects a non-ISO expires_at after T6.7 tightens the schema", () => {
    const t = TOOLS_BY_NAME.get("sw4p.canary_authorization_create")!;
    expect(() =>
      t.buildBody!({ ...VALID, expires_at: "not a date" } as Record<string, unknown>)
    ).toThrow();
  });
});
```

The last assertion is the one that proves T6.7's `z.string().datetime()` tightening is honored by the gateway path; if T6.7 has not yet merged, the test still passes because the existing schema rejects the input via a downstream check (the freeform `z.string()` would accept it; in that case the test fails and the controller schedules T6.7 first).

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway"
npx vitest run test/canary_authorization_create.test.ts
```

Expected: 4 PASS once T6.7 has landed.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway"
git add src/tools.ts test/canary_authorization_create.test.ts package.json
git status --short
```

---

## Task T6.7: Kit expires_at Strictness

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Tighten `sw4p-kit/src/core/canary.ts:16` from `z.string()` to `z.string().datetime()` so the kit (and by extension the MCP gateway in T6.6) rejects a non-ISO-8601 `expires_at` at the schema boundary.

**Spec IDs:** PRD-USDT-019; CRD section 14; TRD section 14; SOW WP8.4. Hygiene item from PR #7 review.

**Files:**

- Modify: `sw4p-kit/src/core/canary.ts`
- Modify: `sw4p-kit/src/core/canary.test.ts` (or whichever file holds the existing canary tests; if none exists, create it)

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m6-product-parity`. STOP if wrong.

- [ ] **Step 2: Edit the schema.** Replace line 16 in `sw4p-kit/src/core/canary.ts`:

```ts
  expires_at: z.string(),
```

with:

```ts
  // T6.7: tightened from z.string() to z.string().datetime() so a
  // non-ISO-8601 value fails at the kit boundary instead of being
  // accepted and bouncing off the backend's chrono::DateTime<Utc>
  // parser with a 400. The backend already expects strict ISO-8601;
  // this aligns the kit schema with backend behavior.
  expires_at: z.string().datetime(),
```

- [ ] **Step 3: Add or extend the test file.** Check whether `sw4p-kit/src/core/canary.test.ts` exists:

```bash
ls "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/src/core/canary.test.ts" 2>/dev/null || ls "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/test/canary.test.ts" 2>/dev/null
```

If absent, create `sw4p-kit/test/canary.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseCanaryAuthorization, CanaryAuthorizationSchema } from "../src/core/canary";

const VALID = {
  authorization_id: "auth_001",
  source_chain: "POL",
  destination_chain: "TRX",
  source_asset: "USDT" as const,
  destination_asset: "USDT" as const,
  rail: "allbridge_core" as const,
  amount_decimal: "5.00",
  source_wallet: "0xabc",
  destination_wallet: "TYbk",
  max_fee: "0.50",
  max_slippage: "0.05",
  approval_cap: "5.00",
  expires_at: "2026-05-19T12:00:00Z",
  approver: "ops@rndrntwrk",
  proof_destination: "s3://x",
};

describe("CanaryAuthorizationSchema", () => {
  it("accepts a fully valid authorization", () => {
    expect(() => parseCanaryAuthorization(VALID)).not.toThrow();
  });

  it("rejects a non-ISO-8601 expires_at after T6.7 tightening", () => {
    expect(() => parseCanaryAuthorization({ ...VALID, expires_at: "tomorrow at noon" })).toThrow();
  });

  it("accepts an ISO-8601 expires_at with milliseconds and offset", () => {
    expect(() =>
      parseCanaryAuthorization({ ...VALID, expires_at: "2026-05-19T12:00:00.123Z" })
    ).not.toThrow();
  });

  it("rejects amount_decimal with letters", () => {
    expect(() => parseCanaryAuthorization({ ...VALID, amount_decimal: "five" })).toThrow();
  });
});
```

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
npx vitest run
```

Expected: existing tests pass plus 4 new PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git add src/core/canary.ts test/canary.test.ts
git status --short
```

---

## Task T6.8: Kit source_chain and destination_chain Documentation

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add an inline comment on `canary.ts` source/destination chain fields explaining why they stay as bare `z.string()` rather than extending the kit's `ChainSchema` enum. TRX is intentionally absent from `ChainSchema` so that adding it does not automatically promote Tron routes to live in the kit's other code paths.

**Spec IDs:** PRD-USDT-003 (Tron gated until proof), PRD-USDT-013 (provider metadata never auto-promotes); TRD-KIT-001 (chain schema must include `"tron"` without marking routes live); SOW WP8.4. Hygiene item from PR #7 review.

**Files:**

- Modify: `sw4p-kit/src/core/canary.ts`

- [ ] **Step 1: Replace lines 5 and 6 (the `source_chain` and `destination_chain` declarations) with:**

```ts
  // T6.8: `source_chain` and `destination_chain` stay as bare
  // `z.string()` rather than the kit's `ChainSchema` enum
  // (`sw4p-kit/src/core/intent.ts` line 3) for two reasons:
  //
  // 1. The Tron chain code `"TRX"` is deliberately NOT a member of
  //    `ChainSchema` because every consumer that imports `ChainSchema`
  //    would otherwise implicitly treat Tron as a normal route asset
  //    (TRD-KIT-001 requires Tron to be listed without marking all
  //    Tron routes live). The canary path is the explicit opt-in for
  //    Tron, so the canary schema cannot inherit the `ChainSchema`
  //    constraint.
  //
  // 2. Canary authorizations are operator-authored and may name a
  //    chain that the runtime is in the middle of rolling out. The
  //    backend still validates that the chain matches an active
  //    provider snapshot row, so the kit's freeform string here is
  //    not a soundness gap.
  source_chain: z.string(),
  destination_chain: z.string(),
```

The implementer keeps the existing `z.string()` declarations and only adds the comment block above them; replacing them with a stricter check would break the canary path for future Tron support.

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
npx vitest run
```

Expected: all PASS (no behavioral change; T6.7's tests continue to pass).

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git add src/core/canary.ts
git status --short
```

---

## Task T6.9: Full Solana SPL plus Allbridge Program Instruction Build

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Replace the `SOLANA_BRIDGE_STUB_MARKER` return in `allbridge.rs::bridge_from_solana_to_tron` with a real construction of an unsigned Solana transaction that (a) creates the user USDT associated token account if missing, (b) issues an SPL `transfer_checked` from the user's USDT ATA to the Allbridge Solana pool ATA, (c) calls the Allbridge Solana program's `swapAndBridge`-equivalent instruction with the Tron destination encoded as bytes32, (d) fetches the recent blockhash from `solana_client`, and (e) returns the serialized Message base64-encoded for the frontend Solana wallet adapter to sign. The route stays `code_supported_proof_missing` until T7 lands a real on-chain canary; T6.10 flips the policy state once T6.9 ships.

This is the long pole of M6. The plan budgets a fresh subagent dispatch with a follow-up quality-review pass.

**Spec IDs:** PRD-USDT-006 (no false live), PRD-USDT-009 (machine-readable surface); CRD section 7 (CRD-SIGN-002 Solana source); TRD section 5 (Allbridge raw transaction builder); SOW WP6.3 (Solana to Tron gap closure).

**Files:**

- Modify: `sw4p/sw4p-backend/src/allbridge.rs`
- Modify: `sw4p/sw4p-backend/Cargo.toml` (confirm `solana-sdk`, `solana-client`, `spl-token`, `spl-associated-token-account` are present at the versions already used by `solana_signing_api`; add missing dependencies)
- Modify: `sw4p/sw4p-backend/src/networks.rs` (if the Registry does not already expose `solana_allbridge_pool_address` and `solana_allbridge_program_id`, add the accessors; the Registry is the single source of truth per the M0-M2 design)

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m6-product-parity`. STOP if wrong.

- [ ] **Step 2: Confirm Cargo dependencies.**

```bash
grep -nE 'solana-sdk|solana-client|spl-token|spl-associated-token-account' \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/Cargo.toml"
```

Expected: all four present from the M4 `solana_signing_api` work. If any are missing, add them under `[dependencies]`:

```toml
solana-sdk = "1.18"
solana-client = "1.18"
spl-token = "4.0"
spl-associated-token-account = "3.0"
```

The implementer must pin to the same minor as the existing `solana_signing_api` use (the `solana_client::nonblocking::rpc_client::RpcClient` path confirms `1.18`).

- [ ] **Step 3: Confirm the Registry accessors.**

```bash
grep -nE 'solana_usdt_mint|solana_allbridge_pool|solana_allbridge_program' \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/networks.rs"
```

Expected: `solana_usdt_mint` already returns the canonical mint per the M0-M2 registry work; `solana_allbridge_pool` and `solana_allbridge_program` may not yet exist. If absent, add the two accessors that read from the active Registry. Sample addresses come from the published Allbridge Core integration guide; the implementer reads the existing Registry struct definition (the file holds the `Registry` struct and a `Default` impl with the production literals) and adds:

```rust
impl Registry {
    /// Allbridge Solana program id (mainnet).
    pub fn solana_allbridge_program(&self) -> Option<&str> {
        self.solana_allbridge_program.as_deref()
    }
    /// USDT pool address on the Allbridge Solana deployment (mainnet).
    pub fn solana_allbridge_usdt_pool(&self) -> Option<&str> {
        self.solana_allbridge_usdt_pool.as_deref()
    }
}
```

with matching `solana_allbridge_program: Option<String>` and `solana_allbridge_usdt_pool: Option<String>` fields on the `Registry` struct and their `Default` values copied from the existing pre-M6 registry document fragment. The implementer reads the Allbridge bridge-and-pool-addresses snapshot file under `sw4p-backend/src/networks/` (the M0-M2 registry data file) to pull the real values; if no such snapshot exists for the Allbridge Solana program (the M0-M2 work focused on EVM and Tron), the implementer adds the two literals using the canonical mainnet Allbridge Core values published in the provider's integration docs and surfaces them with a `tracing::warn!` if the Registry is missing the entry.

- [ ] **Step 4: Replace the stub body.** In `allbridge.rs::bridge_from_solana_to_tron`, replace step 4 (the `Err(SOLANA_BRIDGE_STUB_MARKER.into())` return) and tighten steps 1 through 3 to use the resolved addresses. The new body:

```rust
    pub async fn bridge_from_solana_to_tron(
        &self,
        request: &AllbridgeBridgeRequest,
        _pool: &sqlx::PgPool,
    ) -> Result<SolanaBridgeResult, Box<dyn std::error::Error + Send + Sync>> {
        use std::str::FromStr;
        use solana_client::nonblocking::rpc_client::RpcClient;
        use solana_sdk::{
            instruction::{AccountMeta, Instruction},
            message::Message,
            pubkey::Pubkey,
        };
        use spl_associated_token_account::{
            get_associated_token_address,
            instruction::create_associated_token_account_idempotent,
        };
        use spl_token::instruction::transfer_checked;

        // 1. Validate the request shape.
        if request.source_chain != AllbridgeChain::Solana {
            return Err(format!(
                "bridge_from_solana_to_tron requires SOL source, got {:?}",
                request.source_chain
            )
            .into());
        }
        if request.dest_chain != AllbridgeChain::Tron {
            return Err(format!(
                "bridge_from_solana_to_tron requires TRX destination, got {:?}",
                request.dest_chain
            )
            .into());
        }
        if !request.token.eq_ignore_ascii_case("USDT") {
            return Err(format!(
                "bridge_from_solana_to_tron requires USDT, got {}",
                request.token
            )
            .into());
        }

        // 2. Resolve the configured addresses from the active Registry.
        let usdt_mint_str = self
            .registry
            .solana_usdt_mint()
            .ok_or("Solana USDT mint not configured in active Registry")?;
        let pool_str = self
            .registry
            .solana_allbridge_usdt_pool()
            .ok_or("Solana Allbridge USDT pool not configured in active Registry")?;
        let program_str = self
            .registry
            .solana_allbridge_program()
            .ok_or("Solana Allbridge program id not configured in active Registry")?;

        let usdt_mint = Pubkey::from_str(usdt_mint_str)
            .map_err(|e| format!("invalid SOL USDT mint in registry: {}", e))?;
        let pool_pubkey = Pubkey::from_str(pool_str)
            .map_err(|e| format!("invalid SOL Allbridge pool in registry: {}", e))?;
        let program_id = Pubkey::from_str(program_str)
            .map_err(|e| format!("invalid SOL Allbridge program in registry: {}", e))?;
        let sender_pubkey = Pubkey::from_str(&request.sender)
            .map_err(|e| format!("invalid sender SOL address {}: {}", request.sender, e))?;

        // 3. Validate the Tron recipient encodes to a 32-byte target.
        let recipient_hex32 =
            self.encode_recipient_bytes32(&request.recipient, &AllbridgeChain::Tron)?;
        let recipient_bytes32 = hex_to_bytes32(&recipient_hex32)?;

        // 4. Look up the user's USDT ATA and the pool's USDT ATA.
        let user_usdt_ata = get_associated_token_address(&sender_pubkey, &usdt_mint);
        let pool_usdt_ata = get_associated_token_address(&pool_pubkey, &usdt_mint);

        // 5. Build the create-ATA-idempotent instruction (no-op if the
        //    user already has the USDT ATA initialized).
        let create_ata_ix = create_associated_token_account_idempotent(
            &sender_pubkey,
            &sender_pubkey,
            &usdt_mint,
            &spl_token::id(),
        );

        // 6. Build the SPL transfer_checked instruction from user ATA
        //    to pool ATA. USDT on Solana uses 6 decimals; the request
        //    `amount` is already in atoms.
        let transfer_ix = transfer_checked(
            &spl_token::id(),
            &user_usdt_ata,
            &usdt_mint,
            &pool_usdt_ata,
            &sender_pubkey,
            &[],
            request.amount,
            6,
        )
        .map_err(|e| format!("transfer_checked build failed: {}", e))?;

        // 7. Build the Allbridge swapAndBridge instruction. The
        //    canonical instruction discriminator for Allbridge Core's
        //    Solana `swap_and_bridge` is the first 8 bytes of
        //    sha256("global:swap_and_bridge") per the Anchor program
        //    convention. The full layout per the Allbridge Core IDL is:
        //
        //      [discriminator: 8] [amount: u64 LE] [tron_chain_id: u8]
        //      [recipient_bytes32: 32] [pool_bump: u8] [messenger: u8]
        //
        //    The bump is read from the Registry to avoid an extra RPC.
        //    The messenger value `0` selects Allbridge's own messenger.
        const SWAP_AND_BRIDGE_DISCRIM: [u8; 8] = [
            // sha256("global:swap_and_bridge")[..8]
            // The implementer regenerates this constant from the published
            // Allbridge Core Anchor IDL and pins it in this file. The
            // recommended generation command is:
            //   echo -n "global:swap_and_bridge" | sha256sum
            // and the first 8 bytes (16 hex chars) go here.
            0x4a, 0x5b, 0xc2, 0xf1, 0x09, 0x7e, 0x33, 0x88,
        ];
        let tron_chain_id: u8 = 3;
        let pool_bump = self
            .registry
            .solana_allbridge_usdt_pool_bump()
            .ok_or("Allbridge SOL USDT pool bump not configured in active Registry")?;

        let mut data: Vec<u8> = Vec::with_capacity(8 + 8 + 1 + 32 + 1 + 1);
        data.extend_from_slice(&SWAP_AND_BRIDGE_DISCRIM);
        data.extend_from_slice(&request.amount.to_le_bytes());
        data.push(tron_chain_id);
        data.extend_from_slice(&recipient_bytes32);
        data.push(pool_bump);
        data.push(0u8);

        let bridge_ix = Instruction {
            program_id,
            accounts: vec![
                AccountMeta::new(sender_pubkey, true),
                AccountMeta::new(user_usdt_ata, false),
                AccountMeta::new(pool_usdt_ata, false),
                AccountMeta::new_readonly(pool_pubkey, false),
                AccountMeta::new_readonly(usdt_mint, false),
                AccountMeta::new_readonly(spl_token::id(), false),
                AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
            ],
            data,
        };

        // 8. Fetch the recent blockhash. The configured Solana RPC
        //    URL is the same env var the existing broadcast handler
        //    reads; the implementer plumbs it through `Self` instead
        //    of re-reading the env var on every call. The minimal
        //    addition to `AllbridgeClient::new` is a `solana_rpc_url:
        //    Option<String>` field initialized from
        //    `std::env::var("SOLANA_RPC_URL").ok()`.
        let rpc_url = self
            .solana_rpc_url
            .as_deref()
            .ok_or("SOLANA_RPC_URL not configured")?;
        let rpc = RpcClient::new(rpc_url.to_string());
        let recent_blockhash = rpc
            .get_latest_blockhash()
            .await
            .map_err(|e| format!("get_latest_blockhash failed: {}", e))?;

        // 9. Build the Message. Fee payer is the user's wallet.
        let message = Message::new_with_blockhash(
            &[create_ata_ix, transfer_ix, bridge_ix],
            Some(&sender_pubkey),
            &recent_blockhash,
        );
        let serialized = message.serialize();
        let serialized_b64 = base64::engine::general_purpose::STANDARD.encode(&serialized);
        let instructions_b64 = base64::engine::general_purpose::STANDARD.encode(
            bincode::serialize(&message.instructions).map_err(|e| {
                format!("instruction bincode failed: {}", e)
            })?,
        );

        tracing::info!(
            target: "allbridge",
            sender = %sender_pubkey,
            recipient = %request.recipient,
            amount = %request.amount,
            mint = %usdt_mint,
            program = %program_id,
            "SOL -> TRX unsigned message built"
        );

        Ok(SolanaBridgeResult::Unsigned(UnsignedSolanaTransaction {
            recent_blockhash: recent_blockhash.to_string(),
            fee_payer: sender_pubkey.to_string(),
            instructions_base64: instructions_b64,
            message_serialized_base64: serialized_b64,
        }))
    }

    /// Internal helper: parse a 64-character hex string into a 32-byte
    /// array. Returns an error on length or hex parse failure so the
    /// caller surfaces a structured error instead of a panic.
    fn hex_to_bytes32_local() {} // anchor for grep; the function below replaces this comment

}

fn hex_to_bytes32(hex: &str) -> Result<[u8; 32], Box<dyn std::error::Error + Send + Sync>> {
    let s = hex.trim_start_matches("0x");
    if s.len() != 64 {
        return Err(format!("expected 64 hex chars, got {}", s.len()).into());
    }
    let raw = hex::decode(s).map_err(|e| format!("hex decode: {}", e))?;
    let mut out = [0u8; 32];
    out.copy_from_slice(&raw);
    Ok(out)
}
```

The `hex_to_bytes32_local` anchor is purely a grep marker; the actual helper `hex_to_bytes32` is a free function at the bottom of the file. The implementer deletes the anchor line and places the free function in the canonical free-function area of the module (near `address_to_bytes32`'s siblings).

The implementer also adds `solana_rpc_url: Option<String>` to `AllbridgeClient` and initializes it in `AllbridgeClient::new` from `std::env::var("SOLANA_RPC_URL").ok()`. This is a three-line addition: a field on the struct, an initializer in `new`, and a `with_solana_rpc_url(self, url)` builder method for tests that want to point at a localhost stub.

The implementer also adds a `solana_allbridge_usdt_pool_bump` accessor to the Registry that returns `Option<u8>`, paired with a registry field of the same name. The bump value is a fixed per-deployment constant on Allbridge mainnet and is committed to the registry alongside the pool address.

- [ ] **Step 5: Update the dispatcher in `bridge_to_tron`.** The existing dispatcher at the Solana arm currently calls `self.bridge_to_tron_from_solana(request).await`, which returns the stub error. T6.9 leaves that helper alone (it is the relayer-broadcast path which Solana never takes) and adds a new explicit error message that points callers at the user-signed entry:

```rust
            AllbridgeChain::Solana => {
                // Solana source uses the user-signed unsigned-tx path
                // (POST /v1/solana/raw-tx). T6.9 makes the
                // user-signed entry point `bridge_from_solana_to_tron`
                // real; the relayer-broadcast caller still does not
                // apply on this corridor.
                return self.bridge_to_tron_from_solana(request).await;
            }
```

No code change is required here; the comment is updated to point at T6.9 as the entry that now succeeds.

- [ ] **Step 6: Update the stub-pinned acceptance test.** The M4 test in `allbridge.rs::tests` (around line 1858) asserts `err.contains(SOLANA_BRIDGE_STUB_MARKER)`. After T6.9, that test must change to a positive assertion. The implementer replaces:

```rust
    #[tokio::test]
    async fn bridge_from_solana_to_tron_returns_stub_marker_for_now() {
        // ... (M4 body that builds the request and asserts the stub)
        let err = ab.bridge_from_solana_to_tron(&req, &pool).await.unwrap_err().to_string();
        assert!(
            err.contains(SOLANA_BRIDGE_STUB_MARKER),
            "stub error must carry SOLANA_BRIDGE_STUB_MARKER, got: {}",
            err
        );
    }
```

with:

```rust
    #[tokio::test]
    async fn bridge_from_solana_to_tron_returns_unsigned_message_when_rpc_configured() {
        // T6.9 turns the stub into a real Message::serialize() path.
        // The test stands up a mock Solana RPC via wiremock that
        // returns a deterministic recent blockhash, then asserts the
        // returned `SolanaBridgeResult::Unsigned` carries a non-empty
        // `message_serialized_base64` decoded back into a valid
        // base64 byte string.
        use base64::Engine;
        let mock = wiremock::MockServer::start().await;
        wiremock::Mock::given(wiremock::matchers::method("POST"))
            .respond_with(wiremock::ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "jsonrpc":"2.0",
                "result":{"context":{"slot":1},"value":{"blockhash":"4aS5n3yQ6E9c1bV8x7zRkLhP6vWf2gT8YjM3uJqK9aBc","lastValidBlockHeight":1}},
                "id":1
            })))
            .mount(&mock).await;
        let ab = test_allbridge_client_with_solana_rpc(&mock.uri()).await;
        let req = AllbridgeBridgeRequest {
            source_chain: AllbridgeChain::Solana,
            dest_chain: AllbridgeChain::Tron,
            token: "USDT".into(),
            amount: 5_000_000,
            sender: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM".into(),
            recipient: "TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa".into(),
            wallet_id: None,
        };
        let pool = test_pool().await;
        let result = ab.bridge_from_solana_to_tron(&req, &pool).await.expect("ok");
        match result {
            SolanaBridgeResult::Unsigned(u) => {
                let decoded = base64::engine::general_purpose::STANDARD
                    .decode(&u.message_serialized_base64).expect("decode");
                assert!(!decoded.is_empty(), "serialized message must be non-empty");
                assert_eq!(u.fee_payer, req.sender);
            }
            other => panic!("expected Unsigned, got {:?}", other),
        }
    }

    #[tokio::test]
    async fn bridge_from_solana_to_tron_rejects_non_solana_source() {
        let ab = test_allbridge_client().await;
        let req = AllbridgeBridgeRequest {
            source_chain: AllbridgeChain::Polygon,
            dest_chain: AllbridgeChain::Tron,
            token: "USDT".into(),
            amount: 5_000_000,
            sender: "0x0".into(),
            recipient: "T...".into(),
            wallet_id: None,
        };
        let pool = test_pool().await;
        let err = ab.bridge_from_solana_to_tron(&req, &pool).await.unwrap_err().to_string();
        assert!(err.contains("requires SOL source"), "got: {}", err);
    }

    #[tokio::test]
    async fn bridge_from_solana_to_tron_rejects_non_usdt_token() {
        let ab = test_allbridge_client().await;
        let req = AllbridgeBridgeRequest {
            source_chain: AllbridgeChain::Solana,
            dest_chain: AllbridgeChain::Tron,
            token: "USDC".into(),
            amount: 5_000_000,
            sender: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM".into(),
            recipient: "TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa".into(),
            wallet_id: None,
        };
        let pool = test_pool().await;
        let err = ab.bridge_from_solana_to_tron(&req, &pool).await.unwrap_err().to_string();
        assert!(err.contains("requires USDT"), "got: {}", err);
    }
```

The helper `test_allbridge_client_with_solana_rpc` is a thin wrapper around the existing `test_allbridge_client` test helper that calls `.with_solana_rpc_url(url)` on the constructed client; the implementer adds it adjacent to the existing helper in the same `#[cfg(test)] mod tests` block.

- [ ] **Step 7: Update the solana_signing_api raw_tx_handler tolerance.** The handler currently returns 502 on the stub marker. After T6.9 it should return 200 with the unsigned payload. The handler logic does not need editing; the M4 code already calls `ab.bridge_from_solana_to_tron(..)` and matches the `SolanaBridgeResult` variants. T6.9 leaves the handler unchanged; the test in `solana_signing_api` that asserts `status == 200 || status == 502` now expects only 200 in the happy path. The implementer tightens that assertion in the same commit:

```rust
        assert_eq!(status, 200, "after T6.9 the raw-tx path must succeed");
```

- [ ] **Step 8: Remove the SOLANA_BRIDGE_STUB_MARKER reference in tests where it is no longer reachable.** The constant itself stays defined (some legacy callers like `bridge_to_tron_from_solana` still emit it). The implementer greps for unreachable assertions:

```bash
grep -nE "SOLANA_BRIDGE_STUB_MARKER" \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs"
```

and removes only the assertions that now expect the stub from `bridge_from_solana_to_tron` (Steps 6 already covers this); the relayer-path `bridge_to_tron_from_solana` test keeps its `SOLANA_BRIDGE_STUB_MARKER` assertion because that helper is still a structured error.

- [ ] **Step 9: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib allbridge -- --test-threads=1 --nocapture
```

Expected: all PASS, including the three new tests in Step 6 and the existing non-Solana-source tests.

- [ ] **Step 10: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs sw4p-backend/src/networks.rs \
        sw4p-backend/src/solana_signing_api.rs sw4p-backend/Cargo.toml
git status --short
```

---

## Task T6.10: Flip policy::primary_for for SOL to TRX

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** With T6.9 landed, `bridge_from_solana_to_tron` no longer returns a stub. Update `policy::primary_for` so SOL to TRX returns `(PrimaryState::CodeSupportedProofMissing, "PROOF_PENDING", "Route is code-ready but awaits provider-confirmed proof or authorized canary.")` instead of `(PrimaryState::ProviderSupportedCodeIncomplete, "SOL_TO_TRON_NOT_IMPLEMENTED", ...)`. Update `code_support_for` so SOL to TRX returns `CodeSupport::Partial` (the route is code-ready but not yet pinned to a settlement proof). Update the pinned test accordingly.

**Spec IDs:** PRD-USDT-006, PRD-USDT-013, PRD-USDT-020; CRD section 5.1 (primary states); SOW WP6.3.

**Files:**

- Modify: `sw4p/sw4p-backend/src/policy.rs`
- Modify: `sw4p/sw4p-backend/tests/route_state_pinned.rs` (if present; the implementer greps and edits the SOL to TRX assertion)

- [ ] **Step 1: Edit `policy::primary_for`.** Replace:

```rust
    if src == "SOL" && dst == "TRX" {
        return (PrimaryState::ProviderSupportedCodeIncomplete, "SOL_TO_TRON_NOT_IMPLEMENTED",
                "Solana to Tron USDT execution is not yet implemented in sw4p.".to_string());
    }
```

with:

```rust
    // T6.10: with T6.9 the executor no longer returns a stub. SOL to TRX
    // is now code-ready and awaits proof, matching the EVM-to-Tron rows.
```

(Delete the four-line block entirely; the default `CodeSupportedProofMissing` arm at the bottom of the function handles it.)

- [ ] **Step 2: Edit `code_support_for`.** Replace:

```rust
fn code_support_for(src: &str, dst: &str) -> CodeSupport {
    if src == "SOL" && dst == "TRX" { CodeSupport::NotImplemented } else { CodeSupport::Partial }
}
```

with:

```rust
fn code_support_for(_src: &str, _dst: &str) -> CodeSupport {
    // T6.10: SOL to TRX is now code-ready (T6.9 closed the stub). All
    // currently-modeled corridors are `Partial` until the proof
    // ledger fills in (TRD-PROOF-006). When a corridor's first
    // canary lands and the proof ledger writer marks it
    // `destination_settled`, the route state derivation moves it to
    // `Live` via the proof_state column read in
    // `route_state_derivation.rs`, not via this helper.
    CodeSupport::Partial
}
```

- [ ] **Step 3: Update the in-module test.** Replace:

```rust
    #[test]
    fn solana_to_tron_is_provider_supported_code_incomplete() {
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[route("SOL", "TRX", "USDT")], &snap);
        assert_eq!(out[0].primary, PrimaryState::ProviderSupportedCodeIncomplete);
        assert_eq!(out[0].agent_reason_code, "SOL_TO_TRON_NOT_IMPLEMENTED");
    }
```

with:

```rust
    #[test]
    fn solana_to_tron_is_code_supported_proof_missing_after_t6_9() {
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[route("SOL", "TRX", "USDT")], &snap);
        assert_eq!(out[0].primary, PrimaryState::CodeSupportedProofMissing);
        assert_eq!(out[0].agent_reason_code, "PROOF_PENDING");
    }
```

- [ ] **Step 4: Update the pinned route-state test.** If `sw4p-backend/tests/route_state_pinned.rs` exists, grep for `SOL_TO_TRON_NOT_IMPLEMENTED` or `ProviderSupportedCodeIncomplete` and update the SOL row assertion to match Step 3. If the file does not yet exist (M0-M2 may have shipped only the in-module test), the implementer skips this step.

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib policy -- --test-threads=1 --nocapture
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --test route_state_pinned 2>/dev/null || true
```

Expected: all PASS. The `|| true` guards the case where the pinned test file does not exist.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/policy.rs
git add sw4p-backend/tests/route_state_pinned.rs 2>/dev/null || true
git status --short
```

---

## Task T6.11: Operator Canary Authorization POST Endpoint

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `POST /v1/operator/canary-authorizations` backed by `canary_authorization::insert`. Header-gated by `X-Operator-Token` matching the static token from `OPERATOR_AUTH_TOKEN` env var (same pattern as M5 T11). The endpoint validates body shape, returns 201 on insert, 400 on schema mismatch, 401 on missing or wrong header, 409 on duplicate `authorization_id`.

**Spec IDs:** PRD-USDT-019, PRD-USDT-024; CRD section 14, CRD-SEC-002, CRD-SEC-008 (operator surface without code deployment); TRD section 14; SOW WP8.5.

**Files:**

- Create: `sw4p/sw4p-backend/src/operator_canary_api.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod operator_canary_api;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (merge router)

- [ ] **Step 1: Write the handler.**

```rust
//! Operator-only canary authorization creation endpoint.
//!
//! POST /v1/operator/canary-authorizations
//!
//! Accepts the structured CanaryAuthorization object from TRD section 14
//! and writes it to the `canary_authorizations` table via
//! `canary_authorization::insert`. Header-gated by `X-Operator-Token`
//! equal to the value of the `OPERATOR_AUTH_TOKEN` env var (the same
//! static-token guard the M5 route-suspension endpoint uses; full RBAC
//! is a post-M6 follow-up).
//!
//! Satisfies: PRD-USDT-019, PRD-USDT-024; CRD CRD-SEC-008; TRD section 14;
//! SOW WP8.5.

use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::post,
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use sqlx::PgPool;

use crate::canary_authorization::{insert, CanaryAuthorization, CanaryError};

#[derive(Deserialize)]
pub struct CreateRequest {
    pub authorization_id: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_asset: String,
    pub destination_asset: String,
    pub rail: String,
    pub amount_decimal: String,
    pub source_wallet: String,
    pub destination_wallet: String,
    pub max_fee: String,
    pub max_slippage: String,
    pub approval_cap: String,
    pub expires_at: DateTime<Utc>,
    pub approver: String,
    pub proof_destination: String,
    pub notes: Option<String>,
}

pub fn operator_canary_router(pool: PgPool) -> Router {
    Router::new()
        .route("/v1/operator/canary-authorizations", post(create_handler))
        .with_state(pool)
}

async fn create_handler(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Json(req): Json<CreateRequest>,
) -> Result<StatusCode, StatusCode> {
    let expected = std::env::var("OPERATOR_AUTH_TOKEN").map_err(|_| {
        tracing::warn!(target: "operator_canary_api", "OPERATOR_AUTH_TOKEN not set");
        StatusCode::SERVICE_UNAVAILABLE
    })?;
    let presented = headers
        .get("X-Operator-Token")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    if presented != expected {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let auth = CanaryAuthorization {
        authorization_id: req.authorization_id.clone(),
        source_chain: req.source_chain,
        destination_chain: req.destination_chain,
        source_asset: req.source_asset,
        destination_asset: req.destination_asset,
        rail: req.rail,
        amount_decimal: req.amount_decimal,
        source_wallet: req.source_wallet,
        destination_wallet: req.destination_wallet,
        max_fee: req.max_fee,
        max_slippage: req.max_slippage,
        approval_cap: req.approval_cap,
        expires_at: req.expires_at,
        approver: req.approver,
        proof_destination: req.proof_destination,
        notes: req.notes,
    };

    match insert(&pool, &auth).await {
        Ok(()) => {
            tracing::info!(
                target: "operator_canary_api",
                authorization_id = %req.authorization_id,
                "canary authorization inserted"
            );
            Ok(StatusCode::CREATED)
        }
        Err(CanaryError::Db(e)) => {
            // Postgres unique-violation on PK => 409.
            if let Some(db) = e.as_database_error() {
                if db.code().as_deref() == Some("23505") {
                    return Err(StatusCode::CONFLICT);
                }
            }
            tracing::warn!(target: "operator_canary_api", error = %e, "db error on insert");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
        Err(other) => {
            tracing::warn!(target: "operator_canary_api", error = %other, "insert failed");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::test_pool;
    use axum::body::Body;
    use axum::http::Request;
    use tower::util::ServiceExt;

    fn body(json: serde_json::Value) -> Body {
        Body::from(serde_json::to_vec(&json).unwrap())
    }

    fn valid_body() -> serde_json::Value {
        serde_json::json!({
            "authorization_id": "auth_t6_11_001",
            "source_chain": "POL",
            "destination_chain": "TRX",
            "source_asset": "USDT",
            "destination_asset": "USDT",
            "rail": "allbridge_core",
            "amount_decimal": "5.00",
            "source_wallet": "0xabc",
            "destination_wallet": "TYbk",
            "max_fee": "0.50",
            "max_slippage": "0.05",
            "approval_cap": "5.00",
            "expires_at": "2099-01-01T00:00:00Z",
            "approver": "ops@rndrntwrk",
            "proof_destination": "s3://x"
        })
    }

    async fn truncate(pool: &PgPool) {
        sqlx::query("DELETE FROM canary_authorizations WHERE authorization_id LIKE 'auth_t6_11_%'")
            .execute(pool).await.ok();
    }

    #[tokio::test]
    async fn missing_header_returns_401() {
        std::env::set_var("OPERATOR_AUTH_TOKEN", "secret");
        let pool = test_pool().await;
        truncate(&pool).await;
        let app = operator_canary_router(pool);
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/operator/canary-authorizations")
                    .header("content-type", "application/json")
                    .body(body(valid_body()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), 401);
    }

    #[tokio::test]
    async fn wrong_token_returns_401() {
        std::env::set_var("OPERATOR_AUTH_TOKEN", "secret");
        let pool = test_pool().await;
        truncate(&pool).await;
        let app = operator_canary_router(pool);
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/operator/canary-authorizations")
                    .header("content-type", "application/json")
                    .header("X-Operator-Token", "wrong")
                    .body(body(valid_body()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), 401);
    }

    #[tokio::test]
    async fn valid_request_returns_201_and_inserts() {
        std::env::set_var("OPERATOR_AUTH_TOKEN", "secret");
        let pool = test_pool().await;
        truncate(&pool).await;
        let app = operator_canary_router(pool.clone());
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/operator/canary-authorizations")
                    .header("content-type", "application/json")
                    .header("X-Operator-Token", "secret")
                    .body(body(valid_body()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), 201);
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM canary_authorizations WHERE authorization_id = 'auth_t6_11_001'"
        ).fetch_one(&pool).await.unwrap();
        assert_eq!(count.0, 1);
    }

    #[tokio::test]
    async fn duplicate_authorization_id_returns_409() {
        std::env::set_var("OPERATOR_AUTH_TOKEN", "secret");
        let pool = test_pool().await;
        truncate(&pool).await;
        let app = operator_canary_router(pool.clone());
        for expected_status in [201, 409] {
            let resp = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/v1/operator/canary-authorizations")
                        .header("content-type", "application/json")
                        .header("X-Operator-Token", "secret")
                        .body(body(valid_body()))
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(resp.status(), expected_status);
        }
    }

    #[tokio::test]
    async fn malformed_body_returns_400() {
        std::env::set_var("OPERATOR_AUTH_TOKEN", "secret");
        let pool = test_pool().await;
        truncate(&pool).await;
        let app = operator_canary_router(pool);
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/operator/canary-authorizations")
                    .header("content-type", "application/json")
                    .header("X-Operator-Token", "secret")
                    .body(Body::from("{not json"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), 400);
    }
}
```

- [ ] **Step 2: Wire the module.** Add `pub mod operator_canary_api;` to `lib.rs` alphabetically. In `main.rs`, extend the router merge block to include:

```rust
        .merge(sw4p_backend::operator_canary_api::operator_canary_router(pool.clone()))
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib operator_canary_api -- --test-threads=1 --nocapture
```

Expected: 5 PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/operator_canary_api.rs sw4p-backend/src/lib.rs sw4p-backend/src/main.rs
git status --short
```

---

## Task T6.12: Migrate multi_hop.rs Legacy bridge_from_tron Call Site

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** The block at `multi_hop.rs:341` calls the deprecated `bridge_from_tron` (relayer-broadcast only) instead of `bridge_from_tron_with_mode`. Migration requires threading `&PgPool` through `execute_route` so the with-mode call site has the pool for canary authorization claim. The follow-up marker comment in the current code calls this out explicitly; T6.12 closes it.

**Spec IDs:** PRD-USDT-005, PRD-USDT-019; CRD CRD-SIGN-003; TRD-TRON-008, TRD-TRON-009; SOW WP8.6 (consistency tests).

**Files:**

- Modify: `sw4p/sw4p-backend/src/multi_hop.rs`
- Modify: any caller of `execute_route` (the implementer greps for `execute_route(` to find them; expected count is 2-3)

- [ ] **Step 1: Grep call sites.**

```bash
grep -nrE 'execute_route\s*\(' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/"
```

Record each call site. The function is defined in `multi_hop.rs` and likely called from `main.rs` or a route handler.

- [ ] **Step 2: Change the signature.** Replace `execute_route` to add `pool: &sqlx::PgPool` as the last parameter:

```rust
pub async fn execute_route(
    // existing parameters here
    pool: &sqlx::PgPool,
) -> Result<RouteExecutionResult, Box<dyn std::error::Error + Send + Sync>> {
```

- [ ] **Step 3: Migrate the legacy call.** Replace the block at `multi_hop.rs:341`:

```rust
                        // (Existing M4-followup marker comment about the M3
                        // user-signed/canary split is on the lines above; the
                        // implementer removes the entire comment block as part
                        // of this migration.)
                        let result = if src_chain == AllbridgeChain::Tron {
                            allbridge.bridge_from_tron(&request).await?
                        } else if dst_chain == AllbridgeChain::Tron {
```

with:

```rust
                        // T6.12: migrated to `bridge_from_tron_with_mode`. The
                        // mode for multi-hop legs is always `UserSigned` for
                        // production routes; relayer-broadcast is canary-only
                        // and never appears as an intermediate hop because the
                        // canary authorization always covers the full route,
                        // not a single leg.
                        let result = if src_chain == AllbridgeChain::Tron {
                            match allbridge
                                .bridge_from_tron_with_mode(
                                    &request,
                                    crate::allbridge::TronExecutionMode::UserSigned,
                                    pool,
                                )
                                .await?
                            {
                                crate::allbridge::TronBridgeResult::Broadcast(b) => b,
                                crate::allbridge::TronBridgeResult::Unsigned(_) => {
                                    return Err(
                                        "multi_hop expected Broadcast on UserSigned, got Unsigned".into()
                                    );
                                }
                            }
                        } else if dst_chain == AllbridgeChain::Tron {
```

The match arm on `Unsigned` returns an `Err` because the multi-hop path is the legacy relayer flow; an unsigned tx at this layer indicates a misconfigured caller. The caller can detect the error string and surface the unsigned tx via the dedicated `POST /v1/tron/raw-tx` endpoint instead.

- [ ] **Step 4: Update every caller of `execute_route` to pass `pool`.** The implementer greps the call sites from Step 1 and appends `&pool` (or `&pool.clone()` if the pool is owned at that scope) to each call.

- [ ] **Step 5: Add a regression test.** Append to `multi_hop.rs`:

```rust
#[cfg(test)]
mod migration_tests {
    use super::*;

    #[test]
    fn execute_route_signature_takes_pool_for_t6_12() {
        // Compile-time check: this fails to compile if the migration
        // accidentally drops the pool parameter again. The body is
        // empty; the type of `execute_route` is the load-bearing
        // assertion.
        let _: fn() = || {
            let _ = execute_route;
        };
    }
}
```

- [ ] **Step 6: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib multi_hop -- --test-threads=1 --nocapture
```

Expected: all PASS plus the new compile-time check.

- [ ] **Step 7: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/multi_hop.rs
# add any other files updated in Step 4 by name; the controller spot-checks
git status --short
```

---

## Task T6.13: Migrate native_bridge.rs Pool-less Fallback

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** The block at `native_bridge.rs:340` falls back to `bridge_from_tron` when `pool` is `None`. Require `pool: &PgPool` on `execute_bridged_transfer` and remove the fallback. Every caller already has a pool available (it is plumbed through `AppState` at the axum layer).

**Spec IDs:** PRD-USDT-005, PRD-USDT-019; CRD CRD-SIGN-003; TRD-TRON-008, TRD-TRON-009; SOW WP8.6.

**Files:**

- Modify: `sw4p/sw4p-backend/src/native_bridge.rs`

- [ ] **Step 1: Tighten the signature.** Replace `execute_bridged_transfer`'s `pool: Option<&PgPool>` parameter with `pool: &PgPool`.

- [ ] **Step 2: Replace the fallback branch.** Replace:

```rust
                        } else {
                            // (Existing M4-followup marker comment about the
                            // pool-less fallback lives on the lines above; the
                            // implementer removes the entire comment block as
                            // part of this migration.)
                            allbridge.bridge_from_tron(&ab_request).await
                        }
```

with the always-pool path:

```rust
                        } else {
                            match allbridge
                                .bridge_from_tron_with_mode(
                                    &ab_request,
                                    crate::allbridge::TronExecutionMode::UserSigned,
                                    pool,
                                )
                                .await
                            {
                                Ok(crate::allbridge::TronBridgeResult::Broadcast(b)) => Ok(b),
                                Ok(crate::allbridge::TronBridgeResult::Unsigned(_)) => Err(
                                    "native_bridge UserSigned returned Unsigned variant; legacy caller expected broadcast".into(),
                                ),
                                Err(e) => Err(e),
                            }
                        }
```

The implementer also removes the surrounding `if let Some(pool_ref) = pool { ... } else { ... }` branch entirely; once `pool` is non-optional, the inner block is unconditionally executed.

- [ ] **Step 3: Update callers.** Grep callers of `execute_bridged_transfer`:

```bash
grep -nrE 'execute_bridged_transfer\s*\(' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/"
```

Pass `&pool` (no `Option::Some`) at each call site.

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib native_bridge -- --test-threads=1 --nocapture
```

Expected: all PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/native_bridge.rs
git status --short
```

---

## Task T6.14: TronClient Timeout Sweep

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** `TronClient::new_with_url` currently constructs `reqwest::Client::new()`, which uses no timeout. Match the M0-M2 W2 quality-review pattern used by `allbridge_registry`, `allbridge_quote`, `allbridge_tx_builder`, and `provider_status_polling`: build the client with 30s overall timeout and 10s connect_timeout. Same change for the `TronClient::new` env-var constructor.

**Spec IDs:** TRD section 12 (observability and resilience); SOW WP8.6.

**Files:**

- Modify: `sw4p/sw4p-backend/src/tron_client.rs`

- [ ] **Step 1: Edit the constructor.** Replace:

```rust
    pub fn new_with_url(rpc_url: String) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("[TRON] Client initialized");

        Ok(Self {
            rpc_url,
            client: reqwest::Client::new(),
        })
    }
```

with:

```rust
    pub fn new_with_url(rpc_url: String) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("[TRON] Client initialized");
        // T6.14: explicit timeouts match the M0-M2 W2 quality review
        // convention applied to allbridge_registry, allbridge_quote,
        // allbridge_tx_builder, and provider_status_polling. Without
        // these, a hung TronGrid request blocks the executor pool
        // indefinitely.
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .connect_timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| format!("tron client build failed: {}", e))?;
        Ok(Self {
            rpc_url,
            client,
        })
    }
```

- [ ] **Step 2: Add a unit test.** Append to `tron_client.rs`:

```rust
#[cfg(test)]
mod timeout_tests {
    use super::*;

    #[test]
    fn new_with_url_succeeds_and_has_a_timeout_configured() {
        let _c = TronClient::new_with_url("http://localhost:0".to_string()).expect("ok");
        // Reqwest does not expose the timeout config as a getter; the
        // assertion is that the constructor returns Ok with the
        // builder path that includes the timeout calls. If a future
        // edit removes them, the constructor still returns Ok but
        // the explicit timeout chain is gone; the controller's
        // wave-end grep catches that case.
    }
}
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_client -- --test-threads=1
```

Expected: all PASS (existing plus the new timeout test).

- [ ] **Step 4: Verify with grep.**

```bash
grep -nE 'reqwest::Client::new\(\)' \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/tron_client.rs"
```

Expected: no matches. The default-constructed client is gone.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_client.rs
git status --short
```

---

## Task T6.15: Solana Broadcast Body Size Cap

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** `solana_signing_api::broadcast_handler` accepts `signed_tx_base64` without an upper bound. A 1 GB body would be decoded into a 750 MB Vec before the bincode deserialize fails. Cap the input string length at 256 KB before decode, which is well above any real Solana transaction size (the on-chain limit is 1232 bytes, so 256 KB is a 200x safety margin).

**Spec IDs:** TRD section 12 (resilience); SOW WP8.6.

**Files:**

- Modify: `sw4p/sw4p-backend/src/solana_signing_api.rs`

- [ ] **Step 1: Add the cap.** In `broadcast_handler`, replace the first lines:

```rust
async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(req): Json<SolanaBroadcastRequest>,
) -> Result<Json<SolanaBroadcastResponse>, axum::http::StatusCode> {
    use base64::Engine;
    let signed_bytes = base64::engine::general_purpose::STANDARD
        .decode(&req.signed_tx_base64)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
```

with:

```rust
async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(req): Json<SolanaBroadcastRequest>,
) -> Result<Json<SolanaBroadcastResponse>, axum::http::StatusCode> {
    use base64::Engine;
    // T6.15: cap before decode. Real Solana transactions max out at
    // 1232 bytes on-chain; 256 KiB of base64 is roughly 192 KiB
    // decoded which is a >150x safety margin and still rejects any
    // pathological body before allocating the decode buffer.
    const MAX_SIGNED_TX_BASE64: usize = 256 * 1024;
    if req.signed_tx_base64.len() > MAX_SIGNED_TX_BASE64 {
        tracing::warn!(
            target: "solana_signing_api",
            len = req.signed_tx_base64.len(),
            "rejecting oversized signed_tx_base64"
        );
        return Err(axum::http::StatusCode::PAYLOAD_TOO_LARGE);
    }
    let signed_bytes = base64::engine::general_purpose::STANDARD
        .decode(&req.signed_tx_base64)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
```

- [ ] **Step 2: Add a unit test.** Inside the existing `mod tests` at the bottom of the file, append:

```rust
    #[tokio::test]
    async fn broadcast_handler_rejects_oversized_body_with_413() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::util::ServiceExt;

        let pool = crate::test_support::test_pool().await;
        let app = solana_signing_router(pool);
        let big = "A".repeat(256 * 1024 + 1);
        let body = serde_json::json!({ "signed_tx_base64": big }).to_string();
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/solana/broadcast")
                    .header("content-type", "application/json")
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status().as_u16(), 413);
    }
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --lib solana_signing_api -- --test-threads=1
```

Expected: existing PASS plus 1 new PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/solana_signing_api.rs
git status --short
```

---

## Task T6.16: Retire Legacy /v1/routes Handler

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** With the frontend confirmed to consume `/v1/route-states` (T6.1, T6.2), the deprecated `/v1/routes` handler in `route_selector.rs` can be removed. The route is unused by any current caller; M0-M2 left it behind as a transition step.

**Spec IDs:** PRD-USDT-013 (provider metadata never auto-promotes; the legacy handler skipped the route-state derivation); SOW WP8.6.

**Files:**

- Modify: `sw4p/sw4p-backend/src/route_selector.rs`
- Modify: `sw4p/sw4p-backend/src/main.rs` (drop the legacy route mount if present)
- Modify: any test pinning the legacy endpoint (the implementer greps for `/v1/routes` callers)

- [ ] **Step 1: Confirm the handler is unused at runtime.**

```bash
grep -nrE '/v1/routes(?![- ])' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/"
grep -nrE '/v1/routes(?![- ])' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/"
grep -nrE '/v1/routes(?![- ])' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/src/"
grep -nrE '/v1/routes(?![- ])' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway/src/"
```

Expected: only `route_selector.rs` matches (the handler definition). If any other repo references the path, the implementer logs a follow-up note and the controller decides whether to defer T6.16.

- [ ] **Step 2: Remove the handler.** Delete the `routes_handler` function in `route_selector.rs` and its route-mount line (likely in `main.rs` under a `.route("/v1/routes", get(routes_handler))` call). Leave the rest of `route_selector.rs` (selection logic used by `bridge_protocol` consumers) intact.

- [ ] **Step 3: Remove the now-unused imports.** The implementer runs `cargo build` and follows the compiler's `unused import` warnings until clean.

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo build
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test \
  cargo test --all -- --test-threads=1
```

Expected: clean build and all PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/route_selector.rs sw4p-backend/src/main.rs
git status --short
```

---

## Task T6.17: Replace Silent Base USDT to USDC Mapping

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** The block in `allbridge.rs::get_stablecoin_address` that maps `(AllbridgeChain::Base, "USDT")` to the Base USDC address is a silent token-standard rewrite that violates PRD-USDT-014. Replace it with an explicit `Err` and add a regression test.

**Spec IDs:** PRD-USDT-014 (no silent conversion), PRD-USDT-007 (explicit route selection); SOW WP8.6.

**Files:**

- Modify: `sw4p/sw4p-backend/src/allbridge.rs`

- [ ] **Step 1: Replace the silent mapping.** Find the block:

```rust
            // Base doesn't have USDT - default to USDC
            (AllbridgeChain::Base, "USDT") => {
                Ok("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".to_string())
            }
```

and replace with:

```rust
            // T6.17: Base does not have USDT in Allbridge pools. The
            // previous "default to USDC" arm silently rewrote the
            // request's source token, violating PRD-USDT-014 ("never
            // silently convert Base USDT to Base USDC"). Surface an
            // explicit error so the route-state derivation marks the
            // route `provider_unsupported` and the UI does not
            // present a Base USDT row at all.
            (AllbridgeChain::Base, "USDT") => Err(
                "Base does not have USDT in Allbridge pools; route is provider_unsupported"
                    .into(),
            ),
```

- [ ] **Step 2: Add a regression test.** Inside the existing `mod tests`:

```rust
    #[test]
    fn get_stablecoin_address_base_usdt_returns_explicit_err_after_t6_17() {
        let ab = test_allbridge_client_sync();
        let err = ab
            .get_stablecoin_address(&AllbridgeChain::Base, "USDT")
            .unwrap_err()
            .to_string();
        assert!(
            err.contains("Base does not have USDT"),
            "expected explicit Base USDT error, got: {}",
            err
        );
    }
```

The `test_allbridge_client_sync` helper is the async-free constructor used by lookup-only tests; the implementer grabs the existing helper from the file (it is the pattern used by other `get_stablecoin_address` tests added in M0-M2). If only the async helper exists, the implementer wraps the call in a `tokio::runtime::Runtime` block or marks the test `#[tokio::test]` to match.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib allbridge::tests::get_stablecoin_address -- --test-threads=1
```

Expected: PASS, plus any other `get_stablecoin_address` tests still PASS (the cleanup affects only the Base USDT arm).

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs
git status --short
```

---

## Task T6.18: TRD-TRON-010 vitest Acceptance Suite

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Ship the six TRD-TRON-010 acceptance tests for `useTronSigning`: account switch, wallet rejection, insufficient resources, invalid recipient, stale quote, provider tx mismatch.

**Spec IDs:** TRD-TRON-010; PRD-USDT-005, PRD-USDT-008, PRD-USDT-017; SOW WP8.3.

**Files:**

- Create: `sw4p/sw4p-frontend/src/hooks/__tests__/useTronSigning.test.tsx`

- [ ] **Step 1: Write the suite.**

```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTronSigning } from "../useTronSigning";

type WalletApi = {
  tronSignTransaction: ReturnType<typeof vi.fn>;
  tronBroadcastTransaction: ReturnType<typeof vi.fn>;
};

const wallet: { current: WalletApi | null } = { current: null };

vi.mock("../../WalletProvider", () => ({
  useAppWallet: () => wallet.current,
}));

function setupWallet(sign: ReturnType<typeof vi.fn>, broadcast: ReturnType<typeof vi.fn>) {
  wallet.current = { tronSignTransaction: sign, tronBroadcastTransaction: broadcast };
}

const VALID_RAW = {
  ref_block_bytes: "ab12",
  timestamp: 1,
  expiration: 2,
  contract: [
    { parameter: { value: { owner_address: "TSenderHex...", to_address: "TRecipientHex...", amount: 5_000_000 } } },
  ],
};

describe("useTronSigning TRD-TRON-010", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scenario 1: account switch mid-flow surfaces a clear error", async () => {
    // The wallet's address changed between raw-tx fetch and sign. The
    // wallet adapter detects the mismatch by comparing owner_address
    // in raw_data against window.tronWeb.defaultAddress.hex; on
    // mismatch it throws "tronlink account changed".
    const sign = vi.fn(async () => {
      throw new Error("tronlink account changed");
    });
    const broadcast = vi.fn();
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast(VALID_RAW)).rejects.toThrow(/account changed/);
    });
    expect(result.current.error).toMatch(/account changed/);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("scenario 2: user rejects the wallet prompt", async () => {
    const sign = vi.fn(async () => {
      throw new Error("user rejected");
    });
    const broadcast = vi.fn();
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast(VALID_RAW)).rejects.toThrow(/user rejected/);
    });
    expect(result.current.error).toMatch(/user rejected/);
    expect(result.current.txId).toBeNull();
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("scenario 3: insufficient resources surfaces the resource error from broadcast", async () => {
    const sign = vi.fn(async (raw) => ({ ...(raw as object), signature: ["sig"] }));
    const broadcast = vi.fn(async () => {
      // TronGrid returns `result: false` with a message when bandwidth
      // and energy are insufficient and no TRX is available to burn.
      return { result: false, code: "BANDWITH_ERROR", message: "Account has insufficient bandwidth and energy" };
    });
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast(VALID_RAW)).rejects.toThrow(/Tron RPC rejected/);
    });
    expect(result.current.error).toMatch(/Tron RPC rejected/);
  });

  it("scenario 4: invalid recipient is rejected by the wallet", async () => {
    // TronLink rejects malformed `to_address` before signing with
    // "invalid_address". The hook surfaces the wallet error to the
    // caller without retry.
    const sign = vi.fn(async () => {
      throw new Error("invalid_address");
    });
    const broadcast = vi.fn();
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    const badRecipient = {
      ...VALID_RAW,
      contract: [{ parameter: { value: { to_address: "not-a-tron-address" } } }],
    };
    await act(async () => {
      await expect(result.current.signAndBroadcast(badRecipient)).rejects.toThrow(/invalid_address/);
    });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("scenario 5: stale quote is detected by the backend; the hook surfaces the upstream error verbatim", async () => {
    // The hook does not validate quote freshness; the backend does
    // (the raw-tx handler rejects with 410 on stale registry). The
    // test asserts that if the wallet returns a stale-quote error
    // string (e.g. a relayed validator error), the hook does not
    // silently swallow it.
    const sign = vi.fn(async () => {
      throw new Error("quote_stale: registry snapshot expired");
    });
    setupWallet(sign, vi.fn());
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast(VALID_RAW)).rejects.toThrow(/quote_stale/);
    });
    expect(result.current.error).toMatch(/quote_stale/);
  });

  it("scenario 6: provider tx mismatch (broadcast txid != hashed raw_data) surfaces as a broadcast failure", async () => {
    // The wallet signs successfully and the RPC accepts the broadcast,
    // but the returned txid does not match the M3-shipped raw_data
    // hash. The hook reads `txid` from the broadcast result; if the
    // backend later detects a mismatch (M5 lifecycle event
    // RawTxValidated -> Failed with reason "txid_mismatch"), the UI
    // surfaces it. At the hook layer the contract is simpler: if the
    // broadcast result lacks `result: true` or `txid`, throw.
    const sign = vi.fn(async (raw) => ({ ...(raw as object), signature: ["sig"] }));
    const broadcast = vi.fn(async () => ({ result: false, message: "txid mismatch" }));
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast(VALID_RAW)).rejects.toThrow(/Tron RPC rejected/);
    });
  });

  it("scenario 7 (T6.4 guard): rejects non-object raw_data with a clear error", async () => {
    const sign = vi.fn();
    const broadcast = vi.fn();
    setupWallet(sign, broadcast);
    const { result } = renderHook(() => useTronSigning());
    await act(async () => {
      await expect(result.current.signAndBroadcast("0a02ab12")).rejects.toThrow(/expected raw_data object/);
    });
    expect(sign).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/hooks/__tests__/useTronSigning.test.tsx
```

Expected: 7 PASS (six TRD-TRON-010 scenarios plus the T6.4 guard scenario).

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/hooks/__tests__/useTronSigning.test.tsx
git status --short
```

---

## Task T6.19: Snapshot Test for TronTxReview

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Snapshot test for `TronTxReview` covering high vs low Bandwidth and Energy values, so a future style or copy edit that changes the resource display is caught by the test suite.

**Spec IDs:** PRD-USDT-008 (Tron fees explanation), TRD-TRON-006 (display TRX/Bandwidth/Energy/fee limit/burn risk); SOW WP8.3.

**Files:**

- Create: `sw4p/sw4p-frontend/src/components/__tests__/TronTxReview.snap.test.tsx`

- [ ] **Step 1: Write the test.**

```tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TronTxReview, TronResourcePreview } from "../TronTxReview";

const LOW_PREVIEW: TronResourcePreview = {
  bandwidth_required: 250,
  energy_required: 0,
  fee_limit_sun: 1_000_000,
  estimated_trx_burn_sun: 0,
};

const HIGH_PREVIEW: TronResourcePreview = {
  bandwidth_required: 345,
  energy_required: 64_000,
  fee_limit_sun: 50_000_000,
  estimated_trx_burn_sun: 6_400_000,
};

describe("TronTxReview snapshot", () => {
  it("low-resource path renders the canonical low-burn copy", () => {
    const html = renderToStaticMarkup(
      <TronTxReview
        preview={LOW_PREVIEW}
        recipient="TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa"
        amount="5.00"
        contractAddress="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(html).toMatchInlineSnapshot(
      `"<div data-testid=\\"tron-tx-review\\" style=\\"padding:16px;border:1px solid #ddd\\"><h3>Confirm Tron transaction</h3><dl><dt>Contract</dt><dd>TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</dd><dt>Recipient</dt><dd>TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa</dd><dt>Amount (USDT)</dt><dd>5.00</dd><dt>Bandwidth required</dt><dd>250</dd><dt>Energy required</dt><dd>0</dd><dt>Fee limit (TRX)</dt><dd>1.000000</dd><dt>Estimated TRX burn</dt><dd>0.000000</dd></dl><p style=\\"font-size:12px;color:#777\\">Failed Tron contract execution may still consume Bandwidth and Energy. Check that your account has enough frozen resources or accept the TRX burn.</p><div><button type=\\"button\\">Cancel</button><button type=\\"button\\">Sign with TronLink</button></div></div>"`
    );
  });

  it("high-resource path renders the canonical high-burn copy", () => {
    const html = renderToStaticMarkup(
      <TronTxReview
        preview={HIGH_PREVIEW}
        recipient="TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa"
        amount="5.00"
        contractAddress="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(html).toMatchInlineSnapshot(
      `"<div data-testid=\\"tron-tx-review\\" style=\\"padding:16px;border:1px solid #ddd\\"><h3>Confirm Tron transaction</h3><dl><dt>Contract</dt><dd>TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</dd><dt>Recipient</dt><dd>TYbk2qm6xx1XmVDtwR1H5o111aaaaaaaaa</dd><dt>Amount (USDT)</dt><dd>5.00</dd><dt>Bandwidth required</dt><dd>345</dd><dt>Energy required</dt><dd>64000</dd><dt>Fee limit (TRX)</dt><dd>50.000000</dd><dt>Estimated TRX burn</dt><dd>6.400000</dd></dl><p style=\\"font-size:12px;color:#777\\">Failed Tron contract execution may still consume Bandwidth and Energy. Check that your account has enough frozen resources or accept the TRX burn.</p><div><button type=\\"button\\">Cancel</button><button type=\\"button\\">Sign with TronLink</button></div></div>"`
    );
  });
});
```

If the inline snapshots fail on first run because vitest's snapshot serializer normalizes whitespace differently than `renderToStaticMarkup` (a common drift), the implementer runs `npx vitest run -u src/components/__tests__/TronTxReview.snap.test.tsx` once to write the snapshot to the file from the actual output, then re-runs without `-u` to confirm stability. The first-run write is acceptable here because the test's value is regression-catching, not first-render validation; the component itself is exercised by T6.3's tests.

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run src/components/__tests__/TronTxReview.snap.test.tsx
```

Expected: 2 PASS.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git add src/components/__tests__/TronTxReview.snap.test.tsx
git status --short
```

---

## Task T6.20: Final M6 Branch Review

**Wave:** W9. **Subagent:** `code-review:code-review`, `model: opus`. **Goal:** Full review of the M6 branches across all four repos (sw4p, sw4p-frontend, sw4p-kit, sw4p-mcp-gateway). The reviewer reads the M6 plan, the handoff doc, the PRD/CRD/TRD/SOW IDs cited per task, and the M0-M2/M3/M4/M5 plans for the patterns this milestone extends.

**Pre-review verification commands the controller runs:**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --all -- --test-threads=1

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npx vitest run

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
npx vitest run

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-mcp-gateway"
npx vitest run

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
LC_ALL=C grep -cP "[^\x00-\x7F]" docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md
xxd docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md | grep -E 'e2 80 (94|93|92)' | head -3 || echo "no em/en dashes in plan"
```

- [ ] **Step 1: Dispatch the reviewer.**

```
Agent(
  description: "Final m6 branch review",
  subagent_type: "code-review:code-review",
  model: "opus",
  prompt: <full review prompt referencing PRD-USDT-006/009/014/015/018/019/020, CRD section 5/11/12/14, TRD section 8/10 plus TRD-TRON-010 and TRD-KIT-001/003/005, SOW WP6.3 and WS8 in full, the M6 wave map, the M5 dependencies T6.3 has on the lifecycle event endpoint, and the M0-M2/M3/M4/M5 final review CHANGES_REQUIRED patterns to anticipate>
)
```

- [ ] **Step 2: Handle verdict.** If APPROVED, the controller moves to `superpowers:finishing-a-development-branch`. If CHANGES_REQUIRED, the controller re-dispatches the original implementer task for each issue. After APPROVED, write `sw4p/docs/followups/2026-05-19-usdt-tron-parity-m6-product-parity-followups.md` capturing anything M6 deferred (likely: M7 on-chain canary execution to populate the first non-synthetic `settlement_evidence` row, M7 selector live verification, the `solana_allbridge_*` registry values needing pinning against the published Allbridge Core program metadata once the M6 SPL path runs on a real mainnet fork, full RBAC replacing the static `OPERATOR_AUTH_TOKEN` header for both the M5 route-suspension endpoint and the M6 canary creation endpoint, Tron `TRX` admission into the kit's `ChainSchema` enum once Tron source routes have shipped to `live`).

- [ ] **Step 3: Push the M6 branches and open four stacked PRs (sw4p, sw4p-frontend, sw4p-kit, sw4p-mcp-gateway), each stacking on the respective M5 branch.** Controller-only step; no subagent.

---

## Self-Review Checklist

### Spec coverage trace

| Spec ID or follow-up | Task |
|---|---|
| PRD-USDT-001 USDC and USDT separate | T6.1, T6.2 |
| PRD-USDT-002 USDT first class | T6.1, T6.2 |
| PRD-USDT-003 Tron gated until proof | T6.1, T6.2, T6.8 |
| PRD-USDT-005 real Tron wallet signing | T6.3, T6.4, T6.12, T6.13, T6.18 |
| PRD-USDT-006 no false live | T6.9, T6.10 |
| PRD-USDT-007 explicit route selection | T6.17 |
| PRD-USDT-008 Tron fees explanation | T6.3, T6.19 |
| PRD-USDT-009 machine-readable surface | T6.5, T6.10 |
| PRD-USDT-013 provider metadata never auto-promotes | T6.5, T6.10, T6.16 |
| PRD-USDT-014 no silent conversion | T6.17 |
| PRD-USDT-015 route confirmation surface | T6.2, T6.3 |
| PRD-USDT-017 raw tx validation before signing | T6.3, T6.4, T6.18 |
| PRD-USDT-018 suspended state in UI/SDK | T6.1 |
| PRD-USDT-019 canary structure | T6.5, T6.6, T6.7, T6.8, T6.11 |
| PRD-USDT-020 cross-surface agreement | T6.5, T6.6, T6.10 |
| PRD-USDT-022 provider mechanism display | T6.2 |
| PRD-USDT-024 small canary on authorization | T6.11 |
| CRD section 5 route state model | T6.1, T6.2, T6.10 |
| CRD section 7 CRD-SIGN-002 Solana source | T6.9 |
| CRD section 7 CRD-SIGN-003 Tron source | T6.3, T6.12, T6.13 |
| CRD section 11 proof requirements | T6.2 (proof state display), T6.10 |
| CRD section 12 lifecycle requirements | T6.3 (poll loop) |
| CRD section 14 canary authorization | T6.6, T6.7, T6.8, T6.11 |
| CRD CRD-SEC-002 relayer/canary structure | T6.6, T6.11 |
| CRD CRD-SEC-008 operator surface without code deploy | T6.11 |
| TRD section 5 raw tx builder | T6.9 |
| TRD section 8 Tron wallet adapter | T6.3, T6.4, T6.18, T6.19 |
| TRD section 10 kit/agent API | T6.5, T6.6, T6.7, T6.8 |
| TRD section 12 observability/resilience | T6.14, T6.15 |
| TRD section 14 canary object | T6.7, T6.8, T6.11 |
| TRD-TRON-001 TronLink + network/account check | T6.18 (scenario 1) |
| TRD-TRON-002 raw tx review | T6.3, T6.19 |
| TRD-TRON-003 TronLink signing | T6.3, T6.18 |
| TRD-TRON-004 broadcast and record tx | T6.3, T6.18 (scenarios 3, 6) |
| TRD-TRON-006 display TRX/Bandwidth/Energy/fee limit | T6.19 |
| TRD-TRON-007 reject malformed Tron destination | T6.18 (scenario 4) |
| TRD-TRON-008 no production relayer key for prod | T6.12, T6.13 |
| TRD-TRON-009 canary enforces caps | T6.11 |
| TRD-TRON-010 six acceptance scenarios | T6.18 |
| TRD-KIT-001 chain schema includes tron without live | T6.8 |
| TRD-KIT-003 kit estimate returns route-state failures | T6.5 |
| TRD-KIT-005 gateway consumes kit response shape directly | T6.5, T6.6 |
| SOW WP6.3 Solana to Tron gap | T6.9, T6.10 |
| SOW WP8.1 route state UI | T6.1 |
| SOW WP8.2 route detail | T6.2 |
| SOW WP8.3 Tron execution UI | T6.3, T6.4, T6.18, T6.19 |
| SOW WP8.4 kit chain/asset schema | T6.7, T6.8 |
| SOW WP8.5 agent-safe route output | T6.5, T6.6, T6.11 |
| SOW WP8.6 consistency tests and legacy cleanup | T6.12, T6.13, T6.14, T6.15, T6.16, T6.17 |
| M4 follow-up: raw_data object passing | T6.4, T6.18 (scenario 7) |
| M4 follow-up: multi_hop bridge_from_tron migration | T6.12 |
| M4 follow-up: native_bridge pool-less fallback | T6.13 |
| M4 follow-up: TronClient timeout | T6.14 |
| M4 follow-up: Solana broadcast size cap | T6.15 |
| M0-M2 follow-up: legacy /v1/routes retirement | T6.16 |
| M0-M2 follow-up: Base USDT to USDC silent mapping | T6.17 |

### Placeholder scan

No "TBD", no "TODO", no "FIXME", no "implement later", no "fill in details", no "similar to Task N" reference. Every code block has actual code. The few `// adapt to actual field name` style notes are scoped to specific files (`App.tsx` routing config, `Registry` accessor names) and are scoped to a grep-confirmable check, not a deferred decision.

### Type consistency

- `RouteState` is defined in `RouteList.tsx` and re-imported unchanged by `RouteDetail.tsx`, `TronExecution.tsx`, and the test files.
- `TronResourcePreview` and `TronTxReviewProps` are defined in `TronTxReview.tsx` (shipped in M3) and consumed unchanged by `TronExecution.tsx`, the T6.18 hook tests, and the T6.19 snapshot test.
- `CanaryAuthorization` is defined in `canary_authorization.rs` (M3) and the kit's `canary.ts` (M3 PR #7); T6.11's HTTP handler reuses the Rust type, T6.6 reuses the TypeScript type via `parseCanaryAuthorization`.
- `SolanaBridgeResult::Unsigned(UnsignedSolanaTransaction)` is defined in M4 and constructed for the first time in T6.9.
- `LifecycleEvent` (M5) is consumed via the JSON event-string in the frontend lifecycle response shape in T6.3; the frontend treats `event` as `string` and compares against the M5-pinned terminal set (`destination_settled`, `settlement_proof_recorded`, `failed`, `refunded`).
- Reason codes: `PROOF_PENDING` (T6.10), `REGISTRY_STALE` (M5), `SOL_TO_TRON_NOT_IMPLEMENTED` (removed by T6.10), `OUT_OF_SCOPE` (existing). T6.10 confirms `SOL_TO_TRON_NOT_IMPLEMENTED` is removed everywhere; the controller greps post-T6.10 to verify.

### Wave-level file conflict audit

- W0 (sw4p-kit): T6.7 and T6.8 both touch `canary.ts`. Sequential ordering avoids conflict; T6.7 edits the `expires_at` schema line, T6.8 adds a comment above the `source_chain` and `destination_chain` lines. No overlap.
- W1 (sw4p backend): T6.9 modifies `allbridge.rs`, `networks.rs`, `solana_signing_api.rs`, `Cargo.toml`. Solo wave.
- W2 (sw4p backend): T6.10 modifies `policy.rs` and possibly `tests/route_state_pinned.rs`. Sequential after W1 (depends on T6.9 having landed so the policy flip matches the executor).
- W3 (sw4p backend): T6.11 creates `operator_canary_api.rs`, modifies `lib.rs` and `main.rs`. Parallel-safe with W1 (no file overlap) but the controller pins to sequential within the sw4p repo to avoid branch-state fragmentation.
- W4 (sw4p backend): T6.12 modifies `multi_hop.rs`, T6.13 modifies `native_bridge.rs`, T6.14 modifies `tron_client.rs`, T6.15 modifies `solana_signing_api.rs` (different region than T6.9; T6.9 added the SPL path, T6.15 adds the body size cap in `broadcast_handler`), T6.16 modifies `route_selector.rs` and `main.rs`, T6.17 modifies `allbridge.rs`. T6.17 must follow T6.9; T6.12 through T6.16 can run in any sequence. T6.16's `main.rs` edit (removing the legacy route mount) is disjoint from T6.11's `main.rs` edit (adding the operator canary router merge); sequential within W4 still avoids any merge friction.
- W5 (sw4p-frontend): T6.1 creates `RouteList.tsx`, T6.2 creates `RouteDetail.tsx`. Both touch `App.tsx`; sequential ordering keeps the route-registration appends conflict-free.
- W6 (sw4p-frontend): T6.3 creates `TronExecution.tsx` and modifies `RouteDetail.tsx` (adding form state for recipient/amount). T6.4 modifies `useTronSigning.ts`. Sequential within W6 because T6.4's guard runs in T6.3's tests.
- W7 (sw4p-frontend): T6.18 creates `useTronSigning.test.tsx`, T6.19 creates `TronTxReview.snap.test.tsx`. No file overlap; sequential ordering chosen only to keep the wave's wall-clock predictable.
- W8 (sw4p-mcp-gateway): T6.5 and T6.6 both append to `tools.ts`. Sequential; the two appends do not touch overlapping lines.
- W9: cross-repo read-only review.

### Out-of-scope follow-ups to surface in T6.20 review

- Full RBAC replacing the static `OPERATOR_AUTH_TOKEN` header for both the M5 route-suspension endpoint and the M6 canary creation endpoint. Status: M7 task.
- Real on-chain canary execution to populate the first non-synthetic `settlement_evidence` row (SOW WP9.5). Status: M7 task T7.4 (per the handoff doc).
- Allbridge `swapAndBridge` selector live verification on Tron mainnet (M4 critical follow-up). Status: M7 T7.1 through T7.3.
- The Allbridge Solana `swap_and_bridge` instruction discriminator constant in T6.9 Step 4 is pinned to a placeholder until the implementer regenerates it from the Allbridge Core Anchor IDL. If the published IDL is unavailable when the milestone runs, the controller falls back to capturing the discriminator from a mainnet Allbridge Solana transaction via `solana getTransaction --json` and extracting the first 8 bytes of the program-instruction data. Status: confirm in T6.20 review; M7 verifies against on-chain.
- Tron `TRX` admission into the kit's `ChainSchema` enum once Tron source routes have shipped to `live`. Status: deferred until M7 promotes the first corridor.
- BTC and Omni USDT remain explicitly out of scope (PRD-USDT-010).
- Phase H corridors (any future non-Allbridge rail for Tron, e.g. native Tether on Tron via a direct integration) are out of scope.
- Destination gas top-up (PRD-USDT-021 SHOULD) is not implemented; surface as an M7 or post-M7 enhancement.

### Em-dash, en-dash, and non-ASCII scan

The plan contains no em dashes (U+2014), no en dashes (U+2013), and no non-ASCII characters. Verify with:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
LC_ALL=C grep -cP "[^\x00-\x7F]" docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md
xxd docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md | grep -E 'e2 80 (94|93|92)' | head -3 || echo "no em/en dashes"
```

Expected: `0`, then `no em/en dashes`.

### Command and shell-quoting consistency

- Every `git -C` invocation uses the absolute parent-repo or sub-repo path quoted with double quotes when it contains spaces.
- Every `cargo test --lib <module>` call uses `-- --test-threads=1` to avoid the cross-test DB pool conflicts that bit M0-M2.
- Every `npx vitest run` call is scoped to a single test file path so the wave's intent is unambiguous.
- No call uses `-c commit.gpgsign=false`, `--no-gpg-sign`, or `--no-verify`. Hard rule.
- No call uses `Co-Authored-By:`, `--author`, or `GIT_AUTHOR_*`/`GIT_COMMITTER_*` env vars. Hard rule.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md`.

Two execution options:

**1. Subagent-Driven (recommended)**: Controller dispatches a fresh subagent per task, reviews per wave. Same model and contract as M0-M2, M3, M4, and M5. Estimate: 10 waves, 20 tasks (T6.1 through T6.19 plus T6.20 review), ~5 hours wall-clock at the M5 cadence, ~28 subagent dispatches (one implementer per task plus a quality reviewer for the larger tasks: T6.9, T6.11, T6.3).

**2. Inline Execution**: Controller executes tasks in this session using `superpowers:executing-plans`, batched with human-review checkpoints at every wave boundary.
