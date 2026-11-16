import { mapCountryResponse } from './country-mapper.js';
import type { Country } from './country-types.js';
import { HttpError } from './search-errors.js';

interface InFlightRequest {
  controller: AbortController;
  consumers: number;
  settled: boolean;
  promise: Promise<Country[]>;
}

const cache = new Map<string, Country[]>();
const inFlight = new Map<string, InFlightRequest>();
const CACHE_LIMIT = 50;

export function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  if (signal.aborted) return Promise.reject(getAbortReason(signal));

  const key = query.trim().toLocaleLowerCase();
  if (!key) return Promise.resolve([]);

  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  let request = inFlight.get(key);
  if (request?.controller.signal.aborted) {
    inFlight.delete(key);
    request = undefined;
  }

  if (!request) {
    const requestController = new AbortController();
    const entry: InFlightRequest = {
      controller: requestController,
      consumers: 0,
      settled: false,
      promise: Promise.resolve([]),
    };
    entry.promise = fetchCountries(query.trim(), requestController.signal)
      .then((countries) => {
        cacheCountryList(key, countries);
        return countries;
      })
      .finally(() => {
        entry.settled = true;
        if (inFlight.get(key) === entry) inFlight.delete(key);
      });
    inFlight.set(key, entry);
    request = entry;
  }

  return subscribeToRequest(request, signal);
}

function fetchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  return fetch(`https://countries.dev/name/${encodeURIComponent(query)}`, { signal }).then(
    async (response) => {
      if (response.status === 404) return [];
      if (!response.ok) throw new HttpError(response.status);

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new TypeError('Country service returned an invalid response');
      }

      return payload.map(mapCountryResponse);
    },
  );
}

function subscribeToRequest(request: InFlightRequest, signal: AbortSignal): Promise<Country[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(getAbortReason(signal));
      return;
    }

    request.consumers += 1;
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      signal.removeEventListener('abort', handleAbort);
      request.consumers -= 1;
      if (request.consumers === 0 && !request.settled) request.controller.abort();
    };
    const handleAbort = (): void => {
      release();
      reject(getAbortReason(signal));
    };

    signal.addEventListener('abort', handleAbort, { once: true });
    request.promise.then(
      (countries) => {
        release();
        resolve(countries);
      },
      (error: unknown) => {
        release();
        reject(error);
      },
    );
    if (signal.aborted) handleAbort();
  });
}

function cacheCountryList(key: string, countries: Country[]): void {
  if (cache.size >= CACHE_LIMIT && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, countries);
}

function getAbortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}
