# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React + Vite + TypeScript as an installable PWA, deployed on Vercel. Vercel serverless functions under `/api` fetch the BCV rate and read/write the business data. Cloud storage chosen by the user (so phone and computer see the same records), behind a login.

## Users

The owner of a small, recently started home bizcocho (sponge/pound cake) business in Venezuela. Works mostly from a phone, in the kitchen or while shopping for ingredients, and sometimes from a computer to review the month. Not an accountant; needs numbers that are clear at a glance.

## Product Purpose

Know what each bizcocho really costs and what it should sell for, and keep an honest record of sales and purchases so the business's accounts stay clear. Success: the owner can price a new bizcocho in minutes, register a sale in seconds, and see at any moment how much the business earned this month, in both dollars and bolívares.

## Positioning

Built around the way a Venezuelan home baker actually prices: ingredients bought by the package in dollars or bolívares, a recipe that consumes part of each package, and a BCV official rate that changes daily. Every amount is held in dollars and shown in bolívares at the current BCV rate.

## Operating Context

- Ingredient prices arrive per package (1 kg flour, 30-egg carton, 1 L oil), in USD or Bs.
- Recipes ("recetas") use grams, millilitres or units of those ingredients and yield one bizcocho or a number of portions.
- Beyond ingredients: packaging (box, base, ribbon), oven gas/electricity time, the owner's labour, and a buffer for waste.
- Sales are paid in USD cash, Bs by pago móvil/transfer, or a mix; the rate on the day of the sale matters.
- The BCV official rate is published daily; the app fetches it automatically and lets the owner type it manually when the fetch fails.

## Capabilities and Constraints

- Ingredient catalogue with package size, package price and currency; derived cost per gram/ml/unit.
- Recipes with ingredient quantities, packaging, oven time, labour time, waste buffer, yield; derived total cost, cost per portion.
- Suggested sale price from a desired margin on the sale price (margin %, not markup), shown in USD and Bs, with the profit per bizcocho.
- Sales and expense log with date, product, quantity, amount, currency and the BCV rate of that day; monthly summary of income, expenses and profit.
- Bs ↔ USD converter at the BCV rate.
- Single-owner login (one shared password set in Vercel). Data lives in a Redis store attached through the Vercel Marketplace.
- Spanish (Venezuela) only. Numbers use comma decimals (es-VE).
- Undecided: the business's real name (placeholder "Mis Bizcochos" until the owner gives one), logo.

## Brand Commitments

None yet. Name is a placeholder.

## Evidence on Hand

No real recipes, prices or sales were supplied. The app ships empty; any example data must be labelled as an example and be removable.

## Product Principles

1. Dollars are the anchor, bolívares are always one glance away.
2. A price is never a guess: every suggested price shows the cost it comes from.
3. Registering a sale must be faster than writing it in a notebook.
4. Clear over clever: plain words a baker uses, not accounting jargon.
