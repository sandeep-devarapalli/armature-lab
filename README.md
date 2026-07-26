# armature - The Physical AI and Robotics Lab

Website: [armaturelab.org](https://armaturelab.org)

React/Vite member, booking, and check-in PWA for the physical AI and robotics
lab in HSR Layout, Bengaluru.

## Application

- `src/`: public, member, booking, check-in, staff, and kiosk routes.
- `public/`: PWA icons, Cloudflare SPA fallback, and credited project media.
- `supabase/`: schema, RLS, atomic booking RPCs, seed data, database tests, and
  Edge Functions for kiosk, calendar, reminders, and ICS.
- `site/`: legacy static site retained for reference and rollback only.

The application preserves the light, dark, and sepia modes. Supabase is
authoritative for accounts, membership approvals, certifications, resources,
bookings, and attendance. Google Calendar is a one-way operational mirror.

## Local development

Use Node.js 22:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Only public Supabase configuration belongs in `VITE_*` variables. Enable
`VITE_GOOGLE_AUTH_ENABLED` only after the provider is configured. Keep database,
service-role, Google, SMTP, reminder, and kiosk credentials server-side.

Useful checks:

```bash
npm test
npm run build
supabase start
supabase test db supabase/tests/database
supabase/tests/concurrent_booking.sh
```

See [member-booking-pwa-operations.md](docs/member-booking-pwa-operations.md)
for provisioning, kiosk, Google Workspace, release, and rollback procedures.

## brand/
Exploded-A mark and lockups. Light (monochrome ink) is the primary; ink/dark
versions are for dark surfaces. Favicon SVG matches the in-site favicon.
Note: lockup SVGs reference Space Grotesk and JetBrains Mono web fonts; convert
text to outlines before print use.

## linkedin/
Company page assets. Banner 2256x382 (2x retina for 1128x191), logo 800x800.
Light versions are the primary.

## docs/
Financial model and phased capex plan, re-baselined to the 3,500 sq ft plan:
ten zones, sixteen builder pods, nine cameras, ~Rs 7.65 lakh monthly cash opex,
and the full revenue stream set (memberships, pods, tenants, workshops,
programs, data centre builds, on-prem services). Matches the calculator on the
site's Financials page. Planning estimates, not quotes.

## Placeholders still open

- Rs [rate] pricing on membership and certification cards

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and
[DESIGN.md](DESIGN.md) before opening a pull request.

## License

Source code and documentation are licensed under the
[Apache License 2.0](LICENSE). The Armature name and identity assets are
reserved; see [BRAND-ASSETS.md](BRAND-ASSETS.md) for the boundary.
