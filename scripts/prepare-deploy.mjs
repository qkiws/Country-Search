import { cp, mkdir, rm } from 'node:fs/promises';

await rm('site', { recursive: true, force: true });
await mkdir('site', { recursive: true });
await Promise.all([
  cp('index.html', 'site/index.html'),
  cp('styles.css', 'site/styles.css'),
  cp('dist', 'site/dist', { recursive: true }),
]);
