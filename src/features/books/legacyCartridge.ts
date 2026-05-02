import cartridgeSource from '../reader/data.js?raw';
import type { BookContent } from '../../app/types';

const imageModules = import.meta.glob('../../assets/images/**/*.{png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const imageUrlByLegacyPath = new Map(
  Object.entries(imageModules).map(([modulePath, url]) => {
    const legacyPath = `src/assets/images/${modulePath.split('../../assets/images/')[1]}`;
    return [legacyPath, url];
  })
);

interface LegacyWindow {
  PocketReader: {
    bookContent?: BookContent[];
  };
}

export function loadLegacyBookContent(source = cartridgeSource): BookContent[] {
  const legacyWindow: LegacyWindow = { PocketReader: {} };
  const pocketReader = legacyWindow.PocketReader;

  const execute = new Function(
    'window',
    'PocketReader',
    `${source}; return window.PocketReader.bookContent || PocketReader.bookContent || [];`
  ) as (windowRef: LegacyWindow, pocketRef: LegacyWindow['PocketReader']) => BookContent[];

  const content = execute(legacyWindow, pocketReader);

  return content.map((chapter, index) => ({
    ...chapter,
    chapter: typeof chapter.chapter === 'number' ? chapter.chapter : index,
    isChapterStart: Boolean(chapter.isChapterStart),
    title: chapter.title || `Chapter ${index}`,
    content: rewriteLegacyAssetPaths(chapter.content || ''),
    cover: chapter.cover ? assetUrlFor(chapter.cover) : chapter.cover
  }));
}

export const frictionBookContent = loadLegacyBookContent();

export function assetUrlFor(path: string): string {
  return imageUrlByLegacyPath.get(path.replace(/^\//, '')) || path;
}

function rewriteLegacyAssetPaths(html: string): string {
  return html.replace(/(["'])((?:\.\/)?src\/assets\/images\/[^"']+)\1/g, (match, quote: string, path: string) => {
    const normalized = path.replace(/^\.\//, '');
    return `${quote}${assetUrlFor(normalized)}${quote}`;
  });
}
