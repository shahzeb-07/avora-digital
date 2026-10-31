# Portfolio system — setup guide

`/work` page aur `/case-studies/<slug>` pages har Netlify build par khud bante hain.
Script: `scripts/build-work.mjs`. Sirf wohi sites dikhti hain jin mein `portfolio.json` ho.

## Ek dafa ka setup (Avora site par)

1. **Netlify token banayein**
   Netlify > User settings > Applications > Personal access tokens > New access token.
   Token copy karein. Ye kisi ko na dikhayein, GitHub par commit na karein.

2. **Token Avora site mein dalein**
   Netlify > avoradigital.online site > Site configuration > Environment variables > Add variable
   - Key: `NETLIFY_AUTH_TOKEN`
   - Value: upar wala token
   - Scope: Builds

3. **Build hook banayein**
   Avora site > Site configuration > Build & deploy > Build hooks > Add build hook
   (naam: "portfolio"). URL copy karein.

4. **Auto rebuild (do mein se ek ya dono)**
   - **Foran (behtar):** har portfolio site > Site configuration > Notifications >
     Deploy notifications > Add notification > Outgoing webhook >
     Event: "Deploy succeeded" > URL: step 3 wala build hook.
   - **Rozana (backup):** GitHub repo > Settings > Secrets and variables > Actions >
     New secret `NETLIFY_BUILD_HOOK` = step 3 wala URL. `.github/workflows/rebuild-portfolio.yml`
     roz subah 8:15 baje Avora site rebuild karega.

## Har portfolio site ke liye

**Shortcut:** `templates/PORTFOLIO-PROMPT.md` ka prompt AI ko project ke saath dein. Wo neeche wale saare steps khud kar deta hai.

1. `templates/portfolio.json` copy karein aur site ki root mein rakhein:
   - **HTML site:** `index.html` ke saath
   - **React (Vite / CRA) aur Next.js:** `public/portfolio.json`
2. Fields bharein. Zaroori: `title`, `summary`, `type`.
3. **`type` imandari se:**
   - `client`: asal client ka kaam. **Sirf client ki ijazat ke saath.** `client` field mein naam.
   - `in-house`: aapka apna product (jaise Fiscora).
   - `concept`: demo/sample site jo kisi asal client ne nahi mangwayi. Case study par khud
     ek note lag jata hai ke ye concept build hai.
4. **Image:** site ki apni OG image khud utha li jati hai. Behtar image chahiye to
   1200x630 ki `og.jpg` site mein rakhein aur `"image": "/og.jpg"` likhein.
5. Deploy karein. Webhook laga hai to 2-3 minute mein `/work` par aa jayegi.

## Case study ka button har site par (bina code change)

`templates/portfolio-badge.html` ka code har portfolio site mein lagayein:
Site configuration > Build & deploy > Post processing > Snippet injection > "Before </body>".
Site ke neeche "View case study · Avora Digital" ka button aa jayega.

## Demo sites ko Google se door rakhein

Concept/demo sites Google mein index na hon (warna duplicate aur adhoori sites rank hongi).
Har demo site ki `netlify.toml` mein:

```
[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex"
```

Case study pages Avora par index hote hain. SEO ka faida wahan milta hai.

## Netlify par nahi hai? (jaise Fiscora)

`data/projects.manual.json` mein entry likhein. Same fields.

## Kuch ghalat ho to

- Netlify > Avora site > Deploys > latest deploy ka log dekhein. `[portfolio]` wali lines batati hain
  kaun si site mili, kaun si skip hui aur kyun.
- Netlify API fail ho to build fail hota hai aur purana deploy live rehta hai (khaali `/work` publish nahi hota).
- Build credits: har rebuild Netlify ke build minutes/credits leta hai. Usage page par nazar rakhein.
