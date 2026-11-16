# Design notes

## Request cancellation and debounce

`CountrySearchController` in `src/search-controller.ts` aborts its active
`AbortController` synchronously on every input event. The network request starts
after a 300 ms debounce, but cancellation is deliberately not debounced: an
already-running request cannot render while the user is still typing. Each
request combines the user-input signal with `AbortSignal.timeout(10_000)` using
`AbortSignal.any`. User cancellation is ignored, while a `TimeoutError` is
reported as a recoverable error. A small active-request identity check prevents
a completed or rejected old operation from changing the current view; it
complements real transport cancellation and is not a substitute for it.

The 300 ms delay groups ordinary keystrokes into one request without making the
interface feel unresponsive. With no debounce, every keystroke creates a
request. A much longer delay makes short queries feel sluggish and delays
feedback even after typing has stopped.

## Complexity

`mapCountryResponse` performs one pass over the API record and its nested
languages, currencies, and borders. For a country with `L` language,
`C` currency, and `B` border entries, its time is `O(L + C + B)` and its
additional output space is `O(L + C + B)`. Mapping an API result containing
`N` countries takes `O(N + total nested entries)`.

The query cache and in-flight request table in `src/countries.ts` use `Map`,
whose lookup, insertion, and deletion are average `O(1)`. The completed cache
is capped at 50 entries; eviction is `O(1)` with insertion-order iteration.
Each in-flight query tracks subscribers. Aborting one subscriber does not abort
the shared network request while another subscriber remains; the request is
aborted when the final subscriber leaves.

## Clean-code decisions

- **Single responsibility:** `src/debounce.ts` handles timer reset/cancellation;
  `src/countries.ts` owns API validation, mapping, errors, cache, and request
  deduplication; `src/search-controller.ts` coordinates view states and request
  lifetime; `src/app.ts` owns DOM construction and rendering.
- **Pure transformation:** `mapCountryResponse` does not access the DOM or
  network, so its output is straightforward to test.
- **Explicit states and errors:** the discriminated `SearchViewState` union
  keeps idle, loading, empty, result, and error rendering exhaustive. Error
  classification distinguishes cancellation and timeout from HTTP/network
  errors.
- **Safe DOM updates:** dynamic API values are assigned with `textContent` and
  elements are created with DOM APIs; HTML strings are never injected.
- **Bounded resources:** the cache has a fixed maximum size, and request
  subscriptions and event listeners are released on completion or cancellation.
