import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { enVercel } from './store.js'

const COOKIE = 'bizcochos_sesion'
const DURACION_S = 60 * 60 * 24 * 90

/** Password from Vercel's environment. Local development without one uses "bizcocho". */
export function claveConfigurada(): string | null {
  const p = process.env.APP_PASSWORD
  if (p) return p
  return enVercel ? null : 'bizcocho'
}

function secreto(): Buffer {
  if (process.env.SESSION_SECRET) return Buffer.from(process.env.SESSION_SECRET)
  // Derived from the password, so changing the password signs everyone out.
  return createHash('sha256').update(`mis-bizcochos:${claveConfigurada() ?? ''}`).digest()
}

function firma(texto: string): string {
  return createHmac('sha256', secreto()).update(texto).digest('base64url')
}

function iguales(a: string, b: string): boolean {
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y)
}

export function claveCorrecta(intento: string): boolean {
  const clave = claveConfigurada()
  return clave !== null && iguales(intento, clave)
}

export function cookieSesion(request: Request): string {
  const vence = Math.floor(Date.now() / 1000) + DURACION_S
  const valor = `${vence}.${firma(String(vence))}`
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURACION_S}${seguro}`
}

export function cookieCerrar(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function sesionValida(request: Request): boolean {
  if (!claveConfigurada()) return false
  const cookies = request.headers.get('cookie') ?? ''
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (!m) return false
  const [vence, sello] = m[1].split('.')
  if (!vence || !sello || Number(vence) * 1000 < Date.now()) return false
  return iguales(sello, firma(vence))
}
