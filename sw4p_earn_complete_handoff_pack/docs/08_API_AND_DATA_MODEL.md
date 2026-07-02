# 08 - API and Data Model

## API design principles

1. Public APIs can expose proof and status.
2. Operator APIs require authentication, authorization, rate limits, and audit logs.
3. Every financial number must include source, timestamp, chain, and confidence/status.
4. APY must always be split.
5. Dashboard must distinguish zero, unknown, stale, and healthy states.

## Public API skeleton

### `GET /v1/earn/overview`

Returns global Earn status.

```json
{
  "status": "HEALTHY",
  "chainTopology": {"hub": "solana", "spokes": ["base"]},
  "tvlUsd": "0",
  "total555Staked": "0",
  "totalLpUsd": "0",
  "activeEpochId": 0,
  "apy": {
    "realFeeAprPct": 0,
    "incentiveAprPct": 0,
    "blendedAprPct": 0
  },
  "supplyInvariant": {"status": "UNKNOWN"},
  "lastUpdated": "2026-01-01T00:00:00Z"
}
```

### `GET /v1/earn/positions/{account}`

Returns staking, LP, rewards, and claim history.

### `GET /v1/earn/rewards/epochs`

Returns epoch list.

### `GET /v1/earn/rewards/{epochId}/{account}`

Returns account reward summary for epoch.

### `GET /v1/earn/claims/proof/{epochId}/{account}`

Returns claim proof.

```json
{
  "epochId": 17,
  "account": "0x...",
  "asset": "0x...",
  "amount": "1000000",
  "sourceTag": "REAL_FEE",
  "proof": ["0x..."],
  "root": "0x...",
  "claimContract": "0x..."
}
```

### `GET /v1/earn/policy/snapshot`

Returns policy snapshot and hash.

### `GET /v1/dashboard/555-proof`

Returns dashboard proof object:

```json
{
  "supplyInvariant": {},
  "feeSources": [],
  "excludedVolume": {},
  "activeEpoch": {},
  "bucketBalances": [],
  "pauseStatus": [],
  "canaryStatus": []
}
```

## Operator API skeleton

### `GET /v1/ops/anti-wash/status`

Requires ops auth.

### `POST /v1/ops/epochs/{epochId}/build`

Builds deterministic root from finalized snapshot.

### `POST /v1/ops/epochs/{epochId}/queue-safe`

Queues Safe transaction for root publication.

### `GET /v1/ops/treasury-pending`

Requires ops auth; returns pending operator actions.

### `POST /v1/ops/reconcile`

Runs reconciliation and returns diff.

## Data model entities

### `route_events`

```txt
route_event_id
source_tx_hash
destination_tx_hash
source_chain
destination_chain
input_token
output_token
input_amount
output_amount
notional_usd
user_wallet
wallet_cluster_id
route_type
created_at
anti_wash_status
anti_wash_evaluated_at
eligibility_reason
```

### `fee_events`

```txt
fee_event_id
route_event_id
source_type
source_tx_hash
chain_id
asset
amount_raw
amount_usd
fee_bps
policy_version
idempotency_key
created_at
```

### `fee_outbox`

```txt
outbox_id
fee_event_id
bucket
asset
amount_raw
status
attempt_count
last_error
idempotency_key
created_at
dispatched_at
```

### `reward_epochs`

```txt
epoch_id
start_ts
end_ts
state
policy_hash
snapshot_hash
merkle_root
total_real_fee_raw
total_incentive_raw
safe_tx_hash
published_tx_hash
funded_tx_hash
created_at
published_at
```

### `reward_leaves`

```txt
leaf_id
epoch_id
account
asset
amount_raw
source_tag
leaf_hash
proof_json
eligible_basis_json
created_at
```

### `supply_counters`

```txt
counter_id
chain_id
token
minted_raw
burned_raw
live_supply_raw
last_block
last_tx_hash
updated_at
```

Full SQL is in `schemas/data_model.sql`.

## Error handling

APIs must return status classes:

```txt
HEALTHY
STALE
UNKNOWN
DEGRADED
BROKEN
PAUSED
```

No endpoint should quietly return zero for unknown state.

Example:

```json
{
  "status": "UNKNOWN",
  "value": null,
  "reason": "anti_wash_worker_lag_exceeded_threshold"
}
```
