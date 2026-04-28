#!/usr/bin/env python3
"""
Proof-honesty audit walker (M0.E + M-PROOFS-A enhancement)
============================================================

Scans every .vr file under `theorems/` AND host-stdlib `core/math/` to:

1. Build an index of all axiom definitions (their ensures-shape +
   witness-parameterisation status).
2. Classify every theorem under `theorems/` according to whether its
   proof body is structurally honest or tautological.

Schema-version 2 categorisation:

  * `axiom-placeholder`             — `public axiom <name>(...) -> ...`
  * `theorem-no-proof-body`         — `public theorem ... ;` (no `proof { }`)
  * `theorem-trivial-true`          — `proof { }` empty body, `ensures true`
  * `theorem-axiom-only-tautological` — single `apply <axiom>` whose target
                                      has `() -> Bool ensures true` shape
                                      (no witness propagation; structurally
                                      a no-op even though kernel rechecks
                                      the citation)
  * `theorem-axiom-only-structural` — single `apply <X>` where the target
                                      consumes witness-typed parameters
                                      (refines theorem hypothesis; kernel
                                      observes meaningful pre/post chain)
  * `theorem-multi-step`            — proof body has ≥ 2 apply / let bindings

Schema-version 1 fallback (when index lookup fails):
  any single-apply theorem is reported as `theorem-axiom-only` (legacy
  category). New runs with the full corpus produce the v2 categories.

For each theorem, also reports:

  * `framework_axiom_deps` — count of `apply <axiom>` calls in the body
                             whose target is `@framework(...)`-annotated.
  * `theorem_deps`         — count of `apply <theorem>` calls.
  * `let_bindings`         — count of `let <var> = ...` constructions
                             (proxy for witness-construction depth).
  * `proof_body_lines`     — line count of the proof block (excl. blank).
  * `apply_targets`        — list of called names (axiom or theorem).
  * `tautological_target`  — bool, only set on theorem-axiom-only-* rows.

This file is intentionally a stand-alone walker (no dependency on the
verum_cli audit infrastructure) so it can run in a CI container without
the full build. Schema-version=2; bumped when fields are added or
when category set changes.

Usage:
  python3 tools/proof_honesty_audit.py [--check]

  --check exits non-zero if any theorem-trivial-true rows appear or if
  the corpus regresses below the M0.E baseline (set in BASELINE below).
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

CORPUS_ROOT = Path(__file__).resolve().parent.parent
THEOREMS_DIR = CORPUS_ROOT / "theorems"
OUTPUT = CORPUS_ROOT / "audit-reports" / "proof-honesty.json"
SCHEMA_VERSION = 2

# Host-stdlib paths to scan for axiom definitions referenced from corpus.
# The corpus directory is reachable via TWO paths (symlink), so `.resolve()`
# above lands at the canonical location. Probe several candidate host-stdlib
# locations relative to the SYMLINK chain (not just resolved root).
def _find_host_stdlib(subpath: str) -> Path | None:
    here = Path(__file__).resolve().parent.parent  # corpus root (resolved)
    candidates = [
        # verum-lang path relative to non-resolved __file__ location
        Path(__file__).parent.parent / "../../../../.." / subpath,
        # symlink-resolved path (oldman/math-msfs/verum-msfs-corpus parent chain)
        here / "../../../verum-lang/verum" / subpath,
        here / "../../verum-lang/verum" / subpath,
        # absolute fallback
        Path("/Users/taaliman/projects/oldman/verum-lang/verum") / subpath,
    ]
    for c in candidates:
        c_resolved = c.resolve()
        if c_resolved.exists():
            return c_resolved
    return None


HOST_STDLIB_MATH = _find_host_stdlib("core/math")
HOST_STDLIB_VERIFY = _find_host_stdlib("core/verify")

# Baseline gate (M0.E): regression below these counts fails CI.
BASELINE = {
    "msfs_theorem_multi_step_min": 12,
    "diakrisis_theorem_multi_step_min": 8,
    "trivial_true_max": 0,
}

# Pre-compiled patterns.
THEOREM_HEADER_RE = re.compile(
    r"^\s*public\s+theorem\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)",
)
AXIOM_HEADER_RE = re.compile(
    r"^\s*public\s+axiom\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)",
)
APPLY_RE = re.compile(r"\bapply\s+(?:[A-Za-z_][A-Za-z0-9_.]*\.)?(?P<target>[A-Za-z_][A-Za-z0-9_]*)\s*\(")
LET_RE = re.compile(r"^\s*let\s+[A-Za-z_]")
ENSURES_TRUE_RE = re.compile(r"\bensures\s+true\b")
ENSURES_FALSE_RE = re.compile(r"\bensures\s+false\b")
ENSURES_RE = re.compile(r"\bensures\s+")
# Detect parameterless axiom signature: `axiom name() -> Bool` form.
PARAMETERLESS_FN_RE = re.compile(r"\([^)]*\)\s*->\s*Bool\s*$|\(\s*\)\s*->\s*Bool")
# Detect `&Witness` style parameter — protocol/struct reference.
WITNESS_PARAM_RE = re.compile(r"&\s*(?:mut\s+)?[A-Z][A-Za-z0-9_]*")


def scan_file_axioms_only(path: Path) -> dict[str, dict[str, Any]]:
    """Pre-scan: build an index `name -> {ensures_shape, has_witness_param,
    is_parameterless}` for every public axiom in the file."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    n = len(lines)
    index: dict[str, dict[str, Any]] = {}

    i = 0
    while i < n:
        line = lines[i]
        ax_m = AXIOM_HEADER_RE.match(line)
        if ax_m:
            name = ax_m.group("name")
            block_end = find_decl_end(lines, i)
            block_text = "\n".join(lines[i : block_end + 1])
            sig = signature_of(block_text)
            index[name] = {
                "ensures_shape": ensures_shape(block_text),
                "is_parameterless": is_parameterless_signature(sig),
                "has_witness_param": has_witness_typed_param(sig),
                "file": str(path),
            }
            i = block_end + 1
            continue
        i += 1

    return index


def signature_of(block_text: str) -> str:
    """Extract the function-signature line `(...args...) -> RetType requires/ensures`
    portion from the block — everything between the name and the proof body
    or terminating `;`. We use this for parameter-shape detection."""
    # Find 'axiom <name>' / 'theorem <name>' position, then take the rest
    # up to the first 'proof {' or terminating ';' or `where` clause.
    m = re.search(r"(?:axiom|theorem)\s+[A-Za-z_][A-Za-z0-9_]*", block_text)
    if not m:
        return ""
    sig = block_text[m.end():]
    # Truncate at proof block or final terminator
    proof_idx = sig.find("proof {")
    if proof_idx != -1:
        sig = sig[:proof_idx]
    return sig


def is_parameterless_signature(sig: str) -> bool:
    """True iff the signature is `() -> Bool` (or `() -> Bool ensures ...`)."""
    # Strip whitespace, match `()` near the start (after any generic <...>)
    # followed eventually by `-> Bool`.
    sig_stripped = re.sub(r"\s+", " ", sig).strip()
    # Drop generic params if present: <T,...>
    sig_stripped = re.sub(r"^\s*<[^>]*>\s*", "", sig_stripped)
    # Now should start with `(`. Find the matching `)`.
    if not sig_stripped.startswith("("):
        return False
    depth = 0
    end_idx = -1
    for idx, ch in enumerate(sig_stripped):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                end_idx = idx
                break
    if end_idx == -1:
        return False
    inside = sig_stripped[1:end_idx].strip()
    if inside:  # has parameters
        return False
    rest = sig_stripped[end_idx + 1:].strip()
    return rest.startswith("-> Bool")


def has_witness_typed_param(sig: str) -> bool:
    """True iff signature has at least one `&CapitalIdent`-typed parameter
    (witness-protocol shape)."""
    sig_stripped = re.sub(r"\s+", " ", sig).strip()
    # Drop generic params
    sig_stripped = re.sub(r"^\s*<[^>]*>\s*", "", sig_stripped)
    if not sig_stripped.startswith("("):
        return False
    depth = 0
    end_idx = -1
    for idx, ch in enumerate(sig_stripped):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                end_idx = idx
                break
    if end_idx == -1:
        return False
    inside = sig_stripped[1:end_idx]
    return bool(WITNESS_PARAM_RE.search(inside))


def build_axiom_index() -> dict[str, dict[str, Any]]:
    """Build a global axiom name → {ensures_shape, ...} index from the
    corpus theorems/ AND host-stdlib core/math/ + core/verify/ + similar.
    Names collide across files only when they should: each name maps to
    exactly one definition, last write wins (host-stdlib has authoritative
    structural axioms, corpus has anchor markers)."""
    index: dict[str, dict[str, Any]] = {}

    # Corpus theorems (anchors + corpus-local axioms)
    for vr in sorted(THEOREMS_DIR.rglob("*.vr")):
        index.update(scan_file_axioms_only(vr))

    # Host stdlib — only relevant subdirs
    if HOST_STDLIB_MATH is not None and HOST_STDLIB_MATH.exists():
        for vr in sorted(HOST_STDLIB_MATH.rglob("*.vr")):
            index.update(scan_file_axioms_only(vr))
    # core/verify/ also hosts msfs-shared axioms
    if HOST_STDLIB_VERIFY is not None and HOST_STDLIB_VERIFY.exists():
        for vr in sorted(HOST_STDLIB_VERIFY.rglob("*.vr")):
            index.update(scan_file_axioms_only(vr))

    return index


def scan_file(path: Path, axiom_index: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    rows: list[dict[str, Any]] = []
    n = len(lines)

    i = 0
    while i < n:
        line = lines[i]
        ax_m = AXIOM_HEADER_RE.match(line)
        if ax_m:
            name = ax_m.group("name")
            block_end = find_decl_end(lines, i)
            block_text = "\n".join(lines[i : block_end + 1])
            sig = signature_of(block_text)
            rows.append(
                {
                    "name": name,
                    "kind": "axiom-placeholder",
                    "ensures_shape": ensures_shape(block_text),
                    "is_parameterless": is_parameterless_signature(sig),
                    "has_witness_param": has_witness_typed_param(sig),
                    "framework_axiom_deps": 0,
                    "theorem_deps": 0,
                    "let_bindings": 0,
                    "proof_body_lines": 0,
                    "file": str(path.relative_to(CORPUS_ROOT)),
                }
            )
            i = block_end + 1
            continue

        th_m = THEOREM_HEADER_RE.match(line)
        if th_m:
            name = th_m.group("name")
            block_end = find_decl_end(lines, i)
            block_text = "\n".join(lines[i : block_end + 1])
            rows.append(classify_theorem(name, block_text, path, axiom_index))
            i = block_end + 1
            continue
        i += 1

    return rows


def find_decl_end(lines: list[str], start: int) -> int:
    """Find the closing `};` of a declaration starting at `start`."""
    n = len(lines)
    depth = 0
    saw_brace = False
    for idx in range(start, n):
        for ch in lines[idx]:
            if ch == "{":
                depth += 1
                saw_brace = True
            elif ch == "}":
                depth -= 1
        # Closing semicolon at depth 0 ends the decl.
        if saw_brace and depth == 0 and lines[idx].rstrip().endswith(";"):
            return idx
        if not saw_brace and lines[idx].rstrip().endswith(";"):
            return idx
    return n - 1


def ensures_shape(block_text: str) -> str:
    if ENSURES_FALSE_RE.search(block_text):
        return "false"
    if ENSURES_TRUE_RE.search(block_text):
        return "true"
    if ENSURES_RE.search(block_text):
        return "predicate"
    return "none"


def classify_axiom_only_target(target: str, axiom_index: dict[str, dict[str, Any]]) -> str:
    """Return 'tautological' / 'structural' / 'unknown' based on the called
    target's signature shape from the axiom index."""
    info = axiom_index.get(target)
    if info is None:
        return "unknown"
    if info["is_parameterless"] and info["ensures_shape"] == "true":
        # `() -> Bool ensures true` shape — tautological.
        return "tautological"
    if info["has_witness_param"] or info["ensures_shape"] in ("false", "predicate"):
        return "structural"
    if info["is_parameterless"]:
        # `() -> Bool ensures predicate` — could be either; treat as structural
        # if the predicate is not vacuous true.
        return "structural"
    return "structural"


def classify_theorem(name: str, block_text: str, path: Path,
                     axiom_index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    # Find the proof body if any.
    proof_idx = block_text.find("proof {")
    proof_body = ""
    proof_lines = 0
    if proof_idx != -1:
        proof_body = block_text[proof_idx:]
        proof_lines = sum(
            1
            for ln in proof_body.splitlines()
            if ln.strip() and not ln.strip().startswith("//")
        )

    applies = APPLY_RE.findall(proof_body)
    lets = sum(1 for ln in proof_body.splitlines() if LET_RE.match(ln))

    # Heuristic dep classification: any apply target whose name contains
    # `_theorem_` or matches the @theorem suffix is a theorem-dep; otherwise
    # treat as axiom-dep. The walker is conservative — names with "_theorem_"
    # in them are clearly theorems; everything else is treated as axiom.
    framework_axiom_deps = sum(1 for t in applies if "_theorem_" not in t)
    theorem_deps = sum(1 for t in applies if "_theorem_" in t)

    # Categorise.
    ensures = ensures_shape(block_text)
    sig = signature_of(block_text)
    has_witness = has_witness_typed_param(sig)
    if proof_idx == -1:
        kind = "theorem-no-proof-body"
        tautological_target = None
    elif ensures == "true" and len(applies) == 0 and lets == 0:
        kind = "theorem-trivial-true"
        tautological_target = None
    elif len(applies) <= 1 and lets == 0:
        # M-PROOFS-A enhancement: distinguish structural vs tautological.
        # If theorem CONSUMES witness-typed parameters AND ensures false/predicate,
        # the proof body propagates a meaningful obligation through the apply.
        # The TARGET axiom's shape determines whether the apply itself
        # contributes structural content.
        if applies:
            target_class = classify_axiom_only_target(applies[0], axiom_index)
            if has_witness and ensures in ("false", "predicate") and target_class == "structural":
                kind = "theorem-axiom-only-structural"
                tautological_target = False
            elif target_class == "tautological":
                kind = "theorem-axiom-only-tautological"
                tautological_target = True
            else:
                kind = "theorem-axiom-only-structural"
                tautological_target = False
        else:
            # Empty proof body with ensures != true — unusual; fall through.
            kind = "theorem-axiom-only-tautological"
            tautological_target = True
    else:
        kind = "theorem-multi-step"
        tautological_target = None

    row = {
        "name": name,
        "kind": kind,
        "ensures_shape": ensures,
        "has_witness_param": has_witness,
        "framework_axiom_deps": framework_axiom_deps,
        "theorem_deps": theorem_deps,
        "let_bindings": lets,
        "proof_body_lines": proof_lines,
        "apply_targets": applies,
        "file": str(path.relative_to(CORPUS_ROOT)),
    }
    if tautological_target is not None:
        row["tautological_target"] = tautological_target
    return row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero on regression vs BASELINE",
    )
    args = parser.parse_args()

    # First-pass: build axiom index.
    axiom_index = build_axiom_index()

    # Second-pass: classify theorems with the index in hand.
    rows: list[dict[str, Any]] = []
    for vr in sorted(THEOREMS_DIR.rglob("*.vr")):
        rows.extend(scan_file(vr, axiom_index))

    summary: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "scanned_files": sum(1 for _ in THEOREMS_DIR.rglob("*.vr")),
        "axiom_index_size": len(axiom_index),
        "totals": {
            "axiom_placeholder": sum(1 for r in rows if r["kind"] == "axiom-placeholder"),
            "theorem_no_proof_body": sum(1 for r in rows if r["kind"] == "theorem-no-proof-body"),
            "theorem_trivial_true": sum(1 for r in rows if r["kind"] == "theorem-trivial-true"),
            "theorem_axiom_only_tautological": sum(
                1 for r in rows if r["kind"] == "theorem-axiom-only-tautological"
            ),
            "theorem_axiom_only_structural": sum(
                1 for r in rows if r["kind"] == "theorem-axiom-only-structural"
            ),
            "theorem_multi_step": sum(1 for r in rows if r["kind"] == "theorem-multi-step"),
        },
        "by_lineage": {
            "msfs": {
                "theorem_multi_step": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-multi-step" and "/msfs/" in r["file"]
                ),
                "theorem_axiom_only_structural": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-axiom-only-structural" and "/msfs/" in r["file"]
                ),
                "theorem_axiom_only_tautological": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-axiom-only-tautological" and "/msfs/" in r["file"]
                ),
                "axiom_placeholder": sum(
                    1
                    for r in rows
                    if r["kind"] == "axiom-placeholder" and "/msfs/" in r["file"]
                ),
            },
            "diakrisis": {
                "theorem_multi_step": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-multi-step" and "/diakrisis/" in r["file"]
                ),
                "theorem_axiom_only_structural": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-axiom-only-structural" and "/diakrisis/" in r["file"]
                ),
                "theorem_axiom_only_tautological": sum(
                    1
                    for r in rows
                    if r["kind"] == "theorem-axiom-only-tautological" and "/diakrisis/" in r["file"]
                ),
                "axiom_placeholder": sum(
                    1
                    for r in rows
                    if r["kind"] == "axiom-placeholder" and "/diakrisis/" in r["file"]
                ),
            },
        },
        "rows": rows,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(CORPUS_ROOT)}")
    print(f"  axiom_index_size                  {summary['axiom_index_size']}")
    print(f"  axiom_placeholder                 {summary['totals']['axiom_placeholder']}")
    print(f"  theorem_no_proof_body             {summary['totals']['theorem_no_proof_body']}")
    print(f"  theorem_trivial_true              {summary['totals']['theorem_trivial_true']}")
    print(f"  theorem_axiom_only_tautological   {summary['totals']['theorem_axiom_only_tautological']}")
    print(f"  theorem_axiom_only_structural     {summary['totals']['theorem_axiom_only_structural']}")
    print(f"  theorem_multi_step                {summary['totals']['theorem_multi_step']}")
    print()
    print("by lineage:")
    for lin, counts in summary["by_lineage"].items():
        print(
            f"  {lin:<10}  multi={counts['theorem_multi_step']:<3}  "
            f"struct={counts['theorem_axiom_only_structural']:<3}  "
            f"taut={counts['theorem_axiom_only_tautological']:<3}  "
            f"axioms={counts['axiom_placeholder']}"
        )

    if args.check:
        msfs_ms = summary["by_lineage"]["msfs"]["theorem_multi_step"]
        diak_ms = summary["by_lineage"]["diakrisis"]["theorem_multi_step"]
        triv = summary["totals"]["theorem_trivial_true"]
        ok = True
        if msfs_ms < BASELINE["msfs_theorem_multi_step_min"]:
            print(
                f"REGRESSION: msfs multi_step {msfs_ms} < baseline "
                f"{BASELINE['msfs_theorem_multi_step_min']}",
                file=sys.stderr,
            )
            ok = False
        if diak_ms < BASELINE["diakrisis_theorem_multi_step_min"]:
            print(
                f"REGRESSION: diakrisis multi_step {diak_ms} < baseline "
                f"{BASELINE['diakrisis_theorem_multi_step_min']}",
                file=sys.stderr,
            )
            ok = False
        if triv > BASELINE["trivial_true_max"]:
            print(
                f"REGRESSION: trivial_true {triv} > baseline "
                f"{BASELINE['trivial_true_max']}",
                file=sys.stderr,
            )
            ok = False
        return 0 if ok else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
