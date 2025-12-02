# Production Deployment Cost Calculation

## Program Information
- **Program Size**: 304,448 bytes (~297 KB)
- **Compiled Binary**: `target/deploy/rewards_record.so`

## Cost Breakdown

### 1. Program Deployment (One-Time)

**Rent Exemption Calculation:**
- Solana rent formula: `rent_exempt_lamports = (account_size + 128) × rent_per_byte`
- Current rent rate: ~6,960 lamports per byte (for 2-year exemption)
- Program account size: 304,448 bytes + 128 (account header) = 304,576 bytes

**Calculation:**
```
Program Rent = 304,576 × 6,960 = 2,119,848,960 lamports
Program Rent = 2.12 SOL (approximately)
```

**Transaction Fee:**
- Deployment transaction fee: ~0.000005 SOL

**Total Program Deployment: ~2.12 SOL**

---

### 2. Config PDA Initialization (One-Time)

**Account Size:**
- Discriminator: 8 bytes
- Authority: 32 bytes  
- USDC Mint: 32 bytes
- Total: 72 bytes + 128 (account header) = 200 bytes

**Calculation:**
```
Config Rent = 200 × 6,960 = 1,392,000 lamports
Config Rent = 0.001392 SOL
```

**Transaction Fee:**
- Init config transaction: ~0.000005 SOL

**Total Config Init: ~0.0014 SOL**

---

### 3. Per-Epoch Operations (Ongoing)

**Fund Vault Transaction:**
- Transaction fee: ~0.000005 SOL
- Vault PDA creation (one-time per epoch): ~0.001392 SOL (same as Config)
- **Note**: Vault PDA is created automatically on first fund

**Commit Epoch Transaction:**
- Transaction fee: ~0.000005 SOL
- Epoch PDA creation: 
  - Account size: 8 (discriminator) + 92 (AirdropEpoch) + 128 (header) = 228 bytes
  - Rent: 228 × 6,960 = 1,586,880 lamports = 0.001587 SOL

**Per Epoch Total:**
- First epoch: ~0.0014 (vault) + 0.0016 (epoch) + 0.00001 (fees) = **~0.003 SOL**
- Subsequent epochs: 0.0016 (epoch) + 0.00001 (fees) = **~0.0016 SOL**

---

### 4. Per-Claim Operations (User Pays)

**Claim Transaction:**
- Transaction fee: ~0.000005 SOL
- Claim Receipt PDA creation:
  - Account size: 8 (discriminator) + 41 (ClaimReceipt) + 128 (header) = 177 bytes
  - Rent: 177 × 6,960 = 1,231,920 lamports = 0.001232 SOL

**Per Claim Total: ~0.001237 SOL** (paid by user)

---

## Summary

### One-Time Setup Costs:
| Item | Cost (SOL) | Cost (USD @ $162/SOL) |
|------|------------|----------------------|
| Program Deployment | 2.12 | $343.44 |
| Config Initialization | 0.0014 | $0.23 |
| **Total Setup** | **~2.12 SOL** | **~$343.67** |

### Ongoing Operational Costs (Per Day):
| Item | Cost (SOL) | Cost (USD @ $162/SOL) |
|------|------------|----------------------|
| First Epoch (vault + epoch) | 0.003 | $0.49 |
| Subsequent Epochs | 0.0016 | $0.26 |
| **Daily Average** | **~0.0016 SOL** | **~$0.26** |

### Annual Operational Costs:
- Daily epochs: 365 × 0.0016 = **0.584 SOL** (~$94.61/year)
- Plus initial setup: **2.12 SOL** (~$343.67)

**Total First Year: ~2.70 SOL (~$438)**

---

## Additional Considerations

### USDC Funding (Separate from SOL costs):
- Daily rewards pool: $100 USD in USDC
- This is separate from SOL deployment/operational costs
- Authority wallet must hold sufficient USDC for vault funding

### Buffer Recommendations:
- **Initial SOL Buffer**: 5-10 SOL for deployment + first month operations
- **USDC Buffer**: $700-1000 USD (7-10 days of rewards pool)

---

## Production Deployment Checklist

### SOL Requirements:
- [ ] **2.12 SOL** for program deployment
- [ ] **0.0014 SOL** for config initialization  
- [ ] **5-10 SOL buffer** for operational costs and safety margin
- [ ] **Total Recommended: 7-12 SOL** (~$1,134 - $1,944)

### USDC Requirements:
- [ ] **$100 USD** per day for rewards pool
- [ ] **$700-1000 USD buffer** (7-10 days)
- [ ] **Total Recommended: $800-1,100 USD**

### Authority Wallet Setup:
- [ ] Load authority keypair from `AUTHORITY_KEY_PATH`
- [ ] Fund with 7-12 SOL
- [ ] Fund with $800-1,100 USDC
- [ ] Verify wallet has sufficient balance before deployment

---

## Notes

1. **Rent is reclaimable**: If you close the program later, you can reclaim the rent (minus small fees)
2. **Transaction fees are minimal**: ~0.000005 SOL per transaction
3. **Vault PDAs**: Created per epoch, rent is minimal (~0.0014 SOL each)
4. **Epoch PDAs**: Created per epoch, rent accumulates over time
5. **Claim Receipts**: Users pay rent when claiming (one-time per epoch per user)

**Current SOL Price**: ~$162 USD (as of search results)









