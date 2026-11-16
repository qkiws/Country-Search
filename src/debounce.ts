export type DebouncedFunction<Arguments extends unknown[]> = ((
  ...arguments_: Arguments
) => void) & {
  cancel: () => void;
};

export function debounce<Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay: number,
): DebouncedFunction<Arguments> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...arguments_: Arguments): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      callback(...arguments_);
    }, delay);
  }) as DebouncedFunction<Arguments>;

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
