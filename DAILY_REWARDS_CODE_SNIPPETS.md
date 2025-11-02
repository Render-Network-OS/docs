# Daily Rewards - Implementation Code Snippets

Quick-start code examples for implementing the daily rewards system.

---

## 1. Anchor Program - Core Structs

```rust
// programs/rewards/src/lib.rs

use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

declare_id!("REWARD11111111111111111111111111111111111111");

const CONFIG_SEED: &[u8] = b"config";
const EPOCH_SEED: &[u8] = b"epoch";
const CLAIM_SEED: &[u8] = b"claim";
const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod rewards {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        daily_amount: u64,
        reward_mint: Option<Pubkey>,
        anchor_hour_utc: u8,
        anchor_minute_utc: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.reward_mint = reward_mint;
        config.daily_amount = daily_amount;
        config.epoch_duration_seconds = 86400; // 24 hours
        config.anchor_hour_utc = anchor_hour_utc;
        config.anchor_minute_utc = anchor_minute_utc;
        config.last_epoch_id = 0;
        config.vault_bump = ctx.bumps.vault;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn create_epoch(
        ctx: Context<CreateEpoch>,
        start_timestamp: i64,
        end_timestamp: i64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let epoch = &mut ctx.accounts.epoch;
        
        require!(
            start_timestamp < end_timestamp,
            ErrorCode::InvalidTimestamps
        );
        
        config.last_epoch_id = config.last_epoch_id.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        epoch.epoch_id = config.last_epoch_id;
        epoch.start_timestamp = start_timestamp;
        epoch.end_timestamp = end_timestamp;
        epoch.status = 0; // Open
        epoch.total_points = 0;
        epoch.players_count = 0;
        epoch.points_merkle_root = [0; 32];
        epoch.total_rewards_lamports = 0;
        epoch.total_claimed = 0;
        epoch.metadata_uri = [0; 64];
        epoch.bump = ctx.bumps.epoch;
        
        Ok(())
    }

    pub fn commit_epoch_points(
        ctx: Context<CommitEpochPoints>,
        merkle_root: [u8; 32],
        total_points: u64,
        players_count: u32,
        metadata_uri: Option<String>,
    ) -> Result<()> {
        let epoch = &mut ctx.accounts.epoch;
        
        require!(epoch.status == 0, ErrorCode::InvalidState);
        require!(total_points > 0, ErrorCode::InvalidTotalPoints);
        require!(players_count > 0, ErrorCode::InvalidPlayersCount);
        
        epoch.points_merkle_root = merkle_root;
        epoch.total_points = total_points;
        epoch.players_count = players_count;
        epoch.status = 1; // Committed
        
        if let Some(uri) = metadata_uri {
            let bytes = uri.as_bytes();
            let len = bytes.len().min(64);
            epoch.metadata_uri[..len].copy_from_slice(&bytes[..len]);
        }
        
        Ok(())
    }

    pub fn finalize_epoch(ctx: Context<FinalizeEpoch>) -> Result<()> {
        let config = &ctx.accounts.config;
        let epoch = &mut ctx.accounts.epoch;
        
        require!(epoch.status == 1, ErrorCode::InvalidState);
        require!(epoch.points_merkle_root != [0; 32], ErrorCode::MerkleRootNotSet);
        
        epoch.total_rewards_lamports = config.daily_amount;
        epoch.status = 2; // Finalized
        
        Ok(())
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        points: u64,
        merkle_proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        let epoch = &mut ctx.accounts.epoch;
        let vault = &mut ctx.accounts.vault;
        let recipient = &mut ctx.accounts.recipient;
        let receipt = &mut ctx.accounts.claim_receipt;
        
        require!(epoch.status == 2, ErrorCode::EpochNotFinalized);
        require!(merkle_proof.len() <= 32, ErrorCode::ProofTooLarge);
        
        // Verify merkle proof
        let leaf = compute_leaf(recipient.key(), points);
        require!(
            verify_merkle_proof(&leaf, &epoch.points_merkle_root, &merkle_proof),
            ErrorCode::InvalidMerkleProof
        );
        
        // Calculate reward (checked arithmetic)
        let reward_amount = (points as u128)
            .checked_mul(epoch.total_rewards_lamports as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(epoch.total_points as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            as u64;
        
        require!(reward_amount > 0, ErrorCode::RewardTooSmall);
        
        // Check vault balance
        let vault_balance = vault.to_account_info().lamports();
        require!(vault_balance >= reward_amount, ErrorCode::InsufficientVaultBalance);
        
        // Transfer from vault to recipient
        **vault.to_account_info().try_borrow_mut_lamports()? -= reward_amount;
        **recipient.to_account_info().try_borrow_mut_lamports()? += reward_amount;
        
        // Update epoch totals
        epoch.total_claimed = epoch.total_claimed
            .checked_add(reward_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Create claim receipt
        let clock = Clock::get()?;
        receipt.epoch_id = epoch.epoch_id;
        receipt.wallet = recipient.key();
        receipt.points = points;
        receipt.reward_amount = reward_amount;
        receipt.claimed_at = clock.unix_timestamp;
        receipt.bump = ctx.bumps.claim_receipt;
        
        // Emit event
        emit!(RewardClaimed {
            epoch_id: epoch.epoch_id,
            wallet: recipient.key(),
            points,
            reward_amount,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }
}

// Helper functions
fn compute_leaf(wallet: &Pubkey, points: u64) -> [u8; 32] {
    let mut data = Vec::new();
    data.extend_from_slice(wallet.as_ref());
    data.extend_from_slice(&points.to_le_bytes());
    keccak::hash(&data).to_bytes()
}

fn verify_merkle_proof(leaf: &[u8; 32], root: &[u8; 32], proof: &[[u8; 32]]) -> bool {
    if proof.is_empty() {
        return leaf == root;
    }
    
    let mut current = *leaf;
    for sibling in proof {
        current = if current <= *sibling {
            keccak::hashv(&[&current, sibling]).to_bytes()
        } else {
            keccak::hashv(&[sibling, &current]).to_bytes()
        };
    }
    
    &current == root
}

#[account]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub reward_mint: Option<Pubkey>,
    pub daily_amount: u64,
    pub epoch_duration_seconds: i64,
    pub anchor_hour_utc: u8,
    pub anchor_minute_utc: u8,
    pub last_epoch_id: u64,
    pub vault_bump: u8,
    pub bump: u8,
}

impl GlobalConfig {
    pub const SIZE: usize = 32 + 33 + 8 + 8 + 1 + 1 + 8 + 1 + 1;
}

#[account]
pub struct RewardEpoch {
    pub epoch_id: u64,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub status: u8,
    pub total_points: u64,
    pub players_count: u32,
    pub points_merkle_root: [u8; 32],
    pub total_rewards_lamports: u64,
    pub total_claimed: u64,
    pub metadata_uri: [u8; 64],
    pub bump: u8,
}

impl RewardEpoch {
    pub const SIZE: usize = 8 + 8 + 8 + 1 + 8 + 4 + 32 + 8 + 8 + 64 + 1;
}

#[account]
pub struct ClaimReceipt {
    pub epoch_id: u64,
    pub wallet: Pubkey,
    pub points: u64,
    pub reward_amount: u64,
    pub claimed_at: i64,
    pub bump: u8,
}

impl ClaimReceipt {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1;
}

#[event]
pub struct RewardClaimed {
    pub epoch_id: u64,
    pub wallet: Pubkey,
    pub points: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid timestamps")]
    InvalidTimestamps,
    #[msg("Invalid state for operation")]
    InvalidState,
    #[msg("Total points must be greater than zero")]
    InvalidTotalPoints,
    #[msg("Players count must be greater than zero")]
    InvalidPlayersCount,
    #[msg("Merkle root not set")]
    MerkleRootNotSet,
    #[msg("Epoch not finalized")]
    EpochNotFinalized,
    #[msg("Invalid merkle proof")]
    InvalidMerkleProof,
    #[msg("Proof too large")]
    ProofTooLarge,
    #[msg("Reward amount too small")]
    RewardTooSmall,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
```

---

## 2. Backend - Merkle Tree Builder

```go
// backend/internal/rewards/merkle.go

package rewards

import (
    "crypto/sha256"
    "encoding/binary"
    "sort"
    
    "github.com/gagliardetto/solana-go"
    "golang.org/x/crypto/sha3"
)

type PlayerPoints struct {
    Wallet string
    Points uint64
}

type MerkleTree struct {
    Leaves [][32]byte
    Nodes  [][][32]byte
    Root   [32]byte
}

func BuildMerkleTree(players []PlayerPoints) (*MerkleTree, error) {
    // Sort by wallet address for determinism
    sort.Slice(players, func(i, j int) bool {
        return players[i].Wallet < players[j].Wallet
    })
    
    // Create leaves
    leaves := make([][32]byte, len(players))
    for i, p := range players {
        leaves[i] = computeLeaf(p.Wallet, p.Points)
    }
    
    // Build tree
    tree := &MerkleTree{
        Leaves: leaves,
        Nodes:  make([][][32]byte, 0),
    }
    
    currentLevel := leaves
    for len(currentLevel) > 1 {
        tree.Nodes = append(tree.Nodes, currentLevel)
        currentLevel = buildNextLevel(currentLevel)
    }
    
    if len(currentLevel) > 0 {
        tree.Root = currentLevel[0]
    }
    
    return tree, nil
}

func computeLeaf(wallet string, points uint64) [32]byte {
    pubkey := solana.MustPublicKeyFromBase58(wallet)
    
    data := make([]byte, 32+8)
    copy(data[0:32], pubkey[:])
    binary.LittleEndian.PutUint64(data[32:40], points)
    
    return keccak256(data)
}

func buildNextLevel(level [][32]byte) [][32]byte {
    nextLevel := make([][32]byte, 0)
    
    for i := 0; i < len(level); i += 2 {
        if i+1 < len(level) {
            // Pair exists
            left := level[i]
            right := level[i+1]
            parent := hashPair(left, right)
            nextLevel = append(nextLevel, parent)
        } else {
            // Odd one out, promote to next level
            nextLevel = append(nextLevel, level[i])
        }
    }
    
    return nextLevel
}

func hashPair(left, right [32]byte) [32]byte {
    // Sort to ensure deterministic ordering
    if bytesLessThan(left[:], right[:]) {
        data := append(left[:], right[:]...)
        return keccak256(data)
    } else {
        data := append(right[:], left[:]...)
        return keccak256(data)
    }
}

func keccak256(data []byte) [32]byte {
    hasher := sha3.NewLegacyKeccak256()
    hasher.Write(data)
    var result [32]byte
    copy(result[:], hasher.Sum(nil))
    return result
}

func bytesLessThan(a, b []byte) bool {
    for i := 0; i < len(a) && i < len(b); i++ {
        if a[i] < b[i] {
            return true
        } else if a[i] > b[i] {
            return false
        }
    }
    return len(a) < len(b)
}

// GetProof returns the merkle proof for a specific wallet
func (t *MerkleTree) GetProof(wallet string, points uint64) ([][32]byte, error) {
    leaf := computeLeaf(wallet, points)
    
    // Find leaf index
    leafIndex := -1
    for i, l := range t.Leaves {
        if l == leaf {
            leafIndex = i
            break
        }
    }
    
    if leafIndex == -1 {
        return nil, fmt.Errorf("leaf not found in tree")
    }
    
    proof := make([][32]byte, 0)
    currentIndex := leafIndex
    
    for _, level := range t.Nodes {
        // Get sibling
        var sibling [32]byte
        if currentIndex%2 == 0 {
            // Left child, sibling is right
            if currentIndex+1 < len(level) {
                sibling = level[currentIndex+1]
            } else {
                // No sibling (odd one out)
                currentIndex /= 2
                continue
            }
        } else {
            // Right child, sibling is left
            sibling = level[currentIndex-1]
        }
        
        proof = append(proof, sibling)
        currentIndex /= 2
    }
    
    return proof, nil
}
```

---

## 3. Backend - Daily Scheduler

```go
// backend/internal/rewards/scheduler.go

package rewards

import (
    "context"
    "encoding/json"
    "time"
    
    "github.com/dgraph-io/badger/v3"
    "github.com/gagliardetto/solana-go"
    "github.com/gagliardetto/solana-go/rpc"
    "github.com/rs/zerolog/log"
)

type Scheduler struct {
    db          *badger.DB
    rpcClient   *rpc.Client
    programID   solana.PublicKey
    authority   solana.PrivateKey
    ticker      *time.Ticker
}

func NewScheduler(db *badger.DB, rpcURL string, programID, authority string) *Scheduler {
    return &Scheduler{
        db:        db,
        rpcClient: rpc.New(rpcURL),
        programID: solana.MustPublicKeyFromBase58(programID),
        authority: solana.MustPrivateKeyFromBase58(authority),
        ticker:    time.NewTicker(1 * time.Minute), // Check every minute
    }
}

func (s *Scheduler) Start(ctx context.Context) {
    log.Info().Msg("Rewards scheduler started")
    
    for {
        select {
        case <-ctx.Done():
            log.Info().Msg("Rewards scheduler stopped")
            return
        case <-s.ticker.C:
            s.checkAndRunCycle()
        }
    }
}

func (s *Scheduler) checkAndRunCycle() {
    now := time.Now().UTC()
    
    // Check if it's time to run (e.g., midnight UTC)
    if now.Hour() == 0 && now.Minute() == 0 {
        log.Info().Msg("Starting daily rewards cycle")
        
        if err := s.runCycle(); err != nil {
            log.Error().Err(err).Msg("Failed to run daily cycle")
        }
    }
}

func (s *Scheduler) runCycle() error {
    ctx := context.Background()
    now := time.Now().UTC()
    
    // 1. Collect points snapshot
    log.Info().Msg("Collecting points snapshot")
    players, totalPoints, err := s.collectPointsSnapshot()
    if err != nil {
        return fmt.Errorf("collect snapshot: %w", err)
    }
    
    log.Info().
        Int("players", len(players)).
        Uint64("total_points", totalPoints).
        Msg("Snapshot collected")
    
    // 2. Build merkle tree
    log.Info().Msg("Building merkle tree")
    tree, err := BuildMerkleTree(players)
    if err != nil {
        return fmt.Errorf("build tree: %w", err)
    }
    
    // 3. Store tree for proof generation
    if err := s.storeTree(tree, players); err != nil {
        return fmt.Errorf("store tree: %w", err)
    }
    
    // 4. Get current epoch ID
    currentEpochID, err := s.getCurrentEpochID()
    if err != nil {
        return fmt.Errorf("get epoch id: %w", err)
    }
    
    // 5. Commit points on-chain
    log.Info().Uint64("epoch_id", currentEpochID).Msg("Committing points on-chain")
    if err := s.commitPoints(ctx, currentEpochID, tree.Root, totalPoints, uint32(len(players))); err != nil {
        return fmt.Errorf("commit points: %w", err)
    }
    
    // 6. Finalize epoch
    log.Info().Uint64("epoch_id", currentEpochID).Msg("Finalizing epoch")
    if err := s.finalizeEpoch(ctx, currentEpochID); err != nil {
        return fmt.Errorf("finalize epoch: %w", err)
    }
    
    // 7. Create next epoch
    nextStart := now
    nextEnd := now.Add(24 * time.Hour)
    
    log.Info().Msg("Creating next epoch")
    if err := s.createEpoch(ctx, nextStart, nextEnd); err != nil {
        return fmt.Errorf("create epoch: %w", err)
    }
    
    log.Info().
        Uint64("finalized_epoch", currentEpochID).
        Int("players", len(players)).
        Uint64("total_points", totalPoints).
        Msg("Daily cycle completed successfully")
    
    return nil
}

func (s *Scheduler) collectPointsSnapshot() ([]PlayerPoints, uint64, error) {
    players := make([]PlayerPoints, 0)
    var totalPoints uint64
    
    err := s.db.View(func(txn *badger.Txn) error {
        it := txn.NewIterator(badger.DefaultIteratorOptions)
        defer it.Close()
        
        prefix := []byte("global:wallet:")
        
        for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
            item := it.Item()
            key := string(item.Key())
            
            // Only process :points keys
            if !strings.HasSuffix(key, ":points") {
                continue
            }
            
            // Extract wallet address
            parts := strings.Split(key, ":")
            if len(parts) < 3 {
                continue
            }
            wallet := parts[2]
            
            // Get points value
            var points float64
            err := item.Value(func(val []byte) error {
                return json.Unmarshal(val, &points)
            })
            if err != nil {
                continue
            }
            
            pointsInt := uint64(points)
            
            // Filter minimum threshold
            if pointsInt < 100 {
                continue
            }
            
            players = append(players, PlayerPoints{
                Wallet: wallet,
                Points: pointsInt,
            })
            
            totalPoints += pointsInt
        }
        
        return nil
    })
    
    return players, totalPoints, err
}

func (s *Scheduler) storeTree(tree *MerkleTree, players []PlayerPoints) error {
    // Store tree data for proof generation
    data := map[string]interface{}{
        "root":    tree.Root,
        "players": players,
        "nodes":   tree.Nodes,
        "leaves":  tree.Leaves,
    }
    
    treeJSON, err := json.Marshal(data)
    if err != nil {
        return err
    }
    
    epochID, _ := s.getCurrentEpochID()
    key := []byte(fmt.Sprintf("merkle:epoch:%d:tree", epochID))
    
    return s.db.Update(func(txn *badger.Txn) error {
        return txn.Set(key, treeJSON)
    })
}

// Additional methods for on-chain interactions would go here
// (commitPoints, finalizeEpoch, createEpoch using solana-go)
```

---

## 4. Frontend - Rewards Dashboard Component

```typescript
// frontend/components/RewardsDashboard.tsx

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';

interface ClaimableEpoch {
  epoch_id: number;
  points: number;
  estimated_reward: string;
  status: string;
}

export function RewardsDashboard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [claimable, setClaimable] = useState<ClaimableEpoch[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (publicKey) {
      fetchClaimable();
    }
  }, [publicKey]);
  
  async function fetchClaimable() {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/rewards/wallet/${publicKey.toString()}/claimable`);
      const data = await res.json();
      setClaimable(data.claimable_epochs || []);
    } catch (err) {
      console.error('Failed to fetch claimable epochs:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function claimReward(epochId: number) {
    if (!publicKey) return;
    
    setClaiming(true);
    
    try {
      // 1. Fetch proof from backend
      const proofRes = await fetch(`/api/rewards/epoch/${epochId}/proof/${publicKey.toString()}`);
      const proofData = await proofRes.json();
      
      if (!proofData.proof) {
        throw new Error('Failed to get merkle proof');
      }
      
      // 2. Build claim instruction
      const program = getRewardsProgram();
      const configPDA = getConfigPDA();
      const epochPDA = getEpochPDA(epochId);
      const claimReceiptPDA = getClaimReceiptPDA(epochId, publicKey);
      const vaultPDA = getVaultPDA();
      
      const ix = await program.methods
        .claimReward(
          new BN(proofData.points),
          proofData.proof.map((p: string) => Array.from(Buffer.from(p.slice(2), 'hex')))
        )
        .accounts({
          config: configPDA,
          epoch: epochPDA,
          claimReceipt: claimReceiptPDA,
          vault: vaultPDA,
          recipient: publicKey,
          payer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      // 3. Send transaction
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      
      // 4. Wait for confirmation
      await connection.confirmTransaction(sig, 'confirmed');
      
      // 5. Success!
      toast.success(`Claimed ${proofData.estimated_reward} SOL!`);
      
      // Refresh
      fetchClaimable();
      
    } catch (err: any) {
      console.error('Claim failed:', err);
      
      if (err.message?.includes('already exists')) {
        toast.error('Already claimed this epoch');
      } else if (err.message?.includes('MerkleVerificationFailed')) {
        toast.error('Invalid proof - please contact support');
      } else {
        toast.error('Claim failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setClaiming(false);
    }
  }
  
  if (!publicKey) {
    return (
      <div className="rewards-dashboard">
        <h2>Daily Rewards</h2>
        <p>Connect your wallet to view rewards</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="rewards-dashboard">
        <h2>Daily Rewards</h2>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="rewards-dashboard">
      <h2>Daily Rewards</h2>
      
      {claimable.length === 0 ? (
        <div className="no-rewards">
          <p>No rewards available to claim</p>
          <p className="hint">Play games to earn points and qualify for daily rewards!</p>
        </div>
      ) : (
        <div className="epochs-list">
          {claimable.map((epoch) => (
            <div key={epoch.epoch_id} className="epoch-card">
              <div className="epoch-header">
                <span className="epoch-id">Epoch #{epoch.epoch_id}</span>
                <span className="epoch-status">{epoch.status}</span>
              </div>
              
              <div className="epoch-details">
                <div className="detail">
                  <span className="label">Points Earned:</span>
                  <span className="value">{epoch.points.toLocaleString()}</span>
                </div>
                
                <div className="detail reward-amount">
                  <span className="label">Reward:</span>
                  <span className="value">{epoch.estimated_reward} SOL</span>
                </div>
              </div>
              
              <button
                onClick={() => claimReward(epoch.epoch_id)}
                disabled={claiming || epoch.status !== 'Finalized'}
                className="claim-button"
              >
                {claiming ? 'Claiming...' : 'Claim Reward'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .rewards-dashboard {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .epochs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .epoch-card {
          border: 1px solid #66cbfa;
          border-radius: 8px;
          padding: 1.5rem;
          background: rgba(102, 203, 250, 0.05);
        }
        
        .epoch-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .epoch-details {
          margin-bottom: 1rem;
        }
        
        .detail {
          display: flex;
          justify-content: space-between;
          margin: 0.5rem 0;
        }
        
        .reward-amount {
          font-size: 1.2rem;
          font-weight: bold;
          color: #66cbfa;
        }
        
        .claim-button {
          width: 100%;
          padding: 0.75rem;
          background: #66cbfa;
          color: #000;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .claim-button:hover:not(:disabled) {
          background: #88d4fb;
          transform: translateY(-2px);
        }
        
        .claim-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return pda;
}

function getEpochPDA(epochId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('epoch'),
      new BN(epochId).toArrayLike(Buffer, 'le', 8)
    ],
    PROGRAM_ID
  );
  return pda;
}

function getClaimReceiptPDA(epochId: number, wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('claim'),
      new BN(epochId).toArrayLike(Buffer, 'le', 8),
      wallet.toBuffer()
    ],
    PROGRAM_ID
  );
  return pda;
}

function getVaultPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    PROGRAM_ID
  );
  return pda;
}
```

---

## 5. API Endpoints

```go
// backend/internal/api/rewards_handlers.go

package api

import (
    "encoding/json"
    "net/http"
    
    "github.com/gorilla/mux"
)

func (s *Server) handleRewardsStatus(w http.ResponseWriter, r *http.Request) {
    config, err := s.rewardsClient.GetGlobalConfig(r.Context())
    if err != nil {
        http.Error(w, "Failed to get config", 500)
        return
    }
    
    currentEpoch, err := s.rewardsClient.GetCurrentEpoch(r.Context())
    if err != nil {
        http.Error(w, "Failed to get current epoch", 500)
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "daily_amount": config.DailyAmount,
        "current_epoch": currentEpoch,
        "next_distribution": calculateNextDistribution(config),
    })
}

func (s *Server) handleGetEpoch(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    epochID := vars["epochId"]
    
    epoch, err := s.rewardsClient.GetEpoch(r.Context(), epochID)
    if err != nil {
        http.Error(w, "Epoch not found", 404)
        return
    }
    
    json.NewEncoder(w).Encode(epoch)
}

func (s *Server) handleGetProof(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    epochID := vars["epochId"]
    wallet := vars["wallet"]
    
    // Load tree from cache/DB
    tree, players, err := s.loadMerkleTree(epochID)
    if err != nil {
        http.Error(w, "Epoch not found", 404)
        return
    }
    
    // Find player
    var playerData *PlayerPoints
    for _, p := range players {
        if strings.EqualFold(p.Wallet, wallet) {
            playerData = &p
            break
        }
    }
    
    if playerData == nil {
        http.Error(w, "Not eligible", 404)
        return
    }
    
    // Generate proof
    proof, err := tree.GetProof(wallet, playerData.Points)
    if err != nil {
        http.Error(w, "Failed to generate proof", 500)
        return
    }
    
    // Convert to hex strings
    proofHex := make([]string, len(proof))
    for i, p := range proof {
        proofHex[i] = "0x" + hex.EncodeToString(p[:])
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "epoch_id": epochID,
        "wallet": wallet,
        "points": playerData.Points,
        "proof": proofHex,
        "root": "0x" + hex.EncodeToString(tree.Root[:]),
        "estimated_reward": calculateReward(playerData.Points, totalPoints, 100.0),
    })
}

func (s *Server) handleGetClaimable(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    wallet := vars["wallet"]
    
    claimableEpochs := make([]map[string]interface{}, 0)
    
    // Query recent finalized epochs
    epochs, err := s.rewardsClient.GetFinalizedEpochs(r.Context(), 30) // Last 30 days
    if err != nil {
        http.Error(w, "Failed to query epochs", 500)
        return
    }
    
    for _, epoch := range epochs {
        // Check if already claimed
        claimed, _ := s.rewardsClient.HasClaimed(r.Context(), epoch.EpochID, wallet)
        if claimed {
            continue
        }
        
        // Check if eligible
        tree, players, err := s.loadMerkleTree(fmt.Sprint(epoch.EpochID))
        if err != nil {
            continue
        }
        
        var playerData *PlayerPoints
        for _, p := range players {
            if strings.EqualFold(p.Wallet, wallet) {
                playerData = &p
                break
            }
        }
        
        if playerData == nil {
            continue // Not eligible for this epoch
        }
        
        estimatedReward := calculateReward(playerData.Points, epoch.TotalPoints, 100.0)
        
        claimableEpochs = append(claimableEpochs, map[string]interface{}{
            "epoch_id": epoch.EpochID,
            "points": playerData.Points,
            "estimated_reward": fmt.Sprintf("%.4f", estimatedReward),
            "status": "Finalized",
        })
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "wallet": wallet,
        "claimable_epochs": claimableEpochs,
    })
}

func calculateReward(points, totalPoints uint64, totalRewardSOL float64) float64 {
    if totalPoints == 0 {
        return 0
    }
    return (float64(points) / float64(totalPoints)) * totalRewardSOL
}
```

---

## 6. Testing - Anchor Program Tests

```typescript
// tests/rewards.ts

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { expect } from 'chai';
import { MerkleTree } from 'merkletreejs';
import { keccak256 } from 'js-sha3';

describe('Rewards Program', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.Rewards as Program;
  
  it('initializes config', async () => {
    const dailyAmount = new anchor.BN(100_000_000_000); // 100 SOL
    
    await program.methods
      .initializeConfig(dailyAmount, null, 0, 0)
      .rpc();
    
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );
    
    const config = await program.account.globalConfig.fetch(configPDA);
    expect(config.dailyAmount.toString()).to.equal(dailyAmount.toString());
  });
  
  it('creates epoch', async () => {
    const now = Math.floor(Date.now() / 1000);
    const start = now;
    const end = now + 86400;
    
    await program.methods
      .createEpoch(new anchor.BN(start), new anchor.BN(end))
      .rpc();
    
    const [epochPDA] = getEpochPDA(1);
    const epoch = await program.account.rewardEpoch.fetch(epochPDA);
    
    expect(epoch.epochId.toNumber()).to.equal(1);
    expect(epoch.status).to.equal(0); // Open
  });
  
  it('commits points and finalizes', async () => {
    // Build test merkle tree
    const players = [
      { wallet: provider.wallet.publicKey, points: 50000 },
      { wallet: anchor.web3.Keypair.generate().publicKey, points: 30000 },
      { wallet: anchor.web3.Keypair.generate().publicKey, points: 20000 },
    ];
    
    const leaves = players.map(p => computeLeaf(p.wallet, p.points));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = Array.from(tree.getRoot());
    
    const totalPoints = players.reduce((sum, p) => sum + p.points, 0);
    
    // Commit
    await program.methods
      .commitEpochPoints(root, new anchor.BN(totalPoints), players.length, null)
      .rpc();
    
    // Finalize
    await program.methods
      .finalizeEpoch()
      .rpc();
    
    const [epochPDA] = getEpochPDA(1);
    const epoch = await program.account.rewardEpoch.fetch(epochPDA);
    
    expect(epoch.status).to.equal(2); // Finalized
    expect(epoch.totalPoints.toNumber()).to.equal(totalPoints);
  });
  
  it('allows valid claim', async () => {
    const wallet = provider.wallet.publicKey;
    const points = 50000;
    
    const leaf = computeLeaf(wallet, points);
    const proof = tree.getProof(leaf).map(p => Array.from(p.data));
    
    const initialBalance = await provider.connection.getBalance(wallet);
    
    await program.methods
      .claimReward(new anchor.BN(points), proof)
      .accounts({
        recipient: wallet,
        payer: wallet,
      })
      .rpc();
    
    const finalBalance = await provider.connection.getBalance(wallet);
    const expectedReward = (points / 100000) * 100_000_000_000; // proportional
    
    expect(finalBalance).to.be.greaterThan(initialBalance);
  });
  
  it('prevents double claim', async () => {
    const wallet = provider.wallet.publicKey;
    const points = 50000;
    const proof = tree.getProof(computeLeaf(wallet, points)).map(p => Array.from(p.data));
    
    try {
      await program.methods
        .claimReward(new anchor.BN(points), proof)
        .rpc();
      
      expect.fail('Should have thrown error');
    } catch (err: any) {
      expect(err.message).to.include('already in use');
    }
  });
});

function computeLeaf(wallet: PublicKey, points: number): Buffer {
  const data = Buffer.concat([
    wallet.toBuffer(),
    Buffer.from(new anchor.BN(points).toArray('le', 8))
  ]);
  return Buffer.from(keccak256(data), 'hex');
}
```

---

These code snippets provide a solid foundation for implementing the daily rewards system. Adjust as needed for your specific requirements!


