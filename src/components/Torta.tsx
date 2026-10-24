import { useState } from 'react'
import type { Desglose } from '../../shared/calc'
import type { Formato } from '../../shared/types'
import { enBs, fmtPct, fmtUSD } from '../lib/format'

// Validated categorical order (dataviz validate_palette, light, surface #FFFAFC): fixed, never cycled.
export const PORCIONES = [
  { clave: 'ingredientes', nombre: 'Ingredientes', color: 'var(--serie-1)' },
  { clave: 'empaque', nombre: 'Empaque', color: 'var(--serie-2)' },
  { clave: 'horno', nombre: 'Horno', color: 'var(--serie-3)' },
  { clave: 'trabajo', nombre: 'Tu trabajo', color: 'var(--serie-4)' },
  { clave: 'merma', nombre: 'Merma', color: 'var(--serie-5)' },
  { clave: 'ganancia', nombre: 'Ganancia', color: 'var(--serie-6)' },
] as const

type Clave = (typeof PORCIONES)[number]['clave']

const R = 70
const GROSOR = 34
const CIRC = 2 * Math.PI * R
const HUECO = 2.2 // surface gap between slices, in px along the ring

/**
 * A bizcocho seen from above on its gold cake board: each slice is where part of the
 * price goes, whole or per portion. Hovering a slice or a legend row names it in the centre.
 */
export function Torta({
  d,
  formato = 'entero',
  tasa,
  compacta,
  alVer,
}: {
  d: Desglose
  formato?: Formato
  tasa: number
  /** Small cake beside the price, for the top of the phone editor. */
  compacta?: boolean
  alVer?: () => void
}) {
  const [activa, setActiva] = useState<Clave | null>(null)
  const porPorcion = formato === 'porcion' && d.rinde > 1
  const n = porPorcion ? d.rinde : 1
  const p = porPorcion ? d.porcion : d.entero
  const etiqueta = porPorcion ? 'Precio por porción' : 'Precio entero'
  const valores: Record<Clave, number> = {
    ingredientes: d.ingredientes / n,
    empaque: d.empaque / n,
    horno: d.horno / n,
    trabajo: d.trabajo / n,
    merma: d.merma / n,
    ganancia: Math.max(p.ganancia, 0),
  }
  const total = Object.values(valores).reduce((a, b) => a + b, 0)
  const pierde = p.ganancia < 0

  let acumulado = 0
  const arcos = PORCIONES.map((p) => {
    const v = valores[p.clave]
    const frac = total > 0 ? v / total : 0
    const largo = Math.max(frac * CIRC - (frac > 0 && frac < 1 ? HUECO : 0), 0)
    const inicio = acumulado
    acumulado += frac * CIRC
    return { ...p, v, frac, largo, inicio }
  })

  const sel = activa ? arcos.find((a) => a.clave === activa) : null

  const dibujo = (
    <svg viewBox="0 0 200 200" className="torta-svg" role="img" aria-hidden="true">
      <circle cx="100" cy="100" r="98" className="torta-base" />
      <circle cx="100" cy="100" r="93.5" className="torta-base-brillo" />
      <circle cx="100" cy="100" r={R + GROSOR / 2 + 1} className="torta-fondo" />
      {total === 0 ? (
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--linea)" strokeWidth={GROSOR} />
      ) : (
        <g transform="rotate(-90 100 100)">
          {arcos.map((a) => (
            <circle
              key={a.clave}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={activa === a.clave ? GROSOR + 6 : GROSOR}
              strokeDasharray={`${a.largo} ${CIRC}`}
              strokeDashoffset={-a.inicio}
              className="torta-porcion"
              data-apagada={activa && activa !== a.clave ? '' : undefined}
              onPointerEnter={compacta ? undefined : () => setActiva(a.clave)}
              onPointerLeave={compacta ? undefined : () => setActiva(null)}
            />
          ))}
        </g>
      )}
    </svg>
  )

  if (compacta) {
    return (
      <div className="torta-mini">
        {dibujo}
        <div className="torta-mini-texto">
          <span className="torta-centro-etiqueta">{etiqueta}</span>
          <strong className="torta-mini-valor num">{fmtUSD(p.precio)}</strong>
          <span className="bs num">{enBs(p.precio, tasa)}</span>
          <span className="tenue pequeno num">
            {pierde ? (
              <span className="texto-peligro">Pierdes {fmtUSD(-p.ganancia)}</span>
            ) : (
              <>
                Costo {fmtUSD(p.costo)} · ganas {fmtPct(p.margen)}
              </>
            )}
          </span>
          {alVer && (
            <button type="button" className="enlace-boton" onClick={alVer}>
              Ver el reparto
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <figure className="torta" id="reparto" aria-label={`Cómo se reparte el ${porPorcion ? 'precio de una porción' : 'precio entero'}`}>
      {dibujo}
      <div className="torta-centro" aria-live="polite">
        {sel ? (
          <>
            <span className="torta-centro-etiqueta">{sel.nombre}</span>
            <strong className="torta-centro-valor">{fmtUSD(sel.v)}</strong>
            <span className="torta-centro-sub">{fmtPct(sel.frac)} del precio</span>
          </>
        ) : (
          <>
            <span className="torta-centro-etiqueta">{etiqueta}</span>
            <strong className="torta-centro-valor">{fmtUSD(p.precio)}</strong>
            <span className="torta-centro-sub bs">{enBs(p.precio, tasa)}</span>
          </>
        )}
      </div>
      <figcaption className="torta-leyenda">
        <table>
          <caption className="solo-lector">Reparto del {porPorcion ? 'precio por porción' : 'precio entero'}</caption>
          <tbody>
            {arcos.map((a) => (
              <tr
                key={a.clave}
                tabIndex={0}
                data-activa={activa === a.clave ? '' : undefined}
                onPointerEnter={() => setActiva(a.clave)}
                onPointerLeave={() => setActiva(null)}
                onFocus={() => setActiva(a.clave)}
                onBlur={() => setActiva(null)}
              >
                <th scope="row">
                  <span className="muestra" style={{ background: a.color }} aria-hidden="true" />
                  {a.nombre}
                </th>
                <td className="num">
                  {a.clave === 'ganancia' && pierde ? (
                    <span className="texto-peligro">−{fmtUSD(-p.ganancia)}</span>
                  ) : (
                    fmtUSD(a.v)
                  )}
                </td>
                <td className="num tenue">{fmtPct(a.frac)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
