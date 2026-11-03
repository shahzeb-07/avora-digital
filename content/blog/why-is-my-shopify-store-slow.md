---
title: Why is my Shopify store slow? How to test it and what to fix first
description: How to check your Shopify store's speed with free tools, what LCP, INP and CLS mean, the six things that slow most stores down, and the order to fix them in.
date: 2026-11-03
category: Speed
tags: Shopify, Speed, Core Web Vitals, Conversion
image: assets/blog/why-is-my-shopify-store-slow.jpg
imageAlt: Why is my Shopify store slow, a guide by Avora Digital
---

Shopify's servers are fast. When a Shopify store feels slow, the cause is almost always something that was added to it: apps, images, sliders, scripts and years of theme edits.

That is good news, because it means most speed problems can be found and fixed without moving platforms or rebuilding the store. Here is how to test your store properly, what the numbers mean, and where to start.

## First, measure the right thing

Two free tools tell you most of what you need.

**1. Shopify's own web performance report.** In your Shopify admin, open **Online Store** to see a summary, or go to **Analytics > Reports** and search for the web performance reports. These numbers come from your real visitors over the past 30 days, on their real phones and connections. That makes them the most honest picture of how your store feels. A new store, or one with very little traffic, may not have enough data yet. ([Shopify Help Center](https://help.shopify.com/en/manual/online-store/web-performance/web-performance-reports))

**2. Google PageSpeed Insights** at [pagespeed.web.dev](https://pagespeed.web.dev). Paste a link and look at the **Mobile** tab. If your store has enough traffic, the top section shows real-user data from Chrome. The lower section is a one-off lab test with a score out of 100, which is useful for finding causes.

Two habits make these tests far more useful:

- **Test a product page, not just the homepage.** Most shoppers from ads and search land on product pages, and those are usually heavier.
- **Run the test two or three times.** Lab results move around from run to run. Look for patterns, not one number.

## What the numbers mean

Google measures three things, called Core Web Vitals. These are the thresholds Google calls good ([web.dev](https://web.dev/articles/vitals)):

- **LCP (Largest Contentful Paint): 2.5 seconds or less.** How long until the main thing on the screen, usually your hero image or product photo, appears.
- **INP (Interaction to Next Paint): 200 milliseconds or less.** How quickly the page responds when someone taps a button, opens a menu or picks a size.
- **CLS (Cumulative Layout Shift): 0.1 or less.** How much the page jumps around while loading. A high CLS is why people tap the wrong button.

Do not chase a perfect 100 score. A store with real apps, real tracking and real images rarely gets there, and the score is not what customers feel. Aim for all three Core Web Vitals in the good range on mobile.

## The six things that slow most Shopify stores down

### 1. Code from apps you already removed

Many apps add code to your theme. Uninstalling the app does not always remove that code, so your pages can keep loading scripts for apps you stopped paying for months ago.

**What to do:** open your theme's code (start with `theme.liquid`) and look for snippets or script tags from apps you no longer use. Also check **App embeds** in the theme editor. Duplicate your theme before you delete anything, so you can roll back.

### 2. Product photos straight from the camera

A phone photo can be several megabytes. On a phone screen it looks the same as a well-compressed version a fraction of the size, but the visitor still downloads all of it.

**What to do:** upload images around 2000px on the long side, compressed. Most modern themes then serve smaller versions to phones automatically. Check that images below the first screen are lazy-loaded, and that the main image on the first screen is not.

### 3. A slider or video on the first screen

The biggest element on the first screen usually decides your LCP. A five-slide carousel or an autoplay background video makes that element heavy, so the most important part of the page is also the slowest.

**What to do:** use one strong image on mobile. If you want video, show a light poster image first and load the video after the page is usable.

### 4. Pop-ups, chat bubbles and widgets on every page

Chat widgets, spin-the-wheel pop-ups, review carousels, heatmap tools and tracking pixels each load their own scripts. One is rarely the problem. Six together usually are, and they hurt INP most: the page looks loaded but does not respond to taps.

**What to do:** list every third-party tool and ask whether it has earned money in the last three months. Remove what has not. Load chat only when someone taps the chat button, and show review or upsell widgets only on the pages where they matter.

### 5. Too many fonts and font weights

Every font family and every weight (light, regular, medium, bold) is a separate file. Until it loads, text either stays invisible or jumps from one font to another, which also hurts CLS.

**What to do:** use one or two font families and no more than three weights. Your theme's system font options are the fastest of all.

### 6. An old theme carrying years of edits

Older themes often depend on heavy scripts, and years of fixes from different developers pile up on top. Every new feature is added; almost nothing is ever removed.

**What to do:** update to the latest version of your theme, or move to a current Online Store 2.0 theme, and rebuild only the custom features you actually use. It is more work up front, but it usually fixes several of the problems above at once.

## What not to do

- **Do not install a "speed booster" app first.** Adding another app to fix the cost of apps should be the last step, not the first. Remove the causes before you hide them.
- **Do not judge by the desktop score.** Most store traffic is on phones, and that is where the gaps show.
- **Do not change everything at once.** Make one change, test again, and keep a note of what moved the numbers. Otherwise you will not know what worked, or what broke.

## The order we fix things in

1. Remove leftover app code and apps you do not need.
2. Fix the first screen: one compressed hero image, no autoplay video, correct loading for the main image.
3. Compress product images and check lazy loading below the first screen.
4. Delay or limit chat, pop-ups and widgets.
5. Reduce fonts and weights.
6. If the store is still slow, plan a theme update or rebuild.

Steps 1 to 3 alone often make the biggest difference, and none of them need a new website.

## Want a second opinion?

Send us your store link and what you sell. We will test your product pages on mobile and tell you the three changes that will make the biggest difference for your store. It is free, and you are under no obligation to work with us.
