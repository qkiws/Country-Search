import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/debounce.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('delays execution until calls stop for the configured interval', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 250);

    debounced('first');
    vi.advanceTimersByTime(200);
    debounced('latest');
    vi.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('latest');
  });

  it('can cancel a pending call', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 250);

    debounced('Finland');
    debounced.cancel();
    vi.advanceTimersByTime(250);

    expect(callback).not.toHaveBeenCalled();
  });
});
