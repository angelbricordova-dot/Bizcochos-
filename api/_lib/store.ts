// Tiny Upstash Redis REST client. Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN.
// Outside Vercel with no credentials (local development) it falls back to memory.

const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN_REDIS = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

const memoria: Map<string, { valor: string; vence?: number }> =
  ((globalThis as Record<string, unknown>).__bizcochosMem as Map<string, { valor: string; vence?: number }>) ??
  ((globalThis as Record<string, unknown>).__bizcochosMem = new Map())

export const enVercel = Boolean(process.env.VERCEL)
export const storeConfigurado = Boolean(URL_REDIS && TOKEN_REDIS)
const usarMemoria = !storeConfigurado && !enVercel

export class StoreNoConfigurado extends Error {
  constructor() {
    super('La base de datos no está configurada. En Vercel: Storage → Upstash → Redis, y conéctala al proyecto.')
  }
}

async function comando<T>(...args: (string | number)[]): Promise<T> {
  if (usarMemoria) return memoriaComando(args) as T
  if (!storeConfigurado) throw new StoreNoConfigurado()
  const r = await fetch(URL_REDIS, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_REDIS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const j = (await r.json()) as { result?: T; error?: string }
  if (!r.ok || j.error) throw new Error(`Redis: ${j.error ?? r.status}`)
  return j.result as T
}

function memoriaComando(args: (string | number)[]): unknown {
  const [cmd, key, ...rest] = args.map(String)
  const ahora = Date.now()
  const e = memoria.get(key)
  const vivo = e && (!e.vence || e.vence > ahora) ? e : undefined
  switch (cmd.toUpperCase()) {
    case 'GET':
      return vivo?.valor ?? null
    case 'SET':
      memoria.set(key, { valor: rest[0] })
      return 'OK'
    case 'INCR': {
      const n = Number(vivo?.valor ?? 0) + 1
      memoria.set(key, { valor: String(n), vence: vivo?.vence })
      return n
    }
    case 'EXPIRE':
      if (vivo) vivo.vence = ahora + Number(rest[0]) * 1000
      return vivo ? 1 : 0
    case 'DEL':
      return memoria.delete(key) ? 1 : 0
    default:
      throw new Error(`Comando no soportado en memoria: ${cmd}`)
  }
}

export async function leerJSON<T>(key: string): Promise<T | null> {
  const v = await comando<string | null>('GET', key)
  if (v == null) return null
  try {
    return JSON.parse(v) as T
  } catch {
    return null
  }
}

export async function guardarJSON(key: string, valor: unknown): Promise<void> {
  await comando('SET', key, JSON.stringify(valor))
}

export async function incrementar(key: string, segundos: number): Promise<number> {
  const n = await comando<number>('INCR', key)
  if (n === 1) await comando('EXPIRE', key, segundos)
  return n
}

export async function leerNumeroGuardado(key: string): Promise<number> {
  return Number((await comando<string | null>('GET', key)) ?? 0)
}

export async function borrar(key: string): Promise<void> {
  await comando('DEL', key)
}
