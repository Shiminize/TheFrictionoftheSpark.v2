import { readFile } from 'node:fs/promises';

const tokenSource = await readFile('src/styles/tokens.css', 'utf8');
const tokens = new Map([...tokenSource.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));

const palettes = ['sage', 'oxide', 'noir', 'rose', 'dusk', 'marine'];
const palettePairs = [
  ['text', 'app-bg', 4.5, 'primary text on app background'],
  ['text', 'panel', 4.5, 'primary text on panel'],
  ['text', 'panel-soft', 4.5, 'primary text on soft panel'],
  ['text', 'floating', 4.5, 'primary text on floating surface'],
  ['text', 'sheet', 4.5, 'primary text on sheet'],
  ['text', 'chip', 4.5, 'primary text on chip'],
  ['muted', 'app-bg', 4.5, 'muted text on app background'],
  ['muted', 'panel', 4.5, 'muted text on panel'],
  ['muted', 'panel-soft', 4.5, 'muted text on soft panel'],
  ['muted', 'sheet', 4.5, 'muted text on sheet'],
  ['action-text', 'action', 4.5, 'action label text on action fill'],
  ['action', 'app-bg', 3, 'action icon/control on app background'],
  ['action', 'panel', 3, 'action icon/control on panel'],
  ['reader-text', 'reader-bg', 4.5, 'reader text on reader page'],
  ['reader-muted', 'reader-bg', 4.5, 'reader muted text on reader page'],
  ['reader-text', 'reader-panel', 4.5, 'reader text on reader panel'],
  ['reader-muted', 'reader-panel', 4.5, 'reader muted text on reader panel']
];

const staticPairs = [
  ['color-neutral-0', 'color-accent-red-700', 4.5, 'continue-card text on danger/accent card']
];

const violations = [];

for (const palette of palettes) {
  for (const [foregroundKey, backgroundKey, minimum, label] of palettePairs) {
    const foreground = token(`palette-${palette}-${foregroundKey}`);
    const background = token(`palette-${palette}-${backgroundKey}`);
    assertPair({
      label: `${palette}: ${label}`,
      foregroundName: `--palette-${palette}-${foregroundKey}`,
      foreground,
      backgroundName: `--palette-${palette}-${backgroundKey}`,
      background,
      minimum
    });
  }
}

for (const [foregroundKey, backgroundKey, minimum, label] of staticPairs) {
  assertPair({
    label,
    foregroundName: `--${foregroundKey}`,
    foreground: token(foregroundKey),
    backgroundName: `--${backgroundKey}`,
    background: token(backgroundKey),
    minimum
  });
}

console.log(`Theme contrast scan: ${violations.length} contrast violations found.`);

if (violations.length) {
  for (const violation of violations) {
    console.error(
      `- ${violation.label}: ${violation.ratio.toFixed(2)}:1, expected >= ${violation.minimum}:1 ` +
        `(${violation.foregroundName} ${violation.foreground} on ${violation.backgroundName} ${violation.background})`
    );
  }
  process.exit(1);
}

function assertPair({ label, foregroundName, foreground, backgroundName, background, minimum }) {
  const ratio = contrastRatio(foreground, background);
  if (ratio < minimum) {
    violations.push({ label, foregroundName, foreground, backgroundName, background, minimum, ratio });
  }
}

function token(name) {
  const value = tokens.get(name);
  if (!value) {
    throw new Error(`Missing token --${name}`);
  }
  return value;
}

function contrastRatio(foreground, background) {
  const foregroundLum = relativeLuminance(parseHexColor(foreground));
  const backgroundLum = relativeLuminance(parseHexColor(background));
  return (Math.max(foregroundLum, backgroundLum) + 0.05) / (Math.min(foregroundLum, backgroundLum) + 0.05);
}

function parseHexColor(value) {
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) {
    throw new Error(`Expected a solid hex color for contrast scan, received "${value}"`);
  }

  const hex = match[1].length === 3 ? match[1].replace(/./g, (character) => character + character) : match[1];
  return [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
}

function relativeLuminance([red, green, blue]) {
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
}
