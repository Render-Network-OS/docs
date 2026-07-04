import { createRequire } from 'module';
const require = createRequire('/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-bot/milaidy/');
const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const { Connection, PublicKey, Keypair, Transaction, TransactionMessage, VersionedTransaction, AddressLookupTableAccount, ComputeBudgetProgram } = web3;
const { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = splToken;

const RPC = 'https://api.mainnet-beta.solana.com';
const conn = new Connection(RPC, 'confirmed');
const MINT = new PublicKey('CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2'); // canonical 555
const SPENDER = new PublicKey('555V6EhaHLiCMq75Pg4reT7Q4YDMCH4Q7Spvrddfjg9r');
const sourceATA = getAssociatedTokenAddressSync(MINT, SPENDER);
const AMOUNT = 555n * 1_000000n; // base tier, 6 decimals; amount does not affect size/CU

const { blockhash } = await conn.getLatestBlockhash();

// Build one recipient's (createATA + transfer) instruction pair.
function pairFor(ownerPk) {
  const ata = getAssociatedTokenAddressSync(MINT, ownerPk);
  return [
    createAssociatedTokenAccountInstruction(SPENDER, ata, ownerPk, MINT),
    createTransferInstruction(sourceATA, ata, SPENDER, AMOUNT),
  ];
}

// LEGACY: find max recipients that fit in a 1232-byte legacy tx.
function legacySize(k) {
  const tx = new Transaction();
  for (let i = 0; i < k; i++) tx.add(...pairFor(Keypair.generate().publicKey));
  tx.recentBlockhash = blockhash;
  tx.feePayer = SPENDER;
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).length;
}
let legacyMax = 0;
for (let k = 1; k <= 30; k++) {
  let size;
  try { size = legacySize(k); } catch { break; }
  if (size <= 1232) legacyMax = k; else break;
}
const legacyBytesAtMax = legacySize(legacyMax);

// V0 + ALT holding the static accounts (mint, sourceATA, spender, token/ATA/system programs).
function v0Size(k, useAlt) {
  const ixs = [];
  for (let i = 0; i < k; i++) ixs.push(...pairFor(Keypair.generate().publicKey));
  const staticAddrs = [MINT, sourceATA, SPENDER, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, web3.SystemProgram.programId];
  const alt = useAlt ? [new AddressLookupTableAccount({ key: Keypair.generate().publicKey, state: { addresses: staticAddrs, authority: SPENDER, deactivationSlot: 2n ** 64n - 1n, lastExtendedSlot: 0, lastExtendedSlotStartIndex: 0 } })] : [];
  const msg = new TransactionMessage({ payerKey: SPENDER, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message(alt);
  const vtx = new VersionedTransaction(msg);
  return vtx.serialize().length; // includes empty sig space
}
let v0AltMax = 0;
for (let k = 1; k <= 40; k++) {
  let size;
  try { size = v0Size(k, true); } catch { break; }
  if (size <= 1232) v0AltMax = k; else break;
}

// Simulate a createATA-only batch (no funded source needed) to read exact CU per createATA.
const simIxs = [];
const N_SIM = legacyMax;
for (let i = 0; i < N_SIM; i++) {
  const owner = Keypair.generate().publicKey;
  const ata = getAssociatedTokenAddressSync(MINT, owner);
  simIxs.push(createAssociatedTokenAccountInstruction(SPENDER, ata, owner, MINT));
}
const simMsg = new TransactionMessage({ payerKey: SPENDER, recentBlockhash: blockhash, instructions: simIxs }).compileToV0Message();
const simTx = new VersionedTransaction(simMsg);
let cu = null;
try {
  const sim = await conn.simulateTransaction(simTx, { sigVerify: false, replaceRecentBlockhash: true });
  cu = sim.value.unitsConsumed ?? null;
  var simErr = sim.value.err;
} catch (e) { var simErr = String(e); }

// ---- Exact cost for 10,000 wallets ----
const N = 10000;
const RENT = 2039280; // lamports per ATA (measured exactly)
const BASE_FEE = 5000; // lamports per signature (1 sig per tx)
const PRIORITY_PER_CU = 0; // getRecentPrioritizationFees median/p75 = 0 right now
const SOL_USD = 81.7;

for (const [label, K] of [['legacy', legacyMax], ['v0+ALT(static)', v0AltMax]]) {
  const txs = Math.ceil(N / K);
  const rentLamports = N * RENT;
  const feeLamports = txs * BASE_FEE + txs * (cu ? Math.ceil((cu / N_SIM) * K) : 0) * PRIORITY_PER_CU / 1e6;
  const totalLamports = rentLamports + feeLamports;
  const totalSol = totalLamports / 1e9;
  console.log(`\n[${label}] recipients/tx=${K}, txs=${txs}`);
  console.log(`  rent:       ${(rentLamports/1e9).toFixed(9)} SOL`);
  console.log(`  base fees:  ${(txs*BASE_FEE/1e9).toFixed(9)} SOL (${txs} txs x 5000 lamports)`);
  console.log(`  priority:   ${(0).toFixed(9)} SOL (current network priority = 0)`);
  console.log(`  TOTAL:      ${totalSol.toFixed(9)} SOL  = $${(totalSol*SOL_USD).toFixed(2)} at $${SOL_USD}/SOL`);
}
console.log(`\nlegacy max recipients/tx=${legacyMax} (bytes at max=${legacyBytesAtMax}/1232)`);
console.log(`v0+ALT max recipients/tx=${v0AltMax}`);
console.log(`simulated createATA batch (${N_SIM} ix): CU=${cu}, err=${JSON.stringify(simErr)}, CU/createATA=${cu?Math.round(cu/N_SIM):'n/a'}`);
console.log(`rent/ATA=${RENT} lamports (${RENT/1e9} SOL), SOL=$${SOL_USD}`);
