#!/usr/bin/env python3
"""Read-only public-data snapshot for the $555 capital ledger.

The script intentionally preserves raw provider responses alongside a derived
summary. Heuristics are labelled and never promoted to settled accounting
without a transaction-level review.
"""

from __future__ import annotations

import csv
import gzip
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

MINT = "CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2"
CREATOR = "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq"
POOL = "FKBEZmogcdNGm1rtqCJpkLY9gW77antPkBXhSFftGHTG"
HELIUS_API_KEY = "64d5184c-1e1a-41a7-aed2-04aa72576bfd"
RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"
HELIUS_ADDRESS_URL = f"https://api.helius.xyz/v0/addresses/{{address}}/transactions?api-key={HELIUS_API_KEY}"
OUT = Path(__file__).resolve().parent / "output"
RAW = OUT / "raw"
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

USER_AGENT = "RNDRNTWRK-555-Capital-Ledger/1.0 (+https://rndrntwrk.com)"


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def save_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()
    path.write_bytes(payload)


def save_json_gz(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, ensure_ascii=False) + "\n").encode()
    with gzip.open(path, "wb", compresslevel=9) as handle:
        handle.write(payload)


def request_json(
    url: str,
    *,
    method: str = "GET",
    body: Any | None = None,
    timeout: int = 45,
    attempts: int = 5,
) -> Any:
    payload = None if body is None else json.dumps(body).encode()
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                raw = response.read()
                if not raw:
                    return None
                return json.loads(raw)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            status = getattr(error, "code", None)
            if status in {400, 401, 403, 404}:
                break
            time.sleep(min(12, 1.5 * (2**attempt)))
    raise RuntimeError(f"request failed: {url}: {last_error}")


def safe_request(label: str, url: str, *, method: str = "GET", body: Any | None = None) -> dict[str, Any]:
    started = datetime.now(timezone.utc).isoformat()
    try:
        data = request_json(url, method=method, body=body)
        return {"label": label, "ok": True, "requested_at": started, "url": url, "data": data}
    except Exception as error:  # preserve failure evidence; continue other sources
        return {"label": label, "ok": False, "requested_at": started, "url": url, "error": str(error)}


def rpc(method: str, params: list[Any]) -> Any:
    result = request_json(
        RPC_URL,
        method="POST",
        body={"jsonrpc": "2.0", "id": method, "method": method, "params": params},
    )
    if not isinstance(result, dict):
        raise RuntimeError(f"invalid RPC response for {method}")
    if result.get("error"):
        raise RuntimeError(f"RPC {method}: {result['error']}")
    return result.get("result")


def paginate_signatures(address: str, maximum: int = 100_000) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    before: str | None = None
    while len(rows) < maximum:
        config: dict[str, Any] = {"limit": 1000, "commitment": "confirmed"}
        if before:
            config["before"] = before
        page = rpc("getSignaturesForAddress", [address, config]) or []
        if not page:
            break
        rows.extend(page)
        next_before = page[-1].get("signature")
        if not next_before or next_before == before or len(page) < 1000:
            break
        before = next_before
        time.sleep(0.12)
    return rows


def paginate_enhanced(address: str, maximum: int = 100_000) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    before: str | None = None
    while len(rows) < maximum:
        params = {"limit": "100"}
        if before:
            params["before"] = before
        url = HELIUS_ADDRESS_URL.format(address=address) + "&" + urllib.parse.urlencode(params)
        page = request_json(url)
        if not isinstance(page, list) or not page:
            break
        rows.extend(page)
        next_before = page[-1].get("signature")
        if not next_before or next_before == before or len(page) < 100:
            break
        before = next_before
        time.sleep(0.22)
    return rows


def flatten_program_ids(tx: dict[str, Any]) -> set[str]:
    found: set[str] = set()

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                if key in {"programId", "program_id", "program"} and isinstance(item, str):
                    found.add(item)
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(tx.get("instructions", []))
    walk(tx.get("events", {}))
    return found


def transfer_owner(transfer: dict[str, Any], direction: str) -> str | None:
    keys = (
        ("fromUserAccount", "from_user_account", "fromOwner", "from_owner")
        if direction == "from"
        else ("toUserAccount", "to_user_account", "toOwner", "to_owner")
    )
    for key in keys:
        value = transfer.get(key)
        if isinstance(value, str):
            return value
    return None


def token_amount(transfer: dict[str, Any]) -> float:
    for key in ("tokenAmount", "token_amount", "amount"):
        value = transfer.get(key)
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            pass
    return 0.0


def native_amount_lamports(transfer: dict[str, Any]) -> int:
    for key in ("amount", "lamports"):
        value = transfer.get(key)
        try:
            return int(value)
        except (TypeError, ValueError):
            continue
    return 0


def counterparty(address: str, transfer: dict[str, Any]) -> str | None:
    sender = transfer.get("fromUserAccount") or transfer.get("from_user_account")
    receiver = transfer.get("toUserAccount") or transfer.get("to_user_account")
    if sender == address and isinstance(receiver, str):
        return receiver
    if receiver == address and isinstance(sender, str):
        return sender
    return None


def classify_transactions(address: str, txs: list[dict[str, Any]]) -> dict[str, Any]:
    type_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()
    program_counts: Counter[str] = Counter()
    counterparties: Counter[str] = Counter()
    creator_fee_candidates: list[dict[str, Any]] = []
    buyback_candidates: list[dict[str, Any]] = []
    streamflow_candidates: list[dict[str, Any]] = []
    mint_in = 0.0
    mint_out = 0.0
    sol_in_lamports = 0
    sol_out_lamports = 0

    for tx in txs:
        signature = tx.get("signature")
        timestamp = tx.get("timestamp")
        tx_type = str(tx.get("type") or "UNKNOWN")
        source = str(tx.get("source") or "UNKNOWN")
        description = str(tx.get("description") or "")
        type_counts[tx_type] += 1
        source_counts[source] += 1
        programs = flatten_program_ids(tx)
        program_counts.update(programs)

        token_transfers = tx.get("tokenTransfers") or tx.get("token_transfers") or []
        native_transfers = tx.get("nativeTransfers") or tx.get("native_transfers") or []
        if not isinstance(token_transfers, list):
            token_transfers = []
        if not isinstance(native_transfers, list):
            native_transfers = []

        tx_mint_in = 0.0
        tx_mint_out = 0.0
        for transfer in token_transfers:
            if not isinstance(transfer, dict):
                continue
            mint = transfer.get("mint")
            sender = transfer_owner(transfer, "from")
            receiver = transfer_owner(transfer, "to")
            amount = token_amount(transfer)
            if mint == MINT and receiver == address:
                tx_mint_in += amount
                mint_in += amount
            if mint == MINT and sender == address:
                tx_mint_out += amount
                mint_out += amount
            cp = counterparty(address, transfer)
            if cp:
                counterparties[cp] += 1

        tx_sol_in = 0
        tx_sol_out = 0
        for transfer in native_transfers:
            if not isinstance(transfer, dict):
                continue
            sender = transfer.get("fromUserAccount") or transfer.get("from_user_account")
            receiver = transfer.get("toUserAccount") or transfer.get("to_user_account")
            amount = native_amount_lamports(transfer)
            if receiver == address:
                tx_sol_in += amount
                sol_in_lamports += amount
            if sender == address:
                tx_sol_out += amount
                sol_out_lamports += amount
            cp = counterparty(address, transfer)
            if cp:
                counterparties[cp] += 1

        lower = f"{tx_type} {source} {description}".lower()
        is_creator_fee_candidate = (
            "creator fee" in lower
            or "claim_creator" in lower
            or "claim creator" in lower
            or ("pump" in lower and tx_sol_in > 0 and tx_mint_in == 0 and tx_mint_out == 0)
        )
        if is_creator_fee_candidate:
            creator_fee_candidates.append({
                "signature": signature,
                "timestamp": timestamp,
                "type": tx_type,
                "source": source,
                "description": description,
                "sol_in_lamports": tx_sol_in,
                "sol_in": tx_sol_in / 1_000_000_000,
                "program_ids": sorted(programs),
            })

        is_buyback_candidate = (
            tx_mint_in > 0
            and (tx_sol_out > 0 or tx_type.upper() == "SWAP" or "jupiter" in lower or "swap" in lower)
        )
        if is_buyback_candidate:
            buyback_candidates.append({
                "signature": signature,
                "timestamp": timestamp,
                "type": tx_type,
                "source": source,
                "description": description,
                "555_in": tx_mint_in,
                "sol_out_lamports": tx_sol_out,
                "sol_out": tx_sol_out / 1_000_000_000,
                "program_ids": sorted(programs),
            })

        if "streamflow" in lower or any("stream" in program.lower() for program in programs):
            streamflow_candidates.append({
                "signature": signature,
                "timestamp": timestamp,
                "type": tx_type,
                "source": source,
                "description": description,
                "555_in": tx_mint_in,
                "555_out": tx_mint_out,
                "program_ids": sorted(programs),
            })

    return {
        "address": address,
        "transaction_count": len(txs),
        "type_counts": dict(type_counts.most_common()),
        "source_counts": dict(source_counts.most_common()),
        "program_counts": dict(program_counts.most_common()),
        "top_counterparties": dict(counterparties.most_common(100)),
        "aggregate_transfers": {
            "555_in": mint_in,
            "555_out": mint_out,
            "sol_in_lamports": sol_in_lamports,
            "sol_in": sol_in_lamports / 1_000_000_000,
            "sol_out_lamports": sol_out_lamports,
            "sol_out": sol_out_lamports / 1_000_000_000,
        },
        "creator_fee_candidates": creator_fee_candidates,
        "buyback_candidates": buyback_candidates,
        "streamflow_candidates": streamflow_candidates,
        "heuristic_notice": (
            "Candidates are discovery outputs. Final accounting requires instruction-level review, "
            "counterparty attribution, and reconciliation against balances and claim state."
        ),
    }


def write_candidate_csv(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    records = list(rows)
    if not records:
        path.write_text("signature,timestamp\n")
        return
    keys: list[str] = []
    for record in records:
        for key in record:
            if key not in keys:
                keys.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=keys)
        writer.writeheader()
        for record in records:
            serial = {
                key: json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value
                for key, value in record.items()
            }
            writer.writerow(serial)


def main() -> int:
    generated_at = datetime.now(timezone.utc).isoformat()
    sources: dict[str, Any] = {}

    # Direct chain state.
    rpc_calls = {
        "creator_balance": ("getBalance", [CREATOR, {"commitment": "confirmed"}]),
        "creator_token_accounts": (
            "getTokenAccountsByOwner",
            [CREATOR, {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}, {"encoding": "jsonParsed", "commitment": "confirmed"}],
        ),
        "mint_supply": ("getTokenSupply", [MINT, {"commitment": "confirmed"}]),
        "mint_account": ("getAccountInfo", [MINT, {"encoding": "jsonParsed", "commitment": "confirmed"}]),
        "pool_account": ("getAccountInfo", [POOL, {"encoding": "jsonParsed", "commitment": "confirmed"}]),
        "pool_token_accounts": (
            "getTokenAccountsByOwner",
            [POOL, {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}, {"encoding": "jsonParsed", "commitment": "confirmed"}],
        ),
    }
    for label, (method, params) in rpc_calls.items():
        try:
            data = rpc(method, params)
            sources[label] = {"ok": True, "method": method, "data": data}
        except Exception as error:
            sources[label] = {"ok": False, "method": method, "error": str(error)}
        save_json(RAW / f"rpc-{label}.json", sources[label])

    # Full creator history from two independent Helius surfaces.
    signature_rows: list[dict[str, Any]] = []
    enhanced_rows: list[dict[str, Any]] = []
    try:
        signature_rows = paginate_signatures(CREATOR)
        save_json_gz(RAW / "creator-signatures.json.gz", signature_rows)
        sources["creator_signatures"] = {"ok": True, "count": len(signature_rows)}
    except Exception as error:
        sources["creator_signatures"] = {"ok": False, "error": str(error)}
    try:
        enhanced_rows = paginate_enhanced(CREATOR)
        save_json_gz(RAW / "creator-enhanced-transactions.json.gz", enhanced_rows)
        sources["creator_enhanced_transactions"] = {"ok": True, "count": len(enhanced_rows)}
    except Exception as error:
        sources["creator_enhanced_transactions"] = {"ok": False, "error": str(error)}

    # Public product and market sources.
    public_sources = {
        "pump_coin": f"https://frontend-api-v3.pump.fun/coins/{MINT}",
        "pump_claim_account": (
            "https://pumpdev.io/api/claim-account?"
            + urllib.parse.urlencode({"publicKey": CREATOR, "mint": MINT})
        ),
        "dexscreener_pool": f"https://api.dexscreener.com/latest/dex/pairs/solana/{POOL}",
        "geckoterminal_pool": f"https://api.geckoterminal.com/api/v2/networks/solana/pools/{POOL}",
        "geckoterminal_token": f"https://api.geckoterminal.com/api/v2/networks/solana/tokens/{MINT}",
    }
    for label, url in public_sources.items():
        result = safe_request(label, url)
        sources[label] = {key: value for key, value in result.items() if key != "data"}
        save_json(RAW / f"public-{label}.json", result)

    classification = classify_transactions(CREATOR, enhanced_rows)
    save_json(OUT / "creator-wallet-classification.json", classification)
    write_candidate_csv(OUT / "creator-fee-candidates.csv", classification["creator_fee_candidates"])
    write_candidate_csv(OUT / "buyback-candidates.csv", classification["buyback_candidates"])
    write_candidate_csv(OUT / "streamflow-candidates.csv", classification["streamflow_candidates"])

    first_signature = signature_rows[-1] if signature_rows else None
    latest_signature = signature_rows[0] if signature_rows else None
    summary = {
        "schema_version": "1.0.0",
        "generated_at": generated_at,
        "network": "solana-mainnet",
        "mint": MINT,
        "creator_wallet": CREATOR,
        "canonical_pool": POOL,
        "source_status": sources,
        "history": {
            "signature_count": len(signature_rows),
            "enhanced_transaction_count": len(enhanced_rows),
            "earliest_signature": first_signature,
            "latest_signature": latest_signature,
        },
        "classification": {
            "creator_fee_candidate_count": len(classification["creator_fee_candidates"]),
            "creator_fee_candidate_sol": sum(row["sol_in"] for row in classification["creator_fee_candidates"]),
            "buyback_candidate_count": len(classification["buyback_candidates"]),
            "buyback_candidate_555": sum(row["555_in"] for row in classification["buyback_candidates"]),
            "buyback_candidate_sol_spent": sum(row["sol_out"] for row in classification["buyback_candidates"]),
            "streamflow_candidate_count": len(classification["streamflow_candidates"]),
        },
        "evidence_files": sorted(str(path.relative_to(OUT)) for path in OUT.rglob("*") if path.is_file()),
        "limitations": [
            "Candidate totals are not final accounting until each transaction is reviewed.",
            "USD-at-event valuation is intentionally deferred until transaction classification is stable.",
            "Additional treasury wallets are discovered from counterparties and require recursive extraction.",
        ],
    }
    save_json(OUT / "snapshot-summary.json", summary)

    manifest: list[dict[str, Any]] = []
    for path in sorted(OUT.rglob("*")):
        if not path.is_file():
            continue
        payload = path.read_bytes()
        manifest.append({
            "path": str(path.relative_to(OUT)),
            "bytes": len(payload),
            "sha256": digest_bytes(payload),
        })
    save_json(OUT / "manifest.json", {"generated_at": generated_at, "files": manifest})
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"fatal: {exc}", file=sys.stderr)
        raise
