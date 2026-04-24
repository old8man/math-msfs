# MSFS — The Moduli Space of Formal Systems

**Preprint**: *The Moduli Space of Formal Systems: Classification, Stabilization, and a No-Go Theorem for Absolute Foundations*.

**Author**: Max Sereda (independent researcher, `max@gst.st`).

**Status**: post-audit14. 44 pages, 54 theorem-like environments, 47 bibliography entries. LaTeX build clean (0 warnings, 0 errors, 0 overfull/underfull boxes).

## Summary

MSFS studies the $(\infty, n)$-categorical moduli space $\mathfrak{M}$ of formal systems — the classifying $2$-stack of Morita-equivalence classes of Rich-foundations satisfying (R1)–(R5). Four structural results and one boundary corollary:

1. **Plurality at $\mathcal{L}_{\mathrm{Cls}}$.** The $\infty$-cosmoi (Riehl–Verity), Univalent Foundations (Voevodsky), and cohesive higher topoi (Schreiber) are pairwise non-$2$-equivalent partial meta-frameworks, each classifying a strict sub-stack of $\mathfrak{M}$.
2. **Conditional meta-categoricity.** Any two members of the maximal sub-class $\mathcal{L}_{\mathrm{Cls}}^{\top}$ over the same Rich-metatheory are $(\infty, \infty)$-equivalent via Grothendieck–Lurie straightening with joint-faithfulness of extensional and intensional classification functors.
3. **Intensional refinement.** A canonical minimal display 2-class functor $\mathbf{I}: \mathcal{F}^{\mathrm{op}} \to \mathcal{S}_{\mathrm{int}}$ has slice-locality over $\mathfrak{M}$: intensional differences (MLTT vs ETT) lie in the fibre over a single point of $\mathfrak{M}$, separated via Hyland's effective topos $\mathrm{Eff}$.
4. **Theory-level meta-stabilization with universe-ascent.** Iterated meta-classification realizes the same $(\infty, \infty)$-theory at each step (Barwick–Schommer-Pries unicity), but set-theoretic instantiation ascends the Grothendieck hierarchy $\kappa_1 < \kappa_2 < \cdots$.

**Boundary corollary (AFN-T).** The syntax–semantics adjunction forces $\mathfrak{M}$ to have no maximal point: the stratum $\mathcal{L}_{\mathrm{Abs}}$ — objects simultaneously formally definable, non-reducible, and maximally generative — is empty. AFN-T subsumes the classical no-go series Cantor → Russell → Gödel → Tarski → Lawvere → Ernst uniformly across Rich-metatheories and all $(\infty, n)$, $n \in \mathbb{N} \cup \{\infty\}$.

## Hierarchy

MSFS formalizes **four strata** via mnemonic indices (post-audit14):

| Stratum | Conditions | Examples |
|---|---|---|
| $\mathcal{L}_{\mathrm{Fnd}}$ | (R1)–(R5) | $\mathsf{ZFC}$, $\mathsf{HoTT}$, $\mathsf{CIC}$, NCG, $(\infty, 1)$-topos |
| $\mathcal{L}_{\mathrm{Cls}}$ | (M1)–(M5) | $\infty$-cosmoi, Univalent Foundations, cohesive |
| $\mathcal{L}_{\mathrm{Cls}}^{\top}$ | (Max-1)–(Max-4) | conjectural; categorical if non-empty |
| $\mathcal{L}_{\mathrm{Abs}}$ | $(F_S) \wedge (\Pi_{4, S, n}) \wedge (\Pi_{3\text{-max}, S, n})$ | empty by AFN-T |

## Repository layout

```
math-msfs/
├── paper-en/
│   ├── paper.tex           Main preprint source (English)
│   ├── paper-mini.tex      Minimal variant for fast iteration
│   └── README.md           Short summary + build instructions
├── paper-ru/               Russian 1-to-1 translation (in progress)
├── scripts/
│   └── build-paper.ts      Build/arXiv/Zenodo packaging (Bun)
├── .gitignore
├── LICENSE                 CC BY 4.0 (paper) + MIT (build scripts)
└── README.md
```

## Build

Requires TeX Live 2023+ (`pdflatex`) and [Bun](https://bun.sh) (for the build script).

```bash
# Compile PDF → paper-en/afn-t-paper.pdf
bun scripts/build-paper.ts

# Package arXiv tarball → paper-en/afn-t-arxiv.tar.gz
bun scripts/build-paper.ts --arxiv

# Package Zenodo deposit → paper-en/zenodo/
bun scripts/build-paper.ts --zenodo

# Help
bun scripts/build-paper.ts --help
```

Bibliography is inline (`\begin{thebibliography}`); no BibTeX pass required. The script runs two `pdflatex` passes for cross-references and TOC.

Direct compilation without Bun:

```bash
cd paper-en
pdflatex paper.tex
pdflatex paper.tex
```

## Relationship to Diakrisis

MSFS is the self-contained peer-reviewable formal version of the structural core of the **Diakrisis** meta-mathematical programme. MSFS uses only standard categorical notation ($\mathcal{F}$, $\rho$, $\mathfrak{M}$, $(\infty, n)$-Cat) and makes no reference to Diakrisis-specific primitives ($\langle\!\langle \cdot \rangle\!\rangle$, $\mathsf{M}$, $\alpha_\mathrm{math}$, $\sqsubset_\bullet$).

Correspondence between Diakrisis theorem numbers and MSFS labels is maintained in Diakrisis documentation (internal). Key mappings:

| Diakrisis | MSFS |
|---|---|
| AFN-T (combined) | Theorem `thm:afnt` (§5–§6) |
| Five-axis absoluteness | Theorem `thm:five-axis` (§7) |
| Intensional refinement closure | Theorems `thm:I-existence`, `thm:slice-locality` (§8) |
| Meta-classification Level 5+ | Theorems `thm:meta-cat`, `thm:meta-mult`, `thm:meta-stab` (§9) |

## Citation

```
Sereda, M. (2026). The Moduli Space of Formal Systems: Classification,
Stabilization, and a No-Go Theorem for Absolute Foundations. Preprint.
```

BibTeX:
```bibtex
@misc{sereda2026msfs,
  author       = {Sereda, Max},
  title        = {The Moduli Space of Formal Systems: Classification,
                  Stabilization, and a No-Go Theorem for Absolute
                  Foundations},
  year         = {2026},
  howpublished = {Preprint}
}
```

## Licence

- **Paper content** (`paper-en/`, `paper-ru/`): Creative Commons Attribution 4.0 International (CC BY 4.0). See [`LICENSE`](./LICENSE).
- **Build scripts** (`scripts/`): MIT License. See [`LICENSE`](./LICENSE) §B.

Both licences permit redistribution and modification with attribution. CC BY 4.0 is the standard arXiv/Zenodo-compatible licence for open-access mathematical preprints.
