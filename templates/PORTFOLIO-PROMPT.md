# Portfolio site prep: reusable prompt

**Kaise use karein:** har project ke liye neeche wala poora prompt copy karein. Pehle `INPUTS` wala hissa bharein (sirf wahi jo aapko pata hai, baqi `unknown` likh dein). Phir project ki zip ya folder ke saath Claude (ya kisi bhi coding AI) ko dein. Wapas aane wali zip Netlify par deploy karein.

Prompt ke neeche reference hai: kaun si file zaroori hai, aur har framework mein zip ka structure kya hona chahiye.

---

## THE PROMPT (copy from here)

```
You are preparing one of my finished websites to be published as a portfolio
project for my agency, Avora Digital (https://avoradigital.online).

My agency site automatically lists every Netlify site that contains a
/portfolio.json file and builds a case study page for it at:
https://avoradigital.online/case-studies/<slug>

Your job is to add the portfolio files and settings below WITHOUT changing the
site's design, content or functionality, and hand me back a clean, deployable
project.

==================== INPUTS (I fill these in) ====================
Project name:            
Slug (kebab-case, unique): 
Type:                    client | in-house | concept
  - client   = real paying client. Client approved showing it publicly: yes / no
  - in-house = my own product
  - concept  = demo/sample built to show skills, not commissioned by anyone
Client name (client type only, only if approved): 
Category:                Website | Shopify | Web App | Software | Landing Page
Industry / audience:     
Framework:               HTML/CSS/JS | React (Vite) | React (CRA) | Next.js | other: ___
Year built:              
Live URL (if any):       
Will it be deployed on:  its own client domain | a Netlify subdomain as a demo
What I built (my notes): 
Real results (numbers I can prove, or "none"): 
Anything else:           
==================================================================

------------------------------------------------------------------
STEP 1: Inspect before changing anything
------------------------------------------------------------------
- Detect the framework from the files (package.json, next.config.*, vite.config.*,
  or plain index.html). If it contradicts my INPUTS, tell me and follow the files.
- Find the public/static folder: plain HTML -> project root; Vite/CRA/Next.js ->
  public/. Files there are served from the site root (/portfolio.json, /og.jpg).
- Run the build (npm install && npm run build, or just open index.html) and note
  any errors that already exist. Do not "fix" the design. Report broken things
  separately at the end.

------------------------------------------------------------------
STEP 2: Create /portfolio.json (REQUIRED)
------------------------------------------------------------------
Place it in the public/static folder from Step 1. Use exactly this schema:

{
  "slug": "",            // from INPUTS, kebab-case
  "title": "",           // project name
  "type": "",            // client | in-house | concept (exactly one of these)
  "category": "",        // from INPUTS
  "year": "",            // "2026"
  "summary": "",         // ONE sentence, max 160 characters, what it is + why it is good
  "client": "",          // only if type=client AND approved, else ""
  "liveUrl": "",         // leave "" if it will live on the Netlify demo URL
  "image": "/og.jpg",
  "imageAlt": "",        // e.g. "Olive Café homepage on desktop"
  "featured": false,
  "order": 10,
  "role": [],            // what Avora did: "Design", "Development", "Shopify setup", "SEO"...
  "stack": [],           // real technologies found in the code, e.g. "Next.js", "Tailwind CSS"
  "highlights": [],      // max 4, 1-3 words each, e.g. "3D hero", "Online booking"
  "caseStudy": {
    "overview": "",      // 2-3 sentences: what the project is and who it is for
    "challenge": "",     // the problem; for concept builds, the common problem in that industry
    "solution": "",      // 2-4 sentences: what was built and key decisions
    "features": [],      // 4-8 concrete features you can SEE in the code/site
    "results": [],       // ONLY numbers from my INPUTS "Real results". Otherwise []
    "status": ""         // "Live", "Concept build", or "In development"
  }
}

Honesty rules (do not break these):
- Never invent results, metrics, client names, testimonials, traffic or revenue.
  If I gave none, "results" stays [].
- "stack" and "features" must come from what actually exists in the code.
- If type=client but approval is "no", set type to "concept", client to "",
  and remove anything that identifies the real client (name, logo, phone, address)
  from portfolio.json. Tell me the site itself still contains their brand.
- Write in clear, plain English a business owner understands. No buzzwords like
  "cutting-edge", "seamless", "revolutionary".
- Must be valid JSON (no comments). Validate it before finishing.

------------------------------------------------------------------
STEP 3: Social preview image /og.jpg (REQUIRED)
------------------------------------------------------------------
- 1200x630 px, JPG, under 200 KB, saved as og.jpg in the public/static folder.
- Prefer a REAL screenshot of the site's hero/home section at 1200x630
  (e.g. with Playwright at viewport 1200x630, after fonts and animations load).
  A real screenshot is more honest and more useful to clients than generated art.
- If you cannot take a screenshot, tell me, and I will add og.jpg myself.
- Add (or update) these tags in the <head> of the home page (and the site's
  shared layout if there is one), with absolute URLs once the URL is known:
    <meta property="og:title" content="...">
    <meta property="og:description" content="...">
    <meta property="og:image" content="/og.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
  Next.js App Router: use the `metadata` export in app/layout (openGraph.images)
  with `metadataBase`, not raw tags.

------------------------------------------------------------------
STEP 4: netlify.toml (REQUIRED)
------------------------------------------------------------------
Create or update netlify.toml in the project root (not in public/):

- Plain HTML:      [build] publish = "."
- React (Vite):    [build] command = "npm run build", publish = "dist"
- React (CRA):     [build] command = "npm run build", publish = "build"
- Next.js:         [build] command = "npm run build" (let Netlify's Next.js
                   runtime handle the rest; do not set publish unless needed)
- Single-page React apps also need the SPA fallback:
      [[redirects]]
        from = "/*"
        to = "/index.html"
        status = 200
  (Real files like /portfolio.json are still served because Netlify serves
  existing files before applying this rule. Do not add force = true.)

ONLY if the site will be deployed as a demo on a Netlify subdomain
(type concept, or a client site copy that is not the client's real domain),
add noindex so Google does not index demo copies:

    [[headers]]
      for = "/*"
      [headers.values]
        X-Robots-Tag = "noindex"

Do NOT add noindex to a client's real production site on their own domain.
Do NOT block the site in robots.txt (Disallow stops Google from seeing noindex).

------------------------------------------------------------------
STEP 5: Case study button in the navigation
------------------------------------------------------------------
ONLY for demo deployments (concept builds, in-house products, or demo copies).
NEVER add Avora branding to a real client's production site.

Add one item at the end of the main navigation (desktop AND mobile menu),
matching the existing nav style exactly:

  Label:  Case study ↗
  Link:   https://avoradigital.online/case-studies/<slug>
  Attrs:  target="_blank" rel="noopener"

It must not break the layout at 390px, 768px and 1440px widths. If the nav has
no room, put it in the footer instead and tell me.

------------------------------------------------------------------
STEP 6: Make the demo safe to publish
------------------------------------------------------------------
- Remove secrets: .env files, API keys, tokens, passwords, private emails.
  Create .env.example listing variable NAMES only (no values) if the app needs them.
- Contact/booking/order forms on a DEMO must not email or charge real people:
  point them to a harmless endpoint or show a "Demo only, form disabled" message.
- Remove real customer data, real phone numbers and real addresses that do not
  belong to me or an approved client. Replace with obvious placeholders.
- Remove leftover lorem ipsum, "TODO", console.log noise and dead links you find.
  Report what you removed.

------------------------------------------------------------------
STEP 7: Check your work
------------------------------------------------------------------
- Build succeeds with no new errors or warnings you introduced.
- /portfolio.json and /og.jpg are present in the BUILD OUTPUT folder
  (dist/, build/, out/ or root), not only in the source.
- portfolio.json is valid JSON and uses only the allowed "type" values.
- No horizontal scroll at 390px. No new console errors.
- The case study link (if added) points to the correct slug.

------------------------------------------------------------------
STEP 8: Deliver
------------------------------------------------------------------
Return:
1. A zip named <slug>.zip using the structure for this framework, WITHOUT
   node_modules/, .next/, dist/, build/, .git/, .env, .DS_Store.
2. The final portfolio.json printed in full.
3. A short list of every file you created or changed.
4. A "Needs your input" list: anything unknown (results, approval, missing
   og.jpg) and any existing bugs you found but did not fix.
```

---

## Reference: kaun si file zaroori hai

| File | Zaroori? | Kahan | Kaam |
|---|---|---|---|
| `portfolio.json` | **Haan** | HTML: root · React/Next: `public/` | Is ke baghair site Avora ki Work page par aayegi hi nahi |
| `og.jpg` (1200×630) | **Haan** | `portfolio.json` ke saath | Work card aur case study ki image, aur social share preview |
| `netlify.toml` | **Haan** | Project root | Build command, publish folder, demo ke liye noindex |
| Nav mein "Case study" link | Sirf demo/concept | Site ka nav | Client ko wapas Avora case study par lata hai |
| `.env.example` | Agar app env vars use karti hai | Root | Secrets ke baghair batata hai ke kaunse variables chahiye |
| Webhook (Netlify settings) | Behtar hai | Netlify dashboard, file nahi | Deploy hote hi Avora ki site update ho jati hai |

## Reference: zip / folder structure

**Plain HTML/CSS/JS**
```
olive-cafe/
├── index.html            (og tags head mein)
├── css/
├── js/
├── assets/
├── og.jpg                ← zaroori
├── portfolio.json        ← zaroori
└── netlify.toml          ← zaroori
```

**React (Vite)** (CRA mein `dist` ki jagah `build`)
```
lumen-store/
├── package.json
├── package-lock.json     (lockfile zaroor, warna Netlify par versions badal sakte hain)
├── vite.config.js
├── index.html            (og tags head mein)
├── src/
├── public/
│   ├── og.jpg            ← zaroori
│   └── portfolio.json    ← zaroori
├── netlify.toml          ← zaroori (SPA redirect ke saath)
└── .env.example          (agar zaroorat ho)
```

**Next.js**
```
peony/
├── package.json
├── package-lock.json
├── next.config.js
├── app/   (ya pages/)    (og tags: app/layout ka metadata export)
├── public/
│   ├── og.jpg            ← zaroori
│   └── portfolio.json    ← zaroori
├── netlify.toml          ← zaroori
└── .env.example          (agar zaroorat ho)
```

**Zip mein kabhi na dalein:** `node_modules/`, `.next/`, `dist/`, `build/`, `.git/`, `.env`, `.DS_Store`. Netlify ye sab khud banata hai. `.env` mein secrets hote hain.

## Softwares (backend wale apps) ke liye alag baat

Netlify sirf frontend aur halki serverless functions ke liye hai. Agar software ko database ya alag server chahiye (Laravel, Django, Express + MongoDB waghera):
- Frontend Netlify par aur backend kisi aur jagah (Render, Railway, VPS), ya
- Demo mode: fake data ke saath sirf frontend, aur saaf "Demo data" label.

Case study mein demo login dena hai to sirf **demo account** dein jiska data har din reset ho. Apne asal admin ka password kabhi nahi.
