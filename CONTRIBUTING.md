# Contributing to armature

Thanks for helping improve armature, the physical AI and robotics lab in HSR
Layout, Bengaluru.

## Before you start

- Read `AGENTS.md` for project facts, editing constraints, and validation steps.
- Read `DESIGN.md` before changing the site, layout, or visual assets.
- Open an issue before a large content, design, or financial-model change.

## Making a change

1. Fork the repository and create a focused branch.
2. Keep the existing static HTML, CSS, and JavaScript approach unless a change
   explicitly requires a build system.
3. Preserve intentional placeholders such as `Rs [rate]`, `[Founder name]`, and
   `href="#"` until final values are supplied.
4. Use INR as the primary currency on procurement and pricing pages.
5. Bump `VERSION` in `site/sw.js` for every deployable site change.

Preview the site on macOS with:

```sh
open site/index.html
```

For service-worker or PWA changes, serve it locally:

```sh
python3 -m http.server 8000 --directory site
```

Validate the web manifest with:

```sh
python3 -m json.tool site/manifest.webmanifest
```

## Pull requests

Keep pull requests small and explain why the change is needed. Include the
validation you ran and screenshots for visual changes. Do not commit API keys,
`.env` files, Wrangler state, generated review assets, or other machine-local
files.

Contributions to source code and documentation are submitted under the Apache
License 2.0. Do not add or modify reserved Armature identity assets unless a
maintainer has explicitly requested the change. See `BRAND-ASSETS.md`.
