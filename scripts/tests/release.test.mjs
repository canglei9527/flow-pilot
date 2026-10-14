import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertGitPreflight, retry } from '../release-git.mjs';
import { publishRelease } from '../release-github.mjs';
import { compareVersions, parseVersion, prepareReleaseMetadata, readReleaseMetadata, applyReleaseMetadata } from '../release-version.mjs';

function metadata() {
  return {
    version: '0.4.0',
    claudePlugin: { name: 'ai-maintenance-skills', version: '0.4.0' },
    codexPlugin: { name: 'ai-maintenance-skills', version: '0.4.0' },
    marketplace: { plugins: [{ name: 'ai-maintenance-skills', version: '0.4.0' }] },
    verifier: "const releaseVersion = '0.4.0';\n",
    changelog: '# 变更记录\n\n## 0.4.0 - 2026-08-06\n\n- Existing release.\n',
    readme: '# Project\n\n## 版本历史\n\n### v0.4.0 — 2026-08-06\n\nExisting history.\n',
    skills: {
      maintainer: '---\nname: ai-project-maintainer\nversion: "0.4.0"\ndescription: "Maintainer"\n---\n\n# Maintainer\n',
      bootstrapper: '---\nname: ai-project-bootstrapper\nversion: "0.4.0"\ndescription: "Bootstrapper"\n---\n\n# Bootstrapper\n'
    }
  };
}

test('parses and compares strict release versions', () => {
  assert.deepEqual(parseVersion('1.2.3').parts, [1, 2, 3]);
  assert.equal(compareVersions('0.5.0', '0.4.0') > 0, true);
  assert.throws(() => parseVersion('v0.5.0'), /Invalid release version/);
  assert.throws(() => parseVersion('01.2.3'), /Invalid release version/);
});

test('prepares all version metadata and changelog section', () => {
  const updates = prepareReleaseMetadata(metadata(), '0.5.0', 'Improve release flow\nAdd resume support', '2026-08-06');
  assert.match(updates['.claude-plugin/plugin.json'], /"version": "0\.5\.0"/);
  assert.match(updates['.codex-plugin/plugin.json'], /"version": "0\.5\.0"/);
  assert.match(updates['.claude-plugin/marketplace.json'], /"version": "0\.5\.0"/);
  assert.match(updates['scripts/verify-skill-repo.mjs'], /releaseVersion = '0\.5\.0'/);
  assert.match(updates['skills/ai-project-maintainer/SKILL.md'], /version: "0\.5\.0"/);
  assert.match(updates['skills/ai-project-bootstrapper/SKILL.md'], /version: "0\.5\.0"/);
  assert.match(updates['CHANGELOG.md'], /## 0\.5\.0 - 2026-08-06/);
  assert.match(updates['CHANGELOG.md'], /- Improve release flow\n- Add resume support/);
  assert.match(updates['docs/releases/v0.5.0.md'], /# v0\.5\.0/);
  assert.match(updates['docs/releases/v0.5.0.md'], /Improve release flow/);
  assert.throws(() => prepareReleaseMetadata(metadata(), '0.4.0', 'Noop', '2026-08-06'), /newer/);
});

test('preserves Skill text and rejects missing version metadata', () => {
  const input = metadata();
  input.skills.bootstrapper = input.skills.bootstrapper.replaceAll('\n', '\r\n');
  const updates = prepareReleaseMetadata(input, '0.5.0', 'Test', '2026-09-05');
  for (const [name, text] of Object.entries(input.skills)) {
    assert.equal(updates[`skills/ai-project-${name}/SKILL.md`], text.replace('0.4.0', '0.5.0'));
  }
  input.skills.maintainer = input.skills.maintainer.replace('version: "0.4.0"\n', '');
  assert.throws(() => prepareReleaseMetadata(input, '0.5.0', 'Test', '2026-09-05'), /version metadata is missing/);
});

test('prepends README version history without changing older content or line endings', () => {
  const input = metadata();
  input.readme = input.readme.replaceAll('\n', '\r\n');
  const updates = prepareReleaseMetadata(input, '0.5.0', 'Test', '2026-10-14');
  const entry = '### v0.5.0 — 2026-10-14\r\n\r\n[完整发布说明](docs/releases/v0.5.0.md)\r\n\r\n';
  assert.equal(updates['README.md'], input.readme.replace('## 版本历史\r\n\r\n', `## 版本历史\r\n\r\n${entry}`));
});

test('preserves structured Markdown in changelog and archived release notes', () => {
  const notes = '## Fixes\n\nAn explanation with two paragraphs.\n\n- A concrete fix.\n\n```sh\nnode scripts/verify-skill-repo.mjs\n```\n\n| Check | Result |\n|---|---|\n| Fixture | PASS |';
  const updates = prepareReleaseMetadata(metadata(), '0.5.0', notes, '2026-10-14');
  assert.ok(updates['CHANGELOG.md'].includes(`\n\n${notes}\n\n`));
  assert.ok(updates['docs/releases/v0.5.0.md'].includes(`\n\n${notes}\n\n`));
});

test('rejects missing or duplicate README history entries', () => {
  const input = metadata();
  input.readme = '# Project\n';
  assert.throws(() => prepareReleaseMetadata(input, '0.5.0', 'Test', '2026-10-14'), /README version history heading/);
  input.readme = metadata().readme + '\n### v0.5.0 — 2026-10-14\n';
  assert.throws(() => prepareReleaseMetadata(input, '0.5.0', 'Test', '2026-10-14'), /README already contains version/);
});

test('reads synchronized metadata and rejects Skill version drift', async () => {
  const root = await mkdtemp(join(tmpdir(), 'release-metadata-'));
  const updates = prepareReleaseMetadata(metadata(), '0.5.0', 'Test', '2026-09-05');
  for (const path of Object.keys(updates)) {
    await mkdir(join(root, path, '..'), { recursive: true });
  }
  await applyReleaseMetadata(root, updates);
  const saved = await readReleaseMetadata(root);
  assert.equal(saved.version, '0.5.0');
  assert.equal(saved.readme, updates['README.md']);
  const skillPath = 'skills/ai-project-maintainer/SKILL.md';
  await writeFile(join(root, skillPath), updates[skillPath].replace('0.5.0', '0.4.0'));
  await assert.rejects(() => readReleaseMetadata(root), /metadata disagrees/);
});

test('rejects unsafe Git release states', () => {
  const base = { clean: true, branch: 'main', expectedBranch: 'main', behind: 0, localTag: false, remoteTag: false };
  assert.doesNotThrow(() => assertGitPreflight(base, { resume: false }));
  assert.throws(() => assertGitPreflight({ ...base, clean: false }, { resume: false }), /Working tree/);
  assert.throws(() => assertGitPreflight({ ...base, branch: 'feature' }, { resume: false }), /must run on main/);
  assert.throws(() => assertGitPreflight({ ...base, localTag: true, remoteTag: true }, { resume: false }), /already exists/);
  assert.doesNotThrow(() => assertGitPreflight({ ...base, localTag: true, remoteTag: true }, { resume: true }));
});

test('retries transient operations with bounded attempts', async () => {
  let attempts = 0;
  const result = await retry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('temporary');
    return 'ok';
  }, { retries: 3, delayMs: 0 });
  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
  await assert.rejects(() => retry(() => { throw new Error('permanent'); }, { retries: 2, delayMs: 0 }), /permanent/);
});

test('reconciles an already-created GitHub release without creating another', async () => {
  const calls = [];
  const runner = async (command, args) => {
    calls.push([command, args]);
    return { ok: true, stdout: JSON.stringify({ tagName: 'v0.5.0', url: 'https://example/release' }), stderr: '' };
  };
  const result = await publishRelease(runner, {
    repository: 'owner/repo', tag: 'v0.5.0', title: 'Test', notesFile: 'notes.md', retries: 1, delayMs: 0
  });
  assert.equal(result.created, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'gh');
  assert.match(calls[0][1].join(' '), /release view v0\.5\.0/);
});

test('release notes fixture stays isolated from the repository', async () => {
  const root = await mkdtemp(join(tmpdir(), 'release-test-'));
  await mkdir(join(root, 'notes'), { recursive: true });
  const path = join(root, 'notes', 'release.md');
  await writeFile(path, '- test\n', 'utf8');
  assert.equal(await readFile(path, 'utf8'), '- test\n');
});
