# CODEX.md

Read `AGENTS.md` first. It is the canonical project guidance for this folder. For visual, layout, asset, or site copy changes, also read `DESIGN.md`.

Codex-specific workflow:

- Start complex or multi-step tasks with a short plan.
- Inspect the folder before editing; this is a static asset pack, not a build-backed app.
- Use `rg` / `rg --files` for search.
- Use `apply_patch` for manual edits.
- Keep changes scoped and avoid adding features, frameworks, or generated churn.
- Do not assume git is available; this folder may be a plain asset export.
- After any user correction about agent behavior, update `AGENTS.md`.

Before finishing, run the relevant checks from `AGENTS.md` and state honestly if there is no test suite for the touched area.
