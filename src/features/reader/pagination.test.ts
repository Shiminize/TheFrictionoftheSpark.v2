import { describe, expect, it } from 'vitest';
import { calculatePercent, estimateCharsPerPage, paginateHtml, stripHtml } from './pagination';

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

  it('calculates bounded reading percent', () => {
    expect(calculatePercent(2, 1, 4, 10)).toBeGreaterThan(20);
    expect(calculatePercent(99, 0, 1, 10)).toBe(100);
  });
});
