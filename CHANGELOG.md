# 变更记录

## 0.4.16 - 2026-09-20

### 修复：Skill 触发失败（触发词排在客户端可见窗口外）

**问题现象**
- Skills 已正确安装且所有验证通过，但实际对话中几乎从不自动触发
- "继续这个没完成的"等续作请求完全无法触发 `ai-project-maintainer`
- 用户只能手动点名 Skill，自动路由功能失效

**根本原因**
客户端技能列表只把 `description` 的前 **249 字符**渲染给模型。原 `description` 设计把中文触发词排在第 258+ 字符位置（`修复、解决` 在 258，`刷新后又出现` 在 276），英文核心词 `bug` 在第 260 字符——模型在选择 Skill 时完全看不到这些触发词，只能看到英文框架描述的影子。

独立缺陷：两个 `description` 完全没有"继续/未完成/收尾/验证归档"等续作类触发词，即使完整描述可见也不覆盖"继续未完成的阶段"这类请求。

**修复措施**
1. **重排 `ai-project-maintainer` description**（489 → 409 字符）
   - 中文触发词前置：修复、解决、排查、异常、报错、回归、刷新后又出现、修复这个BUG、现有产品行为与期望行为的差异
   - 增加续作类触发词：继续未完成的工作、收尾阶段、验证并归档、更新维护文档
   - 英文核心词前置：`Use for bug, regression, broken feature...`（bug/fix/review/diagnose/regression 全部在 249 窗口内）

2. **增加 `when_to_use` 字段**
   - 客户端诊断文档明确说明模型会看 `description` + `when_to_use`
   - maintainer: "Existing project maintenance: bug fixes, feature changes, refactoring, code review, investigation. Not for creating new projects from scratch."
   - bootstrapper: "Creating new standalone projects from scratch. Not for modifying, fixing, or reviewing existing code."

3. **解析器与验证器增强**
   - 放宽 `scripts/skill-frontmatter.mjs` 从只允许 name/version/description 三个键，改为接受 when_to_use/license/metadata（与客户端对齐）
   - 更新 `scripts/verify-skill-repo.mjs` 窗口检查列表，增加英文核心词（bug、fix、review、diagnose、regression）和"期望行为"
   - 新增回归门确保所有中英文触发词都在 249 字符窗口内，防止未来再次截断

4. **文档更新**
   - `CONTRIBUTING.md`：明确 description 前 249 字符窗口约束，要求触发词前置
   - `evals/prompts.md`：增加第 28、29 条评估提示（续作触发、可见窗口检查项）
   - `BUG_HISTORY.md`：详细记录现象、根因、修复措施、验证方法和未验证风险

**验证结果**
- 35 个 Node 测试全部通过
- 仓库验证通过（2 个 Skill、44 个必需文件、版本一致性、窗口可见性全部通过）
- 回归门反向验证：临时破坏触发词位置后门正确报错，证明其可失败而非恒真
- 已同步到 `~/.zcode/skills` 和 `~/.agents/skills` 两处已安装位置

**注意事项**
- 用户需**重启 ZCode 客户端**才能让修改生效（客户端启动时重新扫描技能目录）
- 249 字符窗口是从当前客户端版本实际渲染反推的，不是公开契约；客户端升级后可能变化
- 本轮未在真实客户端做端到端前向触发测试，触发改善程度需用户实际观测

**影响文件**
- `skills/ai-project-maintainer/SKILL.md`
- `skills/ai-project-bootstrapper/SKILL.md`
- `scripts/skill-frontmatter.mjs`
- `scripts/tests/skill-frontmatter.test.mjs`
- `scripts/verify-skill-repo.mjs`
- `CONTRIBUTING.md`
- `evals/prompts.md`
- `BUG_HISTORY.md`

## 0.4.15 - 2026-09-05

- Default new projects to DURABLE for long-term AI maintenance.
- Make repository verification report missing files without uncaught ENOENT errors.
- Preserve focused, bounded file-reading guidance.

## 0.4.14 - 2026-09-02

- 优化 Skills 的 token 消耗：移除重复 `requirements-dialogue.md`，改为 `skills/shared/requirements-dialogue.md`
- 精简 maintainer `fast-path.md` 和 bootstrapper `navigation-and-budgets.md` 规则
- 将 `v2-migration-notes.md` 归档到 `docs/history/`
- 更新验证脚本、架构索引和维护历史记录

## 0.4.13 - 2026-08-29

- # v0.4.13 发布介绍：文档整理迁移与统一目录约定
- 发布日期：2026-08-30 · 版本线：0.4.12 -> 0.4.13
- ## 一、这次发布解决什么问题
- 长期维护的老项目经常把 `ARCHITECTURE.md`、`BUG_HISTORY.md`、维护指南和发布说明散落在根目录、源码目录和临时目录中。此前 Skill 没有专门的文档整理路径，无法在用户明确要求时安全地统一目录并修复引用；新项目也没有统一的维护文档默认位置。
- v0.4.13 增加按需文档整理迁移流程，并规定新项目默认使用 `文档/` 保存维护文档。
- ## 二、已有项目文档整理
- 只有用户明确下达“整理维护文档”“统一文档目录”“迁移 Markdown 文档”等命令时，才进入全项目 Markdown 扫描和结构变更路径。
- 扫描项目内历史 Markdown，包括架构、Bug 历史、维护指南、发布说明和目录索引；
- 排除依赖、vendor、构建输出、缓存、生成物、二进制、媒体、密钥和未明确包含的嵌套项目；
- 没有规范文档目录的老项目，建立统一 `文档/` 并迁移可迁移维护文档；
- 已有 `文档/`、`docs/`、`documentation/` 或项目约定目录时优先复用；
- 已在规范目录中的文件保持原位，只整理新增或遗漏文档，不重复移动；
- 迁移前记录 Git 状态、文件清单和引用基线，迁移后修复并验证 Markdown、索引、配置、脚本和源码中的文档路径；
- 同一整理命令重复执行必须幂等，已规范文件和正确引用不再改写。
- 根目录中的 `AGENTS.md`、`CLAUDE.md`、`README.md` 等被工具要求从根读取的控制文件，不会为了目录整洁而强制移动。
- ## 三、新项目默认文档目录
- `ai-project-bootstrapper` 创建新项目时默认建立根 `文档/` 目录，维护文档直接放入其中，包括：
- `ARCHITECTURE.md`；
- `BUG_HISTORY.md`；
- 维护记录；
- 发布说明。
- 如果目标已经采用 `文档/`、`docs/` 或 `documentation/`，则复用现有目录，不重复迁移；后续新增维护文档直接写入已选规范目录。`MICRO` 单文件工具只有在用户明确要求不需要维护文档时才可跳过该目录。
- ## 四、兼容性与边界
- 普通 Bug 修复、纯样式调整和一般新增功能不会触发全项目文档扫描；
- 新增或扩展功能仍需同步更新相关架构文档；
- 文档迁移属于 `STRUCTURAL_CHANGE`，移动文件前需要明确授权并建立基线；
- 冲突、归属不明或工具根目录约定不明的文件停止迁移并单独报告；
- 不删除有内容的文档，不覆盖同名文件，不把业务文档误判为维护文档。
- ## 五、评估与验证
- 新增人工评估覆盖老项目全量整理、已有 `docs/` 目录复用、幂等重复执行、引用修复和新项目默认 `文档/` 目录。仓库验证器检查文档整理触发门、迁移工作流、引用修复、后续文档写入位置和 bootstrapper 兼容规则。
- 发布前运行：
- ```text
- node scripts/verify-skill-repo.mjs
- node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
- git diff --check
- ```
- 结果：仓库验证通过，45 个必需文件检查通过，33/33 Node 测试通过，空白检查通过。真实项目的文件迁移仍需在目标项目中由用户明确授权后执行。
- ## 六、安装与同步
- ```bash
- npx skills add https://github.com/canglei9527/flow-pilot
- ```
- 已安装旧版本的使用者需要重新同步或重新安装 Skill，才能获得 v0.4.13 的文档整理迁移能力和新项目默认文档目录约定。

## 0.4.12 - 2026-08-29

- # v0.4.12 发布介绍：增强新项目自动触发与 Skill 触发确认
- 发布日期：2026-08-29 · 版本线：0.4.11 -> 0.4.12
- ## 一、这次发布解决什么问题
- `ai-project-bootstrapper` 原本能识别新目录、空目录、spec 和常见项目类型，但对没有项目名或文件路径的自然语言创建请求覆盖不足，也没有像维护 Skill 一样明确列出中文和英文触发信号。用户难以判断当前请求究竟进入了新项目初始化还是已有项目维护。
- v0.4.12 将新项目触发词、已有项目排除边界和首次工作更新确认写成可回归契约，并保留 `ai-project-maintainer` 的触发确认规则。
- ## 二、触发条件增强
- `ai-project-bootstrapper` 现在识别以下新项目创建信号：
- ### 中文信号
- 创建、新建、开发、搭建、实现一个新应用、网站、服务、接口、CLI、脚本、机器人或自动化工具；
- 从零开始；
- 独立项目；
- 即使用户没有提供项目名或文件路径，只要目标实现不存在且属于独立项目，也可以触发初始化器。
- ### 英文信号
- `create`、`build`、`scaffold`、`initialize`；
- `new project`、`from scratch`；
- `standalone application`、`standalone service`、`standalone CLI`。
- 这些信号只影响 Skill 发现和任务路由，不代表已经授权执行外部操作或修改任意现有代码。
- ## 三、已有项目排除边界
- 以下请求必须转到 `ai-project-maintainer`：
- 修改已有源码或现有功能；
- 修复 Bug、回归或错误行为；
- 重构已有项目；
- 解释、审查或诊断现有产物而不要求创建新实现。
- 路径、spec、资产和附件只是定位或需求输入，不能单独证明目标是新项目，也不能授予修改现有仓库的权限。
- ## 四、触发确认
- 当 `ai-project-bootstrapper` 实际被加载后，首次面向用户的工作更新必须明确写出：
- ```text
- 已触发 ai-project-bootstrapper；当前档位为 STANDARD。
- ```
- 其中档位可为 `MICRO`、`STANDARD` 或 `DURABLE`。只有实际加载该 Skill 后才能使用这句确认；普通回答、通用工具或代理不得伪称 Skill 已触发。维护任务同样要求确认“已触发 ai-project-maintainer”并标明对应 gate。
- ## 五、评估与验证
- 新增评估覆盖：
- 无项目名、无文件路径的中文“从零开始搭建独立项目”请求；
- 英文 `scaffold`、`new project`、`standalone`、`from scratch` 请求；
- “修复现有项目 Bug”与“修改现有源码”的反向分流；
- bootstrapper 首次工作更新的触发确认和档位报告。
- 仓库验证器新增中英文触发词、已有项目排除、触发确认和原有根目录边界断言。
- ## 六、兼容性
- 不改变 `MICRO`、`STANDARD`、`DURABLE` 档位的职责和验证要求；
- 不改变现有安装入口、插件能力或外部操作授权；
- 继续保留 `ai-project-maintainer` 对已有项目的维护优先级；
- 需要发布、推送、部署或其他远端操作时，仍需走独立的 `EXTERNAL_ACTION` gate。
- ## 七、发布验证
- 发布前运行：
- ```text
- node scripts/verify-skill-repo.mjs
- node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
- git diff --check
- ```
- 结果：仓库验证通过，33/33 Node 测试通过，空白检查通过。实际客户端中的 Skill 竞争触发排序仍需在支持 Skills 的新会话中使用新增评估提示进行人工 forward-test。
- ## 八、安装与同步
- ```bash
- npx skills add https://github.com/canglei9527/flow-pilot
- ```
- 已安装旧版本的使用者需要重新同步或重新安装 Skill，才能获得 v0.4.12 的新项目触发条件和触发确认规则。

## 0.4.11 - 2026-08-29

- # v0.4.11 发布介绍：收紧 Bug 调查停止点和最小修改边界
- 发布日期：2026-08-29 · 版本线：0.4.10 -> 0.4.11
- ## 一、这次发布解决什么问题
- 维护现有项目时，用户通常只需要修复一个可复现的 Bug，但代理可能在根因尚未确认前继续扫描多个模块、扩展完整调用链，甚至预先改动桥接层、数据库和构建产物。这种做法会扩大变更范围、增加上下文消耗，也容易把猜测当成根因。
- v0.4.11 将“调查何时停止、哪些文件可以修改、完成时必须报告什么”写成维护 Skill 的明确契约。
- ## 二、调查停止门
- 每个 `NORMAL_CHANGE` Bug 修复阶段先确定：
- 当前故障或行为差异
- 规范实现文件
- 故障入口
- 一个首要验收标准
- 确认首个可验证根因后，立即停止无关探索：
- 不做全量调用链扩展
- 不反复扫描其他模块
- 不为了建立完整项目地图而读取无关文件
- 不把用户提到的后续 backlog 自动并入当前阶段
- 只有以下证据出现时才允许扩展一层：精确符号存在多个真实调用方、边界确实跨越包/进程/服务/数据库/浏览器、配置存在已证实覆盖，或测试/启动结果明确显示外部原因。每次扩展都要记录新增证据和验证目的。
- ## 三、最小修改门
- 根因确认后，修改范围限定为：
- 1. 与根因直接相关的规范实现文件；
- 2. 能复现该行为的最小回归测试；
- 3. 验证所需的必要配置。
- 禁止借修复机会做无关重构、格式化、重命名、依赖升级或预先修改桥接层、数据库、打包目录和其他模块。构建产物或生成文件不能作为首选修改目标，必须通过其规范源文件重新生成。
- ## 四、完成报告契约
- 维护任务完成报告必须明确列出：
- **流程停止点**：在哪个规范实现文件和哪个首个可验证根因处停止扩展；哪些无关模块未扫描；
- **根因**：由什么证据确认，排除了哪些未经验证的假设；
- **修改文件列表**：每个实现、测试或必要配置文件的修改原因；
- **验证结果**：focused test、语法/类型、构建、启动或用户流程的实际命令和结果；未运行或不可用的检查必须单独标记。
- 这样可以区分真正的 `VERIFIED_COMPLETE` 与只有方案、部分修改或未验证的状态。
- ## 五、评估与仓库验证
- 新增评估场景覆盖用户要求“先全面扫描、一起改桥接层/数据库/生成物”的压力请求。期望代理仍然：
- 触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`；
- 先确认规范实现文件和首要验收标准；
- 在首个可验证根因后停止扩展；
- 只修改根因相关实现和最小回归测试；
- 按契约输出停止点、根因、文件及原因、验证结果。
- 仓库验证器新增对应静态断言，防止规则正文被后续版本删除或弱化。
- ## 六、兼容性与边界
- 无破坏性变更。
- 现有 `READ_ONLY`、`NORMAL_CHANGE`、`STRUCTURAL_CHANGE` 和 `EXTERNAL_ACTION` 路由保持不变。
- 这不是禁止所有跨模块调查；跨边界必须有证据，并且一次只扩展一跳。
- 这不是结构重构授权；用户明确要求解决结构债务时，仍进入 `STRUCTURAL_CHANGE` 流程。
- 新项目仍由 `ai-project-bootstrapper` 处理。
- ## 七、发布验证
- ```text
- node scripts/verify-skill-repo.mjs
- node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
- git diff --check
- ```
- 结果：Skill 仓库验证通过；33/33 Node 测试通过；空白检查通过。
- ## 八、安装与同步
- ```bash
- npx skills add https://github.com/canglei9527/ai-maintenance-skills
- ```
- 已安装旧版本的用户需要同步或重新安装，并重启 ZCode 会话，让新的 Skill 描述和规则参与后续任务。

## 0.4.10 - 2026-08-28

- # v0.4.10 发布介绍：提升中文 Bug 请求的自动维护路由
- 发布日期：2026-08-28 · 版本线：0.4.9 -> 0.4.10
- ## 一、这次发布解决什么问题
- 用户通常不会在第一句话提供项目名、文件路径或“现有项目”字样。更常见的是直接描述故障，例如：
- ```text
- 刷新后取消的下载任务又出来了，修复这个 BUG。
- ```
- 此前，这类短句虽然表达了明确的修复意图，但 `ai-project-maintainer` 的自动触发描述对中文症状词覆盖不足，客户端可能将请求路由到通用探索，而没有先加载维护 Skill 的有界诊断、最小修改和验证规则。
- v0.4.10 将这些高频中文行为回归表达纳入维护 Skill 的元描述，使无路径的 Bug 请求更容易自动进入已有项目维护流程。
- ## 二、触发条件增强
- `ai-project-maintainer` 现在会把下列信号识别为已有项目维护请求，即使用户没有写项目名、文件路径或“现有项目”：
- 明确修复意图：`修复`、`解决`、`排查`、`修复这个BUG`
- 故障和回归信号：`异常`、`报错`、`回归`
- 持久化或刷新问题：`刷新后又出现`、`取消后仍存在`
- 用户可见行为差异：`功能不符合预期`、当前行为与期望行为不一致
- 英文等价表达：bug、regression、broken feature、wrong result、refresh issue、task reappearing
- 这只影响 Skill 发现和路由。它不会把解释、审查或日志阅读自动变成写操作；文件路径和附件仍然只用于定位，写入必须来自用户明确的修复或修改请求。
- ## 三、实际执行行为
- 当这些中文短句触发维护 Skill 后，任务默认走 `NORMAL_CHANGE`：
- 1. 确认当前项目根、目标锚点、范围和现有未提交修改。
- 2. 只读取与现象直接相关的最小调用链、存储逻辑和聚焦测试/复现，而不是扫描整个项目。
- 3. 先验证根因，再进行最小兼容修改。
- 4. 增加或更新最小回归测试，并按实际运行结果报告 `PASS`、`FAIL`、`NOT_RUN` 或阻塞状态。
- 5. 不把用户顺带提到的 Web、Android、构建或其他 backlog 自动并入当前 Bug 修复阶段。
- 这意味着“取消任务刷新后重新出现”应先追踪取消状态、持久化记录和刷新查询；不能仅凭前端 DOM 行为就假设需要新增删除接口，更不能编辑 `build/intermediates` 等生成文件。
- ## 四、回归评估与验证
- 新增两组评估提示，防止后续描述回退：
- 1. `刷新后取消的下载任务又出来了，修复这个 BUG。`
- 2. `加入书架后不能在线阅读，反而变成下载了，帮我修好。`
- 两组提示都要求自动触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`，而不是新项目初始化、通用探索或只读解释。
- 仓库验证器现在断言触发描述必须包含：
- `刷新后又出现`
- `无需现有项目名或文件路径`
- Skill 元描述预算从 600 放宽到 1000 字符，以容纳必要的中英文故障症状；Skill 正文仍保持 14,000 字符和 200 行限制，避免运行时上下文无边界增长。
- ## 五、兼容性
- 无破坏性变更。
- 现有 `READ_ONLY`、`NORMAL_CHANGE`、`STRUCTURAL_CHANGE` 和外部操作门保持不变。
- 新建或空目录的独立项目仍由 `ai-project-bootstrapper` 处理。
- 现有 monorepo 中修改源码、测试、配置或新增 package 仍由 `ai-project-maintainer` 处理。
- 没有明确修改请求的代码解释、审查和诊断仍保持只读。
- ## 六、发布验证
- 发布前已运行：
- ```text
- node scripts/verify-skill-repo.mjs
- node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs
- git diff --check
- ```
- 结果：Skill 仓库验证通过；33/33 Node 测试通过；空白检查通过。
- ## 七、安装与同步
- ```bash
- npx skills add https://github.com/canglei9527/ai-maintenance-skills
- ```
- 已安装旧版本的用户需要同步或重新安装，随后重启 ZCode 会话，新的描述才会参与自动 Skill 匹配。
- ## 六、目录治理与开源布局借鉴
- v0.4.10 同步补充目录演进说明；目录治理不是本版本临时重构，而是此前逐步落地、支撑维护路由和按需上下文加载的基础。
- `skills/` 是可发现和可安装的 Skill 根目录；`skills/*/references/` 存放按任务按需读取的细节，避免每次触发都加载全部规则。
- `scripts/` 放生产验证和发布脚本，`scripts/tests/` 放 Node 回归测试，源码与测试分离；该测试分层在 v0.4.3 落地。
- DURABLE 项目使用独立项目根、`AGENTS.md`、`ai-context/INDEX.md` 和按目录分层导航，索引表达任务意图和第一入口，不复制动态调用图。
- 这套布局借鉴成熟开源项目常见的入口可发现、职责分层、测试分离和按需文档原则；当前仓库没有可核实的具体外部项目名称或链接，因此不作虚构归属。

## 0.4.9 - 2026-08-28

- Add dependency-free index health checker for ai-context/**/INDEX.md with path security validation, SHA prefix matching, review metadata freshness, quoted path parsing, extensionless file support, and directory boundary protection. Includes 23 focused regression tests and full CI integration.

## 0.4.8 - 2026-08-26

- ## 变更
- 收紧 Bug 修复的单阶段执行边界，要求一个当前目标、文件组和首要验收标准。
- 默认禁止并行代理；增加无进展、超范围和跨层架构需求的停止条件。
- 增加每轮 2–3 个文件的局部读取预算，限制 `rg` 范围，禁止对未跟踪大文件执行完整 `git diff --no-index`。
- 构建失败时先检查报错上下文、文件状态和并发修改，再决定是否重跑。
- 增加 focused test 阶段闸门和 `VERIFIED_COMPLETE` 等完成状态分类。
- ## 验证
- `node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`：10/10 通过。
- `node scripts/verify-skill-repo.mjs`：通过。
- `git diff --check`：通过。
- 新增评估场景关键规则检索通过；真实客户端 forward-test 尚未执行。

## 0.4.7 - 2026-08-25

### 需求澄清门

- 新建项目和新增功能前提供“开始需求问卷 / 跳过问卷 / 完全不问，直接执行”三选一。
- 问卷按信息缺口逐题提问并说明原因，完成后总结目标、范围、约束、验收标准和暂不处理项。
- 明确需求门与 IDE 计划模式的边界，并支持工作区内直接执行和验证。

### 验证

- `node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`：10/10 通过。
- `node scripts/verify-skill-repo.mjs`：仓库验证通过。
- `git diff --check`：通过。

## 0.4.6 - 2026-08-24

### 背景

- `NORMAL_CHANGE` 中的“最小兼容修改”原本用于限制 Bug 修复和配置调整的无关范围，但表述过于宽泛，可能让 AI 把明确的界面现代化需求也压缩成换颜色、加动画。
- 这种处理没有改变信息架构、布局密度或交互流程，无法解决用户真正指出的体验问题。

### 变更

- 将普通维护路径中的规则拆分为“修复和配置调整”与“设计改进和体验优化”两类。
- Bug 修复、配置调整和聚焦行为修正仍遵循最小兼容修改，避免借题发挥地重构无关代码。
- 用户明确要求现代化界面、改进用户体验或优化交互流程时，允许重设计布局、信息层级、空间利用、状态可见性和 UI 组件结构。
- 明确禁止只换主题色或添加动画就宣称完成界面现代化；表层装饰必须服务于已经解决的布局和交互问题。

### 兼容性与边界

- 设计改进可以重构 UI 布局和样式架构，但仍需保持数据格式、API 契约和核心功能行为兼容。
- 本版本只调整 AI 维护规则，不修改任何具体应用的界面实现。
- 结构性 UI 重做仍需要按任务范围建立基线、验证主要工作流，并区分行为改动和视觉改动。

### 验证

- `node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`：10/10 通过。
- `node scripts/verify-skill-repo.mjs`：仓库验证通过。
- `git diff --check`：通过。

## 0.4.5 - 2026-08-24

### 背景

- 维护任务可能只读取若干小文件，却因为重复的命令输出、差异内容和远程响应持续累积，最终耗尽 AI 上下文。
- 原有规则限制了搜索命中数、候选文件数和依赖跳数，但没有限制单次输出大小，也没有累计预算。

### 变更

- 在 `ai-project-maintainer/SKILL.md` 增加输出预算门：单次读取默认不超过 150 行 / 15 KB，单次命令输出默认不超过 8 KB，累计工具输出达到约 40 KB 时先总结再继续。
- 在 `references/fast-path.md` 增加具体的读取、命令、累计输出、差异、远程响应以及二进制/压缩文件处理规则。
- 大型或脏仓库优先使用 `git diff --stat` / `git diff --shortstat`，避免把完整工作树差异一次性载入上下文。
- 远程 HTML/JSON 只保留有限的已解压文本片段；`.gz`、`.zip`、图片、PDF 等文件不得直接作为文本读取。

### 兼容性与边界

- 保留原有 50 个搜索命中、12 个候选文件和一跳依赖限制。
- 预算达到后要求先总结和判断证据是否足够，不会把普通维护任务自动升级为全量扫描。
- 这些规则约束 AI 的读取方式，不改变项目源代码、运行时 API 或公开安装入口。

### 验证

- `node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`：10/10 通过。
- `node scripts/verify-skill-repo.mjs`：仓库验证通过。
- `git diff --check`：通过。

## 0.4.4 - 2026-08-16

### 维护行为修正

- 索引维护改为触发条件制：只有新增文件、目录、公共入口或稳定任务路由，且项目源文件总数大于 1，或完成 `STRUCTURAL_CHANGE` 时，才更新或新建 `ai-context/INDEX.md`。
- `READ_ONLY`、单文件 Bug 修复、仅改实现细节和 `MICRO` 单文件脚本不再因为默认维护等级而强制创建索引。
- 完成报告按任务规模分级：简单单文件问答直接给结论，1–2 文件的小改动使用简短摘要，复杂变更才使用完整结构化格式。
- `ACCUMULATING_STRUCTURAL_DEBT` 改为完成报告“未完成与风险”中的非阻断附注，不再无故中断聚焦修复流程。
- `ai-project-bootstrapper` 的不确定默认档位从 `DURABLE` 调整为 `STANDARD`；只有长期 AI 维护、多人协作、多入口或高风险约束才使用 `DURABLE`。

### 影响范围

- 修改 `ai-project-maintainer` 和 `ai-project-bootstrapper` 的路由、索引维护和完成报告规则。
- 保留结构变更的授权门和验证要求；本版本只是减少不必要的文档生成和过长报告，不降低结构变更的证据标准。

## 0.4.3 - 2026-08-13

**基础设施**

- 测试代码与源代码分离：将 `scripts/release.test.mjs` 和 `scripts/skill-frontmatter.test.mjs` 移入 `scripts/tests/` 子目录，源码与测试不再混放。
- frontmatter 解析器新增可选 `version` 字段：SKILL.md 中可声明 `version: "x.y.z"`，方便使用者识别已安装的 skill 版本。
- 同步更新 `scripts/verify-skill-repo.mjs` 中的必要文件路径清单和版本号。
- 同步更新 `.github/workflows/verify.yml` 测试命令路径。
- 新增 Windows 一键发布脚本 `release.bat`，含防误发布到错误仓库的前置校验。

**Token 优化（约节省 15–18%，无行为变化）**

- 删除 `verification-and-safety.md` 中 `Real-Time Verification` 章节（约 20 行，TMS320/CCS 实时固件专用，当前用户不需要）。
- 删除 `verification-and-exceptions.md` 中 `TMS320, CCS, And Real-Time Firmware` 整章（约 25 行，同上）。
- 删除 `fast-path.md` 末尾 `Completion Evidence` 代码块（12 行，与 SKILL.md 完成报告完全重复）。
- 删除 `structural-change.md` 中 `Large-File Normal Fix Boundary` 章节（5 行，已被 fast-path.md 维护性检查点覆盖）。
- 删除 `workflow.md` 中 `Current Records Only` 章节（7 行，与 SKILL.md Immutable Rules 重复）。
- 删除 `navigation-and-budgets.md` 顶部 `Contents` 目录章节（8 行，AI 不需要目录）。
- 将所有章节标题和规则散文从中英混写统一为中文；保留所有英文代码标识符（`PASS`、`FAIL`、`NOT_RUN` 等）和仓库验证器要求的 anchor 字符串不变。
- 压缩 Bootstrapper SKILL.md 各档位长描述，去除与 references 文件重复的规则条目。


- 新增累积性结构债务检测：普通修复不再把结构问题压成“文件较大”一笔带过。
- Maintainer 增加维护性检查点：手写文件超过 400 行、入口/UI/控制器/facade 超过 200 行、或存在反复补丁历史时，先检查变更边界是否有多个独立变更原因、多工作流、混合职责、独立可测分组或反复扩展同一超大所有者。
- 命中信号时报告 ACCUMULATING_STRUCTURAL_DEBT，并给出具体责任图：当前所有者、候选规范所有者、接口、消费者、独立验证和预期读取范围缩减；聚焦修复仍按 NORMAL_CHANGE 完成，不强制无关迁移。
- 用户明确要求停止堆补丁、解决 God Class 或让项目更容易维护时，直接进入 STRUCTURAL_CHANGE，不再用最小补丁加“未来重构”空头承诺答复。
- 新增两个评估场景（Repeated Patches Grow A God Class、Focused Fix Encounters Accumulating Debt）和规则回归测试，锁定上述路由与检查点行为。

## 0.4.1 - 2026-08-07

- 本次 v0.4.1 发布同步两个项目 Skill 的 V2 重构，目标是让新建、维护、只读分析和结构迁移有清晰边界，让规则按需加载，并让完成声明与真实验证证据一致。
- 新建项目分流：当目标实现尚不存在时，即使用户提供了路径、spec、素材或空目录，仍由 ai-project-bootstrapper 负责；已有 monorepo 中新增 package、修改现有源码或解释现有项目，则由 ai-project-maintainer 负责。路径和附件只用于定位，不自动授予写入权限。
- Bootstrapper 档位：引入 MICRO、STANDARD、DURABLE 三档。MICRO 适用于一次性脚本、教学实验、快速原型和明确要求的单文件工具，保持单文件并只提供必要的运行错误处理和最小验证，不自动创建完整治理树。STANDARD 适用于普通 CLI、桌面工具、Web 应用、服务和自动化工具，建立明确入口、集中配置、模块职责、启动说明和最小测试。DURABLE 只在长期 AI 维护、多人或多 AI 协作、多入口、多工作流，或安全、硬件、财务、数据一致性要求较高时启用，并按需建立任务路由、架构主题、操作验证和严格结构证据。
- Maintainer 路径：引入 READ_ONLY、NORMAL_CHANGE、STRUCTURAL_CHANGE，并将 EXTERNAL_ACTION 作为删除、推送、发布、部署和远端变更的独立授权门。READ_ONLY 只解释、审查和诊断，不写源码、测试、Bug 记录、索引、分支或备份。NORMAL_CHANGE 采用最小兼容修改，普通 Bug 修复不因目标文件较大而强制先重构。STRUCTURAL_CHANGE 仅在明确要求或批准范围内执行结构迁移。
- 结构迁移证据：结构任务必须先建立基线，明确批准范围、消费者、公共入口和兼容路径，并使用职责迁移表记录旧所有者、新规范所有者、消费者、兼容路径、旧实现删除证据和验证结果。只有完整职责真正迁移、消费者和测试跟随新所有者、旧实现被删除且证据充分时，才能报告 Completed for approved scope；仅搭目录、添加 facade、复制代码或保留影子实现只能报告 Scaffolded 或 Partially extracted。
- 预算策略：400 行手写实现、200 行入口/facade/兼容模块/索引，以及约 800 行典型维护读取路径现在默认是审查阈值，不是所有任务的无条件失败门。只有 DURABLE、STRUCTURAL_CHANGE、明确要求上下文优化或明确要求文件治理时，才可将其作为严格验收门；拆分仍须证明职责独立、接口清晰、可独立验证并实际减少读取范围，同时避免 facade 链、循环依赖、重复类型和重复规则。
- 导航和记录：任务地图、目录索引、函数索引、架构主题和 Bug 记录只在具有当前导航价值或历史价值时创建或更新。不会因为 Skill 被加载就创建空文档树，不会将索引当作逐文件读取清单，也不会把未来可能的需求预先写成项目记录。
- 例外和规范所有权：生成代码、vendor、声明式数据、框架约束、ABI、内存布局和实时控制代码按实际所有权和验证约束处理。多实现仅在公共接口、唯一选择逻辑、统一配置来源、一致性测试和明确所有权都存在时共存；同一业务规则不得在多个位置复制。
- TMS320/CCS 和实时固件：涉及控制 ISR、ADC/PWM 链、CLA Task、保护逻辑、启动代码、中断向量、链接段或必须内联算法时，必须按需确认 ISR 周期和触发源、ADC SOC/EOC、EPWM 时序、CLA/CPU 与 Shared/Message RAM 数据所有权、CODE_SECTION/DATA_SECTION 和 linker .cmd、优化与内联、最坏执行时间及保护优先级。不能仅凭行数或主机测试宣称实时安全。
- 验证状态：验证结果统一使用 PASS、FAIL、NOT_RUN、NOT_AVAILABLE、BLOCKED_BY_EXISTING_FAILURE。语法/静态分析、编译、链接、仿真、目标板下载、实时波形、ISR 执行时间、保护触发时序和外部服务检查分别报告；未运行、硬件不可用或已有失败不能写成通过。
- Reference 迁移：删除旧的 project-docs-template.md、maintenance-workflow.md 和 project-record-templates.md，新增并从两个 SKILL.md 一跳直达 V2 references。Bootstrapper 使用 workflow.md、navigation-and-budgets.md、verification-and-exceptions.md；Maintainer 使用 fast-path.md、structural-change.md、verification-and-safety.md，并在 v2-migration-notes.md 中保留详细迁移说明。
- 仓库验证：本地 Node.js frontmatter/release 测试通过，技能仓库验证通过，git diff --check 通过，V2 入口和 reference 链接已检查。当前未在真实 AI 客户端重新执行交互式 12 项 forward-test，未运行目标项目硬件、仿真、实时波形或部署验证；这些限制在发布说明中明确标注。

## 0.4.0 - 2026-08-06

- 强制新建项目和已有项目整理使用 100-300 行的单一职责手写文件。
- 将 400 行手写源码、200 行入口/索引/上下文文件和 800 行维护读取路径设为硬闸门。
- 要求源码目录索引、根任务路由、重复实现检查、所有权检查和至少三条维护路径验收。
- 增加独立的评估清单、项目文档模板和维护记录模板，确保低上下文规则可执行、可验证。
- 同步 Claude、Codex 插件及 marketplace 版本到 0.4.0。

## 0.3.0 - 2026-08-04

- 将 Skill 标准源目录从 `.agents/skills/` 迁移到插件兼容的 `skills/`，保持 GitHub 和 `npx skills add` 入口不变。
- 修复 `ai-project-maintainer` 中含未引用冒号的非法 YAML frontmatter，恢复两个 Skill 的完整发现和安装。
- 将两个 `SKILL.md` 精简为边界门、核心闭环、完成条件和条件引用，复杂规则继续在各自 `references/` 中按需加载。
- 移除 bootstrapper 对 maintainer 模板的跨 Skill 引用，保证两个 Skill 可以单独安装。
- 增加无依赖 frontmatter 解析器和 Node 回归测试；验证器现在检查严格元数据、自包含引用和运行时上下文预算。
- 修复 Codex/Claude 插件清单路径，移除无效 `hooks` 字段，并同步版本到 `0.3.0`。
- 清理重复评估清单，更新安装、架构、贡献和验证文档。

## 0.2.5 - 2026-08-02

- 增加两阶段读取协议：先确认 `project_root`、`target_anchor`、读取范围和排除范围，再按目标锚点读取源码。
- 明确 `ARCHITECTURE.md` 和 `FUNCTION_INDEX.md` 是索引，不是逐文件读取清单。
- 增加搜索命中、候选文件和一跳依赖上限，禁止普通维护任务无范围递归扫描。
- 增加按目标目录、所属 package、项目根目录逐层扩大的证据门槛。
- 新项目文档模板增加 `ai-context/`、`FUNCTION_INDEX.md` 和根目录 `AGENTS.md` 读取边界。
- 同步插件版本到 `0.2.5`。

## 0.2.4 - 2026-08-02

- 增加任务分流门，区分新建独立程序和已有项目维护。
- 独立服务、路由器、后台程序、守护进程、CLI 和自动化工具在没有已有项目证据时优先进入 bootstrapper。
- maintainer 要求已有项目路径、文件、函数、报错、测试或调用路径等证据；没有证据时不得扫描当前工作区。
- 意图不明确时只询问一次，不启动子代理、不创建文件。
- 增加 GLM 渠道智能路由器场景的分流评估和静态验证。
- 同步插件版本到 `0.2.4`。

## 0.2.3 - 2026-08-02

- 导入或接手已有项目时，先进行浅层检查并询问是否整理，不再默认移动或重命名文件。
- 用户明确同意整理后，先运行整理前基线，再分批整理并运行整理后回归测试。
- 区分整理前已有失败、整理引入的回归和环境失败；验证失败时停止或恢复失败批次。
- 增加导入项目整理的参考工作流、评估提示和验证规则。
- 同步插件版本到 `0.2.3`。

## 0.2.2 - 2026-08-02

- 新项目初始化时必须先确定或创建独立项目根目录。
- 要求源码、测试、配置、文档和资产都放在该项目目录下，避免混入父级工作区或其他项目源码。
- 更新项目文档模板、评估提示和验证脚本，检查项目根目录隔离规则。
- 同步插件版本到 `0.2.2`。

## 0.2.1 - 2026-08-02

- 将 GitHub 仓库简介和插件元数据描述改为中英文双语。
- 同步 Claude marketplace、Claude plugin 和 Codex plugin 的展示描述。
- 更新验证脚本中的插件版本检查到 `0.2.1`。

## 0.2.0 - 2026-08-02

- 增加 Claude marketplace、Claude plugin 和 Codex plugin 元数据。
- 增加 `npx skills add` 推荐安装入口和统一安装文档。
- 将手工复制 `.agents/skills` 降为无安装器环境的兼容后备。
- 强化安装后直接使用自然语言请求、无需复制模板的说明。
- 扩展仓库验证脚本，检查插件 JSON、Skill 路径、README 安装命令和安装文档。

## 0.1.0 - 2026-08-02

- 创建 `ai-project-maintainer`，覆盖局部读取、最小修改、回归测试、失败验证和 Bug 历史记录。
- 创建 `ai-project-bootstrapper`，覆盖目录设计、模块职责、接口、测试和项目文档初始化。
- 添加架构说明、项目规则、中文提问模板、示例项目文档和评估提示。
- 添加无依赖的 Node.js 仓库验证脚本。
- 采用 Apache License 2.0。
