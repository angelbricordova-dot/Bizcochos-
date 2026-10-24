import { ArrowLeftRight, BarChart3, ChevronRight, MessageCircle, Settings, ShoppingBasket, ShoppingCart, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { fmtTasa } from '../lib/format'
import { useApp } from '../lib/store'

const ENLACES: { ruta: string; titulo: string; texto: string; icono: ReactNode }[] = [
  { ruta: 'cobrar', titulo: 'Cobrar', texto: 'Tu QR y datos de Pago Móvil para el cliente', icono: <Smartphone size={22} /> },
  { ruta: 'compras', titulo: 'Lista de compras', texto: 'Lo que hay que comprar para los encargos', icono: <ShoppingCart size={22} /> },
  { ruta: 'precios', titulo: 'Precios para WhatsApp', texto: 'La lista de precios de hoy, en $ y Bs', icono: <MessageCircle size={22} /> },
  { ruta: 'reportes', titulo: 'Reportes', texto: 'Ventas por mes, lo más vendido y tu meta', icono: <BarChart3 size={22} /> },
  { ruta: 'insumos', titulo: 'Insumos', texto: 'Lo que compras y cuánto cuesta', icono: <ShoppingBasket size={22} /> },
  { ruta: 'tasa', titulo: 'Tasa BCV', texto: 'Convertir entre dólares y bolívares', icono: <ArrowLeftRight size={22} /> },
  { ruta: 'ajustes', titulo: 'Ajustes', texto: 'Apariencia, meta, costos y respaldo', icono: <Settings size={22} /> },
]

export function Mas() {
  const { tasa } = useApp()
  return (
    <section className="pantalla">
      <header className="pantalla-cabeza">
        <h1>Más</h1>
      </header>
      <ul className="lista">
        {ENLACES.map((e) => (
          <li key={e.ruta}>
            <a href={`#/${e.ruta}`} className="fila">
              <span className="fila-icono" aria-hidden="true">
                {e.icono}
              </span>
              <span className="fila-principal">
                <span className="fila-titulo">{e.titulo}</span>
                <span className="fila-sub">{e.ruta === 'tasa' && tasa ? `Hoy: Bs. ${fmtTasa(tasa.valor)}` : e.texto}</span>
              </span>
              <ChevronRight size={18} className="tenue" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
