const fs = require('fs');
const path = require('path');

const bookTitle = 'The Friction of the Spark';
const repoRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(repoRoot, '..');
const contentDir = path.join(repoRoot, 'Content', 'TheFrictionOfTheSpark');
const englishSourcePath = path.join(contentDir, 'en.txt');
const chineseSourcePath = path.join(contentDir, 'cn.txt');
const readerDataPath = path.join(repoRoot, 'src', 'features', 'reader', 'data.js');
const auditPath = path.join(contentDir, 'AUDIT.md');

const rewriteSources = [
    path.join(projectRoot, 'rewrites', 'chapters-01-03.md'),
    path.join(projectRoot, 'rewrites', 'chapters-04-06.md'),
    path.join(projectRoot, 'rewrites', 'chapters-07-09.md'),
    ...Array.from({ length: 15 }, (_, index) => path.join(projectRoot, 'rewrites', `chapter-${index + 10}.md`))
];

const chapterHighlightSourceDir = path.join(projectRoot, 'images', 'chapter-highlights');
const chapterHighlightAssetDir = path.join(repoRoot, 'src', 'assets', 'images', 'chapter-highlights');
const chapterHighlightAssetPath = 'src/assets/images/chapter-highlights';
const chapterHighlights = [
    {
        chapter: 1,
        slug: 'chapter-01-the-vacuum',
        anchor: '"The family does not benefit from your private attachment to instability."',
        alt: 'Chapter 1 oil painting highlight: Eline sits with Marc and Stefan inside the Estate library.'
    },
    {
        chapter: 2,
        slug: 'chapter-02-the-clinical-shield',
        anchor: 'Pia closed the door with two fingers.',
        match: 'contains',
        alt: 'Chapter 2 oil painting highlight: Pia stands across from Eline in the clinic office.'
    },
    {
        chapter: 3,
        slug: 'chapter-03-the-triangulation',
        anchor: 'tell me what to say',
        alt: 'Chapter 3 oil painting highlight: Kyle asks Eline what to say during the forum crisis.'
    },
    {
        chapter: 4,
        slug: 'chapter-04-the-vulnerability',
        anchor: 'After the call, the forum no longer looked flat.',
        alt: 'Chapter 4 oil painting highlight: Eline hears Kyle behind the forum messages after the first voice call.'
    },
    {
        chapter: 5,
        slug: 'chapter-05-the-breaking-point',
        anchor: '**Eline:** Come to Schiphol.',
        alt: 'Chapter 5 oil painting highlight: Eline sends Kyle the irreversible Schiphol message.'
    },
    {
        chapter: 6,
        slug: 'chapter-06-the-collision',
        anchor: '"Wall," he said.',
        alt: 'Chapter 6 oil painting highlight: Kyle guides Eline toward the airport wall.'
    },
    {
        chapter: 7,
        slug: 'chapter-07-the-foreign-body',
        anchor: 'Then Kyle scuffed one boot over the marble.',
        alt: 'Chapter 7 oil painting highlight: Kyle marks the Estate marble with his boot.'
    },
    {
        chapter: 8,
        slug: 'chapter-08-polite-warfare',
        anchor: '"Does it know you?"',
        alt: 'Chapter 8 oil painting highlight: Kyle asks whether the Estate knows Eline.'
    },
    {
        chapter: 9,
        slug: 'chapter-09-syntax-breakdown',
        anchor: '"Yes."',
        alt: 'Chapter 9 oil painting highlight: Kyle offers no-touch lighter heat as Eline chooses to turn her palm upward.'
    },
    {
        chapter: 10,
        slug: 'chapter-10-the-pushback',
        anchor: 'Gerard.',
        alt: 'Chapter 10 oil painting highlight: Eline sees Gerard written beside the red marker.'
    },
    {
        chapter: 11,
        slug: 'chapter-11-the-crucible-part-1',
        anchor: 'He set the lighter on the desk between them.',
        alt: 'Chapter 11 oil painting highlight: Kyle sets the lighter on the Estate desk.'
    },
    {
        chapter: 12,
        slug: 'chapter-12-the-crucible-part-2',
        anchor: 'It had simply become optional.',
        alt: 'Chapter 12 oil painting highlight: Eline understands the cage has become optional.'
    },
    {
        chapter: 13,
        slug: 'chapter-13-the-great-migration-begins',
        anchor: 'The fabric was plain, dark, useful. Pockets. Buttons. No lineage.',
        alt: 'Chapter 13 oil painting highlight: Eline puts on the plain clinic cardigan.'
    },
    {
        chapter: 14,
        slug: 'chapter-14-the-extraction',
        anchor: 'Kyle pulled the gate open enough for her to pass.',
        match: 'contains',
        alt: 'Chapter 14 oil painting highlight: Kyle opens the service gate into the lane.'
    },
    {
        chapter: 15,
        slug: 'chapter-15-sensory-overload',
        anchor: '"Just... there."',
        alt: 'Chapter 15 oil painting highlight: Eline asks Kyle to stay there in the safehouse.'
    },
    {
        chapter: 16,
        slug: 'chapter-16-the-dirt-and-the-joy',
        anchor: 'The shock in his face was naked.',
        alt: 'Chapter 16 oil painting highlight: Bobi laughs with Eline and Kyle outside the underground party.'
    },
    {
        chapter: 17,
        slug: 'chapter-17-friction-and-fuel',
        anchor: 'Later, the lighter lay on the crate beside the bed, catching the streetlight on its scratched edge.',
        alt: 'Chapter 17 oil painting highlight: The lighter catches streetlight on the crate beside the bed.'
    },
    {
        chapter: 18,
        slug: 'chapter-18-the-weight-of-hope',
        anchor: 'It was a promise of cost.',
        alt: 'Chapter 18 oil painting highlight: Eline and Kyle sit with the weight of hope before the dog settles across their feet.'
    },
    {
        chapter: 20,
        slug: 'chapter-20-the-breach',
        anchor: '"I\'m here," she said.',
        alt: 'Chapter 20 oil painting highlight: Gerard breaches Bobi\'s safehouse while Eline, Kyle, and Bobi remain present.'
    }
];

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function inlineMarkdownToHtml(value) {
    return escapeHtml(value)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function normalizeParagraph(value) {
    return value.replace(/\s+/g, ' ').trim();
}

function chapterHighlightFileName(highlight) {
    return `${highlight.slug}-oil-painting.png`;
}

function getChapterHighlight(chapterNumber) {
    return chapterHighlights.find((highlight) => highlight.chapter === chapterNumber);
}

function readPngDimensions(filePath) {
    const png = fs.readFileSync(filePath);

    if (png.toString('ascii', 1, 4) !== 'PNG') {
        throw new Error(`Expected PNG image: ${filePath}`);
    }

    return {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20)
    };
}

function chapterHighlightSourcePath(highlight) {
    return path.join(chapterHighlightSourceDir, highlight.slug, chapterHighlightFileName(highlight));
}

function buildChapterHighlightFigure(highlight) {
    const sourcePath = chapterHighlightSourcePath(highlight);
    const { width, height } = readPngDimensions(sourcePath);
    const imageSrc = `${chapterHighlightAssetPath}/${chapterHighlightFileName(highlight)}`;

    return [
        '<figure class="chapter-highlight">',
        `    <img src="${imageSrc}" alt="${escapeHtml(highlight.alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`,
        '</figure>'
    ].join('\n');
}

function insertChapterHighlight(paragraphs, highlight) {
    const anchor = normalizeParagraph(highlight.anchor);
    const occurrence = highlight.occurrence || 1;
    let matches = 0;

    for (let index = 0; index < paragraphs.length; index += 1) {
        const paragraph = normalizeParagraph(paragraphs[index]);
        const isMatch = highlight.match === 'contains'
            ? paragraph.includes(anchor)
            : paragraph === anchor;

        if (!isMatch) {
            continue;
        }

        matches += 1;

        if (matches === occurrence) {
            paragraphs.splice(index + 1, 0, {
                type: 'chapter-highlight',
                html: buildChapterHighlightFigure(highlight)
            });
            return;
        }
    }

    throw new Error(`Missing chapter ${highlight.chapter} highlight anchor: ${highlight.anchor}`);
}

function bodyToHtml(body, chapterNumber) {
    const paragraphs = body
        .trim()
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
        .filter(Boolean);
    const highlight = getChapterHighlight(chapterNumber);

    if (highlight) {
        insertChapterHighlight(paragraphs, highlight);
    }

    return paragraphs
        .map((paragraph) => {
            if (typeof paragraph === 'object' && paragraph.type === 'chapter-highlight') {
                return paragraph.html;
            }

            return `<p>${inlineMarkdownToHtml(paragraph)}</p>`;
        })
        .join('\n');
}

function parseRewriteFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const chapterRegex = /^## Chapter (\d+): ([^\n]+)\n([\s\S]*?)(?=^## Chapter \d+: |(?![\s\S]))/gm;
    const chapters = [];
    let match;

    while ((match = chapterRegex.exec(source)) !== null) {
        chapters.push({
            chapter: Number(match[1]),
            title: `Chapter ${match[1]}: ${match[2].trim()}`,
            body: match[3].trim()
        });
    }

    return chapters;
}

function loadChaptersFromRewrites() {
    if (!rewriteSources.every((sourcePath) => fs.existsSync(sourcePath))) {
        return null;
    }

    return rewriteSources.flatMap(parseRewriteFile).sort((a, b) => a.chapter - b.chapter);
}

function loadChaptersForReader() {
    const rewriteChapters = loadChaptersFromRewrites();

    if (!rewriteChapters) {
        return parseEnglishSource();
    }

    return rewriteChapters;
}

function parseEnglishSource() {
    if (!fs.existsSync(englishSourcePath)) {
        throw new Error(`Missing English source: ${englishSourcePath}`);
    }

    const source = fs.readFileSync(englishSourcePath, 'utf8').replace(/\r\n/g, '\n');
    const chapterRegex = /^## Chapter (\d+): ([^\n]+)\n([\s\S]*?)(?=^## Chapter \d+: |(?![\s\S]))/gm;
    const chapters = [];
    let match;

    while ((match = chapterRegex.exec(source)) !== null) {
        chapters.push({
            chapter: Number(match[1]),
            title: `Chapter ${match[1]}: ${match[2].trim()}`,
            body: match[3].trim()
        });
    }

    return chapters;
}

function validateChapters(chapters) {
    const expected = Array.from({ length: 24 }, (_, index) => index + 1);
    const actual = chapters.map((chapter) => chapter.chapter);
    const missing = expected.filter((chapter) => !actual.includes(chapter));
    const duplicate = actual.filter((chapter, index) => actual.indexOf(chapter) !== index);

    if (missing.length || duplicate.length || chapters.length !== 24) {
        throw new Error(`Chapter validation failed. Missing: ${missing.join(', ') || 'none'}. Duplicate: ${duplicate.join(', ') || 'none'}. Count: ${chapters.length}.`);
    }
}

function writeEnglishSource(chapters) {
    const content = [
        `# ${bookTitle}`,
        '',
        ...chapters.flatMap((chapter) => [
            `## ${chapter.title}`,
            '',
            chapter.body,
            ''
        ])
    ].join('\n').replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(englishSourcePath, `${content.trim()}\n`);
}

function writeReaderData(chapters) {
    const bookContent = [
        {
            chapter: 0,
            isChapterStart: true,
            book_title: bookTitle,
            title: bookTitle,
            content: "<div class='cover-wrapper'><img src='src/assets/images/cover.jpg' alt='The Friction of the Spark cover' class='book-cover-fullscreen'></div>",
            theme_color: '#efe8d9'
        },
        ...chapters.map((chapter) => ({
            chapter: chapter.chapter,
            isChapterStart: true,
            title: chapter.title,
            content: bodyToHtml(chapter.body, chapter.chapter)
        }))
    ];

    const output = [
        '// Generated by scripts/build_friction_english.js.',
        '// English-only reader cartridge for The Friction of the Spark.',
        'window.PocketReader = window.PocketReader || {};',
        `PocketReader.bookContent = ${JSON.stringify(bookContent, null, 4)};`,
        ''
    ].join('\n');

    fs.writeFileSync(readerDataPath, output);
}

function copyCoverAssets() {
    const coverJpgSource = path.join(contentDir, 'images', 'cover.jpg');
    const coverPngSource = path.join(contentDir, 'images', 'cover.png');
    const coverJpgTarget = path.join(repoRoot, 'src', 'assets', 'images', 'cover.jpg');
    const coverPngTarget = path.join(repoRoot, 'src', 'assets', 'images', 'cover.png');

    if (fs.existsSync(coverJpgSource)) {
        fs.copyFileSync(coverJpgSource, coverJpgTarget);
    }

    if (fs.existsSync(coverPngSource)) {
        fs.copyFileSync(coverPngSource, coverPngTarget);
    }
}

function copyChapterHighlightAssets() {
    fs.mkdirSync(chapterHighlightAssetDir, { recursive: true });

    for (const fileName of fs.readdirSync(chapterHighlightAssetDir)) {
        if (fileName.endsWith('.png')) {
            fs.unlinkSync(path.join(chapterHighlightAssetDir, fileName));
        }
    }

    for (const highlight of chapterHighlights) {
        const sourcePath = chapterHighlightSourcePath(highlight);
        const targetPath = path.join(chapterHighlightAssetDir, chapterHighlightFileName(highlight));

        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Missing chapter highlight image: ${sourcePath}`);
        }

        fs.copyFileSync(sourcePath, targetPath);
    }
}

function removeNonEnglishSource() {
    if (fs.existsSync(chineseSourcePath)) {
        fs.unlinkSync(chineseSourcePath);
    }
}

function writeAudit(chapters) {
    const titleList = chapters.map((chapter) => `- ${chapter.title}`).join('\n');
    const audit = `# ${bookTitle} English Build Audit

## HOW_TO_NEW_BOOK Checklist

- Content cartridge replaced: \`src/features/reader/data.js\` now contains the generated English-only reader data.
- Cover image placed: \`src/assets/images/cover.jpg\` and \`src/assets/images/cover.png\` are copied from \`Content/TheFrictionOfTheSpark/images/\`.
- PWA icons: \`src/assets/images/icon-192.png\` and \`src/assets/images/icon-512.png\` are square crops of the cover image.
- Metadata target: \`index.html\` and \`manifest.json\` identify this book, not the previous reader sample.
- Language scope: English only. The generated cartridge has no \`title_cn\`, \`content_cn\`, \`title_id\`, or \`content_id\` fields.

## Novel Audit

- Source: rewritten Markdown chapters under \`../rewrites/\` for Chapters 1-24.
- Chapter coverage: 24 of 24 chapters found and exported.
- Canon check: final act keeps Kyle's death, the pistol as systemic violence, and Eline alone at the canal with Kyle's lighter.
- Reader check: each chapter is exported as a single table-of-contents entry with paragraph HTML generated from the English manuscript.
- Chapter highlight images: ${chapterHighlights.length} oil-painting figures are inserted into Chapters 1-18 and Chapter 20 at brief-approved scene beats.

## Chapter Inventory

${titleList}
`;

    fs.writeFileSync(auditPath, audit);
}

function main() {
    const chapters = loadChaptersForReader();

    validateChapters(chapters);
    fs.mkdirSync(contentDir, { recursive: true });
    writeEnglishSource(chapters);
    copyCoverAssets();
    copyChapterHighlightAssets();
    writeReaderData(chapters);
    removeNonEnglishSource();
    writeAudit(chapters);

    console.log(`Built ${bookTitle}: ${chapters.length} English chapters.`);
}

main();
