#!/usr/bin/env node
/**
 * Builds workspace packages in dependency order so @learnova/* resolve from dist/.
 * Used by local builds and Vercel (API + web).
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const packages = [
  '@learnova/config',
  '@learnova/shared',
  '@learnova/auth',
  '@learnova/database',
];

if (!existsSync(resolve(root, 'package.json')) || !existsSync(resolve(root, 'packages'))) {
  console.error('Could not find monorepo root (expected packages/ next to scripts/).');
  process.exit(1);
}

for (const name of packages) {
  console.log(`→ building ${name}`);
  execSync(`npm run build -w ${name}`, { cwd: root, stdio: 'inherit', env: process.env });
}

console.log('✓ workspace packages built');
