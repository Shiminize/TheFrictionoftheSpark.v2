export interface PageChunk {
  html: string;
  plainText: string;
}

export interface ReaderViewport {
  width: number;
  height: number;
}

const BASE_CHARS_PER_PAGE = 760;
const BASE_READER_WIDTH = 390;
const BASE_READER_PAGE_HEIGHT = 648;
const READER_CHROME_HEIGHT = 196;
const MIN_VIEWPORT_FACTOR = 0.55;
const MAX_VIEWPORT_FACTOR = 1.08;
const TEXT_BLOCK_WEIGHT = 12;

export function stripHtml(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
}

export function paginateHtml(html: string, charsPerPage: number): PageChunk[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  const children = Array.from(container.children);

  if (children.length === 0) {
    const text = stripHtml(html);
    return [{ html, plainText: text }];
  }

  const pages: PageChunk[] = [];
  let currentHtml = '';
  let currentText = '';
  let currentWeight = 0;

  children.forEach((child) => {
    const childHtml = child.outerHTML;
    const childText = (child.textContent || '').replace(/\s+/g, ' ').trim();
    const weight = child.tagName.toLowerCase() === 'figure' ? 380 : childText.length + TEXT_BLOCK_WEIGHT;

    if (currentHtml && currentWeight + weight > charsPerPage) {
      pages.push({ html: currentHtml, plainText: currentText.trim() });
      currentHtml = '';
      currentText = '';
      currentWeight = 0;
    }

    currentHtml += childHtml;
    currentText += ` ${childText}`;
    currentWeight += weight;
  });

  if (currentHtml) {
    pages.push({ html: currentHtml, plainText: currentText.trim() });
  }

  return pages.length ? pages : [{ html, plainText: stripHtml(html) }];
}

export function paginateHtmlByHeight(html: string, measureElement: HTMLElement, maxHeight: number): PageChunk[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  const children = Array.from(container.children);

  if (children.length === 0 || maxHeight <= 0) {
    const text = stripHtml(html);
    return [{ html, plainText: text }];
  }

  const pages: PageChunk[] = [];
  let currentHtml = '';

  children.forEach((child) => {
    const childPages = splitOversizedBlock(child, measureElement, maxHeight);

    childPages.forEach((childHtml) => {
      if (!currentHtml) {
        currentHtml = childHtml;
        return;
      }

      const nextHtml = currentHtml + childHtml;
      if (htmlFits(measureElement, nextHtml, maxHeight)) {
        currentHtml = nextHtml;
        return;
      }

      pages.push(createPageChunk(currentHtml));
      currentHtml = childHtml;
    });
  });

  if (currentHtml) {
    pages.push(createPageChunk(currentHtml));
  }

  measureElement.innerHTML = '';
  return pages.length ? pages : [{ html, plainText: stripHtml(html) }];
}

export function estimateCharsPerPage(fontSize: number, lineHeight: number, marginScale: number, viewport?: ReaderViewport): number {
  const fontFactor = 18 / fontSize;
  const lineFactor = 1.72 / lineHeight;
  const marginFactor = 1 / Math.max(0.8, marginScale);
  const viewportFactor = viewport ? estimateViewportCapacity(viewport) : 1;
  return Math.round(BASE_CHARS_PER_PAGE * fontFactor * lineFactor * marginFactor * viewportFactor);
}

function estimateViewportCapacity(viewport: ReaderViewport): number {
  const readerWidthFactor = Math.min(1, Math.max(MIN_VIEWPORT_FACTOR, viewport.width / BASE_READER_WIDTH));
  const readerPageHeight = Math.max(1, viewport.height - READER_CHROME_HEIGHT);
  const readerHeightFactor = Math.min(MAX_VIEWPORT_FACTOR, Math.max(MIN_VIEWPORT_FACTOR, readerPageHeight / BASE_READER_PAGE_HEIGHT));
  return readerWidthFactor * readerHeightFactor;
}

export function calculatePercent(chapterIndex: number, pageIndex: number, pageCount: number, totalChapters: number): number {
  const safePageCount = Math.max(1, pageCount);
  const chapterProgress = chapterIndex + pageIndex / safePageCount;
  return Math.min(100, Math.max(0, Math.round((chapterProgress / Math.max(1, totalChapters - 1)) * 100)));
}

function splitOversizedBlock(child: Element, measureElement: HTMLElement, maxHeight: number): string[] {
  const childHtml = child.outerHTML;
  if (htmlFits(measureElement, childHtml, maxHeight)) {
    return [childHtml];
  }

  if (child.tagName.toLowerCase() !== 'p' || child.children.length > 0) {
    return [childHtml];
  }

  return splitParagraphByHeight(child, measureElement, maxHeight);
}

function splitParagraphByHeight(paragraph: Element, measureElement: HTMLElement, maxHeight: number): string[] {
  const text = (paragraph.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return [paragraph.outerHTML];
  }

  const sentenceChunks = splitTextBySegments(text, splitIntoSentences(text), paragraph, measureElement, maxHeight);
  return sentenceChunks.flatMap((chunkHtml) => {
    if (htmlFits(measureElement, chunkHtml, maxHeight)) {
      return [chunkHtml];
    }

    const chunkText = stripHtml(chunkHtml);
    return splitTextBySegments(chunkText, chunkText.split(/\s+/), paragraph, measureElement, maxHeight);
  });
}

function splitTextBySegments(text: string, segments: string[], source: Element, measureElement: HTMLElement, maxHeight: number): string[] {
  const pages: string[] = [];
  let currentText = '';
  const safeSegments = segments.length ? segments : [text];

  safeSegments.forEach((segment) => {
    const normalizedSegment = segment.replace(/\s+/g, ' ').trim();
    if (!normalizedSegment) return;

    const nextText = currentText ? `${currentText} ${normalizedSegment}` : normalizedSegment;
    const nextHtml = cloneElementWithText(source, nextText);

    if (!currentText || htmlFits(measureElement, nextHtml, maxHeight)) {
      currentText = nextText;
      return;
    }

    pages.push(cloneElementWithText(source, currentText));
    currentText = normalizedSegment;
  });

  if (currentText) {
    pages.push(cloneElementWithText(source, currentText));
  }

  return pages.length ? pages : [cloneElementWithText(source, text)];
}

function splitIntoSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [text];
}

function cloneElementWithText(source: Element, text: string): string {
  const clone = source.cloneNode(false) as Element;
  clone.textContent = text;
  return clone.outerHTML;
}

function htmlFits(measureElement: HTMLElement, html: string, maxHeight: number): boolean {
  measureElement.innerHTML = html;
  return measureElement.scrollHeight <= maxHeight;
}

function createPageChunk(html: string): PageChunk {
  return {
    html,
    plainText: stripHtml(html)
  };
}
