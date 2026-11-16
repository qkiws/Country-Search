import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../src/search-errors.js';
import { CountrySearchController } from '../src/search-controller.js';
import type { SearchViewState } from '../src/search-controller.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('CountrySearchController retry', () => {
  it('retries the last trimmed query after a service error', async () => {
    vi.useFakeTimers();
    const search = vi.fn(() => Promise.reject(new HttpError(503)));
    const states: SearchViewState[] = [];
    const controller = new CountrySearchController(
      (state) => states.push(state),
      20,
      10_000,
      search,
    );

    controller.onInput('  New Zealand  ');
    await vi.advanceTimersByTimeAsync(20);
    await vi.waitFor(() => expect(states.at(-1)).toMatchObject({ status: 'error', kind: 'http' }));

    controller.retry();
    await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(2));

    expect(search.mock.calls.map(([query]) => query)).toEqual(['New Zealand', 'New Zealand']);
    expect(states.at(-1)).toMatchObject({ status: 'error', query: 'New Zealand', kind: 'http' });
    controller.destroy();
  });
});
