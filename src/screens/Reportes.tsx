import { useMemo, useState } from 'react'
import { resumenMes, serieMeses, type Mes } from '../../shared/calc'
import { Pantalla } from '../components/ui'
import { fmtPct, fmtUSD, hoy, mesDe, nombreMes, unidadesTexto } from '../lib/format'
import { useApp, vivos } from '../lib/store'
import { METODOS, SelectorMes } from './Cuentas'

const ALTO = 180
const ANCHO_GRUPO = 56

function mesCorto(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')
}

/** Rounded top, square base: the bar stays anchored to the baseline. */
function barra(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

function GraficoMeses({ meses }: { meses: Mes[] }) {
  const [activo, setActivo] = useState<number | null>(null)
  const max = Math.max(1, ...meses.flatMap((m) => [m.ingresos, m.gastos]))
  const paso = max > 400 ? 200 : max > 100 ? 50 : max > 40 ? 20 : 10
  const tope = Math.ceil(max / paso) * paso
  const lineas = Array.from({ length: Math.floor(tope / paso) + 1 }, (_, i) => i * paso)
  const ancho = meses.length * ANCHO_GRUPO + 40
  const y = (v: number) => ALTO - (v / tope) * ALTO
  const sel = activo !== null ? meses[activo] : null

  return (
    <figure className="grafico">
      <figcaption className="grafico-leyenda">
        <span>
          <span className="muestra" style={{ background: 'var(--serie-1)' }} aria-hidden="true" /> Ventas
        </span>
        <span>
          <span className="muestra" style={{ background: 'var(--serie-gasto)' }} aria-hidden="true" /> Gastos
        </span>
      </figcaption>
      <div className="grafico-lienzo">
        <svg viewBox={`0 0 ${ancho} ${ALTO + 28}`} role="img" aria-label="Ventas y gastos de los últimos meses">
          {lineas.map((v) => (
            <g key={v}>
              <line x1={36} x2={ancho} y1={y(v) + 4} y2={y(v) + 4} className="grafico-rejilla" />
              <text x={30} y={y(v) + 8} className="grafico-eje" textAnchor="end">
                {v >= 1000 ? `${v / 1000}k` : v}
              </text>
            </g>
          ))}
          {meses.map((m, i) => {
            const x0 = 40 + i * ANCHO_GRUPO + 8
            const w = 18
            return (
              <g
                key={m.mes}
                className="grafico-grupo"
                data-apagado={activo !== null && activo !== i ? '' : undefined}
                onPointerEnter={() => setActivo(i)}
                onPointerLeave={() => setActivo(null)}
              >
                <rect x={x0 - 6} y={0} width={ANCHO_GRUPO - 4} height={ALTO + 28} fill="transparent" />
                <path d={barra(x0, y(m.ingresos) + 4, w, (m.ingresos / tope) * ALTO)} fill="var(--serie-1)" />
                <path d={barra(x0 + w + 2, y(m.gastos) + 4, w, (m.gastos / tope) * ALTO)} fill="var(--serie-gasto)" />
                <text x={x0 + w + 1} y={ALTO + 22} className="grafico-eje" textAnchor="middle">
                  {mesCorto(m.mes)}
                </text>
              </g>
            )
          })}
        </svg>
        {sel && activo !== null && (
          <div className="grafico-tooltip" style={{ left: `${((40 + activo * ANCHO_GRUPO + 28) / ancho) * 100}%` }} role="status">
            <strong>{nombreMes(sel.mes)}</strong>
            <span>
              <span className="muestra" style={{ background: 'var(--serie-1)' }} aria-hidden="true" /> Ventas {fmtUSD(sel.ingresos)}
            </span>
            <span>
              <span className="muestra" style={{ background: 'var(--serie-gasto)' }} aria-hidden="true" /> Gastos {fmtUSD(sel.gastos)}
            </span>
            <span>Ganancia {fmtUSD(sel.ganancia)}</span>
          </div>
        )}
      </div>
      <table className="tabla-datos">
        <caption className="solo-lector">Ventas, gastos y ganancia por mes</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Ventas</th>
            <th scope="col">Gastos</th>
            <th scope="col">Ganancia</th>
          </tr>
        </thead>
        <tbody>
          {[...meses].reverse().map((m) => (
            <tr key={m.mes}>
              <th scope="row">{nombreMes(m.mes)}</th>
              <td className="num">{fmtUSD(m.ingresos)}</td>
              <td className="num">{fmtUSD(m.gastos)}</td>
              <td className={`num ${m.ganancia < 0 ? 'texto-peligro' : ''}`}>{fmtUSD(m.ganancia)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Monthly goal progress; a plain meter, the figures beside it carry the meaning. */
export function Meta({ vendido, meta }: { vendido: number; meta: number }) {
  const frac = meta > 0 ? Math.min(vendido / meta, 1) : 0
  const logrado = vendido >= meta
  return (
    <div className="meta">
      <div className="meta-textos">
        <span>{logrado ? '¡Llegaste a tu meta del mes!' : `Meta del mes: ${fmtUSD(meta)}`}</span>
        <span className="num tenue">
          {fmtPct(meta > 0 ? vendido / meta : 0)}
          {!logrado && ` · faltan ${fmtUSD(meta - vendido)}`}
        </span>
      </div>
      <div className="meta-barra" role="meter" aria-valuemin={0} aria-valuemax={meta} aria-valuenow={Math.round(vendido)} aria-label="Avance de la meta">
        <span style={{ transform: `scaleX(${frac})` }} data-logrado={logrado ? '' : undefined} />
      </div>
    </div>
  )
}

export function Reportes() {
  const { datos } = useApp()
  const [mes, setMes] = useState(() => mesDe(hoy()))
  const movs = useMemo(() => vivos(datos.movimientos), [datos.movimientos])
  const meses = serieMeses(movs, mesDe(hoy()), 6)
  const r = resumenMes(movs, mes, vivos(datos.encargos))
  const maxProd = Math.max(1, ...r.porReceta.map((p) => p.monto))
  const maxMet = Math.max(1, ...r.porMetodo.map((p) => p.monto))
  const meta = datos.ajustes.metaMensual ?? 0

  return (
    <Pantalla titulo="Reportes" atras="/mas">
      <section className="seccion">
        <h2>Últimos 6 meses</h2>
        <GraficoMeses meses={meses} />
      </section>

      <section className="seccion">
        <SelectorMes mes={mes} onCambio={setMes} />
        {meta > 0 && <Meta vendido={r.ingresos} meta={meta} />}
        <dl className="renglones">
          <div>
            <dt>Vendiste</dt>
            <dd className="num">+{fmtUSD(r.ingresos)}</dd>
          </div>
          <div>
            <dt>Gastaste</dt>
            <dd className="num">−{fmtUSD(r.gastos)}</dd>
          </div>
          <div className="renglon-total">
            <dt>Te quedó</dt>
            <dd className={`num ${r.ganancia < 0 ? 'texto-peligro' : ''}`}>{fmtUSD(r.ganancia)}</dd>
          </div>
        </dl>
      </section>

      <section className="seccion">
        <h2>Lo más vendido</h2>
        {r.porReceta.length === 0 ? (
          <p className="tenue">Sin ventas de productos este mes.</p>
        ) : (
          <ul className="barras">
            {r.porReceta.map((p) => (
              <li key={p.recetaId}>
                <div className="barras-texto">
                  <span>{datos.recetas[p.recetaId]?.nombre ?? 'Producto borrado'}</span>
                  <span className="num">{fmtUSD(p.monto)}</span>
                </div>
                <div className="barras-pista">
                  <span style={{ transform: `scaleX(${p.monto / maxProd})` }} />
                </div>
                <span className="tenue pequeno">
                  {unidadesTexto(p.enteros, p.porciones)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="seccion">
        <h2>Cómo te pagaron</h2>
        {r.porMetodo.length === 0 ? (
          <p className="tenue">Sin cobros este mes.</p>
        ) : (
          <ul className="barras">
            {r.porMetodo.map((p) => (
              <li key={p.metodo}>
                <div className="barras-texto">
                  <span>{METODOS.find((x) => x.valor === p.metodo)?.texto ?? 'Sin método'}</span>
                  <span className="num">
                    {fmtUSD(p.monto)} <span className="tenue">· {fmtPct(r.ingresos > 0 ? p.monto / r.ingresos : 0)}</span>
                  </span>
                </div>
                <div className="barras-pista">
                  <span style={{ transform: `scaleX(${p.monto / maxMet})` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Pantalla>
  )
}
