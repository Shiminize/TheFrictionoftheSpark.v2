import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LibraryItem } from '../../app/types';
import { Field } from '../../ui';
import { searchBook } from '../reader/search';

interface SearchScreenProps {
  items: LibraryItem[];
  initialQuery?: string;
  onOpenItem: (itemId: string, chapterIndex?: number) => void;
}

export function SearchScreen({ items, initialQuery = '', onOpenItem }: SearchScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    return items.flatMap((item) =>
      searchBook(item.content, trimmed).map((result) => ({
        item,
        ...result
      }))
    );
  }, [items, query]);

  return (
    <main className="screen screen-search">
      <header className="screen-header">
        <div>
          <h1>Search</h1>
          <p>{results.length} results</p>
        </div>
      </header>

      <Field icon={<Search size={20} aria-hidden="true" />}>
        <input
          aria-label="Find books and text"
          name="global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a title, word, phrase, or page"
          autoFocus
        />
      </Field>

      <section className="search-results" aria-label="Search results">
        {results.map((result) => (
          <button
            key={`${result.item.id}-${result.chapterIndex}-${result.snippet}`}
            type="button"
            className="search-result"
            onClick={() => onOpenItem(result.item.id, result.chapterIndex)}
          >
            <span>{result.item.title}</span>
            <strong>{result.title}</strong>
            <small>{result.snippet}</small>
          </button>
        ))}
      </section>
    </main>
  );
}
