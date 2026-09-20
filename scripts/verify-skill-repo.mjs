import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSkillDocument } from './skill-frontmatter.mjs';
import { inspectIndex } from './index-health.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const releaseVersion = '0.4.16';
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const readRequired = (relativePath) => {
  const path = join(root, relativePath);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8');
};

const required = [
  'README.md',
  'AGENTS.md',
  'ARCHITECTURE.md',
  'BUG_HISTORY.md',
  'ai-context/INDEX.md',
  'AI修Bug提问模板.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  '.gitignore',
  '.github/workflows/verify.yml',
  '.claude-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  'docs/installation.md',
  'evals/prompts.md',
  'evals/rubric.md',
  'examples/minimal-project/AGENTS.md',
  'examples/minimal-project/ARCHITECTURE.md',
  'examples/minimal-project/BUG_HISTORY.md',
  'examples/minimal-project/AI修Bug提问模板.md',
  'examples/minimal-project/ai-context/INDEX.md',
  'skills/ai-project-maintainer/SKILL.md',
  'skills/ai-project-maintainer/references/fast-path.md',
  'skills/ai-project-maintainer/references/documentation-migration.md',
  'skills/ai-project-maintainer/references/structural-change.md',
  'skills/ai-project-maintainer/references/verification-and-safety.md',
  'skills/ai-project-bootstrapper/SKILL.md',
  'skills/ai-project-bootstrapper/references/workflow.md',
  'skills/ai-project-bootstrapper/references/navigation-and-budgets.md',
  'skills/ai-project-bootstrapper/references/verification-and-exceptions.md',
  'skills/shared/requirements-dialogue.md',
  'docs/history/v2-migration-notes.md',
  'scripts/skill-frontmatter.mjs',
  'scripts/index-health.mjs',
  'scripts/tests/index-health.test.mjs',
  'scripts/tests/skill-frontmatter.test.mjs',
  'scripts/release.mjs',
  'scripts/release-config.mjs',
  'scripts/release-version.mjs',
  'scripts/release-git.mjs',
  'scripts/release-github.mjs',
  'scripts/tests/release.test.mjs',
  'scripts/INDEX.md'
];

for (const file of required) check(existsSync(join(root, file)), `missing ${file}`);

const skillNames = ['ai-project-maintainer', 'ai-project-bootstrapper'];
const skillDocuments = new Map();
for (const name of skillNames) {
  const skillRoot = join(root, 'skills', name);
  const skillPath = join(skillRoot, 'SKILL.md');
  if (!existsSync(skillPath)) continue;

  const text = readFileSync(skillPath, 'utf8');
  try {
    const document = parseSkillDocument(text);
    skillDocuments.set(name, { ...document, text });
    check(document.metadata.name === name, `${name}: frontmatter name mismatch`);
    check(document.metadata.version === releaseVersion, `${name}: frontmatter version mismatch`);
    check(document.metadata.description.length <= 1000, `${name}: description exceeds 1000 characters`);
    check(document.body.length <= 14000, `${name}: SKILL.md body exceeds 14000 characters`);
    check(text.split(/\r?\n/).length <= 200, `${name}: SKILL.md exceeds 200 lines`);

    const pointers = [...text.matchAll(/\]\(((?:\.\.\/shared|references)\/[^)]+)\)/g)].map((match) => match[1]);
    for (const pointer of pointers) {
      const resolvedPath = pointer.startsWith('../shared')
        ? resolve(skillRoot, '..', pointer.slice(3))
        : resolve(skillRoot, pointer);
      check(existsSync(resolvedPath), `${name}: missing reference ${pointer}`);
    }
  } catch (error) {
    failures.push(`${name}: invalid frontmatter (${error.message})`);
  }
}

const parseJson = (relativePath) => {
  try {
    return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
  } catch (error) {
    failures.push(`${relativePath}: invalid JSON (${error.message})`);
    return null;
  }
};

const marketplace = parseJson('.claude-plugin/marketplace.json');
const claudePlugin = parseJson('.claude-plugin/plugin.json');
const codexPlugin = parseJson('.codex-plugin/plugin.json');
for (const [label, plugin] of [['Claude', claudePlugin], ['Codex', codexPlugin]]) {
  if (!plugin) continue;
  check(plugin.name === 'ai-maintenance-skills', `${label} plugin name mismatch`);
  check(plugin.version === releaseVersion, `${label} plugin version mismatch`);
  check(plugin.license === 'Apache-2.0', `${label} plugin license mismatch`);
  check(plugin.skills === './skills/', `${label} plugin skill path mismatch`);
  check(!Object.hasOwn(plugin, 'hooks'), `${label} plugin unsupported hooks field present`);
  check(plugin.interface?.capabilities?.includes('Read'), `${label} plugin Read capability missing`);
  check(plugin.interface?.capabilities?.includes('Write'), `${label} plugin Write capability missing`);
}
if (marketplace) {
  const entry = marketplace.plugins?.find((plugin) => plugin.name === 'ai-maintenance-skills');
  check(entry, 'Claude marketplace plugin entry missing');
  check(entry?.version === releaseVersion, 'Claude marketplace version mismatch');
}

const readme = readRequired('README.md') ?? '';
const installation = readRequired('docs/installation.md') ?? '';
check(readme.includes('npx skills add https://github.com/canglei9527/ai-maintenance-skills'), 'README install command missing');
check(readme.includes('skills/ai-project-maintainer/SKILL.md'), 'README canonical skill path missing');
check(installation.includes('--skill ai-project-maintainer'), 'single-skill install guidance missing');
check(installation.includes('npx skills add . --list'), 'local discovery verification missing');

const maintainer = skillDocuments.get('ai-project-maintainer')?.text ?? '';
const maintainerDescription = skillDocuments.get('ai-project-maintainer')?.metadata.description ?? '';
const bootstrapper = skillDocuments.get('ai-project-bootstrapper')?.text ?? '';
const fastPath = readRequired('skills/ai-project-maintainer/references/fast-path.md') ?? '';
const documentationMigration = readRequired('skills/ai-project-maintainer/references/documentation-migration.md') ?? '';
const structuralChange = readRequired('skills/ai-project-maintainer/references/structural-change.md') ?? '';
const maintainerSafety = readRequired('skills/ai-project-maintainer/references/verification-and-safety.md') ?? '';
const sharedRequirements = readRequired('skills/shared/requirements-dialogue.md') ?? '';
const bootstrapWorkflow = readRequired('skills/ai-project-bootstrapper/references/workflow.md') ?? '';
const navigation = readRequired('skills/ai-project-bootstrapper/references/navigation-and-budgets.md') ?? '';
const bootstrapExceptions = readRequired('skills/ai-project-bootstrapper/references/verification-and-exceptions.md') ?? '';
const evals = readRequired('evals/prompts.md') ?? '';

check(maintainerDescription.includes('现有产品行为') && maintainerDescription.includes('期望行为') && maintainerDescription.includes('修复'), 'maintainer natural-language bug trigger coverage missing');
check(maintainerDescription.includes('刷新后又出现') && maintainerDescription.includes('无需项目名'), 'maintainer short Chinese bug trigger coverage missing');
check(maintainerDescription.includes('继续') && maintainerDescription.includes('未完成') && maintainerDescription.includes('收尾'), 'maintainer continuation trigger coverage missing');

// The client skill list only renders the leading slice of `description`; text past this
// offset is invisible to the model choosing a Skill, so trigger phrases must come first.
const descriptionWindow = 249;
const bootstrapperDescription = skillDocuments.get('ai-project-bootstrapper')?.metadata.description ?? '';
const withinWindow = (description, phrase) => {
  const index = description.indexOf(phrase);
  return index >= 0 && index + phrase.length <= descriptionWindow;
};
const maintainerVisible = ['修复', '排查', '异常', '报错', '回归', '刷新后又出现', '修复这个BUG', '现有产品行为', '期望行为', '继续', '未完成', '收尾', '验证', '归档', '维护文档', '无需项目名', 'bug', 'fix', 'review', 'diagnose', 'regression'];
const bootstrapperVisible = ['创建', '新建', '开发', '搭建', '从零开始', '独立项目', '初始化新目录', '空目录', '无需项目名或文件路径', 'create', 'build', 'scaffold', 'initialize', 'standalone', 'from scratch', 'ai-project-maintainer'];
const hiddenMaintainer = maintainerVisible.filter((phrase) => !withinWindow(maintainerDescription, phrase));
const hiddenBootstrapper = bootstrapperVisible.filter((phrase) => !withinWindow(bootstrapperDescription, phrase));
check(hiddenMaintainer.length === 0, `maintainer trigger phrases fall outside the ${descriptionWindow}-char client window: ${hiddenMaintainer.join('、')}`);
check(hiddenBootstrapper.length === 0, `bootstrapper trigger phrases fall outside the ${descriptionWindow}-char client window: ${hiddenBootstrapper.join('、')}`);
check(maintainer.includes('READ_ONLY') && maintainer.includes('NORMAL_CHANGE') && maintainer.includes('STRUCTURAL_CHANGE'), 'maintainer operation paths missing');
check(maintainer.includes('EXTERNAL_ACTION') && maintainer.includes('does not authorize writing'), 'maintainer authorization boundary missing');
check(maintainer.includes('fast-path.md') && maintainer.includes('structural-change.md') && maintainer.includes('verification-and-safety.md') && maintainer.includes('documentation-migration.md'), 'maintainer direct reference routing missing');
check(maintainer.includes('requirements-dialogue.md') && sharedRequirements.includes('开始需求问卷') && sharedRequirements.includes('完全不问，直接执行'), 'maintainer requirements dialogue routing missing');
check(fastPath.includes('50 search hits') && fastPath.includes('12 candidate files') && fastPath.includes('one dependency hop'), 'maintainer search limits missing');
check(maintainer.includes('规范实现文件') && maintainer.includes('流程停止点') && maintainer.includes('修改文件列表') && maintainer.includes('验证结果'), 'maintainer bounded investigation report contract missing');
check(maintainer.includes('已触发 ai-project-maintainer') &&
  maintainer.includes('首次面向用户的工作更新') &&
  maintainer.includes('只有实际加载本 Skill 后才能使用该确认语句'),
  'maintainer trigger acknowledgement rule missing');
check(maintainer.includes('新增或扩展功能') &&
  maintainer.includes('必须同步更新相关架构文档') &&
  maintainer.includes('界面') &&
  maintainer.includes('ARCHITECTURE.md') &&
  maintainer.includes('ai-context/INDEX.md'),
  'maintainer feature architecture update rule missing');
check(fastPath.includes('新增或扩展功能必须同步更新') &&
  fastPath.includes('纯样式调整') &&
  fastPath.includes('普通 Bug 修复'),
  'maintainer feature architecture boundary missing');
check(fastPath.includes('确认根因后停止') && fastPath.includes('仅在跨模块证据下按一跳扩展') && fastPath.includes('最小兼容修改'), 'maintainer bounded investigation stop gate missing');
check(maintainer.includes('文档整理触发门') &&
  maintainer.includes('整理维护文档') &&
  maintainer.includes('全量扫描') &&
  maintainer.includes('统一 `文档/` 目录') &&
  maintainer.includes('已有规范文档目录'),
  'maintainer documentation migration trigger and idempotency rule missing');
check(documentationMigration.includes('文档整理与迁移') &&
  documentationMigration.includes('修复 Markdown 链接') &&
  documentationMigration.includes('迁移前记录 Git 状态') &&
  documentationMigration.includes('迁移后检查'),
  'maintainer documentation migration workflow missing');
check(documentationMigration.includes('后续新增的') && documentationMigration.includes('规范文档目录'), 'maintainer documentation destination rule missing');
check(documentationMigration.includes('普通 Bug 修复') && documentationMigration.includes('不触发全项目扫描'), 'maintainer documentation scan boundary missing');
check(fastPath.includes('A 900-line target does not require a prior refactor'), 'large-file normal-change rule missing');
check(structuralChange.includes('Migration Table') && structuralChange.includes('old implementation is deleted'), 'structural migration ownership rule missing');
check(maintainerSafety.includes('Do not choose a license') && maintainerSafety.includes('NOT_RUN'), 'maintainer safety and verification status rules missing');
check(bootstrapper.includes('new or empty project directory') && bootstrapper.includes('existing implementation must be changed'), 'bootstrapper routing/root boundary missing');
check(bootstrapper.includes('创建') && bootstrapper.includes('从零开始') && bootstrapper.includes('独立项目') && bootstrapper.includes('无需项目名或文件路径'), 'bootstrapper natural-language trigger coverage missing');
check(bootstrapper.includes('create') && bootstrapper.includes('build') && bootstrapper.includes('scaffold') && bootstrapper.includes('initialize'), 'bootstrapper English trigger coverage missing');
check(bootstrapper.includes('已有源码') && bootstrapper.includes('修改现有功能') && bootstrapper.includes('修复 Bug') && bootstrapper.includes('转到 `ai-project-maintainer`'), 'bootstrapper existing-project exclusion missing');
check(bootstrapper.includes('已触发 ai-project-bootstrapper') && bootstrapper.includes('首次面向用户的工作更新'), 'bootstrapper trigger acknowledgement rule missing');
check(bootstrapper.includes('默认') && bootstrapper.includes('文档/') && bootstrapper.includes('维护文档') && bootstrapper.includes('ARCHITECTURE.md') && bootstrapper.includes('BUG_HISTORY.md'), 'bootstrapper default documentation directory rule missing');
check(bootstrapper.includes('已有文档目录') && bootstrapper.includes('不重复迁移') && bootstrapper.includes('只整理新增或遗漏'), 'bootstrapper documentation directory compatibility rule missing');
check(bootstrapper.includes('后续新增') && bootstrapper.includes('直接写入规范文档目录'), 'bootstrapper future documentation destination rule missing');
check(bootstrapWorkflow.includes('新项目默认建立根 `文档/`') && bootstrapWorkflow.includes('将 `ARCHITECTURE.md`、`BUG_HISTORY.md`、维护记录和发布说明放入其中') && bootstrapWorkflow.includes('不重复迁移'), 'bootstrapper workflow documentation destination missing');
check(bootstrapper.includes('MICRO') && bootstrapper.includes('STANDARD') && bootstrapper.includes('DURABLE'), 'bootstrapper tier routing missing');
check(bootstrapper.includes('workflow.md') && bootstrapper.includes('navigation-and-budgets.md') && bootstrapper.includes('verification-and-exceptions.md'), 'bootstrapper direct reference routing missing');
check(bootstrapper.includes('requirements-dialogue.md') && sharedRequirements.includes('跳过问卷') && sharedRequirements.includes('IDE 的计划模式'), 'bootstrapper requirements dialogue routing missing');
check(bootstrapWorkflow.includes('Do not create `AGENTS.md`') && bootstrapWorkflow.includes('Keep a requested single-file tool single-file'), 'MICRO workflow guard missing');
check(navigation.includes('Review thresholds') && navigation.includes('Strict budgets'), 'budget review and strict-gate distinction missing');
check(bootstrapExceptions.includes('NOT_AVAILABLE'), 'bootstrapper exception and real-time verification rules missing');
check(evals.includes('独立程序需求的分流') && evals.includes('现有项目证据的维护分流') && evals.includes('意图不明确时只问一次'), 'routing evaluation prompts missing');

const repositoryIndexHealth = inspectIndex(root, {
  currentDate: new Date('2026-08-27T00:00:00Z')
});
check(repositoryIndexHealth.indexes.length === 1, 'repository ai-context index missing');
check(repositoryIndexHealth.formatVersion === '1', 'repository ai-context format metadata missing');
check(!repositoryIndexHealth.statuses.includes('UNRESOLVED'), `repository index has unresolved routes: ${repositoryIndexHealth.unresolved.join(', ')}`);

const exampleIndexHealth = inspectIndex(join(root, 'examples', 'minimal-project'), {
  currentDate: new Date('2026-08-27T00:00:00Z')
});
check(exampleIndexHealth.indexes.length === 1, 'minimal project ai-context index missing');
check(exampleIndexHealth.formatVersion === '1', 'minimal project ai-context format metadata missing');
check(!exampleIndexHealth.statuses.includes('UNRESOLVED'), `minimal project index has unresolved routes: ${exampleIndexHealth.unresolved.join(', ')}`);

const forbiddenDirectories = new Set(['.zcode', 'node_modules', 'dist', 'build']);
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    if (forbiddenDirectories.has(entry.name)) {
      failures.push(`forbidden directory present: ${relative(root, join(directory, entry.name))}`);
      continue;
    }
    if (entry.isDirectory()) walk(join(directory, entry.name));
  }
};
walk(root);

check(!existsSync(join(root, '.agents', 'skills')), 'legacy .agents/skills directory must not be published');
check(!existsSync(join(root, 'src')), 'application source directory must not be included');
check(!existsSync(join(root, 'assets')), 'application assets directory must not be included');
check(!existsSync(join(root, 'vendor')), 'application vendor directory must not be included');
check(statSync(join(root, 'LICENSE')).size > 1000, 'LICENSE is unexpectedly small');

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS AI maintenance skills repository verification');
  console.log(`PASS ${skillNames.length} Skills with strict frontmatter and self-contained references`);
  console.log('PASS runtime context budgets: description <= 1000 chars, body <= 14000 chars, SKILL.md <= 200 lines');
  console.log(`PASS ${required.length} required repository files and plugin version ${releaseVersion}`);
  console.log('PASS references, examples, license, and repository boundaries checked');
}
