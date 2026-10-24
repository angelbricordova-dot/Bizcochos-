import {
  ArrowLeftRight,
  BarChart3,
  CakeSlice,
  CalendarDays,
  CloudOff,
  House,
  LayoutGrid,
  Loader2,
  MessageCircle,
  ReceiptText,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  X,
} from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { encargoAbierto } from '../shared/calc'
import { fmtTasa, hoy } from './lib/format'
import { useRuta } from './lib/router'
import { useApp, vivos } from './lib/store'
import { Ajustes } from './screens/Ajustes'
import { Cobrar } from './screens/Cobrar'
import { Compras } from './screens/Compras'
import { Cuentas, FormMovimiento } from './screens/Cuentas'
import { Encargos, FormEncargo } from './screens/Encargos'
import { Entrar } from './screens/Entrar'
import { Inicio } from './screens/Inicio'
import { FormInsumo, Insumos } from './screens/Insumos'
import { Mas } from './screens/Mas'
import { Precios } from './screens/Precios'
import { EditorProducto, Productos } from './screens/Productos'
import { Reportes } from './screens/Reportes'
import { Tasa } from './screens/Tasa'

interface Pestana {
  ruta: string
  texto: string
  icono: ReactNode
  /** Routes that light this tab up besides its own. */
  tambien?: string[]
}

// Phone tab bar: the daily jobs, plus a hub for the rest.
const PESTANAS: Pestana[] = [
  { ruta: '', texto: 'Inicio', icono: <House size={22} /> },
  { ruta: 'encargos', texto: 'Encargos', icono: <CalendarDays size={22} /> },
  { ruta: 'productos', texto: 'Productos', icono: <CakeSlice size={22} /> },
  { ruta: 'cuentas', texto: 'Cuentas', icono: <ReceiptText size={22} /> },
  { ruta: 'mas', texto: 'Más', icono: <LayoutGrid size={22} />, tambien: ['cobrar', 'insumos', 'compras', 'precios', 'reportes', 'tasa', 'ajustes'] },
]

// Desktop rail: everything at once.
const RIEL: Pestana[] = [
  PESTANAS[0],
  PESTANAS[1],
  PESTANAS[2],
  PESTANAS[3],
  { ruta: 'cobrar', texto: 'Cobrar', icono: <Smartphone size={20} /> },
  { ruta: 'compras', texto: 'Lista de compras', icono: <ShoppingCart size={20} /> },
  { ruta: 'precios', texto: 'Precios WhatsApp', icono: <MessageCircle size={20} /> },
  { ruta: 'reportes', texto: 'Reportes', icono: <BarChart3 size={20} /> },
  { ruta: 'insumos', texto: 'Insumos', icono: <ShoppingBasket size={20} /> },
  { ruta: 'tasa', texto: 'Tasa BCV', icono: <ArrowLeftRight size={20} /> },
]

function Contenido({ ruta }: { ruta: string[] }) {
  const [a, b] = ruta
  switch (a) {
    case undefined:
      return <Inicio />
    case 'encargos':
      return b ? <FormEncargo key={b} id={b} /> : <Encargos />
    case 'productos':
    case 'recetas': // links saved before the rename
      return b ? <EditorProducto key={b} id={b === 'nueva' ? 'nuevo' : b} /> : <Productos />
    case 'cuentas':
      return b ? <FormMovimiento key={b} id={b} /> : <Cuentas />
    case 'insumos':
      return b ? <FormInsumo key={b} id={b} /> : <Insumos />
    case 'cobrar':
      return <Cobrar />
    case 'compras':
      return <Compras />
    case 'precios':
      return <Precios />
    case 'reportes':
      return <Reportes />
    case 'tasa':
      return <Tasa />
    case 'ajustes':
      return <Ajustes />
    case 'mas':
      return <Mas />
    default:
      return <Inicio />
  }
}

function EstadoGuardado() {
  const { sync } = useApp()
  if (sync === 'guardado') return null
  const texto =
    sync === 'guardando' ? 'Guardando…' : sync === 'pendiente' ? 'Sin conexión: se guardará al volver' : 'No se pudo guardar; reintentando'
  return (
    <span className="estado-guardado" role="status" data-estado={sync}>
      {sync === 'guardando' ? <Loader2 size={14} className="girando" /> : <CloudOff size={14} />}
      <span>{texto}</span>
    </span>
  )
}

/** Confirmation after saving or deleting, with undo where it applies. */
function AvisoFlotante() {
  const { aviso, cerrarAviso } = useApp()
  if (!aviso) return null
  return (
    <div className="aviso-flotante" role="status" key={aviso.id}>
      <span>{aviso.texto}</span>
      {aviso.deshacer ? (
        <button type="button" className="aviso-accion" onClick={aviso.deshacer}>
          Deshacer
        </button>
      ) : (
        <button type="button" className="aviso-cerrar" onClick={cerrarAviso} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function activa(p: Pestana, actual: string): boolean {
  return actual === p.ruta || (p.ruta === 'productos' && actual === 'recetas') || (p.tambien?.includes(actual) ?? false)
}

export function App() {
  const { sesion, datos, tasa } = useApp()
  const ruta = useRuta()

  // A raised header once the page scrolls.
  useEffect(() => {
    const f = () => document.documentElement.toggleAttribute('data-desplazado', window.scrollY > 4)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  if (sesion === 'cargando')
    return (
      <main className="entrar" aria-busy="true">
        <Loader2 size={28} className="girando" aria-label="Cargando" />
      </main>
    )
  if (sesion !== 'dentro') return <Entrar />

  const actual = ruta[0] ?? ''
  const paraHoy = vivos(datos.encargos).filter((e) => encargoAbierto(e) && e.entrega <= hoy()).length

  return (
    <div className="app">
      <header className="cabecera">
        <a href="#/" className="marca">
          {datos.ajustes.nombreNegocio}
        </a>
        <EstadoGuardado />
        <a href="#/tasa" className="chip-tasa" aria-label={`Tasa BCV: ${tasa ? fmtTasa(tasa.valor) : 'sin tasa'} bolívares por dólar`}>
          <span className="chip-tasa-etiqueta">BCV</span>
          <span className="num">{tasa ? fmtTasa(tasa.valor) : '—'}</span>
        </a>
        <a href="#/ajustes" className="boton-icono" aria-label="Ajustes">
          <Settings size={20} />
        </a>
      </header>
      <nav className="pestanas" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <a key={p.ruta} href={`#/${p.ruta}`} className="pestana" aria-current={activa(p, actual) ? 'page' : undefined}>
            <span className="pestana-icono">
              {p.icono}
              {p.ruta === 'encargos' && paraHoy > 0 && <span className="punto" aria-label={`${paraHoy} para hoy`} />}
            </span>
            <span>{p.texto}</span>
          </a>
        ))}
      </nav>
      <nav className="riel" aria-label="Secciones">
        <a href="#/" className="riel-marca">
          {datos.ajustes.nombreNegocio}
        </a>
        {RIEL.map((p) => (
          <a key={p.ruta} href={`#/${p.ruta}`} className="riel-enlace" aria-current={activa({ ...p, tambien: undefined }, actual) ? 'page' : undefined}>
            {p.icono}
            <span>{p.texto}</span>
            {p.ruta === 'encargos' && paraHoy > 0 && <span className="riel-cuenta num">{paraHoy}</span>}
          </a>
        ))}
        <a href="#/ajustes" className="riel-enlace riel-abajo" aria-current={actual === 'ajustes' ? 'page' : undefined}>
          <Settings size={20} />
          <span>Ajustes</span>
        </a>
      </nav>
      <main className="contenido">
        <Contenido ruta={ruta} />
      </main>
      <AvisoFlotante />
    </div>
  )
}
