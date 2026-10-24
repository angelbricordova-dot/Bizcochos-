import { Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { desglose, tienePorciones } from '../../shared/calc'
import { Pantalla, Vacio } from '../components/ui'
import { fmtBs, fmtTasa, fmtUSD } from '../lib/format'
import { useApp, useTasa, vivos } from '../lib/store'
import { tieneDatosPago, textoPago } from '../lib/pago'
import { compartir, copiar, enlaceWhatsApp } from '../lib/whatsapp'

/** Today's price list, ready to send to clients or post as a status. */
export function Precios() {
  const { datos } = useApp()
  const tasa = useTasa()
  const productos = vivos(datos.recetas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const [fuera, setFuera] = useState<Set<string>>(() => new Set())
  const [conBs, setConBs] = useState(true)
  const pago = datos.ajustes.pago
  const [conPago, setConPago] = useState(tieneDatosPago(pago))
  const [copiado, setCopiado] = useState(false)

  const elegidos = productos.filter((p) => !fuera.has(p.id))
  const bs = (v: number) => (conBs && tasa > 0 ? ` (${fmtBs(v * tasa)})` : '')
  const nombre = (s: string) => s.replace(/ \(ejemplo\)$/, '')
  const hoyTexto = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
  const texto = [
    `*${datos.ajustes.nombreNegocio}*`,
    `Precios de hoy, ${hoyTexto}`,
    '',
    ...elegidos.flatMap((p) => {
      const d = desglose(p, datos.insumos, datos.ajustes)
      const lineas = [`• ${nombre(p.nombre)}: ${fmtUSD(d.entero.precio)}${bs(d.entero.precio)}`]
      if (tienePorciones(p)) lineas.push(`   Porción: ${fmtUSD(d.porcion.precio)}${bs(d.porcion.precio)}`)
      return lineas
    }),
    '',
    ...(conBs && tasa > 0 ? [`Tasa BCV: Bs. ${fmtTasa(tasa)}`] : []),
    ...(conPago && tieneDatosPago(pago) ? ['', textoPago(pago), ''] : []),
    'Haz tu pedido por aquí.',
  ].join('\n')

  if (productos.length === 0) {
    return (
      <Pantalla titulo="Precios para WhatsApp" atras="/mas">
        <Vacio
          titulo="Primero crea tus productos"
          accion={
            <a className="boton boton-primario" href="#/productos/nuevo">
              Crear producto
            </a>
          }
        >
          Con tus productos y la tasa del día armamos la lista de precios lista para mandar.
        </Vacio>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Precios para WhatsApp" atras="/mas">
      <p className="tenue">Elige qué productos van en la lista. Los precios en bolívares usan la tasa BCV de hoy.</p>
      <ul className="lista">
        {productos.map((p) => {
          const dentro = !fuera.has(p.id)
          return (
            <li key={p.id}>
              <label className="fila fila-check" data-hecha={dentro ? undefined : ''}>
                <input
                  type="checkbox"
                  checked={dentro}
                  onChange={() => {
                    const s = new Set(fuera)
                    if (dentro) s.add(p.id)
                    else s.delete(p.id)
                    setFuera(s)
                  }}
                />
                <span className="check-caja" aria-hidden="true">
                  <Check size={16} strokeWidth={3} />
                </span>
                <span className="fila-principal">
                  <span className="fila-titulo">{p.nombre}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <label className="interruptor">
        <input type="checkbox" checked={conBs} onChange={(e) => setConBs(e.target.checked)} />
        <span>Incluir precios en bolívares</span>
      </label>
      {tieneDatosPago(pago) && (
        <label className="interruptor">
          <input type="checkbox" checked={conPago} onChange={(e) => setConPago(e.target.checked)} />
          <span>Incluir datos de Pago Móvil</span>
        </label>
      )}
      <div className="burbuja" aria-label="Vista previa del mensaje">
        <pre>{texto}</pre>
      </div>
      <div className="fila-botones">
        <a className="boton boton-whatsapp" href={enlaceWhatsApp(texto)} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Enviar por WhatsApp
        </a>
        {'share' in navigator && (
          <button type="button" className="boton boton-secundario" onClick={() => void compartir(texto, 'Precios')}>
            Compartir
          </button>
        )}
        <button
          type="button"
          className="boton boton-secundario"
          onClick={async () => {
            setCopiado(await copiar(texto))
            window.setTimeout(() => setCopiado(false), 2000)
          }}
        >
          {copiado ? <Check size={18} /> : <Copy size={18} />} {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </Pantalla>
  )
}
