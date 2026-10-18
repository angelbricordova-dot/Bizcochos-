import { claveConfigurada, claveCorrecta, cookieCerrar, cookieSesion, sesionValida } from './_lib/auth.js'
import { error, ipDe, json, leerCuerpo } from './_lib/http.js'
import { borrar, incrementar, leerNumeroGuardado, StoreNoConfigurado } from './_lib/store.js'

const MAX_INTENTOS = 8
const VENTANA_S = 15 * 60

/** Is this browser signed in? */
export async function GET(request: Request): Promise<Response> {
  if (!claveConfigurada()) return error('Falta configurar APP_PASSWORD en Vercel.', 503)
  return json({ activa: sesionValida(request) })
}

/** Sign in with the shared password. */
export async function POST(request: Request): Promise<Response> {
  if (!claveConfigurada()) return error('Falta configurar APP_PASSWORD en Vercel.', 503)
  let clave = ''
  try {
    const body = (await leerCuerpo(request, 2_000)) as { clave?: unknown }
    clave = typeof body.clave === 'string' ? body.clave : ''
  } catch {
    return error('Solicitud inválida.', 400)
  }
  const llave = `bizcochos:fallos:${ipDe(request)}`
  const bloqueado = () => error('Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.', 429)
  try {
    // The lock is checked before the password, so a locked-out guesser learns nothing.
    if ((await leerNumeroGuardado(llave)) >= MAX_INTENTOS) return bloqueado()
    if (claveCorrecta(clave)) {
      await borrar(llave).catch(() => {})
      return json({ activa: true }, 200, { 'Set-Cookie': cookieSesion(request) })
    }
    if ((await incrementar(llave, VENTANA_S)) >= MAX_INTENTOS) return bloqueado()
  } catch (e) {
    if (e instanceof StoreNoConfigurado) return error(e.message, 503)
    throw e
  }
  return error('Contraseña incorrecta.', 401)
}

/** Sign out. */
export async function DELETE(): Promise<Response> {
  return json({ activa: false }, 200, { 'Set-Cookie': cookieCerrar() })
}
