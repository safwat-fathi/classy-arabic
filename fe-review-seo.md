# TijaratkBot Marketing Site — SEO & Frontend Performance Plan

## Context

The marketing/landing site (`frontend/`, Next.js 16.3.2 App Router) is mid-refactor: i18n (Arabic-default via `@inlang/paraglide-next`, English at `/en`), a new `sitemap.ts`/`robots.ts`, and JSON-LD structured data have all been added recently but are uncommitted and were never audited end-to-end. The product's entire distribution channel is WhatsApp, so how a shared link previews (Open Graph/Twitter cards) and whether search engines can trust the site's structured data/canonical signals both matter directly to acquisition — not just abstract "SEO hygiene."

This plan is **audit-and-recommendations only** — no code has been changed. It covers two things end-to-end: (1) SEO — metadata, structured data, sitemap/robots accuracy, i18n signals; (2) frontend performance — bundle/asset weight, image optimization, script loading. Findings are grounded in direct reads of the actual source files (paths/line numbers below are verified, not inferred).

**Standing caveat:** `frontend/AGENTS.md` warns this Next.js major version (16) has breaking API/convention changes vs. general training knowledge. Wherever this plan says "verify against local docs," the relevant file already exists at `frontend/node_modules/next/dist/docs/...` (paths given inline) — read it before implementing that item, don't assume the remembered Next.js 13/14 API shape still applies.

---

## 1. What's already good

Don't re-litigate these — they're solid and shouldn't be touched as part of this work:

- **Font loading**: `app/layout.tsx:8-18` self-hosts Cairo + Tajawal via `next/font/google` (CSS variables, arabic+latin subsets). No external Google Fonts `<link>`, no render-blocking request, no FOUT-driven CLS.
- **Server/client split**: zero `"use client"` in any of the 9 `components/landing/*.tsx` files — the entire marketing page is server-rendered. Only `app/pricing.tsx`, `app/demo/message-composer.tsx`, `app/demo/workspace.tsx` are client components, each justifiably (interactive pricing toggle, chat composer, live demo state).
- **Images**: zero raw `<img>` anywhere — everything already goes through `next/image` with `alt` text present.
- **Semantic HTML**: single `<h1>` on `/` (`hero.tsx`), clean `<h2>`/`<h3>` hierarchy across all landing sections, correct `next/link` for cross-route nav vs. plain `<a href="#...">` for in-page anchors.
- **i18n routing plumbing**: `lib/i18n.ts`, `proxy.ts` (Next 16's root-level middleware convention), `project.inlang/settings.json` correctly wire up `PrefixStrategy({ prefixDefault: "never" })`; `app/layout.tsx:31-32,50-52` correctly sets dynamic `lang`/`dir="rtl"|"ltr"` per locale. The gap is specifically in the metadata layer (canonical/hreflang — see P0-7), not routing.
- **`sitemap.ts`'s per-route `alternates.languages`** is correctly built off `availableLanguageTags` (the sitemap has other accuracy problems below, but this part of it works).

Everything below is a genuine gap or a decision to make deliberately.

---

## 2. Findings by priority

### P0 — Critical (wrong signals actively working against indexing/trust)

**P0-1. No single source of truth for the canonical domain — `www` vs. non-`www` drift is real, not theoretical.**
`app/robots.ts:5` and `app/sitemap.ts:6` both fall back to `https://www.tijaratk.com` when `NEXT_PUBLIC_SITE_URL` is unset. `app/page.tsx:42-43,53` hardcodes `https://tijaratk.com` (no `www`) as `Organization.url`, `Organization.logo`, and `WebSite.url`. Verified: `.env.example` does **not** declare `NEXT_PUBLIC_SITE_URL` at all — so unless it's set purely as a platform env var outside the repo, `robots.ts`/`sitemap.ts` run on the `www` fallback while `page.tsx` asserts the non-`www` host in structured data, for the same site.
Fix: create one exported constant (e.g. `lib/site.ts` → `SITE_URL`) read from `NEXT_PUBLIC_SITE_URL` with a single fallback, and use it everywhere a domain string appears literally (`robots.ts`, `sitemap.ts`, the JSON-LD in `page.tsx`). Separately, whichever host is _not_ canonical needs a 301 enforced at the platform/DNS layer (outside this repo — `next.config.ts` has no `redirects()` today and apex/`www` redirects aren't typically handled there anyway). Add `NEXT_PUBLIC_SITE_URL` to `.env.example` once the canonical host is decided, so the fallback-drift bug can't silently recur.
Impact: conflicting canonical-domain signals across robots.txt, sitemap.xml, and structured data confuse crawlers about which host is authoritative, splitting indexing signals between two hosts.

**P0-2. `metadataBase` is missing entirely.**
Neither `app/layout.tsx:20-28` nor `app/page.tsx:14-20` sets `metadataBase`. Without it, relative OG/Twitter image paths won't resolve, and `alternates` can't be expressed as clean relative paths (the mechanism that lets you avoid hardcoding the domain repeatedly, per P0-1).
Fix: set `metadataBase: new URL(SITE_URL)` in `app/layout.tsx`'s `generateMetadata`, using the `SITE_URL` constant from P0-1. Verify exact field shape against `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` first.
Impact: do this first — it structurally unlocks the OG-image/canonical work in P1 without reintroducing the domain-drift bug.

**P0-3. Duplicate, conflicting `SoftwareApplication` JSON-LD on `/`.**
Confirmed by direct read: `app/layout.tsx:35-46` (raw `<script>` at lines 56-59) declares one `SoftwareApplication` object with hardcoded English-only literals (`"name": "Tijaratk Bot"`) — and because `layout.tsx` wraps **every route**, this unlocalized schema also leaks onto `/demo`, where it has no relevance. `app/page.tsx:24-37` declares a **second, different** `SoftwareApplication` object, this one properly localized via `m.schema_app_name()` etc., rendered through `next/script` (lines 72-76). Two different objects of the same `@type` render on the same page (`/`).
Fix: delete the raw JSON-LD block in `app/layout.tsx:35-46` and its `<script>` tag at lines 56-59 entirely. Keep the single localized version in `app/page.tsx`'s array — it's the one that actually varies per locale, and removing the layout-level copy also stops the unwanted leak onto `/demo`.
Impact: search engines may flag duplicate/conflicting structured data as spammy, or arbitrarily pick one and discard the localized version you intended.

**P0-4. `offers.price: "0"` misrepresents the actual product.**
Both JSON-LD blocks assert `offers.price: "0"` (`app/layout.tsx:41-45`, `app/page.tsx:30-35`). But `app/pricing.tsx` (rendered as the `#pricing` section on the same page) shows real paid tiers (Starter/Pro/Growth) with a monthly/yearly toggle and add-ons. The `FAQPage` block correctly mirrors its 6 rendered FAQs (`getFaqs()` in `components/landing/faq-section.tsx`) — the `Offer` block mirrors nothing rendered on the page.
Fix: either drop the `offers` object from the remaining `SoftwareApplication` schema entirely (simplest — avoids asserting one price for a multi-tier product), or model it properly as an `AggregateOffer`/multiple `Offer` entries matching `pricing.tsx`'s actual tiers. Verify the correct schema.org pattern for multi-tier SaaS pricing before implementing.
Impact: this is content that misrepresents what's rendered on the page — a more serious class of structured-data issue than plain duplication (P0-3).

**P0-5. `sitemap.ts` lists `/pricing`, but no such route exists.**
`app/sitemap.ts:17`: `const routes = ["", "/pricing", "/demo"]`. Confirmed: `app/pricing.tsx` exports `PricingSection`, a `"use client"` component imported and rendered directly inside `app/page.tsx:12,84` as the `#pricing` section — there is no `app/pricing/page.tsx`. Requesting `/pricing` as a URL 404s.
Fix: remove `"/pricing"` from the `routes` array. A dedicated indexable pricing route is a separate product/marketing decision, out of scope here.
Impact: sitemaps listing 404 URLs waste crawl budget and can lower Google's trust in the rest of the sitemap's accuracy.

**P0-6. `Organization.logo` points to a file that doesn't exist.**
`app/page.tsx:43`: `logo: "https://tijaratk.com/logo.png"`. Verified: `frontend/public/` contains only `favicon.ico`, `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, and 3 demo product JPGs — no `logo.png`. (There's an `app/logo.tsx` React component, but schema.org's `logo` field needs a static image URL, not a component.)
Fix: create a real `logo.png`/appropriate static image asset in `public/`, then point the JSON-LD at it. Sequence after asset creation (Batch 2 below).
Impact: Google's Rich Results Test / structured-data validator fetches this URL; a 404 here can suppress rich-result eligibility for the whole page, not just the logo field.

**P0-7. No canonical or hreflang tags anywhere on rendered pages.**
Neither `app/layout.tsx:20-28` nor `app/page.tsx:14-20` sets `alternates.canonical` or `alternates.languages`. Only `sitemap.ts`'s `alternates.languages` hints at translations at the sitemap level — necessary but not sufficient. Per-page `<link rel="canonical">` and `<link rel="alternate" hreflang="...">` tags in the actual `<head>` are the primary signal search engines use, and they're completely absent from the rendered pages.
Fix: this must be **locale-aware per request** (canonical for `/` serving `ar` differs from `/en`) — not a static string. Add `alternates.canonical`/`alternates.languages` to the relevant route's `generateMetadata`, deriving the current path from `languageTag()` (already imported in `layout.tsx`) the same way `sitemap.ts` derives it from `availableLanguageTags`. Add an `x-default` entry pointing at the Arabic (no-prefix, default) version — Google recommends this for locale-variant sites, and it's missing from `sitemap.ts`'s alternates too, so add it there as well.
Impact: without hreflang, Google may serve the wrong locale to users, treat `/` and `/en` as unrelated pages instead of translations of each other, or flag them as near-duplicate content.

**P0-8. Metadata composition between `layout.tsx` and `page.tsx` needs restructuring carefully, not additive patching.**
Today `app/page.tsx:14-20` declares its own `title`/`description`/`keywords`, entirely separate from `app/layout.tsx:20-28`'s `title`/`description`/`openGraph.title` — meaning this codebase's route-level `generateMetadata` does not obviously deep-merge with the parent today. Before adding `openGraph`/`twitter`/`alternates` to `page.tsx`, verify in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` whether child-segment metadata deep-merges with the parent or replaces matching top-level keys wholesale. If it's the latter, a partial `openGraph` object in `page.tsx` will silently drop whatever `layout.tsx` declared, unless every sub-field is restated.
Recommended split (verify against docs first): stable site-wide defaults in `app/layout.tsx` — `metadataBase`, default `openGraph` (siteName, default image, locale), default `twitter` card type, `verification`. Genuinely per-route/variable fields in each route's own `generateMetadata` — `title`, `description`, `alternates.canonical`, `alternates.languages` (locale-dependent).
Impact: getting this wrong means the OG/canonical work either doesn't render or silently overwrites itself — worth the extra verification step before writing code.

### P1 — High (large gaps, contained fixes)

**P1-9. No Open Graph description/image/url/siteName and no Twitter Card metadata at all.**
`app/layout.tsx:24-26` sets only `openGraph.title`. `app/page.tsx` sets no OG fields. No `twitter` object exists anywhere. No `twitter_*` paraglide message keys exist in `messages/ar.json`/`messages/en.json` — they'd need adding (or reuse the existing OG description string).
Fix: once `metadataBase` (P0-2) exists, add `openGraph: { description, images: [...], url, siteName }` and `twitter: { card: "summary_large_image", title, description, images }`. The image itself is a separate asset task (P1-10).
Impact: **the product's entire distribution channel is WhatsApp** — links shared in WhatsApp chats today render a bare/generic preview (no image, minimal text) because OG metadata is incomplete. That's a materially worse first impression for the exact channel this product depends on.

**P1-10. No dedicated OG image, `site.webmanifest`, or `apple-touch-icon`.**
`public/` has no `opengraph-image` file/route and no manifest. `app/favicon.ico` exists via App Router convention (fine), but there's no `apple-touch-icon` for iOS home-screen/share-sheet previews.
Fix: add an `opengraph-image` per Next 16's file convention (verify current convention/recommended dimensions in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`). Add `site.webmanifest`/`manifest.json` and `apple-touch-icon.png` per `.../01-metadata/manifest.md` and `.../01-metadata/app-icons.md`.
Impact: covers the WhatsApp/social-preview gap above plus basic "add to home screen" mobile branding.

**P1-11. `/demo` has zero metadata and was never excluded from indexing.**
`app/demo/page.tsx` has no `metadata`/`generateMetadata` export. `app/robots.ts` doesn't disallow `/demo`, and `app/sitemap.ts:17` currently includes it. Read directly: `app/demo/page.tsx` is env-gated, per-request, live-data — if `DEMO_STOPGAP_MERCHANT_ID` is unset it renders an error state (`m.demo_env_error()`); if no conversations exist, a different empty state (`m.demo_no_convo()`); otherwise live conversation/product data fetched at request time. This is unstable, potentially-empty, non-marketing content — indexing it risks Google indexing an error page.
Fix: add a minimal `generateMetadata` to `app/demo/page.tsx` with `robots: { index: false, follow: true }` (verify field shape against the generate-metadata docs) plus a basic title/description for the browser tab and accidental external links. Remove `/demo` from `app/sitemap.ts:17`'s `routes` array. Optionally also add an explicit `disallow: "/demo"` in `app/robots.ts` as belt-and-suspenders (the per-page `noindex` is the more precise mechanism since it also covers `/en/demo`).
Impact: prevents an interactive product demo — not marketing copy — from being crawled/ranked, and stops a possible error-state page from surfacing in search results.

**P1-12. No analytics/measurement instrumentation exists — this is a decision, not a default.**
Verified: `package.json` dependencies are exactly `@inlang/paraglide-js`, `@inlang/paraglide-next`, `next`, `react`, `react-dom` — nothing else. No way today to measure organic traffic, search conversion, or field Core Web Vitals.
Options, with real tradeoffs:

- **GA4** (via `next/script`, explicit `strategy`): full-featured, free, but a third-party script and possibly a cookie-consent conversation depending on target audience (Egypt-focused, but check if any EU/GDPR-relevant traffic is expected).
- **`useReportWebVitals`** (Next's built-in hook), forwarded to a lightweight endpoint or Vercel's own reporting if hosted there: zero extra script weight, covers Core Web Vitals specifically, no traffic/funnel data.
- **A privacy-first hosted option** (Vercel Analytics, Plausible): smaller footprint than GA4, less granular.
  Fix: pick one (or start Web-Vitals-only, add traffic analytics later). If script-based, load via `next/script` with explicit `strategy`, consistent with P1-14.
  Impact: without this, none of the other fixes here (traffic recovery from corrected metadata, CWV improvement from image work) can be empirically verified afterward.

**P1-13. No Search Console verification found in the repo.**
No verification meta tag or file present. This only describes what's absent from the codebase — if the property is already verified via DNS TXT record or an existing GA/GTM link, this finding is moot. Check current verification status in Search Console directly before adding a redundant method.
Fix if genuinely unverified: add via `metadata.verification` in `generateMetadata` (verify exact field name against local docs) rather than a static HTML file, to keep it centralized with the rest of the metadata work.
Impact: without verification, the Search Console checks in the Verification section (§4) below aren't possible to run.

**P1-14. Inconsistent script-loading: raw `<script>` vs. `next/script`.**
`app/layout.tsx:56-59` uses a raw `<script type="application/ld+json">`. `app/page.tsx:72-76` uses `next/script`'s `Script` component. This is naturally resolved as a side effect of deleting the `layout.tsx` block per P0-3 — but establish the convention explicitly: any future script (analytics, third-party embeds) goes through `next/script` with an explicit `strategy`, never a raw `<script>` tag.
Impact: raw `<script>` tags bypass Next's script scheduling/optimization — matters more as scripts accumulate (analytics next, per P1-12).

**P1-15. The 3 demo product JPGs are needlessly large source files.**
Verified via `ls`: `public/images/black_tshirt.jpg` (~592KB), `denim_jacket.jpg` (~731KB), `linen_dress.jpg` (~568KB) — combined ~1.85MB for 3 small product thumbnails, confirmed as the images rendered through `next/image` in `app/demo/product-catalog.tsx`. `public/` totals 1.9MB, entirely explained by these 3 files. They're not raw `<img>` tags — `next/image` transforms them at request time since `next.config.ts` has no blocking `images` config — but the source files are unnecessarily large for that transform to work from.
Fix: resize the source images to their actual maximum display dimensions in `product-catalog.tsx` and re-encode as WebP/AVIF before committing, rather than relying solely on request-time transforms of oversized JPGs. Pair with adding `images.formats` to `next.config.ts` (verify shape against `.../05-config/01-next-config-js/images.md`).
Impact: smaller LCP/asset payload on `/demo`, faster local dev/build, smaller deploy artifact.

### P2 — Medium (real gaps, lower urgency)

**P2-16. No `BreadcrumbList` schema.** Given the site is only `/`, `/demo`, and locale variants, low value today (not enough route depth to matter). Trivial to add later once the P0/P1 structured-data cleanup is done — don't add it into an already-conflicting JSON-LD setup.

**P2-17. `sitemap.ts`'s `lastModified: new Date()` (line 21) always resolves to build/request time, not real content-modification time.** Weakens the freshness signal's accuracy. Fix options: derive per-route timestamps from git history at build time, or simply omit `lastModified` rather than overstating freshness on every build if a real per-route source isn't worth building — a judgment call depending on how often content actually changes.

**P2-18. `next.config.ts` has no `images` config, no `compress`, no explicit `output` mode.** Bare aside from `turbopack.resolveAlias` and the paraglide wrapper. Fix: add `images.formats: ["image/avif", "image/webp"]` (ties to P1-15); verify whether `compress` already defaults to `true` in Next 16 before adding it explicitly.

**P2-19. Cairo + Tajawal across 7 combined weight/subset combinations — a question, not a defect.** Already well-implemented (self-hosted, variable-based) per §1, but worth a design-system review of whether every weight is actually used in the rendered UI, trimming unused ones if not. Owner: whoever owns the design system, not urgent.

### P3 — Low / opportunistic

**P3-20. Code-splitting `/demo` — not needed today; here's the trigger for revisiting it.** Zero `next/dynamic`/`React.lazy` usage anywhere. Not a problem now: App Router auto-splits per route, and the entire dependency list is 5 packages (no chart/animation library needing manual splitting). `app/demo/workspace.tsx` (40 lines, client) imports `ai-insights.tsx` (146 lines) and `product-catalog.tsx` (102 lines) into its own client boundary; `message-composer.tsx` (197 lines) is separate. Combined ≈485 lines ship in `/demo`'s initial client bundle unsplit today. Revisit trigger: if `workspace.tsx`/children grow substantially or a heavy library gets added — then `next/dynamic` for non-critical pieces (e.g. `ai-insights.tsx`, likely secondary to the core chat/catalog interaction). Not worth doing preemptively against 485 lines of plain TSX with no heavy deps.

---

## 3. Suggested execution order

**Batch 1 — Metadata & structured-data cleanup** (code/config only, no new assets, highest leverage)

1. Create `lib/site.ts` exporting `SITE_URL` from `NEXT_PUBLIC_SITE_URL`; resolve the correct canonical host first (check current DNS/platform setup — this plan can't make that business call); confirm the non-canonical host gets a platform-level 301. Add `NEXT_PUBLIC_SITE_URL` to `.env.example`.
2. Add `metadataBase` to `app/layout.tsx`'s `generateMetadata` using `SITE_URL` (P0-2).
3. Delete the raw JSON-LD block and `<script>` tag in `app/layout.tsx:35-46,56-59` (P0-3) — resolves P1-14 as a side effect.
4. Fix `Organization.url`/`logo` and `WebSite.url` in `app/page.tsx:42-43,53` to use `SITE_URL` (logo still points at a non-existent file until Batch 2 — leave a `// TODO` or point at a temporary existing asset).
5. Remove or restructure the `offers` object in the remaining `SoftwareApplication` schema (P0-4).
6. Verify Next 16 metadata merge semantics (P0-8), then add locale-aware canonical/hreflang (via `languageTag()`) to the relevant route's `generateMetadata`; add `x-default` to both the new hreflang tags and `sitemap.ts`'s alternates.
7. Add `generateMetadata` to `app/demo/page.tsx` with `robots: { index: false, follow: true }` plus basic title/description (P1-11).
8. Fix `app/sitemap.ts:17` — remove `/pricing`, remove `/demo`, use `SITE_URL` (P0-5, P1-11).
9. Fix `app/robots.ts:5` to use `SITE_URL` (P0-1).

**Batch 2 — Missing assets**

1. Create a real `logo.png` in `public/`; complete the `Organization.logo` fix deferred from Batch 1 step 4.
2. Add an `opengraph-image` per Next 16's file convention.
3. Add `openGraph`/`twitter` metadata (description, images, url, siteName, card type), respecting the Batch 1 step 6 merge-semantics decision (P1-9).
4. Add `site.webmanifest`/`manifest.json` and `apple-touch-icon.png` (P1-10).

**Batch 3 — Instrumentation**

1. Decide the analytics approach (GA4 / Web-Vitals-only / privacy-first hosted) — product/legal decision (P1-12).
2. Implement via `next/script` with explicit `strategy`.
3. Check current Search Console verification status before adding anything; add `metadata.verification` only if genuinely unverified (P1-13).

**Batch 4 — Image asset optimization**

1. Resize/re-encode the 3 demo product JPGs to WebP/AVIF at actual display dimensions (P1-15).
2. Add `images.formats` to `next.config.ts` (P2-18).

**Batch 5 — Opportunistic / deferrable**

1. `BreadcrumbList` schema for `/demo` (P2-16).
2. `lastModified` accuracy approach in `sitemap.ts` (P2-17).
3. Font-weight audit for Cairo/Tajawal (P2-19).
4. Revisit `/demo` code-splitting only if the P3-20 trigger is met.

---

## 4. Verification (how to confirm each batch actually worked)

**Build health (after every batch):** `pnpm build` (i.e. `next build`) completes clean — catches malformed `generateMetadata` return shapes and broken imports. `pnpm lint` clean.

**Metadata / OG / Twitter / canonical / hreflang (Batch 1 & 2):** Fetch the rendered `<head>` for both `/` and `/en` (`curl -s <url> | grep -E 'canonical|hreflang|og:|twitter:'` against a preview deploy, or view-source) — confirm one canonical tag per page pointing at the correct locale URL, hreflang alternates for `ar`/`en` plus `x-default`, complete OG and Twitter tag sets. Paste the `/` URL into an actual WhatsApp chat (or Facebook's Sharing Debugger / Twitter Card Validator) and visually confirm the preview renders an image and description — the most direct test given the product's own distribution channel.

**Structured data (Batch 1 & 2):** Run Google's Rich Results Test (`search.google.com/test/rich-results`) against `/` — confirm exactly one `SoftwareApplication` object, `Organization.logo` resolves (200, not 404), `FAQPage` still validates against the 6 rendered FAQs, no `offers` field misrepresenting pricing. Run a general schema.org validator as a secondary syntax check.

**Sitemap / robots (Batch 1):** Fetch `/sitemap.xml` — confirm no `/pricing`, no `/demo`, single correct canonical domain throughout, valid XML. Fetch `/robots.txt` — confirm it references the correct domain's sitemap URL. Once Search Console verification is live, use `mcp__gsc__list_sitemaps` to confirm the sitemap parses without errors, and `mcp__gsc__inspect_url` for `/`, `/en`, `/demo` to confirm `/demo` is excluded from indexing and `/`/`/en` are indexed under the correct host.

**Performance / images (Batch 4):** Run Lighthouse or PageSpeed Insights against `/demo` before/after the JPG re-encoding, comparing LCP and image transfer size. Confirm images are actually delivered as WebP/AVIF in the browser network tab after the `next.config.ts` change.

**Analytics (Batch 3):** Confirm events fire in the chosen tool's real-time/debug view after deploy (e.g. GA4 DebugView, or a network-tab check), and confirm the script loads via the intended `next/script` strategy (check load timing in the Performance panel).

**Search Console verification (Batch 3):** Confirm verification status directly in Search Console property settings before and after, to avoid a redundant verification method on an already-verified property.

**Manifest / icons (Batch 2):** Manually test "Add to Home Screen" on iOS Safari and Android Chrome against a preview deploy to confirm `apple-touch-icon` and manifest icons render correctly.

---

## Critical files

- `frontend/app/layout.tsx` — root metadata (`metadataBase`, OG/Twitter defaults, verification), duplicate JSON-LD removal
- `frontend/app/page.tsx` — per-route metadata, canonical/hreflang, remaining structured-data array, domain-string fixes
- `frontend/app/sitemap.ts` — route-list accuracy, `SITE_URL` centralization, hreflang `x-default`
- `frontend/app/robots.ts` — `SITE_URL` centralization, `/demo` disallow (optional, belt-and-suspenders)
- `frontend/app/demo/page.tsx` — new `generateMetadata` with `noindex`
- `frontend/next.config.ts` — `images.formats` (Batch 4)
- `frontend/.env.example` — add `NEXT_PUBLIC_SITE_URL` once the canonical domain is decided
- `frontend/public/` — new `logo.png`, `opengraph-image`, `site.webmanifest`, `apple-touch-icon.png`
- `frontend/public/images/*.jpg` — re-encode to WebP/AVIF (Batch 4)
