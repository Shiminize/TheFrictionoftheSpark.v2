export interface PageChunk {
  html: string;
  plainText: string;
}

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

  children.forEach((child) => {
    const childHtml = child.outerHTML;
    const childText = (child.textContent || '').replace(/\s+/g, ' ').trim();
    const weight = child.tagName.toLowerCase() === 'figure' ? 380 : childText.length;

    if (currentHtml && currentText.length + weight > charsPerPage) {
      pages.push({ html: currentHtml, plainText: currentText.trim() });
      currentHtml = '';
      currentText = '';
    }

    currentHtml += childHtml;
    currentText += ` ${childText}`;
  });

  if (currentHtml) {
    pages.push({ html: currentHtml, plainText: currentText.trim() });
  }

  return pages.length ? pages : [{ html, plainText: stripHtml(html) }];
}

export function estimateCharsPerPage(fontSize: number, lineHeight: number, marginScale: number): number {
  const fontFactor = 18 / fontSize;
  const lineFactor = 1.72 / lineHeight;
  const marginFactor = 1 / Math.max(0.8, marginScale);
  return Math.round(760 * fontFactor * lineFactor * marginFactor);
}

export function calculatePercent(chapterIndex: number, pageIndex: number, pageCount: number, totalChapters: number): number {
  const safePageCount = Math.max(1, pageCount);
  const chapterProgress = chapterIndex + pageIndex / safePageCount;
  return Math.min(100, Math.max(0, Math.round((chapterProgress / Math.max(1, totalChapters - 1)) * 100)));
}
