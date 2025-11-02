# Daily Rewards System - Flow Diagrams

## 1. Daily Automated Cycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DAILY CYCLE (24 HOURS)                       │
└─────────────────────────────────────────────────────────────────────┘

Time: 00:00 UTC (Midnight)
┌──────────────────────────────────────────────────────────────────┐
│ 1. BACKEND SCHEDULER TRIGGERS                                    │
├──────────────────────────────────────────────────────────────────┤
│   - Cron job executes at configured anchor time                  │
│   - Begins epoch closure process                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. COLLECT POINTS SNAPSHOT                                       │
├──────────────────────────────────────────────────────────────────┤
│   - Query Badger DB: global:wallet:*:points                      │
│   - Aggregate all players' points from past 24h                  │
│   - Filter: minimum threshold (e.g., 100 points)                 │
│   - Result: List of (wallet, points) pairs                       │
│                                                                   │
│   Example Output:                                                │
│   [                                                              │
│     {wallet: "5ZYW...", points: 50000},                         │
│     {wallet: "9ABC...", points: 25000},                         │
│     ...                                                          │
│   ]                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. BUILD MERKLE TREE (Off-Chain)                                 │
├──────────────────────────────────────────────────────────────────┤
│   - Sort by wallet address (deterministic)                       │
│   - Create leaves: keccak256(wallet || points)                   │
│   - Build merkle tree                                            │
│   - Calculate root hash                                          │
│   - Store tree & proofs in cache                                 │
│                                                                   │
│   Tree Structure:                                                │
│                     ROOT (32 bytes)                              │
│                    /              \                              │
│               BRANCH              BRANCH                         │
│              /      \            /      \                        │
│           LEAF1   LEAF2      LEAF3    LEAF4                      │
│         (wallet,  (wallet,  (wallet,  (wallet,                  │
│          points)  points)   points)   points)                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. COMMIT TO SOLANA (Transaction 1)                              │
├──────────────────────────────────────────────────────────────────┤
│   Instruction: commit_epoch_points                               │
│   Parameters:                                                    │
│   - epoch_id: 42                                                 │
│   - merkle_root: 0xabcdef...                                     │
│   - total_points: 1,000,000                                      │
│   - players_count: 1,000                                         │
│   - metadata_uri: "ipfs://..."                                   │
│                                                                   │
│   On-Chain State Change:                                         │
│   RewardEpoch.status: Open → Committed                           │
│   RewardEpoch.points_merkle_root: 0xabcdef...                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. FINALIZE EPOCH (Transaction 2)                                │
├──────────────────────────────────────────────────────────────────┤
│   Instruction: finalize_epoch                                    │
│   Parameters:                                                    │
│   - epoch_id: 42                                                 │
│                                                                   │
│   On-Chain State Change:                                         │
│   RewardEpoch.status: Committed → Finalized                      │
│   RewardEpoch.total_rewards_lamports: 100 SOL                    │
│                                                                   │
│   ✅ CLAIMS NOW ENABLED                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. CREATE NEXT EPOCH (Transaction 3)                             │
├──────────────────────────────────────────────────────────────────┤
│   Instruction: create_epoch                                      │
│   Parameters:                                                    │
│   - start_timestamp: 1730332800 (current time)                   │
│   - end_timestamp: 1730419200 (+24 hours)                        │
│                                                                   │
│   On-Chain State Change:                                         │
│   New RewardEpoch(id=43) created with status: Open               │
│   GlobalConfig.last_epoch_id: 42 → 43                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. USERS CLAIM REWARDS (Multiple Transactions)                   │
├──────────────────────────────────────────────────────────────────┤
│   Players can now claim their share of 100 SOL                   │
│   (See "User Claim Flow" diagram below)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. User Claim Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CLAIM PROCESS                          │
└─────────────────────────────────────────────────────────────────────┘

User visits rewards dashboard
┌──────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND QUERIES API                                          │
├──────────────────────────────────────────────────────────────────┤
│   GET /api/rewards/wallet/{wallet}/claimable                     │
│                                                                   │
│   Backend responds:                                              │
│   {                                                              │
│     "wallet": "5ZYW...",                                         │
│     "claimable_epochs": [                                        │
│       {                                                          │
│         "epoch_id": 42,                                          │
│         "points": 50000,                                         │
│         "estimated_reward": "5.0 SOL",                           │
│         "status": "Finalized"                                    │
│       },                                                         │
│       {                                                          │
│         "epoch_id": 41,                                          │
│         "points": 30000,                                         │
│         "estimated_reward": "3.2 SOL"                            │
│       }                                                          │
│     ]                                                            │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. UI DISPLAYS CLAIMABLE REWARDS                                 │
├──────────────────────────────────────────────────────────────────┤
│   ┌────────────────────────────────────────────────────────┐    │
│   │  Daily Rewards                                         │    │
│   │                                                        │    │
│   │  ┌──────────────────────────────────────────────┐     │    │
│   │  │ Epoch #42 | Points: 50,000 | Reward: 5.0 SOL│     │    │
│   │  │                                   [Claim Now] │     │    │
│   │  └──────────────────────────────────────────────┘     │    │
│   │                                                        │    │
│   │  ┌──────────────────────────────────────────────┐     │    │
│   │  │ Epoch #41 | Points: 30,000 | Reward: 3.2 SOL│     │    │
│   │  │                                   [Claim Now] │     │    │
│   │  └──────────────────────────────────────────────┘     │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                   │
│   User clicks "Claim Now" for Epoch #42                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. FETCH MERKLE PROOF                                            │
├──────────────────────────────────────────────────────────────────┤
│   GET /api/rewards/epoch/42/proof/5ZYW...                        │
│                                                                   │
│   Backend responds:                                              │
│   {                                                              │
│     "epoch_id": 42,                                              │
│     "wallet": "5ZYW...",                                         │
│     "points": 50000,                                             │
│     "proof": [                                                   │
│       "0x1a2b3c4d5e6f...",  // 32-byte sibling hash             │
│       "0x7g8h9i0j1k2l...",  // 32-byte sibling hash             │
│       "0xm3n4o5p6q7r8...",  // 32-byte sibling hash             │
│       ...                   // log2(players) proof nodes         │
│     ],                                                           │
│     "root": "0xabcdef...",                                       │
│     "estimated_reward": "5.0"                                    │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. BUILD CLAIM TRANSACTION                                       │
├──────────────────────────────────────────────────────────────────┤
│   Frontend builds Solana transaction:                            │
│                                                                   │
│   Instruction: claim_reward                                      │
│   Program: RewardsProgram                                        │
│   Accounts:                                                      │
│   - config: ConfigPDA (read)                                     │
│   - epoch: EpochPDA(42) (mut)                                    │
│   - claim_receipt: ClaimReceiptPDA(42, wallet) (init, mut)       │
│   - vault: VaultPDA (mut)                                        │
│   - recipient: 5ZYW... (mut)                                     │
│   - payer: 5ZYW... (signer, mut)                                 │
│   - system_program: SystemProgram                                │
│                                                                   │
│   Data:                                                          │
│   - epoch_id: 42                                                 │
│   - points: 50000                                                │
│   - merkle_proof: [0x1a2b..., 0x7g8h..., ...]                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. USER SIGNS TRANSACTION                                        │
├──────────────────────────────────────────────────────────────────┤
│   - Phantom/Solflare wallet popup                                │
│   - User approves transaction                                    │
│   - Transaction signed with private key                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. SUBMIT TO SOLANA                                              │
├──────────────────────────────────────────────────────────────────┤
│   - Send transaction to RPC                                      │
│   - Wait for confirmation                                        │
│   - Typical time: 1-3 seconds                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. ON-CHAIN EXECUTION                                            │
├──────────────────────────────────────────────────────────────────┤
│   Program validates:                                             │
│   ✅ Epoch is Finalized                                          │
│   ✅ Merkle proof valid: verify(leaf, root, proof)               │
│   ✅ ClaimReceipt doesn't exist (no double-claim)                │
│   ✅ Vault has sufficient balance                                │
│                                                                   │
│   Program calculates reward:                                     │
│   reward = (50000 / 1000000) × 100 SOL = 5.0 SOL                │
│                                                                   │
│   Program executes:                                              │
│   1. Transfer 5.0 SOL from Vault → User wallet                   │
│   2. Create ClaimReceipt(epoch=42, wallet=5ZYW...)               │
│   3. Update epoch.total_claimed += 5.0 SOL                       │
│   4. Emit RewardClaimed event                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. CONFIRMATION & UI UPDATE                                      │
├──────────────────────────────────────────────────────────────────┤
│   ┌────────────────────────────────────────────────────────┐    │
│   │  ✅ Success! Claimed 5.0 SOL                           │    │
│   │                                                        │    │
│   │  Transaction: 5xYz3... (view on Solscan)              │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                   │
│   - Toast notification                                           │
│   - Update wallet balance                                        │
│   - Remove claimed epoch from list                               │
│   - Show in transaction history                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Points Accumulation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GAME PLAY → POINTS → REWARDS                     │
└─────────────────────────────────────────────────────────────────────┘

Player plays game
┌──────────────────────────────────────────────────────────────────┐
│ 1. GAME COMPLETES                                                │
├──────────────────────────────────────────────────────────────────┤
│   - Player finishes game session                                 │
│   - Final score: 12,500                                          │
│   - Time: 120 seconds                                            │
│   - Win condition: true                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. SUBMIT SCORE TO BACKEND                                       │
├──────────────────────────────────────────────────────────────────┤
│   POST /api/game/knighthood/record                               │
│   Headers:                                                       │
│   - X-Wallet: 5ZYW...                                            │
│                                                                   │
│   Body:                                                          │
│   {                                                              │
│     "score": 12500,                                              │
│     "meta": {                                                    │
│       "win": true,                                               │
│       "timeSec": 120,                                            │
│       "levelReached": 15                                         │
│     }                                                            │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. BACKEND VALIDATES & NORMALIZES                                │
├──────────────────────────────────────────────────────────────────┤
│   - Verify wallet signature (SIWS)                               │
│   - Validate score not impossible                                │
│   - Check rate limits (max 10 games/hour)                        │
│   - Normalize score based on game:                               │
│     * For time-based: (1 - time/cap) × 10000                     │
│     * For score-based: (score / max_score) × 10000               │
│   - Normalized score: 8,500 points                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. UPDATE BADGER DB (Atomic Transaction)                         │
├──────────────────────────────────────────────────────────────────┤
│   Check if new best score:                                       │
│   - Previous best: 10,000 points                                 │
│   - New score: 8,500 points                                      │
│   - Not a new best, delta = 0                                    │
│                                                                   │
│   Check daily bonus:                                             │
│   - Key: daily:knighthood:5zyw...:2025-10-30                     │
│   - Not exists → First game today!                               │
│   - Add +100 daily bonus                                         │
│                                                                   │
│   Update global points:                                          │
│   - Key: global:wallet:5zyw...:points                            │
│   - Previous: 45,000                                             │
│   - Delta: 0 (no new best) + 100 (daily) = +100                  │
│   - New total: 45,100 points                                     │
│                                                                   │
│   Update global leaderboard:                                     │
│   - Key: global:leaderboard                                      │
│   - Update entry for 5ZYW... with new total                      │
│   - Re-sort top 100                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. BROADCAST SSE EVENT                                           │
├──────────────────────────────────────────────────────────────────┤
│   Event: leaderboard_update                                      │
│   Data:                                                          │
│   {                                                              │
│     "game_id": "knighthood",                                     │
│     "wallet": "5ZYW...",                                         │
│     "delta_points": 100,                                         │
│     "new_global_points": 45100,                                  │
│     "rank": 42                                                   │
│   }                                                              │
│                                                                   │
│   - Frontend receives event                                      │
│   - Updates UI in real-time                                      │
│   - Shows "+100 points" animation                                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. POINTS ACCUMULATE UNTIL MIDNIGHT UTC                          │
├──────────────────────────────────────────────────────────────────┤
│   - Player continues playing                                     │
│   - Points keep accumulating                                     │
│   - Daily bonuses for first play per game                        │
│   - New best scores add delta points                             │
│                                                                   │
│   By end of day (23:59 UTC):                                     │
│   - Started with: 45,000 points                                  │
│   - Earned today: 5,000 points                                   │
│   - Ending total: 50,000 points                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. MIDNIGHT UTC - SNAPSHOT TAKEN                                 │
├──────────────────────────────────────────────────────────────────┤
│   - Scheduler reads: global:wallet:5zyw...:points = 50,000       │
│   - Added to merkle tree for epoch                               │
│   - Eligible for proportional share of 100 SOL                   │
│                                                                   │
│   If total points across all players = 1,000,000:                │
│   Reward = (50,000 / 1,000,000) × 100 = 5.0 SOL                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. PLAYER CLAIMS REWARD (Next Day)                               │
├──────────────────────────────────────────────────────────────────┤
│   - Visits rewards dashboard                                     │
│   - Sees "5.0 SOL claimable for yesterday"                       │
│   - Clicks claim                                                 │
│   - Receives 5.0 SOL in wallet                                   │
│   ✅ COMPLETE CYCLE                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM OVERVIEW                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Game Play   │  │  Leaderboard │  │   Rewards    │                  │
│  │     UI       │  │      UI      │  │  Dashboard   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                           │
│         └─────────────────┴──────────────────┘                           │
│                           │                                              │
│                           │ HTTP/WebSocket                               │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────┐
│                           │        BACKEND (Go)                          │
├───────────────────────────┼──────────────────────────────────────────────┤
│                           ↓                                              │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                      HTTP API Server                        │        │
│  │  /api/game/*  |  /api/rewards/*  |  /api/leaderboard/*      │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                           │                                              │
│           ┌───────────────┼───────────────┐                              │
│           ↓               ↓               ↓                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │    Game      │  │   Rewards    │  │  Leaderboard │                  │
│  │   Handler    │  │  Scheduler   │  │    Manager   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                           │
│         └─────────────────┴──────────────────┘                           │
│                           │                                              │
│                           ↓                                              │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    Badger DB (Local KV)                     │        │
│  │  - global:wallet:*:points                                   │        │
│  │  - global:leaderboard                                       │        │
│  │  - game:*:best                                              │        │
│  │  - merkle:epoch:*:tree (cached proofs)                      │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                           │                                              │
│                           │ RPC Calls                                    │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────┐
│                           │      SOLANA BLOCKCHAIN                       │
├───────────────────────────┼──────────────────────────────────────────────┤
│                           ↓                                              │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │              Rewards Program (Anchor/Rust)                  │        │
│  ├─────────────────────────────────────────────────────────────┤        │
│  │                                                             │        │
│  │  Instructions:                                              │        │
│  │  ├─ initialize_config                                       │        │
│  │  ├─ create_epoch                                            │        │
│  │  ├─ commit_epoch_points                                     │        │
│  │  ├─ finalize_epoch                                          │        │
│  │  ├─ fund_vault                                              │        │
│  │  └─ claim_reward ⭐ (user callable)                         │        │
│  │                                                             │        │
│  │  PDAs:                                                      │        │
│  │  ├─ GlobalConfig                                            │        │
│  │  ├─ RewardEpoch[epoch_id]                                   │        │
│  │  ├─ ClaimReceipt[epoch_id][wallet]                          │        │
│  │  └─ Vault                                                   │        │
│  │                                                             │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    Solana Runtime                           │        │
│  │  - Program execution                                        │        │
│  │  - Account storage                                          │        │
│  │  - Transaction processing                                   │        │
│  │  - Event emission                                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

                            ↓ (Optional)

┌──────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES (Optional)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  IPFS/Arweave    │  │  Helius Indexer  │  │   Monitoring     │      │
│  │                  │  │                  │  │                  │      │
│  │  Store epoch     │  │  Index events    │  │  Datadog/Grafana │      │
│  │  snapshots       │  │  & transactions  │  │  alerts & metrics│      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow - Merkle Proof Verification

```
┌─────────────────────────────────────────────────────────────────────┐
│               MERKLE PROOF VERIFICATION ON-CHAIN                    │
└─────────────────────────────────────────────────────────────────────┘

User submits claim with:
- wallet: 5ZYW...
- points: 50,000
- proof: [hash1, hash2, hash3]

┌──────────────────────────────────────────────────────────────────┐
│ 1. COMPUTE LEAF HASH                                             │
├──────────────────────────────────────────────────────────────────┤
│   Input:                                                         │
│   - wallet: 5ZYW...abcd (32 bytes)                               │
│   - points: 50000 (8 bytes, little-endian)                       │
│                                                                   │
│   Compute:                                                       │
│   leaf = keccak256(wallet || points)                             │
│   leaf = 0x9f8e7d...                                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. VERIFY MERKLE PROOF                                           │
├──────────────────────────────────────────────────────────────────┤
│   Start: current = leaf = 0x9f8e7d...                            │
│                                                                   │
│   Proof step 1:                                                  │
│   - Sibling: hash1 = 0x1a2b3c...                                 │
│   - Combine: current = keccak256(sort(current, hash1))           │
│   - current = 0x4d5e6f...                                        │
│                                                                   │
│   Proof step 2:                                                  │
│   - Sibling: hash2 = 0x7g8h9i...                                 │
│   - Combine: current = keccak256(sort(current, hash2))           │
│   - current = 0x2k3l4m...                                        │
│                                                                   │
│   Proof step 3:                                                  │
│   - Sibling: hash3 = 0xn5o6p7...                                 │
│   - Combine: current = keccak256(sort(current, hash3))           │
│   - current = 0xabcdef... (final root)                           │
│                                                                   │
│   Compare:                                                       │
│   - Computed root: 0xabcdef...                                   │
│   - Stored root: 0xabcdef... (from RewardEpoch)                  │
│   - Match: ✅ VALID                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. CALCULATE REWARD                                              │
├──────────────────────────────────────────────────────────────────┤
│   Formula:                                                       │
│   reward = (points × total_rewards) / total_points               │
│                                                                   │
│   Calculation:                                                   │
│   = (50,000 × 100,000,000,000) / 1,000,000                       │
│   = 5,000,000,000,000 / 1,000,000                                │
│   = 5,000,000,000 lamports                                       │
│   = 5.0 SOL                                                      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. TRANSFER REWARD                                               │
├──────────────────────────────────────────────────────────────────┤
│   From: Vault PDA (program-owned)                                │
│   To: User wallet (5ZYW...)                                      │
│   Amount: 5,000,000,000 lamports                                 │
│                                                                   │
│   Vault balance:                                                 │
│   - Before: 50,000,000,000 lamports (50 SOL)                     │
│   - After: 45,000,000,000 lamports (45 SOL)                      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. CREATE CLAIM RECEIPT                                          │
├──────────────────────────────────────────────────────────────────┤
│   ClaimReceipt PDA created at:                                   │
│   seeds: ["claim", epoch_id(42), wallet(5ZYW...)]                │
│                                                                   │
│   Data:                                                          │
│   - epoch_id: 42                                                 │
│   - wallet: 5ZYW...                                              │
│   - points: 50,000                                               │
│   - reward_amount: 5,000,000,000                                 │
│   - claimed_at: 1730332800                                       │
│                                                                   │
│   Purpose: Prevent double-claim (PDA already exists error)       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. EMIT EVENT                                                    │
├──────────────────────────────────────────────────────────────────┤
│   Event: RewardClaimed                                           │
│   Data:                                                          │
│   {                                                              │
│     epoch_id: 42,                                                │
│     wallet: "5ZYW...",                                           │
│     points: 50000,                                               │
│     reward_amount: 5000000000,                                   │
│     timestamp: 1730332800                                        │
│   }                                                              │
│                                                                   │
│   - Event stored on-chain in transaction logs                    │
│   - Indexers can listen and index                                │
│   - Frontend can subscribe and show notifications                │
└──────────────────────────────────────────────────────────────────┘

✅ CLAIM COMPLETE - User receives 5.0 SOL
```

---

## Key Takeaways

1. **Automated Daily Cycle**: Runs at midnight UTC without manual intervention
2. **Fair Distribution**: Proportional to points earned, cryptographically verified
3. **User-Friendly**: Simple claim UI, fast transactions (~3 seconds)
4. **Scalable**: Merkle proofs enable 10,000+ players without blockchain bloat
5. **Trustless**: No centralized control over reward distribution
6. **Auditable**: Full transparency via on-chain events and IPFS backups

---

**Ready to build?** Refer to `DAILY_REWARDS_PROGRAM_PLAN.md` for complete implementation details.


