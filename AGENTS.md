# AGENTS.md

## Project Scope

This folder is the Armature member, booking, and check-in PWA plus the lab's
brand assets and planning documents.

- `src/`: React, Vite, and TypeScript application for `armaturelab.org`.
- `public/`: PWA icons, route fallback, and project media.
- `supabase/`: database migrations, RLS/RPC tests, seed data, and Edge Functions.
- `tests/`: frontend and browser tests.
- `site/`: preserved legacy static site; do not deploy it over the React app.
- `brand/`: finalized SVG mark, favicon, and lockups.
- `linkedin/`: company page logo and banner assets.
- `docs/`: financial model and phased capex plan.
- `README.md`: application setup, deploy notes, and known open placeholders.
- `DESIGN.md`: visual system and design consistency rules for site and asset changes.

Use Node.js 22 and the committed npm lockfile. Supabase is authoritative for
identity, approvals, resources, bookings, attendance, and integration state.

## Brand And Naming Rules

- Keep the parent and lab identities separate. The larger parent plan is `Institute for Physical AI`; the lab identity is `Armature - The Physical AI and Robotics Lab`.
- The current public site and asset pack style the lab name as lowercase `armature`. Preserve that styling in existing site copy and SVG text unless the user explicitly asks for capitalization changes.
- Do not flatten the hierarchy into a vague umbrella name like "Armature Institute" unless the user explicitly asks.
- Keep HSR Layout, Bengaluru as the location signal unless the user gives a replacement.
- Light assets are the primary assets. Ink/dark variants are for dark surfaces.

## Source Of Truth

Keep these facts consistent across `src/`, `docs/`, and `README.md` when any of them change:

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
- The preserved `site/` implementation still contains legacy founder, photo,
  and CTA placeholders; they are not part of the React production surface.

Do not invent final prices, founder names, URLs, or photos. If the user supplies
real values, update the React source and then remove or edit the matching
placeholder note in `README.md`.

## Editing Rules

- Make small, focused edits. Prefer editing existing files over creating new ones.
- Read `DESIGN.md` before visual, layout, asset, or site copy changes.
- Keep the existing React/Vite/TypeScript stack. Do not add another framework or
  state layer for a narrow change.
- Preserve the PWA rules in `vite.config.ts`: authenticated Supabase, Edge
  Function, booking, check-in, calendar, and availability traffic must remain
  network-only and must not be served stale.
- Never place a service-role key, SMTP credential, Google credential, database
  password, or kiosk secret in a `VITE_*` variable.
- Applied Supabase migrations are immutable. Add a new migration for schema
  changes, keep every exposed table under RLS, and regenerate
  `src/types/database.ts` after the linked schema changes.
- Staff authority belongs in `staff_roles`, never editable profile metadata.
- For procurement or pricing pages, keep INR as the primary displayed currency. Use USD/EUR only in brackets as source or reference pricing.
- Keep docs and calculator numbers aligned. If a financial assumption changes in one place, check all related site tables, calculator defaults, docs, and README notes.
- Preserve the current asset filenames unless the user asks for a rename.
- Keep the site's light, dark, and sepia modes structurally identical. Theme
  work must use the shared CSS-variable system, persist the visitor's choice,
  and remain consistent across public, member, staff, and kiosk routes.
- Avoid unrelated redesign, copy expansion, or cleanup.
- Before reporting that a hosting, DNS, database, or admin integration is unavailable, check the active plugin and tool registry. Cloudflare and Supabase plugins may be available for programmatic infrastructure work.
- Namecheap registrar automation can use the personal `namecheap-mcp` skill backed by `johnsorrentino/mcp-namecheap`. Keep nameserver writes disabled by default and require explicit approval before enabling or calling them.
- If the user corrects agent behavior, update this file so the correction is captured for future work.

## Validation Checklist

Use the narrowest checks that match the edit:

- For site copy, placeholder, or CTA changes, inspect the known placeholders:
  `rg -n "\\[rate\\]|\\[Founder name\\]|href=\"#\"" README.md src`
- For frontend changes, run `npm test` and `npm run build`.
- For database changes, reset locally, run
  `supabase test db supabase/tests/database`, and run
  `supabase/tests/concurrent_booking.sh`.
- For service-worker changes, inspect the generated `dist/sw.js` and confirm
  transactional/authenticated traffic is absent from Cache Storage.
- For visual or interaction changes, run `npm run dev` or `npm run preview`.
- For design changes, confirm palette, typography, layout, and placeholders still follow `DESIGN.md`.
- For theme changes, verify light, dark, and sepia modes at desktop and 390px.
- For auth, booking, kiosk, or PWA changes, run the relevant Playwright flows.
