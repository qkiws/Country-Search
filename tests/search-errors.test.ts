import { describe, expect, it } from 'vitest';
import { classifySearchError, HttpError } from '../src/search-errors.js';

describe('search error classification', () => {
  it('distinguishes user cancellation, timeout, HTTP, and network failures', () => {
    expect(classifySearchError(new DOMException('Aborted', 'AbortError'))).toBe('abort');
    expect(classifySearchError(new DOMException('Timed out', 'TimeoutError'))).toBe('timeout');
    expect(classifySearchError(new HttpError(503))).toBe('http');
    expect(classifySearchError(new TypeError('Network unavailable'))).toBe('network');
  });
});
