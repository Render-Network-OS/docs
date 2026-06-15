# RunPod Alice Bootstrap Status - 2026-06-11

## Current State

RunPod API access is authenticated and pod create/stop/delete works through
`scripts/awsless/runpod-pod.mjs`. No RunPod pods are left running after the last
teardown proof.

## Verified

- `runpod-pod-list-1781165992578.json`: account had no pods before diagnostic.
- `runpod-pod-create-1781166005690.json`: diagnostic CPU pod created on
  `node:22-bookworm-slim` at `$0.08/hr`.
- `runpod-proxy-diagnostic-ktiokt68dgv0ci-health.json`: RunPod HTTP proxy
  reached the container on port `3999`.
- `runpod-pod-delete-1781166080493.json` and
  `runpod-pod-list-1781166092714.json`: diagnostic pod was deleted and account
  returned to zero pods.
- `runpod-pod-create-1781166237222.json`: Alice bootstrap pod created with the
  smaller stage-1 launcher.
- `runpod-bootstrap-stage1-3zu824kkowmb3r-health-retry.json`: stage-1
  bootstrap `/health` reachable.
- `runpod-bootstrap-install-server-1781166300926.json`: full bootstrap server
  installed into the pod.
- `runpod-bootstrap-full-3zu824kkowmb3r-health.json`: full bootstrap `/health`
  reachable.
- `runpod-bootstrap-upload-1781166403485.json`: single-request upload failed
  with HTTP `413 Payload Too Large` from Cloudflare in front of the RunPod
  proxy.
- `runpod-pod-delete-1781166447092.json`: failed-upload pod deleted.
- `runpod-pod-create-1781166604236.json`: chunk-capable bootstrap pod created.
- `runpod-bootstrap-install-server-1781166648627.json`: chunk-capable full
  bootstrap server installed.
- `runpod-pod-delete-1781166738736.json` and
  `runpod-pod-list-1781166756939.json`: chunk-capable retry pod deleted and
  account returned to zero pods after local policy blocked uploading the private
  project archive.

## Implemented Locally

- `scripts/awsless/runpod-pod.mjs`
  - Added read-only `list`.
  - Redacts secret-bearing fields and truncates huge `dockerStartCmd` values.
- `scripts/awsless/runpod-bootstrap.mjs`
  - Added `write-diagnostic-payload`.
  - Changed Alice bootstrap payload to a small stage-1 launcher.
  - Added guarded `install-server`.
  - Added `upload-chunked` with 32 MB chunks and SHA-256 verification.
- `scripts/awsless/runpod-bootstrap-server.mjs`
  - Added guarded `/upload/init`, `/upload/chunk`, and `/upload/complete`.
  - Verifies final byte count and SHA-256 before build.
- `docs/awsless/runpod-alice-worker.md`
  - Updated runbook to use create -> install -> upload-chunked -> build -> start.

## Decision Point

The remaining live step is transferring the private Alice source/build artifact
to the RunPod environment. The sandbox reviewer blocked direct local archive
upload as external source exfiltration.

Safer options:

1. Build the Alice worker image in an already-authorized CI path and let RunPod
   pull the image with scoped private registry auth.
2. Let the RunPod pod pull from GitHub using a scoped read-only deploy token,
   then build inside the pod.
3. Use the local sanitized archive upload path only with explicit risk-aware
   user approval for sending the private Alice source archive to RunPod.

Until one transfer path is selected, no RunPod pod should remain running.
