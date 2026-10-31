#!/usr/bin/env node
/* =========================================================
   AVORA DIGITAL — BLOG BUILDER
   ---------------------------------------------------------
   Runs on every Netlify build, after build-work.mjs
   (see netlify.toml).

   1. Reads every content/blog/*.md file.
      Each file starts with front matter (see BLOG-GUIDE.md):
        ---
        title: ...
        description: ...
        date: 2026-10-28
        category: Shopify
        ---
   2. Skips posts with "draft: true" and posts dated in the
      future (they appear automatically on the first build
      after their date).
   3. Writes static HTML (good for Google and AI crawlers):
        blog.html             -> /blog
        blog/<slug>.html      -> /blog/<slug>
        feed.xml              -> /feed.xml (RSS)
        index.html            -> "From the blog" section
        sitemap.xml           -> blog + post URLs
   No npm packages needed (Node 18+).
   ========================================================= */

import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://avoradigital.online";
const POSTS_DIR = path.join(ROOT, "content/blog");
const OUT_DIR = path.join(ROOT, "blog");
const DEFAULT_IMAGE = `${SITE}/assets/og-blog.jpg`;
const WORDS_PER_MINUTE = 200;

const log = (...a) => console.log("[blog]", ...a);

/* ---------------- helpers ---------------- */

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const rfc822 = (iso) => new Date(`${iso}T09:00:00Z`).toUTCString();

const todayIso = () => new Date().toISOString().slice(0, 10);

/* An image path in front matter can be "assets/blog/x.jpg",
   "/assets/blog/x.jpg" or a full https URL. */
const absoluteImage = (img) => {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  return `${SITE}/${img.replace(/^\/+/, "")}`;
};
const relativeImage = (img, base) => {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  return `${base}${img.replace(/^\/+/, "")}`;
};

/* ---------------- front matter ---------------- */

function parseFrontMatter(raw, file) {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter (the --- block at the top)`);
  const data = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: m[2] };
}

/* ---------------- markdown (small, safe subset) ----------------
   Supported:
     ## Heading / ### Heading / #### Heading
     paragraphs, **bold**, *italic*, `code`, [link](url)
     - bullet lists, 1. numbered lists
     > quotes
     ![alt text](assets/blog/image.jpg)
     --- (divider)
   Raw HTML is escaped, never rendered.
--------------------------------------------------------------- */

function inline(text, base) {
  let out = esc(text);
  const code = [];
  out = out.replace(/`([^`]+)`/g, (_, c) => {
    code.push(`<code>${c}</code>`);
    return `\u0000${code.length - 1}\u0000`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const raw = url.replace(/&amp;/g, "&");
    if (/^\s*javascript:/i.test(raw)) return label;
    const external = /^https?:\/\//i.test(raw) && !raw.startsWith(SITE);
    let href = raw;
    if (raw.startsWith(SITE)) href = base + raw.slice(SITE.length).replace(/^\/+/, "");
    else if (raw.startsWith("/")) href = base + raw.replace(/^\/+/, "");
    return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => code[Number(i)]);
  return out;
}

function markdown(src, base) {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  const headings = [];
  let i = 0;

  const isBlockStart = (l) =>
    /^#{2,4}\s/.test(l) || /^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l) ||
    /^>\s?/.test(l) || /^-{3,}\s*$/.test(l) || /^!\[/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      let id = slugify(text) || `section-${headings.length + 1}`;
      while (headings.some((x) => x.id === id)) id += "-2";
      headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${inline(text, base)}</h${level}>`);
      i++;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) { html.push("<hr>"); i++; continue; }

    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (img) {
      html.push(`<figure><img src="${esc(relativeImage(img[2], base))}" alt="${esc(img[1])}" loading="lazy" decoding="async">${img[1] ? `<figcaption>${esc(img[1])}</figcaption>` : ""}</figure>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote><p>${inline(buf.join(" ").trim(), base)}</p></blockquote>`);
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+/.test(line);
    if (ordered || /^\s*[-*]\s+/.test(line)) {
      const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < lines.length && (re.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (re.test(lines[i])) items.push(lines[i].replace(re, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      html.push(`<${tag}>${items.map((t) => `<li>${inline(t.trim(), base)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++].trim());
    html.push(`<p>${inline(buf.join(" "), base)}</p>`);
  }

  return { html: html.join("\n"), headings };
}

/* ---------------- load posts ---------------- */

async function loadPosts() {
  if (!existsSync(POSTS_DIR)) {
    log("content/blog not found: building an empty blog.");
    return [];
  }
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const today = todayIso();
  const posts = [];

  for (const file of files) {
    const raw = await readFile(path.join(POSTS_DIR, file), "utf8");
    const { data, body } = parseFrontMatter(raw, file);

    const missing = ["title", "description", "date"].filter((k) => !data[k]);
    if (missing.length) {
      log(`Skipping ${file}: missing ${missing.join(", ")}`);
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !formatDate(data.date)) {
      log(`Skipping ${file}: date must look like 2026-10-28`);
      continue;
    }
    if (String(data.draft).toLowerCase() === "true") {
      log(`Draft, not published: ${file}`);
      continue;
    }
    if (data.date > today) {
      log(`Scheduled for ${data.date}, not published yet: ${file}`);
      continue;
    }

    const slug = slugify(data.slug || file.replace(/\.md$/, ""));
    const words = body.replace(/[#>*`\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;

    posts.push({
      file,
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      updated: /^\d{4}-\d{2}-\d{2}$/.test(data.updated || "") ? data.updated : "",
      category: data.category || "Guides",
      tags: (data.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      image: data.image || "",
      imageAlt: data.imageAlt || data.title,
      author: data.author || "Avora Digital",
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      body,
    });
  }

  const seen = new Set();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`Two posts use the slug "${p.slug}". Give one of them a different slug.`);
    seen.add(p.slug);
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/* ---------------- rendering ---------------- */

function jsonLd(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, "\\u003c")}\n</script>`;
}

const rssLink = (base) =>
  `<link rel="alternate" type="application/rss+xml" title="Avora Digital Blog" href="${base}feed.xml">`;

function fillLayout(layout, { base, title, description, canonical, ogImage, head, main, ogType }) {
  let html = layout
    .replaceAll("{{BASE}}", base)
    .replaceAll("{{TITLE}}", esc(title))
    .replaceAll("{{DESCRIPTION}}", esc(description))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{OG_IMAGE}}", esc(ogImage))
    .replace("{{JSONLD}}", head)
    .replace("{{MAIN}}", main);

  if (ogType) html = html.replace('<meta property="og:type" content="website">', `<meta property="og:type" content="${ogType}">`);

  html = html.replace("Generated by scripts/build-work.mjs", "Generated by scripts/build-blog.mjs");

  // Mark "Blog" as the current page in the header nav.
  html = html.replace(
    `<a href="${base}blog" class="nav-link">`,
    `<a href="${base}blog" class="nav-link active" aria-current="page">`
  );
  return html;
}

const postUrl = (p, base = "") => `${base}blog/${p.slug}`;

function postMedia(p, href, base) {
  const inner = p.image
    ? `<img src="${esc(relativeImage(p.image, base))}" alt="${esc(p.imageAlt)}" width="1200" height="630" loading="lazy" decoding="async">`
    : `<span class="work-item-fallback" aria-hidden="true">${esc(p.title.charAt(0))}</span>`;
  return `<a class="work-item-media" href="${href}" tabindex="-1" aria-hidden="true">${inner}</a>`;
}

function postCard(p, base = "") {
  const href = postUrl(p, base);
  return `
          <article class="work-item post-card reveal" data-category="${esc(slugify(p.category))}">
            ${postMedia(p, href, base)}
            <div class="work-item-body">
              <div class="work-item-meta">
                <span class="work-item-type">${esc(p.category)}</span>
                <span><time datetime="${p.date}">${formatDate(p.date)}</time> · ${p.minutes} min read</span>
              </div>
              <h3><a href="${href}">${esc(p.title)}</a></h3>
              <p>${esc(p.description)}</p>
              <div class="work-item-actions">
                <a href="${href}" class="btn btn-small btn-accent">Read article <span>↗</span></a>
              </div>
            </div>
          </article>`;
}

function blogIndex(posts, layout) {
  const categories = [...new Set(posts.map((p) => p.category))];
  const filters =
    categories.length > 1
      ? `<div class="work-filters reveal" role="group" aria-label="Filter articles">
          <button type="button" class="work-filter active" data-work-filter="all" aria-pressed="true">All</button>
          ${categories
            .map((c) => `<button type="button" class="work-filter" data-work-filter="${esc(slugify(c))}" aria-pressed="false">${esc(c)}</button>`)
            .join("\n          ")}
        </div>`
      : "";

  const list = posts.length
    ? `<div class="work-grid" data-work-grid>
${posts.map((p) => postCard(p, "/")).join("\n")}
        </div>`
    : `<div class="blog-empty reveal">
          <p>The first articles are on their way. In the meantime, tell us what you are building and we will answer your questions directly.</p>
          <a href="/contact" class="btn btn-small btn-accent">Ask a question <span>↗</span></a>
        </div>`;

  const main = `
    <section class="work-hero section-padding">
      <div class="container">
        <div class="section-index reveal">BLOG</div>
        <h1 class="reveal">Notes on stores <span>that sell.</span></h1>
        <p class="work-hero-lead reveal">
          Practical guides on Shopify, custom websites, speed and conversion, written for
          brands selling in Pakistan, the Gulf and the UK.
        </p>
        ${filters}
      </div>
    </section>

    <section class="work-list section-padding">
      <div class="container">
        ${list}
      </div>
    </section>`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE}/blog#blog`,
    url: `${SITE}/blog`,
    name: "Avora Digital Blog",
    description: "Practical guides on Shopify, custom websites, speed and conversion.",
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}/#website` },
    publisher: { "@id": `${SITE}/#organization` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE}/${postUrl(p)}`,
      datePublished: p.date,
    })),
  };

  // Root-relative paths ("/"): /blog and /blog/ both work, because a
  // blog.html file and a blog/ folder sit side by side.
  return fillLayout(layout, {
    base: "/",
    title: "Blog: Shopify, Custom Websites & Conversion | Avora Digital",
    description:
      "Practical guides on Shopify, custom websites, speed and conversion for brands selling in Pakistan, the Gulf and the UK.",
    canonical: `${SITE}/blog`,
    ogImage: DEFAULT_IMAGE,
    head: `${rssLink("/")}\n${jsonLd(ld)}`,
    main,
  });
}

function postPage(p, others, layout) {
  const base = "/";
  const { html, headings } = markdown(p.body, base);
  const url = `${SITE}/${postUrl(p)}`;
  const image = p.image ? absoluteImage(p.image) : DEFAULT_IMAGE;
  const toc = headings.filter((h) => h.level === 2);

  const tocBlock =
    toc.length >= 3
      ? `<nav class="post-toc reveal" aria-label="In this article">
          <span class="section-index">IN THIS ARTICLE</span>
          <ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol>
        </nav>`
      : "";

  const related = others.slice(0, 2);

  const main = `
    <article class="post">
      <section class="cs-hero post-hero">
        <div class="container cs-container">
          <nav class="cs-breadcrumb reveal" aria-label="Breadcrumb">
            <a href="${base}blog">Blog</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.category)}</span>
          </nav>
          <div class="section-index reveal">${esc(p.category.toUpperCase())} · ${p.minutes} MIN READ</div>
          <h1 class="reveal">${esc(p.title)}</h1>
          <p class="cs-lead reveal">${esc(p.description)}</p>
          <p class="post-byline reveal">
            By ${esc(p.author)} · <time datetime="${p.date}">${formatDate(p.date)}</time>${
              p.updated && p.updated !== p.date ? ` · Updated <time datetime="${p.updated}">${formatDate(p.updated)}</time>` : ""
            }
          </p>
          ${p.image ? `<figure class="cs-figure reveal"><img src="${esc(relativeImage(p.image, base))}" alt="${esc(p.imageAlt)}" width="1200" height="630" decoding="async"></figure>` : ""}
        </div>
      </section>

      <section class="cs-body post-body section-padding">
        <div class="container cs-container">
          ${tocBlock}
          <div class="post-prose">
${html}
          </div>
          ${p.tags.length ? `<ul class="work-item-tags post-tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          <aside class="post-cta reveal">
            <span class="section-index">NEED A HAND?</span>
            <h2>Want us to look at your store?</h2>
            <p>Send us your store or website link and what you want to improve. We reply within one business day.</p>
            <a href="${base}contact?service=growth" class="btn btn-small btn-accent">Talk to us <span>↗</span></a>
          </aside>
        </div>
      </section>
    </article>

    ${
      related.length
        ? `<section class="post-related section-padding">
      <div class="container">
        <div class="section-index reveal">KEEP READING</div>
        <div class="work-grid post-related-grid">
${related.map((r) => postCard(r, base)).join("\n")}
        </div>
      </div>
    </section>`
        : ""
    }`;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: p.title,
        description: p.description,
        image,
        datePublished: p.date,
        dateModified: p.updated || p.date,
        inLanguage: "en",
        articleSection: p.category,
        ...(p.tags.length ? { keywords: p.tags.join(", ") } : {}),
        wordCount: p.body.split(/\s+/).filter(Boolean).length,
        author:
          p.author === "Avora Digital"
            ? { "@id": `${SITE}/#organization` }
            : { "@type": "Person", name: p.author },
        publisher: { "@id": `${SITE}/#organization` },
        isPartOf: { "@id": `${SITE}/blog#blog` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  };

  const head = [
    rssLink(base),
    `<meta property="article:published_time" content="${p.date}">`,
    p.updated ? `<meta property="article:modified_time" content="${p.updated}">` : "",
    `<meta property="article:section" content="${esc(p.category)}">`,
    jsonLd(ld),
  ]
    .filter(Boolean)
    .join("\n");

  return fillLayout(layout, {
    base,
    title: `${p.title} | Avora Digital`,
    description: p.description,
    canonical: url,
    ogImage: image,
    ogType: "article",
    head,
    main,
  });
}

function rssFeed(posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/${postUrl(p)}</link>
      <guid isPermaLink="true">${SITE}/${postUrl(p)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.description)}</description>
    </item>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Avora Digital Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Practical guides on Shopify, custom websites, speed and conversion.</description>
    <language>en</language>
    ${posts.length ? `<lastBuildDate>${rfc822(posts[0].updated || posts[0].date)}</lastBuildDate>` : ""}${items}
  </channel>
</rss>
`;
}

/* ---------------- homepage + sitemap ---------------- */

async function updateHomepage(posts) {
  const file = path.join(ROOT, "index.html");
  const html = await readFile(file, "utf8");
  const start = "<!-- BLOG:START -->";
  const end = "<!-- BLOG:END -->";
  if (!html.includes(start) || !html.includes(end)) {
    log("index.html has no BLOG:START/BLOG:END markers; homepage not updated.");
    return;
  }
  const picks = posts.slice(0, 3);
  const block = picks.length
    ? `${start}
    <section class="blog-home section-padding">

      <div class="container">

        <div class="section-top reveal">

          <div>

            <div class="section-index">
              09 / FROM THE BLOG
            </div>

            <h2>
              Notes on stores<br>
              <span>that sell.</span>
            </h2>

          </div>

          <a href="blog" class="btn btn-outline service-card-btn">
            Read the Blog
            <span>↗</span>
          </a>

        </div>

        <div class="work-grid work-grid-home">
${picks.map((p) => postCard(p)).join("\n")}
        </div>

      </div>

    </section>
    ${end}`
    : `${start}\n    ${end}`;
  const out = html.slice(0, html.indexOf(start)) + block + html.slice(html.indexOf(end) + end.length);
  await writeFile(file, out);
}

async function updateSitemap(posts) {
  const file = path.join(ROOT, "sitemap.xml");
  let xml = await readFile(file, "utf8");
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/avoradigital\.online\/blog(\/[^<]*)?<\/loc>[\s\S]*?<\/url>/g, "");
  xml = xml.replace(/\n{3,}<\/urlset>/, "\n\n</urlset>");
  const entry = (loc, lastmod, freq, priority) =>
    `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  const newest = posts.length ? posts.map((p) => p.updated || p.date).sort().pop() : todayIso();
  const entries =
    entry(`${SITE}/blog`, newest, "weekly", "0.8") +
    posts.map((p) => entry(`${SITE}/${postUrl(p)}`, p.updated || p.date, "monthly", "0.7")).join("");
  xml = xml.replace("</urlset>", `${entries}\n</urlset>`);
  await writeFile(file, xml);
}

/* ---------------- main ---------------- */

async function main() {
  const layout = await readFile(path.join(ROOT, "templates/layout.html"), "utf8");
  const posts = await loadPosts();

  // Fresh blog folder every build (deleted posts disappear cleanly)
  await mkdir(OUT_DIR, { recursive: true });
  for (const f of await readdir(OUT_DIR)) if (f.endsWith(".html")) await unlink(path.join(OUT_DIR, f));

  await writeFile(path.join(ROOT, "blog.html"), blogIndex(posts, layout));
  for (const p of posts) {
    const others = posts.filter((o) => o.slug !== p.slug);
    const sameCategory = others.filter((o) => o.category === p.category);
    const related = [...sameCategory, ...others.filter((o) => o.category !== p.category)];
    await writeFile(path.join(OUT_DIR, `${p.slug}.html`), postPage(p, related, layout));
  }
  await writeFile(path.join(ROOT, "feed.xml"), rssFeed(posts));
  await updateHomepage(posts);
  await updateSitemap(posts);

  log(`Built /blog and ${posts.length} post${posts.length === 1 ? "" : "s"}${posts.length ? `: ${posts.map((p) => p.slug).join(", ")}` : ""}`);
}

main().catch((err) => {
  console.error("[blog] Build failed:", err.message);
  process.exit(1);
});
