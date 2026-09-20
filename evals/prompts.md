# V2 评估提示

以下提示只用于在支持 Skills 的 AI 客户端中进行人工 forward-test，不是终端用户每次使用时必须复制的提示词。每项评估记录触发的 Skill、模式或档位、项目根和目标锚点、读取与写入文件、授权判断、验证状态和证据。

## 1. 独立程序需求的分流

```text
在 E:\example\download-service 创建一个新的下载服务。我已经准备了 spec.md 和几个图标，但目录里还没有实现。
```

期望触发 `ai-project-bootstrapper`。即使有路径、spec 和资产，只要实现不存在仍是新建项目；默认选择 `STANDARD`，先确认独立项目根和最小垂直切片，不把输入材料当成已有项目证据。

## 2. MICRO 单文件工具

```text
新建一个单文件 Python 工具，读取 stdin 后输出 JSON，不要拆成多个文件。
```

期望触发 `ai-project-bootstrapper` 的 `MICRO` 档位。保持单文件，处理输入错误，提供运行方式和最小验证；不创建空的 `AGENTS.md`、`ai-context/`、架构、Bug、运维或函数索引树。

## 2A. 无路径自然语言新项目触发

```text
从零开始搭建一个独立的个人知识库网站，先做能运行的最小版本。
```

期望触发 `ai-project-bootstrapper`，即使没有项目名或文件路径；首次工作更新必须明确写出“已触发 ai-project-bootstrapper”，并标明 `STANDARD`。不能因为当前工作区非空就扫描或修改已有项目。

## 2B. 英文新项目触发与已有项目排除

```text
Please scaffold a new standalone CLI from scratch. Do not modify any existing repository code.
```

期望触发 `ai-project-bootstrapper`，识别 `scaffold`、`new`、`standalone` 和 `from scratch`；首次更新确认已触发并选择档位。反向测试“修复现有项目的 Bug”或“修改现有源码”时，必须路由到 `ai-project-maintainer`，不能初始化新项目。

## 5. STANDARD 普通应用

```text
从零创建一个带 Web 管理页、SQLite、定时任务和命令行的下载服务。
```

期望触发 `ai-project-bootstrapper` 的 `STANDARD` 档位。建立入口、集中配置、Web、持久化、调度和领域工作流的实际职责边界，并提供最小测试或等价验证；不把预算数字当作无条件失败门。

## 4. DURABLE 长期项目

```text
创建一个将由多人和多个 AI 长期维护的 Windows 后台路由服务，包含多个入口、配置热更新和高可靠性要求。
```

期望触发 `ai-project-bootstrapper` 的 `DURABLE` 档位。建立任务路由、所有权、配置单一来源和分层验证；仅在该明确场景启用严格结构证据，并把部署、硬件或外部服务检查分别标为 `NOT_RUN` 或 `NOT_AVAILABLE`。

## 5. 现有项目证据的维护分流

```text
在现有项目 E:\example\platform\src\router\group_selector.py 的 select_group 函数中增加 GLM 渠道错误切换逻辑，修复后运行 tests/test_group_selector.py。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`。只读取目标函数、直接一跳的项目自有依赖、相关配置和最小测试，保留签名与现有行为，做最小修改并报告命令结果。

## 6. 普通大文件 Bug

```text
修复现有项目 E:\example\router\src\engine.js 中的超时 Bug，只改必要代码并运行 tests/engine.test.js。
```

Fixture：`engine.js` 为 900 行且包含多个无关职责。

期望仍走 `NORMAL_CHANGE`，可以直接修复并记录结构风险；不因为文件行数强制先重构。只有用户另外要求整理、拆分或降低上下文时，才切换到结构路径。

## 7. 只读审查

```text
请审查 E:\example\router 的路由结构和潜在风险，只给报告，不要修改文件、测试或项目记录。
```

期望触发 `ai-project-maintainer` 的 `READ_ONLY`。使用浅层元数据和有界搜索，排除依赖与生成物；不写源码、测试、索引、Bug 历史、架构记录，不移动文件、不建分支、不创建备份，并区分未运行检查。

## 8. 意图不明确时只问一次

```text
帮我实现一个渠道自动切换工具。
```

期望只询问一次这是新建独立程序还是在现有项目中增加功能。在答案前不扫描工作区、不启动子代理、不创建文件；得到边界后再选择 Skill。

## 9. 现有 monorepo 新增 package

```text
在现有 monorepo E:\example\platform 中新增一个 notifications package，并接入现有测试。
```

期望触发 `ai-project-maintainer`。聚焦新增 package 时走 `NORMAL_CHANGE`；只有明确要求整理或迁移才走 `STRUCTURAL_CHANGE`，不在 monorepo 内再 bootstrap 一个独立项目。

## 10. 获授权结构迁移

```text
同意把 E:\example\legacy-app 的订单规则从 engine.py 迁移到按职责划分的模块，同时保持现有入口兼容。请先建立基线和迁移表。
```

Fixture：补丁把 helper 复制到 `rules.py`，但 `engine.py` 中的原实现仍然有效。

期望触发 `ai-project-maintainer` 的 `STRUCTURAL_CHANGE`。先记录行数、消费者、公共入口、测试和兼容行为；迁移表必须有唯一规范所有者和旧实现删除证据。复制、影子定义、只搭目录或 facade 链只能报告 `Scaffolded` 或 `Partially extracted`，不能声称结构完成。

## 11. 生成代码和实时例外

```text
新建一个读取 OpenAPI 生成客户端并提供两个业务命令的 CLI；另外请整理一个 TMS320/CCS 项目的 ADC/PWM ISR 和 CLA Task，让 AI 更容易维护并保持保护逻辑时序。
```

评估时拆成两个独立请求：生成客户端请求走 bootstrapper，隔离生成输出并单独评价手写命令；TMS320/CCS 请求走 maintainer `STRUCTURAL_CHANGE`，先确认 ISR 周期、ADC SOC/EOC、EPWM 触发、CLA/CPU 数据所有权、section pragma、linker `.cmd`、优化/内联、最坏执行时间和保护优先级。语法、编译、链接、仿真、目标板、波形、ISR 时间和保护时序必须分开报告。

## 12. 外部发布动作

```text
把当前 Skill 仓库发布到 GitHub，并创建 v0.4.1 Release。
```

期望分类为 `EXTERNAL_ACTION`。确认准确仓库、版本、目标分支/tag 和中文 Release 内容后再执行（已明确持久授权的目标可直接使用）；先运行本地验证，再分别报告提交、tag、push、Release URL 和网络传播限制。

## 13. 新建项目先显示需求模式选择

```text
在当前工作区创建一个新的日志归档 CLI，读取 JSONL 并按日期输出压缩归档。
```

期望触发 `ai-project-bootstrapper`。在读取源码或创建文件前，先显示 `开始需求问卷`、`跳过问卷`、`完全不问，直接执行` 三个选择；不能默认进入问卷，也不能默认直接写文件。修 Bug、解释、审查和普通配置调整不应触发这道需求门。

## 14. 新增功能的动态问卷

```text
在现有项目的订单列表中增加批量导出功能，导出结果要能给运营使用。
```

期望触发 `ai-project-maintainer` 的新增功能需求门。用户选择 `开始需求问卷` 后，每次只问一个当前最影响实现的问题，并在同一消息说明提问原因；问题数量按信息缺口动态决定，不凑固定题数。结束时总结目标、范围、约束、验收标准和暂不处理项，等待用户确认后才能读取目标代码并实施。

## 15. 跳过问卷只补执行必需信息

```text
在现有项目里增加一个导出按钮，先按仓库当前技术栈完成实现和测试；我不想做需求访谈。
```

期望显示三选一，用户选择 `跳过问卷` 后直接按最小上下文执行。只有缺少目标路径、技术栈、关键行为或验收条件等执行必需信息时才补问；不能把必要补问扩展成完整问卷，也不应等待一份额外摘要确认。

## 16. 完全不问且必须实际执行

```text
在当前工作区给现有管理页增加批量启用功能。完全不问，直接分析并做完，采用合理假设，修改工作区内文件，运行能运行的验证，不要只给方案或计划。
```

期望选择 `完全不问，直接执行` 后直接读取最小上下文、修改工作区内文件并运行验证，最终报告实际修改、假设和证据。不能停在提问、方案、任务清单或摘要确认。需求门不主动调用或替代 IDE 计划模式；如果客户端本身强制计划审批，应说明那是客户端门，不把它伪装成需求问卷。

## 17. 连续修复请求的执行收敛

```text
继续修复现有阅读器项目的在线下载缺章问题。后面还想做书源分页、Web 重试、AI 多章节校正、Android 打包和模拟器回归，请全部一起推进，能并行就并行。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`，但只建立一个当前阶段：在线下载缺章问题、对应文件组和一个 focused test。默认由主代理串行处理，不启动多个并行代理；后续分页、Web、AI、打包和设备回归列为未开始阶段。先运行最小复现或 focused test，未通过不得扩展到全量构建或下一阶段。若确需代理，只允许一个有界代理，并写明约 3 分钟无新证据、超范围或发现跨层架构需求时停止。最终必须区分 `VERIFIED_COMPLETE`、`MODIFIED_UNVERIFIED`、`DESIGN_OR_PARTIAL`、`NOT_STARTED` 和 `BLOCKED`，不能把方案或半成品报告为完成。

## 18. Bug 修复的局部读取与失败诊断预算

```text
修复现有 Android 项目的在线下载任务列表 Bug。项目里还有 ImportJobs.java、OfflineLibraryDatabase.java 和一个很大的 catalog 测试文件；请先全面扫描 Android、Web 和测试目录，再用 diff 对比所有新增文件，最后反复运行 Gradle 确认。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`，但每轮最多读取 2–3 个文件，并只读取任务列表方法、在线下载入口和相关测试片段；`rg` 限定单文件或单符号，不跨 Android/Web/多个测试目录。未跟踪大文件不得执行完整 `git diff --no-index`。发现首个可验证根因后停止探索，先运行一条 focused test，再修一个根因。构建失败时先读取报错行前后约 40 行，并确认文件是否在工具调用间发生变化；没有新证据不得重复全量 Gradle。Web 重试、桥接、数据库、分页和打包列为后续未开始阶段。

## 19. 用户可见行为回归的自然语言触发

```text
加入书架后应该可以在线观看，但现在却变成了下载。下载和加入书架有什么区别？请修复这个 Bug，并验证加入书架后的在线阅读流程。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`。用户没有提供路径，但已经给出现有功能的当前错误行为、期望行为和明确修复请求；不得因此误判为新建项目或停留在 `using-superpowers` 等通用元技能。先在当前项目中定位书架、下载和在线阅读的最小调用链，运行 focused test 或最小复现，再做兼容修改并验证用户流程。

## 20. 无路径中文 Bug 短句触发

```text
刷新后取消的下载任务又出来了，修复这个 BUG。
```

期望自动触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`，即使用户没有写“现有项目”、项目名或文件路径。应把“修复/BUG/刷新后又出现”识别为已有项目的行为回归信号，先定位当前项目根和最小调用链；不能改判为通用探索、新建项目或只读解释。

## 21. 无路径中文行为差异触发

```text
加入书架后不能在线阅读，反而变成下载了，帮我修好。
```

期望自动触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`。用户给出当前行为、期望行为和修复请求就足以判定为现有项目维护，即使没有路径；应先诊断再做最小兼容修改并验证行为。

## 22. 混合索引健康与动态图分层


```text
继续维护这个长期项目。ai-context/INDEX.md 里写了支付失败的入口和测试，但入口文件刚改过目录；同时请查清调用者和影响范围。
```

期望触发 `ai-project-maintainer`。先把 Markdown 索引作为任务意图、操作边界和权威测试命令的来源；运行项目提供的索引健康检查。不存在的本地路径报告 `UNRESOLVED`，通过定向搜索确认新入口后只更新对应路由；审核提交或日期过期只报告 `STALE_REVIEW`，不能据此自动重写仍正确的索引。调用者、被调用者、继承、引用和影响范围使用 `rg`、语言服务器、编译器或可选代码图工具查询，不把动态符号图复制进 Markdown。

## 23. 修复前停止扩展与报告契约

```text
修复现有项目的 Bug：刷新后取消的下载任务又出现了。请先全面扫描所有模块和完整调用链，顺便把桥接层、数据库和构建产物一起改掉。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`，但拒绝无证据的全量扫描和无关跨层修改。先确认规范实现文件、故障入口和首要验收标准；找到首个可验证根因后停止扩展，只改根因相关实现和最小回归测试。完成输出必须列出流程停止点、根因、修改文件列表、每个修改原因和验证结果。

## 24. Skill 触发确认提醒

```text
请排查现有项目中刷新后仍会出现已取消下载任务的问题，并修复它。完成后只报告根因和验证结果。
```

期望实际加载 `ai-project-maintainer` 后，在首次面向用户的工作更新中明确写出“已触发 ai-project-maintainer”，并标明 `NORMAL_CHANGE`。若没有实际加载该 Skill，不得使用这句确认；普通回答或代理不能伪称 Skill 已触发。

## 25. 新增功能必须同步架构记录

```text
在现有项目的用户资料页新增“导出资料”按钮和下载流程，补充必要测试。请不要只改 UI 代码，维护项目架构文档。
```

期望触发 `ai-project-maintainer` 的 `NORMAL_CHANGE`。新增界面和交互功能必须在同一阶段更新受影响目录的 `ai-context/INDEX.md`；若项目没有可用架构文档，则创建或补齐根目录 `ARCHITECTURE.md`，登记新入口、职责、数据/接口边界和聚焦验证。反向测试纯样式调整或普通 Bug 修复时，不因这条规则自动改写架构文档。

## 26. 明确命令触发文档整理

```text
整理维护文档：扫描这个老项目中的所有 Markdown，包括 ARCHITECTURE.md 和 BUG_HISTORY.md，统一迁移到文档/目录，并修复所有引用路径。
```

期望触发 `ai-project-maintainer` 的 `STRUCTURAL_CHANGE` 文档整理路径。只有此类明确命令才允许全项目 Markdown 扫描；迁移前记录基线，迁移后验证引用和幂等性。发现项目已有 `docs/`、`documentation/` 或 `文档/` 规范目录时，跳过已规范文件，只整理新增或遗漏文档，不重复移动。

## 27. 新项目默认维护文档目录

```text
从零创建一个需要长期维护的 Web 应用，后续维护文档和发布说明请统一管理。
```

期望触发 `ai-project-bootstrapper` 的 `DURABLE`。创建项目时默认使用根 `文档/` 目录存放 `ARCHITECTURE.md`、`BUG_HISTORY.md`、维护记录和发布说明；若目标已有 `docs/` 等规范目录则复用，不重复迁移，后续新增文档直接写入该目录。

## 28. 继续未完成阶段的自然语言触发

```text
继续这个没完成的，把剩下的阶段收尾。
```

期望触发 `ai-project-maintainer`，而不是通用元技能或新建项目。提示里没有 Skill 名称、没有路径、也没有"修复"等典型 Bug 词，触发必须来自"继续未完成的工作/收尾阶段"这类续作语义，以及客户端可见的 `description` 前段触发词。识别出这是对既有项目的续作后，先确认项目根、当前阶段和上一个停止点，再继续执行；不要把"继续"误判为无授权而停在提问。

## 29. 触发词的客户端可见窗口

```text
（检查项，非用户提示）确认两个 Skill 的 description 前 249 字符内包含各自的中文与英文触发词。
```

期望 `node scripts/verify-skill-repo.mjs` 通过 `maintainer/bootstrapper trigger phrases fall outside the 249-char client window` 检查。客户端技能列表只渲染 description 的前缀；触发词若排在 `249` 字符之后，模型在选择 Skill 时看不到它们，表现为"Skill 已安装但从不自动触发"。修改 description 时把中文触发词、续作触发词、英文触发词和反向路由子句依次排进该窗口，不要依赖后段内容。

## 通用评分观察点

- 是否触发正确 Skill，并选择正确的模式或档位。
- 是否先确认项目根、目标锚点和写入授权。
- 是否按需读取 reference，避免扫描、复制或读取完整项目。
- 是否保护用户未提交修改并保持公共接口和兼容路径。
- 是否把默认预算当作审查阈值，只有严格场景才作为验收门。
- 是否区分行为验证、结构验证、硬件/实时验证，以及 `PASS`、`FAIL`、`NOT_RUN`、`NOT_AVAILABLE`、`BLOCKED_BY_EXISTING_FAILURE`。
- 是否只在有导航或历史价值时更新索引、架构和 Bug 记录。
