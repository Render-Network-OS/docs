#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-render-network-os/sw4p-earn}"
OWNER="${2:-rndrntwrk}"
DRY_RUN="${3:-0}"

issues=$(gh issue list --repo "$REPO" --state open --search "P0-" --json number,assignees --limit 200)

if [ -z "$issues" ] || [ "$issues" = "null" ]; then
  echo "No issues found."
  exit 0
fi

printf "%s\n" "$issues" | jq -r '.[] | @base64' | while IFS= read -r row; do
  _jq() { echo "$row" | base64 --decode | jq -r "$1"; }

  num=$(_jq '.number')
  assignees=$(_jq '.assignees | map(.login) | join(",")')

  if [ -z "$assignees" ]; then
    if [ "$DRY_RUN" = "1" ]; then
      echo "DRY RUN: would assign #$num -> $OWNER"
    else
      gh issue edit "$num" --repo "$REPO" --add-assignee "$OWNER"
      echo "assigned #$num -> $OWNER"
    fi
    continue
  fi

  IFS=',' read -ra arr <<< "$assignees"
  for a in "${arr[@]}"; do
    if [ "$a" = "$OWNER" ]; then
      owner_present=1
      break
    fi
  done

  if [ "${owner_present:-0}" -ne 1 ]; then
    if [ "$DRY_RUN" = "1" ]; then
      echo "DRY RUN: would assign #$num (has: $assignees) -> $OWNER"
    else
      gh issue edit "$num" --repo "$REPO" --add-assignee "$OWNER"
      echo "assigned #$num (also had $assignees) -> $OWNER"
    fi
  fi

  unset owner_present
 done
