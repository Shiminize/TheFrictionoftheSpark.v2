import { ChevronDown, ChevronUp, ListMinus } from 'lucide-react';
import { useState } from 'react';
import type { LineGuideDimming, ReaderPreferences } from '../../app/types';
import { IconButton } from '../../ui';

interface LineGuideOverlayProps {
  preferences: ReaderPreferences;
  onChange: (preferences: Partial<ReaderPreferences>) => void;
}

const dimmingOptions: { value: LineGuideDimming; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' }
];

const LINE_GUIDE_MIN = 10;
const LINE_GUIDE_MAX = 78;
const LINE_GUIDE_MENU_MAX = 54;

export function LineGuideOverlay({ preferences, onChange }: LineGuideOverlayProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!preferences.lineGuideEnabled) return null;

  const lineGuidePosition = clampLineGuidePosition(preferences.lineGuidePosition);

  function moveLineGuide(delta: number) {
    onChange({ lineGuidePosition: clampLineGuidePosition(lineGuidePosition + delta) });
  }

  function toggleMenu() {
    setMenuOpen((open) => !open);
    if (!menuOpen) {
      onChange({ lineGuidePosition: Math.min(LINE_GUIDE_MENU_MAX, lineGuidePosition) });
    }
  }

  return (
    <>
      <div className={`line-guide-layer dim-${preferences.lineGuideDimming}`}>
        <div
          className="line-guide-window"
          style={{ top: `${lineGuidePosition}%` }}
          role="slider"
          aria-label="Line guide position"
          aria-valuemin={LINE_GUIDE_MIN}
          aria-valuemax={LINE_GUIDE_MAX}
          aria-valuenow={Math.round(lineGuidePosition)}
          tabIndex={0}
          onPointerDown={(event) => {
            const target = event.currentTarget;
            target.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const rect = event.currentTarget.closest('.reader-stage')?.getBoundingClientRect();
            if (!rect) return;
            const next = ((event.clientY - rect.top) / rect.height) * 100;
            onChange({ lineGuidePosition: clampLineGuidePosition(next) });
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') moveLineGuide(-4);
            if (event.key === 'ArrowDown') moveLineGuide(4);
          }}
        />
      </div>

      <div
        className="line-guide-controls"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <IconButton label="Move line guide up" variant="filled" onClick={() => moveLineGuide(-5)}>
          <ChevronUp size={18} />
        </IconButton>
        <IconButton label="Line guide menu" variant="filled" onClick={toggleMenu}>
          <ListMinus size={18} />
        </IconButton>
        <IconButton label="Move line guide down" variant="filled" onClick={() => moveLineGuide(5)}>
          <ChevronDown size={18} />
        </IconButton>
      </div>

      {menuOpen && (
        <div
          className="line-guide-menu"
          role="dialog"
          aria-label="Line guide"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          <span>Background Dimming</span>
          {dimmingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={preferences.lineGuideDimming === option.value ? 'line-guide-option active' : 'line-guide-option'}
              onClick={() => onChange({ lineGuideDimming: option.value })}
            >
              {option.label}
            </button>
          ))}
          <button type="button" className="line-guide-off" onClick={() => onChange({ lineGuideEnabled: false })}>
            Turn Off Line Guide
          </button>
        </div>
      )}
    </>
  );
}

function clampLineGuidePosition(position: number): number {
  return Math.max(LINE_GUIDE_MIN, Math.min(LINE_GUIDE_MAX, position));
}
