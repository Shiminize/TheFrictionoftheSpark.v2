import type { LibraryItem } from '../../app/types';
import { assetUrlFor, frictionBookContent } from './legacyCartridge';

export const packagedLibrary: LibraryItem[] = [
  {
    id: 'friction-of-the-spark',
    type: 'book',
    title: 'The Friction of the Spark',
    author: 'Shiminize',
    subtitle: 'Dark romantic suspense tragedy',
    cover: assetUrlFor('src/assets/images/cover.jpg'),
    description: 'Control, survival, grief, and the cost of choosing friction over silence.',
    section: 'Continue',
    tags: ['dark romantic suspense', 'tragedy', 'survival', 'finished manuscript'],
    totalChapters: frictionBookContent.length,
    content: frictionBookContent,
    initialStatus: 'reading'
  },
  {
    id: 'structural-audit-pdf',
    type: 'pdf',
    title: 'Structural Audit Notes',
    author: 'Project file',
    subtitle: 'PDF-style project reference',
    cover: assetUrlFor('src/assets/images/TheStructuralIntegrityofWalls.png'),
    description: 'A packaged reference item for the Library PDF collection.',
    section: 'PDFs',
    tags: ['pdf', 'reference', 'structure'],
    totalChapters: 1,
    content: [
      {
        chapter: 1,
        isChapterStart: true,
        title: 'Structural Audit Notes',
        content:
          '<p>This packaged reference item keeps the PDF collection functional in the no-upload V1 app.</p><p>Cloud uploads and imported documents are deferred until backend storage and privacy rules are defined.</p>'
      }
    ],
    initialStatus: 'want-to-read'
  },
  {
    id: 'sample-reader-entry',
    type: 'sample',
    title: 'Reader Sample',
    author: 'Pocket Reader',
    subtitle: 'Sample collection entry',
    cover: assetUrlFor('src/assets/images/TheSunriseHarvest.png'),
    description: 'A short packaged sample used to validate samples, suggestions, and custom collections.',
    section: 'Samples',
    tags: ['sample', 'library', 'reader'],
    totalChapters: 1,
    content: [
      {
        chapter: 1,
        isChapterStart: true,
        title: 'Reader Sample',
        content:
          '<p>This sample verifies that packaged samples can be filtered, opened, and tracked without adding a Book Store or account system.</p>'
      }
    ],
    initialStatus: 'new'
  }
];

export function getLibraryItem(itemId: string): LibraryItem | undefined {
  return packagedLibrary.find((item) => item.id === itemId);
}
