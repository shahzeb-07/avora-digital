# Avora Digital — deploy guide (Vercel)

## Folder structure (ye poora folder hi deploy hota hai)

```
index.html  about.html  services.html  pricing.html  contact.html
css/style.css
js/script.js
assets/...            <- apni images + favicon folder isi naam se rakhein
robots.txt  sitemap.xml  vercel.json
```

## Vercel par deploy

1. Is folder ko GitHub repo mein push karein (ya Vercel par folder drag-drop karein).
2. Vercel > New Project > repo import karein.
3. Framework Preset: **Other**. Build Command: khaali. Output Directory: khaali (root).
4. Deploy. Phir Settings > Domains mein `avoradigital.online` add karein.

`vercel.json` mein `cleanUrls: true` hai, is liye pages `/about`, `/services` par
bhi khulen ge aur `/about.html` khud usi par redirect ho jayega. Script dono
tarah ke URLs ko samajhta hai.

## Kaam karne se pehle 2 cheezein (zaroori)

1. **Google Analytics** — har page ke `<head>` mein GA4 code laga hua hai.
   `G-XXXXXXXXXX` ki jagah apni asli Measurement ID daal dein
   (Google Analytics > Admin > Data streams). 5 files mein ye ID hai.
2. **Contact form** — form `hello@avoradigital.online` par email bhejta hai
   (FormSubmit service). Live hone ke baad **pehli** submission par us inbox
   mein FormSubmit ka activation email aayega — usko ek dafa confirm karein.
   Uske baad har request seedhi inbox mein aayegi. Agar service kabhi fail ho,
   form khud ek prefilled email draft khol deta hai taake lead zaya na ho.

## Google Search Console

1. Search Console mein `https://avoradigital.online/` property add karein.
2. Verification meta tag mile to usay har page ke `<head>` mein (ya kam az kam
   `index.html` mein) paste karein.
3. Sitemaps section mein `sitemap.xml` submit karein.

## WhatsApp

WhatsApp buttons, contact card, form ka WhatsApp field aur WhatsApp FAQ sab
HTML mein comment kiye gaye hain — code delete nahi hua. Activate karne ke liye
us block ke upar wala `<!-- WHATSAPP DISABLED ... ` aur neeche wala `-->`
hata dein. Form ka JS pehle se tayyar hai: field wapas aane par WhatsApp number
email mein "Phone / WhatsApp" ban kar chala jayega.
