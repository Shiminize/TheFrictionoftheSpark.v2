import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppRoute, AppState, ReaderLocation, ReaderPreferences, ReadingStatus } from './app/types';
import { packagedLibrary } from './features/books/libraryData';
import { buildSuggestions } from './features/books/suggestions';
import { HomeScreen } from './features/home/HomeScreen';
import { LibraryScreen } from './features/library/LibraryScreen';
import { ReaderScreen } from './features/reader/ReaderScreen';
import { SearchScreen } from './features/search/SearchScreen';
import { loadAppState, saveAppState, setItemStatus, updateSystemCollections } from './features/storage/storageRepository';
import { Navigation } from './ui';

export function App() {
  const items = packagedLibrary;
  const [appState, setAppState] = useState<AppState>(() => loadAppState(items));
  const [route, setRoute] = useState<AppRoute>({ view: 'home' });
  const suggestions = useMemo(() => buildSuggestions(items, appState), [appState, items]);
  const activeReaderItemId = route.view === 'reader' ? route.itemId : undefined;

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    if (route.view !== 'reader') return;
    const interval = window.setInterval(() => {
      setAppState((current) => {
        const progress = current.progress[route.itemId];
        if (!progress) return current;
        const nextProgress = {
          ...current.progress,
          [route.itemId]: {
            ...progress,
            minutesReadToday: progress.minutesReadToday + 1
          }
        };
        return {
          ...current,
          progress: nextProgress
        };
      });
    }, 60000);

    return () => window.clearInterval(interval);
  }, [route]);

  const openItem = useCallback(
    (itemId: string, chapterIndex?: number) => {
      const progress = appState.progress[itemId];
      setRoute({
        view: 'reader',
        itemId,
        location: {
          chapterIndex: chapterIndex ?? progress?.chapterIndex ?? 0,
          pageIndex: chapterIndex === undefined ? progress?.pageIndex ?? 0 : 0
        }
      });
    },
    [appState.progress]
  );

  const updateProgress = useCallback((itemId: string, location: ReaderLocation, percent: number) => {
    setAppState((current) => {
      const currentProgress = current.progress[itemId];
      if (!currentProgress) return current;

      const progress = {
        ...current.progress,
        [itemId]: {
          ...currentProgress,
          ...location,
          percent,
          status: percent >= 100 ? 'finished' : currentProgress.status === 'new' ? 'reading' : currentProgress.status,
          lastReadAt: new Date().toISOString(),
          finishedAt: percent >= 100 ? currentProgress.finishedAt || new Date().toISOString() : currentProgress.finishedAt
        }
      };

      return {
        ...current,
        progress,
        collections: updateSystemCollections(current.collections, progress)
      };
    });
  }, []);

  const updateActiveReaderProgress = useCallback(
    (location: ReaderLocation, percent: number) => {
      if (!activeReaderItemId) return;
      updateProgress(activeReaderItemId, location, percent);
    },
    [activeReaderItemId, updateProgress]
  );

  const updatePreferences = useCallback((preferences: Partial<ReaderPreferences>) => {
    setAppState((current) => ({
      ...current,
      preferences: { ...current.preferences, ...preferences }
    }));
  }, []);

  const changeStatus = useCallback((itemId: string, status: ReadingStatus) => {
    setAppState((current) => setItemStatus(current, itemId, status));
  }, []);

  const createCollection = useCallback((name: string) => {
    setAppState((current) => {
      const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString(36)}`;
      if (current.collections.some((collection) => collection.id === id)) return current;
      return {
        ...current,
        collections: [...current.collections, { id, name, itemIds: [], system: false }]
      };
    });
  }, []);

  const addToCollection = useCallback((collectionId: string, itemId: string) => {
    setAppState((current) => ({
      ...current,
      collections: current.collections.map((collection) =>
        collection.id === collectionId && !collection.itemIds.includes(itemId)
          ? { ...collection, itemIds: [...collection.itemIds, itemId] }
          : collection
      )
    }));
  }, []);

  const removeFromCollection = useCallback((collectionId: string, itemId: string) => {
    setAppState((current) => ({
      ...current,
      collections: current.collections.map((collection) =>
        collection.id === collectionId ? { ...collection, itemIds: collection.itemIds.filter((candidate) => candidate !== itemId) } : collection
      )
    }));
  }, []);

  const activeView = route.view;

  if (route.view === 'reader') {
    const item = items.find((candidate) => candidate.id === route.itemId);
    if (!item) return null;

    return (
      <ReaderScreen
        key={item.id}
        item={item}
        initialLocation={route.location}
        preferences={appState.preferences}
        onClose={() => setRoute({ view: 'home' })}
        onProgressChange={updateActiveReaderProgress}
        onPreferencesChange={updatePreferences}
      />
    );
  }

  return (
    <div className="app-shell" data-color-palette={appState.preferences.colorPalette} data-reader-theme={appState.preferences.theme}>
      {route.view === 'home' && (
        <HomeScreen
          items={items}
          state={appState}
          suggestions={suggestions}
          onOpenItem={openItem}
          onNavigateLibrary={(collectionId) => setRoute({ view: 'library', collectionId })}
          onSetDailyGoal={(dailyMinutes) => setAppState((current) => ({ ...current, goal: { ...current.goal, dailyMinutes } }))}
        />
      )}

      {route.view === 'library' && (
        <LibraryScreen
          items={items}
          state={appState}
          initialCollectionId={route.collectionId}
          onOpenItem={openItem}
          onSetStatus={changeStatus}
          onCreateCollection={createCollection}
          onAddToCollection={addToCollection}
          onRemoveFromCollection={removeFromCollection}
        />
      )}

      {route.view === 'search' && <SearchScreen items={items} initialQuery={route.query} onOpenItem={openItem} />}

      <Navigation
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'library') setRoute({ view: 'library' });
          else if (view === 'search') setRoute({ view: 'search' });
          else setRoute({ view: 'home' });
        }}
      />
    </div>
  );
}
