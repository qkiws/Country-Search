## Description

Describe the completed changes.

## Deployment

- Live URL:
- [ ] Confirmed the live deployment works.

## TDD commit order

- [ ] `debounce`: test commit precedes implementation.
- [ ] `searchCountries`: test commit precedes implementation.
- [ ] `mapCountryResponse`: test commit precedes implementation.
- [ ] Error classification: test commit precedes implementation.
- [ ] Request race test is a separate commit and its fetch mock aborts on `signal`.

## Behavior checklist

- [ ] Empty input clears results without sending a request.
- [ ] Loading state is visible while a request is pending.
- [ ] Fast typing never displays stale results; canceled requests are aborted.
- [ ] User cancellation is not displayed as an error.
- [ ] A 404 displays a friendly no-results state.
- [ ] Other errors provide a retry for the latest query.
- [ ] Selecting a country opens its details.

## Design

- [ ] [DESIGN.md](../blob/country-search/DESIGN.md) documents cancellation, debounce, complexity, and clean-code choices.
