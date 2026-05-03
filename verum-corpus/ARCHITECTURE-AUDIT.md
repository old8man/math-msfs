# verum-corpus — architecture audit & refactoring plan

This document is the architectural critique of the MSFS corpus
as it stands today, plus the concrete plan to turn it into a
clean, expressive, demonstrable showcase of Verum's
machine-verification capabilities.

The corpus has *the right shape* — paper-section-mirroring file
layout, framework-axiom citation discipline, single-source
policy, five-format export, audit gates. The issues are local:
process artefacts that leaked into the mathematical content,
tautological scaffolding that obscures the proofs, and doc
comments that are PR descriptions rather than mathematical
exposition.

---

## 1. Findings

### 1.1 Process / history clutter inside mathematical content

**Pattern.** Comments like
`Pre-M0.7-A this @theorem trivially obtained false from the bridge's tautological ensures`
or
`**Architectural fix (M0.B-A).** The pre-M0.B-A version of this theorem (host stdlib core/math/absolute_layer.vr) had …`
appear *inside* doc comments on theorems whose subject is
purely mathematical (MSFS Theorem 5.1, the AFN-T α-part).

**Why it hurts.** A reader landing on Theorem 5.1 to see *the
formal statement of the no-go theorem* gets a paragraph of
internal change-log narration instead. The PR description is
embalmed in the source. As soon as more revisions land, the
"pre-X" / "post-Y" prose either gets stale or gets multiplied;
either way it never serves the reader.

**Fix.** The mathematical doc comment ends at the proof outline
and the framework-footprint note. PR-history goes to
`git log` / `CHANGELOG.md`, not to `theorem_5_1.vr`.

### 1.2 Tautological "stage anchors" in the namespace

**Pattern.** Each stage file declares an axiom of the shape

```verum
public axiom msfs_stage_m_2_anchor(stage_index: Int) -> Bool
    requires stage_index == 2
    ensures  stage_index == 2;
```

Five such anchors exist (`msfs_stage_m_2_anchor` …
`msfs_stage_m_5_anchor`).

**Why it hurts.** These are *not* mathematical content — they
are audit-trail decorations the `verum audit --coord` walker
keys off. They pollute the corpus's namespace, they appear in
the proof-honesty audit's axiom inventory, and they make
"axiom counts" misleading: a five-axiom-inflation across a
14-file corpus is significant when individual sections claim
"5 axioms used".

**Fix.** Lift stage tagging into a project-level metadata
declaration (one file, declared once) keyed off the file path
or a `@stage_anchor(M.N)` attribute. Or — simpler — use
filesystem-path inference in `verum audit --coord` and drop the
anchor axioms entirely. The audit wants to know *which stage*
a theorem is in; the filesystem already encodes that.

### 1.3 Self-promoting prose in mathematical exposition

**Pattern.** Headlines like

```
// MSFS Theorem 5.1 — AFN-T α-part (FLAGSHIP)
```

and prose like *"the technical linchpin of MSFS"*, *"the
headline result of the entire MSFS paper"*, *"FLAGSHIP"* in
banner comments.

**Why it hurts.** A formal corpus's tone should match the
paper's. The MSFS paper does not call its own results
"flagship" or "linchpin"; it states them and proves them. The
corpus is supposed to be the paper's machine-verifiable mirror,
so editorial colour belongs in `README.md` (where it does in
fact already live), not in the mathematical files.

**Fix.** Strip the editorial. The doc comment for Theorem 5.1
should state the theorem and outline the proof — that's it.

### 1.4 Refinement-form / protocol-form duplication

**Pattern.** `msfs_theorem_5_1_afnt_alpha` (over
`&LAbsCandidate`) and `msfs_theorem_5_1_refined_view` (over
`&RefinedLAbsWitness`) both prove `false`; the second exists
because of a host-stdlib refinement-type architectural fix that
consolidated a previously-broken bridge.

**Why it hurts.** A reader sees Theorem 5.1 *twice*, with
different parameter types and a sub-proof bridging the second
back to the first. Both views carry full verbose doc comments.
The duplication is an artefact of a host-stdlib refactor, not a
mathematical distinction in the paper.

**Fix.** One canonical statement, one canonical proof.
Refinement-typed views can be derived corollaries (named
`msfs_theorem_5_1_refined`) with one-line proofs and a one-line
doc comment that says "refinement-typed restatement of
`msfs_theorem_5_1_afnt_alpha`". No duplicated paper-prose.

### 1.5 `verum.toml` has a TODO that should not exist

**Pattern.**
```toml
# TODO(T2.1.1): bump to "certified" once verum.toml parser supports 9-strategy ladder.
verification = "proof"
```

**Why it hurts.** The corpus's discipline forbids
roadmap-in-content. The manifest is content. Either the
verification level is correct as it stands (no TODO needed) or
it is wrong and should be made correct.

**Fix.** Drop the TODO; commit to whichever strategy the parser
actually supports today. If the language ships nine-strategy
support, set it; if not, set the highest strategy that is
correct and stable.

### 1.6 Sidecar Python script owns the proof-honesty audit *(resolved)*

**Pattern.** `tools/proof_honesty_audit.py` was a 625-line Python
walker that classified `.vr` axioms vs theorems and produced the
JSON the CI gate consumed.

**Resolution.** The Python walker has been retired. The CI gate
(`make audit-honesty-gate`) and the baseline-refresh path
(`make refresh-honesty-baseline`) both invoke the native
`verum audit --proof-honesty` command. The corpus no longer
depends on Python tooling for proof-honesty classification —
the demonstration of Verum's machine-verification surface is
self-contained.

### 1.7 §12 "consequences" file is mostly axioms

**Pattern.** `12_consequences/diagnostics_and_open_q.vr`
declares **21 axioms** in 195 LOC. The file's role is to
catalogue MSFS's diagnostic invariants and open questions, not
to prove new theorems — but every diagnostic is shipped as a
free-standing `@axiom`.

**Why it hurts.** When the verifier asserts "diagnostic D
holds", what the kernel actually checks is the `@axiom`'s
trivial `ensures true` shape. The reader sees 21 unprotected
postulates. The same content could be expressed as a single
`@theorem` per diagnostic that closes via case analysis on the
established no-go results.

**Fix.** Rebuild §12 as derived theorems whose proofs cite
Theorem 5.1 / 6.1 / 11.1. If a diagnostic genuinely is an
*open question*, mark it `@open_question` (a Verum lifecycle
attribute) rather than postulating it as fact.

### 1.8 Mid-proof comments narrate engineering history

**Pattern.** Inside `theorem_5_1`'s `proof { … }` block:

```verum
// Step 1c — Lemma 3.4 OPERATIONAL COROLLARY (@theorem): the Lemma 3.4
//           output lives in S_S^global with closure_depth ≥ 1.
//           Discharging this @theorem-application puts the
//           Grothendieck/O2 chain (HTT 5.1.4 + Definition 3.3 O2)
//           on the kernel-recheck stack — the property is now an
//           established fact about ss_membership, not an axiom-cited
//           promise. Pre-M0.7-A this @theorem was never invoked
//           anywhere in the corpus despite carrying the operational
//           content of Lemma 3.4.
```

**Why it hurts.** Mid-proof comments should explain *why this
step is needed* in the proof, not narrate when in development
history it became invokable. The "Pre-M0.7-A" line is
specifically noise.

**Fix.** Each step's comment is one or two lines, mathematical.
"Lemma 3.4 places `X` in `S_S^global`" is enough.

### 1.9 Strict-form kernel-bridge axioms imported but unused-by-name elsewhere

**Pattern.** `theorem_5_1.vr` mounts six strict-form bridge
axioms (`kernel_grothendieck_construction_strict`,
`kernel_compute_colimit_strict`,
`kernel_infinity_topos_strict`,
`kernel_whitehead_promote_strict`,
`kernel_truncate_to_level_strict`,
`kernel_identity_is_equivalence_strict`) and applies them inline
inside the proof. The applications discharge the
`K-Refine`-shaped preconditions but the *bindings have no other
consumer*; they exist to demonstrate Verum's refinement-typed
kernel-bridge surface.

**Why it hurts.** When the reader's question is *"does this
proof actually depend on these axioms?"*, the answer is yes —
but the structure (mount + apply inline) is identical to
Lemma-3.4 / id_X-violation citations that *do* carry
mathematical content. Strict-form bridges should be visually
separable from the mathematical citation chain.

**Fix.** Group the strict-form bridge `apply` calls under a
single `proof`-step block annotated as "kernel-discharge
ceremony" so the mathematical chain (Step 1a → 1b → 1c → Step 2
→ Step 3) reads cleanly.

### 1.10 Doc-comment flags `@verify(formal)` is actually
`certified` according to README

The README claims AFN-T flagship results run at
`@verify(certified)`; theorem files declare `@verify(formal)`.
The discipline note in CLAUDE.md says `certified` is the
strictest strategy expected. Pick one and align both.

---

## 2. Verum CLI surface — what corpus authors need

The corpus relies on these subcommands today, all of which
should be documented under a single "corpus author CLI" page
on the website:

| Command | Purpose |
|---|---|
| `verum check` | type-check the corpus end-to-end |
| `verum verify` | run the verification ladder |
| `verum audit --bundle` | aggregate-verdict gate |
| `verum audit --framework-axioms --by-lineage <name>` | enumerate framework footprint |
| `verum audit --kernel-rules` | inference-rule inventory |
| `verum audit --kernel-recheck` | re-run every theorem through the trusted base |
| `verum audit --differential-kernel{,-fuzz}` | three-kernel agreement |
| `verum audit --reflection-tower` | meta-soundness |
| `verum audit --coord{,-consistency}` | MSFS-coordinate projection |
| `verum audit --hygiene{,-strict}` | articulation hygiene |
| `verum audit --epsilon` | Actic ε-distribution |
| `verum audit --owl2-classify` | OWL 2 graph audit |
| `verum audit --htt-roadmap` / `--ar-roadmap` | mechanisation-roadmap status |
| `verum audit --soundness-iou` | outstanding admit ledger |
| `verum audit --apply-graph` / `--dependent-theorems` | proof-DAG inspection |
| `verum audit --bridge-discharge` | Diakrisis-bridge marker discharge |
| `verum audit --proof-term-library` | canonical proof-term examples |
| `verum audit --signatures` | cross-format-roundtrip signatures |
| `verum audit --round-trip` | per-theorem 108.T round-trip status |
| `verum audit --cross-format` | per-theorem cross-format coverage |
| `verum audit --proof-honesty` | proof-honesty classifier (currently sidecar) |
| `verum audit --arch-discharges` | ATS-V anti-pattern catalog |
| `verum audit --reflection-tower` | MSFS-grounded meta-soundness |
| `verum export --to <coq\|lean\|agda\|dedukti\|metamath>` | foreign-format certificates |
| `verum import --from <coq\|lean4\|mizar\|isabelle>` | foreign-system theorem import |
| `verum cert-replay {replay,cross-check,formats,backends}` | SMT-cert cross-validation |
| `verum doc-render {render,graph,check-refs}` | auto-paper docs |
| `verum check-proof` / `verum elaborate-proof` | per-`.vproof` re-verification + emission |
| `verum cog-registry {publish,lookup,search,verify,consensus,seed-demo}` | registry surface |
| `verum cache-closure {stat,list,get,clear,decide}` | per-theorem closure-hash cache |
| `verum tactic {list,explain,laws}` | tactic catalogue |
| `verum proof-draft` | next-step tactic suggestions |
| `verum proof-repair --kind <K>` | structured repair suggestions |
| `verum proof-repl {batch,tree}` | non-interactive proof REPL |

Of these, the corpus's `Makefile` exercises ~15 directly. Two
gaps surface from this audit:

1. **`--proof-honesty` doesn't classify axiom-vs-theorem the
   way the Python sidecar does.** The sidecar exists because
   the audit gate's classification is too coarse for a corpus
   whose discipline is "no proof-by-`@axiom` for theorems
   claimed verified". Either tighten the gate or document the
   sidecar as an external-tool dependency.
2. **No first-class corpus-author command** that consolidates
   "validate the corpus's discipline for me" into a single
   verb. Today corpus authors run `make audit-honesty-gate +
   make check + make audit-msfs` — three commands. A
   `verum audit --corpus-discipline` aggregator would consume
   the project-local `[corpus]` section of `verum.toml` and
   produce one verdict.

---

## 3. Refactoring plan — first wave

This audit is paired with a concrete first wave of edits that
land *now*:

1. **Strip historical / process markers** from every
   `theorems/msfs/**/*.vr` file. M0.7-A / M0.B-A / T3.5-V2 /
   `(M.5)` / `(FLAGSHIP)` / `(headline)` / `(linchpin)` —
   all gone.
2. **Drop the `verum.toml` TODO.** Pick a stable verification
   level for `[profile.release]`.
3. **Strip the `msfs_stage_m_*_anchor` axioms.** Replace with
   nothing; the audit already keys off filesystem path.
4. **De-editorialise the doc comments** in `theorem_5_1.vr`,
   `theorem_6_1.vr`, `proposition_2_2_2_3.vr`,
   `lemma_3_4_anchor.vr`, `conventions.vr`,
   `definitions_4_1_to_4_4.vr`, and `diagnostics_and_open_q.vr`.
5. **Group strict-form kernel-bridge `apply` calls** in
   `theorem_5_1.vr` under a single `// kernel-discharge`
   sub-block so the mathematical chain reads cleanly.

Subsequent waves (deferred):

- §12 axiom-to-theorem migration (touches the larger paper
  structure; out of scope for the first refactor).
- Refinement-form / protocol-form unification (touches the
  host stdlib's refinement-typed bridge, which is a separate
  source-of-truth boundary).
- `--proof-honesty` Verum-native enhancement to retire the
  Python sidecar (touches the Verum kernel's audit-gate
  surface, which is a separate cog).

---

## 4. Demonstrating Verum

The corpus already exercises an unusually wide spectrum of
Verum's surface:

- **Refinement types** (`Int{>= -1}`, `StrictPos`, `True`,
  `RefinedLAbsWitness`).
- **Dependent records** with method dispatch
  (`LAbsCandidate.cond_F_S().has_phi_X()`).
- **Universe-polymorphic protocols** (`MathObject`, `RichS`).
- **Proof-DSL with `apply`-style chaining** + multi-step
  sequencing.
- **Kernel-discharge bridges** with refinement-typed
  preconditions that the kernel rejects at type-construction
  time (`kernel_*_strict`).
- **Five-format proof export** (Coq / Lean / Agda / Dedukti /
  Metamath) with byte-deterministic round-trip.
- **Twelve audit bands** with structured JSON suitable for CI.
- **Foundation-neutral framework citation**
  (`@framework(msfs, "MSFS Theorem 5.1 …")`).
- **MSFS-coordinate projection**
  (`(framework, ν, τ)` triple recorded per theorem).

After the first-wave edits land, the demonstration improves on
two axes:

1. **Signal-to-noise.** The reader who lands on Theorem 5.1
   sees the theorem, the proof, and the framework citation —
   not the change-log narration.
2. **Discipline visibility.** Stripping the tautological stage
   anchors means the audit's axiom counts reflect real
   `@axiom` content. The "axiom inventory is small" claim
   becomes empirically verifiable.

Subsequent waves close the deeper architectural gaps (§12, the
refinement-form/protocol-form duplication, the Python sidecar)
and turn the corpus into a clean, expressive showcase
suitable for the `verum.lang` documentation site to point at as
*the* canonical "Verum at scale" demonstration.
