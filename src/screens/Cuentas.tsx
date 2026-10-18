import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { aUSD, desglose, resumenMes } from '../../shared/calc'
import type { CategoriaGasto, MetodoPago, Moneda, Movimiento } from '../../shared/types'
import { Campo, Confirmar, Numero, Pantalla, Segmentos, Vacio } from '../components/ui'
import { enBs, fechaCorta, fmtBs, fmtNum, fmtUSD, hoy, mesDe, moverMes, nombreMes, uid } from '../lib/format'
import { ir, parametro, volver } from '../lib/router'
import { useApp, useTasa, vivos } from '../lib/store'

export const METODOS: { valor: MetodoPago; texto: string }[] = [
  { valor: 'pago-movil', texto: 'Pago móvil' },
  { valor: 'efectivo-usd', texto: 'Efectivo $' },
  { valor: 'efectivo-bs', texto: 'Efectivo Bs' },
  { valor: 'transferencia', texto: 'Transferencia' },
  { valor: 'punto', texto: 'Punto de venta' },
  { valor: 'zelle', texto: 'Zelle' },
  { valor: 'otro', texto: 'Otro' },
]

export const CATEGORIAS: { valor: CategoriaGasto; texto: string }[] = [
  { valor: 'insumos', texto: 'Ingredientes' },
  { valor: 'empaque', texto: 'Empaque' },
  { valor: 'servicios', texto: 'Gas, luz, internet' },
  { valor: 'equipos', texto: 'Equipos y moldes' },
  { valor: 'transporte', texto: 'Transporte y delivery' },
  { valor: 'otros', texto: 'Otros' },
]

export function SelectorMes({ mes, onCambio }: { mes: string; onCambio: (m: string) => void }) {
  return (
    <div className="selector-mes">
      <button type="button" className="boton-icono" aria-label="Mes anterior" onClick={() => onCambio(moverMes(mes, -1))}>
        <ChevronLeft size={20} />
      </button>
      <span aria-live="polite">{nombreMes(mes)}</span>
      <button
        type="button"
        className="boton-icono"
        aria-label="Mes siguiente"
        disabled={mes >= mesDe(hoy())}
        onClick={() => onCambio(moverMes(mes, 1))}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export function FilaMovimiento({ m, nombreReceta }: { m: Movimiento; nombreReceta?: string }) {
  const venta = m.tipo === 'venta'
  const titulo = m.descripcion || nombreReceta || (venta ? 'Venta' : 'Gasto')
  const detalle = venta
    ? [m.cantidad && m.cantidad !== 1 ? `${fmtNum(m.cantidad)} und` : null, METODOS.find((x) => x.valor === m.metodo)?.texto, m.cliente]
    : [CATEGORIAS.find((x) => x.valor === m.categoria)?.texto]
  return (
    <a href={`#/cuentas/${m.id}`} className="fila">
      <span className={`fila-marca ${venta ? 'marca-venta' : 'marca-gasto'}`} aria-hidden="true">
        {venta ? <Plus size={16} /> : <Minus size={16} />}
      </span>
      <span className="fila-principal">
        <span className="fila-titulo">{titulo}</span>
        <span className="fila-sub">{detalle.filter(Boolean).join(' · ') || fechaCorta(m.fecha)}</span>
      </span>
      <span className="fila-cifra">
        <span className="num">
          {venta ? '+' : '−'}
          {fmtUSD(m.montoUSD)}
        </span>
        <span className="fila-sub num bs">{m.moneda === 'VES' ? fmtBs(m.monto) : enBs(m.montoUSD, m.tasa)}</span>
      </span>
    </a>
  )
}

export function Cuentas() {
  const { datos } = useApp()
  const [mes, setMes] = useState(() => mesDe(hoy()))
  const [filtro, setFiltro] = useState<'todo' | 'venta' | 'gasto'>('todo')
  const movs = useMemo(() => vivos(datos.movimientos), [datos.movimientos])
  const resumen = resumenMes(movs, mes)
  const delMes = movs
    .filter((m) => m.fecha.startsWith(mes) && (filtro === 'todo' || m.tipo === filtro))
    .sort((a, b) => (a.fecha === b.fecha ? b.updatedAt - a.updatedAt : b.fecha.localeCompare(a.fecha)))
  const porDia = new Map<string, Movimiento[]>()
  for (const m of delMes) porDia.set(m.fecha, [...(porDia.get(m.fecha) ?? []), m])

  return (
    <Pantalla
      titulo="Cuentas"
      accion={
        <a className="boton boton-secundario boton-chico" href="#/cuentas/nuevo?tipo=gasto">
          <Minus size={18} /> Gasto
        </a>
      }
    >
      <SelectorMes mes={mes} onCambio={setMes} />
      <dl className="renglones">
        <div>
          <dt>Ventas</dt>
          <dd className="num">+{fmtUSD(resumen.ingresos)}</dd>
        </div>
        <div>
          <dt>Gastos</dt>
          <dd className="num">−{fmtUSD(resumen.gastos)}</dd>
        </div>
        <div className="renglon-total">
          <dt>Ganancia</dt>
          <dd className={`num ${resumen.ganancia < 0 ? 'texto-peligro' : ''}`}>{fmtUSD(resumen.ganancia)}</dd>
        </div>
      </dl>
      <Segmentos
        etiqueta="Mostrar"
        valor={filtro}
        onCambio={setFiltro}
        opciones={[
          { valor: 'todo', texto: 'Todo' },
          { valor: 'venta', texto: 'Ventas' },
          { valor: 'gasto', texto: 'Gastos' },
        ]}
      />
      {delMes.length === 0 ? (
        <Vacio
          titulo={filtro === 'gasto' ? 'Sin gastos este mes' : filtro === 'venta' ? 'Sin ventas este mes' : 'Nada anotado este mes'}
          accion={
            <a className="boton boton-primario" href={`#/cuentas/nuevo?tipo=${filtro === 'gasto' ? 'gasto' : 'venta'}`}>
              <Plus size={18} /> {filtro === 'gasto' ? 'Anotar gasto' : 'Registrar venta'}
            </a>
          }
        >
          Anota cada venta y cada compra, y aquí verás cuánto entró, cuánto salió y cuánto te quedó.
        </Vacio>
      ) : (
        [...porDia.entries()].map(([fecha, items]) => (
          <div key={fecha} className="grupo">
            <h2 className="grupo-titulo">{fechaCorta(fecha)}</h2>
            <ul className="lista">
              {items.map((m) => (
                <li key={m.id}>
                  <FilaMovimiento m={m} nombreReceta={m.recetaId ? datos.recetas[m.recetaId]?.nombre : undefined} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <a className="boton boton-primario boton-flotante" href="#/cuentas/nuevo?tipo=venta">
        <Plus size={20} /> Registrar venta
      </a>
    </Pantalla>
  )
}

export function FormMovimiento({ id }: { id: string }) {
  const { datos, guardarMovimiento, borrar } = useApp()
  const tasaHoy = useTasa()
  const existente = id !== 'nuevo' ? datos.movimientos[id] : undefined
  const recetas = vivos(datos.recetas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const precioDe = (recetaId?: string) => {
    const r = recetaId ? datos.recetas[recetaId] : undefined
    return r ? desglose(r, datos.insumos, datos.ajustes).precio : NaN
  }
  const [m, setM] = useState<Movimiento>(() => {
    if (existente) return existente
    const tipo = parametro('tipo') === 'gasto' ? 'gasto' : 'venta'
    const recetaId = tipo === 'venta' ? (parametro('receta') ?? recetas[0]?.id) : undefined
    return {
      id: uid(),
      tipo,
      fecha: hoy(),
      descripcion: '',
      recetaId,
      cantidad: tipo === 'venta' ? 1 : undefined,
      monto: tipo === 'venta' ? precioDe(recetaId) : NaN,
      moneda: 'USD',
      tasa: tasaHoy,
      montoUSD: 0,
      metodo: tipo === 'venta' ? 'pago-movil' : undefined,
      categoria: tipo === 'gasto' ? 'insumos' : undefined,
      updatedAt: 0,
    }
  })
  const [intento, setIntento] = useState(false)
  // The rate may arrive after the form opens; fill it in unless the user already typed one.
  useEffect(() => {
    if (!existente && tasaHoy > 0) setM((x) => (x.tasa > 0 ? x : { ...x, tasa: tasaHoy }))
  }, [existente, tasaHoy])

  if (id !== 'nuevo' && !existente) {
    return (
      <Pantalla titulo="Movimiento" atras="/cuentas">
        <Vacio titulo="Este registro ya no existe">Puede que lo hayas borrado desde otro dispositivo.</Vacio>
      </Pantalla>
    )
  }

  const venta = m.tipo === 'venta'
  const montoUSD = aUSD(m.monto, m.moneda, m.tasa)
  const errores = {
    monto: !(m.monto > 0) ? 'Escribe el monto.' : '',
    tasa: !(m.tasa > 0) ? 'Falta la tasa BCV del día.' : '',
    descripcion: !venta && !m.descripcion.trim() ? '¿En qué gastaste?' : '',
    fecha: !/^\d{4}-\d{2}-\d{2}$/.test(m.fecha) ? 'Elige la fecha.' : '',
  }
  const err = (k: keyof typeof errores) => (intento ? errores[k] : '')

  /** Re-price a sale from its recipe and quantity, in the chosen currency. */
  const conPrecio = (n: Partial<Movimiento>): Movimiento => {
    const x = { ...m, ...n }
    const p = precioDe(x.recetaId)
    if (!venta || !Number.isFinite(p)) return x
    const usd = p * (x.cantidad || 1)
    return { ...x, monto: x.moneda === 'VES' ? Math.round(usd * x.tasa * 100) / 100 : usd }
  }

  const guardar = () => {
    setIntento(true)
    if (Object.values(errores).some(Boolean)) return
    guardarMovimiento({ ...m, descripcion: m.descripcion.trim(), cliente: m.cliente?.trim() || undefined, montoUSD })
    volver('/cuentas')
  }

  return (
    <Pantalla titulo={existente ? (venta ? 'Editar venta' : 'Editar gasto') : venta ? 'Registrar venta' : 'Anotar gasto'} atras="/cuentas">
      <form
        className="formulario"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        {!existente && (
          <Segmentos
            etiqueta="Tipo"
            valor={m.tipo}
            onCambio={(tipo) =>
              setM({
                ...m,
                tipo,
                recetaId: tipo === 'venta' ? recetas[0]?.id : undefined,
                cantidad: tipo === 'venta' ? 1 : undefined,
                monto: tipo === 'venta' ? precioDe(recetas[0]?.id) : NaN,
                metodo: tipo === 'venta' ? 'pago-movil' : undefined,
                categoria: tipo === 'gasto' ? 'insumos' : undefined,
              })
            }
            opciones={[
              { valor: 'venta', texto: 'Venta' },
              { valor: 'gasto', texto: 'Gasto' },
            ]}
          />
        )}

        {venta ? (
          <>
            {recetas.length > 0 ? (
              <div className="dos-columnas dos-columnas-ancha">
                <Campo etiqueta="¿Qué vendiste?">
                  {(i) => (
                    <select id={i} value={m.recetaId ?? ''} onChange={(e) => setM(conPrecio({ recetaId: e.target.value || undefined }))}>
                      {recetas.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                      <option value="">Otra cosa</option>
                    </select>
                  )}
                </Campo>
                <Campo etiqueta="Cantidad">
                  {(i) => <Numero id={i} valor={m.cantidad} onCambio={(cantidad) => setM(conPrecio({ cantidad }))} />}
                </Campo>
              </div>
            ) : (
              <p className="tenue">
                Consejo: si creas tus <a href="#/recetas">recetas</a>, el precio se llena solo.
              </p>
            )}
            {!m.recetaId && (
              <Campo etiqueta="Descripción">
                {(i) => (
                  <input id={i} value={m.descripcion} placeholder="Torta por encargo" onChange={(e) => setM({ ...m, descripcion: e.target.value })} />
                )}
              </Campo>
            )}
          </>
        ) : (
          <>
            <Campo etiqueta="¿En qué gastaste?" error={err('descripcion')}>
              {(i, d) => (
                <input
                  id={i}
                  aria-describedby={d}
                  value={m.descripcion}
                  placeholder="Harina y huevos"
                  autoFocus={!existente}
                  onChange={(e) => setM({ ...m, descripcion: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Categoría">
              {(i) => (
                <select id={i} value={m.categoria} onChange={(e) => setM({ ...m, categoria: e.target.value as CategoriaGasto })}>
                  {CATEGORIAS.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.texto}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </>
        )}

        <Campo etiqueta={venta ? 'Cobraste' : 'Pagaste'} error={err('monto')}>
          {(i, d) => (
            <div className="precio-moneda">
              <Numero
                id={i}
                describedBy={d}
                prefijo={m.moneda === 'USD' ? '$' : 'Bs.'}
                valor={Number.isNaN(m.monto) ? undefined : m.monto}
                onCambio={(monto) => setM({ ...m, monto })}
              />
              <Segmentos<Moneda>
                etiqueta="Moneda"
                valor={m.moneda}
                onCambio={(moneda) => {
                  if (moneda === m.moneda) return
                  // Convert what is already typed so switching currency keeps the same value.
                  const monto =
                    m.monto > 0 && m.tasa > 0
                      ? moneda === 'VES'
                        ? Math.round(m.monto * m.tasa * 100) / 100
                        : Math.round((m.monto / m.tasa) * 100) / 100
                      : m.monto
                  setM({ ...m, moneda, monto })
                }}
                opciones={[
                  { valor: 'USD', texto: '$' },
                  { valor: 'VES', texto: 'Bs' },
                ]}
              />
            </div>
          )}
        </Campo>

        <div className="dos-columnas">
          <Campo etiqueta="Fecha" error={err('fecha')}>
            {(i, d) => (
              <input id={i} aria-describedby={d} type="date" value={m.fecha} max={hoy()} onChange={(e) => setM({ ...m, fecha: e.target.value })} />
            )}
          </Campo>
          <Campo etiqueta="Tasa BCV" error={err('tasa')}>
            {(i, d) => <Numero id={i} describedBy={d} valor={m.tasa || undefined} sufijo="Bs/$" onCambio={(tasa) => setM({ ...m, tasa })} />}
          </Campo>
        </div>

        {venta && (
          <>
            <Campo etiqueta="¿Cómo te pagaron?">
              {(i) => (
                <select id={i} value={m.metodo} onChange={(e) => setM({ ...m, metodo: e.target.value as MetodoPago })}>
                  {METODOS.map((x) => (
                    <option key={x.valor} value={x.valor}>
                      {x.texto}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Cliente (opcional)">
              {(i) => <input id={i} value={m.cliente ?? ''} placeholder="Sra. Carmen" onChange={(e) => setM({ ...m, cliente: e.target.value })} />}
            </Campo>
          </>
        )}

        <div className="resultado" aria-live="polite">
          {m.monto > 0 && m.tasa > 0 ? (
            <>
              <span className="resultado-cifra num">{fmtUSD(montoUSD)}</span>
              <span className="tenue num">
                <span className="bs">{fmtBs(montoUSD * m.tasa)}</span> a la tasa de ese día
              </span>
            </>
          ) : (
            <span className="tenue">Se guarda en dólares con la tasa del día, para que tus cuentas no cambien con el dólar.</span>
          )}
        </div>

        <div className="pie-formulario">
          <button type="submit" className="boton boton-primario boton-ancho">
            {venta ? 'Guardar venta' : 'Guardar gasto'}
          </button>
          {existente && (
            <Confirmar
              texto="¿Borrar este registro? Se quita de tus cuentas."
              onConfirmar={() => {
                borrar('movimientos', existente.id)
                ir('/cuentas')
              }}
            >
              Borrar registro
            </Confirmar>
          )}
        </div>
      </form>
    </Pantalla>
  )
}
