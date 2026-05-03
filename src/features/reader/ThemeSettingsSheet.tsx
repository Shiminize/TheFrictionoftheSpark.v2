import { AlignJustify, Bold, ChevronDown, FileText, Minus, Palette, Plus, Sun, Type } from 'lucide-react';
import type { ColorPalette, ReaderPreferences, ReaderTheme } from '../../app/types';
import { Sheet } from '../../ui';

interface ThemeSettingsSheetProps {
  preferences: ReaderPreferences;
  onChange: (preferences: Partial<ReaderPreferences>) => void;
  onClose: () => void;
}

const themes: { value: ReaderTheme; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'paper', label: 'Paper' },
  { value: 'bold', label: 'Bold' },
  { value: 'calm', label: 'Calm' },
  { value: 'focus', label: 'Focus' }
];

const colorPalettes: { value: ColorPalette; label: string; description: string }[] = [
  { value: 'sage', label: 'Digital Sage', description: 'Soft library green' },
  { value: 'oxide', label: 'Sepia Oxide', description: 'Warm literary sepia' },
  { value: 'noir', label: 'Ink Pearl', description: 'Clean product neutral' },
  { value: 'rose', label: 'Rosewood', description: 'Manuscript warmth' },
  { value: 'dusk', label: 'Olive Dusk', description: 'Low-light reading' },
  { value: 'marine', label: 'Marine Mist', description: 'Cool study tone' }
];

const fontOptions: { value: ReaderPreferences['fontFamily']; label: string }[] = [
  { value: 'theme', label: 'Theme Default' },
  { value: 'literata', label: 'Literata' },
  { value: 'source-serif', label: 'Source Serif' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'palatino', label: 'Palatino' }
];

const SETTINGS_ICON_SIZE = 16;
const SETTINGS_TYPE_ICON_SIZE = 18;

export function ThemeSettingsSheet({ preferences, onChange, onClose }: ThemeSettingsSheetProps) {
  return (
    <Sheet title="Themes & Settings" titleId="theme-settings-title" className="settings-sheet" closeLabel="Close themes and settings" onClose={onClose}>
        <section className="settings-section" aria-labelledby="color-palette-heading">
          <div className="settings-section-label" id="color-palette-heading">
            <Palette size={SETTINGS_ICON_SIZE} aria-hidden="true" />
            <span>Color Palette</span>
          </div>
          <div className="palette-grid">
            {colorPalettes.map((palette) => (
              <button
                key={palette.value}
                type="button"
                aria-pressed={preferences.colorPalette === palette.value}
                className={preferences.colorPalette === palette.value ? `palette-card ${palette.value} active` : `palette-card ${palette.value}`}
                onClick={() => onChange({ colorPalette: palette.value })}
              >
                <span className="palette-swatch-row" aria-hidden="true">
                  <span className="palette-swatch app" />
                  <span className="palette-swatch action" />
                  <span className="palette-swatch reader" />
                </span>
                <strong>{palette.label}</strong>
                <small>{palette.description}</small>
              </button>
            ))}
          </div>
        </section>

        <div className="segmented-control" aria-label="Font size">
          <button type="button" aria-label="Decrease font size" onClick={() => onChange({ fontSize: Math.max(16, preferences.fontSize - 1) })}>
            <Minus size={SETTINGS_ICON_SIZE} aria-hidden="true" />
            <Type size={SETTINGS_ICON_SIZE} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Increase font size" onClick={() => onChange({ fontSize: Math.min(28, preferences.fontSize + 1) })}>
            <Plus size={SETTINGS_ICON_SIZE} aria-hidden="true" />
            <Type size={SETTINGS_TYPE_ICON_SIZE} aria-hidden="true" />
          </button>
        </div>

        <div className="setting-row">
          <Sun size={SETTINGS_ICON_SIZE} aria-hidden="true" />
          <input
            aria-label="Brightness"
            name="brightness"
            type="range"
            min="0.72"
            max="1.08"
            step="0.02"
            value={preferences.brightness}
            onChange={(event) => onChange({ brightness: Number(event.target.value) })}
          />
        </div>

        <div className="page-turn-row" aria-label="Page turn style">
          {[
            ['curl', 'Curl'],
            ['fade', 'Fast Fade'],
            ['scroll', 'Scroll']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={preferences.pageTurnMode === value ? 'page-turn-button active' : 'page-turn-button'}
              onClick={() => onChange({ pageTurnMode: value as ReaderPreferences['pageTurnMode'] })}
            >
              <FileText size={SETTINGS_ICON_SIZE} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <section className="settings-section" aria-labelledby="page-theme-heading">
          <div className="settings-section-label" id="page-theme-heading">
            <Type size={SETTINGS_ICON_SIZE} aria-hidden="true" />
            <span>Page Theme</span>
          </div>
          <div className="theme-grid">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                aria-pressed={preferences.theme === theme.value}
                className={preferences.theme === theme.value ? `theme-card ${theme.value} active` : `theme-card ${theme.value}`}
                onClick={() => onChange({ theme: theme.value })}
              >
                <span>Aa</span>
                <small>{theme.label}</small>
              </button>
            ))}
          </div>
        </section>

        <details className="customize-panel" open>
          <summary>
            <Type size={SETTINGS_ICON_SIZE} aria-hidden="true" />
            Customize
            <ChevronDown size={SETTINGS_ICON_SIZE} aria-hidden="true" />
          </summary>

          <div className="customize-grid">
            <label>
              Font
              <select name="font-family" value={preferences.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value as ReaderPreferences['fontFamily'] })}>
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className={preferences.boldText ? 'toggle-button active' : 'toggle-button'} onClick={() => onChange({ boldText: !preferences.boldText })}>
              <Bold size={SETTINGS_ICON_SIZE} aria-hidden="true" />
              Bold Text
            </button>

            <label>
              Line Spacing
              <input name="line-spacing" type="range" min="1.45" max="1.95" step="0.05" value={preferences.lineHeight} onChange={(event) => onChange({ lineHeight: Number(event.target.value) })} />
            </label>

            <label>
              Character Spacing
              <input name="character-spacing" type="range" min="0" max="0.08" step="0.01" value={preferences.characterSpacing} onChange={(event) => onChange({ characterSpacing: Number(event.target.value) })} />
            </label>

            <label>
              Word Spacing
              <input name="word-spacing" type="range" min="0" max="0.28" step="0.02" value={preferences.wordSpacing} onChange={(event) => onChange({ wordSpacing: Number(event.target.value) })} />
            </label>

            <label>
              Margins
              <input name="reader-margins" type="range" min="0.8" max="1.3" step="0.05" value={preferences.marginScale} onChange={(event) => onChange({ marginScale: Number(event.target.value) })} />
            </label>

            <button type="button" className={preferences.justifyText ? 'toggle-button active' : 'toggle-button'} onClick={() => onChange({ justifyText: !preferences.justifyText })}>
              <AlignJustify size={SETTINGS_ICON_SIZE} aria-hidden="true" />
              Justify Text
            </button>
          </div>
        </details>
    </Sheet>
  );
}
