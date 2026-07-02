# SW4P Earn P0 unresolved issues: gh create command bundle

Generated: 2026-06-26
Scope: sw4p-earn repository
Commands are prefilled from backlog IDs P0-005 through P0-020 (excluding already confirmed items).

## Execute all

```bash
gh auth status
cd '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555'
REPO=render-network-os/sw4p-earn

gh issue create --repo "$REPO" \
  --title "P0-005 Backend: Add MM/POL wallet exclusion classes" \
  --label p0-anti-wash --label p0-mm \
  --body "## Context\nOwner: Backend\nSeverity: Critical\nDependencies: P0-004\n\n## Problem\nClassify market_maker and protocol_owned_liquidity wallets.\n\n## Acceptance\nMM route excluded from rewards.\n\n## Evidence\n- Route classification fixture proving MM/POL wallets map to excluded source classes\n- Integration test (synthetic wash + MM/POL route) showing excluded reward share\n- Dashboard/API evidence showing excluded volume is visible and reflected\n\n## Gates\nG5 Anti-wash, G6 Reward epoch\n\n## Notes\nThis is a new issue created from unresolved P0 rollup."

gh issue create --repo "$REPO" \
  --title "P0-006 Solidity: ProtocolOwnedLiquidityVault tests + pause path" \
  --label p0-contracts \
  --body "## Context\nOwner: Solidity\nSeverity: High\nDependencies: None\n\n## Problem\nAdd ProtocolOwnedLiquidityVault coverage + pause semantics closure.\n\n## Acceptance\nFoundry coverage report; pause test green.\n\n## Evidence\n- Foundry pass + coverage package including POL vault matrix\n- Pause path test proving non-treasury funding/withdraw behaviors under pause\n- Policy/protocol on pause + withdrawal semantics\n\n## Gates\nG3 Contract tests\n\n## Notes\nSplit risk: R-005 (POL vault untested/no pause)."

gh issue create --repo "$REPO" \
  --title "P0-007 Solidity: LPVault withdraw/share inflation and multi-depositor tests" \
  --label p0-contracts \
  --body "## Context\nOwner: Solidity\nSeverity: High\nDependencies: None\n\n## Problem\nClose LPVault coverage gaps for withdraw/share inflation and multi-depositor safety.\n\n## Acceptance\nWithdraw and inflation tests green.\n\n## Evidence\n- Foundry suites for multi-depositor share math and inflation resistance\n- Passing path covering adapter/withdraw lifecycle\n- Coverage and regression logs retained\n\n## Gates\nG3 Contract tests\n\n## Notes\nAddress all high-risk LP share math/withdrawal paths before launch."

gh issue create --repo "$REPO" \
  --title "P0-008 Solidity: Resolve adapter topology across vault reward paths" \
  --label p0-contracts \
  --body "## Context\nOwner: Solidity\nSeverity: High\nDependencies: P0-006, P0-007\n\n## Problem\nSettle adapter topology: one adapter per vault or safe multi-vault adapter design.\n\n## Acceptance\nDeployment topology documented and tested.\n\n## Evidence\n- Architecture decision for adapter model\n- Deployment topology test matrix\n- Regression ensuring reward/routing not broken under pause/withdraw\n\n## Gates\nG3 Contract tests, G4 Service tests\n\n## Notes\nFinalize after P0-006 and P0-007 closure."

gh issue create --repo "$REPO" \
  --title "P0-009 Backend/Tokenomics: Centralize policy manifest and bucket registry" \
  --label p0-policy \
  --body "## Context\nOwner: Backend/Tokenomics\nSeverity: High\nDependencies: None\n\n## Problem\nSingle policy module + JSON manifest + golden hash + bucket registry are required.\n\n## Acceptance\nPolicy snapshot endpoint returns hash.\n\n## Evidence\n- Single policy module implemented\n- JSON policy manifest + bucket registry committed\n- Endpoint returns policy manifest hash (golden hash)\n- Version history + changelog of policy updates\n\n## Gates\nG6 Reward epoch, G10 Audit handoff\n\n## Notes\nFeeds downstream APY and split policy decisions."

gh issue create --repo "$REPO" \
  --title "P0-010 Founder/Tokenomics: Explicit LP/stake split decision for P0" \
  --label needs-founder-decision \
  --body "## Context\nOwner: Founder/Tokenomics\nSeverity: High\nDependencies: P0-009\n\n## Problem\nDecision required for LP/stake split handling.\n\n## Acceptance\nDashboard shows split; epoch snapshot includes split (fixed or per-epoch).\n\n## Evidence\n- Signed decision record\n- Epoch snapshot schema update\n- Dashboard evidence showing explicit split\n\n## Gates\nG6 Reward epoch, G7 APY truth, G8 Dashboard proof\n\n## Notes\nOption A vs Option B per policy doc should be finalized and recorded."

gh issue create --repo "$REPO" \
  --title "P0-011 Founder/Tokenomics: Resolve DEX LP fee APY treatment and anti-double-count policy" \
  --label needs-founder-decision \
  --body "## Context\nOwner: Founder/Tokenomics\nSeverity: High\nDependencies: P0-009\n\n## Problem\nSettle whether DEX LP fees should be counted as direct LP APR only, routed APR only, or mixed policy.\n\n## Acceptance\nNo double count; no hidden 20% haircut.\n\n## Evidence\n- Policy memo with final formula\n- API contract proving sourceTag APR components\n- Dashboard proving separated APR components\n\n## Gates\nG7 APY truth, G8 Dashboard proof\n\n## Notes\nMust prevent blended-only APY narratives."

gh issue create --repo "$REPO" \
  --title "P0-012 Backend: Fee ledger and outbox integration harness" \
  --label p0-services \
  --body "## Context\nOwner: Backend\nSeverity: High\nDependencies: P0-009\n\n## Problem\nVerify real PgFeeLedgerStore + outbox + fake on-chain harness integration.\n\n## Acceptance\nNo duplicate dispatch; trace available.\n\n## Evidence\n- Real Postgres-backed integration test suite\n- Harness proving route_event -> fee_event -> outbox -> dispatch trace\n- Replay/retry idempotency proof\n\n## Gates\nG4 Service tests, G6 Reward epoch\n\n## Notes\nTie this to fee_outbox/ledger path and reconciliation trail."

gh issue create --repo "$REPO" \
  --title "P0-017 SRE/Safe: Execute pause/unpause full system drill" \
  --label p0-ops \
  --body "## Context\nOwner: SRE/Safe Captain\nSeverity: Critical\nDependencies: P0-015\n\n## Problem\nPause/unpause drill rehearsal missing as evidence.\n\n## Acceptance\nTx hashes + drill log.\n\n## Evidence\n- Full pause/recovery runbook output\n- Safe pause/unpause tx hashes\n- Dashboard and service state screenshots/logs\n\n## Gates\nG9 Ops drills\n\n## Notes\nUse pause_recovery_runbook.md and canary_and_drill_schedule.md as source."

gh issue create --repo "$REPO" \
  --title "P0-018 Backend/Safe: Reward epoch synthetic close + wrong-root rejection drill" \
  --label p0-ops --label p0-rewards \
  --body "## Context\nOwner: Backend/Safe Captain\nSeverity: Critical\nDependencies: P0-003, P0-013\n\n## Problem\nRun synthetic epoch close drill with retry and wrong-root failure behavior validated.\n\n## Acceptance\nDrill evidence and root export.\n\n## Evidence\n- Root export JSON + reproduction\n- Safe publish tx for valid close\n- Demonstrated rejection for retry with different root\n- Claim proof output\n\n## Gates\nG6 Reward epoch, G9 Ops drills\n\n## Notes\nUse rewards_epoch_runbook.md step-by-step sequence."

gh issue create --repo "$REPO" \
  --title "P0-019 Backend/SRE: Anti-wash liveness 24h gate" \
  --label p0-anti-wash --label p0-ops \
  --body "## Context\nOwner: Backend/SRE\nSeverity: Critical\nDependencies: P0-004\n\n## Problem\nNeed explicit anti-wash worker liveness/lag evidence before launch.\n\n## Acceptance\n24h liveness report.\n\n## Evidence\n- 24h lag and heartbeat report\n- No stale anti-wash at epoch-close boundary\n- Evidence that stale anti-wash blocks epoch build\n\n## Gates\nG5 Anti-wash, G6 Reward epoch, G9 Ops drills\n\n## Notes\nAlign thresholds with 10-minute operational liveness threshold from TRD."

gh issue create --repo "$REPO" \
  --title "P0-020 Audit: Assemble external audit evidence pack" \
  --label p0-audit \
  --body "## Context\nOwner: Audit Captain\nSeverity: High\nDependencies: all\n\n## Problem\nCompile completion evidence and residual risks for external audit handoff.\n\n## Acceptance\nAudit folder complete.\n\n## Evidence\n- Closed evidence index mapping every P0 ID\n- Risk and residual issue register\n- Signed evidence checklist and launch gate status\n\n## Gates\nG10 Audit handoff\n\n## Notes\nFinal artifact should be the canonical acceptance binder for stage gate."
