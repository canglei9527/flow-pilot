# AI Maintenance Skills

> 让 AI 代码助手像资深工程师一样工作：先理解再动手，改最少的代码，改完验证，留下可追溯的证据。

[为什么需要这个项目](#一为什么需要这个项目) · [核心原理](#二核心设计原理) · [Skill 详解](#三两个-skill-详解) · [安装](#五安装) · [版本历史](#版本历史) · [English](#english-quick-start)

---

## 一、为什么需要这个项目

### AI 代码助手的默认行为问题

没有任何约束时，AI 代码助手在处理软件工程任务时有几个典型的"坏习惯"：

**读太多、改太多。** 收到"修一个 Bug"的请求，AI 会扫描整个项目，顺手重构不相关的文件，改命名规范，升级依赖。Bug 修了，但新引入了三个问题。

**不区分"看"和"改"的权限。** 用户说"帮我看看这个结构"，AI 就开始移动文件、重命名函数、创建架构文档。路径和附件在 AI 眼里等于"可以写入"的授权——这是错误的推断。

**完成声明不诚实。** AI 喜欢报告"通过"，但实际上测试没有跑，硬件没有连接，行为只是"看起来没问题"。你无法判断工作是否真正完成。

**创建没用的文档。** 一旦被要求创建项目，AI 默认生成完整治理树：`AGENTS.md`、`FUNCTION_INDEX.md`、`ai-context/`、架构文档、Bug 历史……即使你只是想要一个 50 行的单文件脚本。

**遇到大文件就强制重构。** 目标文件有 500 行？AI 的第一反应是"先重构它"。但修一个 Bug 不需要先重构——强制重构反而引入更多风险。

### 这个项目的解决方案

`ai-maintenance-skills` 提供两个可安装的 Skill，把以上问题变成 AI 的工作约束：

| Skill | 职责 |
|---|---|
| `ai-project-maintainer` | 维护已有项目：先判断路径（只读/普通修改/结构变更），读取最小上下文，做最小修改，验证后报告真实状态 |
| `ai-project-bootstrapper` | 新建项目：确认项目根目录和复杂度档位，创建刚好够用的结构，不预先堆叠未来可能用到的文档 |

两个 Skill 不绑定任何编程语言、框架或平台，也不依赖 npm 运行时包。安装后直接用自然语言描述任务，AI 自动选择对应的 Skill 和路径。创建新项目或新增功能时，Skill 会先提供可选的需求澄清门：`开始需求问卷`、`跳过问卷`、`完全不问，直接执行`。

---

## 二、核心设计原理

### 原理 1：写入权限独立于定位证据

用户提供了文件路径 ≠ AI 可以修改那里的内容。每种操作都有独立的授权门：

| 路径 | 触发条件 | 默认写权限 |
|---|---|---|
| `READ_ONLY` | 解释、审查、诊断、查找符号、读取日志 | **无** |
| `NORMAL_CHANGE` | 修 Bug、加聚焦功能、调整配置 | 仅命名的兼容范围 |
| `STRUCTURAL_CHANGE` | 重构、拆分、迁移、解决 God Class | 仅已批准的结构范围 |
| `EXTERNAL_ACTION` | 删除、推送、发布、部署 | 每个操作单独确认 |

"帮我看看结构"是 `READ_ONLY`，不授权移动任何文件。

### 原理 2：按需加载上下文，不扫描全局

AI 读取的每一行都消耗上下文窗口。规定的默认读取上限：

- **50 个搜索命中、12 个候选文件、一跳依赖**
- 只在有明确证据时扩展读取范围，且必须记录扩展理由
- 大文件（>400 行）不等于需要重构——内聚的大文件只是大，不是坏

### 原理 3：完成报告必须区分五种验证状态

```
PASS                         ← 已运行且通过
FAIL                         ← 已运行且失败
NOT_RUN                      ← 存在但本次未运行
NOT_AVAILABLE                ← 需要的环境/硬件不存在
BLOCKED_BY_EXISTING_FAILURE  ← 依赖的前置检查已失败
```

禁止把 `NOT_RUN` 报告为 `PASS`。每项验证分开报告，让完成声明可被追溯复验。

### 原理 4：结构债务要说出来，不能静默压缩

修复超过 400 行文件时，AI 必须检查变更边界是否出现结构债务信号：

- 文件有多个独立的变更原因或多个用户工作流
- UI、状态转换、持久化 I/O、解析、配置混在一个类或模块中
- 最近重复的提交或当前改动在同一个超大所有者上扩展

发现信号时，必须报告 `ACCUMULATING_STRUCTURAL_DEBT` 并给出具体责任图（当前所有者、候选规范所有者、接口、消费者、预期读取范围缩减）。"发现结构问题"是 AI 的义务，"重构"需要用户明确授权——两者分开。

### 原理 5：新项目按复杂度选档位

```
MICRO    单文件脚本 / 教学实验 / 快速原型
         必要：行为 + 错误处理 + 运行说明
         不创建：AGENTS.md、架构文档、Bug 记录、函数索引

STANDARD 普通 CLI / Web 应用 / 服务 / 自动化工具（仅明确要求轻量时使用）
         必要：入口 + 配置 + 模块边界 + README + 最小测试
         不创建：不必要的导航层级

DURABLE  **默认档位**：长期 AI 维护 / 多人协作 / 大型项目 / 高安全财务数据要求
         必要：AGENTS.md + ai-context/INDEX.md + 按目录的多级导航 + 任务路由 + 结构证据
         新增功能：更新最近一级 INDEX；独立职责创建规范模块，禁止无限堆入超大文件
```

---

## 三、两个 Skill 详解

标准源路径：`skills/ai-project-maintainer/SKILL.md` 和 `skills/ai-project-bootstrapper/SKILL.md`。两个 Skill 自包含，可单独安装，也可一起安装。

### `ai-project-maintainer` — 已有项目维护者

**适用场景：** 修 Bug、回归排查、代码审查、解释已有代码、导入项目整理、结构重构（需授权）、解决 God Class 和可维护性问题。

**工作流程：**

```
1. 从用户意图判断路径（READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE）
2. 确认 project_root 和 target_anchor，读取项目规则，保留脏工作树
3. 读取目标 + 最多一个直接依赖 + 相关配置 + 最小测试
4. 按路径执行：只读报告 / 最小修改+回归测试 / 职责迁移+基线+删旧实现
5. 明确要求“整理维护文档”时，进入全项目 Markdown 整理路径；复用已有文档目录，迁移老文档并修复引用，重复执行保持幂等
6. 新增或扩展功能（含 UI）同步更新架构文档；新项目默认把维护文档放入 `文档/`
7. 维护性检查点：大文件变更前检查结构债务信号
8. 完成报告：分开报告行为、结构、环境和未运行检查
```

**完成报告格式：**

```
路径：READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE / EXTERNAL_ACTION gate
根目录与锚点：...
授权范围：...
修改：文件/符号 -> 原因；只读时明确"无文件修改"
验证：检查项 -> 必要/可用/已运行/结果/证据
结构状态：不适用 / Scaffolded / Partially extracted / Completed for approved scope
记录：更新或明确无需更新的项目记录
未完成与风险：...
```

**结构变更的证据要求：** 只有完整职责真正迁移、消费者和测试跟随新所有者、旧实现被删除且证据充分时，才能报告 `Completed for approved scope`。仅搭目录、添加 facade 或保留影子实现只能报告 `Scaffolded` 或 `Partially extracted`。

---

### `ai-project-bootstrapper` — 新项目初始化器

**适用场景：** 目标实现尚不存在时——新建独立 CLI、应用、服务、Worker、守护进程或自动化工具。即使提供了路径、spec 或资产，只要实现不存在，仍使用本 Skill。

> 已有 monorepo 中新增 package、修改现有源码、解释现有代码 → 使用 `ai-project-maintainer`。

**档位选择逻辑：**

```
用户要求单文件 / 一次性脚本 / 快速实验  ──> MICRO
  无服务生命周期、无复杂持久化、无多模块接口、无长期维护需求

普通应用 / 服务 / CLI / 自动化工具（无特殊要求）──> STANDARD（默认）
  建立清晰入口、模块边界、README、最小测试

长期维护 / 多人多 AI 协作 / 大型项目 / 高安全财务数据要求 ──> DURABLE（默认）
  添加 AGENTS.md、ai-context/INDEX.md、按目录的多级导航、任务路由、架构记录、操作验证；新增独立职责时创建规范模块并更新最近一级 INDEX

新项目维护文档默认放入根 `文档/`；已有 `文档/`、`docs/` 或 `documentation/` 时复用，不重复迁移，后续新增维护文档直接写入已选规范目录。
```

**完成报告格式：**

```
项目根目录：...
档位：MICRO / STANDARD / DURABLE
当前工作流：...
模块边界：职责 -> 唯一规范来源/实现 -> 公共接口
导航记录：创建了什么及原因；未创建什么及原因
验证：检查项 -> 必要/可用/已运行/结果/证据
未完成与风险：...
```

---

## 四、任务分流机制

AI 收到请求后，首先判断是“新建”还是“维护”：

```
有现有项目证据（路径、文件、函数、报错、测试、调用路径）
  └─> ai-project-maintainer
       ├─ 新增/扩展功能 -> 需求澄清门（三选一） -> NORMAL_CHANGE 或已授权结构路径
       └─ 修 Bug / 解释 / 审查 / 诊断 / 普通配置 -> 现有路径，不显示需求问卷

没有实现、要求新建独立程序/服务/CLI/自动化工具
  └─> ai-project-bootstrapper
       └─ 需求澄清门（三选一） -> MICRO / STANDARD / DURABLE

已有 monorepo 中新增 package
  └─> ai-project-maintainer（维护已有仓库）

“看看结构” / 模糊审计请求
  └─> ai-project-maintainer READ_ONLY（不移动文件）

删除 / 推送 / 发布 / 部署
  └─> EXTERNAL_ACTION 门（每个操作单独确认）

意图不明确
  └─> 只询问一次，不扫描工作区，不启动子代理，不创建文件
```

### 新项目和新增功能的三选一

需求门只在新建项目或新增功能前出现，固定提供三个选择：

- **开始需求问卷**：每次只问一个最影响实现的问题，并说明为什么问；动态补齐信息后，总结目标、范围、约束、验收标准和暂不处理项，等待确认再开始。
- **跳过问卷**：不做结构化访谈；只有缺少目标路径、技术栈、关键行为或验收条件等执行必需信息时才补问。
- **完全不问，直接执行**：AI 自行分析和采用合理假设，直接在当前工作区内创建、修改、删除并验证，不能只给方案或停在提问阶段。

需求门不是 IDE 的计划模式。问卷总结确认是需求理解门；IDE 计划模式若由客户端启用，属于独立的执行计划门。`完全不问` 不主动制造 IDE 计划审批，但不能绕过客户端或系统强制的计划门。工作区外文件修改或删除仍需单独确认。

---

## 五、安装

### 推荐：一条命令（需要 Node.js + npx）

```bash
npx skills add https://github.com/canglei9527/ai-maintenance-skills
```

只安装一个 Skill：

```bash
npx skills add https://github.com/canglei9527/ai-maintenance-skills --skill ai-project-maintainer
```

### Claude Code（支持 marketplace 的版本）

```text
/plugin marketplace add canglei9527/ai-maintenance-skills
/plugin install ai-maintenance-skills@ai-maintenance-skills
```

### Codex 和其他插件客户端

在客户端的 Plugins/Marketplace 中搜索 `ai-maintenance-skills`，或使用 GitHub 插件安装入口。仓库提供 `.codex-plugin/plugin.json` 和 `.claude-plugin/plugin.json`。

### 手工后备（无 Node.js / 无插件管理器）

```bash
# macOS / Linux
mkdir -p .agents
cp -R /path/to/ai-maintenance-skills/skills ./.agents/

# Windows PowerShell
New-Item -ItemType Directory -Force .agents | Out-Null
Copy-Item -Recurse -Force C:\path\to\ai-maintenance-skills\skills .agents\
```

完整的安装、更新、卸载说明见 [`docs/installation.md`](docs/installation.md)。

---

## 六、使用示例

安装后直接用自然语言描述任务，无需粘贴提示词或指定 Skill 名称。

**修复 Bug（触发 NORMAL_CHANGE）：**
```
搜索结果把漫画显示到了小说筛选页，请修复并验证。
```

**代码审查（触发 READ_ONLY）：**
```
帮我看看 src/router.js 的结构，有没有明显的设计问题。
```

**结构重构（触发 STRUCTURAL_CHANGE）：**
```
UserService 已经超过 800 行，承担了认证、权限、通知、日志四个职责，帮我拆分它。
```

**新建项目 STANDARD（触发 bootstrapper）：**
```
从零创建一个 Python + Flask 的书源搜索服务，需要 REST API 和 SQLite 存储。
```

**新建单文件工具 MICRO（触发 bootstrapper）：**
```
新建一个单文件 Node.js 脚本，读取 stdin JSON，过滤空字段后输出，不要拆成多文件。
```

`AI修Bug提问模板.md` 是可选的——只在问题复杂、需要跨会话交接，或 AI 明确缺少复现步骤时才使用。

---

## 七、发布流程（维护者参考）

```bash
# 默认 dry-run，不修改任何文件
node scripts/release.mjs --version 0.5.0 --title "标题" --notes-file release-notes.md

# 确认摘要后执行真实发布
node scripts/release.mjs --version 0.5.0 --title "标题" --notes-file release-notes.md --publish

# Windows 一键发布（含防误发布校验）
release.bat
```

发布工具会自动：同步 3 份插件元数据版本、运行验证脚本、创建发布提交和 annotated tag、推送 main 与 tag、通过 `gh` CLI 创建 GitHub Release。

---

## 八、验证

本仓库无 npm 运行时依赖，直接运行：

```bash
node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
node scripts/verify-skill-repo.mjs
git diff --check
```

DURABLE 项目可以复制 `scripts/index-health.mjs`，或从本仓库运行 `node scripts/index-health.mjs <project-root>`，只读检查 `ai-context/**/INDEX.md`。`UNRESOLVED` 表示表格中的本地入口或测试路径不存在并返回失败；`STALE_REVIEW` 表示可选的审核提交已变化或审核日期超过 90 天，只提示复核，不自动重写索引。没有元数据的旧索引继续有效。动态的调用者、被调用者、继承和影响范围仍交给 `rg`、语言服务器、编译器或可选代码图工具。

`evals/` 目录提供 V2 路由与行为评估提示，覆盖所有档位和操作路径。静态脚本无法替代在真实 AI 客户端中的触发评估，因此发布说明会区分自动验证和人工评估。

---

## 版本历史

### v0.4.17 — 2026-10-09

**语言一致性与 Token 优化**
- 修正 6 处中英文混排：`Migration Table` → `迁移表`，`Review thresholds` → `审查阈值`，`Strict budgets` → `严格预算`，以及句子级混排。
- 消除 MICRO 档位文档目录创建条件矛盾：统一为"仅当用户明确要求维护文档时才创建 `文档/` 目录"。
- 消除迁移表时序矛盾：明确"规划列批次前填，证据列批次后补"。
- 精简两个 SKILL.md 的 `description` 字段：从 55-65 词压缩到 30-35 词，删除重复触发词和功能说明（正文已有）。
- 从 `fast-path.md` 移除低频"设计改进和体验优化"段落（15 行），该段落仅在明确 UI 现代化请求时有用，放在高频 Bug 修复路径造成不必要读取。
- 高频路径（Bug 修复、普通变更）每次节省约 10-12% 的参考文档 token 消耗。
- `skills/EVALS.md` 补全 2 个验证场景：文档整理路径的幂等性和触发守卫、需求澄清门三选项行为差异。
- 新建 `ai-context/INDEX.md`：项目自身作为 DURABLE 档位，补齐 7 条主要路由（维护、结构、新建、文档整理、需求门、安装、检查器）。
- `skills/README.md` 安装说明补充项目级和用户级两种范围，与 `docs/installation.md` 一致。

### v0.4.13 — 2026-08-30

**文档整理迁移与统一目录约定**
- 用户明确下达“整理维护文档”“统一文档目录”或“迁移 Markdown 文档”时，`ai-project-maintainer` 才进入全项目文档整理路径。
- 老项目没有规范文档目录时建立统一 `文档/`，扫描 `ARCHITECTURE.md`、`BUG_HISTORY.md`、维护指南、发布说明和索引等历史 Markdown。
- 已有 `文档/`、`docs/`、`documentation/` 或项目约定目录时优先复用；已规范文件不重复移动，只整理新增或遗漏文档。
- 迁移前记录 Git 和引用基线，迁移后修复 Markdown、索引、配置、脚本和源码中的引用路径，并验证重复执行幂等。
- 新项目由 `ai-project-bootstrapper` 默认建立根 `文档/` 存放架构、Bug、维护和发布记录；已有规范目录时复用，后续新增文档直接写入选定目录。
- 根目录工具控制文件不会仅为整洁而强制移动；普通 Bug 修复和纯样式调整不触发全项目文档扫描。

### v0.4.12 — 2026-08-29

**增强新项目自动触发与 Skill 触发确认**
- `ai-project-bootstrapper` 新增中文创建信号：创建、新建、开发、搭建、从零开始、独立项目，以及新应用、网站、服务、接口、CLI、脚本、机器人和自动化工具等表达。
- 新增英文创建信号：`create`、`build`、`scaffold`、`initialize`、`new project`、`from scratch` 和 `standalone` 项目表达。
- 即使没有项目名或文件路径，只要目标实现不存在且属于独立项目，也可自动路由到 bootstrapper。
- 已有源码、修改现有功能、修复 Bug、重构现有项目或解释/审查现有产物，继续路由到 `ai-project-maintainer`，不会误初始化新项目。
- 两个 Skill 都增加首次工作更新的触发确认：实际加载后必须说明已触发的 Skill，并标明 bootstrapper 档位或 maintainer gate；普通回答、工具和代理不得伪称 Skill 已触发。
- 新增中英文自然语言触发、已有项目反向排除和触发确认评估，并由仓库验证器锁定关键契约。

### v0.4.11 — 2026-08-29

**增加 Bug 调查停止门和最小修改契约**
- 修复现有项目 Bug 时，先确认规范实现文件、故障入口和首要验收标准。
- 确认首个可验证根因后停止无关探索，不做全量调用链扩展，不反复扫描其他模块。
- 只有证据证明问题跨越模块边界时，才按一跳依赖逐步扩展，并记录扩展理由。
- 只修改与已确认根因直接相关的实现文件和最小回归测试；不预先修改桥接层、数据库、生成物或其他无关模块。
- 完成报告固定列出流程停止点、根因、修改文件列表、每个修改原因和验证结果。
- 新增停止扩展、生成文件边界和报告字段的评估与仓库静态回归断言。

### v0.4.10 — 2026-08-28

**提升中文 Bug 请求的自动维护路由**
- `ai-project-maintainer` 的触发描述新增 `刷新后又出现`、`取消后仍存在`、`功能不符合预期`、`修复这个BUG` 等高频中文行为回归信号。
- 即使用户没有写项目名、文件路径或“现有项目”，只要明确描述已有功能的错误行为并请求修复，也应自动进入 `NORMAL_CHANGE`，而不是退化为通用探索或新项目初始化。
- 新增两组无路径中文 Bug 评估，并由仓库验证器检查关键触发短语，避免后续描述回退。
- Skill 元描述预算从 600 放宽到 1000 字符；正文仍保持 14,000 字符和 200 行上限。

**目录治理与开源布局借鉴基线**
- 本次发布同时补齐目录演进说明，不把目录治理误写为 v0.4.10 的新增重构；它是此前版本逐步落地、并为本次稳定维护路由提供基础的能力。
- 标准 `skills/` 目录承载可安装 Skill，Skill 内的 `references/` 承载按需细节，避免把复杂流程和所有参考一次性注入上下文。
- `scripts/` 放生产验证和发布脚本，`scripts/tests/` 放 Node 回归测试，源码与测试分离，便于按职责定位和只运行聚焦测试。
- 新建项目使用独立项目根；DURABLE 项目以 `AGENTS.md`、`ai-context/INDEX.md` 和按目录分层的索引组织长期维护导航，而不是生成逐文件清单或把动态调用图复制进 Markdown。
- 该分层布局参考成熟开源项目常用的“可发现入口、职责目录、测试分离、按需文档”模式；仓库当前没有保存具体外部项目名称或链接，因此不对某个项目作无法核实的归属声明。

### v0.4.9 — 2026-08-27

**轻量索引健康检查**
- 新增 `scripts/index-health.mjs`，只读检查 `ai-context/**/INDEX.md` 中的本地入口、聚焦测试和审核元数据。
- 拒绝绝对路径、词法越界与符号链接/目录联接逃逸；支持带空格路径、常见无扩展名项目文件和大小写不敏感的完整/缩写 SHA 前缀。
- `UNRESOLVED` 阻塞 CLI，`STALE_REVIEW` 只提示复核；旧索引没有元数据时继续兼容。
- 为仓库根和最小项目示例新增 `ai-context/INDEX.md`，并将索引健康测试接入 GitHub Actions。

### v0.4.8 — 2026-08-26

**收紧 Bug 修复的执行范围**
- 为维护任务增加单一当前目标、文件组和首要验收标准，后续 backlog 必须拆成独立阶段。
- 默认不启动并行代理；共享文件和耦合调用链必须串行处理，并设置无进展停止条件。
- 增加每轮 2–3 个文件的局部读取预算，限制 `rg` 范围，禁止对未跟踪大文件执行完整 `git diff --no-index`。
- 构建失败时先检查报错上下文、文件状态和并发修改，再决定是否重跑；只有 focused test 通过后才进入边界构建。
- 完成报告区分已验证完成、未验证修改、半成品、未开始和阻塞状态。

### v0.4.6 — 2026-08-24

**修正最小改动边界**
- 明确“最小兼容修改”主要约束 Bug 修复、配置调整和聚焦行为修正，避免无关重构。
- 用户明确要求现代化界面、改进用户体验或优化交互流程时，不再把任务压缩成换主题色或添加动画。
- 允许根据目标重设计布局、信息层级、空间利用、状态可见性和 UI 组件结构。
- 要求保持数据格式、API 契约和核心功能行为兼容，并验证主要用户流程。

### v0.4.5 — 2026-08-24

**上下文预算控制**
- 为 `ai-project-maintainer` 增加字节级输出预算：单次读取默认不超过 150 行 / 15 KB，单次命令输出默认不超过 8 KB。
- 单个任务累计读取和命令输出达到约 40 KB 时，先总结当前证据，再决定是否继续扩展调查，避免小操作持续堆积到上下文耗尽。
- 在大型或脏仓库中优先使用 `git diff --stat` / `git diff --shortstat`，避免无边界地载入完整差异。
- 增加远程 HTML/JSON、二进制和压缩文件的读取边界，禁止把原始压缩字节流当作文本送入上下文。

**行为边界**
- 保留原有的 50 个搜索命中、12 个候选文件和一跳依赖限制；新增预算是成本控制，不是把普通维护任务改成全量扫描。
- 达到预算后先形成中间结论，只有现有证据不足时才继续读取，确保“读小文件”不会因为重复工具输出变成不可控的上下文增长。

### v0.4.4 — 2026-08-16

**维护行为修正**
- 索引维护改为触发条件制：只有新增文件/目录/公共入口/稳定路由，或完成 `STRUCTURAL_CHANGE` 时，才更新或新建 `ai-context/INDEX.md`。
- 完成报告按任务规模分级：简单问答和 1–2 文件的小改动不再强制输出冗长模板，复杂变更仍保留完整证据格式。
- `ACCUMULATING_STRUCTURAL_DEBT` 改为完成报告中的风险附注，不再无故中断聚焦修复。
- `ai-project-bootstrapper` 的不确定默认档位调整为 `STANDARD`，只有明确的长期协作、复杂导航或高风险约束才使用 `DURABLE`。

### v0.4.3 — 2026-08-13

**基础设施改进**
- 测试代码从 `scripts/` 迁入 `scripts/tests/` 子目录，源码与测试分离
- SKILL.md 支持可选 `version` 字段，使用者可识别已安装的版本号
- 新增 Windows 一键发布脚本 `release.bat`，含防误发布到错误仓库的发布前校验

**Token 优化（约节省 15–18%，无行为变化）**
- 删除 TMS320/CCS 实时固件专用章节（当前用户不需要，约 45 行）
- 删除 `fast-path.md` 末尾与 SKILL.md 完全重复的完成报告模板（12 行）
- 删除 `structural-change.md` 中已被 fast-path.md 覆盖的章节（5 行）
- 删除 `workflow.md` 中与 SKILL.md Immutable Rules 重复的章节（7 行）
- 删除 `navigation-and-budgets.md` 顶部 AI 不需要的目录章节（8 行）
- 所有章节标题和规则散文统一为中文，保留所有代码标识符和 anchor 字符串

### v0.4.2 — 2026-08-12


- 新增累积性结构债务检测：普通修复不再把结构问题压成"文件较大"一笔带过
- Maintainer 增加维护性检查点：大文件、入口/facade 或反复补丁历史触发信号检查
- 命中信号时报告 `ACCUMULATING_STRUCTURAL_DEBT`，并给出具体责任图
- 用户明确要求解决结构问题时直接进入 `STRUCTURAL_CHANGE`，不用最小补丁敷衍
- 新增两个评估场景和规则回归测试

### v0.4.1 — 2026-08-07

V2 完整重构，核心目标：清晰边界、按需加载、诚实验证。

- **分流重构：** bootstrapper 负责"实现尚不存在"的新建，maintainer 负责所有已有源码操作
- **Bootstrapper 三档：** 引入 MICRO / STANDARD / DURABLE，每档有明确的必要形态和禁止创建清单
- **Maintainer 四路径：** READ_ONLY / NORMAL_CHANGE / STRUCTURAL_CHANGE / EXTERNAL_ACTION，写入权限各自独立
- **结构迁移证据：** 必须建立基线、职责迁移表、删除旧实现，才能报告 `Completed`
- **预算策略修正：** 400/200/800 数值是审查阈值，不是所有任务的无条件失败门
- **导航记录策略：** 只在有当前导航或历史价值时创建，不因 Skill 加载就生成空文档树
- **验证状态统一：** PASS / FAIL / NOT_RUN / NOT_AVAILABLE / BLOCKED_BY_EXISTING_FAILURE
- **Reference 结构：** 两个 SKILL.md 各自一跳直达对应 references，可独立安装

### v0.4.0 — 2026-08-06

- 强制单一职责手写文件（100–300 行）
- 将 400/200/800 数值设为硬闸门，要求源码目录索引、根任务路由和维护路径验收
- 增加独立评估清单、项目文档模板和维护记录模板

### v0.3.0 — 2026-08-04

- 迁移到插件兼容的 `skills/` 标准目录
- 修复非法 YAML frontmatter，恢复两个 Skill 的完整发现和安装
- 精简 SKILL.md，将复杂规则移入 `references/` 按需加载
- 增加无依赖 frontmatter 解析器和 Node 回归测试

### v0.2.x — 2026-08-02

- v0.2.5：两阶段读取协议，搜索和依赖扩展上限，按层级扩大的证据门槛
- v0.2.4：任务分流门，bootstrapper 优先处理无已有实现的新建请求
- v0.2.3：导入项目整理规则，整理前基线 + 分批整理 + 整理后回归
- v0.2.2：新项目必须先确定独立项目根目录
- v0.2.0–v0.2.1：Claude/Codex 插件元数据，`npx skills add` 安装入口

### v0.1.0 — 2026-08-02

初始版本：`ai-project-maintainer` + `ai-project-bootstrapper`，架构说明，中文提问模板，示例项目文档，无依赖 Node.js 验证脚本，Apache License 2.0。

---

## 许可证

本仓库采用 [Apache License 2.0](LICENSE)。第三方工具、模型或示例项目请另行检查其许可证。

---

## English Quick Start

Two installable AI engineering skills:

- **`ai-project-maintainer`** — for existing projects: local reads, minimal changes, honest verification, structural debt surfacing.
- **`ai-project-bootstrapper`** — for new projects: right-sized tier (MICRO / STANDARD / DURABLE), minimal governance, no speculative docs.

**Install:**
```bash
npx skills add https://github.com/canglei9527/ai-maintenance-skills
```

**Use:** Describe your task in natural language. The AI selects the skill and path automatically.

**Key rules:**
- A file path is location evidence, not write authorization.
- Default read budget: 50 search hits, 12 candidate files, one dependency hop.
- Verification states: `PASS` / `FAIL` / `NOT_RUN` / `NOT_AVAILABLE` / `BLOCKED_BY_EXISTING_FAILURE`. Never report skipped checks as passing.
- Large files (>400 lines) don't require prior refactor. Structural debt is surfaced explicitly, refactoring requires user authorization.
- MICRO projects don't get `AGENTS.md`, architecture docs, or bug history by default.

**Verify:**
```bash
node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
node scripts/verify-skill-repo.mjs
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.


