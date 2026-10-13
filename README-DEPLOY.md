# Avora Digital — deploy guide (Netlify)

Site GitHub repo se Netlify par deploy hoti hai. `netlify.toml` mein publish folder root (`.`) hai, build command ki zaroorat nahi.

## Folder structure

```
index.html  about.html  services.html  pricing.html  contact.html
privacy.html  terms.html  404.html
css/style.css
js/script.js
assets/            <- OG images (1200x630 JPG) + logo.png
assets/favicon/    <- favicons (asal sizes: 16, 32, 48, 180, 512)
favicon.ico
robots.txt  sitemap.xml  netlify.toml  _redirects
```

## Rules

- CSS/JS/images ke paths relative hain (`css/style.css`), is liye site computer par file khol kar bhi chalti hai aur Netlify par bhi.
- OG images: 1200x630, JPG, ~200KB se kam. Naam: og-home, og-about, og-services, og-pricing, og-contact, og-default.
- Kisi page mein badlaav karein to `sitemap.xml` mein us page ki `<lastmod>` date update karein.
- Contact form FormSubmit se `hello@avoradigital.online` par jata hai. Pehli submission par activation email confirm karna zaroori hai.

## WhatsApp

WhatsApp buttons HTML mein comment kiye hue hain (`WHATSAPP DISABLED`). Activate karne ke liye us block ke upar wala `<!-- WHATSAPP DISABLED ...` aur neeche wala `-->` hata dein.
