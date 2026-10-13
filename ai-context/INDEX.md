<!-- ai-context-format: 1 -->
<!-- reviewed-date: 2026-10-13 -->

# AI Context Index

This reviewed index owns maintenance intent, canonical entry points, and focused verification. Use source tools for live callers, callees, inheritance, references, and impact analysis.

| User task or symptom | Responsibility | First file | Focused test | Read when |
|---|---|---|---|---|
| Change maintainer routing or behavior | Existing-project maintenance workflow | `skills/ai-project-maintainer/SKILL.md` | `node scripts/verify-skill-repo.mjs` | A maintenance request selects the wrong path or violates scope. |
| Change bootstrapper tiers or project navigation | New-project workflow and durable navigation | `skills/ai-project-bootstrapper/SKILL.md` | `node scripts/verify-skill-repo.mjs` | A new project gets the wrong tier, root, or navigation structure. |
| Change index validation or freshness rules | Read-only index health implementation | `scripts/index-health.mjs` | `node --test scripts/tests/index-health.test.mjs` | Local routes resolve incorrectly or review metadata behavior changes. |
| Change Skill frontmatter parsing | Restricted metadata parser | `scripts/skill-frontmatter.mjs` | `node --test scripts/tests/skill-frontmatter.test.mjs` | Installation or discovery rejects or skips a Skill. |
| Change release behavior | Release orchestration modules | `scripts/INDEX.md` | `node --test scripts/tests/release.test.mjs` | Versioning, verification, push, tag, or Release behavior changes. |
| Change documentation migration rules | Explicit docs-organization workflow | `skills/ai-project-maintainer/references/documentation-migration.md` | `node scripts/verify-skill-repo.mjs` | A docs-organization request moves files wrongly, is not idempotent, or triggers on a normal fix. |
| Change requirements dialogue gate | Shared editing source and synchronized local references | `skills/shared/requirements-dialogue.md` | `node scripts/sync-skill-references.mjs --check` | The gate repeats an existing choice or expands authorization; sync local copies after editing. |
| Fix single-Skill installs or repository boundary false positives | Runtime reference closure and distributable paths | `scripts/skill-integrity.mjs` | `node --test scripts/tests/skill-integrity.test.mjs` | A reference escapes the installed Skill, local sessions fail verification, or missing files crash diagnostics. |
