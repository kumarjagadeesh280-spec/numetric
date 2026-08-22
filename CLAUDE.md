# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing site for NUMETRIC (offshore accounting/bookkeeping), served at `www.numetricinc.com` (see `CNAME`) and deployed by Vercel from the repo root. No build step, no package manager, no dependencies, no test suite.

## Running it

```bash
python dev-server.py          # http://localhost:8765
```

Use this rather than `python -m http.server`. The site relies on Vercel's `cleanUrls` and a `/blog/:slug` rewrite; a plain static server 404s on `/founder` and every article URL. `dev-server.py` reimplements exactly those rules so local matches production.

Serve from the **repo root** — all asset, data and link paths are root-absolute (`/assets/...`, `/data/...`, `/blog`). They have to be: `/blog/<slug>` is rewritten to `post.html`, so relative URLs would resolve against a directory that doesn't exist. Opening HTML files over `file://` will not work.

## Architecture

Five pages sharing one stylesheet and one script:

| Route | File | Purpose |
|---|---|---|
| `/` | `index.html` | Home — hero through contact |
| `/blog` | `blog.html` | Article index, tag filter + search |
| `/blog/<slug>` | `post.html` (rewrite) | Single article |
| `/team` | `team.html` | Team profiles |
| `/studio`, `/admin` | `studio.html` | Blog composer + JSON export |

`/founder` 308-redirects to `/team` (the page was renamed; `founder.html` no longer exists).

- `assets/site.css` — the whole design system. Tokens at the top, then components in numbered sections. **Mobile-first**: base rules target phones and media queries only ever add capability at wider widths. Never add a `max-width` query to "fix" mobile; adjust the base rule instead.
- `assets/site.js` — shared runtime on a single `NM` global. Owns the nav model, header/footer injection, content store, Markdown-lite renderer, FAQ and scroll reveal.

Page-specific logic lives in an inline `<script>` at the bottom of each page and hangs off `NM`. Anything shared by two or more pages belongs in `site.js`.

### Header and footer are injected, not duplicated

Each page has empty `<header data-site-header>` / `<footer data-site-footer>` elements; `mountChrome()` fills them from the `NAV` array in `site.js`. Add a nav item there once and it appears in the desktop menu, the mobile drawer and the footer columns. `#`-anchors are rewritten to `/#anchor` automatically when the current page isn't home.

Set `key` on a nav item to match a page's `data-page` value to get the active-state underline. A dropdown parent inherits the underline when one of its children is the current page, so `/blog` still reads as "you are here" from inside **Resources**.

The blog sits under **Resources → Company Insights** alongside Client Reviews and FAQs — this is a deliberate owner decision to keep the top-level bar short. It is additionally surfaced by a "Browse all articles" button in the home page's blog section and a footer link, so don't "fix" its discoverability by promoting it back to a top-level item.

The mobile drawer is deliberately **moved out of `<header>` and appended to `<body>`** after injection. The header sets `backdrop-filter`, which makes it the containing block for `position: fixed` descendants — leaving the drawer inside collapses it to header height. Don't move it back.

### Content model: JSON files, no backend

`data/blogs.json` and `data/reviews.json` are the published source of truth, fetched at runtime. A static host has nothing to receive a write, so publishing is a git operation:

1. Write in `/studio` → **Save draft** (goes to `localStorage`, key `nm.draftPosts`).
2. Export tab → **Download blogs.json** (published posts merged with local drafts; a draft sharing a slug replaces the published post).
3. Replace `data/blogs.json` and commit.
4. **Clear local drafts**.

`NM.getPosts()` merges published + local drafts and flags the latter `draft: true`, which renders a "Draft — local only" badge. Drafts are visible **only in the browser that created them** — never treat one as published.

### Form submissions and live reviews: Google Forms + published Sheet

Blog posts still publish via git. **Reviews and contact enquiries do not.** They post to a Google Form, land in a Sheet, and the review sheet is read back as published CSV — so an approved review appears on the site with no commit.

Everything is driven by `CONFIG` at the top of `site.js` (`reviewForm`, `contactForm`, `reviewSheetCsv`, `googleReviewUrl`). **Every value is optional and blank is not a bug**: each feature degrades to the old `localStorage` behaviour when unset, which is the state the repo ships in. Setup is `tools/google-forms-setup.gs` plus one manual publish-to-web click — see `docs/GOOGLE-FORMS.md`.

Things worth knowing before touching this:

- Google sends no CORS headers on `/formResponse`, so `NM.submitToGoogleForm()` posts `mode: 'no-cors'` and **cannot** confirm storage. A resolved promise means "sent". Don't "fix" this by reading the response — there is nothing to read.
- The **Approved** column is the moderation gate. A blank cell means unapproved. An *absent* column is read as "no moderation configured" and shows everything — so never drop the column to simplify the sheet.
- `NM.getReviews()` suppresses a local draft once a matching approved review returns from the sheet, otherwise the author sees their own review twice.
- `data/reviews.json` still loads and still works. It is now a legacy/seed path, not the primary one.
- Google timestamps arrive as `DD/MM/YYYY` or ISO depending on sheet locale; `toIsoDate()` handles both. Don't replace it with a bare `Date.parse`.

### Markdown-lite

`NM.toHtml()` supports `##`/`###` headings, `-`/`1.` lists, `>` quotes, `---`, `**bold**`, `*italic*`, `` `code` ``, and `[text](url)`.

Block structure is detected on the **raw** line and each fragment is escaped at emission time inside `inline()`. Escaping the whole source upfront turns a leading `>` into `&gt;` and silently kills blockquotes — that bug has been fixed once already. Link targets are whitelisted to `http(s)`/`mailto:`/`#`/`/`.

### Team page

Everything renders from the `TEAM` object at the bottom of `team.html` — markup and CSS never need touching. **Adding a person is one entry appended to `TEAM.members`**; array order is page order. Three real people are in place (CEO, Canada-region partner, associate partner); photos live in `/assets/team/` under slug filenames.

Each `links` entry carries a `type` of `linkedin` or `email`, which picks the inline SVG icon. A member with no published email gets one link — don't substitute a generic `info@` address to make the cards symmetrical.

The page is a corporate profile, not a careers page: no hiring language, no "get in touch to join" call to action, and no way for a visitor to submit themselves. Keep it that way.

While any value still contains the string `PLACEHOLDER`, an amber editor banner appears at the top of the page. Nothing is a placeholder now, and the bios are deliberately **role-scope descriptions rather than biography** — they say what each person is accountable for, not where they trained or how long they have worked. Do not invent biographical details, credentials or tenure to enrich them; get that copy from the person.

The quote above Operating Principles is attributed to the firm (`NUMETRIC — Operating Position`), not to an individual, because no named person is on record as having said it. Don't reattribute it to a person without their sign-off.

## Dead files

`style.css`, `script.js`, `timekit-logo.png` and `office_team.png` are unreferenced leftovers from the pre-refactor single-file site. `script.js` additionally contains a syntax error (duplicated `else` block) and undefined-variable references — it is not a template for anything. `find_sections.py` is a one-off scan script pointing at a Google Drive path on the author's machine.

## Vercel

`vercel.json` holds `cleanUrls`, the `/blog/:slug` and `/admin` rewrites, cache headers, and a pre-existing proxy of `/erp` to a separate deployment. It carries no build config.

Article pages render their body client-side from JSON, so crawlers must execute JS to index post content. Adding a build step that pre-renders `/blog/<slug>` is the fix if organic search on articles becomes a priority.
