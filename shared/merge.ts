import type { Ajustes, Datos, Registro } from './types'

export const AJUSTES_INICIALES: Ajustes = {
  updatedAt: 0,
  nombreNegocio: 'Mis Bizcochos',
  costoHornoHora: 0.6,
  costoTrabajoHora: 2,
  margenPorDefecto: 0.4,
  mermaPorDefecto: 0.05,
}

export function datosVacios(): Datos {
  return { insumos: {}, recetas: {}, movimientos: {}, ajustes: { ...AJUSTES_INICIALES } }
}

type Coleccion = 'insumos' | 'recetas' | 'movimientos'
export const COLECCIONES: Coleccion[] = ['insumos', 'recetas', 'movimientos']

function mezclarColeccion<T extends Registro>(a: Record<string, T> = {}, b: Record<string, T> = {}): Record<string, T> {
  const out: Record<string, T> = { ...a }
  for (const [id, rec] of Object.entries(b)) {
    const actual = out[id]
    if (!actual || rec.updatedAt > actual.updatedAt) out[id] = rec
  }
  return out
}

/** Record-level last-write-wins merge. Deletions travel as tombstones, so they merge like edits. */
export function mezclar(a: Partial<Datos> | null | undefined, b: Partial<Datos> | null | undefined): Datos {
  const base = datosVacios()
  const x = { ...base, ...(a ?? {}) }
  const y = { ...base, ...(b ?? {}) }
  const ajustesA = { ...AJUSTES_INICIALES, ...x.ajustes }
  const ajustesB = { ...AJUSTES_INICIALES, ...y.ajustes }
  return {
    insumos: mezclarColeccion(x.insumos, y.insumos),
    recetas: mezclarColeccion(x.recetas, y.recetas),
    movimientos: mezclarColeccion(x.movimientos, y.movimientos),
    ajustes: ajustesB.updatedAt > ajustesA.updatedAt ? ajustesB : ajustesA,
  }
}

/** The records changed after `desde`, for sending only what is new. */
export function cambiosDesde(datos: Datos, desde: number): Partial<Datos> {
  const out: Partial<Datos> = {}
  for (const c of COLECCIONES) {
    const recs = Object.values(datos[c]).filter((r) => r.updatedAt > desde)
    if (recs.length) (out as Record<string, unknown>)[c] = Object.fromEntries(recs.map((r) => [r.id, r]))
  }
  if (datos.ajustes.updatedAt > desde) out.ajustes = datos.ajustes
  return out
}

/** Light shape check for data coming from the network or a backup file. */
export function esDatosValidos(v: unknown): v is Partial<Datos> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  for (const c of COLECCIONES) {
    const col = o[c]
    if (col === undefined) continue
    if (!col || typeof col !== 'object' || Array.isArray(col)) return false
    for (const r of Object.values(col as Record<string, unknown>)) {
      if (!r || typeof r !== 'object') return false
      const rec = r as Record<string, unknown>
      if (typeof rec.id !== 'string' || typeof rec.updatedAt !== 'number') return false
    }
  }
  if (o.ajustes !== undefined && (typeof o.ajustes !== 'object' || o.ajustes === null)) return false
  return true
}
