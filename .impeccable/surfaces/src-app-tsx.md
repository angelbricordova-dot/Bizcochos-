---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# App shell — Mis Bizcochos

Scope: the whole installable web app (Inicio, Insumos, Recetas, Ventas y gastos, Tasa). Mode: Operate.

Audience and job: a home baker in Venezuela, on a phone in the kitchen or at the shop, pricing bizcochos and logging sales; on a computer, reviewing the month.

Key tasks, by frequency: register a sale; check the BCV rate / convert; add or update an ingredient price; build a recipe and read its suggested price; read the month's profit.

Decided in the finish review: on phones the recipe editor opens with a compact torta under the name, so the slices are visible before the form.

Constraints: mobile-first, bottom tab bar on phones, side rail on wide screens; every amount in USD with Bs beside it; works on a slow connection.

## Direction contract

THESIS: A bizcocho's price is a cake you can see: cost drawn as slices on a gold cake board. Refuses the grey finance-app ledger with one accent.

OWN-WORLD: The Venezuelan piñata table. Fuchsia shell (header, active tab), turquoise for bolívares, sun yellow for highlights and the rate, gold for prices; white tablecloth ground with a faint pink tint; ink near-black plum. Rounded friendly grotesque (Bricolage Grotesque) for headings and figures, system sans for body; 12–16px radii, soft offset shadows.

STORY: The baker sees today's rate and the month's profit first, trusts the suggested price because its slices show where every dollar goes, and logs a sale in two taps.

FIRST VIEWPORT: Fuchsia header with business name and today's BCV rate chip (yellow). Below, the month's ganancia in USD large with Bs under it, ingresos/gastos as two plain rows. Primary action "Registrar venta" fixed above the bottom tab bar (Inicio, Insumos, Recetas, Cuentas, Tasa). The fourth tab is "Cuentas", not "Ventas": one log holds sales and expenses, and the baker calls that her cuentas.

FORM: Candidate 6 of 7 (mesa de piñata), seed:19476e83bcfe8f53. Signature move: the recipe "torta" — a top-down cake donut whose slices are ingredientes, empaque, horno, mano de obra, merma and ganancia, sitting on a gold board ring, price in the centre.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
