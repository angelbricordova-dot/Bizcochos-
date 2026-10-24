import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { costoItem, desglose, tienePorciones, unidadesCompatibles, type Precio } from '../../shared/calc'
import type { Formato, Insumo, ItemReceta, Receta, UnidadCompra } from '../../shared/types'
import { Torta } from '../components/Torta'
import { Campo, Numero, Pantalla, Segmentos, Vacio } from '../components/ui'
import { enBs, fmtPct, fmtUSD, fmtUSDfino, uid } from '../lib/format'
import { ir, volver } from '../lib/router'
import { useApp, useTasa, vivos } from '../lib/store'

export function Productos() {
  const { datos } = useApp()
  const tasa = useTasa()
  const lista = vivos(datos.recetas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return (
    <Pantalla
      titulo="Productos"
      accion={
        <a className="boton boton-primario boton-chico" href="#/productos/nuevo">
          <Plus size={18} /> Nuevo
        </a>
      }
    >
      {lista.length === 0 ? (
        <Vacio
          titulo="Calcula tu primer producto"
          accion={
            <div className="fila-botones fila-botones-columna">
              <a className="boton boton-primario" href="#/productos/nuevo">
                <Plus size={18} /> Crear producto
              </a>
              <EjemploBoton />
            </div>
          }
        >
          Un bizcocho, un pie de limón, un cheesecake… Pon sus ingredientes, el horno y tu trabajo, y te decimos cuánto
          cuesta y en cuánto venderlo entero o por porción.
        </Vacio>
      ) : (
        <ul className="lista">
          {lista.map((r) => {
            const d = desglose(r, datos.insumos, datos.ajustes)
            const porciones = tienePorciones(r)
            const bajo = d.entero.ganancia < 0 || (porciones && d.porcion.ganancia < 0)
            return (
              <li key={r.id}>
                <a href={`#/productos/${r.id}`} className="fila">
                  <span className="fila-principal">
                    <span className="fila-titulo">{r.nombre}</span>
                    <span className="fila-sub num">
                      {bajo ? (
                        <span className="texto-peligro">Estás perdiendo con este precio</span>
                      ) : (
                        <>
                          Cuesta {fmtUSD(d.costo)} · ganas {fmtPct(d.entero.margen)}
                          {d.faltantes > 0 && ' · falta un insumo'}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="fila-cifra">
                    <span className="precio-dorado num">{fmtUSD(d.entero.precio)}</span>
                    {porciones ? (
                      <span className="fila-sub num">porción {fmtUSD(d.porcion.precio)}</span>
                    ) : (
                      <span className="fila-sub num bs">{enBs(d.entero.precio, tasa)}</span>
                    )}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Pantalla>
  )
}

/** Loads a labelled example so a first-time user sees how the numbers work. */
function EjemploBoton() {
  const { guardarInsumo, guardarReceta, datos } = useApp()
  return (
    <button
      type="button"
      className="boton boton-secundario"
      onClick={() => {
        const ins: [string, Insumo['tipo'], number, UnidadCompra, number][] = [
          ['Galletas María (ejemplo)', 'ingrediente', 200, 'g', 1.2],
          ['Mantequilla (ejemplo)', 'ingrediente', 500, 'g', 4.5],
          ['Leche condensada (ejemplo)', 'ingrediente', 397, 'g', 2.3],
          ['Limones (ejemplo)', 'ingrediente', 1, 'kg', 1.5],
          ['Huevos (ejemplo)', 'ingrediente', 30, 'und', 6],
          ['Caja para torta (ejemplo)', 'empaque', 1, 'und', 0.8],
        ]
        const ids = ins.map(([nombre, tipo, cantidad, unidad, precio]) => {
          const id = uid()
          guardarInsumo({ id, nombre, tipo, cantidad, unidad, precio, moneda: 'USD', precioUSD: precio, updatedAt: 0 })
          return id
        })
        const id = uid()
        guardarReceta({
          id,
          nombre: 'Pie de limón (ejemplo)',
          rinde: 8,
          items: [
            { insumoId: ids[0], cantidad: 200, unidad: 'g' },
            { insumoId: ids[1], cantidad: 90, unidad: 'g' },
            { insumoId: ids[2], cantidad: 794, unidad: 'g' },
            { insumoId: ids[3], cantidad: 300, unidad: 'g' },
            { insumoId: ids[4], cantidad: 3, unidad: 'und' },
            { insumoId: ids[5], cantidad: 1, unidad: 'und' },
          ],
          minutosHorno: 20,
          minutosTrabajo: 40,
          merma: datos.ajustes.mermaPorDefecto,
          margen: datos.ajustes.margenPorDefecto,
          nota: 'Precios de ejemplo: cámbialos por los tuyos o borra este producto.',
          updatedAt: 0,
        })
        ir(`/productos/${id}`)
      }}
    >
      Ver un ejemplo
    </button>
  )
}

function unidadReceta(u: UnidadCompra): UnidadCompra {
  return u === 'kg' ? 'g' : u === 'L' ? 'ml' : u
}

function TarjetaPrecio({
  titulo,
  p,
  tasa,
  valor,
  onCambio,
}: {
  titulo: string
  p: Precio
  tasa: number
  valor: number | undefined
  onCambio: (v: number | undefined) => void
}) {
  return (
    <div className="tarjeta-precio" data-pierde={p.ganancia < 0 ? '' : undefined}>
      <div className="tarjeta-precio-cabeza">
        <span className="tarjeta-precio-titulo">{titulo}</span>
        <span className="tenue pequeno num">cuesta {fmtUSD(p.costo)}</span>
      </div>
      <div className="sugerido">
        <span className="sugerido-etiqueta">Sugerido</span>
        <span className="sugerido-cifra num">{fmtUSD(p.sugerido)}</span>
        <span className="pequeno num">
          <span className="bs">{enBs(p.sugerido, tasa)}</span>
        </span>
      </div>
      <Campo
        etiqueta="Tu precio"
        ayuda={
          p.ganancia < 0
            ? undefined
            : valor
              ? `Ganas ${fmtUSD(p.ganancia)} (${fmtPct(p.margen)}).`
              : 'Vacío = usa el sugerido.'
        }
        error={p.ganancia < 0 ? `A ese precio pierdes ${fmtUSD(-p.ganancia)}.` : undefined}
      >
        {(i, d) => (
          <div className="fila-botones fila-botones-apretada">
            <Numero id={i} describedBy={d} prefijo="$" valor={valor} onCambio={(v) => onCambio(Number.isNaN(v) ? undefined : v)} />
            {valor !== p.sugerido && p.sugerido > 0 && (
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => onCambio(p.sugerido)}>
                Usar sugerido
              </button>
            )}
          </div>
        )}
      </Campo>
    </div>
  )
}

export function EditorProducto({ id }: { id: string }) {
  const { datos, guardarReceta, borrar, avisar } = useApp()
  const tasa = useTasa()
  const existente = id !== 'nuevo' ? datos.recetas[id] : undefined
  const [r, setR] = useState<Receta>(() => {
    if (!existente)
      return {
        id: uid(),
        nombre: '',
        rinde: 1,
        items: [],
        minutosHorno: 45,
        minutosTrabajo: 30,
        merma: datos.ajustes.mermaPorDefecto,
        margen: datos.ajustes.margenPorDefecto,
        updatedAt: 0,
      }
    // Move the legacy single price into the field it meant.
    const { precioVenta, ...resto } = existente
    if (!precioVenta) return existente
    return existente.rinde > 1
      ? { ...resto, precioPorcion: existente.precioPorcion ?? precioVenta }
      : { ...resto, precioEntero: existente.precioEntero ?? precioVenta }
  })
  const [formato, setFormato] = useState<Formato>('entero')
  const [intento, setIntento] = useState(false)
  const insumos = useMemo(
    () => vivos(datos.insumos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [datos.insumos],
  )
  const d = desglose(r, datos.insumos, datos.ajustes)
  const porciones = tienePorciones(r)
  const vista: Formato = porciones ? formato : 'entero'

  if (id !== 'nuevo' && !existente) {
    return (
      <Pantalla titulo="Producto" atras="/productos">
        <Vacio titulo="Este producto ya no existe">Puede que lo hayas borrado desde otro dispositivo.</Vacio>
      </Pantalla>
    )
  }

  const cambiarItem = (idx: number, it: Partial<ItemReceta>) =>
    setR({ ...r, items: r.items.map((x, i) => (i === idx ? { ...x, ...it } : x)) })

  const agregarItem = () => {
    const usados = new Set(r.items.map((i) => i.insumoId))
    const libre = insumos.find((i) => !usados.has(i.id)) ?? insumos[0]
    if (!libre) return
    setR({ ...r, items: [...r.items, { insumoId: libre.id, cantidad: NaN, unidad: unidadReceta(libre.unidad) }] })
  }

  const errorNombre = intento && !r.nombre.trim() ? 'Ponle nombre al producto.' : ''
  const guardar = () => {
    setIntento(true)
    if (!r.nombre.trim()) return
    const rinde = r.rinde > 0 ? r.rinde : 1
    guardarReceta({
      ...r,
      nombre: r.nombre.trim(),
      rinde,
      items: r.items.filter((i) => i.cantidad > 0),
      minutosHorno: r.minutosHorno || 0,
      minutosTrabajo: r.minutosTrabajo || 0,
      merma: r.merma || 0,
      margen: Math.min(Math.max(r.margen || 0, 0), 0.95),
      precioEntero: r.precioEntero && r.precioEntero > 0 ? r.precioEntero : undefined,
      precioPorcion: rinde > 1 && r.precioPorcion && r.precioPorcion > 0 ? r.precioPorcion : undefined,
    })
    avisar(existente ? 'Producto guardado' : `“${r.nombre.trim()}” agregado`)
    volver('/productos')
  }

  const selectorVista = porciones && (
    <Segmentos
      etiqueta="Ver el precio"
      valor={formato}
      onCambio={setFormato}
      opciones={[
        { valor: 'entero', texto: 'Entero' },
        { valor: 'porcion', texto: 'Porción' },
      ]}
    />
  )

  return (
    <Pantalla
      titulo={existente ? r.nombre || 'Producto' : 'Nuevo producto'}
      atras="/productos"
      accion={
        existente && (
          <a className="boton boton-secundario boton-chico" href={`#/cuentas/nuevo?tipo=venta&receta=${existente.id}`}>
            Vender
          </a>
        )
      }
    >
      <form
        className="formulario editor-receta"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        <div className="editor-columna">
          <Campo etiqueta="Nombre" error={errorNombre}>
            {(i, dsc) => (
              <input
                id={i}
                aria-describedby={dsc}
                value={r.nombre}
                placeholder="Cheesecake de fresa"
                autoFocus={!existente}
                onChange={(e) => setR({ ...r, nombre: e.target.value })}
              />
            )}
          </Campo>
          <div className="solo-movil">
            <Torta
              d={d}
              formato={vista}
              tasa={tasa}
              compacta
              alVer={() => document.getElementById('reparto')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            />
          </div>
          {r.nota && <p className="nota">{r.nota}</p>}
          <Campo etiqueta="¿Cuántas porciones salen?" ayuda="Pon 1 si solo lo vendes entero.">
            {(i, dsc) => (
              <Numero
                id={i}
                describedBy={dsc}
                valor={r.rinde}
                sufijo={r.rinde === 1 ? 'solo entero' : 'porciones'}
                onCambio={(rinde) => setR({ ...r, rinde })}
              />
            )}
          </Campo>

          <fieldset className="bloque">
            <legend>Ingredientes y empaque</legend>
            {insumos.length === 0 ? (
              <p className="tenue">
                Primero agrega lo que compras. <a href="#/insumos/nuevo">Agregar insumo</a>
              </p>
            ) : (
              <>
                {r.items.length === 0 && <p className="tenue">Todavía no hay ingredientes.</p>}
                <ul className="items">
                  {r.items.map((it, idx) => {
                    const ins = datos.insumos[it.insumoId]
                    const vivo = ins && !ins.deleted
                    const compatibles = vivo ? unidadesCompatibles(ins.unidad) : (['g'] as UnidadCompra[])
                    const costo = costoItem(ins, it.cantidad || 0, it.unidad)
                    return (
                      <li key={idx} className="item">
                        <label className="solo-lector" htmlFor={`ins-${idx}`}>
                          Insumo
                        </label>
                        <select
                          id={`ins-${idx}`}
                          className="item-insumo"
                          value={vivo ? it.insumoId : ''}
                          onChange={(e) => {
                            const nuevo = datos.insumos[e.target.value]
                            const comp = unidadesCompatibles(nuevo.unidad)
                            cambiarItem(idx, { insumoId: nuevo.id, unidad: comp.includes(it.unidad) ? it.unidad : unidadReceta(nuevo.unidad) })
                          }}
                        >
                          {!vivo && <option value="">Insumo borrado</option>}
                          {insumos.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nombre}
                            </option>
                          ))}
                        </select>
                        <div className="item-cantidad">
                          <label className="solo-lector" htmlFor={`cant-${idx}`}>
                            Cantidad
                          </label>
                          <Numero
                            id={`cant-${idx}`}
                            valor={Number.isNaN(it.cantidad) ? undefined : it.cantidad}
                            onCambio={(cantidad) => cambiarItem(idx, { cantidad })}
                          />
                          <label className="solo-lector" htmlFor={`uni-${idx}`}>
                            Unidad
                          </label>
                          <select id={`uni-${idx}`} value={it.unidad} onChange={(e) => cambiarItem(idx, { unidad: e.target.value as UnidadCompra })}>
                            {compatibles.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="item-costo num">{fmtUSDfino(costo)}</span>
                        <button
                          type="button"
                          className="boton-icono"
                          aria-label={`Quitar ${ins?.nombre ?? 'insumo'}`}
                          onClick={() => setR({ ...r, items: r.items.filter((_, i) => i !== idx) })}
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <button type="button" className="boton boton-secundario" onClick={agregarItem}>
                  <Plus size={18} /> Agregar ingrediente
                </button>
              </>
            )}
          </fieldset>

          <fieldset className="bloque">
            <legend>Tiempo y extras</legend>
            <div className="dos-columnas">
              <Campo etiqueta="Horno" ayuda={`${fmtUSD(datos.ajustes.costoHornoHora)} la hora`}>
                {(i, dsc) => (
                  <Numero id={i} describedBy={dsc} valor={r.minutosHorno} sufijo="min" onCambio={(minutosHorno) => setR({ ...r, minutosHorno })} />
                )}
              </Campo>
              <Campo etiqueta="Tu trabajo" ayuda={`${fmtUSD(datos.ajustes.costoTrabajoHora)} la hora`}>
                {(i, dsc) => (
                  <Numero id={i} describedBy={dsc} valor={r.minutosTrabajo} sufijo="min" onCambio={(minutosTrabajo) => setR({ ...r, minutosTrabajo })} />
                )}
              </Campo>
            </div>
            <Campo etiqueta="Merma e imprevistos" ayuda="Lo que se pierde: masa en el bol, un huevo malo, gas extra.">
              {(i, dsc) => (
                <Numero id={i} describedBy={dsc} valor={Math.round(r.merma * 1000) / 10} sufijo="%" onCambio={(v) => setR({ ...r, merma: (v || 0) / 100 })} />
              )}
            </Campo>
            <p className="tenue pequeno">
              El costo por hora del horno y de tu trabajo se cambia en <a href="#/ajustes">Ajustes</a>.
            </p>
          </fieldset>
        </div>

        <div className="editor-columna editor-precio">
          {selectorVista && <div className="centro-flex">{selectorVista}</div>}
          <Torta d={d} formato={vista} tasa={tasa} />

          {d.faltantes > 0 && (
            <p className="aviso">
              <AlertTriangle size={18} aria-hidden="true" /> Un insumo de este producto fue borrado; su costo no se cuenta.
            </p>
          )}

          <Campo etiqueta="Ganancia que quieres" ayuda="La parte del precio que te queda limpia. 40% es un buen punto de partida.">
            {(i, dsc) => (
              <div className="margen">
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={1}
                  value={Math.round(r.margen * 100)}
                  aria-label="Ganancia que quieres, en porcentaje"
                  onChange={(e) => setR({ ...r, margen: Number(e.target.value) / 100 })}
                />
                <Numero
                  id={i}
                  describedBy={dsc}
                  valor={Math.round(r.margen * 1000) / 10}
                  sufijo="%"
                  onCambio={(v) => setR({ ...r, margen: Math.min(Math.max((v || 0) / 100, 0), 0.95) })}
                />
              </div>
            )}
          </Campo>

          <div className={porciones ? 'precios-dobles' : undefined}>
            <TarjetaPrecio
              titulo={porciones ? 'Entero' : 'Precio de venta'}
              p={d.entero}
              tasa={tasa}
              valor={r.precioEntero}
              onCambio={(precioEntero) => setR({ ...r, precioEntero })}
            />
            {porciones && (
              <TarjetaPrecio
                titulo="Porción"
                p={d.porcion}
                tasa={tasa}
                valor={r.precioPorcion}
                onCambio={(precioPorcion) => setR({ ...r, precioPorcion })}
              />
            )}
          </div>
        </div>

        <div className="pie-formulario pie-fijo">
          <p className="pie-precio num" aria-hidden="true">
            <span>
              {porciones ? 'Entero' : 'Precio'} <strong>{fmtUSD(d.entero.precio)}</strong>
            </span>
            <span>{porciones ? `Porción ${fmtUSD(d.porcion.precio)}` : `Ganas ${fmtPct(d.entero.margen)}`}</span>
          </p>
          <button type="submit" className="boton boton-primario boton-ancho">
            Guardar producto
          </button>
        </div>
        {existente && (
          <div className="pie-borrar">
            <button
              type="button"
              className="boton boton-peligro-suave"
              onClick={() => {
                borrar('recetas', existente.id, `“${existente.nombre}” borrado`)
                ir('/productos')
              }}
            >
              Borrar producto
            </button>
          </div>
        )}
      </form>
    </Pantalla>
  )
}
