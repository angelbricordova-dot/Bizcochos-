import { ArrowLeft } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { leerNumero } from '../../shared/calc'
import { aTexto } from '../lib/format'
import { volver } from '../lib/router'

export function Pantalla({
  titulo,
  atras,
  accion,
  children,
}: {
  titulo: string
  atras?: string
  accion?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="pantalla">
      <header className="pantalla-cabeza">
        {atras && (
          <button type="button" className="boton-icono" onClick={() => volver(atras)} aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
        )}
        <h1>{titulo}</h1>
        {accion && <div className="pantalla-accion">{accion}</div>}
      </header>
      {children}
    </section>
  )
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string
  ayuda?: ReactNode
  error?: string
  children: (id: string, describedBy?: string) => ReactNode
}) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  return (
    <div className="campo" data-error={error ? '' : undefined}>
      <label htmlFor={id}>{etiqueta}</label>
      {children(id, ayuda || error ? idAyuda : undefined)}
      {(error || ayuda) && (
        <p id={idAyuda} className={error ? 'campo-error' : 'campo-ayuda'}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}

/** A text input that accepts "1.234,56" or "1234.56" and reports a number (NaN when unreadable). */
export function Numero({
  id,
  valor,
  onCambio,
  sufijo,
  prefijo,
  describedBy,
  placeholder,
  autoFocus,
}: {
  id?: string
  valor: number | undefined
  onCambio: (v: number) => void
  sufijo?: string
  prefijo?: string
  describedBy?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  const [texto, setTexto] = useState(aTexto(valor))
  // Follow outside changes (e.g. a recipe price filled from elsewhere) without fighting typing.
  useEffect(() => {
    const actual = leerNumero(texto)
    if (valor === undefined ? texto !== '' : Math.abs((actual || 0) - valor) > 1e-9) setTexto(aTexto(valor))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])
  return (
    <div className="entrada-numero">
      {prefijo && <span className="entrada-afijo">{prefijo}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        placeholder={placeholder ?? '0'}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        onChange={(e) => {
          setTexto(e.target.value)
          onCambio(e.target.value.trim() === '' ? NaN : leerNumero(e.target.value))
        }}
      />
      {sufijo && <span className="entrada-afijo">{sufijo}</span>}
    </div>
  )
}

export function Segmentos<T extends string>({
  valor,
  opciones,
  onCambio,
  etiqueta,
}: {
  valor: T
  opciones: { valor: T; texto: string }[]
  onCambio: (v: T) => void
  etiqueta: string
}) {
  return (
    <div className="segmentos" role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Vacio({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <h2>{titulo}</h2>
      <p>{children}</p>
      {accion}
    </div>
  )
}
