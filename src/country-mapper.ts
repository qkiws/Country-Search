import type { Country, RawCountry } from './country-types.js';

export function mapCountryResponse(raw: unknown): Country {
  if (!isRawCountry(raw)) {
    throw new TypeError('Country service returned an invalid country record');
  }

  const region = raw.region?.trim() || 'Region not listed';
  const capital = Array.isArray(raw.capital)
    ? raw.capital.filter(Boolean).join(', ')
    : raw.capital?.trim() || 'No capital listed';
  const description =
    region === 'Region not listed'
      ? `${raw.name} is a country.`
      : `${raw.name} is a country in ${region}.`;

  return {
    name: raw.name,
    flag: raw.flag ?? '',
    capital,
    region,
    population: raw.population ?? 0,
    description,
    area: raw.area ?? null,
    borders: raw.borders ?? [],
    languages: (raw.languages ?? [])
      .map((language) => language.name?.trim())
      .filter((name): name is string => Boolean(name)),
    currencies: (raw.currencies ?? [])
      .map((currency) => {
        const name = currency.name?.trim() || currency.code?.trim();
        if (!name) return '';
        const symbol = currency.symbol?.trim();
        return symbol ? `${name} (${symbol})` : name;
      })
      .filter(Boolean),
  };
}

function isRawCountry(value: unknown): value is RawCountry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.length > 0
  );
}
