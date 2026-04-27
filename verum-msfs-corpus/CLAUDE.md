# CLAUDE.md — verum-msfs-corpus discipline

Project-local instructions. **Override the parent `CLAUDE.md` only on the points listed here**; everything else is inherited from `verum/CLAUDE.md` (Verum-language conventions, semantic types, build order, EBNF authority, etc.).

## Scope

This directory is the **machine-verification corpus** for the MSFS preprint (Sereda 2026, 41 pages, 27 structural theorems) and the Diakrisis 142-theorem corpus. It is **not** library code; it is **proof content**. Every change must be attributable to a specific paper section or theorem label.

## Single-source policy

- **MSFS source of truth**: `internal/holon/internal/math-msfs/paper-en/paper.tex`. Never reformulate a definition or theorem statement here in a way that is not a 1-to-1 transcription of that source. If the paper is wrong, fix the paper, not the formalization.
- **Diakrisis source of truth**: `internal/holon/internal/diakrisis/docs/`. Same rule.
- **Verum architecture source of truth**: `docs/architecture/verum-verification-architecture.md` (VVA). When the corpus needs a kernel rule that VVA doesn't yet specify, write a VVA RFC first, do not invent rules locally.

## File / theorem naming convention

- Files mirror MSFS section structure: `theorems/msfs/05_afnt_alpha/theorem_5_1.vr` corresponds to MSFS §5 Theorem 5.1.
- Theorem identifiers in `.vr` follow `<paper_label>` from the LaTeX source: `theorem_5_1_afnt_alpha`, `lemma_3_4_S_definability`, `proposition_2_2_*`.
- Every `@theorem` or `@axiom` carries a `@framework(name, "MSFS Theorem X.Y" | "Diakrisis N.T" | "Sereda 2026 §X.Y")` citation. Citations without a section anchor are rejected by the framework-conflict checker.

## Verification gates

A theorem may be flagged ✅ in `README.md` only when **all five** gates pass:

1. `verum check` returns clean — no `KernelError`, no unresolved `@axiom`-placeholders in its dependency closure.
2. The strictest `@verify(...)` strategy declared on the theorem passes — typically `certified` for AFN-T flagship results, `formal` for definability lemmata.
3. `verum audit --coord` records a `(Fw, ν, τ)` triple for the theorem; the supremum over the corpus must satisfy `ν ≤ ω` for MSFS-only, `ν ≤ ω·3 + 1` for UHM extensions.
4. `verum export --format <fmt>` succeeds for all five formats and the round-trip recheck passes.
5. If the theorem cites 108.T (AC/OC duality), `verum audit --round-trip` shows `Decidable | Pass`.

A theorem that fails any gate is **never** flagged ✅. Use 🟡 (in-progress) or ❌ (blocked) instead.

## Forbidden patterns

- **No proof-by-`@axiom`** for theorems that are claimed verified. An `@axiom` is acceptable for (a) a Convention or Definition (no proof obligation), or (b) a citation of an external authoritative work (Lurie HTT, Riehl-Verity, etc.) — and even then it must carry a `@framework(...)` lineage tag pointing to the source. Every other theorem must reduce to its dependencies.
- **No reformulating** a theorem to make it easier to prove. If MSFS Theorem X.Y is hard, the formalization is hard. The corpus exists to demonstrate Verum can express the actual paper — not a simplified version.
- **No silent UNKNOWN**: an SMT `unknown` verdict is a failure, not a pass. `@verify(formal)` must be replaced with `@verify(proof)` and a tactic body, never softened to `@verify(static)` to skip the check.
- **No mixing of UIP and Univalence frameworks** in the same theorem closure (the framework-conflict checker `#197` rejects it). Pick one regime per file; if a theorem genuinely requires both, document the obstruction and consult VVA §6.4 banned-patterns.
- **No turbofish syntax** (`foo::<T>(args)`); use `foo<T>(args)` (Verum has no turbofish; expr.rs:2929 rejects with diagnostic).
- **No Rust syntax** in `.vr` files. `Vec` → `List`, `String` → `Text`, `struct` → `type ... is { ... }`, `enum` → `type ... is X | Y`, `impl Trait` → `implement Trait for T`. See parent `CLAUDE.md` for the full table.

## Demonstrating Verum

The corpus is also a **public demo** of Verum's capabilities. Therefore:

- Prefer the most expressive Verum feature that fits the paper's structure. If MSFS uses the term *"(∞,∞)-equivalence onto image"*, encode it as a refinement type or a dependent record, not as a postulate.
- If a Verum capability is **missing** for a theorem you are formalizing, **stop** and file a task at the language level. Do not paper over the gap with `@axiom`.
- Every kernel rule the corpus exercises must be cited in the relevant `.vr` file: `// uses K-Refine-omega (VVA §4.4 / depth.rs:m_depth_omega)`.

## Workflow per theorem

1. Read the paper section, copy the statement verbatim into a `// Source: MSFS Theorem X.Y, paper.tex line NNN` comment.
2. Identify the dependency closure: which lemmata / definitions / framework axioms the proof cites. List them as `mount` lines at the top of the `.vr` file.
3. Translate the statement into a `theorem name(...) ensures ... { proof { ... } }` block; pick the strictest `@verify(...)` that the paper proof structure supports.
4. Run `verum check` on the file alone — must compile.
5. Run `verum check theorems/` to ensure no downstream theorem broke.
6. Update the per-theorem row in `README.md` from ⚪ → 🟡 → ✅.

## Status updates

After each theorem moves status:

- Update the relevant row in `README.md`'s per-stage status table.
- If a downstream theorem's blocker just resolved, move it from ❌ to ⚪.
- Run the full audit suite (`coord / epsilon / round-trip / coherent / framework-axioms`) and commit the resulting `audit-reports/*.json` if any of them changed shape.

## Tests

- Smoke tests (`tests/smoke/`) — per-stage, fast: each new theorem file gets a one-line test "the file compiles".
- Integration tests (`tests/integration/`) — cross-theorem: e.g., "Theorem 5.1 with Lemma 3.4 substituted as a dummy fails the proof".
- Regression tests (`tests/regression/`) — pin behavior we don't want to break, e.g., the framework-conflict checker rejects mixing UIP + univalence.

## When in doubt

Ask. The cost of slowing down to consult VVA / the paper is much lower than the cost of formalizing a wrong statement and having every downstream theorem inherit the error.
