import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skillNames = ['ai-project-maintainer', 'ai-project-bootstrapper'];

function temporaryRoot(t) {
  const root = mkdtempSync(join(tmpdir(), 'skill-integrity-'));
  t.after(() => {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    rmSync(root, { recursive: true, force: true });
  });
  return root;
}

function fixture(t) {
  const root = temporaryRoot(t);
  // Copy only repository inputs; never copy Git state, sessions, or user artifacts.
  const inputs = [
    'README.md', 'AGENTS.md', 'ARCHITECTURE.md', 'BUG_HISTORY.md',
    'AI修Bug提问模板.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'LICENSE', '.gitignore', '.gitattributes',
    '.github', '.claude-plugin', '.codex-plugin', 'ai-context',
    'docs', 'evals', 'examples', 'skills', 'scripts'
  ];
  for (const input of inputs) cpSync(join(repository, input), join(root, input), { recursive: true });
  return root;
}

function verify(root) {
  const result = spawnSync(process.execPath, ['scripts/verify-skill-repo.mjs'], { cwd: root, encoding: 'utf8' });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
}

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

test('clean source archive passes repository verification', (t) => {
  const result = verify(fixture(t));
  assert.equal(result.status, 0, result.output);
});

test('ignored local sessions are preserved but force-added sessions are rejected', (t) => {
  const root = fixture(t);
  git(root, 'init', '--quiet');
  write(root, '.zcode/session.json', '{"fixture":true}\n');
  write(root, 'node_modules/example/index.js', '// local dependency\n');
  const before = readFileSync(join(root, '.zcode/session.json'), 'utf8');
  const clean = verify(root);
  assert.equal(clean.status, 0, clean.output);
  assert.equal(readFileSync(join(root, '.zcode/session.json'), 'utf8'), before);
  git(root, 'add', '-f', '--', '.zcode/session.json');
  const tracked = verify(root);
  assert.equal(tracked.status, 1);
  assert.match(tracked.output, /forbidden.*\.zcode\/session\.json/);
  assert.equal(readFileSync(join(root, '.zcode/session.json'), 'utf8'), before);
});

test('archives without Git still reject local session directories', (t) => {
  const root = fixture(t);
  write(root, '.zcode/session.json', '{}');
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.output, /forbidden.*\.zcode/);
});

test('missing LICENSE is reported as a validation failure without a stack trace', (t) => {
  const root = fixture(t);
  rmSync(join(root, 'LICENSE'));
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.output, /FAIL missing LICENSE/);
  assert.doesNotMatch(result.output, /ENOENT|node:fs|at statSync/);
});

test('missing links in nested runtime references fail verification', (t) => {
  const root = fixture(t);
  const path = 'skills/ai-project-maintainer/references/fast-path.md';
  write(root, path, readFileSync(join(root, path), 'utf8') + '\n[Missing reference](missing-policy.md)\n');
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.output, /missing reference.*missing-policy\.md/);
});

test('existing sibling files cannot hide a non-self-contained runtime reference', (t) => {
  const root = fixture(t);
  const path = 'skills/ai-project-maintainer/SKILL.md';
  write(root, path, readFileSync(join(root, path), 'utf8') + '\n[Outside](../shared/requirements-dialogue.md)\n');
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.output, /reference escapes skill.*shared/);
});

test('runtime references cannot escape through a directory symlink', (t) => {
  const root = fixture(t);
  const external = temporaryRoot(t);
  write(external, 'policy.md', '# External fixture\n');
  symlinkSync(external, join(root, 'skills/ai-project-maintainer/references/external'), 'junction');
  const path = 'skills/ai-project-maintainer/SKILL.md';
  write(root, path, readFileSync(join(root, path), 'utf8') + '\n[External](references/external/policy.md)\n');
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.output, /reference escapes skill through symlink/);
});

test('Markdown CRLF is accepted without allowing trailing spaces', (t) => {
  const root = temporaryRoot(t);
  cpSync(join(repository, '.gitattributes'), join(root, '.gitattributes'));
  git(root, 'init', '--quiet');
  write(root, 'README.md', '# Original\r\n');
  git(root, 'add', '--', '.gitattributes', 'README.md');
  write(root, 'README.md', '# Changed\r\n');
  git(root, 'diff', '--check');
  write(root, 'README.md', '# Changed \r\n');
  const result = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /trailing whitespace/);
});

test('version drift is rejected even when both Skills agree with each other', (t) => {
  const root = fixture(t);
  for (const name of skillNames) {
    const path = `skills/${name}/SKILL.md`;
    write(root, path, readFileSync(join(root, path), 'utf8').replace(/^version:.*$/m, 'version: "99.0.0"'));
  }
  const result = verify(root);
  assert.equal(result.status, 1);
  for (const name of skillNames) assert.ok(result.output.includes(`${name}: frontmatter version mismatch`));
});

test('requirements drift fails without rewriting files, and explicit sync repairs both copies', (t) => {
  const root = fixture(t);
  const path = 'skills/ai-project-maintainer/references/requirements-dialogue.md';
  write(root, path, '# Outdated fixture\n');
  const check = spawnSync(process.execPath, ['scripts/sync-skill-references.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(check.status, 1, check.stdout + check.stderr);
  assert.equal(readFileSync(join(root, path), 'utf8'), '# Outdated fixture\n');
  const invalid = verify(root);
  assert.equal(invalid.status, 1);
  assert.match(invalid.output, /requirements copy missing or out of sync/);
  const sync = spawnSync(process.execPath, ['scripts/sync-skill-references.mjs', '--write'], { cwd: root, encoding: 'utf8' });
  assert.equal(sync.status, 0, sync.stdout + sync.stderr);
  const source = readFileSync(join(root, 'skills/shared/requirements-dialogue.md'), 'utf8');
  for (const name of skillNames) {
    assert.equal(readFileSync(join(root, `skills/${name}/references/requirements-dialogue.md`), 'utf8'), source);
  }
  const valid = verify(root);
  assert.equal(valid.status, 0, valid.output);
});

for (const name of skillNames) {
  test(`${name} keeps every runtime Markdown link after an isolated single-Skill copy`, (t) => {
    const installed = join(temporaryRoot(t), name);
    cpSync(join(repository, 'skills', name), installed, { recursive: true });
    const pending = [join(installed, 'SKILL.md')];
    const visited = new Set();
    while (pending.length) {
      const path = pending.pop();
      if (visited.has(path)) continue;
      visited.add(path);
      for (const [, link] of readFileSync(path, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
        if (/^(?:https?:|#)/i.test(link)) continue;
        const target = resolve(dirname(path), link.split('#')[0]);
        const local = relative(installed, target);
        assert.ok(local !== '..' && !local.startsWith('..' + sep) && !isAbsolute(local), `outside installed Skill: ${link}`);
        assert.ok(existsSync(target), `missing installed reference: ${link}`);
        if (target.endsWith('.md')) pending.push(target);
      }
    }
    assert.ok(visited.size > 1, 'runtime references were actually followed');
  });
}
