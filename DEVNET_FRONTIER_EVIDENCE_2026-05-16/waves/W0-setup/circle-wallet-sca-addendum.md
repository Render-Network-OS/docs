# Circle SCA Wallet Addendum (W0-setup)

Date: 2026-05-17
Wave: W0-setup, addendum to `circle-wallet-setup.md`
Status: DONE

## Reason

During W1 Phase C (Tier-1 SCP deploys, commit `176a4b94`, evidence `phase-c-tier1-scp-deploys.md`), transaction submission against the EOA wallets provisioned in W0 (commit `d3a94f6d`, evidence `circle-wallet-setup.md`) failed with Circle error code `177025` ("the asset amount owned by the wallet is insufficient for the transaction.").

Investigation confirmed that Circle Gas Station policies sponsor only `accountType: SCA` wallets, not `accountType: EOA`. The Gas Station policies are already configured per the user. The remediation is to provision SCA wallets in the same wallet set and re-run W1.c with the SCA wallet IDs.

## Scope

Provisioned 6 SCA wallets, one per Tier-1 EVM testnet, in the existing wallet set.

- Wallet Set ID (unchanged): `29b8aae4-e37b-5e72-9653-c7157ad20c0c`
- Wallet Set Name: `sw4p-devnet-frontier-2026-05-17`
- Custody: `DEVELOPER`

Solana relayer is unchanged and stays on EOA wallet `d9182ce5-eedf-5857-a835-63f308892a25`; Solana has no SCA concept under Circle WaaS and is already funded.

## Per-chain SCA Wallet Table

| Name | Blockchain | Wallet ID | Address | accountType | state |
|---|---|---|---|---|---|
| sw4p-deployer-sca-eth-sepolia  | ETH-SEPOLIA  | `f929a768-f311-569f-8cdc-db03fd925c6c` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |
| sw4p-deployer-sca-base-sepolia | BASE-SEPOLIA | `b150e7c0-0a05-5bdb-9875-8503eeb42ed3` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |
| sw4p-deployer-sca-arb-sepolia  | ARB-SEPOLIA  | `f0ad8b79-71b9-5353-aebc-9994a8dba10c` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |
| sw4p-deployer-sca-op-sepolia   | OP-SEPOLIA   | `927cbd6f-d43e-5c39-83bb-a75b542ac74c` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |
| sw4p-deployer-sca-avax-fuji    | AVAX-FUJI    | `d2ddab0e-bb2b-50cc-bebc-0049b4f78bda` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |
| sw4p-deployer-sca-matic-amoy   | MATIC-AMOY   | `e847e311-abbb-53c5-9826-87feabab9972` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | SCA | LIVE |

Notes:

1. All six SCA wallets share the same EVM address `0x7ddba97f140f936a53669aa1ba73f04dd25557d4`. This is expected: Circle's SCA implementation uses a deterministic ERC-4337 factory keyed on the wallet-set owner, so the counterfactual address is identical across chains. Wallet IDs differ per chain and must be used to scope transactions, not the shared address.
2. All six wallets reported `state: LIVE` immediately on creation. The SCA contract itself is counterfactual until the first user operation; Gas Station handles factory deployment on the sponsored userOp.
3. The wallet `name` field is set on POST and is visible on the create response, but the per-wallet GET response does not echo `name` back at the wallet level; the wallet set name remains `sw4p-devnet-frontier-2026-05-17`.

## Env-var Block Appended to `.env.testnet`

Appended to the worktree-local `.env.testnet` (NOT committed, runtime-only) under the marker
`# Circle SCA Wallets provisioned 2026-05-17 for Gas-Station-sponsored deploys`:

```
WAAS_SCA_WALLET_ID_ETH_SEPOLIA=f929a768-f311-569f-8cdc-db03fd925c6c
WAAS_SCA_WALLET_ADDRESS_ETH_SEPOLIA=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
WAAS_SCA_WALLET_ID_BASE_SEPOLIA=b150e7c0-0a05-5bdb-9875-8503eeb42ed3
WAAS_SCA_WALLET_ADDRESS_BASE_SEPOLIA=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
WAAS_SCA_WALLET_ID_ARB_SEPOLIA=f0ad8b79-71b9-5353-aebc-9994a8dba10c
WAAS_SCA_WALLET_ADDRESS_ARB_SEPOLIA=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
WAAS_SCA_WALLET_ID_OP_SEPOLIA=927cbd6f-d43e-5c39-83bb-a75b542ac74c
WAAS_SCA_WALLET_ADDRESS_OP_SEPOLIA=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
WAAS_SCA_WALLET_ID_AVAX_FUJI=d2ddab0e-bb2b-50cc-bebc-0049b4f78bda
WAAS_SCA_WALLET_ADDRESS_AVAX_FUJI=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
WAAS_SCA_WALLET_ID_MATIC_AMOY=e847e311-abbb-53c5-9826-87feabab9972
WAAS_SCA_WALLET_ADDRESS_MATIC_AMOY=0x7ddba97f140f936a53669aa1ba73f04dd25557d4
```

## Verification Method

1. `GET /v1/w3s/walletSets/29b8aae4-e37b-5e72-9653-c7157ad20c0c` confirmed wallet set still owned and unchanged.
2. Fresh entity public key fetched via `GET /v1/w3s/config/entity/publicKey`; entity secret ciphertext minted per-request via Node `crypto.publicEncrypt` with `RSA-OAEP / sha256`.
3. Six independent `POST /v1/w3s/developer/wallets` calls with `accountType: SCA`, `count: 1`, `walletSetId` set, unique `idempotencyKey` per call.
4. Each wallet re-checked with `GET /v1/w3s/wallets/{id}`; all reported `accountType: SCA`, `state: LIVE`, expected blockchain.

## Failures

None. All 6 chains accepted `accountType: SCA` on first call.

## Next Action

Re-run W1 Phase C (Tier-1 SCP contract deploys) targeting the SCA wallet IDs in the env-var block above, so Gas Station sponsorship covers the funding gap that broke commit `176a4b94`. Update Phase C evidence with the new transaction IDs and gas-sponsorship confirmations from Circle.
