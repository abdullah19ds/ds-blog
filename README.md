# DS Blog — Squarespace Developer Mode Template

A boutique design-studio marketing site (homepage, about, pricing, blog) built on **Squarespace Developer Mode** with a Git-based deploy workflow. Local dev runs against the live site so any local file change is instantly previewable, and `git push` to `master` ships to production.

This README walks you from a clean machine to a fully running local preview, then through the one-time Squarespace admin setup, then through the day-to-day workflow.

---

## Contents

1. [Tech stack](#1-tech-stack)
2. [Prerequisites](#2-prerequisites)
3. [Local setup — clone & run](#3-local-setup--clone--run)
4. [Squarespace admin setup (one-time)](#4-squarespace-admin-setup-one-time)
5. [Day-to-day workflow](#5-day-to-day-workflow)
6. [Project structure](#6-project-structure)
7. [Working on the design system](#7-working-on-the-design-system)
8. [Working with the blog (CMS)](#8-working-with-the-blog-cms)
9. [Common tasks](#9-common-tasks)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix — gotchas worth knowing](#11-appendix--gotchas-worth-knowing)

---

## 1. Tech stack

| Layer | What we use |
|---|---|
| Hosting / CMS | [Squarespace Developer Mode](https://developers.squarespace.com/) (7.0) |
| Templating | JSON-T (Squarespace's JSON Template language) + `<squarespace:*>` tags |
| Styling | LESS — compiled by Squarespace's bundled `less.js v1.3.3` (Java) |
| Fonts | Fraunces (variable, display) + Outfit (body) + JetBrains Mono — via Google Fonts |
| Animation | GSAP 3.12 + ScrollTrigger (loaded from cdnjs at runtime) |
| Smooth scroll | Lenis 1.0 (loaded from jsdelivr at runtime) |
| Local dev server | `@squarespace/server` (npm) |
| Deploy | `git push origin master` → Squarespace auto-pulls |

---

## 2. Prerequisites

Install these once on your machine.

| Tool | Why | How |
|---|---|---|
| **Node.js & npm** | runs the local Squarespace dev server | https://nodejs.org/ (LTS 18+ is fine) |
| **Git** | source control + deploy mechanism | `xcode-select --install` on macOS, otherwise https://git-scm.com/ |
| **Squarespace site with Developer Mode enabled** | the live target the local server pulls live data from | see [§4](#4-squarespace-admin-setup-one-time) |
| **GitHub account** | hosts the repo Squarespace pulls from | https://github.com/ |

You also need:
- The Squarespace site URL (e.g. `https://rose-parakeet-nyah.squarespace.com`)
- An owner-level Squarespace account that can authorise the dev server

---

## 3. Local setup — clone & run

### 3.1 Clone the repo

```bash
git clone git@github.com:abdullah19ds/ds-blog.git
cd ds-blog
```

> If you only have HTTPS access, use:
> `git clone https://github.com/abdullah19ds/ds-blog.git`

### 3.2 Install the Squarespace dev server (global, one-time)

```bash
npm install -g @squarespace/server
```

Verify it's on your PATH:

```bash
squarespace-server --help
```

If `command not found`, your global npm bin isn't on `$PATH`. Either fix `$PATH` or use `npx @squarespace/server` everywhere instead.

### 3.3 Start the local server

```bash
squarespace-server https://rose-parakeet-nyah.squarespace.com --auth
```

The first run will print a URL like:

```
Please navigate to the following URL:
https://login.squarespace.com/api/1/login/oauth/...

After following the prompts, please enter the code shown in the browser:
```

1. **Open that URL in your browser**, sign in to Squarespace (must be the account that owns the site)
2. Squarespace will display a long code — copy it
3. **Paste it back into the terminal** and hit Enter
4. You should see `Logged in as "<your-email>"` then `Listening on port 9000`

Open **http://localhost:9000** — the homepage should render.

> The `--auth` flag is required for trial sites and any site under construction. Once you've authed once, the token is cached for the session, but a full restart re-prompts.

### 3.4 Useful endpoints during dev

| URL | What it shows |
|---|---|
| `http://localhost:9000/` | Live homepage with local templates |
| `http://localhost:9000/about` | About page |
| `http://localhost:9000/pricing` | Pricing page |
| `http://localhost:9000/blog` | Blog list (CMS-driven) |
| `http://localhost:9000/blog/<slug>` | Single post |
| `http://localhost:9000/local-assets/site.css` | Compiled CSS — useful when LESS errors out |
| `http://localhost:9000/?format=json-pretty` | Raw JSON-T data shape for the homepage |
| `http://localhost:9000/blog?format=json-pretty` | Raw JSON-T data shape for the blog collection |

The `?format=json-pretty` trick is invaluable when wiring up new templates — it shows you exactly what fields are available.

### 3.5 What "live data + local templates" actually means

`squarespace-server` makes **all template files (`.region`, `.page`, `.list`, `.item`, `.block`, `.less`, `.js`)** come from your local working tree, while **all content (page bodies, blog posts, navigation entries, settings)** comes from the live Squarespace site over the network.

So when you edit `pages/home.page` and refresh, you see your new layout — but the title, blog posts, etc. still reflect what's in the live CMS.

---

## 4. Squarespace admin setup (one-time)

If you're forking this template into a brand-new Squarespace site, do these steps once. If you're joining an existing site, skip to §5.

### 4.1 Enable Developer Mode

In the Squarespace admin (site dashboard):

```
Settings → Advanced → Developer Mode → Toggle ON
```

> **⚠️ Warning — irreversible.** Disabling Developer Mode later destroys all custom template files, style tweaks, block-field content, and custom collections. Don't toggle it off unless you're abandoning the codebase.

### 4.2 Connect to GitHub

In Developer Mode, click **Connect to GitHub**, authorise Squarespace, and pick (or create) a repo. Squarespace will populate it with a starter template.

> Replace the starter content by pushing this repo over it (the next step).

### 4.3 Push this template to your Squarespace-connected repo

If your fork is on a different remote, change the origin first:

```bash
git remote set-url origin git@github.com:<your-org>/<your-repo>.git
git push -u origin master
```

Squarespace polls the connected repo and pulls new commits within seconds.

### 4.4 Create the static pages in the CMS

The `.page` files in this repo are layout shells. Each one needs a matching CMS page row — the URL slug is what binds them.

In **Pages** (`/config/pages`):

1. Click **+** → choose **Page** (the blank document icon — *not* Index, Folder, or Cover)
2. Set:
   - Title: `Home`
   - **URL slug: `home`** — must match the `.page` filename exactly
3. Repeat for `about` and `pricing` (slug must equal filename)
4. Right-click the **Home** page → **Set as Homepage**

> **Why URL slug = filename?** Squarespace Developer Mode binds CMS pages to template files by URL slug. There's no template-picker dropdown in Page Settings (intentional). If you create a page with slug `team` and you have `pages/team.page`, it'll use that template automatically.

### 4.5 Create the Blog collection

Still in Pages:

1. Click **+** → **Blog**
2. Title: `Blog`, URL slug: `blog`
3. Inside, click **+** to add a Post — title, body, optional cover image, **Publish**

The blog uses the **system collection** template defined in `template.conf`'s `systemCollections` array, so the `.list` and `.item` files in `/collections/` are picked up automatically.

### 4.6 Wire up the navigations

Squarespace exposes two navigations referenced by `template.conf`:

- `mainNav` — used in the header (and footer "Pages" column)
- `footerNav` — used in the footer "More" column

Drag the pages you want into **Main Navigation** in the Pages panel. Anything in **Not Linked** is reachable but not shown in nav.

### 4.7 Restart the dev server after creating CMS items

After adding any new page or collection in the CMS, **restart `squarespace-server`** (Ctrl+C, then run again) so it pulls the fresh sitemap. Without this, new URLs return 404 locally.

---

## 5. Day-to-day workflow

The cycle is: **edit locally → preview on `localhost:9000` → commit → push → live.**

### 5.1 Edit any file

```bash
# while squarespace-server is running…
nano pages/home.page          # or your editor of choice
```

### 5.2 Refresh the browser

`Cmd+Shift+R` on macOS (hard refresh — bypasses any cached `site.css`). Templates re-render on every request; LESS recompiles automatically.

### 5.3 Commit & push

```bash
git add styles/components.less pages/home.page
git commit -m "Tweak hero headline weight"
git push origin master
```

Squarespace pulls the new commit within ~10–30 seconds. Refresh the live URL to see the change.

> **Tip:** make small, focused commits. Big batches are hard to bisect when the template processor 500s. See [§10](#10-troubleshooting).

### 5.4 Stop the dev server

Ctrl+C in the terminal running `squarespace-server`.

---

## 6. Project structure

```
ds-blog/
├── README.md                ← you are here
├── template.conf            ← master config: layouts, navigations, stylesheet order
├── site.region              ← global HTML wrapper (header, marquee, main, footer)
├── pages/
│   ├── home.page            ← homepage layout shell
│   ├── home.page.conf       ← page metadata (title, etc.)
│   ├── about.page
│   ├── about.page.conf
│   ├── pricing.page
│   └── pricing.page.conf
├── collections/
│   ├── blog.conf            ← collection settings (orderings, addText, acceptTypes)
│   ├── blog.list            ← blog index template (3-col grid + pagination)
│   └── blog.item            ← single post template (header, prose, sidebar)
├── blocks/
│   └── navigation.block     ← reusable nav markup (used by header + footer)
├── styles/
│   ├── reset.css            ← auto-prepended by Squarespace, NEVER list in template.conf
│   ├── global.less          ← color tokens, fonts, spacing scale, base, reveals
│   ├── typography.less      ← Fraunces hierarchy, eyebrows, prose styles
│   ├── layout.less          ← container, sticky header, marquee, footer
│   ├── components.less      ← buttons, stats, services, testimonial slider, CTA card
│   ├── home.less            ← split hero, results strip, testimonial slider chrome
│   ├── about.less           ← about hero, POV section, team grid, quick-facts strip
│   ├── pricing.less         ← billing toggle, plan cards, FAQ accordion
│   └── blog.less            ← blog list grid, post card, post detail layout
└── scripts/
    └── site.js              ← all client JS: nav, slider, billing toggle, counters,
                                accordion animation, GSAP reveals, Lenis smooth scroll
```

### 6.1 What `template.conf` controls

```jsonc
{
  "name": "DesignShifu",
  "author": "DesignShifu",
  "layouts": {
    "default": { "name": "Default", "regions": ["site"] }
  },
  "navigations": [
    { "title": "Main Navigation",   "name": "mainNav" },
    { "title": "Footer Navigation", "name": "footerNav" }
  ],
  "stylesheets": [
    "global.less", "typography.less", "layout.less",
    "components.less", "home.less", "about.less",
    "pricing.less", "blog.less"
  ],
  "systemCollections": ["blog"]
}
```

- `layouts.default.regions[0]` points at `site.region`. Add more regions for alt layouts.
- Stylesheets are listed in **cascade order** — later files override earlier ones.
- `reset.css` lives in `/styles/` but is **not listed** here — Squarespace auto-prepends it.

---

## 7. Working on the design system

### 7.1 Color tokens

All in `styles/global.less`:

```less
@paper:        #f4ede1;   // page background
@paper-deep:   #e9e0d0;   // surfaces, hairline backgrounds
@ink:          #141009;   // text, dark surfaces
@ink-muted:    #7a6c5c;   // secondary text
@accent:       #d64a1a;   // burnt orange — accents only
```

Each token is exposed as a Style Editor tweak:

```less
// tweak: { "type": "color", "title": "Paper", "category": "Colors" }
@paper: #f4ede1;
```

…so a non-developer can shift the palette from the Squarespace Style Editor without touching code.

### 7.2 Spacing scale (4pt grid)

```less
@s-1: 4px;  @s-2: 8px;  @s-3: 12px; @s-4: 16px; @s-5: 24px;
@s-6: 32px; @s-7: 48px; @s-8: 64px; @s-9: 96px; @s-10: 144px;
```

Use these instead of magic-number paddings.

### 7.3 Fonts

Loaded from Google Fonts in `site.region`:

```less
@font-display: 'Fraunces', 'Georgia', serif;       // variable: opsz 9–144, wght 100–900
@font-body:    'Outfit', ui-sans-serif, ...;
@font-mono:    'JetBrains Mono', ui-monospace, ...;
```

Fraunces is a variable font — use `font-variation-settings: 'opsz' <9–144>` to shift between editorial swash (low opsz) and tight display (high opsz).

### 7.4 Animation primitives

- **`@ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`** — the global "spring" curve. Default for all transitions.
- **`.reveal`** — element starts hidden + 24px down, JS sets `.is-visible` on viewport entry. Stagger delays apply automatically per nth-child.
- **`data-count` / `data-suffix`** — animated number counters. easeOutQuint, 2.2s, tabular-nums to prevent jitter.
- **GSAP** — loaded from cdnjs at runtime (in `scripts/site.js`). When available, `.reveal` is upgraded to a GSAP tween; a page-load curtain wipes up; clicking internal links replays the curtain before navigation.
- **Lenis** — smooth wheel scroll, native momentum on touch. GSAP-synced.

> **Don't** add raw `<script src="…">` tags inside `site.region`'s `<head>` — Squarespace's template processor (Jericho HTML parser) chokes on them. Always either use `<squarespace:script src="…">` or load via JS at runtime.

---

## 8. Working with the blog (CMS)

### 8.1 Adding a post

1. Squarespace admin → **Pages** → **Blog** → **+ Add Post**
2. Title, body, optional cover image (Page Settings → Media), categories/tags
3. **Publish**

The post appears in `/blog` automatically, sorted newest-first, in the 3-column grid defined by `collections/blog.list`. Click any card → routes to `/blog/<post-slug>` rendered by `collections/blog.item`.

### 8.2 Editing the list/detail templates

- `collections/blog.list` — the index. Iterates `{.repeated section items}` (top-level array).
- `collections/blog.item` — the single-post page. `{title}`, `{body|safe}`, `{assetUrl}`, `{addedOn}`, `{categories}`.

JSON-T cheatsheet:

```jsont
{.section field}              if field exists & truthy
  {field}                     output value
{.or}                         else branch
  fallback
{.end}

{.repeated section items}     loop array
  {title}
{.end}

{addedOn|date %B %d, %Y}      pipe filter — formats Unix timestamp
{body|safe}                   suppress HTML escaping
```

To preview the data shape: `curl -s 'http://localhost:9000/blog?format=json-pretty' | less`.

---

## 9. Common tasks

### Change the site title in nav/footer
Edit `site.region` — the brand name is hardcoded as `<span class="brand-name">DS Blog</span>` in two places (header and footer). The footer copyright reads `&copy; <span class="copy-year"></span> DS Blog. All rights reserved.` — the year is auto-inserted by `scripts/site.js`.

### Add a new top-level page (e.g. `/work`)

1. Create `pages/work.page` and `pages/work.page.conf`:
   ```json
   { "title": "Work" }
   ```
2. Push: `git add pages/work.page* && git commit -m "Add work page" && git push`
3. In the CMS: Pages → + → Page → URL slug `work`, drag into Main Navigation
4. Restart `squarespace-server`
5. Visit `localhost:9000/work`

### Add a stylesheet

1. Create `styles/work.less`
2. Add to `template.conf`'s `stylesheets` array (in cascade order)
3. Push

### Tweak a CTA copy
Each page (`home.page`, `about.page`, `pricing.page`) has its own `<section class="section-cta">` near the bottom. Edit the headline / paragraph / button labels directly there.

### Adjust pricing
`pages/pricing.page` — each `.plan-card` has `data-monthly` and `data-yearly` attributes on `.plan-amount`. Update both numbers; the toggle JS swaps between them.

```html
<span class="plan-amount" data-monthly="14,000" data-yearly="11,480">14,000</span>
```

### Add a testimonial
`pages/home.page` — find `<div class="testimonial-track" data-slider-track>` and append another `<figure class="testimonial-slide" data-slider-slide>…</figure>`. The dot navigation auto-counts.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `localhost:9000` returns 500 with "There was an error processing your request" | Template processor (Jericho HTML parser) failed | See *next 4 rows* |
| 500 across **all** URLs after a recent edit | Cached broken template state in `squarespace-server` | **Ctrl+C and restart it.** This is the most common cause. |
| 500 on the homepage only | No homepage configured in CMS | Create a Page with slug `home` and right-click → Set as Homepage |
| 500 with "ARG\_COUNT: Function X requires N args" in the LESS output | Java LESS compiler shadows CSS functions of the same name (`saturate`, `lighten`, `darken`, `mix`, `contrast`, `fade`, `desaturate`) | Wrap the CSS use in escape syntax: `backdrop-filter: ~"blur(20px) saturate(160%)";` |
| 500 with "ParseError" on `clamp()`, `max()`, `min()`, `calc()` with negatives | Same compiler doesn't parse modern CSS math | Escape with `~""`: `font-size: ~"clamp(2rem, 4vw, 3.6rem)";` |
| Page renders without CSS (default browser fonts) | `{squarespace-headers}` token is missing from `<head>` in `site.region` | That token is what injects the `<link>` to `site.css` — don't remove it |
| Inline `style="--something: value"` in a `.page` file 500s the template | Java template processor doesn't resolve CSS custom properties in inline styles | Move the dynamic value to a `data-*` attribute and bind it in CSS / JS |
| Blog list shows hero but no items | JSON-T mismatch with Squarespace's actual data shape | Use `{.section empty}empty-state{.or}{.repeated section items}…{.end}{.end}` — `items` is top-level, not nested inside a `pagination` wrapper |
| `squarespace-server: command not found` | npm global bin not on `$PATH` | `npm config get prefix` → ensure `<that>/bin` is in your shell rc |
| Auth flow hangs after pasting code | Network glitch or the OAuth code expired (~5 min validity) | Ctrl+C and re-run `squarespace-server … --auth` |
| New page in CMS returns 404 locally | Server hasn't refetched the sitemap | Restart `squarespace-server` |
| Site CSS at `/site.css?` returns nothing locally | Wrong URL — the local server uses a different path | Use `http://localhost:9000/local-assets/site.css` |
| Push succeeds but live site shows old version | Squarespace pull lag or browser cache | Wait ~30s, then hard-refresh |

---

## 11. Appendix — gotchas worth knowing

These took us hours to discover and aren't well documented anywhere else.

### 11.1 The LESS compiler is **Java**, not JavaScript

Squarespace ships `less.js v1.3.3` running on the JVM. It's old (2013-ish) and has function-name collisions with modern CSS:

| LESS function | CSS function with same name |
|---|---|
| `saturate(@color, @amount)` | `filter: saturate(160%)` |
| `lighten(@color, @amount)` | n/a (but watch for new CSS functions) |
| `mix(@a, @b, @weight)` | `color-mix(...)` |
| `contrast(...)` | `filter: contrast(...)` |
| `fade(@color, @amount)` | n/a |

Whenever you write a CSS function inside a LESS file with one of these names, **wrap it in escape syntax**:

```less
backdrop-filter: ~"blur(20px) saturate(160%)";
filter: ~"grayscale(20%) contrast(1.05)";
font-size: ~"clamp(2rem, 4vw, 3.6rem)";
```

The `~"…"` form is LESS's "leave this string alone" escape — the contents are emitted to CSS verbatim.

### 11.2 `{squarespace-headers}` is mandatory

Without this token in `<head>` of `site.region`, Squarespace doesn't inject the `<link rel="stylesheet" href="/local-assets/site.css">` tag. The page renders with only user-agent styles, which looks exactly like CSS is broken.

It also injects: CSRF token (forms), OG/Twitter meta, polyfills.

### 11.3 The Jericho HTML parser is strict

Squarespace's template pre-processor uses [Jericho HTML Parser](http://jericho.htmlparser.net/). It chokes on:

- **Raw `<script>` tags in `<head>`** — use `<squarespace:script>` or inject from JS at runtime
- **Inline `style="--token: value"`** — CSS custom properties in inline styles
- **Unclosed tags** even where browsers tolerate them

When you hit a 500 on a fresh template change and the LESS compiles fine, this is almost always the cause. Check your inline styles first.

### 11.4 Restart-after-404 is real

The dev server caches the sitemap from the last successful pull. New CMS pages aren't visible to it until you Ctrl+C / re-run.

### 11.5 The 500 cache cascade

If a single page template 500s, `squarespace-server` may end up serving 500 for **every** URL on subsequent requests until restarted, even after you fix the file. The fix is always: Ctrl+C, run again. Don't waste time debugging "why is everything broken now".

### 11.6 No Framer Motion, no React

Squarespace pages are server-rendered HTML. There's no React / Vue / Framer Motion runtime. Use plain JS + CSS, optionally augmented with GSAP (loaded from CDN at runtime) for advanced animation. Lenis is fine since it's a vanilla library.

### 11.7 Custom collections need a push before they preview locally

If you add a new `.list`/`.item`/`.conf` triplet in `/collections/`, you must `git push` before `squarespace-server` will resolve it. The server fetches the manifest from the remote, not your working tree.

---

## License & credits

Template scaffold and design system: DesignShifu, 2026.
Built on [Squarespace Developer Platform](https://developers.squarespace.com/).
Animation: [GSAP](https://gsap.com/), [Lenis](https://lenis.darkroom.engineering/).
Type: [Fraunces](https://fonts.google.com/specimen/Fraunces) by Phaedra Charles & Flavia Zimbardi, [Outfit](https://fonts.google.com/specimen/Outfit) by Smartsheet, [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono).

For questions about this template, open an issue on the repo or email **hello@designshifu.com**.
