#!/usr/bin/env bun
/**
 * build-paper.ts — Сборка PDF и упаковка для серверов препринтов.
 *
 * Поддерживаемые документы:
 *   msfs   — MSFS / AFN-T (paper-en/paper.tex, по умолчанию)
 *   verum  — Verum × MSFS integration (verum/en/paper.tex)
 *
 * Использование:
 *   bun scripts/build-paper.ts                         PDF → paper-en/msfs-paper.pdf
 *   bun scripts/build-paper.ts --paper verum           PDF → verum/en/verum-msfs-paper.pdf
 *   bun scripts/build-paper.ts --arxiv                 arXiv-тарболл MSFS
 *   bun scripts/build-paper.ts --paper verum --arxiv   arXiv-тарболл Verum
 *   bun scripts/build-paper.ts --zenodo                Zenodo-каталог MSFS
 *   bun scripts/build-paper.ts --paper verum --zenodo  Zenodo-каталог Verum
 *   bun scripts/build-paper.ts --help                  Справка
 *
 * Конвейер: три прохода pdflatex (aux/toc → cross-refs → финализация).
 * Библиография встроена (\begin{thebibliography}); BibTeX не требуется.
 */

import { $ } from "bun";
import { existsSync } from "fs";
import path from "path";

// =============================================================================
// Конфигурация документов
// =============================================================================

type PaperConfig = {
  /** Подпапка (относительно ROOT), содержащая paper.tex */
  paperDir: string;
  /** Базовое имя собранного PDF (без расширения) */
  outputName: string;
  /** Имя arXiv-тарболла */
  arxivTarball: string;
  /** Короткое имя для логов */
  shortLabel: string;
  /** Полный заголовок (для Zenodo) */
  title: string;
  /** Abstract (HTML, для Zenodo description) */
  zenodoAbstract: string;
  /** Ключевые слова Zenodo */
  zenodoKeywords: string[];
  /** Замечания Zenodo */
  zenodoNotes: string;
  /** arXiv-категории */
  arxivPrimary: string;
  arxivCross: string[];
};

const MSFS_CONFIG: PaperConfig = {
  paperDir: "paper-en",
  outputName: "msfs-paper",
  arxivTarball: "msfs-arxiv.tar.gz",
  shortLabel: "MSFS / AFN-T",
  title:
    "The Moduli Space of Formal Systems: Classification, Stabilization, and a No-Go Theorem for Absolute Foundations",
  zenodoAbstract: `
<p>The moduli space of Rich-foundations $\\mathfrak{M}$ is studied as the
classifying $(\\infty, 2)$-stack of Morita-equivalence classes of formal
systems. Four structural results establish the interior — plurality at
the classifier stratum, conditional categoricity at the maximal
sub-class, slice-local intensional refinement via Hyland's effective
topos, and theory-level meta-stabilization with universe-ascent — and
one boundary corollary (AFN-T) establishes that the absolute foundation
stratum is empty, uniformly across all Rich-metatheories and all
$(\\infty, n)$-levels. The classical no-go series (Cantor, Russell,
Gödel, Tarski, Lawvere, Ernst) is subsumed as specializations of the
boundary lemma.</p>

<p>Three bypass paths — universe polymorphism, reflective towers,
intensional refinement through extensional collapse — are formally
closed. Three pairwise-non-equivalent partial classifiers
($\\infty$-cosmoi, Univalent Foundations, cohesive higher topoi)
witness the structural plurality of the classifier stratum.</p>

<p>Consistency strength: Con(ZFC + 2 inaccessibles). Bibliography is
embedded in the source; no BibTeX run required.</p>
`.trim(),
  zenodoKeywords: [
    "foundations of mathematics",
    "moduli space of formal systems",
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
    "display map categories",
    "bicategory of fractions",
    "Rich-metatheory",
    "AFN-T",
  ],
  zenodoNotes:
    "Self-contained. Consistency strength: Con(ZFC + 2 inaccessibles). " +
    "Source LaTeX and compiled PDF are included.",
  arxivPrimary: "math.LO",
  arxivCross: ["math.CT", "math.AG"],
};

const VERUM_CONFIG: PaperConfig = {
  paperDir: "verum/en",
  outputName: "verum-msfs-paper",
  arxivTarball: "verum-msfs-arxiv.tar.gz",
  shortLabel: "Verum × MSFS",
  title:
    "Verum as a Native Instance of the Moduli Space of Formal Systems: Compiler-Integrated Verification Structurally Grounded in AFN-T",
  zenodoAbstract: `
<p>The proof assistant Verum is analysed as a concrete computable
instance of the $(\\infty, n)$-categorical moduli space $\\mathfrak{M}$
of Rich-foundations classified by the MSFS programme. Four structural
correspondences are established: (i) the <code>@framework(name,
citation)</code> axiom mechanism realises the $\\mathcal{L}_{Fnd}$
stratum with explicit bibliographic coordinate; (ii)
<code>protocol</code>-based abstraction instantiates the classifier
stratum $\\mathcal{L}_{Cls}$ with explicit (M1)–(M5) data; (iii) the
LCF-style trusted kernel embodies T-2f* depth-stratification and
inherits universal paradox-immunity via the Yanofsky-reducibility
theorem; (iv) the nine-strategy <code>@verify(...)</code> dispatch
ladder refines the ν-invariant of Diakrisis in an operational-cost
gradient.</p>

<p>The 223-theorem UHM proof corpus is shown to stratify exactly into
MSFS levels. A competitive analysis establishes that no extant proof
assistant (Coq, Lean, Agda, Isabelle, F*, Dafny, Liquid Haskell, Mizar,
Metamath) satisfies all four MSFS correspondences. The gap is
structural, not engineering: Verum's architecture was composed after
MSFS, with the correspondences as explicit design desiderata.</p>
`.trim(),
  zenodoKeywords: [
    "proof assistants",
    "Verum",
    "verifiable systems programming",
    "compiler-integrated verification",
    "refinement types",
    "dependent types",
    "cubical type theory",
    "SMT-based verification",
    "LCF-style kernel",
    "framework axioms",
    "moduli space of formal systems",
    "MSFS",
    "AFN-T",
    "intensional type theory",
    "MLTT / ETT separation",
    "gradual verification",
    "paradox-immunity",
  ],
  zenodoNotes:
    "Companion paper to MSFS. Establishes four correspondence theorems " +
    "between Verum language mechanisms and MSFS strata.",
  arxivPrimary: "cs.LO",
  arxivCross: ["cs.PL", "math.LO", "math.CT"],
};

const PAPERS: Record<string, PaperConfig> = {
  msfs: MSFS_CONFIG,
  verum: VERUM_CONFIG,
};

const MAIN_TEX = "paper.tex";
const ZENODO_DIR_NAME = "zenodo";
const ROOT = path.resolve(import.meta.dir, "..");

// =============================================================================
// Разбор аргументов
// =============================================================================

const args = process.argv.slice(2);
const FLAG_ARXIV = args.includes("--arxiv");
const FLAG_ZENODO = args.includes("--zenodo");
const FLAG_HELP = args.includes("--help") || args.includes("-h");

// --paper <name>
let paperChoice = "msfs";
const paperIdx = args.indexOf("--paper");
if (paperIdx !== -1) {
  const val = args[paperIdx + 1];
  if (!val || val.startsWith("--")) {
    console.error("❌ --paper требует аргумент: msfs | verum\n");
    process.exit(2);
  }
  paperChoice = val;
}

const KNOWN = new Set(["--arxiv", "--zenodo", "--help", "-h", "--paper"]);
const UNKNOWN = args.filter((a, i) => {
  if (KNOWN.has(a)) return false;
  // Значение после --paper не считается «неизвестным»
  if (i > 0 && args[i - 1] === "--paper") return false;
  return true;
});

if (!FLAG_HELP && !(paperChoice in PAPERS)) {
  console.error(
    `❌ Неизвестный документ: "${paperChoice}". Доступны: ${Object.keys(PAPERS).join(", ")}\n`,
  );
  process.exit(2);
}

const CONFIG: PaperConfig = PAPERS[paperChoice] ?? MSFS_CONFIG;
const PAPER_DIR = path.join(ROOT, CONFIG.paperDir);

// =============================================================================
// Справка
// =============================================================================

function showUsage(): void {
  const msfsName = MSFS_CONFIG.outputName;
  const verumName = VERUM_CONFIG.outputName;
  console.log(
    `
Использование: bun scripts/build-paper.ts [параметры]

Выбор документа:
  --paper msfs      MSFS / AFN-T (paper-en/)   [по умолчанию]
  --paper verum     Verum × MSFS (verum/en/)

Режимы:
  (без флага)       Собрать PDF
  --arxiv           Упаковать arXiv-тарболл
  --zenodo          Собрать Zenodo-каталог
  --help, -h        Показать справку

Примеры:
  bun scripts/build-paper.ts                         → paper-en/${msfsName}.pdf
  bun scripts/build-paper.ts --paper verum           → verum/en/${verumName}.pdf
  bun scripts/build-paper.ts --paper verum --arxiv   → verum/en/${VERUM_CONFIG.arxivTarball}
  bun scripts/build-paper.ts --zenodo                → paper-en/zenodo/
`.trim(),
  );
}

// =============================================================================
// Общие помощники
// =============================================================================

async function run(cmd: string, label: string): Promise<boolean> {
  console.log(`  ⏳ ${label}...`);
  const start = performance.now();
  const result = await $`cd ${PAPER_DIR} && ${cmd.split(" ")}`.quiet().nothrow();
  const elapsed = ((performance.now() - start) / 1000).toFixed(1);

  if (result.exitCode !== 0) {
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

async function countPagesFromLog(jobname: string): Promise<number> {
  const logPath = path.join(PAPER_DIR, `${jobname}.log`);
  if (!existsSync(logPath)) return 0;
  const text = await Bun.file(logPath).text();
  const match = text.match(/Output written on [^\s(]+\s*\((\d+) pages?/);
  return match ? parseInt(match[1], 10) : 0;
}

async function cleanup(): Promise<number> {
  const jobnames = [CONFIG.outputName, "paper"];
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

// =============================================================================
// Режим сборки PDF
// =============================================================================

async function buildPdf(): Promise<string> {
  console.log(`\n📄 Сборка ${CONFIG.shortLabel}\n`);
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${PAPER_DIR}/${CONFIG.outputName}.pdf\n`);

  await checkPrereqs();

  const pdflatex = `pdflatex -interaction=nonstopmode -jobname=${CONFIG.outputName} ${MAIN_TEX}`;

  // Три прохода: (1) .aux/.toc; (2) cross-refs; (3) финализация.
  if (!(await run(pdflatex, "Проход 1/3 (генерация .aux / .toc)"))) process.exit(1);
  if (!(await run(pdflatex, "Проход 2/3 (перекрёстные ссылки)"))) process.exit(1);
  if (!(await run(pdflatex, "Проход 3/3 (финализация cross-refs)"))) process.exit(1);

  const pdfPath = path.join(PAPER_DIR, `${CONFIG.outputName}.pdf`);
  if (!existsSync(pdfPath)) {
    console.error("\n❌ PDF не сгенерирован");
    process.exit(1);
  }

  const size = await Bun.file(pdfPath).size;
  const pages = await countPagesFromLog(CONFIG.outputName);

  console.log(`\n✅ PDF собран`);
  console.log(`   📄 ${pdfPath}`);
  console.log(`   📐 ${pages} страниц, ${(size / 1024 / 1024).toFixed(1)} MB`);

  return pdfPath;
}

// =============================================================================
// Режим arXiv
// =============================================================================

async function buildArxiv(): Promise<void> {
  console.log(`\n📦 Упаковка arXiv-архива — ${CONFIG.shortLabel}\n`);
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${PAPER_DIR}/${CONFIG.arxivTarball}\n`);

  await checkPrereqs();

  // Контрольный прогон (три прохода) c jobname по умолчанию (`paper`).
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

  const tarballPath = path.join(PAPER_DIR, CONFIG.arxivTarball);
  if (existsSync(tarballPath)) {
    await $`rm ${tarballPath}`.quiet();
  }

  console.log(`  ⏳ Создание тарболла (${files.length} файлов)...`);
  const tarResult =
    await $`cd ${PAPER_DIR} && tar -czf ${CONFIG.arxivTarball} ${files}`
      .quiet()
      .nothrow();

  if (tarResult.exitCode !== 0) {
    console.error("❌ tar не удался");
    console.error(tarResult.stderr.toString());
    process.exit(1);
  }

  const tarSize = await Bun.file(tarballPath).size;
  console.log(
    `  ✅ Создан ${CONFIG.arxivTarball} (${(tarSize / 1024).toFixed(0)} KB)`,
  );

  const cleaned = await cleanup();
  const mainPdf = path.join(PAPER_DIR, "paper.pdf");
  if (existsSync(mainPdf)) await $`rm ${mainPdf}`.quiet().nothrow();
  if (cleaned > 0) console.log(`   🧹 Очищено ${cleaned} промежуточных файлов`);

  const crossList = CONFIG.arxivCross.join(", ");
  console.log(`\n✅ arXiv-пакет готов`);
  console.log(`   📦 ${tarballPath}`);
  console.log(`   📄 ${files.length} файлов, ${(tarSize / 1024).toFixed(0)} KB`);
  console.log(`\n📋 Чек-лист подачи на arXiv:`);
  console.log(`   1. Загрузить ${CONFIG.arxivTarball} на https://arxiv.org/submit`);
  console.log(`   2. Основная категория: ${CONFIG.arxivPrimary}`);
  console.log(`   3. Кросс-листинг: ${crossList}`);
  console.log(`   4. Лицензия: CC BY 4.0 рекомендуется`);
  console.log(`   5. Проверить arXiv-preview перед публикацией`);
}

// =============================================================================
// Режим Zenodo
// =============================================================================

async function buildZenodo(): Promise<void> {
  console.log(`\n📦 Сборка Zenodo-депозита — ${CONFIG.shortLabel}\n`);
  const zenodoDir = path.join(PAPER_DIR, ZENODO_DIR_NAME);
  console.log(`  Источник: ${PAPER_DIR}/${MAIN_TEX}`);
  console.log(`  Выход:    ${zenodoDir}/\n`);

  const pdfPath = await buildPdf();

  const sourceFiles = [MAIN_TEX];
  for (const f of sourceFiles) {
    if (!existsSync(path.join(PAPER_DIR, f))) {
      console.error(`❌ Отсутствует файл: ${f}`);
      process.exit(1);
    }
  }

  if (existsSync(zenodoDir)) {
    await $`rm -rf ${zenodoDir}`.quiet();
  }
  await $`mkdir -p ${zenodoDir}`.quiet();

  // PDF
  const pdfDest = path.join(zenodoDir, `${CONFIG.outputName}.pdf`);
  await $`cp ${pdfPath} ${pdfDest}`.quiet();

  // source tarball
  const sourceTarballName = `${CONFIG.outputName}-source.tar.gz`;
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

  // metadata + README
  const metadata = buildZenodoMetadata();
  const metadataPath = path.join(zenodoDir, "zenodo-metadata.json");
  await Bun.write(metadataPath, JSON.stringify(metadata, null, 2) + "\n");
  console.log(`  ✅ Записан zenodo-metadata.json`);

  const readmePath = path.join(zenodoDir, "README.md");
  await Bun.write(readmePath, buildZenodoReadme());
  console.log(`  ✅ Записан README.md`);

  // cleanup intermediate (outside zenodo/)
  const cleaned = await cleanup();
  if (cleaned > 0) console.log(`   🧹 Очищено ${cleaned} промежуточных файлов`);

  const pdfSize = await Bun.file(pdfDest).size;
  console.log(`\n✅ Zenodo-депозит готов`);
  console.log(`   📁 ${zenodoDir}/`);
  console.log(
    `      ${CONFIG.outputName}.pdf              (${(pdfSize / 1024 / 1024).toFixed(1)} MB — основной)`,
  );
  console.log(
    `      ${sourceTarballName}   (${(sourceTarSize / 1024).toFixed(0)} KB — исходники)`,
  );
  console.log(`      zenodo-metadata.json        (поля формы / API)`);
  console.log(`      README.md                   (инструкции рецензенту)`);

  console.log(`\n📋 Чек-лист подачи на Zenodo:`);
  console.log(`   1. https://zenodo.org/deposit/new`);
  console.log(`   2. Загрузить оба файла:`);
  console.log(`        - ${CONFIG.outputName}.pdf (main, viewable)`);
  console.log(`        - ${sourceTarballName} (source archive)`);
  console.log(`   3. Скопировать поля из zenodo-metadata.json в форму`);
  console.log(`   4. Upload type: Publication → Preprint`);
  console.log(`   5. License: Creative Commons Attribution 4.0 International (CC-BY-4.0)`);
  console.log(`   6. Publish → Zenodo немедленно присваивает постоянный DOI`);
}

// =============================================================================
// Zenodo metadata + README (config-driven)
// =============================================================================

function buildZenodoMetadata(): Record<string, unknown> {
  return {
    metadata: {
      title: CONFIG.title,
      upload_type: "publication",
      publication_type: "preprint",
      description: CONFIG.zenodoAbstract,
      creators: [
        {
          name: "Sereda, Max",
          affiliation: "Independent researcher",
        },
      ],
      keywords: CONFIG.zenodoKeywords,
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
      notes: CONFIG.zenodoNotes,
    },
  };
}

function buildZenodoReadme(): string {
  return `# ${CONFIG.title} — Zenodo deposit

**Author.** Max Sereda (independent researcher).

## Deposit contents

| File | Purpose |
|------|---------|
| \`${CONFIG.outputName}.pdf\` | Compiled PDF |
| \`${CONFIG.outputName}-source.tar.gz\` | LaTeX source (paper.tex with inline bibliography) |
| \`zenodo-metadata.json\` | Zenodo metadata (title, abstract, keywords, license, authors) |
| \`README.md\` | This file |

## Reproducing the PDF from source

\`\`\`bash
tar -xzf ${CONFIG.outputName}-source.tar.gz
pdflatex paper.tex
pdflatex paper.tex
pdflatex paper.tex
\`\`\`

Requires a TeX Live 2023+ installation with \`pdflatex\` and the standard
\`amsmath\`, \`amssymb\`, \`amsthm\`, \`mathtools\`, \`hyperref\`, \`enumitem\`,
\`tikz-cd\`, \`geometry\`, \`booktabs\`, \`longtable\`, \`listings\` packages.
Bibliography is embedded in \`paper.tex\` (\\begin{thebibliography}); no
BibTeX run is required.

## Licence

Creative Commons Attribution 4.0 International (CC-BY-4.0).
`;
}

// =============================================================================
// Вход
// =============================================================================

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
