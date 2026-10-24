import { CalendarPlus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cuentaEncargo, encargoAbierto, pagosPorEncargo, resumenMes } from '../../shared/calc'
import { Vacio } from '../components/ui'
import { enBs, fechaRelativa, fmtUSD, hoy, mesDe, saludo, unidadesTexto } from '../lib/format'
import { useApp, useTasa, vivos } from '../lib/store'
import { FilaMovimiento, SelectorMes } from './Cuentas'
import { FilaEncargo } from './Encargos'
import { Meta } from './Reportes'

export function Inicio() {
  const { datos } = useApp()
  const tasa = useTasa()
  const [mes, setMes] = useState(() => mesDe(hoy()))
  const movs = useMemo(() => vivos(datos.movimientos), [datos.movimientos])
  const encargos = useMemo(() => vivos(datos.encargos), [datos.encargos])
  const pagos = useMemo(() => pagosPorEncargo(movs), [movs])
  const r = resumenMes(movs, mes, encargos)
  const esteMes = mes === mesDe(hoy())
  const abiertos = encargos
    .filter(encargoAbierto)
    .sort((a, b) => (a.entrega + (a.hora ?? '99')).localeCompare(b.entrega + (b.hora ?? '99')))
  const teDeben = abiertos.reduce((s, e) => s + cuentaEncargo(e, pagos).resta, 0)
  const recientes = movs
    .filter((m) => m.fecha.startsWith(mes))
    .sort((a, b) => (a.fecha === b.fecha ? b.updatedAt - a.updatedAt : b.fecha.localeCompare(a.fecha)))
    .slice(0, 5)
  const sinNada = vivos(datos.insumos).length === 0 && vivos(datos.recetas).length === 0 && movs.length === 0 && encargos.length === 0
  const meta = datos.ajustes.metaMensual ?? 0

  return (
    <section className="pantalla inicio">
      <h1 className="solo-lector">Inicio</h1>
      <div className="inicio-mes">
        <p className="saludo">{saludo()}</p>
        <SelectorMes mes={mes} onCambio={setMes} />

        <div className="ganancia">
          <span className="ganancia-etiqueta">{r.ganancia < 0 ? 'Este mes vas perdiendo' : esteMes ? 'Te quedó este mes' : 'Te quedó ese mes'}</span>
          <span className={`ganancia-cifra num ${r.ganancia < 0 ? 'texto-peligro' : ''}`}>{fmtUSD(r.ganancia)}</span>
          <span className="ganancia-bs bs num">{enBs(r.ganancia, tasa)}</span>
        </div>

        {meta > 0 ? (
          <Meta vendido={r.ingresos} meta={meta} />
        ) : (
          esteMes &&
          !sinNada && (
            <a className="enlace-suave" href="#/ajustes">
              Ponte una meta de ventas para el mes
            </a>
          )
        )}

        <dl className="renglones">
          <div>
            <dt>
              Vendiste
              <span className="tenue pequeno">
                {' '}
                · {r.ventas} {r.ventas === 1 ? 'venta' : 'ventas'}
              </span>
            </dt>
            <dd className="num">+{fmtUSD(r.ingresos)}</dd>
          </div>
          <div>
            <dt>Gastaste</dt>
            <dd className="num">−{fmtUSD(r.gastos)}</dd>
          </div>
          {teDeben > 0.004 && (
            <div>
              <dt>
                <a href="#/encargos">Te deben por encargos</a>
              </dt>
              <dd className="num texto-debe">{fmtUSD(teDeben)}</dd>
            </div>
          )}
        </dl>

        <div className="acciones-inicio">
          <a className="boton boton-primario boton-grande" href="#/cuentas/nuevo?tipo=venta">
            <Plus size={22} /> Registrar venta
          </a>
          <a className="boton boton-secundario boton-grande" href="#/encargos/nuevo">
            <CalendarPlus size={20} /> Encargo
          </a>
        </div>
      </div>

      <div className="inicio-lado">
        {sinNada ? (
          <Vacio
            titulo="¡Bienvenida!"
            accion={
              <div className="fila-botones fila-botones-columna">
                <a className="boton boton-secundario" href="#/insumos/nuevo">
                  1. Anotar lo que compras
                </a>
                <a className="boton boton-secundario" href="#/productos">
                  2. Calcular un producto
                </a>
                <a className="boton boton-secundario" href="#/encargos/nuevo">
                  3. Anotar un encargo
                </a>
              </div>
            }
          >
            Anota lo que compras, arma tus productos y la app te dice en cuánto venderlos. Después registras ventas y
            encargos, y aquí ves cuánto ganas.
          </Vacio>
        ) : (
          <>
            {abiertos.length > 0 && (
              <div className="grupo">
                <div className="grupo-cabeza">
                  <h2 className="grupo-titulo">Próximas entregas</h2>
                  <a href="#/encargos" className="enlace-suave">
                    Ver todas ({abiertos.length})
                  </a>
                </div>
                <ul className="lista">
                  {abiertos.slice(0, 3).map((e) => {
                    const c = cuentaEncargo(e, pagos)
                    return (
                      <li key={e.id}>
                        <FilaEncargo e={e} resta={c.resta} total={c.total} fecha={fechaRelativa(e.entrega)} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {r.porReceta.length > 0 && (
              <div className="grupo">
                <h2 className="grupo-titulo">Lo que más vendiste</h2>
                <ul className="lista lista-compacta">
                  {r.porReceta.slice(0, 3).map((p) => (
                    <li key={p.recetaId} className="fila">
                      <span className="fila-principal">
                        <span className="fila-titulo">{datos.recetas[p.recetaId]?.nombre ?? 'Producto borrado'}</span>
                        <span className="fila-sub">
                          {unidadesTexto(p.enteros, p.porciones)}
                        </span>
                      </span>
                      <span className="fila-cifra num">{fmtUSD(p.monto)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grupo">
              <div className="grupo-cabeza">
                <h2 className="grupo-titulo">Lo último</h2>
                <a className="enlace-suave" href="#/cuentas">
                  Ver cuentas
                </a>
              </div>
              {recientes.length === 0 ? (
                <p className="tenue">Nada anotado en este mes.</p>
              ) : (
                <ul className="lista">
                  {recientes.map((m) => (
                    <li key={m.id}>
                      <FilaMovimiento m={m} nombreReceta={m.recetaId ? datos.recetas[m.recetaId]?.nombre : undefined} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
