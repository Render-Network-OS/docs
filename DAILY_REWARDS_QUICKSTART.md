# Daily Rewards - Quick Start Guide

Fast track to implementing the $100 daily rewards system.

---

## 📋 Overview

**What**: Distribute $100 in SOL daily to players based on their points  
**How**: Solana program with merkle proofs for fair, verifiable distribution  
**When**: 4 weeks from start to mainnet launch  

---

## 🎯 Quick Facts

| Aspect | Details |
|--------|---------|
| **Daily Distribution** | 100 SOL (~$20,000 @ $200/SOL) |
| **Distribution Method** | Proportional to points earned in 24h |
| **Claim Mechanism** | User-initiated with merkle proof |
| **Transaction Cost** | ~0.003 SOL per claim (user pays) |
| **Scalability** | Supports 10,000+ players |
| **Security** | No double-claims, cryptographic proofs |

---

## 📁 Document Index

1. **DAILY_REWARDS_PROGRAM_PLAN.md** (20 pages)
   - Complete technical specification
   - Architecture details
   - Security considerations
   - Timeline and costs

2. **DAILY_REWARDS_SUMMARY.md** (8 pages)
   - Executive summary
   - Key features and benefits
   - Economics and metrics
   - Risk analysis

3. **DAILY_REWARDS_FLOW.md** (5 pages)
   - Visual flow diagrams
   - Daily automation cycle
   - User claim process
   - Points accumulation

4. **DAILY_REWARDS_CODE_SNIPPETS.md** (12 pages)
   - Anchor program code
   - Backend merkle builder
   - Frontend React component
   - API endpoints
   - Tests

---

## 🚀 Implementation Checklist

### Week 1: Smart Contract
- [ ] Setup Anchor project: `anchor init rewards`
- [ ] Implement 7 instructions (see code snippets)
- [ ] Add account structs (GlobalConfig, RewardEpoch, ClaimReceipt)
- [ ] Write merkle verification logic
- [ ] Create unit tests (80% coverage target)
- [ ] Deploy to Devnet
- [ ] Manual end-to-end test

**Deliverable**: Working program on Devnet

---

### Week 2: Backend Integration
- [ ] Add merkle tree builder (`rewards/merkle.go`)
- [ ] Implement daily scheduler (`rewards/scheduler.go`)
- [ ] Create 4 new API endpoints:
  - `GET /api/rewards/status`
  - `GET /api/rewards/epoch/{id}`
  - `GET /api/rewards/epoch/{id}/proof/{wallet}`
  - `GET /api/rewards/wallet/{wallet}/claimable`
- [ ] Add proof caching (Badger or Redis)
- [ ] Test with production DB snapshot
- [ ] Setup cron job for midnight UTC
- [ ] Add monitoring/alerts

**Deliverable**: Backend that generates proofs and automates cycles

---

### Week 3: Frontend
- [ ] Create `RewardsDashboard.tsx` component
- [ ] Add wallet integration
- [ ] Implement claim flow
- [ ] Add loading/error states
- [ ] Display transaction history
- [ ] Add notifications (toast messages)
- [ ] Style with project theme
- [ ] Test with Devnet

**Deliverable**: User-facing rewards UI

---

### Week 4: Production Launch
- [ ] Security review (internal)
- [ ] Load testing (1000 concurrent claims)
- [ ] Deploy program to Mainnet
- [ ] Initialize config with production values
- [ ] Fund vault with 1000 SOL (10 days buffer)
- [ ] Update frontend to Mainnet
- [ ] Enable automated scheduler
- [ ] Monitor first 3 daily cycles
- [ ] Create user documentation
- [ ] Announce to community

**Deliverable**: Live on Mainnet

---

## 🔧 Setup Commands

### 1. Create Anchor Project
```bash
cd /Users/mac/.cursor/worktrees/555/mo4kJ
anchor init rewards-program
cd rewards-program
```

### 2. Install Dependencies
```bash
# Rust/Anchor
cargo add anchor-lang anchor-spl

# Backend (Go)
go get github.com/gagliardetto/solana-go
go get golang.org/x/crypto/sha3
go get github.com/dgraph-io/badger/v3

# Frontend (TypeScript)
npm install @coral-xyz/anchor @solana/web3.js
npm install merkletreejs js-sha3
```

### 3. Deploy to Devnet
```bash
anchor build
anchor deploy --provider.cluster devnet

# Copy program ID
PROGRAM_ID=$(solana address -k target/deploy/rewards-keypair.json)
echo "Program ID: $PROGRAM_ID"
```

### 4. Initialize Program
```bash
# Using Anchor CLI
anchor run initialize-config
```

---

## 📊 Key PDAs

| PDA | Seeds | Purpose |
|-----|-------|---------|
| **GlobalConfig** | `["config"]` | Program settings |
| **RewardEpoch** | `["epoch", epoch_id]` | Daily epoch data |
| **ClaimReceipt** | `["claim", epoch_id, wallet]` | Claim record |
| **Vault** | `["vault"]` | Holds rewards |

---

## 💰 Economics Breakdown

### Per Day
- **Rewards**: 100 SOL
- **Admin Txs**: ~0.01 SOL (3 txs)
- **User Claims**: ~0 SOL (users pay)
- **Total**: ~100.01 SOL/day

### Per Month
- **Rewards**: 3,000 SOL (~$600,000)
- **Admin**: 0.3 SOL (~$60)
- **Infrastructure**: $500
- **Total**: ~$600,560/month

### Buffer Strategy
- **Minimum**: 300 SOL (3 days)
- **Target**: 700 SOL (7 days)
- **Maximum**: 1000 SOL (10 days)
- **Refill Trigger**: < 300 SOL

---

## 🔐 Security Checklist

### Smart Contract
- [ ] Merkle proof verification correct
- [ ] No double-claim possible (PDA prevents)
- [ ] Checked arithmetic (no overflows)
- [ ] Authority-only admin functions
- [ ] Vault protected (program-owned)

### Backend
- [ ] Score validation in game handlers
- [ ] Rate limiting on API endpoints
- [ ] Minimum points threshold (100)
- [ ] Deterministic merkle tree building
- [ ] Proof caching with expiry

### Frontend
- [ ] Wallet signature required
- [ ] Transaction simulation before send
- [ ] Error handling for all cases
- [ ] No sensitive data exposed
- [ ] Clear user feedback

---

## 📈 Success Metrics (First 90 Days)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Claim Rate** | >60% within 48h | Track claimed/eligible ratio |
| **Total Distributed** | 9,000 SOL | Sum all claim receipts |
| **Unique Claimants** | >500 wallets | Count distinct claimants |
| **Failed Claims** | <5% | Monitor error logs |
| **Vault Uptime** | 99.9% | Alert downtime |
| **Avg Claim Time** | <30 sec | Time from button to confirmation |

---

## 🚨 Common Issues & Solutions

### Issue: Merkle Proof Invalid
**Cause**: Leaf ordering mismatch  
**Solution**: Ensure deterministic sorting (by wallet address)  
**Code**: `sort.Slice(players, func(i,j) bool { return players[i].Wallet < players[j].Wallet })`

### Issue: Vault Balance Insufficient
**Cause**: Not enough SOL for all claims  
**Solution**: Auto-refill when < 300 SOL  
**Alert**: Set up monitoring alert  

### Issue: Claim Already Exists
**Cause**: User trying to claim twice  
**Solution**: This is expected - show "Already claimed" message  
**Code**: Check for `already in use` error  

### Issue: Epoch Not Finalized
**Cause**: Scheduler didn't run or failed  
**Solution**: Manual finalize via admin script  
**Prevention**: Add cron monitoring  

---

## 🛠️ Operational Tasks

### Daily (Automated)
- ✅ Scheduler runs at midnight UTC
- ✅ Collect points snapshot
- ✅ Build merkle tree
- ✅ Commit on-chain
- ✅ Finalize epoch
- ✅ Create next epoch

### Weekly (Manual)
- Review claim rates
- Check vault balance
- Refill if < 300 SOL
- Review failed claims
- Check scheduler logs

### Monthly (Manual)
- Audit total distributed
- Reconcile with accounting
- Review player patterns
- Optimize gas costs
- Plan improvements

---

## 📞 Support Resources

### Documentation
- **Full Plan**: `DAILY_REWARDS_PROGRAM_PLAN.md`
- **Flow Diagrams**: `DAILY_REWARDS_FLOW.md`
- **Code Examples**: `DAILY_REWARDS_CODE_SNIPPETS.md`

### Code Repositories
- **Anchor Program**: `programs/rewards/`
- **Backend**: `backend/internal/rewards/`
- **Frontend**: `frontend/components/RewardsDashboard.tsx`

### External Resources
- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **Merkle Trees**: https://github.com/miguelmota/merkletreejs

---

## 🎓 Learning Path

### For Smart Contract Dev
1. Read Anchor documentation
2. Study existing lottery program (`555-lottery/programs/lottery/src/lib.rs`)
3. Review merkle proof verification logic
4. Implement rewards program following code snippets

### For Backend Dev
1. Understand Badger DB structure (keys, values)
2. Study existing points system (`backend/internal/api/game.go`)
3. Learn merkle tree construction
4. Implement scheduler and API endpoints

### For Frontend Dev
1. Review existing wallet integration
2. Study Solana wallet adapter
3. Learn Anchor TypeScript SDK
4. Build rewards dashboard component

---

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All tests passing (smart contract + integration)
- [ ] Security audit completed
- [ ] Load testing done (1000+ concurrent users)
- [ ] Monitoring dashboards setup
- [ ] Alert system configured
- [ ] Documentation complete
- [ ] Team trained on operations

### Launch Day
- [ ] Deploy smart contract to Mainnet
- [ ] Verify deployment (check program ID)
- [ ] Initialize config with correct values
- [ ] Fund vault with 1000 SOL
- [ ] Create first epoch
- [ ] Update frontend to Mainnet RPC
- [ ] Deploy frontend to production
- [ ] Enable automated scheduler
- [ ] Send announcement to community
- [ ] Monitor first hour closely

### Post-Launch (First Week)
- [ ] Verify daily cycles running
- [ ] Monitor claim success rate
- [ ] Check vault balance daily
- [ ] Respond to user questions
- [ ] Fix any issues immediately
- [ ] Collect feedback
- [ ] Document lessons learned

---

## 💡 Pro Tips

1. **Test on Devnet Extensively**  
   Don't skip Devnet testing. Catch bugs before Mainnet.

2. **Monitor Vault Balance**  
   Set up auto-alerts when < 300 SOL. Never run dry.

3. **Cache Merkle Proofs**  
   Store proofs in Redis/Badger to avoid rebuilding trees.

4. **Use Typed Errors**  
   Return specific error codes for better debugging.

5. **Log Everything**  
   Comprehensive logging saves hours of debugging.

6. **Gradual Rollout**  
   Start with small daily amounts, increase after validation.

7. **User Education**  
   Create clear documentation on how to claim rewards.

8. **Community Communication**  
   Be transparent about distributions and any issues.

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **Anchor Docs** | https://www.anchor-lang.com/ |
| **Solana Docs** | https://docs.solana.com/ |
| **Solana Cookbook** | https://solanacookbook.com/ |
| **Merkle Tree Lib** | https://github.com/miguelmota/merkletreejs |
| **Keccak Hash** | https://www.npmjs.com/package/js-sha3 |
| **Solana Go SDK** | https://github.com/gagliardetto/solana-go |

---

## 📝 Next Steps

1. **Read the Full Plan** (`DAILY_REWARDS_PROGRAM_PLAN.md`)
2. **Review Flow Diagrams** (`DAILY_REWARDS_FLOW.md`)
3. **Study Code Examples** (`DAILY_REWARDS_CODE_SNIPPETS.md`)
4. **Set Up Development Environment**
5. **Start Week 1 Tasks** (Smart Contract)

---

## ❓ Questions?

**Technical**: Review code snippets and flow diagrams  
**Business**: Review summary and economics section  
**Timeline**: See Week 1-4 breakdown in checklist  
**Costs**: See economics breakdown above  

---

**Ready to build the future of gaming rewards? Let's go! 🚀**

---

_Last Updated: October 30, 2025_  
_Version: 1.0_  
_Status: Ready for Implementation_


