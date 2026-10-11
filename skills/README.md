# Project Skills

This directory contains portable copies of the user-level project skills.

## Included Skills

- `ai-project-maintainer`: maintains existing projects and verifies that structural refactors move ownership, remove old implementations, and keep compatibility layers thin.
- `ai-project-bootstrapper`: creates new standalone projects with explicit module ownership, composition-only entry points, and checks for oversized or duplicated first-party code.

## Install

Copy each skill directory into a `.agents/skills/` folder at the project root or user level, matching the install scope you need:

```text
# project-level (recommended for most users)
.agents/skills/ai-project-maintainer/
.agents/skills/ai-project-bootstrapper/

# user-level (shared across all projects)
~/.agents/skills/ai-project-maintainer/
~/.agents/skills/ai-project-bootstrapper/
```

The `name` in each `SKILL.md` must continue to match its directory name.

## Maintainability Gates

Both skills optimize projects for selective AI reading:

- hand-written implementations target 100-300 lines and may not exceed 400 lines;
- entries, facades, compatibility modules, indexes, and context notes may not exceed 200 lines;
- every maintained first-party source or focused-test directory, at any depth, includes a file-responsibility index;
- the project includes a task-to-file map so an agent chooses files before reading code;
- recursion stays inside an explicitly confirmed project root and stops at nested project markers unless included explicitly;
- `node scripts/verify-maintainability.mjs --project-root <path>` provides executable structure evidence;
- a normal maintenance path may read at most 800 implementation lines: target, one direct dependency, and one focused test;
- behavior tests prove compatibility or functionality, not low-context maintainability;
- each responsibility has one canonical implementation, and copied/shadowed implementations fail inspection;
- partial extraction must be reported as partial instead of completed restructuring;
- generated, vendored, or declarative oversized files must be isolated from routine maintenance routes.
- focused fixes to oversized or repeatedly patched owners run a maintainability checkpoint; mixed independent responsibilities are reported as `ACCUMULATING_STRUCTURAL_DEBT` with a concrete extraction map.
- explicit requests to stop patch accumulation, resolve a God Class, or make an existing project easier to maintain route to structural change rather than another narrow patch.
