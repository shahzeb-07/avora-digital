---
title: How we built a multi-currency profit dashboard for online stores
description: The problem, the technical decisions and the lessons behind Fiscora, the finance dashboard we designed and built in-house: data import, 41 currencies and tax, privacy, the Cloudflare stack and testing.
date: 2026-11-12
category: Dashboards & SaaS
tags: SaaS, Dashboards, Next.js, Cloudflare, Multi-currency
image: assets/blog/multi-currency-profit-dashboard.jpg
imageAlt: How we built a multi-currency profit dashboard, by Avora Digital
---

Most online store owners can tell you their sales for last month. Far fewer can tell you their profit. Courier charges, returns, payment fees, ad spend and tax are spread across different apps, statements and spreadsheets, and nobody adds them up until the bank balance looks wrong.

That gap is why we built [Fiscora](https://getfiscora.com/?utm_source=avoradigital&utm_medium=referral&utm_campaign=blog_dashboard), a finance website and dashboard for small businesses. It is our own product, designed, built and run in-house at Avora Digital. This post covers the problem, the decisions we made while building it, and what we would tell anyone planning a dashboard or SaaS product of their own.

## The problem: sales are not profit

A store's sales report answers one question: how much did customers pay? A business owner needs a different one answered: how much did we keep?

To get from one to the other, you need every cost that sits between the order and the bank:

- what the product cost you
- courier and delivery charges
- returns and refused deliveries
- payment processor fees
- advertising
- VAT, GST or sales tax

Each of these lives somewhere else. The dashboard's job is to bring them into one place and show the result in plain numbers.

## Decision 1: start with free calculators

Before building the dashboard, we built 20 free financial calculators: profit margin, break-even, VAT and GST, cash flow, pricing, e-commerce profit and loss and more, in 10 languages including Urdu and Arabic, which read right to left.

This was not a side project. The calculators let us get the formulas right one at a time, with a worked example and an FAQ on every page. They are useful on their own, and they give people a reason to find Fiscora in search before they ever need a dashboard.

**Lesson:** if your product depends on calculations people must trust, publish the calculations first, openly, and get them right.

## Decision 2: meet the data where it already is

A dashboard is only as good as the data that reaches it, and nobody wants to type orders in by hand. So Fiscora brings data in three ways:

- **Shopify import** for stores already on Shopify
- **CSV import** for any other platform or spreadsheet
- **An Orders API** for custom-built websites that want to send orders automatically

And it lets data out again: **Excel export** and a **live Google Sheets link**, because many businesses already have an accountant or a spreadsheet they will not give up.

**Lesson:** import and export are not extras. For a business tool, they decide whether anyone uses it after the first week.

## Decision 3: currencies and tax from day one

Online stores rarely live in one currency. A UK brand may sell in euros, a Gulf store in dirhams and dollars, a Pakistani exporter in rupees and pounds. And tax rules change what "revenue" even means: is a price shown with VAT included, or added on top?

Fiscora supports **41 currencies** with **VAT, GST or sales tax**. We built this in from the start, because adding currencies and tax to a finished dashboard means revisiting almost every number it shows.

**Lesson:** if there is any chance your users work in more than one currency or tax system, design for it on day one. It is much cheaper than retrofitting.

## Decision 4: show profit where decisions are made

A single profit figure for the whole business does not tell an owner what to change. So the dashboard breaks profit down by **product, sales channel, city and courier**, alongside profit and loss, cash flow, expense analysis and receivables. Alerts point out when something changes.

For planning, it includes a **3-scenario profit forecast**, a **13-week cash forecast** and **budgets**.

Breaking profit down by courier and city matters most for stores that ship cash on delivery, where refused parcels and delivery costs can turn a "good" product into a loss-maker in one region.

**Lesson:** build reports around the decisions your users make, such as which product to push, which courier to drop or which city to stop advertising in, not around the tables in your database.

## Decision 5: privacy by design

Financial data is sensitive, and so is customer data. We made three choices early:

- **Google sign-in**, so there are no passwords for us to store
- **No customer contact details stored**: profit analysis does not need a customer's phone number or address
- **Data is deleted only when the user deletes it**

Up to 3 businesses can sit under one account, each with a **team of up to 3 people**, so an owner can bring in a partner or accountant without sharing a login.

**Lesson:** the safest data is data you never collect. Decide what you will not store before you design what you will.

## Decision 6: the stack

Fiscora is built with **Next.js**, runs on **Cloudflare Pages and Workers**, and stores data in **Cloudflare D1**. Pages and the app are served from Cloudflare's global network, which suits a product meant for users in many countries.

Payments go through **Paddle as merchant of record**. A merchant of record sells the subscription on your behalf and handles sales tax and VAT on those sales, which matters for a small team selling to customers in many countries. The checkout is being set up now.

**Lesson:** for a small team selling software internationally, compare a merchant of record with a plain payment processor early. Tax on your own subscription sales is easy to underestimate.

## Decision 7: test like it will be trusted with money

A finance tool that is wrong once loses the user's trust for good. So Fiscora has:

- **177 automated tests** for the calculators
- **automated end-to-end tests** of the dashboard
- **every page checked in all 10 languages**, on phone and desktop

Right-to-left languages in particular break layouts in ways that are easy to miss if you only test in English.

**Lesson:** for money tools, automate tests for every formula, and test every language on a real phone-sized screen.

## What we would tell anyone building a dashboard or SaaS product

1. **Write down the one question your product answers.** For Fiscora it is "how much did I actually keep?"
2. **Get data in and out easily** before adding more charts.
3. **Design for currencies, tax and languages from the start** if your users are international.
4. **Decide what data you will not collect.**
5. **Automate tests for anything involving money.**

## Need a dashboard or SaaS product built?

We design and build custom dashboards, customer portals and SaaS products for businesses in the UK, US, Europe and the Gulf, the same way we built Fiscora. [See our dashboards and SaaS service](/services#saas), or tell us what you want to build and we will reply within one business day.
