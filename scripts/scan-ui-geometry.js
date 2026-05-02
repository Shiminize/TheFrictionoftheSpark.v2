import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const activeRoots = ['src/styles'];
const targetExtensions = new Set(['.css']);
const approvedRawValueFiles = new Set([normalize('src/styles/tokens.css')]);
const approvedRadiusTokens = ['--radius-ui', '--radius-ui-sm', '--radius-ui-none'];
const ringRadiusToken = '--radius-ring';

const files = [];
for (const root of activeRoots) {
  await collectFiles(root, files);
}

const violations = [];
for (const file of files) {
  const normalizedFile = normalize(file);
  if (approvedRawValueFiles.has(normalizedFile)) continue;

  const source = await readFile(file, 'utf8');
  const lines = source.split('\n');
  let currentSelector = '';

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();

    if (line.endsWith('{')) {
      currentSelector = line.slice(0, -1).trim();
      continue;
    }

    if (line === '}') {
      currentSelector = '';
      continue;
    }

    if (line.includes('--radius-pill') || line.includes('--radius-round')) {
      addViolation(normalizedFile, index, 'disallowed-radius-token', line, 'Use small semantic geometry tokens instead of pill or round radius tokens.');
    }

    if (line.startsWith('border-radius:')) {
      const usesApprovedRadius = approvedRadiusTokens.some((token) => line.includes(token));
      const usesRingRadius = line.includes(ringRadiusToken);
      const usesRawCircle = line.includes('50%');

      if (usesRawCircle) {
        addViolation(normalizedFile, index, 'raw-circle-radius', line, 'Use --radius-ring only for true circular progress rings.');
      }

      if (usesRingRadius && !currentSelector.includes('.goal-ring')) {
        addViolation(normalizedFile, index, 'ring-radius-outside-ring', line, 'Reserve --radius-ring for the reading goal progress ring.');
      }

      if (!usesApprovedRadius && !usesRingRadius) {
        addViolation(normalizedFile, index, 'non-semantic-radius', line, 'Use --radius-ui, --radius-ui-sm, --radius-ui-none, or the approved ring token.');
      }
    }

    if (/^border(?:-(?:top|right|bottom|left))?\s*:/.test(line) && !/^border(?:-(?:top|right|bottom|left))?\s*:\s*0\s*;?$/.test(line)) {
      addViolation(normalizedFile, index, 'decorative-border', line, 'Remove normal-state decorative borders; use surface contrast, shadow, or focus outlines.');
    }
  }
}

const grouped = new Map();
for (const violation of violations) {
  const key = `${violation.file}:${violation.rule}`;
  grouped.set(key, (grouped.get(key) || 0) + 1);
}

console.log(`UI geometry scan: ${violations.length} geometry policy violations found outside approved token files.`);
for (const [key, count] of [...grouped.entries()].sort()) {
  console.log(`- ${key} (${count})`);
}

if (violations.length) {
  console.error('\nFirst violation examples:');
  for (const violation of violations.slice(0, 20)) {
    console.error(`${violation.file}:${violation.line} [${violation.rule}] ${violation.value} - ${violation.message}`);
  }
  process.exit(1);
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

function addViolation(file, index, rule, value, message) {
  violations.push({
    file,
    line: index + 1,
    rule,
    value,
    message
  });
}
