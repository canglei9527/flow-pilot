# Skill Evaluation Cases

These prompts exercise the maintainability gates added to both skills. Review the expected safeguards as part of future edits.

## Repeated Patches Grow A God Class

Prompt:

```text
这个 Flet 应用已经迭代三十多轮，主文件 2900 行。每加一个功能都要同时改控件、状态、回调、语言词典和测试。修复这个问题，让以后别再继续堆补丁。
```

Expected safeguards:

- classify the request as `STRUCTURAL_CHANGE`, not another `NORMAL_CHANGE` patch;
- use coordinated edit clusters and independent verification boundaries, not line count alone, to identify responsibilities;
- produce a migration table for localization, layout construction, session state, lifecycle/I/O, and orchestration when supported by the inspected code;
- move one complete responsibility at a time and remove its old implementation;
- keep public startup and behavior compatibility under focused tests;
- report partial extraction honestly if any approved responsibility remains in the God Class.

## Focused Fix Encounters Accumulating Debt

Prompt:

```text
修复 aider_ui_flet.py 里会话标题不刷新的 bug，不改其他行为。
```

Fixture condition: the target is 2,900 lines and mixes UI construction, localization, state transitions, process callbacks, and output parsing; Git evidence shows repeated feature additions to the same class.

Expected safeguards:

- complete the focused fix as `NORMAL_CHANGE` without forcing an unrelated migration;
- run the maintainability checkpoint before completion;
- report `ACCUMULATING_STRUCTURAL_DEBT`, not merely “the file is large”;
- give a concrete responsibility/interface/test/read-scope map and request separate authorization for migration;
- do not create an empty refactor marker or claim the focused test proves maintainability.

## Existing Project: Renamed Giant Module

Prompt:

```text
整理 E:\example\novel-tool，让它以后容易维护，但保持原启动方式和接口。
```

Fixture condition: `engine.py` is 2,700 lines. A proposed change copies rule helpers into `rules.py`, renames the original to `legacy_engine.py`, and imports the copied helpers near the bottom.

Expected safeguards:

- classify the result as `Scaffolded` or `Partially extracted`, never completed restructuring;
- fail the 400-line hand-written source budget while the 2,700-line module remains;
- detect copied/shadowed definitions;
- require one canonical owner and removal proof;
- require a directory index and task-to-file route to the extracted small files;
- sample maintenance read sets and require each to stay at or below 800 implementation lines;
- preserve compatibility without keeping a facade chain as the final architecture.

## New Project: Giant Entry File

Prompt:

```text
新建一个带 Web 管理页、SQLite、定时任务和命令行的下载服务。
```

Expected safeguards:

- define indexed module ownership before implementation;
- keep every implementation at or below 400 lines and the entry at or below 200 lines;
- keep the entry module limited to configuration, construction, startup, and top-level error handling;
- separate Web assets, persistence, scheduling, and domain workflows into indexed small files;
- sample likely maintenance tasks and prove each minimal read set is at or below 800 implementation lines;
- inspect duplicated constants and canonical ownership before completion;
- do not call a working monolithic demo maintainable.

## Multi-Level Source Tree And Explicit Boundary

Prompt:

```text
检查 E:\example\router，只审计这个项目，支持 src\domain\adapters\ 和 tests\features\ 这样的多级目录。
```

Fixture condition: first-party source and focused tests exist at multiple depths; a nested sibling contains its own `package.json`; deep `node_modules` and `generated` directories contain oversized files.

Expected safeguards:

- recurse through every in-scope source or focused-test directory and require a local index;
- exclude nested dependency/generated directories at any depth;
- stop at the nested sibling project unless it is explicitly included;
- resolve task-map paths from the confirmed project root and reject stale or escaping paths;
- keep the 400/200/800 budgets effective at every depth;
- report structure-gate failures separately from behavior-test results.

## Executable Gate Checker

Run:

```text
node scripts/verify-maintainability.mjs --project-root <project-root>
```

The checker must emit a structured report, fail on unapproved budget/index/task-route/duplicate-implementation violations, and leave the inspected project unchanged. A passing behavior suite alone is not a passing maintainability gate.

## Legitimate Large Generated File

Prompt:

```text
新建一个读取 OpenAPI 生成客户端并提供两个业务命令的 CLI。
```

Fixture condition: generated client code is 4,000 lines and the hand-written CLI entry is 90 lines.

Expected safeguards:

- identify generated code as an explicit exception rather than splitting it manually;
- isolate generated output from hand-written modules;
- evaluate cohesion and size of first-party hand-written code separately;
- verify the entry remains a composition root and business commands have canonical owners.

## Documentation Migration: Idempotency And Trigger Guard

Prompt:

```text
整理 E:\example\novel-tool 的维护文档，统一放到一个目录里。
```

Fixture condition: the project has `ARCHITECTURE.md` and `BUG_HISTORY.md` at the root, a `docs/` directory that already contains `installation.md` and `releases/`, and a second `ARCHITECTURE.md` inside `docs/`. The prompt is issued twice in succession.

Expected safeguards:

- enter the documentation migration path only because the user explicitly issued an organise-docs command; a normal bug fix on the same project must not trigger a full project scan;
- identify `docs/` as the existing canonical directory and reuse it rather than creating a new `文档/` folder;
- skip `installation.md` and `releases/` because they are already in the canonical directory;
- detect the naming conflict between root `ARCHITECTURE.md` and `docs/ARCHITECTURE.md`, stop that file, and report it rather than silently overwriting;
- migrate root `BUG_HISTORY.md` to `docs/`, fix all Markdown links and index references that pointed to the old path, and record the migration baseline;
- on the second identical prompt, detect that no files need moving and produce no further changes — the operation must be idempotent;
- report migrated files, skipped files, conflicts, and reference fixes separately; never substitute "directory looks clean" for a verified file list.

## Requirements Dialogue: Three-Option Gate Behaviour

Prompt:

```text
新建一个带登录、用户表和 REST API 的 Web 服务。
```

Expected safeguards for each of the three option paths:

**开始需求问卷**: ask at most one question per message, starting with the question whose answer most affects implementation (runtime / framework choice); do not repeat information the user already stated; stop asking when enough is known and present a summary covering goal, scope, constraints, acceptance criteria, and deferred items; wait for explicit confirmation before reading any file or creating anything.

**跳过问卷**: proceed without structured Q&A; ask a follow-up only if a genuinely execution-blocking piece of information is missing (e.g. target language is completely unspecified); do not expand that single follow-up into a full questionnaire.

**完全不问，直接执行**: adopt reasonable verifiable assumptions (e.g. Python + FastAPI, SQLite, JWT auth), immediately create files and run applicable validation, report the assumptions and verification results at the end; must not stop at a plan or ask "shall I proceed"; must not request confirmation for writes inside the project root.

Cross-cutting safeguards for all three paths:

- the gate must not appear for a bug fix, a read-only review, a pure refactor, or a configuration-only change;
- "完全不问" does not bypass project-root protection, key-reading restrictions, or any higher-priority system rule;
- the gate is not the IDE plan mode and must not manufacture an IDE approval step.
