# AGENTS.md

## Project Scope

This folder is the armature asset pack: a static site, brand assets, LinkedIn assets, and planning docs for a physical AI and robotics lab in HSR Layout, Bengaluru.

- `site/`: deployable static PWA for `armaturelab.org`.
- `brand/`: finalized SVG mark, favicon, and lockups.
- `linkedin/`: company page logo and banner assets.
- `docs/`: financial model and phased capex plan.
- `README.md`: asset inventory, deploy notes, and known open placeholders.
- `DESIGN.md`: visual system and design consistency rules for site and asset changes.

There is no package manager, build system, or app test suite in this folder unless one is added later.

## Brand And Naming Rules

- Keep the parent and lab identities separate. The larger parent plan is `Institute for Physical AI`; the lab identity is `Armature - The Physical AI and Robotics Lab`.
- The current public site and asset pack style the lab name as lowercase `armature`. Preserve that styling in existing site copy and SVG text unless the user explicitly asks for capitalization changes.
- Do not flatten the hierarchy into a vague umbrella name like "Armature Institute" unless the user explicitly asks.
- Keep HSR Layout, Bengaluru as the location signal unless the user gives a replacement.
- Light assets are the primary assets. Ink/dark variants are for dark surfaces.

## Source Of Truth

Keep these facts consistent across `site/index.html`, `docs/`, and `README.md` when any of them change:

- 3,500 sq ft lab footprint.
- Ten zones.
- Sixteen dedicated builder pods.
- Nine cameras.
- Phase 1 launch capex around Rs 50 lakh.
- Full build capex around Rs 75 lakh.
- Monthly cash opex around Rs 7.65 lakh.
- Break-even depends mainly on 2 to 3 company tenants plus members, pods, workshops, programs, and data-centre builds.

The financial docs are planning estimates, not quotes or financial advice. Do not remove that caveat. If current vendor prices, tariff rates, or legal/financial claims matter, verify them live before treating them as current.

## Placeholder Policy

Known placeholders are intentional until the user supplies final values:

- `Rs [rate]` or `[rate]` pricing on membership, equipment, pods, and certification cards.
- `[Founder name]` on the Join page.
- Join CTA links with `href="#"`.
- Reserved photo slots on the home page.

Do not invent final prices, founder names, URLs, or photos. If the user supplies real values, update `site/index.html` and then remove or edit the matching placeholder note in `README.md`.

## Editing Rules

- Make small, focused edits. Prefer editing existing files over creating new ones.
- Read `DESIGN.md` before visual, layout, asset, or site copy changes.
- Do not introduce a framework, package manager, or build step for simple static-site changes.
- Preserve the PWA behavior in `site/sw.js`: live booking, availability, registration, API, Luma, Razorpay, and calendar URLs must remain network-first and must not be served stale.
- Bump `VERSION` in `site/sw.js` on every deployable site change.
- For procurement or pricing pages, keep INR as the primary displayed currency. Use USD/EUR only in brackets as source or reference pricing.
- Keep docs and calculator numbers aligned. If a financial assumption changes in one place, check all related site tables, calculator defaults, docs, and README notes.
- Preserve the current asset filenames unless the user asks for a rename.
- Keep the site's light, dark, and sepia modes structurally identical. Theme work must use the shared CSS-variable system, persist the visitor's choice, and remain consistent on the home and procurement pages.
- Avoid unrelated redesign, copy expansion, or cleanup.
- Before reporting that a hosting, DNS, database, or admin integration is unavailable, check the active plugin and tool registry. Cloudflare and Supabase plugins may be available for programmatic infrastructure work.
- Namecheap registrar automation can use the personal `namecheap-mcp` skill backed by `johnsorrentino/mcp-namecheap`. Keep nameserver writes disabled by default and require explicit approval before enabling or calling them.
- If the user corrects agent behavior, update this file so the correction is captured for future work.

## Validation Checklist

Use the narrowest checks that match the edit:

- For `site/manifest.webmanifest`, validate JSON:
  `python3 -m json.tool site/manifest.webmanifest`
- For site copy, placeholder, or CTA changes, inspect the known placeholders:
  `rg -n "\\[rate\\]|\\[Founder name\\]|href=\"#\"" README.md site/index.html`
- For service-worker changes, confirm `VERSION` changed and live URL patterns are still network-first.
- For visual or interaction changes, open the static site on macOS:
  `open site/index.html`
- For design changes, confirm palette, typography, layout, and placeholders still follow `DESIGN.md`.
- For theme changes, verify light, dark, and sepia modes plus persistence across `site/index.html` and `site/procurement.html`.
- If service-worker or PWA behavior must be checked, serve the site over localhost:
  `python3 -m http.server 8000 --directory site`

In final replies, be clear when no automated test suite exists.
