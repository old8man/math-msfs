#!/usr/bin/env bash
# =============================================================================
# proof_honesty_gate.sh — corpus-side CI gate against proof-honesty regression
# =============================================================================
#
# Runs `verum audit --proof-honesty --format json` and compares the totals +
# by-lineage breakdown against `tests/proof_honesty_baseline.json`.
#
# REGRESSION semantics (the CI failure cases):
#   1. Any new theorem-trivial-true row (proof body without any tactic step).
#   2. Any new theorem-no-proof-body row (theorem declared without `proof {}`).
#   3. theorem_multi_step counter dropped below baseline (somebody converted
#      an honest @theorem back to @axiom or trivialised the proof body).
#   4. theorem_axiom_only counter dropped below baseline (similar).
#   5. axiom_placeholder counter rose above baseline (theorem stripped to axiom).
#   6. Any per-lineage (msfs / diakrisis) version of the above.
#
# A green run means: no regression. Increases in theorem-* counts and
# decreases in axiom-placeholder are always welcome — the baseline can
# be re-frozen via `make refresh-honesty-baseline` once those gains are
# stable.
# =============================================================================

set -euo pipefail

CORPUS_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VERUM_BIN="${VERUM_BIN:-verum}"
BASELINE="$CORPUS_DIR/tests/proof_honesty_baseline.json"
LIVE_REPORT="$(mktemp -t honesty-live.XXXXXX.json)"
trap 'rm -f "$LIVE_REPORT"' EXIT

cd "$CORPUS_DIR"

echo "==> Running: $VERUM_BIN audit --proof-honesty --format json"
"$VERUM_BIN" audit --proof-honesty --format json > "$LIVE_REPORT"

if [[ ! -f "$BASELINE" ]]; then
    echo "ERROR: baseline file missing: $BASELINE"
    exit 1
fi

python3 - "$BASELINE" "$LIVE_REPORT" <<'PYEOF'
import json
import sys

baseline_path, live_path = sys.argv[1], sys.argv[2]
b = json.load(open(baseline_path))
l = json.load(open(live_path))

failures = []

# Monotone-up counters (must not drop below baseline_min).
for key, expected in b.get("totals_min", {}).items():
    if key.startswith("_"):
        continue
    live = l.get("totals", {}).get(key, 0)
    if live < expected:
        failures.append(f"REGRESSION: totals[{key}]={live} < baseline_min={expected}")

# Monotone-down counters (must not rise above baseline_max).
for key, expected in b.get("totals_max", {}).items():
    if key.startswith("_"):
        continue
    live = l.get("totals", {}).get(key, 0)
    if live > expected:
        failures.append(f"REGRESSION: totals[{key}]={live} > baseline_max={expected}")

# Per-lineage (msfs / diakrisis).
for lineage, mins in b.get("by_lineage_min", {}).items():
    for key, expected in mins.items():
        live = l.get("by_lineage", {}).get(lineage, {}).get(key, 0)
        if live < expected:
            failures.append(f"REGRESSION: by_lineage[{lineage}][{key}]={live} < baseline_min={expected}")

for lineage, maxes in b.get("by_lineage_max", {}).items():
    for key, expected in maxes.items():
        live = l.get("by_lineage", {}).get(lineage, {}).get(key, 0)
        if live > expected:
            failures.append(f"REGRESSION: by_lineage[{lineage}][{key}]={live} > baseline_max={expected}")

if failures:
    print("\n".join(failures), file=sys.stderr)
    print(f"\n{len(failures)} regression(s) detected against baseline.", file=sys.stderr)
    sys.exit(1)

# Report any improvements (informational, never fails the gate).
gains = []
for key, expected in b.get("totals_min", {}).items():
    if key.startswith("_"):
        continue
    live = l.get("totals", {}).get(key, 0)
    if live > expected:
        gains.append(f"  + totals[{key}]: baseline {expected} -> live {live} (UP)")
for key, expected in b.get("totals_max", {}).items():
    if key.startswith("_"):
        continue
    live = l.get("totals", {}).get(key, 0)
    if live < expected:
        gains.append(f"  + totals[{key}]: baseline {expected} -> live {live} (DOWN)")

if gains:
    print("Gains over baseline (consider refreshing baseline):")
    print("\n".join(gains))
else:
    print("Baseline holds exactly.")

print("\nproof-honesty gate: PASS")
PYEOF
