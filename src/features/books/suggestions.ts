import type { AppState, LibraryItem, Suggestion } from '../../app/types';

export function buildSuggestions(items: LibraryItem[], state: AppState): Suggestion[] {
  return items
    .filter((item) => state.progress[item.id]?.status !== 'finished')
    .map((item) => {
      const progress = state.progress[item.id];
      const wantToRead = progress?.status === 'want-to-read';
      const recent = progress?.lastReadAt ? Date.parse(progress.lastReadAt) : 0;
      const readingBoost = progress?.status === 'reading' ? 40 : 0;
      const wantBoost = wantToRead ? 35 : 0;
      const typeBoost = item.type === 'book' ? 20 : 8;
      const recencyBoost = recent ? Math.min(20, Math.round((Date.now() - recent) / -86400000) + 20) : 0;
      const score = 25 + readingBoost + wantBoost + typeBoost + recencyBoost;

      return {
        itemId: item.id,
        title: item.title,
        reason: wantToRead
          ? 'Marked Want to Read'
          : progress?.status === 'reading'
            ? 'Ready to continue'
            : item.type === 'pdf'
              ? 'Reference waiting in your library'
              : 'Fits your current library',
        score
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}
