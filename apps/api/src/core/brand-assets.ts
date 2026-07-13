import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Absolute paths to brand PNGs shipped with the API package (unchanged logo artwork). */
export const brandAssets = {
  logoFull: join(apiRoot, 'assets/brand/logo-full.png'),
  logoMark: join(apiRoot, 'assets/brand/logo-mark.png'),
} as const;
