#!/usr/bin/env bun
/**
 * build-paper.ts — Сборка PDF препринта AFN-T и упаковка для серверов препринтов
 *
 * Использование:
 *   bun scripts/build-paper.ts             Собрать PDF → paper-en/afn-t-paper.pdf
 *   bun scripts/build-paper.ts --arxiv     Упаковать тарболл → paper-en/afn-t-arxiv.tar.gz
 *   bun scripts/build-paper.ts --zenodo    Собрать каталог → paper-en/zenodo/
 *   bun scripts/build-paper.ts --help      Показать справку
 *
 * Режим PDF запускает конвейер:
 *   pdflatex → pdflatex   (два прохода для TOC и перекрёстных ссылок).
 * Библиография у препринта встроена (\begin{thebibliography}), поэтому
 * BibTeX не нужен.
 *
 * Режим arXiv собирает минимальный архив исходников (paper.tex), пригодный
 * для AutoTeX. Поскольку библиография встроена, .bbl не требуется.
 *
 * Режим Zenodo собирает каталог paper-en/zenodo/ содержащий:
 *   - afn-t-paper.pdf              основной просматриваемый артефакт
 *   - afn-t-paper-source.tar.gz    исходники для воспроизводимости
 *   - zenodo-metadata.json         метаданные для формы / API Zenodo
 *   - README.md                    инструкции для рецензентов
 */

import { $ } from "bun";
import { existsSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const PAPER_DIR = path.join(ROOT, "paper-en");
const MAIN_TEX = "paper.tex";
const OUTPUT_NAME = "afn-t-paper";
const ARXIV_TARBALL = "afn-t-arxiv.tar.gz";
const ZENODO_DIR_NAME = "zenodo";

// -------- Разбор аргументов --------
const args = process.argv.slice(2);
const FLAG_ARXIV = args.includes("--arxiv");
const FLAG_ZENODO = args.includes("--zenodo");
const FLAG_HELP = args.includes("--help") || args.includes("-h");
const KNOWN = new Set(["--arxiv", "--zenodo", "--help", "-h"]);
const UNKNOWN = args.filter((a) => !KNOWN.has(a));

function showUsage(): void {
  console.log(
    `
Использование: bun scripts/build-paper.ts [параметры]

Параметры:
  (без параметров)  Собрать PDF препринта → paper-en/${OUTPUT_NAME}.pdf
  --arxiv           Упаковать arXiv-тарболл → paper-en/${ARXIV_TARBALL}
  --zenodo          Собрать Zenodo-каталог → paper-en/${ZENODO_DIR_NAME}/
  --help, -h        Показать справку

Серверы препринтов:
  arXiv   — минимальный архив LaTeX-исходников (AutoTeX перекомпилирует)
  Zenodo  — готовый PDF + архив исходников + метаданные (постоянный DOI)
`.trim(),
  );
}

// -------- Общие помощники --------
async function run(cmd: string, label: string): Promise<boolean> {
  console.log(`  ⏳ ${label}...`);
  const start = performance.now();
  const result = await $`cd ${PAPER_DIR} && ${cmd.split(" ")}`.quiet().nothrow();
  const elapsed = ((performance.now() - start) / 1000).toFixed(1);

  if (result.exitCode !== 0) {
    // pdflatex возвращает ненулевой код при warnings — останавливаемся только на фатальных
    const stderr = result.stderr.toString();
    const stdout = result.stdout.toString();
    const hasFatalError =
      stderr.includes("Fatal error") ||
      stdout.includes("No pages of output") ||
      stdout.includes("Emergency stop");
    if (hasFatalError) {
      console.error(`  ❌ ${label} — сбой (${elapsed}s)`);
      console.error(stderr.slice(0, 500));
      return false;
    }
  }

  console.log(`  ✅ ${label} (${elapsed}s)`);
  return true;
}

async function checkPrereqs(): Promise<void> {
  if (!existsSync(path.join(PAPER_DIR, MAIN_TEX))) {
    console.error(`❌ ${MAIN_TEX} не найден в ${PAPER_DIR}`);
    process.exit(1);
  }
  const which = await $`which pdflatex`.quiet().nothrow();
  if (which.exitCode !== 0) {
    console.error(
      "❌ pdflatex не найден. Установите TeX Live (например, `brew install --cask mactex`)",
    );
    process.exit(1);
  }
}

/**
 * Вытащить количество страниц из .log-файла pdflatex. Современный pdflatex
 * пакует Pages-объект в сжатый поток, поэтому скан .pdf на /Count <N> не
 * работает. .log файл всегда содержит строку вида
 *   "Output written on afn-t-paper.pdf (60 pages, 1154617 bytes)."
 * Вызывать ДО cleanup() — иначе .log уже удалён.
 */
async function countPagesFromLog(jobname: string): Promise<number> {
  const logPath = path.join(PAPER_DIR, `${jobname}.log`);
  if (!existsSync(logPath)) return 0;
  const text = await Bun.file(logPath).text();
  const match = text.match(/Output written on [^\s(]+\s*\((\d+) pages?/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Удалить промежуточные LaTeX-артефакты для обоих jobname-ов.
 * Не трогает .tex-источники, готовый PDF и упакованные выходы.
 */
async function cleanup(): Promise<number> {
  const jobnames = [OUTPUT_NAME, "paper"];
  const extensions = [
    "aux",
    "log",
    "out",
    "toc",
    "lof",
    "lot",
    "bbl",
    "blg",
    "bcf",
    "run.xml",
    "fls",
    "fdb_latexmk",
    "synctex.gz",
    "nav",
    "snm",
    "vrb",
  ];

  let cleaned = 0;
  for (const jobname of jobnames) {
    for (const ext of extensions) {
      const file = path.join(PAPER_DIR, `${jobname}.${ext}`);
      if (existsSync(file)) {
        await $`rm ${file}`.quiet().nothrow();
        cleaned++;
      }
    }
  }
  return cleaned;
}

// -------- Режим сборки PDF --------
async function buildPdf(): Promise<string> {
  console.log("\n📄 Сборка препринта AFN-T\n");
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${PAPER_DIR}/${OUTPUT_NAME}.pdf\n`);

  await checkPrereqs();

  const pdflatex = `pdflatex -interaction=nonstopmode -jobname=${OUTPUT_NAME} ${MAIN_TEX}`;

  // Три прохода: (1) .aux / .toc; (2) перекрёстные ссылки; (3) финализация
  // (устраняет "Label(s) may have changed. Rerun" после 2-го прохода).
  // Библиография встроена (thebibliography), BibTeX не нужен.
  if (!(await run(pdflatex, "Проход 1/3 (генерация .aux / .toc)"))) process.exit(1);
  if (!(await run(pdflatex, "Проход 2/3 (перекрёстные ссылки)"))) process.exit(1);
  if (!(await run(pdflatex, "Проход 3/3 (финализация cross-refs)"))) process.exit(1);

  const pdfPath = path.join(PAPER_DIR, `${OUTPUT_NAME}.pdf`);
  if (!existsSync(pdfPath)) {
    console.error("\n❌ PDF не сгенерирован");
    process.exit(1);
  }

  const size = await Bun.file(pdfPath).size;
  // Считать страницы ДО cleanup() — .log сейчас будет удалён.
  const pages = await countPagesFromLog(OUTPUT_NAME);

  console.log(`\n✅ Препринт собран`);
  console.log(`   📄 ${pdfPath}`);
  console.log(`   📐 ${pages} страниц, ${(size / 1024 / 1024).toFixed(1)} MB`);

  return pdfPath;
}

// -------- Режим arXiv --------
async function buildArxiv(): Promise<void> {
  console.log("\n📦 Упаковка arXiv-архива\n");
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${PAPER_DIR}/${ARXIV_TARBALL}\n`);

  await checkPrereqs();

  // Контрольный прогон с jobname по умолчанию (`paper`), чтобы убедиться
  // что исходник компилируется.
  const pdflatex = `pdflatex -interaction=nonstopmode ${MAIN_TEX}`;
  if (!(await run(pdflatex, "Контрольный проход 1/3"))) process.exit(1);
  if (!(await run(pdflatex, "Контрольный проход 2/3"))) process.exit(1);
  if (!(await run(pdflatex, "Контрольный проход 3/3"))) process.exit(1);

  const files = [MAIN_TEX];

  for (const f of files) {
    if (!existsSync(path.join(PAPER_DIR, f))) {
      console.error(`❌ Отсутствует файл: ${f}`);
      process.exit(1);
    }
  }

  const tarballPath = path.join(PAPER_DIR, ARXIV_TARBALL);
  if (existsSync(tarballPath)) {
    await $`rm ${tarballPath}`.quiet();
  }

  console.log(`  ⏳ Создание тарболла (${files.length} файлов)...`);
  const tarResult =
    await $`cd ${PAPER_DIR} && tar -czf ${ARXIV_TARBALL} ${files}`
      .quiet()
      .nothrow();

  if (tarResult.exitCode !== 0) {
    console.error("❌ tar не удался");
    console.error(tarResult.stderr.toString());
    process.exit(1);
  }

  const tarSize = await Bun.file(tarballPath).size;
  console.log(
    `  ✅ Создан ${ARXIV_TARBALL} (${(tarSize / 1024).toFixed(0)} KB)`,
  );

  const cleaned = await cleanup();
  const mainPdf = path.join(PAPER_DIR, "paper.pdf");
  if (existsSync(mainPdf)) await $`rm ${mainPdf}`.quiet().nothrow();
  if (cleaned > 0) console.log(`   🧹 Очищено ${cleaned} промежуточных файлов`);

  console.log(`\n✅ arXiv-пакет готов`);
  console.log(`   📦 ${tarballPath}`);
  console.log(`   📄 ${files.length} файлов, ${(tarSize / 1024).toFixed(0)} KB`);
  console.log(`\n📋 Чек-лист подачи на arXiv:`);
  console.log(`   1. Загрузить ${ARXIV_TARBALL} на https://arxiv.org/submit`);
  console.log(`   2. Основная категория: math.LO (Logic)`);
  console.log(`   3. Кросс-листинг: math.CT (Category Theory), math.AG (опц.)`);
  console.log(`   4. Лицензия: CC BY 4.0 рекомендуется`);
  console.log(`   5. Проверить arXiv-preview перед публикацией`);
}

// -------- Режим Zenodo --------
async function buildZenodo(): Promise<void> {
  console.log("\n📦 Сборка Zenodo-депозита\n");
  const zenodoDir = path.join(PAPER_DIR, ZENODO_DIR_NAME);
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${zenodoDir}/\n`);

  // Шаг 1: собрать PDF (тот же конвейер, что и в режиме PDF).
  const pdfPath = await buildPdf();

  // Шаг 2: подготовить архив исходников. Zenodo не перекомпилирует LaTeX,
  // поэтому хватит только paper.tex.
  const sourceFiles = [MAIN_TEX];

  for (const f of sourceFiles) {
    if (!existsSync(path.join(PAPER_DIR, f))) {
      console.error(`❌ Отсутствует файл: ${f}`);
      process.exit(1);
    }
  }

  // Шаг 3: подготовить zenodo/ (чистая пересборка).
  if (existsSync(zenodoDir)) {
    await $`rm -rf ${zenodoDir}`.quiet();
  }
  await $`mkdir -p ${zenodoDir}`.quiet();

  // Копировать готовый PDF
  const pdfDest = path.join(zenodoDir, `${OUTPUT_NAME}.pdf`);
  await $`cp ${pdfPath} ${pdfDest}`.quiet();

  // Создать архив исходников внутри zenodo/
  const sourceTarballName = `${OUTPUT_NAME}-source.tar.gz`;
  const sourceTarballPath = path.join(zenodoDir, sourceTarballName);
  console.log(`\n  ⏳ Создание архива исходников (${sourceFiles.length} файлов)...`);
  const tarResult =
    await $`cd ${PAPER_DIR} && tar -czf ${sourceTarballPath} ${sourceFiles}`
      .quiet()
      .nothrow();
  if (tarResult.exitCode !== 0) {
    console.error("❌ tar не удался");
    console.error(tarResult.stderr.toString());
    process.exit(1);
  }
  const sourceTarSize = await Bun.file(sourceTarballPath).size;
  console.log(
    `  ✅ Создан ${sourceTarballName} (${(sourceTarSize / 1024).toFixed(0)} KB)`,
  );

  // Записать zenodo-metadata.json (совместим с REST API /deposit)
  const metadata = buildZenodoMetadata();
  const metadataPath = path.join(zenodoDir, "zenodo-metadata.json");
  await Bun.write(metadataPath, JSON.stringify(metadata, null, 2) + "\n");
  console.log(`  ✅ Записан zenodo-metadata.json`);

  // Записать README.md с описанием депозита
  const readmePath = path.join(zenodoDir, "README.md");
  await Bun.write(readmePath, buildZenodoReadme());
  console.log(`  ✅ Записан README.md`);

  // Шаг 4: очистить промежуточные LaTeX-файлы (не трогая zenodo/).
  const cleaned = await cleanup();
  if (cleaned > 0) console.log(`   🧹 Очищено ${cleaned} промежуточных файлов`);

  // Отчёт
  const pdfSize = await Bun.file(pdfDest).size;
  console.log(`\n✅ Zenodo-депозит готов`);
  console.log(`   📁 ${zenodoDir}/`);
  console.log(`      ${OUTPUT_NAME}.pdf              (${(pdfSize / 1024 / 1024).toFixed(1)} MB — основной)`);
  console.log(`      ${sourceTarballName}   (${(sourceTarSize / 1024).toFixed(0)} KB — исходники)`);
  console.log(`      zenodo-metadata.json        (поля формы / API)`);
  console.log(`      README.md                   (инструкции рецензенту)`);

  console.log(`\n📋 Чек-лист подачи на Zenodo:`);
  console.log(`   1. https://zenodo.org/deposit/new`);
  console.log(`   2. Загрузить оба файла:`);
  console.log(`        - ${OUTPUT_NAME}.pdf (main, viewable)`);
  console.log(`        - ${sourceTarballName} (source archive)`);
  console.log(`   3. Скопировать поля из zenodo-metadata.json в форму`);
  console.log(`      (title, authors, abstract, keywords, license, related ids)`);
  console.log(`   4. Upload type: Publication → Preprint`);
  console.log(`   5. License: Creative Commons Attribution 4.0 International (CC-BY-4.0)`);
  console.log(`   6. Publish → Zenodo немедленно присваивает постоянный DOI`);
  console.log(`   7. Добавить DOI в препринт и сайт диакризиса`);
}

/**
 * Метаданные Zenodo — совместимы с REST API `/api/deposit/depositions`
 * и одновременно служат справкой для веб-формы.
 */
function buildZenodoMetadata(): Record<string, unknown> {
  const abstract = `
<p>We establish a structural no-go theorem asserting that no foundation of
mathematics can simultaneously be formally definable, irreducible to existing
structures, and maximally generative. The result extends the classical no-go
series Cantor (1891), Russell (1901), Gödel (1931), Tarski (1936), Lawvere
(1969) by giving a five-axis absoluteness statement covering all reasonable
Rich-metatheories, all categorical levels (∞, n) for n ∈ ℕ ∪ {∞}, all
meta-theoretic iterations, and all alternative categorical orderings.</p>

<p>We introduce a stratified hierarchy of mathematical novelty (Levels 0--5+,
Level 6) with explicit formal criteria. The principal theorem — the
<strong>Absolute Foundation No-Go Theorem</strong> (AFN-T) — states that Level
6 is structurally empty: no mathematical object satisfies the three
independence conditions (F_S) ∧ (Π_{4,S,n}) ∧ (Π_{3-max,S,n}) simultaneously
for any Rich-metatheory S and any categorical level n.</p>

<p>Three classical bypass paths around absolute no-go results — universe
polymorphism, reflective towers, and intensional refinement through
extensional collapse — are formally closed. Meta-structures at Level 5+ form
a plural class: we prove conditional meta-categoricity under maximality
axioms, structural multiplicity without maximality (at least three
non-equivalent Level 5+ meta-structures: ∞-cosmoi, Univalent Foundations
programme, cohesive framework), and meta-classification stabilization.</p>

<p>The theorem is self-contained. It rests only on standard results from
categorical logic (Lawvere 1969, Adámek–Rosický 1994, Jacobs 1999, Pronk
1996, Lurie 2009, Riehl–Verity 2022, Gambino–Garner 2008, Bergner–Lurie
2012) and requires no axiomatic foundation beyond ZFC with two inaccessible
cardinals.</p>
`.trim();

  return {
    metadata: {
      title:
        "A No-Go Theorem for Absolute Foundations of Mathematics: Hierarchical Classification, Five-Axis Absoluteness, and Meta-Stability",
      upload_type: "publication",
      publication_type: "preprint",
      description: abstract,
      creators: [
        {
          name: "Sereda, Max",
          affiliation: "Independent researcher",
        },
      ],
      keywords: [
        "foundations of mathematics",
        "no-go theorems",
        "categorical logic",
        "(∞, n)-categories",
        "higher topos theory",
        "classifying 2-stacks",
        "intensional type theory",
        "meta-classification",
        "univalent foundations",
        "∞-cosmoi",
        "cohesive higher topoi",
        "Lawvere fixed-point theorem",
        "reflective towers",
        "universe polymorphism",
        "display map categories",
        "bicategory of fractions",
        "Rich-metatheory",
        "AFN-T",
      ],
      language: "eng",
      license: "CC-BY-4.0",
      access_right: "open",
      related_identifiers: [
        {
          relation: "isDocumentedBy",
          identifier: "https://diakrisis.ai",
          scheme: "url",
          resource_type: "publication-other",
        },
      ],
      version: "1.0.0",
      communities: [{ identifier: "mathematics" }],
      notes:
        "Self-contained preprint. Consistency strength: Con(ZFC + 2 inaccessibles). " +
        "Source LaTeX and compiled PDF are included. Russian translation will be " +
        "published as a separate deposit.",
    },
  };
}

/**
 * README, показываемый рецензенту при скачивании депозита.
 */
function buildZenodoReadme(): string {
  return `# AFN-T Preprint — Zenodo deposit

**Title.** A No-Go Theorem for Absolute Foundations of Mathematics:
Hierarchical Classification, Five-Axis Absoluteness, and Meta-Stability.

**Author.** Max Sereda (independent researcher).

## Deposit contents

| File | Purpose |
|------|---------|
| \`${OUTPUT_NAME}.pdf\` | Compiled preprint |
| \`${OUTPUT_NAME}-source.tar.gz\` | LaTeX source (paper.tex with inline bibliography) |
| \`zenodo-metadata.json\` | Zenodo metadata (title, abstract, keywords, license, authors) |
| \`README.md\` | This file |

## Reproducing the PDF from source

\`\`\`bash
tar -xzf ${OUTPUT_NAME}-source.tar.gz
pdflatex paper.tex
pdflatex paper.tex
\`\`\`

Requires a TeX Live 2023+ installation with \`pdflatex\` and the standard
\`amsmath\`, \`amssymb\`, \`amsthm\`, \`mathtools\`, \`hyperref\`, \`enumitem\`,
\`tikz-cd\`, and \`geometry\` packages. Bibliography is embedded in
\`paper.tex\` (\\begin{thebibliography}); no BibTeX run is required.

## Abstract

We establish a structural no-go theorem asserting that no foundation of
mathematics can simultaneously be formally definable, irreducible to
existing structures, and maximally generative. The result extends the
classical no-go series (Cantor, Russell, Gödel, Tarski, Lawvere) by a
five-axis absoluteness statement covering all reasonable Rich-metatheories,
all categorical levels $(\\infty, n)$, all meta-theoretic iterations, and
all alternative categorical orderings.

The principal theorem — the Absolute Foundation No-Go Theorem (AFN-T) —
states that Level 6 of the stratified hierarchy of mathematical novelty is
structurally empty. Three classical bypass paths (universe polymorphism,
reflective towers, intensional refinement through extensional collapse) are
formally closed. Level 5+ meta-structures form a plural class with
conditional categoricity and meta-classification stabilization.

## Licence

Creative Commons Attribution 4.0 International (CC-BY-4.0).
`;
}

// -------- Вход --------
async function main(): Promise<void> {
  if (FLAG_HELP) {
    showUsage();
    return;
  }
  if (UNKNOWN.length > 0) {
    console.error(`❌ Неизвестные аргументы: ${UNKNOWN.join(" ")}\n`);
    showUsage();
    process.exit(2);
  }
  if (FLAG_ARXIV && FLAG_ZENODO) {
    console.error("❌ --arxiv и --zenodo нельзя сочетать в одном запуске.\n");
    showUsage();
    process.exit(2);
  }

  if (FLAG_ARXIV) {
    await buildArxiv();
    return;
  }
  if (FLAG_ZENODO) {
    await buildZenodo();
    return;
  }

  // По умолчанию: сборка PDF
  await buildPdf();
  const cleaned = await cleanup();
  if (cleaned > 0) console.log(`   🧹 Очищено ${cleaned} промежуточных файлов`);
}

main().catch((err) => {
  console.error("❌ Непредвиденная ошибка:", err);
  process.exit(1);
});
