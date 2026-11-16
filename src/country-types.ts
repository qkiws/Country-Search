export interface RawCountry {
  name: string;
  flag?: string;
  flags?: {
    svg?: string;
    png?: string;
  };
  capital?: string | string[] | null;
  region?: string | null;
  subregion?: string | null;
  population?: number | null;
  area?: number | null;
  borders?: string[] | null;
  languages?: Array<{ name?: string | null }> | null;
  currencies?: Array<{
    code?: string | null;
    name?: string | null;
    symbol?: string | null;
  }> | null;
  nativeName?: string | null;
}

export interface Country {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  description: string;
  area: number | null;
  borders: string[];
  languages: string[];
  currencies: string[];
}
