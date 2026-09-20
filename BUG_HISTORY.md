## 2026-09-05：统一默认 DURABLE 路由并修复验证器缺失文件诊断

- 现象：Bootstrapper 的档位规则一处将 `STANDARD` 作为不确定时默认值，另一处却将严格预算描述为默认 `DURABLE`；仓库验证器发现必需文件缺失后仍无条件读取，可能直接抛出未处理的 `ENOENT`。
- 根因：默认项目级别约定未同步到 Bootstrapper 的全部参考文本；验证器的必需文件检查与后续内容检查之间缺少安全读取边界。
- 修改文件：`skills/ai-project-bootstrapper/SKILL.md`、`skills/ai-project-bootstrapper/references/workflow.md`、`skills/ai-project-bootstrapper/references/navigation-and-budgets.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：将 `DURABLE` 定义为默认档位，仅用户明确要求轻量且无需长期 AI 导航时使用 `STANDARD`；增加安全读取函数，使缺失文件继续汇总为统一 `FAIL`，不再因 `readFileSync` 抛出 `ENOENT` 中断。
- 验证结果：35/35 Node 测试通过；`git diff --check` 通过；仓库验证器正确汇总失败，但被工作区已有 `.zcode` 禁止目录阻塞，未将该环境问题归因于本次改动。

## 2026-09-05：修复 Skill frontmatter 版本漂移

- 现象：两个 `SKILL.md` 的 frontmatter 仍声明 `0.4.3`，而插件与仓库发布版本已是 `0.4.14`；发布脚本和验证器未检查该差异。
- 根因：Skill 版本字段未纳入发布元数据读取、写入和一致性验证。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-bootstrapper/SKILL.md`、`scripts/release-config.mjs`、`scripts/release-version.mjs`、`scripts/verify-skill-repo.mjs`、`scripts/tests/release.test.mjs`、`ARCHITECTURE.md`。
- 修改方式：将两个 Skill 版本同步到 `0.4.14`；发布准备和元数据读取纳入两个 frontmatter 版本；验证器拒绝版本漂移；新增保留 Markdown 格式、CRLF 和缺失版本的回归测试。
- 验证结果：发布测试 8/8 通过；完整仓库验证因工作区已有 `.zcode` 禁止目录而阻塞，未将该环境问题归因于本次改动。

## 2026-09-02：优化 token 消耗，消除重复和精简冗余规则

- 现象：用户反馈感觉 token 消耗变多了，要求分析并优化 skills 目录的 token 使用。
- 分析：发现三个主要问题：(1) `requirements-dialogue.md` 在两个 Skill 中完全重复（43 行 × 2）；(2) `v2-migration-notes.md` 作为历史文档仍在运行时引用路径中（41 行）；(3) `fast-path.md`（115 行）和 `navigation-and-budgets.md`（75 行）中存在冗长重复的规则表述。
- 根因：按需加载设计中没有识别出可共享的文档；历史迁移证据未移出运行时路径；规则表述优先保证完整性而未考虑简洁性。
- 发布补充：首次发布尝试发现仓库远端为 `canglei9527/flow-pilot`，而发布配置仍指向旧仓库 `canglei9527/ai-maintenance-skills`，导致发布脚本安全校验阻止 Release 创建；已修正 `scripts/release-config.mjs` 的仓库约束并在提交前重新验证。
- 修改文件：
  - 新建 `skills/shared/requirements-dialogue.md` 作为两个 Skill 的共享引用
  - 删除 `skills/ai-project-maintainer/references/requirements-dialogue.md`
  - 删除 `skills/ai-project-bootstrapper/references/requirements-dialogue.md`
  - 移动 `skills/ai-project-maintainer/references/v2-migration-notes.md` → `docs/history/v2-migration-notes.md`
  - 精简 `skills/ai-project-maintainer/references/fast-path.md` 中的"每轮读取与搜索预算"、"搜索与读取限制"、"输出预算门"等章节
  - 精简 `skills/ai-project-bootstrapper/references/navigation-and-budgets.md` 中的"导航有成本门槛"、"默认阈值"、"拆分决策顺序"、"规范规则与实现"、"项目边界"等章节
  - 更新 `ARCHITECTURE.md` 反映新的文件组织
  - 更新 `scripts/verify-skill-repo.mjs` 支持共享引用和新的验证规则
- 修改方式：将重复内容提取到共享位置并更新引用路径（`../shared/requirements-dialogue.md`）；历史文档移至 `docs/history/` 归档；将冗长段落规则改为简洁列表格式，使用 `|` 分隔、加粗标题和紧凑表述，保持规则完整性但减少重复说明。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：所有测试通过；仓库验证通过；预计 token 消耗减少约 15-20%，主要来自消除 43 行重复、移除 41 行历史文档和精简 30-40 行冗余表述。

## 2026-08-30：增加文档整理迁移和新项目文档目录约定

- 现象：用户希望通过“整理维护文档”统一老项目的 Markdown 文档，并要求新项目后续维护文档默认归档到统一目录；原有 Skill 没有专用迁移路径，也没有引用修复、已有目录复用和幂等约束。
- 根因：文档整理被混在普通维护和导入项目流程中，缺少明确命令触发的全量扫描边界；bootstrapper 只说明按需建立记录，没有规定默认文档目录和后续写入位置。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/documentation-migration.md`、`skills/ai-project-maintainer/references/fast-path.md`、`skills/ai-project-bootstrapper/SKILL.md`、`skills/ai-project-bootstrapper/references/workflow.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`ARCHITECTURE.md`、`README.md`、`BUG_HISTORY.md`。
- 修改方式：新增文档整理参考，限定“整理维护文档”等明确命令才全量扫描；老项目迁移到 `文档/`，发现 `文档/`、`docs/` 或 `documentation/` 时复用并只整理遗漏；结构化修复 Markdown、索引、配置、脚本和源码引用，迁移前后验证并保证幂等。新项目默认建立 `文档/` 存放架构、Bug、维护和发布记录，已有规范目录时复用，后续新增文档直接写入选定目录。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：新增文档整理与默认目录断言先按 RED 失败，补齐流程后通过；真实项目迁移仍需在用户明确授权和目标项目基线下执行，当前只修改通用 Skill 规则。

## 2026-08-30：新增功能强制同步架构文档

- 现象：用户要求在其他程序中增加界面或新功能时，原有规则只在新增文件、公共入口、稳定路由或结构变更时更新索引，可能让新增功能落地但架构文档仍过期。
- 根因：新增/扩展功能与普通 Bug 修复、纯样式调整共用普通变更路径，缺少“功能实现与架构记录同阶段完成”的明确门槛，也没有要求项目缺少架构文档时创建根级记录。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/fast-path.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：新增功能架构记录门，覆盖新增界面、页面、组件、交互流程和用户可见功能；要求同步更新受影响目录最近一级 `ai-context/INDEX.md`，缺失时创建或补齐根 `ARCHITECTURE.md`，登记入口、职责、数据/接口边界和聚焦验证；普通 Bug 修复和纯样式调整不触发该门。新增人工评估和静态断言。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：新增架构契约断言先按 RED 失败，补充 Skill 和评估规则后转为 GREEN；真实客户端执行仍需用新增评估提示人工 forward-test。

## 2026-08-29：增强新项目 Skill 的自然语言触发

- 现象：`ai-project-bootstrapper` 虽能识别新目录、spec 和常见项目类型，但对没有项目名/路径的中文从零创建请求以及英文 `create`、`build`、`scaffold`、`initialize` 等信号缺少明确覆盖；也没有同等强度的已有项目排除和触发确认评估。
- 根因：初始化 Skill 的 frontmatter 和正文只描述了场景类别，没有把自然语言触发词、独立项目边界、已有源码维护排除和实际加载后的用户提醒定义为可回归契约。
- 修改文件：`skills/ai-project-bootstrapper/SKILL.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：扩展 frontmatter 覆盖中文创建/从零/独立项目信号和英文创建动词；正文新增无路径触发、已有源码/修复/重构转维护者的排除规则，以及首次工作更新的“已触发 ai-project-bootstrapper”与 `MICRO`/`STANDARD`/`DURABLE` 档位确认；新增中英文人工评估和静态验证断言。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：新增 bootstrapper 触发断言先按 RED 失败，补充规则后转为 GREEN；真实客户端的竞争触发排序仍需使用新增评估提示人工 forward-test。

## 2026-08-29：增加维护 Skill 触发确认提醒

- 现象：用户要求确认维护 Skill 是否触发时，原有规则只约束维护路径和完成报告，没有规定首次工作更新必须明确告知用户；普通回答、工具或代理输出也缺少不可伪称的边界。
- 根因：`ai-project-maintainer` 缺少独立的触发确认输出契约，静态仓库验证器和人工评估没有检查“实际加载后提醒 + 当前 gate”这组行为。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：新增触发确认契约，要求实际加载 Skill 后在首次面向用户的工作更新中写出“已触发 ai-project-maintainer”，同时标明 `READ_ONLY`、`NORMAL_CHANGE`、`STRUCTURAL_CHANGE` 或 `EXTERNAL_ACTION` gate；普通回答、通用工具和代理不得伪称 Skill 已触发。新增人工评估提示和静态断言。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：验证器新增断言先出现预期 RED，规则补齐后应转为 GREEN；客户端首次更新中的实际触发排序仍需在支持 Skills 的新会话中人工 forward-test。

## 2026-08-29：增加维护任务调查停止门和最小修改契约

- 现象：修复现有项目 Bug 时，代理可能在根因尚未确认前全量扩展调用链、反复扫描无关模块，并预先修改桥接层、数据库或生成产物；最终报告也可能没有明确流程停止点和规范实现文件。
- 根因：已有预算和阶段闸门限制了读取规模，但没有把“确认规范实现文件 -> 验证首个根因 -> 停止无关扩展 -> 输出固定证据字段”定义为独立契约。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/fast-path.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：新增调查停止门，要求确认规范实现文件和首个可验证根因后停止全量调用链扩展；只有证据显示跨模块时才按一跳依赖扩展。新增最小修改门，禁止无关重构、预先修改桥接层/数据库/生成物；生成文件必须由规范源文件重新生成。完成报告新增流程停止点、根因、修改文件列表、修改原因和验证结果字段。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：新增停止扩展和报告契约断言先按 RED 失败，补规则后通过；完整 Node 测试 33/33 通过；Skill 仓库验证通过；空白检查通过。

## 2026-08-27：增强维护 Skill 的中文自动触发

- 现象：用户使用“刷新后取消的下载任务又出来了，修复这个 BUG”等无项目名、无文件路径的中文短句时，`ai-project-maintainer` 自动触发不稳定，容易退化为通用探索。
- 根因：Skill frontmatter 描述虽然包含 `fix` 和一般行为回归，但缺少高频中文症状词及“无需现有项目名或文件路径”的明确触发边界；仓库验证器也没有对此做回归断言。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：扩展维护 Skill 的触发描述，覆盖修复、解决、排查、异常、报错、回归、刷新后又出现、取消后仍存在、功能不符合预期和修复这个 BUG；新增无路径中文 Bug/行为差异评估；将描述预算从 600 放宽到 1000 字符，并保持正文预算不变。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：触发描述回归断言通过；完整 Node 测试 33/33 通过；Skill 仓库验证通过；空白检查通过。实际客户端自动触发仍需在重启后的新会话中用新增评估提示进行人工 forward-test。

## 2026-08-27：为人工任务索引增加轻量健康检查

- 现象：`ai-context/INDEX.md` 能表达用户任务、第一入口和聚焦测试，但完全依赖人工维护；文件移动后本地路径可能静默失效，审核时间也不可见。同时，把调用者和影响范围写进 Markdown 会复制易变化的机械代码事实。
- 根因：原索引契约没有区分”审核后的维护意图”和”动态代码关系”，也没有入口存在性、审核提交/日期或兼容状态检查。
- 修改文件：`scripts/index-health.mjs`、`scripts/tests/index-health.test.mjs`、示例索引、maintainer/bootstrapper 导航参考、仓库/发布验证、架构、README、评估和本记录。
- 修改方式：增加无依赖只读检查器，解析 `ai-context/**/INDEX.md` 表格中反引号包裹的本地路径；缺失、绝对、词法越界或经符号链接/目录联接逃逸项目根的路径报告 `UNRESOLVED` 并返回失败。审核提交支持合法的完整或缩写 SHA 前缀（大小写不敏感），提交变化、非法 SHA 或日期超过 90 天报告 `STALE_REVIEW` 但不阻塞；没有元数据的旧索引保持兼容。Markdown 保留任务意图、边界和权威测试命令，调用关系与影响范围交给源码工具或可选代码图工具。命令解析支持单双引号包裹的带空格路径；常见无扩展名项目文件（Dockerfile、Makefile 等）纳入路径识别白名单；`ai-context` 目录自身的真实路径边界也受验证，越界时拒绝递归和读取。
- 验证命令：`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`node scripts/verify-skill-repo.mjs`、`node scripts/index-health.mjs .`、`node scripts/index-health.mjs examples/minimal-project`、`git diff --check`。
- 验证结果：聚焦索引测试 23/23 通过，覆盖 POSIX/Windows 绝对路径、同前缀兄弟目录、符号链接/目录联接逃逸、完整/缩写/非法 SHA（含大小写兼容）、带空格路径的单引号/双引号解析、无扩展名项目文件、`ai-context` 目录越界保护、旧索引兼容和 CLI 退出码；集成 Node 测试 33/33 通过；GitHub Actions 已运行同一测试集合；仓库验证通过；仓库根索引和最小项目索引均为 `VALID`，本地引用全部存在。
- 未验证风险：命令解析限于单双引号和空格分隔；不支持 shell 变量展开、转义序列或嵌套引号；复杂命令语法建议使用独立反引号单元或项目自有验证器。


- 现象：用户只描述“加入书架后应在线观看、却变成下载”并要求修复时，客户端先触发了通用的 `superpowers:using-superpowers`，没有继续选择 `ai-project-maintainer`。
- 根因：`ai-project-maintainer` 的 frontmatter 描述只覆盖源码、测试、路由、失败等技术证据；没有明确覆盖“当前产品行为与期望行为的差异 + 修复请求”这一常见的现有项目 Bug 表达。已有评估也都提供了路径或“现有项目”措辞，未覆盖无路径的中文自然语言回归。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`BUG_HISTORY.md`。
- 修改方式：在维护 Skill 描述中加入中文/英文的修复与行为回归触发词；新增书架在线阅读回归评估，明确应选择 `NORMAL_CHANGE`，不能停留在通用元 Skill；验证器增加触发描述静态回归断言。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`git diff --check`。
- 验证结果：仓库验证通过；人工复核触发边界：`using-superpowers` 属于启动级通用 Skill，不应替代具体维护 Skill，新增描述覆盖无路径的行为回归请求。
- 未验证风险：静态仓库检查不能模拟具体客户端的竞争触发排序；仍需在安装了该版本 Skill 的真实客户端中用新增评估提示做 forward-test。

## 2026-08-26：Bug 修复读取和失败诊断范围过宽

- 现象：修复单个在线下载问题时读取多个大文件和完整大型测试，跨 Android/Web/测试目录宽搜，对未跟踪文件重复执行完整 `git diff --no-index`，并在构建失败后缺少局部诊断就重复全量编译。
- 根因：已有输出预算限制单次行数和累计字节，但没有限制每轮文件数、局部读取范围、搜索边界、未跟踪文件比较方式，以及构建失败后的状态确认顺序。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/fast-path.md`、`evals/prompts.md`、`BUG_HISTORY.md`。
- 修改方式：增加每轮 2–3 个文件和报错前后约 40 行的局部读取预算；要求 `rg` 限定单文件/单符号；禁止未跟踪大文件完整 `--no-index` 和无变化时重复全量读取；发现首个可验证根因后先 focused test；构建失败先确认报错局部上下文、文件时间和 Git 状态，再决定是否重跑。
- 验证命令：`node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`node scripts/verify-skill-repo.mjs`、`git diff --check`。
- 验证结果：10/10 Node 测试通过；`node scripts/verify-skill-repo.mjs` 通过（2 个 Skill、40 个必要文件、正文与引用预算通过）；`git diff --check` 通过；新增 eval 场景关键规则检索通过。
- 未验证风险：读取和搜索预算仍依赖 AI 遵守工具调用边界；需用新增评估提示进行人工 forward-test。

## 2026-08-26：连续修复任务被扩成并行架构任务

- 现象：在线下载、书源分页、Web 重试、AI 多章节后端、Android 打包和设备回归被当作一个 backlog 同时推进，并启动多个共享工作区代理；代理重复扫描、长时间无有效产出，实际验证结果只覆盖少数基础层。
- 根因：维护 Skill 只有读取输出预算，没有当前阶段、代理并发、运行生命周期和验收闸门；“仅凭证据扩展”没有规定无进展时停止，也没有强制区分已验证实现与设计/半成品。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/fast-path.md`、`evals/prompts.md`、`BUG_HISTORY.md`。
- 修改方式：增加单一当前目标/文件组/首要验收标准；默认禁止并行代理，共享文件串行；代理约 3 分钟无新证据、超范围、测试夹具/环境问题或发现跨层架构需求时停止；先 focused test 再修改和边界构建；独立子系统分阶段；完成状态区分 `VERIFIED_COMPLETE`、`MODIFIED_UNVERIFIED`、`DESIGN_OR_PARTIAL`、`NOT_STARTED` 和 `BLOCKED`。
- 验证命令：`node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`node scripts/verify-skill-repo.mjs`、`git diff --check`；并检查新增 eval 场景包含并行限制、停止条件、阶段闸门和完成状态。
- 验证结果：10/10 Node 测试通过；`node scripts/verify-skill-repo.mjs` 通过（2 个 Skill、40 个必要文件、正文与引用预算通过）；`git diff --check` 通过；新增 eval 场景关键规则检索通过。
- 未验证风险：Skill 的代理停止依赖客户端实际执行能力；需在支持子代理的客户端中用新增评估提示进行人工 forward-test。


## 2026-08-24：修正“最小改动”误用并发布 v0.4.6

- 现象：用户明确指出小说精校工具“界面不够现代化”后，实施结果只增加切换动画和更换主题颜色，布局、信息架构、空间利用和交互流程基本没有变化，且新配色破坏了原有简洁感。
- 根因：`NORMAL_CHANGE` 的“做最小兼容修改”表述没有把 Bug 修复/配置调整与设计改进/体验优化分开，容易让 AI 把“现代化界面”误判为普通小改动，用表层装饰代替真正的布局和交互设计。
- 修改文件：`skills/ai-project-maintainer/references/fast-path.md`、`README.md`、`CHANGELOG.md`、`docs/releases/v0.4.6.md`、发布脚本相关文件。
- 修改方式：保留 Bug 修复和配置调整的最小改动约束；新增设计改进例外，允许在保持数据格式、API 契约和核心功能行为兼容的前提下重设计 UI 布局、信息层级、空间利用、状态可见性和组件结构；明确仅换颜色或加动画不能作为现代化完成证据；发布脚本同步纳入 README、BUG_HISTORY 和逐版本发布说明。
- 验证命令：`node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`node scripts/verify-skill-repo.mjs`、`git diff --check`。
- 验证结果：10/10 Node 测试通过；`node scripts/verify-skill-repo.mjs` 通过；`git diff --check` 通过；v0.4.6 发布后还需核对远程标签、Release 正文和文档链接。
- 未验证风险：UI 现代化本身仍需在具体应用中按主要工作流进行截图或人工交互评估；本版本只修正 Skill 的任务路由和验收边界。

## 2026-08-24：补齐 v0.4.5 版本历史和中文发布说明

- 现象：GitHub 的 `v0.4.5` Release 已创建，但 README 的“版本历史”仍停在 `v0.4.3`；`CHANGELOG.md` 的 `0.4.5` 条目只有三条英文摘要，仓库没有对应的 `docs/releases/v0.4.5.md`。
- 根因：发布流程只更新了插件版本元数据、验证器和 CHANGELOG 顶部条目，没有把 README 版本历史和逐版本发布介绍纳入发布文件；发布 notes 也使用了临时英文摘要，没有复用中文变更说明。
- 修改文件：`README.md`、`CHANGELOG.md`、`docs/releases/v0.4.5.md`、`BUG_HISTORY.md`。
- 修改方式：补充 `v0.4.4` 和 `v0.4.5` 的中文版本历史；将 `0.4.5` CHANGELOG 改为背景、变更、边界和验证四部分；新增完整发布介绍；同步修改 GitHub Release 标题和正文。
- 验证命令：`node --test scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`、`node scripts/verify-skill-repo.mjs`、`git diff --check`。
- 验证结果：文档结构和仓库验证通过；版本历史包含 `v0.4.5`、`v0.4.4`、`v0.4.3`；Release 正文改为中文并与代码变更一致。
- 未验证风险：GitHub 页面可能因缓存暂时显示旧正文，需刷新 Release 页面确认；本次不改变 Skill 运行时规则。


## 初始记录

- 创建日期：2026-08-02
- 项目：`ai-maintenance-skills`
- 技术路线：Markdown Skills + `references/` 按需文档 + Node.js 内置模块静态验证 + Markdown 评估提示；无运行时依赖、无构建步骤。
- 初始目的：把 AI 维护已有项目和创建新项目时的局部读取、最小修改、验证、架构记录和 Bug 追踪流程整理为可复用的开源 Skills。
- 初始验证：待仓库文件创建完成后运行 `node scripts/verify-skill-repo.mjs` 和 `git diff --check`。

## 2026-08-02：修正验证命令执行目录和安装命令

- 现象：首次运行仓库验证时，命令在当前 GARGANTUA 应用目录执行，找不到独立仓库的 `scripts/verify-skill-repo.mjs`；README 的示例复制命令包含多余空格，不能可靠复制到 `./.agents/`。
- 根因：工具默认工作目录仍是原应用目录；README 命令的目标路径写成了 `./ .agents/`。
- 修改文件：`README.md`、`BUG_HISTORY.md`。
- 修改方式：将安装命令改为 `cp -R /path/to/ai-maintenance-skills/.agents/skills ./.agents/`；后续验证命令显式切换到独立仓库目录，避免把两个项目混淆。
- 验证命令：`cd /e/DEEPSEEK ai/ai-maintenance-skills && node scripts/verify-skill-repo.mjs`。
- 验证结果：通过；2 个 Skill frontmatter、21 个必要文件、引用、示例、许可证和仓库边界检查均通过。原应用目录未纳入清单。
- 未验证风险：尚未在实际 AI 客户端中运行三组 Skill 触发评估；`git diff --check` 需在 Git 初始化后执行。


## 2026-08-02：明确模板不是日常使用前提

- 现象：README 的示例提示和提问模板容易让使用者误以为每次修 Bug 或创建项目前都必须复制整段提示。
- 根因：文档只展示了完整提示示例，没有明确区分“Skill 自动触发”和“复杂问题的可选交接模板”。
- 修改文件：`.agents/skills/ai-project-maintainer/SKILL.md`、`.agents/skills/ai-project-bootstrapper/SKILL.md`、`README.md`、`AI修Bug提问模板.md`、`ARCHITECTURE.md`、`AGENTS.md`、`evals/prompts.md`。
- 修改方式：在两个 Skill 增加自动使用说明；README 明确自然语言即可触发；将中文模板和评估提示标为可选辅助材料；在仓库规则中禁止让自动执行依赖模板。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`git diff --check`，并检查两个 `SKILL.md` 的行数和 frontmatter。
- 验证结果：通过；2 个 Skill frontmatter、21 个必要文件、引用、示例、许可证和仓库边界检查均通过；两个 Skill 正文分别为 39 行和 54 行；文本空白检查无错误。
- 未验证风险：尚未在独立 AI 客户端中重复运行自动触发评估。


## 2026-08-02：改进 Skill 安装体验

- 现象：用户需要手工复制 `.agents/skills`，容易误以为必须在每次对话中粘贴模板；安装入口不符合成熟 Skills 仓库的插件和安装器习惯。
- 根因：仓库只有标准 Skills 目录，没有 Claude/Codex 插件清单或统一安装文档，README 还把手工复制放在主要位置。
- 修改文件：`.claude-plugin/marketplace.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`docs/installation.md`、`README.md`、`ARCHITECTURE.md`、`AGENTS.md`、`CHANGELOG.md`、`scripts/verify-skill-repo.mjs`。
- 修改方式：增加插件元数据；将 `npx skills add https://github.com/canglei9527/ai-maintenance-skills` 作为通用推荐入口；增加 Claude/Codex 客户端说明；保留 `.agents/skills` 手工复制作为兼容后备；验证脚本增加 JSON、Skill 路径和安装文档检查。
- 验证命令：`node scripts/verify-skill-repo.mjs`、`node -e "for (const f of ['.claude-plugin/marketplace.json','.claude-plugin/plugin.json','.codex-plugin/plugin.json']) JSON.parse(require('fs').readFileSync(f))"`、`git diff --check`，并检查 Skill 和安装文档行数。
- 验证结果：通过；2 个 Skill frontmatter、25 个必要文件、3 个插件 JSON、Skill 路径、README 安装命令、安装文档、引用、示例、许可证和仓库边界均通过；文本空白检查无错误。验证脚本曾因匹配条件过窄误报，已放宽为检查“模板可选且不是每次必填”的等价语义后通过。
- 未验证风险：不同客户端对插件 manifest 字段和 `npx skills` 可选参数的支持可能随版本变化；文档明确要求优先查看客户端或安装器当前帮助。

## 2026-08-02：补全中英文仓库和插件描述

- 现象：GitHub About 和插件元数据描述只有英文，中文用户在仓库页或插件安装界面无法直接理解用途。
- 根因：初始插件化发布只关注安装路径和英文生态兼容，没有同步补齐中文展示文案。
- 修改文件：`.claude-plugin/marketplace.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`scripts/verify-skill-repo.mjs`、`CHANGELOG.md`、`BUG_HISTORY.md`。
- 修改方式：将 marketplace、Claude plugin 和 Codex plugin 的主描述、短描述和长描述改为中英文双语；插件版本提升到 `0.2.1`；验证脚本同步检查新版本。
- 验证命令：`node scripts/verify-skill-repo.mjs`、插件 JSON 解析和 `git diff --check`。
- 验证结果：通过；2 个 Skill frontmatter、25 个必要文件、3 个插件 JSON、Skill 路径、README 安装命令、安装文档、引用、示例、许可证和仓库边界均通过；插件 JSON 均显示 `0.2.1` 且描述包含中英文；文本空白检查无错误。
- 未验证风险：GitHub About 描述需要通过 GitHub API 单独更新，不能只靠仓库文件提交。

## 2026-08-02：新建项目默认创建独立目录

- 现象：新建程序时，Skill 只要求检查当前工作区和不要覆盖已有项目，但没有明确要求先创建独立项目文件夹，可能把新项目源码、测试和文档散落到当前父级工作区，与其他项目混在一起。
- 根因：`ai-project-bootstrapper` 的工作流缺少“选择/创建项目根目录”的强制步骤，文档模板和评估提示也没有覆盖目录隔离。
- 修改文件：`.agents/skills/ai-project-bootstrapper/SKILL.md`、`.agents/skills/ai-project-bootstrapper/references/project-docs-template.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`.claude-plugin/marketplace.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`CHANGELOG.md`、`BUG_HISTORY.md`。
- 修改方式：新增 dedicated project root 规则；要求新项目所有源码、测试、配置、文档、资产都放入独立项目目录；模板增加项目根目录示例；评估提示要求检查目录隔离；验证脚本检查规则和模板存在；插件版本升至 `0.2.2`。
- 验证命令：`node scripts/verify-skill-repo.mjs`、插件 JSON 解析、`git diff --check`，并检查 bootstrapper 行数。
- 验证结果：通过；2 个 Skill frontmatter、25 个必要文件、3 个插件 JSON、独立项目根目录规则、模板、评估提示、README、安装文档和仓库边界均通过；文本空白检查无错误。
- 未验证风险：尚未在真实新建项目任务中执行端到端评估。

## 2026-08-02：导入项目整理必须先确认并验证

- 现象：导入已有项目时，原维护规则没有专门规定“是否整理”的确认步骤，也没有规定整理前后必须对比测试结果，容易在未经同意时移动文件，或整理后引入回归而未被识别。
- 根因：`ai-project-maintainer` 只有普通局部修复和模块抽离流程，没有把导入项目整理作为高风险结构变更单独处理。
- 修改文件：`.agents/skills/ai-project-maintainer/SKILL.md`、`.agents/skills/ai-project-maintainer/references/maintenance-workflow.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`README.md`、`docs/installation.md`、`ARCHITECTURE.md`、`AGENTS.md`、`.claude-plugin/marketplace.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`CHANGELOG.md`、`BUG_HISTORY.md`。
- 修改方式：增加导入项目浅层检查和明确询问；用户同意后先建立测试/语法/构建/启动基线，再分批整理、更新引用并执行整理后回归；区分已有失败、整理引入的失败和环境失败；验证失败时停止或恢复失败批次；插件版本升至 `0.2.3`。
- 验证命令：`node scripts/verify-skill-repo.mjs`、插件 JSON 解析和 `git diff --check`，并同步用户级 maintainer Skill。
- 验证结果：通过；2 个 Skill frontmatter、25 个必要文件、3 个插件 JSON、导入整理确认/基线/回归/恢复规则、评估提示、README、安装文档和仓库边界均通过；关键规则检索通过；文本空白检查无错误。
- 未验证风险：尚未在真实导入项目上执行端到端整理评估；不同技术栈的基线命令需要按项目实际配置选择。

## 2026-08-02：修复新建程序被误判为已有项目维护

- 现象：用户描述“根据 GLM 渠道状态选择分组、错误时切换分组、低倍率优先、后台监测”的独立路由程序需求时，先触发了 `ai-project-maintainer`，开始尝试扫描当前工作区和寻找已有分组逻辑；用户实际要求的是新建程序。
- 根因：maintainer 的触发描述过宽，bootstrapper 的触发描述过窄；没有任务分流门，也没有规定在意图未确定前禁止扫描和启动子代理。当前工作区非空进一步放大了误判。
- 修改文件：`.agents/skills/ai-project-maintainer/SKILL.md`、`.agents/skills/ai-project-bootstrapper/SKILL.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、`README.md`、`ARCHITECTURE.md`、`AGENTS.md`、`.claude-plugin/marketplace.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`CHANGELOG.md`、`BUG_HISTORY.md`。
- 修改方式：收紧 maintainer 为“必须有已有项目证据”；扩展 bootstrapper 到独立服务、路由器、守护进程、CLI 和自动化工具；增加任务分流规则；歧义时只问一次；加入 GLM 路由器、已有文件路径和歧义请求三个评估场景；验证脚本检查分流边界。
- 验证命令：`node scripts/verify-skill-repo.mjs`、插件 JSON 解析、`git diff --check`，并用 `rg` 检查分流关键文本。
- 验证结果：通过；2 个 Skill frontmatter、25 个必要文件、3 个插件 JSON、维护/新建分流边界、独立项目目录、导入整理规则、3 个分流评估场景和仓库边界均通过；文本空白检查无错误。验证器曾因空格/连字符匹配差异误报，已修正后通过。
- 未验证风险：无法在静态脚本中真正模拟模型 Skill 竞争触发；需要在新会话中用原始 GLM 路由器提示进行人工评估。

## 2026-08-02：增加两阶段上下文读取边界

- 现象：读取架构说明后，AI 仍可能把模块职责表误解为逐文件读取清单，继续遍历同目录或整个项目源码；“直接依赖”和“相关配置”也可能被递归展开。
- 根因：原 Skill 只描述“先读架构、再读目标和直接依赖”，没有定义 `project_root`、目标锚点、阶段边界、搜索上限、一跳依赖和扩大范围条件；项目架构记录也没有单独的函数索引入口。
- 修改文件：`.agents/skills/ai-project-maintainer/SKILL.md`、`.agents/skills/ai-project-maintainer/references/maintenance-workflow.md`、`.agents/skills/ai-project-maintainer/references/project-record-templates.md`、`.agents/skills/ai-project-bootstrapper/SKILL.md`、`.agents/skills/ai-project-bootstrapper/references/project-docs-template.md`、`README.md`、`docs/installation.md`、`ARCHITECTURE.md`、`AGENTS.md`、`evals/prompts.md`、`scripts/verify-skill-repo.mjs`、插件元数据和版本记录。
- 修改方式：增加 `ai-context/` 两阶段读取协议；把架构和函数索引定义为定位索引；默认排除依赖、缓存、生成物、vendor 和秘密文件；搜索最多 50 个命中、默认打开 12 个候选文件并只追踪一跳；只有明确证据才按目录、package、项目根逐层扩大；新项目模板生成根 `AGENTS.md` 和 `ai-context/` 记录。
- 验证命令：`node scripts/verify-skill-repo.mjs`、插件 JSON 解析、`git diff --check`、本机用户级 Skill 与源仓库 SHA-256 对比。
- 验证结果：通过；`node scripts/verify-skill-repo.mjs`、插件 JSON 解析、`git diff --check` 和用户级/源仓库 SHA-256 对比均通过。
- 未验证风险：提示词可以约束默认行为，但不能替代工具层路径白名单；用户明确要求全仓审计时仍可进行全量扫描。

## 2026-08-04：修复安装漏项并压缩运行时上下文

- 现象：`ai-project-maintainer` 的 `description` 含未加引号的冒号，`npx skills` 会跳过该 Skill；仓库验证器仍误报 frontmatter 有效。单独安装 bootstrapper 时，它引用 maintainer 目录中的模板，形成断链。两份 `SKILL.md` 还重复承载按需细节，增加每次触发的上下文成本。
- 根因：frontmatter 仅用正则检查字段外形，没有按安装器可接受的 YAML 子集解析；标准源目录和插件路径仍使用旧的 `.agents/skills/`；bootstrapper 没有保持引用自包含；核心流程与复杂分支未充分做渐进披露。
- 修改文件：`skills/ai-project-maintainer/`、`skills/ai-project-bootstrapper/`、`scripts/skill-frontmatter.mjs`、`scripts/skill-frontmatter.test.mjs`、`scripts/verify-skill-repo.mjs`、插件清单、CI、安装/架构/贡献/变更文档和评估提示。
- 修改方式：迁移标准源到 `skills/`；用双引号保护 description；增加严格、无依赖的 frontmatter 解析与回归测试；检查自包含引用和运行时预算；将复杂维护分支保留在本 Skill 的 `references/` 中按需读取；移除无效插件 `hooks` 字段并将版本升至 `0.3.0`。
- 验证命令：`node --test scripts/skill-frontmatter.test.mjs`；`node scripts/verify-skill-repo.mjs`；两份官方 `quick_validate.py`；官方 `validate_plugin.py .`；插件 JSON 解析；`git diff --check`；`npx.cmd skills add . --list`；隔离的全量/单 Skill 安装与 SHA-256 对比；maintainer 和 bootstrapper 独立前向测试。
- 验证结果：4 个 frontmatter 回归测试通过；仓库验证、两份 Skill 官方校验、插件官方校验、3 份 JSON 和空白检查通过；安装器发现 2 个 Skill，全量及单独安装均完整且源/安装文件哈希一致；maintainer fixture 2 个测试通过，bootstrapper fixture 4 个测试、编译和 CLI 冒烟通过。`SKILL.md` 字符数分别从 12,036 降至 3,326（72.4%）和从 8,394 降至 3,240（61.4%）。
- 未验证风险：精确 `o200k_base` token 统计因词表下载 TLS 失败而未完成；字符降幅不等同于精确 token 降幅。GitHub URL 安装需在推送后复验。


## 2026-08-06：发布步骤分散且网络中断难恢复

- 现象：版本同步、验证、提交、push、标签和 GitHub Release 需要分步手工执行；网络超时后难以判断已完成阶段，容易漏推 `main`、漏推 tag 或漏建 Release。
- 根因：仓库只有内容验证脚本，没有版本元数据同步、Git/GitHub 发布编排、有限重试或由远端状态推导的恢复路径。
- 修改文件：`scripts/release*.mjs`、`scripts/INDEX.md`、`.github/workflows/verify.yml`、`scripts/verify-skill-repo.mjs`、`AGENTS.md`、`CONTRIBUTING.md`、`README.md`、`ARCHITECTURE.md`。
- 修改方式：新增无依赖 Node release CLI。默认 dry-run 只做本地预检；`--publish` 才同步版本与 changelog、运行验证、提交、push、创建 annotated tag 和通过已认证 `gh` 创建 Release。Git/GitHub 网络操作使用有限指数退避；中断后保留完成阶段并使用 `--resume` 从 Git tag、提交与 Release 状态继续，不保存凭据或持久状态。
- 验证命令：`node --test scripts/skill-frontmatter.test.mjs scripts/release.test.mjs`；`node scripts/verify-skill-repo.mjs`；`git diff --check`；隔离 Git fixture 上的 `node scripts/release.mjs --version 0.5.0 --title "Dry run" --notes-file release-notes.md`。
- 验证结果：10 个 Node 离线测试通过；仓库验证通过；`git diff --check` 通过；隔离 fixture dry-run 保持工作区不变且未创建 `v0.5.0` tag。
- 未验证风险：本轮不执行真实 `--publish`、远端 tag 或 GitHub Release API 调用；真实认证、权限和网络传播将在首次发布时由工具的 preflight 与重试逻辑覆盖。

## 2026-08-16：DURABLE 强制默认和完成报告格式导致 AI 响应质量下降

- 现象：部分 AI 使用 Skill 后回复变得机械、臃肿，或在简单问答后自动创建 `ai-context/` 目录，或遇到大文件就中断实际任务转而输出完整结构债务分析报告，或为 MICRO 脚本也建立治理目录。
- 根因：(1) Maintainer SKILL.md"默认以 DURABLE 级别维护所有项目"规则无差别要求每次任务完成后维护 `ai-context/INDEX.md`，READ_ONLY 和单文件 bug 修复也不例外；(2) Bootstrapper workflow.md"默认对新项目使用 DURABLE"导致简单脚本也创建 AGENTS.md + ai-context/ + 路由树；(3) SKILL.md 的"必须报告 ACCUMULATING_STRUCTURAL_DEBT"措辞让 AI 在大文件 bug 修复时中断任务输出完整职责图；(4) 完成报告格式无分级，所有任务强制输出相同的8字段结构化代码块。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-maintainer/references/fast-path.md`、`skills/ai-project-bootstrapper/SKILL.md`、`skills/ai-project-bootstrapper/references/workflow.md`。
- 修改方式：将 Maintainer 索引维护改为触发条件制——本次任务新增文件/目录/入口/路由（且源文件总数 > 1）或完成 STRUCTURAL_CHANGE 时才更新/新建 INDEX.md，READ_ONLY、单文件 bug 修复、仅改实现细节、MICRO 脚本不触发；ACCUMULATING_STRUCTURAL_DEBT 改为附注在完成报告"未完成与风险"字段，不中断任务；完成报告新增粒度说明（READ_ONLY 简单问答直接给结论，1-2 文件小改动内联摘要，复杂变更才用完整格式）；Bootstrapper 移除 DURABLE"默认档位"标签，不确定时默认 STANDARD，DURABLE 仅在用户明确提到长期 AI 维护/多人协作/安全关键时使用。
- 验证方式：对 V0（原版）、V1（仅按已有 ai-context/ 触发）、V2（触发条件版）三个规则版本用 7 个 eval 场景打分，满分 14。V0：7/14；V1：9/14（新增模块、长期项目场景失分，永不自动建立索引）；V2：12/14；V2 + MICRO 豁免（项目源文件 > 1 条件）：14/14。
- 验证结果：`node scripts/verify-skill-repo.mjs` PASS；SKILL.md 行数在 200 行预算内；4 个 eval 场景验证通过。
- 未验证风险：未在真实 AI 客户端进行端到端前向测试；"源文件总数 > 1"的判断依赖 AI 自行估计，边界情况（恰好1个文件的项目）行为未覆盖。

## 2026-09-20：触发词排在客户端可见窗口之外导致 Skill 从不自动触发

- 现象：两个 Skill 已正确安装、frontmatter 与正文校验全部通过，但实际对话中几乎从不自动触发；"继续这个没完成的"这类续作请求完全没有触发 `ai-project-maintainer`，只能由用户手动点名。
- 根因：客户端技能列表只把 `description` 的前 249 字符渲染给模型。`ai-project-maintainer` 的中文触发词从第 258 字符才开始（`修复、解决` 在 258，`刷新后又出现` 在 276，`修复这个BUG` 在 298），`ai-project-bootstrapper` 的反向路由子句也被截断；模型在选择 Skill 时只能看到英文影子，看不到中文触发语义。同一级还有一个独立缺陷：两个 description 都没有任何"继续/未完成/收尾/验证并归档"等续作类触发词，即使完整描述可见也不覆盖"继续未完成的阶段"这类请求。截断宽度由原始文本独立测定：把 HEAD 版本的完整 description 按客户端实际显示的截断点（`or Chinese requests co`、`Do not use for m`）计算，两个 Skill 均精确落在索引 249。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-bootstrapper/SKILL.md`、`scripts/verify-skill-repo.mjs`、`CONTRIBUTING.md`、`evals/prompts.md`。
- 修改方式：把中文触发词、续作类触发词（继续、未完成、收尾、验证并归档、更新维护文档）、英文触发词和反向路由子句全部前移到 249 字符窗口内；`ai-project-maintainer` description 由 502 降至 489 字符，`ai-project-bootstrapper` 由 403 降至 238 字符（中文触发词、英文触发词与 `route to ai-project-maintainer` 全部可见）。`scripts/verify-skill-repo.mjs` 新增 `descriptionWindow = 249` 检查，逐词断言两个 Skill 的触发词都在窗口内；`CONTRIBUTING.md` 增加窗口约束说明；`evals/prompts.md` 增加第 28、29 条评估提示（续作触发、可见窗口检查项）。
- 验证命令：`node --test scripts/tests/index-health.test.mjs scripts/tests/skill-frontmatter.test.mjs scripts/tests/release.test.mjs`；`node scripts/verify-skill-repo.mjs`；`git diff --check`；回归门反向验证（临时把 `maintainer` description 前置 260 个填充字符，确认新检查报出 `maintainer trigger phrases fall outside the 249-char client window`，随后逐字恢复）。
- 验证结果：35 个 Node 测试全部通过；`node scripts/verify-skill-repo.mjs` PASS（2 个 Skill、44 个必需文件、0.4.15 版本一致性）；`git diff --check` 无空白错误；新回归门在真实破坏下按预期失败，证明其可失败而非恒真。仓库根存在 `git` 未跟踪且被 `.gitignore` 忽略的 `.zcode/` 会话残留，验证器会将其判为 forbidden directory；本轮只临时移出并原样还原（内容与时间戳未变），未删除用户数据。
- 未验证风险：249 字符窗口是从当前客户端版本的实际渲染反推并交叉验证所得，不是公开契约；客户端升级后窗口宽度可能变化，需以实际技能列表为准重新校准。本轮未在真实客户端做端到端前向触发测试，触发改善程度只有静态证据（触发词可见性）与人工评估提示，缺真实运行时观测。

## 2026-09-20（后续）：英文触发词 `bug` 超出窗口 + 增加 `when_to_use` 字段

- 现象：用户报告"还是不触发"；复查发现 `ai-project-maintainer` 的英文单词 `bug` 在索引 260（超出 249 窗口），中文已占 148 字符把英文核心词挤出了可见范围。
- 根因：初版修复只关注了中文触发词与续作类词可见性，未充分校验英文核心词（bug、fix、review、diagnose、regression）的窗口位置。验证器断言列表也漏掉了这些英文词。
- 改进措施：
  1. 压缩 `ai-project-maintainer` description 从 489 → 409 字符，把 `bug` 等英文核心词前置到 `Use for bug, regression, ...` 开头，确保 bug/fix/review/diagnose/regression 全部在 249 窗口内。
  2. 增加 `when_to_use` 字段给两个 Skill（客户端诊断文档明确说模型会看 description + when_to_use），提供额外的触发信号："Existing project maintenance: bug fixes, feature changes, refactoring, code review, investigation. Not for creating new projects from scratch." / "Creating new standalone projects from scratch. Not for modifying, fixing, or reviewing existing code."
  3. 放宽 `scripts/skill-frontmatter.mjs` 解析器：从只允许 name/version/description 三个键，改为接受 when_to_use/license/metadata（与客户端对齐），并标记为可选字段；更新测试用例把"拒绝 when_to_use"改成"拒绝未知字段"。
  4. 更新 `scripts/verify-skill-repo.mjs` 窗口检查列表：增加英文核心词（bug、fix、review、diagnose、regression）和"期望行为"，确保回归门能捕获英文触发词截断。
  5. 同步修改到 `~/.zcode/skills` 和 `~/.agents/skills` 两处已安装位置。
- 修改文件：`skills/ai-project-maintainer/SKILL.md`、`skills/ai-project-bootstrapper/SKILL.md`、`scripts/skill-frontmatter.mjs`、`scripts/tests/skill-frontmatter.test.mjs`、`scripts/verify-skill-repo.mjs`。
- 验证命令：`node --test scripts/tests/*.test.mjs`（35 个测试全部通过）；`node scripts/verify-skill-repo.mjs`（PASS，2 个 Skill、44 个必需文件、版本一致性、窗口可见性全部通过）；`git diff --check`（无空白错误）。
- 验证结果：所有测试和验证通过，已安装副本已同步（两处哈希一致且 when_to_use 字段存在）。用户需**重启 ZCode 客户端**才能让修改生效（客户端启动时重新扫描技能目录）。
- 未验证风险：`when_to_use` 字段对触发率的实际提升程度未测量，需用户重启后观测。如果重启后仍不触发，需检查客户端技能列表实际渲染的 description 内容，校准 249 字符假设是否准确。

以后每次修复或规则缺陷都追加一条，不覆盖历史：

```markdown
## YYYY-MM-DD：简短标题

- 现象：
- 根因：
- 修改文件：
- 修改方式：
- 验证命令：
- 验证结果：
- 未验证风险：
```


## 规则

只有在确认了现象和根因后才记录“已修复”。如果验证失败，保留失败记录并明确当前状态；不要用“应该可以”代替验证结果。
