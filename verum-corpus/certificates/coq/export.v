(* Exported by `verum export --to coq`. MSFS-only after corpus split. *)
(* theorem proofs lowered via CoqProofReplay
when SmtCertificates are loaded; otherwise admitted scaffold. *)

(* note: framework lineage `msfs` has no Coq-library mapping yet; emitted as opaque axiom. *)

(* ==== framework: msfs ==== *)
(* theorem — msfs — MSFS Theorem 7.1 — horizontal axis: AFN-T uniform over R-S :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Theorem msfs_theorem_7_1_horizontal : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* theorem — msfs — MSFS Theorem 7.2 — vertical axis: AFN-T uniform over n ∈ ℕ ∪ {∞} :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Theorem msfs_theorem_7_2_vertical : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* theorem — msfs — MSFS Theorem 7.3 — meta-vertical axis: meta-iterations stabilise via Theorem A.7 :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Theorem msfs_theorem_7_3_meta_vertical : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* theorem — msfs — MSFS Theorem 7.4 — lateral axis: alt orderings reduce to (∞, n) :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Theorem msfs_theorem_7_4_lateral : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Definition 7.5 — Lawvere-scope LS :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Axiom msfs_definition_7_5_lawvere_scope : Prop.

(* theorem — msfs — MSFS Theorem 7.6 — completeness axis (within Lawvere-scope) :: theorems/msfs/07_five_axis/theorems_7_1_to_7_6.vr *)
Theorem msfs_theorem_7_6_completeness : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Theorem 5.1 — AFN-T α-part: ¬∃ X. (F_S) ∧ (Π_4) ∧ (Π_3-max) :: theorems/msfs/05_afnt_alpha/theorem_5_1.vr *)
Axiom msfs_theorem_5_1_afnt_alpha : Prop.

(* theorem — msfs — MSFS Corollary 5.2 — L_Abs == ∅ (AFN-T α-part headline) :: theorems/msfs/05_afnt_alpha/theorem_5_1.vr *)
Theorem msfs_corollary_5_2_l_abs_empty : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Theorem 5.1 — proof template (Lemma 3.4 + id_X equivalence onto image) :: theorems/msfs/05_afnt_alpha/theorem_5_1.vr *)
Axiom msfs_theorem_5_1_proof_template : Prop.

(* axiom — msfs — MSFS Theorem 6.1 — AFN-T β-part: transfinite-limit colimit lies in S_S^global, hence ¬Π_4 :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Axiom msfs_theorem_6_1_afnt_beta : Prop.

(* axiom — msfs — MSFS Theorem 6.1 (operational) — colim ∈ S_S^global :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Axiom msfs_theorem_6_1_colim_in_s_s_global : Prop.

(* axiom — msfs — MSFS Proposition 6.2 — proper-class towers dichotomy (both branches close to ¬L_Abs) :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Axiom msfs_proposition_6_2_proper_class_dichotomy : Prop.

(* axiom — msfs — MSFS Proposition 6.3 — trajectory space lives in S_S^global :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Axiom msfs_proposition_6_3_trajectory_space : Prop.

(* axiom — msfs — MSFS Proposition 6.3 (corollary) — trajectory-tower colimits in S_S^global :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Axiom msfs_proposition_6_3_corollary : Prop.

(* theorem — msfs — MSFS Theorem 6.1 (operational closure) — no L_Abs via transfinite tower :: theorems/msfs/06_afnt_beta/theorem_6_1.vr *)
Theorem msfs_theorem_6_1_operational_closure : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* theorem — msfs — MSFS Theorem 8.1 — universe-polymorphism Morita-reduces to S_S^global :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Theorem msfs_theorem_8_1_universe_polymorphism : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* theorem — msfs — MSFS Theorem 8.2 — reflective tower bounded by Con(S) + κ_inacc :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Theorem msfs_theorem_8_2_reflective_tower : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Definition 8.3 — display class :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Axiom msfs_definition_8_3_display_class : Prop.

(* axiom — msfs — MSFS Definition 8.4 — display 2-category :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Axiom msfs_definition_8_4_display_2_category : Prop.

(* axiom — msfs — MSFS Definition 8.5 — S_int :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Axiom msfs_definition_8_5_s_int : Prop.

(* axiom — msfs — MSFS Theorem 8.6 — existence of intensional-refinement functor I : F^op → S_int :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Axiom msfs_theorem_8_6_I_existence : Prop.

(* axiom — msfs — MSFS Theorem 8.7 — slice-locality of I via gauge-quotient :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Axiom msfs_theorem_8_7_slice_locality : Prop.

(* theorem — msfs — MSFS Corollary 8.8 — intensional refinement adds no new axis to AFN-T :: theorems/msfs/08_bypass_paths/theorems_8_1_to_8_8.vr *)
Theorem msfs_corollary_8_8_intensional_no_new_axis : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Stage M.4 — L_Abs Conditions (§4) anchor :: theorems/msfs/04_l_abs_conditions/definitions_4_1_to_4_4.vr *)
Axiom msfs_stage_m_4_anchor : Prop.

(* axiom — msfs — MSFS Definition 10.1 — 2-category cE + α ⊣ ε adjoint pair :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_definition_10_1_E_category : Prop.

(* axiom — msfs — MSFS Definition 10.2 — class cS_S^cE :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_definition_10_2_S_S_E : Prop.

(* axiom — msfs — MSFS Lemma 10.3 — enactment syntax–semantics (componentwise via Kan ext + AR adjoint) :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_lemma_10_3_enactment_syntax_semantics : Prop.

(* axiom — msfs — MSFS Theorem 10.4 — AC/OC Morita Duality (FLAGSHIP) :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_theorem_10_4_ac_oc_morita_duality : Prop.

(* axiom — msfs — MSFS Corollary 10.5 — Con(F ∪ E) = Con(F) = Con(ZFC + 2-inacc) :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_corollary_10_5_conservativity : Prop.

(* axiom — msfs — MSFS Theorem 10.7 — Dual Boundary Lemma (Diakrisis 109.T) :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_theorem_10_7_dual_boundary_lemma : Prop.

(* axiom — msfs — MSFS Corollary 10.8 — L_Abs^cE = ∅ :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_corollary_10_8_l_abs_E_empty : Prop.

(* axiom — msfs — MSFS Theorem 10.9 — Dual five-axis absoluteness :: theorems/msfs/10_ac_oc_duality/theorems_10_1_to_10_9.vr *)
Axiom msfs_theorem_10_9_dual_five_axis : Prop.

(* axiom — msfs — MSFS §12 — Univalent Foundations diagnostic: passes (F_S, Π_4 cond.); fails (Π_3-max) :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_consequence_univalent_foundations : Prop.

(* axiom — msfs — MSFS §12 — Higher Topos Theory diagnostic :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_consequence_higher_topos : Prop.

(* axiom — msfs — MSFS §12 — Cohesive ∞-Topos diagnostic :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_consequence_cohesive : Prop.

(* axiom — msfs — MSFS §12 — ∞-Cosmoi diagnostic :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_consequence_infinity_cosmoi : Prop.

(* axiom — msfs — MSFS Q1 — closed in Diakrisis 103.T-106.T :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_open_question_Q1_closed_in_diakrisis : Prop.

(* axiom — msfs — MSFS Q2 — completeness of meta-framework list — OPEN :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_open_question_Q2_open : Prop.

(* axiom — msfs — MSFS Q3 — closed in Diakrisis 133.T :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_open_question_Q3_closed_in_diakrisis : Prop.

(* axiom — msfs — MSFS Q4 — closed in Diakrisis 134.T :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_open_question_Q4_closed_in_diakrisis : Prop.

(* axiom — msfs — MSFS Q5 — closed in Diakrisis 137.T :: theorems/msfs/12_consequences/diagnostics_and_open_q.vr *)
Axiom msfs_open_question_Q5_closed_in_diakrisis : Prop.

(* axiom — msfs — MSFS Definition B.1 — Paraconsistent R-S with extractable classical kernel :: theorems/msfs/appendix_b/theorem_B_2.vr *)
Axiom msfs_definition_B_1_paraconsistent_rich_s : Prop.

(* axiom — msfs — MSFS Theorem B.2 — Paraconsistent AFN-T (transfer via classical kernel) :: theorems/msfs/appendix_b/theorem_B_2.vr *)
Axiom msfs_theorem_B_2_paraconsistent_afnt : Prop.

(* theorem — msfs — MSFS Theorem 11.1 — subsumption of 7 classical no-go results under AFN-T α :: theorems/msfs/11_no_go_series/theorem_11_1.vr *)
Theorem msfs_theorem_11_1_subsumption : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Theorem 11.1 — subsumption anchor (catalogue alias) :: theorems/msfs/11_no_go_series/theorem_11_1.vr *)
Axiom msfs_theorem_11_1_subsumption_anchor : Prop.

(* axiom — msfs — MSFS Stage M.1 — Conventions and Notation (§1) anchor :: theorems/msfs/01_introduction/conventions.vr *)
Axiom msfs_stage_m_1_anchor : Prop.

(* axiom — msfs — MSFS Definition 9.1 — Meta_Cls (M1)–(M5) :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_definition_9_1_meta_cls : Prop.

(* axiom — msfs — MSFS Definition 9.2 — Meta_Cls^⊤ (Max-1)..(Max-4) :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_definition_9_2_meta_cls_top : Prop.

(* axiom — msfs — MSFS Theorem 9.3 — Meta-Categoricity (canonical (∞,∞)-equivalence) :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_theorem_9_3_meta_categoricity : Prop.

(* axiom — msfs — MSFS Theorem 9.4 — ≥3 pairwise non-2-equivalent meta-structures :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_theorem_9_4_structural_multiplicity : Prop.

(* axiom — msfs — MSFS Corollary 9.5 — L_Cls is structurally plural :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_corollary_9_5_plurality : Prop.

(* axiom — msfs — MSFS Theorem 9.6 (a)+(b) — Meta-classification stabilization (theory idempotent, set-theoretic ascends) :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Axiom msfs_theorem_9_6_meta_classification_stabilization : Prop.

(* theorem — msfs — MSFS Theorem 9.6 (c) — No L_Abs escalation via meta-iteration (reduces to Theorem 5.1) :: theorems/msfs/09_meta_classification/theorems_9_3_9_4_9_6.vr *)
Theorem msfs_theorem_9_6c_no_l_abs_escalation : Prop.
Proof. apply msfs_theorem_5_1_afnt_alpha(candidate). Qed.

(* axiom — msfs — MSFS Stage M.3 — Reasonable Rich-Metatheories + Lemma 3.4 (§3) anchor :: theorems/msfs/03_rich_s/lemma_3_4_anchor.vr *)
Axiom msfs_stage_m_3_anchor : Prop.

(* axiom — msfs — MSFS Lemma A.1 — Kelly 1982 §1-§2 (2-categorical infrastructure) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_1_kelly_2_categorical : Prop.

(* axiom — msfs — MSFS Lemma A.2 — Lurie HTT 2009 (∞-categorical infrastructure) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_2_lurie_htt : Prop.

(* axiom — msfs — MSFS Lemma A.3 — Riehl–Verity 2022 (synthetic (∞,1)-category theory) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_3_riehl_verity : Prop.

(* axiom — msfs — MSFS Lemma A.4 — Pronk 1996 Theorem 21 (bicategory of fractions) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_4_pronk_bicat_fractions : Prop.

(* axiom — msfs — MSFS Lemma A.5 — Lawvere 1969 (fixed-point theorem, 2-categorical) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_5_lawvere_fp : Prop.

(* axiom — msfs — MSFS Lemma A.6 — Whitehead-type criterion for (∞,∞)-equivalences :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_6_whitehead : Prop.

(* axiom — msfs — MSFS Theorem A.7 — Bergner–Lurie (∞,∞)-stabilization (CRITICAL forward ref) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_theorem_A_7_bergner_lurie_stabilization : Prop.

(* axiom — msfs — MSFS Lemma A.8 — Adámek–Rosický 1994 (accessible-categories infrastructure) :: theorems/msfs/appendix_a/categorical_preliminaries.vr *)
Axiom msfs_lemma_A_8_adamek_rosicky : Prop.

(* axiom — msfs — MSFS Stage M.2 — Stratified Hierarchy (§2) anchor :: theorems/msfs/02_strata/proposition_2_2_2_3.vr *)
Axiom msfs_stage_m_2_anchor : Prop.

(* axiom — msfs — Diakrisis 16.T10 grounds Verum K-Round-Trip (round-trip canonicalization) :: theorems/diakrisis/03_formal_architecture/foundational_10_to_50.vr *)
Axiom diakrisis_16_T10_kernel_K_round_trip_ground : Prop.

(* axiom — msfs — Diakrisis 50.T grounds MSFS Theorem 8.6 step I-3 (Eff τ-invariant) :: theorems/diakrisis/03_formal_architecture/foundational_10_to_50.vr *)
Axiom diakrisis_50_T_msfs_8_6_i_3_ground : Prop.

(* axiom — msfs — Diakrisis 108.T = MSFS Theorem 10.4 (AC/OC Morita Duality) :: theorems/diakrisis/12_actic/actica_107_to_127.vr *)
Axiom diakrisis_108_T_msfs_10_4_correspondence : Prop.

(* axiom — msfs — Diakrisis 109.T = MSFS Theorem 10.7 (Dual Boundary Lemma) :: theorems/diakrisis/12_actic/actica_107_to_127.vr *)
Axiom diakrisis_109_T_msfs_10_7_correspondence : Prop.

(* axiom — msfs — Diakrisis 124.T = MSFS Theorem 10.4 step-c (biadjunction lift to (∞,∞)) :: theorems/diakrisis/12_actic/actica_107_to_127.vr *)
Axiom diakrisis_124_T_msfs_10_4_step_c_correspondence : Prop.

(* axiom — msfs — Diakrisis 55.T = MSFS Theorem 7.1 (horizontal axis) :: theorems/diakrisis/06_limits/five_axis_internal.vr *)
Axiom diakrisis_55_T_msfs_7_1_correspondence : Prop.

(* axiom — msfs — Diakrisis 59.T.1 = MSFS Theorem 7.2 (vertical axis) :: theorems/diakrisis/06_limits/five_axis_internal.vr *)
Axiom diakrisis_59_T_1_msfs_7_2_correspondence : Prop.

(* axiom — msfs — Diakrisis 69.T = MSFS Theorem 7.3 (meta-vertical axis) :: theorems/diakrisis/06_limits/five_axis_internal.vr *)
Axiom diakrisis_69_T_msfs_7_3_correspondence : Prop.

(* axiom — msfs — Diakrisis 84.T = MSFS Theorem 7.4 (lateral axis) :: theorems/diakrisis/06_limits/five_axis_internal.vr *)
Axiom diakrisis_84_T_msfs_7_4_correspondence : Prop.

(* axiom — msfs — Diakrisis 87.T = MSFS Theorem 7.6 (completeness axis) :: theorems/diakrisis/06_limits/five_axis_internal.vr *)
Axiom diakrisis_87_T_msfs_7_6_correspondence : Prop.

(* axiom — msfs — Diakrisis 98.T = MSFS Theorem 8.1 (universe polymorphism) :: theorems/diakrisis/06_limits/three_bypass_paths.vr *)
Axiom diakrisis_98_T_msfs_8_1_correspondence : Prop.

(* axiom — msfs — Diakrisis 99.T = MSFS Theorem 8.2 (reflective tower) :: theorems/diakrisis/06_limits/three_bypass_paths.vr *)
Axiom diakrisis_99_T_msfs_8_2_correspondence : Prop.

(* axiom — msfs — Diakrisis 100.T = MSFS Theorem 8.6 (I-existence) :: theorems/diakrisis/06_limits/three_bypass_paths.vr *)
Axiom diakrisis_100_T_msfs_8_6_correspondence : Prop.

(* axiom — msfs — Diakrisis 101.T = MSFS Theorem 8.7 (slice-locality) :: theorems/diakrisis/06_limits/three_bypass_paths.vr *)
Axiom diakrisis_101_T_msfs_8_7_correspondence : Prop.

(* axiom — msfs — Diakrisis 102.T = MSFS Corollary 8.8 (intensional refinement) :: theorems/diakrisis/06_limits/three_bypass_paths.vr *)
Axiom diakrisis_102_T_msfs_8_8_correspondence : Prop.

(* axiom — msfs — Diakrisis 136.T grounds Verum K-Refine-omega (VVA-7 ordinal-valued depth) :: theorems/diakrisis/research_extensions/research_136_137_142.vr *)
Axiom diakrisis_136_T_kernel_K_refine_omega_ground : Prop.

(* axiom — msfs — Diakrisis 137.T closes MSFS Q5 + grounds VVA-8 (complexity-typed strategy) :: theorems/diakrisis/research_extensions/research_136_137_142.vr *)
Axiom diakrisis_137_T_msfs_q5_kernel_vva_8_ground : Prop.

(* axiom — msfs — Diakrisis 142.T = MSFS Theorem B.2 (paraconsistent AFN-T transfer) :: theorems/diakrisis/research_extensions/research_136_137_142.vr *)
Axiom diakrisis_142_T_msfs_b_2_correspondence : Prop.

(* axiom — msfs — Diakrisis 18.T1 grounds @verify(coherent) — Axi-9 biadjunction premise :: theorems/diakrisis/research_extensions/operational_coherence.vr *)
Axiom diakrisis_18_T1_verum_coherent_ground : Prop.

(* axiom — msfs — Diakrisis 18.T3 closes audit-reports/coherent.json acceptance gate :: theorems/diakrisis/research_extensions/operational_coherence.vr *)
Axiom diakrisis_18_T3_audit_coherent_gate : Prop.

(* axiom — msfs — UHM = explicit Diakrisis-side witness for L_Cls^⊤ ≠ ∅ (paired with Diakrisis 106.T) :: theorems/diakrisis/research_extensions/uhm_articulation.vr *)
Axiom diakrisis_uhm_msfs_l_cls_top_witness : Prop.

(* axiom — msfs — Diakrisis 103.T closes MSFS Q1 — existence of maximal meta-framework :: theorems/diakrisis/06_limits_maximality/maximality_103_to_106.vr *)
Axiom diakrisis_103_T_msfs_q1_closure : Prop.

(* axiom — msfs — Diakrisis 104.T = MSFS Theorem 9.3 (Meta-Categoricity) :: theorems/diakrisis/06_limits_maximality/maximality_103_to_106.vr *)
Axiom diakrisis_104_T_msfs_9_3_correspondence : Prop.

(* axiom — msfs — Diakrisis 105.T grounds Verum K-Refine (Yanofsky paradox-immunity) :: theorems/diakrisis/06_limits_maximality/maximality_103_to_106.vr *)
Axiom diakrisis_105_T_kernel_K_refine_ground : Prop.

(* axiom — msfs — Diakrisis 106.T proves L_Cls^⊤ ≠ ∅ via Diakrisis itself :: theorems/diakrisis/06_limits_maximality/maximality_103_to_106.vr *)
Axiom diakrisis_106_T_l_cls_top_nonempty : Prop.

(* axiom — msfs — Diakrisis 131.T grounds Verum K-Universe-Ascent (Drake-reflection retract) :: theorems/diakrisis/06_limits_maximality/open_q_closures.vr *)
Axiom diakrisis_131_T_kernel_K_universe_ascent_ground : Prop.

(* axiom — msfs — Diakrisis 133.T closes MSFS Q3 (bypass-path exhaustiveness) :: theorems/diakrisis/06_limits_maximality/open_q_closures.vr *)
Axiom diakrisis_133_T_msfs_q3_closure : Prop.

(* axiom — msfs — Diakrisis 134.T closes MSFS Q4 (consistency-strength minimality) :: theorems/diakrisis/06_limits_maximality/open_q_closures.vr *)
Axiom diakrisis_134_T_msfs_q4_closure : Prop.

(* axiom — msfs — Diakrisis 135.T closes MSFS Q5 (sub-stack of weak R-S) :: theorems/diakrisis/06_limits_maximality/open_q_closures.vr *)
Axiom diakrisis_135_T_msfs_q5_closure : Prop.

