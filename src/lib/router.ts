import { useEffect, useState } from 'react'

let pasos = 0
window.addEventListener('hashchange', () => pasos++)

/** Hash routes like #/recetas/abc. Hash routing needs no server rewrites. */
export function useRuta(): string[] {
  const leer = () => window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean)
  const [ruta, setRuta] = useState(leer)
  useEffect(() => {
    const f = () => {
      setRuta(leer())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return ruta
}

export function parametro(nombre: string): string | null {
  const q = window.location.hash.split('?')[1]
  return q ? new URLSearchParams(q).get(nombre) : null
}

export function ir(ruta: string): void {
  window.location.hash = ruta.startsWith('#') ? ruta : `#${ruta}`
}

/** Goes back when there is in-app history, else to `respaldo`. */
export function volver(respaldo: string): void {
  if (pasos > 0) {
    pasos -= 2 // the back step itself fires hashchange too
    window.history.back()
  } else ir(respaldo)
}
