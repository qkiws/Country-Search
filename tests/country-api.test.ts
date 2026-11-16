import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from '../src/country-api.js';
import { mapCountryResponse } from '../src/country-mapper.js';
import type { RawCountry } from '../src/country-types.js';

const finland: RawCountry = {
  name: 'Finland',
  flag: '🇫🇮',
  capital: 'Helsinki',
  region: 'Europe',
  population: 5_530_719,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchCountries', () => {
  it('requests the encoded query and maps the returned countries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([finland]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;

    await expect(searchCountries('New Zealand', signal)).resolves.toEqual([
      mapCountryResponse(finland),
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://countries.dev/name/New%20Zealand');
  });

  it('treats a 404 response as an empty result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(searchCountries('no-such-country', new AbortController().signal)).resolves.toEqual(
      [],
    );
  });

  it('throws HttpError for other unsuccessful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(searchCountries('Finland', new AbortController().signal)).rejects.toMatchObject({
      name: 'HttpError',
      status: 503,
    });
  });

  it('deduplicates requests and does not cancel shared work for another caller', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = searchCountries('Iceland', firstController.signal);
    const second = searchCountries('Iceland', secondController.signal);

    firstController.abort();
    resolveResponse?.(
      new Response(JSON.stringify([{ ...finland, name: 'Iceland' }]), { status: 200 }),
    );

    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    await expect(second).resolves.toMatchObject([{ name: 'Iceland' }]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('serves a completed query from cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([finland]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await searchCountries('Finland', new AbortController().signal);
    await searchCountries('Finland', new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
