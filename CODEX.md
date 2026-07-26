# CODEX.md

Read `AGENTS.md` first. It is the canonical project guidance for this folder. For visual, layout, asset, or site copy changes, also read `DESIGN.md`.

Codex-specific workflow:

- Start complex or multi-step tasks with a short plan.
- Inspect the folder before editing; the production surface is a React/Vite PWA
  backed by Supabase. `site/` is the preserved legacy implementation.
- Use `rg` / `rg --files` for search.
- Use `apply_patch` for manual edits.
- Keep changes scoped and avoid adding frameworks or unrelated generated churn.
- Preserve RLS, atomic RPCs, network-only transactional traffic, and the
  light/dark/sepia design system.
- After any user correction about agent behavior, update `AGENTS.md`.

Before finishing, run the relevant frontend, database, browser, and PWA checks
from `AGENTS.md`.
