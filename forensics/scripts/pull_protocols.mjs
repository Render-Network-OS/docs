import fs from 'node:fs/promises';
import path from 'node:path';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';

const OUT_DIR = process.env.FORENSICS_OUT_DIR || 'forensics/output';
const MINT = new PublicKey('CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2');
const CREATOR = new PublicKey('HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq');
const CANONICAL_POOL = new PublicKey('FKBEZmogcdNGm1rtqCJpkLY9gW77antPkBXhSFftGHTG');
const KNOWN_STREAM_IDS = [
  '6jEBKmB1mUD7tpgVn35ZqxTmSvhDSqpWBVzPzUiyqttb',
  'HHXgYtezE32aATgWQFn3knAsy2xhQsjfepps3MLe3MXN',
  'BSkf98N8ppTciokTv56AFA8f6HU4Kux7Ee9DV63mUinQ',
];
const RPC_ENDPOINTS = [
  'https://rpc.solanatracker.io/public',
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
];

function jsonSafe(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return undefined;
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (typeof value.toBase58 === 'function') return value.toBase58();
  if (typeof value.toString === 'function' && value.constructor?.name === 'BN') return value.toString(10);
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value).toString('base64');
  if (Array.isArray(value)) return value.map((item) => jsonSafe(item, seen));
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    const safe = jsonSafe(item, seen);
    if (safe !== undefined) output[key] = safe;
  }
  return output;
}

async function selectConnection() {
  const attempts = [];
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, { commitment: 'confirmed', confirmTransactionInitialTimeout: 30_000 });
      const slot = await Promise.race([
        connection.getSlot('confirmed'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15_000)),
      ]);
      attempts.push({ endpoint, ok: true, slot });
      return { connection, endpoint, attempts };
    } catch (error) {
      attempts.push({ endpoint, ok: false, error: String(error?.message || error) });
    }
  }
  throw new Error(`No Solana RPC endpoint available: ${JSON.stringify(attempts)}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'accept': 'application/json',
      'user-agent': 'rndrntwrk-forensics/1.0',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  return body;
}

function addAddress(registry, address, role, source, details = {}) {
  if (!address) return;
  const value = String(address);
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return;
  const current = registry.get(value) || { address: value, roles: [], sources: [], details: [] };
  if (role && !current.roles.includes(role)) current.roles.push(role);
  if (source && !current.sources.includes(source)) current.sources.push(source);
  if (details && Object.keys(details).length) current.details.push(details);
  registry.set(value, current);
}

function extractPublicKeys(value, output = new Set(), seen = new WeakSet()) {
  if (value === null || value === undefined) return output;
  if (typeof value === 'string') {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) output.add(value);
    return output;
  }
  if (typeof value !== 'object') return output;
  if (seen.has(value)) return output;
  seen.add(value);
  if (typeof value.toBase58 === 'function') {
    output.add(value.toBase58());
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractPublicKeys(item, output, seen);
  } else {
    for (const item of Object.values(value)) extractPublicKeys(item, output, seen);
  }
  return output;
}

function bnToString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value?.toString === 'function') return value.toString(10);
  return String(value);
}

function streamSummary(stream, decimals, id) {
  const now = Math.floor(Date.now() / 1000);
  let unlocked = null;
  let remaining = null;
  try { unlocked = bnToString(stream.unlocked(now)); } catch {}
  try { remaining = stream.remaining(decimals); } catch {}
  const summary = {
    id,
    mint: String(stream.mint || stream.tokenId || stream.token || ''),
    sender: String(stream.sender || ''),
    recipient: String(stream.recipient || ''),
    partner: stream.partner ? String(stream.partner) : null,
    escrowTokens: stream.escrowTokens ? String(stream.escrowTokens) : null,
    depositedAmountRaw: bnToString(stream.depositedAmount ?? stream.amount),
    withdrawnAmountRaw: bnToString(stream.withdrawnAmount),
    unlockedAmountRawAtSnapshot: unlocked,
    remainingDisplayAtSnapshot: remaining,
    start: Number(stream.start || 0),
    cliff: Number(stream.cliff || 0),
    end: Number(stream.end || 0),
    period: Number(stream.period || 0),
    cliffAmountRaw: bnToString(stream.cliffAmount),
    amountPerPeriodRaw: bnToString(stream.amountPerPeriod),
    cancelableBySender: Boolean(stream.cancelableBySender),
    cancelableByRecipient: Boolean(stream.cancelableByRecipient),
    transferableBySender: Boolean(stream.transferableBySender),
    transferableByRecipient: Boolean(stream.transferableByRecipient),
    automaticWithdrawal: Boolean(stream.automaticWithdrawal),
    canTopup: Boolean(stream.canTopup),
    canUpdateRate: Boolean(stream.canUpdateRate),
    name: stream.name || null,
    tokenDecimals: decimals,
    raw: jsonSafe(stream),
  };
  return summary;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const registry = new Map();
  addAddress(registry, MINT, 'token_mint', 'canonical');
  addAddress(registry, CREATOR, 'pump_creator_wallet', 'canonical');
  addAddress(registry, CANONICAL_POOL, 'pumpswap_pool', 'canonical');
  for (const id of KNOWN_STREAM_IDS) addAddress(registry, id, 'streamflow_contract', 'gmail_recovery');
  addAddress(registry, '555Tm1cfV52SrBQmnxXiHMUMrpci8miW3CkLP1Qbmtd7', 'historical_solana_treasury_candidate', 'gmail_recovery');
  addAddress(registry, '3tYcXT1hsJCEdLHHLzop1zRbXb9U9fp8jQEq6NfJNe2E', 'historical_solana_fee_payer_candidate', 'gmail_recovery');
  addAddress(registry, 'BdEJFpK56hjdzopkmQeHiH3SwHCXrHtUMNH4jFkDTdA5', 'streamflow_related_wallet_candidate', 'gmail_recovery');

  const { connection, endpoint, attempts } = await selectConnection();
  const mintInfo = await connection.getParsedAccountInfo(MINT, 'confirmed');
  const decimals = Number(mintInfo.value?.data?.parsed?.info?.decimals ?? 6);
  const result = {
    generatedAt: new Date().toISOString(),
    rpcEndpoint: endpoint,
    rpcAttempts: attempts,
    mint: MINT.toBase58(),
    creator: CREATOR.toBase58(),
    canonicalPool: CANONICAL_POOL.toBase58(),
    tokenDecimals: decimals,
    pump: { errors: [] },
    streamflow: { known: [], discovered: [], errors: [] },
    externalSnapshots: {},
  };

  try {
    const pump = await import('@pump-fun/pump-sdk');
    const pumpSwap = await import('@pump-fun/pump-swap-sdk');
    const {
      OnlinePumpSdk,
      creatorVaultPda,
      feeSharingConfigPda,
      canonicalPumpPoolPda,
      isCreatorUsingSharingConfig,
    } = pump;
    const {
      coinCreatorVaultAuthorityPda,
      coinCreatorVaultAtaPda,
    } = pumpSwap;

    const onlinePump = new OnlinePumpSdk(connection);
    let pool = null;
    let bondingCurve = null;
    try { pool = await onlinePump.fetchPool(MINT); } catch (error) { result.pump.errors.push(`fetchPool: ${error?.message || error}`); }
    try { bondingCurve = await onlinePump.fetchBondingCurve(MINT); } catch (error) { result.pump.errors.push(`fetchBondingCurve: ${error?.message || error}`); }

    const poolSafe = jsonSafe(pool);
    const curveSafe = jsonSafe(bondingCurve);
    const candidateCreators = new Set([CREATOR.toBase58()]);
    for (const key of ['coinCreator', 'creator']) {
      const value = poolSafe?.[key] || curveSafe?.[key];
      if (typeof value === 'string') candidateCreators.add(value);
    }

    const sharingConfig = feeSharingConfigPda(MINT);
    const sharingAccount = await connection.getAccountInfo(sharingConfig, 'confirmed');
    const creatorVaults = [];
    for (const creatorString of candidateCreators) {
      const creatorKey = new PublicKey(creatorString);
      let usingSharing = false;
      try { usingSharing = Boolean(isCreatorUsingSharingConfig({ mint: MINT, creator: creatorKey })); } catch {}
      const effectiveCreator = usingSharing ? sharingConfig : creatorKey;
      const pumpVault = creatorVaultPda(effectiveCreator);
      const pumpVaultInfo = await connection.getAccountInfo(pumpVault, 'confirmed');
      const rentExempt = pumpVaultInfo ? await connection.getMinimumBalanceForRentExemption(pumpVaultInfo.data.length) : 0;
      const pumpAvailableLamports = Math.max(0, Number(pumpVaultInfo?.lamports || 0) - Number(rentExempt || 0));
      const ammAuthority = coinCreatorVaultAuthorityPda(effectiveCreator);
      const ammVaultAta = coinCreatorVaultAtaPda(ammAuthority, NATIVE_MINT);
      let ammWsolRaw = '0';
      try { ammWsolRaw = (await connection.getTokenAccountBalance(ammVaultAta, 'confirmed')).value.amount; } catch {}
      let sdkCombinedRaw = null;
      try { sdkCombinedRaw = bnToString(await onlinePump.getCreatorVaultBalanceBothPrograms(effectiveCreator)); } catch (error) { result.pump.errors.push(`getCreatorVaultBalanceBothPrograms(${effectiveCreator}): ${error?.message || error}`); }
      creatorVaults.push({
        declaredCreator: creatorString,
        usingSharingConfig: usingSharing,
        effectiveCreator: effectiveCreator.toBase58(),
        sharingConfig: sharingConfig.toBase58(),
        sharingConfigExists: Boolean(sharingAccount),
        pumpVault: pumpVault.toBase58(),
        pumpVaultLamports: String(pumpVaultInfo?.lamports || 0),
        pumpVaultRentExemptLamports: String(rentExempt || 0),
        pumpAvailableLamports: String(pumpAvailableLamports),
        ammCreatorVaultAuthority: ammAuthority.toBase58(),
        ammWsolVaultAta: ammVaultAta.toBase58(),
        ammWsolRaw,
        sdkCombinedRaw,
        computedCombinedRaw: (BigInt(pumpAvailableLamports) + BigInt(ammWsolRaw)).toString(),
        computedCombinedSol: Number(BigInt(pumpAvailableLamports) + BigInt(ammWsolRaw)) / LAMPORTS_PER_SOL,
      });
      addAddress(registry, creatorString, 'pump_coin_creator_candidate', 'pump_sdk');
      addAddress(registry, effectiveCreator, usingSharing ? 'pump_fee_sharing_config' : 'pump_effective_creator', 'pump_sdk');
      addAddress(registry, sharingConfig, 'pump_fee_sharing_config_pda', 'pump_sdk');
      addAddress(registry, pumpVault, 'pump_creator_vault', 'pump_sdk', { creator: effectiveCreator.toBase58() });
      addAddress(registry, ammAuthority, 'pumpswap_creator_vault_authority', 'pump_sdk', { creator: effectiveCreator.toBase58() });
      addAddress(registry, ammVaultAta, 'pumpswap_creator_wsol_vault', 'pump_sdk', { creator: effectiveCreator.toBase58() });
    }

    let derivedCanonicalPool = null;
    try { derivedCanonicalPool = canonicalPumpPoolPda(MINT).toBase58(); } catch {}
    result.pump = {
      ...result.pump,
      programIds: {
        pump: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        pumpAmm: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
        pumpFees: 'pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ',
      },
      pool: poolSafe,
      bondingCurve: curveSafe,
      derivedCanonicalPool,
      creatorVaults,
      sharingConfig: sharingConfig.toBase58(),
      sharingConfigExists: Boolean(sharingAccount),
    };
    if (derivedCanonicalPool) addAddress(registry, derivedCanonicalPool, 'derived_canonical_pumpswap_pool', 'pump_sdk');
    for (const pk of extractPublicKeys(poolSafe)) addAddress(registry, pk, 'pump_pool_related_account', 'pump_sdk');
    for (const pk of extractPublicKeys(curveSafe)) addAddress(registry, pk, 'pump_curve_related_account', 'pump_sdk');
  } catch (error) {
    result.pump.errors.push(`pump_sdk_import_or_execution: ${error?.stack || error}`);
  }

  try {
    const streamModule = await import('@streamflow/stream');
    const { StreamflowSolana } = streamModule;
    const client = new StreamflowSolana.SolanaStreamClient(endpoint);
    const knownStreams = [];
    for (const id of KNOWN_STREAM_IDS) {
      try {
        const stream = await client.getOne({ id });
        const summary = streamSummary(stream, decimals, id);
        knownStreams.push(summary);
        addAddress(registry, summary.sender, 'streamflow_sender', `streamflow:${id}`);
        addAddress(registry, summary.recipient, 'streamflow_recipient', `streamflow:${id}`);
        addAddress(registry, summary.partner, 'streamflow_partner', `streamflow:${id}`);
        addAddress(registry, summary.escrowTokens, 'streamflow_escrow_token_account', `streamflow:${id}`);
        for (const pk of extractPublicKeys(stream)) addAddress(registry, pk, 'streamflow_related_account', `streamflow:${id}`);
      } catch (error) {
        result.streamflow.errors.push(`getOne(${id}): ${error?.stack || error}`);
      }
    }
    result.streamflow.known = knownStreams;

    try {
      const search = typeof client.searchStreams === 'function'
        ? await client.searchStreams({ mint: MINT.toBase58() })
        : await client.nativeStreamClient.searchStreams({ mint: MINT.toBase58() });
      const discovered = [];
      for (const item of search || []) {
        const id = String(item.publicKey || item.id || item.metadataId || '');
        const stream = item.account || item.stream || item;
        const summary = streamSummary(stream, decimals, id);
        discovered.push(summary);
        addAddress(registry, id, 'streamflow_contract_discovered_by_mint', 'streamflow_sdk');
        addAddress(registry, summary.sender, 'streamflow_sender', `streamflow:${id}`);
        addAddress(registry, summary.recipient, 'streamflow_recipient', `streamflow:${id}`);
        addAddress(registry, summary.partner, 'streamflow_partner', `streamflow:${id}`);
        addAddress(registry, summary.escrowTokens, 'streamflow_escrow_token_account', `streamflow:${id}`);
        for (const pk of extractPublicKeys(stream)) addAddress(registry, pk, 'streamflow_related_account', `streamflow:${id}`);
      }
      result.streamflow.discovered = discovered;
    } catch (error) {
      result.streamflow.errors.push(`searchStreams(mint): ${error?.stack || error}`);
    }
  } catch (error) {
    result.streamflow.errors.push(`streamflow_sdk_import_or_execution: ${error?.stack || error}`);
  }

  const externalUrls = {
    pumpMetadata: `https://frontend-api-v3.pump.fun/coins/${MINT.toBase58()}`,
    dexScreener: `https://api.dexscreener.com/latest/dex/pairs/solana/${CANONICAL_POOL.toBase58()}`,
    geckoTerminal: `https://api.geckoterminal.com/api/v2/networks/solana/pools/${CANONICAL_POOL.toBase58()}`,
    streamflowOracle: `https://oracle-api-public.streamflow.finance/oracle/${MINT.toBase58()}`,
  };
  for (const [name, url] of Object.entries(externalUrls)) {
    try { result.externalSnapshots[name] = await fetchJson(url); }
    catch (error) { result.externalSnapshots[name] = { error: String(error?.message || error), url }; }
  }

  const addresses = [...registry.values()].sort((a, b) => a.address.localeCompare(b.address));
  await fs.writeFile(path.join(OUT_DIR, 'protocol_snapshot.json'), `${JSON.stringify(result, null, 2)}\n`);
  await fs.writeFile(path.join(OUT_DIR, 'discovered_addresses.json'), `${JSON.stringify(addresses, null, 2)}\n`);
  console.log(JSON.stringify({ rpc: endpoint, addresses: addresses.length, knownStreams: result.streamflow.known.length, discoveredStreams: result.streamflow.discovered.length, pumpVaults: result.pump.creatorVaults?.length || 0 }, null, 2));
}

main().catch(async (error) => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, 'protocol_collector_fatal.txt'), String(error?.stack || error));
  console.error(error);
  process.exitCode = 1;
});
