# 贡献指南

感谢贡献。这个仓库的目标是提供小而可靠的 AI 维护 Skills，而不是堆积项目专用规则。

## 开始前

1. 阅读 `AGENTS.md`、`ARCHITECTURE.md` 和 `BUG_HISTORY.md`。
2. 确认变更属于通用维护流程、参考模板、评估或验证脚本。
3. 不要提交 `.zcode/`、会话记录、个人配置、令牌、私钥、`.env` 或真实项目源码。

## 修改 Skill

- 保持 frontmatter 的 `name` 与目录名一致。
- frontmatter 保留 `name`、`description` 和发布工具管理的 `version`；本仓库兼容的可选字段以 `scripts/skill-frontmatter.mjs` 为准（包括已有 `when_to_use`）。`description` 使用双引号包裹。通用 Skill 校验器可能使用不同的字段白名单，应记录格式兼容差异，不擅自移除发布字段。
- `description` 要同时说明触发场景和 Skill 要完成的工作；不要只写抽象口号。
- 触发词优先放在 `description` 的前 249 字符：这是历史客户端观测形成的兼容预算，不是所有客户端的固定截断协议，也不证明实际触发率。把中英文触发词、续作信号与反向路由前置，`node scripts/verify-skill-repo.mjs` 会检查这一预算。
- 需求流程只编辑 `skills/shared/requirements-dialogue.md`，再运行 `node scripts/sync-skill-references.mjs --write` 同步到两个 Skill 的本地参考。运行时不得依赖兄弟 Skill 或仓库根文件；校验器会递归检查引用，并拒绝副本漂移。
- 正文优先写执行顺序和决策边界，具体表格和长模板放到 `references/`。
- 每个 Skill 必须可单独安装，引用只指向自身目录内的 `references/`，不跨 Skill 取文件。
- 运行时预算：`description` 不超过 1000 字符，正文不超过 14000 字符，`SKILL.md` 不超过 200 行；这些是上限，入口应尽量简短，超过时优先做渐进披露。
- 保留项目无关的表达。若规则只适用于某个框架或团队，应放到示例或单独 Skill，而不是污染通用 Skill。
- 不以更多大写的 MUST/NEVER 代替清晰的原因和行动步骤。
- 修改触发语义时，至少在 `evals/prompts.md` 增加或调整一个评估提示。

## 验证

在仓库根目录运行：

```bash
node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs scripts/tests/skill-integrity.test.mjs
node scripts/verify-skill-repo.mjs
git diff --check
```

然后用 `evals/` 的提示在实际支持 Skill 的客户端中进行人工评估，检查：是否触发、是否先读取局部上下文、是否保护未提交修改、是否验证并记录结果。

如果验证失败，修正后再次运行。不要在提交信息或 README 中把“未运行”写成“通过”。

## 提交内容

提交说明应简短且说明行为变化，例如：

```text
maintainer: clarify dependency boundary for bug fixes
```

结构、Skill 名称、引用路径、安装方式或许可证变化时，同步更新 `ARCHITECTURE.md`、`README.md` 或 `BUG_HISTORY.md`。新文件必须经过内容检查后再提交。

## 发布

功能修改应先通过验证并作为普通提交完成。发布提交、版本元数据、标签和 GitHub Release 统一由 `scripts/release.mjs` 管理：先执行不写入的 dry-run，再使用 `--publish` 执行真实发布；无人值守需同时使用 `--yes`。不要手动分别修改版本、创建标签和补 Release，除非正在恢复一条已记录的故障。

发布前工具要求干净工作区、正确分支、未落后 upstream、合法且递增的 SemVer 版本，以及一致的 Claude/Codex/marketplace/验证器版本。它依赖已认证的 `gh` CLI，但不会读取或输出其凭据。推送或 Release 传播中断时，保留已完成阶段，核对后使用相同参数加 `--resume --publish --yes` 继续。

## Pull Request

PR 描述至少包括：

- 变更目的和触发场景。
- 受影响的 Skill、参考文件或验证脚本。
- `node scripts/verify-skill-repo.mjs` 和 `git diff --check` 的结果。
- 人工评估使用的提示和结果；没有运行的部分及原因。
- 是否改变公共安装路径、Skill 名称或仓库发布内容。
