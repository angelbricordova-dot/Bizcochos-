import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { resumenMes } from '../../shared/calc'
import { Vacio } from '../components/ui'
import { enBs, fmtNum, fmtUSD, hoy, mesDe } from '../lib/format'
import { useApp, useTasa, vivos } from '../lib/store'
import { FilaMovimiento, SelectorMes } from './Cuentas'

export function Inicio() {
  const { datos } = useApp()
  const tasa = useTasa()
  const [mes, setMes] = useState(() => mesDe(hoy()))
  const movs = useMemo(() => vivos(datos.movimientos), [datos.movimientos])
  const r = resumenMes(movs, mes)
  const recientes = movs
    .filter((m) => m.fecha.startsWith(mes))
    .sort((a, b) => (a.fecha === b.fecha ? b.updatedAt - a.updatedAt : b.fecha.localeCompare(a.fecha)))
    .slice(0, 5)
  const sinNada = vivos(datos.insumos).length === 0 && vivos(datos.recetas).length === 0 && movs.length === 0

  return (
    <section className="pantalla inicio">
      <h1 className="solo-lector">Inicio</h1>
      <SelectorMes mes={mes} onCambio={setMes} />

      <div className="ganancia">
        <span className="ganancia-etiqueta">{r.ganancia < 0 ? 'Este mes vas perdiendo' : 'Te quedó este mes'}</span>
        <span className={`ganancia-cifra num ${r.ganancia < 0 ? 'texto-peligro' : ''}`}>{fmtUSD(r.ganancia)}</span>
        <span className="ganancia-bs num">{enBs(r.ganancia, tasa)}</span>
      </div>

      <dl className="totales totales-dos">
        <div>
          <dt>Vendiste</dt>
          <dd className="num texto-venta">{fmtUSD(r.ingresos)}</dd>
          <dd className="tenue pequeno">
            {r.ventas} {r.ventas === 1 ? 'venta' : 'ventas'}
            {r.unidades ? ` · ${fmtNum(r.unidades)} und` : ''}
          </dd>
        </div>
        <div>
          <dt>Gastaste</dt>
          <dd className="num">{fmtUSD(r.gastos)}</dd>
          <dd className="tenue pequeno">en compras y servicios</dd>
        </div>
      </dl>

      <a className="boton boton-primario boton-ancho boton-grande" href="#/cuentas/nuevo?tipo=venta">
        <Plus size={22} /> Registrar venta
      </a>

      {sinNada ? (
        <Vacio
          titulo="Empieza por tus insumos"
          accion={
            <div className="fila-botones fila-botones-columna">
              <a className="boton boton-secundario" href="#/insumos/nuevo">
                Anotar lo que compras
              </a>
              <a className="boton boton-secundario" href="#/recetas">
                Calcular un bizcocho
              </a>
            </div>
          }
        >
          Anota lo que compras con su precio, arma tus recetas y la app te dice en cuánto vender cada bizcocho. Después
          registras cada venta y aquí ves cuánto ganas.
        </Vacio>
      ) : (
        <>
          {r.porReceta.length > 0 && (
            <div className="grupo">
              <h2 className="grupo-titulo">Lo que más vendiste</h2>
              <ul className="lista lista-compacta">
                {r.porReceta.slice(0, 3).map((p) => (
                  <li key={p.recetaId} className="fila fila-quieta">
                    <span className="fila-principal">
                      <span className="fila-titulo">{datos.recetas[p.recetaId]?.nombre ?? 'Receta borrada'}</span>
                      <span className="fila-sub">{fmtNum(p.unidades)} und</span>
                    </span>
                    <span className="fila-cifra num">{fmtUSD(p.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grupo">
            <h2 className="grupo-titulo">Lo último</h2>
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
            <a className="enlace-mas" href="#/cuentas">
              Ver todas las cuentas
            </a>
          </div>
        </>
      )}
    </section>
  )
}
