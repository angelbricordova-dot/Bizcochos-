import { useState } from 'react'
import { useApp } from '../lib/store'

export function Entrar() {
  const { entrar, sesion, mensajeSesion, datos } = useApp()
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sesion === 'sin-configurar') {
    return (
      <main className="entrar">
        <div className="entrar-caja">
          <h1>Falta un paso en Vercel</h1>
          <p>{mensajeSesion || 'La app no está configurada todavía.'}</p>
          <ol className="pasos">
            <li>En tu proyecto de Vercel: Settings → Environment Variables, agrega APP_PASSWORD con la contraseña que quieras.</li>
            <li>En Storage, crea una base Upstash Redis y conéctala al proyecto.</li>
            <li>Vuelve a desplegar (Deployments → Redeploy).</li>
          </ol>
        </div>
      </main>
    )
  }

  return (
    <main className="entrar">
      <form
        className="entrar-caja"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!clave) return setError('Escribe la contraseña.')
          setEnviando(true)
          setError((await entrar(clave)) ?? '')
          setEnviando(false)
        }}
      >
        <svg className="entrar-torta" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="31" fill="var(--oro-claro)" />
          <circle cx="32" cy="32" r="25" fill="var(--serie-1)" />
          <path d="M32 32 L32 7 A25 25 0 0 1 56.2 25.6 Z" fill="var(--serie-6)" />
          <path d="M32 32 L56.2 25.6 A25 25 0 0 1 47.6 51.6 Z" fill="var(--serie-2)" />
          <circle cx="32" cy="32" r="12" fill="var(--fondo-elevado)" />
        </svg>
        <h1>{datos.ajustes.nombreNegocio}</h1>
        <p className="tenue">Costos, precios y cuentas de tus bizcochos.</p>
        <div className="campo" data-error={error ? '' : undefined}>
          <label htmlFor="clave">Contraseña</label>
          <input
            id="clave"
            type="password"
            autoComplete="current-password"
            value={clave}
            autoFocus
            aria-describedby={error ? 'clave-error' : undefined}
            onChange={(e) => setClave(e.target.value)}
          />
          {error && (
            <p id="clave-error" className="campo-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
