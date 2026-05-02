# Book Reader CSS Value System Architecture

## Goal

Create one governed UI value system for the Vite React Book Reader so colors, spacing, sizing, radii, shadows, typography, z-index, responsive breakpoints, and reader settings are changed in one place instead of being debugged as scattered hardcoded values.

V1 stays plain React and CSS. Do not add Tailwind or a design-system dependency unless the project later needs it. The current app already uses CSS custom properties, so the lowest-risk architecture is a stricter CSS variable contract plus small React primitives.

## Current Problem

The current React app imports `src/styles/app.css` from `src/main.tsx`. That file contains a partial token layer, but most UI values are still direct literals:

- Color literals such as hex and `rgba(...)` appear throughout component styles.
- Spacing, sizes, card dimensions, icon button dimensions, and responsive values are repeated as raw `px`, `rem`, `vw`, and `dvh` values.
- Reader themes, app colors, component surface colors, shadows, and layout dimensions are mixed in the same file.
- React screens use class names directly, but there is no reusable primitive layer for cards, panels, sheets, rails, tabs, or section headers.
- Older theme/style files exist under `src/shared/styles/` and `src/features/reader/styles/`, but they are not part of the current React app import path.

The risk is high UI drift: fixing one mobile card, reader button, or muted label can accidentally leave the same value broken elsewhere.

## Implementation Decisions

- V1 keeps plain CSS and React primitives; no Tailwind, CSS-in-JS, or external design-system dependency is introduced.
- `src/styles/app.css` is the single style import manifest. It imports token, theme, base, primitive, feature, and layout CSS in a controlled cascade.
- Existing legacy aliases such as `--app-bg`, `--app-muted`, and `--reader-bg` remain available during migration so the split does not create a visual regression.
- `src/ui/` owns new reusable React primitives. Existing compatibility wrappers under `src/components/` re-export those primitives while feature imports are migrated.
- `scripts/scan-css-values.js` now runs strict checks against the active app surface by default. Legacy/non-active CSS is isolated behind an explicit report-only command so it cannot block the Vite app migration.
- Generated migration tokens in `src/styles/tokens.css` are an accepted bridge for this pass. They keep active CSS literal-free now and should be renamed into clearer semantic tokens during future visual polish when a token's purpose is obvious.
- App-wide color palettes are governed by `ReaderPreferences.colorPalette` and `data-color-palette` on `.app-shell` or `.reader-shell`. Raw palette values live only in `tokens.css`; `themes.css` maps them into semantic app, reader, sheet, action, and line-guide tokens.

## Architecture Rules

1. No reusable visual value may be hardcoded inside feature CSS.
2. Feature CSS may only compose semantic tokens and component tokens.
3. Raw color values live only in the foundation token file.
4. Raw spacing, radius, shadow, z-index, breakpoint, and type scale values live only in foundation tokens.
5. Runtime user preferences may set CSS variables inline, but only dynamic values that cannot be known statically, such as reader font size, line height, word spacing, margins, brightness, goal progress, and line-guide position.
6. Component-level tokens may alias foundation tokens, but should not introduce new literal values.
7. Reader text tokens must be separate from dashboard UI tokens because prose has different ergonomics from cards and navigation.
8. Scanner checks must fail if new hardcoded CSS values are added outside approved token files.
9. Palette UI must never use inline color styles; palette preview swatches should consume palette token aliases through CSS classes.

## Target File Blueprint

```text
[CREATE] src/styles/tokens.css
  Foundation tokens only: raw palette, spacing scale, type scale, line heights,
  radii, shadows, target sizes, z-index, breakpoints, motion, safe-area aliases.

[CREATE] src/styles/themes.css
  Semantic app theme mappings: app background, surfaces, text, muted text,
  borders, focus ring, action colors, reader theme palettes, line-guide dim tokens.

[CREATE] src/styles/base.css
  Reset, body, focus-visible, accessibility defaults, typography defaults.
  Values must reference tokens from tokens.css or themes.css.

[CREATE] src/styles/layout.css
  App shell, screen layout, responsive container rules, mobile/desktop navigation
  positioning. Values must reference layout tokens.

[CREATE] src/styles/primitives.css
  Shared primitive class contracts: ui-button, ui-icon-button, ui-card,
  ui-panel, ui-sheet, ui-chip, ui-field, ui-section, ui-scroll-rail.

[CREATE] src/styles/features/home.css
  Home-only composition: continue card, goal ring, top picks, want-to-read.
  Uses primitives and tokens, no raw literals.

[CREATE] src/styles/features/library.css
  Library-only composition: collection rail, cards, grid/list, actions.
  Uses primitives and tokens, no raw literals.

[CREATE] src/styles/features/reader.css
  Reader-only composition: reader shell, page, chrome, menu, settings, line guide.
  Uses reader tokens and runtime preference variables, no raw literals.

[MODIFY] src/styles/app.css
  Becomes an import manifest only:
  @import './tokens.css';
  @import './themes.css';
  @import './base.css';
  @import './layout.css';
  @import './primitives.css';
  @import './features/home.css';
  @import './features/library.css';
  @import './features/reader.css';

[CREATE] src/ui/
  Small reusable React primitives shared across screens.

[CREATE] src/ui/Button.tsx
  Text button and icon button variants with required accessible labels.

[CREATE] src/ui/Card.tsx
  Card/panel shell with density and interactivity variants.

[CREATE] src/ui/Sheet.tsx
  Bottom sheet/dialog shell used by Reader Menu and Themes & Settings.

[CREATE] src/ui/Section.tsx
  Section header, title row, optional action slot.

[CREATE] src/ui/ChipRail.tsx
  Horizontal filter chip rail with overflow-safe mobile behavior.

[CREATE] src/ui/Field.tsx
  Search/input wrapper with icon slot and label handling.

[CREATE] scripts/scan-css-values.js
  CI/local guard that rejects hardcoded colors, shadows, spacing, z-index,
  radii, and media query values outside approved token files.

[MODIFY] package.json
  Add "check:css-values": "node scripts/scan-css-values.js --strict".
  Add "check:css-values:report": "node scripts/scan-css-values.js --include-legacy --report".
```

## Token Layers

### 1. Foundation Tokens

Foundation tokens are the only place where raw values are allowed.

```css
:root {
  --color-ink-900: #171717;
  --color-paper-50: #fffdf8;
  --color-paper-100: #f6f4ee;
  --color-accent-green-700: #0f8067;
  --color-accent-red-700: #a8282a;

  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  --target-sm: 40px;
  --target-md: 44px;
  --target-lg: 48px;

  --shadow-soft: 0 10px 24px rgb(18 22 25 / 8%);
  --shadow-float: 0 18px 38px rgb(18 22 25 / 14%);

  --text-ui-sm: 0.82rem;
  --text-ui-md: 0.95rem;
  --text-title-lg: 2.25rem;
  --text-reader-md: 1.125rem;

  --break-mobile-max: 700px;
  --break-desktop-min: 900px;
  --safe-bottom: env(safe-area-inset-bottom);
}
```

### 2. Semantic Tokens

Semantic tokens describe intent. Components should consume these, not raw palette tokens.

```css
:root {
  --surface-app: var(--color-paper-100);
  --surface-panel: color-mix(in oklab, var(--color-paper-50) 78%, transparent);
  --surface-panel-strong: var(--color-paper-50);
  --text-primary: var(--color-ink-900);
  --text-muted: #5f6369;
  --border-subtle: color-mix(in oklab, var(--text-primary) 8%, transparent);
  --focus-ring: var(--color-accent-green-700);
  --action-primary: var(--color-accent-green-700);
  --action-danger: var(--color-accent-red-700);
}
```

After migration, values like `#5f6369` move into foundation tokens too. It is shown here only to illustrate semantic mapping.

### 3. Component Tokens

Component tokens set defaults for primitives. Feature CSS can override them through local variables, but still with token references.

```css
.ui-card {
  --card-padding: var(--space-4);
  --card-radius: var(--radius-md);
  --card-bg: var(--surface-panel);
  --card-border: var(--border-subtle);
  --card-shadow: var(--shadow-soft);
}

.ui-icon-button {
  --icon-button-size: var(--target-md);
  --icon-button-radius: var(--radius-pill);
}
```

### 4. Runtime Preference Tokens

Only user-controlled reader values should be set from React inline styles:

- `--reader-font-size`
- `--reader-line-height`
- `--reader-character-spacing`
- `--reader-word-spacing`
- `--reader-margin-scale`
- `--reader-brightness`
- `--goal-progress`
- `--line-guide-position`

All other values should come from CSS.

## React Primitive Layer

Use primitives to prevent every screen from inventing its own button/card/sheet geometry.

```text
src/ui/Button.tsx
  <Button variant="plain | filled | soft | chip" />
  <IconButton label variant="plain | filled | soft" />

src/ui/Card.tsx
  <Card tone="default | accent | danger" interactive />

src/ui/Sheet.tsx
  <Sheet title onClose>...</Sheet>

src/ui/Section.tsx
  <Section title description action>...</Section>

src/ui/ChipRail.tsx
  <ChipRail items activeId onSelect />

src/ui/Field.tsx
  <Field label icon>input</Field>
```

Existing components should migrate as follows:

```text
[REPLACE] src/components/IconButton.tsx -> src/ui/Button.tsx
[REPLACE] src/components/BottomNav.tsx -> src/ui/Navigation.tsx
[MODIFY]  src/features/home/HomeScreen.tsx to use Section, Card, Button
[MODIFY]  src/features/library/LibraryScreen.tsx to use ChipRail, Card, Field
[MODIFY]  src/features/reader/ReaderMenuSheet.tsx to use Sheet, Field, Button
[MODIFY]  src/features/reader/ThemeSettingsSheet.tsx to use Sheet, Button, Card
[MODIFY]  src/features/reader/LineGuideOverlay.tsx to use IconButton and reader tokens
```

## Scanner Rules

The scanner should inspect CSS and TSX files and reject new literals outside approved files.

Approved raw-value files:

- `src/styles/tokens.css`
- Optional scanner config allowlist

Reject outside approved files:

- Hex colors: `#fff`, `#ffffff`, `#171717`
- Direct `rgba(...)`, `rgb(...)`, `hsl(...)`, `hsla(...)` unless inside `color-mix` with tokens
- Raw spacing and size literals: `13px`, `44px`, `2.25rem`
- Raw radius values: `8px`, `999px`
- Raw shadows: `box-shadow: 0 ...`
- Raw media query breakpoints: `@media (max-width: 700px)`
- Raw z-index numbers

Allowed exceptions:

- `0`
- `1`
- Unitless line-height values when assigned to runtime reader variables
- Dynamic inline CSS variables listed in "Runtime Preference Tokens"
- Image intrinsic width/height attributes if added later for layout stability

## Migration Phases

### Phase 1: Establish Token Contract

- Create `tokens.css`, `themes.css`, `base.css`, and import them through `app.css`.
- Move existing `:root` values from `app.css` into `tokens.css` and `themes.css`.
- Add aliases so old names like `--app-bg` and `--reader-bg` still work during migration.
- No visual redesign in this phase.

### Phase 2: Add Scanner

- Add `scripts/scan-css-values.js`.
- Run strict checks for active app files through `npm run check:css-values`.
- Keep legacy/non-active files visible through `npm run check:css-values:report`.
- Record current legacy violations by file so the team sees the remaining baseline without weakening active app enforcement.

### Phase 3: Introduce Primitives

- Add `src/ui/Button.tsx`, `Card.tsx`, `Sheet.tsx`, `Section.tsx`, `ChipRail.tsx`, and `Field.tsx`.
- Keep props small and stable.
- Move `IconButton` and `BottomNav` onto primitive classes first because they affect every screen.

### Phase 4: Split Global CSS By Responsibility

- Convert `src/styles/app.css` into an import manifest.
- Move base shell rules to `base.css` and `layout.css`.
- Move shared button/card/sheet/field rules to `primitives.css`.
- Move Home, Library, and Reader rules into feature CSS files.

### Phase 5: Migrate Feature CSS To Tokens

- Replace hardcoded Home values with semantic/component tokens.
- Replace hardcoded Library values with semantic/component tokens.
- Replace hardcoded Reader values with reader semantic tokens.
- Fix mobile-specific values through tokenized responsive rules.
- Use generated migration tokens only when a literal needs to be removed before its final semantic name is known.

### Phase 6: Enforce

- Keep scanner in failing mode for active app CSS.
- Keep report-only legacy output separate until unused legacy CSS is removed or migrated.
- Add the active scanner to the normal verification command set.
- Any future UI task must pass:
  - `npm test`
  - `npm run build`
  - `npm run check:css-values`
  - mobile and desktop smoke check for affected surfaces

## Responsive Token Strategy

Do not scatter raw breakpoint numbers through feature files. Use two canonical breakpoint tokens and group responsive rules in one area per file:

```css
@media (max-width: 700px) {
  :root {
    --screen-padding-inline: var(--space-5);
    --card-cover-height: 156px;
    --reader-stage-padding-inline: var(--space-6);
  }
}

@media (min-width: 900px) {
  :root {
    --nav-rail-width: 76px;
    --screen-padding-left-desktop: 92px;
  }
}
```

If CSS custom media is later added through PostCSS, convert those to named media queries. For now, keep breakpoint literals only in `tokens.css` or a single responsive token section.

## Reader-Specific Contract

The reader is special because user preferences change the typography live. Its contract should be:

```css
.reader-shell {
  --reader-surface: var(--reader-theme-bg);
  --reader-panel-surface: var(--reader-theme-panel);
  --reader-prose-color: var(--reader-theme-text);
  --reader-secondary-color: var(--reader-theme-muted);
  --reader-control-size: var(--target-md);
  --reader-chrome-width: min(var(--reader-chrome-max-width), calc(100vw - var(--space-6)));
  --reader-page-min-height: calc(100dvh - var(--reader-chrome-reserved-space));
}
```

React owns only reading preference values. CSS owns all layout and theme mapping.

## Reader Typography Contract

- Self-host reader fonts through `src/styles/fonts.css` so Vercel/GitHub Pages builds do not depend on runtime Google Fonts requests.
- Use Literata as the default long-form book face because it was designed for digital publishing and device reading.
- Use Source Serif 4 for editorial/paper-style themes that need a more classic printed texture.
- Use Atkinson Hyperlegible for Bold and Focus themes where letterform distinction and accessibility matter more than literary texture.
- Keep `Theme Default` as the default reader font preference so each page theme can choose the most appropriate typeface.
- Preserve explicit reader overrides for Literata, Source Serif, Atkinson, Georgia, and Palatino.
- Keep long-form measure tokenized around `66ch`, with tighter measures for Focus/Bold themes and orientation overrides.
- Use `font-optical-sizing`, kerning, common ligatures, English `lang`, and hyphenation for prose; keep flush-left text as the default and expose justification only as an opt-in preference.

## Validation Standard

Architecture is complete only when:

- `src/styles/app.css` imports smaller style files and no longer holds all UI rules.
- Hardcoded reusable values are gone from active feature CSS and TSX.
- Scanner catches new hardcoded values in active app files.
- `npm run check:css-values` reports `0` active violations.
- `npm run check:css-values:report` remains available for legacy CSS until those files are removed or migrated.
- Home, Library, Search, Reader, Reader Menu, Themes & Settings, and Line Guide still render correctly at `390x844` and `1440x900`.
- WCAG AA contrast checks still pass for body text, muted labels, controls, focus rings, and line-guide states.
- No Book Store, Audiobooks nav, login, profile, cloud upload, or backend scope is introduced.

## Current Implementation Status

- Active app CSS is split into `tokens.css`, `themes.css`, `base.css`, `layout.css`, `primitives.css`, and feature CSS files for Home, Library, Search, and Reader.
- `src/styles/app.css` is an import manifest.
- `src/ui/` contains the shared primitive layer used by the active screens.
- `npm run check:css-values` is strict for active app files and currently reports `0` hardcoded value references.
- `npm run check:css-values:report` includes legacy/non-active CSS and currently reports the remaining legacy baseline separately.
- Legacy baseline is concentrated in `src/features/gatekeeper/gatekeeper.css` and `src/features/reader/styles/main.css`.
