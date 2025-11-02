# Daily Rewards Program - Executive Summary

## Overview
A Solana-based program that distributes **$100 daily** to players based on their gaming points in a fair, transparent, and automated manner.

---

## Key Features

### 🎯 Core Functionality
- **Daily Distribution**: Automatically distribute $100 (in SOL or SPL tokens) every 24 hours
- **Proportional Rewards**: Players receive rewards based on their share of total daily points
- **On-Chain Verification**: All distributions cryptographically verifiable on Solana
- **Claim-Based**: Users claim their rewards (reduces gas waste on inactive wallets)

### 🔒 Security
- **Merkle Proofs**: Cryptographic verification of eligibility
- **No Double Claims**: On-chain receipt prevents re-claiming
- **Anti-Gaming**: Minimum thresholds, rate limiting, score validation
- **Audit Trail**: Full transparency via blockchain events and IPFS backups

### ⚡ User Experience
- **Simple Claims**: One-click claiming via frontend
- **Multi-Epoch**: Claim multiple days at once
- **Real-Time Status**: See claimable rewards instantly
- **Optional Gas Subsidy**: Backend can pay transaction fees for users

---

## How It Works

### Daily Cycle (Automated)

```
1. Midnight UTC → Close Current Epoch
   ├─ Snapshot all player points from database
   ├─ Calculate total points earned in 24h window
   └─ Build merkle tree of (wallet, points) pairs

2. Commit On-Chain (1 transaction)
   ├─ Submit merkle root to Solana program
   ├─ Record total points and player count
   └─ Lock epoch for claiming

3. Finalize & Fund (1 transaction)
   ├─ Mark epoch ready for claims
   ├─ Allocate 100 SOL from vault
   └─ Enable user claims

4. Users Claim (N transactions)
   ├─ Fetch merkle proof from API
   ├─ Submit claim instruction with proof
   ├─ Receive proportional share: (user_points / total_points) × 100 SOL
   └─ Create receipt to prevent double-claim
```

### Example Calculation

**Scenario**: 1,000 players earned points yesterday

| Player | Points Earned | Share | Reward (SOL) |
|--------|---------------|-------|--------------|
| Alice  | 50,000        | 5%    | 5.0 SOL      |
| Bob    | 25,000        | 2.5%  | 2.5 SOL      |
| Carol  | 10,000        | 1%    | 1.0 SOL      |
| ...    | ...           | ...   | ...          |
| **Total** | **1,000,000** | **100%** | **100 SOL** |

---

## Architecture

### Solana Program (On-Chain)
```
┌─────────────────────────────────────────┐
│         Rewards Program (Anchor)        │
├─────────────────────────────────────────┤
│                                         │
│  GlobalConfig PDA                       │
│  ├─ Daily amount (100 SOL)              │
│  ├─ Anchor time (midnight UTC)          │
│  └─ Authority                           │
│                                         │
│  RewardEpoch PDA (per day)              │
│  ├─ Start/end timestamps                │
│  ├─ Merkle root (wallet, points)        │
│  ├─ Total points & player count         │
│  └─ Total rewards & claimed             │
│                                         │
│  ClaimReceipt PDA (per wallet, per day) │
│  ├─ Wallet address                      │
│  ├─ Points earned                       │
│  ├─ Reward amount                       │
│  └─ Claimed timestamp                   │
│                                         │
│  Vault PDA (SOL/SPL storage)            │
│  └─ Holds reward funds                  │
│                                         │
└─────────────────────────────────────────┘
```

### Backend (Off-Chain)
```
┌─────────────────────────────────────────┐
│         Go Backend + Badger DB          │
├─────────────────────────────────────────┤
│                                         │
│  Daily Scheduler (Cron)                 │
│  ├─ Collect points snapshot             │
│  ├─ Build merkle tree                   │
│  ├─ Commit to Solana                    │
│  └─ Store proofs for API                │
│                                         │
│  API Endpoints                          │
│  ├─ GET /api/rewards/status             │
│  ├─ GET /api/rewards/epoch/{id}         │
│  ├─ GET /api/rewards/proof/{wallet}     │
│  └─ POST /api/rewards/claim             │
│                                         │
│  Proof Cache (Redis/Badger)             │
│  └─ Store merkle proofs for fast lookup │
│                                         │
└─────────────────────────────────────────┘
```

### Frontend (User Interface)
```
┌─────────────────────────────────────────┐
│         React/Next.js Frontend          │
├─────────────────────────────────────────┤
│                                         │
│  Rewards Dashboard                      │
│  ├─ Show claimable epochs               │
│  ├─ Display points & estimated rewards  │
│  ├─ One-click claim button              │
│  └─ Transaction history                 │
│                                         │
│  Wallet Integration                     │
│  ├─ Connect Solana wallet               │
│  ├─ Sign claim transactions             │
│  └─ Receive rewards                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Technical Specifications

### Solana Program Instructions
1. **initialize_config** - One-time setup (admin)
2. **update_config** - Modify settings (admin)
3. **create_epoch** - Start new 24h period (automated)
4. **commit_epoch_points** - Submit merkle root (automated)
5. **finalize_epoch** - Enable claims (automated)
6. **fund_vault** - Add rewards (admin/automated)
7. **claim_reward** - User claims proportional share (user)

### Data Storage
- **On-Chain**: Epoch metadata, merkle roots, claim receipts
- **Off-Chain**: Full points dataset, merkle proofs, historical logs
- **IPFS** (optional): Backup of daily snapshots for transparency

---

## Economics

### Costs

| Item | Amount | Frequency | Annual Cost |
|------|--------|-----------|-------------|
| **Daily Rewards** | 100 SOL | Daily | **36,500 SOL** (~$7.3M @ $200/SOL) |
| Admin Transactions | ~0.01 SOL | Daily | ~3.65 SOL (~$730) |
| User Claim Gas | ~0.003 SOL | Per claim | Paid by users |
| Development | - | One-time | ~$16,500 |
| Infrastructure | $500 | Monthly | $6,000 |

**Total Annual**: ~36,510 SOL + $22,500 (~$7.3M @ $200/SOL)

### Vault Management
- **Buffer**: Maintain 700-1000 SOL (7-10 days runway)
- **Auto-Refill**: Alert when < 300 SOL
- **Weekly Top-Up**: 700 SOL recommended

---

## Implementation Timeline

### Week 1: Smart Contract Development
- [ ] Implement 7 Anchor instructions
- [ ] Write comprehensive unit tests
- [ ] Deploy to Devnet
- [ ] Manual testing of full cycle

### Week 2: Backend Integration
- [ ] Implement merkle tree builder
- [ ] Add daily scheduler (cron job)
- [ ] Create 4 new API endpoints
- [ ] Test with live database snapshot

### Week 3: Frontend Development
- [ ] Build rewards dashboard component
- [ ] Integrate claim flow with wallet
- [ ] Add notifications for new epochs
- [ ] Test end-to-end user journey

### Week 4: Mainnet Launch
- [ ] Security review & audit
- [ ] Load testing (1000 concurrent users)
- [ ] Deploy program to Mainnet
- [ ] Fund vault with 1000 SOL
- [ ] Enable automated scheduler
- [ ] Monitor first week

**Total Timeline**: **4 weeks from kickoff to production**

---

## Success Metrics (First 90 Days)

| Metric | Target |
|--------|--------|
| Claim Rate | >60% within 48h |
| Total Distributed | 9,000 SOL (100 × 90) |
| Unique Claimants | >500 wallets |
| Failed Claims | <5% |
| Vault Uptime | 99.9% |
| Average Claim Time | <30 seconds |

---

## Security Measures

### On-Chain Protection
✅ Merkle proof verification prevents unauthorized claims  
✅ ClaimReceipt PDA prevents double-claiming  
✅ Authority-only admin functions  
✅ Checked arithmetic prevents overflows  
✅ Program-owned vault (no external access)  

### Off-Chain Protection
✅ Minimum points threshold (filter bots)  
✅ Score validation in game handlers  
✅ Rate limiting on gameplay  
✅ SIWS wallet authentication  
✅ Audit logs for all operations  

### Audit Trail
✅ On-chain events for every claim  
✅ IPFS backups of daily snapshots  
✅ Blockchain indexer integration  
✅ Backend logs with timestamps  
✅ Public dashboard for transparency  

---

## Benefits

### For Players
🎮 **Fair Rewards**: Earn proportional to actual gameplay  
💰 **Daily Payouts**: Consistent reward schedule  
🔐 **Trustless**: No centralized control over distributions  
📊 **Transparent**: Verify your eligibility on-chain  
⚡ **Fast Claims**: Receive rewards in seconds  

### For Platform
📈 **Player Retention**: Daily incentive to keep playing  
🎯 **Engagement**: Gamify points accumulation  
🛡️ **Credibility**: Provable fairness builds trust  
📉 **Automated**: Minimal operational overhead  
🔍 **Analytics**: Track player activity and trends  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Vault runs dry | 7-day buffer + auto-alerts + manual override |
| Merkle tree bug | Extensive testing + gradual rollout + audit |
| User gaming system | Min thresholds + rate limits + score validation |
| Smart contract exploit | Security audit + conservative design + upgradability |
| Backend failure | Redundancy + manual fallback + monitoring |
| Low adoption | Clear UX + push notifications + educational content |

---

## Future Enhancements (V2+)

### Tier System
- **Top 10**: Bonus multiplier (1.5x)
- **Top 50**: Standard rewards (1x)
- **Everyone else**: Base rewards (0.8x)

### Streak Bonuses
- **7-day streak**: +10% rewards
- **30-day streak**: +25% rewards
- **90-day streak**: +50% rewards

### Token Staking
- Stake project tokens to boost reward share
- Example: 1000 tokens staked = 1.2x multiplier

### Multi-Token Rewards
- Distribute project tokens alongside SOL
- Configurable reward token per epoch

---

## Comparison to Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **On-Chain (This Plan)** | Trustless, verifiable, automated | Higher gas costs, technical complexity |
| **Centralized Airdrops** | Simple, cheap, fast | Requires trust, not verifiable, manual work |
| **Off-Chain Points Only** | Free, flexible | No monetary value, low engagement |
| **Instant Payouts** | Immediate gratification | Very expensive gas, unsustainable |

**Selected Approach**: On-chain with merkle proofs balances trustlessness, cost efficiency, and user experience.

---

## FAQs

**Q: When do rewards reset?**  
A: Every day at midnight UTC (configurable).

**Q: How long do I have to claim?**  
A: Initially unlimited, but future versions may add 30-day expiry.

**Q: What if I don't claim every day?**  
A: Unclaimed rewards remain available; claim multiple epochs at once.

**Q: Can I see my points in real-time?**  
A: Yes, frontend displays live points from backend API.

**Q: What prevents cheating?**  
A: Server-side score validation, rate limiting, and minimum thresholds.

**Q: How are rewards calculated?**  
A: `reward = (your_points / total_points) × 100 SOL`

**Q: Who pays transaction fees?**  
A: Users pay ~0.003 SOL per claim (or backend can subsidize).

**Q: Is this audited?**  
A: Internal review before launch; external audit recommended for V2.

---

## Conclusion

This **Daily Rewards Program** transforms your existing points system into a compelling, transparent, and automated reward mechanism that:

✅ **Distributes real value** (100 SOL daily)  
✅ **Rewards active players** fairly based on contribution  
✅ **Operates trustlessly** via Solana blockchain  
✅ **Scales efficiently** with merkle proofs  
✅ **Integrates seamlessly** with current infrastructure  

**Total Investment**: ~$16.5k development + $100/day ongoing  
**Timeline**: 4 weeks to production  
**ROI**: Increased retention, engagement, and platform credibility  

---

## Next Steps

1. ✅ **Review Plan** - Approve architecture and timeline
2. 📝 **Kickoff** - Assign dev resources
3. 🛠️ **Build** - 4-week sprint (see detailed plan)
4. 🧪 **Test** - Devnet validation
5. 🚀 **Launch** - Mainnet deployment
6. 📊 **Monitor** - Track metrics for 90 days
7. 🔄 **Iterate** - Optimize based on data

**Ready to implement?** See `DAILY_REWARDS_PROGRAM_PLAN.md` for full technical details.


