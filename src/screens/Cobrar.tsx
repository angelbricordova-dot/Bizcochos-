import { Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Campo, Numero, Pantalla, Vacio } from '../components/ui'
import { fmtBs, fmtUSD } from '../lib/format'
import { tieneDatosPago, textoPago } from '../lib/pago'
import { parametro } from '../lib/router'
import { useApp, useTasa } from '../lib/store'
import { compartir, copiar, enlaceWhatsApp } from '../lib/whatsapp'

function Copiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [listo, setListo] = useState(false)
  return (
    <div className="dato-pago">
      <span className="dato-pago-etiqueta">{etiqueta}</span>
      <span className="dato-pago-valor num">{valor}</span>
      <button
        type="button"
        className="boton-icono"
        aria-label={`Copiar ${etiqueta.toLowerCase()}`}
        onClick={async () => {
          // Bank apps want the bare digits.
          setListo(await copiar(etiqueta === 'Banco' ? valor : valor.replace(/[\s.-]/g, '')))
          window.setTimeout(() => setListo(false), 1600)
        }}
      >
        {listo ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  )
}

/** Shown to a client at the counter: the QR and the Pago Móvil details, with the amount in Bs. */
export function Cobrar() {
  const { datos } = useApp()
  const tasa = useTasa()
  const pago = datos.ajustes.pago
  const inicial = Number(parametro('monto'))
  const [monto, setMonto] = useState<number>(inicial > 0 ? inicial : NaN)

  if (!tieneDatosPago(pago)) {
    return (
      <Pantalla titulo="Cobrar" atras="/mas">
        <Vacio
          titulo="Pon tus datos de Pago Móvil"
          accion={
            <a className="boton boton-primario" href="#/ajustes">
              Ir a Ajustes
            </a>
          }
        >
          Escribe tu banco, teléfono y cédula, y sube la foto de tu QR. Así los muestras o los mandas con un toque.
        </Vacio>
      </Pantalla>
    )
  }

  const texto = textoPago(pago, monto > 0 ? monto : undefined, tasa)
  return (
    <Pantalla titulo="Cobrar" atras="/mas">
      <div className="cobrar-tarjeta">
        {pago.qr && <img src={pago.qr} alt="Código QR para pagar" className="qr-grande" />}
        {monto > 0 && (
          <div className="cobrar-monto">
            <span className="tenue pequeno">Monto a pagar</span>
            <strong className="num">{tasa > 0 ? fmtBs(monto * tasa) : fmtUSD(monto)}</strong>
            {tasa > 0 && <span className="tenue num">{fmtUSD(monto)} a tasa BCV</span>}
          </div>
        )}
        <div className="datos-pago">
          {pago.banco?.trim() && <Copiable etiqueta="Banco" valor={pago.banco.trim()} />}
          {pago.telefono?.trim() && <Copiable etiqueta="Teléfono" valor={pago.telefono.trim()} />}
          {pago.cedula?.trim() && <Copiable etiqueta="Cédula" valor={pago.cedula.trim()} />}
          {pago.titular?.trim() && (
            <div className="dato-pago">
              <span className="dato-pago-etiqueta">A nombre de</span>
              <span className="dato-pago-valor">{pago.titular.trim()}</span>
            </div>
          )}
        </div>
      </div>
      <Campo etiqueta="Monto en dólares (opcional)" ayuda="Lo pasamos a bolívares con la tasa BCV de hoy.">
        {(i, d) => <Numero id={i} describedBy={d} prefijo="$" valor={Number.isNaN(monto) ? undefined : monto} onCambio={setMonto} />}
      </Campo>
      <div className="fila-botones">
        <a className="boton boton-whatsapp" href={enlaceWhatsApp(texto)} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Enviar por WhatsApp
        </a>
        {'share' in navigator && (
          <button type="button" className="boton boton-secundario" onClick={() => void compartir(texto, 'Datos de pago')}>
            Compartir
          </button>
        )}
      </div>
    </Pantalla>
  )
}
