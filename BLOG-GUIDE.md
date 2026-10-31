# Blog Guide (Avora Digital)

Blog ka har article ek `.md` (Markdown) file hai jo `content/blog/` folder mein rehti hai. Aap file add karke GitHub par push karte hain, aur Netlify khud ye cheezen bana deta hai:

- `/blog` (saare articles ki list)
- `/blog/<slug>` (har article ka page)
- Homepage par "From the blog" section (latest 3 articles)
- `sitemap.xml` mein blog URLs
- `/feed.xml` (RSS feed)

`blog.html`, `blog/` folder aur `feed.xml` ko haath se edit **na karein**. Har build par ye dobara bante hain.

## Naya article kaise likhein

1. `content/blog/_TEMPLATE.md` ko copy karein.
2. Naye naam se save karein, jaise `shopify-speed-tips.md`. Yehi naam URL ban jayega: `/blog/shopify-speed-tips`. Sirf chhote English letters, numbers aur `-` use karein.
3. Upar wala `---` block (front matter) bharein:

| Field | Zaroori? | Kya likhna hai |
|---|---|---|
| `title` | Haan | Article ka title |
| `description` | Haan | 1 se 2 lines ka summary. Google isay title ke neeche dikhata hai (140 se 160 characters behtar) |
| `date` | Haan | Publish date, isi format mein: `2026-11-15` |
| `category` | Nahi | Jaise `Shopify`, `Selling abroad`, `Speed`. Blog page par filter ban jata hai |
| `tags` | Nahi | Comma se alag: `Shopify, Conversion` |
| `image` | Nahi | Cover image ka path, jaise `assets/blog/shopify-speed-tips.jpg` (size 1200 x 630) |
| `imageAlt` | Nahi | Image ki short description |
| `updated` | Nahi | Agar baad mein article update karein to nayi date |
| `draft` | Nahi | `true` ho to article publish nahi hoga |

4. `---` ke neeche article likhein (formatting neeche dekhein).
5. Template mein `draft: true` laga hota hai. Publish karne ke liye isay **hata dein** ya `false` kar dein.
6. Push karein. 1 se 2 minute mein article live.

**Scheduled post:** agar `date` future ki hai to article us din ke baad wale pehle build par khud live hoga. Netlify har push par build karta hai, is liye us din koi bhi chhoti change push kar dein ya Netlify mein "Trigger deploy" dabayein.

## Formatting

```
## Bara heading
### Chhota heading

Normal paragraph. **Bold**, *italic*, [link](https://example.com)

- Bullet point
- Bullet point

1. Numbered step
2. Numbered step

> Quote ya key takeaway

![Image description](assets/blog/image.jpg)

---  (divider line)
```

- Article ke andar `#` (single) heading na lagayein. Title khud H1 ban jata hai. `##` se shuru karein.
- 3 ya zyada `##` headings hon to "In this article" list khud ban jati hai.
- HTML code likhenge to wo text ki tarah dikhega, chalega nahi (security ke liye).
- Apni site ke links aise likhein: `[pricing dekhein](/pricing)`.

## Images

- Cover aur article ki images `assets/blog/` mein rakhein.
- Cover size: **1200 x 630**, JPG, 300 KB se kam.
- Cover na ho to card par article ke pehle letter wala box dikhta hai aur share karne par `og-blog.jpg` use hoti hai.

## Achha article: checklist

- Ek sawal ka seedha jawab do. Title mein wohi words jo log Google par likhte hain.
- Sirf wohi likho jo sach hai aur check kiya hua hai. Koi numbers, client results ya reviews invent mat karo.
- Har article ke end mein reader ke liye ek agla qadam ho.
- Doosre articles aur services pages ko link karo.
- Publish ke baad Google Search Console mein URL Inspection se "Request indexing" karo.

## Local test (optional)

Node 18+ install ho to project folder mein:

```
node scripts/build-work.mjs && node scripts/build-blog.mjs
```

Terminal batayega kitne posts bane, aur koi file skip hui to kyun.
