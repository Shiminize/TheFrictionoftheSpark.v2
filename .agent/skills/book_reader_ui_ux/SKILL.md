---
name: Book Reader UI UX
description: Use when designing or refactoring the Book Reader/Pocket Reader interface for easy long-form reading, mobile reader ergonomics, accessibility, themes, navigation, settings, and 2026 read-it-later market expectations.
---

# Book Reader UI UX Skill

Use this skill for any Book Reader UI/UX work where readability, mobile comfort, reader settings, accessibility, or read-it-later app positioning matters. Keep the interface quiet and useful: the reading surface is the product.

## Research Basis

Checked on 2026-04-29. Refresh online if the user asks for current market research again.

- Pocket shut down in 2025, so users now expect a reader to feel trustworthy: easy export/import, clear data ownership, offline access, and no lock-in.
- Readwise Reader, Instapaper, Matter, Raindrop, and similar alternatives set the current baseline: clean reader mode, saved library, import paths, highlights/notes, RSS/newsletters/files, search/filtering, dark mode, text-to-speech, and preference sync.
- 2026 mobile design trends favor low-stimulus UI, fully designed dark mode, adaptive/context-aware settings, accessibility-first components, ethical AI personalization, and reduced battery/data waste.
- WCAG 2.2 mobile guidance applies to mobile web/hybrid/native reader apps. Treat WCAG as the floor, then optimize for reading comfort.

Useful sources:

- Mozilla Pocket shutdown: https://support.mozilla.org/en-US/kb/future-of-pocket
- Readwise Reader feature baseline: https://docs.readwise.io/reader
- WCAG2Mobile: https://www.w3.org/TR/wcag2mobile-22/
- WCAG target size: https://w3c.github.io/wcag/understanding/target-size-minimum.html
- Android touch target guidance: https://support.google.com/accessibility/android/answer/7101858

## Repo Targets

In this repo, reader work usually belongs in:

- `index.html` for shell markup, metadata, controls, and script/style wiring.
- `src/shared/styles/themes.css` for tokens, themes, fonts, and color mappings.
- `src/features/reader/styles/main.css` for reading layout, controls, drawer, responsive behavior, and motion.
- `src/features/reader/logic.js` for chapter rendering, preferences, navigation, language switching, and localStorage persistence.

Prefer scoped edits in those files. Do not move architecture unless the feature truly needs it.

## Product Principles

1. Reading comes before decoration.
   - Hide or minimize chrome while reading.
   - Keep controls predictable and easy to reach.
   - Never add marketing-style hero sections, decorative cards, popups, or visual effects that compete with text.

2. User control beats clever defaults.
   - Persist font size, theme, language, chapter, and reading-mode choices.
   - Offer settings for font size, line height, margin width, theme, and language before adding novelty features.
   - AI summaries or recommendations must stay optional and never interrupt a chapter.

3. Trust is a reader feature.
   - Preserve progress locally.
   - Prefer exportable/high-integrity data for notes, highlights, and progress.
   - Be explicit when content is unavailable offline or when a generated summary is machine-made.

## Reading Surface

Set the reading view first, then fit UI around it.

- Body text default: `18px` on mobile/web reader, with user range roughly `16px` to `24px`.
- Line height: `1.55` to `1.8`; longer literary prose usually wants `1.65` to `1.8`.
- Text width: target `60` to `75` Latin characters per line on desktop, with responsive margins on mobile.
- Paragraph rhythm: `1.2em` to `1.6em` between paragraphs; avoid cramped blocks.
- Alignment: use left-aligned text for Latin scripts. Avoid `text-align: justify` unless hyphenation and language behavior have been tested.
- Word breaking: avoid `word-break: break-all` for prose. Use `overflow-wrap: anywhere` only for URLs, long tokens, or emergency containment.
- Fonts: pair a readable serif for prose with a neutral sans-serif for UI. Do not use thin body weights.
- Cover art can be immersive, but chapter text should not sit in a decorative card.

## Themes And Contrast

Build themes as design systems, not color swaps.

- Provide at least light, dark, and high-contrast-safe variants when possible.
- Check body text at WCAG AA minimum contrast (`4.5:1`) and prefer stronger contrast for sustained reading.
- Dark mode needs its own tuned tokens: text color, secondary text, borders, controls, focus, and shadows.
- Avoid one-note palettes. Antique paper can exist, but add neutral and high-contrast escape routes.
- Do not rely on color alone for active states; use border, weight, underline, shape, or icon changes.

## Controls And Navigation

Reader controls must be thumb-friendly and keyboard-friendly.

- Target comfortable touch areas: aim for `44px` to `48px` square for common controls. WCAG's minimum is lower, but reader controls are frequent actions.
- Bottom controls should not cover text. Reserve safe-area padding with `env(safe-area-inset-bottom)`.
- Use icon buttons for previous, next, settings, search, close, and playback, with `aria-label`.
- Preserve keyboard navigation for previous/next and ensure focus is visible.
- Drawer or modal settings must trap and restore focus only if implemented correctly; otherwise keep focus behavior simple and testable.
- Table of contents needs clear active chapter state and enough row height for touch.

## Settings Model

Expected reader settings:

- Theme: light, dark, high contrast, and optional sepia/antique.
- Typography: font size, optional font family, line height, and text width/margins.
- Language: use clear labels and keep active state obvious.
- Progress: current chapter, total chapters, and resume point.
- Optional advanced controls: search, highlights/notes, text-to-speech, reading timer, and import/export.

Keep settings compact. A settings drawer is for controls, not explanation text.

## 2026 Feature Priorities

When choosing what to build next, prioritize in this order:

1. Easier reading: typography, spacing, theme quality, progress recovery.
2. Better library trust: import/export, offline cache, search, stable metadata.
3. Annotation utility: highlights, notes, copy/share excerpt, export notes.
4. Listening support: text-to-speech with speed and chapter controls.
5. Adaptive help: optional summaries, smart resume, reading backlog cleanup.

Do not add AI or personalization before the base reading flow is excellent.

## Accessibility Checklist

Every reader UI change should pass:

- Text contrast: body and controls pass WCAG AA; high-contrast theme is stronger.
- Touch targets: frequent controls are at least `44px` to `48px` hit areas.
- Focus: keyboard focus is visible and not hidden behind fixed controls.
- Motion: respect `prefers-reduced-motion`; slide/page transitions can be disabled or simplified.
- Zoom: text can grow without horizontal scrolling or overlapping controls.
- Screen readers: buttons have names, chapter title is announced, drawer state is clear.
- Language: `lang` is correct at the document or content block level when switching EN/CN/ID/FR/RU.
- Safe areas: bottom controls and side drawer work on mobile viewport cutouts.

## Implementation Guardrails

- Prefer CSS variables in `themes.css`; do not hardcode theme colors deep in component CSS unless it is a one-off cover treatment.
- Keep layout dimensions stable so controls, progress labels, and buttons do not resize while reading.
- Use `localStorage` carefully for simple preferences; version stored data if adding complex notes/highlights.
- Sanitize or tightly control HTML content before injecting into `.innerHTML`.
- Avoid layout shifts: lazy-load images with stable dimensions and keep controls fixed or reserved.
- Remove debug `console.log` when finishing user-facing UI work.

## Validation Flow

Before calling reader UI work done:

1. Open `index.html` locally or through the dev server available for the repo.
2. Test mobile width around `390x844` and desktop around `1440x900`.
3. Verify previous/next, settings drawer, language switch, theme switch, font-size slider, TOC jump, and saved progress.
4. Check long English, Chinese, Indonesian, French, and Russian titles/content for overflow.
5. Inspect dark mode and high-contrast states if present.
6. Run any repo-available smoke/manual checks and report exactly what was verified.

## Done Standard

A reader UI change is done only when the text is comfortable to read, controls are easy to reach, settings persist, no visible overlap occurs on mobile, and the validation notes name the exact screens and interactions checked.
