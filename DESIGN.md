---
name: Mis Bizcochos
description: Costs, prices and accounts for a Venezuelan home bizcocho business, laid out like a piñata table.
colors:
  fucsia: "#b0185b"
  fucsia-hondo: "#8c1048"
  fucsia-suave: "#fde4ee"
  amarillo: "#ffd23f"
  oro: "#c99a12"
  oro-claro: "#f3dc94"
  oro-tinta: "#7f5c00"
  turquesa: "#13a3a0"
  turquesa-tinta: "#0b6c69"
  tinta: "#2a1424"
  tinta-2: "#6b5463"
  tinta-3: "#75606e"
  fondo: "#fff7fa"
  fondo-elevado: "#ffffff"
  fondo-hundido: "#fbeef3"
  linea: "#f0dde6"
  linea-fuerte: "#e2c6d4"
  peligro: "#b8231b"
  peligro-suave: "#fde8e6"
  aviso: "#8a5a00"
  aviso-suave: "#fff3d1"
  serie-1: "#d6246e"
  serie-2: "#13a3a0"
  serie-3: "#f08a24"
  serie-4: "#7a52d1"
  serie-5: "#5e8fd6"
  serie-6: "#c99a12"
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 13vw, 4.2rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  figure:
    fontFamily: "'Bricolage Grotesque Variable', ui-rounded, system-ui, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "'Bricolage Grotesque Variable', ui-rounded, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Bricolage Grotesque Variable', ui-rounded, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  row-figure:
    fontFamily: "'Bricolage Grotesque Variable', ui-rounded, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    lineHeight: 1.5
    fontFeature: "tnum"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.5
  small:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
  tab:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  swatch: "4px"
  chico: "10px"
  control: "12px"
  radio: "14px"
  caja: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  form: "18px"
  xl: "28px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.fucsia}"
    textColor: "{colors.fondo-elevado}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.fucsia-hondo}"
    textColor: "{colors.fondo-elevado}"
  button-primary-large:
    backgroundColor: "{colors.fucsia}"
    textColor: "{colors.fondo-elevado}"
    rounded: "{rounded.radio}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.fondo-elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.fondo-hundido}"
  button-danger-soft:
    backgroundColor: "transparent"
    textColor: "{colors.peligro}"
    rounded: "{rounded.control}"
  button-danger-soft-hover:
    backgroundColor: "{colors.peligro-suave}"
  input:
    backgroundColor: "{colors.fondo-elevado}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.chico}"
    padding: "0 14px"
    height: "48px"
  segmented:
    backgroundColor: "{colors.fondo-hundido}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.control}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.fondo-elevado}"
    textColor: "{colors.fucsia}"
    height: "40px"
  chip-rate:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
  price-pill:
    backgroundColor: "{colors.oro-claro}"
    textColor: "{colors.oro-tinta}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  suggested-price:
    backgroundColor: "{colors.oro-claro}"
    textColor: "{colors.oro-tinta}"
    typography: "{typography.figure}"
    rounded: "{rounded.radio}"
    padding: "16px"
  rate-panel:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.radio}"
    padding: "20px"
  list:
    backgroundColor: "{colors.fondo-elevado}"
    rounded: "{rounded.radio}"
  list-row:
    textColor: "{colors.tinta}"
    padding: "10px 16px"
    height: "64px"
  badge-income:
    backgroundColor: "{colors.fucsia-suave}"
    textColor: "{colors.fucsia}"
    size: "30px"
  badge-expense:
    backgroundColor: "{colors.fondo-hundido}"
    textColor: "{colors.tinta-2}"
    size: "30px"
  block:
    backgroundColor: "{colors.fondo-elevado}"
    rounded: "{rounded.radio}"
    padding: "16px"
  header-mobile:
    backgroundColor: "{colors.fucsia}"
    textColor: "{colors.fondo-elevado}"
    padding: "10px 16px"
  tab-bar:
    backgroundColor: "{colors.fondo-elevado}"
    textColor: "{colors.tinta-3}"
    typography: "{typography.tab}"
    height: "64px"
  tab-bar-active:
    textColor: "{colors.fucsia}"
  rail:
    backgroundColor: "{colors.fucsia}"
    textColor: "#ffe3ef"
    width: "232px"
    padding: "20px 12px"
  rail-item-active:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: Mis Bizcochos

## Overview

**Creative North Star: "The Piñata Table"**

The app is the party table at a Venezuelan birthday: a fuchsia shell around a white tablecloth with a faint pink tint, sun yellow where the eye should land, turquoise for bolívares and gold for the cake board and every price. It rejects the grey finance-app ledger with one accent. Numbers are friendly and big where they answer a question (this month's profit, today's rate, a suggested price) and quiet everywhere else.

Density is a phone in a kitchen: one column, 16px side gutters, 44–64px touch rows, a fixed bottom tab bar, and the main action floating above it. On a computer the same content sits in a centred column (680px, 1040px for the recipe editor and Inicio), with the fuchsia moved into a side rail. Surfaces are flat white on the pinkish ground, separated by hairlines in pink-tinted lines and lifted only by soft plum shadows on lists, panels and floating actions.

The signature is the torta: a top-down cake donut whose slices show where each dollar of a price goes, sitting on a gold board ring, with the price in the centre and a legend table of values beside it.

**Key Characteristics:**
- Fuchsia shell, pink-tinted white ground, near-black plum ink.
- Two-currency ink: dollars in ink, bolívares in turquoise ink, prices in gold ink.
- Plain label/amount rows instead of stat tiles.
- Bricolage Grotesque for headings and answer figures; system sans for everything read.
- One authored motion: the torta slices settling into place.

## Colors

A warm, saturated party palette on a pink-white ground; every hue has a job tied to money or place, and none of them is green.

### Primary
- **Piñata Fuchsia** (`fucsia`): the shell. Mobile header, desktop side rail, primary buttons, active tab text and its 3px top marker, focus rings, links, caret and `accent-color`, the range thumb. Its pressed/hover state is **Deep Fuchsia** (`fucsia-hondo`).
- **Fuchsia Blush** (`fucsia-suave`): the income badge behind a plus sign, and the range track.

### Secondary
- **Sun Yellow** (`amarillo`): today's rate and the current place. The BCV rate chip in the header, the rate panel on Tasa, the active item in the desktop rail, text selection, and the focus ring on fuchsia surfaces. Ink text on it (11.9:1).
- **Bolívar Turquoise Ink** (`turquesa-tinta`): every Bs amount, everywhere, as text (5.9:1 on the ground).
- **Turquoise** (`turquesa`): the bright mid-tone, used only as the empaque slice (serie-2); never as text.

### Tertiary
- **Cake-Board Gold** (`oro`): the torta's board ring and the ganancia slice (serie-6). Never text.
- **Gold Frosting** (`oro-claro`): fill for the price pill and the suggested-price panel; also the dashed scallop line on the board.
- **Price Gold Ink** (`oro-tinta`): price text: the torta centre value, the compact torta's price, the sticky price strip, the price pill, and labels inside the suggested-price panel (4.5:1 on Gold Frosting, 5.8:1 on the ground).

### Neutral
- **Plum Ink** (`tinta`): body text, dollar amounts, the large figures.
- **Muted Plum** (`tinta-2`): row labels, group titles, secondary copy, icon buttons.
- **Faded Plum** (`tinta-3`): helper text, sub-lines, inactive tabs, affixes (5.5:1 on the ground).
- **Tablecloth** (`fondo`): the page ground, a white with a faint pink tint.
- **White Plate** (`fondo-elevado`): lists, blocks, inputs, tab bar, converter, the torta's inner disc.
- **Pressed Pink** (`fondo-hundido`): sunken wells: result boxes, segmented-control track, hover on secondary buttons and icon buttons, active legend row, expense badge.
- **Pink Hairline** (`linea`) and **Pink Rule** (`linea-fuerte`): row dividers and section borders; input, secondary button and dashed empty-state borders.

### Status
- **Loss Red** (`peligro`) on **Loss Blush** (`peligro-suave`): negative profit, a losing slice value, field errors, destructive actions and the delete confirmation.
- **Notice Amber** (`aviso`) on **Notice Cream** (`aviso-suave`): notes and warnings such as "example prices" or a failed rate fetch.

### Chart series
The torta's categorical order is fixed: `serie-1` ingredientes (pink), `serie-2` empaque (turquoise), `serie-3` horno (orange), `serie-4` tu trabajo (violet), `serie-5` merma (blue), `serie-6` ganancia (gold). The set was validated with the dataviz palette validator (light mode, surface #FFFAFC). Merma is blue (#5e8fd6) because a grey failed the validator's chroma floor. Orange (2.4:1) and gold (2.5:1) sit below 3:1 against the surface, so the slices are never the only carrier of values.

### Named Rules
**The Two-Currency Ink Rule.** Bolívares always read in turquoise ink (`turquesa-tinta`), dollars in plum ink, prices in gold ink (`oro-tinta`). The Bs colour wins over any other text colour it sits inside (the stylesheet ends with a doubled `.bs` selector to guarantee it).

**The No Finance Green Rule.** Income and expense are told apart by `+` / `−` signs and by the row badge (plus on Fuchsia Blush, minus on Pressed Pink), never by green and red amounts. Red is reserved for a real loss or an error.

**The Sun Is Rare Rule.** Sun Yellow marks only today's rate and where you are (rate chip, rate panel, active rail item, selection). It is never a decorative fill.

**The Fixed Slice Order Rule.** `serie-1` to `serie-6` map to the six cost parts in that order, always. Never cycle, reorder, or add a seventh colour.

## Typography

**Display Font:** Bricolage Grotesque Variable (self-hosted via @fontsource-variable; falls back to ui-rounded, system-ui)
**Body Font:** the system sans stack (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue)

**Character:** a rounded, slightly quirky grotesque for headings and the figures that answer a question, against the phone's own sans for everything you read and type. Headings get -0.02em tracking and balanced wrapping; every amount uses tabular numerals.

### Hierarchy
- **Display** (700, clamp(2.8rem, 13vw, 4.2rem), 1, -0.03em): the month's profit on Inicio. The rate figure on Tasa uses the same voice at clamp(2.2rem, 11vw, 3.4rem).
- **Figure** (700, 2.2rem, 1.05): the suggested price; the converter result (2rem) and compact torta price (1.9rem) sit on the same step.
- **Headline** (650, 1.6rem, 1.15): screen titles. Login box title 1.8rem.
- **Title** (650, 1.05rem): block legends and block headings; the month selector (1.1rem) and converter title (1.15rem) sit here too.
- **Row figure** (650, 1.15rem, display face): amounts in the plain income/expense rows; the total row rises to 1.35rem.
- **Body** (400, 1rem, 1.5): all reading text, inputs, list titles (600). Empty-state copy capped at 44ch.
- **Label** (600, 0.95rem): field labels and button text (buttons 600, 1rem). Group titles are 650 0.95rem in Muted Plum, sentence case.
- **Small** (400, 0.85rem): helper text, list sub-lines, field errors (600).
- **Tab** (600, 0.72rem): bottom tab labels under 22px icons; 0.95rem in the desktop rail.

### Named Rules
**The Answer Speaks Bricolage Rule.** A figure that answers the baker's question (profit, rate, price, row totals) is set in the display face; amounts inside lists and tables stay in the body face at 600–650. Every amount carries tabular numerals.

## Layout

Mobile-first, single column with 16px side gutters and a 16px vertical rhythm between screen sections (18px inside forms, 8px inside groups). The mobile header is sticky; the five-tab bar is fixed at the bottom (64px plus the safe-area inset), and content is padded to clear it. Primary actions float above the tab bar: "Registrar venta" as a full-width large button on Inicio, a pill floating button on Cuentas.

At 960px the shell becomes a two-column grid: a 232px fuchsia side rail (sticky, full height) carrying the business name and the tabs, and a content column whose header turns to the Tablecloth ground with a hairline under it. Content padding grows to 28px/32px. Screens are centred at 680px max; Inicio and the recipe editor widen to 1040px and split into two columns (Inicio 1fr/1fr with 40px gap; editor 1.15fr/1fr with 28px gap and a sticky price column at top 88px). Recipe ingredient rows reflow by container query at 600px from a two-line grid to one line.

The month summary is a definition list of plain rows (label left, amount right, hairline between, total row bold without a rule), not a grid of stat tiles. On phones the recipe editor opens with a compact torta under the name, and a sticky price strip sits above the tab bar.

### Named Rules
**The Rows Not Tiles Rule.** Summaries are label/amount rows (`.renglones`), never KPI tiles or cards-per-number.

## Elevation & Depth

Mostly flat: white plates on a pink-white ground, with structure carried by hairlines and sunken Pressed Pink wells. Shadows are soft, diffuse and tinted plum (rgb 64 12 40), never neutral grey and never hard-offset. They appear on lists, the converter, the compact torta, segmented-control selection, the tab bar's upward edge, and floating actions.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 1px 2px rgb(64 12 40 / 0.06), 0 4px 14px rgb(64 12 40 / 0.07)`): resting lists, converter, compact torta.
- **Lifted** (`box-shadow: 0 2px 4px rgb(64 12 40 / 0.08), 0 10px 28px rgb(64 12 40 / 0.14)`): floating actions above the tab bar.
- **Fuchsia glow** (`box-shadow: 0 1px 2px rgb(140 16 72 / 0.3), 0 4px 12px rgb(140 16 72 / 0.18)`): primary buttons.
- **Tab edge** (`box-shadow: 0 -6px 20px rgb(64 12 40 / 0.06)`): mobile tab bar and sticky footers (0 -6px 16px).
- **Focus halo** (`box-shadow: 0 0 0 3px rgb(176 24 91 / 0.16)`): focused inputs, number fields and search.

### Named Rules
**The Plum Shadow Rule.** Every shadow is tinted with the plum ink or the fuchsia, soft and two-layered. Blocks of form fields use a 1px Pink Hairline border instead of a shadow.

## Shapes

Friendly rounded corners in a tight 10–14px band: 10px for inputs and small buttons, 12px for buttons, segmented controls, search and rail items, 14px for lists, blocks, panels and large buttons, 20px only for the login box. Pills (999px) for the rate chip, price pill, floating button and range track; circles for row badges and the range thumb. Legend swatches are 4px-rounded 12px squares. The torta is the one circular silhouette: a gold board ring with a dashed scallop line, a white disc, and a 34px-wide slice ring with 2.2px gaps between slices.

## Components

### Buttons
Tactile and warm: they press in rather than glow.
- **Shape:** gently rounded (12px); large 14px; small 10px; floating action is a pill.
- **Primary:** Piñata Fuchsia with white 600 text, 46px tall, 18px side padding, fuchsia glow shadow. Large (56px, 1.08rem) for "Registrar venta".
- **Hover / Active:** background darkens to Deep Fuchsia over 160ms; press scales to 0.97 over 120ms. Disabled at 50% opacity.
- **Secondary:** White Plate with Pink Rule border and ink text; hover to Pressed Pink.
- **Danger soft:** transparent with Loss Red text, Loss Blush on hover; opens an inline red confirmation box instead of a dialog.
- **Icon button:** 44px square, 12px radius, Muted Plum, Pressed Pink on hover.
- **Text link button:** fuchsia, underlined, 600.

### Chips
- **Rate chip:** Sun Yellow pill in the header, ink text in the display face, a small 700 "BCV" label and the rate; links to Tasa.
- **Price pill:** Gold Frosting pill with Price Gold Ink text in the display face and a 1px inset gold line; used for each recipe's price in the list.

### Cards / Containers
- **Lists:** White Plate, 14px radius, Plate shadow, rows divided by Pink Hairline. Rows are 64px min, 10px/16px padding, title left, amount right (Bs under it in turquoise ink).
- **Blocks:** fieldsets on White Plate, 1px Pink Hairline, 14px radius, 16px padding, display-face legend.
- **Result well:** Pressed Pink, 14px radius, display-face figure.
- **Suggested price:** Gold Frosting panel, Price Gold Ink labels, ink figure at 2.2rem.
- **Rate panel:** Sun Yellow panel, 20px padding, display figure.
- **Empty state:** White Plate with a dashed Pink Rule border, centred heading and one or two secondary actions.
- **Notes:** Notice Cream with Notice Amber text, 10px radius.

### Inputs / Fields
- **Style:** 48px tall, White Plate, 1px Pink Rule border, 10px radius, 14px padding. Number fields carry prefix/suffix affixes in Faded Plum inside the same border and accept comma decimals.
- **Focus:** border turns Piñata Fuchsia with a 3px fuchsia halo at 16% (140ms).
- **Error:** border turns Loss Red; the message below in 600 Loss Red.
- **Segmented control:** Pressed Pink track with 3px inset; selected segment is a White Plate with fuchsia text and a small plum shadow.
- **Range:** 8px Fuchsia Blush track, fuchsia thumb with a 3px white ring.

### Navigation
- **Mobile:** sticky fuchsia header (business name in display 700 white, save status, rate chip, settings icon) and a fixed white five-tab bar (Inicio, Insumos, Recetas, Cuentas, Tasa) with lucide icons at 22px over 0.72rem labels. Inactive in Faded Plum; active in fuchsia with a 3px rounded fuchsia marker at the top edge.
- **Desktop (960px+):** a 232px fuchsia rail with the business name, items as 44px rows with icon and 0.95rem label in light pink (#ffe3ef); hover adds a 10% white wash; the active item is a Sun Yellow 12px-rounded plate with ink text. The header loses its fuchsia and becomes the ground colour.

### Torta (signature)
A top-down cake that shows where every dollar of a price goes, per portion.
- **Drawing:** 200-unit SVG, up to 300px wide. Gold board ring with a darker gold edge and a dashed Gold Frosting scallop line, a White Plate disc, and six slices drawn as stroked arcs of a 70-unit radius ring, 34 units thick, starting at 12 o'clock, separated by 2.2-unit gaps. Empty state: a single Pink Hairline ring.
- **Centre:** price label, the price in Price Gold Ink (display 700, clamp(1.25rem, 6vw, 1.6rem)) and Bs under it. Hovering a slice or focusing/hovering a legend row swaps the centre to that part's name, value and share; the active slice thickens by 6 units and the others drop to 32% opacity.
- **Legend:** a mandatory table under the cake: swatch, part name, dollar value, percentage, one row per slice, keyboard focusable. A losing ganancia shows as a red negative value.
- **Compact:** on phones a 112px cake beside the price, cost and margin line, with a link to the full breakdown.
- **Motion:** the only authored motion. Slices transition `stroke-dasharray` and `stroke-dashoffset` over 520ms on the expo-out curve `cubic-bezier(0.16, 1, 0.3, 1)` as the recipe changes; thickness and opacity follow in 180ms. Under `prefers-reduced-motion` all transitions collapse to 1ms.

## Do's and Don'ts

### Do:
- **Do** set every Bs amount in turquoise ink (`turquesa-tinta`) and every price in gold ink (`oro-tinta`); keep dollars in plum ink.
- **Do** mark income and expense with `+` / `−` signs and the row badge (plus on Fuchsia Blush, minus on Pressed Pink).
- **Do** keep the torta's slice order and colours exactly `serie-1` to `serie-6`, and always pair the cake with its legend table of values.
- **Do** summarise with plain label/amount rows divided by a Pink Hairline.
- **Do** keep touch targets at 44px or more and amounts in tabular numerals.
- **Do** tint shadows plum or fuchsia and keep them soft.
- **Do** keep state feedback to colour, background and press-scale in 120–180ms on `cubic-bezier(0.16, 1, 0.3, 1)`, and respect reduced motion.

### Don't:
- **Don't** use green for income or profit; red only for a real loss or an error.
- **Don't** set Bs amounts in any colour but turquoise ink, and don't use the bright `turquesa`, `oro` or `serie-*` hues as text.
- **Don't** let the torta stand without its legend: orange and gold slices are below 3:1 against the surface.
- **Don't** cycle, reorder or extend the chart series, or swap merma back to a grey.
- **Don't** build stat tiles or KPI cards for the month's numbers.
- **Don't** spend Sun Yellow on decoration; it marks only the rate and the current place.
- **Don't** add a second authored animation; the torta's slices are the one.
