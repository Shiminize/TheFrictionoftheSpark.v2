import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const includeLegacy = process.argv.includes('--include-legacy');
const reportOnly = process.argv.includes('--report') || process.env.CSS_VALUES_REPORT === '1';
const strict = !reportOnly && (process.argv.includes('--strict') || process.env.CSS_VALUES_STRICT === '1' || !includeLegacy);
const activeRoots = ['src/styles', 'src/ui', 'src/components', 'src/App.tsx'];
const legacyRoots = ['src/features/gatekeeper/gatekeeper.css', 'src/features/reader/styles/main.css'];
const roots = includeLegacy ? [...activeRoots, ...legacyRoots] : activeRoots;
const approvedRawValueFiles = new Set([normalize('src/styles/tokens.css')]);
const targetExtensions = new Set(['.css', '.tsx']);
const approvedBreakpoints = new Set(['700px', '900px']);

const rules = [
  {
    name: 'hex-color',
    pattern: /#[0-9a-f]{3,8}\b/gi,
    message: 'Move raw color values into src/styles/tokens.css and consume semantic variables elsewhere.'
  },
  {
    name: 'rgb-hsl-color',
    pattern: /\b(?:rgba?|hsla?)\(/gi,
    message: 'Use semantic color tokens or token-derived color-mix values outside the token layer.'
  },
  {
    name: 'raw-length',
    pattern: /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|vw|vh|dvh|vmax|%)\b/g,
    message: 'Use spacing, typography, target-size, or layout variables instead of raw reusable lengths.'
  },
  {
    name: 'raw-breakpoint',
    pattern: /@media\s*\([^)]*(?:max-width|min-width)\s*:\s*\d/gi,
    message: 'Keep breakpoint literals centralized in token/responsive architecture.'
  },
  {
    name: 'raw-shadow',
    pattern: /box-shadow\s*:\s*(?!\s*var\()[^;]+/gi,
    message: 'Use shadow tokens instead of handwritten shadows.'
  },
  {
    name: 'raw-z-index',
    pattern: /z-index\s*:\s*\d+/gi,
    message: 'Use z-index tokens instead of numeric stacking values.'
  }
];

const files = [];
for (const root of roots) {
  await collectFiles(root, files);
}

const violations = [];
for (const file of files) {
  const normalizedFile = normalize(file);
  if (approvedRawValueFiles.has(normalizedFile)) continue;

  const source = await readFile(file, 'utf8');
  const lines = source.split('\n');

  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const index = match.index ?? 0;
      const lineNumber = source.slice(0, index).split('\n').length;
      const line = lines[lineNumber - 1]?.trim() || '';

      if (isAllowedRuntimeStyle(normalizedFile, line)) continue;
      if (rule.name === 'raw-breakpoint' && isApprovedBreakpoint(line)) continue;
      if (rule.name === 'raw-length' && line.startsWith('@media') && isApprovedBreakpoint(line)) continue;

      violations.push({
        file: normalizedFile,
        line: lineNumber,
        rule: rule.name,
        value: match[0],
        message: rule.message
      });
    }
  }
}

const grouped = new Map();
for (const violation of violations) {
  const key = `${violation.file}:${violation.rule}`;
  grouped.set(key, (grouped.get(key) || 0) + 1);
}

console.log(`CSS value scan (${includeLegacy ? 'active + legacy report' : 'active app'}): ${violations.length} hardcoded value references found outside approved token files.`);
for (const [key, count] of [...grouped.entries()].sort()) {
  console.log(`- ${key} (${count})`);
}

if (violations.length && strict) {
  console.error('\nStrict mode is enabled. First violation examples:');
  for (const violation of violations.slice(0, 20)) {
    console.error(`${violation.file}:${violation.line} [${violation.rule}] ${violation.value} - ${violation.message}`);
  }
  process.exit(1);
}

if (violations.length && !strict) {
  console.log('\nReport-only mode: run npm run check:css-values to enforce the active app scan.');
}

async function collectFiles(root, output) {
  if (targetExtensions.has(path.extname(root))) {
    output.push(root);
    return;
  }

  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, output);
      continue;
    }

    if (targetExtensions.has(path.extname(entry.name))) {
      output.push(fullPath);
    }
  }
}

function normalize(file) {
  return file.split(path.sep).join('/');
}

function isAllowedRuntimeStyle(file, line) {
  if (!file.endsWith('.tsx')) return false;
  return (
    line.includes('--reader-font-size') ||
    line.includes('--reader-line-height') ||
    line.includes('--reader-character-spacing') ||
    line.includes('--reader-word-spacing') ||
    line.includes('--reader-margin-scale') ||
    line.includes('--reader-brightness') ||
    line.includes('--goal-progress') ||
    line.includes('--line-guide-position') ||
    line.includes('lineGuidePosition')
  );
}

function isApprovedBreakpoint(value) {
  for (const breakpoint of approvedBreakpoints) {
    if (value.includes(breakpoint)) return true;
  }
  return false;
}
