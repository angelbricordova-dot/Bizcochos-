import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cambiosDesde, COLECCIONES, datosVacios, esDatosValidos, mezclar, type Coleccion } from '../../shared/merge'
import type { Ajustes, Datos, Encargo, Insumo, Movimiento, Receta, Registro, Tasa } from '../../shared/types'

const LLAVE_DATOS = 'bizcochos:datos:v1'
const LLAVE_ENVIADO = 'bizcochos:enviado:v1'
const LLAVE_TASA = 'bizcochos:tasa:v1'
const LLAVE_TASA_MANUAL = 'bizcochos:tasa-manual:v1'
const LLAVE_TEMA = 'bizcochos:tema:v1'

export type Tema = 'auto' | 'claro' | 'oscuro'

export interface Aviso {
  id: number
  texto: string
  deshacer?: () => void
}

export type EstadoSync = 'guardado' | 'guardando' | 'pendiente' | 'error'
export type EstadoSesion = 'cargando' | 'fuera' | 'dentro' | 'sin-configurar'

function leerLocal<T>(llave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(llave)
    return v ? (JSON.parse(v) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function guardarLocal(llave: string, v: unknown): void {
  try {
    if (v === null) localStorage.removeItem(llave)
    else localStorage.setItem(llave, JSON.stringify(v))
  } catch {
    /* storage full or blocked: the server copy still holds the data */
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const r = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = (await r.json().catch(() => ({}))) as T
  return { ok: r.ok, status: r.status, data }
}

interface TasaGuardada {
  tasa: Tasa
  obtenida: number
}

interface Contexto {
  datos: Datos
  sesion: EstadoSesion
  mensajeSesion: string
  sync: EstadoSync
  tasa: Tasa | null
  tasaAuto: TasaGuardada | null
  tasaCargando: boolean
  tasaError: string
  entrar: (clave: string) => Promise<string | null>
  salir: () => Promise<void>
  guardarInsumo: (i: Insumo) => void
  guardarReceta: (r: Receta) => void
  guardarMovimiento: (m: Movimiento) => void
  guardarEncargo: (e: Encargo) => void
  /** Soft-deletes a record and offers to undo it. */
  borrar: (coleccion: Coleccion, id: string, texto?: string) => void
  aviso: Aviso | null
  avisar: (texto: string, deshacer?: () => void) => void
  cerrarAviso: () => void
  tema: Tema
  cambiarTema: (t: Tema) => void
  guardarAjustes: (a: Partial<Ajustes>) => void
  importar: (d: unknown) => boolean
  actualizarTasa: () => Promise<void>
  fijarTasaManual: (valor: number | null) => void
}

const Ctx = createContext<Contexto | null>(null)

export function useApp(): Contexto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera de <Proveedor>')
  return c
}

export function Proveedor({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos>(() => mezclar(leerLocal(LLAVE_DATOS, datosVacios()), null))
  const [sesion, setSesion] = useState<EstadoSesion>('cargando')
  const [mensajeSesion, setMensajeSesion] = useState('')
  const [sync, setSync] = useState<EstadoSync>('guardado')
  const [tasaAuto, setTasaAuto] = useState<TasaGuardada | null>(() => leerLocal(LLAVE_TASA, null))
  const [tasaManual, setTasaManual] = useState<Tasa | null>(() => leerLocal(LLAVE_TASA_MANUAL, null))
  const [tasaCargando, setTasaCargando] = useState(false)
  const [tasaError, setTasaError] = useState('')
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [tema, setTema] = useState<Tema>(() => leerLocal<Tema>(LLAVE_TEMA, 'auto'))

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'auto') delete raiz.dataset.tema
    else raiz.dataset.tema = tema
    const oscuro = tema === 'oscuro' || (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#170d14' : '#fff7fa')
  }, [tema])

  const avisoTimer = useRef<number | undefined>(undefined)
  const avisar = useCallback((texto: string, deshacer?: () => void) => {
    window.clearTimeout(avisoTimer.current)
    setAviso({ id: Date.now(), texto, deshacer })
    avisoTimer.current = window.setTimeout(() => setAviso(null), deshacer ? 6000 : 3200)
  }, [])

  const datosRef = useRef(datos)
  const enviadoHasta = useRef<number>(leerLocal(LLAVE_ENVIADO, 0))
  const temporizador = useRef<number | undefined>(undefined)
  const enviando = useRef(false)

  const aplicar = useCallback((d: Datos) => {
    datosRef.current = d
    guardarLocal(LLAVE_DATOS, d)
    setDatos(d)
  }, [])

  const tienePendientes = () => {
    const c = cambiosDesde(datosRef.current, enviadoHasta.current)
    return Object.keys(c).length > 0
  }

  const enviar = useCallback(async () => {
    if (enviando.current) return
    const marca = Math.max(
      enviadoHasta.current,
      ...COLECCIONES.flatMap((c) => Object.values(datosRef.current[c] as Record<string, Registro>).map((r) => r.updatedAt)),
      datosRef.current.ajustes.updatedAt,
    )
    const cambios = cambiosDesde(datosRef.current, enviadoHasta.current)
    if (!Object.keys(cambios).length) {
      setSync('guardado')
      return
    }
    enviando.current = true
    setSync('guardando')
    try {
      const r = await pedir<{ datos?: Datos; error?: string }>('/api/datos', {
        method: 'POST',
        body: JSON.stringify({ cambios }),
      })
      if (r.status === 401) {
        setSesion('fuera')
        setSync('pendiente')
        return
      }
      if (!r.ok || !r.data.datos) throw new Error(r.data.error ?? `HTTP ${r.status}`)
      enviadoHasta.current = marca
      guardarLocal(LLAVE_ENVIADO, marca)
      aplicar(mezclar(r.data.datos, datosRef.current))
      setSync(tienePendientes() ? 'pendiente' : 'guardado')
    } catch {
      setSync(navigator.onLine ? 'error' : 'pendiente')
    } finally {
      enviando.current = false
      if (tienePendientes()) programar(4000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicar])

  const programar = useCallback(
    (ms = 700) => {
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => void enviar(), ms)
    },
    [enviar],
  )

  const traer = useCallback(async () => {
    try {
      const r = await pedir<{ datos?: Datos; error?: string }>('/api/datos')
      if (r.status === 401) return setSesion('fuera')
      if (r.status === 503) {
        setMensajeSesion(r.data.error ?? '')
        return setSesion('sin-configurar')
      }
      if (!r.ok || !r.data.datos) throw new Error()
      setSesion('dentro')
      aplicar(mezclar(r.data.datos, datosRef.current))
      if (tienePendientes()) programar(100)
      else setSync('guardado')
    } catch {
      // Offline: work from the local copy and send later.
      setSesion((s) => (s === 'cargando' ? 'dentro' : s))
      setSync(tienePendientes() ? 'pendiente' : 'guardado')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicar, programar])

  // Session check on start.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const r = await pedir<{ activa?: boolean; error?: string }>('/api/sesion')
        if (!vivo) return
        if (r.status === 503) {
          setMensajeSesion(r.data.error ?? '')
          setSesion('sin-configurar')
        } else if (r.data.activa) await traer()
        else setSesion('fuera')
      } catch {
        // No network: trust a device that already has data.
        if (vivo) setSesion(Object.keys(datosRef.current.recetas).length || localStorage.getItem(LLAVE_ENVIADO) ? 'dentro' : 'fuera')
      }
    })()
    return () => {
      vivo = false
    }
  }, [traer])

  // Pull other devices' changes when the app comes back to the foreground; flush before leaving.
  useEffect(() => {
    if (sesion !== 'dentro') return
    const alVolver = () => {
      if (document.visibilityState === 'visible') void traer()
      else if (tienePendientes()) void enviar()
    }
    const enLinea = () => programar(200)
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', enLinea)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('online', enLinea)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, traer, enviar, programar])

  const cambiar = useCallback(
    (f: (d: Datos) => Datos) => {
      aplicar(f(datosRef.current))
      setSync('pendiente')
      programar()
    },
    [aplicar, programar],
  )

  const actualizarTasa = useCallback(async () => {
    setTasaCargando(true)
    setTasaError('')
    try {
      const r = await pedir<{ tasa?: Tasa; error?: string; guardada?: boolean }>('/api/tasa')
      if (!r.ok || !r.data.tasa) throw new Error(r.data.error ?? 'No se pudo obtener la tasa.')
      const g = { tasa: r.data.tasa, obtenida: Date.now() }
      guardarLocal(LLAVE_TASA, g)
      setTasaAuto(g)
      if (r.data.guardada) setTasaError('Las fuentes del BCV no respondieron; es la última tasa guardada.')
    } catch (e) {
      setTasaError(navigator.onLine ? (e as Error).message || 'No se pudo obtener la tasa.' : 'Sin conexión.')
    } finally {
      setTasaCargando(false)
    }
  }, [])

  useEffect(() => {
    void actualizarTasa()
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void actualizarTasa()
    }, 30 * 60 * 1000)
    return () => window.clearInterval(t)
  }, [actualizarTasa])

  const valor = useMemo<Contexto>(() => {
    const ahora = () => Date.now()
    return {
      datos,
      sesion,
      mensajeSesion,
      sync,
      tasa: tasaManual ?? tasaAuto?.tasa ?? null,
      tasaAuto,
      tasaCargando,
      tasaError,
      async entrar(clave) {
        try {
          const r = await pedir<{ activa?: boolean; error?: string }>('/api/sesion', {
            method: 'POST',
            body: JSON.stringify({ clave }),
          })
          if (!r.ok) return r.data.error ?? 'No se pudo entrar.'
          await traer()
          return null
        } catch {
          return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
        }
      },
      async salir() {
        if (tienePendientes()) await enviar()
        await pedir('/api/sesion', { method: 'DELETE' }).catch(() => {})
        // Leave nothing behind on a shared device; the server keeps the data.
        if (!tienePendientes()) {
          enviadoHasta.current = 0
          guardarLocal(LLAVE_ENVIADO, null)
          aplicar(datosVacios())
        }
        setSesion('fuera')
      },
      guardarInsumo: (i) => cambiar((d) => ({ ...d, insumos: { ...d.insumos, [i.id]: { ...i, updatedAt: ahora() } } })),
      guardarReceta: (r) => cambiar((d) => ({ ...d, recetas: { ...d.recetas, [r.id]: { ...r, updatedAt: ahora() } } })),
      guardarMovimiento: (m) =>
        cambiar((d) => ({ ...d, movimientos: { ...d.movimientos, [m.id]: { ...m, updatedAt: ahora() } } })),
      guardarEncargo: (e) => cambiar((d) => ({ ...d, encargos: { ...d.encargos, [e.id]: { ...e, updatedAt: ahora() } } })),
      borrar(c, id, texto) {
        const rec = datosRef.current[c][id] as Registro | undefined
        if (!rec) return
        const marcar = (deleted: boolean) =>
          cambiar((d) => {
            const actual = d[c][id] as Registro | undefined
            return actual ? { ...d, [c]: { ...d[c], [id]: { ...actual, deleted, updatedAt: ahora() } } } : d
          })
        marcar(true)
        avisar(texto ?? 'Borrado', () => {
          marcar(false)
          setAviso(null)
        })
      },
      aviso,
      avisar,
      cerrarAviso: () => setAviso(null),
      tema,
      cambiarTema(t) {
        guardarLocal(LLAVE_TEMA, t)
        setTema(t)
      },
      guardarAjustes: (a) => cambiar((d) => ({ ...d, ajustes: { ...d.ajustes, ...a, updatedAt: ahora() } })),
      importar(v) {
        if (!esDatosValidos(v)) return false
        // Re-stamp imported records so they are sent to the server as changes.
        const t = ahora()
        const sellar = <T extends { updatedAt: number }>(col?: Record<string, T>) =>
          Object.fromEntries(Object.entries(col ?? {}).map(([k, r]) => [k, { ...r, updatedAt: Math.max(r.updatedAt, t) }]))
        cambiar((d) =>
          mezclar(d, {
            insumos: sellar(v.insumos),
            recetas: sellar(v.recetas),
            movimientos: sellar(v.movimientos),
            encargos: sellar(v.encargos),
            ...(v.ajustes ? { ajustes: { ...d.ajustes, ...v.ajustes, updatedAt: t } } : {}),
          }),
        )
        return true
      },
      actualizarTasa,
      fijarTasaManual(v) {
        const t = v && v > 0 ? { valor: v, fecha: new Date().toISOString(), fuente: 'Escrita a mano', manual: true } : null
        guardarLocal(LLAVE_TASA_MANUAL, t)
        setTasaManual(t)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, sesion, mensajeSesion, sync, tasaAuto, tasaManual, tasaCargando, tasaError, aviso, tema, cambiar, traer, enviar, actualizarTasa, avisar])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/** Today's rate as a number; 0 when unknown. */
export function useTasa(): number {
  return useApp().tasa?.valor ?? 0
}

export function vivos<T extends { deleted?: boolean }>(col: Record<string, T>): T[] {
  return Object.values(col).filter((r) => !r.deleted)
}
