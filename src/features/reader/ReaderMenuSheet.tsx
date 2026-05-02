import { BookOpen, Check, List, Lock, RotateCw, Search, Settings, TextCursorInput } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BookContent, OrientationLock, ReaderPreferences } from '../../app/types';
import { Field, Sheet } from '../../ui';
import { searchBook } from './search';

interface ReaderMenuSheetProps {
  chapters: BookContent[];
  currentChapterIndex: number;
  preferences: ReaderPreferences;
  onClose: () => void;
  onOpenSettings: () => void;
  onJumpToChapter: (chapterIndex: number) => void;
  onCloseBook: () => void;
  onPreferencesChange: (preferences: Partial<ReaderPreferences>) => void;
}

const orientationOptions: { value: OrientationLock; label: string }[] = [
  { value: 'off', label: 'Unlocked' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' }
];

export function ReaderMenuSheet({
  chapters,
  currentChapterIndex,
  preferences,
  onClose,
  onOpenSettings,
  onJumpToChapter,
  onCloseBook,
  onPreferencesChange
}: ReaderMenuSheetProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchBook(chapters, query), [chapters, query]);

  return (
    <Sheet title="Menu" titleId="reader-menu-title" className="reader-menu-sheet" closeLabel="Close menu" onClose={onClose}>
        <div className="reader-menu-actions">
          <button type="button" onClick={onOpenSettings}>
            <Settings size={20} aria-hidden="true" />
            Themes & Settings
          </button>
          <button type="button" onClick={() => onPreferencesChange({ lineGuideEnabled: !preferences.lineGuideEnabled })}>
            <TextCursorInput size={20} aria-hidden="true" />
            {preferences.lineGuideEnabled ? 'Line Guide On' : 'Line Guide'}
          </button>
          <button type="button" onClick={() => onPreferencesChange({ bothMarginsAdvance: !preferences.bothMarginsAdvance })}>
            <RotateCw size={20} aria-hidden="true" />
            Both Margins {preferences.bothMarginsAdvance ? 'On' : 'Off'}
          </button>
        </div>

        <div className="orientation-row" aria-label="Orientation lock">
          <Lock size={18} aria-hidden="true" />
          {orientationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={preferences.orientationLock === option.value ? 'orientation-button active' : 'orientation-button'}
              onClick={() => onPreferencesChange({ orientationLock: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Field className="compact" icon={<Search size={18} aria-hidden="true" />}>
          <input aria-label="Search book" name="reader-menu-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search book" />
        </Field>

        {query.trim() ? (
          <div className="menu-list" aria-label="Search book results">
            {results.map((result) => (
              <button
                key={`${result.chapterIndex}-${result.snippet}`}
                type="button"
                className="menu-row"
                onClick={() => {
                  onJumpToChapter(result.chapterIndex);
                  onClose();
                }}
              >
                <Search size={18} aria-hidden="true" />
                <span>
                  <strong>{result.title}</strong>
                  <small>{result.snippet}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="menu-list" aria-label="Contents">
            {chapters.map((chapter, index) => (
              <button
                key={`${chapter.title}-${index}`}
                type="button"
                className={index === currentChapterIndex ? 'menu-row active' : 'menu-row'}
                onClick={() => {
                  onJumpToChapter(index);
                  onClose();
                }}
              >
                {index === currentChapterIndex ? <Check size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
                <span>
                  <strong>{chapter.title}</strong>
                  <small>{index === 0 ? 'Cover' : `Chapter ${index}`}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        <button type="button" className="close-book-button" onClick={onCloseBook}>
          <BookOpen size={20} aria-hidden="true" />
          Close Book
        </button>
    </Sheet>
  );
}
