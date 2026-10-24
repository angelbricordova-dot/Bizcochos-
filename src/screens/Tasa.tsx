import { ArrowDownUp, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Campo, Numero, Pantalla } from '../components/ui'
import { fmtBs, fmtTasa, fmtUSD } from '../lib/format'
import { useApp } from '../lib/store'

const RAPIDOS = [1, 5, 10, 20, 50, 100]

function cuando(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
}

export function Tasa() {
  const { tasa, tasaAuto, tasaCargando, tasaError, actualizarTasa, fijarTasaManual } = useApp()
  const valor = tasa?.valor ?? 0
  const [dolares, setDolares] = useState(true)
  const [monto, setMonto] = useState(1)
  const [manual, setManual] = useState<number>(NaN)

  const resultado = dolares ? monto * valor : valor > 0 ? monto / valor : NaN

  return (
    <Pantalla titulo="Tasa BCV" atras="/mas">
      <div className="tasa-hoy">
        <span className="tasa-etiqueta">1 dólar =</span>
        <span className="tasa-cifra num">{valor > 0 ? `Bs. ${fmtTasa(valor)}` : 'Sin tasa'}</span>
        <span className="tenue pequeno">
          {tasa?.manual ? 'Escrita a mano' : tasa?.fuente}
          {tasa?.fecha && !tasa.manual ? ` · ${cuando(tasa.fecha)}` : ''}
        </span>
        {tasaError && (
          <p className="aviso">
            {tasaAuto && !tasa?.manual ? 'No se pudo actualizar ahora; es la última tasa que se obtuvo.' : tasaError}
          </p>
        )}
        <div className="fila-botones">
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => void actualizarTasa()} disabled={tasaCargando}>
            <RefreshCw size={16} className={tasaCargando ? 'girando' : undefined} /> {tasaCargando ? 'Buscando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="convertidor">
        <h2>Convertir</h2>
        <Campo etiqueta={dolares ? 'Dólares' : 'Bolívares'}>
          {(i) => <Numero id={i} prefijo={dolares ? '$' : 'Bs.'} valor={monto} onCambio={(v) => setMonto(Number.isNaN(v) ? 0 : v)} />}
        </Campo>
        <button type="button" className="boton boton-secundario boton-chico invertir" onClick={() => setDolares(!dolares)}>
          <ArrowDownUp size={16} /> Cambiar a {dolares ? 'bolívares → dólares' : 'dólares → bolívares'}
        </button>
        <output className={`convertidor-resultado num ${dolares ? 'bs' : ''}`} aria-live="polite">
          {valor > 0 ? (dolares ? fmtBs(resultado) : fmtUSD(resultado)) : 'Falta la tasa'}
        </output>
        {valor > 0 && (
          <table className="tabla-rapida">
            <caption className="solo-lector">Equivalencias rápidas</caption>
            <tbody>
              {RAPIDOS.map((n) => (
                <tr key={n}>
                  <th scope="row" className="num">
                    {fmtUSD(n)}
                  </th>
                  <td className="num bs">{fmtBs(n * valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bloque">
        <h2>Tasa a mano</h2>
        <p className="tenue pequeno">
          Si no hay internet o quieres usar otra tasa, escríbela aquí. Solo cambia en este dispositivo.
          {tasaAuto && ` La automática es Bs. ${fmtTasa(tasaAuto.tasa.valor)}.`}
        </p>
        <form
          className="fila-botones"
          onSubmit={(e) => {
            e.preventDefault()
            if (manual > 0) fijarTasaManual(manual)
          }}
        >
          <Numero valor={Number.isNaN(manual) ? undefined : manual} sufijo="Bs/$" placeholder={tasaAuto ? fmtTasa(tasaAuto.tasa.valor) : '0'} onCambio={setManual} />
          <button type="submit" className="boton boton-primario boton-chico" disabled={!(manual > 0)}>
            Usar
          </button>
        </form>
        {tasa?.manual && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => fijarTasaManual(null)}>
            Volver a la tasa automática
          </button>
        )}
      </div>
    </Pantalla>
  )
}
