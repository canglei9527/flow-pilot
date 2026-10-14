#!/usr/bin/env node
import { readFile, rm, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  DEFAULT_BRANCH,
  DEFAULT_REMOTE,
  DEFAULT_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  RELEASE_FILES,
  REQUIRED_REPOSITORY,
  TAG_PREFIX,
  VERIFICATION_COMMANDS
} from './release-config.mjs';
import { applyReleaseMetadata, prepareReleaseMetadata, readReleaseMetadata } from './release-version.mjs';
import { assertGitPreflight, commitRelease, createAndPushTag, createRunner, inspectGit, pushBranch, runChecked } from './release-git.mjs';
import { assertGitHubAuth, publishRelease } from './release-github.mjs';

const VALUE_OPTIONS = new Map([
  ['--version', 'version'],
  ['--title', 'title'],
  ['--notes', 'notes'],
  ['--notes-file', 'notesfile'],
  ['--repo', 'repo'],
  ['--branch', 'branch'],
  ['--remote', 'remote'],
  ['--retries', 'retries'],
  ['--delay-ms', 'delayMs']
]);

function parseArgs(argv) {
  const options = { branch: DEFAULT_BRANCH, remote: DEFAULT_REMOTE, retries: DEFAULT_RETRIES, delayMs: DEFAULT_RETRY_DELAY_MS };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--publish' || argument === '--yes' || argument === '--resume') options[argument.slice(2)] = true;
    else if (VALUE_OPTIONS.has(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} requires a value`);
      options[VALUE_OPTIONS.get(argument)] = value;
    } else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  options.retries = Number(options.retries);
  options.delayMs = Number(options.delayMs);
  if (!Number.isInteger(options.retries) || options.retries < 1) throw new Error('--retries must be a positive integer');
  if (!Number.isInteger(options.delayMs) || options.delayMs < 0) throw new Error('--delay-ms must be a non-negative integer');
  return options;
}

function usage() {
  return `Usage: node scripts/release.mjs --version X.Y.Z --title "Release title" (--notes "line" | --notes-file file) [options]

Default: dry-run only. Use --publish to write metadata, verify, commit, push, tag, and create the GitHub Release.
Options: --yes --resume --repo owner/name --branch main --remote origin --retries 3 --delay-ms 1500`;
}

function githubRepository(remoteUrl) {
  const match = remoteUrl.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
  if (!match) throw new Error(`Cannot derive GitHub repository from remote URL: ${remoteUrl}`);
  const repo = match[1];
  if (repo !== REQUIRED_REPOSITORY) {
    throw new Error(
      `仓库校验失败！\n` +
      `  当前 remote: ${repo}\n` +
      `  要求发布到: ${REQUIRED_REPOSITORY}\n` +
      `请在正确的仓库目录下运行此脚本。`
    );
  }
  return repo;
}

async function releaseNotes(options) {
  if (options.notes) return options.notes;
  if (options.notesfile) return readFile(options.notesfile, 'utf8');
  throw new Error('Provide --notes or --notes-file');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function confirm(options) {
  if (options.yes) return true;
  if (!stdin.isTTY) throw new Error('Use --yes for non-interactive publishing');
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question('Metadata is verified. Commit, push, tag, and publish this release? [y/N] ');
  prompt.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function runVerification(runner) {
  for (const [command, ...args] of VERIFICATION_COMMANDS) {
    await runChecked(runner, command, args, `Verification ${command} ${args.join(' ')}`);
  }
}

async function writeReleaseNotes(notes) {
  const directory = await mkdtemp(join(tmpdir(), 'ai-maintenance-release-'));
  const path = join(directory, 'release-notes.md');
  await writeFile(path, notes.trim() + '\n', 'utf8');
  return { directory, path };
}

function printPlan(options, metadata, state, repository) {
  console.log(`Release: v${options.version}`);
  console.log(`Current version: ${metadata.version}`);
  console.log(`Branch: ${state.branch}; remote: ${state.remoteUrl}`);
  console.log(`GitHub repository: ${repository}`);
  console.log(`Mode: ${options.publish ? 'publish' : 'dry-run'}`);
  console.log(`Planned metadata: ${Object.values(RELEASE_FILES).join(', ')}`);
  console.log(`Verification: ${VERIFICATION_COMMANDS.map(([command, ...args]) => `${command} ${args.join(' ')}`).join(' | ')}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return console.log(usage());
  if (!options.version || !options.title) throw new Error('--version and --title are required');
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const runner = createRunner(root);
  const tag = `${TAG_PREFIX}${options.version}`;
  const notes = await releaseNotes(options);
  const metadata = await readReleaseMetadata(root);
  const state = await inspectGit(runner, { branch: options.branch, remote: options.remote, tag, checkRemote: options.publish || options.resume });
  assertGitPreflight(state, { resume: options.resume });
  const repository = options.repo ?? githubRepository(state.remoteUrl);
  printPlan(options, metadata, state, repository);
  if (!options.publish) return console.log('Dry-run complete: no files, commits, tags, pushes, or GitHub Releases were created.');
  await assertGitHubAuth(runner);

  const alreadyPrepared = metadata.version === options.version;
  let originals;
  if (!alreadyPrepared) {
    const updates = prepareReleaseMetadata(metadata, options.version, notes, today());
    originals = Object.fromEntries(Object.keys(updates).map((path) => [path, metadataForPath(metadata, path)]));
    await applyReleaseMetadata(root, updates);
  } else if (!options.resume) {
    throw new Error(`Version ${options.version} is already prepared; rerun with --resume to continue an interrupted release`);
  }

  try {
    await runVerification(runner);
    await runChecked(runner, 'git', ['diff', '--stat']);
    if (!await confirm(options)) {
      if (originals) await applyReleaseMetadata(root, originals);
      console.log('Release cancelled; metadata changes were restored.');
      return;
    }
    await commitRelease(runner, `release: publish v${options.version}`, options.version);
    await pushBranch(runner, options.remote, options.branch, options);
    await createAndPushTag(runner, options.remote, tag, `Release v${options.version}: ${options.title}`, options);
    const noteFile = await writeReleaseNotes(notes);
    try {
      const result = await publishRelease(runner, { repository, tag, title: options.title, notesFile: noteFile.path, ...options });
      console.log(`${result.created ? 'Published' : 'Found'} release: ${result.release.url}`);
    } finally {
      await rm(noteFile.directory, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Release phase stopped: ${error.message}`);
    console.error(`The prepared metadata is retained. Inspect GitHub/Git state, then rerun with --resume --publish --yes --version ${options.version} --title "${options.title}" --notes-file <notes-file>.`);
    throw error;
  }
}

function metadataForPath(metadata, path) {
  const content = {
    [RELEASE_FILES.claudePlugin]: `${JSON.stringify(metadata.claudePlugin, null, 2)}\n`,
    [RELEASE_FILES.codexPlugin]: `${JSON.stringify(metadata.codexPlugin, null, 2)}\n`,
    [RELEASE_FILES.marketplace]: `${JSON.stringify(metadata.marketplace, null, 2)}\n`,
    [RELEASE_FILES.verifier]: metadata.verifier,
    [RELEASE_FILES.changelog]: metadata.changelog,
    [RELEASE_FILES.readme]: metadata.readme
  };
  return content[path];
}

main().catch((error) => {
  console.error(`Release failed: ${error.message}`);
  console.error('No completed Git or GitHub phase is rolled back. Inspect the state and rerun with --resume when appropriate.');
  process.exitCode = 1;
});
