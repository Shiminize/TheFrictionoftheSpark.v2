import type { BookContent } from '../../app/types';
import { stripHtml } from './pagination';

export interface BookSearchResult {
  chapterIndex: number;
  title: string;
  snippet: string;
}

export function searchBook(chapters: BookContent[], query: string): BookSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return chapters
    .map((chapter, chapterIndex) => {
      const text = stripHtml(chapter.content);
      const matchIndex = text.toLowerCase().indexOf(normalizedQuery);
      if (matchIndex === -1 && !chapter.title.toLowerCase().includes(normalizedQuery)) return null;

      const snippetStart = Math.max(0, matchIndex - 56);
      const snippet = matchIndex === -1 ? chapter.title : text.slice(snippetStart, matchIndex + normalizedQuery.length + 96);
      return {
        chapterIndex,
        title: chapter.title,
        snippet: snippet.trim()
      };
    })
    .filter((result): result is BookSearchResult => Boolean(result))
    .slice(0, 24);
}
