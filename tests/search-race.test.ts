import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountrySearchController } from '../src/search-controller.js';
import type { SearchViewState } from '../src/search-controller.js';

const responseFor = (name: string): Response =>
  new Response(
    JSON.stringify([
      {
        name,
        flag: '🏳️',
        capital: `${name} City`,
        region: 'Test Region',
        population: 1,
      },
    ]),
    { status: 200 },
  );

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CountrySearchController request races', () => {
  it('aborts the older fetch immediately and keeps only the latest result', async () => {
    vi.useFakeTimers();
    const requests: Array<{
      resolve: (response: Response) => void;
      signal: AbortSignal;
    }> = [];
    vi.stubGlobal(
      'fetch',
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error('The request must receive an AbortSignal'));
            return;
          }

          let settled = false;
          const rejectOnAbort = (): void => {
            if (!settled) {
              settled = true;
              reject(new DOMException('The request was aborted', 'AbortError'));
            }
          };
          signal.addEventListener('abort', rejectOnAbort, { once: true });
          requests.push({
            signal,
            resolve: (response) => {
              if (!settled) {
                settled = true;
                resolve(response);
              }
            },
          });
          if (signal.aborted) rejectOnAbort();
        }),
    );
    const states: SearchViewState[] = [];
    const controller = new CountrySearchController((state) => states.push(state), 20, 10_000);

    controller.onInput('Fin');
    await vi.advanceTimersByTimeAsync(20);
    expect(requests).toHaveLength(1);

    controller.onInput('Finland');
    expect(requests[0]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(20);
    expect(requests).toHaveLength(2);

    requests[1]?.resolve(responseFor('Finland'));
    await vi.waitFor(() =>
      expect(states.at(-1)).toMatchObject({
        status: 'results',
        query: 'Finland',
        countries: [{ name: 'Finland' }],
      }),
    );

    expect(states.some((state) => state.status === 'error')).toBe(false);
    controller.destroy();
  });
});
