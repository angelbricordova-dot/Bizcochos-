import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { costoItem, desglose, unidadesCompatibles } from '../../shared/calc'
import type { Insumo, ItemReceta, Receta, UnidadCompra } from '../../shared/types'
import { Torta } from '../components/Torta'
import { Campo, Confirmar, Numero, Pantalla, Vacio } from '../components/ui'
import { enBs, fmtPct, fmtUSD, fmtUSDfino, uid } from '../lib/format'
import { ir, volver } from '../lib/router'
import { useApp, useTasa, vivos } from '../lib/store'

export function Recetas() {
  const { datos } = useApp()
  const tasa = useTasa()
  const lista = vivos(datos.recetas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return (
    <Pantalla
      titulo="Recetas"
      accion={
        <a className="boton boton-primario boton-chico" href="#/recetas/nueva">
          <Plus size={18} /> Nueva
        </a>
      }
    >
      {lista.length === 0 ? (
        <Vacio
          titulo="Calcula tu primer bizcocho"
          accion={
            <div className="fila-botones fila-botones-columna">
              <a className="boton boton-primario" href="#/recetas/nueva">
                <Plus size={18} /> Crear receta
              </a>
              <EjemploBoton />
            </div>
          }
        >
          Pon los ingredientes con sus cantidades, el tiempo de horno y tu trabajo. Te decimos cuánto cuesta y en cuánto
          venderlo para ganar lo que quieres.
        </Vacio>
      ) : (
        <ul className="lista">
          {lista.map((r) => {
            const d = desglose(r, datos.insumos, datos.ajustes)
            return (
              <li key={r.id}>
                <a href={`#/recetas/${r.id}`} className="fila">
                  <span className="fila-principal">
                    <span className="fila-titulo">{r.nombre}</span>
                    <span className="fila-sub num">
                      Cuesta {fmtUSD(d.costoPorcion)}
                      {r.rinde > 1 ? ' la porción' : ''} · gana {fmtPct(d.margenReal)}
                      {d.faltantes > 0 && ' · falta un insumo'}
                    </span>
                  </span>
                  <span className="fila-cifra">
                    <span className="precio-dorado num">{fmtUSD(d.precio)}</span>
                    <span className="fila-sub num">{enBs(d.precio, tasa)}</span>
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
          ['Harina de trigo (ejemplo)', 'ingrediente', 1, 'kg', 1.6],
          ['Azúcar (ejemplo)', 'ingrediente', 1, 'kg', 1.5],
          ['Huevos (ejemplo)', 'ingrediente', 30, 'und', 6],
          ['Mantequilla (ejemplo)', 'ingrediente', 500, 'g', 4.5],
          ['Leche (ejemplo)', 'ingrediente', 1, 'L', 2],
          ['Caja para bizcocho (ejemplo)', 'empaque', 1, 'und', 0.8],
        ]
        const ids = ins.map(([nombre, tipo, cantidad, unidad, precio]) => {
          const id = uid()
          guardarInsumo({ id, nombre, tipo, cantidad, unidad, precio, moneda: 'USD', precioUSD: precio, updatedAt: 0 })
          return id
        })
        const id = uid()
        guardarReceta({
          id,
          nombre: 'Bizcocho de vainilla (ejemplo)',
          rinde: 1,
          items: [
            { insumoId: ids[0], cantidad: 250, unidad: 'g' },
            { insumoId: ids[1], cantidad: 200, unidad: 'g' },
            { insumoId: ids[2], cantidad: 4, unidad: 'und' },
            { insumoId: ids[3], cantidad: 125, unidad: 'g' },
            { insumoId: ids[4], cantidad: 120, unidad: 'ml' },
            { insumoId: ids[5], cantidad: 1, unidad: 'und' },
          ],
          minutosHorno: 45,
          minutosTrabajo: 30,
          merma: datos.ajustes.mermaPorDefecto,
          margen: datos.ajustes.margenPorDefecto,
          nota: 'Precios de ejemplo: cámbialos por los tuyos o borra esta receta.',
          updatedAt: 0,
        })
        ir(`/recetas/${id}`)
      }}
    >
      Ver un ejemplo
    </button>
  )
}

export function EditorReceta({ id }: { id: string }) {
  const { datos, guardarReceta, borrar } = useApp()
  const tasa = useTasa()
  const existente = id !== 'nueva' ? datos.recetas[id] : undefined
  const [r, setR] = useState<Receta>(
    () =>
      existente ?? {
        id: uid(),
        nombre: '',
        rinde: 1,
        items: [],
        minutosHorno: 45,
        minutosTrabajo: 30,
        merma: datos.ajustes.mermaPorDefecto,
        margen: datos.ajustes.margenPorDefecto,
        updatedAt: 0,
      },
  )
  const [intento, setIntento] = useState(false)
  const insumos = useMemo(
    () => vivos(datos.insumos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [datos.insumos],
  )
  const d = desglose(r, datos.insumos, datos.ajustes)

  if (id !== 'nueva' && !existente) {
    return (
      <Pantalla titulo="Receta" atras="/recetas">
        <Vacio titulo="Esta receta ya no existe">Puede que la hayas borrado desde otro dispositivo.</Vacio>
      </Pantalla>
    )
  }

  const cambiarItem = (idx: number, it: Partial<ItemReceta>) =>
    setR({ ...r, items: r.items.map((x, i) => (i === idx ? { ...x, ...it } : x)) })

  const agregarItem = () => {
    const usados = new Set(r.items.map((i) => i.insumoId))
    const libre = insumos.find((i) => !usados.has(i.id)) ?? insumos[0]
    if (!libre) return
    const unidad: UnidadCompra = libre.unidad === 'kg' ? 'g' : libre.unidad === 'L' ? 'ml' : libre.unidad
    setR({ ...r, items: [...r.items, { insumoId: libre.id, cantidad: NaN, unidad }] })
  }

  const errorNombre = intento && !r.nombre.trim() ? 'Ponle nombre a la receta.' : ''
  const guardar = () => {
    setIntento(true)
    if (!r.nombre.trim()) return
    guardarReceta({
      ...r,
      nombre: r.nombre.trim(),
      rinde: r.rinde > 0 ? r.rinde : 1,
      items: r.items.filter((i) => i.cantidad > 0),
      minutosHorno: r.minutosHorno || 0,
      minutosTrabajo: r.minutosTrabajo || 0,
      merma: r.merma || 0,
      margen: Math.min(Math.max(r.margen || 0, 0), 0.95),
      precioVenta: r.precioVenta && r.precioVenta > 0 ? r.precioVenta : undefined,
    })
    volver('/recetas')
  }

  const margenBajo = r.precioVenta && r.precioVenta > 0 && d.margenReal < r.margen - 0.005

  return (
    <Pantalla titulo={existente ? r.nombre || 'Receta' : 'Nueva receta'} atras="/recetas">
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
                placeholder="Bizcocho de naranja"
                autoFocus={!existente}
                onChange={(e) => setR({ ...r, nombre: e.target.value })}
              />
            )}
          </Campo>
          {r.nota && <p className="nota">{r.nota}</p>}
          <Campo etiqueta="¿Cuántas porciones salen?" ayuda="Pon 1 si lo vendes entero.">
            {(i, dsc) => (
              <Numero id={i} describedBy={dsc} valor={r.rinde} sufijo={r.rinde === 1 ? 'entero' : 'porciones'} onCambio={(rinde) => setR({ ...r, rinde })} />
            )}
          </Campo>

          <fieldset className="bloque">
            <legend>Ingredientes y empaque</legend>
            {insumos.length === 0 ? (
              <p className="tenue">
                Primero agrega tus insumos. <a href="#/insumos/nuevo">Agregar insumo</a>
              </p>
            ) : (
              <>
                {r.items.length === 0 && <p className="tenue">Todavía no hay ingredientes en esta receta.</p>}
                <ul className="items">
                  {r.items.map((it, idx) => {
                    const ins = datos.insumos[it.insumoId]
                    const compatibles = ins && !ins.deleted ? unidadesCompatibles(ins.unidad) : (['g'] as UnidadCompra[])
                    const costo = costoItem(ins, it.cantidad || 0, it.unidad)
                    return (
                      <li key={idx} className="item">
                        <label className="solo-lector" htmlFor={`ins-${idx}`}>
                          Insumo
                        </label>
                        <select
                          id={`ins-${idx}`}
                          className="item-insumo"
                          value={ins && !ins.deleted ? it.insumoId : ''}
                          onChange={(e) => {
                            const nuevo = datos.insumos[e.target.value]
                            const comp = unidadesCompatibles(nuevo.unidad)
                            cambiarItem(idx, {
                              insumoId: nuevo.id,
                              unidad: comp.includes(it.unidad) ? it.unidad : nuevo.unidad === 'kg' ? 'g' : nuevo.unidad === 'L' ? 'ml' : nuevo.unidad,
                            })
                          }}
                        >
                          {(!ins || ins.deleted) && <option value="">Insumo borrado</option>}
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
                          <Numero id={`cant-${idx}`} valor={Number.isNaN(it.cantidad) ? undefined : it.cantidad} onCambio={(cantidad) => cambiarItem(idx, { cantidad })} />
                          <label className="solo-lector" htmlFor={`uni-${idx}`}>
                            Unidad
                          </label>
                          <select
                            id={`uni-${idx}`}
                            value={it.unidad}
                            onChange={(e) => cambiarItem(idx, { unidad: e.target.value as UnidadCompra })}
                          >
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
          <Torta d={d} rinde={r.rinde} tasa={tasa} />

          {d.faltantes > 0 && (
            <p className="aviso">
              <AlertTriangle size={18} aria-hidden="true" /> Un insumo de esta receta fue borrado; su costo no se cuenta.
            </p>
          )}

          <dl className="cuentas">
            <div>
              <dt>Costo de la receta</dt>
              <dd className="num">{fmtUSD(d.costo)}</dd>
            </div>
            {r.rinde > 1 && (
              <div>
                <dt>Costo por porción</dt>
                <dd className="num">{fmtUSD(d.costoPorcion)}</dd>
              </div>
            )}
          </dl>

          <Campo etiqueta="Ganancia que quieres" ayuda="Parte del precio que te queda limpia. 40% es un buen punto de partida.">
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
                <Numero id={i} describedBy={dsc} valor={Math.round(r.margen * 1000) / 10} sufijo="%" onCambio={(v) => setR({ ...r, margen: Math.min(Math.max((v || 0) / 100, 0), 0.95) })} />
              </div>
            )}
          </Campo>

          <div className="sugerido">
            <span className="sugerido-etiqueta">Precio sugerido{r.rinde > 1 ? ' por porción' : ''}</span>
            <span className="sugerido-cifra num">{fmtUSD(d.precioSugerido)}</span>
            <span className="tenue num">
              {enBs(d.precioSugerido, tasa)} · exacto {fmtUSD(d.precioExacto)}
            </span>
            {r.precioVenta !== d.precioSugerido && d.precioSugerido > 0 && (
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => setR({ ...r, precioVenta: d.precioSugerido })}>
                Usar este precio
              </button>
            )}
          </div>

          <Campo
            etiqueta="Tu precio de venta"
            ayuda={r.precioVenta ? `Con este precio ganas ${fmtUSD(d.gananciaPorcion)} (${fmtPct(d.margenReal)}).` : 'Déjalo vacío para usar el sugerido.'}
          >
            {(i, dsc) => (
              <Numero id={i} describedBy={dsc} prefijo="$" valor={r.precioVenta} onCambio={(v) => setR({ ...r, precioVenta: Number.isNaN(v) ? undefined : v })} />
            )}
          </Campo>
          {d.gananciaPorcion < 0 ? (
            <p className="aviso aviso-peligro">
              <AlertTriangle size={18} aria-hidden="true" /> A ese precio pierdes {fmtUSD(-d.gananciaPorcion)} por {r.rinde > 1 ? 'porción' : 'bizcocho'}.
            </p>
          ) : (
            margenBajo && (
              <p className="aviso">
                <AlertTriangle size={18} aria-hidden="true" /> Ganas menos del {fmtPct(r.margen)} que querías.
              </p>
            )
          )}
        </div>

        <div className="pie-formulario pie-fijo">
          <p className="pie-precio num" aria-hidden="true">
            <span>
              Precio <strong>{fmtUSD(d.precio)}</strong>
            </span>
            <span>
              Costo {fmtUSD(d.costoPorcion)} · gana {fmtPct(d.margenReal)}
            </span>
          </p>
          <button type="submit" className="boton boton-primario boton-ancho">
            Guardar receta
          </button>
        </div>
        {existente && (
          <div className="pie-borrar">
            <Confirmar
              texto={`¿Borrar “${existente.nombre}”? Las ventas ya registradas no se borran.`}
              onConfirmar={() => {
                borrar('recetas', existente.id)
                ir('/recetas')
              }}
            >
              Borrar receta
            </Confirmar>
          </div>
        )}
      </form>
    </Pantalla>
  )
}
