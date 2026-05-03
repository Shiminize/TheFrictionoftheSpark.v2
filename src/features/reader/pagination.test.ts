import { describe, expect, it } from 'vitest';
import { calculatePercent, estimateCharsPerPage, paginateHtml, paginateHtmlByHeight, stripHtml } from './pagination';

describe('reader pagination', () => {
  it('strips HTML to plain readable text', () => {
    expect(stripHtml('<p>Hello <strong>reader</strong>.</p>')).toBe('Hello reader.');
  });

  it('splits paragraph groups into stable page chunks', () => {
    const pages = paginateHtml('<p>First paragraph with some text.</p><p>Second paragraph with more text.</p>', 20);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].html).toContain('<p>');
  });

  it('estimates fewer characters when font size grows', () => {
    expect(estimateCharsPerPage(24, 1.72, 1)).toBeLessThan(estimateCharsPerPage(18, 1.72, 1));
  });

  it('estimates fewer characters for shorter mobile reading viewports', () => {
    const fullViewport = estimateCharsPerPage(18, 1.72, 1, { width: 390, height: 844 });
    const compactViewport = estimateCharsPerPage(18, 1.72, 1, { width: 390, height: 700 });

    expect(compactViewport).toBeLessThan(fullViewport);
  });

  it('splits page chunks by measured rendered height', () => {
    const measureElement = document.createElement('div');
    Object.defineProperty(measureElement, 'scrollHeight', {
      get() {
        return (measureElement.textContent || '').length;
      }
    });

    const pages = paginateHtmlByHeight('<p>Short.</p><p>This paragraph should move to the next measured page.</p>', measureElement, 24);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].plainText).toContain('Short.');
  });

  it('calculates bounded reading percent', () => {
    expect(calculatePercent(2, 1, 4, 10)).toBeGreaterThan(20);
    expect(calculatePercent(99, 0, 1, 10)).toBe(100);
  });
});
