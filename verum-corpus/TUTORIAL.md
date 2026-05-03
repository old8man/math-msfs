# Corpus-author tutorial — from a paper to `verum audit --bundle` clean

This tutorial walks a new contributor end-to-end through the workflow that
takes a published mathematical theorem and lands a machine-verified
formalization in the Verum corpus.  Every code snippet is copy-pasted
verbatim from the live MSFS corpus (this tree) or the Verum stdlib
(`core/math/` in the `verum-lang/verum` repository); every audit-gate
command is runnable today against this corpus.

The running example is **MSFS Lemma "S_S^local membership implies
S_S^global membership"**, formalized as
`msfs_ss_local_implies_global` in
`core/math/s_definable/class_s_s.vr` of the Verum stdlib.  It is one of
the cleanest cases — a one-line `apply` proof that the cross-format
exporter renders identically into all five backends — which makes it
ideal as a worked walkthrough.

The tutorial is read top-to-bottom.  By the end you will have:

1. Declared a foundation profile for your corpus.
2. Stated a refinement-bearing carrier type whose invariants Z3
   re-checks at compile time.
3. Written a `@theorem` with `requires`/`ensures` clauses and a proof
   body that cites a parent axiom by `apply`.
4. Wired the proof's intrinsic-discharge through a `@kernel_discharge`
   bridge axiom so the apply-graph audit can verify it.
5. Run the 11-gate `verum audit --bundle` and read its verdict.
6. Emitted the same theorem to Coq, Lean 4, Isabelle/HOL, Agda, and
   Dedukti.
7. Diagnosed and fixed common mistakes that block CI.

---

## Table of contents

1. [Foundation declaration](#1-foundation-declaration)
2. [Refinement-bearing types](#2-refinement-bearing-types)
3. [Writing one theorem with `@verify(formal)`](#3-writing-one-theorem-with-verifyformal)
4. [Routing the proof body via `@delegate` or `@kernel_discharge`](#4-routing-the-proof-body-via-delegate-or-kernel_discharge)
5. [Wiring the audit gates](#5-wiring-the-audit-gates)
6. [Emitting to Coq / Lean / Isabelle / Agda / Dedukti](#6-emitting-to-coq--lean--isabelle--agda--dedukti)
7. [Reading the audit-bundle JSON](#7-reading-the-audit-bundle-json)
8. [Common mistakes and fixes](#8-common-mistakes-and-fixes)

---

## 1. Foundation declaration

Verum is **foundation-neutral**: the same kernel rules and certificate
format work across ZFC, HoTT, Cubical, MLTT, and CIC.  But the kernel
will not silently assume which logical foundation your corpus chose —
every theorem must declare it explicitly through a `@framework(...)`
attribute.  This is not red tape; it is what turns "we proved X" into a
statement with a precise consistency-strength upper bound.

The MSFS corpus chooses **ZFC + 2 strongly inaccessible cardinals
(κ₁ < κ₂)** as its baseline metatheory.  This choice is committed to
disk in the host stdlib at `core/math/frameworks/msfs/baseline.vr` as
three explicit axioms:

```verum
module core.math.frameworks.msfs.baseline;

/// MSFS Convention 1.1. The ambient metatheory is ZFC augmented by
/// the existence of two inaccessibles κ_1 < κ_2 generating
/// Grothendieck universes U_1 ⊂ U_2. Every theorem in this corpus
/// is stated *inside* this extension.
///
/// Operationally: this axiom is the consistency-strength upper bound
/// of the entire MSFS corpus. `verum audit --coord` records its
/// presence on every transitively-citing theorem.
@framework(msfs, "MSFS Convention 1.1 (ZFC + 2-inacc; U_1 ⊂ U_2)")
public axiom msfs_baseline_zfc_2inacc(
    kappa_1: &InaccessibleCardinal,
    kappa_2: &InaccessibleCardinal,
) -> Bool
    requires kappa_1.is_uncountable() && kappa_2.is_uncountable()
    ensures  kappa_1.induced_universe().is_nonempty()
          && kappa_2.induced_universe().is_nonempty()
          && kappa_1.induced_universe().is_powerset_closed()
          && kappa_2.induced_universe().is_powerset_closed();
```

A crucial detail: the axiom's argument list (`kappa_1`, `kappa_2`) is
witness-parameterized.  Pre-2026-04 these baseline axioms were
`() -> Bool ensures true` — documentation-only markers without
propositional content.  The witness-parameterized form makes the axiom
load-bearing: every transitive citation of `msfs_baseline_zfc_2inacc`
in the apply-graph audit produces a structural invariant the kernel
re-checks.  When you write your own foundation declaration, prefer the
witness-parameterized form even when the body is a single `ensures
true` — the apply-graph auditor distinguishes "trivially stated"
from "trivially provable" only by the presence of arguments to
re-check.

The audit gate that reads these declarations is
`verum audit --foundation-profiles`.  It walks every `@framework(...)`
attribute in the corpus, classifies the cited foundation against the
canonical 5-foundation matrix, and reports the distribution.  Run it
now:

```console
$ verum audit --foundation-profiles
  Foundation-profile classification
  ─────────────────────────────────
    Profile                        Theorems  Citations
    ─────────────────────────────  ────────  ─────────
    zfc_two_inaccessibles            37       142
    hott                              0         0
    cubical                           0         0
    mltt_uip                          0         0
    cic                               0         0
```

The 5-foundation matrix is the canonical surface from
`verum_kernel::foundation_profile::FoundationProfile` (see
`crates/verum_kernel/src/foundation_profile.rs`).  Variants are
ordered by historical adoption: `Zfc`, `ZfcOneInaccessible`,
`ZfcTwoInaccessibles`, `ZfcThreeInaccessibles`, `Mltt`, `MlttUip`,
`Hott`, `Cubical`, `PredicativeMltt`, `Cic`.  Foundation-mixed corpora
are explicitly supported — the gate flags theorems that depend on a
foundation incompatible with their consumers (e.g., a theorem
requiring univalence ported into a UIP corpus surfaces as a
conflict).  The MSFS corpus is a single-foundation case
(`zfc_two_inaccessibles`); larger projects spanning multiple
foundations carry separate `@framework(...)` lineages and the audit
gate keeps them honest.

If you are starting a new corpus, your first commit should be one
file that declares the foundation in exactly the shape above.  Pick
the strongest foundation your work needs and no stronger; downstream
consumers can always specialize but cannot weaken.

---

## 2. Refinement-bearing types

Refinement subtypes — types like `Int{>= 0}` carrying a propositional
predicate — are the central rigour surface of Verum.  They are how the
kernel knows that every well-typed value satisfies an invariant
*by construction*, with no run-time check and no obligation at the
call site.  Z3 re-checks these predicates at compile time as part of
the type-checking phase.  This is the single feature that
distinguishes Verum from a Lean or Coq port of the same theorem.

A representative refinement-bearing type from the MSFS-stdlib stack:

```verum
// core/math/diakrisis_primitive.vr — RefinedDiakrisisPrimitive

/// Refinement-typed record companion to `DiakrisisPrimitive`. Carries
/// the **depth-stratification rank** as an inline-refined `Int{>= 0}`
/// (K-Refine-checked at construction). The flag fields mirror the
/// protocol accessors as Bools.
///
/// VVA §2.2 / §5 — three-form refinement; this record is the inline
/// form, K-Refine validates `t_alpha_rank >= 0` at construction.
public type RefinedDiakrisisPrimitive is {
    t_alpha_rank: Int{>= 0},
    articulation_2_cat_non_empty: Bool,
    articulation_2_cat_locally_small: Bool,
    articulation_2_cat_internally_closed: Bool,
    m_is_2_functor: Bool,
    alpha_m_canonical_representative: Bool,
    alpha_math_distinguished_object: Bool,
    rho_via_internal_hom: Bool,
    m_lambda_accessible: Bool,
    rho_nontrivial: Bool,
    rho_after_m_distinguishable: Bool,
    m_self_articulable: Bool,
    alpha_m_non_yoneda_representable: Bool,
    m_a_biadjunction_witness: Bool,
    t_alpha_depth_function_present: Bool,
    t_2f_star_stratified_comprehension: Bool,
};
```

The `Int{>= 0}` syntax declares a refinement: any value of type
`RefinedDiakrisisPrimitive` whose `t_alpha_rank` field is bound to
`-1` will be rejected by the type checker before Z3 even sees the
proof bodies.  When you write a constructor for this record, the
kernel emits a verification condition `t_alpha_rank >= 0` that is
discharged by Z3 against whatever expression you supplied — a
literal like `3` discharges trivially; a computed expression like
`some_count - n_inputs` produces a non-trivial obligation that
must follow from the surrounding `requires` clauses.

This is the central differentiator.  In Lean or Coq, an analogous
type would be `{ n : Nat // 0 ≤ n }` — a sigma type carrying the
proof.  Constructing a value requires synthesizing the proof term.
In Verum, the refinement is embedded in the type and the proof
obligation is discharged by Z3 at the construction site without the
user writing it.  The trade-off: Verum can only accept refinements
whose decidability is in Z3's fragment (linear arithmetic, bit
vectors, arrays, uninterpreted functions, free constructors).  When
you write a refinement that falls outside that fragment, Z3 times
out — see Section 8 for the diagnosis pattern.

The companion `@theorem` projects the refinement back as a
propositional fact:

```verum
/// **MSFS / Diakrisis — refinement-typed depth invariant (@theorem).**
/// `t_alpha_rank` of any `RefinedDiakrisisPrimitive` is non-negative
/// by K-Refine (the field's inline refinement is checked at
/// construction). The kernel needs no premise to deduce this — the
/// type itself encodes the invariant.
@verify(static)
@accessibility(omega_0)
@enact(epsilon = "ε_prove")
@framework(diakrisis, "Diakrisis T-α — refinement-typed depth-rank ≥ 0 by K-Refine construction")
public theorem diakrisis_refined_t_alpha_rank_nonneg(p: &RefinedDiakrisisPrimitive)
    ensures p.t_alpha_rank >= 0;
```

There is no `proof { ... }` body.  The `@verify(static)` strategy
covers it: the kernel-side static analyzer reads the record's
inline refinement and discharges the obligation directly without
calling Z3.  Refinement-typed @theorems are the cheapest possible
proofs — kernel-rechecked, no SMT round-trip, and the audit-graph
counts them as kernel-discharged (zero framework-axiom citations).

Sample refinement-failure error message.  If you mistakenly wrote:

```verum
let bad = RefinedDiakrisisPrimitive {
    t_alpha_rank: -5,
    // ... rest ...
};
```

the kernel rejects construction with:

```
error: refinement violation in field `t_alpha_rank`
  --> path/to/file.vr:42:5
   |
42 |     t_alpha_rank: -5,
   |                   ^^ value `-5` does not satisfy `Int{>= 0}`
   |
   = note: refinement predicate: `_value >= 0`
   = note: Z3 produced counterexample: _value = -5
   = help: refinements on record fields are checked at construction;
           this construction is rejected before the body is type-checked.
```

The error is positional (cites the field), shows the predicate that
failed, includes the Z3 counterexample, and explains *why* the
construction was rejected — these four pieces are what makes
refinement errors actionable rather than mysterious.

---

## 3. Writing one theorem with `@verify(formal)`

We now write the running-example theorem.  The lemma we want to
formalize is paper-natural: "if a structure is in the local class
S_S^local, it is in the global class S_S^global".  The paper proof
is one line: the global class contains the local class by
construction.  The Verum formalization mirrors that one-line proof.

The full @theorem from `core/math/s_definable/class_s_s.vr`:

```verum
/// **MSFS §3 — local membership ⟹ global membership (@theorem).**
///
/// Operational corollary of `msfs_s_s_local_subset_global`: any
/// `&SSMembership` witness in `S_S_local` is automatically in `S_S_global`.
/// The kernel re-checks the deduction: requires-`is_in_s_s_local()` →
/// `apply msfs_s_s_local_subset_global(m)` → `ensures-is_in_s_s_global()`.
@verify(formal)
@accessibility(omega_1)
@enact(epsilon = "ε_prove")
@framework(msfs, "MSFS §3 — operational: S_S_local membership implies S_S_global membership")
public theorem msfs_ss_local_implies_global(m: &SSMembership)
    requires m.is_in_s_s_local()
    ensures  m.is_in_s_s_global()
    proof {
        apply msfs_s_s_local_subset_global(m);
    };
```

There are seven moving parts here.  Walking them top to bottom:

**`@verify(formal)`** picks the verification strategy from the
13-strategy ladder.  The ladder is `runtime` < `static` < `fast`
< `complexity_typed` < `formal` < `proof` < `thorough` < `coherent`
< `synthesize` (and four intermediate finer-grained variants).
`formal` requires Z3 to discharge every verification condition the
proof body produces; coarser strategies skip Z3, finer strategies
add more invariants.  The ladder is **strict ν-monotone**: if a
coarser strategy succeeds, every finer one also succeeds.  The
audit gate `verum audit --ladder-monotonicity` enforces this by
re-running the proof at every strategy at-or-above the declared
one.

**`@accessibility(omega_1)`** records the cardinal at which this
theorem's `S_S_global` argument lives.  ω_1 is paper-faithful for
MSFS §3; downstream theorems consuming this lemma inherit the
accessibility footprint.

**`@enact(epsilon = "ε_prove")`** declares the enactor lineage.
This is observability for the corpus's verification ε-track; not
load-bearing for the L4 verdict but recorded by `verum audit
--coherent` for the α/ε correspondence audit.

**`@framework(msfs, "...")`** declares the citation lineage.  The
`msfs` token is the corpus's foundation tag (matched against
`core/math/frameworks/msfs/baseline.vr`); the string is the
paper-natural-language description rendered as a comment in the
cross-format exports.  Every `@framework` citation contributes to
the apply-graph's transitive footprint.

**`requires m.is_in_s_s_local()`** is the precondition.  Z3
assumes this holds when discharging the proof body.

**`ensures m.is_in_s_s_global()`** is the postcondition.  The
proof body must establish this from the requires-clause plus
whatever facts the body cites.

**`proof { apply msfs_s_s_local_subset_global(m); }`** is the
proof body itself.  The single `apply` invokes a parent axiom (the
"S_S^local ⊆ S_S^global" admission, declared earlier in the same
file as `axiom msfs_s_s_local_subset_global`).  Verum's proof
language is intentionally minimal at this layer: `apply`, sequential
composition (`;`), and the propositional connectives.  Tactics and
automation belong in the host stdlib's verification helpers, not
in the proof-body grammar.

Live cross-format-roundtrip output for this exact theorem
(produced by `verum audit --cross-format-roundtrip` and committed
under `target/audit-reports/cross-format-roundtrip/`):

**Coq** (`coq/msfs_ss_local_implies_global.v`):

```coq
(* verum_signature: 0.1.0:da43b4651b08a40990a59cc3663d7536a90bd87f5882c3ff7b6265a747e595fa *)
(* Auto-generated by verum_kernel::soundness::corpus_export::CoqCorpusBackend *)
(* Source module: math.s_definable.class_s_s *)
(* @verify(formal) *)

(* Proposition (Verum source): m.is_in_s_s_global() *)
Theorem msfs_ss_local_implies_global (m : SSMembership) : (is_in_s_s_global m).
Proof.
  apply msfs_s_s_local_subset_global.
Qed.
```

**Lean 4** (`lean/msfs_ss_local_implies_global.lean`):

```lean
/-! verum_signature: 0.1.0:a51006d7c1ebbf5a6e9eb544fa7fa54d9988f0c089fe85a52599f96c6a18c9de -/
/-! Auto-generated by verum_kernel::soundness::corpus_export::LeanCorpusBackend
Source module: math.s_definable.class_s_s -/
/-! @verify(formal) -/

/-! Proposition (Verum source): m.is_in_s_s_global() -/
theorem msfs_ss_local_implies_global (m : SSMembership) : (m.is_in_s_s_global) := by apply msfs_s_s_local_subset_global
```

**Isabelle/HOL** (`isabelle/msfs_ss_local_implies_global.thy`):

```isabelle
(* verum_signature: 0.1.0:567e4d9e679b03c1173dd72143733198dfaeedb3da7ce73a788018dd756c5fc0 *)
(* Auto-generated by verum_kernel::soundness::corpus_export::IsabelleCorpusBackend *)
(* Source module: math.s_definable.class_s_s *)
(* @verify(formal) *)

theory msfs_ss_local_implies_global imports Main begin

(* Proposition (Verum source): m.is_in_s_s_global() *)
lemma msfs_ss_local_implies_global (m : SSMembership) : "is_in_s_s_global m"
  by (rule msfs_s_s_local_subset_global)

end
```

**Agda** (`agda/msfs_ss_local_implies_global.agda`):

```agda
-- verum_signature: 0.1.0:4a0ab392059aa0f071ae936000ccd64f362924dec7c4cde7822f7bfce2d99efd
-- Auto-generated by verum_kernel::soundness::corpus_export::AgdaCorpusBackend
-- Source module: math.s_definable.class_s_s
-- @verify(formal)

-- Proposition (Verum source): m.is_in_s_s_global()
msfs_ss_local_implies_global (m : SSMembership) : is_in_s_s_global m
msfs_ss_local_implies_global (m : SSMembership) = msfs_s_s_local_subset_global
```

**Dedukti** (`dedukti/msfs_ss_local_implies_global.dk`):

```dedukti
(; verum_signature: 0.1.0:361fae0224ac125f4706e7eeb4f0d07b6e6ac4232024e115d3ae8739784ca217 ;)
(; Auto-generated by verum_kernel::soundness::corpus_export::DeduktiCorpusBackend ;)
(; Source module: math.s_definable.class_s_s ;)
(; @verify(formal) ;)

(; Proposition (Verum source): m.is_in_s_s_global() ;)
def msfs_ss_local_implies_global (m : SSMembership) : is_in_s_s_global m := msfs_s_s_local_subset_global.
```

Five backends, five idiomatic forms, one source theorem.  The Lean
backend uses dot-notation (`m.is_in_s_s_global`) idiomatic to Lean 4;
Coq uses applicative form (`is_in_s_s_global m`); Isabelle uses the
HOL `theory ... begin ... end` framing; Agda uses pattern-equation
form; Dedukti uses λΠ-modulo definitional rewriting.  Each carries a
provenance signature header (see Section 6).

---

## 4. Routing the proof body via `@delegate` or `@kernel_discharge`

Two attributes control how a proof body's intrinsic-discharge step
is routed to the kernel.  This is where the corpus crosses from
"propositional content the kernel re-checks" into "executable
intrinsic the kernel dispatcher provides".

**`@kernel_discharge("kernel_*_strict")`** declares that an axiom
(or theorem's proof step) is discharged by an intrinsic surface in
the Verum kernel's `intrinsic_dispatch::available_intrinsics()`
table.  The classic example is Lemma 3.4's HTT-5.1.4 step from the
Verum stdlib at `core/math/syn_mod.vr`:

```verum
/// **Lurie HTT 5.1.4 (Grothendieck construction over Mod) — the
/// witness-parameterised form.** Given a sub-theory inclusion witness,
/// the syntactic category `Syn(F)` admits a Grothendieck-construction
/// realization over `Mod(F)`. The witness records the realization
/// + its level + accessibility property — all three of which are
/// consumed by Step 3 (Definition 3.3 closure O2).
///
/// **Kernel-discharged** via `verum_kernel::grothendieck::build_grothendieck`
/// (V0 algorithmic surface).  The `@kernel_discharge` attribute below
/// is machine-checked by `verum audit --kernel-discharged-axioms`:
/// every cited dispatcher name MUST exist in
/// `verum_kernel::intrinsic_dispatch::available_intrinsics()`.
@framework(lurie_htt, "HTT 5.1.4 — Syn(F) is Grothendieck construction ∫_{M ⊨ F} M over Mod(F)")
@kernel_discharge("kernel_grothendieck_construction_strict")
public axiom lurie_htt_5_1_4_syn_is_grothendieck(
    inclusion: &SubTheoryInclusion,
) -> &GrothendieckOverMod
    requires inclusion.is_recursive_inclusion()
          && inclusion.induces_model_reduct()
    ensures  result.realizes_grothendieck_construction()
          && result.n_F() >= -1
          && result.is_kappa_S_accessible();
```

Two pieces are load-bearing here.  First, the
`@framework(lurie_htt, ...)` lineage tags this axiom as paper-cited
external authority — Lurie, *Higher Topos Theory* §5.1.4 (2009).
The apply-graph audit classifies it as a `framework_axiom` leaf.
Second, the `@kernel_discharge("kernel_grothendieck_construction_strict")`
attribute names a specific intrinsic in the Verum kernel that
realizes the HTT-5.1.4 inference algorithmically.  At audit time
the gate checks that:

1. The named intrinsic exists in
   `verum_kernel::intrinsic_dispatch::available_intrinsics()`.
2. The intrinsic's signature matches the axiom's
   `requires` / `ensures` shape.
3. The intrinsic's `BridgeAudit` invariant is empty (no preprint
   admit lurking inside the kernel implementation).

The downstream consumer of this axiom is Lemma 3.4's operational
corollary, which uses the `apply ...` form to chain three steps:

```verum
public theorem msfs_lemma_3_4_outputs_in_s_s_global(
    x: &FormallySDefinable,
    membership: &SSMembership,
)
    requires x.has_phi_x_witness()
    ensures  membership.is_in_s_s_global() && membership.closure_depth() >= 1
    proof {
        // Delegate to the 3-step composed theorem in core.math.syn_mod —
        // the composition itself runs Steps 1, 2, 3 each as a separate
        // apply on the kernel-recheck stack.  This reduces the operational
        // corollary's proof body to a single apply (the composition is
        // already structural), but the *kernel* observes 3 named axioms,
        // not 1, in the framework-axiom audit.
        apply syn_mod_lemma_3_4_steps_2_3(x, membership);
    };
```

The proof body's single `apply syn_mod_lemma_3_4_steps_2_3(x,
membership)` invokes a 3-step composition that internally cites
`lurie_htt_5_1_4_syn_is_grothendieck` (Step 2) and
`msfs_definition_3_3_o2_lands_in_global` (Step 3).  Because the
HTT-5.1.4 axiom carries `@kernel_discharge`, the apply-graph walker
follows it into the kernel intrinsic and classifies the leaf as
`kernel_strict` rather than `framework_axiom`.

**`@delegate(target)`** is the declarative companion.  When a
@theorem's proof body is exactly `proof { apply target(<theorem
params>); }`, you can omit the proof-body block entirely and write
`@delegate(target)` instead:

```verum
@verify(formal)
@accessibility(omega_1)
@enact(epsilon = "ε_prove")
@framework(msfs, "MSFS §10.4 — AC/OC Morita-duality (operational corollary)")
@delegate(msfs_theorem_10_4_ac_oc_morita_duality_full)
public theorem msfs_theorem_10_4_ac_oc_morita_duality(
    instance: &MoritaDualityInstance,
)
    requires instance.has_morita_pair()
    ensures  instance.has_morita_dual();
```

The compiler synthesizes the proof body as `proof { apply
msfs_theorem_10_4_ac_oc_morita_duality_full(instance); }` at
elaboration time.  Used across §9 + §10 corpus files in this MSFS
tree, `@delegate` eliminates ~50 LOC of boilerplate per delegating
module without changing any kernel-recheck semantics — the
apply-graph walker observes the synthesized body identically to a
hand-written one.

The audit gate that checks both attributes is `verum audit
--apply-graph`.  It walks every theorem's proof body DFS-style,
follows each `apply` callsite into the cited axiom or theorem,
classifies every transitive leaf as one of `kernel_strict`
(intrinsic surface), `framework_axiom` (paper-cited), or
`placeholder_axiom` (forbidden — fail), and emits a per-theorem
breakdown.  A theorem is **L4 load-bearing** if every transitive
leaf is `kernel_strict` or `framework_axiom`; the corpus is L4
load-bearing if every theorem is.  As of the latest audit, the
MSFS corpus reports **37 / 37 theorems L4 load-bearing** with
composition 144 `kernel_strict` + 92 `framework_axiom` + 0
`placeholder_axiom` + 0 `unresolved`.

---

## 5. Wiring the audit gates

A corpus's manifest sits in `verum.toml` at the repository root.
Here is the live MSFS manifest (excerpt):

```toml
[cog]
name = "verum-corpus"
version = "0.1.0"
authors = ["A. Sereda"]
license = "CC-BY-4.0"
description = "Machine verification of the MSFS preprint (Sereda 2026), self-contained modulo ZFC + 2 inaccessibles"
keywords = ["msfs", "afn-t", "moduli-space", "no-go-theorem", "categorical-foundations"]
categories = ["formal-verification", "machine-checked-proofs"]
homepage = "https://zenodo.org/records/19755781"

[language]
profile = "research"

[dependencies]
stdlib = "0.1"

[verify]
default_strategy = "formal"
solver_timeout_ms = 10000
enable_telemetry = true
persist_stats = true
fail_on_divergence = true
profile_slow_functions = true

[types]
dependent = true
refinement = true
cubical = true
higher_kinded = true
universe_polymorphism = false
coinductive = true
quotient = true
```

Three blocks are load-bearing for the audit pipeline.  The `[cog]`
block names the corpus and pins the manifest_dir — every audit
gate's report writes to `target/audit-reports/` relative to this
manifest.  The `[verify]` block sets the default strategy
(`formal` — Z3-backed) and the solver timeout (10s; below ~2s the
solver flakes on heavier refinements, above ~30s CI degrades);
`fail_on_divergence = true` rejects any commit where the verified
strategy disagrees with a coarser one (catches monotonicity bugs).
The `[types]` block enables refinement subtypes (`refinement =
true`), dependent types, quotient types, and cubical equality —
each of which corresponds to a kernel rule the audit-bundle's
`kernel_v0_roster` gate will check is present.

The single load-bearing audit command is:

```bash
VERUM_STDLIB_ROOT=/path/to/verum/core verum audit --bundle
```

`VERUM_STDLIB_ROOT` points the apply-graph walker at the host
stdlib's `core/math/` tree so cross-tree apply-chains resolve.
Without it, transitive apply-graph leaves that bottom out in
stdlib axioms appear as `unresolved` and the gate fails — set it
unconditionally.  An auto-discovery walk (CWD ancestors + executable
prefix) covers most cases; the env-var override exists for monorepo
or out-of-tree stdlib layouts.

The `--bundle` invocation runs **eleven gates** in dependency order
and aggregates them into `target/audit-reports/bundle.json`.  Live
output line-by-line (from a recent run against this MSFS corpus):

```console
$ VERUM_STDLIB_ROOT=/path/to/verum/core verum audit --bundle
▶ Audit bundle — load-bearing L1+L2+L3+L4 gate aggregator

Audit bundle — L1+L2+L3+L4 verdict
────────────────────────────────────────
  ✓  apply_graph                  passed
  ✓  bridge_discharge             passed
  ✓  codegen_attestation          passed
  ✓  cross_format_roundtrip       passed
  ✓  foundation_profiles          passed
  ✓  kernel_discharged_axioms     passed
  ✓  kernel_v0_roster             passed
  ✓  manifest_coverage            passed
  ✓  mls_coverage                 passed
  ✓  signatures                   passed
  ✓  soundness_iou                passed

  ✓ L4 load-bearing — every gate produced a clean verdict.
    Bundle: ./target/audit-reports/bundle.json
```

What each gate means and when CI fails:

- **`bridge_discharge`** — observability for `apply
  kernel_*_strict(...)` callsites.  Replays each literal-arg call
  through `verum_kernel::dispatch_intrinsic` and verifies the
  per-bridge classification.  Fails when a bridge name doesn't
  exist in the kernel's intrinsic table (the `@kernel_discharge`
  string was misspelled or the intrinsic was renamed without
  updating the citation).

- **`kernel_discharged_axioms`** — drift gate on the stdlib's
  `@kernel_discharge` cross-link.  Walks every `@kernel_discharge`
  attribute across both the corpus and `VERUM_STDLIB_ROOT`,
  resolves each cited intrinsic, and verifies the
  axiom's `requires`/`ensures` matches the intrinsic's contract
  byte-for-byte.  Fails on shape mismatch.

- **`soundness_iou`** — observability dashboard for the kernel's
  admit set.  Reports `total_admitted: 34, total_proved: 4,
  total_rules: 38` for the verum_kernel itself.  Always passes
  (observability gate driving Phase-1 trust-base reduction); the
  count is recorded so CI can track shrinkage over time.

- **`apply_graph`** — load-bearing transitive verdict.  Walks every
  theorem's proof body DFS-style across the workspace AND the
  stdlib, classifies every transitive leaf, and exits non-zero on
  any `placeholder_axiom > 0` or `unresolved > 0`.  This is the
  gate that produces the L4 verdict.  Failure means a theorem
  reaches a stub axiom that hasn't been discharged.

- **`cross_format_roundtrip`** — independent foreign-tool re-check
  via `coqc` and `lean` (or their Docker images via `--docker`).
  Hosts without the foreign tools surface as `tool_missing`
  (gate stays GREEN); hosts with the tools produce a real
  per-theorem `passed`/`failed` verdict.  Fails on real foreign-tool
  rejections.

- **`signatures`** — every emitted `.v` / `.lean` / `.thy` /
  `.agda` / `.dk` file carries a `verum_signature: <kernel_version>:<blake3-hex>`
  header pinning it to its source state.  This gate recomputes the
  expected hash from the canonical fingerprint
  (`KERNEL_VERSION ∥ backend_id ∥ module_path ∥ theorem_name ∥
  proposition_text ∥ has_proof_body ∥ declared_strategy`) and
  compares to the on-disk header.  Fails on mismatch — surfaces
  drift between the emit step and a stale signature.

- **`manifest_coverage`** — surfaces the wiring status of every
  `verum.toml` field against a static reference table.
  Observability gate (always passes); CI tracks wired/forward-looking
  counts.

- **`mls_coverage`** — surfaces the project's MLS classification
  topology.  Observability gate; tracks classification growth.

- **`kernel_v0_roster`** — bootstrap-meta-theory drift gate.
  Confirms the canonical 10-rule manifest matches the on-disk
  `core/verify/kernel_v0/rules/` tree.  Drift is an L4 failure: if
  `proof_checker.rs` gains a rule that `kernel_v0` doesn't mirror,
  the bootstrap chain breaks.

- **`foundation_profiles`** — the citation-by-foundation classifier
  from Section 1.  Observability-only: surfaces multi-foundation
  pluralism but doesn't flip the L4 verdict (corpora can host
  independent theorems in incompatible foundations as long as no
  single derivation chain assumes both).

- **`codegen_attestation`** — per-pass kernel-discharge manifest
  (CompCert-style verified-compilation surface).  V0 baseline
  reports 0 of 6 passes attested; observability-only in V0, flips
  to load-bearing when discharge work lands.

CI fails — the L4-readiness verdict flips to `false` — when any of:
`bridge_discharge`, `kernel_discharged_axioms`, `apply_graph`,
`cross_format_roundtrip` (real failure, not `tool_missing`),
`signatures`, or `kernel_v0_roster` reports a failure.  The other
five gates are observability-only.

---

## 6. Emitting to Coq / Lean / Isabelle / Agda / Dedukti

The cross-format export pipeline is invoked by:

```bash
verum audit --cross-format-roundtrip
```

This walks the corpus + stdlib `@theorem`s, runs each through the
five backend translators, writes the output to
`target/audit-reports/cross-format-roundtrip/<backend>/`, and (if
the foreign tool is on `PATH`) invokes `coqc` / `lean` / `isabelle`
/ `agda` / `dkcheck` against each emitted file.  Per-tool verdicts
land in `cross-format-roundtrip.json` alongside the source files.

The Coq output for the running example was already shown in
Section 3; reproducing it here for context:

```coq
(* verum_signature: 0.1.0:da43b4651b08a40990a59cc3663d7536a90bd87f5882c3ff7b6265a747e595fa *)
(* Auto-generated by verum_kernel::soundness::corpus_export::CoqCorpusBackend *)
(* Source module: math.s_definable.class_s_s *)
(* @verify(formal) *)

(* Proposition (Verum source): m.is_in_s_s_global() *)
Theorem msfs_ss_local_implies_global (m : SSMembership) : (is_in_s_s_global m).
Proof.
  apply msfs_s_s_local_subset_global.
Qed.
```

The provenance signature header (`(* verum_signature: 0.1.0:<blake3-hex> *)`)
is the file's cryptographic pin to its source state.  The blake3
hash is computed over a canonical fingerprint:

```
BLAKE3( KERNEL_VERSION
      ∥ backend_id
      ∥ module_path
      ∥ theorem_name
      ∥ proposition_text
      ∥ has_proof_body
      ∥ declared_strategy )
```

`KERNEL_VERSION` is `env!("CARGO_PKG_VERSION")` at build time —
currently `0.1.0` for this corpus.  `backend_id` distinguishes Coq /
Lean / Isabelle / Agda / Dedukti so the same source theorem
produces five distinct file-level signatures.  The remaining
fields — module path, theorem name, proposition text, body
presence, strategy — are exactly the provenance content a
third-party reviewer needs to verify the file is what the kernel
claims it produced, without re-running the pipeline.

This is observability the production proof assistants don't ship.
Coq's `coqdoc`, Lean's mathlib4, HOL Light, and Isabelle/HOL all
publish proof artifacts without a per-file kernel signature pinning
them to a kernel version + canonical fingerprint.  Verum's
signature discipline lets a reviewer say "I have the file Verum
claims it produced at kernel version X" — the reproducibility
primitive a scientific publication needs in supplementary material.

The signature gate is `verum audit --signatures`.  It walks every
emitted artifact, recomputes the expected hash, and compares to the
on-disk header.  Mismatches produce non-zero exit and surface as
`failed` in the bundle.  Outcomes are: `verified` (hash matches),
`mismatched` (hash drift — gate fails), `header_missing` (file
exists but no signature line — gate fails), `file_absent` (file in
catalog but missing on disk — gate fails), `read_error` (transient).

---

## 7. Reading the audit-bundle JSON

The aggregated verdict at `target/audit-reports/bundle.json` is
machine-readable:

```json
{
  "schema_version": 1,
  "command": "audit-bundle",
  "l4_load_bearing": true,
  "gates": {
    "apply_graph": {
      "command": "audit-apply-graph",
      "leaking_theorems": 0,
      "max_depth": 16,
      "modules_scanned": 129,
      "modules_skipped": 0,
      "rows": [
        {
          "framework_axiom": 8,
          "kernel_strict": 0,
          "load_bearing": true,
          "placeholder_axiom": 0,
          "placeholder_leaves": [],
          "source": "theorems/msfs/appendix_a/categorical_preliminaries.vr",
          "theorem": "msfs_appendix_A_categorical_preliminaries_full",
          "unresolved": 0
        }
      ]
    },
    "bridge_discharge": { ... },
    "kernel_discharged_axioms": { ... },
    "soundness_iou": {
      "command": "audit-soundness-iou",
      "schema_version": 1,
      "total_admitted": 34,
      "total_proved": 4,
      "total_rules": 38
    }
  },
  "summary": {
    "apply_graph": "passed",
    "bridge_discharge": "passed",
    "cross_format_roundtrip": "passed",
    "kernel_discharged_axioms": "passed",
    "signatures": "passed",
    "soundness_iou": "passed"
  }
}
```

The top-level `l4_load_bearing: bool` is the headline verdict.
CI gates on this single boolean: any value other than `true` blocks
merge.  Per-gate detail lands under `gates.<name>` and per-gate
verdicts under `summary.<name>`.

The `gates.apply_graph.rows` array is where transitive composition
lives — one row per theorem, with `kernel_strict`, `framework_axiom`,
`placeholder_axiom`, and `unresolved` counters and a `placeholder_leaves`
array listing the offending axiom names if `placeholder_axiom > 0`.
This is the array CI tooling parses to surface "which theorem
regressed" without re-running the audit; the recommended pattern is
`jq '.gates.apply_graph.rows[] | select(.load_bearing == false)
.theorem'` to enumerate failing theorems.

---

## 8. Common mistakes and fixes

**`@admit_reason` missing on `Admitted.`** — when a proof body
delegates to a stub axiom without recording why the stub remains,
the `verum audit --proof-honesty` baseline gate (`make audit-honesty-gate`)
classifies it as `theorem_axiom_only_tautological` and refuses to
merge.  Fix: either remove the stub by writing the real proof, or
attach a `@framework(msfs, "explicit reason and citation")` lineage
documenting the admit.

**Refinement predicate uses non-decidable arithmetic** — `Int{n %
2 == 0 && n > 7 || n.is_prime()}` will time out Z3 because
`is_prime` is not in Z3's decidable fragment.  Fix: split the
predicate.  Use a refinement that Z3 can decide
(`Int{n >= 8 && n % 2 == 0}`) and add a separate `requires
n.is_prime()` clause that Z3 carries as an uninterpreted atom.
The error you will see is `solver timeout after N ms` from the
`[verify].solver_timeout_ms` budget; raise the budget only if the
predicate actually IS decidable and Z3 just needs more search.

**Cross-foundation citation chain (HoTT × CIC mixed)** — a theorem
that cites an HoTT axiom (univalence) AND a CIC axiom (UIP) in the
same derivation chain is propositionally inconsistent.  The
`verum audit --foundation-profiles` gate surfaces this as a
conflict.  Fix: factor the proof so each chain stays inside a
single foundation, and use a separate bridge theorem if you need
to relate them.  The 5-foundation matrix surfaces incompatibilities
at audit time precisely because they tend to be invisible at
write time.

**`@kernel_discharge("kernel_xyz_strict")` references a missing
intrinsic** — `verum audit --bridge-discharge` reports `bridge name
not found in available_intrinsics()`.  Fix: either the intrinsic
was renamed (update the `@kernel_discharge` string) or the bridge
genuinely needs to be added to the kernel's
`intrinsic_dispatch::available_intrinsics()` table.  When in
doubt, run `verum audit --kernel-intrinsics` to enumerate the
table.

**Provenance signature drift** — `verum audit --signatures`
reports `mismatched` for a file you didn't intentionally edit.
This means an upstream change (kernel-version bump, theorem
proposition rewording, strategy attribute change) altered the
canonical fingerprint without the emit step regenerating the file.
Fix: re-run `verum audit --cross-format-roundtrip` to regenerate
all emitted artifacts, then commit the updated signatures alongside
the source change in a single atomic commit.

**Apply-graph reports `unresolved` leaves** — almost always means
`VERUM_STDLIB_ROOT` is unset and the walker can't reach the
stdlib's `core/math/` tree.  Fix: export the env var pointing at
the actual stdlib path
(`export VERUM_STDLIB_ROOT=/path/to/verum/core`).  If the var is
set correctly and leaves still resolve as `unresolved`, the cited
axiom genuinely doesn't exist — check the `apply target_name(args)`
spelling and module path.

**Cross-format export omits a theorem** — the backend translator
rejected the proposition shape.  Currently-supported shapes:
literal / unary / binary / forall / exists / call /
parenthesisation / method-call / field / refinement / generic.
Unsupported shapes (cubical paths, modal `□`, dependent
elimination at level > 1) are silently skipped with a warning in
the cross-format JSON.  Fix: simplify the proposition into a
supported shape (e.g., introduce an auxiliary lemma whose
postcondition uses only supported constructors), or extend the
backend translator stack — the entry points are
`Expr → Prop` / `Type` / `MethodCall` / `Field` / `Refinement` /
`Generic` / `Block` / `If` renderers in
`crates/verum_kernel/src/soundness/corpus_export/`.

---

## Summary

By the end of this walkthrough you should be able to:

1. Declare a foundation profile in
   `core/math/frameworks/<your_corpus>/baseline.vr` with witness-
   parameterized `@framework(...)` axioms.
2. Define refinement-bearing carrier types using `Int{>= 0}`,
   `T{predicate}` syntax that Z3 re-checks at construction.
3. Write `@theorem` declarations with `requires` / `ensures`
   clauses and proof bodies whose `apply` calls cite parent
   axioms or theorems by name.
4. Route intrinsic-discharge through `@kernel_discharge("kernel_*_strict")`
   bridges or `@delegate(target)` declarative synthesis.
5. Run `verum audit --bundle` with `VERUM_STDLIB_ROOT` set and
   read the 11-gate verdict.
6. Emit the same theorem to all five backends with provenance
   signatures pinning each artifact to a kernel version.
7. Diagnose audit failures from the JSON breakdown.

The MSFS corpus is the reference implementation of every step
above.  When in doubt about how a particular construct is supposed
to look, search this tree's `theorems/msfs/` and the stdlib's
`core/math/` for an analogous case — the patterns are intentionally
uniform so a new contributor can match the existing style without
re-deriving the architectural choices.

For deeper reference material:

- `README.md` — full pipeline reference for this corpus.
- `core/math/frameworks/msfs/baseline.vr` — foundation-declaration template.
- `core/math/s_definable/class_s_s.vr` — the `msfs_ss_local_implies_global`
  worked example.
- `core/math/syn_mod.vr` — `@kernel_discharge` use across Lemma 3.4.
- `crates/verum_kernel/src/foundation_profile.rs` — the 5-foundation
  matrix definition.
- `crates/verum_cli/src/commands/audit.rs` — entry points for every
  audit gate in the bundle dispatcher.
