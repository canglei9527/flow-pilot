import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RELEASE_FILES } from './release-config.mjs';
import { parseSkillDocument } from './skill-frontmatter.mjs';

const SKILL_FILES = {
  maintainer: RELEASE_FILES.maintainerSkill,
  bootstrapper: RELEASE_FILES.bootstrapperSkill
};

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const VERSION_PATTERN = /const releaseVersion = '([^']+)';/;

export function parseVersion(value) {
  const match = SEMVER.exec(value ?? '');
  if (!match) throw new Error(`Invalid release version: ${value}`);
  return { raw: value, parts: match.slice(1).map(Number) };
}

export function compareVersions(left, right) {
  const leftParts = parseVersion(left).parts;
  const rightParts = parseVersion(right).parts;
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function changelogHeading(version) {
  return new RegExp(`^## ${version.replaceAll('.', '\\.')} - `, 'm');
}

function updateSkillVersion(text, version) {
  const { metadata } = parseSkillDocument(text);
  if (!metadata.version) throw new Error('Skill version metadata is missing');
  parseVersion(metadata.version);
  const frontmatter = text.match(/^---\r?\n[\s\S]*?\r?\n---/)[0];
  const updated = frontmatter.replace(/^(version:[ \t]*["']?)\d+\.\d+\.\d+/m, `$1${version}`);
  return updated + text.slice(frontmatter.length);
}

function formatReleaseNotes(notes) {
  const content = notes.trim();
  if (!content) throw new Error('Release notes are required');
  // Keep authored Markdown intact; retain bullet formatting for legacy plain-line notes.
  if (/^(?:#{1,6}[ \t]|[-*+][ \t]|\d+[.)][ \t]|>|`{3}|~{3}|\||[ \t]{4}\S)/m.test(content)
      || /\r?\n[ \t]*\r?\n/.test(content)) return content;
  return content.split(/\r?\n/).map((line) => `- ${line.trim()}`).join('\n');
}

function updateReadmeHistory(readme, version, date) {
  const heading = /^## 版本历史\r?\n(?:\r?\n)?/m;
  if (!heading.test(readme ?? '')) throw new Error('README version history heading is missing');
  if (new RegExp(`^### v${version.replaceAll('.', '\\.')}(?:[ \\t]|$)`, 'm').test(readme)) {
    throw new Error(`README already contains version ${version}`);
  }
  const eol = readme.includes('\r\n') ? '\r\n' : '\n';
  const entry = `### v${version} — ${date}${eol}${eol}[完整发布说明](docs/releases/v${version}.md)${eol}${eol}`;
  return readme.replace(heading, `## 版本历史${eol}${eol}${entry}`);
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'));
}

export async function readReleaseMetadata(root) {
  const [claudePlugin, codexPlugin, marketplace, verifier, changelog, readme, maintainerSkill, bootstrapperSkill] = await Promise.all([
    readJson(root, RELEASE_FILES.claudePlugin),
    readJson(root, RELEASE_FILES.codexPlugin),
    readJson(root, RELEASE_FILES.marketplace),
    readFile(join(root, RELEASE_FILES.verifier), 'utf8'),
    readFile(join(root, RELEASE_FILES.changelog), 'utf8'),
    readFile(join(root, RELEASE_FILES.readme), 'utf8'),
    readFile(join(root, SKILL_FILES.maintainer), 'utf8'),
    readFile(join(root, SKILL_FILES.bootstrapper), 'utf8')
  ]);
  const verifierMatch = VERSION_PATTERN.exec(verifier);
  const marketplaceVersion = marketplace.plugins?.find(
    (plugin) => plugin.name === 'ai-maintenance-skills'
  )?.version;
  const maintainerMetadata = parseSkillDocument(maintainerSkill).metadata;
  const bootstrapperMetadata = parseSkillDocument(bootstrapperSkill).metadata;
  const versions = [claudePlugin.version, codexPlugin.version, marketplaceVersion, verifierMatch?.[1], maintainerMetadata.version, bootstrapperMetadata.version];
  if (versions.some((version) => !version)) throw new Error('Release version metadata is incomplete');
  if (new Set(versions).size !== 1) throw new Error(`Release version metadata disagrees: ${versions.join(', ')}`);
  return { version: versions[0], claudePlugin, codexPlugin, marketplace, verifier, changelog, readme, skills: { maintainer: maintainerSkill, bootstrapper: bootstrapperSkill } };
}

export function prepareReleaseMetadata(metadata, version, notes, date) {
  parseVersion(version);
  if (compareVersions(version, metadata.version) <= 0) {
    throw new Error(`Release version ${version} must be newer than ${metadata.version}`);
  }
  if (changelogHeading(version).test(metadata.changelog)) {
    throw new Error(`CHANGELOG already contains version ${version}`);
  }
  const marketplace = structuredClone(metadata.marketplace);
  const entry = marketplace.plugins.find((plugin) => plugin.name === 'ai-maintenance-skills');
  entry.version = version;
  const verifier = metadata.verifier.replace(VERSION_PATTERN, `const releaseVersion = '${version}';`);
  if (verifier === metadata.verifier) throw new Error('Verifier version constant was not found');
  const readme = updateReadmeHistory(metadata.readme, version, date);
  const formattedNotes = formatReleaseNotes(notes);
  const section = `## ${version} - ${date}\n\n${formattedNotes}\n\n`;
  const releaseDocument = `# v${version} 发布介绍\n\n发布日期：${date} · 版本线：${metadata.version} -> ${version}\n\n## 主要变更\n\n${formattedNotes}\n\n`;
  return {
    [RELEASE_FILES.claudePlugin]: `${JSON.stringify({ ...metadata.claudePlugin, version }, null, 2)}\n`,
    [RELEASE_FILES.codexPlugin]: `${JSON.stringify({ ...metadata.codexPlugin, version }, null, 2)}\n`,
    [RELEASE_FILES.marketplace]: `${JSON.stringify(marketplace, null, 2)}\n`,
    [RELEASE_FILES.verifier]: verifier,
    [SKILL_FILES.maintainer]: updateSkillVersion(metadata.skills.maintainer, version),
    [SKILL_FILES.bootstrapper]: updateSkillVersion(metadata.skills.bootstrapper, version),
    [RELEASE_FILES.changelog]: metadata.changelog.replace(/^# 变更记录\r?\n\r?\n/, `# 变更记录\n\n${section}`),
    [RELEASE_FILES.readme]: readme,
    [`docs/releases/v${version}.md`]: releaseDocument
  };
}

export async function applyReleaseMetadata(root, updates) {
  await Promise.all(Object.entries(updates).map(([relativePath, content]) =>
    writeFile(join(root, relativePath), content, 'utf8')
  ));
}
