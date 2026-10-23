import {
  escapeHtml,
  sanitizeSingleLine,
  sanitizeText,
} from './sanitize.utils.js';

describe('sanitizeText', () => {
  it('removes html tags', () => {
    expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text');
  });

  it('removes html comments', () => {
    expect(sanitizeText('hello <!-- hidden --> world')).toBe('hello world');
  });

  it('removes control characters', () => {
    expect(sanitizeText('a\u0007b\u0000c')).toBe('abc');
  });

  it('collapses repeated spaces', () => {
    expect(sanitizeText('too     many spaces')).toBe('too many spaces');
  });

  it('keeps single line breaks', () => {
    expect(sanitizeText('first\nsecond')).toBe('first\nsecond');
  });

  it('collapses more than two consecutive line breaks', () => {
    expect(sanitizeText('first\n\n\n\nsecond')).toBe('first\n\nsecond');
  });

  it('trims the result', () => {
    expect(sanitizeText('   padded   ')).toBe('padded');
  });

  it('normalises windows line endings', () => {
    expect(sanitizeText('first\r\nsecond')).toBe('first\nsecond');
  });
});

describe('sanitizeSingleLine', () => {
  it('turns line breaks into spaces', () => {
    expect(sanitizeSingleLine('first\nsecond')).toBe('first second');
  });

  it('removes markup', () => {
    expect(sanitizeSingleLine('<i>Ram</i> Bahadur')).toBe('Ram Bahadur');
  });
});

describe('escapeHtml', () => {
  it('escapes the html special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
