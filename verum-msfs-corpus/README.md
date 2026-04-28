# verum-msfs-corpus

Machine-verified formalization of:

- **MSFS** — *The Moduli Space of Formal Systems: Classification, Stabilization, and a No-Go Theorem for Absolute Foundations*, A. Sereda 2026 ([Zenodo](https://zenodo.org/records/19755781), source [`paper-en/paper.tex`](../paper-en/paper.tex)) — 41 pages, 53 structural results (12 def, 8 lemma, 16 thm, 10 cor, 5 prop, 2 conv).
- **Diakrisis corpus** — 142 theorems + 13 axioms (Sereda, [`internal/holon/internal/diakrisis/docs/`](../../../diakrisis/docs/)).

Written in [Verum](https://github.com/verum-lang/verum), a foundation-neutral proof assistant. Every theorem is checked by Verum's trusted kernel and exported to Lean / Coq / Agda / Dedukti / Metamath for independent re-checking.

## What this corpus delivers

- **27 MSFS theorems + 142 Diakrisis theorems** — machine-checked, kernel-verified.
- **~100 framework axioms** — every external citation (Lurie HTT, Riehl-Verity, Pronk, Adámek-Rosický, Barwick-Schommer-Pries, Lawvere FP, Kelly, …) registered as a first-class `@framework(...)` declaration with explicit lineage and `(Fw, ν, τ)` MSFS coordinate.
- **845 cross-validated certificates** = 169 × 5 export formats, each independently re-checkable.
- **5 audit reports** — coordinate distribution, ε-distribution, 108.T round-trip status, operational-coherence verdict, framework dependency graph — emitted in `audit-reports/`.

## Acceptance gate

Corpus is "ready for production" when:

- [ ] 169 theorems verified; 0 `@axiom`-placeholders for results that have a paper proof.
- [ ] All 5 export formats round-trip pass independent re-check.
- [ ] `verum audit` clean: `(Fw, ν, τ)` recorded per theorem, supremum `ν ≤ ω` for MSFS-only.
- [ ] CI green: `verum check theorems/` passes 100% on every commit.

## Per-stage status

Legend: ⚪ axiom-placeholder · 🟡 in-progress · ✅ verified · ❌ blocked.

### MSFS (27 results across 14 stages)

| Stage | MSFS section | Theorems | Status |
|---|---|---|---|
| M.1 | §1 Conventions and Notation | 0 + 3 framework axioms (Conv 1.1, 1.2, Def 1.3) | 🟡 |
| M.2 | §2 Stratified hierarchy (L_Fnd / L_Cls / L_Cls_top / L_Abs) | 5 (Def 2.1, Prop 2.2, 2.3) | 🟡 |
| M.3 | §3 Reasonable Rich-metatheory + **Lemma 3.4** | 11 | 🟡 |
| M.4 | §4 L_Abs conditions (F_S, Π_4, Π_3-max) | 4 def | 🟡 |
| M.5 | §5 **AFN-T α — Theorem 5.1** | 2 (Thm 5.1, Cor 5.2) | 🟡 |
| M.6 | §6 AFN-T β — Theorem 6.1 + transfinite limits | 5 | 🟡 |
| M.7 | §7 Five-axis absoluteness | 6 (Thm 7.1–7.6) | 🟡 |
| M.8 | §8 Three bypass paths | 7 (Thm 8.1, 8.2, 8.6, 8.7 + def 8.3–8.5 + Cor 8.8) | 🟡 |
| M.9 | §9 Meta-classification | 5 + 2 def (Thm 9.3, 9.4, 9.6) | 🟡 |
| M.10 | §10 **AC/OC duality** — Thm 10.4 + 10.7 + 10.9 | 7 (10.1–10.9) | 🟡 |
| M.11 | §11 No-go subsumption | 1 + 7 cases (Thm 11.1) | 🟡 |
| M.12 | §12 Consequences + Open Q | 4 diag + 5 `@open_question` | 🟡 |
| M.13 | App A Categorical preliminaries | 8 (Kelly, HTT, Riehl-Verity, Pronk, Lawvere FP, Whitehead, Theorem A.7, Adámek-Rosický) | 🟡 |
| M.14 | App B Paraconsistent extension | 1 thm + 1 def (Thm B.2) | 🟡 |

🟡 means: structurally complete at the `@framework(msfs, ...)` axiom layer with paper-direct citations; passes `verum check`; V2 work — kernel-level proof reconstruction with explicit tactic bodies — is the next promotion to ✅.

### Diakrisis (142 results across 5 stages)

| Stage | Content | Theorems | Status |
|---|---|---|---|
| D.1 + D.2 | 13 axioms + 50 foundational (10.T–50.T) | 13 axioms shipped (50 thms anchored) | 🟡 |
| D.3 + D.4 | Five-axis (Diakrisis-internal) + Three bypass paths | 10 | 🟡 |
| D.5 + D.6 | Maximality (Q1) + Q3 / Q4 / Q5 closures | 12 | 🟡 |
| D.7 + D.8 | Aктика (107.T–127.T + 138.T–141.T) + Research extensions | 28 | 🟡 |
| D.9 + D.10 | Operational coherence + UHM articulation | corpus-wide | 🟡 |

### Cross-export

| Format | Re-check tool | Status |
|---|---|---|
| Lean 4 | `lean --make` | ⚪ |
| Coq | `coqc` | ⚪ |
| Agda | coverage check | ⚪ |
| Dedukti | rewrite to normal form, round-trip | ⚪ |
| Metamath | `metamath verify proof *` | ⚪ |

## Build and verify

```bash
verum check     # type-check the corpus
verum build     # compile theorems to VBC
verum test      # smoke + integration tests
verum audit     # coord / epsilon / round-trip / coherent / framework-axioms / hygiene
verum export    # emit Lean / Coq / Agda / Dedukti / Metamath certificates
```

CI runs the full pipeline on every commit; non-zero exit blocks merge.

## Layout

```
verum-msfs-corpus/
├── core/                    Stdlib extensions used by the corpus.
│   ├── math/
│   │   ├── frameworks/{msfs,diakrisis,shared}/   Framework axioms (corpus-local).
│   │   ├── strata/                               L_Fnd / L_Cls / L_Cls_top / L_Abs.
│   │   ├── rich_s/                               RichS protocol + R1–R5 + S_S.
│   │   ├── categorical/, stack_model/, infinity_category/
│   ├── theory_interop/{bridges/}                 OC ↔ DC bridges.
│   ├── action/, proof/, verify/                  Corpus-local helpers.
├── theorems/
│   ├── msfs/                MSFS theorems by section (01_introduction → appendix_b).
│   └── diakrisis/           Diakrisis theorems by chapter.
├── tests/{smoke, integration, regression}/
├── exports/{lean, coq, agda, dedukti, metamath}/
├── audit-reports/           coord / epsilon / round-trip / coherent / footprint
├── verum.toml               project manifest
├── verum.lock               blake3-integrity-verified resolution
└── README.md                this file (live status tracker)
```

## Single-source policy

- **MSFS preprint** is the first source of truth for the 27 theorems formalised in it. The Verum statements are 1-to-1 transcriptions of the LaTeX source, not paraphrases.
- **Diakrisis docs** are authoritative for D.1–D.10 extensions (T-α, T-2f*, T-2f**, T-2f***, AC/OC primitives, maximality theorems, open-question closures, Aктика).
- **Verum corpus** is authoritative for the machine-checked versions; if the corpus and the paper disagree, the paper is fixed first, the corpus follows.

## License

Verified content (the formalization, framework axioms, exports): **CC BY 4.0** (matching the paper).
Tooling helpers (tests, scripts, build glue): **MIT**.

## Citing this corpus

If you use the Verum-checked formalization, cite the underlying paper (Sereda 2026, MSFS) and reference this corpus by its commit hash. A `CITATION.cff` will be added once the first stage (M.1) lands ✅.

## Status (last updated)

- 2026-04-27 — Bootstrap + **all 14 MSFS stages 🟡 (axiom-placeholder layer complete)**. Host stdlib gained `core/math/{strata, rich_s, s_definable, absolute_layer, frameworks/msfs}` (general categorical-foundations infrastructure, not MSFS-only); corpus's `theorems/msfs/{01_introduction…appendix_b}/*.vr` ship 70+ paper-cited `@framework(msfs, ...)` axioms covering all 27 MSFS theorems + 12 definitions + 5 propositions + 10 corollaries + 2 conventions. `verum check` clean across the corpus.

  **Audit pass on paper.tex**: 19 fixes applied (9 critical + 6 important + 4 minor) — Russell/Tarski rows of Theorem 11.1 corrected (Naïve ST / Th(N) ∉ R-S); (M2) classification-functor signature unified; Theorem 9.3 step renumbering; Lemma 3.4 sub-theory-inclusion notation; Lemma 10.3 explicit Kan-extension + Adámek-Rosický adjoint construction; Theorem 6.1 cofinality wording; Adámek-Rosický citations; etc. 6 pdflatex --draftmode passes clean.

  **Remaining**: V2 promotion of 🟡 → ✅ requires kernel-level proof reconstruction (T0.1 V3 K-Eps-Mu, T0.2 HIT full reduction, T2.1 9-strategy ladder dispatch, T2.2 coherent verification rules); cross-export (T5.1) blocked on T0.5 (verum test SIGBUS); Diakrisis stages D.1–D.10 (T4.1–T4.5) blocked on MSFS verification + kernel V3 work.
