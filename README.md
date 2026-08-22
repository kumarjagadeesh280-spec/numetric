# NUMETRIC

Marketing website for NUMETRIC — global accounting and bookkeeping solutions.
Live at **[www.numetricinc.com](https://www.numetricinc.com)**, deployed automatically by Vercel on every push to `main`.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies to install.

| Page | URL |
|---|---|
| Home | `/` |
| Blog index | `/blog` |
| Article | `/blog/<slug>` |
| Our Team | `/team` |
| Content Studio | `/studio` (also `/admin`) |

---

## Running the site locally

```bash
python dev-server.py
```

Then open **http://localhost:8765**.

Use this rather than `python -m http.server`. The site uses clean URLs (`/blog`, `/team`) and a `/blog/<slug>` rewrite that Vercel provides in production; a plain static server returns 404 for every page except the home page. `dev-server.py` applies the same rules so local matches live. It is a development helper only — it is never used in production.

---

## Adding a blog post

Blog posts live in **`data/blogs.json`**. Because the site has no backend, publishing a post means updating that file and committing it. There are two ways to do that.

### Option A — Use the Content Studio (recommended)

1. **Open `/studio`** (locally: http://localhost:8765/studio).

2. **Fill in the form** on the *Posts* tab:

   | Field | Required | Notes |
   |---|---|---|
   | Title | Yes | The slug is generated from this automatically |
   | URL slug | Yes | Becomes `/blog/<slug>`. Must be unique |
   | Publish date | Yes | Controls ordering — newest first |
   | Author | No | Defaults to *NUMETRIC Team* |
   | Tags | No | Comma separated. These become the filter buttons on `/blog` |
   | Cover image URL | No | Leave empty for the generated monogram cover |
   | Summary | Yes | Shown on the blog index and home page |
   | Article body | Yes | Supports light Markdown — see the cheat sheet below |

   The **Live preview** panel on the right shows exactly how the body will render.

3. **Click "Save draft."** The post is now visible at `/blog/<slug>` on **your machine only**, marked with a *Draft* badge. Nobody else can see it yet.

4. **Open the *Export* tab** and click **Download blogs.json**. This gives you the complete file: everything already published, plus your new post, correctly ordered.

5. **Replace `data/blogs.json`** in the repo with the downloaded file, then commit and push:

   ```bash
   git add data/blogs.json
   git commit -m "Add blog post: <title>"
   git push
   ```

6. Once Vercel finishes deploying, the post is live for everyone. Go back to `/studio` → *Export* → **Clear local drafts** so your local copy stops showing the draft badge.

> **Why the download step?** A web page cannot write to a file on the server without a backend. The studio is a writing and preview tool; the commit is what actually publishes.

### Option B — Edit `data/blogs.json` directly

Add an object to the array. Newest posts can go anywhere — the site sorts by `date`.

```json
{
  "slug": "cash-flow-forecasting-for-small-practices",
  "title": "Cash Flow Forecasting for Small Practices",
  "excerpt": "A short summary shown on the blog index and the home page. One or two sentences.",
  "author": "NUMETRIC Team",
  "date": "2026-08-11",
  "tags": ["Bookkeeping", "Practice Growth"],
  "cover": "",
  "content": "The article body goes here.\n\n## A heading\n\nParagraphs are separated by \\n\\n."
}
```

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Lowercase, hyphenated. Sets the URL and must be unique |
| `title` | string | |
| `excerpt` | string | Plain text, no formatting |
| `author` | string | Optional — defaults to *NUMETRIC Team* |
| `date` | string | `YYYY-MM-DD`. Sorts newest first |
| `tags` | array | Drives the filter buttons on `/blog` |
| `cover` | string | Optional image path or URL. Empty = generated monogram cover |
| `content` | string | The body. Use `\n` for line breaks, `\n\n` between paragraphs |

Validate the file before committing — one stray comma breaks the whole blog:

```bash
python -c "import json; json.load(open('data/blogs.json')); print('valid')"
```

### Body formatting cheat sheet

| Write | Get |
|---|---|
| `## Heading` | Section heading |
| `### Sub-heading` | Smaller heading |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | inline code |
| `- item` | Bulleted list |
| `1. item` | Numbered list |
| `> quoted line` | Pull quote |
| `---` | Horizontal rule |
| `[text](https://example.com)` | Link (external links open in a new tab) |

Not supported: `#` single-hash headings (the title fills that role), tables, images inside the body, and raw HTML — any HTML you type is escaped and shown as literal text.

### Where a new post shows up

- **`/blog`** — all posts. The newest is featured across the full width.
- **`/`** — the three most recent posts appear in the *Latest From the Blog* section automatically.
- **`/blog/<slug>`** — the article itself, with related posts chosen by shared tags.

Nothing else needs updating. Tag filters, read times and related posts are all derived from the JSON.

---

## Editing the team page

Everyone shown on `/team` comes from the `TEAM` object at the bottom of **`team.html`**. Adding a person is one entry appended to `TEAM.members`:

```js
{
    name: 'Full Name',
    role: 'Chief Operating Officer',
    badge: 'Leadership',
    photo: '/assets/photo.jpg',   // leave '' for the monogram treatment
    bio: 'Two or three sentences.',
    focus: ['Payroll Operations', 'Client Onboarding'],
    links: [
        { type: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/...' },
        { type: 'email',    label: 'name@numetricinc.com', url: 'mailto:name@numetricinc.com' }
    ]
}
```

`type` selects the icon (`linkedin` or `email`) and is the only thing that
distinguishes them. Omit a link entirely rather than pointing it somewhere
generic — a member with no published email simply has one link.

Photos live in **`/assets/team/`** with slug filenames (`firstname-lastname.jpeg`).
Keep them there and keep the names free of spaces and `&`, both of which end up
percent-encoded in the URL.

Array order is page order, and the grid reflows on its own.

While any value still contains the word `PLACEHOLDER`, an amber editor banner
appears at the top of the page as a reminder. All three current entries are
real, so the banner is not showing — do not invent biographical detail to keep
it that way.

---

## Forms and client reviews

The contact and review forms post to **Google Forms**; the responses land in a
Google Sheet; the sheet is published as CSV and read back into the reviews
section, so approved reviews appear on the site without a commit.

Everything is driven by the `CONFIG` block at the top of **`assets/site.js`**.
Until it is filled in, both forms fall back to browser-local storage — which
means **nobody receives them**. Setting it up takes about ten minutes:

1. Run `tools/google-forms-setup.gs` once at [script.google.com](https://script.google.com) —
   it creates both forms, links the sheet, adds the moderation column, and
   prints the config block to paste in.
2. Publish the review sheet to the web as CSV and paste that URL into
   `CONFIG.reviewSheetCsv`.

Full walkthrough: **[docs/GOOGLE-FORMS.md](docs/GOOGLE-FORMS.md)**.

To moderate, open the sheet and tick **Approved** — the review appears on the
site within a minute or two. Untick it and it disappears. Nothing to commit.

> Reviews left on the **Google Business profile** (via the QR card in the
> reviews section) stay on Google. Pulling those onto the site would need the
> Google Places API — an API key, a billing account and a five-review cap.

---

## Project structure

```
index.html          Home page
blog.html           Blog index          → /blog
post.html           Article template    → /blog/<slug>
team.html           Team page           → /team
studio.html         Content studio      → /studio

assets/site.css     Design system — all styling for every page
assets/site.js      Shared runtime — nav, footer, content loading, Markdown

data/blogs.json     Published blog posts
data/reviews.json   Published client reviews (legacy — the sheet is now primary)

tools/              google-forms-setup.gs — one-shot Google Forms creator
docs/               GOOGLE-FORMS.md — form/sheet setup and moderation

vercel.json         Routing and redirects
dev-server.py       Local development server
CLAUDE.md           Notes for AI coding assistants
```

Styling is **mobile-first**: base rules target phones, and media queries only add capability at wider screens.

The header and footer are not duplicated across pages — they are generated from a single `NAV` array in `assets/site.js`, so adding a navigation link updates the desktop menu, mobile drawer and footer at once.

---

## Deploying

Push to `main`. Vercel builds and deploys automatically; there is no build command to run.

To preview exactly what will deploy, run `python dev-server.py` first and click through `/`, `/blog`, `/team` and a couple of articles.
