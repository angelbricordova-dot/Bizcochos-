import { Download, LogOut, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Campo, Numero, Pantalla } from '../components/ui'
import { hoy } from '../lib/format'
import { useApp } from '../lib/store'

export function Ajustes() {
  const { datos, guardarAjustes, importar, salir } = useApp()
  const a = datos.ajustes
  const [mensaje, setMensaje] = useState('')
  const archivo = useRef<HTMLInputElement>(null)

  const descargar = () => {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `respaldo-bizcochos-${hoy()}.json`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Pantalla titulo="Ajustes" atras="/">
      <div className="formulario">
        <Campo etiqueta="Nombre del emprendimiento">
          {(i) => (
            <input id={i} value={a.nombreNegocio} onChange={(e) => guardarAjustes({ nombreNegocio: e.target.value })} onBlur={(e) => !e.target.value.trim() && guardarAjustes({ nombreNegocio: 'Mis Bizcochos' })} />
          )}
        </Campo>
        <fieldset className="bloque">
          <legend>Costos por hora</legend>
          <div className="dos-columnas">
            <Campo etiqueta="Horno (gas o luz)" ayuda="Lo que gastas por hora de horno encendido.">
              {(i, d) => <Numero id={i} describedBy={d} prefijo="$" valor={a.costoHornoHora} onCambio={(v) => v >= 0 && guardarAjustes({ costoHornoHora: v })} />}
            </Campo>
            <Campo etiqueta="Tu trabajo" ayuda="Lo que vale una hora de tu tiempo.">
              {(i, d) => <Numero id={i} describedBy={d} prefijo="$" valor={a.costoTrabajoHora} onCambio={(v) => v >= 0 && guardarAjustes({ costoTrabajoHora: v })} />}
            </Campo>
          </div>
        </fieldset>
        <fieldset className="bloque">
          <legend>Para recetas nuevas</legend>
          <div className="dos-columnas">
            <Campo etiqueta="Ganancia">
              {(i) => <Numero id={i} sufijo="%" valor={Math.round(a.margenPorDefecto * 1000) / 10} onCambio={(v) => v >= 0 && v < 95 && guardarAjustes({ margenPorDefecto: v / 100 })} />}
            </Campo>
            <Campo etiqueta="Merma">
              {(i) => <Numero id={i} sufijo="%" valor={Math.round(a.mermaPorDefecto * 1000) / 10} onCambio={(v) => v >= 0 && v < 100 && guardarAjustes({ mermaPorDefecto: v / 100 })} />}
            </Campo>
          </div>
        </fieldset>
        <p className="tenue pequeno">Los cambios se guardan solos.</p>

        <fieldset className="bloque">
          <legend>Respaldo</legend>
          <p className="tenue pequeno">Tus datos se guardan en la nube. Igual puedes descargar una copia de todo cuando quieras.</p>
          <div className="fila-botones">
            <button type="button" className="boton boton-secundario" onClick={descargar}>
              <Download size={18} /> Descargar copia
            </button>
            <button type="button" className="boton boton-secundario" onClick={() => archivo.current?.click()}>
              <Upload size={18} /> Restaurar copia
            </button>
          </div>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const ok = importar(JSON.parse(await f.text()))
                setMensaje(ok ? 'Copia restaurada. Se sumó a lo que ya tenías.' : 'Ese archivo no es una copia de esta app.')
              } catch {
                setMensaje('No se pudo leer el archivo.')
              }
            }}
          />
          {mensaje && (
            <p className="aviso" role="status">
              {mensaje}
            </p>
          )}
        </fieldset>

        <button type="button" className="boton boton-secundario" onClick={() => void salir()}>
          <LogOut size={18} /> Cerrar sesión en este dispositivo
        </button>
      </div>
    </Pantalla>
  )
}
