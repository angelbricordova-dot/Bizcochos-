import { Check, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { FACTOR, listaCompras, type LineaCompra } from '../../shared/calc'
import { Pantalla, Segmentos, Vacio } from '../components/ui'
import { enBs, fmtNum, fmtUSD, hoy, sumarDias } from '../lib/format'
import { useApp, useTasa, vivos } from '../lib/store'
import { compartir, enlaceWhatsApp } from '../lib/whatsapp'

const LLAVE = 'bizcochos:compras-hechas:v1'

/** "1,25 kg", "350 g", "14 und". */
export function cantidadLegible(base: 'g' | 'ml' | 'und', v: number): string {
  if (base === 'und') return `${fmtNum(Math.ceil(v - 1e-9))} und`
  if (v >= 1000) return `${fmtNum(Math.round(v / 10) / 100)} ${base === 'g' ? 'kg' : 'L'}`
  return `${fmtNum(Math.round(v))} ${base}`
}

/** "2 paquetes de 500 g"; nothing for things bought one by one. */
function paqueteTexto(l: LineaCompra): string {
  const i = l.insumo
  if (i.unidad === 'und' && i.cantidad === 1) return ''
  const tam = `${fmtNum(i.cantidad)} ${i.unidad}`
  return `${l.paquetes} ${l.paquetes === 1 ? 'paquete' : 'paquetes'} de ${tam}`
}

function leerHechas(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LLAVE) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function Compras() {
  const { datos } = useApp()
  const tasa = useTasa()
  const [dias, setDias] = useState<'3' | '7' | '14' | 'todo'>('7')
  const [hechas, setHechas] = useState<Set<string>>(() => new Set(leerHechas()))

  const desde = '0000-00-00'
  const hasta = dias === 'todo' ? '9999-12-31' : sumarDias(hoy(), Number(dias))
  const { lineas, encargos, sinReceta } = listaCompras(vivos(datos.encargos), datos.recetas, datos.insumos, desde, hasta)
  const faltan = lineas.filter((l) => !hechas.has(l.insumo.id))
  const costo = faltan.reduce((s, l) => s + l.costoPaquetes, 0)

  const marcar = (id: string) => {
    const s = new Set(hechas)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setHechas(s)
    try {
      localStorage.setItem(LLAVE, JSON.stringify([...s]))
    } catch {
      /* per-device convenience only */
    }
  }

  const texto = [
    `Lista de compras (${encargos} ${encargos === 1 ? 'encargo' : 'encargos'})`,
    '',
    ...faltan.map((l) => `• ${l.insumo.nombre.replace(/ \(ejemplo\)$/, '')}: ${cantidadLegible(FACTOR[l.insumo.unidad].base, l.necesario)}${paqueteTexto(l) ? ` (${paqueteTexto(l)})` : ''}`),
    '',
    `Aprox. ${fmtUSD(costo)}${tasa > 0 ? ` · ${enBs(costo, tasa)}` : ''}`,
  ].join('\n')

  return (
    <Pantalla titulo="Lista de compras" atras="/mas">
      <p className="tenue">Lo que necesitas para los encargos pendientes, según tus productos.</p>
      <Segmentos
        etiqueta="Encargos de"
        valor={dias}
        onCambio={setDias}
        opciones={[
          { valor: '3', texto: '3 días' },
          { valor: '7', texto: '7 días' },
          { valor: '14', texto: '14 días' },
          { valor: 'todo', texto: 'Todos' },
        ]}
      />
      {lineas.length === 0 ? (
        <Vacio
          titulo={encargos ? 'Esos encargos no usan productos con ingredientes' : 'No hay encargos pendientes en esos días'}
          accion={
            <a className="boton boton-primario" href="#/encargos/nuevo">
              Anotar encargo
            </a>
          }
        >
          Cuando anotes encargos con tus productos, aquí sale cuánta harina, huevos, queso y empaque hace falta comprar.
        </Vacio>
      ) : (
        <>
          <dl className="renglones">
            <div>
              <dt>
                Para {encargos} {encargos === 1 ? 'encargo' : 'encargos'}
              </dt>
              <dd className="num">
                {fmtUSD(costo)} <span className="bs pequeno">{enBs(costo, tasa)}</span>
              </dd>
            </div>
          </dl>
          {sinReceta > 0 && (
            <p className="aviso">
              {sinReceta} {sinReceta === 1 ? 'producto anotado como “otra cosa” no cuenta' : 'productos anotados como “otra cosa” no cuentan'} en la lista.
            </p>
          )}
          <ul className="lista lista-compras">
            {lineas.map((l) => {
              const hecha = hechas.has(l.insumo.id)
              return (
                <li key={l.insumo.id}>
                  <label className="fila fila-check" data-hecha={hecha ? '' : undefined}>
                    <input type="checkbox" checked={hecha} onChange={() => marcar(l.insumo.id)} />
                    <span className="check-caja" aria-hidden="true">
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <span className="fila-principal">
                      <span className="fila-titulo">{l.insumo.nombre}</span>
                      <span className="fila-sub">
                        Necesitas {cantidadLegible(FACTOR[l.insumo.unidad].base, l.necesario)}
                        {paqueteTexto(l) && ` · ${paqueteTexto(l)}`}
                      </span>
                    </span>
                    <span className="fila-cifra num">{fmtUSD(l.costoPaquetes)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="tenue pequeno">Marca lo que ya tienes o ya compraste. Las marcas se guardan en este teléfono.</p>
          <div className="fila-botones">
            <a className="boton boton-whatsapp" href={enlaceWhatsApp(texto)} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Enviar por WhatsApp
            </a>
            {'share' in navigator && (
              <button type="button" className="boton boton-secundario" onClick={() => void compartir(texto, 'Lista de compras')}>
                Compartir
              </button>
            )}
          </div>
        </>
      )}
    </Pantalla>
  )
}
