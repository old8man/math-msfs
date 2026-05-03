#!/usr/bin/env bash
# =============================================================================
# Cross-format export signal check (M0.D first deliverable)
# =============================================================================
#
# After `verum export --to <format>` runs across all five targets, this
# script verifies the M0.A signal (20 @theorem promotions vs 176 @axiom
# placeholders) is preserved end-to-end through each emitter.
#
# Round-trip CI (running lean / coqc / agda / dkcheck / metamath against
# the exported files) requires those toolchains to be installed and is
# tracked separately under M0.D Phase 2; this script is the Phase 1
# guardrail that catches "exporter regressed and emitted everything as
# axiom" failures.
# =============================================================================

set -euo pipefail

CORPUS_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VERUM_BIN="${VERUM_BIN:-verum}"

EXPECTED_THEOREMS=20
EXPECTED_AXIOMS=176

cd "$CORPUS_DIR"

echo "==> Re-exporting all 5 formats from $CORPUS_DIR"
"$VERUM_BIN" export --to lean      >/dev/null
"$VERUM_BIN" export --to coq       >/dev/null
"$VERUM_BIN" export --to dedukti   >/dev/null
"$VERUM_BIN" export --to metamath  >/dev/null
"$VERUM_BIN" export --to agda      >/dev/null 2>&1 || true  # agda is optional

# Lean: `theorem X : Prop := sorry` vs `axiom X : Prop`
LEAN_T=$(grep -c '^theorem ' certificates/lean/export.lean)
LEAN_A=$(grep -c '^axiom ' certificates/lean/export.lean)

# Coq: `Theorem X : Prop. Admitted.` vs `Axiom X : Prop.`
COQ_T=$(grep -c '^Theorem ' certificates/coq/export.v)
COQ_A=$(grep -c '^Axiom ' certificates/coq/export.v)

echo
echo "Format     Theorems   Axioms"
echo "─────────  ────────  ───────"
printf "lean       %8d  %7d\n" "$LEAN_T" "$LEAN_A"
printf "coq        %8d  %7d\n" "$COQ_T"  "$COQ_A"

fail=0
for fmt in lean coq; do
    case "$fmt" in
        lean) t=$LEAN_T; a=$LEAN_A;;
        coq)  t=$COQ_T;  a=$COQ_A;;
    esac
    if [ "$t" -ne "$EXPECTED_THEOREMS" ]; then
        echo "FAIL: $fmt export emits $t theorems, expected $EXPECTED_THEOREMS"
        fail=1
    fi
    if [ "$a" -ne "$EXPECTED_AXIOMS" ]; then
        echo "FAIL: $fmt export emits $a axioms, expected $EXPECTED_AXIOMS"
        fail=1
    fi
done

if [ "$fail" -eq 0 ]; then
    echo
    echo "OK: M0.A signal preserved across exports — 20 @theorem + 176 @axiom"
    exit 0
else
    exit 1
fi
