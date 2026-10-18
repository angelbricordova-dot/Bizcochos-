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
