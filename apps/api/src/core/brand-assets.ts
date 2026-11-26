import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Absolute paths to brand PNGs shipped with the API package (unchanged logo artwork). */
export const brandAssets = {
  logoFull: join(apiRoot, 'assets/brand/logo-full.png'),
  logoMark: join(apiRoot, 'assets/brand/logo-mark.png'),
  // Latin subsets from Fontsource (OFL); used by the certificate PDF.
  fontDisplay: join(apiRoot, 'assets/fonts/bricolage-grotesque-latin-600-normal.woff'),
  fontBody: join(apiRoot, 'assets/fonts/figtree-latin-400-normal.woff'),
  fontBodyBold: join(apiRoot, 'assets/fonts/figtree-latin-600-normal.woff'),
} as const;
