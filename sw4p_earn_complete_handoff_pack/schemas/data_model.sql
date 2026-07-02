-- SW4P Earn P0 data model skeleton

create table if not exists route_events (
  route_event_id text primary key,
  source_tx_hash text not null,
  destination_tx_hash text,
  source_chain text not null,
  destination_chain text,
  input_token text not null,
  output_token text,
  input_amount numeric not null,
  output_amount numeric,
  notional_usd numeric,
  user_wallet text not null,
  wallet_cluster_id text,
  route_type text not null,
  anti_wash_status text not null default 'UNPROCESSED',
  anti_wash_evaluated_at timestamptz,
  eligibility_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_route_events_anti_wash_status on route_events(anti_wash_status, created_at);
create index if not exists idx_route_events_wallet on route_events(user_wallet, created_at);

create table if not exists anti_wash_evaluations (
  evaluation_id text primary key,
  route_event_id text not null references route_events(route_event_id),
  classification text not null,
  reason text not null,
  model_version text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists fee_events (
  fee_event_id text primary key,
  route_event_id text references route_events(route_event_id),
  source_type text not null,
  source_tx_hash text,
  chain_id text not null,
  asset text not null,
  amount_raw numeric not null,
  amount_usd numeric,
  fee_bps numeric,
  policy_version text not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists fee_outbox (
  outbox_id text primary key,
  fee_event_id text not null references fee_events(fee_event_id),
  bucket text not null,
  asset text not null,
  amount_raw numeric not null,
  status text not null default 'PENDING',
  attempt_count integer not null default 0,
  last_error text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz
);

create table if not exists treasury_dispatches (
  dispatch_id text primary key,
  outbox_id text not null references fee_outbox(outbox_id),
  bucket text not null,
  asset text not null,
  amount_raw numeric not null,
  destination text,
  tx_hash text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists reward_epochs (
  epoch_id bigint primary key,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  state text not null,
  policy_hash text not null,
  snapshot_hash text,
  merkle_root text,
  total_real_fee_raw numeric not null default 0,
  total_incentive_raw numeric not null default 0,
  safe_tx_hash text,
  published_tx_hash text,
  funded_tx_hash text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists reward_leaves (
  leaf_id text primary key,
  epoch_id bigint not null references reward_epochs(epoch_id),
  account text not null,
  asset text not null,
  amount_raw numeric not null,
  source_tag text not null check (source_tag in ('REAL_FEE','INCENTIVE')),
  leaf_hash text not null,
  proof_json jsonb not null,
  eligible_basis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(epoch_id, account, asset, source_tag)
);

create table if not exists claims (
  claim_id text primary key,
  epoch_id bigint not null references reward_epochs(epoch_id),
  account text not null,
  asset text not null,
  source_tag text not null,
  amount_raw numeric not null,
  tx_hash text not null,
  claimed_at timestamptz not null default now(),
  unique(epoch_id, account, asset, source_tag)
);

create table if not exists supply_counters (
  counter_id text primary key,
  chain_id text not null,
  token text not null,
  minted_raw numeric not null default 0,
  burned_raw numeric not null default 0,
  live_supply_raw numeric not null default 0,
  last_block numeric,
  last_tx_hash text,
  updated_at timestamptz not null default now(),
  unique(chain_id, token)
);

create table if not exists ntt_transfers (
  transfer_id text primary key,
  source_chain text not null,
  destination_chain text not null,
  source_tx_hash text not null,
  destination_tx_hash text,
  amount_burned_raw numeric not null,
  amount_minted_raw numeric,
  status text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists policy_snapshots (
  policy_hash text primary key,
  policy_version text not null,
  manifest_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists system_gate_status (
  gate_id text primary key,
  status text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz not null default now(),
  notes text
);
