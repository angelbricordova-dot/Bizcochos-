---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# App shell — Mis Bizcochos

Scope: the whole installable web app — Inicio, Encargos, Productos, Cuentas, and the Más hub (Cobrar, Lista de compras, Precios para WhatsApp, Reportes, Insumos, Tasa, Ajustes). Mode: Operate.

Audience and job: a home baker in Venezuela selling bizcochos, pie de limón and cheesecake, on a phone in the kitchen or at the shop, pricing products, taking orders with deposits and logging sales; on a computer, reviewing the month.

Key tasks, by frequency: register a sale; take or update an order and its deposit; show payment details to a client; check the BCV rate; read what to buy for upcoming orders; price a product whole and by portion; read the month and its goal.

Decided in the finish reviews:
- On phones the product editor opens with a compact torta under the name, so the slices are visible before the form.
- Refinement round ("más limpio"): the phone header is the light tablecloth ground with the fuchsia wordmark; fuchsia moves to the active tab as a filled pill with a white icon, the primary buttons and the desktop rail. Cards and lists use a 1px line, not shadows; shadows are kept only for floating things (fixed actions, toasts, tooltips).
- Dark mode, chosen per device (automatic, light, dark): plum-black ground, the same roles lifted to read on it.
- Deletes are undone from a toast instead of confirmed first.
- Payment details and QR live only in her private store (Ajustes), never in the public code.

Constraints: mobile-first, bottom tab bar on phones (Inicio, Encargos, Productos, Cuentas, Más), side rail on wide screens; every amount in USD with Bs beside it; works on a slow connection.

## Direction contract

THESIS: A bizcocho's price is a cake you can see: cost drawn as slices on a gold cake board. Refuses the grey finance-app ledger with one accent.

OWN-WORLD: The Venezuelan piñata table. Fuchsia carries the shell where it acts (filled active tab, primary actions, desktop rail); turquoise ink for bolívares, sun yellow for the rate and the current place, gold for prices and what she kept; white tablecloth ground with a faint pink tint (plum-black at night). Bricolage Grotesque for headings and figures, system sans for body; 12–16px radii; elevation by a 1px line.

STORY: She sees today's rate, the month's profit as a cake and what clients owe first, trusts each price because its slices show where every dollar goes, and logs a sale or an order in two taps.

FIRST VIEWPORT: Light header with the business wordmark in fuchsia and the yellow BCV chip. The month's "te quedó" large in USD with Bs under it, beside a small month torta (expenses vs kept) on the gold board; the goal meter; plain rows for sold, spent and owed. "Registrar venta" and "Encargo" fixed above the bottom tab bar on a ground strip (Inicio, Encargos, Productos, Cuentas, Más). The fourth tab is "Cuentas": one log holds sales and expenses.

FORM: Candidate 6 of 7 (mesa de piñata), seed:19476e83bcfe8f53. Signature move: the "torta" — a top-down cake donut on a gold board ring: per product its cost slices and profit with the price in the centre, and on Inicio the month's expenses against what she kept.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
