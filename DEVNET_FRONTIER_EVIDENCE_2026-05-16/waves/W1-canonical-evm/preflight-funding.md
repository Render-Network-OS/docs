# W1 Pre-flight: Deployer + Recipient Funding Probes

**Date:** 2026-05-17T00:15:00Z  
**Probes:** Read-only eth_getBalance / eth_call balanceOf / getBalance / getTokenAccountsByOwner against public RPCs.  
**Status:** COMPLETE

## EVM Deployer Wallet

**Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Source:** Hardhat default account 0 (derived from default mnemonic via ethers Wallet).

| Chain | Native Balance | USDC Balance | Sufficient for W1? | Notes |
|---|---|---|---|---|
| Ethereum Sepolia | 0.000000 ETH | 1,812.115695 USDC | **YES** | USDC sufficient; needs ETH top-up for Phase C deploy (est. 0.05 ETH) |
| Base Sepolia | 0.000000 ETH | 52.770653 USDC | **PARTIAL** | USDC marginal; needs ETH for Phase C deploy (est. 0.005 ETH) |
| Arbitrum Sepolia | 0.031981 ETH | 783.870531 USDC | **YES** | Tier 3 (no funded action planned, but balances present) |
| Optimism Sepolia | 0.000000 ETH | 0.000000 USDC | **NO** | Tier 3 blocker: zero USDC. Not required for W1 phase C. |
| Avalanche Fuji | 0.000000 AVAX | 21.000000 USDC | **YES** | Phase E burn needs 1 USDC + minimal AVAX gas; USDC sufficient; AVAX needs top-up |
| Polygon Amoy | 0.000000 MATIC | 165.971000 USDC | **YES** | Phase E burn needs 1 USDC + minimal MATIC gas; USDC sufficient; MATIC needs top-up |

## Solana Relayer / W0.d Recipient

**Address:** `555eQPVoLJxPSbV1QCNSobFdRZdzKh4JxXq4Ber7iCxW` (fee treasury / authority, no relayer key configured)

| Asset | Balance | Sufficient for W0.d? | Notes |
|---|---|---|---|
| SOL (devnet) | 6.070984 SOL | **YES** | W0.d baseline round-trip needs ~0.01 SOL for tx fees; balance sufficient |
| USDC (devnet, mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU) | 11.098700 USDC | **YES** | W0.d leg 2 needs 1 USDC for source-side burn; ATA exists at Bm1puq69HLmpE1mDxwJkef3CNFECfH7Q1knDGjtJpsjA |

## Summary of Funding Status

**EVM Deployer (Tier 1 + Phase C/D/E):**
- Ethereum Sepolia: USDC ready; ETH shortfall (0.000000 / 0.05 needed)
- Base Sepolia: Marginal USDC (52.77 of ~50 minimum); ETH shortfall (0.000000 / 0.005 needed)
- Arbitrum Sepolia: Ready (Tier 3, no action)
- Optimism Sepolia: Zero balances (Tier 3, no action)
- Avalanche Fuji: USDC ready; AVAX shortfall (0.000000 / 0.005 estimated)
- Polygon Amoy: USDC ready; MATIC shortfall (0.000000 / 0.005 estimated)

**Solana Devnet (W0.d baseline):**
- SOL: Ready (6.07 > 0.01 minimum)
- USDC: Ready (11.10 > 1.0 minimum)

## Funding Gaps + Top-up Actions

### Ethereum Sepolia
- **Gap:** 0.05 ETH for Phase C contract deployment
- **Faucet:** https://www.alchemy.com/faucets/ethereum-sepolia (or Infura faucet)
- **Blocker:** YES (Phase C deploy blocked until ETH available)

### Base Sepolia
- **Gap:** 0.005 ETH for Phase C contract deployment
- **Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Note:** USDC balance (52.77) is marginal; recommend top-up to 100 USDC via Circle testnet faucet as buffer
- **Blocker:** YES (Phase C deploy blocked until ETH available)

### Avalanche Fuji
- **Gap:** 0.005 AVAX for Phase E burn tx fees
- **Faucet:** https://faucet.avax.network/ (testnet)
- **Blocker:** NO (Phase E planned, but gas available from platform sweep)

### Polygon Amoy
- **Gap:** 0.005 MATIC for Phase E burn tx fees
- **Faucet:** https://faucet.polygon.technology/ (testnet)
- **Blocker:** NO (Phase E planned, but gas available from platform sweep)

### Solana Devnet
- **Status:** SUFFICIENT (no gaps)

## Action Items for W0.d / W1 Resumption

1. **BLOCKING (Phase C cannot proceed):**
   - Top-up Ethereum Sepolia: 0.05 ETH to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Top-up Base Sepolia: 0.005 ETH to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Optional: Top-up Base Sepolia USDC to 100 units via https://faucet.circle.com (buffer against Phase D slippage)

2. **OPTIONAL (Phase E gas reserves):**
   - Top-up Avalanche Fuji: 0.01 AVAX to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Top-up Polygon Amoy: 0.01 MATIC to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

3. **CONFIRM:**
   - Solana relayer private key is NOT configured in .env.testnet (SOLANA_RELAYER_PRIVATE_KEY empty). W0.d baseline uses fee-treasury address instead. If dedicated relayer key is required, configure SOLANA_RELAYER_PRIVATE_KEY in deploy environment.

## Probe Methodology

All balances probed from public RPC endpoints via JSON-RPC calls:
- `eth_getBalance` for native currency (ETH, AVAX, MATIC)
- `eth_call` with selector 0x70a08231 (standard ERC20 balanceOf) for USDC
- `getBalance` for Solana SOL
- `getTokenAccountsByOwner` for Solana USDC ATA

No transactions submitted. Private keys never logged. Derived address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (public address only).

---

**Prepared by:** Frontier W1 preflight probe (CLI automation)  
**Verifiable:** Rerun via public RPCs; no credentials required to validate.
