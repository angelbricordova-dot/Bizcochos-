import { esDatosValidos, mezclar } from '../shared/merge.js'
import type { Datos } from '../shared/types.js'
import { sesionValida } from './_lib/auth.js'
import { error, json, leerCuerpo } from './_lib/http.js'
import { guardarJSON, leerJSON, StoreNoConfigurado } from './_lib/store.js'

const LLAVE = 'bizcochos:datos'
const MAX_BYTES = 4_000_000

function fallo(e: unknown): Response {
  if (e instanceof StoreNoConfigurado) return error(e.message, 503)
  console.error(e)
  return error('No se pudo leer o guardar en la base de datos.', 502)
}

/** All the business data. */
export async function GET(request: Request): Promise<Response> {
  if (!sesionValida(request)) return error('Inicia sesión.', 401)
  try {
    const datos = mezclar(await leerJSON<Datos>(LLAVE), null)
    return json({ datos })
  } catch (e) {
    return fallo(e)
  }
}

/** Merge the records a device changed into the stored copy and return the result. */
export async function POST(request: Request): Promise<Response> {
  if (!sesionValida(request)) return error('Inicia sesión.', 401)
  let cambios: unknown
  try {
    cambios = ((await leerCuerpo(request, MAX_BYTES)) as { cambios?: unknown }).cambios
  } catch {
    return error('Los datos enviados no son válidos.', 400)
  }
  if (!esDatosValidos(cambios)) return error('Los datos enviados no son válidos.', 400)
  try {
    const datos = mezclar(await leerJSON<Datos>(LLAVE), cambios)
    await guardarJSON(LLAVE, datos)
    return json({ datos })
  } catch (e) {
    return fallo(e)
  }
}
