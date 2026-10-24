const usd = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 })
const fino = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

export function fmtUSD(v: number): string {
  if (!Number.isFinite(v)) return '—'
  return `$${usd.format(v)}`
}

export function fmtBs(v: number): string {
  if (!Number.isFinite(v)) return '—'
  return `Bs. ${usd.format(v)}`
}

/** Dollars shown in bolívares at `tasa`, or a dash when there is no rate yet. */
export function enBs(v: number, tasa: number): string {
  return tasa > 0 ? fmtBs(v * tasa) : 'Bs. —'
}

export function fmtNum(v: number): string {
  return Number.isFinite(v) ? num.format(v) : '—'
}

export function fmtTasa(v: number): string {
  return Number.isFinite(v) && v > 0 ? fino.format(v) : '—'
}

/** Small unit costs, e.g. $0,0024, keep their significant digits. */
export function fmtUSDfino(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v >= 0.1) return fmtUSD(v)
  return `$${new Intl.NumberFormat('es-VE', { maximumSignificantDigits: 3 }).format(v)}`
}

export function fmtPct(v: number): string {
  return `${new Intl.NumberFormat('es-VE', { maximumFractionDigits: 1 }).format(v * 100)}%`
}

/** Shows a number in an input the Venezuelan way, without thousands dots. */
export function aTexto(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return ''
  return String(Math.round(v * 10000) / 10000).replace('.', ',')
}

export function hoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function mesDe(fecha: string): string {
  return fecha.slice(0, 7)
}

export function moverMes(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nombreMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function fechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function aFecha(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aFecha(fecha)
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Hoy", "Mañana", "Ayer" or "sáb, 26 oct". */
export function fechaRelativa(fecha: string): string {
  const h = hoy()
  if (fecha === h) return 'Hoy'
  if (fecha === sumarDias(h, 1)) return 'Mañana'
  if (fecha === sumarDias(h, -1)) return 'Ayer'
  return fechaCorta(fecha)
}

/** "sábado 26 de octubre". */
export function fechaLarga(fecha: string): string {
  return aFecha(fecha).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "15:30" → "3:30 p. m." */
export function hora12(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  if (!Number.isFinite(h)) return hora
  const d = new Date(2000, 0, 1, h, m || 0)
  return d.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' })
}

/** Greeting for the time of day. */
export function saludo(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** "1 entero · 3 porciones" */
export function unidadesTexto(enteros: number, porciones: number): string {
  return [
    enteros ? `${fmtNum(enteros)} ${enteros === 1 ? 'entero' : 'enteros'}` : '',
    porciones ? `${fmtNum(porciones)} ${porciones === 1 ? 'porción' : 'porciones'}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
