#!/usr/bin/env python3
from __future__ import annotations

import csv
import datetime as dt
import json
import math
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Iterable

OUT_DIR = Path(os.getenv("FORENSICS_OUT_DIR", "forensics/output"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

MINT = "CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2"
CREATOR = "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq"
POOL = "FKBEZmogcdNGm1rtqCJpkLY9gW77antPkBXhSFftGHTG"
WSOL = "So11111111111111111111111111111111111111112"
USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
STREAMFLOW_PROGRAM = "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m"
PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
PUMP_AMM_PROGRAM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
PUMP_FEE_PROGRAM = "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
JUPITER_PROGRAMS = {
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
}
PUMP_PROGRAMS = {PUMP_PROGRAM, PUMP_AMM_PROGRAM, PUMP_FEE_PROGRAM}
SWAP_PROGRAMS = PUMP_PROGRAMS | JUPITER_PROGRAMS | {
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  # Raydium AMM v4
    "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",  # Raydium CP
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpazFZfGmQhNi7",  # Orca Whirlpool
}
KNOWN_SIGNATURES = {
    "2YF4uZd8FhgHCjknRB2ESr6sTkEzUiooem5Phne85DHZhZKaCsQ14rLCmEHzhnFH2o58wWFM5YAPpPZ5VP5QgPLU",
    "3txoZUFBGGyKHtLGHMkPmoC7fSzzP1oeQF1eM7M8FDMLhxGYW5aeNPYmLiBSVcbMK8C2GiLqBhCD6szauF4uVVYR",
}
CUTOFF_TS = int(dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc).timestamp())
RPC_ENDPOINTS = [
    "https://rpc.solanatracker.io/public",
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com",
    "https://rpc.ankr.com/solana",
]


def utc_iso(timestamp: int | None) -> str:
    if not timestamp:
        return ""
    return dt.datetime.fromtimestamp(timestamp, tz=dt.timezone.utc).isoformat()


def request_json(url: str, *, data: Any | None = None, headers: dict[str, str] | None = None, timeout: int = 45) -> Any:
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Accept": "application/json",
            "User-Agent": "rndrntwrk-forensics/1.0",
            **({"Content-Type": "application/json"} if body is not None else {}),
            **(headers or {}),
        },
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        raw = response.read()
    return json.loads(raw.decode("utf-8"))


class RpcClient:
    def __init__(self, endpoints: list[str]) -> None:
        self.endpoints = endpoints
        self.preferred = 0
        self.probes: list[dict[str, Any]] = []
        self._probe()

    def _probe(self) -> None:
        for idx, endpoint in enumerate(self.endpoints):
            try:
                response = request_json(endpoint, data={"jsonrpc": "2.0", "id": 1, "method": "getSlot", "params": [{"commitment": "confirmed"}]}, timeout=20)
                if response.get("result") is not None:
                    self.preferred = idx
                    self.probes.append({"endpoint": endpoint, "ok": True, "slot": response["result"]})
                    return
                self.probes.append({"endpoint": endpoint, "ok": False, "response": response})
            except Exception as exc:  # noqa: BLE001
                self.probes.append({"endpoint": endpoint, "ok": False, "error": str(exc)})
        raise RuntimeError(f"No Solana RPC endpoint available: {self.probes}")

    def call(self, method: str, params: list[Any], *, attempts: int = 8, timeout: int = 60) -> Any:
        errors: list[dict[str, Any]] = []
        for attempt in range(attempts):
            idx = (self.preferred + attempt) % len(self.endpoints)
            endpoint = self.endpoints[idx]
            try:
                response = request_json(endpoint, data={"jsonrpc": "2.0", "id": random.randint(1, 2_000_000_000), "method": method, "params": params}, timeout=timeout)
                if "error" in response:
                    raise RuntimeError(json.dumps(response["error"], sort_keys=True))
                self.preferred = idx
                return response.get("result")
            except Exception as exc:  # noqa: BLE001
                errors.append({"endpoint": endpoint, "error": str(exc)})
                time.sleep(min(8.0, 0.5 * (2 ** min(attempt, 4))) + random.random() * 0.25)
        raise RuntimeError(f"RPC {method} failed: {errors}")

    def batch(self, method: str, params_list: list[list[Any]], *, attempts: int = 6, timeout: int = 120) -> list[Any]:
        if not params_list:
            return []
        errors: list[dict[str, Any]] = []
        for attempt in range(attempts):
            idx = (self.preferred + attempt) % len(self.endpoints)
            endpoint = self.endpoints[idx]
            payload = [
                {"jsonrpc": "2.0", "id": index, "method": method, "params": params}
                for index, params in enumerate(params_list)
            ]
            try:
                response = request_json(endpoint, data=payload, timeout=timeout)
                by_id = {int(item["id"]): item for item in response}
                output = []
                for index in range(len(params_list)):
                    item = by_id.get(index, {})
                    output.append(None if "error" in item else item.get("result"))
                self.preferred = idx
                return output
            except Exception as exc:  # noqa: BLE001
                errors.append({"endpoint": endpoint, "error": str(exc)})
                time.sleep(min(8.0, 0.5 * (2 ** min(attempt, 4))) + random.random() * 0.25)
        raise RuntimeError(f"RPC batch {method} failed: {errors}")


def load_registry() -> dict[str, dict[str, Any]]:
    registry: dict[str, dict[str, Any]] = {}
    path = OUT_DIR / "discovered_addresses.json"
    if path.exists():
        for entry in json.loads(path.read_text()):
            registry[entry["address"]] = entry
    defaults = {
        MINT: ["token_mint"],
        CREATOR: ["pump_creator_wallet"],
        POOL: ["pumpswap_pool"],
        "555Tm1cfV52SrBQmnxXiHMUMrpci8miW3CkLP1Qbmtd7": ["historical_solana_treasury_candidate"],
        "3tYcXT1hsJCEdLHHLzop1zRbXb9U9fp8jQEq6NfJNe2E": ["historical_solana_fee_payer_candidate"],
        "BdEJFpK56hjdzopkmQeHiH3SwHCXrHtUMNH4jFkDTdA5": ["streamflow_related_wallet_candidate"],
        "6jEBKmB1mUD7tpgVn35ZqxTmSvhDSqpWBVzPzUiyqttb": ["streamflow_contract"],
        "HHXgYtezE32aATgWQFn3knAsy2xhQsjfepps3MLe3MXN": ["streamflow_contract"],
        "BSkf98N8ppTciokTv56AFA8f6HU4Kux7Ee9DV63mUinQ": ["streamflow_contract"],
    }
    for address, roles in defaults.items():
        current = registry.setdefault(address, {"address": address, "roles": [], "sources": ["canonical_or_recovered"], "details": []})
        for role in roles:
            if role not in current["roles"]:
                current["roles"].append(role)
    return registry


def history_limit(roles: list[str]) -> int:
    joined = " ".join(roles)
    if "pool" in joined or "token_mint" in joined:
        return 100
    if "streamflow_contract" in joined or "vault" in joined or "sharing_config" in joined:
        return 500
    if "creator" in joined or "treasury" in joined or "fee_payer" in joined or "streamflow_sender" in joined or "streamflow_recipient" in joined:
        return 8000
    return 1500


def get_signatures(rpc: RpcClient, address: str, max_count: int) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    before = None
    while len(output) < max_count:
        options: dict[str, Any] = {"limit": min(1000, max_count - len(output)), "commitment": "confirmed"}
        if before:
            options["before"] = before
        page = rpc.call("getSignaturesForAddress", [address, options], timeout=90) or []
        if not page:
            break
        output.extend(page)
        before = page[-1]["signature"]
        oldest = page[-1].get("blockTime")
        if oldest and oldest < CUTOFF_TS:
            break
        if len(page) < options["limit"]:
            break
        time.sleep(0.08)
    return [item for item in output if not item.get("blockTime") or item["blockTime"] >= CUTOFF_TS]


def account_keys(transaction: dict[str, Any]) -> list[str]:
    message = transaction.get("transaction", {}).get("message", {})
    keys = []
    for item in message.get("accountKeys", []):
        if isinstance(item, str):
            keys.append(item)
        elif isinstance(item, dict):
            keys.append(str(item.get("pubkey", "")))
    meta = transaction.get("meta") or {}
    loaded = meta.get("loadedAddresses") or {}
    keys.extend(str(item) for item in loaded.get("writable", []))
    keys.extend(str(item) for item in loaded.get("readonly", []))
    return keys


def instruction_program_ids(transaction: dict[str, Any], keys: list[str]) -> set[str]:
    ids: set[str] = set()
    message = transaction.get("transaction", {}).get("message", {})
    groups = [message.get("instructions", [])]
    for inner in (transaction.get("meta") or {}).get("innerInstructions", []) or []:
        groups.append(inner.get("instructions", []))
    for instructions in groups:
        for instruction in instructions or []:
            if instruction.get("programId"):
                ids.add(str(instruction["programId"]))
            elif instruction.get("programIdIndex") is not None:
                index = int(instruction["programIdIndex"])
                if 0 <= index < len(keys):
                    ids.add(keys[index])
    return ids


def balance_delta(transaction: dict[str, Any], address: str, keys: list[str]) -> int:
    if address not in keys:
        return 0
    index = keys.index(address)
    meta = transaction.get("meta") or {}
    pre = meta.get("preBalances") or []
    post = meta.get("postBalances") or []
    if index >= len(pre) or index >= len(post):
        return 0
    return int(post[index]) - int(pre[index])


def token_deltas(transaction: dict[str, Any], subject: str, keys: list[str]) -> dict[str, int]:
    meta = transaction.get("meta") or {}
    pre_rows = meta.get("preTokenBalances") or []
    post_rows = meta.get("postTokenBalances") or []
    pre: dict[tuple[int, str], int] = {}
    post: dict[tuple[int, str], int] = {}
    owners: dict[tuple[int, str], str] = {}
    for target, rows in ((pre, pre_rows), (post, post_rows)):
        for row in rows:
            key = (int(row.get("accountIndex", -1)), str(row.get("mint", "")))
            target[key] = int(row.get("uiTokenAmount", {}).get("amount", "0") or 0)
            if row.get("owner"):
                owners[key] = str(row["owner"])
    result: dict[str, int] = defaultdict(int)
    for key in set(pre) | set(post):
        index, mint = key
        owner = owners.get(key)
        account_address = keys[index] if 0 <= index < len(keys) else ""
        if owner == subject or account_address == subject:
            result[mint] += post.get(key, 0) - pre.get(key, 0)
    return dict(result)


def all_account_deltas(transaction: dict[str, Any], keys: list[str]) -> list[dict[str, Any]]:
    meta = transaction.get("meta") or {}
    pre = meta.get("preBalances") or []
    post = meta.get("postBalances") or []
    rows = []
    for index, key in enumerate(keys[: min(len(pre), len(post))]):
        delta = int(post[index]) - int(pre[index])
        if delta:
            rows.append({"address": key, "lamportsDelta": delta, "solDelta": delta / 1_000_000_000})
    return sorted(rows, key=lambda item: abs(item["lamportsDelta"]), reverse=True)


def classify(subject: str, roles: list[str], programs: set[str], sol_delta: int, deltas: dict[str, int], logs: str) -> str:
    token_delta = deltas.get(MINT, 0)
    wsol_delta = deltas.get(WSOL, 0)
    usdc_delta = deltas.get(USDC, 0)
    lower_logs = logs.lower()
    if STREAMFLOW_PROGRAM in programs:
        if token_delta < 0:
            return "STREAMFLOW_DEPOSIT_CANDIDATE"
        if token_delta > 0:
            return "STREAMFLOW_WITHDRAWAL_OR_RETURN_CANDIDATE"
        return "STREAMFLOW_INTERACTION"
    if programs & PUMP_PROGRAMS:
        claim_words = any(word in lower_logs for word in ("collectcreator", "collect_creator", "creator fee", "distributecreator", "distribute_creator"))
        if (subject == CREATOR or "creator" in " ".join(roles)) and (sol_delta > 0 or wsol_delta > 0) and claim_words:
            return "PUMP_CREATOR_FEE_CLAIM"
        if (subject == CREATOR or "creator" in " ".join(roles)) and (sol_delta > 0 or wsol_delta > 0):
            return "PUMP_CREATOR_FEE_CLAIM_CANDIDATE"
    if token_delta > 0 and (sol_delta < 0 or wsol_delta < 0 or usdc_delta < 0) and programs & SWAP_PROGRAMS:
        return "BUYBACK_OR_ACQUISITION_CANDIDATE"
    if token_delta < 0 and (sol_delta > 0 or wsol_delta > 0 or usdc_delta > 0) and programs & SWAP_PROGRAMS:
        return "TOKEN_SALE_CANDIDATE"
    if token_delta != 0:
        return "555_TOKEN_MOVEMENT"
    if sol_delta != 0:
        return "SOL_MOVEMENT"
    return "OTHER"


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str] | None = None) -> None:
    if not fields:
        fields = sorted({key for row in rows for key in row}) if rows else ["empty"]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fields})


def fetch_sol_prices() -> list[list[float]]:
    start = CUTOFF_TS - 86400
    end = int(time.time()) + 86400
    url = f"https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from={start}&to={end}"
    try:
        return request_json(url, timeout=60).get("prices", [])
    except Exception as exc:  # noqa: BLE001
        (OUT_DIR / "sol_price_error.txt").write_text(str(exc))
        return []


def price_near(prices: list[list[float]], timestamp: int | None) -> float | None:
    if not timestamp or not prices:
        return None
    target_ms = timestamp * 1000
    nearest = min(prices, key=lambda item: abs(item[0] - target_ms))
    return float(nearest[1])


def main() -> None:
    registry = load_registry()
    rpc = RpcClient(RPC_ENDPOINTS)
    (OUT_DIR / "rpc_probe.json").write_text(json.dumps(rpc.probes, indent=2) + "\n")

    supply = rpc.call("getTokenSupply", [MINT, {"commitment": "confirmed"}])
    largest = rpc.call("getTokenLargestAccounts", [MINT, {"commitment": "confirmed"}]) or {}
    largest_rows = []
    for item in largest.get("value", []):
        account = item["address"]
        try:
            info = rpc.call("getAccountInfo", [account, {"encoding": "jsonParsed", "commitment": "confirmed"}])
            parsed = ((info or {}).get("value") or {}).get("data", {}).get("parsed", {}).get("info", {})
        except Exception:  # noqa: BLE001
            parsed = {}
        largest_rows.append({
            "tokenAccount": account,
            "owner": parsed.get("owner", ""),
            "mint": parsed.get("mint", MINT),
            "rawAmount": item.get("amount", ""),
            "uiAmount": item.get("uiAmountString", ""),
            "decimals": item.get("decimals", ""),
        })
        owner = parsed.get("owner")
        if owner:
            current = registry.setdefault(owner, {"address": owner, "roles": [], "sources": [], "details": []})
            if "current_555_large_holder" not in current["roles"]:
                current["roles"].append("current_555_large_holder")
            if "getTokenLargestAccounts" not in current["sources"]:
                current["sources"].append("getTokenLargestAccounts")
    write_csv(OUT_DIR / "token_largest_accounts.csv", largest_rows)

    account_rows: list[dict[str, Any]] = []
    signatures_rows: list[dict[str, Any]] = []
    signatures_by_subject: dict[str, list[dict[str, Any]]] = {}
    all_signatures = set(KNOWN_SIGNATURES)

    for address, entry in sorted(registry.items()):
        roles = entry.get("roles", [])
        balance = None
        account_owner = ""
        executable = False
        data_length = 0
        token_accounts: list[dict[str, Any]] = []
        try:
            balance = rpc.call("getBalance", [address, {"commitment": "confirmed"}]).get("value")
        except Exception:  # noqa: BLE001
            pass
        try:
            info = rpc.call("getAccountInfo", [address, {"encoding": "base64", "commitment": "confirmed"}])
            value = (info or {}).get("value") or {}
            account_owner = value.get("owner", "")
            executable = bool(value.get("executable"))
            data = value.get("data") or []
            data_length = len(data[0]) if isinstance(data, list) and data else 0
        except Exception:  # noqa: BLE001
            pass
        try:
            token_result = rpc.call("getTokenAccountsByOwner", [address, {"mint": MINT}, {"encoding": "jsonParsed", "commitment": "confirmed"}])
            for token_account in (token_result or {}).get("value", []):
                parsed = token_account.get("account", {}).get("data", {}).get("parsed", {}).get("info", {})
                token_accounts.append({
                    "tokenAccount": token_account.get("pubkey"),
                    "rawAmount": parsed.get("tokenAmount", {}).get("amount", "0"),
                    "uiAmount": parsed.get("tokenAmount", {}).get("uiAmountString", "0"),
                })
        except Exception:  # noqa: BLE001
            pass
        account_rows.append({
            "address": address,
            "roles": "|".join(roles),
            "lamports": balance if balance is not None else "",
            "sol": (balance / 1_000_000_000) if balance is not None else "",
            "accountOwnerProgram": account_owner,
            "executable": executable,
            "dataBase64Length": data_length,
            "555TokenAccounts": json.dumps(token_accounts, separators=(",", ":")),
            "555RawBalance": str(sum(int(item["rawAmount"]) for item in token_accounts)),
        })
        try:
            items = get_signatures(rpc, address, history_limit(roles))
        except Exception as exc:  # noqa: BLE001
            items = []
            (OUT_DIR / f"signature_error_{address}.txt").write_text(str(exc))
        signatures_by_subject[address] = items
        for item in items:
            all_signatures.add(item["signature"])
            signatures_rows.append({
                "subject": address,
                "subjectRoles": "|".join(roles),
                "signature": item["signature"],
                "slot": item.get("slot", ""),
                "blockTime": item.get("blockTime", ""),
                "timestamp": utc_iso(item.get("blockTime")),
                "err": json.dumps(item.get("err"), separators=(",", ":")) if item.get("err") else "",
                "memo": item.get("memo") or "",
            })
    write_csv(OUT_DIR / "current_onchain_balances.csv", account_rows)
    write_csv(OUT_DIR / "signatures_by_address.csv", signatures_rows)

    signatures = sorted(all_signatures)
    transactions: dict[str, Any] = {}
    transaction_errors: dict[str, str] = {}
    chunk_size = 20
    for start in range(0, len(signatures), chunk_size):
        chunk = signatures[start:start + chunk_size]
        params_list = [[signature, {"encoding": "jsonParsed", "commitment": "confirmed", "maxSupportedTransactionVersion": 0}] for signature in chunk]
        try:
            results = rpc.batch("getTransaction", params_list)
        except Exception as exc:  # noqa: BLE001
            results = [None] * len(chunk)
            for signature in chunk:
                transaction_errors[signature] = str(exc)
        for signature, transaction in zip(chunk, results):
            if transaction is None:
                transaction_errors.setdefault(signature, "null transaction result")
            else:
                transactions[signature] = transaction
        if start and start % 500 == 0:
            print(f"Fetched {start}/{len(signatures)} transactions")
        time.sleep(0.08)

    (OUT_DIR / "raw_transactions.json").write_text(json.dumps(transactions, separators=(",", ":")) + "\n")
    (OUT_DIR / "transaction_errors.json").write_text(json.dumps(transaction_errors, indent=2) + "\n")
    prices = fetch_sol_prices()
    (OUT_DIR / "sol_price_history.json").write_text(json.dumps(prices, separators=(",", ":")) + "\n")

    rows: list[dict[str, Any]] = []
    for subject, signature_items in signatures_by_subject.items():
        roles = registry.get(subject, {}).get("roles", [])
        for signature_item in signature_items:
            signature = signature_item["signature"]
            transaction = transactions.get(signature)
            if not transaction:
                continue
            keys = account_keys(transaction)
            programs = instruction_program_ids(transaction, keys)
            sol_delta = balance_delta(transaction, subject, keys)
            deltas = token_deltas(transaction, subject, keys)
            logs_list = (transaction.get("meta") or {}).get("logMessages") or []
            logs = "\n".join(str(item) for item in logs_list)
            timestamp = transaction.get("blockTime") or signature_item.get("blockTime")
            sol_price = price_near(prices, timestamp)
            classification = classify(subject, roles, programs, sol_delta, deltas, logs)
            rows.append({
                "subject": subject,
                "subjectRoles": "|".join(roles),
                "signature": signature,
                "slot": transaction.get("slot", ""),
                "blockTime": timestamp or "",
                "timestamp": utc_iso(timestamp),
                "success": (transaction.get("meta") or {}).get("err") is None,
                "feeLamports": (transaction.get("meta") or {}).get("fee", ""),
                "subjectSolDeltaLamports": sol_delta,
                "subjectSolDelta": sol_delta / 1_000_000_000,
                "subjectSolDeltaUsdAtEvent": (sol_delta / 1_000_000_000 * sol_price) if sol_price is not None else "",
                "solUsdPriceAtEvent": sol_price if sol_price is not None else "",
                "subject555RawDelta": deltas.get(MINT, 0),
                "subjectWsolRawDelta": deltas.get(WSOL, 0),
                "subjectUsdcRawDelta": deltas.get(USDC, 0),
                "programIds": "|".join(sorted(programs)),
                "classification": classification,
                "accountDeltas": json.dumps(all_account_deltas(transaction, keys)[:20], separators=(",", ":")),
                "logExcerpt": " | ".join(logs_list[-12:])[:4000],
            })
    rows.sort(key=lambda row: (int(row["blockTime"] or 0), row["signature"], row["subject"]))
    fields = [
        "subject", "subjectRoles", "signature", "slot", "blockTime", "timestamp", "success", "feeLamports",
        "subjectSolDeltaLamports", "subjectSolDelta", "subjectSolDeltaUsdAtEvent", "solUsdPriceAtEvent",
        "subject555RawDelta", "subjectWsolRawDelta", "subjectUsdcRawDelta", "programIds", "classification",
        "accountDeltas", "logExcerpt",
    ]
    write_csv(OUT_DIR / "solana_transactions.csv", rows, fields)
    write_csv(OUT_DIR / "pump_creator_fee_claims_candidates.csv", [row for row in rows if "CREATOR_FEE" in row["classification"]], fields)
    write_csv(OUT_DIR / "buyback_transactions_candidates.csv", [row for row in rows if "BUYBACK" in row["classification"]], fields)
    write_csv(OUT_DIR / "streamflow_movements_candidates.csv", [row for row in rows if row["classification"].startswith("STREAMFLOW")], fields)
    write_csv(OUT_DIR / "555_token_movements.csv", [row for row in rows if int(row["subject555RawDelta"] or 0) != 0], fields)

    unique_tx = len(transactions)
    claim_rows = [row for row in rows if "CREATOR_FEE" in row["classification"]]
    buyback_rows = [row for row in rows if "BUYBACK" in row["classification"]]
    stream_rows = [row for row in rows if row["classification"].startswith("STREAMFLOW")]
    summary = {
        "generatedAt": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        "cutoff": utc_iso(CUTOFF_TS),
        "rpcProbes": rpc.probes,
        "tokenSupply": supply,
        "registryAddressCount": len(registry),
        "signatureCount": len(signatures),
        "transactionCount": unique_tx,
        "transactionErrorCount": len(transaction_errors),
        "rowCountBySubject": dict(defaultdict(int)),
        "classificationCounts": {},
        "creatorFeeClaimCandidateCount": len(claim_rows),
        "creatorFeeCandidateSolInflows": sum(max(0.0, float(row["subjectSolDelta"] or 0)) for row in claim_rows),
        "creatorFeeCandidateWsolRawInflows": sum(max(0, int(row["subjectWsolRawDelta"] or 0)) for row in claim_rows),
        "buybackCandidateCount": len(buyback_rows),
        "streamflowMovementCandidateCount": len(stream_rows),
    }
    by_subject: dict[str, int] = defaultdict(int)
    by_class: dict[str, int] = defaultdict(int)
    for row in rows:
        by_subject[row["subject"]] += 1
        by_class[row["classification"]] += 1
    summary["rowCountBySubject"] = dict(sorted(by_subject.items()))
    summary["classificationCounts"] = dict(sorted(by_class.items()))
    (OUT_DIR / "chain_pull_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    (OUT_DIR / "registry_snapshot.json").write_text(json.dumps(list(registry.values()), indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
