import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../src/country-mapper.js';
import type { RawCountry } from '../src/country-types.js';

const finland: RawCountry = {
  name: 'Finland',
  flag: '🇫🇮',
  capital: 'Helsinki',
  region: 'Europe',
  population: 5_530_719,
  area: 338_424,
  borders: ['NOR', 'SWE', 'RUS'],
  languages: [{ name: 'Finnish' }, { name: 'Swedish' }],
  currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
};

describe('mapCountryResponse', () => {
  it('maps API fields to the country card and detail model', () => {
    expect(mapCountryResponse(finland)).toEqual({
      name: 'Finland',
      flag: '🇫🇮',
      capital: 'Helsinki',
      region: 'Europe',
      population: 5_530_719,
      description: 'Finland is a country in Europe.',
      area: 338_424,
      borders: ['NOR', 'SWE', 'RUS'],
      languages: ['Finnish', 'Swedish'],
      currencies: ['Euro (€)'],
    });
  });

  it('uses safe defaults for optional API fields', () => {
    expect(mapCountryResponse({ name: 'Nowhere' })).toMatchObject({
      name: 'Nowhere',
      flag: '',
      capital: 'No capital listed',
      region: 'Region not listed',
      population: 0,
      area: null,
      borders: [],
      languages: [],
      currencies: [],
    });
  });
});
