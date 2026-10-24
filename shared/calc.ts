import type {
  Ajustes,
  Encargo,
  Formato,
  Insumo,
  MetodoPago,
  Moneda,
  Movimiento,
  Receta,
  UnidadBase,
  UnidadCompra,
} from './types'

export const FACTOR: Record<UnidadCompra, { base: UnidadBase; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  L: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  und: { base: 'und', factor: 1 },
}

/** Units a recipe may use for an ingredient bought in `u`. */
export function unidadesCompatibles(u: UnidadCompra): UnidadCompra[] {
  const base = FACTOR[u].base
  return (Object.keys(FACTOR) as UnidadCompra[]).filter((k) => FACTOR[k].base === base)
}

export function aUSD(monto: number, moneda: Moneda, tasa: number): number {
  if (moneda === 'USD') return monto
  return tasa > 0 ? monto / tasa : 0
}

/** Dollars per gram, millilitre or unit. */
export function costoPorBase(i: Pick<Insumo, 'cantidad' | 'unidad' | 'precioUSD'>): number {
  const total = i.cantidad * FACTOR[i.unidad].factor
  return total > 0 ? i.precioUSD / total : 0
}

export function costoItem(insumo: Insumo | undefined, cantidad: number, unidad: UnidadCompra): number {
  if (!insumo || insumo.deleted || !(cantidad > 0)) return 0
  if (FACTOR[unidad].base !== FACTOR[insumo.unidad].base) return 0
  return costoPorBase(insumo) * cantidad * FACTOR[unidad].factor
}

export function redondearArriba(v: number, paso = 0.5): number {
  if (v <= 0) return 0
  return Math.ceil(v / paso - 1e-9) * paso
}

/** A friendly price step: quarters under $10, halves under $30, whole dollars above. */
export function precioAmable(v: number): number {
  return redondearArriba(v, v < 10 ? 0.25 : v < 30 ? 0.5 : 1)
}

export function rindeDe(r: Pick<Receta, 'rinde'>): number {
  return r.rinde > 0 ? r.rinde : 1
}

/** Whether the product can be sold by the portion. */
export function tienePorciones(r: Pick<Receta, 'rinde'>): boolean {
  return rindeDe(r) > 1
}

/** Her own prices, reading the legacy single `precioVenta` too. */
export function preciosPropios(r: Receta): { entero?: number; porcion?: number } {
  const pos = (v?: number) => (v && v > 0 ? v : undefined)
  const legado = pos(r.precioVenta)
  return {
    entero: pos(r.precioEntero) ?? (tienePorciones(r) ? undefined : legado),
    porcion: tienePorciones(r) ? (pos(r.precioPorcion) ?? legado) : undefined,
  }
}

export interface Precio {
  costo: number
  /** Exact price that achieves the desired margin. */
  exacto: number
  /** `exacto` rounded up to a friendly step. */
  sugerido: number
  /** Her own price when set, else the suggested one. */
  precio: number
  propio: boolean
  ganancia: number
  /** Real margin on `precio`, 0–1 (negative when selling at a loss). */
  margen: number
}

export interface Desglose {
  ingredientes: number
  empaque: number
  horno: number
  trabajo: number
  merma: number
  /** Cost of the whole product. */
  costo: number
  rinde: number
  entero: Precio
  /** Same as `entero` when the product has no portions. */
  porcion: Precio
  faltantes: number
}

function precioPara(costo: number, margen: number, propio?: number): Precio {
  const exacto = costo / (1 - margen)
  const sugerido = precioAmable(exacto)
  const precio = propio ?? sugerido
  const ganancia = precio - costo
  return { costo, exacto, sugerido, precio, propio: propio !== undefined, ganancia, margen: precio > 0 ? ganancia / precio : 0 }
}

export function desglose(receta: Receta, insumos: Record<string, Insumo>, ajustes: Ajustes): Desglose {
  let ingredientes = 0
  let empaque = 0
  let faltantes = 0
  for (const it of receta.items) {
    const ins = insumos[it.insumoId]
    if (!ins || ins.deleted) {
      faltantes++
      continue
    }
    const c = costoItem(ins, it.cantidad, it.unidad)
    if (ins.tipo === 'empaque') empaque += c
    else ingredientes += c
  }
  const horno = (receta.minutosHorno / 60) * ajustes.costoHornoHora
  const trabajo = (receta.minutosTrabajo / 60) * ajustes.costoTrabajoHora
  const subtotal = ingredientes + empaque + horno + trabajo
  const merma = subtotal * receta.merma
  const costo = subtotal + merma
  const rinde = rindeDe(receta)
  const margen = Math.min(Math.max(receta.margen, 0), 0.95)
  const propios = preciosPropios(receta)
  const entero = precioPara(costo, margen, propios.entero)
  const porcion = rinde > 1 ? precioPara(costo / rinde, margen, propios.porcion) : entero
  return { ingredientes, empaque, horno, trabajo, merma, costo, rinde, entero, porcion, faltantes }
}

/** The unit price of a product sold in `formato`. */
export function precioDe(
  receta: Receta | undefined,
  formato: Formato,
  insumos: Record<string, Insumo>,
  ajustes: Ajustes,
): number {
  if (!receta || receta.deleted) return NaN
  const d = desglose(receta, insumos, ajustes)
  return formato === 'porcion' && tienePorciones(receta) ? d.porcion.precio : d.entero.precio
}

// ───────── Orders ─────────

export function totalEncargo(e: Pick<Encargo, 'items'>): number {
  return e.items.reduce((s, it) => s + (it.cantidad > 0 ? it.cantidad : 0) * (it.precioUSD > 0 ? it.precioUSD : 0), 0)
}

/** Payments received for each order, from the sales log. */
export function pagosPorEncargo(movs: Movimiento[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const mov of movs) {
    if (mov.deleted || mov.tipo !== 'venta' || !mov.encargoId) continue
    m.set(mov.encargoId, (m.get(mov.encargoId) ?? 0) + mov.montoUSD)
  }
  return m
}

export interface CuentaEncargo {
  total: number
  pagado: number
  /** What is still owed; never negative. */
  resta: number
}

export function cuentaEncargo(e: Encargo, pagos: Map<string, number>): CuentaEncargo {
  const total = totalEncargo(e)
  const pagado = pagos.get(e.id) ?? 0
  return { total, pagado, resta: Math.max(total - pagado, 0) }
}

/** Money still owed on orders that are not cancelled. */
export function porCobrar(encargos: Encargo[], movs: Movimiento[]): number {
  const pagos = pagosPorEncargo(movs)
  return encargos
    .filter((e) => !e.deleted && e.estado !== 'cancelado')
    .reduce((s, e) => s + cuentaEncargo(e, pagos).resta, 0)
}

export function encargoAbierto(e: Encargo): boolean {
  return !e.deleted && (e.estado === 'pendiente' || e.estado === 'listo')
}

// ───────── Shopping list ─────────

export interface LineaCompra {
  insumo: Insumo
  /** Amount needed, in the ingredient's base unit (g, ml or und). */
  necesario: number
  /** Whole packages to buy. */
  paquetes: number
  /** Cost of exactly what is needed. */
  costo: number
  /** Cost of the whole packages. */
  costoPaquetes: number
}

/** What to buy to make the open orders delivered between `desde` and `hasta` (inclusive). */
export function listaCompras(
  encargos: Encargo[],
  recetas: Record<string, Receta>,
  insumos: Record<string, Insumo>,
  desde: string,
  hasta: string,
): { lineas: LineaCompra[]; encargos: number; sinReceta: number } {
  const total = new Map<string, number>()
  let usados = 0
  let sinReceta = 0
  for (const e of encargos) {
    if (!encargoAbierto(e) || e.entrega < desde || e.entrega > hasta) continue
    usados++
    for (const it of e.items) {
      const r = it.recetaId ? recetas[it.recetaId] : undefined
      if (!r || r.deleted) {
        sinReceta++
        continue
      }
      const veces = it.formato === 'porcion' ? it.cantidad / rindeDe(r) : it.cantidad
      for (const ri of r.items) {
        const ins = insumos[ri.insumoId]
        if (!ins || ins.deleted || !(ri.cantidad > 0)) continue
        if (FACTOR[ri.unidad].base !== FACTOR[ins.unidad].base) continue
        total.set(ins.id, (total.get(ins.id) ?? 0) + ri.cantidad * FACTOR[ri.unidad].factor * veces)
      }
    }
  }
  const lineas = [...total.entries()]
    .map(([id, necesario]) => {
      const insumo = insumos[id]
      const porPaquete = insumo.cantidad * FACTOR[insumo.unidad].factor
      const paquetes = porPaquete > 0 ? Math.ceil(necesario / porPaquete - 1e-9) : 0
      return {
        insumo,
        necesario,
        paquetes,
        costo: necesario * costoPorBase(insumo),
        costoPaquetes: paquetes * insumo.precioUSD,
      }
    })
    .sort((a, b) => (a.insumo.tipo === b.insumo.tipo ? a.insumo.nombre.localeCompare(b.insumo.nombre, 'es') : a.insumo.tipo === 'ingrediente' ? -1 : 1))
  return { lineas, encargos: usados, sinReceta }
}

// ───────── Summaries ─────────

export interface VentaProducto {
  recetaId: string
  enteros: number
  porciones: number
  monto: number
}

export interface Resumen {
  ingresos: number
  gastos: number
  ganancia: number
  /** Direct sales plus orders delivered this month. */
  ventas: number
  porReceta: VentaProducto[]
  porMetodo: { metodo: MetodoPago | 'sin-metodo'; monto: number }[]
}

export function resumenMes(movs: Movimiento[], mes: string, encargos: Encargo[] = []): Resumen {
  let ingresos = 0
  let gastos = 0
  let ventas = 0
  const porReceta = new Map<string, VentaProducto>()
  const porMetodo = new Map<MetodoPago | 'sin-metodo', number>()
  const sumar = (recetaId: string, formato: Formato | undefined, cantidad: number, monto: number) => {
    const r = porReceta.get(recetaId) ?? { recetaId, enteros: 0, porciones: 0, monto: 0 }
    if (formato === 'porcion') r.porciones += cantidad
    else r.enteros += cantidad
    r.monto += monto
    porReceta.set(recetaId, r)
  }
  for (const m of movs) {
    if (m.deleted || !m.fecha.startsWith(mes)) continue
    if (m.tipo === 'venta') {
      ingresos += m.montoUSD
      const k = m.metodo ?? 'sin-metodo'
      porMetodo.set(k, (porMetodo.get(k) ?? 0) + m.montoUSD)
      if (m.encargoId) continue
      ventas++
      if (m.recetaId) sumar(m.recetaId, m.formato, m.cantidad ?? 1, m.montoUSD)
    } else {
      gastos += m.montoUSD
    }
  }
  for (const e of encargos) {
    if (e.deleted || e.estado !== 'entregado' || !e.entrega.startsWith(mes)) continue
    ventas++
    for (const it of e.items) if (it.recetaId) sumar(it.recetaId, it.formato, it.cantidad, it.cantidad * it.precioUSD)
  }
  return {
    ingresos,
    gastos,
    ganancia: ingresos - gastos,
    ventas,
    porReceta: [...porReceta.values()].sort((a, b) => b.monto - a.monto),
    porMetodo: [...porMetodo.entries()].map(([metodo, monto]) => ({ metodo, monto })).sort((a, b) => b.monto - a.monto),
  }
}

export interface Mes {
  mes: string
  ingresos: number
  gastos: number
  ganancia: number
}

/** The `n` months ending at `hasta` (YYYY-MM), oldest first. */
export function serieMeses(movs: Movimiento[], hasta: string, n: number): Mes[] {
  const [y, m] = hasta.split('-').map(Number)
  const meses: Mes[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    meses.push({ mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, ingresos: 0, gastos: 0, ganancia: 0 })
  }
  const idx = new Map(meses.map((x, i) => [x.mes, i]))
  for (const mov of movs) {
    if (mov.deleted) continue
    const i = idx.get(mov.fecha.slice(0, 7))
    if (i === undefined) continue
    if (mov.tipo === 'venta') meses[i].ingresos += mov.montoUSD
    else meses[i].gastos += mov.montoUSD
  }
  for (const x of meses) x.ganancia = x.ingresos - x.gastos
  return meses
}

/**
 * Reads a number typed the Venezuelan way ("1.234,56") or the US way ("1234.56").
 * With both separators the last one is the decimal mark; a lone comma is decimal;
 * several dots are thousands. Returns NaN for anything else.
 */
export function leerNumero(texto: string): number {
  let s = texto.trim().replace(/\s|\$|bs\.?/gi, '')
  if (!s) return NaN
  const coma = s.lastIndexOf(',')
  const punto = s.lastIndexOf('.')
  if (coma >= 0 && punto >= 0) {
    if (coma > punto) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (coma >= 0) {
    if ((s.match(/,/g) ?? []).length > 1) return NaN
    s = s.replace(',', '.')
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, '')
  }
  if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.$/.test(s)) return NaN
  return Number(s)
}
