import { ArrowLeft, ArrowRight, List, RotateCcw, RotateCw, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CSSProperties, MutableRefObject, PointerEvent } from 'react';
import type { LibraryItem, ReaderLocation, ReaderPreferences } from '../../app/types';
import { IconButton } from '../../ui';
import { LineGuideOverlay } from './LineGuideOverlay';
import { ReaderMenuSheet } from './ReaderMenuSheet';
import { calculatePercent, estimateCharsPerPage, paginateHtml, paginateHtmlByHeight } from './pagination';
import type { PageChunk, ReaderViewport } from './pagination';
import { ThemeSettingsSheet } from './ThemeSettingsSheet';

const LINE_GUIDE_MIN = 10;
const LINE_GUIDE_MAX = 78;
const CHROME_INITIAL_VISIBLE_MS = 2200;
const CHROME_REVEAL_VISIBLE_MS = 3500;
const READER_MOTION_RESET_MS = 340;
const PAGINATION_HEIGHT_BUFFER = 8;
const READER_CHROME_ICON_SIZE = 16;
const READER_MENU_ICON_SIZE = 16;

type ReaderTurnDirection = 'none' | 'next' | 'previous';

type ReaderViewTransition = {
  finished: Promise<void>;
  skipTransition: () => void;
};

type ReaderViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => ReaderViewTransition;
};

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
  const [readerChromeVisible, setReaderChromeVisible] = useState(true);
  const [readerTurnDirection, setReaderTurnDirection] = useState<ReaderTurnDirection>('none');
  const [readerMotionKey, setReaderMotionKey] = useState(0);
  const [readerViewport, setReaderViewport] = useState<ReaderViewport>(() => getReaderViewport());
  const [measuredPagination, setMeasuredPagination] = useState<{ signature: string; pages: PageChunk[] } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const chromeTimer = useRef<number | null>(null);
  const turnResetTimer = useRef<number | null>(null);
  const readerPageRef = useRef<HTMLElement | null>(null);
  const paginationMeasureRef = useRef<HTMLDivElement | null>(null);

  const chapter = item.content[Math.min(location.chapterIndex, item.content.length - 1)] || item.content[0];
  const charsPerPage = estimateCharsPerPage(preferences.fontSize, preferences.lineHeight, preferences.marginScale, readerViewport);
  const estimatedPages = useMemo(() => {
    if (preferences.pageTurnMode === 'scroll') {
      return [{ html: chapter.content, plainText: chapter.title }];
    }

    return paginateHtml(chapter.content, charsPerPage);
  }, [chapter, charsPerPage, preferences.pageTurnMode]);
  const paginationSignature = useMemo(
    () =>
      [
        chapter.content,
        preferences.pageTurnMode,
        preferences.fontSize,
        preferences.fontFamily,
        preferences.lineHeight,
        preferences.characterSpacing,
        preferences.wordSpacing,
        preferences.marginScale,
        preferences.boldText,
        preferences.justifyText,
        preferences.orientationLock,
        readerViewport.width,
        readerViewport.height
      ].join('|'),
    [
      chapter.content,
      preferences.boldText,
      preferences.characterSpacing,
      preferences.fontFamily,
      preferences.fontSize,
      preferences.justifyText,
      preferences.lineHeight,
      preferences.marginScale,
      preferences.orientationLock,
      preferences.pageTurnMode,
      preferences.wordSpacing,
      readerViewport.height,
      readerViewport.width
    ]
  );
  const measuredPages = measuredPagination?.signature === paginationSignature ? measuredPagination.pages : null;
  const pages = measuredPages || estimatedPages;

  const safePageIndex = Math.min(location.pageIndex, Math.max(0, pages.length - 1));
  const page = pages[safePageIndex] || pages[0];
  const isCover = location.chapterIndex === 0;
  const lineGuideAvailable = !isCover && item.type === 'book';
  const pagesLeft = Math.max(0, pages.length - safePageIndex - 1);
  const percent = calculatePercent(location.chapterIndex, safePageIndex, pages.length, item.content.length);
  const chromeExpanded = readerChromeVisible || menuOpen || settingsOpen;
  const readerShellClassName = [
    'reader-shell',
    `orientation-${preferences.orientationLock}`,
    `turn-${preferences.pageTurnMode}`,
    preferences.boldText ? 'reader-bold' : '',
    `font-${preferences.fontFamily}`,
    preferences.justifyText ? 'reader-justify' : '',
    chromeExpanded ? 'chrome-visible' : 'chrome-immersive'
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setReaderTurnDirection('none');
    }
  }, [initialLocation?.chapterIndex, initialLocation?.pageIndex]);

  useEffect(() => {
    return () => {
      clearChromeTimer(chromeTimer);
      if (turnResetTimer.current) {
        window.clearTimeout(turnResetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (menuOpen || settingsOpen) {
      clearChromeTimer(chromeTimer);
      setReaderChromeVisible(true);
      return;
    }

    revealReaderChrome(CHROME_INITIAL_VISIBLE_MS);
  }, [location.chapterIndex, safePageIndex, menuOpen, settingsOpen]);

  useEffect(() => {
    const updateReaderViewport = () => setReaderViewport(getReaderViewport());
    const visualViewport = window.visualViewport;

    window.addEventListener('resize', updateReaderViewport);
    window.addEventListener('orientationchange', updateReaderViewport);
    visualViewport?.addEventListener('resize', updateReaderViewport);
    visualViewport?.addEventListener('scroll', updateReaderViewport);

    return () => {
      window.removeEventListener('resize', updateReaderViewport);
      window.removeEventListener('orientationchange', updateReaderViewport);
      visualViewport?.removeEventListener('resize', updateReaderViewport);
      visualViewport?.removeEventListener('scroll', updateReaderViewport);
    };
  }, []);

  useEffect(() => {
    if (location.pageIndex !== safePageIndex) {
      setLocation((current) => ({ ...current, pageIndex: safePageIndex }));
    }
  }, [location.pageIndex, safePageIndex]);

  useLayoutEffect(() => {
    if (preferences.pageTurnMode === 'scroll') return;

    const pageElement = readerPageRef.current;
    const measureElement = paginationMeasureRef.current;
    if (!pageElement || !measureElement) return;

    const availableHeight = Math.max(1, pageElement.clientHeight - PAGINATION_HEIGHT_BUFFER);
    const measured = paginateHtmlByHeight(chapter.content, measureElement, availableHeight);

    setMeasuredPagination((current) => {
      if (current?.signature === paginationSignature && arePageChunksEqual(current.pages, measured)) {
        return current;
      }

      return { signature: paginationSignature, pages: measured };
    });
  }, [chapter.content, paginationSignature, preferences.pageTurnMode]);

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

  function navigateTo(next: ReaderLocation, recordHistory = true, explicitDirection?: ReaderTurnDirection) {
    const bounded = normalizeLocation(next, item.content.length);
    if (isSameLocation(location, bounded)) return;

    const direction = explicitDirection || getTurnDirection(location, bounded);
    const shouldAnimate = direction !== 'none' && preferences.pageTurnMode !== 'scroll' && !prefersReducedMotion();

    const updateLocation = () => {
      setReaderTurnDirection(shouldAnimate ? direction : 'none');
      setReaderMotionKey((key) => key + 1);

      if (recordHistory) {
        setBackStack((stack) => [...stack.slice(-24), location]);
        setForwardStack([]);
      }

      setLocation(bounded);
    };

    if (!shouldAnimate) {
      updateLocation();
      return;
    }

    runReaderViewTransition(updateLocation, direction, preferences.pageTurnMode, scheduleTurnReset);
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
    const direction = getTurnDirection(location, previous);
    setBackStack((stack) => stack.slice(0, -1));
    setForwardStack((stack) => [location, ...stack].slice(0, 24));
    runReaderViewTransition(
      () => {
        setReaderTurnDirection(preferences.pageTurnMode === 'scroll' || prefersReducedMotion() ? 'none' : direction);
        setReaderMotionKey((key) => key + 1);
        setLocation(previous);
      },
      direction,
      preferences.pageTurnMode,
      scheduleTurnReset
    );
  }

  function goForwardLocation() {
    const next = forwardStack[0];
    if (!next) return;
    const direction = getTurnDirection(location, next);
    setForwardStack((stack) => stack.slice(1));
    setBackStack((stack) => [...stack, location].slice(-24));
    runReaderViewTransition(
      () => {
        setReaderTurnDirection(preferences.pageTurnMode === 'scroll' || prefersReducedMotion() ? 'none' : direction);
        setReaderMotionKey((key) => key + 1);
        setLocation(next);
      },
      direction,
      preferences.pageTurnMode,
      scheduleTurnReset
    );
  }

  function scheduleTurnReset(delay = READER_MOTION_RESET_MS) {
    if (turnResetTimer.current) {
      window.clearTimeout(turnResetTimer.current);
    }

    turnResetTimer.current = window.setTimeout(() => {
      setReaderTurnDirection('none');
      turnResetTimer.current = null;
    }, delay);
  }

  function revealReaderChrome(delay = CHROME_REVEAL_VISIBLE_MS) {
    setReaderChromeVisible(true);
    scheduleChromeHide(delay);
  }

  function hideReaderChrome() {
    if (menuOpen || settingsOpen) return;
    clearChromeTimer(chromeTimer);
    setReaderChromeVisible(false);
  }

  function scheduleChromeHide(delay: number) {
    clearChromeTimer(chromeTimer);
    if (menuOpen || settingsOpen) return;

    chromeTimer.current = window.setTimeout(() => {
      setReaderChromeVisible(false);
      chromeTimer.current = null;
    }, delay);
  }

  function handleTap(event: PointerEvent<HTMLDivElement>) {
    if (Math.abs((event.clientX || 0) - (swipeStart.current?.x || event.clientX || 0)) > 24) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const isTopRevealZone = y < rect.height * 0.18;
    const isBottomRevealZone = y > rect.height * 0.82;

    if (isTopRevealZone || isBottomRevealZone) {
      revealReaderChrome();
      return;
    }

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
      return;
    }

    hideReaderChrome();
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
      className={readerShellClassName}
      data-color-palette={preferences.colorPalette}
      data-reader-theme={preferences.theme}
      style={readerStyle}
    >
      <header className="reader-topbar">
        {chromeExpanded && (
          <IconButton label="Go back to previous reading location" variant="filled" disabled={!backStack.length} onClick={goBackLocation}>
            <RotateCcw size={READER_CHROME_ICON_SIZE} />
          </IconButton>
        )}
        <div className="reader-position">
          <strong>{isCover ? item.title : chapter.title}</strong>
          {chromeExpanded && <span>{preferences.pageTurnMode === 'scroll' ? `${percent}% read` : `${pagesLeft} pages left in chapter`}</span>}
        </div>
        {chromeExpanded && (
          <div className="reader-top-actions">
            <button type="button" className="reader-desktop-menu-button" aria-label="Open reader menu" onClick={() => setMenuOpen(true)}>
              <List size={READER_MENU_ICON_SIZE} aria-hidden="true" />
              <span>Menu</span>
            </button>
            <IconButton label="Go forward to current reading location" variant="filled" disabled={!forwardStack.length} onClick={goForwardLocation}>
              <RotateCw size={READER_CHROME_ICON_SIZE} />
            </IconButton>
            <IconButton label="Close book" variant="filled" onClick={onClose}>
              <X size={READER_CHROME_ICON_SIZE} />
            </IconButton>
          </div>
        )}
      </header>

      <section
        className={isCover ? 'reader-stage cover-stage' : 'reader-stage'}
        onPointerDown={(event) => {
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={handlePointerUp}
      >
        <article
          ref={readerPageRef}
          key={`${location.chapterIndex}-${safePageIndex}-${readerMotionKey}`}
          className="reader-page"
          data-turn-direction={readerTurnDirection}
          aria-label={chapter.title}
          lang="en"
        >
          <div className="reader-page-inner" dangerouslySetInnerHTML={{ __html: page.html }} />
          {preferences.pageTurnMode !== 'scroll' && <div ref={paginationMeasureRef} className="reader-page-inner reader-pagination-measure" aria-hidden="true" />}
        </article>
        {lineGuideAvailable && <LineGuideOverlay preferences={preferences} onChange={onPreferencesChange} />}
      </section>

      {chromeExpanded && (
        <footer className="reader-footer">
          <IconButton label="Previous page" variant="filled" onClick={goPrevious} disabled={location.chapterIndex === 0 && safePageIndex === 0}>
            <ArrowLeft size={READER_CHROME_ICON_SIZE} />
          </IconButton>
          <div className="reader-page-count">
            {preferences.pageTurnMode === 'scroll' ? `${location.chapterIndex + 1} of ${item.content.length}` : `${safePageIndex + 1} of ${pages.length}`}
          </div>
          <IconButton label="Open reader menu" className="reader-mobile-menu-button" variant="filled" onClick={() => setMenuOpen(true)}>
            <List size={READER_MENU_ICON_SIZE} />
          </IconButton>
          <IconButton label="Next page" variant="filled" onClick={goNext} disabled={location.chapterIndex === item.content.length - 1 && safePageIndex === pages.length - 1}>
            <ArrowRight size={READER_CHROME_ICON_SIZE} />
          </IconButton>
        </footer>
      )}

      {menuOpen && (
        <ReaderMenuSheet
          chapters={item.content}
          currentChapterIndex={location.chapterIndex}
          percent={percent}
          preferences={preferences}
          onClose={() => setMenuOpen(false)}
          onOpenSettings={() => {
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

function getTurnDirection(current: ReaderLocation, next: ReaderLocation): ReaderTurnDirection {
  if (next.chapterIndex > current.chapterIndex) return 'next';
  if (next.chapterIndex < current.chapterIndex) return 'previous';
  if (next.pageIndex > current.pageIndex) return 'next';
  if (next.pageIndex < current.pageIndex) return 'previous';
  return 'none';
}

function isSameLocation(left: ReaderLocation, right: ReaderLocation) {
  return left.chapterIndex === right.chapterIndex && left.pageIndex === right.pageIndex;
}

function arePageChunksEqual(left: PageChunk[], right: PageChunk[]) {
  return left.length === right.length && left.every((page, index) => page.html === right[index]?.html);
}

function clearChromeTimer(timer: MutableRefObject<number | null>) {
  if (!timer.current) return;
  window.clearTimeout(timer.current);
  timer.current = null;
}

function clampLineGuidePosition(position: number): number {
  return Math.max(LINE_GUIDE_MIN, Math.min(LINE_GUIDE_MAX, position));
}

function runReaderViewTransition(updateLocation: () => void, direction: ReaderTurnDirection, mode: ReaderPreferences['pageTurnMode'], onFinished: (delay?: number) => void) {
  if (direction === 'none' || mode === 'scroll' || prefersReducedMotion()) {
    updateLocation();
    return;
  }

  const transitionDocument = document as ReaderViewTransitionDocument;
  if (!transitionDocument.startViewTransition) {
    updateLocation();
    onFinished();
    return;
  }

  const root = document.documentElement;
  root.dataset.readerTurnDirection = direction;
  root.dataset.readerTurnMode = mode;
  root.dataset.readerViewTransition = 'active';

  try {
    const transition = transitionDocument.startViewTransition(() => {
      flushSync(updateLocation);
    });

    transition.finished.finally(() => {
      clearReaderViewTransitionDataset();
      onFinished(0);
    });
  } catch {
    clearReaderViewTransitionDataset();
    updateLocation();
    onFinished();
  }
}

function clearReaderViewTransitionDataset() {
  delete document.documentElement.dataset.readerTurnDirection;
  delete document.documentElement.dataset.readerTurnMode;
  delete document.documentElement.dataset.readerViewTransition;
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReaderViewport(): ReaderViewport {
  const visualViewport = typeof window !== 'undefined' ? window.visualViewport : undefined;
  return {
    width: Math.round(visualViewport?.width || window.innerWidth),
    height: Math.round(visualViewport?.height || window.innerHeight)
  };
}
