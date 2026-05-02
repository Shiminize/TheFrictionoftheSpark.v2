import { ArrowLeft, ArrowRight, List, RotateCcw, RotateCw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { LibraryItem, ReaderLocation, ReaderPreferences } from '../../app/types';
import { IconButton } from '../../ui';
import { LineGuideOverlay } from './LineGuideOverlay';
import { ReaderMenuSheet } from './ReaderMenuSheet';
import { calculatePercent, estimateCharsPerPage, paginateHtml } from './pagination';
import { ThemeSettingsSheet } from './ThemeSettingsSheet';

const LINE_GUIDE_MIN = 10;
const LINE_GUIDE_MAX = 78;

interface ReaderScreenProps {
  item: LibraryItem;
  initialLocation?: ReaderLocation;
  preferences: ReaderPreferences;
  onClose: () => void;
  onProgressChange: (location: ReaderLocation, percent: number) => void;
  onPreferencesChange: (preferences: Partial<ReaderPreferences>) => void;
}

export function ReaderScreen({ item, initialLocation, preferences, onClose, onProgressChange, onPreferencesChange }: ReaderScreenProps) {
  const [location, setLocation] = useState<ReaderLocation>(initialLocation || { chapterIndex: 0, pageIndex: 0 });
  const [backStack, setBackStack] = useState<ReaderLocation[]>([]);
  const [forwardStack, setForwardStack] = useState<ReaderLocation[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const chapter = item.content[Math.min(location.chapterIndex, item.content.length - 1)] || item.content[0];
  const charsPerPage = estimateCharsPerPage(preferences.fontSize, preferences.lineHeight, preferences.marginScale);
  const pages = useMemo(() => {
    if (preferences.pageTurnMode === 'scroll') {
      return [{ html: chapter.content, plainText: chapter.title }];
    }

    return paginateHtml(chapter.content, charsPerPage);
  }, [chapter, charsPerPage, preferences.pageTurnMode]);

  const safePageIndex = Math.min(location.pageIndex, Math.max(0, pages.length - 1));
  const page = pages[safePageIndex] || pages[0];
  const isCover = location.chapterIndex === 0;
  const lineGuideAvailable = !isCover && item.type === 'book';
  const pagesLeft = Math.max(0, pages.length - safePageIndex - 1);
  const percent = calculatePercent(location.chapterIndex, safePageIndex, pages.length, item.content.length);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation?.chapterIndex, initialLocation?.pageIndex]);

  useEffect(() => {
    if (location.pageIndex !== safePageIndex) {
      setLocation((current) => ({ ...current, pageIndex: safePageIndex }));
    }
  }, [location.pageIndex, safePageIndex]);

  useEffect(() => {
    onProgressChange({ chapterIndex: location.chapterIndex, pageIndex: safePageIndex }, percent);
  }, [location.chapterIndex, onProgressChange, percent, safePageIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (menuOpen || settingsOpen) return;
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function navigateTo(next: ReaderLocation, recordHistory = true) {
    const bounded = normalizeLocation(next, item.content.length);
    if (recordHistory) {
      setBackStack((stack) => [...stack.slice(-24), location]);
      setForwardStack([]);
    }
    setLocation(bounded);
  }

  function goNext() {
    if (preferences.pageTurnMode !== 'scroll' && safePageIndex < pages.length - 1) {
      navigateTo({ chapterIndex: location.chapterIndex, pageIndex: safePageIndex + 1 });
      return;
    }

    if (location.chapterIndex < item.content.length - 1) {
      navigateTo({ chapterIndex: location.chapterIndex + 1, pageIndex: 0 });
    }
  }

  function goPrevious() {
    if (preferences.pageTurnMode !== 'scroll' && safePageIndex > 0) {
      navigateTo({ chapterIndex: location.chapterIndex, pageIndex: safePageIndex - 1 });
      return;
    }

    if (location.chapterIndex > 0) {
      navigateTo({ chapterIndex: location.chapterIndex - 1, pageIndex: 0 });
    }
  }

  function goBackLocation() {
    const previous = backStack[backStack.length - 1];
    if (!previous) return;
    setBackStack((stack) => stack.slice(0, -1));
    setForwardStack((stack) => [location, ...stack].slice(0, 24));
    setLocation(previous);
  }

  function goForwardLocation() {
    const next = forwardStack[0];
    if (!next) return;
    setForwardStack((stack) => stack.slice(1));
    setBackStack((stack) => [...stack, location].slice(-24));
    setLocation(next);
  }

  function handleTap(event: PointerEvent<HTMLDivElement>) {
    if (Math.abs((event.clientX || 0) - (swipeStart.current?.x || event.clientX || 0)) > 24) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (preferences.lineGuideEnabled) {
      onPreferencesChange({ lineGuidePosition: clampLineGuidePosition((y / rect.height) * 100) });
      return;
    }

    if (x < rect.width * 0.28) {
      if (preferences.bothMarginsAdvance) goNext();
      else goPrevious();
    }

    if (x > rect.width * 0.72) {
      goNext();
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!swipeStart.current) return;
    const dx = event.clientX - swipeStart.current.x;
    const dy = event.clientY - swipeStart.current.y;

    if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goNext();
      else goPrevious();
      swipeStart.current = null;
      return;
    }

    handleTap(event);
    swipeStart.current = null;
  }

  const readerStyle = {
    '--reader-font-size': `${preferences.fontSize}px`,
    '--reader-line-height': String(preferences.lineHeight),
    '--reader-character-spacing': `${preferences.characterSpacing}em`,
    '--reader-word-spacing': `${preferences.wordSpacing}em`,
    '--reader-margin-scale': String(preferences.marginScale),
    '--reader-brightness': String(preferences.brightness)
  } as CSSProperties;

  return (
    <main
      className={`reader-shell orientation-${preferences.orientationLock} turn-${preferences.pageTurnMode} ${preferences.boldText ? 'reader-bold' : ''} font-${preferences.fontFamily} ${preferences.justifyText ? 'reader-justify' : ''}`}
      data-color-palette={preferences.colorPalette}
      data-reader-theme={preferences.theme}
      style={readerStyle}
    >
      <header className="reader-topbar">
        <IconButton label="Go back to previous reading location" variant="filled" disabled={!backStack.length} onClick={goBackLocation}>
          <RotateCcw size={20} />
        </IconButton>
        <div className="reader-position">
          <strong>{isCover ? item.title : chapter.title}</strong>
          <span>{preferences.pageTurnMode === 'scroll' ? `${percent}% read` : `${pagesLeft} pages left in chapter`}</span>
        </div>
        <div className="reader-top-actions">
          <button type="button" className="reader-desktop-menu-button" aria-label="Open reader menu" onClick={() => setMenuOpen(true)}>
            <List size={18} aria-hidden="true" />
            <span>Menu</span>
          </button>
          <IconButton label="Go forward to current reading location" variant="filled" disabled={!forwardStack.length} onClick={goForwardLocation}>
            <RotateCw size={20} />
          </IconButton>
          <IconButton label="Close book" variant="filled" onClick={onClose}>
            <X size={22} />
          </IconButton>
        </div>
      </header>

      <section
        className={isCover ? 'reader-stage cover-stage' : 'reader-stage'}
        onPointerDown={(event) => {
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={handlePointerUp}
      >
        <article className="reader-page" aria-label={chapter.title} lang="en">
          <div className="reader-page-inner" dangerouslySetInnerHTML={{ __html: page.html }} />
        </article>
        {lineGuideAvailable && <LineGuideOverlay preferences={preferences} onChange={onPreferencesChange} />}
      </section>

      <footer className="reader-footer">
        <IconButton label="Previous page" variant="filled" onClick={goPrevious} disabled={location.chapterIndex === 0 && safePageIndex === 0}>
          <ArrowLeft size={20} />
        </IconButton>
        <div className="reader-page-count">
          {preferences.pageTurnMode === 'scroll' ? `${location.chapterIndex + 1} of ${item.content.length}` : `${safePageIndex + 1} of ${pages.length}`}
        </div>
        <IconButton label="Open reader menu" className="reader-mobile-menu-button" variant="filled" onClick={() => setMenuOpen(true)}>
          <List size={22} />
        </IconButton>
        <IconButton label="Next page" variant="filled" onClick={goNext} disabled={location.chapterIndex === item.content.length - 1 && safePageIndex === pages.length - 1}>
          <ArrowRight size={20} />
        </IconButton>
      </footer>

      {menuOpen && (
        <ReaderMenuSheet
          chapters={item.content}
          currentChapterIndex={location.chapterIndex}
          preferences={preferences}
          onClose={() => setMenuOpen(false)}
          onOpenSettings={() => {
            setMenuOpen(false);
            setSettingsOpen(true);
          }}
          onJumpToChapter={(chapterIndex) => navigateTo({ chapterIndex, pageIndex: 0 })}
          onCloseBook={onClose}
          onPreferencesChange={onPreferencesChange}
        />
      )}

      {settingsOpen && <ThemeSettingsSheet preferences={preferences} onChange={onPreferencesChange} onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}

function normalizeLocation(location: ReaderLocation, chapterCount: number): ReaderLocation {
  return {
    chapterIndex: Math.max(0, Math.min(chapterCount - 1, location.chapterIndex)),
    pageIndex: Math.max(0, location.pageIndex)
  };
}

function clampLineGuidePosition(position: number): number {
  return Math.max(LINE_GUIDE_MIN, Math.min(LINE_GUIDE_MAX, position));
}
