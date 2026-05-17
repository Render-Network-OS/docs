# Circle Gas Station + Circle Solana CCTP Semantics Research (W0.c)

**Date:** 2026-05-17T05:32:03Z
**Sources of truth:**
- Circle Gas Station: https://developers.circle.com/wallets/gas-station
- Circle Solana CCTP programs: https://developers.circle.com/cctp/references/solana-programs

## Step 1: Circle Gas Station overview findings

**Networks supported:** Both EVM and Solana. The Circle docs list 21 supported blockchains including EVM L1/L2s (Ethereum, Arbitrum, Optimism, Polygon, Base, Avalanche, Aptos, Monad, Unichain, Arc) and explicitly Solana Mainnet plus Solana Devnet, with "full checkmarks" for both.

**Signer / payer model:** Gas Station is designed to sponsor transactions originating from a Circle **Programmable Wallet** (either user-controlled or developer-controlled). On EVM chains the sponsored wallet must be an ERC-4337 smart contract account. On Solana, sponsorship is delivered through a "Fee-Payer" wallet that pays gas, but the receiving side of the sponsorship is still described in terms of Circle's wallet products (user-controlled, developer-controlled, Programmable Wallet). The page does not describe a route that lets an arbitrary, non-Circle Solana keypair be the signer while Circle is the fee-payer.

**API surface for sponsored sends:** The public Gas Station overview page does not document the JSON-RPC / REST endpoints for sponsored sends in detail. It describes the high-level components ("Gas Sponsor", "Policy", "Billing") rather than a transaction estimation or submission API. Lower-level endpoints (e.g. `createTransaction`, policy attachment) live elsewhere in the Circle Wallets docs and were not enumerated on the page fetched. The `gas-station-policies` page returned HTTP 500 at fetch time.

**Documented limitations relevant to CCTP V2:** No CCTP V2 mention. The only Solana-specific affordance called out is ATA rent: "On Solana, Gas Station can sponsor the rent deposit for ATAs, or you can create and fund an ATA yourself." Nothing on the page addresses CCTP V2 burn instruction shape, signer constraints, or whether the V2 program treats Circle's Solana fee-payer specially.

Source quotes:
```
"Gas Station enables developers to build experiences that abstract gas - both for end-users and developers."

"Gas Sponsor: A third party smart contract or wallet that pays on-chain gas fees according to the sponsorship conditions."

"Policy: Let developers set up custom rules and limits on the blockchains they want to sponsor."

"Billing: Let developers pay all the gas fees using their preferred payment modes (cards)."

"Fee-Payer (Solana): Wallets that pay gas fees"

"On EVM chains, the Programmable Wallet must be an ERC-4337-compliant smart contract account."

"developers can create these wallets by passing \"accountType\": \"SCA\" in the create wallet API"

"Create your first developer-controlled wallets"

"Create your first user-controlled wallet"

"On Solana, Gas Station can sponsor the rent deposit for ATAs, or you can create and fund an ATA yourself"
```
(All quotes are verbatim from https://developers.circle.com/wallets/gas-station as captured 2026-05-17.)

The Gas Station overview does not contain any reference to "external wallet", "external signer", or "third-party wallet" being the sponsored party. The phrase "third party" appears only in the Gas Sponsor component description, referring to the sponsoring wallet, not the sponsored signer.

## Step 2: Circle Solana CCTP programs findings

**Program IDs:** Per https://developers.circle.com/cctp/references/solana-programs, the V2 Solana programs are deployed at the same addresses on mainnet and devnet:
- TokenMessengerMinterV2: `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe`
- MessageTransmitterV2: `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC`

**Gas-sponsor support documented?** No. The page does not mention Gas Station, paymasters, fee abstraction, sponsorship, or who must be the fee payer. The only fee reference is unrelated to sponsorship: "A fee may be charged for standard USDC transfers. Fees for standard transfers are set to 0, but are subject to change."

**Burn instruction fee-payer model:** The doc does not specify a designated fee-payer slot for sponsored transactions. `depositForBurn` is documented with parameters such as `maxFee` but no sponsor-aware account, and no description of a derived sponsor authority that would shift the transaction-fee-payer role away from the transaction's standard Solana fee payer.

**Circle Wallets recommended or required for CCTP Solana?** Neither. The Solana CCTP V2 reference page contains no mention of Circle Wallets.

Source quotes:
```
TokenMessengerMinterV2 (mainnet + devnet): "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe"
MessageTransmitterV2 (mainnet + devnet): "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC"

"A fee may be charged for standard USDC transfers. Fees for standard transfers are set to 0, but are subject to change."
```

## Step 3: sw4p's actual Solana CCTP signer flow

**Current fee-payer:** sw4p uses a raw Solana `Keypair` loaded from `SOLANA_RELAYER_PRIVATE_KEY` (base58 env var) as the fee payer of CCTP V2 burn transactions. The relayer keypair is also the transaction signer; it is not a Circle-managed wallet.

**Custody model:** Raw keypair via `SOLANA_RELAYER_PRIVATE_KEY`. There is no WaaS / Circle-Wallet API call in the CCTP burn submission path; the keypair is deserialized in-process at relayer construction time and used directly to sign and submit.

**Existing Kora integration:** Yes. `sw4p-backend/src/kora.rs` is the Kora JSON-RPC client used for gas sponsorship today. The default `SolanaGasSponsorProvider` is `Kora`. A `Circle` variant exists in `deploy_contract.rs` and is selected via env, but its fee-payer resolution (`required_circle_solana_fee_payer_pubkey`) reads `CIRCLE_SOLANA_FEE_PAYER_PUBKEY` / `WAAS_WALLET_ADDRESS_SOL` / `WAAS_WALLET_SOL`. That is, the Circle path already assumes a Circle WaaS (Wallets-as-a-Service) account as the fee-payer pubkey, not an arbitrary non-Circle account.

Code references (paths relative to `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16`):
```
sw4p-backend/src/relayer.rs:47:    pub keypair: Keypair,
sw4p-backend/src/relayer.rs:59:            panic!("SOLANA_RELAYER_PRIVATE_KEY is empty - cannot create relayer");
sw4p-backend/src/relayer.rs:62:        let keypair = Keypair::from_base58_string(private_key);
sw4p-backend/src/relayer.rs:66:        let cctp_keypair = Keypair::from_base58_string(private_key);
sw4p-backend/src/relayer.rs:829:                "SOLANA_RELAYER_PRIVATE_KEY",

sw4p-backend/src/cctp_burn.rs:107:/// Kora's fee_payer_outflow includes: transaction fees + MessageSent account rent
sw4p-backend/src/cctp_burn.rs:439:        relayer_keypair: &Keypair,
sw4p-backend/src/cctp_burn.rs:501:        let mut tx = Transaction::new_with_payer(&instructions, Some(&relayer_keypair.pubkey()));
sw4p-backend/src/cctp_burn.rs:670:        fee_payer: &Pubkey,
sw4p-backend/src/cctp_burn.rs:1055:        fee_payer: &Pubkey,
sw4p-backend/src/cctp_burn.rs:1115:            AccountMeta::new(*fee_payer, true),        // 1: fee_payer (signer, writable)

sw4p-backend/src/kora.rs:3://! Client for communicating with Kora gas sponsorship service.
sw4p-backend/src/kora.rs:213:    /// Sign transaction (partial sign) - Kora adds fee_payer signature only

sw4p-backend/src/deploy_contract.rs:27:pub enum SolanaGasSponsorProvider {
sw4p-backend/src/deploy_contract.rs:28:    Circle,
sw4p-backend/src/deploy_contract.rs:29:    Kora,
sw4p-backend/src/deploy_contract.rs:200:        return Ok(SolanaGasSponsorProvider::Kora);
sw4p-backend/src/deploy_contract.rs:204:        "circle" | "circlegasstation" | "circlescp" => Ok(SolanaGasSponsorProvider::Circle),

sw4p-backend/src/sdk_solana.rs:1012:fn required_circle_solana_fee_payer_pubkey() -> Result<solana_sdk::pubkey::Pubkey, String> {
sw4p-backend/src/sdk_solana.rs:1016:    let candidates = [
sw4p-backend/src/sdk_solana.rs:1017:        "CIRCLE_SOLANA_FEE_PAYER_PUBKEY",
sw4p-backend/src/sdk_solana.rs:1018:        "WAAS_WALLET_ADDRESS_SOL",
sw4p-backend/src/sdk_solana.rs:1019:        "WAAS_WALLET_SOL",
sw4p-backend/src/sdk_solana.rs:1030:        "Circle Solana sponsorship selected but none of CIRCLE_SOLANA_FEE_PAYER_PUBKEY, WAAS_WALLET_ADDRESS_SOL, or WAAS_WALLET_SOL is configured"
```

## Step 4: Fit determination

**Determination:** FIT NOT CONFIRMED.

**Reasoning:**

Per the cycle spec, acceptance requires "a real Solana devnet CCTP transaction where Circle is the effective fee payer for the exact production path." sw4p's exact production path uses a raw Solana `Keypair` loaded directly from `SOLANA_RELAYER_PRIVATE_KEY` as the on-chain fee-payer and signer of the CCTP V2 burn. That keypair is deserialized in-process by `SolanaRelayer::new` and consumed end-to-end by `cctp_burn::build_native_bridge_transaction`, which writes the fee-payer pubkey into the burn instruction's signer slot.

Circle Gas Station's published surface describes sponsorship as flowing through Circle Wallets (user-controlled or developer-controlled Programmable Wallets). The "Fee-Payer (Solana)" component is described as a wallet that pays gas, but every concrete example and configuration path in Circle's docs assumes the sponsored party is itself a Circle Wallet. The Solana CCTP V2 programs reference makes no mention of Gas Station, paymasters, or any sponsor-aware account in the burn instruction's account list. There is no documented route, on either the Circle Gas Station overview page or the Solana CCTP programs reference, for an arbitrary externally-managed Solana keypair to keep on-chain custody of the burn signer while Circle pays the gas via Gas Station.

sw4p's own internal `SolanaGasSponsorProvider::Circle` scaffolding confirms this reading: the Circle path resolves its fee-payer from `CIRCLE_SOLANA_FEE_PAYER_PUBKEY` / `WAAS_WALLET_ADDRESS_SOL` / `WAAS_WALLET_SOL`, all of which name Circle WaaS-controlled accounts, not the relayer keypair. To exercise Circle as the effective fee-payer of the exact production CCTP burn, sw4p would need to migrate its Solana relayer custody from a raw env keypair to a Circle WaaS-controlled wallet (and adopt Circle's transaction-creation flow for that wallet). That migration is structural and out of W0 scope. Kora, by contrast, is already wired as a JSON-RPC partial-signer for the fee-payer slot and is the default `SolanaGasSponsorProvider`.

## Step 5: Path forward

- **If FIT CONFIRMED:** Proceed to Task 4.2 (real-action authorization gate) for a real Solana devnet CCTP burn with Circle Gas Station as effective fee payer. Task 4.5 then updates the Live Dependency Matrix Circle row with "PASS, real tx captured".
- **If FIT NOT CONFIRMED:** Skip Tasks 4.2 + 4.3; proceed to Task 4.4 (write deferral document). Task 4.5 updates the matrix row with "deferred, Kora retained".

**Selected path:** Task 4.4

## Conclusion

The Circle Gas Station applicability to sw4p's Solana CCTP signer flow is: NOT FIT.

Per spec W8.f: Kora retention recorded; sunset deferred.
