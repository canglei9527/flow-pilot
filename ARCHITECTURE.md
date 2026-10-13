# 架构说明

## 项目定位

`ai-maintenance-skills` 是一组可安装的 AI 软件工程 Skills，用于把项目维护流程固定为“局部理解、最小修改、可验证、可追溯”。它不是某个应用的业务代码，也不要求使用特定编程语言或框架。

技术路线：标准 `skills/` 目录中的 Markdown Skill 指令 + Claude/Codex 插件元数据 + `npx skills` 安装入口 + Skill 自身 `references/` 的按需加载 + Node.js 内置模块静态验证和回归测试 + Markdown 评估提示。手工安装时可把仓库 `skills/` 复制到目标项目的 `.agents/skills/`；仓库本身不依赖 npm 运行时包或构建系统。

## 目录和职责

| 路径 | 职责 |
|---|---|
| `.claude-plugin/marketplace.json` | Claude marketplace 注册信息和插件入口 |
| `.claude-plugin/plugin.json` | Claude 插件元数据、能力和 Skill 路径 |
| `.codex-plugin/plugin.json` | Codex 插件元数据、能力和 Skill 路径 |
| `docs/installation.md` | 一条命令、插件、手工后备安装及更新卸载说明 |
| `skills/ai-project-maintainer/SKILL.md` | 已有项目的 READ_ONLY、NORMAL_CHANGE、STRUCTURAL_CHANGE、外部动作分流和新增功能需求门 |
| `skills/ai-project-maintainer/references/fast-path.md` | 只读分析、普通修改、最小读取和大文件 Bug 修复路径 |
| `skills/ai-project-maintainer/references/documentation-migration.md` | 明确命令触发的全项目 Markdown 整理、目录复用、引用修复和幂等验证 |
| `skills/ai-project-maintainer/references/structural-change.md` | 已授权结构变更的基线、迁移表、兼容与完成状态 |
| `skills/ai-project-maintainer/references/verification-and-safety.md` | 授权、秘密、依赖、验证证据和实时项目安全边界 |
| `skills/ai-project-bootstrapper/SKILL.md` | 新项目分流、需求澄清门、MICRO/STANDARD/DURABLE 档位和最短创建闭环 |
| `skills/ai-project-bootstrapper/references/workflow.md` | 三档新项目的最小工作流和当前记录门槛 |
| `skills/ai-project-bootstrapper/references/navigation-and-budgets.md` | 导航价值、索引格式、新鲜度检查、审查阈值、严格治理门和唯一所有权 |
| `skills/ai-project-bootstrapper/references/verification-and-exceptions.md` | 验证状态、具名例外和 TMS320/CCS 实时约束 |
| `skills/shared/requirements-dialogue.md` | 需求澄清的唯一编辑源；定义三种模式、已有选择复用和授权边界，不作为运行时跨目录依赖 |
| `skills/*/references/requirements-dialogue.md` | 随每个 Skill 分发的本地参考副本，由同步脚本维护，单独安装不依赖兄弟目录 |
| `docs/history/v2-migration-notes.md` | V2 重构的历史迁移证据和行为变更记录（仅供参考） |
| `examples/minimal-project/` | 与语言无关的项目文档示例，不包含真实业务代码 |
| `examples/minimal-project/ai-context/INDEX.md` | 最小项目的审核后任务导航示例 |
| `scripts/index-health.mjs` | 只读检查索引本地引用、审核提交/日期新鲜度和未解析路由 |
| `scripts/tests/index-health.test.mjs` | 索引健康检查的路径提取、真实路径边界、提交兼容、CLI 退出状态和旧索引兼容回归测试 |
| `evals/prompts.md` | 触发和行为评估用的真实提示 |
| `evals/rubric.md` | 评估结果的通过标准和常见失败模式 |
| `scripts/verify-skill-repo.mjs` | 检查文件、frontmatter、引用和仓库边界 |
| `scripts/skill-integrity.mjs` | 递归检查 Skill 运行时引用的真实路径边界；区分 Git 分发文件与本地忽略文件，支持无 Git 的源码归档 |
| `scripts/sync-skill-references.mjs` | 默认只读检查需求参考副本；`--write` 从唯一源同步两个分发副本 |
| `scripts/tests/skill-integrity.test.mjs` | 隔离源码归档、Git 会话边界、缺失文件诊断、副本同步和单 Skill 分发回归 |
| `scripts/release.mjs` | 发布 CLI 编排：dry-run、版本准备、验证、提交、推送、tag 和 Release 阶段 |
| `scripts/release-config.mjs` | 发布路径、默认分支、验证命令和重试策略的唯一所有者 |
| `scripts/release-version.mjs` | SemVer、插件/marketplace/verifier/两个 Skill frontmatter 版本元数据同步和 changelog 顶部段落 |
| `scripts/release-git.mjs` | Git 预检、提交、推送、tag 与可重试命令执行 |
| `scripts/release-github.mjs` | 认证的 `gh` Release 查询、创建和传播轮询 |
| `scripts/tests/release.test.mjs` | 发布模块的离线行为测试 |
| `scripts/INDEX.md` | 发布与验证脚本的任务路由和最小读取路径 |
| `scripts/skill-frontmatter.mjs` | 解析仓库限定的无依赖 frontmatter 子集，拒绝未引用冒号和额外字段 |
| `scripts/tests/skill-frontmatter.test.mjs` | frontmatter 合法、CRLF、非法冒号、重复/额外字段的回归测试 |
| `README.md` | 安装、触发场景、验证和贡献入口 |
| `CONTRIBUTING.md` | 修改 Skill、运行评估和提交变更的规则 |
| `AGENTS.md` | 本仓库自身的维护边界 |
| `.gitattributes` | Markdown 空白检查识别 CRLF，同时保留行尾空格、文件末尾空行和缩进检查，不强制改写现有换行 |
| `BUG_HISTORY.md` | 创建记录与后续问题修复记录 |
| `AI修Bug提问模板.md` | 可选的详细问题交接模板，不是 Skill 自动使用的必填提示 |

## 调用关系

```text
用户请求
  -> 任务分流门
       -> 有现有项目证据 -> ai-project-maintainer
            -> 新增/扩展功能 -> 需求澄清门（三选一） -> READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE
            -> 其他维护请求 -> READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE
       -> 独立程序/服务/路由器/CLI/自动化需求 -> ai-project-bootstrapper
            -> 需求澄清门（三选一） -> MICRO / STANDARD / DURABLE
       -> 无法判断 -> 只询问一次，不扫描、不创建文件

安装器/插件客户端
  -> `.claude-plugin/`、`.codex-plugin/` 或 `npx skills`
       -> `skills/`
            -> 用户维护请求
                 -> ai-project-maintainer
                      -> READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE
                      -> 项目规则与目标锚点
                      -> 最小读取、修改和风险匹配验证
                      -> 仅在有导航或历史价值时更新记录

导入已有项目
  -> 浅层项目地图与基线能力检查
  -> 保持 READ_ONLY，或取得明确结构授权
  -> （获授权）整理前基线 -> 分批完整职责迁移 -> 整理后回归验证

用户新建项目请求
  -> ai-project-bootstrapper
       -> MICRO / STANDARD / DURABLE 档位
       -> 独立项目根目录与最小垂直切片
       -> 仅按需建立导航和记录
       -> 代码、测试和分层验证
```

两个 Skill 可以先后使用：bootstrapper 负责建立边界，maintainer 负责后续局部维护。维护 Skill 不强制 bootstrapper 生成的文件名；它会识别项目的等价文档并遵循现有约定。

需求模式沿用同一任务的已有选择；只有尚未选择时才提供三选一。选择直接执行不扩大文件或外部操作授权。维护者普通 Bug 修复不以前置补建索引为条件；MICRO 单文件工具默认不创建文档目录。共享源通过 `sync-skill-references.mjs --write` 同步为两个本地参考，验证器检查副本一致及递归引用闭包。

## 发布调用关系

```text
release.mjs
  -> release-config.mjs: 默认路径、分支、验证和重试策略
  -> release-version.mjs: 读取/校验/同步版本与 CHANGELOG
  -> release-git.mjs: 本地预检、提交、push、annotated tag、重试
  -> release-github.mjs: gh 身份检查、Release 幂等查询与创建

默认 dry-run: 只读取本地 Git 和版本元数据，不修改文件且不访问远端。
--publish: 元数据 -> 验证 -> 确认 -> 提交 -> push -> tag -> GitHub Release。
--resume: 仅从 Git tag、提交和现有 GitHub Release 推导已完成阶段，不写持久状态文件。
```

两个 Skill 的运行时文件分别自包含：正文只保留每次运行必需的步骤和完成条件，复杂分支通过本 Skill 自身的 `references/` 按需加载。这样既支持单 Skill 安装，也避免把复杂导入和模板细节放入每次触发的上下文。

## 对外接口

### `ai-project-maintainer`

- 输入：已有项目中的维护请求，以及可选的文件、函数、复现步骤、错误和期望行为。
- 导入场景：先做浅层项目地图并询问是否整理；未获明确同意不移动文件；同意后执行整理前基线、分批迁移和整理后回归验证。
- 输出：最小代码或文档变更、验证结果、根因说明，以及仅在有导航或历史价值时更新的记录；结构任务还需报告批准范围、职责迁移、旧实现删除和完成状态。
- 重要约束：不猜测缺失上下文，不宣称未验证的修复，不破坏用户未提交修改；普通大文件 Bug 不因行数被迫重构。新增功能先进入需求澄清门，并同步更新相关架构文档；问卷摘要确认是需求门，不调用或替代 IDE 计划模式。
- 文档整理：只有明确“整理维护文档”等命令才进入全项目迁移路径；优先复用 `文档/`、`docs/` 或 `documentation/`，老项目迁移后修复引用并保证幂等，后续维护文档写入选定目录。

### `ai-project-bootstrapper`

- 输入：项目目标、核心功能、技术偏好、运行环境和验收标准。
- 输出：按 `MICRO`、`STANDARD` 或 `DURABLE` 档位建立的独立项目、最小垂直切片、必要文档/记录、测试和启动/验证说明。
- 重要约束：先选择或创建独立项目根目录；源码、测试、配置、文档和资产都放在该目录内，不散落到父级工作区；不为 MICRO 自动生成完整治理树。新项目先进入需求澄清门；`完全不问` 允许在当前工作区内直接完成实现和验证，但不主动制造 IDE 计划审批。

## 后续维护最小上下文

遇到 Bug 时优先提供：现象、复现步骤、期望结果、完整报错、目标文件/函数（如已知）和最小测试命令。不要为了满足记录规则上传整个项目；只需补充能证明调用路径或验证结果的局部上下文。
