import { ArrowLeftRight, CakeSlice, CloudOff, House, Loader2, ReceiptText, Settings, ShoppingBasket } from 'lucide-react'
import type { ReactNode } from 'react'
import { fmtTasa } from './lib/format'
import { useRuta } from './lib/router'
import { useApp } from './lib/store'
import { Ajustes } from './screens/Ajustes'
import { Cuentas, FormMovimiento } from './screens/Cuentas'
import { Entrar } from './screens/Entrar'
import { Inicio } from './screens/Inicio'
import { FormInsumo, Insumos } from './screens/Insumos'
import { EditorReceta, Recetas } from './screens/Recetas'
import { Tasa } from './screens/Tasa'

const PESTANAS: { ruta: string; texto: string; icono: ReactNode }[] = [
  { ruta: '', texto: 'Inicio', icono: <House size={22} /> },
  { ruta: 'insumos', texto: 'Insumos', icono: <ShoppingBasket size={22} /> },
  { ruta: 'recetas', texto: 'Recetas', icono: <CakeSlice size={22} /> },
  { ruta: 'cuentas', texto: 'Cuentas', icono: <ReceiptText size={22} /> },
  { ruta: 'tasa', texto: 'Tasa', icono: <ArrowLeftRight size={22} /> },
]

function Contenido({ ruta }: { ruta: string[] }) {
  const [a, b] = ruta
  switch (a) {
    case undefined:
      return <Inicio />
    case 'insumos':
      return b ? <FormInsumo key={b} id={b} /> : <Insumos />
    case 'recetas':
      return b ? <EditorReceta key={b} id={b} /> : <Recetas />
    case 'cuentas':
      return b ? <FormMovimiento key={b} id={b} /> : <Cuentas />
    case 'tasa':
      return <Tasa />
    case 'ajustes':
      return <Ajustes />
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

export function App() {
  const { sesion, datos, tasa } = useApp()
  const ruta = useRuta()

  if (sesion === 'cargando')
    return (
      <main className="entrar" aria-busy="true">
        <Loader2 size={28} className="girando" aria-label="Cargando" />
      </main>
    )
  if (sesion !== 'dentro') return <Entrar />

  const actual = ruta[0] ?? ''
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
        <a href="#/ajustes" className="boton-icono boton-icono-claro" aria-label="Ajustes">
          <Settings size={20} />
        </a>
      </header>
      <nav className="pestanas" aria-label="Secciones">
        <span className="pestanas-marca" aria-hidden="true">
          {datos.ajustes.nombreNegocio}
        </span>
        {PESTANAS.map((p) => (
          <a key={p.ruta} href={`#/${p.ruta}`} className="pestana" aria-current={actual === p.ruta ? 'page' : undefined}>
            {p.icono}
            <span>{p.texto}</span>
          </a>
        ))}
      </nav>
      <main className="contenido">
        <Contenido ruta={ruta} />
      </main>
    </div>
  )
}
