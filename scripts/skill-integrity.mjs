import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const outside = (root, path) => {
  const local = relative(root, path);
  return local === '..' || local.startsWith('..' + sep) || isAbsolute(local);
};

// Follow the runtime documentation graph, including links inside references.
export function inspectSkillReferences(skillRoot) {
  const failures = [];
  const root = realpathSync(skillRoot);
  const pending = [join(root, 'SKILL.md')];
  const visited = new Set();
  while (pending.length) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    const text = readFileSync(path, 'utf8');
    for (const [, raw] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|mailto:|#)/i.test(raw)) continue;
      const pointer = raw.split('#')[0];
      const target = resolve(dirname(path), pointer);
      if (outside(root, target)) {
        failures.push(`reference escapes skill: ${pointer}`);
      } else if (!existsSync(target) || !statSync(target).isFile()) {
        failures.push(`missing reference: ${pointer} (from ${relative(root, path)})`);
      } else if (outside(root, realpathSync(target))) {
        failures.push(`reference escapes skill through symlink: ${pointer}`);
      } else if (target.endsWith('.md')) {
        pending.push(realpathSync(target));
      }
    }
  }
  return failures;
}

const forbiddenDirectories = new Set(['.zcode', 'node_modules', 'dist', 'build']);
const forbidden = (path) => {
  const parts = path.split('/');
  return parts.some((part) => forbiddenDirectories.has(part)) ||
    ['src', 'assets', 'vendor'].includes(parts[0]) ||
    (parts[0] === '.agents' && parts[1] === 'skills');
};

// Git ignores local-only artifacts, but a force-added ignored file must still fail.
// A source archive has no index or ignore contract, so inspect its actual contents.
export function inspectRepositoryBoundary(root) {
  const options = { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 };
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], options);
  if (top.status === 0 && relative(realpathSync(root), realpathSync(top.stdout.trim())) === '') {
    const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], options);
    if (files.status !== 0) return ['could not inspect Git repository boundary'];
    return [...new Set(files.stdout.split('\0').filter(Boolean))]
      .filter(forbidden).map((path) => `forbidden repository path: ${path}`);
  }
  const failures = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const path = join(directory, entry.name);
      const local = relative(root, path).split(sep).join('/');
      if (forbidden(local)) failures.push(`forbidden archive path: ${local}`);
      else if (entry.isDirectory()) walk(path);
    }
  };
  walk(root);
  return failures;
}
