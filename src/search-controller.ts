import { classifySearchError, type SearchErrorKind } from './search-errors.js';
import { searchCountries } from './country-api.js';
import type { Country } from './country-types.js';
import { debounce } from './debounce.js';

export type SearchViewState =
  | { status: 'idle'; query: string }
  | { status: 'loading'; query: string }
  | { status: 'empty'; query: string }
  | { status: 'results'; query: string; countries: Country[] }
  | { status: 'error'; query: string; kind: Exclude<SearchErrorKind, 'abort'> };

type SearchFunction = (query: string, signal: AbortSignal) => Promise<Country[]>;

export class CountrySearchController {
  private readonly debouncedSearch: ReturnType<typeof debounce<[string]>>;
  private activeRequest: AbortController | undefined;
  private lastQuery = '';

  constructor(
    private readonly onStateChange: (state: SearchViewState) => void,
    delay = 300,
    private readonly timeoutMs = 10_000,
    private readonly search: SearchFunction = searchCountries,
  ) {
    this.debouncedSearch = debounce((query: string) => {
      void this.execute(query);
    }, delay);
  }

  onInput(value: string): void {
    this.lastQuery = value.trim();
    this.abortActiveRequest();

    if (!this.lastQuery) {
      this.debouncedSearch.cancel();
      this.onStateChange({ status: 'idle', query: '' });
      return;
    }

    this.onStateChange({ status: 'loading', query: this.lastQuery });
    this.debouncedSearch(this.lastQuery);
  }

  retry(): void {
    if (!this.lastQuery) return;
    this.debouncedSearch.cancel();
    this.abortActiveRequest();
    this.onStateChange({ status: 'loading', query: this.lastQuery });
    void this.execute(this.lastQuery);
  }

  destroy(): void {
    this.debouncedSearch.cancel();
    this.abortActiveRequest();
  }

  private async execute(query: string): Promise<void> {
    const requestController = new AbortController();
    this.activeRequest = requestController;
    const signal = AbortSignal.any([requestController.signal, AbortSignal.timeout(this.timeoutMs)]);

    try {
      const countries = await this.search(query, signal);
      if (this.activeRequest !== requestController) return;

      this.onStateChange(
        countries.length > 0 ? { status: 'results', query, countries } : { status: 'empty', query },
      );
    } catch (error: unknown) {
      if (this.activeRequest !== requestController) return;

      const kind = classifySearchError(error);
      if (kind === 'abort') {
        this.onStateChange({ status: 'idle', query });
      } else {
        this.onStateChange({ status: 'error', query, kind });
      }
    } finally {
      if (this.activeRequest === requestController) this.activeRequest = undefined;
    }
  }

  private abortActiveRequest(): void {
    this.activeRequest?.abort();
    this.activeRequest = undefined;
  }
}
