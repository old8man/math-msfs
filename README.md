# MSFS — The Moduli Space of Formal Systems

*The Moduli Space of Formal Systems: Classification, Stabilization, and a No-Go Theorem for Absolute Foundations.*

## Historical position

For over a century, the foundations of mathematics have accommodated a growing plurality of formal systems — Zermelo–Fraenkel set theory (1908–1922), von Neumann–Bernays–Gödel class theory (1925–1940), Lawvere's Elementary Theory of the Category of Sets (1964), Martin-Löf type theory (1984), the Calculus of Inductive Constructions (1988), Homotopy Type Theory (2005+), cubical HoTT (2015+), $(\infty, 1)$-topos theory (Lurie 2009), noncommutative geometry (Connes 1994), cohesive higher topos theory (Schreiber 2013), and more. Each is formally coherent; each interprets substantial fragments of classical mathematics; none has privileged status.

Parallel to this plurality, a line of structural impossibility results has accumulated: **Cantor 1891** (absolute infinity), **Russell 1903** (universal class), **Gödel 1931** (incompleteness), **Tarski 1936** (undefinability of truth), **Lawvere 1969** (fixed-point diagonal in cartesian-closed categories), **Feferman 2013** / **Ernst 2015** (unlimited category theory). Each closes one specific route to an absolute foundation; together they sketch a pattern without naming it.

MSFS takes the next step. It treats the totality of formal foundations as a single categorical object — the $(\infty, n)$-categorical moduli space $\mathfrak{M}$ — studies its structure directly, and exhibits the classical no-go results as specializations of one structural obstruction at the outer boundary.

This reframes the foundational question. The subject of study is no longer *"which foundation is the correct one?"* but *"what is the structure of the space of all coherent foundations, and where is its edge?"* Both questions receive formal answers.

## Fundamental claims

MSFS establishes four structural results about the interior of $\mathfrak{M}$ and one boundary corollary about its exterior.

### Interior structure

1. **Plurality at the classifier stratum $\mathcal{L}_{\mathrm{Cls}}$.** The $\infty$-cosmoi of Riehl–Verity, the Univalent Foundations programme of Voevodsky, and the cohesive higher-topos framework of Schreiber are pairwise non-$2$-equivalent partial classifiers. Each organizes a strict sub-stack of $\mathfrak{M}$. The plurality of foundations at $\mathcal{L}_{\mathrm{Fnd}}$ lifts, consistently, to a genuine plurality of ways of classifying them.

2. **Conditional categoricity at the maximal sub-class $\mathcal{L}_{\mathrm{Cls}}^{\top}$.** Any two classifiers that satisfy the maximality conditions (full classification, gauge-fullness, depth-stratification, intensional completeness) over the same Rich-metatheory are $(\infty, \infty)$-equivalent. The equivalence is canonical, via Grothendieck–Lurie straightening with joint faithfulness of the extensional and intensional classification functors.

3. **Slice-local intensional refinement.** The display-$2$-class functor $\mathbf{I}: \mathcal{F}^{\mathrm{op}} \to \mathcal{S}_{\mathrm{int}}$ has slice-locality over $\mathfrak{M}$: intensional distinctions invisible to extensional Morita equivalence — the MLTT / ETT gap, HoTT / cubical HoTT split, proof-term-level variance between Coq and Agda — live in the fibre over a *single* point of $\mathfrak{M}$. The separation is detected via Hyland's effective topos $\mathrm{Eff}$ through a computability invariant $\tau$.

4. **Theory-level meta-stabilization with universe-ascent.** Iterated meta-classification reproduces the *same* $(\infty, \infty)$-theory at every step (Barwick–Schommer-Pries unicity), while its set-theoretic instantiation genuinely ascends the Grothendieck-universe hierarchy $\kappa_1 < \kappa_2 < \cdots$. The theory is invariant; the size is not. This distinguishes theory-level equivalence from set-level identity and closes the concern that meta-classification could escalate beyond the stratum it classifies.

### Exterior boundary — Absolute Foundation No-Go Theorem

**AFN-T.** The syntax–semantics adjunction underlying a Rich-metatheory $S$ forces the stratum $\mathcal{L}_{\mathrm{Abs}}$ — objects simultaneously formally definable $(F_S)$, non-reducible $(\Pi_{4, S, n})$, and maximally generative $(\Pi_{3\text{-max}, S, n})$ — to be empty. Equivalently: $\mathfrak{M}$ has no maximal point.

The result is uniform across all Rich-metatheories $S$, all categorical levels $n \in \mathbb{N} \cup \{\infty\}$, all meta-theoretic iterations, and all alternative categorical orderings — **five-axis absoluteness**.

AFN-T subsumes the classical series under one frame:

| Classical result | Specialization |
|---|---|
| Cantor 1891 — absolute infinity | $\mathcal{L}_{\mathrm{Abs}}$ restricted to cardinal-hierarchy maximality |
| Russell 1903 — universal class | $\mathcal{L}_{\mathrm{Abs}}$ at first-order $S = \mathrm{ZF}$ without restriction |
| Gödel 1931 — incompleteness | $\Pi_{4}$ via proof-theoretic non-reducibility |
| Tarski 1936 — undefinability of truth | $(F_S)$ blocked for the truth predicate |
| Lawvere 1969 — fixed-point diagonal | $\mathcal{L}_{\mathrm{Abs}}$ at $n = 1$ in any cartesian-closed $\mathcal{F}$ |
| Ernst 2015 — unlimited category theory | $\mathcal{L}_{\mathrm{Abs}}$ at $n = 1$ under Feferman's (R1)–(R3) |

## The four formal strata

```
𝓛_Fnd  ⊊  𝓛_Cls  ⊋  𝓛_Cls^⊤                  𝓛_Abs = ∅
 │          │          │                              │
(R1)–(R5) (M1)–(M5) (Max-1)–(Max-4)     (F_S) ∧ (Π_4) ∧ (Π_3-max)
```

| Stratum | Conditions | Representatives |
|---|---|---|
| $\mathcal{L}_{\mathrm{Fnd}}$ | (R1)–(R5) | $\mathsf{ZFC}$, $\mathsf{HoTT}$, $\mathsf{CIC}$, $\mathsf{MLTT}$, NCG, $\mathrm{Eff}$, $(\infty, 1)$-topos |
| $\mathcal{L}_{\mathrm{Cls}}$ | (M1)–(M5) | $\infty$-cosmoi, Univalent Foundations, cohesive framework |
| $\mathcal{L}_{\mathrm{Cls}}^{\top}$ | (Max-1)–(Max-4) | conjectural; categorical if non-empty |
| $\mathcal{L}_{\mathrm{Abs}}$ | $(F_S) \wedge (\Pi_{4, S, n}) \wedge (\Pi_{3\text{-max}, S, n})$ | empty by AFN-T |

Transitions: $\mathrm{Cls}$ (horizontal, classifying) lifts $\mathcal{L}_{\mathrm{Fnd}}$ to $\mathcal{L}_{\mathrm{Cls}}$; maximality sharpens $\mathcal{L}_{\mathrm{Cls}}$ to $\mathcal{L}_{\mathrm{Cls}}^{\top}$; $\mathrm{Gen}$ (vertical, generative) targets $\mathcal{L}_{\mathrm{Abs}}$, whose image is empty.

## Consequences for the foundational landscape

1. **The search for an absolute foundation is over — as a specific formal question.** The question *"is there a mathematical object that simultaneously admits a formal definition, irreducibility, and maximal generativity?"* now has a definitive negative answer, uniform across Rich-metatheories and categorical levels.

2. **Pluralism is genuine and measurable.** The coexistence of ZFC, HoTT, CIC, NCG, ∞-topos theory and cohesive foundations is not a temporary state to be resolved, but a structural feature of $\mathfrak{M}$. Each foundation occupies a coordinate position. Relations between them — interpretations, Morita equivalences, gauge transformations — are morphisms in $\mathfrak{M}$.

3. **Meta-frameworks have a taxonomy.** $\infty$-cosmoi, Univalent Foundations, and cohesive higher topos theory are not competing claims to the same role; they are distinct *partial* classifiers, each organizing a genuinely different sub-stack of $\mathfrak{M}$.

4. **The intensional / extensional divide is localized.** Differences between type theories that are invisible to extensional Morita equivalence (MLTT vs ETT, HoTT vs cubical HoTT) do not fragment the moduli space; they appear as fibre data over single points. The base $\mathfrak{M}$ remains intact under intensional refinement.

5. **Meta-classification does not escalate.** Iterating the meta-classification operation produces a tower that stabilizes at the theory level while ascending cleanly through the Grothendieck-universe hierarchy. No proliferation of genuinely new meta-meta-strata is possible; size grows but theory does not.

6. **Three classical bypass paths are closed.** Universe polymorphism, reflective towers bounded by one inaccessible cardinal, and intensional refinement through extensional collapse — each historically proposed as a way around structural no-go results — are formally shown to remain within the classification and not to escape it.

7. **The no-go tradition is unified.** Cantor, Russell, Gödel, Tarski, Lawvere, and Ernst become readings of one structural law at different maximality aspects. The isolated impression their results left behind in the twentieth century becomes, here, a single pattern.

## Machine verification — the Verum corpus

MSFS is not only a paper.  Every theorem, lemma, and corollary has a companion machine-checked formal proof in the **Verum MSFS Corpus** at [`verum-corpus/`](./verum-corpus/).  The corpus is **self-contained modulo ZFC + 2 strongly inaccessible cardinals** and ships its own README + tutorial with the verification pipeline, audit catalogue, paper-to-corpus map, and reproducibility instructions.

The trusted boundary is exactly:

- ZFC,
- two strongly inaccessible cardinals $\kappa_1 < \kappa_2$,
- the Verum trusted kernel (`crates/verum_kernel/`).

Nothing else is admitted.  The boundary is enforced by the kernel-side invariant `verum_kernel::mechanisation_roadmap::msfs_self_contained()` and by the corpus-side Verum-language theorem `msfs_self_containment_theorem`; both are re-checked on every build.

Run `verum audit --bundle` inside `verum-corpus/` for the one-command L4-readiness verdict.

## Setting: technical preliminaries

The work takes place inside $\mathrm{ZFC}$ augmented by two inaccessible cardinals $\kappa_1 < \kappa_2$, providing Grothendieck universes $\mathbf{U}_1 \subset \mathbf{U}_2$ sufficient for the $2$-categorical machinery. Categorical framework follows Kelly 1982 ($2$-categories), Lurie HTT 2009 and HA 2017 ($(\infty, 1)$-categories and higher algebra), Riehl–Verity 2022 ($\infty$-cosmoi), Adámek–Rosický 1994 (accessible functors). Bibliography is embedded in the source; no BibTeX pass is required.

No foundation is privileged. The argument is stated inside $\mathrm{ZFC} + 2\text{-inacc}$ as a concrete choice, but the claims are transferable to any Rich-metatheory satisfying (R1)–(R5). No empirical commitments are made.

## Repository layout

```
math-msfs/
├── paper-en/
│   ├── paper.tex           LaTeX source (English)
│   └── paper-mini.tex      Minimal variant for fast iteration
├── paper-ru/               Russian 1-to-1 translation (in progress)
├── scripts/
│   └── build-paper.ts      Build / arXiv / Zenodo packaging (Bun)
├── .gitignore
├── LICENSE                 CC BY 4.0 (paper) + MIT (scripts)
└── README.md
```

## Build

Requires TeX Live 2023+ (`pdflatex`) and [Bun](https://bun.sh) for the build script.

```bash
# Compile PDF → paper-en/msfs-paper.pdf
bun scripts/build-paper.ts

# Package arXiv tarball → paper-en/afn-t-arxiv.tar.gz
bun scripts/build-paper.ts --arxiv

# Package Zenodo deposit → paper-en/zenodo/
bun scripts/build-paper.ts --zenodo

bun scripts/build-paper.ts --help
```

Three `pdflatex` passes for cross-references and TOC finalization; inline bibliography (`\begin{thebibliography}`); no BibTeX run.

Direct compilation without Bun:

```bash
cd paper-en
pdflatex paper.tex
pdflatex paper.tex
pdflatex paper.tex
```

## Relationship to Diakrisis

MSFS is the self-contained formal core of the **Diakrisis** meta-structural mathematical programme. MSFS uses only standard categorical notation ($\mathcal{F}$, $\rho$, $\mathfrak{M}$, $(\infty, n)$-Cat) and makes no reference to Diakrisis-specific primitives ($\langle\!\langle \cdot \rangle\!\rangle$, $\mathsf{M}$, $\alpha_\mathrm{math}$, $\sqsubset_\bullet$) or applied assemblies. Correspondence between Diakrisis theorem numbers and MSFS labels:

| Diakrisis | MSFS |
|---|---|
| AFN-T (combined) | Theorem `thm:afnt` (§5–§6) |
| Five-axis absoluteness | Theorem `thm:five-axis` (§7) |
| Intensional refinement closure | Theorems `thm:I-existence`, `thm:slice-locality` (§8) |
| Meta-classification | Theorems `thm:meta-cat`, `thm:meta-mult`, `thm:meta-stab` (§9) |

## Citation

```
Sereda, M. (2026). The Moduli Space of Formal Systems: Classification,
Stabilization, and a No-Go Theorem for Absolute Foundations.
```

BibTeX:

```bibtex
@misc{sereda2026msfs,
  author = {Sereda, Max},
  title  = {The Moduli Space of Formal Systems: Classification,
            Stabilization, and a No-Go Theorem for Absolute Foundations},
  year   = {2026}
}
```

## Licence

- **Paper content** (`paper-en/`, `paper-ru/`): Creative Commons Attribution 4.0 International (CC BY 4.0). See [`LICENSE`](./LICENSE).
- **Build scripts** (`scripts/`): MIT License. See [`LICENSE`](./LICENSE) §B.

CC BY 4.0 is the standard arXiv/Zenodo-compatible licence for open-access mathematical work. Both licences permit redistribution and modification with attribution.
