# armature - The Physical AI and Robotics Lab · asset pack

Website: [armaturelab.org](https://armaturelab.org)

Current assets as of 14 July 2026.

## site/ (deploy to armaturelab.org)
Upload everything under site/ to the domain root over HTTPS. index.html is the
full site (light, dark, and sepia modes; PWA-enabled). The selected mode is
shared across the home and procurement pages. After deploying, the site is installable
on Android/Chrome and iOS (Add to Home Screen).
- index.html: the site (home, equipment, membership, services, projects, financials, join) with a persistent three-mode theme control
- projects/index.html: static /projects redirect into the Projects page
- procurement.html: procurement board with the same theme control, for the open-project hardware roadmap, sized
  for ten parallel builders with source links and indicative price bands
- project-images/: project-specific local PNG/WebP assets for the Projects page
- manifest.webmanifest, sw.js: PWA shell. Booking/availability/registration URLs
  are network-first and never served stale. Bump VERSION in sw.js on every redeploy.
- icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png: monochrome light icons

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

## Placeholders still open (site)
- Rs [rate] pricing on membership and certification cards
- [Founder name] on the Join page
- Three Join CTA links (href="#")
- Three reserved photo slots on the home page

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and
[DESIGN.md](DESIGN.md) before opening a pull request.

## License

Source code and documentation are licensed under the
[Apache License 2.0](LICENSE). The Armature name and identity assets are
reserved; see [BRAND-ASSETS.md](BRAND-ASSETS.md) for the boundary.
