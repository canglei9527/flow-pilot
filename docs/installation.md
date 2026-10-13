# 安装与使用

本仓库推荐使用安装器或客户端插件安装。**不需要每次复制提示词，也不需要在对话中手动指定 Skill 名称。** 安装完成后直接用自然语言描述任务即可。

## 推荐：一条命令安装

需要 Node.js 和 `npx`：

```bash
npx skills add https://github.com/canglei9527/ai-maintenance-skills
```

只安装某一个 Skill 时，可以使用安装器支持的筛选选项：

```bash
npx skills add https://github.com/canglei9527/ai-maintenance-skills --skill ai-project-maintainer
npx skills add https://github.com/canglei9527/ai-maintenance-skills --skill ai-project-bootstrapper
```

两个 Skill 都包含自己的 `references/requirements-dialogue.md` 和其他运行时参考，单独复制或安装一个 Skill 不需要兄弟目录 `shared/`。仓库中的共享文件只用于维护，修改后运行 `node scripts/sync-skill-references.mjs --write`；日常只读检查使用默认的 `--check`，仓库验证也会检查同步状态。

`npx skills` 是独立的第三方安装器；命令和可用选项以其当前版本为准。安装前可查看帮助：

```bash
npx skills --help
```

发布者或本地开发者可在仓库根目录确认安装器能发现两个 Skill：

```bash
npx skills add . --list
```

## Claude Code

如果客户端支持 Claude 插件 marketplace：

```text
/plugin marketplace add canglei9527/ai-maintenance-skills
/plugin install ai-maintenance-skills@ai-maintenance-skills
```

如果你的 Claude Code 版本使用图形插件管理器，也可以在 marketplace 中搜索 `ai-maintenance-skills` 并安装。插件清单位于 `.claude-plugin/marketplace.json` 和 `.claude-plugin/plugin.json`。

## Codex 和其他插件客户端

在支持插件的客户端中搜索 `ai-maintenance-skills`，或者从本仓库地址安装：

```text
https://github.com/canglei9527/ai-maintenance-skills
```

Codex 插件元数据位于 `.codex-plugin/plugin.json`。不同客户端的插件命令可能不同，因此优先使用客户端自己的 Plugins/Marketplace 界面；如果客户端不识别插件清单，使用上面的 `npx skills` 安装器。

## 安装后怎么用

安装完成后直接说：

```text
搜索结果把漫画显示到了小说筛选页，请修复并验证。
```

或：

```text
从零创建一个 Python + Flask 的书源搜索服务。
```

AI 应自动判断请求属于已有项目维护还是新项目初始化，然后执行对应流程：先确认 `project_root` 和 `target_anchor`，读取 `AGENTS.md` 与 `ai-context/` 索引，再按目标锚点读取实现、一跳项目自有依赖、实际配置/数据结构和最小测试。它不会因为架构索引列出了模块，就打开同目录全部源码。

`AI修Bug提问模板.md` 只用于复杂问题交接或一次性补充完整复现信息，不是日常使用的必填提示。

## 导入项目和结构整理

导入或接手已有项目时，Skill 默认只做浅层检查，不会自动移动或重命名文件。它会先询问是否要整理成便于维护的项目结构。

只有明确同意后，Skill 才会先运行整理前基线，再分批整理，最后运行同一套测试和启动检查。整理前后结果会被比较，并区分已有失败、整理引入的回归和环境问题。验证失败时会停止或恢复失败批次，不会直接宣称整理完成。

选择不整理时，保持原项目结构，只进行普通 Bug 修复或其他明确请求的维护工作。


安装后使用 `ai-project-bootstrapper` 创建新程序时，Skill 会先选择或创建独立项目根目录，并在根目录放置 `AGENTS.md`，在 `ai-context/` 放置架构、函数索引和 Bug 历史。例如当前工作区是 `workspace/`，新项目应放在：

```text
workspace/book-source-search/
├── AGENTS.md
├── ai-context/
│   ├── ARCHITECTURE.md
│   ├── FUNCTION_INDEX.md
│   └── BUG_HISTORY.md
├── src/
└── tests/
```

源码、测试、配置、文档和资产全部放入这个目录，不直接写入 `workspace/`，也不与其他项目源码混合。只有用户明确指定一个已有空目录作为目标时，才可以直接在该目录初始化。


- **项目级安装**：只让当前项目使用，适合团队规则或项目专用维护流程。
- **用户级安装**：让当前用户的多个项目使用，适合本仓库提供的通用 Skills。

具体安装范围由安装器或客户端选择。若不确定，先使用默认范围，再在安装器帮助中查看 `--global`、`--agent` 或等价选项。

## 更新和卸载

使用同一个安装器或客户端插件管理器更新和卸载，不要手动删除安装器维护的目录。对于 `npx skills`，先查看当前版本支持的命令：

```bash
npx skills --help
```

如果使用手工复制方式，则重新复制仓库中的 `skills/` 以更新，删除目标项目或用户 Skills 目录中的两个 Skill 文件夹以卸载。

## 手工后备安装

没有 Node.js、插件管理器或安装器时，才使用手工方式。在目标项目根目录执行：

```bash
mkdir -p .agents
cp -R /path/to/ai-maintenance-skills/skills ./.agents/
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force .agents | Out-Null
Copy-Item -Recurse -Force C:\path\to\ai-maintenance-skills\skills .agents\
```

手工安装后，确认两个文件存在：

```text
.agents/skills/ai-project-maintainer/SKILL.md
.agents/skills/ai-project-bootstrapper/SKILL.md
```

## 确认是否生效

安装后向 AI 直接发送一个普通任务，例如“请修复这个 Bug，先定位目标函数”。如果 Skill 已被发现，AI 应自动执行局部读取、验证和记录流程；不应要求你重新粘贴本仓库的模板。若没有触发，检查客户端的 Skill/Plugin 列表、安装范围和当前项目工作目录。
