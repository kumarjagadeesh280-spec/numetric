/* ==========================================================================
   NUMETRIC — Shared runtime
   One script for every page. Header/footer are injected from a single
   definition so navigation never drifts between pages.

   Paths are ROOT-ABSOLUTE (/assets, /data, /blog) on purpose: `/blog/<slug>`
   is rewritten to post.html by Vercel, so relative URLs would resolve against
   a directory that does not exist. Serve the site from its root.
   ========================================================================== */
(function () {
'use strict';

const NM = window.NM = {};

/* Gates the scroll-reveal hidden state in CSS — see `.js [data-reveal]`.
   Set before anything else so a later failure can't leave content hidden. */
document.documentElement.classList.add('js');

/* ── 1. NAVIGATION MODEL ───────────────────────────────────────────────── */
/* Single source of truth for the header, drawer and footer link columns.
   `to` values starting with '#' are resolved against the home page so the
   section anchors keep working from /blog, /team, etc.                    */
const NAV = [
    { label: 'Solutions', children: [
        { label: 'Our Services',          to: '#services' },
        { label: 'Software Integrations', to: '#integrations' },
        { label: 'Our Workflow',          to: '#process' }
    ]},
    { label: 'Global Presence', children: [
        { label: 'Markets We Serve',    to: '#countries' },
        { label: 'Why Choose Numetric', to: '#why' }
    ]},
    /* Blog is deliberately top-level rather than buried in a dropdown —
       it is the one destination visitors are expected to browse. */
    { label: 'Blog',     to: '/blog', key: 'blog' },
    { label: 'Our Team', to: '/team', key: 'team' },
    { label: 'About',    to: '#about' },
    { label: 'Contact',  to: '#contact' }
];

const LOGO_SVG = (light) => `
<svg class="brand-mark" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <linearGradient id="nmLogo${light ? 'L' : 'D'}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#22b8d8"/><stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="none"
          stroke="${light ? 'rgba(255,255,255,.45)' : '#0f2244'}" stroke-width="3"/>
  <rect x="65"  y="120" width="12" height="30" rx="2" fill="${light ? '#fff' : '#0f2244'}"/>
  <rect x="85"  y="105" width="12" height="45" rx="2" fill="url(#nmLogo${light ? 'L' : 'D'})"/>
  <rect x="105" y="85"  width="12" height="65" rx="2" fill="${light ? '#fff' : '#0f2244'}"/>
  <rect x="125" y="70"  width="12" height="80" rx="2" fill="url(#nmLogo${light ? 'L' : 'D'})"/>
  <path d="M60 100 L75 115 L95 85" stroke="#c8973a" stroke-width="4" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* Anchors only work in place on the home page; elsewhere send them home. */
const isHome = () => {
    const p = location.pathname.replace(/\/index\.html$/, '/');
    return p === '/' || p === '';
};
const href = (to) => (to.startsWith('#') && !isHome() ? '/' + to : to);

/* ── 2. HEADER / FOOTER INJECTION ──────────────────────────────────────── */
function buildHeader(active) {
    const menu = NAV.map(item => {
        if (!item.children) {
            return `<li class="nav-item"><a class="nav-link" href="${href(item.to)}"
                ${item.key === active ? 'aria-current="page"' : ''}>${item.label}</a></li>`;
        }
        return `<li class="nav-item">
            <button class="nav-link" aria-haspopup="true">${item.label}<span class="caret">▼</span></button>
            <div class="dropdown">${item.children.map(c =>
                `<a href="${href(c.to)}">${c.label}</a>`).join('')}</div>
        </li>`;
    }).join('');

    const drawer = NAV.map(item => {
        if (!item.children) return `<a href="${href(item.to)}" data-close>${item.label}</a>`;
        return `<div class="drawer-group">
            <span class="drawer-label">${item.label}</span>
            ${item.children.map(c => `<a href="${href(c.to)}" data-close>${c.label}</a>`).join('')}
        </div>`;
    }).join('');

    return `
    <nav class="nav" aria-label="Primary">
        <a class="brand" href="/" aria-label="NUMETRIC home">
            ${LOGO_SVG(false)}<span class="brand-text">NUMETRIC</span>
        </a>
        <ul class="nav-menu">${menu}</ul>
        <div class="nav-cta">
            <a class="btn btn-gold btn-sm" href="${href('#contact')}">Get Started</a>
        </div>
        <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="drawer"
                aria-label="Open menu"><span></span><span></span><span></span></button>
    </nav>
    <div class="drawer" id="drawer">
        ${drawer}
        <div class="drawer-actions">
            <a class="btn btn-gold" href="${href('#contact')}" data-close>Get Started</a>
        </div>
    </div>`;
}

function buildFooter() {
    return `
    <div class="footer-top">
        <div class="footer-brand">
            <div class="brand">${LOGO_SVG(true)}<span class="brand-text">NUMETRIC</span></div>
            <p>Global accounting &amp; bookkeeping solutions for businesses and practices
               across the US, Canada, the UK and Australia.</p>
            <div style="margin-top:1.5rem">
                <a class="social-btn" href="https://www.linkedin.com/company/numetricinc/"
                   target="_blank" rel="noopener" title="LinkedIn">in</a>
            </div>
        </div>
        <div class="footer-col">
            <h5>Company</h5>
            <a href="${href('#about')}">About</a>
            <a href="/team">Our Team</a>
            <a href="${href('#why')}">Why Numetric</a>
            <a href="${href('#countries')}">Global Reach</a>
            <a href="${href('#contact')}">Contact</a>
        </div>
        <div class="footer-col">
            <h5>Resources</h5>
            <a href="/blog">Blog &amp; Insights</a>
            <a href="${href('#services')}">Services</a>
            <a href="${href('#integrations')}">Integrations</a>
            <a href="${href('#reviews')}">Client Reviews</a>
            <a href="${href('#faq')}">FAQ</a>
        </div>
    </div>
    <div class="footer-bottom">
        © 2024–${new Date().getFullYear()} NUMETRIC. All rights reserved.
        · info@numetricinc.com
    </div>`;
}

/* ── 3. CHROME BEHAVIOUR ───────────────────────────────────────────────── */
function mountChrome() {
    const active = document.body.dataset.page || '';
    const header = document.querySelector('[data-site-header]');
    const footer = document.querySelector('[data-site-footer]');
    if (header) {
        header.className = 'site-header';
        header.innerHTML = buildHeader(active);
        /* The header sets `backdrop-filter`, which makes it the containing
           block for position:fixed descendants — a drawer left inside it
           would collapse to the header's own height. Move it to <body>. */
        const drawerEl = header.querySelector('#drawer');
        if (drawerEl) document.body.appendChild(drawerEl);
    }
    if (footer) { footer.className = 'site-footer'; footer.innerHTML = buildFooter(); }

    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('drawer');
    if (toggle && drawer) {
        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            drawer.classList.toggle('open', open);
            document.body.classList.toggle('no-scroll', open);
        };
        toggle.addEventListener('click', () =>
            setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
        drawer.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]')) setOpen(false);
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
        /* A drawer left open while resizing to desktop would trap scroll. */
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) setOpen(false);
        });
    }

    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
}

function mountReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (!entry.isIntersecting) return;
            /* Small stagger so rows of cards cascade rather than pop together. */
            setTimeout(() => entry.target.classList.add('in'), i * 70);
            io.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));

    /* Safety net: nothing stays invisible, whatever the observer does. */
    clearTimeout(mountReveal.sweep);
    mountReveal.sweep = setTimeout(() => {
        document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
    }, 4000);
}

/* ── 4. UTILITIES ──────────────────────────────────────────────────────── */
const esc = NM.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

const slugify = NM.slugify = (s) => String(s).toLowerCase().trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';

const fmtDate = NM.fmtDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso || '');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const readTime = NM.readTime = (text) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
};

/* Deterministic per-post variation so generated covers differ from each other
   but never change between loads. Kept inside the brand's navy range — the
   monogram itself always stays gold. */
const coverAngle = (seed) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
    return 110 + (h % 90);
};

/* ── 5. MARKDOWN-LITE ──────────────────────────────────────────────────── */
/* Deliberately small: headings, lists, quotes, rules, bold/italic/code/links.
   Block structure is detected on the RAW line (escaping first would turn a
   leading `>` into `&gt;` and kill blockquotes); every fragment is escaped
   here, at the point of emission, so authored text can never inject markup.
   Link targets are whitelisted to http(s)/mailto/# to keep `javascript:` out. */
function inline(raw) {
    return esc(raw)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
            /^(https?:\/\/|mailto:|#|\/)/i.test(url)
                ? `<a href="${url}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`
                : label);
}

const toHtml = NM.toHtml = (src) => {
    const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let list = null, para = [];

    const flushPara = () => {
        if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    };
    const flushList = () => { if (list) { out.push(`</${list}>`); list = null; } };
    const flushAll = () => { flushPara(); flushList(); };

    for (const raw of lines) {
        const line = raw.trim();

        if (!line)                       { flushAll(); continue; }
        if (/^(-{3,}|\*{3,})$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

        let m;
        if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
            flushAll();
            const lvl = Math.min(m[1].length, 3);
            out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
            continue;
        }
        if ((m = line.match(/^>\s?(.*)$/))) {
            flushAll();
            out.push(`<blockquote>${inline(m[1])}</blockquote>`);
            continue;
        }
        if ((m = line.match(/^[-*]\s+(.*)$/))) {
            flushPara();
            if (list !== 'ul') { flushList(); out.push('<ul>'); list = 'ul'; }
            out.push(`<li>${inline(m[1])}</li>`);
            continue;
        }
        if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
            flushPara();
            if (list !== 'ol') { flushList(); out.push('<ol>'); list = 'ol'; }
            out.push(`<li>${inline(m[1])}</li>`);
            continue;
        }
        flushList();
        para.push(line);
    }
    flushAll();
    return out.join('\n');
};

/* ── 6. CONTENT STORE ──────────────────────────────────────────────────── */
/* Published content lives in /data/*.json (committed, visible to everyone).
   The studio keeps unpublished drafts in localStorage so you can preview a
   post before it is committed. Drafts are LOCAL ONLY — no other visitor
   sees them until the exported JSON is checked into the repo.              */
const DRAFT_POSTS = 'nm.draftPosts';
const DRAFT_REVIEWS = 'nm.draftReviews';

const readLocal = NM.readLocal = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
};
const writeLocal = NM.writeLocal = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};
NM.KEYS = { posts: DRAFT_POSTS, reviews: DRAFT_REVIEWS };

async function fetchJson(path, fallback) {
    try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        return Array.isArray(data) ? data : (data.posts || data.reviews || fallback);
    } catch {
        /* file:// or a missing data file — degrade to drafts only. */
        return fallback;
    }
}

const normalisePost = (p) => ({
    slug: p.slug || slugify(p.title || ''),
    title: p.title || 'Untitled',
    excerpt: p.excerpt || '',
    content: p.content || '',
    author: p.author || 'NUMETRIC Team',
    date: p.date || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map(t => t.trim()) : []),
    cover: p.cover || '',
    draft: !!p.draft
});

NM.getPosts = async function () {
    const published = (await fetchJson('/data/blogs.json', [])).map(normalisePost);
    const drafts = readLocal(DRAFT_POSTS).map(p => ({ ...normalisePost(p), draft: true }));
    /* A draft that shares a published slug is an edit-in-progress: it wins. */
    const bySlug = new Map();
    published.forEach(p => bySlug.set(p.slug, p));
    drafts.forEach(p => bySlug.set(p.slug, p));
    return [...bySlug.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
};

NM.getReviews = async function () {
    const published = await fetchJson('/data/reviews.json', []);
    return [...readLocal(DRAFT_REVIEWS), ...published]
        .sort((a, b) => (a.date < b.date ? 1 : -1));
};

/* ── 7. POST CARD ──────────────────────────────────────────────────────── */
NM.postCard = function (p, opts = {}) {
    const angle = coverAngle(p.slug);
    const cover = p.cover
        ? `<img src="${esc(p.cover)}" alt="" loading="lazy">`
        : `<span style="position:relative;z-index:1">${esc(
              (p.title.match(/\b\w/g) || ['N']).slice(0, 2).join('').toUpperCase())}</span>`;
    const coverStyle = p.cover ? '' :
        ` style="background:linear-gradient(${angle}deg, var(--navy-700), var(--navy-900))"`;

    return `
    <a class="card card-hover card-accent post-card ${opts.featured ? 'featured' : ''}"
       href="/blog/${esc(p.slug)}" data-reveal>
        <div class="post-cover"${coverStyle}>${cover}</div>
        <div class="post-body">
            <div class="post-meta">
                <span>${esc(fmtDate(p.date))}</span>
                <span class="dot"></span>
                <span>${esc(readTime(p.content))}</span>
                ${p.draft ? '<span class="tag tag-gold" style="margin-left:auto">Draft — local only</span>' : ''}
            </div>
            <h3>${esc(p.title)}</h3>
            <p class="post-excerpt">${esc(p.excerpt)}</p>
            <div class="post-foot">
                <div class="flex-wrap-gap" style="gap:.4rem">
                    ${p.tags.slice(0, 2).map(t => `<span class="tag tag-muted">${esc(t)}</span>`).join('')}
                </div>
                <span class="post-link">Read →</span>
            </div>
        </div>
    </a>`;
};

NM.emptyState = (title, body) => `
    <div class="empty-state" data-reveal>
        <div class="emoji">📝</div>
        <h3>${esc(title)}</h3>
        <p>${esc(body)}</p>
    </div>`;

/* ── 8. FAQ ────────────────────────────────────────────────────────────── */
NM.FAQS = [
    { q: "Is my clients' data secure with an offshore provider?",
      a: "Yes. We implement enterprise-grade security protocols, encrypted data transfers, secure file handling, and strict confidentiality agreements. Your clients' financial information is protected with the same rigour as any onshore provider." },
    { q: "How do you ensure compliance with different country requirements?",
      a: "We maintain expertise in the accounting standards, tax requirements, and regulatory rules of the countries we serve, and stay current with regulatory changes. Every report and entry is reviewed for compliance specific to your jurisdiction." },
    { q: "What's your typical turnaround time?",
      a: "Monthly accounting is typically 5–7 business days, payroll within 2–3 business days, and financial statements 7–10 business days. We can agree specific timelines based on your needs." },
    { q: "Can you handle multiple clients and full back-office work?",
      a: "Yes. We can support a single client or manage your entire back-office portfolio, scaling with your firm's growth and providing dedicated account management for each relationship." },
    { q: "How do I integrate NUMETRIC with my existing systems?",
      a: "We work with the systems you already use, supporting all major accounting software platforms. We establish secure data transfer methods and regular communication protocols so integration doesn't disrupt your workflow." },
    { q: "What's the cost structure and pricing model?",
      a: "Pricing is flexible, based on service complexity and volume. Most firms see cost savings of 40–60% compared to local staffing. We provide transparent quotes once we understand your needs." },
    { q: "How does the onboarding process work?",
      a: "A structured path: discovery meeting → system setup and configuration → documentation review → knowledge transfer → a ramp-up period with close oversight, so you're comfortable before full handoff." },
    { q: "Are you a certified Xero Partner?",
      a: "Yes — a certified Xero Partner with L1 and L2 certifications. Our team can optimise your workflow, set up automations, and ensure accurate real-time reporting." }
];

NM.mountFaq = function (el) {
    if (!el) return;
    el.innerHTML = NM.FAQS.map((f, i) => `
        <div class="faq-item" data-reveal>
            <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
                <span>${esc(f.q)}</span><span class="faq-chevron">▼</span>
            </button>
            <div class="faq-a" id="faq-a-${i}"><div><p>${esc(f.a)}</p></div></div>
        </div>`).join('');

    el.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq-q');
        if (!btn) return;
        const item = btn.parentElement;
        const willOpen = !item.classList.contains('open');
        el.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('open');
            i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
};

/* ── 9. BOOT ───────────────────────────────────────────────────────────── */
NM.ready = (fn) => (document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn());

NM.ready(() => { mountChrome(); mountReveal(); });
/* Re-scan after a page renders async content (blog lists, post bodies). */
NM.observeNew = mountReveal;

})();
