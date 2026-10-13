#!/usr/bin/env node
/* =========================================================
   AVORA DIGITAL — PORTFOLIO BUILDER
   ---------------------------------------------------------
   Runs on every Netlify build (see netlify.toml).

   1. Reads data/projects.manual.json (projects not hosted on
      this Netlify account, e.g. Fiscora).
   2. If NETLIFY_AUTH_TOKEN is set, lists every site on the
      Netlify account and keeps only the ones that publish a
      /portfolio.json file. No portfolio.json = not shown.
   3. Writes static HTML (good for Google and AI crawlers):
        work.html                  -> /work
        case-studies/<slug>.html   -> /case-studies/<slug>
        index.html                 -> "Selected work" cards
        sitemap.xml                -> work + case study URLs
   No npm packages needed (Node 18+).
   ========================================================= */

import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://avoradigital.online";
const TOKEN = process.env.NETLIFY_AUTH_TOKEN || "";
const OWN_SITE_ID = process.env.SITE_ID || "";
const FETCH_TIMEOUT = 8000;
const API = process.env.NETLIFY_API_URL || "https://api.netlify.com/api/v1"; // override only for local tests

const TYPE_LABEL = {
  client: "Client project",
  "in-house": "In-house product",
  concept: "Concept build",
};

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

const log = (...a) => console.log("[portfolio]", ...a);

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ---------------- Netlify ---------------- */

async function listNetlifySites() {
  const sites = [];
  for (let page = 1; page < 20; page++) {
    const res = await fetchWithTimeout(
      `${API}/sites?filter=all&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    if (!res.ok) throw new Error(`Netlify API responded ${res.status}`);
    const batch = await res.json();
    sites.push(...batch);
    if (batch.length < 100) break;
  }
  return sites;
}

async function readPortfolioJson(siteUrl) {
  try {
    const res = await fetchWithTimeout(`${siteUrl.replace(/\/$/, "")}/portfolio.json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return null; // SPA fallback returned HTML
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function readOgImage(siteUrl) {
  try {
    const res = await fetchWithTimeout(siteUrl);
    if (!res.ok) return "";
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? new URL(m[1], siteUrl).href : "";
  } catch {
    return "";
  }
}

async function projectsFromNetlify() {
  if (!TOKEN) {
    log("NETLIFY_AUTH_TOKEN not set: using data/projects.manual.json only.");
    return [];
  }
  // If the API fails we throw: the build fails and Netlify keeps the
  // previous (complete) deploy live instead of publishing an empty /work.
  const sites = await listNetlifySites();
  log(`Netlify account has ${sites.length} sites. Checking for portfolio.json…`);

  const results = await Promise.all(
    sites
      .filter((s) => s.id !== OWN_SITE_ID)
      .map(async (s) => {
        const siteUrl = s.ssl_url || s.url;
        if (!siteUrl) return null;
        const data = await readPortfolioJson(siteUrl);
        if (!data) return null;

        const image =
          (data.image && new URL(data.image, siteUrl).href) ||
          (await readOgImage(siteUrl)) ||
          s.screenshot_url ||
          "";

        return {
          ...data,
          slug: data.slug || s.name,
          liveUrl: data.liveUrl || siteUrl,
          image,
          deployedAt: s.published_deploy?.published_at || s.updated_at || s.created_at || "",
          source: "netlify",
        };
      })
  );

  const found = results.filter(Boolean);
  log(`${found.length} sites have portfolio.json.`);
  return found;
}

/* ---------------- validation ---------------- */

function normalise(p) {
  const problems = [];
  if (!p.title) problems.push("title");
  if (!p.summary) problems.push("summary");
  if (problems.length) {
    log(`Skipping "${p.slug || p.title || "unknown"}": missing ${problems.join(", ")}`);
    return null;
  }
  const type = TYPE_LABEL[p.type] ? p.type : "concept";
  if (!TYPE_LABEL[p.type]) log(`"${p.title}" has no valid "type": labelled as Concept build.`);
  const cs = p.caseStudy || {};
  return {
    slug: slugify(p.slug || p.title),
    title: p.title,
    type,
    category: p.category || "Website",
    year: p.year || (p.deployedAt ? String(new Date(p.deployedAt).getFullYear()) : ""),
    deployedAt: p.deployedAt || "",
    summary: p.summary,
    liveUrl: p.liveUrl || "",
    image: p.image || "",
    imageAlt: p.imageAlt || `${p.title} preview`,
    featured: Boolean(p.featured),
    order: Number.isFinite(Number(p.order)) ? Number(p.order) : 999,
    role: Array.isArray(p.role) ? p.role : [],
    stack: Array.isArray(p.stack) ? p.stack : [],
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    client: p.client || "",
    caseStudy: {
      overview: cs.overview || "",
      challenge: cs.challenge || "",
      solution: cs.solution || "",
      features: Array.isArray(cs.features) ? cs.features : [],
      results: Array.isArray(cs.results) ? cs.results : [],
      status: cs.status || "",
    },
  };
}

/* ---------------- rendering ---------------- */

const caseUrl = (p, base = "") => `${base}case-studies/${p.slug}`;

function media(p, href) {
  const inner = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" width="1200" height="630" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'work-item-fallback',textContent:'${esc(p.title.charAt(0)).replace(/'/g, "")}'}))">`
    : `<span class="work-item-fallback" aria-hidden="true">${esc(p.title.charAt(0))}</span>`;
  return `<a class="work-item-media" href="${href}" tabindex="-1" aria-hidden="true">${inner}</a>`;
}

function metaLine(p) {
  const when = p.deployedAt ? `Deployed ${formatDate(p.deployedAt)}` : p.year;
  return [p.category, when].filter(Boolean).map(esc).join(" · ");
}

function card(p, base = "") {
  const href = caseUrl(p, base);
  const tags = (p.highlights.length ? p.highlights : p.stack).slice(0, 4);
  return `
          <article class="work-item reveal" data-category="${esc(slugify(p.category))}">
            ${media(p, href)}
            <div class="work-item-body">
              <div class="work-item-meta">
                <span class="work-item-type work-type-${p.type}">${esc(TYPE_LABEL[p.type])}</span>
                <span>${metaLine(p)}</span>
              </div>
              <h3><a href="${href}">${esc(p.title)}</a></h3>
              <p>${esc(p.summary)}</p>
              ${tags.length ? `<ul class="work-item-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
              <div class="work-item-actions">
                <a href="${href}" class="btn btn-small btn-accent">Case study <span>↗</span></a>
                ${p.liveUrl ? `<a href="${esc(p.liveUrl)}" class="btn btn-small btn-outline" target="_blank" rel="noopener noreferrer">${p.type === "concept" ? "Live demo" : "Live site"} <span>↗</span></a>` : ""}
              </div>
            </div>
          </article>`;
}

const askCard = (base = "") => `
          <article class="work-item work-item-ask reveal">
            <div class="work-item-body">
              <span class="section-index">YOUR INDUSTRY</span>
              <h3>Want an example closer to your business?</h3>
              <p>Tell us what you are building and we will share the most relevant projects from our portfolio.</p>
              <div class="work-item-actions">
                <a href="${base}contact?intent=portfolio" class="btn btn-small btn-accent">Ask for examples <span>↗</span></a>
              </div>
            </div>
          </article>`;

function jsonLd(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, "\\u003c")}\n</script>`;
}

function fillLayout(layout, { base, title, description, canonical, ogImage, jsonld, main }) {
  return layout
    .replaceAll("{{BASE}}", base)
    .replaceAll("{{TITLE}}", esc(title))
    .replaceAll("{{DESCRIPTION}}", esc(description))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{OG_IMAGE}}", esc(ogImage))
    .replace("{{JSONLD}}", jsonld)
    .replace("{{MAIN}}", main);
}

function workPage(projects, layout) {
  const categories = [...new Set(projects.map((p) => p.category))];
  const filters =
    categories.length > 1
      ? `<div class="work-filters reveal" role="group" aria-label="Filter projects">
          <button type="button" class="work-filter active" data-work-filter="all" aria-pressed="true">All</button>
          ${categories
            .map((c) => `<button type="button" class="work-filter" data-work-filter="${esc(slugify(c))}" aria-pressed="false">${esc(c)}</button>`)
            .join("\n          ")}
        </div>`
      : "";

  const main = `
    <section class="work-hero section-padding">
      <div class="container">
        <div class="section-index reveal">WORK</div>
        <h1 class="reveal">Work that <span>ships.</span></h1>
        <p class="work-hero-lead reveal">
          Websites, Shopify stores and software we have designed and built. Every project
          is labelled honestly: client work, our own products, or concept builds.
        </p>
        ${filters}
      </div>
    </section>

    <section class="work-list section-padding">
      <div class="container">
        <div class="work-grid" data-work-grid>
${projects.map((p) => card(p)).join("\n")}
${askCard()}
        </div>
      </div>
    </section>`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE}/work#webpage`,
    url: `${SITE}/work`,
    name: "Work | Avora Digital",
    isPartOf: { "@id": `${SITE}/#website` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/${caseUrl(p)}`,
        name: p.title,
      })),
    },
  };

  return fillLayout(layout, {
    base: "",
    title: "Work: Websites, Shopify Stores & Software | Avora Digital",
    description:
      "Websites, Shopify stores and software designed and built by Avora Digital, with full case studies and live links.",
    canonical: `${SITE}/work`,
    ogImage: `${SITE}/assets/og-default.jpg`,
    jsonld: jsonLd(ld),
    main,
  });
}

function section(title, body) {
  if (!body) return "";
  return `
        <div class="cs-block reveal">
          <h2>${esc(title)}</h2>
          ${body}
        </div>`;
}

const para = (t) => (t ? `<p>${esc(t)}</p>` : "");
const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");

function caseStudyPage(p, next, layout) {
  const base = "../";
  const cs = p.caseStudy;
  const facts = [
    ["Type", TYPE_LABEL[p.type]],
    p.client && ["Client", p.client],
    ["Category", p.category],
    [p.deployedAt ? "Deployed" : "Year", p.deployedAt ? formatDate(p.deployedAt) : p.year],
    p.role.length && ["Our role", p.role.join(", ")],
    p.stack.length && ["Stack", p.stack.join(", ")],
  ].filter((f) => f && f[1]);

  const main = `
    <section class="cs-hero">
      <div class="container">
        <nav class="cs-breadcrumb reveal" aria-label="Breadcrumb">
          <a href="${base}work">Work</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.title)}</span>
        </nav>
        <div class="section-index reveal">${esc(TYPE_LABEL[p.type].toUpperCase())} · ${esc(p.category.toUpperCase())}</div>
        <h1 class="reveal">${esc(p.title)}</h1>
        <p class="cs-lead reveal">${esc(p.summary)}</p>

        <dl class="cs-facts reveal">
          ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n          ")}
        </dl>

        <div class="cs-actions reveal">
          ${p.liveUrl ? `<a href="${esc(p.liveUrl)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${p.type === "concept" ? "View live demo" : "Visit live site"} <span>↗</span></a>` : ""}
          <a href="${base}contact?intent=portfolio" class="btn btn-outline">Start a similar project <span>↗</span></a>
        </div>

        ${p.image ? `<figure class="cs-figure reveal"><img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" width="1200" height="630" decoding="async" onerror="this.closest('figure').remove()"></figure>` : ""}
      </div>
    </section>

    <section class="cs-body section-padding">
      <div class="container cs-container">
        ${p.type === "concept" ? `<p class="cs-note reveal">This is a concept build: a complete, working site we designed and developed to show what we can do in this industry. It was not commissioned by a real client.</p>` : ""}
        ${section("Overview", para(cs.overview))}
        ${section("The challenge", para(cs.challenge))}
        ${section("What we built", para(cs.solution) + list(cs.features))}
        ${section("Results", list(cs.results))}
        ${section("Status", para(cs.status))}
      </div>
    </section>

    ${
      next && next.slug !== p.slug
        ? `<section class="cs-next">
      <div class="container">
        <a class="cs-next-link reveal" href="${base}${caseUrl(next)}">
          <span class="section-index">NEXT PROJECT</span>
          <strong>${esc(next.title)} <span>↗</span></strong>
        </a>
      </div>
    </section>`
        : ""
    }

    <section class="final-cta section-padding">
      <div class="container">
        <div class="cta-box reveal">
          <div class="cta-decoration"></div>
          <div class="section-index">READY WHEN YOU ARE</div>
          <h2>Have a project<br><span>in mind?</span></h2>
          <p>Tell us what you're building. We'll figure out the right way to move it forward.</p>
          <a href="${base}contact" class="btn btn-dark magnetic">Start a Project <span>↗</span></a>
        </div>
      </div>
    </section>`;

  const url = `${SITE}/${caseUrl(p)}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${p.title} case study | Avora Digital`,
        description: p.summary,
        isPartOf: { "@id": `${SITE}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#project` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Work", item: `${SITE}/work` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
      {
        "@type": "CreativeWork",
        "@id": `${url}#project`,
        name: p.title,
        description: p.summary,
        ...(p.liveUrl ? { url: p.liveUrl } : {}),
        ...(p.image ? { image: p.image } : {}),
        ...(p.year ? { dateCreated: p.year } : {}),
        genre: p.category,
        creator: { "@id": `${SITE}/#organization` },
        ...(p.stack.length ? { keywords: p.stack.join(", ") } : {}),
      },
    ],
  };

  return fillLayout(layout, {
    base,
    title: `${p.title} Case Study: ${p.category} | Avora Digital`,
    description: p.summary,
    canonical: url,
    ogImage: p.image || `${SITE}/assets/og-default.jpg`,
    jsonld: jsonLd(ld),
    main,
  });
}

/* ---------------- homepage + sitemap ---------------- */

async function updateHomepage(projects) {
  const file = path.join(ROOT, "index.html");
  const html = await readFile(file, "utf8");
  const start = "<!-- WORK:START -->";
  const end = "<!-- WORK:END -->";
  if (!html.includes(start) || !html.includes(end)) {
    log("index.html has no WORK:START/WORK:END markers; homepage not updated.");
    return;
  }
  const picks = projects.slice(0, 3);
  const cards = picks.map((p) => card(p)).join("\n") + (picks.length < 3 ? askCard() : "");
  const block = `${start}\n        <div class="work-grid work-grid-home">\n${cards}\n        </div>\n        ${end}`;
  const out = html.slice(0, html.indexOf(start)) + block + html.slice(html.indexOf(end) + end.length);
  await writeFile(file, out);
}

async function updateSitemap(projects) {
  const file = path.join(ROOT, "sitemap.xml");
  let xml = await readFile(file, "utf8");
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/avoradigital\.online\/(work|case-studies\/[^<]*)<\/loc>[\s\S]*?<\/url>/g, "");
  const today = new Date().toISOString().slice(0, 10);
  const entry = (loc, lastmod, priority) =>
    `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  const entries =
    entry(`${SITE}/work`, today, "0.8") +
    projects
      .map((p) => entry(`${SITE}/${caseUrl(p)}`, (p.deployedAt || today).slice(0, 10), "0.6"))
      .join("");
  xml = xml.replace("</urlset>", `${entries}\n</urlset>`);
  await writeFile(file, xml);
}

/* ---------------- main ---------------- */

async function main() {
  const layout = await readFile(path.join(ROOT, "templates/layout.html"), "utf8");
  const manualFile = path.join(ROOT, "data/projects.manual.json");
  const manual = existsSync(manualFile) ? JSON.parse(await readFile(manualFile, "utf8")) : [];
  const remote = await projectsFromNetlify();

  const bySlug = new Map();
  for (const p of [...remote, ...manual].map(normalise).filter(Boolean)) {
    if (bySlug.has(p.slug)) log(`Duplicate slug "${p.slug}": keeping the manual entry.`);
    bySlug.set(p.slug, p);
  }

  const projects = [...bySlug.values()].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      a.order - b.order ||
      String(b.deployedAt || b.year).localeCompare(String(a.deployedAt || a.year))
  );

  // Fresh case-studies folder every build (old projects disappear cleanly)
  const csDir = path.join(ROOT, "case-studies");
  await mkdir(csDir, { recursive: true });
  for (const f of await readdir(csDir)) if (f.endsWith(".html")) await unlink(path.join(csDir, f));

  await writeFile(path.join(ROOT, "work.html"), workPage(projects, layout));
  for (const [i, p] of projects.entries()) {
    const next = projects[(i + 1) % projects.length];
    await writeFile(path.join(csDir, `${p.slug}.html`), caseStudyPage(p, next, layout));
  }
  await updateHomepage(projects);
  await updateSitemap(projects);
  await writeFile(path.join(ROOT, "data/projects.generated.json"), JSON.stringify(projects, null, 2));

  log(`Built /work and ${projects.length} case stud${projects.length === 1 ? "y" : "ies"}: ${projects.map((p) => p.slug).join(", ")}`);
}

main().catch((err) => {
  console.error("[portfolio] Build failed:", err.message);
  process.exit(1);
});
