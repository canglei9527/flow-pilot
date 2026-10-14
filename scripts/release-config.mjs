export const DEFAULT_BRANCH = 'main';
export const DEFAULT_REMOTE = 'origin';
export const TAG_PREFIX = 'v';
export const DEFAULT_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = 1500;

// 防止误发布：只允许发布到这个仓库
export const REQUIRED_REPOSITORY = 'canglei9527/flow-pilot';

export const RELEASE_FILES = {
  claudePlugin: '.claude-plugin/plugin.json',
  codexPlugin: '.codex-plugin/plugin.json',
  marketplace: '.claude-plugin/marketplace.json',
  verifier: 'scripts/verify-skill-repo.mjs',
  maintainerSkill: 'skills/ai-project-maintainer/SKILL.md',
  bootstrapperSkill: 'skills/ai-project-bootstrapper/SKILL.md',
  changelog: 'CHANGELOG.md',
  readme: 'README.md'
};

export const VERIFICATION_COMMANDS = [
  ['node', '--test', 'scripts/tests/index-health.test.mjs', 'scripts/tests/skill-frontmatter.test.mjs', 'scripts/tests/release.test.mjs', 'scripts/tests/skill-integrity.test.mjs'],
  ['node', 'scripts/verify-skill-repo.mjs'],
  ['git', 'diff', '--check']
];
