---
name: ai-project-bootstrapper
version: "0.4.17"
description: "创建、新建、开发、搭建、从零开始独立项目、初始化新目录或空目录；无需项目名或文件路径。Use to create, build, scaffold, initialize a standalone project from scratch. For existing code or bug fixes, use ai-project-maintainer."
when_to_use: "Creating new standalone projects from scratch. Not for modifying, fixing, or reviewing existing code."
---

# AI 项目初始化器

创建新独立代码库的第一个可运行切片。路径、规格、图片或其他附件是输入定位，不把未实现目标转化为已有项目。若目标已有源码、测试、构建配置或仓库行为，改为路由到 `ai-project-maintainer`。

## 触发信号

以下自然语言信号表示用户要从零创建独立项目，即使无需项目名或文件路径：

- 中文：创建、新建、开发、搭建、实现一个新应用/网站/服务/接口/CLI/脚本/机器人/自动化工具、从零开始、独立项目。
- English: create, build, scaffold, initialize, new project, from scratch, standalone application/service/CLI.

这些词只在目标实现不存在或目标是新目录/空目录（new or empty project directory）时触发初始化器。已有源码、修改现有功能、修复 Bug、重构现有项目或解释/审查现有产物，必须转到 `ai-project-maintainer`；如果 existing implementation must be changed，不能初始化新项目。

## 触发确认

本 Skill 被实际加载后，必须在首次面向用户的工作更新中明确写出“已触发 ai-project-bootstrapper”，并同时标明当前档位：`MICRO`、`STANDARD` 或 `DURABLE`。只有实际加载本 Skill 后才能使用该确认语句；普通回答、通用工具或代理不得伪称 Skill 已触发。

## 文档目录约定

`STANDARD` / `DURABLE` 新项目默认在项目根建立 `文档/` 目录，维护文档直接放入其中，包括 `ARCHITECTURE.md`、`BUG_HISTORY.md`、维护记录和发布说明。若项目已有 `文档/`、`docs/` 或 `documentation/` 等规范文档目录，则复用已有文档目录，不重复迁移，只整理新增或遗漏的维护文档；后续新增维护文档直接写入规范文档目录。`MICRO` 单文件或一次性工具默认不创建文档目录，运行说明可随交付给出；只有用户要求独立维护文档时才添加。用户明确表示不需要维护文档时尊重该约束。

新项目创建流程只整理本次创建产生的维护文档，不扫描或迁移父级工作区和其他项目；文档目录选择、入口和职责必须记录在项目架构或索引中。

## 路由优先

| 情境 | 路由 |
|---|---|
| 空目录或新目录，用于独立 CLI、应用、服务、Worker、守护进程或自动化工具 | 初始化器 |
| `spec.md`、资产或输出路径描述了尚不存在实现的项目 | 初始化器；将供给输入作为需求检查 |
| 现有仓库、monorepo、包、源码、测试、符号、路由、失败或构建行为必须变更 | 维护者 |
| 解释、审查或诊断现有产物而不请求编辑 | 维护者 `READ_ONLY` |

确认用户需要新实现后，读取 [`references/requirements-dialogue.md`](references/requirements-dialogue.md)。先复用用户已明确的需求模式；尚未选择时，在读取项目源码或创建文件前提供 `开始需求问卷`、`跳过问卷` 和 `完全不问，直接执行` 三个选项，具体等待规则见参考。不能从路径或需求模式推断修改现有代码库的权限。

## 项目档位

| 档位 | 适用场景 | 必要形态 |
|---|---|---|
| `MICRO` | 一次性脚本、教学实验或快速原型，无服务生命周期、复杂持久化、公共多模块接口、安全关键行为、硬件时序，也无长期 AI 维护需求 | 交付行为、输入错误处理和运行说明；单文件时保持单文件；不创建治理树 |
| `STANDARD` | 仅在用户明确要求轻量、无需长期 AI 导航的普通 CLI、桌面工具、Web 应用、服务、自动化和多文件独立应用中使用 | 清晰入口、集中配置、内聚模块边界、README 或项目标准启动文档，以及聚焦测试或等效验证 |
| `DURABLE` | 默认档位，适用于需要长期 AI 维护的项目；也适用于多人或多 AI 协作、多个稳定工作流/入口，或高安全/硬件/财务/数据一致性要求 | 必须建立 `AGENTS.md`、`ai-context/INDEX.md`（目录→职责映射表）、根任务路由；按需添加架构主题和操作记录；不创建空 Bug 记录或推测性主题 |

按需选择性读取参考文件：

| 任务 | 必须读取 | 默认不读取 |
|---|---|---|
| `MICRO` 新工具 | [`references/workflow.md`](references/workflow.md) `MICRO` 章节 | 持久化导航和审计章节 |
| `STANDARD` 新项目 | [`references/workflow.md`](references/workflow.md)，然后 [`references/navigation-and-budgets.md`](references/navigation-and-budgets.md) 相关章节 | 无关异常章节 |
| `DURABLE` 新项目 | [`references/workflow.md`](references/workflow.md)、[`references/navigation-and-budgets.md`](references/navigation-and-budgets.md)、[`references/verification-and-exceptions.md`](references/verification-and-exceptions.md) | 无 |
| 所有新项目请求 | [`references/requirements-dialogue.md`](references/requirements-dialogue.md) | 不适用于已有项目维护任务 |

每个参考文件从本文件一跳直达，无需中间文件作为前置条件。

## 不可变规则

- 广泛读取或写入前，先分类用户意图和授权。
- 保持确认的根目录、目标锚点、排除项、项目规则、公共接口和语言/框架约定明确。
- 保留用户改动；不回退或覆盖；不读取或输出密钥。
- 优先内聚边界和小型选择性读取路径，但应为所有权和独立验证而拆分，而非为行数配额。
- 每个业务决策有且仅有一个规范规格和所有者。
- 外部、破坏性、远端、生产、许可证、依赖和 CI 操作需要参考文件中描述的授权。

## 简短工作流

1. 获取请求的行为、约束、运行时、输入、输出和验收检查。
2. 确认专用根目录是否新建/空；若需变更现有实现则停止并路由到维护者（existing implementation must be changed）。
3. 选择 `MICRO`、`STANDARD` 或 `DURABLE`，仅读取其对应参考。
4. 定义最小端到端切片、模块所有权、配置来源、接口、错误行为和聚焦验证。
5. 仅实现已批准的当前工作流；仅在所选档位需要时添加记录和导航。
6. 运行最快的相关检查，然后运行项目边界要求的更广泛检查；分开报告证据和不支持的检查。

## 完成报告

```text
项目根目录：...
档位：MICRO / STANDARD / DURABLE
当前工作流：...
模块边界：职责 -> 唯一规范来源/实现 -> 公共接口
导航记录：创建了什么及原因；未创建什么及原因
验证：检查项 -> 必要/可用/已运行/结果/证据
未完成与风险：...
```

`PASS` 表示该检查已运行且通过。不得将跳过、不可用、硬件未连接或已有失败描述为行为证明。
