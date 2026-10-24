import { Check, MessageCircle, Plus, Smartphone, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  aUSD,
  cuentaEncargo,
  encargoAbierto,
  pagosPorEncargo,
  precioDe,
  tienePorciones,
  totalEncargo,
} from '../../shared/calc'
import type { DatosPago, Encargo, EstadoEncargo, Formato, ItemEncargo, MetodoPago, Moneda, Movimiento } from '../../shared/types'
import { Campo, Numero, Pantalla, Segmentos, Vacio } from '../components/ui'
import { enBs, fechaLarga, fechaRelativa, fmtBs, fmtNum, fmtUSD, hora12, hoy, uid } from '../lib/format'
import { ir, parametro, volver } from '../lib/router'
import { useApp, useTasa, vivos } from '../lib/store'
import { tieneDatosPago, textoPago } from '../lib/pago'
import { compartir, enlaceWhatsApp } from '../lib/whatsapp'
import { METODOS } from './Cuentas'

const ESTADOS: Record<EstadoEncargo, string> = {
  pendiente: 'Por hacer',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

/** Suggestions for the client field, from past orders and sales. */
export function ListaClientes() {
  const { datos } = useApp()
  const nombres = useMemo(() => {
    const s = new Set<string>()
    for (const e of vivos(datos.encargos)) if (e.cliente.trim()) s.add(e.cliente.trim())
    for (const m of vivos(datos.movimientos)) if (m.cliente?.trim()) s.add(m.cliente.trim())
    return [...s].sort((a, b) => a.localeCompare(b, 'es'))
  }, [datos.encargos, datos.movimientos])
  return (
    <datalist id="clientes">
      {nombres.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  )
}

export function resumenItems(items: ItemEncargo[]): string {
  return items
    .map((it) =>
      it.formato === 'porcion'
        ? `${fmtNum(it.cantidad)} ${it.cantidad === 1 ? 'porción' : 'porciones'} de ${it.descripcion}`
        : `${fmtNum(it.cantidad)} ${it.descripcion}`,
    )
    .join(', ')
}

export function FilaEncargo({ e, resta, total, fecha }: { e: Encargo; resta: number; total: number; fecha?: string }) {
  const atrasado = encargoAbierto(e) && e.entrega < hoy()
  return (
    <a href={`#/encargos/${e.id}`} className="fila">
      <span className="fila-principal">
        <span className="fila-titulo">
          {e.cliente || 'Sin nombre'}
          {e.estado === 'listo' && <span className="chip chip-listo">Listo</span>}
          {atrasado && <span className="chip chip-peligro">Atrasado</span>}
          {e.estado === 'cancelado' && <span className="chip">Cancelado</span>}
        </span>
        <span className="fila-sub">
          {fecha ? `${fecha}${e.hora ? ` ${hora12(e.hora)}` : ''} · ` : e.hora ? `${hora12(e.hora)} · ` : ''}
          {resumenItems(e.items) || 'Sin productos'}
        </span>
      </span>
      <span className="fila-cifra">
        <span className="num">{fmtUSD(total)}</span>
        {e.estado !== 'cancelado' &&
          (resta > 0.004 ? (
            <span className="fila-sub num texto-debe">Debe {fmtUSD(resta)}</span>
          ) : (
            <span className="fila-sub texto-pagado">
              <Check size={13} aria-hidden="true" /> Pagado
            </span>
          ))}
      </span>
    </a>
  )
}

export function Encargos() {
  const { datos } = useApp()
  const [vista, setVista] = useState<'proximos' | 'pasados'>('proximos')
  const pagos = useMemo(() => pagosPorEncargo(vivos(datos.movimientos)), [datos.movimientos])
  const todos = vivos(datos.encargos)
  const lista = todos
    .filter((e) => (vista === 'proximos' ? encargoAbierto(e) : !encargoAbierto(e)))
    .sort((a, b) => {
      const k = (a.entrega + (a.hora ?? '99')).localeCompare(b.entrega + (b.hora ?? '99'))
      return vista === 'proximos' ? k : -k
    })
  const porDia = new Map<string, Encargo[]>()
  for (const e of lista) porDia.set(e.entrega, [...(porDia.get(e.entrega) ?? []), e])
  const abiertos = todos.filter(encargoAbierto)
  const debe = abiertos.reduce((s, e) => s + cuentaEncargo(e, pagos).resta, 0)

  return (
    <Pantalla titulo="Encargos">
      {abiertos.length > 0 && (
        <dl className="renglones">
          <div>
            <dt>Por entregar</dt>
            <dd className="num">{abiertos.length}</dd>
          </div>
          <div>
            <dt>Te deben</dt>
            <dd className="num">{fmtUSD(debe)}</dd>
          </div>
        </dl>
      )}
      <Segmentos
        etiqueta="Mostrar"
        valor={vista}
        onCambio={setVista}
        opciones={[
          { valor: 'proximos', texto: 'Por entregar' },
          { valor: 'pasados', texto: 'Entregados' },
        ]}
      />
      {lista.length === 0 ? (
        <Vacio
          titulo={vista === 'proximos' ? 'Sin encargos pendientes' : 'Todavía no has entregado encargos'}
          accion={
            vista === 'proximos' && (
              <a className="boton boton-primario" href="#/encargos/nuevo">
                <Plus size={18} /> Anotar encargo
              </a>
            )
          }
        >
          Anota cada pedido con su fecha de entrega y el abono. La app te recuerda qué entregar, cuánto te deben y qué
          comprar.
        </Vacio>
      ) : (
        [...porDia.entries()].map(([fecha, items]) => (
          <div key={fecha} className="grupo">
            <h2 className="grupo-titulo">{fechaRelativa(fecha)}</h2>
            <ul className="lista">
              {items.map((e) => {
                const c = cuentaEncargo(e, pagos)
                return (
                  <li key={e.id}>
                    <FilaEncargo e={e} resta={c.resta} total={c.total} />
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
      <a className="boton boton-primario boton-flotante" href="#/encargos/nuevo">
        <Plus size={20} /> Nuevo encargo
      </a>
    </Pantalla>
  )
}

function mensajeEncargo(e: Encargo, pagado: number, tasa: number, negocio: string, pago?: DatosPago): string {
  const total = totalEncargo(e)
  const resta = Math.max(total - pagado, 0)
  const bs = (v: number) => (tasa > 0 ? ` (${fmtBs(v * tasa)})` : '')
  const lineas = e.items.map((it) => {
    const que = it.formato === 'porcion' ? `${fmtNum(it.cantidad)} porc. de ${it.descripcion}` : `${fmtNum(it.cantidad)} ${it.descripcion}`
    return `• ${que} — ${fmtUSD(it.cantidad * it.precioUSD)}`
  })
  const entrega = `${fechaLarga(e.entrega)}${e.hora ? `, ${hora12(e.hora)}` : ''}`
  return [
    `¡Hola${e.cliente ? ` ${e.cliente.split(' ')[0]}` : ''}! Te confirmo tu pedido:`,
    '',
    ...lineas,
    '',
    `Entrega: ${entrega}`,
    `Total: ${fmtUSD(total)}${bs(total)}`,
    ...(pagado > 0 ? [`Abonado: ${fmtUSD(pagado)}`] : []),
    ...(resta > 0 && pagado > 0 ? [`Resta: ${fmtUSD(resta)}${bs(resta)}`] : []),
    ...(resta === 0 && total > 0 ? ['Pagado completo. ¡Gracias!'] : []),
    ...(resta > 0 && tieneDatosPago(pago) ? ['', textoPago(pago, pagado > 0 ? resta : undefined, tasa)] : []),
    '',
    `${negocio}`,
  ].join('\n')
}

export function FormEncargo({ id }: { id: string }) {
  const { datos, guardarEncargo, guardarMovimiento, borrar, avisar } = useApp()
  const tasa = useTasa()
  const existente = id !== 'nuevo' ? datos.encargos[id] : undefined
  const recetas = vivos(datos.recetas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const precio = (recetaId: string | undefined, formato: Formato) =>
    precioDe(recetaId ? datos.recetas[recetaId] : undefined, formato, datos.insumos, datos.ajustes)

  const [e, setE] = useState<Encargo>(
    () =>
      existente ?? {
        id: uid(),
        cliente: '',
        items: [],
        entrega: parametro('fecha') ?? hoy(),
        estado: 'pendiente',
        updatedAt: 0,
      },
  )
  const [intento, setIntento] = useState(false)
  const [pago, setPago] = useState<{ monto: number; moneda: Moneda; metodo: MetodoPago }>({
    monto: NaN,
    moneda: 'USD',
    metodo: 'pago-movil',
  })
  const [entregando, setEntregando] = useState(false)

  const pagosLista = vivos(datos.movimientos)
    .filter((m) => m.encargoId === e.id && m.tipo === 'venta')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const pagado = pagosLista.reduce((s, m) => s + m.montoUSD, 0)
  const total = totalEncargo(e)
  const resta = Math.max(total - pagado, 0)

  if (id !== 'nuevo' && !existente) {
    return (
      <Pantalla titulo="Encargo" atras="/encargos">
        <Vacio titulo="Este encargo ya no existe">Puede que lo hayas borrado desde otro dispositivo.</Vacio>
      </Pantalla>
    )
  }

  const errores = {
    cliente: !e.cliente.trim() ? '¿Para quién es?' : '',
    entrega: !/^\d{4}-\d{2}-\d{2}$/.test(e.entrega) ? 'Elige la fecha de entrega.' : '',
    items: !e.items.some((it) => it.cantidad > 0) ? 'Agrega al menos un producto.' : '',
  }
  const err = (k: keyof typeof errores) => (intento ? errores[k] : '')
  const valido = !Object.values(errores).some(Boolean)

  const limpio = (x: Encargo): Encargo => ({
    ...x,
    cliente: x.cliente.trim(),
    telefono: x.telefono?.trim() || undefined,
    nota: x.nota?.trim() || undefined,
    hora: x.hora || undefined,
    items: x.items.filter((it) => it.cantidad > 0).map((it) => ({ ...it, descripcion: it.descripcion.trim() || 'Producto' })),
  })

  /** Saves the order; on a new one, moves the URL to it so payments have a home. */
  const persistir = (x: Encargo) => {
    guardarEncargo(limpio(x))
    if (!existente) window.location.replace(`#/encargos/${x.id}`)
  }

  const cambiarItem = (idx: number, it: Partial<ItemEncargo>) =>
    setE({ ...e, items: e.items.map((x, i) => (i === idx ? { ...x, ...it } : x)) })

  const agregarItem = () => {
    const r = recetas[0]
    setE({
      ...e,
      items: [
        ...e.items,
        r
          ? { recetaId: r.id, descripcion: r.nombre, formato: 'entero', cantidad: 1, precioUSD: precio(r.id, 'entero') }
          : { descripcion: '', formato: 'entero', cantidad: 1, precioUSD: NaN },
      ],
    })
  }

  const registrarPago = (monto: number, moneda: Moneda, metodo: MetodoPago, nuevoEstado?: EstadoEncargo) => {
    setIntento(true)
    if (!valido || !(monto > 0) || !(tasa > 0 || moneda === 'USD')) return
    const montoUSD = aUSD(monto, moneda, tasa)
    const completa = montoUSD >= resta - 0.004
    const mov: Movimiento = {
      id: uid(),
      tipo: 'venta',
      fecha: hoy(),
      descripcion: `${completa ? 'Pago' : 'Abono'} · ${e.cliente.trim()}`,
      monto,
      moneda,
      tasa: tasa || 1,
      montoUSD,
      metodo,
      cliente: e.cliente.trim(),
      encargoId: e.id,
      updatedAt: 0,
    }
    guardarMovimiento(mov)
    const siguiente = nuevoEstado ? { ...e, estado: nuevoEstado } : e
    setE(siguiente)
    persistir(siguiente)
    setPago({ ...pago, monto: NaN })
    avisar(`${completa ? 'Pago' : 'Abono'} registrado · +${fmtUSD(montoUSD)}`)
  }

  const cambiarEstado = (estado: EstadoEncargo, texto: string) => {
    setIntento(true)
    if (!valido) return
    const x = { ...e, estado }
    setE(x)
    persistir(x)
    avisar(texto)
  }

  const guardar = () => {
    setIntento(true)
    if (!valido) return
    guardarEncargo(limpio(e))
    avisar(existente ? 'Encargo guardado' : `Encargo de ${e.cliente.trim()} anotado`)
    volver('/encargos')
  }

  const texto = mensajeEncargo(limpio(e), pagado, tasa, datos.ajustes.nombreNegocio, datos.ajustes.pago)
  const abierto = e.estado === 'pendiente' || e.estado === 'listo'

  return (
    <Pantalla titulo={existente ? `Encargo de ${existente.cliente}` : 'Nuevo encargo'} atras="/encargos">
      <form
        className="formulario editor-receta"
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault()
          guardar()
        }}
      >
        <div className="editor-columna">
          {existente && (
            <p className={`estado-encargo estado-${e.estado}`}>
              {ESTADOS[e.estado]} · entrega {fechaRelativa(e.entrega).toLowerCase()}
              {e.hora ? `, ${hora12(e.hora)}` : ''}
            </p>
          )}
          <div className="dos-columnas">
            <Campo etiqueta="Cliente" error={err('cliente')}>
              {(i, d) => (
                <>
                  <input
                    id={i}
                    aria-describedby={d}
                    list="clientes"
                    value={e.cliente}
                    placeholder="Sra. Carmen"
                    autoFocus={!existente}
                    onChange={(ev) => setE({ ...e, cliente: ev.target.value })}
                  />
                  <ListaClientes />
                </>
              )}
            </Campo>
            <Campo etiqueta="Teléfono (opcional)">
              {(i) => (
                <input
                  id={i}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={e.telefono ?? ''}
                  placeholder="0414 123 4567"
                  onChange={(ev) => setE({ ...e, telefono: ev.target.value })}
                />
              )}
            </Campo>
          </div>
          <div className="dos-columnas">
            <Campo etiqueta="Día de entrega" error={err('entrega')}>
              {(i, d) => (
                <input id={i} aria-describedby={d} type="date" value={e.entrega} onChange={(ev) => setE({ ...e, entrega: ev.target.value })} />
              )}
            </Campo>
            <Campo etiqueta="Hora (opcional)">
              {(i) => <input id={i} type="time" value={e.hora ?? ''} onChange={(ev) => setE({ ...e, hora: ev.target.value })} />}
            </Campo>
          </div>

          <fieldset className="bloque" aria-describedby={err('items') ? 'items-error' : undefined}>
            <legend>Qué lleva</legend>
            {e.items.length === 0 && <p className="tenue">Todavía no hay productos en este encargo.</p>}
            <ul className="items items-encargo">
              {e.items.map((it, idx) => {
                const r = it.recetaId ? datos.recetas[it.recetaId] : undefined
                const porciones = r && !r.deleted && tienePorciones(r)
                return (
                  <li key={idx} className="item-encargo">
                    <div className="item-encargo-fila">
                      <label className="solo-lector" htmlFor={`prod-${idx}`}>
                        Producto
                      </label>
                      <select
                        id={`prod-${idx}`}
                        value={it.recetaId && r && !r.deleted ? it.recetaId : ''}
                        onChange={(ev) => {
                          const nr = datos.recetas[ev.target.value]
                          if (!nr) return cambiarItem(idx, { recetaId: undefined, descripcion: '', precioUSD: NaN, formato: 'entero' })
                          const formato: Formato = it.formato === 'porcion' && tienePorciones(nr) ? 'porcion' : 'entero'
                          cambiarItem(idx, { recetaId: nr.id, descripcion: nr.nombre, formato, precioUSD: precio(nr.id, formato) })
                        }}
                      >
                        {recetas.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre}
                          </option>
                        ))}
                        <option value="">Otra cosa</option>
                      </select>
                      <button
                        type="button"
                        className="boton-icono"
                        aria-label={`Quitar ${it.descripcion || 'producto'}`}
                        onClick={() => setE({ ...e, items: e.items.filter((_, i) => i !== idx) })}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {!it.recetaId && (
                      <input
                        aria-label="Descripción"
                        value={it.descripcion}
                        placeholder="Torta temática, cupcakes…"
                        onChange={(ev) => cambiarItem(idx, { descripcion: ev.target.value })}
                      />
                    )}
                    {porciones && (
                      <Segmentos<Formato>
                        etiqueta="Formato"
                        valor={it.formato}
                        onCambio={(formato) => cambiarItem(idx, { formato, precioUSD: precio(it.recetaId, formato) })}
                        opciones={[
                          { valor: 'entero', texto: 'Entero' },
                          { valor: 'porcion', texto: 'Porción' },
                        ]}
                      />
                    )}
                    <div className="item-encargo-cifras">
                      <label className="campo-mini">
                        <span>Cant.</span>
                        <Numero valor={it.cantidad} onCambio={(cantidad) => cambiarItem(idx, { cantidad })} />
                      </label>
                      <label className="campo-mini">
                        <span>c/u</span>
                        <Numero prefijo="$" valor={Number.isNaN(it.precioUSD) ? undefined : it.precioUSD} onCambio={(precioUSD) => cambiarItem(idx, { precioUSD })} />
                      </label>
                      <span className="item-costo num">{fmtUSD((it.cantidad || 0) * (it.precioUSD || 0))}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            {err('items') && (
              <p id="items-error" className="campo-error">
                {err('items')}
              </p>
            )}
            <button type="button" className="boton boton-secundario" onClick={agregarItem}>
              <Plus size={18} /> Agregar producto
            </button>
          </fieldset>

          <Campo etiqueta="Notas (opcional)">
            {(i) => (
              <textarea
                id={i}
                rows={3}
                value={e.nota ?? ''}
                placeholder="Sabor, decoración, mensaje en la torta, dirección…"
                onChange={(ev) => setE({ ...e, nota: ev.target.value })}
              />
            )}
          </Campo>
        </div>

        <div className="editor-columna editor-precio">
          <dl className="renglones cuenta-encargo">
            <div>
              <dt>Total</dt>
              <dd className="num">
                {fmtUSD(total)} <span className="bs pequeno">{enBs(total, tasa)}</span>
              </dd>
            </div>
            <div>
              <dt>Pagado</dt>
              <dd className="num">{fmtUSD(pagado)}</dd>
            </div>
            <div className="renglon-total">
              <dt>{resta > 0.004 ? 'Falta por cobrar' : 'Todo pagado'}</dt>
              <dd className="num">
                {fmtUSD(resta)} <span className="bs pequeno">{enBs(resta, tasa)}</span>
              </dd>
            </div>
          </dl>

          {pagosLista.length > 0 && (
            <ul className="lista lista-compacta">
              {pagosLista.map((m) => (
                <li key={m.id}>
                  <a className="fila" href={`#/cuentas/${m.id}`}>
                    <span className="fila-principal">
                      <span className="fila-titulo">{m.descripcion.split(' · ')[0]}</span>
                      <span className="fila-sub">
                        {fechaRelativa(m.fecha)} · {METODOS.find((x) => x.valor === m.metodo)?.texto ?? 'Sin método'}
                      </span>
                    </span>
                    <span className="fila-cifra num">+{fmtUSD(m.montoUSD)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {abierto && resta > 0.004 && (
            <fieldset className="bloque">
              <legend>{pagado > 0 ? 'Registrar otro pago' : 'Registrar abono'}</legend>
              <div className="precio-moneda">
                <Numero
                  prefijo={pago.moneda === 'USD' ? '$' : 'Bs.'}
                  valor={Number.isNaN(pago.monto) ? undefined : pago.monto}
                  onCambio={(monto) => setPago({ ...pago, monto })}
                />
                <Segmentos<Moneda>
                  etiqueta="Moneda del pago"
                  valor={pago.moneda}
                  onCambio={(moneda) => setPago({ ...pago, moneda })}
                  opciones={[
                    { valor: 'USD', texto: '$' },
                    { valor: 'VES', texto: 'Bs' },
                  ]}
                />
              </div>
              <div className="fila-botones">
                <select
                  aria-label="¿Cómo te pagaron?"
                  value={pago.metodo}
                  onChange={(ev) => setPago({ ...pago, metodo: ev.target.value as MetodoPago })}
                  className="select-flex"
                >
                  {METODOS.map((x) => (
                    <option key={x.valor} value={x.valor}>
                      {x.texto}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="boton boton-secundario"
                  disabled={!(pago.monto > 0)}
                  onClick={() => registrarPago(pago.monto, pago.moneda, pago.metodo)}
                >
                  Agregar pago
                </button>
              </div>
              <button
                type="button"
                className="enlace-boton"
                onClick={() => setPago({ ...pago, moneda: 'USD', monto: Math.round((resta / 2) * 100) / 100 })}
              >
                Poner el 50% ({fmtUSD(resta / 2)})
              </button>
            </fieldset>
          )}

          {existente && abierto && (
            <div className="acciones-encargo">
              {entregando && resta > 0.004 ? (
                <div className="confirmar-suave">
                  <p>
                    Falta cobrar <strong className="num">{fmtUSD(resta)}</strong>. ¿Te lo pagaron al entregar?
                  </p>
                  <div className="fila-botones">
                    <button
                      type="button"
                      className="boton boton-primario"
                      onClick={() => registrarPago(Math.round(resta * 100) / 100, 'USD', pago.metodo, 'entregado')}
                    >
                      Sí, cobrar y entregar
                    </button>
                    <button type="button" className="boton boton-secundario" onClick={() => cambiarEstado('entregado', 'Entregado; queda debiendo')}>
                      Entregar, queda debiendo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fila-botones">
                  {e.estado === 'pendiente' && (
                    <button type="button" className="boton boton-secundario" onClick={() => cambiarEstado('listo', 'Marcado como listo')}>
                      Ya está listo
                    </button>
                  )}
                  <button
                    type="button"
                    className="boton boton-primario"
                    onClick={() => (resta > 0.004 ? setEntregando(true) : cambiarEstado('entregado', '¡Encargo entregado!'))}
                  >
                    <Check size={18} /> Entregado
                  </button>
                </div>
              )}
            </div>
          )}

          {existente && !abierto && (
            <button type="button" className="boton boton-secundario" onClick={() => cambiarEstado('pendiente', 'Encargo reabierto')}>
              Reabrir encargo
            </button>
          )}

          <div className="fila-botones">
            <a
              className="boton boton-whatsapp"
              href={enlaceWhatsApp(texto, e.telefono)}
              target="_blank"
              rel="noreferrer"
              onClick={(ev) => {
                if (!valido) {
                  ev.preventDefault()
                  setIntento(true)
                }
              }}
            >
              <MessageCircle size={18} /> Enviar por WhatsApp
            </a>
            {'share' in navigator && (
              <button type="button" className="boton boton-secundario" onClick={() => void compartir(texto, 'Pedido')}>
                Compartir
              </button>
            )}
            {resta > 0.004 && abierto && (
              <a className="boton boton-secundario" href={`#/cobrar?monto=${Math.round(resta * 100) / 100}`}>
                <Smartphone size={18} /> Cobrar
              </a>
            )}
          </div>
        </div>

        <div className="pie-formulario pie-fijo">
          <p className="pie-precio num" aria-hidden="true">
            <span>
              Total <strong>{fmtUSD(total)}</strong>
            </span>
            <span>{resta > 0.004 ? `Falta ${fmtUSD(resta)}` : total > 0 ? 'Pagado' : ''}</span>
          </p>
          <button type="submit" className="boton boton-primario boton-ancho">
            Guardar encargo
          </button>
        </div>
        {existente && (
          <div className="pie-borrar">
            {abierto && (
              <button type="button" className="boton boton-peligro-suave" onClick={() => cambiarEstado('cancelado', 'Encargo cancelado')}>
                Cancelar encargo
              </button>
            )}
            <button
              type="button"
              className="boton boton-peligro-suave"
              onClick={() => {
                borrar('encargos', existente.id, 'Encargo borrado')
                ir('/encargos')
              }}
            >
              Borrar encargo
            </button>
            {pagosLista.length > 0 && <p className="tenue pequeno">Los pagos ya recibidos se quedan en tus cuentas.</p>}
          </div>
        )}
      </form>
    </Pantalla>
  )
}
