# Alin Adrian Ivana — Full Stack Developer Portfolio

Production-ready static portfolio for **Alin Adrian Ivana — Full Stack Developer | Python & JavaScript**.

## Live domain

`https://www.alinadrian.dev`

## Current build — V2.4.12 Stability Hardened

### Languages
The site contains 10 localized versions:

- Romanian (`/`)
- English (`/en/`)
- Italian (`/it/`)
- Spanish (`/es/`)
- Turkish (`/tr/`)
- German (`/de/`)
- Russian (`/ru/`)
- French (`/fr/`)
- Portuguese (`/pt/`)
- Arabic (`/ar/`, RTL)

The header shows only the active language. The remaining languages are available in a compact, scrollable dropdown.

### Themes
Exactly three themes are available:

1. **Graphite + Cold Blue**
2. **Mint / Emerald**
3. **White / Light**

Old `dark` or `slate` saved preferences are migrated safely to Graphite.

### Professional profile
The portfolio reflects the completed LINK Academy programs:

- **AI & Python Development**
- **Frontend JavaScript Development**

Technical areas represented include Python, OOP, Django, JavaScript, HTML/CSS, MySQL/SQL, ORM, HTTP/REST, testing/QA, Machine Learning, NLP/LLMs and Figma. FastAPI, PostgreSQL, Docker and deployment are presented separately as current areas of further development.

### Contact
Public address: `contact@alinadrian.dev`.

Email delivery uses Cloudflare Email Routing. The private destination Gmail address is not exposed in the site source.

### Design and behavior
- AAI monogram + full-name professional branding
- responsive layout for desktop, tablet and mobile
- subtle page-specific motion without third-party libraries
- protected profile-photo interaction layer and discreet domain watermark
- reduced-motion support
- static contact form using `mailto:`
- GitHub Pages compatible (`.nojekyll` and `CNAME` included)

### SEO
- canonical URLs on `https://www.alinadrian.dev`
- 10-language `hreflang` + `x-default`
- Open Graph / Twitter metadata
- JSON-LD structured data
- `sitemap.xml` with 50 localized indexable pages
- `robots.txt`

## Stability hardening in V2.4.12

- Core content is visible even if JavaScript is disabled, blocked or fails to initialize.
- Theme persistence uses guarded `localStorage` access, so restricted preview/private/file contexts cannot abort the script.
- Entrance animations are progressive enhancement only and include a visibility safety fallback.
- Removed obsolete duplicated language-selector CSS from earlier builds.
- No active `ResizeObserver`; resize behavior uses throttled `requestAnimationFrame`.
- CSS and JavaScript are cache-busted with `v=2.4.12`.

## Deployment

Upload the **contents** of this package to the root of the GitHub repository `alinadrian/alinadrian.github.io` and deploy from `main` → `/(root)` in GitHub Pages.

Do not upload the ZIP itself as the website source.


## V2.4.13 stability hardening
- Critical content never depends on JavaScript visibility.
- External Google Fonts dependency removed; robust system font fallback used.
- Motion effects are isolated as progressive enhancement.
- Three themes preserved: Graphite/Cold Blue, Mint/Emerald, White.
- Ten localized language versions preserved.

## V2.4.15 SEO canonical-link cleanup

- Internal links that previously targeted `index.html` now point to the canonical directory URL (`/`, `/en/`, `/es/`, etc.).
- Language-home links and home navigation now consistently use canonical URLs.
- `sitemap.xml` `lastmod` values updated to `2026-08-17` for the deployment containing these SEO changes.
- Existing canonical tags, hreflang annotations, robots directives, design, JavaScript behavior and page content are preserved.

## v2.4.16 — LinkedIn + SEO consistency audit
- Added LinkedIn profile link to every page footer.
- Added LinkedIn to every localized contact page.
- Added LinkedIn to Person structured-data `sameAs`.
- Corrected localized BreadcrumbList URLs and ProfilePage IDs discovered during the audit.
- Preserved canonical, hreflang, sitemap, robots, redirects and existing design behavior.
