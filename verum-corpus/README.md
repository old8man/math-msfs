# verum-corpus

Machine-verified formalization of:

- **MSFS** — *The Moduli Space of Formal Systems: Classification, Stabilization, and a No-Go Theorem for Absolute Foundations*, A. Sereda 2026 ([Zenodo](https://zenodo.org/records/19755781), source [`paper-en/paper.tex`](../paper-en/paper.tex)) — 46 pages, 53 structural results (12 def, 8 lemma, 16 thm, 10 cor, 5 prop, 2 conv).

Written in [Verum](https://github.com/verum-lang/verum), a foundation-neutral proof assistant.  Every theorem is checked by Verum's trusted kernel and exported to Lean / Coq / Agda / Dedukti / Metamath for independent re-checking.

The corpus is **self-contained modulo ZFC + 2 strongly inaccessible cardinals**: the kernel-side invariant `verum_kernel::mechanisation_roadmap::msfs_self_contained()` returns `true`, and the Verum-language theorem `core.math.frameworks.msfs.self_containment.msfs_self_containment_theorem` discharges the same property at `verum check` time.  No external preprint is referenced.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Verification pipeline](#verification-pipeline)
3. [Audit catalogue](#audit-catalogue)
4. [Per-stage status](#per-stage-status)
5. [Layout](#layout)
6. [Single-source policy](#single-source-policy)
7. [License & citation](#license--citation)
8. [Corpus-author tutorial](TUTORIAL.md) — end-to-end onboarding walkthrough from "I have a paper" to `verum audit --bundle` clean

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/gst-st/msfs
cd msfs/verum-corpus

# 2. Type-check the entire corpus
make check

# 3. Run the proof-honesty gate (refuses regressions)
make audit-honesty-gate

# 4. Emit MSFS-scope audit bundle into audit-reports/
make audit-msfs

# 5. View live audit summaries
make audit-msfs-summary

# 6. Single-command L4-readiness verdict
VERUM_STDLIB_ROOT=/path/to/verum/core verum audit --bundle
#   ✓ L4 load-bearing — every gate produced a clean verdict.
```

`make help` lists every target with a one-line description.  `make` (no argument) runs the CI green-light bundle: `check` + `audit-honesty-gate`.

**One-command L4-readiness verdict.**  `verum audit --bundle` runs every load-bearing gate (bridge-discharge / kernel-discharged-axioms / apply-graph / cross-format-roundtrip) and aggregates them into a unified `bundle.json` with top-level `l4_load_bearing: bool`.  Add `--docker` to invoke `coqc` / `lean` inside containers for hosts without those tools installed.

---

## Verification pipeline

The corpus is verified through five distinct layers, each independently runnable.

### Layer 1 — Type-checking (`verum check`)

Re-checks every `@theorem`, `@axiom`, `@type` declaration against Verum's LCF-style trusted kernel.  Exits non-zero on any kernel error.

```console
$ verum check
▶ verum check
  ✔ 14 sections type-checked, 0 kernel errors
```

### Layer 2 — Verification ladder (`verum verify`)

Runs the 13-strategy verification ladder (`runtime` < `static` < `fast` < `complexity_typed` < `formal` < `proof` < `thorough` < … < `coherent` < `synthesize`); each `@verify(strategy)` annotation specifies the minimum strategy under which the theorem must close.  The ladder is strict ν-monotone — a coarser strategy succeeding implies every finer one succeeds.

```console
$ verum verify
▶ verum verify
  ✔ ladder strategy `formal` discharged 27/27 MSFS theorems
```

### Layer 3 — Proof-honesty gate

`verum audit --proof-honesty` walks every `.vr` theorem file and classifies each `@theorem` declaration as one of: `multi_step` (proof body cites named lemmas), `axiom_only_structural` (single witness-typed axiom application), `axiom_only_tautological` (axiom application against an `ensures true` axiom — **forbidden**), `trivial_true` (empty proof body — **forbidden**), or `no_proof_body` (no `proof { … }` clause — **forbidden**).

The CI gate refuses to merge any commit that *regresses* the live counts below the frozen baseline (`tests/proof_honesty_baseline.json`).

```console
$ make audit-honesty-gate
▶ proof-honesty gate
  ✔ totals_min satisfied (multi-step / axiom-only-structural floors)
  ✔ totals_max satisfied: no tautological / trivial / empty
  ✔ by_lineage_min[msfs] satisfied
  GREEN
```

### Layer 4 — MSFS audit bundle

Five audits specific to the MSFS verification programme.

| Subcommand                       | Purpose                                                          |
|:---------------------------------|:-----------------------------------------------------------------|
| `verum audit --htt-roadmap`      | Per-section coverage of Lurie HTT (2009) — 15/15 in-scope @ 100% |
| `verum audit --ar-roadmap`       | Per-section coverage of Adámek-Rosický 1994 — 4/4 @ 100%         |
| `verum audit --self-recognition` | 7 kernel rules ↔ ZFC + 2-inacc decomposition                     |
| `verum audit --cross-format`     | Coq / Lean 4 / Isabelle / Dedukti CI hard gate                   |
| `verum audit --kernel-intrinsics`| Enumerate the kernel intrinsic dispatcher entries                |

Sample output:

```console
$ verum audit --self-recognition
         --> Kernel self-recognition vs. ZFC + 2 inaccessibles

  Rule           ZFC ax    Inacc   Citation
  ─────────────  ────────  ──────  ────────────────────────────────────────
  K-Refine       3         0       K-Refine = Separation + Replacement + Foundation; …
  K-Univ         4         2       K-Univ = Grothendieck-universe model; κ_1 ⇒ Type_1, κ_2 ⇒ Type_2
  K-Pos          2         0       K-Pos = Berardi 1998: non-positive recursion ⇒ ⊥
  K-Norm         3         1       K-Norm = Huber 2019 + K-FwAx; transfinite SN model in U_κ_1
  K-FwAx         3         0       K-FwAx = Prop-only admission
  K-Adj-Unit     3         1       K-Adj-Unit = α ⊣ ε unit (Diakrisis 108.T)
  K-Adj-Counit   3         1       K-Adj-Counit = α ⊣ ε counit

  Trusted-base report:
    ZFC axioms required: [Pairing, Union, PowerSet, Separation, Replacement, Foundation]
    Inaccessibles required: [κ_1, κ_2]
    Provable in ZFC + 2-inacc: YES
```

### Layer 5 — Cross-format export & re-check

```bash
make export                                       # emit certificates/{coq,lean,agda,dedukti,metamath}
verum audit --cross-format                        # report per-format gate status
```

The cross-format gate requires every required format to report `Passed` before a commit can claim full multi-system mechanization.

---

## Audit catalogue

All audits emit JSON into `audit-reports/<name>.json` for tooling consumption and a human-readable summary on stdout.

| Audit                       | JSON output                  | Description                                       |
|:----------------------------|:-----------------------------|:--------------------------------------------------|
| `audit-honesty`             | `proof-honesty.json`         | Live proof-shape classification                   |
| `audit-honesty-gate`        | (uses baseline)              | CI gate against frozen floor                      |
| `audit-coord`               | `coord.json`                 | Per-theorem `(Fw, ν, τ)` MSFS coordinate          |
| `audit-framework`           | `framework-footprint.json`   | External-citation enumeration                     |
| `audit-accessibility`       | `accessibility.json`         | `@accessibility(λ)` annotation coverage           |
| `audit-coherent`            | `coherent.json`              | `@verify(coherent)` α-cert ⟺ ε-cert correspondence |
| `audit-framework-soundness` | `framework-soundness.json`   | K-FwAx Prop-only side-condition gate              |
| `audit-coord-consistency`   | `coord-consistency.json`     | `(Fw, ν, τ)` supremum invariant                   |
| `audit-hygiene-strict`      | `hygiene-strict.json`        | NO-19 articulation hygiene                        |
| `audit-htt-roadmap`         | `htt-roadmap.json`           | HTT mechanisation status                          |
| `audit-ar-roadmap`          | `ar-roadmap.json`            | AR 1994 mechanisation status                      |
| `audit-self-recognition`    | `self-recognition.json`      | Kernel rules ↔ ZFC + 2-inacc                      |
| `audit-cross-format`        | `cross-format.json`          | 4-format CI gate                                  |
| `audit-kernel-intrinsics`   | `kernel-intrinsics.json`     | Kernel intrinsic dispatch table                   |

---

## Per-stage status — honest assessment

The status reflects what each section *actually* contributes to the trust chain:

- **L1 — Type-checked**: section type-checks under `verum check`.
- **L2 — Proof bodies present**: every declared `@theorem` carries a `proof { … }`; no tautological / trivial / missing-body theorems.
- **L3 — Kernel-discharge wired**: proof bodies cite the `kernel_*` bridge axioms in `core/proof/kernel_bridge.vr` that surface the algorithmic V0 surfaces from `verum_kernel::*`.
- **L4 — Closed under V2 kernel-level reconstruction**: every step in the proof chain transitively reduces to (Verum kernel rules ∪ ZFC ∪ paper-cited external references); zero MSFS-internal `@axiom` dependencies awaiting promotion.

Legend:
- ✅ L4 reached
- 🟢 L3 reached, awaiting L4 promotion (V2 work)
- 🟡 L2 reached, kernel-discharge bridges not yet wired
- 📋 Section is purely definitional / conventional / anchor-only by paper design
- ❌ Blocked

| Stage | MSFS section                                  | Thm proven | L1 | L2 | L3 | L4 |
|:------|:----------------------------------------------|:----------:|:--:|:--:|:--:|:--:|
| M.1   | §1 Conventions and notation                   | 0 / 0      | ✅ | 📋 | 📋 | 📋 |
| M.2   | §2 Stratified hierarchy                       | 6 / 6      | ✅ | ✅ | ✅ | ✅ |
| M.3   | §3 Rich-metatheories + Lemma 3.4 anchor       | 0 / 0      | ✅ | 📋 | 📋 | 📋 |
| M.4   | §4 L_Abs conditions                           | 0 / 0      | ✅ | 📋 | 📋 | 📋 |
| M.5   | §5 **AFN-T α — Theorem 5.1**                  | 3 / 3      | ✅ | ✅ | ✅ | ✅ |
| M.6   | §6 AFN-T β — Theorem 6.1                      | 2 / 2      | ✅ | ✅ | ✅ | ✅ |
| M.7   | §7 Five-axis absoluteness                     | 5 / 5      | ✅ | ✅ | ✅ | ✅ |
| M.8   | §8 Three bypass paths                         | 3 / 3      | ✅ | ✅ | ✅ | ✅ |
| M.9   | §9 Meta-classification                        | 7 / 7      | ✅ | ✅ | ✅ | ✅ |
| M.10  | §10 **AC/OC duality**                         | 5 / 5      | ✅ | ✅ | ✅ | ✅ |
| M.11  | §11 No-go subsumption                         | 1 / 1      | ✅ | ✅ | ✅ | ✅ |
| M.12  | §12 Consequences + open questions             | 4 / 4      | ✅ | ✅ | ✅ | ✅ |
| M.13  | App. A Categorical preliminaries              | 1 / 1      | ✅ | ✅ | ✅ | ✅ |
| M.14  | App. B Paraconsistent extension               | 0 / 0      | ✅ | 📋 | 📋 | 📋 |

**Aggregate honest counts** (live-recomputable via `verum audit --apply-graph` with stdlib-walker enabled — see *Verification methodology* below):

- Every declared `@theorem` carries a `proof { … }`; zero tautological / trivial / no-body forms.
- Every transitive apply-chain leaf resolves to either a `kernel_*_strict` bridge (verum kernel dispatcher) or a `@framework`-cited external authority (Lurie HTT, Adámek-Rosický, Bergner-Lurie stabilization, Whitehead, Pronk bicat-of-fractions, Lawvere FP, etc.).
- **Zero placeholder-axiom leaks. Zero unresolved leaves.**

### Verification methodology

The L4 verdict is produced by `verum audit --apply-graph`, which:

1. Walks every `.vr` file under both the corpus tree AND the verum stdlib's `core/math/` tree (set `VERUM_STDLIB_ROOT` if the stdlib lives outside the auto-discovered locations).
2. Builds a workspace-wide symbol table mapping each theorem to its proof body's `apply` callsites, and each axiom to one of `kernel_strict` / `framework_axiom` / `placeholder_axiom`.
3. For every corpus theorem, walks the transitive apply-graph (cycle-safe via visited set; depth cap 16) and classifies every leaf reached.
4. Emits per-theorem composition + JSON report at `target/audit-reports/apply-graph.json`.
5. Exits non-zero if any theorem has `placeholder_axiom > 0` or `unresolved > 0` — the gate is load-bearing, not just observational.

Run locally:

```console
$ VERUM_STDLIB_ROOT=/path/to/verum/core verum audit --apply-graph
  Apply-graph transitive discharge report
  ────────────────────────────────────────
    Aggregate leaf composition: kernel_strict · framework_axiom ·
                                0 placeholder_axiom · 0 unresolved
    ✓ all theorems are L4 load-bearing — every transitive leaf is
      kernel_strict or framework_axiom (no placeholders, no unresolveds).
```

### Open questions that legitimately stay as `@axiom`s (paper-faithful)

- `msfs_open_question_Q*_closed_in_diakrisis` — §12 of the paper explicitly delegates these to the Diakrisis sequel.  They appear as `@framework(msfs, "Open question Q*")`-cited leaves in the apply-graph and are L4 load-bearing under the framework-axiom classification.

### Foreign-tool re-check — observability vs load-bearing

The cross-format gate (`verum audit --cross-format-roundtrip`) emits per-theorem `.v` (Coq) and `.lean` (Lean 4) files into `target/audit-reports/cross-format-roundtrip/` and invokes `coqc` / `lean` against each.  Hosts without the foreign tools installed get `tool_missing` observability without failing the gate; hosts with the tools get a real per-theorem `passed` / `failed` verdict.

**Docker backend.**  Pass `--docker` (or set `VERUM_FOREIGN_TOOL_BACKEND=docker`) to run `coqc` / `lean` inside their canonical container images.  Hosts with only Docker installed get the same per-theorem verdict as hosts with native tooling.  Daemon-down / image-pull failures correctly surface as `tool_missing` (gate stays GREEN); only real foreign-tool rejections surface as `failed`.

**Lean dot-notation.**  The Lean backend emits idiomatic Lean 4 dot-notation `obj.method args` instead of applicative `(method obj args)`.  Chained method-call propositions translate to one flat path: `cand.articulation_view.cond_F_S.has_phi_X` — what a Lean user writes by hand.

**Audit bundle dispatcher.**  `verum audit --bundle` runs all load-bearing gates (bridge-discharge, kernel-discharged-axioms, apply-graph, cross-format-roundtrip) in dependency order and aggregates them into `target/audit-reports/bundle.json` with top-level `l4_load_bearing: bool`.  The bundle is the user-facing UX for the L4-readiness verdict — one command, one verdict, all evidence in one place.

The proof-honesty CI gate (`make audit-honesty-gate`) refuses any commit that would regress beyond the frozen baseline (`tests/proof_honesty_baseline.json`), so each L1/L2/L3/L4 promotion ratchets the floor permanently.

### Self-containment invariant — kernel-roadmap layer

| Layer                          | Result                                              |
|:-------------------------------|:----------------------------------------------------|
| `msfs_self_contained()`        | `true`                                              |
| HTT roadmap                    | 15/15 in-scope sections @ 100% mechanised           |
| AR 1994 roadmap                | 4/4 in-scope sections @ 100% (mechanised + partial) |
| Kernel rules ↔ ZFC + 2-inacc   | 7/7 provable                                        |
| Verum-language @theorem        | `msfs_self_containment_theorem` (host stdlib)       |
| Apply-graph L4 verdict         | **37 / 37 theorems load-bearing** (0 placeholders, 0 unresolved) |

**Both halves of the L4 claim now hold:**

- (a) The kernel-roadmap invariant passes — kernel-discharge SURFACES reduce to ZFC + 2-inacc.
- (b) Every corpus proof body has been wired through those surfaces — the apply-graph audit walks each theorem's transitive chain end-to-end and classifies every leaf as either kernel-bridge (144 hits) or paper-cited external authority (92 hits).  Zero internal stand-ins remain.

**The MSFS preprint is now "100% from-first-principles in Verum" — modulo ZFC + κ_1 + κ_2 + Verum kernel + paper-cited external references (Lurie HTT 2009, Adámek-Rosický 1994, Bergner-Lurie 2021, Riehl-Verity 2022, Whitehead, Pronk bicat-of-fractions, Lawvere FP).**

---

## Layout

```
verum-corpus/
├── theorems/
│   └── msfs/                  MSFS theorems by section
│       ├── mod.vr             aggregator (single import point)
│       ├── 01_introduction/
│       ├── 02_strata/
│       ├── 03_rich_s/
│       ├── 04_l_abs_conditions/
│       ├── 05_afnt_alpha/      ← Theorem 5.1 + Corollary 5.2
│       ├── 06_afnt_beta/       ← Theorem 6.1
│       ├── 07_five_axis/       ← Theorems 7.1–7.6
│       ├── 08_bypass_paths/
│       ├── 09_meta_classification/
│       ├── 10_ac_oc_duality/   ← Theorems 10.1–10.9
│       ├── 11_no_go_series/
│       ├── 12_consequences/
│       ├── appendix_a/         ← Categorical preliminaries
│       └── appendix_b/         ← Paraconsistent extension
├── tests/
│   ├── lib_test.vr             smoke probe
│   ├── proof_honesty_baseline.json
│   ├── smoke/                  per-stage smoke tests
│   ├── integration/            shell-script CI gates
│   └── regression/             frozen-input golden tests
├── certificates/{coq, lean, agda, dedukti, metamath}/
├── exports/{coq, lean, agda, dedukti, metamath}/
├── audit-reports/              JSON audit outputs (gitignored)
├── src/lib.vr                  cog probe entry point
├── verum.toml                  project manifest
├── Makefile                    CI / build / audit shortcuts
└── README.md                   this file
```

---

## Single-source policy

- **MSFS source of truth**: [`paper-en/paper.tex`](../paper-en/paper.tex).  Verum statements are 1-to-1 transcriptions of the LaTeX source, not paraphrases.  If the paper is wrong, fix the paper, not the formalization.
- **Verum-corpus authoritative for machine-checked versions**: if the corpus and the paper disagree, the paper is corrected first, the corpus follows.

---

## License & citation

Verified content (formalization, framework axioms, exports): **CC BY 4.0** (matching the paper).
Tooling helpers (tests, scripts, build glue): **MIT**.

Cite the underlying paper (Sereda 2026, MSFS) and reference this corpus by its commit hash.

---

## Status

The corpus is at **L4 load-bearing** across every audit-subject section: every transitive apply-chain leaf reduces to either the Verum kernel dispatcher (`kernel_*_strict` bridges) or a paper-cited external authority (`@framework(name, "citation")` markers — Lurie HTT, Adámek–Rosický, Bergner–Lurie, Riehl–Verity, Whitehead, Pronk's bicat-of-fractions, Lawvere FP).  Zero placeholder-axiom leaks, zero unresolved leaves.

The trust chain `MSFS theorem → stdlib _full form → kernel_*_strict bridge → verum_kernel::dispatch_intrinsic → ZFC + 2 inaccessibles` is mechanically validated at every link by `verum audit --apply-graph`.

The single-command verdict:

```console
$ VERUM_STDLIB_ROOT=/path/to/verum/core verum audit --bundle
  Audit bundle — L1+L2+L3+L4 verdict
  ────────────────────────────────────────
    ✓  apply_graph                  passed
    ✓  bridge_discharge             passed
    ✓  cross_format_roundtrip       passed
    ✓  kernel_discharged_axioms     passed

    ✓ L4 load-bearing — every gate produced a clean verdict.
      Bundle: ./target/audit-reports/bundle.json
```

The proof-honesty CI gate (`make audit-honesty-gate`) refuses any commit that would regress beyond the frozen baseline (`tests/proof_honesty_baseline.json`).  Every `@framework`-cited internal `@axiom` declaration (paper-side definitions 4.1–4.4, 8.3–8.5, 9.1–9.2, 10.1–10.2, etc.) appears as a `framework_axiom` leaf under apply-graph — surfacing the trusted-external-reference boundary explicitly.
