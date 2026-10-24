import { Download, ImagePlus, LogOut, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Campo, Numero, Pantalla, Segmentos } from '../components/ui'
import { hoy } from '../lib/format'
import { BANCOS, reducirImagen } from '../lib/pago'
import { useApp, type Tema } from '../lib/store'

export function Ajustes() {
  const { datos, guardarAjustes, importar, salir, tema, cambiarTema } = useApp()
  const a = datos.ajustes
  const [mensaje, setMensaje] = useState('')
  const archivo = useRef<HTMLInputElement>(null)
  const fotoQR = useRef<HTMLInputElement>(null)
  const pago = a.pago ?? {}
  const cambiarPago = (c: Partial<typeof pago>) => guardarAjustes({ pago: { ...pago, ...c } })

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
    <Pantalla titulo="Ajustes" atras="/mas">
      <div className="formulario">
        <fieldset className="bloque">
          <legend>Apariencia</legend>
          <Segmentos<Tema>
            etiqueta="Apariencia"
            valor={tema}
            onCambio={cambiarTema}
            opciones={[
              { valor: 'auto', texto: 'Automático' },
              { valor: 'claro', texto: 'Claro' },
              { valor: 'oscuro', texto: 'Oscuro' },
            ]}
          />
          <p className="tenue pequeno">Automático sigue al teléfono. Se guarda en este dispositivo.</p>
        </fieldset>

        <fieldset className="bloque">
          <legend>Tu emprendimiento</legend>
          <Campo etiqueta="Nombre">
            {(i) => (
              <input
                id={i}
                value={a.nombreNegocio}
                onChange={(e) => guardarAjustes({ nombreNegocio: e.target.value })}
                onBlur={(e) => !e.target.value.trim() && guardarAjustes({ nombreNegocio: 'Mis Bizcochos' })}
              />
            )}
          </Campo>
          <Campo etiqueta="Meta de ventas del mes" ayuda="La verás en Inicio. Déjala en 0 si no quieres meta.">
            {(i, d) => (
              <Numero id={i} describedBy={d} prefijo="$" valor={a.metaMensual ?? 0} onCambio={(v) => v >= 0 && guardarAjustes({ metaMensual: v })} />
            )}
          </Campo>
        </fieldset>

        <fieldset className="bloque">
          <legend>Datos de pago</legend>
          <p className="tenue pequeno">Salen en Cobrar y en los mensajes de WhatsApp. Se guardan en tu cuenta, no en internet abierto.</p>
          <Campo etiqueta="A nombre de">
            {(i) => <input id={i} value={pago.titular ?? ''} autoComplete="name" placeholder="Nombre y apellido" onChange={(e) => cambiarPago({ titular: e.target.value })} />}
          </Campo>
          <Campo etiqueta="Banco">
            {(i) => (
              <>
                <input id={i} list="bancos" value={pago.banco ?? ''} placeholder="0102 - Banco de Venezuela" onChange={(e) => cambiarPago({ banco: e.target.value })} />
                <datalist id="bancos">
                  {BANCOS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </>
            )}
          </Campo>
          <div className="dos-columnas">
            <Campo etiqueta="Teléfono">
              {(i) => (
                <input id={i} type="tel" inputMode="tel" value={pago.telefono ?? ''} placeholder="0424 000 0000" onChange={(e) => cambiarPago({ telefono: e.target.value })} />
              )}
            </Campo>
            <Campo etiqueta="Cédula">
              {(i) => <input id={i} value={pago.cedula ?? ''} placeholder="V12345678" onChange={(e) => cambiarPago({ cedula: e.target.value.toUpperCase() })} />}
            </Campo>
          </div>
          <div className="qr-ajuste">
            {pago.qr ? <img src={pago.qr} alt="Código QR de pago" className="qr-mini" /> : <span className="qr-mini qr-vacio" aria-hidden="true" />}
            <div className="fila-botones">
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => fotoQR.current?.click()}>
                <ImagePlus size={16} /> {pago.qr ? 'Cambiar QR' : 'Subir foto del QR'}
              </button>
              {pago.qr && (
                <button type="button" className="boton boton-peligro-suave boton-chico" onClick={() => cambiarPago({ qr: undefined })}>
                  <Trash2 size={16} /> Quitar
                </button>
              )}
            </div>
            <input
              ref={fotoQR}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  cambiarPago({ qr: await reducirImagen(f) })
                } catch {
                  setMensaje('No se pudo leer esa imagen.')
                }
              }}
            />
          </div>
        </fieldset>

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
          <legend>Para productos nuevos</legend>
          <div className="dos-columnas">
            <Campo etiqueta="Ganancia">
              {(i) => (
                <Numero id={i} sufijo="%" valor={Math.round(a.margenPorDefecto * 1000) / 10} onCambio={(v) => v >= 0 && v < 95 && guardarAjustes({ margenPorDefecto: v / 100 })} />
              )}
            </Campo>
            <Campo etiqueta="Merma">
              {(i) => (
                <Numero id={i} sufijo="%" valor={Math.round(a.mermaPorDefecto * 1000) / 10} onCambio={(v) => v >= 0 && v < 100 && guardarAjustes({ mermaPorDefecto: v / 100 })} />
              )}
            </Campo>
          </div>
          <p className="tenue pequeno">Los cambios se guardan solos.</p>
        </fieldset>

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
