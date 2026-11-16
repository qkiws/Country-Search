export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Country service returned HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type SearchErrorKind = 'abort' | 'timeout' | 'http' | 'network';

export function classifySearchError(error: unknown): SearchErrorKind {
  const name = getErrorName(error);
  if (name === 'AbortError') return 'abort';
  if (name === 'TimeoutError') return 'timeout';
  if (error instanceof HttpError) return 'http';
  return 'network';
}

function getErrorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('name' in error)) return undefined;
  return typeof error.name === 'string' ? error.name : undefined;
}
