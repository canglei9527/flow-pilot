# Scripts Index

| File | Responsibility | Public interface | Direct dependencies | Read when |
|---|---|---|---|---|
| `release.mjs` | Parses release CLI options and sequences release phases. | `node scripts/release.mjs` | release config, version, Git, GitHub modules | Running or resuming a release. |
| `release-config.mjs` | Owns release paths, defaults, verification commands, and retry settings. | exported constants | none | Changing repository release conventions. |
| `release-version.mjs` | Validates SemVer, synchronizes versions, preserves Markdown notes, and updates changelog and README history. | metadata read/prepare/apply exports | release config, Node fs | Version, release notes, or README history changes. |
| `release-git.mjs` | Inspects Git state and owns commit, push, tag, and retry operations. | Git inspection and mutation exports | release config, Node child process | Git preflight or retry behavior. |
| `release-github.mjs` | Owns authenticated `gh` release lookup and publication. | GitHub auth/release exports | release Git retry helpers | GitHub Release behavior. |
| `verify-skill-repo.mjs` | Read-only repository integrity verification. | `node scripts/verify-skill-repo.mjs` | frontmatter parser, index health, skill integrity | Validating repository content. |
| `skill-integrity.mjs` | Resolves runtime references inside one Skill and checks distributable repository paths. | `inspectSkillReferences`, `inspectRepositoryBoundary` | Node fs, path, local Git | Diagnosing broken single-Skill installs or local-artifact false positives. |
| `sync-skill-references.mjs` | Checks or explicitly syncs local requirements references from the shared editing source. | `node scripts/sync-skill-references.mjs [--check\|--write]` | Node fs, path | Updating the shared requirements dialogue. |
| `tests/skill-integrity.test.mjs` | Isolated source, Git boundary, diagnostics, reference closure, and sync regressions. | Node test suite | verifier CLI, sync CLI, temporary Git fixtures | Changing packaging or integrity validation. |
| `index-health.mjs` | Checks reviewed task indexes for unresolved local routes and stale review metadata without rewriting them. | `node scripts/index-health.mjs <project-root>` | Node fs, path, optional Git metadata | Validating `ai-context/**/INDEX.md`. |
| `skill-frontmatter.mjs` | Parses the repository's restricted Skill frontmatter. | parser export | none | Changing Skill metadata rules. |
| `tests/index-health.test.mjs` | Regression tests for index path extraction, review freshness, and legacy compatibility. | Node test suite | index health module | Changing index validation behavior. |
| `tests/release.test.mjs` | Offline tests for release module behavior. | Node test suite | release version, Git, GitHub modules | Changing release behavior. |
| `tests/skill-frontmatter.test.mjs` | Regression tests for frontmatter parsing. | Node test suite | frontmatter parser | Changing frontmatter parser. |

## Release Read Paths

| Task | First file | One direct dependency | Focused test | Implementation lines |
|---|---|---|---|---|
| Change release flags or phase order | `release.mjs` | `release-config.mjs` | `release.test.mjs` | under 400 |
| Change version/history or Markdown release notes | `release-version.mjs` | `release-config.mjs` | `release.test.mjs` | under 300 |
| Diagnose push/tag/Release retry | `release-git.mjs` or `release-github.mjs` | `release-config.mjs` | `release.test.mjs` | under 350 |

The release CLI does not store credentials or persistent state. It derives resume state from Git tags, commits, and GitHub Release records.
