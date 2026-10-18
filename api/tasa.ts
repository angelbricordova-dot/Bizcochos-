import type { Tasa } from '../shared/types.js'
import { json } from './_lib/http.js'
import { guardarJSON, leerJSON } from './_lib/store.js'

const LLAVE = 'bizcochos:tasa'

async function conLimite(url: string, ms = 6000): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!r.ok) throw new Error(`${url} → ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

function valido(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

/** Each source returns the BCV official dollar rate, or throws. */
const FUENTES: { nombre: string; leer: () => Promise<Tasa> }[] = [
  {
    nombre: 'DolarApi',
    async leer() {
      const d = (await conLimite('https://ve.dolarapi.com/v1/dolares/oficial')) as {
        promedio?: number
        venta?: number
        fechaActualizacion?: string
      }
      const valor = valido(d.promedio) ? d.promedio : d.venta
      if (!valido(valor)) throw new Error('DolarApi sin valor')
      return { valor, fecha: d.fechaActualizacion ?? null, fuente: 'BCV (vía DolarApi)' }
    },
  },
  {
    nombre: 'PyDolarVe',
    async leer() {
      const d = (await conLimite('https://pydolarve.org/api/v2/dollar?page=bcv')) as {
        monitors?: { usd?: { price?: number; last_update?: string } }
      }
      const usd = d.monitors?.usd
      if (!valido(usd?.price)) throw new Error('PyDolarVe sin valor')
      return { valor: usd.price, fecha: usd.last_update ?? null, fuente: 'BCV (vía PyDolarVe)' }
    },
  },
]

/** Today's BCV rate. Cached at Vercel's edge for 15 minutes; the last good value is the fallback. */
export async function GET(): Promise<Response> {
  for (const f of FUENTES) {
    try {
      const tasa = await f.leer()
      await guardarJSON(LLAVE, tasa).catch(() => {})
      return json({ tasa }, 200, { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' })
    } catch (e) {
      console.warn(`Tasa: ${f.nombre} falló`, e instanceof Error ? e.message : e)
    }
  }
  const ultima = await leerJSON<Tasa>(LLAVE).catch(() => null)
  if (ultima) return json({ tasa: ultima, guardada: true })
  return json({ error: 'No se pudo obtener la tasa del BCV. Escríbela a mano.' }, 502)
}
