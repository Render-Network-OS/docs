# Project Rules

## ALWAYS LOOK FOR EXISTING PATTERNS FIRST (HARD CONSTRAINT)

Before ANY deploy, build, infra, or "how do I run this" action, STOP and search the
repo for the established pattern BEFORE improvising. The answer is almost always already
written down. Do this first, every time:

1. **Search for a runbook / doc / past run.** `grep`/`find` for `runbook`, `deploy`,
   `proof`, `plan`, the service name, the host id. Read `docs/`, `evidence/`,
   `*/scripts/`, and prior plan/spec commits. If a doc says how to do it, follow that
   doc, do not invent a new way.
2. **Find the existing script before writing commands.** Deploys, migrations, builds,
   and proofs all have committed scripts. Use them. Do not hand-roll the steps.
3. **Match the established host / role / target.** Infra has a designated machine and
   identity for each action. Find it (past SSM runs, the runbook, prior commits) before
   picking one.
4. **No improvising on infra.** If you cannot find the pattern after looking, say so and
   ask, do not flail with guesses (local Docker, wrong host, ad-hoc kubectl). Flailing
   when the runbook existed the whole time is the failure this rule exists to prevent.

This applies to subagents too: any agent dispatched for deploy/build/infra work must
locate the existing runbook/script/host first and cite it before acting.

## MCP Tools

Always use Context7 MCP when needing library/API documentation, code generation, setup or configuration steps.

## Deploy Rules

### sw4p (the bridge) production deploys

- **Runbook:** `sw4p/docs/sw4p/production-direct-deploy-plan-2026-06-05.md`. Read it before deploying. Do NOT use local laptop Docker for production images (it says so on line ~180).
- **Where:** the PRODUCTION DEPLOYER EC2 instance `i-0312a1941d5392333` (IAM role `rndr-stream-production-deployer`, checkout `/home/deploy/sw4p-aws-production`), driven over SSM, build runs there as `sudo -iu deploy`. NOT locally, NOT on the staging deployer `i-0c96daf9e5920e6df`.
- **How:** `deploy/aws/scripts/deploy-production.sh --confirm-production --tag sha-<commit> --services backend,kora,frontend,console,storefront,landing` against `EKS_CLUSTER_NAME=rndr-stream-production`. Native amd64 build on the host, push ECR, rollout via `eks-private-kubectl.sh`.
- **All six surfaces at ONE SHA, every time.** No `--services <subset>` partial deploys (kustomize pins all tags to one SHA; a partial leaves siblings in ImagePullBackOff).
- **kubectl from the local sandbox HANGS** (private EKS). Use the deployer host over SSM. `dangerouslyDisableSandbox:true` gets named AWS reads + SSM through; if the SSO token is stale the user runs `aws sso login --profile stream-admin`.
- Production cluster runs the TESTNET env with 100% testnet/mainnet parity; flip `SW4P_ACTIVE_ENVIRONMENT=mainnet` in the `/sw4p/production/runtime-control` secret to go live, same SHA.

### 555stream / 555-bot production deploys

- `555stream` and `555-bot` production deploy through the host-side webhook/manual deployers on `stream-server`, not GitHub Actions.
- Verify deploy truth from the webhook service, host checkout, and live Kubernetes state.
- Preserve deploy-host checkout semantics for Git LFS assets; do not assume deploy-time `git lfs pull` succeeds.
- For manual `555stream` deploys, use the real deploy env file (`/etc/stream-deploy.env`) so `apply-secrets.sh` mints tokens against the production control-plane URL and key set.
- `apply-secrets.sh` token minting hits the public control-plane URL and Cloudflare blocks the default `Python-urllib/*` user agent with `403 error code: 1010`; keep an explicit non-urllib `User-Agent` on that request.
