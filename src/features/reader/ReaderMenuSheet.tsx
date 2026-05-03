import { ArrowLeft, BookOpen, Check, List, Lock, RotateCw, Search, Settings, TextCursorInput } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BookContent, OrientationLock, ReaderPreferences } from '../../app/types';
import { Field } from '../../ui';
import { cx } from '../../ui/classes';
import { searchBook } from './search';

interface ReaderMenuSheetProps {
  chapters: BookContent[];
  currentChapterIndex: number;
  percent: number;
  preferences: ReaderPreferences;
  onClose: () => void;
  onOpenSettings: () => void;
  onJumpToChapter: (chapterIndex: number) => void;
  onCloseBook: () => void;
  onPreferencesChange: (preferences: Partial<ReaderPreferences>) => void;
}

const QUICK_MENU_CLOSE_DELAY_MS = 190;
const QUICK_MENU_ICON_SIZE = 16;
const QUICK_MENU_ROW_ICON_SIZE = 18;

type ReaderMenuMode = 'main' | 'contents' | 'search';

const orientationOptions: { value: OrientationLock; label: string }[] = [
  { value: 'off', label: 'Unlocked' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' }
];

export function ReaderMenuSheet({
  chapters,
  currentChapterIndex,
  percent,
  preferences,
  onClose,
  onOpenSettings,
  onJumpToChapter,
  onCloseBook,
  onPreferencesChange
}: ReaderMenuSheetProps) {
  const [mode, setMode] = useState<ReaderMenuMode>('main');
  const [query, setQuery] = useState('');
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const results = useMemo(() => searchBook(chapters, query), [chapters, query]);
  const currentOrientation = orientationOptions.find((option) => option.value === preferences.orientationLock) || orientationOptions[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function requestClose(afterClose?: () => void) {
    if (closing) return;

    if (prefersReducedMotion()) {
      onClose();
      afterClose?.();
      return;
    }

    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onClose();
      afterClose?.();
    }, QUICK_MENU_CLOSE_DELAY_MS);
  }

  function cycleOrientationLock() {
    const currentIndex = orientationOptions.findIndex((option) => option.value === preferences.orientationLock);
    const next = orientationOptions[(currentIndex + 1) % orientationOptions.length] || orientationOptions[0];
    onPreferencesChange({ orientationLock: next.value });
  }

  function jumpToChapter(chapterIndex: number) {
    onJumpToChapter(chapterIndex);
    requestClose();
  }

  return (
    <div className={cx('reader-quick-menu-backdrop', closing && 'closing')} role="presentation" onMouseDown={() => requestClose()}>
      <section className={cx('reader-quick-menu', closing && 'closing')} role="dialog" aria-modal="true" aria-label="Reader menu" onMouseDown={(event) => event.stopPropagation()}>
        {mode === 'main' && (
          <>
            <div className="reader-quick-menu-stack">
              <button type="button" className="reader-quick-menu-row" onClick={() => setMode('contents')}>
                <span>Contents · {percent}%</span>
                <List size={QUICK_MENU_ROW_ICON_SIZE} aria-hidden="true" />
              </button>
              <button type="button" className="reader-quick-menu-row" onClick={() => setMode('search')}>
                <span>Search Book</span>
                <Search size={QUICK_MENU_ROW_ICON_SIZE} aria-hidden="true" />
              </button>
              <button type="button" className="reader-quick-menu-row" onClick={() => requestClose(onOpenSettings)}>
                <span>Themes & Settings</span>
                <Settings size={QUICK_MENU_ROW_ICON_SIZE} aria-hidden="true" />
              </button>
            </div>

            <div className="reader-quick-utility-row" aria-label="Reader utilities">
              <button
                type="button"
                className={preferences.lineGuideEnabled ? 'reader-quick-icon-button active' : 'reader-quick-icon-button'}
                aria-label={preferences.lineGuideEnabled ? 'Turn line guide off' : 'Turn line guide on'}
                title={preferences.lineGuideEnabled ? 'Line guide on' : 'Line guide'}
                onClick={() => onPreferencesChange({ lineGuideEnabled: !preferences.lineGuideEnabled })}
              >
                <TextCursorInput size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={preferences.bothMarginsAdvance ? 'reader-quick-icon-button active' : 'reader-quick-icon-button'}
                aria-label={preferences.bothMarginsAdvance ? 'Turn both margins advance off' : 'Turn both margins advance on'}
                title={preferences.bothMarginsAdvance ? 'Both margins on' : 'Both margins'}
                onClick={() => onPreferencesChange({ bothMarginsAdvance: !preferences.bothMarginsAdvance })}
              >
                <RotateCw size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
              <button type="button" className="reader-quick-icon-button" aria-label={`Orientation lock: ${currentOrientation.label}`} title={currentOrientation.label} onClick={cycleOrientationLock}>
                <Lock size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
              <button type="button" className="reader-quick-icon-button" aria-label="Close book" title="Close book" onClick={onCloseBook}>
                <BookOpen size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {mode === 'contents' && (
          <>
            <div className="reader-quick-panel-header">
              <button type="button" className="reader-quick-back-button" aria-label="Back to menu" onClick={() => setMode('main')}>
                <ArrowLeft size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
              <strong>Contents</strong>
            </div>
            <div className="reader-quick-scroll-list" aria-label="Contents">
              {chapters.map((chapter, index) => (
                <button key={`${chapter.title}-${index}`} type="button" className={index === currentChapterIndex ? 'reader-quick-list-row active' : 'reader-quick-list-row'} onClick={() => jumpToChapter(index)}>
                  {index === currentChapterIndex ? <Check size={QUICK_MENU_ICON_SIZE} aria-hidden="true" /> : <List size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />}
                  <span>
                    <strong>{chapter.title}</strong>
                    <small>{index === 0 ? 'Cover' : `Chapter ${index}`}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'search' && (
          <>
            <div className="reader-quick-panel-header">
              <button type="button" className="reader-quick-back-button" aria-label="Back to menu" onClick={() => setMode('main')}>
                <ArrowLeft size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
              </button>
              <strong>Search Book</strong>
            </div>
            <Field className="compact reader-quick-search" icon={<Search size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />}>
              <input aria-label="Search book" name="reader-menu-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search book" autoFocus />
            </Field>
            <div className="reader-quick-scroll-list" aria-label="Search book results">
              {query.trim() ? (
                results.map((result) => (
                  <button key={`${result.chapterIndex}-${result.snippet}`} type="button" className="reader-quick-list-row" onClick={() => jumpToChapter(result.chapterIndex)}>
                    <Search size={QUICK_MENU_ICON_SIZE} aria-hidden="true" />
                    <span>
                      <strong>{result.title}</strong>
                      <small>{result.snippet}</small>
                    </span>
                  </button>
                ))
              ) : (
                <p className="reader-quick-empty">Start typing to search this book.</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
