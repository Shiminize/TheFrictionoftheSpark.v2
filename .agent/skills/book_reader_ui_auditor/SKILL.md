---
name: Book Reader UI Auditor
description: Use when auditing the Book Reader/Pocket Reader UI for visual, accessibility, responsive layout, reader ergonomics, icon sizing, spacing, margin, contrast, settings-sheet, line-guide, and Apple Books-inspired reader violations.
---

# Book Reader UI Auditor Skill

Use this skill when the Book Reader UI needs an inspection, QA pass, redesign critique, or pre-release visual/accessibility review. The goal is not general taste feedback. The goal is to find concrete violations that make reading, navigation, settings, or Vercel web delivery worse.

## Research Basis

Checked online on 2026-05-03. Refresh these sources when the user asks for current design research again.

- Apple UI Design Dos and Don'ts: https://developer.apple.com/design/tips/
- WCAG 2.2 Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 Contrast Minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG 2.2 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- WCAG 2.2 Text Spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- W3C Visual Presentation for blocks of text: https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html
- Android/Material adaptive layout guidance: https://developer.android.com/codelabs/adaptive-material-guidance
- Android/Material adaptive navigation guidance: https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation

## Audit Principles

1. Reading surface first.
   - The page text is the product. Persistent chrome, menus, navigation, line guide, and settings sheets must never cover readable content unless the user intentionally opens them.
   - Page-turn zones must be generous but invisible. Do not add visible margin blocks that distract from prose.
   - Reader controls should be subtle at rest and obvious only when activated.

2. Touch targets must be reliable.
   - WCAG 2.2 AA requires pointer targets to be at least `24px` by `24px` or sufficiently spaced.
   - For frequent reader controls, use the stricter practical target: `44px` to `48px` minimum hit area.
   - Icons inside hit areas should usually be `18px` to `24px`. Oversized icons inside oversized circles are a visual violation even if the hit area passes.

3. Text must be readable before it is stylish.
   - Body copy should default around `17px` to `20px` on mobile readers and remain user-adjustable.
   - Long-form prose line height should sit around `1.55` to `1.8`.
   - Keep Latin prose lines under `80` characters and preferably around `60` to `75` characters on desktop.
   - Avoid full justification by default. If justification exists, users need an easy off switch.
   - The UI must tolerate larger user text, line spacing, character spacing, word spacing, and margins without overlap or horizontal reading scroll.

4. Contrast is a floor, not a mood.
   - Normal text must meet `4.5:1` against its background.
   - Large text and meaningful icons/control boundaries must meet `3:1`.
   - Muted labels, progress text, placeholder text, focus outlines, selected states, and disabled-looking controls are common failure points.
   - Line Guide dimming must preserve strong contrast for the active line.

5. Layout must adapt, not merely stretch.
   - Mobile can use bottom navigation for top-level destinations.
   - Desktop and wide tablet layouts should not keep a phone-sized floating bottom nav if it wastes vertical space or overlays content.
   - Large screens should recompose content into readable panes or rails while keeping book text at a controlled measure.
   - Use stable dimensions for covers, cards, sheets, icon buttons, progress labels, and menus to avoid layout shift.

6. Reader settings must feel native to the task.
   - On mobile, Themes & Settings should be a bottom sheet, not a side drawer.
   - Settings controls need clear labels or accessible names; icon-only buttons need `aria-label`.
   - Sliders must have visible labels, current values where useful, and enough contrast.
   - Settings changes must persist and immediately affect the reader.

7. Line Guide must focus, not obscure.
   - The active line must remain crisp and readable.
   - The dimmed page should still communicate context without becoming illegible noise.
   - Tap above/below, margin movement, and drag movement must avoid accidental page turns.
   - The Line Guide menu belongs near the line-guide controls and must not hide the active line.

8. Scope rules for this app.
   - Do not recommend Book Store, Audiobooks navigation, login, avatars, cloud upload, or profile UI for V1.
   - Home navigation should remain Home, Library, and Search/Find only.
   - Findings should prioritize app function over static mockup fidelity.

## What To Inspect

Inspect at least these surfaces:

- Home: continue card, goal ring, Top Picks, Want to Read, bottom navigation, empty/error states.
- Library: filters, cover grid/list, collection actions, touch targets, item naming, search entry points.
- Reader: page text, margins, progress labels, close/history/menu buttons, page-turn taps, swipe/keyboard behavior, safe areas.
- Reader menu: Search Book, Contents, Orientation Lock, Line Guide, Close Book.
- Themes & Settings: font controls, page-turn mode, brightness, theme cards, Customize controls, close control.
- Line Guide: active-line contrast, dimming levels, movement, menu placement, off control.
- Responsive states: mobile `390x844`, desktop `1440x900`, and at least one narrow-height or scrolled state.

## Severity Scale

- `P0`: Blocks app use or deployment: blank screen, broken route, build failure, unreadable reader, impossible navigation, persistent runtime crash.
- `P1`: Serious reading or accessibility issue: controls overlap text, unnamed critical buttons, insufficient text contrast, unsafe tap target, trapped menu, settings do not persist, line guide prevents reading.
- `P2`: Material quality issue: icons too large, phone chrome used on desktop, excessive empty space, weak hierarchy, awkward margins, cards/images crop badly, touch controls look crowded, visual state is ambiguous.
- `P3`: Polish issue: minor alignment drift, copy inconsistency, tiny rhythm mismatch, non-critical hover/focus polish, optional animation refinement.

## Audit Workflow

1. Protect the worktree.
   - Run `git status --short`.
   - Do not revert unrelated user changes.

2. Inspect implementation.
   - Read the relevant React components and CSS before making visual judgments.
   - Identify source files and line numbers for every code-backed finding.

3. Run or open the app.
   - Prefer the current Vite app locally if available.
   - If the deployed Vercel app is the target, inspect that URL and note that it was a live audit.

4. Capture responsive evidence.
   - Check mobile `390x844` and desktop `1440x900`.
   - Exercise Home, Library, Reader, Settings, Line Guide, Search, Contents, and Close.
   - Check console and failed network requests.

5. Validate accessibility basics.
   - Inspect accessible names for icon-only and image-only buttons.
   - Check focus visibility and keyboard page navigation.
   - Compute or estimate contrast for text, icons, borders, and focus indicators.

6. Report only actionable violations.
   - Lead with findings ordered by severity.
   - Include file and line references.
   - Explain the user impact and the concrete fix direction.
   - Keep recommendations inside V1 scope: no bookstore, no audiobook tab, no login/profile.

## Output Format

Use this structure:

```md
**Audit Scope**
Briefly name the app URL or local build, viewport sizes, and flows checked.

**Findings**
- [P1] Title
  Evidence: file path and line.
  Impact: user-facing problem.
  Fix direction: concrete UI/code correction.

**Passed Checks**
Short list of important surfaces that did not violate the skill.

**Open Risks**
Anything not verified, such as deployment preview or full screen-reader testing.
```

## Done Standard

The audit is done when it names the researched rules used, lists concrete violations with severity and file references, distinguishes real blockers from polish, and avoids recommending out-of-scope V1 features.
