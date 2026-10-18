import type { Ajustes, Insumo, Moneda, Movimiento, Receta, UnidadBase, UnidadCompra } from './types'

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

export interface Desglose {
  ingredientes: number
  empaque: number
  horno: number
  trabajo: number
  merma: number
  /** Cost of the whole recipe. */
  costo: number
  costoPorcion: number
  /** Exact price per portion that achieves the margin. */
  precioExacto: number
  /** `precioExacto` rounded up to a friendly step. */
  precioSugerido: number
  /** Price the baker charges per portion: their own when set, else the suggested one. */
  precio: number
  gananciaPorcion: number
  /** Real margin on `precio`, 0–1 (can be negative). */
  margenReal: number
  faltantes: number
}

export function redondearArriba(v: number, paso = 0.5): number {
  if (v <= 0) return 0
  return Math.ceil(v / paso - 1e-9) * paso
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
  const rinde = receta.rinde > 0 ? receta.rinde : 1
  const costoPorcion = costo / rinde
  const margen = Math.min(Math.max(receta.margen, 0), 0.95)
  const precioExacto = costoPorcion / (1 - margen)
  const precioSugerido = redondearArriba(precioExacto, precioExacto >= 10 ? 0.5 : 0.25)
  const precio = receta.precioVenta && receta.precioVenta > 0 ? receta.precioVenta : precioSugerido
  const gananciaPorcion = precio - costoPorcion
  const margenReal = precio > 0 ? gananciaPorcion / precio : 0
  return {
    ingredientes,
    empaque,
    horno,
    trabajo,
    merma,
    costo,
    costoPorcion,
    precioExacto,
    precioSugerido,
    precio,
    gananciaPorcion,
    margenReal,
    faltantes,
  }
}

export interface Resumen {
  ingresos: number
  gastos: number
  ganancia: number
  ventas: number
  unidades: number
  porReceta: { recetaId: string; unidades: number; monto: number }[]
}

export function resumenMes(movs: Movimiento[], mes: string): Resumen {
  let ingresos = 0
  let gastos = 0
  let ventas = 0
  let unidades = 0
  const porReceta = new Map<string, { recetaId: string; unidades: number; monto: number }>()
  for (const m of movs) {
    if (m.deleted || !m.fecha.startsWith(mes)) continue
    if (m.tipo === 'venta') {
      ingresos += m.montoUSD
      ventas++
      unidades += m.cantidad ?? 0
      if (m.recetaId) {
        const r = porReceta.get(m.recetaId) ?? { recetaId: m.recetaId, unidades: 0, monto: 0 }
        r.unidades += m.cantidad ?? 0
        r.monto += m.montoUSD
        porReceta.set(m.recetaId, r)
      }
    } else {
      gastos += m.montoUSD
    }
  }
  return {
    ingresos,
    gastos,
    ganancia: ingresos - gastos,
    ventas,
    unidades,
    porReceta: [...porReceta.values()].sort((a, b) => b.monto - a.monto),
  }
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
