import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'skills/shared/requirements-dialogue.md'), 'utf8');
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node scripts/sync-skill-references.mjs [--check|--write]');
  process.exitCode = 1;
} else {
  for (const name of ['ai-project-maintainer', 'ai-project-bootstrapper']) {
    const path = join(root, 'skills', name, 'references/requirements-dialogue.md');
    if (mode === '--write') writeFileSync(path, source);
    let current;
    try { current = readFileSync(path, 'utf8'); } catch { /* Report missing copies below. */ }
    if (current?.replaceAll('\r\n', '\n') !== source.replaceAll('\r\n', '\n')) {
      console.error(`FAIL ${name}: requirements copy missing or out of sync`);
      process.exitCode = 1;
    } else {
      console.log(`PASS ${name}: local requirements reference ${mode === '--write' ? 'synced' : 'matches source'}`);
    }
  }
}
