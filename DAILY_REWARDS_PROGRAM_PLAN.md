# Daily Rewards Solana Program - Complete Plan

## Overview
A dedicated Solana program for distributing **$100 daily** to players based on their accumulated points from gaming activities. The program ensures fair, transparent, on-chain distribution with claim mechanics and audit trails.

---

## 1. Current System Analysis

### Points System (Backend - Go/Badger)
- **Points Storage**: `global:wallet:<WALLET>:points` (JSON float64)
- **Leaderboard**: `global:leaderboard` (top 100 players, sorted by points)
- **Daily Bonus**: +100 points per game per wallet per UTC day
- **Score Delta**: Points added when new best scores achieved
- **Games Integration**: Multiple games (Knighthood, Ninja, etc.) contribute points

### Current Gaps
- **No on-chain rewards distribution**
- **No automated daily payouts**
- **No provable fairness for reward calculations**
- **Off-chain point tracking only**

---

## 2. Goals

### Primary Objectives
1. **Daily Distribution**: Distribute $100 in SOL or SPL tokens every 24 hours
2. **Proportional Rewards**: Reward based on points earned in the 24-hour period
3. **On-chain Provability**: All distributions verifiable on Solana blockchain
4. **Automated & Trustless**: Minimal admin intervention after setup
5. **Anti-Gaming**: Prevent manipulation and ensure fair distribution

### Secondary Objectives
- Maintain compatibility with existing points system
- Support both SOL and SPL token rewards
- Enable claim-based distribution (users claim rewards)
- Provide full audit trail for compliance

---

## 3. Architecture

### Program Structure (Anchor Framework)

#### Program ID
```
Program: rewards (to be deployed)
Devnet: TBD
Mainnet: TBD
```

#### Seeds & PDAs
```rust
CONFIG_SEED = b"config"           // Global configuration
EPOCH_SEED = b"epoch"            // Daily reward epoch
CLAIM_SEED = b"claim"            // Individual claim receipt
VAULT_SEED = b"vault"            // SOL vault
```

---

## 4. On-Chain Accounts (PDAs)

### A. `GlobalConfig` PDA
**Seeds**: `["config"]`

**Fields**:
```rust
pub struct GlobalConfig {
    pub authority: Pubkey,           // Admin authority
    pub reward_mint: Option<Pubkey>, // SPL token mint (or SOL if None)
    pub daily_amount: u64,           // Amount in lamports or token base units
    pub epoch_duration_seconds: i64, // 86400 (24 hours)
    pub anchor_hour_utc: u8,         // Daily anchor time (0-23)
    pub anchor_minute_utc: u8,       // Anchor minute (0-59)
    pub last_epoch_id: u64,          // Incremental epoch counter
    pub vault_bump: u8,              // Vault PDA bump
    pub bump: u8,                    // Config PDA bump
}
```

**Size**: `32 + 33 + 8 + 8 + 1 + 1 + 8 + 1 + 1 = 93 bytes`

---

### B. `RewardEpoch` PDA
**Seeds**: `["epoch", epoch_id.to_le_bytes()]`

**Fields**:
```rust
pub struct RewardEpoch {
    pub epoch_id: u64,               // Unique epoch counter
    pub start_timestamp: i64,        // Unix timestamp start
    pub end_timestamp: i64,          // Unix timestamp end
    pub status: u8,                  // 0: Open, 1: Committed, 2: Finalized, 3: Expired
    pub total_points: u64,           // Sum of all player points in epoch
    pub players_count: u32,          // Number of eligible players
    pub points_merkle_root: [u8; 32], // Merkle root of (wallet, points) pairs
    pub total_rewards_lamports: u64, // Total rewards for this epoch
    pub total_claimed: u64,          // Running total claimed
    pub metadata_uri: [u8; 64],      // Optional IPFS/Arweave CID for full dataset
    pub bump: u8,
}
```

**Size**: `8 + 8 + 8 + 1 + 8 + 4 + 32 + 8 + 8 + 64 + 1 = 150 bytes`

**States**:
- **Open (0)**: Epoch active, points accumulating off-chain
- **Committed (1)**: Backend commits merkle root of points snapshot
- **Finalized (2)**: Ready for claims, vault funded
- **Expired (3)**: Claim window closed (optional)

---

### C. `ClaimReceipt` PDA
**Seeds**: `["claim", epoch_id.to_le_bytes(), wallet.as_ref()]`

**Fields**:
```rust
pub struct ClaimReceipt {
    pub epoch_id: u64,           // Epoch reference
    pub wallet: Pubkey,          // Claimant wallet
    pub points: u64,             // Points earned in epoch
    pub reward_amount: u64,      // Lamports/tokens claimed
    pub claimed_at: i64,         // Unix timestamp
    pub bump: u8,
}
```

**Size**: `8 + 32 + 8 + 8 + 8 + 1 = 65 bytes`

---

### D. `Vault` PDA
**Seeds**: `["vault"]`

A program-owned account holding SOL or an SPL token ATA for reward distribution.

---

## 5. Instructions

### Admin Instructions

#### 1. `initialize_config`
**Access**: Admin only (one-time setup)

**Parameters**:
```rust
pub struct InitializeConfig {
    daily_amount: u64,           // e.g., 100 * LAMPORTS_PER_SOL
    reward_mint: Option<Pubkey>, // None = SOL, Some = SPL token
    anchor_hour_utc: u8,         // e.g., 0 for midnight UTC
    anchor_minute_utc: u8,
}
```

**Logic**:
- Initialize `GlobalConfig` PDA
- Create `Vault` PDA
- Set authority to signer

**Accounts**:
- `config` (init, mut, PDA)
- `vault` (init, mut, PDA)
- `authority` (signer, mut, payer)
- `system_program`

---

#### 2. `update_config`
**Access**: Admin only

**Parameters**: Same as `initialize_config`

**Logic**: Update global configuration (daily amount, anchor time, etc.)

**Accounts**:
- `config` (mut, PDA)
- `authority` (signer, must match config.authority)

---

#### 3. `create_epoch`
**Access**: Admin or automated backend

**Parameters**:
```rust
pub struct CreateEpoch {
    start_timestamp: i64,  // Epoch start (unix timestamp)
    end_timestamp: i64,    // Epoch end (unix timestamp)
}
```

**Logic**:
- Create new `RewardEpoch` PDA with incremented `epoch_id`
- Set status to Open (0)
- Initialize fields

**Accounts**:
- `config` (mut, PDA)
- `epoch` (init, mut, PDA with epoch_id seed)
- `authority` (signer, mut, payer)
- `system_program`

**Validation**:
- `start_timestamp < end_timestamp`
- No overlapping active epochs

---

#### 4. `commit_epoch_points`
**Access**: Admin or automated backend

**Parameters**:
```rust
pub struct CommitEpochPoints {
    epoch_id: u64,
    points_merkle_root: [u8; 32],
    total_points: u64,
    players_count: u32,
    metadata_uri: Option<String>,  // IPFS CID
}
```

**Logic**:
- Transition epoch from Open (0) → Committed (1)
- Store merkle root of all (wallet, points) pairs
- Record total points and player count for reward calculation

**Accounts**:
- `epoch` (mut, PDA)
- `authority` (signer)

**Validation**:
- Epoch must be in Open state
- `total_points > 0`
- `players_count > 0`

---

#### 5. `finalize_epoch`
**Access**: Admin or automated backend

**Parameters**:
```rust
pub struct FinalizeEpoch {
    epoch_id: u64,
}
```

**Logic**:
- Transition epoch from Committed (1) → Finalized (2)
- Lock in rewards: `epoch.total_rewards_lamports = config.daily_amount`
- Enable claims

**Accounts**:
- `config` (PDA)
- `epoch` (mut, PDA)
- `authority` (signer)

**Validation**:
- Epoch must be in Committed state
- Merkle root must be set

---

#### 6. `fund_vault`
**Access**: Anyone (typically admin)

**Parameters**:
```rust
pub struct FundVault {
    amount: u64,
}
```

**Logic**:
- Transfer SOL or SPL tokens to vault
- For SOL: `system_program::transfer`
- For SPL: `token::transfer`

**Accounts**:
- `config` (PDA)
- `vault` (mut, PDA)
- `funder` (signer, mut)
- `system_program` or `token_program`

---

### User Instructions

#### 7. `claim_reward`
**Access**: Any eligible player

**Parameters**:
```rust
pub struct ClaimReward {
    epoch_id: u64,
    points: u64,
    merkle_proof: Vec<[u8; 32]>,  // Max 20-32 proof nodes
}
```

**Logic**:
1. Verify merkle proof: `hash(wallet || points)` against `epoch.points_merkle_root`
2. Calculate reward: `reward = (points / epoch.total_points) * epoch.total_rewards_lamports`
3. Transfer reward from vault to user
4. Create `ClaimReceipt` to prevent double-claims
5. Update `epoch.total_claimed`

**Accounts**:
- `config` (PDA)
- `epoch` (mut, PDA)
- `claim_receipt` (init, mut, PDA)
- `vault` (mut, PDA)
- `recipient` (mut, user wallet)
- `payer` (signer, mut, pays for receipt account rent)
- `system_program`

**Validation**:
- Epoch must be Finalized
- Merkle proof valid
- `claim_receipt` must not exist (no double-claim)
- `vault.balance >= reward_amount`
- `epoch.total_claimed + reward <= epoch.total_rewards_lamports`

**Events**:
```rust
#[event]
pub struct RewardClaimed {
    epoch_id: u64,
    wallet: Pubkey,
    points: u64,
    reward_amount: u64,
    timestamp: i64,
}
```

---

## 6. Reward Calculation

### Formula (On-Chain)
```rust
// Proportional distribution
reward_amount = (user_points * epoch.total_rewards_lamports) / epoch.total_points

// Example:
// Total rewards: 100 SOL (100_000_000_000 lamports)
// Total points: 1,000,000
// User points: 25,000
// User reward: (25,000 * 100_000_000_000) / 1,000,000 = 2.5 SOL
```

### Precision
- Use u64 arithmetic with checked operations
- Avoid overflow: `user_points.checked_mul(total_rewards).checked_div(total_points)`
- Minimum claim: 1 lamport (configurable via config)

### Rounding
- Truncate fractional lamports (floor)
- Dust accumulates in vault for future epochs

---

## 7. Merkle Tree Construction (Off-Chain)

### Backend Process

**Daily Snapshot** (at epoch end):
```typescript
// 1. Query all players from Badger at epoch end
const players: Array<{wallet: string, points: number}> = 
  await db.getAllPlayersInEpoch(epochId);

// 2. Filter minimum threshold (optional: min 100 points)
const eligible = players.filter(p => p.points >= 100);

// 3. Sort by wallet address (deterministic order)
eligible.sort((a, b) => a.wallet.localeCompare(b.wallet));

// 4. Create leaves
const leaves = eligible.map(p => 
  keccak256(Buffer.concat([
    new PublicKey(p.wallet).toBuffer(),
    Buffer.from(new BigNumber(p.points).toArray('le', 8))
  ]))
);

// 5. Build Merkle tree (keccak256)
const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
const root = tree.getRoot();

// 6. Store tree for proof generation
await storeTree(epochId, tree, eligible);

// 7. Commit root on-chain
await program.methods.commitEpochPoints(
  new BN(epochId),
  root,
  totalPoints,
  eligible.length,
  ipfsCid  // optional
).rpc();
```

### Proof Generation API
```typescript
// GET /api/rewards/epoch/{epochId}/proof/{wallet}
async function getProof(epochId: number, wallet: string) {
  const tree = await loadTree(epochId);
  const player = await getPlayerData(epochId, wallet);
  
  if (!player) {
    return {error: "Not eligible"};
  }
  
  const leaf = keccak256(Buffer.concat([
    new PublicKey(wallet).toBuffer(),
    Buffer.from(new BigNumber(player.points).toArray('le', 8))
  ]));
  
  const proof = tree.getProof(leaf).map(p => p.data);
  
  return {
    epoch_id: epochId,
    wallet: wallet,
    points: player.points,
    proof: proof,
    root: tree.getRoot().toString('hex')
  };
}
```

---

## 8. Backend Integration

### Daily Automation (Scheduler)

**Cron Job** (runs every 24 hours at anchor time):

```go
// backend/internal/scheduler/rewards_scheduler.go

type RewardsScheduler struct {
    cfg *config.Config
    db *store.KV
    solanaClient *rpc.Client
    program *ProgramClient
}

func (s *RewardsScheduler) RunDaily() {
    now := time.Now().UTC()
    
    // 1. Close previous epoch (collect points snapshot)
    prevEpoch := s.getCurrentEpoch()
    snapshot := s.collectPointsSnapshot(prevEpoch.StartTime, now)
    
    // 2. Build merkle tree
    tree, totalPoints := s.buildMerkleTree(snapshot)
    
    // 3. Commit points on-chain
    tx := s.program.CommitEpochPoints(
        prevEpoch.ID,
        tree.Root(),
        totalPoints,
        len(snapshot),
        "" // or IPFS CID
    )
    
    // 4. Finalize epoch
    s.program.FinalizeEpoch(prevEpoch.ID)
    
    // 5. Create new epoch
    nextEpoch := s.program.CreateEpoch(
        now.Unix(),
        now.Add(24 * time.Hour).Unix(),
    )
    
    // 6. Reset daily point accumulators (optional)
    // Keep global points, but track daily deltas separately
    
    log.Info().
        Uint64("epoch_id", prevEpoch.ID).
        Uint64("total_points", totalPoints).
        Int("players", len(snapshot)).
        Msg("Daily rewards epoch finalized")
}

func (s *RewardsScheduler) collectPointsSnapshot(start, end time.Time) []PlayerPoints {
    // Query Badger for all players
    // Calculate points earned in [start, end) window
    
    var snapshot []PlayerPoints
    prefix := []byte("global:wallet:")
    
    err := s.db.View(func(txn *badger.Txn) error {
        it := txn.NewIterator(badger.DefaultIteratorOptions)
        defer it.Close()
        
        for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
            item := it.Item()
            key := string(item.Key())
            
            if !strings.HasSuffix(key, ":points") {
                continue
            }
            
            var points float64
            item.Value(func(val []byte) error {
                return json.Unmarshal(val, &points)
            })
            
            // Extract wallet from key
            wallet := extractWallet(key)
            
            snapshot = append(snapshot, PlayerPoints{
                Wallet: wallet,
                Points: uint64(points),
            })
        }
        
        return nil
    })
    
    return snapshot
}
```

---

### New API Endpoints

```go
// GET /api/rewards/status
// Returns current and recent epochs
func (s *Server) handleRewardsStatus(w http.ResponseWriter, r *http.Request) {
    config := s.solanaClient.GetGlobalConfig()
    currentEpoch := s.solanaClient.GetCurrentEpoch()
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "daily_amount": config.DailyAmount,
        "current_epoch": currentEpoch,
        "next_distribution": calculateNextDistribution(config),
    })
}

// GET /api/rewards/epoch/{epochId}
// Returns epoch details
func (s *Server) handleGetEpoch(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    epochId := vars["epochId"]
    
    epoch := s.solanaClient.GetEpoch(epochId)
    
    json.NewEncoder(w).Encode(epoch)
}

// GET /api/rewards/epoch/{epochId}/proof/{wallet}
// Returns merkle proof for claim
func (s *Server) handleGetProof(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    epochId := vars["epochId"]
    wallet := vars["wallet"]
    
    proof := s.getProofFromCache(epochId, wallet)
    
    if proof == nil {
        http.Error(w, "Not eligible or epoch not found", 404)
        return
    }
    
    json.NewEncoder(w).Encode(proof)
}

// GET /api/rewards/wallet/{wallet}/claimable
// Returns all claimable epochs for wallet
func (s *Server) handleGetClaimable(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    wallet := vars["wallet"]
    
    epochs := s.getClaimableEpochs(wallet)
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "wallet": wallet,
        "claimable_epochs": epochs,
    })
}

// POST /api/rewards/claim
// Submit claim transaction (or return unsigned tx for client)
func (s *Server) handleClaim(w http.ResponseWriter, r *http.Request) {
    var req struct {
        EpochID uint64 `json:"epoch_id"`
        Wallet  string `json:"wallet"`
    }
    
    json.NewDecoder(r.Body).Decode(&req)
    
    // Get proof
    proof := s.getProofFromCache(req.EpochID, req.Wallet)
    
    // Build unsigned transaction
    tx := s.program.BuildClaimTx(req.EpochID, req.Wallet, proof)
    
    // Return for client to sign
    json.NewEncoder(w).Encode(map[string]interface{}{
        "transaction": tx.Serialize(),
        "instructions": tx.Instructions,
    })
}
```

---

## 9. Frontend Integration

### Claim UI Component

```typescript
// frontend/components/RewardsClaim.tsx

export function RewardsClaim({ wallet }: { wallet: PublicKey }) {
  const [claimable, setClaimable] = useState<ClaimableEpoch[]>([]);
  const [claiming, setClaiming] = useState(false);
  
  useEffect(() => {
    fetchClaimable();
  }, [wallet]);
  
  async function fetchClaimable() {
    const res = await fetch(`/api/rewards/wallet/${wallet}/claimable`);
    const data = await res.json();
    setClaimable(data.claimable_epochs);
  }
  
  async function claimReward(epochId: number) {
    setClaiming(true);
    
    try {
      // 1. Fetch proof
      const proofRes = await fetch(`/api/rewards/epoch/${epochId}/proof/${wallet}`);
      const { points, proof } = await proofRes.json();
      
      // 2. Build claim instruction
      const ix = await program.methods
        .claimReward(
          new BN(epochId),
          new BN(points),
          proof
        )
        .accounts({
          config: configPDA,
          epoch: getEpochPDA(epochId),
          claimReceipt: getClaimReceiptPDA(epochId, wallet),
          vault: vaultPDA,
          recipient: wallet,
          payer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      // 3. Send transaction
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig);
      
      toast.success(`Claimed ${formatReward(points)} SOL!`);
      fetchClaimable(); // Refresh
      
    } catch (err) {
      console.error(err);
      toast.error("Claim failed");
    } finally {
      setClaiming(false);
    }
  }
  
  return (
    <div className="rewards-claim">
      <h2>Daily Rewards</h2>
      {claimable.length === 0 ? (
        <p>No rewards to claim</p>
      ) : (
        claimable.map(epoch => (
          <div key={epoch.epoch_id} className="epoch-card">
            <div>Epoch #{epoch.epoch_id}</div>
            <div>Points: {epoch.points.toLocaleString()}</div>
            <div>Reward: {epoch.estimated_reward} SOL</div>
            <button 
              onClick={() => claimReward(epoch.epoch_id)}
              disabled={claiming}
            >
              Claim
            </button>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## 10. Security Considerations

### Anti-Gaming Measures
1. **Minimum Points Threshold**: Require minimum 100 points to be eligible
2. **Rate Limiting**: Backend enforces game play rate limits
3. **Wallet Verification**: SIWS authentication required
4. **Sybil Resistance**: Consider wallet age, transaction history filters
5. **Score Validation**: Server-side score validation (already in place)

### On-Chain Security
1. **No Double Claims**: `ClaimReceipt` PDA prevents re-claiming same epoch
2. **Merkle Verification**: Cryptographic proof of eligibility
3. **Authority Controls**: Admin instructions restricted to config authority
4. **Vault Safety**: Program-owned vault, no external drains
5. **Overflow Protection**: All arithmetic uses checked operations

### Audit Trail
1. **On-chain Events**: Every claim emits `RewardClaimed` event
2. **Metadata URI**: Store full points dataset on IPFS/Arweave
3. **Indexer**: Use Helius/Triton to index all reward events
4. **Backend Logs**: Store epoch snapshots and proofs

---

## 11. Gas & Economics

### Transaction Costs

| Operation | Approx Cost (SOL) | Who Pays |
|-----------|-------------------|----------|
| Initialize Config | ~0.002 | Admin |
| Create Epoch | ~0.002 | Admin/Backend |
| Commit Points | ~0.0001 | Admin/Backend |
| Finalize Epoch | ~0.0001 | Admin/Backend |
| Fund Vault | ~0.0001 | Admin |
| **Claim Reward** | **~0.003** | **User (payer) or Relayer** |

### Vault Funding
- **Daily Requirement**: 100 SOL (or 100 USDC equivalent)
- **Buffer**: Maintain 700-1000 SOL for weekly runway
- **Auto-refill**: Alert when vault < 300 SOL

### Claim Subsidization (Optional)
**Backend Relayer** pays rent for ClaimReceipt:
- User provides signature
- Backend submits transaction and pays ~0.003 SOL
- Improves UX (gasless claims)

---

## 12. Testing Strategy

### Unit Tests (Anchor)
```bash
# tests/rewards.ts

describe("Rewards Program", () => {
  
  it("initializes config", async () => {
    await program.methods.initializeConfig(...).rpc();
    const config = await program.account.globalConfig.fetch(configPDA);
    expect(config.dailyAmount.toNumber()).to.equal(100_000_000_000);
  });
  
  it("creates epoch", async () => {
    await program.methods.createEpoch(...).rpc();
    const epoch = await program.account.rewardEpoch.fetch(epochPDA);
    expect(epoch.status).to.equal(0); // Open
  });
  
  it("commits points and finalizes", async () => {
    // Build test merkle tree
    const { root, totalPoints } = buildTestTree();
    
    await program.methods.commitEpochPoints(epochId, root, totalPoints, 10, "").rpc();
    await program.methods.finalizeEpoch(epochId).rpc();
    
    const epoch = await program.account.rewardEpoch.fetch(epochPDA);
    expect(epoch.status).to.equal(2); // Finalized
  });
  
  it("allows valid claim", async () => {
    const proof = getProofForWallet(wallet1);
    
    await program.methods.claimReward(epochId, points, proof)
      .accounts({...})
      .rpc();
    
    const receipt = await program.account.claimReceipt.fetch(receiptPDA);
    expect(receipt.rewardAmount.toNumber()).to.be.greaterThan(0);
  });
  
  it("prevents double claim", async () => {
    await expect(
      program.methods.claimReward(epochId, points, proof).rpc()
    ).to.be.rejectedWith("already exists");
  });
  
  it("rejects invalid merkle proof", async () => {
    const badProof = [[0; 32]];
    
    await expect(
      program.methods.claimReward(epochId, points, badProof).rpc()
    ).to.be.rejectedWith("MerkleVerificationFailed");
  });
  
});
```

### Integration Tests
1. **Full Daily Cycle**: Create epoch → Commit → Finalize → Multiple claims
2. **Backend Integration**: Mock Badger DB, test snapshot collection
3. **Merkle Tree**: Validate proof generation for 1000+ players
4. **Vault Depletion**: Test behavior when vault insufficient

---

## 13. Deployment Plan

### Phase 1: Program Deployment (Week 1)
- [ ] Implement Anchor program (6 instructions)
- [ ] Write unit tests (80% coverage)
- [ ] Deploy to Devnet
- [ ] Test epoch lifecycle manually
- [ ] Audit merkle verification logic

### Phase 2: Backend Integration (Week 2)
- [ ] Implement merkle tree builder
- [ ] Add rewards scheduler (cron)
- [ ] Create API endpoints (4 new routes)
- [ ] Implement proof caching (Redis/Badger)
- [ ] Test snapshot collection from live DB

### Phase 3: Frontend (Week 3)
- [ ] Build RewardsClaim component
- [ ] Add rewards dashboard page
- [ ] Display claimable epochs
- [ ] Integrate wallet claim flow
- [ ] Add notifications for new epochs

### Phase 4: Mainnet Launch (Week 4)
- [ ] Security audit (internal)
- [ ] Load testing (1000 concurrent claims)
- [ ] Deploy program to Mainnet
- [ ] Fund vault with 1000 SOL buffer
- [ ] Enable automated scheduler
- [ ] Monitor first 7 daily cycles

---

## 14. Operations

### Daily Monitoring
- **Vault Balance**: Alert if < 300 SOL
- **Epoch Status**: Verify daily epoch created and finalized
- **Claim Rate**: Track % of eligible players claiming
- **Failed Claims**: Monitor and investigate rejections

### Alerts
```yaml
alerts:
  - name: vault_low_balance
    condition: vault.balance < 300 SOL
    action: notify_admin, auto_refill
    
  - name: epoch_not_finalized
    condition: epoch.status != Finalized after 1 hour
    action: investigate, manual_finalize
    
  - name: claim_failure_rate_high
    condition: failed_claims / total_claims > 0.1
    action: investigate_merkle_proofs
```

### Maintenance
- **Weekly**: Review claim patterns, audit trails
- **Monthly**: Reconcile vault balances, points totals
- **Quarterly**: Program upgrades (if needed via authority)

---

## 15. Future Enhancements

### V2 Features
1. **Tiered Rewards**: Higher rewards for top 10, 50, 100
2. **Bonus Multipliers**: Streak bonuses for consecutive days
3. **Token Staking**: Boost rewards by staking project tokens
4. **Retroactive Claims**: Extend claim window to 30 days
5. **SPL Token Support**: Distribute custom project tokens

### Optimizations
1. **Compressed Claims**: Use ZK proofs or compression for cheaper claims
2. **Batch Claims**: Allow claiming multiple epochs in one tx
3. **Auto-Claim**: Backend auto-claims for small amounts

---

## 16. Cost Estimate

### Development
- **Program Development**: 40 hours @ $150/hr = $6,000
- **Backend Integration**: 30 hours @ $150/hr = $4,500
- **Frontend**: 20 hours @ $150/hr = $3,000
- **Testing & QA**: 20 hours @ $150/hr = $3,000
- **Total Development**: **$16,500**

### Monthly Operations
- **Daily Rewards**: 100 SOL × 30 days = **3,000 SOL/month** (~$600,000 @ $200/SOL)
- **Gas Costs**: ~300 claims/day × 0.003 SOL × 30 = **27 SOL/month** (~$5,400)
- **Infrastructure**: Indexer, RPC, storage = **$500/month**
- **Total Operations**: **~$606,000/month**

**Note**: The $100 daily distribution is the core cost. Implementation is ~$16.5k one-time.

---

## 17. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vault depletion | Medium | High | Auto-refill alerts, 7-day buffer |
| Merkle tree errors | Low | High | Comprehensive testing, audit |
| Gaming/cheating | Medium | Medium | Rate limits, score validation |
| Smart contract bug | Low | Critical | Audit, gradual rollout |
| Backend failure | Low | Medium | Redundancy, manual fallback |
| Low claim rate | Medium | Low | UX improvements, notifications |

---

## 18. Success Metrics

### KPIs (90 days)
- **Claim Rate**: >60% of eligible players claim within 48h
- **Total Distributed**: 9,000 SOL (100 SOL × 90 days)
- **Unique Claimants**: >500 wallets
- **Failed Claims**: <5%
- **Vault Uptime**: 99.9%

---

## 19. Appendix

### A. Merkle Leaf Format
```rust
// Keccak256(wallet || points)
let mut data = Vec::new();
data.extend_from_slice(wallet.as_ref()); // 32 bytes
data.extend_from_slice(&points.to_le_bytes()); // 8 bytes
let leaf = keccak256(&data); // 32 bytes
```

### B. Sample API Responses

**GET /api/rewards/status**
```json
{
  "daily_amount": 100000000000,
  "current_epoch": {
    "epoch_id": 42,
    "start_timestamp": 1730246400,
    "end_timestamp": 1730332800,
    "status": "Open",
    "players_count": 0
  },
  "next_distribution": "2025-10-31T00:00:00Z"
}
```

**GET /api/rewards/epoch/42/proof/5ZYW...**
```json
{
  "epoch_id": 42,
  "wallet": "5ZYW...",
  "points": 125000,
  "proof": [
    "0x1a2b3c...",
    "0x4d5e6f...",
    "..."
  ],
  "root": "0xabcdef...",
  "estimated_reward": 2.5
}
```

---

## 20. Summary

This plan delivers a **fully automated, on-chain daily rewards system** that:

✅ **Distributes $100 daily** to players proportionally based on points  
✅ **Trustless & Verifiable** via Solana blockchain + merkle proofs  
✅ **Integrates seamlessly** with existing backend points system  
✅ **User-friendly claims** via frontend UI  
✅ **Production-ready** with monitoring, alerts, and security  

**Timeline**: 4 weeks from start to mainnet launch  
**Cost**: ~$16.5k development + $100/day ongoing rewards  

---

**Next Steps**:
1. Review and approve plan
2. Begin Anchor program development
3. Set up devnet testing environment
4. Implement backend scheduler
5. Deploy to mainnet

**Questions or modifications?** This plan is flexible and can be adjusted based on specific requirements or constraints.


