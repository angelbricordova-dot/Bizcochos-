import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { aUSD, costoPorBase, FACTOR } from '../../shared/calc'
import type { Insumo, Moneda, UnidadCompra } from '../../shared/types'
import { Campo, Confirmar, Numero, Pantalla, Segmentos, Vacio } from '../components/ui'
import { enBs, fmtBs, fmtNum, fmtUSD, fmtUSDfino, uid } from '../lib/format'
import { ir, volver } from '../lib/router'
import { useApp, useTasa, vivos } from '../lib/store'

const UNIDADES: { valor: UnidadCompra; texto: string }[] = [
  { valor: 'kg', texto: 'kg' },
  { valor: 'g', texto: 'g' },
  { valor: 'L', texto: 'L' },
  { valor: 'ml', texto: 'ml' },
  { valor: 'und', texto: 'unidades' },
]

/** "$0,24 por 100 g": a unit cost a baker can read. */
export function costoLegible(i: Insumo): string {
  const base = FACTOR[i.unidad].base
  const c = costoPorBase(i)
  if (base === 'und') return `${fmtUSDfino(c)} c/u`
  return `${fmtUSDfino(c * 100)} por 100 ${base}`
}

export function Insumos() {
  const { datos } = useApp()
  const tasa = useTasa()
  const [q, setQ] = useState('')
  const lista = useMemo(
    () =>
      vivos(datos.insumos)
        .filter((i) => i.nombre.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [datos.insumos, q],
  )
  const total = vivos(datos.insumos).length
  const grupos = [
    { titulo: 'Ingredientes', items: lista.filter((i) => i.tipo === 'ingrediente') },
    { titulo: 'Empaque', items: lista.filter((i) => i.tipo === 'empaque') },
  ]

  return (
    <Pantalla
      titulo="Insumos"
      accion={
        <a className="boton boton-primario boton-chico" href="#/insumos/nuevo">
          <Plus size={18} /> Nuevo
        </a>
      }
    >
      {total === 0 ? (
        <Vacio
          titulo="Anota lo que compras"
          accion={
            <a className="boton boton-primario" href="#/insumos/nuevo">
              <Plus size={18} /> Agregar el primer insumo
            </a>
          }
        >
          Harina, huevos, azúcar, la caja… Escribe cuánto trae el paquete y cuánto te costó, en dólares o en bolívares.
          La app calcula cuánto cuesta cada gramo para tus recetas.
        </Vacio>
      ) : (
        <>
          <label className="buscador">
            <Search size={18} aria-hidden="true" />
            <span className="solo-lector">Buscar insumo</span>
            <input type="search" placeholder="Buscar insumo" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {lista.length === 0 && <p className="tenue centro">Ningún insumo se llama “{q}”.</p>}
          {grupos.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.titulo} className="grupo">
                  <h2 className="grupo-titulo">{g.titulo}</h2>
                  <ul className="lista">
                    {g.items.map((i) => (
                      <li key={i.id}>
                        <a href={`#/insumos/${i.id}`} className="fila">
                          <span className="fila-principal">
                            <span className="fila-titulo">{i.nombre}</span>
                            <span className="fila-sub">
                              {fmtNum(i.cantidad)} {i.unidad === 'und' ? 'und' : i.unidad} · {costoLegible(i)}
                            </span>
                          </span>
                          <span className="fila-cifra">
                            <span className="num">{fmtUSD(i.precioUSD)}</span>
                            <span className="fila-sub num">{enBs(i.precioUSD, tasa)}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </>
      )}
    </Pantalla>
  )
}

export function FormInsumo({ id }: { id: string }) {
  const { datos, guardarInsumo, borrar } = useApp()
  const tasaHoy = useTasa()
  const existente = id !== 'nuevo' ? datos.insumos[id] : undefined
  const [f, setF] = useState<Omit<Insumo, 'updatedAt' | 'precioUSD'>>(
    () =>
      existente ?? {
        id: uid(),
        nombre: '',
        tipo: 'ingrediente',
        cantidad: 1,
        unidad: 'kg',
        precio: NaN,
        moneda: 'USD',
      },
  )
  const [intento, setIntento] = useState(false)
  // A price typed in Bs keeps the rate of the day it was typed; editing the price re-takes today's.
  const [tasa, setTasa] = useState<number>(existente?.moneda === 'VES' && existente.tasa ? existente.tasa : tasaHoy)

  if (id !== 'nuevo' && !existente) {
    return (
      <Pantalla titulo="Insumo" atras="/insumos">
        <Vacio titulo="Este insumo ya no existe">Puede que lo hayas borrado desde otro dispositivo.</Vacio>
      </Pantalla>
    )
  }

  const precioUSD = aUSD(f.precio, f.moneda, tasa)
  const errores = {
    nombre: !f.nombre.trim() ? 'Escribe el nombre.' : '',
    cantidad: !(f.cantidad > 0) ? 'Escribe cuánto trae el paquete.' : '',
    precio: !(f.precio >= 0) ? 'Escribe el precio del paquete.' : '',
    tasa: f.moneda === 'VES' && !(tasa > 0) ? 'Falta la tasa BCV para pasar a dólares.' : '',
  }
  const valido = !Object.values(errores).some(Boolean)
  const err = (k: keyof typeof errores) => (intento ? errores[k] : '')

  const guardar = () => {
    setIntento(true)
    if (!valido) return
    guardarInsumo({
      ...f,
      nombre: f.nombre.trim(),
      precioUSD,
      tasa: f.moneda === 'VES' ? tasa : undefined,
      updatedAt: 0,
    })
    volver('/insumos')
  }

  const vistaPrevia: Insumo = { ...f, precioUSD, updatedAt: 0 }

  return (
    <Pantalla titulo={existente ? 'Editar insumo' : 'Nuevo insumo'} atras="/insumos">
      <form
        className="formulario"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
        noValidate
      >
        <Campo etiqueta="Nombre" error={err('nombre')}>
          {(i, d) => (
            <input
              id={i}
              aria-describedby={d}
              value={f.nombre}
              placeholder="Harina de trigo"
              autoFocus={!existente}
              onChange={(e) => setF({ ...f, nombre: e.target.value })}
            />
          )}
        </Campo>
        <Segmentos
          etiqueta="Tipo"
          valor={f.tipo}
          onCambio={(tipo) => setF({ ...f, tipo })}
          opciones={[
            { valor: 'ingrediente', texto: 'Ingrediente' },
            { valor: 'empaque', texto: 'Empaque' },
          ]}
        />
        <div className="dos-columnas">
          <Campo etiqueta="El paquete trae" error={err('cantidad')}>
            {(i, d) => <Numero id={i} describedBy={d} valor={f.cantidad} onCambio={(cantidad) => setF({ ...f, cantidad })} />}
          </Campo>
          <Campo etiqueta="Unidad">
            {(i) => (
              <select id={i} value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value as UnidadCompra })}>
                {UNIDADES.map((u) => (
                  <option key={u.valor} value={u.valor}>
                    {u.texto}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        </div>
        <Campo etiqueta="Precio del paquete" error={err('precio')}>
          {(i, d) => (
            <div className="precio-moneda">
              <Numero
                id={i}
                describedBy={d}
                prefijo={f.moneda === 'USD' ? '$' : 'Bs.'}
                valor={Number.isNaN(f.precio) ? undefined : f.precio}
                onCambio={(precio) => {
                  setF({ ...f, precio })
                  if (f.moneda === 'VES') setTasa(tasaHoy || tasa)
                }}
              />
              <Segmentos<Moneda>
                etiqueta="Moneda"
                valor={f.moneda}
                onCambio={(moneda) => {
                  setF({ ...f, moneda })
                  if (moneda === 'VES') setTasa(tasaHoy || tasa)
                }}
                opciones={[
                  { valor: 'USD', texto: '$' },
                  { valor: 'VES', texto: 'Bs' },
                ]}
              />
            </div>
          )}
        </Campo>
        {f.moneda === 'VES' && (
          <Campo
            etiqueta="Tasa BCV usada"
            error={err('tasa')}
            ayuda="Se guarda en dólares con esta tasa, para que el costo no cambie cuando suba el dólar."
          >
            {(i, d) => <Numero id={i} describedBy={d} valor={tasa || undefined} sufijo="Bs/$" onCambio={setTasa} />}
          </Campo>
        )}

        <div className="resultado" aria-live="polite">
          {f.cantidad > 0 && f.precio >= 0 && (f.moneda === 'USD' || tasa > 0) ? (
            <>
              <span className="resultado-cifra num">{costoLegible(vistaPrevia)}</span>
              <span className="tenue num">
                Paquete: {fmtUSD(precioUSD)}
                {f.moneda === 'VES' ? ` (${fmtBs(f.precio)})` : ` · ${enBs(precioUSD, tasaHoy)}`}
              </span>
            </>
          ) : (
            <span className="tenue">Escribe cantidad y precio para ver el costo por gramo o por unidad.</span>
          )}
        </div>

        <div className="pie-formulario">
          <button type="submit" className="boton boton-primario boton-ancho">
            Guardar insumo
          </button>
          {existente && (
            <Confirmar
              texto={`¿Borrar “${existente.nombre}”? Las recetas que lo usan dejarán de contarlo.`}
              onConfirmar={() => {
                borrar('insumos', existente.id)
                ir('/insumos')
              }}
            >
              Borrar insumo
            </Confirmar>
          )}
        </div>
      </form>
    </Pantalla>
  )
}
